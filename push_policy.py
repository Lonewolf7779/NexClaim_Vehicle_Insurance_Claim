import sys
import argparse
import json
import shutil
from xml.etree.ElementTree import Element, SubElement, tostring
from pathlib import Path

import requests

WATCH_PATH = r'C:\NexClaim_PolicyDetails'
API_URL = 'http://127.0.0.1:8000/policies/'

# Persist which profile to use next (kept outside WATCH_PATH so folder policy stays strict)
STATE_FILE = Path.home() / '.nexclaim_push_policy_state.json'

POLICY_PROFILES = [
    {
        'policy_holder_name': 'Aarav Sharma',
        'vehicle_number': 'DL01AB1234',
        'vehicle_model': 'Maruti Suzuki Swift',
        'policy_start_date': '2026-01-01T00:00:00',
        'policy_end_date': '2027-01-01T00:00:00',
        'is_active': True,
        'idv_amount': 425000.0,
        'aadhar_number': '834759102345',
        'pan_number': 'AABCS1234D',
        'driving_license_number': 'DL0120160001234',
        'rc_number': 'DL01AB123456'
    },
    {
        'policy_holder_name': 'Priya Iyer',
        'vehicle_number': 'KA05MG4321',
        'vehicle_model': 'Hyundai i20',
        'policy_start_date': '2025-07-01T00:00:00',
        'policy_end_date': '2026-07-01T00:00:00',
        'is_active': True,
        'idv_amount': 515000.0,
        'aadhar_number': '912340567890',
        'pan_number': 'BXYPI5678L',
        'driving_license_number': 'KA0520150009876',
        'rc_number': 'KA05MG654321'
    },
    {
        'policy_holder_name': 'Rohit Verma',
        'vehicle_number': 'MH12CD6789',
        'vehicle_model': 'Honda City',
        'policy_start_date': '2024-10-15T00:00:00',
        'policy_end_date': '2025-10-15T00:00:00',
        'is_active': True,
        'idv_amount': 780000.0,
        'aadhar_number': '745612309876',
        'pan_number': 'CVAPR3456Q',
        'driving_license_number': 'MH1220140012345',
        'rc_number': 'MH12CD987654'
    },
    {
        b
    }
]

XML_FIELD_ORDER = [
    ('PolicyNumber', 'policy_number'),
    ('PolicyHolderName', 'policy_holder_name'),
    ('VehicleNumber', 'vehicle_number'),
    ('VehicleModel', 'vehicle_model'),
    ('PolicyStartDate', 'policy_start_date'),
    ('PolicyEndDate', 'policy_end_date'),
    ('IsActive', 'is_active'),
    ('IdvAmount', 'idv_amount'),
    ('AadharNumber', 'aadhar_number'),
    ('PanNumber', 'pan_number'),
    ('DrivingLicenseNumber', 'driving_license_number'),
    ('RcNumber', 'rc_number'),
]


def load_next_profile_index() -> int:
    try:
        data = json.loads(STATE_FILE.read_text(encoding='utf-8'))
        value = int(data.get('next_profile_index', 0))
        return value if value >= 0 else 0
    except FileNotFoundError:
        return 0
    except Exception:
        return 0


def save_next_profile_index(next_index: int) -> None:
    try:
        payload = {'next_profile_index': int(next_index)}
        tmp_path = STATE_FILE.with_suffix(STATE_FILE.suffix + '.tmp')
        tmp_path.write_text(json.dumps(payload, indent=2), encoding='utf-8')
        tmp_path.replace(STATE_FILE)
    except Exception:
        # If state can't be persisted, we still push policies; sequencing just won't persist.
        return

def enforce_folder_policy(target_xml_name: str) -> None:
    """
    Keep WATCH_PATH clean:
    1) Only .xml files allowed
    """
    watch_dir = Path(WATCH_PATH)

    for item in watch_dir.iterdir():
        if item.is_dir():
            shutil.rmtree(item, ignore_errors=True)
            continue

        if not item.is_file():
            continue

        # Remove any non-XML file
        if item.suffix.lower() != '.xml':
            item.unlink(missing_ok=True)
            continue


def create_policy_xml(payload: dict) -> str:
    """Create XML with 12 fields from the policy payload."""
    root = Element('PolicyConfig')

    for xml_tag, payload_key in XML_FIELD_ORDER:
        value = payload[payload_key]
        if isinstance(value, bool):
            text_value = str(value).lower()
        else:
            text_value = str(value)
        SubElement(root, xml_tag).text = text_value
    
    xml_str = tostring(root, encoding='unicode')
    return '<?xml version="1.0" encoding="UTF-8"?>\n' + xml_str


def build_policy_payload(policy_number: str, profile: dict) -> dict:
    return {
        'policy_number': policy_number,
        'policy_holder_name': profile['policy_holder_name'],
        'vehicle_number': profile['vehicle_number'],
        'vehicle_model': profile['vehicle_model'],
        'policy_start_date': profile['policy_start_date'],
        'policy_end_date': profile['policy_end_date'],
        'is_active': profile['is_active'],
        'idv_amount': profile['idv_amount'],
        'aadhar_number': profile['aadhar_number'],
        'pan_number': profile['pan_number'],
        'driving_license_number': profile['driving_license_number'],
        'rc_number': profile['rc_number']
    }


def sync_policy_to_api(payload: dict) -> None:
    response = requests.post(
        API_URL,
        json=payload,
        timeout=10
    )
    response.raise_for_status()

def main():
    parser = argparse.ArgumentParser(description='Push test policy XML to watcher folder.')
    parser.add_argument('policy_number', help='Policy number (e.g., POL-999)')
    args = parser.parse_args()

    profile_index = load_next_profile_index() % len(POLICY_PROFILES)
    profile = POLICY_PROFILES[profile_index]
    payload = build_policy_payload(args.policy_number, profile)
    
    # Ensure dir exists
    Path(WATCH_PATH).mkdir(parents=True, exist_ok=True)
    
    # Generate filename with policy number
    filename = f"{args.policy_number}.xml"
    filepath = Path(WATCH_PATH) / filename

    # Clean folder before writing new XML
    enforce_folder_policy(filename)
    
    xml_content = create_policy_xml(payload)
    
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(xml_content)

    sync_policy_to_api(payload)

    # Enforce again to guarantee final state
    enforce_folder_policy(filename)

    # Advance profile only after a successful write + API sync
    save_next_profile_index((profile_index + 1) % len(POLICY_PROFILES))
    
    print(f"Created {filepath}")

if __name__ == '__main__':
    if len(sys.argv) != 2:
        print("Usage: python push_policy.py <policy_number>")
        sys.exit(1)
    main()

