/**
 * build_collections.js — builds the "معرفی" (Featured) packs for Cinema.
 * Resolves curated lists + auto genre packs against the CineScore dataset,
 * and attaches a cover image (self-hosted backdrop, poster fallback) per pack.
 * Usage: node scripts/build_collections.js
 */
'use strict';
const fs = require('fs');
const path = require('path');

const CS_PUBLIC = path.join(__dirname, '..', '..', 'CineScore', 'public');
const DB = JSON.parse(fs.readFileSync(path.join(CS_PUBLIC, 'db.json'), 'utf8')).items;

const norm = s => String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

const byNorm = new Map();
DB.forEach(t => {
  const k = norm(t.t);
  if (!byNorm.has(k)) byNorm.set(k, t);
  const k2 = k.replace(/^the /, ''), k3 = 'the ' + k;
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
      out.push(t);
    }
  });
  return out;
}

function pickCover(items) {
  // prefer the most-voted item with a backdrop, else poster
  const sorted = [...items].sort((a, b) => (b.v || 0) - (a.v || 0));
  for (const t of sorted) { if (t.b) return t.b; }
  for (const t of sorted) { if (t.p) return t.p; }
  return '';
}

function byGenre(genre, n, minR) {
  return DB.filter(t => t.tp === 'm' && (t.r || 0) >= (minR || 6.8) && String(t.g || '').split(', ').includes(genre))
    .sort((a, b) => (b.v || 0) - (a.v || 0)).slice(0, n);
}

function boxOfficeNum(bo) {
  if (!bo) return 0;
  const m = String(bo).match(/\$([\d.]+)([MBK])/);
  if (!m) return 0;
  const mult = m[2] === 'B' ? 1e9 : m[2] === 'M' ? 1e6 : 1e3;
  return parseFloat(m[1]) * mult;
}

const DEFS = [
  // ---------- curated: top / directors ----------
  { id: 'top10', emoji: '🏆', title: 'IMDb Top 10', desc: 'برترین فیلم‌های تاریخ بر اساس رأی کاربران IMDb', top: 'm', n: 10 },
  { id: 'topseries', emoji: '📺', title: 'برترین سریال‌ها', desc: 'بهترین سریال‌های تاریخ از نظر مخاطبان IMDb', top: 's', n: 12 },
  { id: 'nolan', emoji: '🎬', title: 'سینمای کریستوفر نولان', desc: 'شاهکارهای کارگردان نابغه‌ی روایت‌های پیچیده', titles: [
    'Inception', 'Interstellar', 'The Dark Knight', 'The Dark Knight Rises', 'Batman Begins', 'Memento', 'Oppenheimer', 'Dunkirk', 'The Prestige', 'Tenet', 'Following'] },
  { id: 'tarantino', emoji: '🔫', title: 'سینمای تارانتینو', desc: 'خشونت، دیالوگ‌های به‌یادماندنی و سبک منحصربه‌فرد', titles: [
    'Pulp Fiction', 'Django Unchained', 'Inglourious Basterds', 'Kill Bill: Vol. 1', 'Kill Bill: Vol. 2', 'Reservoir Dogs', 'Once Upon a Time in Hollywood', 'Jackie Brown', 'The Hateful Eight'] },
  { id: 'scorsese', emoji: '🎥', title: 'سینمای اسکورسیزی', desc: 'گنگسترها، نیویورک و موسیقی — امضای همیشگی', titles: [
    'Goodfellas', 'The Departed', 'The Wolf of Wall Street', 'Taxi Driver', 'Shutter Island', 'Casino', 'The Irishman', 'Hugo', 'Gangs of New York'] },
  { id: 'fincher', emoji: '🕷️', title: 'سینمای دیوید فینچر', desc: 'تاریک، دقیق و اعتیادآور — استاد تریلرهای روانی', titles: [
    'Se7en', 'Fight Club', 'Zodiac', 'The Social Network', 'Gone Girl', 'The Girl with the Dragon Tattoo', 'The Curious Case of Benjamin Button', 'Panic Room', 'The Killer'] },
  { id: 'villeneuve', emoji: '🏜️', title: 'سینمای دنی ویلنوو', desc: 'فضاسازی عظیم و سینمای حس‌برانگیز — از سیکاریو تا دوون', titles: [
    'Dune', 'Dune: Part Two', 'Arrival', 'Blade Runner 2049', 'Sicario', 'Prisoners', 'Enemy', 'Incendies'] },
  { id: 'spielberg', emoji: '🚲', title: 'سینمای اسپیلبرگ', desc: 'پدر ماجراجویی مدرن سینما — از کوسه تا دایناسور', titles: [
    'Jurassic Park', 'E.T. the Extra-Terrestrial', 'Jaws', 'Schindler\'s List', 'Saving Private Ryan', 'Catch Me If You Can', 'Raiders of the Lost Ark', 'Indiana Jones and the Last Crusade', 'Ready Player One', 'Bridge of Spies', 'Lincoln'] },
  // ---------- franchises ----------
  { id: 'lotr', emoji: '🧙', title: 'سرزمین میانه: ارباب حلقه‌ها و هابیت', desc: 'حماسه‌ی فانتزی جی.آر.آر. تالکین — سه‌گانه کامل + هابیت', titles: [
    'LOTR: Fellowship of the Ring', 'The Lord of the Rings: The Fellowship of the Ring', 'The Lord of the Rings: The Two Towers', 'LOTR: Return of the King',
    'The Lord of the Rings: The Return of the King',
    'The Hobbit: An Unexpected Journey', 'The Hobbit: The Desolation of Smaug', 'The Hobbit: The Battle of the Five Armies'] },
  { id: 'marvel', emoji: '🦸', title: 'دنیای سینمایی مارول', desc: 'اوج ابرقهرمانی — از انتقام‌جویان تا اسپایدرمن', titles: [
    'Iron Man', 'The Incredible Hulk', 'Iron Man 2', 'Thor', 'Captain America: The First Avenger', 'The Avengers', 'Iron Man 3', 'Thor: The Dark World',
    'Captain America: The Winter Soldier', 'Guardians of the Galaxy', 'Avengers: Age of Ultron', 'Ant-Man', 'Captain America: Civil War', 'Doctor Strange',
    'Guardians of the Galaxy Vol. 2', 'Spider-Man: Homecoming', 'Thor: Ragnarok', 'Black Panther', 'Avengers: Infinity War', 'Ant-Man and the Wasp',
    'Captain Marvel', 'Avengers: Endgame', 'Spider-Man: Far From Home', 'Black Widow', 'Shang-Chi and the Legend of the Ten Rings', 'Eternals',
    'Spider-Man: No Way Home', 'Doctor Strange in the Multiverse of Madness', 'Thor: Love and Thunder', 'Black Panther: Wakanda Forever',
    'Ant-Man and the Wasp: Quantumania', 'Guardians of the Galaxy Vol. 3', 'The Marvels', 'Deadpool & Wolverine'] },
  { id: 'dceu', emoji: '🛡️', title: 'دنیای DC', desc: 'از بتمن و سوپرمن تا واندر وومن — ابرقهرمانان تاریک', titles: [
    'Man of Steel', 'Batman v Superman: Dawn of Justice', 'Justice League', 'Zack Snyder\'s Justice League', 'Wonder Woman', 'Wonder Woman 1984',
    'Aquaman', 'Aquaman and the Lost Kingdom', 'Shazam!', 'Shazam! Fury of the Gods', 'The Flash', 'Blue Beetle', 'The Suicide Squad', 'Suicide Squad',
    'Birds of Prey', 'Joker', 'Joker: Folie à Deux', 'The Batman'] },
  { id: 'harrypotter', emoji: '🪄', title: 'دنیای جادویی هری پاتر', desc: 'هوگوارتز و ماجراهای هری — به همراه جانوران شگفت‌انگیز', titles: [
    'Harry Potter and the Sorcerer\'s Stone', 'Harry Potter and the Chamber of Secrets', 'Harry Potter and the Prisoner of Azkaban',
    'Harry Potter and the Goblet of Fire', 'Harry Potter and the Order of the Phoenix', 'Harry Potter and the Half-Blood Prince',
    'Harry Potter and the Deathly Hallows: Part 1', 'Harry Potter and the Deathly Hallows: Part 2',
    'Fantastic Beasts and Where to Find Them', 'Fantastic Beasts: The Crimes of Grindelwald', 'Fantastic Beasts: The Secrets of Dumbledore'] },
  { id: 'starwars', emoji: '🌟', title: 'جنگ ستارگان', desc: 'در یک کهکشان دور، دور... — تمام قسمت‌های افسانه', titles: [
    'Star Wars: Episode I - The Phantom Menace', 'Star Wars: Episode II - Attack of the Clones', 'Star Wars: Episode III - Revenge of the Sith',
    'Star Wars: Episode IV - A New Hope', 'Star Wars: The Empire Strikes Back', 'Star Wars: Episode V - The Empire Strikes Back', 'Star Wars: Episode VI - Return of the Jedi',
    'Star Wars: Episode VII - The Force Awakens', 'Rogue One: A Star Wars Story', 'Star Wars: Episode VIII - The Last Jedi',
    'Solo: A Star Wars Story', 'Star Wars: Episode IX - The Rise of Skywalker'] },
  { id: 'fastfurios', emoji: '🏎️', title: 'سریع و خشمگین', desc: 'خانواده، نیترو و مأموریت‌های ناممکن — همه قسمت‌ها', titles: [
    'The Fast and the Furious', '2 Fast 2 Furious', 'The Fast and the Furious: Tokyo Drift', 'Fast & Furious', 'Fast Five', 'Fast & Furious 6',
    'Furious 7', 'The Fate of the Furious', 'Fast & Furious Presents: Hobbs & Shaw', 'F9', 'Fast X'] },
  { id: 'missionimpossible', emoji: '🕶️', title: 'مأموریت غیرممکن', desc: 'اتان هانت و تیمش — آکروبات‌های واقعی تام کروز', titles: [
    'Mission: Impossible', 'Mission: Impossible 2', 'Mission: Impossible III', 'Mission: Impossible - Ghost Protocol',
    'Mission: Impossible - Rogue Nation', 'Mission: Impossible - Fallout', 'Mission: Impossible - Dead Reckoning Part One',
    'Mission: Impossible - The Final Reckoning', 'Mission: Impossible - Dead Reckoning'] },
  { id: 'jurassic', emoji: '🦖', title: 'دنیای ژوراسیک', desc: 'پارکی که هرگز امن نمی‌شود — از ۱۹۹۳ تا امروز', titles: [
    'Jurassic Park', 'The Lost World: Jurassic Park', 'Jurassic Park III', 'Jurassic World', 'Jurassic World: Fallen Kingdom', 'Jurassic World Dominion'] },
  { id: 'spiderman', emoji: '🕸️', title: 'مرد عنکبوتی', desc: 'از توبی مگوایر تا مایلز مورالس — هر سه جهان', titles: [
    'Spider-Man', 'Spider-Man 2', 'Spider-Man 3', 'The Amazing Spider-Man', 'The Amazing Spider-Man 2', 'Spider-Man: Homecoming',
    'Spider-Man: Far From Home', 'Spider-Man: No Way Home', 'Spider-Man: Into the Spider-Verse', 'Spider-Man: Across the Spider-Verse',
    'Venom', 'Venom: Let There Be Carnage'] },
  { id: 'johnwick', emoji: '🖊️', title: 'جان ویک', desc: 'بابا یگا برمی‌گردد — اکشن خالص با استایل', titles: [
    'John Wick', 'John Wick: Chapter 2', 'John Wick: Chapter 3 - Parabellum', 'John Wick: Chapter 4', 'Ballerina'] },
  { id: 'alien', emoji: '👽', title: 'فضاپیماهای الن', desc: 'ترس در فضا — از الن تا پرومیته', titles: [
    'Alien', 'Aliens', 'Alien³', 'Alien: Resurrection', 'Prometheus', 'Alien: Covenant', 'Alien: Romulus'] },
  { id: 'hungergames', emoji: '🏹', title: 'بازی‌های گرسنگی', desc: 'پانم، کتنیس و شورش — مجموعه کامل', titles: [
    'The Hunger Games', 'The Hunger Games: Catching Fire', 'The Hunger Games: Mockingjay - Part 1', 'The Hunger Games: Mockingjay - Part 2',
    'The Hunger Games: The Ballad of Songbirds & Snakes'] },
  { id: 'madmax', emoji: '🛻', title: 'مکس دیوانه', desc: 'بیابان آخرالزمانی و تعقیب و گریزهای افسانه‌ای', titles: [
    'Mad Max', 'Mad Max 2', 'Mad Max Beyond Thunderdome', 'Mad Max: Fury Road', 'Furiosa: A Mad Max Saga'] },
  { id: 'oceans', emoji: '🎰', title: 'حیله‌گران اوشن', desc: 'سرقت‌های شیک و تیم‌های غیرمنتظره', titles: [
    "Ocean's Eleven", "Ocean's Twelve", "Ocean's Thirteen", "Ocean's Eight", 'The Italian Job', 'Now You See Me', 'Now You See Me 2'] },
  { id: 'bourne', emoji: '🔐', title: 'جیسون بورن', desc: 'جاسوس فراری با حافظه گمشده — اکشن جاسوسی تمام‌عیار', titles: [
    'The Bourne Identity', 'The Bourne Supremacy', 'The Bourne Ultimatum', 'The Bourne Legacy', 'Jason Bourne'] },
  { id: 'xmen', emoji: '🧬', title: 'مردان ایکس', desc: 'جهان جهش‌یافته‌ها — از پروفسور ایکس تا ددپول', titles: [
    'X-Men', 'X2: X-Men United', 'X-Men: The Last Stand', 'X-Men: First Class', 'X-Men: Days of Future Past', 'X-Men: Apocalypse',
    'X-Men: Dark Phoenix', 'Logan', 'Deadpool', 'Deadpool 2', 'Deadpool & Wolverine', 'The New Mutants'] },
  { id: 'kingsman', emoji: '🌂', title: 'کینگزمن', desc: 'جاسوس‌های خوش‌پوش با وسایل فوق‌العاده', titles: [
    'Kingsman: The Secret Service', 'Kingsman: The Golden Circle', 'The King\'s Man', 'Argylle'] },
  { id: 'transformers', emoji: '🤖', title: 'ترنسفورمرز', desc: 'نبرد اتوبات‌ها و دیسپتیکون‌ها روی زمین', titles: [
    'Transformers', 'Transformers: Revenge of the Fallen', 'Transformers: Dark of the Moon', 'Transformers: Age of Extinction',
    'Transformers: The Last Knight', 'Bumblebee', 'Transformers: Rise of the Beasts'] },
  { id: 'despicable', emoji: '🍌', title: 'من و نامزد‌بازی (مینیون‌ها)', desc: 'گرو، مینیون‌های بامزه و ماجراهای خانوادگی', titles: [
    'Despicable Me', 'Despicable Me 2', 'Despicable Me 3', 'Despicable Me 4', 'Minions', 'Minions: The Rise of Gru'] },
  { id: 'pirates', emoji: '🏴‍☠️', title: 'دزدان دریایی کارائیب', desc: 'کاپیتان جک اسپارو و دریاهای افسانه‌ای', titles: [
    "Pirates of the Caribbean: The Curse of the Black Pearl", "Pirates of the Caribbean: Dead Man's Chest",
    "Pirates of the Caribbean: At World's End", "Pirates of the Caribbean: On Stranger Tides",
    "Pirates of the Caribbean: Dead Men Tell No Tales"] },
  { id: 'toystory', emoji: '🤠', title: 'داستان اسباب‌بازی', desc: 'وودی، باز لایتیر و دوستی جاودانه — مجموعه کامل', titles: [
    'Toy Story', 'Toy Story 2', 'Toy Story 3', 'Toy Story 4', 'Lightyear'] },
  { id: 'bond', emoji: '🍸', title: 'جیمز باند (دوره کریگ)', desc: '07 از کازینو رویال تا نه وقت بمیره', titles: [
    'Casino Royale', 'Quantum of Solace', 'Skyfall', 'Spectre', 'No Time to Die'] },
  { id: 'rocky', emoji: '🥊', title: 'راک و کریید', desc: 'حلقه بوکس، تیهوون و نسل جدید', titles: [
    'Rocky', 'Rocky II', 'Rocky III', 'Rocky IV', 'Rocky V', 'Rocky Balboa', 'Creed', 'Creed II', 'Creed III'] },
  { id: 'conjuring', emoji: '👻', title: 'دنیای احضار', desc: 'ترسناک‌ترین جهان مشترک سینما — آنابل، نان و...', titles: [
    'The Conjuring', 'The Conjuring 2', 'The Conjuring: The Devil Made Me Do It', 'Annabelle', 'Annabelle: Creation',
    'Annabelle Comes Home', 'The Nun', 'The Nun II', 'The Curse of La Llorona'] },
  { id: 'godzilla', emoji: '🦍', title: 'گودزیلا و کینگ کانگ', desc: 'هیولاهای تایتان بهم می‌رسند', titles: [
    'Godzilla', 'Kong: Skull Island', 'Godzilla: King of the Monsters', 'Godzilla vs. Kong', 'Godzilla x Kong: The New Empire'] },
  { id: 'pixar', emoji: '🎈', title: 'انیمیشن‌های پیکسار', desc: 'قصه‌هایی برای همه سنین با قلب بزرگ', titles: [
    'Toy Story', 'Finding Nemo', 'The Incredibles', 'Up', 'Inside Out', 'Inside Out 2', 'Coco', 'Soul', 'Luca', 'Turning Red', 'Elemental',
    'Monsters, Inc.', 'Ratatouille', 'WALL·E', 'Onward', 'Brave'] },
  { id: 'batman', emoji: '🦇', title: 'بتمن و شوالیه تاریکی', desc: 'از نولان تا پتینسون — مرد خفاشی', titles: [
    'Batman Begins', 'The Dark Knight', 'The Dark Knight Rises', 'The Batman', 'Batman', 'Batman Returns', 'Batman Forever', 'Batman & Robin', 'Joker'] },
  { id: 'matrix', emoji: '🤖', title: 'ماتریکس', desc: 'حقیقت را انتخاب کن — همه قسمت‌های ماتریکس', titles: [
    'The Matrix', 'The Matrix Reloaded', 'The Matrix Revolutions', 'The Matrix Resurrections'] },
  { id: 'backfuture', emoji: '⏰', title: 'بازگشت به آینده', desc: 'ماشین زمان دی‌لورین — سه‌گانه کلاسیک', titles: [
    'Back to the Future', 'Back to the Future Part II', 'Back to the Future Part III'] },
  { id: 'avatar', emoji: '🌍', title: 'آواتار و دنیای پندورا', desc: 'پرفروش‌ترین فیلم تاریخ و ادامه‌اش', titles: [
    'Avatar', 'Avatar: The Way of Water', 'Avatar: Fire and Ash'] },
  { id: 'dune', emoji: '🪱', title: 'تلماسه (دون)', desc: 'اراکیس، ادویه و سرنوشت — ویلنوو در اوج', titles: [
    'Dune', 'Dune: Part Two'] },
  // ---------- curated: genres / moods ----------
  { id: 'oscar', emoji: '🎭', title: 'برندگان اسکار بهترین فیلم', desc: 'شاهکارهایی که مجسمه طلایی را بردند', titles: [
    'Parasite', 'Oppenheimer', 'Everything Everywhere All at Once', 'The Shape of Water', 'Moonlight', 'Spotlight', 'Birdman', '12 Years a Slave', 'Argo',
    'The King\'s Speech', 'The Artist', 'The Hurt Locker', 'Slumdog Millionaire', 'No Country for Old Men', 'The Departed', 'Million Dollar Baby',
    'The Lord of the Rings: The Return of the King', 'Chicago', 'A Beautiful Mind', 'Gladiator', 'American Beauty', 'Titanic', 'Forrest Gump', 'Schindler\'s List',
    'The Silence of the Lambs', 'Rain Man', 'Platoon', 'Amadeus', 'Gandhi', 'Rocky', 'One Flew Over the Cuckoo\'s Nest', 'The Godfather', 'The Godfather Part II',
    'The Sting', 'Patton', 'Midnight Cowboy', 'Lawrence of Arabia', 'West Side Story', 'Ben-Hur', 'The Bridge on the River Kwai', 'Marty', 'On the Waterfront',
    'From Here to Eternity', 'An American in Paris', 'All About Eve', 'Casablanca', 'Gone with the Wind', 'It Happened One Night', 'Grand Hotel'] },
  { id: 'scifi', emoji: '🚀', title: 'علمی-تخیلی برتر', desc: 'سفر در زمان، فضا و ذهن — بهترین‌های ژانر', titles: [
    'Interstellar', 'Inception', 'The Matrix', 'Blade Runner 2049', 'Dune', 'Arrival', 'Ex Machina', 'The Martian', '2001: A Space Odyssey', 'Blade Runner',
    'Alien', 'Terminator 2: Judgment Day', 'Back to the Future', 'Edge of Tomorrow', 'Looper', 'Moon', 'District 9', 'Gattaca', 'Minority Report',
    'The Fifth Element', 'Gravity', 'The Prestige', 'Dune: Part Two'] },
  { id: 'anime', emoji: '🎌', title: 'انیمه و انیمیشن برتر', desc: 'بهترین‌های ژاپن و دنیا — از میازاکی تا ناروتو', titles: [
    'Your Name', 'Spirited Away', 'A Silent Voice', 'Demon Slayer: Kimetsu no Yaiba', 'One Piece', 'Naruto', 'Attack on Titan', 'Death Note',
    'Fullmetal Alchemist: Brotherhood', 'Jujutsu Kaisen', 'My Hero Academia', 'Tokyo Ghoul', 'Weathering with You', 'The Wind Rises', 'Princess Mononoke',
    'Howl\'s Moving Castle', 'Sword Art Online', 'Chainsaw Man', 'One Punch Man', 'Hunter x Hunter', 'The Lion King', 'Toy Story', 'Up', 'Finding Nemo', 'Coco', 'Soul', 'The Boy and the Heron'] },
  { id: 'comedy', emoji: '😂', title: 'کمدی‌های محبوب', desc: 'بخند با بهترین کمدی‌های سینما', titles: [
    'The Hangover', 'Superbad', 'Step Brothers', 'Bridesmaids', 'Ted', '21 Jump Street', 'The 40-Year-Old Virgin', 'Borat', 'Anchorman', 'The Grand Budapest Hotel',
    'Dumb and Dumber', 'Ace Ventura: Pet Detective', 'Bruce Almighty', 'The Mask', 'Liar Liar', 'Home Alone', 'Mrs. Doubtfire', 'Meet the Parents', 'Night at the Museum',
    'Paddington', 'The Intouchables', 'Grown Ups', 'Bad Boys', 'Rush Hour', 'The Proposal', 'Crazy Rich Asians', 'Knives Out'] },
  { id: 'thriller', emoji: '🔪', title: 'هیجان‌انگیز و معمایی', desc: 'مغزت را به چالش بکش — بهترین معمایی‌ها', titles: [
    'Se7en', 'Fight Club', 'Memento', 'Gone Girl', 'Zodiac', 'Prisoners', 'Shutter Island',
    'The Girl with the Dragon Tattoo', 'Gone Baby Gone', 'Mystic River', 'The Silence of the Lambs', 'Split', 'A Quiet Place', 'Get Out', 'Us', 'Oldboy', 'Saw'] },
  // ---------- auto genre packs ----------
  { id: 'g-action', emoji: '💥', title: 'پک اکشن', desc: 'محبوب‌ترین فیلم‌های اکشن تاریخ بر اساس رأی مخاطبان', genre: 'Action', n: 24 },
  { id: 'g-horror', emoji: '🎃', title: 'پک ترسناک', desc: 'خوب بترس... بهترین فیلم‌های ترسناک سینما', genre: 'Horror', n: 24 },
  { id: 'g-romance', emoji: '❤️', title: 'پک عاشقانه', desc: 'برای شب‌های دلتنگی — بهترین رمانتیک‌ها', genre: 'Romance', n: 24 },
  { id: 'g-crime', emoji: '💼', title: 'پک جنایی و مافیایی', desc: 'گنگسترها، سرقت‌ها و نقشه‌های بزرگ', genre: 'Crime', n: 24 },
  { id: 'g-adventure', emoji: '🧭', title: 'پک ماجراجویی', desc: 'سفرهایی که از صندلی‌ات نمی‌ریزی', genre: 'Adventure', n: 24 },
  { id: 'g-animation', emoji: '🎨', title: 'پک انیمیشن', desc: 'بهترین انیمیشن‌های سینما برای همه سنین', genre: 'Animation', n: 24 },
  { id: 'g-war', emoji: '🎖️', title: 'پک جنگی', desc: 'از نرماندی تا فالوجا — سینمای جنگ', genre: 'War', n: 20 },
  { id: 'g-western', emoji: '🤠', title: 'پک وسترن', desc: 'بیابان، شش‌لول و دوئل‌های ظهر روز', genre: 'Western', n: 20 },
  { id: 'g-fantasy', emoji: '🐉', title: 'پک فانتزی', desc: 'جادو، اژدها و دنیاهای دیگر', genre: 'Fantasy', n: 24 },
  { id: 'g-mystery', emoji: '🔍', title: 'پک رازآلود', desc: 'معما تا آخرین دقیقه حل نمی‌شود', genre: 'Mystery', n: 24 },
  // ---------- auto era/boxoffice packs ----------
  { id: 'new2024', emoji: '🆕', title: 'تازه‌های ۲۰۲۴ به بعد', desc: 'جدیدترین فیلم‌های دنیا که می‌توانی دانلود کنی', auto: 'new', n: 24 },
  { id: 'blockbuster', emoji: '💰', title: 'پرفروش‌ترین‌های گیشه تاریخ', desc: 'فیلم‌هایی که دنیا را به تماشای خود کشاندند', auto: 'boxoffice', n: 24 },
  { id: 'hidden', emoji: '💎', title: 'جواهرات پنهان', desc: 'امتیاز بالا ولی کمتر دیده‌شده — کشفشان کن', auto: 'hidden', n: 24 },
];

const out = [];
const unresolvedLog = [];
for (const d of DEFS) {
  let items;
  if (d.top) {
    items = DB.filter(t => t.tp === d.top).sort((a, b) => (b.v || 0) - (a.v || 0)).slice(0, d.n);
  } else if (d.genre) {
    items = byGenre(d.genre, d.n);
  } else if (d.auto === 'new') {
    items = DB.filter(t => t.tp === 'm' && (t.y || 0) >= 2024).sort((a, b) => (b.v || 0) - (a.v || 0)).slice(0, d.n);
  } else if (d.auto === 'boxoffice') {
    items = DB.filter(t => t.tp === 'm' && t.bo).map(t => ({ ...t, _bo: boxOfficeNum(t.bo) })).sort((a, b) => b._bo - a._bo).slice(0, d.n);
  } else if (d.auto === 'hidden') {
    items = DB.filter(t => t.tp === 'm' && (t.r || 0) >= 7.5 && (t.v || 0) >= 50000 && (t.v || 0) <= 400000)
      .sort((a, b) => (b.r || 0) - (a.r || 0)).slice(0, d.n);
  } else {
    const before = d.titles.length;
    items = resolve(d.titles);
    if (items.length < before) unresolvedLog.push(d.id + ': ' + (before - items.length) + ' unresolved');
  }
  if (!items.length) { console.log('SKIP (empty):', d.id); continue; }
  out.push({
    id: d.id, emoji: d.emoji, title: d.title, desc: d.desc,
    cover: pickCover(items),
    items: items.map(t => ({ i: t.i, t: t.t, y: t.y || 0, tp: t.tp, r: t.r || 0 }))
  });
}

const noCover = out.filter(c => !c.cover).map(c => c.id);
if (noCover.length) console.log('WARN no cover:', noCover.join(', '));

const dst = path.join(__dirname, '..', 'public', 'collections.json');
fs.writeFileSync(dst, JSON.stringify(out));
console.log('packs:', out.length, '| size:', (fs.statSync(dst).size / 1024).toFixed(1) + 'KB');
console.log('items per pack:', out.map(c => c.id + '=' + c.items.length).join(' '));
if (unresolvedLog.length) console.log('unresolved:\n  ' + unresolvedLog.join('\n  '));
console.log('written', dst);
