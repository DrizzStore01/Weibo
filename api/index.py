"""
WeiDL — Weibo Downloader
Backend Flask tipis yang men-serve halaman + jadi proxy ke API pihak ketiga
(alwayscodex) supaya panggilan dari browser tidak kena masalah CORS dan
API key/endpoint asli tidak perlu diekspos langsung ke client.
"""
import os
import requests
from flask import Flask, jsonify, render_template, request, Response
from urllib.parse import urlparse

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

app = Flask(
    __name__,
    static_folder=os.path.join(BASE_DIR, "static"),
    template_folder=os.path.join(BASE_DIR, "templates"),
)

UPSTREAM_URL = "https://api.alwayscodex.my.id/api/downloader/weibo"
REQUEST_TIMEOUT = 15  # detik

# Beberapa API scraping menolak request yang User-Agent-nya kelihatan
# seperti bot/script (mis. "python-requests/x.x" bawaan library requests).
# Header ini bikin request kita "menyamar" seperti dari browser mobile.
UPSTREAM_HEADERS = {
    "Content-Type": "application/json",
    "User-Agent": (
        "Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 "
        "(KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36"
    ),
    "Referer": "https://m.weibo.cn/",
    "Accept": "application/json, text/plain, */*",
}


@app.route("/")
def home():
    return render_template("index.html")


@app.route("/api/image")
def image_proxy():
    """
    Proxy untuk gambar dari CDN Weibo (sinaimg.cn) yang menerapkan hotlink
    protection berbasis Referer whitelist. Server kita yang mengambil
    gambarnya (dengan Referer yang sah), lalu meneruskan bytes-nya ke
    browser — supaya <img> di halaman kita bisa menampilkannya.

    Query params:
      - url: URL gambar asli (wajib)
      - download: "1" untuk memaksa unduhan (Content-Disposition: attachment)
    """
    url = request.args.get("url", "").strip()
    if not url:
        return jsonify({"ok": False, "error": "Parameter 'url' wajib diisi."}), 400

    parsed = urlparse(url)
    host = (parsed.hostname or "").lower()
    allowed = parsed.scheme == "https" and (host == "sinaimg.cn" or host.endswith(".sinaimg.cn"))
    if not allowed:
        return jsonify({"ok": False, "error": "Domain gambar tidak diizinkan."}), 400

    try:
        upstream = requests.get(
            url,
            headers={
                "Referer": "https://weibo.com/",
                "User-Agent": UPSTREAM_HEADERS["User-Agent"],
                "Accept": "image/avif,image/webp,image/apng,image/*,*/*;q=0.8",
            },
            timeout=REQUEST_TIMEOUT,
        )
        upstream.raise_for_status()
    except requests.exceptions.RequestException:
        return jsonify({"ok": False, "error": "Gagal mengambil gambar dari sumber."}), 502

    content_type = upstream.headers.get("Content-Type", "image/jpeg")
    resp = Response(upstream.content, content_type=content_type)
    resp.headers["Cache-Control"] = "public, max-age=86400"
    if request.args.get("download") == "1":
        filename = os.path.basename(parsed.path) or "weibo-image.jpg"
        resp.headers["Content-Disposition"] = f'attachment; filename="{filename}"'
    return resp


MAX_PROXY_VIDEO_BYTES = 4 * 1024 * 1024   # batas unduhan penuh sekali tarik (~4MB)
VIDEO_CHUNK_BYTES = 2 * 1024 * 1024       # ukuran potongan saat streaming/playback (~2MB)
VIDEO_REQUEST_TIMEOUT = 8  # detik, aman di bawah batas eksekusi function


def _parse_range_start(range_header):
    """Ambil offset awal dari header Range milik browser, mis. 'bytes=1048576-' -> 1048576."""
    if not range_header or not range_header.startswith("bytes="):
        return 0
    spec = range_header[len("bytes="):].split(",")[0]
    start_str = spec.split("-")[0].strip()
    return int(start_str) if start_str.isdigit() else 0


@app.route("/api/video")
def video_proxy():
    """
    Proxy video dari weibocdn.com (kena hotlink protection serupa sinaimg.cn).

    Untuk playback (tanpa ?download=1): selalu minta potongan kecil
    (VIDEO_CHUNK_BYTES) ke upstream sesuai offset yang diminta <video>,
    lalu teruskan sebagai 206 Partial Content. Dengan begini <video> akan
    otomatis minta potongan berikutnya sendiri saat playback berjalan —
    jadi TIDAK ada batas panjang video untuk pemutaran.

    Untuk unduhan (?download=1): coba ambil file penuh, dibatasi
    MAX_PROXY_VIDEO_BYTES supaya tidak melebihi batas respons hosting
    serverless gratis.
    """
    url = request.args.get("url", "").strip()
    if not url:
        return jsonify({"ok": False, "error": "Parameter 'url' wajib diisi."}), 400

    parsed = urlparse(url)
    host = (parsed.hostname or "").lower()
    allowed = parsed.scheme == "https" and (host == "weibocdn.com" or host.endswith(".weibocdn.com"))
    if not allowed:
        return jsonify({"ok": False, "error": "Domain video tidak diizinkan."}), 400

    is_download = request.args.get("download") == "1"
    headers = {
        "Referer": "https://weibo.com/",
        "User-Agent": UPSTREAM_HEADERS["User-Agent"],
    }

    if not is_download:
        start = _parse_range_start(request.headers.get("Range"))
        headers["Range"] = f"bytes={start}-{start + VIDEO_CHUNK_BYTES - 1}"

    try:
        upstream = requests.get(url, headers=headers, timeout=VIDEO_REQUEST_TIMEOUT, stream=True)
    except requests.exceptions.Timeout:
        return jsonify({"ok": False, "error": "Server terlalu lama mengambil video. Coba \"Lihat postingan asli\" saja."}), 504
    except requests.exceptions.RequestException:
        return jsonify({"ok": False, "error": "Gagal mengambil video dari sumber."}), 502

    if upstream.status_code not in (200, 206):
        return jsonify({"ok": False, "error": f"Server sumber video menolak permintaan ({upstream.status_code})."}), 502

    cap = MAX_PROXY_VIDEO_BYTES if is_download else (VIDEO_CHUNK_BYTES + 262144)
    content = bytearray()
    for chunk in upstream.iter_content(chunk_size=262144):
        content.extend(chunk)
        if len(content) >= cap:
            break
    upstream.close()

    if is_download and len(content) >= MAX_PROXY_VIDEO_BYTES:
        return jsonify({
            "ok": False,
            "error": "Video ini terlalu besar untuk diunduh lewat server (batas ~4MB di hosting gratis). Coba \"Lihat postingan asli di Weibo\" untuk unduh langsung.",
        }), 413

    resp = Response(
        bytes(content),
        status=upstream.status_code,
        content_type=upstream.headers.get("Content-Type", "video/mp4"),
    )
    resp.headers["Accept-Ranges"] = "bytes"
    if "Content-Range" in upstream.headers:
        resp.headers["Content-Range"] = upstream.headers["Content-Range"]
    resp.headers["Content-Length"] = str(len(content))
    resp.headers["Cache-Control"] = "public, max-age=3600"
    if is_download:
        filename = os.path.basename(parsed.path) or "weibo-video.mp4"
        resp.headers["Content-Disposition"] = f'attachment; filename="{filename}"'
    return resp


@app.route("/api/weibo")
def weibo_proxy():
    """
    Menerjemahkan query string dari frontend menjadi body JSON yang
    diminta oleh API alwayscodex, lalu meneruskan hasilnya apa adanya.

    Query params yang didukung:
      - mode: home | search | detail   (wajib)
      - since_id, page                 (untuk mode=home)
      - keyword, page                  (untuk mode=search)
      - id atau url                    (untuk mode=detail)
    """
    mode = request.args.get("mode", "home").strip()

    if mode == "home":
        payload = {
            "mode": "home",
            "since_id": request.args.get("since_id", "0"),
            "page": request.args.get("page", "1"),
        }
    elif mode == "search":
        keyword = request.args.get("keyword", "").strip()
        if not keyword:
            return jsonify({"ok": False, "error": "Parameter 'keyword' wajib diisi."}), 400
        payload = {
            "mode": "search",
            "keyword": keyword,
            "page": request.args.get("page", "1"),
        }
    elif mode == "detail":
        post_id = request.args.get("id", "").strip()
        url = request.args.get("url", "").strip()
        if not post_id and not url:
            return jsonify({"ok": False, "error": "Isi salah satu: 'id' atau 'url'."}), 400
        payload = {"mode": "detail"}
        if url:
            payload["url"] = url
        else:
            payload["id"] = post_id
    else:
        return jsonify({"ok": False, "error": f"Mode '{mode}' tidak dikenal."}), 400

    try:
        upstream = requests.post(
            UPSTREAM_URL, json=payload, headers=UPSTREAM_HEADERS, timeout=REQUEST_TIMEOUT
        )
        upstream.raise_for_status()
        return jsonify(upstream.json())
    except requests.exceptions.Timeout:
        return jsonify({"ok": False, "error": "Server sumber terlalu lama merespons. Coba lagi."}), 504
    except requests.exceptions.HTTPError as e:
        body_preview = (e.response.text or "")[:300]
        return jsonify({
            "ok": False,
            "error": f"Server sumber mengembalikan error ({e.response.status_code}).",
            "detail": body_preview,
        }), 502
    except (requests.exceptions.RequestException, ValueError) as e:
        return jsonify({"ok": False, "error": "Gagal menghubungi server sumber.", "detail": str(e)}), 502


# Entry point lokal (python api/index.py). Di Vercel, `app` diimpor langsung.
if __name__ == "__main__":
    app.run(debug=True, port=5000)
