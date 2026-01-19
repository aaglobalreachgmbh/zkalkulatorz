
import re

file_path = "/Users/fundaakar/Library/Mobile Documents/com~apple~CloudDocs/GrundKonzept/Antigravity/AntigravityBrainCloud_CodeUpgrade/Deep research Dokumente Gemini/src/margenkalkulator/pdf/ProfessionalOfferPdf.tsx"

with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# Define garbage patterns to clean up
replacements = [
    # The new garbage form seen in Step 1941
    (r"&& \(&& \( \(", "&& ("),
    (r"&& \(&& \(", "&& ("), 
    
    # Original monster (just in case)
    (r"\{hasCover \? \( \? \(\(\? \( \? \(\( \(", "{hasCover && ("),
    (r"\? \( \? \(\(", "&& ("),
    
    # Logic Fixes
    (r"options.showCoverPage \? template.showCoverPage;", "options.showCoverPage && template.showCoverPage;"),
    (r"showDealerSummary \? dealerData \? 1 : 0\);", "(showDealerSummary && dealerData) ? 1 : 0);"),
    
    # Fallback cleanup
    (r" \? \( \? \( \(", " && ("),
]

new_content = content
for pattern, replacement in replacements:
    try:
        if "\\" in pattern or "[" in pattern or "(" in pattern: 
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
