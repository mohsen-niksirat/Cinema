/* ═══════════════════════════════════════════════════════════
   کرالر آرشیو سریال — دنیای سریال (top_1000_series.html)
   ساختار: سریال → نسخه (SoftSub/Dubbed/…) → فصل → لینک کیفیت
   خروجی: public/series_full.json
   فقط از سیستم محلی (آی‌پی ایران) اجرا می‌شود.
   ═══════════════════════════════════════════════════════════ */
'use strict';
const fs = require('fs');
const path = require('path');

const SOURCE = 'https://dls2.aparatchi-dlcenter.top/DonyayeSerial/top_1000_series.html';
const OUT = path.join(__dirname, '..', 'public', 'series_full.json');

async function main() {
  console.log('⏳ fetching archive page…');
  const r = await fetch(SOURCE);
  if (!r.ok) throw new Error('HTTP ' + r.status);
  const html = await r.text();
  console.log('✓ got', html.length, 'bytes');

  /* ---- split into series blocks ---- */
  const blocks = html.split(/<h3>/).slice(1);
  console.log('series blocks:', blocks.length);

  const clean = s => String(s || '').replace(/<[^>]+>/g, '').trim();
  const out = [];
  let linkTotal = 0;

  for (const raw of blocks) {
    const b = raw.split(/<hr/)[0]; // تا پایان بلاک این سریال
    // 1. Number. Title
    const tm = /(\d+)\.\s*(.+?)<\/h3>/.exec('<h3>' + b);
    if (!tm) continue;
    const title = clean(tm[2]);
    // 2. IMDb Code
    const imdb = (/<b>IMDb Code:<\/b>\s*([^<\s]+)/i.exec(b) || [])[1] || '';
    // 3. Votes / Rates
    const votes = clean((/<b>IMDb Votes:<\/b>\s*([^<]+)/i.exec(b) || [])[1] || '');
    const rating = clean((/<b>IMDb Rates:<\/b>\s*([^<]+)/i.exec(b) || [])[1] || '');
    const year = clean((/<b>Year:<\/b>\s*([^<]+)/i.exec(b) || [])[1] || '');

    // 4. variants: <p style="..."><b>SoftSub</b></p> → تا variant بعدی
    const variants = [];
    const vRe = /<p[^>]*>\s*<b>\s*(SoftSub|Dubbed|HardSub|NoSub|hardsub|dubbed|softsub)\s*<\/b>\s*<\/p>/gi;
    let vm;
    const vPositions = [];
    while ((vm = vRe.exec(b)) !== null) vPositions.push({ name: vm[1].replace(/^./, c => c.toUpperCase()), at: vm.index });
    if (!vPositions.length) {
      // بدون تفکیک — همه یک variant
      vPositions.push({ name: 'SoftSub', at: 0 });
    }
    for (let i = 0; i < vPositions.length; i++) {
      const from = vPositions[i].at, to = i + 1 < vPositions.length ? vPositions[i + 1].at : b.length;
      const seg = b.slice(from, to);

      // 5. seasons: <p>season N</p> ... تا season بعدی
      const seasons = [];
      const sRe = /<p>\s*season\s*(\d+)\s*<\/p>/gi;
      let sm;
      const sPos = [];
      while ((sm = sRe.exec(seg)) !== null) sPos.push({ num: sm[1], at: sm.index });
      for (let j = 0; j < sPos.length; j++) {
        const from2 = sPos[j].at, to2 = j + 1 < sPos.length ? sPos[j + 1].at : seg.length;
        const seg2 = seg.slice(from2, to2);
        // 6. quality links
        const links = [];
        const aRe = /<a\s+href="([^"]+)"[^>]*>([^<]*)<\/a>/gi;
        let am;
        while ((am = aRe.exec(seg2)) !== null) {
          const u = am[1], label = clean(am[2]);
          if (!/^https?:/.test(u) || /daramet|10_thous/.test(u)) continue;
          // کیفیت: از label انسانی؛ فقط اگر label نبود از URL
          let q = (label || '').replace(/\s+/g, ' ').trim();
          if (!q || q === '-') q = (u.split('/').pop() || '').replace(/\.(html?)$/i, '').replace(/\./g, ' ');
          // فرمت استاندارد: «1080p BluRay x265 10bit»
          q = q.replace(/x265\s*10bit/gi, 'x265 10bit').replace(/\s*10bit/gi, m => / 10bit/.test(m) ? m : ' 10bit').replace(/\s{2,}/g, ' ').trim();
          links.push({ u, q });
          linkTotal++;
        }
        if (links.length) seasons.push({ num: sPos[j].num, links });
      }
      if (seasons.length) variants.push({ sub: vPositions[i].name, seasons });
    }

    if (!variants.length) continue;
    out.push({ t: title, i: imdb, r: rating, v: votes, y: year, tp: 'series', seasons: variants.flatMap(v => v.seasons.map(s => ({ num: s.num, sub: v.sub, links: s.links }))) });
  }

  console.log('✓ parsed series:', out.length, '| quality links:', linkTotal);
  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, JSON.stringify({ crawledAt: new Date().toISOString(), source: 'aparatchi top_1000_series', s: out }));
  const sz = fs.statSync(OUT).size;
  console.log('✓ saved', OUT, (sz / 1024).toFixed(0) + ' KB');
}

main().catch(e => { console.error('FAIL:', e.message); process.exit(1); });
