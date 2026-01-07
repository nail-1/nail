import re
import json
import os

questions = []
current_q = None

def finalize_question(q):
    if q and 'option_lines' in q and len(q['option_lines']) > 0:
        # Clean up question text

        q['question'] = '\n'.join(q['question_lines']).strip()
        # Clean up options (simple split if possible, or just raw text)
        # For now, let's keep options as a raw string if parsing fails, or try to split
        # Our app expects an array of 4 options.
        # Regex to split options a, b, c, d
        raw_opt = ' '.join(q['option_lines'])
        
        # Try to find a., b., c., d.
        # This is hard to perfect automatically, so we'll do best effort
        # If we can't split, we put the whole string in option A and let the user click it?
        # Better: Try to split by " a. ", " b. ", " c. ", " d. " (case insensitive)
        
        # A simple approach: just store the raw option text for display, 
        # but our app structure expects distinct buttons.
        # Let's try to make 4 buttons.
        
        opts = []
        # specific regex for "a. ... b. ... c. ... d. ..."
        # Note: input might be "a. English b. English ... \n a. Chinese b. Chinese ..."
        # We will combine them.
        
        q['raw_options'] = raw_opt
        q.pop('question_lines')
        q.pop('option_lines')
        questions.append(q)

def process_file(filepath):
    global current_q
    with open(filepath, 'r', encoding='utf-8') as f:
        lines = f.readlines()
        
    for line in lines:
        line = line.strip()
        if not line:
            continue
            
        # Check for Question Start "1. ", "41. "
        # Check for Question Start "1. ", "41. ", "T. " (OCR error for 7), "S. " (5)
        # We replace T. with 7. and S. with 5. if mostly digits
        
        # Pre-process line for common OCR numbering errors at start
        if line.startswith('T. '):
            line = '7. ' + line[3:]
        if line.startswith('S. '): # Sometimes S is 5
             line = '5. ' + line[3:]
             
        match = re.search(r'^(\d+)\.\s+(.*)', line)
        if match:
            if current_q:
                finalize_question(current_q)
            current_q = {
                'id': int(match.group(1)),
                'question_lines': [match.group(2)],
                'option_lines': [],
                'answer': None,
                'image': None # We might link back to original image if needed, but we are doing text only
            }
            continue
            
        # Check for Options start "a. " or "a "
        # We assume options start if line starts with a. or A.
        if re.match(r'^[aA][\.\s]', line):
            if current_q:
                current_q['option_lines'].append(line)
            continue
            
        # Check for Answer (Single Capital Letter or "Answer: B")
        if re.match(r'^[A-D]$', line):
            if current_q:
                current_q['answer'] = line
            continue
            
        # Otherwise, append to current context
        if current_q:
            # If we already have options, this line probably belongs to options (e.g. Chinese options on next line)
            if current_q['option_lines']:
                current_q['option_lines'].append(line)
            else:
                current_q['question_lines'].append(line)

# Process all files 1..26
# Sorting is important to keep order
file_indices = sorted(range(1, 27))
for i in file_indices:
    path = f"web_app/images/q{i}.txt"
    if os.path.exists(path):
        process_file(path)

# Finalize last
if current_q:
    finalize_question(current_q)

# Post-processing for options
# We will just put the full option text into option A/B/C/D if parsing allows, 
# otherwise we might have to put it all in one block? 
# To fit the current UI (4 buttons), we really want to split checks.
# But regex splitting is fragile. 
# Alternative: Render options as a single text block in the UI and have A/B/C/D buttons below as selectors.
# This solves the parsing problem. The user sees "a. ... b. ... c. ... d. ..." in the text area, and clicks "B".
# This is physically safer.

formatted_questions = []
for q in questions:
    formatted_questions.append({
        'id': q['id'],
        'text': q['question'] + "\n\n" + q['raw_options'],
        'answer': q['answer'],
        # We won't use 'options' array for button labels, buttons will just be A,B,C,D
    })

# Write to data.js
js_content = f"const questions = {json.dumps(formatted_questions, ensure_ascii=False, indent=2)};"
with open('web_app/data.js', 'w', encoding='utf-8') as f:
    f.write(js_content)

print(f"Processed {len(questions)} questions.")
