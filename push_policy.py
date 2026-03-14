import sys
import argparse
import shutil
from xml.etree.ElementTree import Element, SubElement, tostring
from pathlib import Path

import requests

WATCH_PATH = r'C:\NexClaim_PolicyDetails'
API_URL = 'http://127.0.0.1:8000/policies/'

def enforce_folder_policy(target_xml_name: str) -> None:
    """
    Keep WATCH_PATH clean:
    1) Only .xml files allowed
    2) Only one .xml allowed, and that must be target_xml_name
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

        # Remove XML files other than the target one
        if item.name != target_xml_name:
            item.unlink(missing_ok=True)

def create_policy_xml(policy_number: str) -> str:
    """Create XML with 12 fields, policy_number overridden."""
    root = Element('PolicyConfig')
    
    # Hardcoded test values
    fields = {
        'PolicyNumber': policy_number,
        'PolicyHolderName': 'John Doe',
        'VehicleNumber': 'DL01AB1234',
        'VehicleModel': 'Toyota Innova',
        'PolicyStartDate': '2024-01-01T00:00:00',
        'PolicyEndDate': '2025-01-01T00:00:00',
        'IsActive': 'true',
        'IdvAmount': '500000.0',
        'AadharNumber': '123456789012',
        'PanNumber': 'ABCDE1234F',
        'DrivingLicenseNumber': 'DL12345678',
        'RcNumber': 'RC123456'
    }
    
    for tag, value in fields.items():
        SubElement(root, tag).text = value
    
    xml_str = tostring(root, encoding='unicode')
    return '<?xml version="1.0" encoding="UTF-8"?>\n' + xml_str


def build_policy_payload(policy_number: str) -> dict:
    return {
        'policy_number': policy_number,
        'policy_holder_name': 'John Doe',
        'vehicle_number': 'DL01AB1234',
        'vehicle_model': 'Toyota Innova',
        'policy_start_date': '2024-01-01T00:00:00',
        'policy_end_date': '2025-01-01T00:00:00',
        'is_active': True,
        'idv_amount': 500000.0,
        'aadhar_number': '123456789012',
        'pan_number': 'ABCDE1234F',
        'driving_license_number': 'DL12345678',
        'rc_number': 'RC123456'
    }


def sync_policy_to_api(policy_number: str) -> None:
    response = requests.post(
        API_URL,
        json=build_policy_payload(policy_number),
        headers={'X-Replace-Existing-Policies': 'true'},
        timeout=10
    )
    response.raise_for_status()

def main():
    parser = argparse.ArgumentParser(description='Push test policy XML to watcher folder.')
    parser.add_argument('policy_number', help='Policy number (e.g., POL-999)')
    args = parser.parse_args()
    
    # Ensure dir exists
    Path(WATCH_PATH).mkdir(parents=True, exist_ok=True)
    
    # Generate filename with policy number
    filename = f"{args.policy_number}.xml"
    filepath = Path(WATCH_PATH) / filename

    # Clean folder before writing new XML
    enforce_folder_policy(filename)
    
    xml_content = create_policy_xml(args.policy_number)
    
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(xml_content)

    sync_policy_to_api(args.policy_number)

    # Enforce again to guarantee final state
    enforce_folder_policy(filename)
    
    print(f"Created {filepath}")

if __name__ == '__main__':
    if len(sys.argv) != 2:
        print("Usage: python push_policy.py <policy_number>")
        sys.exit(1)
    main()

