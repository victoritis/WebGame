// @ts-ignore - import laxo para runtime; tipos globales mínimos se asumen.
import Phaser from "phaser";

// Tipos relajados (any) para evitar errores mientras resolvemos d.ts
type KeyLike = any;
type WASD = { W: KeyLike; A: KeyLike; S: KeyLike; D: KeyLike; };

export default class Player extends Phaser.Physics.Arcade.Sprite {
  private cursors: any;
  private wasd: WASD;
  private shift: KeyLike;

  private BASE_SPEED = 200;
  private SPRINT_MULT = 1.6;

  // Rotación suave
  // Suavizado de movimiento: ya no rotamos sprite; aplicaremos ligero balanceo
  private bobTime = 0;

  // Power-ups
  private shieldActive = false;
  private shieldTime = 0;
  private speedBoostActive = false;
  private speedBoostTime = 0;
  private SPEED_BOOST_MULT = 2.2;
  private SHIELD_DURATION = 6000;
  private BOOST_DURATION = 4500;

  private staminaMax = 100;
  private stamina = this.staminaMax;
  private staminaDrainPerSec = 40;
  private staminaRegenPerSec = 25;

  constructor(scene: any, x: number, y: number, cursors: any, wasd: WASD, shift: KeyLike) {
    const textureKey = scene.textures.exists("hero_basic") ? "hero_basic" : (scene.textures.exists("player") ? "player" : "floor_plain");
    super(scene, x, y, textureKey);
    this.cursors = cursors;
    this.wasd = wasd;
    this.shift = shift;

    scene.add.existing(this);
    scene.physics.add.existing(this);

  this.setDepth(10);
    this.setDamping(true);
    this.setDrag(0.001);
    this.setMaxVelocity(480, 480);
  // Ajuste de hitbox más pequeño pero centrado para mejor sensación de pivot
  this.setSize(18, 18);
  this.setOffset((this.width - 18) / 2, (this.height - 18) / 2);
    this.setCollideWorldBounds(true);
  }

  update(deltaMs: number) {
  const left = this.cursors.left?.isDown || this.wasd.A.isDown;
  const right = this.cursors.right?.isDown || this.wasd.D.isDown;
  const up = this.cursors.up?.isDown || this.wasd.W.isDown;
  const down = this.cursors.down?.isDown || this.wasd.S.isDown;

    let dx = 0, dy = 0;
    if (left) dx -= 1;
    if (right) dx += 1;
    if (up) dy -= 1;
    if (down) dy += 1;

  const wantSprint = this.shift.isDown && this.stamina > 0.1;
  let speed = wantSprint ? this.BASE_SPEED * this.SPRINT_MULT : this.BASE_SPEED;
  if (this.speedBoostActive) speed *= this.SPEED_BOOST_MULT;

    if (dx || dy) {
      const len = Math.hypot(dx, dy) || 1;
      dx = (dx / len) * speed;
      dy = (dy / len) * speed;
      this.setVelocity(dx, dy);
    } else {
      this.setVelocity(0, 0);
    }

    // Efecto de balanceo sutil para dar sensación de vida sin necesitar animaciones
    const dt = deltaMs / 1000;
    if (dx || dy) {
      this.bobTime += dt * 6; // frecuencia
      const scale = 1 + Math.sin(this.bobTime) * 0.06;
      this.setScale(scale, 1 - (scale - 1));
    } else {
      this.bobTime = 0;
      this.setScale(1, 1);
    }

  const dt2 = deltaMs / 1000;
  if (wantSprint && (dx || dy)) this.stamina = Math.max(0, this.stamina - this.staminaDrainPerSec * dt2);
  else this.stamina = Math.min(this.staminaMax, this.stamina + this.staminaRegenPerSec * dt2);

    // Timers power-ups
    if (this.shieldActive) {
      this.shieldTime -= deltaMs;
      if (this.shieldTime <= 0) { this.shieldActive = false; this.clearTint(); }
      else this.setTintFill(0x99d5ff);
    }
    if (this.speedBoostActive) {
      this.speedBoostTime -= deltaMs;
      if (this.speedBoostTime <= 0) { this.speedBoostActive = false; this.clearTint(); }
      else if (!this.shieldActive) this.setTint(0xfff176);
    }

    this.scene.registry.set("stamina", this.stamina / this.staminaMax);
  }

  public giveShield() {
    this.shieldActive = true;
    this.shieldTime = this.SHIELD_DURATION;
  }
  public giveSpeedBoost() {
    this.speedBoostActive = true;
    this.speedBoostTime = this.BOOST_DURATION;
  }
  public hasShield() { return this.shieldActive; }
}
