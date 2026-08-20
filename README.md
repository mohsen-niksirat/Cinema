# 🎬 Movie Finder — دنیای فیلم و سریال

یک اپلیکیشن تک‌صفحه‌ای (SPA) برای جستجو و دانلود فیلم و سریال با بیش از **۵۰۰۰ فیلم** و **۲۰۰۰ سریال** با لینک دانلود مستقیم.

<div align="center">

![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)
![No Framework](https://img.shields.io/badge/No_Framework-纯_JS-6c5ce7?style=for-the-badge)

</div>

## ✨ ویژگی‌ها

### 📊 دیتابیس عظیم
- **۵۰۰۰ فیلم** برتر IMDb با لینک دانلود مستقیم
- **۲۰۰۰ سریال** با فصل‌ها و کیفیت‌های مختلف
- پشتیبانی از **SoftSub**، **Dubbed** و **HardSub**

### 🖼️ گرافیک حرفه‌ای
- نمایش **پوستر خودکار** از OMDB API
- امتیاز IMDb و تعداد رأی
- طراحی Netflix-مانند با Dark/Light theme

### 🔍 جستجو و فیلتر
- **سرچ لحظه‌ای** (real-time search)
- فیلتر بر اساس کیفیت (2160p, 1080p, 720p, 480p)
- مرتب‌سازی بر اساس امتیاز، سال، تعداد رأی، نام

### 📺 نمایش سریال‌ها
- نمایش فصل‌ها به صورت Accordion
- تفکیک SoftSub و Dubbed
- لینک دانلود مستقیم برای هر فصل و کیفیت

### 🔄 بروزرسانی خودکار
- کرال خودکار سرور برای فیلم‌ها و سریال‌های جدید
- کش localStorage برای سرعت بالا
- قابلیت کار آفلاین

## 🚀 نصب و استفاده

### روش ۱: مستقیم
فایل `index.html` را در مرورگر باز کنید. نیاز به هیچ سرور یا نصب خاصی نیست.

### روش ۲: GitHub Pages
1. ریپو را fork کنید
2. به **Settings > Pages** بروید
3. Source را روی `main branch` قرار دهید
4. لینک شما: `https://USERNAME.github.io/movie-finder/`

### روش ۳: سرور محلی
```bash
# با Python
python -m http.server 8000

# با Node.js
npx serve .

# با PHP
php -S localhost:8000
```

## 📁 ساختار پروژه

```
movie-finder/
├── index.html          # اپلیکیشن اصلی (تک‌فایل)
├── 1000.txt            # آرشیو سریال‌ها (اختیاری)
├── 5000.txt            # آرشیو فیلم‌ها (اختیاری)
├── README.md           # این فایل
└── LICENSE             # مجوز
```

## 🛠️ تکنولوژی‌ها

| تکنولوژی | کاربرد |
|---|---|
| **HTML5** | ساختار صفحه |
| **CSS3** | استایل‌دهی با CSS Variables |
| **Vanilla JS** | بدون فریمورک، خالص |
| **OMDB API** | اطلاعات و پوستر فیلم‌ها |
| **localStorage** | کش داده‌ها |
| **CORS Proxy** | دسترسی به سرورهای خارجی |

## 🎯 نحوه کار

```
┌─────────────────┐
│   صفحه باز میشه  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  داده‌های embed  │ ← ۵۰۰۰ فیلم + ۲۰۰۰ سریال (فوری)
│  بارگذاری میشه   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  کرال سرور      │ ← فیلم‌های جدید (پس‌زمینه)
│  (dls3/dls9)    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  OMDB API       │ ← پوستر و اطلاعات
│  پوستر لود میشه │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  کش localStorage│ ← دفعه بعد فوری
└─────────────────┘
```

## ⌨️ میانبرهای صفحه‌کلید

| کلید | عملکرد |
|---|---|
| `Space` | پخش/توقف |
| `→` | جلو ۵ ثانیه |
| `←` | عقب ۵ ثانیه |
| `↑` | افزایش صدا |
| `↓` | کاهش صدا |

## 📡 منابع داده

| منبع | نوع | توضیح |
|---|---|---|
| **dls2-dls9** | سرور دانلود | فیلم و سریال با کیفیت‌های مختلف |
| **OMDB API** | اطلاعات | پوستر، امتیاز، خلاصه، بازیگران |
| **IMDb** | مرجع | کد IMDb برای هر فیلم/سریال |

## 🔧 تنظیمات

### تغییر API Key OMDB
در فایل `index.html` خط زیر را پیدا کنید:
```javascript
const OMDB='https://www.omdbapi.com/?apikey=***';
```
کلید رایگان خود را از [omdbapi.com](https://www.omdbapi.com/apikey.aspx) دریافت و جایگزین کنید.

### اضافه کردن سرور جدید
در بخش `🗄️ منابع` اپلیکیشن، آدرس سرور جدید را وارد کنید.

## 📸 اسکرین‌شات

<div align="center">

> اسکرین‌شات‌ها را اینجا اضافه کنید

</div>

## 🤝 مشارکت

مشارکت‌ها خوش آمدند! برای تغییرات بزرگ، لطفاً ابتدا یک issue ایجاد کنید.

1. پروژه را fork کنید
2. شاخه جدید بسازید: `git checkout -b feature/amazing-feature`
3. تغییرات را commit کنید: `git commit -m 'Add amazing feature'`
4. Push کنید: `git push origin feature/amazing-feature`
5. Pull Request باز کنید

## 📝 چangelog

### v1.0.0 (2026-07-28)
- ✅ انتشار اولیه
- ✅ ۵۰۰۰ فیلم + ۲۰۰۰ سریال
- ✅ نمایش فصل‌ها و کیفیت‌ها
- ✅ پوستر خودکار
- ✅ سرچ لحظه‌ای
- ✅ مرتب‌سازی و فیلتر
- ✅ کرال خودکار سرور
- ✅ Dark/Light theme
- ✅ ریسپانسیو

## ⚖️ مجوز

این پروژه تحت مجوز [MIT](LICENSE) منتشر شده است.

## 🙏 تشکر

- [OMDB API](https://www.omdbapi.com/) برای اطلاعات فیلم‌ها
- [DonyayeSerial](https://t.me/donyayeserialtel) برای آرشیو فیلم و سریال
- [Font Awesome](https://fontawesome.com/) برای آیکون‌ها

---

<div align="center">

**ساخته شده با ❤️ نیک‌ سیرت**

[![GitHub followers](https://img.shields.io/github/followers/niksiratforex-ux?style=social)](https://github.com/niksiratforex-ux)

</div>
