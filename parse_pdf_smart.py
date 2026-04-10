import re
import json

def fix_line(line):
    # Split the line by spaces, but keep English phrases together if possible?
    # Simply reversing the words split by space fixes the logical order of Hebrew.
    words = line.split(' ')
    # remove empty strings
    words = [w for w in words if w]
    return ' '.join(reversed(words))

def parse_text(filename):
    with open(filename, 'r', encoding='utf-8') as f:
        lines = f.readlines()
        
    questions = []
    current_q = None
    
    for line in lines:
        line = line.strip()
        if not line:
            continue
            
        # skip header/footer lines
        if 'מבחן קוד' in line or 'עמוד' in line or '---' in line or 'הנחיות' in line or '================' in line:
            continue
            
        # check for question: 'X מספר שאלה'
        if 'מספר שאלה' in line:
            if current_q:
                questions.append(current_q)
            current_q = {
                'id': len(questions) + 1,
                'question': '',
                'options': []
            }
            # Add the text part if any? It's just "2 מספר שאלה"
            continue
            
        if current_q:
            # Check if option line.
            # Format usually: '[text] [num]' like 'נכונה תשובה אין1' or 'ב1'
            # Let's match a line ending with a digit:
            match = re.search(r'^(.*?)\s*(\d)$', line)
            if match and len(current_q['options']) < 6 and current_q['question']:
                opt_text = match.group(1).strip()
                opt_num = match.group(2).strip()
                # fix the option text
                fixed_opt = fix_line(opt_text)
                # optionally remove leading/trailing '.' if it's there
                fixed_opt = re.sub(r'^\.', '', fixed_opt).strip()
                current_q['options'].append(fixed_opt)
            elif re.search(r'^([A-Z]) \.(.*?)$', line) or re.search(r'^(.*?)\s*\.([A-Z])$', line):
                 # sometimes options look like 'M .1' -> M .1 -> maybe matched by \d
                 pass # handled by regex above or below
            else:
                # Might be 'M .1' where digit is 1. Match:
                # Actually, some options are 'M .1'.
                # In pypdf: M .1 is 'M .1'
                match2 = re.search(r'^(.*?)\.([1-6])$', line)
                if match2 and len(current_q['options']) < 6:
                    fixed_opt = fix_line(match2.group(1).strip())
                    current_q['options'].append(fixed_opt)
                    continue
                    
                match3 = re.search(r'^([1-6])\.(.*)$', line[::-1]) # if digit is at beginning conceptually
                
                # Let's just catch ending with digit
                match4 = re.search(r'^(.*?)(\d)$', line)
                if match4 and len(current_q['options']) < 6 and current_q['question']:
                     fixed_opt = fix_line(match4.group(1).strip())
                     current_q['options'].append(fixed_opt)
                     continue

                # Not an option, add to question
                fixed_q = fix_line(line)
                if current_q['question']:
                    current_q['question'] += '\n' + fixed_q
                else:
                    current_q['question'] = fixed_q
                    
    if current_q:
        questions.append(current_q)
        
    return questions

if __name__ == "__main__":
    qs = parse_text("extracted_text.txt")
    print(json.dumps(qs[:3], ensure_ascii=False, indent=2))
    with open("questions.json", "w", encoding='utf-8') as f:
        json.dump(qs, f, ensure_ascii=False, indent=2)
