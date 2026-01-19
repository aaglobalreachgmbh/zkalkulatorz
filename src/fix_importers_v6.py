
import re

files = [
    "/Users/fundaakar/Library/Mobile Documents/com~apple~CloudDocs/GrundKonzept/Antigravity/AntigravityBrainCloud_CodeUpgrade/Deep research Dokumente Gemini/src/margenkalkulator/dataManager/importers/mobileImporter.ts",
    "/Users/fundaakar/Library/Mobile Documents/com~apple~CloudDocs/GrundKonzept/Antigravity/AntigravityBrainCloud_CodeUpgrade/Deep research Dokumente Gemini/src/margenkalkulator/dataManager/importers/fixedNetImporter.ts"
]

fields_to_fix = [
    "fixed_ip_addon_net",
    "optional_expert_install_net",
    "provision_renewal_net",
    "provision_renewal_pct",
    "fh_partner_modifier",
    "push_modifier",
    "sub_basic_add_net",
    "sub_smartphone_add_net", 
    "sub_premium_add_net",
    "sub_special_premium_add_net",
    "fh_partner_net",
    "push_net"
]

for file_path in files:
    with open(file_path, "r", encoding="utf-8") as f:
        content = f.read()
    
    new_content = content
    for field in fields_to_fix:
        # Regex: field: parseGermanNumber(...)(,|})
        # Capture the whole function call including parens
        # Be careful not to double add ?? undefined
        
        pattern = fr"({field}:\s*parseGermanNumber\([^)]+\))([,}}])"
        # Lookahead or check to ensure not already having ??
        
        # We can just check if ?? undefined is already there?
        # But regex is simpler. 
        # Note: parseGermanNumber matching parentheses is tricky with simple regex if nested (unlikely here).
        # We assume 1 level of parens. `parseGermanNumber(...)`
        
        def replace(match):
            full_match = match.group(0)
            if "??" in full_match:
                return full_match # Already fixed or has default
            return f"{match.group(1)} ?? undefined{match.group(2)}"
            
        new_content, count = re.subn(pattern, replace, new_content)
        if count > 0:
            print(f"Fixed '{field}' in {file_path}: {count} times")

    with open(file_path, "w", encoding="utf-8") as f:
        f.write(new_content)

print("Done fixing importers v6.")
