import re
import json

def reverse_visual(text):
    # simplest visual reversing: split by lines, reverse chars but keep numbers/english
    # Actually bidi algorithm get_display can do visual -> logical if we treat visual as logical RTL
    # Given we might not have it, let's write a simple reversing function
    # taking into account English words.
    
    # Python bidi:
    try:
        from bidi.algorithm import get_display
        return get_display(text)
    except:
        return text[::-1]

def parse_text(filename):
    with open(filename, 'r', encoding='utf-8') as f:
        lines = f.readlines()
        
    questions = []
    current_q = None
    
    for line in lines:
        line = line.strip()
        if not line:
            continue
        
        # 'X מספר שאלה' reversing -> 'שאלה מספר X' -> 'X מספר שאלה'
        if 'מספר שאלה' in line or 'מספר שאלה ' in line[::-1]:
            if current_q:
                questions.append(current_q)
            current_q = {
                'id': len(questions) + 1,
                'question': '',
                'options': []
            }
            continue
            
        if current_q:
            # Check if line is an option: Number at start or end
            match = re.search(r'^(.+)\s*(\d+)$', line)
            
            # Since it is visual RTL, the number of the option is at the end of the text.
            if match and len(current_q['options']) < 6:
                opt_text = match.group(1).strip()
                opt_num = match.group(2).strip()
                # reverse the text back to logical
                # simple logical:
                def rev(s):
                    # split by mixed english/numbers
                    tokens = re.split(r'([A-Za-z0-9\-+\.\*]+)', s)
                    res = []
                    for t in reversed(tokens):
                        if re.match(r'^[A-Za-z0-9\-+\.\*]+$', t):
                            res.append(t)
                        else:
                            res.append(t[::-1])
                    return "".join(res)
                
                current_q['options'].append(rev(opt_text))
            else:
                # Add to question description
                def rev(s):
                    tokens = re.split(r'([A-Za-z0-9\-+\.\*\>]+)', s)
                    res = []
                    for t in reversed(tokens):
                        if re.match(r'^[A-Za-z0-9\-+\.\*\>]+$', t):
                            res.append(t)
                        else:
                            res.append(t[::-1])
                    return "".join(res)
                if current_q['question']:
                    current_q['question'] += '\n' + rev(line)
                else:
                    current_q['question'] = rev(line)
                    
    if current_q:
        questions.append(current_q)
        
    return questions

if __name__ == "__main__":
    qs = parse_text("extracted_text.txt")
    print(json.dumps(qs[:2], ensure_ascii=False, indent=2))
    with open("questions.json", "w", encoding='utf-8') as f:
        json.dump(qs, f, ensure_ascii=False, indent=2)
