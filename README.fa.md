# Zeth Code

<p align="center">
  <a href="https://github.com/ZethRise/ZethCode/releases/latest"><img alt="release" src="https://img.shields.io/github/v/release/ZethRise/ZethCode?label=release&logo=github&color=0b9bd7"></a>
  <a href="https://github.com/ZethRise/ZethCode/releases"><img alt="downloads" src="https://img.shields.io/github/downloads/ZethRise/ZethCode/total?label=downloads&logo=github&color=42c900"></a>
  <a href="https://github.com/ZethRise/ZethCode/actions/workflows/build.yml"><img alt="builds" src="https://img.shields.io/github/actions/workflow/status/ZethRise/ZethCode/build.yml?branch=master&label=release&logo=github&color=42c900"></a>
  <a href="./LICENSE"><img alt="license" src="https://img.shields.io/github/license/ZethRise/ZethCode?label=license&logo=github"></a>
  <a href="https://github.com/ZethRise/ZethCode/stargazers"><img alt="stars" src="https://img.shields.io/github/stars/ZethRise/ZethCode?label=Stars&logo=github"></a>
</p>

<p align="center"><strong>دستیار کدنویسی هوش مصنوعی، بومی ترمینال، برای جریان کاری توسعه‌دهندگان.</strong></p>

<p align="center">
  <a href="./README.md">English</a> | فارسی
</p>

Zeth Code یک فورک از [MiMo Code](https://github.com/XiaomiMiMo/MiMo-Code) است که با نام ZethRise منتشر می‌شود و همراه با بیلدهای آماده ویندوز و دستور `zeth` ارائه شده است. این پروژه همان جریان کاری ترمینال‌محور را نگه می‌دارد: خواندن و ویرایش کد، اجرای دستورها، مدیریت Git، حفظ حافظه پروژه بین نشست‌ها، و اتصال به ارائه‌دهنده‌های مدل سازگار با OpenAI.

MiMo Code خودش فورکی از [OpenCode](https://github.com/anomalyco/opencode) است. Zeth Code مشکلات MiMo Code را برطرف کرده و چند قابلیت تازه هم اضافه کرده است.

---

## تازه‌های v1.0.4

- ابزارهای بهتر برای TUI: دستورهای `/context` و `/tokens`، مدیریت کانتکست، بهبود پرامپت، اسکرول کامل گفتگو و ظاهر بهتر سایدبار Source Control.
- حافظه پروژه قوی‌تر: بررسی خودکار حافظه پروژه، نمایش trace حافظه، health check و reindex.
- پشتیبانی داخلی از Context7 MCP برای کانتکست مستندات تازه‌تر هنگام جست‌وجوی وب و بررسی داکیومنت‌های قدیمی.
- حالت workspace-less برای نشست‌هایی که به پوشه پروژه محلی نیاز ندارند.
- scaffold کانکتور همراه با رجیستری محلی در `.zethcode/connectors/registry.json`.
- رندر بهتر RTL/فارسی و پایداری بهتر providerها در ویندوز و backendهای سازگار با OpenAI.
- پشتیبانی از حذف نصب در ویندوز با `uninstall.ps1`.

---

## شروع سریع

نصب با npm:

```bash
npm install -g @zethrise/cli
zeth
```

نصب در ویندوز با PowerShell:

```powershell
irm https://raw.githubusercontent.com/ZethRise/ZethCode/master/install.ps1 | iex
```

نصب در Linux/macOS با curl:

```bash
curl -fsSL https://raw.githubusercontent.com/ZethRise/ZethCode/master/scripts/install | bash
```

یا فایل اجرایی مستقل ویندوز را از [صفحه انتشارها](https://github.com/ZethRise/ZethCode/releases/latest) دانلود کنید:

| بیلد | مناسب برای |
|------|------------|
| `zethcode-windows-x64.exe` | بیشتر کامپیوترهای مدرن Windows با پردازنده Intel/AMD |
| `zethcode-windows-x64-baseline.exe` | پردازنده‌های x64 قدیمی‌تر بدون پشتیبانی از دستورهای جدیدتر |
| `zethcode-windows-arm64.exe` | دستگاه‌های Windows on ARM |

آن را داخل ترمینال و در پوشه پروژه اجرا کنید:

```powershell
.\zethcode-windows-x64.exe
```

### Linux

فایل `.deb` یا `.AppImage` را از [صفحه انتشارها](https://github.com/ZethRise/ZethCode/releases/latest) دانلود کنید:

| بیلد | مناسب برای |
|------|------------|
| `zethcode-linux-x64.deb` / `.AppImage` | بیشتر کامپیوترهای مدرن Linux با پردازنده Intel/AMD |
| `zethcode-linux-arm64.deb` / `.AppImage` | دستگاه‌ها و سرورهای Linux ARM |

نصب فایل `.deb`:

```bash
sudo dpkg -i zethcode-linux-x64.deb
zeth
```

یا اجرای `.AppImage` بدون نیاز به root:

```bash
chmod +x zethcode-linux-x64.AppImage
./zethcode-linux-x64.AppImage
```

برای توسعه از سورس:

```bash
git clone https://github.com/ZethRise/ZethCode.git
cd ZethCode
bun install
bun dev
```

---

## قابلیت‌های اصلی

### TUI بومی ترمینال

Zeth Code داخل ترمینال اجرا می‌شود و برای نشست‌های کدنویسی ساخته شده؛ جایی که عامل هوش مصنوعی به کانتکست واقعی پروژه، فایل‌ها، شل و وضعیت Git نیاز دارد.

### چند عامل تخصصی

| عامل | توضیح |
|------|-------|
| `build` | عامل پیش‌فرض توسعه با امکان اجرای ابزارها |
| `plan` | حالت فقط‌خواندنی برای بررسی کد و طراحی راه‌حل |
| `compose` | حالت ارکستریشن برای جریان‌های کاری ساختاریافته و مبتنی بر skill |

### حافظه پایدار

حافظه پروژه کانتکست مهم را بین نشست‌ها نگه می‌دارد:

- قوانین پروژه و نکات معماری
- checkpoint نشست‌ها
- خطاها و نکات تکرارشونده
- پیشرفت تسک‌ها
- جست‌وجوی محلی با SQLite FTS5
- health check، reindex و نمایش trace حافظه در TUI

### ابزارهای توسعه محلی

عامل‌ها می‌توانند فایل‌ها را بررسی کنند، کد را ویرایش کنند، دستورهای ترمینال را اجرا کنند، با وضعیت Git کار کنند و مستقیماً از کانتکست workspace استفاده کنند.

### پشتیبانی از Providerها

می‌توانید از providerهای سازگار با OpenAI و تنظیمات مدل ایمپورت‌شده استفاده کنید. انتخاب provider و مدل داخل TUI انجام می‌شود تا بدون خروج از ترمینال جریان کاری را عوض کنید.

### MCPهای داخلی

Zeth Code پشتیبانی داخلی از MCP حافظه پروژه و Context7 MCP دارد تا نشست‌های کدنویسی کانتکست حافظه و مستندات بهتری داشته باشند.

### کنترل کانتکست

با ابزارهای کانتکست در TUI می‌توانید مصرف توکن را ببینید، کانتکست متصل‌شده را بررسی کنید و فایل‌ها یا پیام‌های قدیمی را بدون شروع دوباره نشست کم کنید.

### Workflow و Skill

Zeth Code معماری workflow و skill به‌ارث‌رسیده از MiMo Code را نگه داشته است، از جمله جریان‌های توسعه ساختاریافته، ارکستریشن compose و دستورالعمل‌های قابل استفاده مجدد برای تسک‌ها.

---

## استفاده از CLI

```bash
# اجرای TUI در workspace فعلی
zeth

# اجرای یک پرامپت تکی
zeth run "refactor this module and explain the change"

# شروع بدون پوشه پروژه محلی
zeth --no-project
zeth run --no-project "research this API and make a plan"

# مدیریت حافظه
zeth memory list
zeth memory add "prefer Bun APIs in this repository"
zeth memory search "Bun APIs"
zeth memory health
zeth memory reindex

# ساخت scaffold برای کانکتور
zeth connector create my-connector
```

---

## توسعه

```bash
bun install              # نصب وابستگی‌ها
bun dev                  # اجرای TUI توسعه
bun turbo typecheck      # بررسی تایپ همه packageها
```

ساخت فایل اجرایی محلی برای پلتفرم فعلی:

```bash
bun run --cwd packages/opencode script/build.ts --single
```

بیلدهای انتشار با `.github/workflows/build.yml` ساخته می‌شوند، شامل فایل‌های `.exe` ویندوز و فایل‌های `.deb`/`.AppImage` لینوکس.

---

## رابطه با MiMo Code

Zeth Code فورکی از [XiaomiMiMo/MiMo-Code](https://github.com/XiaomiMiMo/MiMo-Code) است. اعتبار هسته سیستم عامل ترمینالی، حافظه پایدار، workflowها، skillها، پشتیبانی از providerها و پایه TUI به پروژه MiMo Code برمی‌گردد.

---

## لایسنس

کد منبع تحت [MIT License](./LICENSE) منتشر شده است.

استفاده از این پروژه همچنین مشمول [Use Restrictions](./USE_RESTRICTIONS.md) است.
