
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
    "push_modifier"
]

for file_path in files:
    with open(file_path, "r", encoding="utf-8") as f:
        content = f.read()
    
    new_content = content
    for field in fields_to_fix:
        # Regex for shorthand: "  field," -> "  field: field ?? undefined,"
        # Or " field," with valid boundaries
        
        pattern = fr"(\s){field}(,)"
        replacement = fr"\1{field}: {field} ?? undefined\2"
        
        new_content, count = re.subn(pattern, replacement, new_content)
        if count > 0:
            print(f"Fixed shorthand '{field}' in {file_path}: {count} times")
            
    with open(file_path, "w", encoding="utf-8") as f:
        f.write(new_content)

print("Done fixing importers v4.")
