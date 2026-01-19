
import re

files = [
    "/Users/fundaakar/Library/Mobile Documents/com~apple~CloudDocs/GrundKonzept/Antigravity/AntigravityBrainCloud_CodeUpgrade/Deep research Dokumente Gemini/src/margenkalkulator/dataManager/importers/mobileImporter.ts",
    "/Users/fundaakar/Library/Mobile Documents/com~apple~CloudDocs/GrundKonzept/Antigravity/AntigravityBrainCloud_CodeUpgrade/Deep research Dokumente Gemini/src/margenkalkulator/dataManager/importers/fixedNetImporter.ts"
]

# Fix patterns like: key: parseGermanNumber(row.key),
# to: key: parseGermanNumber(row.key) ?? undefined,

fields_to_fix = [
    "fh_partner_net",
    "push_net",
    "provision_renewal_net",
    "provision_renewal_pct",
    "fh_partner_modifier",
    "push_modifier",
    "sub_basic_add_net", 
    "sub_smartphone_add_net"
]

for file_path in files:
    with open(file_path, "r", encoding="utf-8") as f:
        content = f.read()
    
    new_content = content
    for field in fields_to_fix:
        # Regex: field: parseGermanNumber(row.field)(,|})
        # Subst: field: parseGermanNumber(row.field) ?? undefined\1
        
        # Be careful if it is already fixed
        pattern = fr"{field}:\s*parseGermanNumber\(row\.{field}\)([,}}])"
        replacement = fr"{field}: parseGermanNumber(row.{field}) ?? undefined\1"
        
        new_content, count = re.subn(pattern, replacement, new_content)
        if count > 0:
            print(f"Fixed '{field}' in {file_path}: {count} times")

    with open(file_path, "w", encoding="utf-8") as f:
        f.write(new_content)

print("Done fixing importers v5.")
