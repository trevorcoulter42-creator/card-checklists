# Parallel research brief (Card HQ)

Input: a JSON file of trading-card sets. Each has `slug`, `name`, `parents` (section titles on our site, with card counts) and `existingParallels` (parallel sections we already have).

Goal: for each set, find the set's real PARALLELS (color/refractor/foil versions of existing cards, e.g. "Gold /50", "Refractor", "SuperFractor /1") and which of our parent sections each parallel applies to.

How:
1. WebSearch for "<set name> checklist parallels" and WebFetch a checklist article (Beckett news, Cardboard Connection, Checklist Insider, Checklist Center, Sports Card Investor, Topps' own blog/odds sheet). Do NOT use tcdb.com (we are blocked there).
2. Only record parallels the fetched page explicitly lists for that set. Never guess or fill in from other years. If no page lists them, return an empty list for that set.
3. Map each parallel to the matching parent title EXACTLY as written in `parents` (without the count). If a parallel applies to several parents (e.g. all inserts), list each parent. Skip parents with no listed parallels.
4. Print run: "/50" style, or null if unnumbered. 1/1s are "/1". Keep the source's parallel name (e.g. "Gold Refractor", "Red Wave Refractor"). Do not include printing plates.
5. Skip parallels already in `existingParallels`.

Output: write a JSON file (path given to you) shaped:
[{"slug": "...", "source": "<url you used>", "parallels": [{"parent": "Base", "name": "Gold Refractor", "run": "/50"}, ...]}]
Every set in the input must appear once in the output (empty `parallels` and `source: null` if nothing found). Write the file with the Write tool, then reply with one line: how many sets had parallels found.
