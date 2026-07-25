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

  function formatDate(raw) {
    if (!raw) return "";
    const d = new Date(raw);
    if (isNaN(d.getTime())) return raw; // biarkan apa adanya kalau formatnya nonstandar
    return d.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
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
     Normalisasi respons Weibo (bentuk API pihak ketiga tidak
     didokumentasikan penuh, jadi kode ini defensif: mencoba
     beberapa kemungkinan struktur field yang lazim dipakai
     wrapper m.weibo.cn).
     --------------------------------------------------------- */
  function pick(obj, paths, fallback) {
    for (const path of paths) {
      const val = path.split(".").reduce((o, k) => (o == null ? undefined : o[k]), obj);
      if (val !== undefined && val !== null && val !== "") return val;
    }
    return fallback;
  }

  // Mengambil daftar "mblog" (unit postingan) dari respons home/search
  function extractMblogList(json) {
    const data = json && json.data;
    if (!data) return [];

    let rawList = [];
    if (Array.isArray(data)) {
      rawList = data;
    } else if (Array.isArray(data.cards)) {
      rawList = data.cards;
    } else if (Array.isArray(data.statuses)) {
      rawList = data.statuses;
    } else if (Array.isArray(data.list)) {
      rawList = data.list;
    } else if (Array.isArray(data.results)) {
      rawList = data.results;
    }

    const mblogs = [];
    for (const item of rawList) {
      if (!item) continue;
      if (item.mblog) {
        mblogs.push(item.mblog);
      } else if (Array.isArray(item.card_group)) {
        for (const g of item.card_group) {
          if (g && g.mblog) mblogs.push(g.mblog);
        }
      } else if (item.id || item.text || item.user) {
        mblogs.push(item);
      }
    }
    return mblogs;
  }

  // Mengambil satu "mblog" dari respons detail
  function extractSingleMblog(json) {
    const data = json && json.data;
    if (!data) return null;
    if (data.mblog) return data.mblog;
    if (data.status) return data.status;
    if (data.id || data.text) return data;
    return null;
  }

  function normalizeMblog(m) {
    const user = m.user || m.author || {};
    const picsRaw = m.pics || m.pic_ids && [] || [];
    const pics = Array.isArray(picsRaw)
      ? picsRaw.map((p) => {
          if (typeof p === "string") return { thumb: p, large: p };
          const large = pick(p, ["large.url", "url", "pic_big", "big_url"], p.url);
          const thumb = pick(p, ["url", "thumbnail", "pic"], large);
          return { thumb, large };
        })
      : [];

    const pageInfo = m.page_info || {};
    const mediaInfo = pageInfo.media_info || {};
    const isVideo = pageInfo.type === "video" || !!mediaInfo.stream_url || !!m.video_url;

    const videoSources = [];
    if (mediaInfo.stream_url_hd) videoSources.push({ label: "HD", url: mediaInfo.stream_url_hd });
    if (mediaInfo.stream_url) videoSources.push({ label: "SD", url: mediaInfo.stream_url });
    if (m.video_url && !videoSources.length) videoSources.push({ label: "Video", url: m.video_url });

    return {
      id: pick(m, ["id", "idstr", "mid"], ""),
      name: pick(user, ["screen_name", "name", "nickname"], "Tanpa nama"),
      avatar: pick(user, ["profile_image_url", "avatar_hd", "avatar_large", "avatar"], ""),
      date: pick(m, ["created_at", "created_time", "date"], ""),
      text: stripHtml(pick(m, ["text", "text_raw", "content"], "")),
      pics,
      isVideo,
      videoSources,
      videoCover: pick(pageInfo, ["page_pic.url", "page_pic", "pic.url"], pics[0] ? pics[0].thumb : ""),
      reposts: pick(m, ["reposts_count"], 0),
      comments: pick(m, ["comments_count"], 0),
      likes: pick(m, ["attitudes_count"], 0),
    };
  }

  /* ---------------------------------------------------------
     State
     --------------------------------------------------------- */
  const state = {
    mode: "home",
    page: 1,
    sinceId: "0",
    keyword: "",
    detailTarget: "", // id atau url
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

    try {
      const res = await fetch("/api/weibo?" + params.toString());
      const json = await res.json();

      clearSkeletons();

      if (!res.ok || json.ok === false) {
        throw new Error(json.error || "Gagal memuat data.");
      }

      const list = extractMblogList(json).map(normalizeMblog);

      if (reset) cardGrid.innerHTML = "";

      if (!list.length && reset) {
        renderEmptyState();
        loadMoreBtn.hidden = true;
      } else {
        list.forEach(renderCard);
        loadMoreBtn.hidden = list.length < 5; // heuristik: kalau hasil sedikit, kemungkinan sudah halaman terakhir
      }
    } catch (err) {
      clearSkeletons();
      if (reset) renderErrorState(err.message);
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

  $("#refreshBtn").addEventListener("click", () => {
    state.mode = "home";
    state.page = 1;
    state.sinceId = "0";
    feedTitle.textContent = "Sedang Trending";
    feedSubtitle.textContent = "Postingan yang lagi ramai dibicarakan di Weibo";
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

  function renderEmptyState() {
    const div = document.createElement("div");
    div.className = "empty-state";
    div.innerHTML = "<h3>Tidak ada hasil</h3><p>Coba kata kunci lain, atau tempel link postingan langsung.</p>";
    cardGrid.appendChild(div);
  }
  function renderErrorState(message) {
    const div = document.createElement("div");
    div.className = "error-state";
    div.innerHTML = `<h3>Gagal memuat</h3><p>${message ? "" : ""}</p>`;
    div.querySelector("p").textContent = message || "Terjadi kesalahan. Coba muat ulang.";
    cardGrid.appendChild(div);
  }

  function renderCard(post) {
    const node = cardTpl.content.cloneNode(true);
    const mediaWrap = $(".post-card__media", node);
    const thumb = $(".post-card__thumb", node);
    const badge = $(".post-card__badge", node);

    const thumbUrl = post.isVideo ? post.videoCover : (post.pics[0] && post.pics[0].thumb);
    if (thumbUrl) {
      thumb.src = thumbUrl;
      thumb.alt = post.text ? post.text.slice(0, 80) : "Media Weibo";
    } else {
      mediaWrap.setAttribute("data-empty", "");
    }
    if (post.isVideo) badge.hidden = false;

    const avatar = $(".post-card__avatar", node);
    if (post.avatar) avatar.src = post.avatar;
    avatar.alt = post.name;

    $(".post-card__name", node).textContent = post.name;
    $(".post-card__date", node).textContent = formatDate(post.date);
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

    // Kalau kartu sudah punya data lengkap dan bukan hasil klik link/ID manual, bisa langsung tampil,
    // tapi kita tetap fetch ulang mode=detail supaya dapat link unduhan resolusi penuh.
    const params = new URLSearchParams({ mode: "detail" });
    if (url) params.set("url", url);
    else if (id) params.set("id", id);

    try {
      const res = await fetch("/api/weibo?" + params.toString());
      const json = await res.json();
      if (!res.ok || json.ok === false) throw new Error(json.error || "Gagal memuat detail postingan.");

      const raw = extractSingleMblog(json);
      const post = raw ? normalizeMblog(raw) : preloaded;
      if (!post) throw new Error("Format data dari server tidak dikenali.");

      renderModal(post, json);
    } catch (err) {
      if (preloaded) {
        renderModal(preloaded, null);
        showAlert("Menampilkan data ringkas — detail lengkap gagal dimuat: " + err.message, "warning");
      } else {
        modalBody.innerHTML = `<div class="error-state"><h3>Gagal memuat</h3><p>${err.message || "Terjadi kesalahan."}</p></div>`;
      }
    }
  }

  function renderModal(post, rawJson) {
    modalBody.innerHTML = "";

    const userRow = document.createElement("div");
    userRow.className = "modal-user";
    userRow.innerHTML = `
      <img class="modal-user__avatar" src="${post.avatar || ""}" alt="">
      <div>
        <div class="modal-user__name"></div>
        <div class="modal-user__date"></div>
      </div>`;
    userRow.querySelector(".modal-user__name").textContent = post.name;
    userRow.querySelector(".modal-user__date").textContent = formatDate(post.date);
    modalBody.appendChild(userRow);

    const textEl = document.createElement("p");
    textEl.className = "modal-text";
    textEl.textContent = post.text || "(tanpa teks)";
    modalBody.appendChild(textEl);

    if (post.isVideo && post.videoSources.length) {
      const video = document.createElement("video");
      video.className = "modal-video";
      video.controls = true;
      video.src = post.videoSources[0].url;
      if (post.videoCover) video.poster = post.videoCover;
      modalBody.appendChild(video);

      const list = document.createElement("div");
      list.className = "download-list";
      post.videoSources.forEach((src) => {
        list.appendChild(downloadItem(`Video (${src.label})`, src.url));
      });
      modalBody.appendChild(list);
    } else if (post.pics.length) {
      const grid = document.createElement("div");
      grid.className = "modal-media-grid";
      post.pics.forEach((p) => {
        const img = document.createElement("img");
        img.src = p.thumb;
        img.alt = "";
        grid.appendChild(img);
      });
      modalBody.appendChild(grid);

      const list = document.createElement("div");
      list.className = "download-list";
      post.pics.forEach((p, i) => {
        list.appendChild(downloadItem(`Foto ${i + 1}`, p.large || p.thumb));
      });
      modalBody.appendChild(list);
    } else {
      const empty = document.createElement("p");
      empty.style.color = "var(--text-tertiary)";
      empty.style.fontSize = "13.6px";
      empty.textContent = "Postingan ini tidak punya media untuk diunduh.";
      modalBody.appendChild(empty);
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
