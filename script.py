import os
import glob
import re

files = glob.glob('src/**/*.tsx', recursive=True)
count = 0

for file in files:
    with open(file, 'r', encoding='utf-8') as f:
        content = f.read()

    if 'ر.س' in content:
        has_store = 'useGlobalStore' in content
        if has_store:
            # Inject currency if missing
            def replacer(match):
                inner = match.group(1)
                if 'currency' not in inner:
                    return f'const {{ currency, {inner} }} = useGlobalStore()'
                return match.group(0)
            
            content = re.sub(r'const\s*{\s*([^}]+)\s*}\s*=\s*useGlobalStore\(\)', replacer, content)

            # Replacements
            content = content.replace(' ر.س', ' {currency}')
            content = content.replace('>ر.س<', '>{currency}<')
            content = content.replace('ر.س<', '{currency}<')
            content = content.replace('>ر.س', '>{currency}')
            
            # Template literals
            content = re.sub(r'\} ر\.س', r'} ${currency}', content)
            content = content.replace('\"ر.س\"', 'currency')
            
            # specific fix for "3,500 ر.س" in quotes
            content = re.sub(r'\"([0-9,]+) ر\.س\"', r'`\1 ${currency}`', content)

            # deduplicate
            content = content.replace('{currency} {currency}', '{currency}')
            content = content.replace('${currency} {currency}', '${currency}')

        with open(file, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f'Processed {file}')
        count += 1

print(f'Done processing {count} files.')
