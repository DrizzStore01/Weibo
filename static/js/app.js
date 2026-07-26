(function () {
  "use strict";

  /* ---------------------------------------------------------
     Helpers
     --------------------------------------------------------- */
  const $ = (sel, ctx) => (ctx || document).querySelector(sel);
  const $$ = (sel, ctx) => Array.from((ctx || document).querySelectorAll(sel));

  function stripHtml(str) {
    if (!str) return "";
    const el = document.createElement("div");
    el.innerHTML = str;
    return (el.textContent || el.innerText || "").trim();
  }

  function formatCount(n) {
    n = Number(n) || 0;
    if (n >= 10000) return (n / 10000).toFixed(1).replace(/\.0$/, "") + "rb";
    if (n >= 1000) return (n / 1000).toFixed(1).replace(/\.0$/, "") + "k";
    return String(n);
  }

  // Format asli dari API: "Sun Nov 19 22:58:58 +0800 2023"
  function parseWeiboDate(raw) {
    if (!raw) return null;
    const m = /^\w+\s+(\w+)\s+(\d{1,2})\s+(\d{2}:\d{2}:\d{2})\s+([+-]\d{4})\s+(\d{4})$/.exec(raw.trim());
    if (m) {
      const [, month, day, time, offset, year] = m;
      const d = new Date(`${month} ${day} ${year} ${time} GMT${offset}`);
      if (!isNaN(d.getTime())) return d;
    }
    const fallback = new Date(raw);
    return isNaN(fallback.getTime()) ? null : fallback;
  }

  function formatDate(d) {
    if (!d) return "";
    return d.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
  }

  // Gambar dari sinaimg.cn diblokir kalau di-embed langsung dari domain lain
  // (hotlink protection). Alihkan lewat proxy backend kita.
  function proxyImage(url, download) {
    if (!url) return url;
    if (!/sinaimg\.cn/i.test(url)) return url; // domain lain (mis. weibocdn.com) biarkan langsung
    const params = new URLSearchParams({ url });
    if (download) params.set("download", "1");
    return "/api/image?" + params.toString();
  }

  // Video dari weibocdn.com juga kena hotlink protection — alihkan lewat proxy backend.
  function proxyVideo(url, download) {
    if (!url) return url;
    if (!/weibocdn\.com/i.test(url)) return url;
    const params = new URLSearchParams({ url });
    if (download) params.set("download", "1");
    return "/api/video?" + params.toString();
  }

  function avatarPlaceholder(name) {
    const letter = ((name || "?").trim().charAt(0) || "?").toUpperCase();
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64"><rect width="64" height="64" rx="32" fill="#8B5CF6"/><text x="32" y="42" font-family="Plus Jakarta Sans, sans-serif" font-size="28" font-weight="700" fill="#ffffff" text-anchor="middle">${letter}</text></svg>`;
    return "data:image/svg+xml;utf8," + encodeURIComponent(svg);
  }

  function showAlert(message, type) {
    const stack = $("#alertStack");
    const el = document.createElement("div");
    el.className = "alert alert--" + (type || "error");
    el.textContent = message;
    stack.appendChild(el);
    setTimeout(() => {
      el.style.opacity = "0";
      el.style.transition = "opacity .2s ease";
      setTimeout(() => el.remove(), 220);
    }, 4200);
  }

  /* ---------------------------------------------------------
     Normalisasi respons alwayscodex.

     Bentuk asli (dikonfirmasi dari respons nyata API):
     {
       attribution, mode, status, timestamp,
       result: <item> untuk mode=detail, atau <item[]> untuk mode=home/search
     }
     item = {
       id, created_at, location, device,
       author: { id, name, avatar, description, followers, verified_reason },
       content: { text, is_repost },
       media: { type, images: [url...], video: { cover_url, duration_str,
                 duration_seconds, views, mp4_720p, mp4_hd, mp4_ld, mp4_url,
                 original_page } },
       stats: { reposts, comments, likes },
       original_post_url
     }
     --------------------------------------------------------- */
  function extractMblogList(json) {
    if (Array.isArray(json && json.data)) return json.data;
    const result = json && json.result;
    if (Array.isArray(result)) return result;
    if (result && Array.isArray(result.list)) return result.list;
    if (result && Array.isArray(result.items)) return result.items;
    return [];
  }

  function extractSingleMblog(json) {
    const result = json && json.result;
    if (!result) return null;
    if (Array.isArray(result)) return result[0] || null;
    return result;
  }

  function normalizeMblog(item) {
    const author = item.author || {};
    const content = item.content || {};
    const media = item.media || {};
    const video = media.video || {};
    const stats = item.stats || {};

    const images = Array.isArray(media.images) ? media.images : [];
    const pics = images.map((url) => ({ thumb: url, large: url }));

    const isVideo = media.type === "video" || !!video.mp4_url || !!video.mp4_hd;

    const candidates = [
      { label: "720p", url: video.mp4_720p },
      { label: "HD", url: video.mp4_hd },
      { label: "SD", url: video.mp4_ld },
      { label: "Video", url: video.mp4_url },
    ].filter((v) => v.url);
    const seen = new Set();
    const videoSources = [];
    candidates.forEach((v) => {
      if (!seen.has(v.url)) { seen.add(v.url); videoSources.push(v); }
    });
    if (videoSources.length === 1) videoSources[0].label = "Kualitas terbaik";

    return {
      id: item.id || "",
      name: author.name || "Tanpa nama",
      avatar: author.avatar || "",
      verified: !!author.verified_reason,
      date: parseWeiboDate(item.created_at),
      location: item.location || "",
      text: stripHtml(content.text || ""),
      pics,
      isVideo,
      videoSources,
      videoCover: video.cover_url || (pics[0] && pics[0].thumb) || "",
      durationStr: video.duration_str || "",
      views: video.views || "",
      reposts: stats.reposts || 0,
      comments: stats.comments || 0,
      likes: stats.likes || 0,
      originalUrl: item.original_post_url || "",
    };
  }

  /* ---------------------------------------------------------
     State
     --------------------------------------------------------- */
  const DONGHUA_KEYWORD = "国漫"; // istilah Weibo untuk animasi produksi Tiongkok (donghua)

  const state = {
    mode: "search",
    page: 1,
    sinceId: "0",
    keyword: DONGHUA_KEYWORD,
    loading: false,
  };

  const feedTitle = $("#feedTitle");
  const feedSubtitle = $("#feedSubtitle");
  const cardGrid = $("#cardGrid");
  const loadMoreBtn = $("#loadMoreBtn");
  const cardTpl = $("#cardTemplate");
  const skeletonTpl = $("#skeletonTemplate");

  /* ---------------------------------------------------------
     Navbar & mobile menu
     --------------------------------------------------------- */
  const navbar = $("#navbar");
  window.addEventListener("scroll", () => {
    navbar.classList.toggle("is-scrolled", window.scrollY > 8);
  }, { passive: true });

  const menuToggle = $("#menuToggle");
  const navLinks = $("#navLinks");
  menuToggle.addEventListener("click", () => {
    const open = navLinks.classList.toggle("is-open");
    menuToggle.setAttribute("aria-expanded", String(open));
  });
  $$(".nav-link").forEach((a) => a.addEventListener("click", () => {
    navLinks.classList.remove("is-open");
    menuToggle.setAttribute("aria-expanded", "false");
  }));

  /* ---------------------------------------------------------
     Smart search: deteksi keyword vs link vs ID
     --------------------------------------------------------- */
  const searchForm = $("#smartSearchForm");
  const searchInput = $("#smartSearchInput");
  const searchIcon = $("#smartSearchIcon");
  const searchHint = $("#smartSearchHint");

  const linkIconSvg = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l2-2a5 5 0 0 0-7.07-7.07l-1.14 1.13"/><path d="M14 11a5 5 0 0 0-7.54-.54l-2 2a5 5 0 0 0 7.07 7.07l1.14-1.13"/></svg>';
  const searchIconSvg = searchIcon.innerHTML;

  function classifyInput(raw) {
    const v = raw.trim();
    if (/^https?:\/\//i.test(v)) return "url";
    if (/^\d{6,}$/.test(v)) return "id";
    return "keyword";
  }

  searchInput.addEventListener("input", () => {
    const kind = classifyInput(searchInput.value);
    if (kind === "keyword") {
      searchIcon.innerHTML = searchIconSvg;
      searchIcon.classList.remove("is-link");
      searchHint.textContent = "Ketik apa saja — WeiDL otomatis mendeteksi apakah itu kata kunci atau link/ID postingan.";
    } else {
      searchIcon.innerHTML = linkIconSvg;
      searchIcon.classList.add("is-link");
      searchHint.textContent = kind === "url"
        ? "Terdeteksi sebagai link postingan — akan langsung dibuka detailnya."
        : "Terdeteksi sebagai ID postingan — akan langsung dibuka detailnya.";
    }
  });

  searchForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const raw = searchInput.value.trim();
    if (!raw) return;
    const kind = classifyInput(raw);
    if (kind === "url") {
      openDetail({ url: raw });
    } else if (kind === "id") {
      openDetail({ id: raw });
    } else {
      state.mode = "search";
      state.keyword = raw;
      state.page = 1;
      setActiveTab(null);
      feedTitle.textContent = `Hasil pencarian: "${raw}"`;
      feedSubtitle.textContent = "Postingan yang cocok dengan kata kunci kamu";
      loadFeed(true);
      $("#trending").scrollIntoView({ behavior: "smooth", block: "start" });
    }
  });

  /* ---------------------------------------------------------
     Fetch feed (home / search) dengan pagination
     --------------------------------------------------------- */
  async function loadFeed(reset) {
    if (state.loading) return;
    state.loading = true;
    loadMoreBtn.disabled = true;
    loadMoreBtn.textContent = "Memuat…";

    if (reset) {
      cardGrid.innerHTML = "";
      renderSkeletons(6);
    }

    const params = new URLSearchParams();
    params.set("mode", state.mode);
    params.set("page", String(state.page));
    if (state.mode === "home") params.set("since_id", state.sinceId);
    if (state.mode === "search") params.set("keyword", state.keyword);

    let json;
    try {
      const res = await fetch("/api/weibo?" + params.toString());
      json = await res.json();

      clearSkeletons();

      // Error dari backend Flask kita sendiri (400/502/504) -> bentuk {ok:false, error}
      if (!res.ok) {
        throw new Error(json.error || "Gagal memuat data.");
      }
      // Kegagalan logis dari API upstream walau HTTP 200 -> bentuk {status:false, ...}
      if (json.status === false) {
        throw new Error(json.message || json.error || "Tidak ada hasil untuk permintaan ini.");
      }

      const list = extractMblogList(json).map(normalizeMblog);

      if (json._translated_keyword && state.mode === "search") {
        feedTitle.textContent = `Hasil pencarian: "${json._original_keyword}"`;
        feedSubtitle.textContent = `Diterjemahkan ke: ${json._translated_keyword}`;
      }

      if (reset) cardGrid.innerHTML = "";

      if (!list.length && reset) {
        renderEmptyState(json);
        loadMoreBtn.hidden = true;
      } else {
        list.forEach(renderCard);
        loadMoreBtn.hidden = list.length < 5; // heuristik: hasil sedikit -> kemungkinan halaman terakhir
      }
    } catch (err) {
      clearSkeletons();
      if (reset) renderErrorState(err.message, json);
      showAlert(err.message || "Terjadi kesalahan saat memuat data.", "error");
    } finally {
      state.loading = false;
      loadMoreBtn.disabled = false;
      loadMoreBtn.textContent = "Muat Lebih Banyak";
    }
  }

  loadMoreBtn.addEventListener("click", () => {
    state.page += 1;
    loadFeed(false);
  });

  const tabDonghua = $("#tabDonghua");
  const tabTrending = $("#tabTrending");

  function setActiveTab(tab) {
    tabDonghua.classList.toggle("is-active", tab === "donghua");
    tabTrending.classList.toggle("is-active", tab === "trending");
  }

  tabDonghua.addEventListener("click", () => {
    state.mode = "search";
    state.keyword = DONGHUA_KEYWORD;
    state.page = 1;
    setActiveTab("donghua");
    feedTitle.textContent = "Donghua";
    feedSubtitle.textContent = "Postingan donghua (国漫) yang lagi ramai di Weibo";
    loadFeed(true);
  });

  tabTrending.addEventListener("click", () => {
    state.mode = "home";
    state.page = 1;
    state.sinceId = "0";
    setActiveTab("trending");
    feedTitle.textContent = "Sedang Trending";
    feedSubtitle.textContent = "Postingan yang lagi ramai dibicarakan di Weibo (semua topik)";
    loadFeed(true);
  });

  /* ---------------------------------------------------------
     Render: skeleton / kartu / empty / error
     --------------------------------------------------------- */
  function renderSkeletons(count) {
    for (let i = 0; i < count; i++) {
      const node = skeletonTpl.content.cloneNode(true);
      cardGrid.appendChild(node);
    }
  }
  function clearSkeletons() {
    $$(".skeleton-card", cardGrid).forEach((n) => n.remove());
  }

  function attachRawJsonDebug(container, json) {
    if (!json) return;
    const toggle = document.createElement("button");
    toggle.type = "button";
    toggle.className = "raw-json-toggle";
    toggle.style.margin = "0 auto";
    toggle.textContent = "Lihat data mentah (debug)";
    const pre = document.createElement("pre");
    pre.className = "raw-json";
    pre.hidden = true;
    pre.style.textAlign = "left";
    pre.textContent = JSON.stringify(json, null, 2);
    toggle.addEventListener("click", () => { pre.hidden = !pre.hidden; });
    container.appendChild(toggle);
    container.appendChild(pre);
  }

  function renderEmptyState(json) {
    const div = document.createElement("div");
    div.className = "empty-state";
    div.innerHTML = "<h3>Tidak ada hasil</h3><p>Coba kata kunci lain, atau tempel link postingan langsung.</p>";
    cardGrid.appendChild(div);
    attachRawJsonDebug(div, json);
  }
  function renderErrorState(message, json) {
    const div = document.createElement("div");
    div.className = "error-state";
    div.innerHTML = "<h3>Gagal memuat</h3><p></p>";
    div.querySelector("p").textContent = message || "Terjadi kesalahan. Coba muat ulang.";
    cardGrid.appendChild(div);
    attachRawJsonDebug(div, json);
  }

  function renderCard(post) {
    const node = cardTpl.content.cloneNode(true);
    const mediaWrap = $(".post-card__media", node);
    const thumb = $(".post-card__thumb", node);
    const badge = $(".post-card__badge", node);

    const thumbUrl = post.isVideo ? post.videoCover : (post.pics[0] && post.pics[0].thumb);
    if (thumbUrl) {
      thumb.src = proxyImage(thumbUrl);
      thumb.alt = post.text ? post.text.slice(0, 80) : "Media Weibo";
      thumb.onerror = () => { mediaWrap.setAttribute("data-empty", ""); thumb.onerror = null; };
    } else {
      mediaWrap.setAttribute("data-empty", "");
    }
    if (post.isVideo) {
      badge.hidden = false;
      badge.textContent = post.durationStr ? `Video · ${post.durationStr}` : "Video";
    }

    const avatar = $(".post-card__avatar", node);
    avatar.src = post.avatar ? proxyImage(post.avatar) : avatarPlaceholder(post.name);
    avatar.alt = post.name;
    avatar.onerror = () => { avatar.onerror = null; avatar.src = avatarPlaceholder(post.name); };

    const nameEl = $(".post-card__name", node);
    nameEl.textContent = post.name + (post.verified ? " ✓" : "");
    if (post.verified) nameEl.title = "Akun terverifikasi";

    const dateParts = [formatDate(post.date), post.location].filter(Boolean);
    $(".post-card__date", node).textContent = dateParts.join(" · ");
    $(".post-card__text", node).textContent = post.text || "(tanpa teks)";

    $(".post-card__stat--repost", node).textContent = "↻ " + formatCount(post.reposts);
    $(".post-card__stat--comment", node).textContent = "💬 " + formatCount(post.comments);
    $(".post-card__stat--like", node).textContent = "♥ " + formatCount(post.likes);

    const openHandler = () => openDetail({ id: post.id, preloaded: post });
    $(".post-card__media-btn", node).addEventListener("click", openHandler);
    $(".post-card__cta", node).addEventListener("click", openHandler);

    cardGrid.appendChild(node);
  }

  /* ---------------------------------------------------------
     Modal detail
     --------------------------------------------------------- */
  const overlay = $("#modalOverlay");
  const modalBody = $("#modalBody");

  function closeModal() {
    overlay.hidden = true;
    modalBody.innerHTML = "";
  }
  $("#modalClose").addEventListener("click", closeModal);
  overlay.addEventListener("click", (e) => { if (e.target === overlay) closeModal(); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape" && !overlay.hidden) closeModal(); });

  async function openDetail({ id, url, preloaded }) {
    overlay.hidden = false;
    modalBody.innerHTML = '<div class="skeleton skeleton--line skeleton--w60"></div><div class="skeleton skeleton--media" style="margin-top:12px"></div>';

    const params = new URLSearchParams({ mode: "detail" });
    if (url) params.set("url", url);
    else if (id) params.set("id", id);

    try {
      const res = await fetch("/api/weibo?" + params.toString());
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Gagal memuat detail postingan.");
      if (json.status === false) throw new Error(json.message || json.error || "Postingan tidak ditemukan.");

      const raw = extractSingleMblog(json);
      const post = raw ? normalizeMblog(raw) : preloaded;
      if (!post) throw new Error("Format data dari server tidak dikenali.");

      renderModal(post, json);
    } catch (err) {
      if (preloaded) {
        renderModal(preloaded, null);
        showAlert("Menampilkan data ringkas — detail lengkap gagal dimuat: " + err.message, "warning");
      } else {
        modalBody.innerHTML = `<div class="error-state"><h3>Gagal memuat</h3><p>${""}</p></div>`;
        modalBody.querySelector("p").textContent = err.message || "Terjadi kesalahan.";
      }
    }
  }

  function renderModal(post, rawJson) {
    modalBody.innerHTML = "";

    const userRow = document.createElement("div");
    userRow.className = "modal-user";
    userRow.innerHTML = `
      <img class="modal-user__avatar" src="${post.avatar ? proxyImage(post.avatar) : avatarPlaceholder(post.name)}" alt="" referrerpolicy="no-referrer" onerror="this.onerror=null;this.src='${avatarPlaceholder(post.name)}'">
      <div>
        <div class="modal-user__name"></div>
        <div class="modal-user__date"></div>
      </div>`;
    userRow.querySelector(".modal-user__name").textContent = post.name + (post.verified ? " ✓" : "");
    const dateParts = [formatDate(post.date), post.location].filter(Boolean);
    userRow.querySelector(".modal-user__date").textContent = dateParts.join(" · ");
    modalBody.appendChild(userRow);

    const textEl = document.createElement("p");
    textEl.className = "modal-text";
    textEl.textContent = post.text || "(tanpa teks)";
    modalBody.appendChild(textEl);

    if (post.isVideo && post.videoSources.length) {
      const video = document.createElement("video");
      video.className = "modal-video";
      video.controls = true;
      video.setAttribute("referrerpolicy", "no-referrer");
      video.src = proxyVideo(post.videoSources[0].url);
      if (post.videoCover) video.poster = proxyImage(post.videoCover);
      modalBody.appendChild(video);

      if (post.durationStr || post.views) {
        const meta = document.createElement("p");
        meta.style.cssText = "font-size:12.5px;color:var(--text-tertiary);margin:-8px 0 0;";
        meta.textContent = [post.durationStr, post.views].filter(Boolean).join(" · ");
        modalBody.appendChild(meta);
      }

      const list = document.createElement("div");
      list.className = "download-list";
      post.videoSources.forEach((src) => {
        list.appendChild(downloadItem(`Video (${src.label})`, proxyVideo(src.url, true)));
      });
      modalBody.appendChild(list);
    } else if (post.pics.length) {
      const grid = document.createElement("div");
      grid.className = "modal-media-grid";
      post.pics.forEach((p) => {
        const img = document.createElement("img");
        img.src = proxyImage(p.thumb);
        img.alt = "";
        img.referrerPolicy = "no-referrer";
        img.onerror = () => { img.style.display = "none"; };
        grid.appendChild(img);
      });
      modalBody.appendChild(grid);

      const list = document.createElement("div");
      list.className = "download-list";
      post.pics.forEach((p, i) => {
        list.appendChild(downloadItem(`Foto ${i + 1}`, proxyImage(p.large || p.thumb, true)));
      });
      modalBody.appendChild(list);
    } else {
      const empty = document.createElement("p");
      empty.style.color = "var(--text-tertiary)";
      empty.style.fontSize = "13.6px";
      empty.textContent = "Postingan ini tidak punya media untuk diunduh.";
      modalBody.appendChild(empty);
    }

    if (post.originalUrl) {
      const link = document.createElement("a");
      link.href = post.originalUrl;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      link.className = "raw-json-toggle";
      link.style.textDecoration = "underline";
      link.textContent = "Lihat postingan asli di Weibo ↗";
      modalBody.appendChild(link);
    }

    if (rawJson) {
      const toggle = document.createElement("button");
      toggle.type = "button";
      toggle.className = "raw-json-toggle";
      toggle.textContent = "Lihat data mentah (debug)";
      const pre = document.createElement("pre");
      pre.className = "raw-json";
      pre.hidden = true;
      pre.textContent = JSON.stringify(rawJson, null, 2);
      toggle.addEventListener("click", () => { pre.hidden = !pre.hidden; });
      modalBody.appendChild(toggle);
      modalBody.appendChild(pre);
    }
  }

  function downloadItem(label, href) {
    const row = document.createElement("div");
    row.className = "download-item";
    const span = document.createElement("span");
    span.className = "download-item__label";
    span.textContent = label;
    const a = document.createElement("a");
    a.className = "btn btn--secondary";
    a.href = href;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    a.download = "";
    a.textContent = "Unduh";
    row.appendChild(span);
    row.appendChild(a);
    return row;
  }

  /* ---------------------------------------------------------
     Init
     --------------------------------------------------------- */
  loadFeed(true);
})();
