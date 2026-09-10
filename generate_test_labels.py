from PIL import Image, ImageDraw, ImageFont
import os

os.makedirs("test_labels", exist_ok=True)

def create_label(filename, bg_color, texts):
    # Create an image with a solid background
    img = Image.new('RGB', (800, 600), color=bg_color)
    d = ImageDraw.Draw(img)
    
    # We will use the default font, but scaled up a bit by drawing it multiple times or just relying on it
    # Since we can't guarantee custom fonts are installed, we'll draw default text
    y = 50
    for text in texts:
        d.text((50, y), text, fill=(0, 0, 0))
        # Draw a bit thicker to simulate larger text with default font
        d.text((51, y), text, fill=(0, 0, 0))
        d.text((50, y+1), text, fill=(0, 0, 0))
        d.text((51, y+1), text, fill=(0, 0, 0))
        y += 80

    img.save(os.path.join("test_labels", filename))

# Label 1: Fully Compliant
create_label(
    "compliant_snack.jpg", 
    (240, 255, 240), # light green
    [
        "Product: Yummy Potato Chips",
        "M.R.P. Rs. 50.00 (Incl. of all taxes)",
        "Net Weight: 150g",
        "MFG DATE: 12/2023",
        "Manufactured by: Snacks Pvt Ltd, Mumbai 400001",
        "Consumer Care: 1800-123-4567, care@snacks.com"
    ]
)

# Label 2: Non-Compliant (Missing MRP inclusive clause, weird date)
create_label(
    "non_compliant_soap.jpg", 
    (255, 240, 240), # light red
    [
        "Product: Fresh Glow Soap",
        "Price: 45",
        "Net Vol: 75g",
        "Date: 23",
        "Made in India by SoapCo",
        "Call us: 99999"
    ]
)

# Label 3: Partial Compliance (Missing consumer care email/number, address incomplete)
create_label(
    "partial_compliance_oil.jpg", 
    (255, 255, 220), # light yellow
    [
        "Product: Pure Mustard Oil",
        "MRP: Rs. 180 (Inclusive of all taxes)",
        "Net Qty: 1 Litre",
        "Date of Packaging: Jan 2024",
        "Mfg by: Oil Mills, Gujarat",
        "Feedback: Send us a letter"
    ]
)

print("Generated 3 test labels in the 'test_labels' directory.")
