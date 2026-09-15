/** Minijuegos incluidos en el sitio (siempre visibles). */
const BUILTIN_GAMES = [
  {
    id: "snake",
    title: "Snake",
    url: "games/snake.html",
    category: "Arcade",
    description: "Come, crece y no te choques.",
    color: "#16a34a",
    emoji: "🐍",
    builtin: true,
  },
  {
    id: "tictactoe",
    title: "Tres en Raya",
    url: "games/tictactoe.html",
    category: "Estrategia",
    description: "Clásico 3 en línea para dos.",
    color: "#2563eb",
    emoji: "⭕",
    builtin: true,
  },
  {
    id: "memory",
    title: "Memory",
    url: "games/memory.html",
    category: "Puzzle",
    description: "Encuentra todas las parejas.",
    color: "#db2777",
    emoji: "🧠",
    builtin: true,
  },
  {
    id: "pong",
    title: "Pong",
    url: "games/pong.html",
    category: "Arcade",
    description: "Raqueta vs CPU. No dejes pasar la bola.",
    color: "#0f766e",
    emoji: "🏓",
    builtin: true,
  },
  {
    id: "breakout",
    title: "Breakout",
    url: "games/breakout.html",
    category: "Arcade",
    description: "Rompe todos los ladrillos.",
    color: "#ea580c",
    emoji: "🧱",
    builtin: true,
  },
  {
    id: "flappy",
    title: "Flappy Jump",
    url: "games/flappy.html",
    category: "Arcade",
    description: "Salta entre tubos. Un toque = un salto.",
    color: "#65a30d",
    emoji: "🐥",
    builtin: true,
  },
  {
    id: "whack",
    title: "Whack-a-Mole",
    url: "games/whack.html",
    category: "Acción",
    description: "Golpea topitos antes de que se escondan.",
    color: "#b45309",
    emoji: "🔨",
    builtin: true,
  },
  {
    id: "rps",
    title: "Piedra Papel Tijera",
    url: "games/rps.html",
    category: "Estrategia",
    description: "Mejor de muchas rondas contra la CPU.",
    color: "#7c3aed",
    emoji: "✊",
    builtin: true,
  },
];

let customGamesCache = [];

function getAllGames() {
  const custom = customGamesCache.map((g) => ({ ...g, builtin: false }));
  // Externos primero (arriba), minijuegos de la página después
  return [...custom, ...BUILTIN_GAMES];
}

function getCustomGamesList() {
  return customGamesCache.map((g) => ({ ...g, builtin: false }));
}

function getBuiltinGamesList() {
  return BUILTIN_GAMES.map((g) => ({ ...g, builtin: true }));
}

function getCategories(games) {
  return ["Todos", ...new Set(games.map((g) => g.category))];
}

async function refreshCustomGames() {
  customGamesCache = await fetchCustomGames();
  return customGamesCache;
}
