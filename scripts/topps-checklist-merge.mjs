// Merge Topps official checklists (parsed by parse.py) into Card HQ set files. Only ever ADDS cards.
//   node merge.mjs <pairs.json> [--write]
// pairs.json: [{ slug, url, sections: [{title, cards:[{n,p,t}]}] }]
// - An official section is matched to ours by a wording-insensitive key; missing card numbers are added to it.
// - An official section we don't have is added, minus cards we already list elsewhere (same number + surname).
// - When every official card is present afterwards, a hidden "incomplete" set is un-hidden (the official list is the full one).
import { readFileSync, writeFileSync, existsSync } from 'node:fs'

const [pairsFile, ...flags] = process.argv.slice(2)
const WRITE = flags.includes('--write')
const repo = '/home/claude/card-checklists/'
const jobsPath = repo + 'scripts/data/tcdb-hole-jobs.json'
const jobs = JSON.parse(readFileSync(jobsPath, 'utf8'))
const jobBy = new Map(jobs.map(j => [j.slug, j]))

const DROP = new Set(['autograph', 'signature', 'sig', 'auto', 'card', 'set', 'insert'])
const key = (t) => String(t || '').normalize('NFKD').replace(/[̀-ͯ]/g, '').toLowerCase()
  .replace(/['’.-]/g, '').replace(/[^a-z0-9]+/g, ' ').trim().split(' ')
  .map(w => w.length > 3 ? w.replace(/s$/, '') : w).filter(w => w && !DROP.has(w)).join(' ')
const surname = (p) => {
  const w = String(p || '').normalize('NFKD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z ]/g, ' ').trim().split(/\s+/)
  while (w.length > 1 && /^(jr|sr|ii|iii|iv)$/.test(w[w.length - 1])) w.pop()
  return w[w.length - 1] || ''
}
const num = (n) => String(n || '').trim().replace(/^#/, '').toLowerCase()

const report = []
let totalAdded = 0, setsChanged = 0
for (const pair of JSON.parse(readFileSync(pairsFile, 'utf8'))) {
  const path = repo + 'public/data/' + pair.slug + '.json'
  if (!existsSync(path)) { report.push(pair.slug + ': no file'); continue }
  const set = JSON.parse(readFileSync(path, 'utf8'))
  // Some copies have no card numbers at all (team-sorted lists). Give those cards their official numbers,
  // by surname within the matching official section — or its parent ("Base Refractor" -> "Base") — when unique.
  let numbered = 0
  const offByKey = new Map(pair.sections.map(s => [key(s.title), s]))
  for (const s of set.sections) {
    if (s.cards.filter(c => !num(c.n)).length < s.cards.length / 2) continue
    const k = key(s.title)
    let o = offByKey.get(k)
    if (!o) { let best = null; for (const [ok, os] of offByKey) if ((k === ok || k.startsWith(ok + ' ')) && (!best || ok.length > key(best.title).length)) best = os; o = best }
    if (!o) continue
    const bySur = new Map()
    for (const c of o.cards) { const sn = surname(c.p); bySur.set(sn, bySur.has(sn) ? null : c.n) }
    for (const c of s.cards) if (!num(c.n)) { const n = bySur.get(surname(c.p)); if (n) { c.n = n; numbered++ } }
  }
  const byKey = new Map()
  for (const s of set.sections) { const k = key(s.title); if (!byKey.has(k)) byKey.set(k, s) }
  const everywhere = new Set(set.sections.flatMap(s => s.cards.map(c => num(c.n) + '|' + surname(c.p))))
  // Guard against a wrong product match: most official cards must already be in our copy.
  // (Measured from our side: a cut-off copy is small but still sits inside the official list.)
  const offKeys = new Set(pair.sections.flatMap(s => s.cards.map(c => num(c.n) + '|' + surname(c.p))))
  const overlap = everywhere.size ? [...everywhere].filter(k => offKeys.has(k)).length / everywhere.size : 0
  if (overlap < 0.6) { report.push(`${pair.slug}: SKIP — only ${(overlap * 100).toFixed(0)}% of our cards are on the official list (different product?)`); continue }
  let added = 0, newSecs = 0, official = 0, present = 0
  for (const o of pair.sections) {
    official += o.cards.length
    const mine = byKey.get(key(o.title))
    if (mine) {
      const have = new Set(mine.cards.map(c => num(c.n)))
      for (const c of o.cards) {
        if (have.has(num(c.n))) { present++; continue }
        if (everywhere.has(num(c.n) + '|' + surname(c.p))) { present++; continue }   // listed under another section already
        mine.cards.push({ n: c.n, p: c.p, ...(c.t ? { t: c.t } : {}), ...(c.x ? { x: c.x } : {}) }); have.add(num(c.n)); added++
      }
    } else {
      const fresh = o.cards.filter(c => !everywhere.has(num(c.n) + '|' + surname(c.p)))
      present += o.cards.length - fresh.length
      if (fresh.length) {
        set.sections.push({ title: o.title, cards: fresh.map(c => ({ n: c.n, p: c.p, ...(c.t ? { t: c.t } : {}), ...(c.x ? { x: c.x } : {}) })) })
        added += fresh.length; newSecs++
      }
    }
  }
  const complete = official > 0 && present + added >= official
  let unhid = false
  if (complete && (set.incomplete || set.incompleteWhy)) { delete set.incomplete; delete set.incompleteWhy; unhid = true }
  if (added || unhid || numbered) {
    set.toppsChecklist = pair.url
    if (WRITE) writeFileSync(path, JSON.stringify(set))
    setsChanged++; totalAdded += added
  }
  const job = jobBy.get(pair.slug)
  if (job && WRITE && (job.status === 'verify' || job.status === 'todo')) {
    Object.assign(job, { status: 'done', note: `topps official checklist: +${added} cards (${newSecs} new sections)${unhid ? ', un-hidden' : ''}`, at: new Date().toISOString().slice(0, 10) })
  }
  report.push(`${pair.slug}: official ${official}, already had ${present}, +${added} (${newSecs} new sections)${numbered ? `, numbered ${numbered}` : ''}${unhid ? ' UNHID' : ''}`)
}
if (WRITE) writeFileSync(jobsPath, JSON.stringify(jobs, null, 1) + '\n')
console.log(report.join('\n'))
console.log(`topps-merge: ${setsChanged} sets changed, +${totalAdded} cards${WRITE ? '' : ' (dry run)'}`)
