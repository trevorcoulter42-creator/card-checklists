#!/usr/bin/env python3
"""Parse a Topps official checklist PDF (pdftotext -layout text) into sections of cards.
usage: parse.py <file.txt>  -> JSON on stdout: [{"title":..., "cards":[{"n","p","t"}]}]
Topps PDFs: CATEGORY line (BASE / INSERT / AUTOGRAPH / AUTOGRAPH RELIC ...) then SECTION line, then rows
"  <number>  <Player>   <Team>" separated by 2+ spaces (base rows sometimes use one space after the number).
"""
import re, sys, json

CATEGORIES = {'BASE', 'INSERT', 'INSERTS', 'AUTOGRAPH', 'AUTOGRAPHS', 'AUTOGRAPH RELIC', 'AUTOGRAPH RELICS', 'RELIC', 'RELICS',
              'VARIATION', 'VARIATIONS', 'MEMORABILIA', 'AUTOGRAPHED RELIC', 'AUTO RELIC', 'PATCH', 'PATCHES', 'BOX TOPPER', 'BOX TOPPERS',
              'SHORT PRINT', 'SHORT PRINTS', 'SSP', 'SP', 'MANUFACTURED', 'BOOK', 'BOOKLET', 'BOOKLETS', 'CUT SIGNATURE', 'CUT SIGNATURES'}
SMALL = {'of', 'the', 'and', 'a', 'an', 'in', 'on', 'at', 'to', 'for', 'by', 'vs', 'de'}

def title_case(s):
    words = s.lower().split()
    out = []
    for i, w in enumerate(words):
        if i and w in SMALL: out.append(w)
        elif re.fullmatch(r"[ivx]+", w) and len(w) <= 4: out.append(w.upper())
        else: out.append('-'.join(p[:1].upper() + p[1:] for p in w.split('-')))
    t = ' '.join(out)
    return 'Base' if t in ('Base Cards', 'Base Card', 'Base Set') else t

HEAD = re.compile(r"^[A-Z0-9][A-Z0-9 &'’.:/()!\-+#]{2,}$")
ROW = re.compile(r"^\s*([A-Za-z0-9]+(?:[-.][A-Za-z0-9]+)*)\s+(\S.*?)(?:\s{2,}(\S.*?))?\s*$")

def parse(text):
    sections, cur = [], None
    lines = text.split('\n')
    for i, raw in enumerate(lines):
        line = raw.rstrip()
        s = line.strip()
        if not s or s.startswith('\f'): s = s.lstrip('\f')
        if not s: continue
        # heading: all-caps line without a 2+ space gap (rows always have a gap or a leading number + name)
        if HEAD.fullmatch(s) and not re.search(r"\s{2,}", s) and re.search(r"[A-Z]{2}", s):
            if s in CATEGORIES: cur = None; continue
            cur = {'title': title_case(s), 'cards': []}
            sections.append(cur); continue
        m = ROW.match(line)
        if m and cur is not None:
            n, p, t = m.group(1), m.group(2).strip(), (m.group(3) or '').strip()
            # card numbers: digits ("12", "TP-8") or an all-caps code ("RPH-AB", "CD-RB"); skip prose lines
            if not re.search(r"\d", n) and not re.fullmatch(r"[A-Z0-9]{1,8}(?:[-.][A-Za-z0-9]{1,8})*", n): continue
            c = {'n': n, 'p': p}
            if t: c['t'] = t
            cur['cards'].append(c)
    return [s for s in sections if s['cards']]

if __name__ == '__main__':
    print(json.dumps(parse(open(sys.argv[1], encoding='utf-8', errors='replace').read()), ensure_ascii=False))
