(function () {
  const gridCustom = document.getElementById("grid-custom");
  const gridBuiltin = document.getElementById("grid-builtin");
  const blockCustom = document.getElementById("block-custom");
  const blockBuiltin = document.getElementById("block-builtin");
  const countCustom = document.getElementById("count-custom");
  const countBuiltin = document.getElementById("count-builtin");
  const catsEl = document.getElementById("categories");
  const searchInput = document.getElementById("search");
  const emptyEl = document.getElementById("empty");
  const sectionTitle = document.getElementById("section-title");
  const sectionTitleCustom = document.getElementById("section-title-custom");
  const player = document.getElementById("player");
  const playerTitle = document.getElementById("player-title");
  const playerMeta = document.getElementById("player-meta");
  const playerFrame = document.getElementById("player-frame");
  const playerExternal = document.getElementById("player-external");

  let activeCategory = "Todos";
  let query = "";

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function matchesFilters(g) {
    const catOk = activeCategory === "Todos" || g.category === activeCategory;
    const q = query.trim().toLowerCase();
    const qOk =
      !q ||
      g.title.toLowerCase().includes(q) ||
      g.category.toLowerCase().includes(q) ||
      (g.description || "").toLowerCase().includes(q);
    return catOk && qOk;
  }

  function renderStats() {
    const all = getAllGames();
    document.getElementById("stat-total").textContent = String(all.length);
    document.getElementById("stat-cats").textContent = String(
      new Set(all.map((g) => g.category)).size
    );
  }

  function renderCategories() {
    const cats = getCategories(getAllGames());
    catsEl.innerHTML = "";
    cats.forEach((cat) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "side-btn" + (cat === activeCategory ? " active" : "");
      btn.textContent = cat;
      btn.setAttribute("role", "tab");
      btn.setAttribute("aria-selected", cat === activeCategory ? "true" : "false");
      btn.addEventListener("click", () => {
        activeCategory = cat;
        const label = cat === "Todos" ? null : cat;
        sectionTitleCustom.textContent = label ? label + " · Juegos" : "Juegos";
        sectionTitle.textContent = label ? label + " · Minijuegos" : "Minijuegos";
        renderCategories();
        renderGames();
      });
      catsEl.appendChild(btn);
    });
  }

  function makeCard(game) {
    const card = document.createElement("article");
    card.className = "game-card";
    const media = game.cover
      ? `<img class="thumb-cover" src="${escapeHtml(game.cover)}" alt="" loading="lazy" />`
      : `<span class="thumb-emoji" aria-hidden="true">${game.emoji || "🎮"}</span>`;
    card.innerHTML = `
      <button type="button" class="game-hit" aria-label="Jugar ${escapeHtml(game.title)}">
        <div class="thumb${game.cover ? " has-cover" : ""}" style="--c:${escapeHtml(game.color)}">
          ${media}
          <span class="play-badge">PLAY</span>
        </div>
        <div class="game-info">
          <h3>${escapeHtml(game.title)}</h3>
          <p>${escapeHtml(game.description || game.category)}</p>
          <span class="tag">${escapeHtml(game.category)}${game.builtin ? " · Mini" : ""}</span>
        </div>
      </button>
    `;
    card.querySelector(".game-hit").addEventListener("click", () => openGame(game));
    return card;
  }

  function fillGrid(grid, games) {
    grid.innerHTML = "";
    games.forEach((game) => grid.appendChild(makeCard(game)));
  }

  function renderGames() {
    // Más recientes arriba entre los que tú agregas
    const custom = [...getCustomGamesList()].reverse().filter(matchesFilters);
    const builtin = getBuiltinGamesList().filter(matchesFilters);

    fillGrid(gridCustom, custom);
    fillGrid(gridBuiltin, builtin);

    blockCustom.hidden = custom.length === 0;
    blockBuiltin.hidden = builtin.length === 0;
    emptyEl.hidden = custom.length + builtin.length > 0;

    countCustom.textContent =
      custom.length + (custom.length === 1 ? " juego" : " juegos");
    countBuiltin.textContent =
      builtin.length + (builtin.length === 1 ? " juego" : " juegos");
  }

  function openGame(game) {
    playerTitle.textContent = game.title;
    playerMeta.textContent = game.category + (game.builtin ? " · Minijuego" : "");
    playerExternal.href = game.url;
    playerFrame.src = game.url;
    player.hidden = false;
    document.body.style.overflow = "hidden";
  }

  function closePlayer() {
    player.hidden = true;
    playerFrame.src = "";
    document.body.style.overflow = "";
  }

  player.querySelectorAll("[data-close]").forEach((el) =>
    el.addEventListener("click", closePlayer)
  );
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !player.hidden) closePlayer();
  });

  searchInput.addEventListener("input", () => {
    query = searchInput.value;
    renderGames();
  });

  async function boot() {
    try {
      await refreshCustomGames();
    } catch (err) {
      console.warn("No se pudieron cargar juegos externos:", err.message);
    }
    renderStats();
    renderCategories();
    renderGames();
  }

  boot();
})();
