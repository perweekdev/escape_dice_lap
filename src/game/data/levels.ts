export interface PlatformDef {
  x: number
  y: number
  width: number
  height: number
  kind?: 'static' | 'moving' | 'crumble'
  moveAxis?: 'x' | 'y'
  moveRange?: number
  moveSpeed?: number
  crumbleDelay?: number
}

export interface HazardDef {
  kind: 'spike' | 'laser'
  x: number
  y: number
  width: number
  height: number
  axis?: 'h' | 'v'
  flashInterval?: number
}

export interface LevelDef {
  id: number
  name: string
  worldWidth: number
  worldHeight: number
  spawnX: number
  spawnY: number
  platforms: PlatformDef[]
  hazards: HazardDef[]
  dice: { x: number; y: number }
  exit: { x: number; y: number; width: number; height: number }
}

export const LEVELS: LevelDef[] = [
  // STAGE 1 — INIT ZONE
  {
    id: 1,
    name: 'INIT ZONE',
    worldWidth: 960,
    worldHeight: 540,
    spawnX: 80,
    spawnY: 420,
    platforms: [
      // ground
      { x: 0, y: 500, width: 960, height: 40 },
      // stepping stones going up-right
      { x: 160, y: 420, width: 128, height: 16 },
      { x: 320, y: 340, width: 128, height: 16 },
      { x: 480, y: 260, width: 128, height: 16 },
      { x: 640, y: 180, width: 160, height: 16 },
      // dice platform
      { x: 480, y: 380, width: 96, height: 16 },
    ],
    hazards: [],
    dice: { x: 528, y: 350 },
    exit: { x: 700, y: 136, width: 48, height: 48 },
  },

  // STAGE 2 — CALIBRATION ZONE
  {
    id: 2,
    name: 'CALIBRATION ZONE',
    worldWidth: 1440,
    worldHeight: 540,
    spawnX: 80,
    spawnY: 420,
    platforms: [
      // starting ground
      { x: 0, y: 500, width: 280, height: 40 },
      // first hop — static, easy reach
      { x: 300, y: 420, width: 128, height: 16 },
      // moving platform (x-axis), close enough to jump to
      { x: 460, y: 350, width: 112, height: 16, kind: 'moving', moveAxis: 'x', moveRange: 80, moveSpeed: 70 },
      // static landing pad
      { x: 680, y: 300, width: 128, height: 16 },
      // moving platform (x-axis)
      { x: 860, y: 240, width: 112, height: 16, kind: 'moving', moveAxis: 'x', moveRange: 90, moveSpeed: 85 },
      // static platform
      { x: 1060, y: 200, width: 128, height: 16 },
      // final moving platform before exit
      { x: 1230, y: 260, width: 112, height: 16, kind: 'moving', moveAxis: 'x', moveRange: 70, moveSpeed: 95 },
      // dice platform — static, clearly visible
      { x: 560, y: 420, width: 112, height: 16 },
    ],
    hazards: [],
    dice: { x: 616, y: 390 },
    exit: { x: 1370, y: 216, width: 48, height: 48 },
  },

  // STAGE 3 — PRESSURE TEST ZONE
  {
    id: 3,
    name: 'PRESSURE TEST ZONE',
    worldWidth: 1440,
    worldHeight: 540,
    spawnX: 80,
    spawnY: 420,
    platforms: [
      { x: 0, y: 500, width: 200, height: 40 },
      { x: 240, y: 420, width: 96, height: 16, kind: 'crumble', crumbleDelay: 800 },
      { x: 380, y: 360, width: 96, height: 16, kind: 'crumble', crumbleDelay: 600 },
      { x: 520, y: 300, width: 96, height: 16, kind: 'crumble', crumbleDelay: 700 },
      { x: 660, y: 240, width: 128, height: 16 },
      { x: 820, y: 180, width: 96, height: 16, kind: 'crumble', crumbleDelay: 500 },
      { x: 960, y: 280, width: 128, height: 16 },
      { x: 1100, y: 200, width: 96, height: 16, kind: 'crumble', crumbleDelay: 600 },
      { x: 1240, y: 160, width: 160, height: 16 },
      // dice platform in risky area
      { x: 660, y: 380, width: 80, height: 16 },
    ],
    hazards: [
      { kind: 'spike', x: 200, y: 476, width: 40, height: 24 },
      { kind: 'spike', x: 340, y: 476, width: 40, height: 24 },
      { kind: 'spike', x: 500, y: 476, width: 40, height: 24 },
      { kind: 'spike', x: 640, y: 476, width: 40, height: 24 },
      { kind: 'spike', x: 800, y: 476, width: 40, height: 24 },
      { kind: 'spike', x: 940, y: 476, width: 40, height: 24 },
      { kind: 'spike', x: 1100, y: 476, width: 40, height: 24 },
    ],
    dice: { x: 700, y: 350 },
    exit: { x: 1300, y: 116, width: 48, height: 48 },
  },

  // STAGE 4 — DISRUPTION ZONE
  {
    id: 4,
    name: 'DISRUPTION ZONE',
    worldWidth: 1920,
    worldHeight: 540,
    spawnX: 80,
    spawnY: 420,
    platforms: [
      // safe starting ground — no laser covers this area (x 0~260)
      { x: 0, y: 500, width: 260, height: 40 },
      { x: 280, y: 400, width: 128, height: 16 },
      { x: 450, y: 320, width: 112, height: 16 },
      { x: 620, y: 400, width: 128, height: 16 },
      { x: 800, y: 300, width: 112, height: 16 },
      { x: 980, y: 220, width: 160, height: 16 },
      { x: 1190, y: 320, width: 128, height: 16, kind: 'moving', moveAxis: 'x', moveRange: 80, moveSpeed: 90 },
      { x: 1390, y: 240, width: 112, height: 16 },
      { x: 1560, y: 320, width: 128, height: 16 },
      { x: 1720, y: 220, width: 192, height: 16 },
    ],
    hazards: [
      // vertical lasers — none near spawn (x<260)
      { kind: 'laser', x: 420, y: 300, width: 12, height: 200, axis: 'v', flashInterval: 2000 },
      { kind: 'laser', x: 760, y: 280, width: 12, height: 220, axis: 'v', flashInterval: 2500 },
      // horizontal laser starts at x=300 — spawn area (x<260) is safe
      { kind: 'laser', x: 300, y: 460, width: 700, height: 12, axis: 'h', flashInterval: 3000 },
      { kind: 'laser', x: 1350, y: 220, width: 12, height: 280, axis: 'v', flashInterval: 1800 },
    ],
    dice: { x: 828, y: 270 },
    exit: { x: 1840, y: 176, width: 48, height: 48 },
  },

  // STAGE 5 — ESCAPE ROUTE
  {
    id: 5,
    name: 'ESCAPE ROUTE',
    worldWidth: 1920,
    worldHeight: 540,
    spawnX: 80,
    spawnY: 420,
    platforms: [
      { x: 0, y: 500, width: 160, height: 40 },
      { x: 200, y: 420, width: 96, height: 16, kind: 'crumble', crumbleDelay: 700 },
      { x: 360, y: 350, width: 96, height: 16, kind: 'moving', moveAxis: 'x', moveRange: 100, moveSpeed: 110 },
      { x: 560, y: 280, width: 96, height: 16, kind: 'crumble', crumbleDelay: 500 },
      { x: 720, y: 360, width: 96, height: 16, kind: 'moving', moveAxis: 'y', moveRange: 100, moveSpeed: 80 },
      { x: 880, y: 240, width: 128, height: 16 },
      { x: 1060, y: 300, width: 96, height: 16, kind: 'crumble', crumbleDelay: 600 },
      { x: 1220, y: 200, width: 96, height: 16, kind: 'moving', moveAxis: 'x', moveRange: 90, moveSpeed: 120 },
      { x: 1420, y: 260, width: 128, height: 16 },
      { x: 1600, y: 180, width: 96, height: 16, kind: 'crumble', crumbleDelay: 550 },
      { x: 1760, y: 140, width: 160, height: 16 },
    ],
    hazards: [
      { kind: 'spike', x: 160, y: 476, width: 40, height: 24 },
      { kind: 'spike', x: 320, y: 476, width: 40, height: 24 },
      { kind: 'spike', x: 480, y: 476, width: 40, height: 24 },
      { kind: 'spike', x: 640, y: 476, width: 40, height: 24 },
      { kind: 'laser', x: 500, y: 260, width: 12, height: 240, axis: 'v', flashInterval: 2200 },
      { kind: 'laser', x: 1000, y: 220, width: 12, height: 280, axis: 'v', flashInterval: 1800 },
      { kind: 'laser', x: 1380, y: 240, width: 12, height: 260, axis: 'v', flashInterval: 2000 },
      { kind: 'spike', x: 900, y: 476, width: 40, height: 24 },
      { kind: 'spike', x: 1100, y: 476, width: 40, height: 24 },
    ],
    dice: { x: 1450, y: 230 },
    exit: { x: 1840, y: 96, width: 48, height: 48 },
  },
]
