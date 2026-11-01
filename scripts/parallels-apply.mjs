// Add researched parallel sections to Card HQ sets.  node apply.mjs out-*.json [--write]
// Each parallel = copy of its parent section's cards, titled "<Parent> <Parallel>", print run in x ("/50").
import { readFileSync, writeFileSync, existsSync } from 'node:fs'
const args = process.argv.slice(2), WRITE = args.includes('--write')
const repo = '/home/claude/card-checklists/public/data/'
const norm = (t) => String(t || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim().split(' ').map(w => w.length > 3 ? w.replace(/s$/, '') : w).sort().join(' ')
let sets = 0, secs = 0, cards = 0
const bad = []
for (const f of args.filter(a => !a.startsWith('--'))) {
  for (const r of JSON.parse(readFileSync(f, 'utf8'))) {
    if (!r.parallels || !r.parallels.length) continue
    const path = repo + r.slug + '.json'
    if (!existsSync(path)) { bad.push(r.slug + ': no file'); continue }
    const set = JSON.parse(readFileSync(path, 'utf8'))
    const byTitle = new Map(set.sections.map(s => [norm(s.title), s]))
    let added = 0
    for (const p of r.parallels) {
      const parent = byTitle.get(norm(p.parent))
      if (!parent) { bad.push(`${r.slug}: no parent "${p.parent}"`); continue }
      const name = String(p.name || '').replace(/\s*\/\s*\d+\s*$/, '').trim()
      if (!name || /printing plate/i.test(name)) continue
      if (/auto|signature/i.test(name) && !/auto|signature|sig|ink|graph/i.test(parent.title)) { bad.push(`${r.slug}: auto parallel on non-auto parent ${parent.title}`); continue }
      const title = parent.title + ' ' + name
      if (byTitle.has(norm(title))) continue
      const run = p.run && /^\/?\d+$/.test(String(p.run).trim()) ? '/' + String(p.run).replace(/\D/g, '') : null
      const sec = { title, cards: parent.cards.map(c => { const o = { n: c.n, p: c.p }; if (c.t) o.t = c.t; if (run) o.x = run; return o }) }
      set.sections.push(sec); byTitle.set(norm(title), sec); added++; secs++; cards += sec.cards.length
    }
    if (added) {
      set.parallelsSource = r.source
      if (WRITE) writeFileSync(path, JSON.stringify(set))
      sets++
    }
  }
}
console.log(bad.slice(0, 30).join('\n'))
console.log(`parallels: ${sets} sets, +${secs} sections, +${cards} cards${WRITE ? '' : ' (dry run)'}; ${bad.length} unmatched parents`)
