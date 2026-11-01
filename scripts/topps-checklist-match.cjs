const T=require("/home/claude/handoff/topps/index.json");const j=require("/home/claude/card-checklists/scripts/data/tcdb-hole-jobs.json");
const SPORT=/\b(cards?|baseball|basketball|football|soccer|hockey|ufc|mma|wwe|wrestling|racing|nascar|tennis|golf|f1|formula|one|checklist|edition)\b/g;
const toks=s=>{let x=String(s).toLowerCase().replace(/®|™/g,"").replace(/&/g," and ");x=x.replace(/^(\d{2})-(\d{2})\b/,"20$1-$2");x=x.replace(SPORT," ").replace(/[^a-z0-9]+/g," ").trim();return x.split(" ").filter(Boolean)};
const key=s=>toks(s).sort().join(" ");
const idx=new Map();for(const [n,h] of T){const k=key(n);if(!idx.has(k))idx.set(k,[]);idx.get(k).push([n,h])}
const SPW={baseball:/baseball/i,basketball:/basketball/i,football:/football/i,soccer:/soccer|uefa|premier|bundesliga|mls|champions league|la liga|serie a|euro|fifa|world cup/i,hockey:/hockey/i,ufc:/ufc|mma/i,wrestling:/wwe|wrestl/i,tennis:/tennis/i,golf:/golf/i,racing:/formula|f1|racing|nascar/i};
const sportOk=(ours,tn)=>{const sp=String(ours).toLowerCase();for(const [k,re] of Object.entries(SPW)){if(k!==sp&&re.test(tn)&&!(SPW[sp]&&SPW[sp].test(tn)))return false}return true};
const rem=j.filter(x=>x.status=="verify"||x.status=="todo");const out=[],amb=[];
for(const x of rem){const k=key(x.name);const m=(idx.get(k)||[]).filter(a=>sportOk(x.sport,a[0]));if(m.length==1)out.push({slug:x.slug,name:x.name,topps:m[0][0],url:m[0][1]});else if(m.length){const sp=String(x.sport).toLowerCase().replace("ufc","ufc").replace("wrestling","wwe");const SP=/baseball|basketball|football|soccer|hockey|ufc|wwe|tennis|golf|racing|f1/i;let c=m.filter(a=>a[0].toLowerCase().includes(sp));if(!c.length)c=m.filter(a=>!SP.test(a[0]));if(c.length==1){out.push({slug:x.slug,name:x.name,topps:c[0][0],url:c[0][1]});continue}amb.push(x.name+" => "+m.map(a=>a[0]).join(" || "))}}
require("fs").writeFileSync("/home/claude/handoff/topps/pairs.json",JSON.stringify(out,null,1));
console.log("matched",out.length,"ambiguous",amb.length);console.log(amb.slice(0,10).join("\n"));
const un=rem.filter(x=>/topps|bowman/i.test(x.name)&&x.year>=2018&&!out.find(o=>o.slug==x.slug));console.log("unmatched topps 2018+",un.length);console.log(un.slice(0,25).map(x=>x.name).join("\n"))
