import { PlayerState, Platform, ENEMY_CONFIG, EnemyType, PipeSpawn } from './types';

const VIEWPORT_W = 960;
const CANVAS_H = 600;
const PLAYER_W = 32;
const PLAYER_H = 48;

interface Enemy {
  x: number; y: number; type: EnemyType; startX: number; patrolRange: number; dir: number; alive: boolean;
}
interface Coin {
  x: number; y: number; collected: boolean;
}
interface Terminal {
  x: number; y: number; questionIndex: number; used: boolean;
}

export function renderFrame(
  ctx: CanvasRenderingContext2D,
  p: PlayerState,
  cam: number,
  platforms: Platform[],
  coins: Coin[],
  enemies: Enemy[],
  terminals: Terminal[],
  pipes: PipeSpawn[],
  isUnderground: boolean,
  lockX: number = 0,
) {
  // Background
  ctx.fillStyle = isUnderground ? '#0a0800' : '#080c14';
  ctx.fillRect(0, 0, VIEWPORT_W, CANVAS_H);

  // Render Progress Lock Barrier
  if (lockX > 0) {
    const barrierX = lockX - cam;
    if (barrierX > -50 && barrierX < VIEWPORT_W + 50) {
      ctx.save();
      
      // Create a glowing gradient for the barrier
      const gradient = ctx.createLinearGradient(barrierX, 0, barrierX + 20, 0);
      gradient.addColorStop(0, 'rgba(255, 0, 80, 0.4)'); // Neon pink/red edge
      gradient.addColorStop(1, 'rgba(255, 0, 80, 0)');   // Fade out
      
      ctx.fillStyle = gradient;
      ctx.fillRect(barrierX, 0, 20, CANVAS_H);
      
      // Solid edge line
      ctx.strokeStyle = 'rgba(255, 0, 80, 0.8)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(barrierX, 0);
      ctx.lineTo(barrierX, CANVAS_H);
      ctx.stroke();

      // Add some "locked" text or symbols occasionally
      ctx.fillStyle = 'rgba(255, 0, 80, 0.6)';
      ctx.font = '8px "Press Start 2P"';
      ctx.textAlign = 'left';
      ctx.save();
      ctx.translate(barrierX + 5, CANVAS_H / 2);
      ctx.rotate(-Math.PI / 2);
      ctx.fillText('AREA LOCKED', 0, 0);
      ctx.restore();

      ctx.restore();
    }
  }

  // Grid background - blue tint
  const gridColor = isUnderground ? 'rgba(180, 120, 0, 0.05)' : 'rgba(100, 150, 255, 0.05)';
  ctx.strokeStyle = gridColor;
  ctx.lineWidth = 1;
  for (let x = -cam % 60; x < VIEWPORT_W; x += 60) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, CANVAS_H); ctx.stroke();
  }
  for (let y = 0; y < CANVAS_H; y += 60) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(VIEWPORT_W, y); ctx.stroke();
  }

  // Platforms with depth shadow and edge glow
  const platColor = isUnderground ? '#1a1200' : '#101830';
  const platGlow = isUnderground ? '#bb8800' : '#6090ff';
  for (const plat of platforms) {
    const px = plat.x - cam;
    if (px + plat.width < -50 || px > VIEWPORT_W + 50) continue;
    const isGround = plat.y >= 490;

    // Shadow under platform for depth
    if (!isGround) {
      ctx.fillStyle = 'rgba(0,0,0,0.3)';
      ctx.fillRect(px + 4, plat.y + plat.height, plat.width, 6);
    }

    // Platform body
    ctx.fillStyle = isGround ? (isUnderground ? '#0d0800' : '#0a1225') : platColor;
    ctx.fillRect(px, plat.y, plat.width, plat.height);

    // Border
    ctx.strokeStyle = platGlow;
    ctx.lineWidth = isGround ? 2 : 1;
    ctx.strokeRect(px, plat.y, plat.width, plat.height);

    // Top edge glow for climbable platforms
    if (!isGround) {
      ctx.save();
      ctx.shadowColor = platGlow;
      ctx.shadowBlur = 10;
      ctx.fillStyle = platGlow;
      ctx.fillRect(px, plat.y, plat.width, 2);
      // Corner markers
      ctx.fillRect(px, plat.y, 4, plat.height);
      ctx.fillRect(px + plat.width - 4, plat.y, 4, plat.height);
      ctx.shadowBlur = 0;
      ctx.restore();
    }
  }

  // Pipes - blue-red gradient style
  for (const pipe of pipes) {
    // Only draw pipes relevant to current layer
    if (isUnderground && !pipe.isReturn) continue;
    if (!isUnderground && pipe.isReturn) continue;
    const px = pipe.x - cam;
    if (px < -60 || px > VIEWPORT_W + 60) continue;
    ctx.save();
    // Pipe body
    ctx.fillStyle = '#1a2266';
    // Slightly extend into ground for visual anchoring
    ctx.fillRect(px - 20, pipe.y, 40, 60);
    // Pipe rim
    ctx.fillStyle = '#4466cc';
    ctx.fillRect(px - 25, pipe.y, 50, 12);
    ctx.strokeStyle = '#6090ff';
    ctx.lineWidth = 2;
    ctx.strokeRect(px - 25, pipe.y, 50, 12);
    // Glow
    ctx.shadowColor = '#6090ff';
    ctx.shadowBlur = 10;
    ctx.fillStyle = '#6090ff';
    ctx.fillRect(px - 5, pipe.y + 15, 10, 20);
    ctx.shadowBlur = 0;
    // Prompt
    if (!pipe.isReturn && Math.abs(p.x + p.width / 2 - pipe.x) < 40 && Math.abs(p.y + p.height - pipe.y) < 60) {
      ctx.fillStyle = '#6090ff';
      ctx.font = '8px "Press Start 2P"';
      ctx.textAlign = 'center';
      ctx.fillText('AUTO ENTER', px, pipe.y - 10);
    }
    if (pipe.isReturn && Math.abs(p.x + p.width / 2 - pipe.x) < 40 && Math.abs(p.y + p.height - pipe.y) < 60) {
      ctx.fillStyle = '#6090ff';
      ctx.font = '8px "Press Start 2P"';
      ctx.textAlign = 'center';
      ctx.fillText('AUTO EXIT', px, pipe.y - 10);
    }
    ctx.restore();
  }

  // Coins
  for (const coin of coins) {
    if (coin.collected) continue;
    const cx = coin.x - cam;
    if (cx < -20 || cx > VIEWPORT_W + 20) continue;
    const t = Date.now() / 300;
    ctx.save();
    ctx.shadowColor = '#ffdd00';
    ctx.shadowBlur = 10;
    ctx.fillStyle = '#ffdd00';
    ctx.beginPath();
    ctx.arc(cx, coin.y + Math.sin(t + coin.x) * 3, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#aa8800';
    ctx.font = '10px "Press Start 2P"';
    ctx.textAlign = 'center';
    ctx.fillText('$', cx, coin.y + 4 + Math.sin(t + coin.x) * 3);
    ctx.restore();
  }

  // Enemies with type-specific visuals
  for (const enemy of enemies) {
    if (!enemy.alive) continue;
    const ex = enemy.x - cam;
    if (ex < -30 || ex > VIEWPORT_W + 30) continue;
    const config = ENEMY_CONFIG[enemy.type];
    ctx.save();
    ctx.shadowColor = config.color;
    ctx.shadowBlur = 12;
    ctx.fillStyle = config.color;

    if (enemy.type === 'debug-ghost') {
      ctx.globalAlpha = 0.6 + Math.sin(Date.now() / 200) * 0.3;
      ctx.beginPath();
      ctx.arc(ex, enemy.y - 6, 14, Math.PI, 0);
      ctx.lineTo(ex + 14, enemy.y + 10);
      ctx.lineTo(ex + 7, enemy.y + 4);
      ctx.lineTo(ex, enemy.y + 10);
      ctx.lineTo(ex - 7, enemy.y + 4);
      ctx.lineTo(ex - 14, enemy.y + 10);
      ctx.closePath();
      ctx.fill();
      ctx.globalAlpha = 1;
    } else if (enemy.type === 'virus-bug') {
      const spikes = 8;
      ctx.beginPath();
      for (let i = 0; i < spikes * 2; i++) {
        const angle = (i / (spikes * 2)) * Math.PI * 2;
        const r = i % 2 === 0 ? 16 : 10;
        ctx.lineTo(ex + Math.cos(angle) * r, enemy.y + Math.sin(angle) * r);
      }
      ctx.closePath();
      ctx.fill();
    } else {
      ctx.fillRect(ex - 12, enemy.y - 12, 24, 24);
    }

    // Eyes
    ctx.fillStyle = '#000';
    ctx.fillRect(ex - 6, enemy.y - 6, 5, 5);
    ctx.fillRect(ex + 2, enemy.y - 6, 5, 5);

    // Label
    ctx.fillStyle = config.color;
    ctx.font = '6px "Press Start 2P"';
    ctx.textAlign = 'center';
    ctx.fillText(config.label, ex, enemy.y - 18);
    ctx.restore();
  }

  // Terminals - blue accent (surface only)
  if (!isUnderground) {
    for (const terminal of terminals) {
      const tx = terminal.x - cam;
      if (tx < -30 || tx > VIEWPORT_W + 30) continue;
      ctx.save();
      ctx.shadowColor = terminal.used ? '#333' : '#6090ff';
      ctx.shadowBlur = terminal.used ? 0 : 15;
      ctx.fillStyle = terminal.used ? '#1a1a2e' : '#0a1a3a';
      ctx.fillRect(tx - 15, terminal.y, 30, 40);
      ctx.strokeStyle = terminal.used ? '#333' : '#6090ff';
      ctx.lineWidth = 2;
      ctx.strokeRect(tx - 15, terminal.y, 30, 40);
      ctx.fillStyle = terminal.used ? '#111' : '#6090ff';
      ctx.fillRect(tx - 10, terminal.y + 5, 20, 15);
      if (!terminal.used) {
        ctx.fillStyle = '#000';
        ctx.font = '6px "Press Start 2P"';
        ctx.textAlign = 'center';
        ctx.fillText('>', tx, terminal.y + 15);
      }
      if (!terminal.used && Math.abs(p.x + p.width / 2 - terminal.x) < 40 && Math.abs(p.y + p.height - terminal.y - 40) < 40) {
        ctx.fillStyle = '#6090ff';
        ctx.font = '8px "Press Start 2P"';
        ctx.textAlign = 'center';
        ctx.fillText('[E] HACK', tx, terminal.y - 10);
      }
      ctx.restore();
    }
  }

  // Player - blue-red gradient character
  const ppx = p.x - cam;
  ctx.save();
  ctx.shadowColor = '#6090ff';
  ctx.shadowBlur = 12;

  // Crouch adjustment
  let py = p.y;
  let ph = PLAYER_H;
  if (p.isCrouching) {
    py += 20;
    ph -= 20;
  }

  // Body - blue
  ctx.fillStyle = '#5080dd';
  ctx.fillRect(ppx + 4, py + 8, PLAYER_W - 8, ph - 16);
  // Head - darker blue
  ctx.fillStyle = '#3060bb';
  ctx.fillRect(ppx + 6, py, PLAYER_W - 12, 14);
  // Visor - red accent
  ctx.fillStyle = '#dd4466';
  const visorX = p.facing === 'right' ? ppx + 14 : ppx + 6;
  ctx.fillRect(visorX, py + 4, 12, 5);
  // Legs
  const legAnim = Math.abs(p.vx) > 0 ? Math.sin(Date.now() / 80) * 4 : 0;
  ctx.fillStyle = '#2a4488';
  ctx.fillRect(ppx + 6, py + ph - 10 + (p.isCrouching ? 0 : legAnim), 8, 10);
  ctx.fillRect(ppx + PLAYER_W - 14, py + ph - 10 - (p.isCrouching ? 0 : legAnim), 8, 10);
  ctx.restore();

  // End gate - blue-red
  const CANVAS_W = 2400;
  const gateX = CANVAS_W - 60 - cam;
  if (gateX > -50 && gateX < VIEWPORT_W + 50) {
    ctx.save();
    ctx.shadowColor = '#6090ff';
    ctx.shadowBlur = 20;
    ctx.strokeStyle = '#6090ff';
    ctx.lineWidth = 3;
    ctx.strokeRect(gateX, CANVAS_H - 160, 40, 60);
    ctx.fillStyle = 'rgba(96,144,255,0.1)';
    ctx.fillRect(gateX, CANVAS_H - 160, 40, 60);
    ctx.fillStyle = '#6090ff';
    ctx.font = '7px "Press Start 2P"';
    ctx.textAlign = 'center';
    ctx.fillText('EXIT', gateX + 20, CANVAS_H - 170);
    ctx.restore();
  }
}
