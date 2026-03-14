import os
import time
import json
import logging
import shutil
from typing import Optional
from datetime import datetime

from xml.etree import ElementTree as ET
import requests
from watchdog.observers import Observer
from watchdog.events import FileSystemEventHandler

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

WATCH_PATH = r'C:\NexClaim_PolicyDetails'
API_URL = 'http://127.0.0.1:8000/policies/'

def enforce_watch_root_policy(keep_xml_path: Optional[str] = None) -> None:
    """
    Enforce root folder policy for WATCH_PATH:
    1) Only .xml files are allowed (non-xml files are deleted)
    2) At most one .xml file remains in WATCH_PATH root
    """
    if not os.path.exists(WATCH_PATH):
        return

    keep_abs = os.path.abspath(keep_xml_path) if keep_xml_path else None
    xml_files = []

    for entry in os.scandir(WATCH_PATH):
        if entry.is_dir():
            try:
                shutil.rmtree(entry.path, ignore_errors=True)
                logger.info(f'Deleted folder from watch root: {entry.path}')
            except OSError as ex:
                logger.error(f'Failed deleting folder {entry.path}: {ex}')
            continue

        if not entry.is_file():
            continue

        entry_path = os.path.abspath(entry.path)
        _, ext = os.path.splitext(entry.name)

        if ext.lower() != '.xml':
            try:
                os.remove(entry.path)
                logger.info(f'Deleted non-XML file from watch root: {entry.path}')
            except OSError as ex:
                logger.error(f'Failed deleting non-XML file {entry.path}: {ex}')
            continue

        xml_files.append(entry.path)

    if keep_abs:
        for xml_path in xml_files:
            if os.path.abspath(xml_path) != keep_abs:
                try:
                    os.remove(xml_path)
                    logger.info(f'Deleted extra XML file from watch root: {xml_path}')
                except OSError as ex:
                    logger.error(f'Failed deleting extra XML file {xml_path}: {ex}')
        return

    if len(xml_files) <= 1:
        return

    xml_files.sort(key=lambda p: os.path.getmtime(p), reverse=True)
    for stale_xml in xml_files[1:]:
        try:
            os.remove(stale_xml)
            logger.info(f'Deleted older XML file from watch root: {stale_xml}')
        except OSError as ex:
            logger.error(f'Failed deleting older XML file {stale_xml}: {ex}')

def extract_policy_fields(root: ET.Element) -> dict:
    """Extract specific 12 fields from <PolicyConfig> root, with type conversions."""
    fields = {}
    field_map = {
        'policy_number': 'PolicyNumber',
        'policy_holder_name': 'PolicyHolderName',
        'vehicle_number': 'VehicleNumber',
        'vehicle_model': 'VehicleModel',
        'policy_start_date': 'PolicyStartDate',
        'policy_end_date': 'PolicyEndDate',
        'is_active': 'IsActive',
        'idv_amount': 'IdvAmount',
        'aadhar_number': 'AadharNumber',
        'pan_number': 'PanNumber',
        'driving_license_number': 'DrivingLicenseNumber',
        'rc_number': 'RcNumber'
    }
    
    for key, tag in field_map.items():
        elem = root.find(tag)
        if elem is None or not elem.text or not elem.text.strip():
            raise ValueError(f'Missing or empty field: {tag}')
        
        value = elem.text.strip()
        if key == 'is_active':
            fields[key] = value.lower() in ('true', 'yes', '1', 't')
        elif key == 'idv_amount':
            try:
                fields[key] = float(value)
            except ValueError:
                raise ValueError(f'Invalid idv_amount: {value}')
        elif key in ('policy_start_date', 'policy_end_date'):
            # Accept YYYY-MM-DD in XML and normalize to API datetime format.
            try:
                parsed_date = datetime.strptime(value, '%Y-%m-%d')
                fields[key] = parsed_date.strftime('%Y-%m-%dT00:00:00')
            except ValueError:
                fields[key] = value
        else:
            fields[key] = value
    
    return fields

class PolicyHandler(FileSystemEventHandler):
    def on_created(self, event):
        if event.is_directory:
            return

        if not event.src_path.lower().endswith('.xml'):
            enforce_watch_root_policy()
            return

        filename = os.path.basename(event.src_path)
        print(f"WATCHER: New file detected: {event.src_path}")
        print(f"DEBUG: Found file {filename}")
        logger.info(f'New XML file detected: {event.src_path}')
        enforce_watch_root_policy(keep_xml_path=event.src_path)
        self.process_xml(event.src_path)

    def on_modified(self, event):
        if event.is_directory or not event.src_path.lower().endswith('.xml'):
            return

        # If an XML write finished after creation, process it here too.
        self.process_xml(event.src_path)

    def process_xml(self, file_path: str):
        try:
            if not os.path.exists(file_path):
                return

            # Small delay to avoid parsing partially written files.
            time.sleep(0.2)

            # Parse XML
            tree = ET.parse(file_path)
            root = tree.getroot()
            
            # Extract specific fields
            policy_data = extract_policy_fields(root)
            print(f"DEBUG: Sending policy_data: {json.dumps(policy_data, indent=2, default=str)}")

            # Send POST request
            response = requests.post(
                API_URL,
                json=policy_data,
                headers={'X-Replace-Existing-Policies': 'true'},
                timeout=10
            )
            print(f'WATCHER: API Status: {response.status_code}')
            print(f'WATCHER: API Response: {response.text}')
            print(f"DEBUG: Response from API: {response.status_code} - {response.text}")
            response.raise_for_status()

            if response.status_code in (200, 201):
                logger.info(f'Successfully processed {file_path}, status: {response.status_code}')
            else:
                raise ValueError(f'API returned non-success status {response.status_code}: {response.text}')

        except Exception as e:
            print(f"DEBUG ERROR: {str(e)}")
            logger.error(f'Error processing {file_path}: {str(e)}')

def main():
    print(f'WATCHER: Monitoring folder {WATCH_PATH}')
    if not os.path.exists(WATCH_PATH):
        logger.error(f'Watch path does not exist: {WATCH_PATH}')
        return

    enforce_watch_root_policy()

    event_handler = PolicyHandler()
    observer = Observer()
    observer.schedule(event_handler, WATCH_PATH, recursive=False)
    observer.start()

    logger.info(f'Started monitoring {WATCH_PATH}. Press Ctrl+C to stop.')
    
    try:
        while True:
            enforce_watch_root_policy()
            time.sleep(1)
    except KeyboardInterrupt:
        observer.stop()
    observer.join()

if __name__ == '__main__':
    main()

