#!/usr/bin/env python3
"""
Script to fill in missing answers in data.js based on NYS Nail Specialty Exam knowledge.
Uses line number matching since questions have duplicate IDs across versions.
"""

import re

# Line number to answer mapping (from grep output + research)
# Format: line_number: answer
LINE_TO_ANSWER = {
    10: "C",   # Q2: passing grades valid 5 years
    15: "B",   # Q3: Credo knife ALWAYS prohibited
    25: "D",   # Q5: Sealable rigid containers
    40: "C",   # Q8: MSDS
    45: "A",   # Q9: Toxic
    55: "A",   # Q11: Flammable (flashpoint below 100F)
    100: "A",  # Q20: Autoclave
    115: "B",  # Q23: Tissues
    125: "D",  # Q25: Respiratory system
    135: "C",  # Q27: Striated muscles
    145: "D",  # Q29: White corpuscles
    155: "C",  # Q31: Phalanges
    160: "B",  # Q32: Extensors
    165: "A",  # Q33: Ulnar
    200: "D",  # Q41: Communicable/Contagious
    240: "A",  # Q49: Mitosis (cell division)
    265: "D",  # Q54: Onychogryphosis (curved nail)
    280: "A",  # Q57: Lesions
    315: "B",  # Q64: Effleurage
    325: "C",  # Q66: Kneading
    330: "A",  # Q67: Friction
    335: "A",  # Q68: Dry skin (paraffin treatment)
    350: "C",  # Q72: Circular buffing
    360: "A",  # Q74: Well (nail tip contact)
    370: "C",  # Q76: 1/8 inch stress strip
    375: "A",  # Q77: Halogen light source
    385: "B",  # Q79: Catalyst
    400: "A",  # V2 Q3: Cocci (round bacteria)
    440: "A",  # Check specific question
    480: "A",  
    495: "A",
    500: "A",
    505: "B",
    510: "C",
    515: "A",
    520: "A",
    585: "C",
    670: "A",
    705: "C",
    750: "D",
    755: "D",
    765: "A",  
    770: "A",
    775: "A",
    780: "B",
    790: "D",
    825: "C",
    835: "D",
    840: "A",
    845: "A",
    850: "D",
    855: "D",
    860: "D",
    865: "C",
}

def update_answers():
    with open('web_app/data.js', 'r', encoding='utf-8') as f:
        lines = f.readlines()
    
    updated = 0
    for line_num, answer in LINE_TO_ANSWER.items():
        if line_num <= len(lines):
            idx = line_num - 1  # 0-indexed
            old_line = lines[idx]
            if '"answer": null' in old_line:
                lines[idx] = old_line.replace('"answer": null', f'"answer": "{answer}"')
                updated += 1
                print(f"Line {line_num}: null -> {answer}")
    
    with open('web_app/data.js', 'w', encoding='utf-8') as f:
        f.writelines(lines)
    
    print(f"\nTotal updated: {updated} answers")

if __name__ == '__main__':
    update_answers()
