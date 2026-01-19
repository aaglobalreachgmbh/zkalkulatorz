
import re

file_path = "/Users/fundaakar/Library/Mobile Documents/com~apple~CloudDocs/GrundKonzept/Antigravity/AntigravityBrainCloud_CodeUpgrade/Deep research Dokumente Gemini/src/margenkalkulator/pdf/ProfessionalOfferPdf.tsx"

with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

replacements = [
    # Logic Fixes (restore && in filter)
    (r'b.appliesTo === "monthly" \? b.net < 0 \? !b.ruleId\?.includes\("fixed"\)', 'b.appliesTo === "monthly" && b.net < 0 && !b.ruleId?.includes("fixed")'),
    (r'b.appliesTo === "monthly" \? b.net < 0 \? b.ruleId\?.includes\("fixed"\)', 'b.appliesTo === "monthly" && b.net < 0 && b.ruleId?.includes("fixed")'),
    
    # Just in case 1138 is still lingering or broken
    (r'\{showDealerSummary \? dealerData \? \( \? \(\(', '{showDealerSummary && dealerData && ('),
    (r'\{showDealerSummary \? dealerData \? \(', '{showDealerSummary && dealerData && ('),
]

new_content = content
for pattern, replacement in replacements:
    try:
        if "\\" in pattern or "[" in pattern or "(" in pattern or "?" in pattern: 
             new_content, count = re.subn(pattern, replacement, new_content)
             print(f"Replaced regex '{pattern}': {count} times")
        else:
             count = new_content.count(pattern)
             new_content = new_content.replace(pattern, replacement)
             print(f"Replaced literal '{pattern}': {count} times")
    except Exception as e:
        print(f"Error replacing '{pattern}': {e}")

with open(file_path, "w", encoding="utf-8") as f:
    f.write(new_content)

print("Done.")
