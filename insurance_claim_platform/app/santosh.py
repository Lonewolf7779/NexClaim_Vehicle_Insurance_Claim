from reportlab.pdfgen import canvas
from PyPDF2 import PdfReader, PdfWriter

# -------- YOUR DATA --------
data = {
    'policy_holder_name': 'Aarav Sharma',
    'vehicle_number': 'DL01AB1234',
    'vehicle_model': 'Maruti Suzuki Swift',
    'policy_start_date': '01/01/2026',
    'policy_end_date': '01/01/2027',
    'aadhar_number': '834759102345',
    'pan_number': 'AABCS1234D',
    'driving_license_number': 'DL0120160001234',
    'rc_number': 'DL01AB123456'
}

# -------- STEP 1: CREATE OVERLAY --------
c = canvas.Canvas("overlay.pdf")

# --- PAGE 1 MAPPING (coordinates need tuning once) ---

# Name (Top section)
c.drawString(120, 650, data['policy_holder_name'])

# PAN
c.drawString(120, 600, data['pan_number'])

# Aadhaar
c.drawString(300, 600, data['aadhar_number'])

# Vehicle Number
c.drawString(120, 520, data['vehicle_number'])

# Vehicle Model
c.drawString(250, 520, data['vehicle_model'])

# Driving License
c.drawString(120, 420, data['driving_license_number'])

# RC Number
c.drawString(120, 500, data['rc_number'])

# Save overlay
c.save()

# -------- STEP 2: MERGE WITH ORIGINAL PDF --------
base_pdf = PdfReader(r"D:\Documents_NexClaim\ICIC_LOMBARD_CLAIMFORM_EMPTY.pdf")
overlay_pdf = PdfReader("overlay.pdf")

writer = PdfWriter()

for i in range(len(base_pdf.pages)):
    page = base_pdf.pages[i]
    
    # Only overlay on first page for now
    if i == 0:
        page.merge_page(overlay_pdf.pages[0])
    
    writer.add_page(page)

with open(r"D:\Documents_NexClaim\FILLED_CLAIM_FORM.pdf", "wb") as f:
    writer.write(f)

print("✅ PDF Generated Successfully!")