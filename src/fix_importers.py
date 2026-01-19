
import re

files = [
    "/Users/fundaakar/Library/Mobile Documents/com~apple~CloudDocs/GrundKonzept/Antigravity/AntigravityBrainCloud_CodeUpgrade/Deep research Dokumente Gemini/src/margenkalkulator/dataManager/importers/fixedNetImporter.ts",
    "/Users/fundaakar/Library/Mobile Documents/com~apple~CloudDocs/GrundKonzept/Antigravity/AntigravityBrainCloud_CodeUpgrade/Deep research Dokumente Gemini/src/margenkalkulator/dataManager/importers/mobileImporter.ts"
]

fields_to_fix = [
    "speed",
    "speed_label",
    "variant",
    "productLine",
    "sub_basic_add_net",
    "sub_smartphone_add_net",
    "push_net",
    "fh_partner_net",
    "provision_renewal_net",
    "provision_renewal_pct",
    "fh_partner_modifier",
    "push_modifier",
    "notes"
]

for file_path in files:
    with open(file_path, "r", encoding="utf-8") as f:
        content = f.read()
    
    new_content = content
    for field in fields_to_fix:
        # Replace "field: row.field" with "field: row.field ?? undefined"
        # Be careful not to replace it if it's already fixed
        pattern = f"{field}: row.{field}"
        replacement = f"{field}: row.{field} ?? undefined"
        
        if pattern in new_content and replacement not in new_content:
            new_content = new_content.replace(pattern, replacement)
            print(f"Fixed {field} in {file_path}")
            
    with open(file_path, "w", encoding="utf-8") as f:
        f.write(new_content)

print("Done fixing importers.")
