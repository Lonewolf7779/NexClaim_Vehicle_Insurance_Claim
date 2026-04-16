import os
import sys

# Add the platform root so absolute imports like 'app.models...' work
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
sys.path.append(os.path.join(BASE_DIR, 'insurance_claim_platform'))

import time
import re
import pandas as pd
from datetime import datetime, timezone
from typing import Dict, List, Optional, Tuple
from app.db.session import SessionLocal
from app.models.extracted_field import ExtractedField
from app.models.extracted_document import ExtractedDocument
from app.models.document_type import DocumentType
from app.models.models import Claim

BASE_OPS_DIR = r"D:\Nexclaim_operations"
DA_SUCCESS_DIR = os.path.join(BASE_OPS_DIR, "DA_Success")
DA_ARCHIVE_DIR = os.path.join(BASE_OPS_DIR, "DA_Archive")
DA_SUCCESS_SUBDIR = os.path.join(DA_SUCCESS_DIR, "Success")

os.makedirs(DA_SUCCESS_DIR, exist_ok=True)
os.makedirs(DA_ARCHIVE_DIR, exist_ok=True)
os.makedirs(DA_SUCCESS_SUBDIR, exist_ok=True)

# Some DA bots drop output in DA_Success\Success, while others use DA_Success directly.
DA_SCAN_DIR = DA_SUCCESS_SUBDIR if os.path.isdir(DA_SUCCESS_SUBDIR) else DA_SUCCESS_DIR

SUPPORTED_EXTENSIONS = ('.xlsx', '.xls', '.csv')
CLAIM_ID_PATTERN = re.compile(r"CLAIM[_-]?(\d+)", re.IGNORECASE)

# Keep processed files in DA_Success but avoid reprocessing unchanged files every loop.
PROCESSED_FILE_SIGNATURES: Dict[str, Tuple[int, int]] = {}


def _clean_cell(value) -> str:
    if value is None:
        return ""
    if pd.isna(value):
        return ""
    text = str(value).strip()
    if text.lower() in {"nan", "none", "null"}:
        return ""
    return text


def _file_signature(file_path: str) -> Tuple[int, int]:
    stat = os.stat(file_path)
    return stat.st_mtime_ns, stat.st_size


def _is_file_stable(file_path: str, min_age_seconds: float = 1.5) -> bool:
    return (time.time() - os.path.getmtime(file_path)) >= min_age_seconds


def _extract_claim_id(file_path: str) -> Optional[int]:
    match = CLAIM_ID_PATTERN.search(file_path)
    if not match:
        return None
    return int(match.group(1))


def _read_da_file(file_path: str) -> pd.DataFrame:
    if file_path.lower().endswith('.csv'):
        try:
            return pd.read_csv(file_path, dtype=str)
        except UnicodeDecodeError:
            return pd.read_csv(file_path, dtype=str, encoding='latin-1')
    return pd.read_excel(file_path, dtype=str)


def _extract_fields_from_dataframe(df: pd.DataFrame) -> List[Tuple[str, str, float]]:
    extracted_fields: List[Tuple[str, str, float]] = []

    if df is None or df.empty:
        return extracted_fields

    normalized = {str(col).strip().lower(): col for col in df.columns}

    field_col = next((normalized[key] for key in ("field", "field_name", "field name", "name", "key") if key in normalized), None)
    value_col = next((normalized[key] for key in ("value", "field_value", "field value", "extracted_value", "result") if key in normalized), None)
    confidence_col = next((normalized[key] for key in ("confidence", "confidence_score", "confidence score", "score") if key in normalized), None)

    # Vertical shape: Field | Value | Confidence
    if field_col and value_col:
        for _, row in df.iterrows():
            field_name = _clean_cell(row.get(field_col))
            field_value = _clean_cell(row.get(value_col))
            if not field_name or not field_value:
                continue

            confidence = 0.99
            if confidence_col:
                raw_confidence = _clean_cell(row.get(confidence_col))
                if raw_confidence:
                    try:
                        confidence = float(raw_confidence)
                    except ValueError:
                        confidence = 0.99

            extracted_fields.append((field_name, field_value, confidence))

        return extracted_fields

    # Horizontal shape: columns are field names and first non-empty row has values.
    first_non_empty_row = None
    for _, row in df.iterrows():
        if any(_clean_cell(value) for value in row.values):
            first_non_empty_row = row
            break

    if first_non_empty_row is None:
        return extracted_fields

    for col in df.columns:
        field_name = _clean_cell(col)
        field_value = _clean_cell(first_non_empty_row.get(col))
        if field_name and field_value:
            extracted_fields.append((field_name, field_value, 0.99))

    return extracted_fields


def _pick_best_document(db, docs, file_path: str):
    if not docs:
        return None

    output_filename = os.path.basename(file_path).lower()

    # Best match: output filename references uploaded file stem.
    for doc in docs:
        if not doc.file_path:
            continue
        source_name = os.path.basename(str(doc.file_path)).lower()
        source_stem = os.path.splitext(source_name)[0]
        if source_name and source_name in output_filename:
            return doc
        if source_stem and source_stem in output_filename:
            return doc

    # Prefer REPAIR_ESTIMATE entries for DA extraction.
    repair_docs = [doc for doc in docs if doc.document_type == DocumentType.REPAIR_ESTIMATE]
    pool = repair_docs if repair_docs else docs

    # Prefer the most recent unprocessed document first.
    for doc in pool:
        has_fields = (
            db.query(ExtractedField.id)
            .filter(ExtractedField.document_id == doc.id)
            .first()
        )
        if not has_fields:
            return doc

    return pool[0]


def _resolve_target_document(db, claim_id: int, file_path: str):
    docs = (
        db.query(ExtractedDocument)
        .filter(ExtractedDocument.claim_id == claim_id)
        .order_by(ExtractedDocument.id.desc())
        .all()
    )

    return _pick_best_document(db, docs, file_path)


def _resolve_target_document_any_claim(db, file_path: str):
    docs = (
        db.query(ExtractedDocument)
        .order_by(ExtractedDocument.id.desc())
        .all()
    )

    return _pick_best_document(db, docs, file_path)


def _process_da_file(file_path: str) -> bool:
    claim_id = _extract_claim_id(file_path)

    try:
        df = _read_da_file(file_path)
    except Exception as exc:
        print(f"Error reading file {os.path.basename(file_path)}: {exc}")
        return False

    extracted_fields = _extract_fields_from_dataframe(df)
    if not extracted_fields:
        print(f"No extractable fields found in {os.path.basename(file_path)}")
        return False

    db = SessionLocal()
    try:
        target_doc = None
        if claim_id is not None:
            target_doc = _resolve_target_document(db, claim_id, file_path)

        # Fallback mode: support DA outputs that don't include claim id in filename.
        if not target_doc:
            if claim_id is None:
                print(f"No claim id found in {os.path.basename(file_path)}. Trying filename-based global document matching.")
            else:
                print(f"No matching document for parsed claim id {claim_id}. Trying filename-based global document matching.")
            target_doc = _resolve_target_document_any_claim(db, file_path)

        if not target_doc:
            print(f"No document row found for {os.path.basename(file_path)}; will retry on next loop")
            return False

        resolved_claim_id = target_doc.claim_id

        db.query(ExtractedField).filter(ExtractedField.document_id == target_doc.id).delete()

        for field_name, field_value, confidence in extracted_fields:
            db.add(
                ExtractedField(
                    document_id=target_doc.id,
                    field_name=field_name,
                    field_value=field_value,
                    confidence_score=confidence,
                )
            )

        target_doc.extracted_at = datetime.now(timezone.utc)
        db.commit()
        print(
            f"Saved {len(extracted_fields)} field(s) for claim {resolved_claim_id}, "
            f"document_id={target_doc.id} from {os.path.basename(file_path)}"
        )
        return True
    except Exception as db_err:
        db.rollback()
        print(f"Database error while processing {os.path.basename(file_path)}: {db_err}")
        return False
    finally:
        db.close()


def process_excel_files():
    """Scans DA success output files and persists extracted fields into the DB."""
    seen_paths = set()

    for root, _, files in os.walk(DA_SCAN_DIR):
        for filename in files:
            file_path = os.path.join(root, filename)

            if not filename.lower().endswith(SUPPORTED_EXTENSIONS):
                continue

            seen_paths.add(file_path)

            if not _is_file_stable(file_path):
                continue

            try:
                signature = _file_signature(file_path)
            except OSError as os_err:
                print(f"Unable to stat file {filename}: {os_err}")
                continue

            if PROCESSED_FILE_SIGNATURES.get(file_path) == signature:
                continue

            processed = _process_da_file(file_path)
            if processed:
                PROCESSED_FILE_SIGNATURES[file_path] = signature

    # Cleanup signatures for files that no longer exist.
    for old_path in list(PROCESSED_FILE_SIGNATURES.keys()):
        if old_path not in seen_paths:
            del PROCESSED_FILE_SIGNATURES[old_path]

if __name__ == "__main__":
    print(f"Started DA watcher on {DA_SCAN_DIR}...")
    print("Processed files will remain in DA_Success; they are no longer moved to DA_Archive by watcher.")
    while True:
        try:
            process_excel_files()
        except Exception as loop_e:
            print(f"Error in DA logic: {loop_e}")
        time.sleep(5)
