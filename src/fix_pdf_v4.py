
import re

file_path = "/Users/fundaakar/Library/Mobile Documents/com~apple~CloudDocs/GrundKonzept/Antigravity/AntigravityBrainCloud_CodeUpgrade/Deep research Dokumente Gemini/src/margenkalkulator/pdf/ProfessionalOfferPdf.tsx"

with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

replacements = [
    (r"{showDealerSummary \? dealerData &&", "{showDealerSummary && dealerData &&"),
]

new_content = content
for pattern, replacement in replacements:
    try:
         new_content, count = re.subn(pattern, replacement, new_content)
         print(f"Replaced regex '{pattern}': {count} times")
    except Exception as e:
        print(f"Error replacing '{pattern}': {e}")

with open(file_path, "w", encoding="utf-8") as f:
    f.write(new_content)

print("Done.")
