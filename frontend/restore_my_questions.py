import json

log_path = "/Users/amilali/.gemini/antigravity-ide/brain/10be8e7b-5ac5-4961-a753-ee4c4a6845e2/.system_generated/logs/transcript.jsonl"
diffs = []

with open(log_path, 'r') as f:
    for line in f:
        try:
            entry = json.loads(line)
            if entry.get('type') == 'CODE_ACTION' and "MyQuestions.tsx" in entry.get('content', ''):
                content = entry['content']
                if '[diff_block_start]' in content:
                    diff_block = content.split('[diff_block_start]')[1].split('[diff_block_end]')[0].strip()
                    diffs.append(diff_block)
        except:
            pass

print(f"Found {len(diffs)} diff blocks.")
with open("recovered_diffs.diff", "w") as f:
    for diff in diffs:
        f.write(diff + "\n")
