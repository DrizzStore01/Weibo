"""
WeiDL — Weibo Downloader
Backend Flask tipis yang men-serve halaman + jadi proxy ke API pihak ketiga
(alwayscodex) supaya panggilan dari browser tidak kena masalah CORS dan
API key/endpoint asli tidak perlu diekspos langsung ke client.
"""
import os
import requests
from flask import Flask, jsonify, render_template, request

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

app = Flask(
    __name__,
    static_folder=os.path.join(BASE_DIR, "static"),
    template_folder=os.path.join(BASE_DIR, "templates"),
)

UPSTREAM_URL = "https://api.alwayscodex.my.id/api/downloader/weibo"
REQUEST_TIMEOUT = 15  # detik


@app.route("/")
def home():
    return render_template("index.html")


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
        upstream = requests.post(UPSTREAM_URL, json=payload, timeout=REQUEST_TIMEOUT)
        upstream.raise_for_status()
        return jsonify(upstream.json())
    except requests.exceptions.Timeout:
        return jsonify({"ok": False, "error": "Server sumber terlalu lama merespons. Coba lagi."}), 504
    except requests.exceptions.HTTPError as e:
        return jsonify({"ok": False, "error": f"Server sumber mengembalikan error ({e.response.status_code})."}), 502
    except (requests.exceptions.RequestException, ValueError) as e:
        return jsonify({"ok": False, "error": "Gagal menghubungi server sumber.", "detail": str(e)}), 502


# Entry point lokal (python api/index.py). Di Vercel, `app` diimpor langsung.
if __name__ == "__main__":
    app.run(debug=True, port=5000)
