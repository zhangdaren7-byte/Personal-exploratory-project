const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const gameShell = document.getElementById("gameShell");
const oxygenFill = document.getElementById("oxygenFill");
const hazardFill = document.getElementById("hazardFill");
const regionLabel = document.getElementById("regionLabel");
const objectiveLabel = document.getElementById("objectiveLabel");
const messageBox = document.getElementById("messageBox");
const startOverlay = document.getElementById("startOverlay");
const endOverlay = document.getElementById("endOverlay");
const endKicker = document.getElementById("endKicker");
const endTitle = document.getElementById("endTitle");
const startButton = document.getElementById("startButton");
const restartButton = document.getElementById("restartButton");

const TAU = Math.PI * 2;
const WORLD = { width: 3600, height: 1900 };
const WATERLINE = 640;
const DEEP_LINE = 1180;
const COLD_LINE = 1440;
const WORKSHOP = { x: 705, y: 525, w: 182, h: 150, r: 150 };
const BLACK_GATE = { x: 3134, y: 250, w: 214, h: 342 };
const BLACK_GATE_INTERACT = { x: 3078, y: 188, w: 326, h: 470 };
const FINAL_RELIC = { x: 3430, y: 420, r: 100 };
const keys = new Set();

const art = {
  shore: loadArt("assets/tidal-abyss-mvp-v0.1.0-shore-map.jpg"),
  abyss: loadArt("assets/tidal-abyss-mvp-v0.1.0-abyss-map.jpg"),
  hero: loadArt("assets/tidal-abyss-mvp-v0.1.0-hero-sheet.png"),
  elements: loadArt("assets/tidal-abyss-mvp-v0.1.0-elements-sheet.png"),
  interactables: loadArt("assets/tidal-abyss-mvp-v0.1.0-interactables-sheet.png"),
};

const SPRITE_CELL = { w: 384, h: 512 };
const SOURCE_SHEET_SIZE = { w: 1536, h: 1024 };
const spriteFrames = {
  front: { col: 0, row: 0, sx: 54, sy: 56, sw: 276, sh: 368 },
  frontWalk: { col: 1, row: 0, sx: 54, sy: 56, sw: 276, sh: 368 },
  back: { col: 2, row: 0, sx: 58, sy: 52, sw: 268, sh: 374 },
  backWalk: { col: 3, row: 0, sx: 58, sy: 52, sw: 268, sh: 374 },
  side: { col: 0, row: 1, sx: 34, sy: 52, sw: 302, sh: 392 },
  swim: { col: 1, row: 1, sx: 18, sy: 94, sw: 336, sh: 292 },
  mining: { col: 2, row: 1, sx: 20, sy: 58, sw: 342, sh: 360 },
  sword: { col: 3, row: 1, sx: 20, sy: 58, sw: 342, sh: 360 },
};
const elementSprites = {
  algae: { col: 0, row: 0, sx: 36, sy: 48, sw: 310, sh: 360 },
  gate: { col: 1, row: 0, sx: 42, sy: 34, sw: 300, sh: 390 },
  reef: { col: 2, row: 0, sx: 34, sy: 82, sw: 318, sh: 330 },
  pillar: { col: 3, row: 0, sx: 52, sy: 40, sw: 280, sh: 386 },
  current: { col: 0, row: 1, sx: 24, sy: 92, sw: 336, sh: 230 },
  vent: { col: 1, row: 1, sx: 34, sy: 54, sw: 316, sh: 330 },
  bubble: { col: 2, row: 1, sx: 42, sy: 58, sw: 300, sh: 330 },
  sparkle: { col: 3, row: 1, sx: 54, sy: 80, sw: 276, sh: 276 },
};
const interactableSprites = {
  ore: { col: 0, row: 0 },
  abyssOre: { col: 1, row: 0 },
  workshop: { col: 2, row: 0 },
  relic: { col: 3, row: 0 },
  blueprintDeepSuit: { col: 0, row: 1 },
  blueprintThermalLiner: { col: 1, row: 1 },
  blueprintOxygenCell: { col: 2, row: 1 },
  blueprintTidalBlade: { col: 3, row: 1 },
  itemDeepSuit: { col: 0, row: 2 },
  itemThermalLiner: { col: 1, row: 2 },
  itemOxygenCell: { col: 2, row: 2 },
  itemTidalBlade: { col: 3, row: 2 },
  algaeInteractive: { col: 0, row: 3 },
  algaeBackground: { col: 1, row: 3 },
  forgeBurst: { col: 2, row: 3 },
  rewardAura: { col: 3, row: 3 },
};
const recipeVisuals = {
  deepSuit: {
    blueprint: "blueprintDeepSuit",
    item: "itemDeepSuit",
    label: "深潜甲",
  },
  thermalLiner: {
    blueprint: "blueprintThermalLiner",
    item: "itemThermalLiner",
    label: "热流芯",
  },
  oxygenCell: {
    blueprint: "blueprintOxygenCell",
    item: "itemOxygenCell",
    label: "氧藻罐",
  },
  tidalBlade: {
    blueprint: "blueprintTidalBlade",
    item: "itemTidalBlade",
    label: "潮汐刃",
  },
};
const recipeOrder = ["deepSuit", "thermalLiner", "oxygenCell", "tidalBlade"];
const resourceVisuals = {
  ore: { sprite: "ore", label: "陆矿", region: "岸上", color: "#e4c168" },
  algae: { sprite: "algaeInteractive", label: "藻类", region: "浅海", color: "#68c078" },
  abyss: { sprite: "abyssOre", label: "渊金", region: "冷渊", color: "#77c8df" },
};

const recipes = {
  deepSuit: {
    label: "深潜甲",
    costLabel: "陆矿 3 / 藻类 2",
    costs: { ore: 3, algae: 2 },
    text: "陆矿锻成骨架，藻胶封住接缝。冷渊压力不再把你赶回浅海。",
  },
  thermalLiner: {
    label: "热流芯",
    costLabel: "陆矿 2 / 藻类 4",
    costs: { ore: 2, algae: 4 },
    text: "藻类发酵成热胶，陆矿导热。冷渊寒流的消耗大幅降低。",
  },
  oxygenCell: {
    label: "氧藻罐",
    costLabel: "陆矿 1 / 藻类 4",
    costs: { ore: 1, algae: 4 },
    text: "压缩藻泡接入呼吸器。最大氧气提高。",
  },
  tidalBlade: {
    label: "潮汐刃",
    costLabel: "陆矿 2 / 渊金 2",
    costs: { ore: 2, abyss: 2 },
    text: "渊金吃进陆矿的纹理，黑石门终于能被劈开。",
  },
};

const solids = [
  { x: -80, y: -80, w: 3760, h: 110 },
  { x: -80, y: 0, w: 95, h: 1980 },
  { x: 3585, y: 0, w: 95, h: 1980 },
  { x: -80, y: 1880, w: 3760, h: 120 },
  { x: 1040, y: 130, w: 340, h: 150, kind: "cliff" },
  { x: 1500, y: 360, w: 210, h: 120, kind: "cliff" },
  { x: 2070, y: 755, w: 180, h: 360, kind: "reef" },
  { x: 2450, y: 1030, w: 360, h: 130, kind: "reef" },
  { x: 980, y: 1220, w: 280, h: 120, kind: "reef" },
  { x: 3070, y: 690, w: 170, h: 510, kind: "ruin" },
];

const currentZones = [
  { x: 990, y: 720, w: 760, h: 170, vx: 64, vy: 8, color: "#69d9d1" },
  { x: 1800, y: 1040, w: 240, h: 560, vx: 0, vy: -82, color: "#e4c168" },
  { x: 2520, y: 1440, w: 650, h: 230, vx: -58, vy: 0, color: "#a46346" },
];

const airPockets = [
  { x: 1745, y: 940, r: 82 },
  { x: 2920, y: 1285, r: 70 },
];

let state;
let lastTime = 0;
let rafId = 0;
let running = false;

function initialState() {
  return {
    time: 0,
    camera: { x: 0, y: 0 },
    player: {
      x: 180,
      y: 505,
      vx: 0,
      vy: 0,
      r: 17,
      facing: 1,
      oxygen: 62,
      maxOxygen: 62,
      hurtPulse: 0,
      action: null,
    },
    inventory: { ore: 0, algae: 0, abyss: 0 },
    upgrades: {
      deepSuit: false,
      thermalLiner: false,
      oxygenCell: false,
      tidalBlade: false,
    },
    blackGateBroken: false,
    finalClaimed: false,
    craftAnim: null,
    collectAnim: null,
    gateAnim: null,
    workshopMenu: { open: false, selected: 0 },
    message: "潮声很近。",
    messageTime: 2.4,
    particles: [],
    nodes: [
      { id: "ore1", type: "ore", x: 280, y: 470, yield: 2, depleted: false },
      { id: "ore2", type: "ore", x: 520, y: 350, yield: 2, depleted: false },
      { id: "ore3", type: "ore", x: 865, y: 520, yield: 2, depleted: false },
      { id: "ore4", type: "ore", x: 1250, y: 430, yield: 3, depleted: false },
      { id: "ore5", type: "ore", x: 2890, y: 490, yield: 2, depleted: false },
      { id: "algae1", type: "algae", x: 980, y: 760, yield: 2, depleted: false },
      { id: "algae2", type: "algae", x: 1290, y: 835, yield: 2, depleted: false },
      { id: "algae3", type: "algae", x: 1605, y: 945, yield: 3, depleted: false },
      { id: "algae4", type: "algae", x: 2150, y: 990, yield: 2, depleted: false },
      { id: "algae5", type: "algae", x: 830, y: 1075, yield: 2, depleted: false },
      { id: "abyss1", type: "abyss", x: 2360, y: 1505, yield: 1, depleted: false },
      { id: "abyss2", type: "abyss", x: 2665, y: 1585, yield: 1, depleted: false },
      { id: "abyss3", type: "abyss", x: 3050, y: 1515, yield: 2, depleted: false },
    ],
  };
}

function loadArt(src) {
  const image = new Image();
  image.src = src;
  image.addEventListener("load", () => draw());
  return image;
}

function resize() {
  const dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
  const rect = canvas.getBoundingClientRect();
  const width = Math.max(320, Math.floor(rect.width || window.innerWidth));
  const height = Math.max(240, Math.floor(rect.height || window.innerHeight));
  canvas.width = Math.floor(width * dpr);
  canvas.height = Math.floor(height * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.imageSmoothingEnabled = false;
  draw();
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function distance(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function setMessage(text, seconds = 2.8) {
  state.message = text;
  state.messageTime = seconds;
  messageBox.textContent = text;
}

function startGame() {
  state = initialState();
  running = true;
  gameShell.classList.add("game-active");
  startOverlay.classList.add("hidden");
  endOverlay.classList.add("hidden");
  lastTime = performance.now();
  updateHud();
  cancelAnimationFrame(rafId);
  rafId = requestAnimationFrame(loop);
}

function finishGame(success) {
  running = false;
  gameShell.classList.remove("game-active");
  endKicker.textContent = success ? "黑石门开启" : "氧线断开";
  endTitle.textContent = success ? "陆海回路完成" : "回到岸上再试";
  endOverlay.classList.remove("hidden");
}

function loop(now) {
  const dt = Math.min(0.033, (now - lastTime) / 1000 || 0.016);
  lastTime = now;
  update(dt);
  draw();
  if (running) rafId = requestAnimationFrame(loop);
}

function update(dt) {
  state.time += dt;
  updatePlayer(dt);
  updateParticles(dt);
  updateCraftAnimation(dt);
  updateCollectAnimation(dt);
  updateGateAnimation(dt);
  updateCamera(dt);
  state.messageTime = Math.max(0, state.messageTime - dt);
  if (state.messageTime <= 0) messageBox.textContent = contextualHint();
  updateHud();
}

function updateCraftAnimation(dt) {
  if (!state.craftAnim) return;
  state.craftAnim.time += dt;
  if (state.craftAnim.time > 4.25) state.craftAnim = null;
}

function updateCollectAnimation(dt) {
  if (!state.collectAnim) return;
  state.collectAnim.time += dt;
  if (state.collectAnim.time > 1.55) {
    state.collectAnim = null;
    state.player.action = null;
  }
}

function updateGateAnimation(dt) {
  if (!state.gateAnim) return;
  state.gateAnim.time += dt;
  if (state.gateAnim.time > 1.2) state.gateAnim = null;
}

function updatePlayer(dt) {
  const p = state.player;
  if (state.workshopMenu.open || state.craftAnim || state.collectAnim) {
    p.vx += (0 - p.vx) * 12 * dt;
    p.vy += (0 - p.vy) * 12 * dt;
    return;
  }
  const left = keys.has("a") || keys.has("arrowleft");
  const right = keys.has("d") || keys.has("arrowright");
  const up = keys.has("w") || keys.has("arrowup");
  const down = keys.has("s") || keys.has("arrowdown");
  const water = inWater(p.y);
  const sprint = keys.has("shift");
  const baseSpeed = water ? (sprint ? 210 : 150) : sprint ? 255 : 185;

  let ix = 0;
  let iy = 0;
  if (left) ix -= 1;
  if (right) ix += 1;
  if (up) iy -= 1;
  if (down) iy += 1;
  const len = Math.hypot(ix, iy) || 1;
  ix /= len;
  iy /= len;
  if (ix !== 0) p.facing = ix > 0 ? 1 : -1;

  const current = currentAt(p.x, p.y);
  const targetVx = ix * baseSpeed + current.vx;
  const targetVy = iy * baseSpeed + current.vy;
  const responsiveness = water ? 7.2 : 10.5;
  p.vx += (targetVx - p.vx) * responsiveness * dt;
  p.vy += (targetVy - p.vy) * responsiveness * dt;
  p.x += p.vx * dt;
  p.y += p.vy * dt;

  collidePlayer(p);

  const hazard = hazardLevel(p.x, p.y);
  if (water) {
    let drain = 2.1 + hazard * 8.5 + (sprint ? 0.8 : 0);
    if (state.upgrades.deepSuit) drain -= 0.7;
    if (insideAirPocket(p.x, p.y)) drain = -24;
    p.oxygen = clamp(p.oxygen - drain * dt, 0, p.maxOxygen);
  } else {
    p.oxygen = clamp(p.oxygen + 30 * dt, 0, p.maxOxygen);
  }
  if (p.oxygen <= 0) finishGame(false);
  p.hurtPulse = Math.max(0, p.hurtPulse - dt);
}

function collidePlayer(p) {
  p.x = clamp(p.x, p.r + 5, WORLD.width - p.r - 5);
  p.y = clamp(p.y, p.r + 5, WORLD.height - p.r - 5);
  for (const rect of activeSolids()) {
    const point = {
      x: clamp(p.x, rect.x, rect.x + rect.w),
      y: clamp(p.y, rect.y, rect.y + rect.h),
    };
    const dx = p.x - point.x;
    const dy = p.y - point.y;
    const d = Math.hypot(dx, dy) || 1;
    if (d >= p.r) continue;
    const push = p.r - d;
    const nx = dx / d;
    const ny = dy / d;
    p.x += nx * push;
    p.y += ny * push;
    const dot = p.vx * nx + p.vy * ny;
    if (dot < 0) {
      p.vx -= dot * nx;
      p.vy -= dot * ny;
    }
  }
}

function activeSolids() {
  const blackGate = state.blackGateBroken ? [] : [{ ...BLACK_GATE, kind: "blackgate" }];
  return [...solids, ...blackGate];
}

function updateParticles(dt) {
  state.particles = state.particles
    .map((p) => ({
      ...p,
      x: p.x + p.vx * dt,
      y: p.y + p.vy * dt,
      vy: p.vy - p.r * 1.8 * dt,
      life: p.life - dt,
    }))
    .filter((p) => p.life > 0);
}

function updateCamera(dt) {
  const { width: vw, height: vh } = viewport();
  const targetX = clamp(state.player.x - vw * 0.42, 0, WORLD.width - vw);
  const targetY = clamp(state.player.y - vh * 0.48, 0, WORLD.height - vh);
  state.camera.x += (targetX - state.camera.x) * (1 - Math.pow(0.002, dt));
  state.camera.y += (targetY - state.camera.y) * (1 - Math.pow(0.002, dt));
}

function inWater(y) {
  return y > WATERLINE;
}

function currentAt(x, y) {
  let vx = 0;
  let vy = 0;
  if (!inWater(y)) return { vx, vy };
  for (const zone of currentZones) {
    if (x >= zone.x && x <= zone.x + zone.w && y >= zone.y && y <= zone.y + zone.h) {
      vx += zone.vx;
      vy += zone.vy;
    }
  }
  return { vx, vy };
}

function insideAirPocket(x, y) {
  return airPockets.some((pocket) => Math.hypot(x - pocket.x, y - pocket.y) < pocket.r);
}

function hazardLevel(x, y) {
  if (!inWater(y)) return 0;
  let hazard = 0;
  if (y > DEEP_LINE && !state.upgrades.deepSuit) hazard += clamp((y - DEEP_LINE) / 260, 0, 1);
  if (y > COLD_LINE && !state.upgrades.thermalLiner) hazard += clamp((y - COLD_LINE) / 230, 0, 1);
  if (insideAirPocket(x, y)) hazard *= 0.25;
  return clamp(hazard, 0, 1);
}

function nearestNode() {
  let best = null;
  let bestD = Infinity;
  for (const node of state.nodes) {
    if (node.depleted) continue;
    const d = Math.hypot(node.x - state.player.x, node.y - state.player.y);
    if (d < nodeInteractRadius(node.type) && d < bestD) {
      best = node;
      bestD = d;
    }
  }
  return best;
}

function nodeInteractRadius(type) {
  if (type === "abyss") return 88;
  if (type === "algae") return 82;
  return 76;
}

function playerInRect(rect, padding = 0) {
  const p = state.player;
  return p.x >= rect.x - padding && p.x <= rect.x + rect.w + padding && p.y >= rect.y - padding && p.y <= rect.y + rect.h + padding;
}

function nearWorkshop() {
  return Math.hypot(state.player.x - WORKSHOP.x, state.player.y - (WORKSHOP.y + 14)) < WORKSHOP.r && !inWater(state.player.y);
}

function nearBlackGate() {
  return playerInRect(BLACK_GATE_INTERACT, 0) && !state.blackGateBroken;
}

function nearFinalRelic() {
  return state.blackGateBroken && Math.hypot(state.player.x - FINAL_RELIC.x, state.player.y - FINAL_RELIC.y) < FINAL_RELIC.r;
}

function interact() {
  if (!running) return;
  if (state.craftAnim || state.collectAnim) return;
  if (state.workshopMenu.open) {
    craftSelectedRecipe();
    return;
  }
  if (nearFinalRelic()) {
    state.finalClaimed = true;
    finishGame(true);
    return;
  }
  if (nearBlackGate()) {
    if (state.upgrades.tidalBlade) {
      state.blackGateBroken = true;
      state.gateAnim = { time: 0 };
      burst(BLACK_GATE.x + BLACK_GATE.w / 2, BLACK_GATE.y + BLACK_GATE.h / 2, 58, "#b7e7d6", 160);
      setMessage("潮汐刃切开黑石。深海金属在陆地上变成了真正的力量。", 4);
    } else {
      setMessage("黑石门吞光，普通工具只能留下白痕。", 3);
    }
    return;
  }
  if (nearWorkshop()) {
    openWorkshopMenu();
    return;
  }
  const node = nearestNode();
  if (!node) {
    setMessage("这里暂时没有可采集的东西。", 2.2);
    return;
  }
  if (node.type === "abyss" && !state.upgrades.deepSuit) {
    setMessage("深压太重。先用陆矿和藻胶做深潜甲。", 3);
    state.player.hurtPulse = 0.25;
    return;
  }
  if (node.type === "abyss" && !state.upgrades.thermalLiner) {
    setMessage("冷渊会冻结呼吸器。热流芯能把藻类变成保温材料。", 3);
    state.player.hurtPulse = 0.25;
    return;
  }
  node.depleted = true;
  state.inventory[node.type] += node.yield;
  burst(node.x, node.y, node.type === "abyss" ? 34 : 22, nodeColor(node.type), 120);
  const visual = resourceVisuals[node.type];
  state.player.action = node.type === "ore" ? "mining" : "collect";
  state.collectAnim = {
    type: node.type,
    amount: node.yield,
    label: visual.label,
    region: visual.region,
    sprite: visual.sprite,
    color: visual.color,
    time: 0,
  };
  setMessage(`${visual.region}采集到 ${node.yield} 份${visual.label}，背包里现在有 ${state.inventory[node.type]} 份。`, 2.8);
}

function canAfford(recipe) {
  return Object.entries(recipe.costs).every(([key, amount]) => state.inventory[key] >= amount);
}

function firstUsefulRecipeIndex() {
  const craftable = recipeOrder.findIndex((key) => !state.upgrades[key] && canAfford(recipes[key]));
  if (craftable >= 0) return craftable;
  const unfinished = recipeOrder.findIndex((key) => !state.upgrades[key]);
  return Math.max(0, unfinished);
}

function openWorkshopMenu() {
  state.workshopMenu.open = true;
  state.workshopMenu.selected = firstUsefulRecipeIndex();
  keys.clear();
  setMessage("工坊菜单已打开。", 2.2);
}

function closeWorkshopMenu() {
  state.workshopMenu.open = false;
  setMessage("离开工坊。", 1.6);
}

function moveWorkshopSelection(delta) {
  const menu = state.workshopMenu;
  menu.selected = (menu.selected + delta + recipeOrder.length) % recipeOrder.length;
}

function craftSelectedRecipe() {
  const key = recipeOrder[state.workshopMenu.selected];
  craft(key, { fromMenu: true });
}

function missingCostLabel(recipe) {
  return Object.entries(recipe.costs)
    .map(([key, amount]) => {
      const missing = amount - state.inventory[key];
      if (missing <= 0) return null;
      return `${resourceVisuals[key].label} ${missing}`;
    })
    .filter(Boolean)
    .join(" / ");
}

function craft(key, options = {}) {
  if (!running) return;
  const recipe = recipes[key];
  if (!recipe) return;
  if (state.upgrades[key]) {
    setMessage(`${recipe.label}已经完成。`, 1.8);
    return;
  }
  if (!nearWorkshop()) {
    setMessage("制作需要回到海岸工坊。", 2.4);
    return;
  }
  if (!canAfford(recipe)) {
    setMessage(`${recipe.label}还缺 ${missingCostLabel(recipe)}。`, 2.4);
    return;
  }
  for (const [item, amount] of Object.entries(recipe.costs)) {
    state.inventory[item] -= amount;
  }
  state.upgrades[key] = true;
  if (key === "oxygenCell") {
    state.player.maxOxygen = 104;
    state.player.oxygen = state.player.maxOxygen;
  }
  state.craftAnim = { key, time: 0 };
  if (options.fromMenu) state.workshopMenu.open = false;
  burst(WORKSHOP.x, WORKSHOP.y + 15, 36, "#e4c168", 150);
  setMessage(recipe.text, 4);
  updateHud();
}

function burst(x, y, count, color, speed) {
  for (let i = 0; i < count; i += 1) {
    const a = Math.random() * TAU;
    const s = speed * (0.25 + Math.random() * 0.9);
    state.particles.push({
      x,
      y,
      vx: Math.cos(a) * s,
      vy: Math.sin(a) * s,
      r: 1.5 + Math.random() * 4,
      life: 0.55 + Math.random() * 0.7,
      maxLife: 1.25,
      color,
    });
  }
}

function nodeColor(type) {
  if (type === "ore") return "#e4c168";
  if (type === "algae") return "#68c078";
  return "#77c8df";
}

function contextualHint() {
  const node = nearestNode();
  if (nearFinalRelic()) return "古代灯塔正在回应潮汐刃。";
  if (nearBlackGate()) return state.upgrades.tidalBlade ? "按空格，用潮汐刃破开黑石门。" : "黑石门需要潮汐刃。";
  if (node) {
    if (node.type === "abyss" && (!state.upgrades.deepSuit || !state.upgrades.thermalLiner)) {
      return "冷渊矿脉需要深潜甲和热流芯。";
    }
    return node.type === "ore" ? "按空格采集陆矿。" : node.type === "algae" ? "按空格采集发光藻类。" : "按空格采集渊金。";
  }
  if (nearWorkshop()) return "按空格打开海岸工坊。";
  return nextObjective();
}

function nextObjective() {
  const inv = state.inventory;
  const up = state.upgrades;
  if (!up.deepSuit) return "采集陆矿与浅海藻类，制作深潜甲。";
  if (!up.thermalLiner) return "继续收集藻类，在工坊制作热流芯。";
  if (!up.oxygenCell && inv.algae >= 4 && inv.ore >= 1) return "氧藻罐能让深潜更从容。";
  if (inv.abyss < 2 && !up.tidalBlade) return "带着深潜甲和热流芯，下到冷渊采渊金。";
  if (!up.tidalBlade) return "把渊金带回海岸工坊，打造潮汐刃。";
  if (!state.blackGateBroken) return "回到陆地东侧，用潮汐刃破开黑石门。";
  return "进入黑石门后的灯塔遗迹。";
}

function updateHud() {
  const p = state.player;
  const water = inWater(p.y);
  regionLabel.textContent = !water ? "岸上" : p.y > COLD_LINE ? "冷渊" : p.y > DEEP_LINE ? "深海" : "浅海";
  objectiveLabel.textContent = nextObjective();
  oxygenFill.style.transform = `scaleX(${clamp(p.oxygen / p.maxOxygen, 0, 1)})`;
  hazardFill.style.transform = `scaleX(${hazardLevel(p.x, p.y)})`;
}

function draw() {
  if (!state) state = initialState();
  const { width: vw, height: vh } = viewport();
  ctx.imageSmoothingEnabled = false;
  ctx.clearRect(0, 0, vw, vh);
  drawSkyAndWater(vw, vh);
  ctx.save();
  ctx.translate(-state.camera.x, -state.camera.y);
  drawWorldBase();
  drawCurrents();
  drawAirPockets();
  drawTerrainDetails();
  drawSolids();
  drawWorkshop();
  drawResources();
  drawBlackGateAndRelic();
  drawPlayer();
  drawInteractionPrompts();
  drawParticles();
  drawForeground();
  ctx.restore();
  drawScreenFog(vw, vh);
  drawCollectAnimation(vw, vh);
  drawCraftAnimation(vw, vh);
  drawWorkshopMenu(vw, vh);
}

function viewport() {
  return {
    width: canvas.clientWidth || window.innerWidth,
    height: canvas.clientHeight || window.innerHeight,
  };
}

function drawSkyAndWater(vw, vh) {
  ctx.fillStyle = "#11141d";
  ctx.fillRect(0, 0, vw, vh);
}

function drawWorldBase() {
  ctx.fillStyle = "#405d3c";
  ctx.fillRect(0, 0, WORLD.width, WATERLINE + 120);
  ctx.fillStyle = "#0a2b3d";
  ctx.fillRect(0, WATERLINE, WORLD.width, WORLD.height - WATERLINE);

  drawArtLayer(art.shore, 0, 0, WORLD.width, WATERLINE + 360, 0.96);
  drawArtLayer(art.abyss, 0, WATERLINE + 20, WORLD.width, WORLD.height - WATERLINE - 20, 0.93);

  ctx.save();
  ctx.globalAlpha = 0.72;
  for (let x = -32; x < WORLD.width + 32; x += 32) {
    const y = WATERLINE + (Math.floor((x / 32 + state.time * 2) % 2) ? 0 : 6);
    ctx.fillStyle = "#d9f5d2";
    ctx.fillRect(x, y, 18, 4);
    ctx.fillStyle = "#246c7b";
    ctx.fillRect(x + 18, y + 4, 14, 4);
  }
  ctx.restore();

  drawPixelGrid();
}

function drawArtLayer(image, x, y, w, h, alpha) {
  if (!image.complete || !image.naturalWidth) return;
  ctx.save();
  ctx.imageSmoothingEnabled = false;
  ctx.globalAlpha = alpha;
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();
  const imageRatio = image.naturalWidth / image.naturalHeight;
  const targetRatio = w / h;
  let sw = image.naturalWidth;
  let sh = image.naturalHeight;
  let sx = 0;
  let sy = 0;
  if (imageRatio > targetRatio) {
    sw = image.naturalHeight * targetRatio;
    sx = (image.naturalWidth - sw) / 2;
  } else {
    sh = image.naturalWidth / targetRatio;
    sy = (image.naturalHeight - sh) / 2;
  }
  ctx.drawImage(image, sx, sy, sw, sh, x, y, w, h);
  ctx.restore();
}

function drawPixelGrid() {
  ctx.save();
  ctx.globalAlpha = 0.1;
  ctx.fillStyle = "#000000";
  for (let x = 0; x < WORLD.width; x += 96) ctx.fillRect(x, 0, 3, WORLD.height);
  for (let y = 0; y < WORLD.height; y += 96) ctx.fillRect(0, y, WORLD.width, 3);
  ctx.restore();
}

function drawLandContours() {
  ctx.save();
  ctx.globalAlpha = 0.32;
  ctx.fillStyle = "#334739";
  for (let i = 0; i < 8; i += 1) {
    const x = i * 520 - 80;
    ctx.beginPath();
    ctx.moveTo(x, 640);
    ctx.bezierCurveTo(x + 80, 380, x + 230, 280, x + 470, 640);
    ctx.closePath();
    ctx.fill();
  }
  ctx.globalAlpha = 0.22;
  ctx.strokeStyle = "#f1d58a";
  for (let i = 0; i < 60; i += 1) {
    const x = (i * 151 + 40) % WORLD.width;
    const y = 105 + ((i * 83) % 460);
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + 10, y - 18);
    ctx.lineTo(x + 20, y);
    ctx.stroke();
  }
  ctx.restore();
}

function drawSeaFloor() {
  ctx.save();
  ctx.fillStyle = "#182c28";
  ctx.beginPath();
  ctx.moveTo(0, 1780);
  for (let x = 0; x <= WORLD.width; x += 180) {
    const y = 1660 + Math.sin(x * 0.005) * 80 + Math.cos(x * 0.012) * 38;
    ctx.lineTo(x, y);
  }
  ctx.lineTo(WORLD.width, WORLD.height);
  ctx.lineTo(0, WORLD.height);
  ctx.closePath();
  ctx.fill();

  ctx.globalAlpha = 0.22;
  ctx.fillStyle = "#081111";
  for (let i = 0; i < 7; i += 1) {
    const x = i * 570 + 110;
    ctx.beginPath();
    ctx.moveTo(x, 1840);
    ctx.bezierCurveTo(x + 70, 1400, x + 280, 1320, x + 430, 1840);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
}

function drawCurrents() {
  for (const zone of currentZones) {
    ctx.save();
    const horizontal = Math.abs(zone.vx) >= Math.abs(zone.vy);
    ctx.globalAlpha = 0.72;
    ctx.fillStyle = horizontal ? "rgba(23, 94, 150, 0.18)" : "rgba(77, 170, 210, 0.16)";
    ctx.fillRect(zone.x, zone.y, zone.w, zone.h);
    const stepX = horizontal ? 150 : 92;
    const stepY = horizontal ? 82 : 150;
    const drift = (state.time * 36) % (horizontal ? stepX : stepY);
    for (let y = zone.y + 16; y < zone.y + zone.h; y += stepY) {
      for (let x = zone.x + 18; x < zone.x + zone.w; x += stepX) {
        const px = horizontal ? zone.x + ((x - zone.x + drift) % zone.w) : x;
        const py = horizontal ? y : zone.y + ((y - zone.y - drift + zone.h) % zone.h);
        if (horizontal) {
          drawElement("current", px, py + 32, 138, 72);
        } else {
          drawElement("vent", px + 40, py + 42, 86, 118);
        }
      }
    }
    ctx.restore();
  }
}

function drawAirPockets() {
  for (const pocket of airPockets) {
    const pulse = Math.sin(state.time * 2.4 + pocket.x) * 0.5 + 0.5;
    drawElement("bubble", pocket.x, pocket.y, pocket.r * 1.8 + pulse * 8, pocket.r * 1.9 + pulse * 8);
  }
}

function drawTerrainDetails() {
  drawAmbientPixelProps();
}

function drawAmbientPixelProps() {
  const algaeProps = [
    [740, 760, 64],
    [1180, 1040, 72],
    [1980, 1160, 58],
    [2820, 1370, 70],
  ];
  const reefProps = [
    [540, 1220, 88],
    [2280, 1280, 96],
    [3320, 910, 82],
  ];
  const pillarProps = [
    [1460, 420, 88],
    [2580, 1360, 104],
    [3220, 1260, 96],
  ];
  for (const [x, y, size] of algaeProps) {
    ctx.save();
    ctx.globalAlpha = 0.68;
    drawInteractable("algaeBackground", x, y, size, size * 1.1);
    ctx.restore();
  }
  for (const [x, y, size] of reefProps) drawElement("reef", x, y, size * 1.3, size);
  for (const [x, y, size] of pillarProps) drawElement("pillar", x, y, size * 0.78, size * 1.38);
}

function drawSolids() {
  for (const rect of solids) {
    if (rect.kind === undefined) continue;
    drawRock(rect, rect.kind);
    drawObstacleSprite(rect);
  }
}

function drawObstacleSprite(rect) {
  if (rect.kind === "reef") {
    const count = Math.max(1, Math.ceil(rect.w / 130));
    for (let i = 0; i < count; i += 1) {
      drawElement("reef", rect.x + (i + 0.5) * (rect.w / count), rect.y + rect.h / 2 + 8, 128, 106);
    }
  }
  if (rect.kind === "ruin") {
    const tall = rect.h > rect.w;
    drawElement("pillar", rect.x + rect.w / 2, rect.y + rect.h / 2, tall ? 116 : 146, tall ? Math.min(250, rect.h + 40) : 126);
  }
}

function drawRock(rect, kind) {
  const colors = {
    cliff: ["#6f775c", "#343e34"],
    reef: ["#335b54", "#142b2a"],
    ruin: ["#6b7167", "#293b37"],
    blackgate: ["#1d2221", "#060908"],
  }[kind] || ["#45564d", "#1d2b27"];
  const g = ctx.createLinearGradient(rect.x, rect.y, rect.x, rect.y + rect.h);
  g.addColorStop(0, colors[0]);
  g.addColorStop(1, colors[1]);
  ctx.globalAlpha = kind === "reef" || kind === "ruin" ? 0.36 : 0.74;
  ctx.fillStyle = g;
  ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
  ctx.globalAlpha = 1;
  ctx.save();
  ctx.globalAlpha = 0.18;
  ctx.fillStyle = "#fff6c8";
  for (let x = rect.x + 18; x < rect.x + rect.w; x += 48) {
    for (let y = rect.y + 18; y < rect.y + rect.h; y += 56) {
      ctx.beginPath();
      ctx.arc(x + ((y * 17) % 12), y, 2.5, 0, TAU);
      ctx.fill();
    }
  }
  ctx.restore();
}

function drawWorkshop() {
  ctx.save();
  drawInteractable("workshop", WORKSHOP.x, WORKSHOP.y, WORKSHOP.w, WORKSHOP.h);
  if (nearWorkshop()) {
    ctx.globalAlpha = 0.85;
    drawInteractable("forgeBurst", WORKSHOP.x - 61, WORKSHOP.y + 11, 58, 58);
    drawElement("sparkle", WORKSHOP.x + 55, WORKSHOP.y - 62, 36, 36);
  }
  ctx.restore();
}

function drawResources() {
  for (const node of state.nodes) {
    if (node.depleted) continue;
    if (node.type === "ore") drawOreNode(node);
    if (node.type === "algae") drawAlgaeNode(node);
    if (node.type === "abyss") drawAbyssNode(node);
  }
}

function drawOreNode(node) {
  drawInteractable("ore", node.x, node.y, 92, 72);
  if (distance(node, state.player) < 86) drawElement("sparkle", node.x + 34, node.y - 28, 32, 32);
}

function drawAlgaeNode(node) {
  drawInteractable("algaeInteractive", node.x, node.y, 92, 104);
  const pulse = Math.sin(state.time * 4 + node.x) * 0.5 + 0.5;
  ctx.save();
  ctx.globalAlpha = 0.55 + pulse * 0.25;
  drawElement("sparkle", node.x + 28, node.y - 48, 36, 36);
  ctx.restore();
}

function drawAbyssNode(node) {
  drawInteractable("abyssOre", node.x, node.y, 96, 104);
  if (distance(node, state.player) < 92) drawElement("sparkle", node.x + 38, node.y - 42, 34, 34);
}

function drawBlackGateAndRelic() {
  if (!state.blackGateBroken) {
    ctx.save();
    ctx.globalAlpha = state.upgrades.tidalBlade ? 1 : 0.92;
    drawElement("gate", BLACK_GATE.x + BLACK_GATE.w / 2, BLACK_GATE.y + BLACK_GATE.h / 2, BLACK_GATE.w, BLACK_GATE.h);
    if (state.upgrades.tidalBlade) drawElement("sparkle", BLACK_GATE.x + BLACK_GATE.w - 14, BLACK_GATE.y + 74, 46, 46);
    ctx.restore();
    return;
  }
  if (state.gateAnim) {
    const t = clamp(state.gateAnim.time / 1.2, 0, 1);
    ctx.save();
    ctx.globalAlpha = 1 - t;
    ctx.translate((Math.sin(state.gateAnim.time * 42) * 7) * (1 - t), 0);
    drawElement("gate", BLACK_GATE.x + BLACK_GATE.w / 2, BLACK_GATE.y + BLACK_GATE.h / 2, BLACK_GATE.w + t * 56, BLACK_GATE.h + t * 44);
    ctx.restore();
  }
  ctx.save();
  ctx.translate(FINAL_RELIC.x, FINAL_RELIC.y);
  const pulse = Math.sin(state.time * 3) * 0.5 + 0.5;
  drawInteractable("relic", 0, 0, 128 + pulse * 8, 128 + pulse * 8);
  ctx.restore();
}

function drawInteractionPrompts() {
  if (!running || state.workshopMenu.open || state.craftAnim || state.collectAnim) return;
  if (nearFinalRelic()) {
    drawWorldPrompt("空格 点亮遗迹", FINAL_RELIC.x, FINAL_RELIC.y - 96);
    return;
  }
  if (nearBlackGate()) {
    drawWorldPrompt(state.upgrades.tidalBlade ? "空格 破开黑石门" : "需要潮汐刃", BLACK_GATE.x + BLACK_GATE.w / 2, BLACK_GATE.y - 24);
    return;
  }
  if (nearWorkshop()) {
    drawWorldPrompt("空格 打开工坊", WORKSHOP.x, WORKSHOP.y - 108);
    return;
  }
  const node = nearestNode();
  if (!node) return;
  if (node.type === "abyss" && (!state.upgrades.deepSuit || !state.upgrades.thermalLiner)) {
    drawWorldPrompt("需要深潜装备", node.x, node.y - 72);
    return;
  }
  drawWorldPrompt(`空格 采集${resourceVisuals[node.type].label}`, node.x, node.y - 72);
}

function drawWorldPrompt(text, x, y) {
  ctx.save();
  ctx.font = '900 22px "Courier New", monospace';
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  const width = Math.ceil(ctx.measureText(text).width) + 28;
  const height = 34;
  const left = x - width / 2;
  const top = y - height / 2;
  ctx.fillStyle = "rgba(8, 11, 20, 0.88)";
  ctx.fillRect(left, top, width, height);
  ctx.fillStyle = "#fff0c2";
  ctx.fillRect(left, top, width, 3);
  ctx.fillRect(left, top + height - 3, width, 3);
  ctx.fillRect(left, top, 3, height);
  ctx.fillRect(left + width - 3, top, 3, height);
  ctx.fillStyle = "#15101b";
  ctx.fillText(text, x + 2, y + 2);
  ctx.fillStyle = "#fff0c2";
  ctx.fillText(text, x, y);
  ctx.restore();
}

function drawPlayer() {
  const p = state.player;
  const water = inWater(p.y);
  ctx.save();
  ctx.translate(p.x, p.y);
  if (p.hurtPulse > 0) {
    ctx.globalAlpha = 0.55 + Math.sin(state.time * 30) * 0.25;
  }
  drawSpritePlayer(water);
  ctx.restore();
}

function drawElement(key, x, y, w, h) {
  const sprite = elementSprites[key];
  if (!sprite || !art.elements.complete || !art.elements.naturalWidth) {
    drawElementFallback(key, x, y, w, h);
    return;
  }
  const source = sheetSourceRect(sprite, art.elements);
  ctx.save();
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(art.elements, source.x, source.y, source.w, source.h, x - w / 2, y - h / 2, w, h);
  ctx.restore();
}

function drawElementFallback(key, x, y, w, h) {
  ctx.save();
  ctx.fillStyle = key === "gate" ? "#11141d" : key === "algae" ? "#799636" : "#6a7078";
  ctx.fillRect(x - w / 2, y - h / 2, w, h);
  ctx.restore();
}

function drawInteractable(key, x, y, w, h) {
  const sprite = interactableSprites[key];
  if (!sprite || !art.interactables.complete || !art.interactables.naturalWidth) {
    drawElementFallback(key, x, y, w, h);
    return;
  }
  const cw = art.interactables.naturalWidth / 4;
  const ch = art.interactables.naturalHeight / 4;
  ctx.save();
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(art.interactables, sprite.col * cw, sprite.row * ch, cw, ch, x - w / 2, y - h / 2, w, h);
  ctx.restore();
}

function drawSpritePlayer(water) {
  if (!art.hero.complete || !art.hero.naturalWidth) {
    drawFallbackPixelHero(water);
    return;
  }
  const p = state.player;
  const moving = Math.hypot(p.vx, p.vy) > 32;
  let key = "front";
  if (water) key = "swim";
  else if (p.action === "mining") key = "mining";
  else if (state.upgrades.tidalBlade && nearBlackGate()) key = "sword";
  else if (Math.abs(p.vx) > Math.abs(p.vy) && Math.abs(p.vx) > 18) key = "side";
  else if (p.vy < -18) key = moving ? "backWalk" : "back";
  else if (moving) key = "frontWalk";
  const f = spriteFrames[key];
  const source = sheetSourceRect(f, art.hero);
  const side = key === "side" || key === "swim" || key === "sword" || key === "mining";
  const scaleX = side ? p.facing : 1;
  const w = key === "swim" ? 86 : 72;
  const h = key === "swim" ? 74 : 92;
  ctx.save();
  ctx.imageSmoothingEnabled = false;
  ctx.fillStyle = "rgba(0, 0, 0, 0.34)";
  ctx.fillRect(-22, 27, 44, 8);
  ctx.scale(scaleX, 1);
  ctx.drawImage(art.hero, source.x, source.y, source.w, source.h, -w / 2, -h + 33, w, h);
  ctx.restore();
  if (state.upgrades.deepSuit && water) {
    ctx.fillStyle = "rgba(119, 200, 223, 0.62)";
    ctx.fillRect(-20, -45, 8, 8);
  }
  if (state.upgrades.oxygenCell && water) {
    ctx.fillStyle = "#6ccf70";
    ctx.fillRect(-30, -22, 8, 18);
  }
}

function drawFallbackPixelHero(water) {
  ctx.fillStyle = water ? "#286b7a" : "#1b2f4f";
  ctx.fillRect(-14, -28, 28, 38);
  ctx.fillStyle = "#efc08a";
  ctx.fillRect(-10, -46, 20, 18);
  ctx.fillStyle = "#d5a34a";
  ctx.fillRect(-16, -52, 32, 8);
  ctx.fillStyle = "#11141d";
  ctx.fillRect(-17, 10, 12, 14);
  ctx.fillRect(5, 10, 12, 14);
}

function drawParticles() {
  for (const p of state.particles) {
    ctx.save();
    ctx.globalAlpha = clamp(p.life / p.maxLife, 0, 1);
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r, 0, TAU);
    ctx.fill();
    ctx.restore();
  }
}

function drawForeground() {
  ctx.save();
  ctx.globalAlpha = 0.18;
  ctx.fillStyle = "#f7fbf2";
  for (let i = 0; i < 80; i += 1) {
    const x = (i * 271 + state.time * (inWater(state.player.y) ? 8 : 2)) % WORLD.width;
    const y = WATERLINE + 60 + ((i * 137) % 1160);
    ctx.beginPath();
    ctx.arc(x, y, 1.2 + (i % 3), 0, TAU);
    ctx.fill();
  }
  ctx.restore();
}

function drawScreenFog(vw, vh) {
  const p = state.player;
  const depth = clamp((p.y - WATERLINE) / (WORLD.height - WATERLINE), 0, 1);
  const hazard = hazardLevel(p.x, p.y);
  ctx.fillStyle = `rgba(4, 8, 16, ${0.1 + depth * 0.16 + hazard * 0.12})`;
  ctx.fillRect(0, 0, vw, vh);
}

function drawCollectAnimation(vw, vh) {
  if (!state.collectAnim) return;
  const anim = state.collectAnim;
  const cx = vw / 2;
  const cy = clamp(vh * 0.68, 150, vh - 96);
  const t = anim.time;
  const lift = Math.sin(clamp(t / 1.55, 0, 1) * Math.PI) * 14;
  ctx.save();
  ctx.fillStyle = "rgba(5, 7, 14, 0.42)";
  ctx.fillRect(0, 0, vw, vh);
  drawPixelPanel(cx - 168, cy - 72, 336, 144);
  drawMiniHeroFrame(anim.type === "ore" ? "mining" : "swim", cx - 96, cy + 42, 78, 104);
  drawInteractable("rewardAura", cx + 44, cy - 6, 118, 118);
  drawInteractable(anim.sprite, cx + 44, cy - 6 - lift, 86, 86);
  drawPixelText(`${anim.region}采集`, cx, cy + 42, "#a8f3ff", "center", 16);
  drawPixelText(`+${anim.amount} ${anim.label}`, cx, cy + 64, anim.color, "center", 18);
  ctx.restore();
}

function drawCraftAnimation(vw, vh) {
  if (!state.craftAnim) return;
  const { key, time } = state.craftAnim;
  const visuals = recipeVisuals[key];
  if (!visuals) return;
  const cx = vw / 2;
  const cy = vh * 0.46;
  const phase = time < 1.15 ? "blueprint" : time < 2.45 ? "forge" : "reward";
  ctx.save();
  ctx.fillStyle = "rgba(5, 7, 14, 0.66)";
  ctx.fillRect(0, 0, vw, vh);
  drawPixelPanel(cx - 210, cy - 134, 420, 268);
  if (phase === "blueprint") {
    const ease = clamp(time / 1.15, 0, 1);
    const scale = 0.75 + ease * 0.25;
    drawInteractable(visuals.blueprint, cx, cy - 8, 174 * scale, 138 * scale);
    drawPixelText("设计图", cx, cy + 102, "#fff0c2", "center", 18);
  } else if (phase === "forge") {
    const t = time - 1.15;
    const shake = Math.sin(t * 34) * 5;
    drawInteractable("workshop", cx - 70 + shake, cy + 4, 156, 128);
    drawInteractable("forgeBurst", cx + 54 - shake, cy + 12, 116, 116);
    drawPixelText("打造中", cx, cy + 104, "#ffd05f", "center", 18);
  } else {
    const t = time - 2.45;
    const bob = Math.sin(t * 8) * 8;
    drawInteractable("rewardAura", cx + 66, cy - 4, 176, 176);
    drawInteractable(visuals.item, cx + 66, cy - 8 + bob, 128, 128);
    drawMiniHero(cx - 88, cy + 42);
    drawPixelText("获得装备", cx, cy + 106, "#a8f3ff", "center", 18);
    drawPixelText(visuals.label, cx, cy + 130, "#fff0c2", "center", 16);
  }
  ctx.restore();
}

function drawWorkshopMenu(vw, vh) {
  if (!state.workshopMenu.open) return;
  const width = Math.min(660, vw - 28);
  const height = Math.min(500, vh - 28);
  const x = (vw - width) / 2;
  const y = (vh - height) / 2;
  ctx.save();
  ctx.fillStyle = "rgba(5, 7, 14, 0.66)";
  ctx.fillRect(0, 0, vw, vh);
  drawPixelPanel(x, y, width, height);
  drawPixelText("海岸工坊", x + 28, y + 34, "#fff0c2", "left", 22);
  drawMaterialLine(x + 28, y + 70);
  const rowTop = y + 112;
  const rowH = Math.min(78, (height - 164) / recipeOrder.length);
  for (let i = 0; i < recipeOrder.length; i += 1) {
    drawRecipeMenuRow(recipeOrder[i], i, x + 24, rowTop + i * rowH, width - 48, rowH - 8);
  }
  drawPixelText("↑↓选择  空格打造  Esc离开", x + width / 2, y + height - 28, "#a8f3ff", "center", 15);
  ctx.restore();
}

function drawMaterialLine(x, y) {
  const items = [
    ["ore", "ore"],
    ["algae", "algaeInteractive"],
    ["abyss", "abyssOre"],
  ];
  let offset = 0;
  for (const [key, sprite] of items) {
    drawInteractable(sprite, x + offset + 18, y + 13, 30, 30);
    drawPixelText(`${resourceVisuals[key].label} ${state.inventory[key]}`, x + offset + 40, y + 14, "#ffd05f", "left", 15);
    offset += 150;
  }
}

function drawRecipeMenuRow(key, index, x, y, w, h) {
  const recipe = recipes[key];
  const visuals = recipeVisuals[key];
  const done = state.upgrades[key];
  const affordable = canAfford(recipe);
  const selected = index === state.workshopMenu.selected;
  const status = done ? "已完成" : affordable ? "可打造" : `缺 ${missingCostLabel(recipe)}`;
  ctx.save();
  ctx.globalAlpha = done ? 0.78 : affordable ? 1 : 0.62;
  ctx.fillStyle = selected ? "#3a2e27" : "#151e31";
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = selected ? "#ffd05f" : "#3b3145";
  ctx.fillRect(x, y, w, 3);
  ctx.fillRect(x, y + h - 3, w, 3);
  ctx.fillRect(x, y, 3, h);
  ctx.fillRect(x + w - 3, y, 3, h);
  drawInteractable(done ? visuals.item : visuals.blueprint, x + 42, y + h / 2, 54, 54);
  drawPixelText(recipe.label, x + 82, y + h / 2 - 13, "#fff0c2", "left", 17);
  drawPixelText(recipe.costLabel, x + 82, y + h / 2 + 12, "#a9b5bf", "left", 13);
  drawPixelText(status, x + w - 24, y + h / 2, affordable && !done ? "#6ccf70" : "#ffd05f", "right", 15);
  ctx.restore();
}

function drawPixelPanel(x, y, w, h) {
  ctx.fillStyle = "#151e31";
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = "#fff0c2";
  ctx.fillRect(x, y, w, 4);
  ctx.fillRect(x, y + h - 4, w, 4);
  ctx.fillRect(x, y, 4, h);
  ctx.fillRect(x + w - 4, y, 4, h);
  ctx.fillStyle = "#2b2332";
  ctx.fillRect(x + 8, y + 8, w - 16, 4);
  ctx.fillRect(x + 8, y + h - 12, w - 16, 4);
}

function drawPixelText(text, x, y, color, align = "left", size = 16) {
  ctx.font = `900 ${size}px "Courier New", monospace`;
  ctx.textAlign = align;
  ctx.textBaseline = "middle";
  ctx.fillStyle = "#15101b";
  ctx.fillText(text, x + 2, y + 2);
  ctx.fillStyle = color;
  ctx.fillText(text, x, y);
}

function drawMiniHero(x, y) {
  drawMiniHeroFrame("front", x, y, 84, 112);
}

function drawMiniHeroFrame(frameKey, x, y, w, h) {
  if (!art.hero.complete || !art.hero.naturalWidth) return;
  const f = spriteFrames[frameKey] || spriteFrames.front;
  const source = sheetSourceRect(f, art.hero);
  ctx.save();
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(art.hero, source.x, source.y, source.w, source.h, x - w / 2, y - h + 14, w, h);
  ctx.restore();
}

function sheetSourceRect(frame, image) {
  const scaleX = image.naturalWidth / SOURCE_SHEET_SIZE.w;
  const scaleY = image.naturalHeight / SOURCE_SHEET_SIZE.h;
  return {
    x: Math.round((frame.col * SPRITE_CELL.w + frame.sx) * scaleX),
    y: Math.round((frame.row * SPRITE_CELL.h + frame.sy) * scaleY),
    w: Math.round(frame.sw * scaleX),
    h: Math.round(frame.sh * scaleY),
  };
}

function pixelCircle(cx, cy, r, step) {
  for (let y = -r; y <= r; y += step) {
    for (let x = -r; x <= r; x += step) {
      if (x * x + y * y <= r * r) ctx.fillRect(cx + x, cy + y, step, step);
    }
  }
}

function pixelRing(cx, cy, r, step) {
  const oldFill = ctx.fillStyle;
  ctx.fillStyle = ctx.strokeStyle;
  for (let y = -r; y <= r; y += step) {
    for (let x = -r; x <= r; x += step) {
      const d = x * x + y * y;
      if (d <= r * r && d >= (r - step * 1.5) * (r - step * 1.5)) ctx.fillRect(cx + x, cy + y, step, step);
    }
  }
  ctx.fillStyle = oldFill;
}

function roundedRect(x, y, w, h, r) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + w - radius, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
  ctx.lineTo(x + w, y + h - radius);
  ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
  ctx.lineTo(x + radius, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

window.addEventListener("resize", resize);
window.addEventListener("keydown", (event) => {
  const key = event.key.toLowerCase();
  if (state?.workshopMenu?.open) {
    if (["arrowup", "arrowdown", "w", "s", "enter", " ", "escape"].includes(key)) event.preventDefault();
    if (key === "arrowup" || key === "w") moveWorkshopSelection(-1);
    if (key === "arrowdown" || key === "s") moveWorkshopSelection(1);
    if (key === "enter" || key === " ") craftSelectedRecipe();
    if (key === "escape") closeWorkshopMenu();
    updateHud();
    draw();
    return;
  }
  keys.add(key);
  if (["arrowup", "arrowdown", "arrowleft", "arrowright", " "].includes(key)) event.preventDefault();
  if (key === "e" || key === " ") interact();
  if (key === "enter" && !running) startGame();
});
window.addEventListener("keyup", (event) => {
  keys.delete(event.key.toLowerCase());
});

startButton.addEventListener("click", startGame);
restartButton.addEventListener("click", startGame);

resize();
state = initialState();
updateHud();
draw();
