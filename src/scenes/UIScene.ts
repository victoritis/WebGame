// @ts-ignore
import Phaser from "phaser";

export default class UIScene extends Phaser.Scene {
  private scoreText!: any;
  private fpsText!: any;
  private posText!: any;
  private staminaBg!: any;
  private staminaFill!: any;
  private miniFrame!: any;
  private miniViewport!: any;
  private miniRect = { x: 0, y: 0, w: 0, h: 0 };
  private startTime = 0;
  private timeText!: any;
  private gameOverShown = false;
  private restartButton?: any;
  private miniDotsRT?: any;
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

    const rect = this.registry.get("minimapRect");
    if (rect) this.miniRect = rect;
  this.miniFrame = this.add.graphics().setScrollFactor(0);
  this.miniViewport = this.add.graphics().setScrollFactor(0);
    this.drawMiniFrame();
    // RenderTexture para puntos del minimapa
    if (!this.miniDotsRT) {
      this.miniDotsRT = this.add.renderTexture(this.miniRect.x, this.miniRect.y, this.miniRect.w, this.miniRect.h).setScrollFactor(0).setDepth(1000);
    }

    this.staminaBg = this.add.graphics().setScrollFactor(0);
    this.staminaFill = this.add.graphics().setScrollFactor(0);
    this.layoutStaminaBar();

    this.registry.events.on("changedata-score", (_p: any, value: number) => { this.scoreText.setText(`Puntos: ${value}`); });
    this.registry.events.on("changedata-minimapRect", (_p: any, r: any) => { this.miniRect = r; this.drawMiniFrame(); this.layoutStaminaBar(); });

    this.time.addEvent({
      delay: 120,
      loop: true,
      callback: () => {
        const fps = Math.round(this.game.loop.actualFps); this.fpsText.setText(`FPS: ${fps}`);
        const world = this.scene.get("WorldScene") as any; const player = world?.player ?? world?.scene?.player;
        if (player) { const x = Math.round(player.x); const y = Math.round(player.y); this.posText.setText(`Pos: ${x}, ${y}`); }
        const s = this.registry.get("stamina") ?? 1; this.updateStaminaBar(s);
        const now = this.time.now; const elapsed = (now - this.startTime) / 1000; this.timeText.setText(`Tiempo: ${elapsed.toFixed(1)}s`);
  this.drawViewportRect();
  this.redrawMiniDots();
        this.checkGameOver();
      }
    });

  // Controles volumen
  this.input.keyboard.on("keydown-M", () => this.toggleMute());
  this.input.keyboard.on("keydown-V", () => this.adjustVolume(0.1));
  this.input.keyboard.on("keydown-B", () => this.adjustVolume(-0.1));
  }

  private drawMiniFrame() {
    const { x, y, w, h } = this.miniRect; this.miniFrame.clear();
    this.miniFrame.lineStyle(2, 0xffffff, 0.9).strokeRoundedRect(x - 4, y - 4, w + 8, h + 8, 8);
    this.miniFrame.fillStyle(0x000000, 0.25).fillRoundedRect(x - 4, y - 4, w + 8, h + 8, 8);
  }
  private drawViewportRect() {
    const vp = this.registry.get("viewport");
    if (!vp) return;
    const scaleX = this.miniRect.w / (this.registry.get("worldW") ?? 3000);
    const scaleY = this.miniRect.h / (this.registry.get("worldH") ?? 3000);
    const rx = this.miniRect.x + vp.x * scaleX;
    const ry = this.miniRect.y + vp.y * scaleY;
    const rw = vp.w * scaleX;
    const rh = vp.h * scaleY;
    this.miniViewport.clear();
    this.miniViewport.lineStyle(1, 0xffee58, 0.9).strokeRect(rx, ry, rw, rh);
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
    const rt = this.miniDotsRT;
    rt.clear();
    const worldW = this.registry.get("worldW") || 3000;
    const worldH = this.registry.get("worldH") || 3000;
    const scaleX = this.miniRect.w / worldW;
    const scaleY = this.miniRect.h / worldH;
    const worldScene = this.scene.get("WorldScene") as any;
    if (!worldScene) return;
    const addSpriteDot = (x: number, y: number, key: string) => {
      const dx = x * scaleX;
      const dy = y * scaleY;
      if (dx < 0 || dy < 0 || dx > this.miniRect.w || dy > this.miniRect.h) return;
      rt.draw(key, dx, dy, 1);
    };
    if (worldScene.player) addSpriteDot(worldScene.player.x, worldScene.player.y, "dot_player");
    worldScene.coins?.children?.iterate((c: any) => { if (c.active) addSpriteDot(c.x, c.y, "dot_coin"); });
    worldScene.hazards?.children?.iterate((h: any) => { if (h.active) addSpriteDot(h.x, h.y, "dot_hazard"); });
    worldScene.powerUps?.children?.iterate((p: any) => { if (p.active) addSpriteDot(p.x, p.y, "dot_power"); });
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
    try { localStorage.setItem("volume", String(v)); } catch {}
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
