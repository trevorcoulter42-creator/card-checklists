#!/bin/bash
# usage: batch.sh <topps-batch-NNN.json>   (from the browser: [{slug,url,ext,b64}])
# Writes PDFs, parses them, dry-runs the merge, then merges for real + cleanup + build-index + push.
set -e
B="$1"; H=/home/claude/handoff/topps; W=$H/work/$(basename "$B" .json); R=/home/claude/card-checklists
mkdir -p "$W"
python3 - "$B" "$W" <<'EOF'
import json,sys,base64,subprocess,os
sys.path.insert(0,'/home/claude/handoff/topps'); import parse
items=json.load(open(sys.argv[1])); out=[]
for it in items:
    if it['ext']!='pdf': print('skip (not pdf)',it['slug']); continue
    p=os.path.join(sys.argv[2],it['slug']+'.pdf'); open(p,'wb').write(base64.b64decode(it['b64']))
    t=p[:-4]+'.txt'; subprocess.run(['pdftotext','-layout',p,t],check=False)
    if not os.path.exists(t): print('no text',it['slug']); continue
    secs=parse.parse(open(t,encoding='utf-8',errors='replace').read())
    if not secs: print('no cards parsed',it['slug']); continue
    out.append({'slug':it['slug'],'url':it['url'],'sections':secs})
json.dump(out,open(os.path.join(sys.argv[2],'pairs.json'),'w'))
print('parsed',len(out),'of',len(items))
EOF
cd $R && git pull -q --rebase
node $H/merge.mjs $W/pairs.json --write | tail -60
node scripts/cleanup-names.mjs >/dev/null 2>&1 || true
node scripts/add-superfractors.mjs >/dev/null 2>&1 || true
node scripts/classify-memorabilia.mjs >/dev/null 2>&1 || true
node scripts/build-index.mjs >/dev/null 2>&1
git add -A public/data scripts/data/tcdb-hole-jobs.json
git commit -qm "Topps official checklists: add missing cards ($(basename $B))

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_014BuJ3wW8h6B96hTcxCy8nf" && git push -q 2>&1 | grep -v moved | tail -1
echo "pushed $(basename $B)"
