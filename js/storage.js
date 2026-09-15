async function api(path, options = {}) {
  const res = await fetch(CONFIG.apiBase + path, {
    credentials: "same-origin",
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    ...options,
  });
  let data = null;
  try {
    data = await res.json();
  } catch {
    data = null;
  }
  if (!res.ok) {
    const err = new Error((data && data.error) || "Error de servidor");
    err.status = res.status;
    throw err;
  }
  return data;
}

async function fetchCustomGames() {
  return api("/api/games");
}

async function checkAdminSession() {
  const me = await api("/api/me");
  return !!me.authenticated;
}

async function loginAdmin(password) {
  return api("/api/login", {
    method: "POST",
    body: JSON.stringify({ password }),
  });
}

async function logoutAdmin() {
  return api("/api/logout", { method: "POST", body: "{}" });
}

async function createGame(payload) {
  return api("/api/games", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

async function updateGame(id, payload) {
  return api("/api/games/" + encodeURIComponent(id), {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

async function deleteGame(id) {
  return api("/api/games/" + encodeURIComponent(id), {
    method: "DELETE",
  });
}

async function uploadCover(file) {
  const form = new FormData();
  form.append("cover", file);
  const res = await fetch(CONFIG.apiBase + "/api/upload", {
    method: "POST",
    credentials: "same-origin",
    body: form,
  });
  let data = null;
  try {
    data = await res.json();
  } catch {
    data = null;
  }
  if (!res.ok) {
    const err = new Error((data && data.error) || "No se pudo subir la portada");
    err.status = res.status;
    throw err;
  }
  return data.cover;
}
