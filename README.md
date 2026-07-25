# WeiDL — Weibo Downloader

Web sederhana untuk menjelajahi feed trending Weibo, mencari postingan, dan
mengambil link unduhan video/foto. Dibangun dengan Flask (proxy API +
serve halaman) dan vanilla JS di sisi frontend, mengikuti desain di
`DESIGN.md`.

## Menjalankan di lokal

```bash
pip install -r requirements.txt
python api/index.py
# buka http://localhost:5000
```

## Deploy ke Vercel

```bash
vercel
```

`vercel.json` sudah diatur supaya semua request masuk ke `api/index.py`
(Flask), kecuali file statis di folder `static/`.

## Struktur

```
api/index.py        -> Flask app + proxy ke API alwayscodex
templates/index.html-> markup halaman
static/css/style.css-> seluruh design token dari DESIGN.md
static/js/app.js    -> fetch data, render kartu, modal detail, smart search
```

## ⚠️ Catatan penting soal bentuk data API

Saya tidak punya akses internet di lingkungan kerja saat membuat proyek
ini, jadi saya **tidak bisa memanggil API alwayscodex secara langsung**
untuk melihat bentuk JSON aslinya. Kode di `static/js/app.js`
(fungsi `extractMblogList`, `extractSingleMblog`, `normalizeMblog`)
ditulis defensif — mencoba beberapa struktur field yang lazim dipakai
wrapper `m.weibo.cn` (mis. `data.cards[].mblog`, `data.statuses[]`,
field seperti `pics`, `page_info.media_info.stream_url`, dst).

Kalau setelah dicoba ternyata field-nya beda dari yang saya tebak:
1. Buka modal detail sebuah postingan, klik **"Lihat data mentah (debug)"**
   untuk melihat JSON asli dari API.
2. Kirim contoh JSON itu ke saya (atau tempel di sini), saya sesuaikan
   fungsi parsing-nya.

## Fitur

- **Smart search**: satu kolom pencarian yang otomatis mendeteksi apakah
  yang diketik adalah kata kunci, link `m.weibo.cn`, atau ID postingan.
- **Feed trending** (`mode=home`) dengan tombol "Muat Lebih Banyak".
- **Pencarian** (`mode=search`).
- **Modal detail** (`mode=detail`) dengan link unduhan untuk tiap foto
  dan tiap kualitas video yang tersedia.
