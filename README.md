# 🎬 دنیای فیلم و سریال

یک اپلیکیشن تک‌صفحه‌ای (SPA) فارسی برای جستجو، دانلود و معرفی فیلم و سریال — بیش از **۵۰۰۰ فیلم** و **۲۰۰۰ سریال** با لینک دانلود مستقیم، بدون نیاز به سرور.

<div align="center">

![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)
![PWA](https://img.shields.io/badge/PWA-Yes-5A0FC8?style=for-the-badge)

</div>

## ✨ امکانات

### 📂 چهار تب اصلی
- **🎬 فیلم‌ها** — بیش از ۵۰۰۰ فیلم با لینک دانلود (زیرنویس / دوبله، تفکیک‌شده)
- **📺 سریال‌ها** — بیش از ۲۰۰۰ سریال با گروه‌بندی فصل‌ها
- **🎬 سرمووی** — عنوان‌های جدیدی که روزانه کرال می‌شوند
- **⭐ معرفی** — مجموعه‌های دسته‌بندی‌شده (نولان، تارانتینو، مارول، هری‌پاتر، برترین‌های IMDb و…)؛ هر مجموعه فهرست کامل فیلم‌ها را با پوستر، خلاصه داستان و لینک دانلود نشان می‌دهد

### 🖱️ پاپ‌آپ جزئیات (کلیک روی هر کارت)
- پوستر، امتیاز IMDb، تعداد رأی، سال و نوع
- **خلاصه داستان، کارگردان، بازیگران، جوایز، ژانر، کشور و…** — از دو منبع:
  - **سینما اسکور** (`mohsen-niksirat.github.io/CineScore/public/db.json`) — داده‌ی غنی‌شده‌ی کرالر شبانه (شامل امتیاز Rotten Tomatoes و Metacritic)
  - **OMDb API** — به‌عنوان fallback
- **لینک‌های دانلود** با تفکیک 🔵 زیرنویس / 🔴 دوبله / فصل‌ها + دکمه کپی لینک
- دکمه‌های **IMDb** و **تحلیل در سینما اسکور**

### 🖼️ کارت‌ها
- پوستر خودکار (OMDb / سینما اسکور)
- خلاصه داستان (دو خط) روی هر کارت
- کیفیت‌ها، امتیاز، رأی و تعداد فصل

### 🔍 جستجو و فیلتر
- جستجوی لحظه‌ای (نام، کد IMDb، سال، امتیاز)
- فیلتر کیفیت (2160p / 1080p / 720p / 480p) + مرتب‌سازی (امتیاز، سال، رأی، نام)

### 🔄 بروزرسانی خودکار (GitHub Actions)
- کرالر شبانه (`scripts/crawl.js`) داده‌ها را از سرورهای دانلود جمع می‌کند و `public/db.json` را به‌روز نگه می‌دارد
- PWA حرفه‌ای: آیکون‌های PNG اختصاصی (192/512/maskable)، بنر نصب، راهنمای iOS، میانبرهای برنامه و استفاده آفلاین

## 🚀 اجرا

### روش ۱: GitHub Pages
فقط کافیست ریپو را push کنید؛ با GitHub Pages روی `main` قابل استفاده است.

### روش ۲: سرور محلی
```bash
python -m http.server 8000
# یا
npx serve .
```

## 📁 ساختار

```
├── index.html              # اپلیکیشن اصلی (تک‌فایل)
├── manifest.json / sw.js   # PWA
├── public/
│   ├── archive.json        # آرشیو کامل (روی سرور)
│   ├── db.json             # خروجی کرالر (db جدید)
│   └── collections.json    # مجموعه‌های تب «معرفی»
├── scripts/
│   ├── crawl.js            # کرالر GitHub Actions
│   ├── build_collections.js# ساخت مجموعه‌های معرفی
│   └── collections.json    # تعریف مجموعه‌ها
└── .github/workflows/crawl.yml
```

## 🔧 تنظیمات

- **کلید OMDb**: در `index.html` در تابع `getOmdb` تعریف شده است (متغیر `apikey`).
- **لینک سینما اسکور**: در تابع `openCineScore` — به‌صورت پیش‌فرض به `https://mohsen-niksirat.github.io/CineScore/` لینک می‌دهد.

## ⚖️ مجوز

MIT — ساخته شده با ❤️

<div align="center">

**ساخته شده با ❤️ نیک‌سیرت**

</div>
