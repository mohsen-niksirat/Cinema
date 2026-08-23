/**
 * Auto-discovery crawler for sermoviedown.pw servers
 * Automatically finds all categories, years, and items.
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

const SERVERS = [
  'https://dl2.sermoviedown.pw',
  'https://dl3.sermoviedown.pw',
  'https://dl4.sermoviedown.pw',
  'https://dl5.sermoviedown.pw',
];

function fetch(url) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, { timeout: 15000 }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return fetch(res.headers.location).then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) return reject(new Error(`HTTP ${res.statusCode}`));
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    });
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error(`Timeout: ${url}`)); });
  });
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function fetchRetry(url, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try { return await fetch(url); }
    catch (e) { if (i === retries - 1) throw e; await sleep(1000 * (i + 1)); }
  }
}

function parseLinks(html) {
  const links = [];
  const re = /<a\s+href="([^"]+)"[^>]*>([^<]+)<\/a>/gi;
  let m;
  while ((m = re.exec(html)) !== null) {
    if (m[1] === '../' || m[1].startsWith('?') || m[2].includes('Parent directory')) continue;
    links.push({ href: m[1], name: m[2] });
  }
  return links;
}

function extractQuality(fn) {
  const q = [];
  if (/2160p|4k/i.test(fn)) q.push('2160p');
  if (/1080p/i.test(fn)) q.push('1080p');
  if (/720p/i.test(fn)) q.push('720p');
  if (/480p/i.test(fn)) q.push('480p');
  const src = [];
  if (/BluRay/i.test(fn)) src.push('BluRay');
  if (/WEB-?DL|WEBRip/i.test(fn)) src.push('WEB-DL');
  if (/HDTV/i.test(fn)) src.push('HDTV');
  if (/DVDRip/i.test(fn)) src.push('DVDRip');
  const codec = [];
  if (/x265|HEVC/i.test(fn)) codec.push('x265');
  if (/10bit/i.test(fn)) codec.push('10bit');
  let qual = q.join(' ');
  if (src.length) qual += ' ' + src.join(' ');
  if (codec.length) qual += ' ' + codec.join(' ');
  return qual.trim() || fn;
}

function extractSubType(p, fn) {
  const c = (p + '/' + fn).toLowerCase();
  if (/\/dubbed\//i.test(c) || /\.dubbed\./i.test(c) || /farsi/i.test(c)) return 'Dubbed';
  if (/\/hardsub\//i.test(c) || /\.hardsub\./i.test(c)) return 'HardSub';
  if (/\/nosub\//i.test(c)) return 'NoSub';
  return 'SoftSub';
}

function cleanName(dir) {
  return dir.replace(/\./g, ' ').replace(/\s+\d{4}$/, '').replace(/\s+/g, ' ').trim();
}

function extractYear(dir) {
  const m = dir.match(/(\d{4})/);
  return m ? m[1] : '';
}

const isMedia = (fn) => /\.(mkv|mp4|avi)$/i.test(fn);

// Walk a single movie/show directory
async function walkItem(server, category, year, itemDir) {
  const baseUrl = `${server}/${category}/${year}/${itemDir}/`;
  try {
    const html = await fetchRetry(baseUrl);
    const entries = parseLinks(html);
    const links = [];
    const subTypes = new Set();
    const seasons = [];

    for (const entry of entries) {
      if (entry.href.endsWith('/')) {
        const subName = entry.href.replace(/\/$/, '');
        const isSubTypeDir = /^(softsub|dubbed|hardsub|nosub|soft\.sub)$/i.test(subName);

        if (category === 'Series' || category === 'Anime') {
          // Could be SubType/Season/ or Season/ structure
          const subHtml = await fetchRetry(baseUrl + entry.href);
          const subEntries = parseLinks(subHtml);

          if (isSubTypeDir) {
            // SubType dir -> contains seasons
            for (const se of subEntries) {
              if (!se.href.endsWith('/')) continue;
              const seasonNum = se.href.replace(/\/$/, '').replace(/^S/i, '');
              const seasonHtml = await fetchRetry(baseUrl + entry.href + se.href);
              const seasonFiles = parseLinks(seasonHtml);
              const sLinks = [];
              for (const f of seasonFiles) {
                if (isMedia(f.name)) {
                  sLinks.push({ u: `${baseUrl}${entry.href}${se.href}${f.href}`, q: extractQuality(f.name), s: '' });
                }
              }
              if (sLinks.length) {
                const sub = subName === 'Soft.Sub' ? 'SoftSub' : subName;
                seasons.push({ num: seasonNum, sub, links: sLinks });
              }
              await sleep(150);
            }
          } else {
            // Season dir directly
            const seasonNum = subName.replace(/^S/i, '');
            const sLinks = [];
            for (const f of subEntries) {
              if (isMedia(f.name)) {
                sLinks.push({ u: `${baseUrl}${entry.href}${f.href}`, q: extractQuality(f.name), s: '' });
              }
            }
            if (sLinks.length) {
              seasons.push({ num: seasonNum, sub: 'SoftSub', links: sLinks });
            }
          }
          await sleep(150);
        } else {
          // Movie: SubType dir
          const subHtml = await fetchRetry(baseUrl + entry.href);
          const subEntries = parseLinks(subHtml);
          for (const f of subEntries) {
            if (isMedia(f.name)) {
              const sub = extractSubType(entry.href, f.name);
              subTypes.add(sub);
              links.push({ u: `${baseUrl}${entry.href}${f.href}`, q: extractQuality(f.name), s: '', sub });
            }
          }
          await sleep(150);
        }
      } else if (isMedia(entry.name)) {
        // File directly in item dir
        const sub = extractSubType('', entry.name);
        subTypes.add(sub);
        links.push({ u: `${baseUrl}${entry.href}`, q: extractQuality(entry.name), s: '', sub });
      }
    }

    const name = cleanName(itemDir);
    const yearVal = extractYear(itemDir) || year;

    if (category === 'Series' || category === 'Anime') {
      if (seasons.length === 0) return null;
      return { t: name, y: yearVal, tp: category === 'Anime' ? 'anime' : 'series', server, seasons };
    } else {
      if (links.length === 0) return null;
      return { t: name, y: yearVal, tp: 'movie', server, subTypes: [...subTypes], l: links };
    }
  } catch (e) {
    console.error(`  Error: ${itemDir}: ${e.message}`);
    return null;
  }
}

async function main() {
  const allMovies = [], allSeries = [], allAnime = [], allSoundtrack = [];
  const seen = new Set();
  const startTime = Date.now();

  for (const server of SERVERS) {
    console.log(`\n=== ${server} ===`);

    // Step 1: Discover categories
    let rootHtml;
    try { rootHtml = await fetchRetry(server + '/'); }
    catch (e) { console.error(`  Cannot reach server: ${e.message}`); continue; }

    const categories = parseLinks(rootHtml).filter(e => e.href.endsWith('/')).map(e => e.href.replace(/\/$/, ''));
    console.log(`  Categories: ${categories.join(', ')}`);

    for (const cat of categories) {
      if (cat === 'Soundtrack') {
        console.log(`  [SKIP] Soundtrack (not supported yet)`);
        continue;
      }

      // Step 2: Discover years
      let yearHtml;
      try { yearHtml = await fetchRetry(`${server}/${cat}/`); }
      catch (e) { console.error(`  Cannot list ${cat}: ${e.message}`); continue; }

      const years = parseLinks(yearHtml).filter(e => e.href.endsWith('/') && /^\d{4}/.test(e.name)).map(e => e.href.replace(/\/$/, ''));
      console.log(`  ${cat}/ years: ${years.join(', ')}`);

      for (const year of years) {
        // Step 3: List items in year
        let itemsHtml;
        try { itemsHtml = await fetchRetry(`${server}/${cat}/${year}/`); }
        catch (e) { console.error(`  Cannot list ${cat}/${year}: ${e.message}`); continue; }

        const items = parseLinks(itemsHtml).filter(e => e.href.endsWith('/'));
        console.log(`  ${cat}/${year}: ${items.length} items`);

        for (const item of items) {
          const dirName = item.href.replace(/\/$/, '');
          const key = `${cat}:${cleanName(dirName)}:${extractYear(dirName) || year}`;
          if (seen.has(key)) { continue; }

          const result = await walkItem(server, cat, year, dirName);
          if (result) {
            seen.add(key);
            if (result.tp === 'movie') allMovies.push(result);
            else if (result.tp === 'series') allSeries.push(result);
            else if (result.tp === 'anime') allAnime.push(result);

            const linkCount = result.seasons
              ? result.seasons.reduce((a, s) => a + s.links.length, 0)
              : (result.l || []).length;
            console.log(`    ${dirName}: ${linkCount} links`);
          }
          await sleep(200);
        }
      }
    }
  }

  const db = {
    crawledAt: new Date().toISOString(),
    servers: SERVERS,
    movieCount: allMovies.length,
    seriesCount: allSeries.length,
    animeCount: allAnime.length,
    m: allMovies,
    s: allSeries,
    a: allAnime,
  };

  const outDir = path.join(__dirname, '..', 'public');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
  const outPath = path.join(outDir, 'db.json');
  fs.writeFileSync(outPath, JSON.stringify(db));

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(0);
  console.log(`\n=== Done in ${elapsed}s ===`);
  console.log(`Movies: ${allMovies.length}`);
  console.log(`Series: ${allSeries.length}`);
  console.log(`Anime: ${allAnime.length}`);
  console.log(`Output: ${(fs.statSync(outPath).size / 1024 / 1024).toFixed(2)} MB`);
}

main().catch(e => { console.error('Fatal:', e); process.exit(1); });
