
import re

file_path = "/Users/fundaakar/Library/Mobile Documents/com~apple~CloudDocs/GrundKonzept/Antigravity/AntigravityBrainCloud_CodeUpgrade/Deep research Dokumente Gemini/src/margenkalkulator/pdf/components/shared/PriceTablePeriod.tsx"

with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# Replace "&& styles.foo" with "? styles.foo : {}"
# We match "&& styles." followed by word chars
# We preserve the trailing context check implicitly (we just insert : {})
# Note: This changes "cond && styles.foo" to "cond ? styles.foo : {}"

# Regex: && styles\.(\w+)
# Subst: ? styles.\1 : {}

new_content = re.sub(r'&& styles\.(\w+)', r'? styles.\1 : {}', content)

with open(file_path, "w", encoding="utf-8") as f:
    f.write(new_content)

print(f"Processed {file_path}")
