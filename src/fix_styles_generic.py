
import re

files = [
    "/Users/fundaakar/Library/Mobile Documents/com~apple~CloudDocs/GrundKonzept/Antigravity/AntigravityBrainCloud_CodeUpgrade/Deep research Dokumente Gemini/src/margenkalkulator/pdf/components/shared/FeatureList.tsx",
    "/Users/fundaakar/Library/Mobile Documents/com~apple~CloudDocs/GrundKonzept/Antigravity/AntigravityBrainCloud_CodeUpgrade/Deep research Dokumente Gemini/src/margenkalkulator/pdf/components/PremiumSummaryPage.tsx"
]

for file_path in files:
    try:
        with open(file_path, "r", encoding="utf-8") as f:
            content = f.read()

        # Regex: && styles\.(\w+)
        # Subst: ? styles.\1 : {}
        new_content, count = re.subn(r'&& styles\.(\w+)', r'? styles.\1 : {}', content)
        
        # Regex: && { (inline styles)
        # Subst: ? { ... } : {}
        # This is harder. Only do if simple mapping exist.
        # Let's focus on styles.prop first.

        if count > 0:
            with open(file_path, "w", encoding="utf-8") as f:
                f.write(new_content)
            print(f"Processed {file_path}: {count} replacements")
        else:
            print(f"No matches in {file_path}")
            
    except Exception as e:
        print(f"Error checking {file_path}: {e}")

print("Done.")
