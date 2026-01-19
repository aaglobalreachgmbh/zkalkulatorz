
import re

files = [
    "/Users/fundaakar/Library/Mobile Documents/com~apple~CloudDocs/GrundKonzept/Antigravity/AntigravityBrainCloud_CodeUpgrade/Deep research Dokumente Gemini/src/margenkalkulator/dataManager/importers/fixedNetImporter.ts",
    "/Users/fundaakar/Library/Mobile Documents/com~apple~CloudDocs/GrundKonzept/Antigravity/AntigravityBrainCloud_CodeUpgrade/Deep research Dokumente Gemini/src/margenkalkulator/dataManager/importers/mobileImporter.ts"
]

# Field mappings based on variable names usually being camelCase of field
# or exact match
replacements = [
    (r"speed: speed,", "speed: speed ?? undefined,"),
    (r"fh_partner_net: fhPartnerNet,", "fh_partner_net: fhPartnerNet ?? undefined,"),
    (r"provision_renewal_net: provisionRenewalNet,", "provision_renewal_net: provisionRenewalNet ?? undefined,"),
    (r"provision_renewal_pct: provisionRenewalPct,", "provision_renewal_pct: provisionRenewalPct ?? undefined,"),
    (r"sub_basic_add_net: subBasicAddNet,", "sub_basic_add_net: subBasicAddNet ?? undefined,"),
    (r"sub_smartphone_add_net: subSmartphoneAddNet,", "sub_smartphone_add_net: subSmartphoneAddNet ?? undefined,"),
    (r"push_net: pushNet,", "push_net: pushNet ?? undefined,"),
]

for file_path in files:
    with open(file_path, "r", encoding="utf-8") as f:
        content = f.read()
    
    new_content = content
    for pattern, replacement in replacements:
        new_content, count = re.subn(pattern, replacement, new_content)
        if count > 0:
            print(f"Fixed '{pattern}' in {file_path}: {count} times")
            
    with open(file_path, "w", encoding="utf-8") as f:
        f.write(new_content)

print("Done fixing importers v3.")
