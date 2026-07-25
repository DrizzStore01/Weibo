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

## Bentuk data API (sudah terkonfirmasi)

```
{
  attribution, mode, status, timestamp,
  result: <item>      // mode=detail
  result: <item[]>    // mode=home / mode=search (asumsi, belum ada contoh nyata)
}

item = {
  id, created_at, location, device,
  author: { id, name, avatar, description, followers, verified_reason },
  content: { text, is_repost },
  media: {
    type,              // "video" | dll
    images: [url, ...],
    video: {
      cover_url, duration_str, duration_seconds, views,
      mp4_720p, mp4_hd, mp4_ld, mp4_url, original_page
    }
  },
  stats: { reposts, comments, likes },
  original_post_url
}
```

Catatan: field `mp4_720p` / `mp4_hd` / `mp4_ld` / `mp4_url` kadang berisi
URL yang **sama persis** — `app.js` sudah menghilangkan duplikatnya
otomatis (fungsi `normalizeMblog`) supaya tidak ada tombol unduh ganda.
Link video juga signed URL dengan masa berlaku terbatas (`Expires=...`),
makanya modal detail selalu fetch ulang `mode=detail` saat sebuah kartu
diklik, bukan memakai data dari list yang mungkin sudah agak lama.

Kalau ternyata `mode=home`/`mode=search` punya bentuk `result` yang beda
(bukan array langsung), kirim contoh JSON mentahnya (lewat tombol
**"Lihat data mentah (debug)"** di modal, atau screenshot) dan saya
sesuaikan `extractMblogList` di `static/js/app.js`.

## Fitur

- **Smart search**: satu kolom pencarian yang otomatis mendeteksi apakah
  yang diketik adalah kata kunci, link `m.weibo.cn`, atau ID postingan.
- **Feed trending** (`mode=home`) dengan tombol "Muat Lebih Banyak".
- **Pencarian** (`mode=search`).
- **Modal detail** (`mode=detail`) dengan link unduhan untuk tiap foto
  dan tiap kualitas video yang tersedia.
