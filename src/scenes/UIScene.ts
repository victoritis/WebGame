// @ts-ignore
import Phaser from "phaser";
import { computeMinimapTransform } from "../ui/minimapUtils";

export default class UIScene extends Phaser.Scene {
  private scoreText!: any;
  private fpsText!: any;
  private posText!: any;
  private staminaBg!: any;
  private staminaFill!: any;
  private miniFrame!: any;
  private miniViewport!: any;
  private miniRect = { x: 0, y: 0, w: 0, h: 0 };
  private smoothVP = { x: 0, y: 0, w: 0, h: 0 };
  private miniDotsRT!: any;  // RT para puntos (tipado laxo para evitar dependencia directa)
  private miniZoom = 1; private readonly MIN_ZOOM = 0.5; private readonly MAX_ZOOM = 3;
  private miniOrigin = { x: 0, y: 0 };
  private showGrid = true;
  private miniPlayerArrow!: any; // flecha jugador (brújula)
  private gridLabel!: any; // etiqueta toggle rejilla
  private startTime = 0;
  private timeText!: any;
  private gameOverShown = false;
  private restartButton?: any;
  private livesGroup?: any;

  constructor() { super("UIScene"); }

  create() {
    const style = { fontFamily: "monospace", fontSize: "16px", color: "#ffffff" } as const;
    this.scoreText = this.add.text(16, 14, "Puntos: 0", style).setScrollFactor(0);
    this.drawLives();
    this.registry.events.on("changedata-lives", () => this.drawLives());
    this.fpsText = this.add.text(16, 36, "FPS: --", style).setScrollFactor(0);
    this.posText = this.add.text(16, 58, "Pos: --, --", style).setScrollFactor(0);
    this.add.text(16, 86, "Controles: WASD/flechas, Shift(sprint), -/= /0 zoom", { ...style, color: "#c8e6c9" }).setScrollFactor(0);
    this.add.text(16, 108, "M: mute, V: vol+  B: vol-", { ...style, color: "#aed581" }).setScrollFactor(0);
    this.timeText = this.add.text(16, 132, "Tiempo: 0.0s", style).setScrollFactor(0);
    this.startTime = this.registry.get("startTime") ?? this.time.now;
    if (!this.registry.get("startTime")) this.registry.set("startTime", this.startTime);

    // Crear barras stamina (antes de cualquier uso)
    this.staminaBg = this.add.graphics().setScrollFactor(0);
    this.staminaFill = this.add.graphics().setScrollFactor(0);

    const rect = this.registry.get("minimapRect");
    if (rect) this.miniRect = rect;
    this.miniFrame = this.add.graphics().setScrollFactor(0);
    this.miniViewport = this.add.graphics().setScrollFactor(0);

    // RT para dots (solo una vez)
    this.miniDotsRT = this.add.renderTexture(this.miniRect.x, this.miniRect.y, this.miniRect.w, this.miniRect.h)
      .setScrollFactor(0).setDepth(1000);

    // Flecha jugador
    this.miniPlayerArrow = this.add.image(this.miniRect.x + this.miniRect.w / 2, this.miniRect.y + this.miniRect.h / 2, "arrow_player")
      .setOrigin(0.5).setScrollFactor(0).setDepth(1002).setAlpha(0.95);

    this.drawMiniFrame();
    this.layoutStaminaBar();

    this.gridLabel = this.add.text(this.miniRect.x, this.miniRect.y - 18, "Rejilla: ON", {
      fontSize: "12px",
      color: "#ffffff"
    }).setScrollFactor(0).setDepth(1003).setInteractive({ useHandCursor: true })
      .on("pointerup", () => {
        this.showGrid = !this.showGrid;
        this.gridLabel.setText(this.showGrid ? "Rejilla: ON" : "Rejilla: OFF");
        this.drawMiniFrame();
      });

    const wheelHandler = (pointer: any, _objs: any, _dx: number, dy: number) => {
      const inside = pointer.x >= this.miniRect.x && pointer.x <= this.miniRect.x + this.miniRect.w &&
        pointer.y >= this.miniRect.y && pointer.y <= this.miniRect.y + this.miniRect.h;
      if (!inside) return;
      const factor = dy > 0 ? 0.9 : 1.1;
      this.miniZoom = Phaser.Math.Clamp(this.miniZoom * factor, this.MIN_ZOOM, this.MAX_ZOOM);
      this.smoothVP = { x: 0, y: 0, w: 0, h: 0 };
      this.drawMiniFrame();
      this.redrawMiniDots();
    };
    this.input.on("wheel", wheelHandler);

    const minimapRectHandler = (_p: any, r: any) => {
      this.miniRect = r;
      if (this.miniDotsRT) { this.miniDotsRT.setPosition(r.x, r.y); this.miniDotsRT.resize(r.w, r.h); }
      if (this.miniPlayerArrow) this.miniPlayerArrow.setPosition(r.x + r.w / 2, r.y + r.h / 2);
      if (this.gridLabel) this.gridLabel.setPosition(r.x, r.y - 18);
      this.drawMiniFrame();
      this.layoutStaminaBar();
      this.smoothVP = { x: 0, y: 0, w: 0, h: 0 };
      this.redrawMiniDots();
    };
    this.registry.events.on("changedata-minimapRect", minimapRectHandler);

    this.time.addEvent({
      delay: 120,
      loop: true,
      callback: () => {
        const fps = Math.round(this.game.loop.actualFps); this.fpsText.setText(`FPS: ${fps}`);
        const world = this.scene.get("WorldScene") as any;
        const player = world?.player ?? world?.scene?.player;
        if (player) { const x = Math.round(player.x); const y = Math.round(player.y); this.posText.setText(`Pos: ${x}, ${y}`); }
        const s = this.registry.get("stamina") ?? 1; this.updateStaminaBar(s);
        const now = this.time.now;
        const elapsed = (now - this.startTime) / 1000; this.timeText.setText(`Tiempo: ${elapsed.toFixed(1)}s`);
        this.drawViewportRect();
        this.redrawMiniDots();
        this.updatePlayerArrow();
        this.checkGameOver();
      }
    });

    this.input.keyboard.on("keydown-M", () => this.toggleMute());
    this.input.keyboard.on("keydown-V", () => this.adjustVolume(0.1));
    this.input.keyboard.on("keydown-B", () => this.adjustVolume(-0.1));

    // Limpieza en shutdown
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.registry.events.off("changedata-minimapRect", minimapRectHandler);
      this.input.off("wheel", wheelHandler as any);
    });
  }

  private drawMiniFrame() {
    const { x, y, w, h } = this.miniRect;
    this.miniFrame.clear();
    this.miniFrame.lineStyle(2, 0xffffff, 0.9).strokeRoundedRect(x - 4, y - 4, w + 8, h + 8, 8);
    this.miniFrame.fillStyle(0x000000, 0.28).fillRoundedRect(x - 4, y - 4, w + 8, h + 8, 8);
    if (this.showGrid) {
      const worldW = this.registry.get("worldW") || 3000;
      const worldH = this.registry.get("worldH") || 3000;
      const { scaleX, scaleY, originX, originY } = this.getMiniTransform();
      const step = 500;
      this.miniFrame.lineStyle(1, 0xffffff, 0.08);
      for (let gx = 0; gx < worldW; gx += step) {
        const lx = x + (gx - originX) * scaleX;
        if (lx >= x && lx <= x + w) this.miniFrame.lineBetween(lx, y, lx, y + h);
      }
      for (let gy = 0; gy < worldH; gy += step) {
        const ly = y + (gy - originY) * scaleY;
        if (ly >= y && ly <= y + h) this.miniFrame.lineBetween(x, ly, x + w, ly);
      }
    }
    this.miniFrame.lineStyle(2, 0xffffff, 0.6).lineBetween(x + w / 2, y - 8, x + w / 2, y - 2);
    this.miniFrame.lineStyle(2, 0xffffff, 0.6).lineBetween(x + w + 2, y + h / 2, x + w + 8, y + h / 2);
  }
  private drawViewportRect() {
    const vp = this.registry.get("viewport");
    if (!vp) return;
  const { scaleX, scaleY, originX, originY } = this.getMiniTransform();
    let rx = this.miniRect.x + (vp.x - originX) * scaleX;
    let ry = this.miniRect.y + (vp.y - originY) * scaleY;
    let rw = vp.w * scaleX;
    let rh = vp.h * scaleY;
    if (this.smoothVP.w > 0) {
      const a = 0.25;
      rx = this.smoothVP.x + (rx - this.smoothVP.x) * a;
      ry = this.smoothVP.y + (ry - this.smoothVP.y) * a;
      rw = this.smoothVP.w + (rw - this.smoothVP.w) * a;
      rh = this.smoothVP.h + (rh - this.smoothVP.h) * a;
    }
    this.smoothVP = { x: rx, y: ry, w: rw, h: rh };
    this.miniViewport.clear().lineStyle(1, 0xffee58, 0.95).strokeRect(rx, ry, rw, rh);
  }
  private layoutStaminaBar() {
    const { x, y, w, h } = this.miniRect; const sx = x; const sy = y + h + 12; const sw = w; const sh = 10;
    this.staminaBg.clear(); this.staminaBg.fillStyle(0x000000, 0.35).fillRoundedRect(sx - 2, sy - 2, sw + 4, sh + 4, 5);
    this.staminaFill.clear(); this.staminaFill.fillStyle(0x7cb342, 0.95).fillRoundedRect(sx, sy, sw, sh, 4);
  }
  private updateStaminaBar(pct: number) {
    const { x, y, w, h } = this.miniRect; const sx = x; const sy = y + h + 12; const sw = Math.max(0, Math.min(1, pct)) * w; const sh = 10;
    this.staminaFill.clear(); this.staminaFill.fillStyle(pct > 0.3 ? 0x7cb342 : 0xef5350, 0.95).fillRoundedRect(sx, sy, sw, sh, 4);
  }
  private checkGameOver() {
    if (this.gameOverShown) return;
    const stats = this.registry.get("finalStats");
    if (!stats) return;
    this.gameOverShown = true;
    const { score, timeMs } = stats;
    const secs = (timeMs / 1000).toFixed(1);
    const { width, height } = this.scale;
    const panel = this.add.rectangle(width / 2, height / 2, 520, 300, 0x000000, 0.78).setScrollFactor(0);
    this.add.text(panel.x - 220, panel.y - 110, `GAME OVER`, { fontSize: "42px", fontFamily: "monospace", color: "#ff5252" }).setScrollFactor(0);
    this.add.text(panel.x - 220, panel.y - 42, `Puntos: ${score}`, { fontSize: "28px", fontFamily: "monospace" }).setScrollFactor(0);
    this.add.text(panel.x - 220, panel.y - 4, `Tiempo: ${secs}s`, { fontSize: "28px", fontFamily: "monospace" }).setScrollFactor(0);
    const hs = this.registry.get("highScore") || 0;
    this.add.text(panel.x - 220, panel.y + 32, `Max Score: ${hs}`, { fontSize: "20px", fontFamily: "monospace", color: "#ffee58" }).setScrollFactor(0);
    this.restartButton = this.add.text(panel.x - 220, panel.y + 78, "[ Reiniciar ]", { fontSize: "26px", fontFamily: "monospace", color: "#81d4fa" })
      .setInteractive({ useHandCursor: true })
      .on("pointerover", () => this.restartButton?.setColor("#ffffff"))
      .on("pointerout", () => this.restartButton?.setColor("#81d4fa"))
      .on("pointerdown", () => this.restartGame());
  }

  private restartGame() {
    this.scene.stop("WorldScene");
    this.registry.set("finalStats", null);
    this.registry.set("lives", 3);
    this.scene.run("WorldScene");
    // Reset overlay
    this.scene.restart();
  }

  private redrawMiniDots() {
    if (!this.miniDotsRT) return;
    const rt = this.miniDotsRT; rt.clear();
    const worldScene = this.scene.get("WorldScene") as any;
    if (!worldScene) return;
  const { scaleX, scaleY, originX, originY } = this.getMiniTransform();
    const addDot = (x: number, y: number, key: string) => {
      const dx = (x - originX) * scaleX;
      const dy = (y - originY) * scaleY;
      if (dx < 0 || dy < 0 || dx > this.miniRect.w || dy > this.miniRect.h) return;
      rt.draw(key, Math.floor(dx), Math.floor(dy));
    };
    worldScene.coins?.children?.iterate((c: any) => { if (c.active) addDot(c.x, c.y, "dot_coin"); });
    worldScene.hazards?.children?.iterate((h: any) => { if (h.active) addDot(h.x, h.y, "dot_hazard"); });
    worldScene.powerUps?.children?.iterate((p: any) => { if (p.active) addDot(p.x, p.y, "dot_power"); });
  }

  private getMiniTransform() {
    // Deprecated interno: se delega al helper, se mantiene por compatibilidad con llamadas existentes
    const worldW = this.registry.get("worldW") || 3000;
    const worldH = this.registry.get("worldH") || 3000;
    const world = this.scene.get("WorldScene") as any;
    const focusX = world?.player?.x ?? worldW / 2;
    const focusY = world?.player?.y ?? worldH / 2;
    const t = computeMinimapTransform(this.miniRect, this.miniZoom, worldW, worldH, focusX, focusY);
    this.miniOrigin = { x: t.originX, y: t.originY };
    return t;
  }

  private updatePlayerArrow() {
    const world = this.scene.get("WorldScene") as any;
    const player = world?.player;
    if (!player || !this.miniPlayerArrow) return;
    const worldW = this.registry.get("worldW") || 3000;
    const worldH = this.registry.get("worldH") || 3000;
    const focusX = player.x;
    const focusY = player.y;
    const { scaleX, scaleY, originX, originY } = computeMinimapTransform(
      this.miniRect, this.miniZoom, worldW, worldH, focusX, focusY
    );
    const dx = this.miniRect.x + (player.x - originX) * scaleX;
    const dy = this.miniRect.y + (player.y - originY) * scaleY;
    this.miniPlayerArrow.setPosition(Math.floor(dx), Math.floor(dy));
  const body = player.body as any;
    let angle = player.rotation ?? 0;
    if (body && (Math.abs(body.velocity.x) > 0.1 || Math.abs(body.velocity.y) > 0.1))
      angle = Math.atan2(body.velocity.y, body.velocity.x);
    this.miniPlayerArrow.setRotation(angle);
    const inside = dx >= this.miniRect.x && dy >= this.miniRect.y &&
      dx <= this.miniRect.x + this.miniRect.w && dy <= this.miniRect.y + this.miniRect.h;
    this.miniPlayerArrow.setVisible(inside);
  }

  private drawLives() {
    const lives = this.registry.get("lives") ?? 0;
    if (!this.livesGroup) this.livesGroup = this.add.group();
    // Clear previous
    this.livesGroup.clear(true, true);
    const baseX = 16; const baseY = 158; const pad = 6;
    for (let i = 0; i < lives; i++) {
      const heart = this.add.image(baseX + i * (24 + pad), baseY, "heart").setScrollFactor(0).setScale(0.9);
      this.livesGroup.add(heart);
    }
  }

  private applyVolume() {
    const v = this.registry.get("volume") ?? 1;
    this.sound.volume = v;
    try { localStorage.setItem("volume", String(v)); } catch { }
  }
  private toggleMute() {
    const v = this.registry.get("volume") ?? 1;
    if (v > 0) { this.registry.set("prevVolume", v); this.registry.set("volume", 0); }
    else this.registry.set("volume", this.registry.get("prevVolume") ?? 1);
    this.applyVolume();
  }
  private adjustVolume(delta: number) {
    let v = this.registry.get("volume") ?? 1;
    v = Math.max(0, Math.min(1, +(v + delta).toFixed(2)));
    this.registry.set("volume", v);
    this.applyVolume();
  }
}
