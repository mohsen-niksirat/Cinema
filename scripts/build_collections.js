/**
 * build_collections.js — builds the "معرفی" (Featured) collections for Cinema.
 * Resolves curated title lists against the 7000-title dataset (CineScore titles.json)
 * and emits a compact COLLECTIONS array (id, title, emoji, desc, items with i/t/y/r).
 * Usage: node scripts/build_collections.js
 */
'use strict';
const fs = require('fs');
const path = require('path');
const TITLES = JSON.parse(fs.readFileSync(path.join(__dirname, '..', '..', '..', '_review_CineScore', 'CineScore-main', 'public', 'titles.json'), 'utf8')).items;

const norm = s => String(s||'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();

// index by normalized title
const byNorm = new Map();
TITLES.forEach(t => {
  const k = norm(t.t);
  if (!byNorm.has(k)) byNorm.set(k, t);
  // also index "the ..." -> "..." and "..." -> "the ..."
  const k2 = k.replace(/^the /,''), k3 = 'the '+k;
  if (!byNorm.has(k2)) byNorm.set(k2, t);
  if (!byNorm.has(k3)) byNorm.set(k3, t);
});

function resolve(titles) {
  const out = [];
  const seen = new Set();
  titles.forEach(title => {
    const t = byNorm.get(norm(title));
    if (t && !seen.has(t.i)) {
      seen.add(t.i);
      out.push({ i: t.i, t: t.t, y: t.y || 0, tp: t.tp, r: t.r || 0 });
    }
  });
  return out;
}

const DEFS = [
  { id:'top10', emoji:'🏆', title:'IMDb Top 10', desc:'برترین فیلم‌های تاریخ بر اساس رأی کاربران IMDb', top:'m', n:10 },
  { id:'topseries', emoji:'📺', title:'برترین سریال‌ها', desc:'بهترین سریال‌های تاریخ از نظر مخاطبان IMDb', top:'s', n:12 },
  { id:'nolan', emoji:'🎬', title:'سینمای کریستوفر نولان', desc:'شاهکارهای کارگردان نابغه‌ی روایت‌های پیچیده', titles:[
    'Inception','Interstellar','The Dark Knight','The Dark Knight Rises','Batman Begins','Memento','Oppenheimer','Dunkirk','The Prestige','Tenet','Following'
  ]},
  { id:'tarantino', emoji:'🔫', title:'سینمای تارانتینو', desc:'خشونت، دیالوگ‌های به‌یادماندنی و سبک منحصربه‌فرد', titles:[
    'Pulp Fiction','Django Unchained','Inglourious Basterds','Kill Bill: Vol. 1','Kill Bill: Vol. 2','Reservoir Dogs','Once Upon a Time in Hollywood','Jackie Brown','The Hateful Eight'
  ]},
  { id:'scorsese', emoji:'🎥', title:'سینمای اسکورسیزی', desc:'گنگسترها، نیویورک و موسیقی — امضای همیشگی', titles:[
    'Goodfellas','The Departed','The Wolf of Wall Street','Taxi Driver','Shutter Island','Casino','The Irishman','Hugo','Gangs of New York'
  ]},
  { id:'lotr', emoji:'🧙', title:'سرزمین میانه: ارباب حلقه‌ها و هابیت', desc:'حماسه‌ی فانتزی جی.آر.آر. تالکین — سه‌گانه کامل + هابیت', titles:[
    'The Lord of the Rings: The Fellowship of the Ring','The Lord of the Rings: The Two Towers','The Lord of the Rings: The Return of the King',
    'The Hobbit: An Unexpected Journey','The Hobbit: The Desolation of Smaug','The Hobbit: The Battle of the Five Armies'
  ]},
  { id:'marvel', emoji:'🦸', title:'دنیای سینمایی مارول', desc:'اوج ابرقهرمانی — از انتقام‌جویان تا اسپایدرمن', titles:[
    'The Avengers','Avengers: Age of Ultron','Avengers: Infinity War','Avengers: Endgame','Iron Man','Iron Man 2','Iron Man 3','Thor','Thor: Ragnarok',
    'Captain America: The First Avenger','Captain America: The Winter Soldier','Captain America: Civil War','Guardians of the Galaxy','Guardians of the Galaxy Vol. 2',
    'Spider-Man: Homecoming','Spider-Man: Far From Home','Spider-Man: No Way Home','Doctor Strange','Black Panther','Ant-Man','Captain Marvel','Black Widow','Shang-Chi and the Legend of the Ten Rings','Eternals'
  ]},
  { id:'harrypotter', emoji:'🪄', title:'دنیای جادویی هری پاتر', desc:'هوگوارتز و ماجراهای هری — به همراه جانوران شگفت‌انگیز', titles:[
    'Harry Potter and the Sorcerer\'s Stone','Harry Potter and the Philosopher\'s Stone','Harry Potter and the Chamber of Secrets','Harry Potter and the Prisoner of Azkaban',
    'Harry Potter and the Goblet of Fire','Harry Potter and the Order of the Phoenix','Harry Potter and the Half-Blood Prince','Harry Potter and the Deathly Hallows: Part 1',
    'Harry Potter and the Deathly Hallows: Part 2','Fantastic Beasts and Where to Find Them','Fantastic Beasts: The Crimes of Grindelwald','Fantastic Beasts: The Secrets of Dumbledore'
  ]},
  { id:'starwars', emoji:'🌟', title:'جنگ ستارگان', desc:'در یک کهکشان دور، دور... — تمام قسمت‌های افسانه', titles:[
    'Star Wars: Episode I - The Phantom Menace','Star Wars: Episode II - Attack of the Clones','Star Wars: Episode III - Revenge of the Sith',
    'Star Wars: Episode IV - A New Hope','Star Wars: Episode V - The Empire Strikes Back','Star Wars: Episode VI - Return of the Jedi',
    'Star Wars: Episode VII - The Force Awakens','Star Wars: Episode VIII - The Last Jedi','Star Wars: Episode IX - The Rise of Skywalker',
    'Rogue One: A Star Wars Story','Solo: A Star Wars Story'
  ]},
  { id:'matrix', emoji:'🤖', title:'ماتریکس', desc:'حقیقت را انتخاب کن — همه قسمت‌های ماتریکس', titles:[
    'The Matrix','The Matrix Reloaded','The Matrix Revolutions','The Matrix Resurrections'
  ]},
  { id:'batman', emoji:'🦇', title:'بتمن و شوالیه تاریکی', desc:'از نولان تا پتینسون — مرد خفاشی', titles:[
    'Batman Begins','The Dark Knight','The Dark Knight Rises','The Batman','Batman','Batman Returns','Batman Forever','Batman & Robin','Joker'
  ]},
  { id:'oscar', emoji:'🎭', title:'برندگان اسکار بهترین فیلم', desc:'شاهکارهایی که مجسمه طلایی را بردند', titles:[
    'Parasite','Oppenheimer','Everything Everywhere All at Once','The Shape of Water','Moonlight','Spotlight','Birdman','12 Years a Slave','Argo',
    'The King\'s Speech','The Artist','The Hurt Locker','Slumdog Millionaire','No Country for Old Men','The Departed','Million Dollar Baby',
    'The Lord of the Rings: The Return of the King','Chicago','A Beautiful Mind','Gladiator','American Beauty','Titanic','Forrest Gump','Schindler\'s List',
    'The Silence of the Lambs','Rain Man','Platoon','Amadeus','Gandhi','Rocky','One Flew Over the Cuckoo\'s Nest','The Godfather','The Godfather Part II',
    'The Sting','Patton','Midnight Cowboy','Lawrence of Arabia','West Side Story','Ben-Hur','The Bridge on the River Kwai','Marty','On the Waterfront',
    'From Here to Eternity','An American in Paris','All About Eve','Casablanca','Gone with the Wind','It Happened One Night','Grand Hotel'
  ]},
  { id:'scifi', emoji:'🚀', title:'علمی-تخیلی برتر', desc:'سفر در زمان، فضا و ذهن — بهترین‌های ژانر', titles:[
    'Interstellar','Inception','The Matrix','Blade Runner 2049','Dune','Arrival','Ex Machina','The Martian','2001: A Space Odyssey','Blade Runner',
    'Alien','Terminator 2: Judgment Day','Back to the Future','Back to the Future Part II','Back to the Future Part III','The Terminator','Avatar',
    'Edge of Tomorrow','Looper','Moon','District 9','Gattaca','Minority Report','The Fifth Element','Gravity','The Prestige','Dune: Part Two'
  ]},
  { id:'anime', emoji:'🎌', title:'انیمه و انیمیشن برتر', desc:'بهترین‌های ژاپن و دنیا — از میازاکی تا ناروتو', titles:[
    'Your Name','Spirited Away','A Silent Voice','Demon Slayer: Kimetsu no Yaiba','One Piece','Naruto','Attack on Titan','Death Note',
    'Fullmetal Alchemist: Brotherhood','Jujutsu Kaisen','My Hero Academia','Tokyo Ghoul','Weathering with You','The Wind Rises','Princess Mononoke',
    'Howl\'s Moving Castle','Sword Art Online','Chainsaw Man','One Punch Man','Hunter x Hunter','The Lion King','Toy Story','Up','Finding Nemo','Coco','Soul','The Boy and the Heron'
  ]},
  { id:'comedy', emoji:'😂', title:'کمدی‌های محبوب', desc:'بخند با بهترین کمدی‌های سینما', titles:[
    'The Hangover','Superbad','Step Brothers','Bridesmaids','Ted','21 Jump Street','The 40-Year-Old Virgin','Borat','Anchorman','The Grand Budapest Hotel',
    'Dumb and Dumber','Ace Ventura: Pet Detective','Bruce Almighty','The Mask','Liar Liar','Home Alone','Mrs. Doubtfire','Meet the Parents','Night at the Museum',
    'Paddington','The Intouchables','Grown Ups','Bad Boys','Rush Hour','The Proposal','Crazy Rich Asians','Knives Out'
  ]},
  { id:'thriller', emoji:'🔪', title:'هیجان‌انگیز و معمایی', desc:'مغزت را به چالش بکش — بهترین معمایی‌ها', titles:[
    'Se7en','Fight Club','Memento','Gone Girl','Zodiac','Prisoners','Shutter Island',
    'The Girl with the Dragon Tattoo','Gone Baby Gone','Mystic River','The Silence of the Lambs','Split','A Quiet Place','Get Out','Us','Oldboy','Saw'
  ]},
];

const out = DEFS.map(d => {
  if (d.top) {
    const list = TITLES.filter(t => t.tp === d.top).sort((a,b) => (b.v||0) - (a.v||0)).slice(0, d.n);
    return { id: d.id, emoji: d.emoji, title: d.title, desc: d.desc, items: list.map(t => ({ i: t.i, t: t.t, y: t.y||0, tp: t.tp, r: t.r||0 })) };
  }
  return { id: d.id, emoji: d.emoji, title: d.title, desc: d.desc, items: resolve(d.titles) };
});

out.forEach(c => console.log(c.id + ': ' + c.items.length + '/' + c.title));
fs.writeFileSync(path.join(__dirname, 'collections.json'), JSON.stringify(out));
console.log('written scripts/collections.json');
