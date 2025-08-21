// @ts-ignore
import Phaser from "phaser";
// Import sin extensión aceptado por moduleResolution Bundler (Vite)
import Player from "../objects/Player";

export default class WorldScene extends Phaser.Scene {
  private worldW = 3000;
  private worldH = 3000;

  public player!: Player;
  private obstacles!: any;
  private coins!: any;
  private hazards!: any;
  private powerUps!: any;

  private cursors!: any;
  private keys!: any;

  private mainCam!: any;
  private minimapCam!: any;
  private fogRT!: any;
  private fogNeedsRedraw = true;

  constructor() { super("WorldScene"); }

  create() {
    console.info("[WorldScene] create start");
    if (!this.textures.exists("floor_plain")) {
      console.warn("[WorldScene] floor_plain missing, generating fallback");
      const g = this.make.graphics({ add: false });
      g.fillStyle(0x2e7d32, 1).fillRect(0, 0, 64, 64);
      g.generateTexture("floor_plain", 64, 64); g.destroy();
    }
    this.buildBackground();
    this.physics.world.setBounds(0, 0, this.worldW, this.worldH);
  this.registry.set("worldW", this.worldW);
  this.registry.set("worldH", this.worldH);
  this.registry.set("startTime", this.time.now);
  this.registry.set("finalStats", null);
  this.registry.set("score", 0);
  this.registry.set("difficulty", 1);

    // Input
    this.cursors = this.input.keyboard.createCursorKeys();
  const { W, A, S, D } = this.input.keyboard.addKeys("W,A,S,D") as any;
    const SHIFT = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SHIFT);
    const ZOUT = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.MINUS);
    const ZIN = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.EQUALS);
    const ZRST = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ZERO);
    this.keys = { W, A, S, D, SHIFT, ZIN, ZOUT, ZRST };

    // Player
    const spawnX = this.worldW / 2;
    const spawnY = this.worldH / 2;
    this.player = new Player(this, spawnX, spawnY, this.cursors, { W, A, S, D }, SHIFT);
    this.add.existing(this.player);
    this.physics.add.existing(this.player);
    this.player.setCollideWorldBounds(true);

    // Cámara principal cercana
    this.mainCam = this.cameras.main;
    this.mainCam.startFollow(this.player, true, 0.12, 0.12);
    this.mainCam.setBounds(0, 0, this.worldW, this.worldH);
    this.mainCam.setZoom(2.2);
    this.mainCam.setRoundPixels(true);

  // Obstáculos / monedas / peligros
    this.obstacles = this.physics.add.staticGroup();
    this.spawnObstacles(60, 220);
    this.coins = this.physics.add.group({ allowGravity: false });
    if (this.registry.get("score") == null) this.registry.set("score", 0);
    this.spawnCoins(80, 160);
  this.hazards = this.physics.add.staticGroup();
  this.spawnHazards(18, 260);
  this.powerUps = this.physics.add.staticGroup();
  this.spawnPowerUps();
  console.info("[WorldScene] obstacles:", this.obstacles.getLength?.(), "coins:", this.coins.getLength?.(), "hazards:", this.hazards.getLength?.());

    this.physics.add.collider(this.player, this.obstacles);
    this.physics.add.overlap(this.player, this.coins, this.onCollectCoin as any, undefined, this);
  this.physics.add.overlap(this.player, this.hazards, this.onHitHazard as any, undefined, this);
  this.physics.add.overlap(this.player, this.powerUps, this.onTakePowerUp as any, undefined, this);

    // Minimapa
    const MM_W = 220, MM_H = 220, PAD = 16;
    const MM_X = this.scale.width - MM_W - PAD;
    const MM_Y = PAD;
    const fitZoom = Math.min(MM_W / this.worldW, MM_H / this.worldH);
    this.minimapCam = this.cameras.add(MM_X, MM_Y, MM_W, MM_H)
      .setZoom(fitZoom)
      .setScroll(0, 0)
      .setBackgroundColor(0x000000)
      .setName("minimap");
    this.minimapCam.setRoundPixels(true);
    this.registry.set("minimapRect", { x: MM_X, y: MM_Y, w: MM_W, h: MM_H });

  // Fog of war (exploración)
  this.initFog();
  console.info("[WorldScene] fog initialized", !!this.fogRT);

    // Depth sorting periódico
    this.time.addEvent({
      delay: 120,
      loop: true,
      callback: () => {
    if (!this.player) return;
        this.children.each((obj: any) => {
          if (obj && typeof obj.y === "number" && obj.texture && obj !== this.player) obj.setDepth(obj.y);
        });
        this.player.setDepth(this.player.y + 1);
      }
    });
  console.info("[WorldScene] create end");
  }

  private buildBackground() {
    const CHUNK = 512;
    const cols = Math.ceil(this.worldW / CHUNK);
    const rows = Math.ceil(this.worldH / CHUNK);
    for (let cy = 0; cy < rows; cy++) {
      for (let cx = 0; cx < cols; cx++) {
        const w = Math.min(CHUNK, this.worldW - cx * CHUNK);
        const h = Math.min(CHUNK, this.worldH - cy * CHUNK);
        const ts = this.add.tileSprite(cx * CHUNK, cy * CHUNK, w, h, "floor_plain") as any;
        ts.setOrigin(0, 0).setDepth(-50);
        // Variación ligera de tono usando tint
        const variance = Phaser.Math.Between(-18, 18);
        const base = 0x2e7d32;
        const r = Phaser.Display.Color.GetColor(
          Phaser.Math.Clamp(((base >> 16) & 0xff) + variance, 0, 255),
          Phaser.Math.Clamp(((base >> 8) & 0xff) + variance, 0, 255),
          Phaser.Math.Clamp((base & 0xff) + variance, 0, 255)
        );
        ts.setTint(r);
        // Desfase del patrón para romper líneas
        ts.tilePositionX = Phaser.Math.Between(0, 63);
        ts.tilePositionY = Phaser.Math.Between(0, 63);
      }
    }
    // Overlay opcional de motas (ruido) para textura
    const noiseRT = this.make.renderTexture({ width: this.worldW, height: this.worldH, add: true });
    const noiseDensity = Math.floor((this.worldW * this.worldH) / 70000); // ajustado
    const g = this.make.graphics({ add: false });
    for (let i = 0; i < noiseDensity; i++) {
      const x = Phaser.Math.Between(0, this.worldW);
      const y = Phaser.Math.Between(0, this.worldH);
      const alpha = Phaser.Math.FloatBetween(0.03, 0.08);
      g.fillStyle(0x000000, alpha).fillRect(0, 0, 2, 2);
      noiseRT.draw(g, x, y);
      g.clear();
    }
    noiseRT.setDepth(-40).setAlpha(0.6);
    g.destroy();
  }

  update(_t: number, dt: number) {
    this.player.update(dt);
    if (!this.player) {
      console.error("[WorldScene] player undefined in update");
      return;
    }
    if (Phaser.Input.Keyboard.JustDown(this.keys.ZIN)) this.mainCam.setZoom(Phaser.Math.Clamp(this.mainCam.zoom + 0.2, 1.0, 3.5));
    if (Phaser.Input.Keyboard.JustDown(this.keys.ZOUT)) this.mainCam.setZoom(Phaser.Math.Clamp(this.mainCam.zoom - 0.2, 1.0, 3.5));
    if (Phaser.Input.Keyboard.JustDown(this.keys.ZRST)) this.mainCam.setZoom(2.2);

    // Actualizamos rectángulo de viewport para el minimapa (cada frame barato)
    const vp = {
      x: this.mainCam.worldView.x,
      y: this.mainCam.worldView.y,
      w: this.mainCam.worldView.width,
      h: this.mainCam.worldView.height
    };
    this.registry.set("viewport", vp);
    // Dificultad progresiva: cada 20s aumenta y añade hazards
    const elapsed = (this.time.now - (this.registry.get("startTime") || this.time.now)) / 1000;
    const newDiff = Math.floor(elapsed / 20) + 1;
    if (newDiff > (this.registry.get("difficulty") || 1)) {
      this.registry.set("difficulty", newDiff);
      this.spawnHazards(4 + newDiff * 2, 200);
    }

  // Actualizar niebla
  this.updateFog();
  }

  private randomPointAwayFromCenter(margin = 200) {
    let x = Phaser.Math.Between(0, this.worldW);
    let y = Phaser.Math.Between(0, this.worldH);
    const cx = this.worldW / 2;
    const cy = this.worldH / 2;
    const minDist = margin;
    let tries = 0;
    while (Phaser.Math.Distance.Between(x, y, cx, cy) < minDist && tries < 32) {
      x = Phaser.Math.Between(0, this.worldW);
      y = Phaser.Math.Between(0, this.worldH);
      tries++;
    }
    return { x, y };
  }

  private spawnObstacles(count: number, minSpacing: number) {
  const placed: any[] = [];
    for (let i = 0; i < count; i++) {
      let p = this.randomPointAwayFromCenter(260);
      let tries = 0;
      while (tries < 64) {
        const ok = placed.every(v => Phaser.Math.Distance.Between(p.x, p.y, v.x, v.y) > minSpacing);
        if (ok) break;
        p = this.randomPointAwayFromCenter(260);
        tries++;
      }
      const key = Math.random() < 0.5 ? "box" : "column";
  const sprite = this.obstacles.create(p.x, p.y, key) as any;
      sprite.setOrigin(0.5, 1);
      sprite.refreshBody();
  const body = sprite.body as any;
      if (key === "box") body.setSize(30, 22).setOffset((sprite.width - 30) / 2, sprite.height - 24);
      else { const solidH = 16; body.setSize(20, solidH).setOffset((sprite.width - 20) / 2, sprite.height - solidH); }
      body.updateFromGameObject();
  placed.push({ x: p.x, y: p.y });
    }
  }

  private spawnCoins(count: number, minSpacing: number) {
  const placed: any[] = [];
    for (let i = 0; i < count; i++) {
      let p = this.randomPointAwayFromCenter(220);
      let tries = 0;
      while (tries < 64) {
        const ok = placed.every(v => Phaser.Math.Distance.Between(p.x, p.y, v.x, v.y) > minSpacing);
        if (ok) break;
        p = this.randomPointAwayFromCenter(220);
        tries++;
      }
  const coin = this.coins.create(p.x, p.y, "chest_golden_closed") as any;
      coin.setDepth(coin.y);
      coin.setOrigin(0.5, 1);
      coin.refreshBody();
      if (coin.body instanceof Phaser.Physics.Arcade.Body) coin.body.setSize(16, 12).setOffset((coin.width - 16) / 2, coin.height - 14);
  placed.push({ x: p.x, y: p.y });
    }
  }

  private spawnHazards(count: number, minSpacing: number) {
  const placed: any[] = [];
    for (let i = 0; i < count; i++) {
      let p = this.randomPointAwayFromCenter(320);
      let tries = 0;
      while (tries < 64) {
        const ok = placed.every(v => Phaser.Math.Distance.Between(p.x, p.y, v.x, v.y) > minSpacing);
        if (ok) break;
        p = this.randomPointAwayFromCenter(320);
        tries++;
      }
      // Reutilizamos assets existentes: usar "monster_bat" si existe, si no, fallback a box roja
      const key = this.textures.exists("monster_bat") ? "monster_bat" : "box";
  const hazard = this.hazards.create(p.x, p.y, key) as any;
      hazard.setOrigin(0.5, 1);
      if (hazard.body instanceof Phaser.Physics.Arcade.StaticBody) {
        const body = hazard.body;
        const solidH = Math.min(24, hazard.height * 0.4);
        body.setSize(Math.min(28, hazard.width * 0.6), solidH).setOffset((hazard.width - Math.min(28, hazard.width * 0.6)) / 2, hazard.height - solidH);
        body.updateFromGameObject();
      }
      hazard.setTint(0xff5252);
  placed.push({ x: p.x, y: p.y });
      this.tweens.add({ targets: hazard, y: hazard.y - 6, duration: 900, yoyo: true, repeat: -1, ease: "sine.inOut" });
    }
  }

  private spawnPowerUps() {
    const list = ["flask_blue", "flask_red"];
    list.forEach(k => { if (!this.textures.exists(k)) return; });
    for (let i = 0; i < 6; i++) {
      const p = this.randomPointAwayFromCenter(300);
      const type = i % 2 === 0 ? "shield" : "boost";
      const key = type === "shield" ? (this.textures.exists("flask_blue") ? "flask_blue" : "box") : (this.textures.exists("flask_red") ? "flask_red" : "box");
  const pu = this.powerUps.create(p.x, p.y, key) as any;
      pu.setData("ptype", type);
      pu.setOrigin(0.5, 1);
      pu.setTint(type === "shield" ? 0x82b1ff : 0xffab91);
      if (pu.body instanceof Phaser.Physics.Arcade.StaticBody) pu.body.setSize(16, 14).setOffset((pu.width - 16) / 2, pu.height - 16).updateFromGameObject();
      this.tweens.add({ targets: pu, alpha: 0.55, duration: 900, yoyo: true, repeat: -1 });
    }
  }

  private onTakePowerUp(_p: any, obj: any) {
    const type = obj.getData("ptype");
    if (type === "shield") this.player.giveShield(); else this.player.giveSpeedBoost();
  this.sound.play("s_pickup", { volume: (this.registry.get("volume") ?? 1) * 0.4 });
  this.emitPickupParticles(obj.x, obj.y, type === "shield" ? 0x82b1ff : 0xfff176);
    obj.disableBody(true, true);
  }

  private onHitHazard() {
    // Escudo absorbe golpe sin terminar partida
    if (this.player.hasShield()) {
      (this.player as any).shieldActive = false;
      this.player.clearTint();
      this.sound.play("s_hurt", { volume: 0.4 });
      return;
    }
    // Reducir vidas; si quedan, respawn suave
    let lives = this.registry.get("lives") ?? 3;
    lives -= 1;
    this.registry.set("lives", lives);
    if (lives > 0) {
      this.sound.play("s_hurt", { volume: 0.6 });
      // Pequeño respawn: mover jugador al centro y limpiar tints
      this.player.setPosition(this.worldW / 2, this.worldH / 2);
      this.player.setVelocity(0, 0);
      this.player.clearTint();
      this.cameras.main.flash(300, 255, 64, 64, false);
      return; // no game over todavía
    }
    // Guardamos score y tiempo final
    const score = this.registry.get("score") ?? 0;
    const startTime = this.registry.get("startTime") ?? this.time.now;
    const elapsedMs = this.time.now - startTime;
    this.registry.set("finalStats", { score, timeMs: elapsedMs });
    this.sound.play("s_gameover", { volume: 0.6 });
    this.scene.pause();
    this.events.emit("gameover");
  }

  private onCollectCoin(_player: any, coin: any) {
    const c = coin as any;
    this.tweens.add({ targets: c, scale: 1.4, duration: 80, yoyo: true, onYoyo: () => { c.disableBody(true, true); } });
    this.mainCam.shake(60, 0.002);
    const current = this.registry.get("score") ?? 0;
  this.registry.set("score", current + 1);
    this.sound.play("s_pickup", { volume: (this.registry.get("volume") ?? 1) * 0.3 });
    this.emitPickupParticles(c.x, c.y, 0xffd54f);
  const hs = this.registry.get("highScore") || 0;
    if (current + 1 > hs) {
      const newHS = current + 1;
      this.registry.set("highScore", newHS);
      try { localStorage.setItem("highScore", String(newHS)); } catch {}
    }
  }

  private emitPickupParticles(x: number, y: number, color: number) {
    const g = this.add.graphics();
    g.fillStyle(color, 1);
    for (let i = 0; i < 10; i++) {
      const px = x + Phaser.Math.Between(-6, 6);
      const py = y + Phaser.Math.Between(-4, 4);
      g.fillCircle(px, py, 2);
    }
    this.tweens.add({ targets: g, alpha: 0, duration: 500, onComplete: () => g.destroy() });
  }

  private initFog() {
    if (!this.textures.exists("fog_brush")) return;
    this.fogRT = this.make.renderTexture({ width: this.worldW, height: this.worldH, add: true });
    this.fogRT.setDepth(9999); // por encima; la UIScene está en otra escena
    this.fogRT.fill(0x000000, 0.72);
    this.fogNeedsRedraw = true;
  }

  private updateFog() {
    if (!this.fogRT) return;
    const px = this.player.x;
    const py = this.player.y;
    // Dibujar un círculo de revelado
    this.fogRT.erase("fog_brush", px - 30, py - 30);
    // Leve re oscurecimiento perímetro para sensación de niebla dinámica opcional
  }
}
