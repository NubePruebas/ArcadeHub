require("dotenv").config();
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");
const express = require("express");
const session = require("express-session");
const multer = require("multer");

function cleanSecret(value) {
  return String(value || "")
    .trim()
    .replace(/^["']|["']$/g, "");
}

const PORT = Number(process.env.PORT) || 3000;
const isProd = process.env.NODE_ENV === "production";
const ADMIN_PASSWORD = cleanSecret(process.env.ADMIN_PASSWORD);
const SESSION_SECRET = cleanSecret(
  process.env.SESSION_SECRET || (isProd ? "" : "arcadehub-dev-secret-change-me")
);

if (isProd && !ADMIN_PASSWORD) {
  console.error("Falta ADMIN_PASSWORD en Variables de Railway.");
  process.exit(1);
}

if (isProd && !SESSION_SECRET) {
  console.error("Falta SESSION_SECRET en Variables de Railway.");
  process.exit(1);
}

// Solo en local, si no hay .env, usa clave de desarrollo
const EFFECTIVE_ADMIN_PASSWORD = ADMIN_PASSWORD || "arcadehub2026";
const GAMES_FILE = path.join(__dirname, "data", "games.json");
const UPLOADS_DIR = path.join(__dirname, "uploads", "covers");

fs.mkdirSync(UPLOADS_DIR, { recursive: true });

const app = express();
app.set("trust proxy", 1);

app.use(express.json({ limit: "512kb" }));
app.use(
  session({
    name: "arcadehub.sid",
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 1000 * 60 * 60 * 8,
    },
  })
);

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOADS_DIR),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname || "").toLowerCase() || ".jpg";
    const safe = [".jpg", ".jpeg", ".png", ".webp", ".gif"].includes(ext) ? ext : ".jpg";
    cb(null, `cover-${Date.now()}-${crypto.randomBytes(4).toString("hex")}${safe}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 3 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (/^image\/(png|jpe?g|webp|gif)$/i.test(file.mimetype)) cb(null, true);
    else cb(new Error("Solo imágenes PNG, JPG, WEBP o GIF"));
  },
});

function readGames() {
  try {
    const raw = fs.readFileSync(GAMES_FILE, "utf8");
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeGames(games) {
  fs.mkdirSync(path.dirname(GAMES_FILE), { recursive: true });
  fs.writeFileSync(GAMES_FILE, JSON.stringify(games, null, 2), "utf8");
}

function passwordsMatch(input, expected) {
  const a = Buffer.from(String(input));
  const b = Buffer.from(String(expected));
  if (a.length !== b.length) {
    crypto.timingSafeEqual(b, b);
    return false;
  }
  return crypto.timingSafeEqual(a, b);
}

function requireAdmin(req, res, next) {
  if (req.session && req.session.isAdmin) return next();
  return res.status(401).json({ error: "No autorizado" });
}

function isValidHttpUrl(value) {
  try {
    const parsed = new URL(value);
    return ["http:", "https:"].includes(parsed.protocol);
  } catch {
    return false;
  }
}

function isValidCover(value) {
  if (!value) return true;
  if (value.startsWith("/uploads/covers/")) return true;
  return isValidHttpUrl(value);
}

function sanitizeGame(body, id) {
  const title = String(body.title || "").trim().slice(0, 60);
  const url = String(body.url || "").trim().slice(0, 500);
  const category = String(body.category || "Arcade").trim().slice(0, 40);
  const description = String(body.description || "Juego externo").trim().slice(0, 120);
  const color = String(body.color || "#22d3ee").trim().slice(0, 20);
  const emoji = String(body.emoji || "🎮").trim().slice(0, 8);
  const cover = String(body.cover || "").trim().slice(0, 500);

  if (!title || !url) return null;
  if (!isValidHttpUrl(url)) return null;
  if (!isValidCover(cover)) return null;

  return {
    id: id || "ext-" + Date.now(),
    title,
    url,
    category,
    description,
    color,
    emoji,
    cover,
  };
}

app.get("/api/health", (_req, res) => {
  res.json({
    ok: true,
    nodeEnv: process.env.NODE_ENV || null,
    hasAdminPassword: Boolean(ADMIN_PASSWORD),
    adminPasswordLength: ADMIN_PASSWORD.length,
  });
});

app.get("/api/me", (req, res) => {
  res.json({ authenticated: !!(req.session && req.session.isAdmin) });
});

app.post("/api/login", (req, res) => {
  const password = cleanSecret((req.body && req.body.password) || "");
  if (!password) {
    return res.status(400).json({ error: "Contraseña requerida" });
  }
  if (!passwordsMatch(password, EFFECTIVE_ADMIN_PASSWORD)) {
    return res.status(401).json({
      error: "Contraseña incorrecta",
      hint: isProd
        ? "Revisa ADMIN_PASSWORD en Railway y vuelve a hacer Redeploy"
        : "En local usa la clave de tu archivo .env",
    });
  }
  req.session.isAdmin = true;
  res.json({ ok: true });
});

app.post("/api/logout", (req, res) => {
  req.session.destroy(() => {
    res.clearCookie("arcadehub.sid");
    res.json({ ok: true });
  });
});

app.post("/api/upload", requireAdmin, (req, res) => {
  upload.single("cover")(req, res, (err) => {
    if (err) {
      return res.status(400).json({ error: err.message || "No se pudo subir la imagen" });
    }
    if (!req.file) {
      return res.status(400).json({ error: "No se recibió ninguna imagen" });
    }
    res.status(201).json({ cover: "/uploads/covers/" + req.file.filename });
  });
});

app.get("/api/games", (_req, res) => {
  res.json(readGames());
});

app.post("/api/games", requireAdmin, (req, res) => {
  const game = sanitizeGame(req.body);
  if (!game) return res.status(400).json({ error: "Datos inválidos" });
  const games = readGames();
  games.push(game);
  writeGames(games);
  res.status(201).json(game);
});

app.put("/api/games/:id", requireAdmin, (req, res) => {
  const games = readGames();
  const idx = games.findIndex((g) => g.id === req.params.id);
  if (idx < 0) return res.status(404).json({ error: "No encontrado" });
  const game = sanitizeGame(req.body, req.params.id);
  if (!game) return res.status(400).json({ error: "Datos inválidos" });
  if (!game.cover && games[idx].cover) game.cover = games[idx].cover;
  games[idx] = game;
  writeGames(games);
  res.json(game);
});

app.delete("/api/games/:id", requireAdmin, (req, res) => {
  const games = readGames();
  const next = games.filter((g) => g.id !== req.params.id);
  if (next.length === games.length) return res.status(404).json({ error: "No encontrado" });
  writeGames(next);
  res.json({ ok: true });
});

app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use(express.static(path.join(__dirname), { extensions: ["html"] }));

app.listen(PORT, "0.0.0.0", () => {
  console.log(`ArcadeHub en puerto ${PORT}`);
  console.log(
    `ADMIN_PASSWORD desde variables: ${ADMIN_PASSWORD ? "sí" : "no (usando default local)"}`
  );
});
