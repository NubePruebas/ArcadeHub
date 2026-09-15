(function () {
  const loginView = document.getElementById("login-view");
  const dashView = document.getElementById("dash-view");
  const loginForm = document.getElementById("login-form");
  const loginError = document.getElementById("login-error");
  const gameForm = document.getElementById("game-form");
  const customList = document.getElementById("custom-list");
  const customEmpty = document.getElementById("custom-empty");
  const builtinList = document.getElementById("builtin-list");
  const formTitle = document.getElementById("form-title");
  const submitBtn = document.getElementById("submit-btn");
  const cancelEdit = document.getElementById("cancel-edit");
  const editId = document.getElementById("edit-id");
  const coverInput = document.getElementById("cover");
  const coverFile = document.getElementById("cover-file");
  const coverUrl = document.getElementById("cover-url");
  const coverPreview = document.getElementById("cover-preview");

  let customGames = [];

  function showDash() {
    loginView.hidden = true;
    dashView.hidden = false;
  }

  function showLogin() {
    loginView.hidden = false;
    dashView.hidden = true;
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function setCoverPreview(src) {
    if (src) {
      coverPreview.src = src;
      coverPreview.hidden = false;
      coverInput.value = src;
    } else {
      coverPreview.removeAttribute("src");
      coverPreview.hidden = true;
      coverInput.value = "";
    }
  }

  function resetForm() {
    gameForm.reset();
    editId.value = "";
    document.getElementById("color").value = "#22d3ee";
    document.getElementById("emoji").value = "🎮";
    setCoverPreview("");
    formTitle.textContent = "Añadir juego";
    submitBtn.textContent = "Guardar juego";
    cancelEdit.hidden = true;
  }

  coverFile.addEventListener("change", () => {
    const file = coverFile.files && coverFile.files[0];
    if (!file) return;
    coverUrl.value = "";
    setCoverPreview(URL.createObjectURL(file));
  });

  coverUrl.addEventListener("input", () => {
    const value = coverUrl.value.trim();
    coverFile.value = "";
    setCoverPreview(value || "");
  });

  async function loadLists() {
    customGames = await fetchCustomGames();
    customList.innerHTML = "";
    customEmpty.hidden = customGames.length > 0;

    customGames.forEach((g) => {
      const thumb = g.cover
        ? `<img class="list-cover" src="${escapeHtml(g.cover)}" alt="" />`
        : `<span class="list-emoji">${g.emoji || "🎮"}</span>`;
      const li = document.createElement("li");
      li.innerHTML = `
        <div class="list-main">
          ${thumb}
          <div>
            <strong>${escapeHtml(g.title)}</strong>
            <small>${escapeHtml(g.category)} · ${escapeHtml(g.url)}</small>
          </div>
        </div>
        <div class="list-actions">
          <button type="button" data-edit="${escapeHtml(g.id)}">Editar</button>
          <button type="button" class="danger" data-del="${escapeHtml(g.id)}">Eliminar</button>
        </div>
      `;
      customList.appendChild(li);
    });

    customList.querySelectorAll("[data-edit]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const g = customGames.find((x) => x.id === btn.getAttribute("data-edit"));
        if (!g) return;
        editId.value = g.id;
        document.getElementById("title").value = g.title;
        document.getElementById("url").value = g.url;
        document.getElementById("category").value = g.category;
        document.getElementById("description").value = g.description || "";
        document.getElementById("color").value = g.color || "#22d3ee";
        document.getElementById("emoji").value = g.emoji || "🎮";
        coverFile.value = "";
        coverUrl.value = g.cover && !g.cover.startsWith("/uploads/") ? g.cover : "";
        setCoverPreview(g.cover || "");
        formTitle.textContent = "Editar juego";
        submitBtn.textContent = "Actualizar";
        cancelEdit.hidden = false;
        window.scrollTo({ top: 0, behavior: "smooth" });
      });
    });

    customList.querySelectorAll("[data-del]").forEach((btn) => {
      btn.addEventListener("click", async () => {
        if (!confirm("¿Eliminar este juego del catálogo?")) return;
        try {
          await deleteGame(btn.getAttribute("data-del"));
          await loadLists();
        } catch (err) {
          alert(err.message || "No se pudo eliminar");
          if (err.status === 401) showLogin();
        }
      });
    });

    builtinList.innerHTML = "";
    BUILTIN_GAMES.forEach((g) => {
      const li = document.createElement("li");
      li.innerHTML = `
        <div class="list-main">
          <span class="list-emoji">${g.emoji}</span>
          <div>
            <strong>${escapeHtml(g.title)}</strong>
            <small>${escapeHtml(g.category)} · incluido</small>
          </div>
        </div>
      `;
      builtinList.appendChild(li);
    });
  }

  cancelEdit.addEventListener("click", resetForm);

  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    loginError.hidden = true;
    try {
      await loginAdmin(document.getElementById("password").value);
      showDash();
      await loadLists();
    } catch {
      loginError.hidden = false;
    }
  });

  document.getElementById("logout-btn").addEventListener("click", async () => {
    try {
      await logoutAdmin();
    } catch {
      /* ignore */
    }
    showLogin();
  });

  gameForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    submitBtn.disabled = true;

    try {
      let cover = coverInput.value.trim();
      const file = coverFile.files && coverFile.files[0];
      if (file) {
        cover = await uploadCover(file);
      } else if (coverUrl.value.trim()) {
        cover = coverUrl.value.trim();
      }

      const payload = {
        title: document.getElementById("title").value.trim(),
        url: document.getElementById("url").value.trim(),
        category: document.getElementById("category").value,
        description: document.getElementById("description").value.trim() || "Juego externo",
        color: document.getElementById("color").value,
        emoji: document.getElementById("emoji").value.trim() || "🎮",
        cover,
      };

      if (editId.value) await updateGame(editId.value, payload);
      else await createGame(payload);
      resetForm();
      await loadLists();
    } catch (err) {
      alert(err.message || "No se pudo guardar");
      if (err.status === 401) showLogin();
    } finally {
      submitBtn.disabled = false;
    }
  });

  async function boot() {
    try {
      const ok = await checkAdminSession();
      if (ok) {
        showDash();
        await loadLists();
      } else {
        showLogin();
        builtinList.innerHTML = "";
        BUILTIN_GAMES.forEach((g) => {
          const li = document.createElement("li");
          li.innerHTML = `
            <div class="list-main">
              <span class="list-emoji">${g.emoji}</span>
              <div>
                <strong>${escapeHtml(g.title)}</strong>
                <small>${escapeHtml(g.category)} · incluido</small>
              </div>
            </div>
          `;
          builtinList.appendChild(li);
        });
      }
    } catch {
      showLogin();
      loginError.hidden = false;
      loginError.textContent = "No se pudo conectar con el servidor. Usa npm start.";
    }
  }

  boot();
})();
