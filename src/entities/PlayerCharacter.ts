import Phaser from 'phaser';
import { PlayerStats } from '../config/Types';
import GameConfig from '../config/GameConfig';
import InventoryManager from '../managers/InventoryManager';
import ProgressionManager from '../managers/ProgressionManager';

/**
 * Jugador refactorizado con todos los sistemas
 */
export class PlayerCharacter extends Phaser.Physics.Arcade.Sprite {
  // Managers
  public inventory: InventoryManager;
  public progression: ProgressionManager;

  // Controles
  private cursors: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasd: any;
  private keys: any;

  // Stats y estado
  public stats: PlayerStats;
  private stamina: number = 100;
  private maxStamina: number = 100;
  private staminaDrainRate: number = 30;
  private staminaRegenRate: number = 20;

  // Combate
  private attackCooldown: number = 0;
  private isAttacking: boolean = false;
  private invulnerable: boolean = false;
  private invulnerabilityTime: number = 0;

  // Efectos temporales
  private speedBoostActive: boolean = false;
  private speedBoostTimer: number = 0;
  private damageBoostActive: boolean = false;
  private damageBoostTimer: number = 0;

  // Visual
  private weapon?: Phaser.GameObjects.Sprite;
  private weaponAngle: number = 0;
  private targetWeaponAngle: number = 0;
  private currentWeaponTexture: string = 'weapon_sword_golden';

  constructor(scene: Phaser.Scene, x: number, y: number) {
    const textureKey = scene.textures.exists('hero_basic') ? 'hero_basic' : 'box';
    super(scene, x, y, textureKey);

    // Inicializar managers
    this.inventory = new InventoryManager();
    this.progression = new ProgressionManager();
    this.stats = this.progression.getStats();

    // Configurar controles
    this.cursors = scene.input.keyboard!.createCursorKeys();
    this.wasd = scene.input.keyboard!.addKeys('W,A,S,D');
    this.keys = {
      attack: scene.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE),
      interact: scene.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.E),
      inventory: scene.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.I),
      usePotion: scene.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.Q),
      shift: scene.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.SHIFT)
    };

    // Configurar física
    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setOrigin(0.5, 1);
    this.setSize(18, 18);
    this.setOffset((this.width - 18) / 2, (this.height - 18) / 2);
    this.setCollideWorldBounds(true);
    this.setDepth(1000);

    // Crear arma visual
    this.createWeaponSprite();

    // Setup callbacks
    this.progression.setLevelUpCallback((level) => {
      this.onLevelUp(level);
    });
  }

  /**
   * Crea el sprite del arma
   */
  private createWeaponSprite(): void {
    // Usar imagen real de arma si existe
    const weaponKey = this.scene.textures.exists(this.currentWeaponTexture)
      ? this.currentWeaponTexture
      : 'weapon_default';

    // Si no existe weapon_default, crearlo
    if (!this.scene.textures.exists('weapon_default')) {
      const graphics = this.scene.make.graphics({ add: false });
      graphics.fillStyle(0xcccccc, 1);
      graphics.fillRect(0, 0, 24, 6);
      graphics.generateTexture('weapon_default', 24, 6);
      graphics.destroy();
    }

    this.weapon = this.scene.add.sprite(this.x, this.y, weaponKey);
    this.weapon.setOrigin(0.2, 0.5); // Origen cerca del mango
    this.weapon.setDepth(this.depth + 1);
    this.weapon.setScale(1.2); // Hacer el arma un poco más grande
  }

  /**
   * Cambia el arma visual del jugador
   */
  changeWeapon(weaponTexture: string): void {
    if (this.weapon && this.scene.textures.exists(weaponTexture)) {
      this.currentWeaponTexture = weaponTexture;
      this.weapon.setTexture(weaponTexture);
    }
  }

  /**
   * Actualización principal
   */
  update(time: number, delta: number): void {
    const dt = delta / 1000;

    // Actualizar timers
    this.updateTimers(dt);

    // Movimiento
    this.handleMovement(dt);

    // Combate
    this.handleCombat();

    // Actualizar posición del arma
    this.updateWeapon();

    // Actualizar stats en el registry para la UI
    this.scene.registry.set('playerStats', this.stats);
    this.scene.registry.set('stamina', this.stamina / this.maxStamina);
  }

  /**
   * Actualiza timers
   */
  private updateTimers(dt: number): void {
    this.attackCooldown = Math.max(0, this.attackCooldown - dt * 1000);
    this.invulnerabilityTime = Math.max(0, this.invulnerabilityTime - dt * 1000);
    this.invulnerable = this.invulnerabilityTime > 0;

    if (this.speedBoostTimer > 0) {
      this.speedBoostTimer -= dt * 1000;
      if (this.speedBoostTimer <= 0) {
        this.speedBoostActive = false;
      }
    }

    if (this.damageBoostTimer > 0) {
      this.damageBoostTimer -= dt * 1000;
      if (this.damageBoostTimer <= 0) {
        this.damageBoostActive = false;
      }
    }
  }

  /**
   * Maneja el movimiento del jugador
   */
  private handleMovement(dt: number): void {
    const left = this.cursors.left?.isDown || this.wasd.A.isDown;
    const right = this.cursors.right?.isDown || this.wasd.D.isDown;
    const up = this.cursors.up?.isDown || this.wasd.W.isDown;
    const down = this.cursors.down?.isDown || this.wasd.S.isDown;
    const sprint = this.keys.shift.isDown && this.stamina > 0;

    let dx = 0, dy = 0;
    if (left) dx -= 1;
    if (right) dx += 1;
    if (up) dy -= 1;
    if (down) dy += 1;

    // Calcular velocidad
    let baseSpeed = this.stats.speed;

    // Aplicar bonus de items
    const itemBonus = this.inventory.getTotalStatsBonus();
    if (itemBonus.speed) {
      baseSpeed += itemBonus.speed;
    }

    let speed = baseSpeed;
    if (sprint && (dx !== 0 || dy !== 0)) {
      speed *= GameConfig.PLAYER_SPRINT_MULT;
      this.stamina = Math.max(0, this.stamina - this.staminaDrainRate * dt);
    } else {
      this.stamina = Math.min(this.maxStamina, this.stamina + this.staminaRegenRate * dt);
    }

    if (this.speedBoostActive) {
      speed *= 1.5;
    }

    // Aplicar movimiento
    if (dx !== 0 || dy !== 0) {
      const length = Math.sqrt(dx * dx + dy * dy);
      this.setVelocity((dx / length) * speed, (dy / length) * speed);

      // Flip sprite
      if (dx !== 0) {
        this.setFlipX(dx < 0);
      }
    } else {
      this.setVelocity(0, 0);
    }
  }

  /**
   * Maneja el combate
   */
  private handleCombat(): void {
    if (Phaser.Input.Keyboard.JustDown(this.keys.attack) && !this.isAttacking && this.attackCooldown <= 0) {
      this.performAttack();
    }
  }

  /**
   * Realiza un ataque
   */
  private performAttack(): void {
    this.isAttacking = true;
    this.attackCooldown = GameConfig.ATTACK_COOLDOWN;

    // Calcular daño total
    let totalDamage = this.stats.damage;
    const itemBonus = this.inventory.getTotalStatsBonus();
    if (itemBonus.damage) {
      totalDamage += itemBonus.damage;
    }
    if (this.damageBoostActive) {
      totalDamage *= 1.5;
    }

    // Usar el ángulo actual del arma hacia el mouse
    const attackAngle = this.weaponAngle;
    const attackRange = 50;
    const attackX = this.x + Math.cos(attackAngle) * attackRange;
    const attackY = this.y - 15 + Math.sin(attackAngle) * attackRange;

    this.scene.events.emit('player-attack', {
      x: attackX,
      y: attackY,
      damage: totalDamage,
      range: GameConfig.ATTACK_RANGE,
      angle: attackAngle
    });

    // Animación de ataque mejorada (empuje hacia adelante)
    if (this.weapon) {
      const currentAngle = this.weapon.rotation;
      const currentScale = this.weapon.scaleX;

      // Empujar el arma hacia adelante
      this.scene.tweens.add({
        targets: this.weapon,
        scaleX: currentScale * 1.3,
        scaleY: this.weapon.scaleY * 1.3,
        duration: 80,
        yoyo: true,
        ease: 'Quad.easeOut'
      });

      // Rotar ligeramente durante el ataque
      this.scene.tweens.add({
        targets: this.weapon,
        angle: (currentAngle * 180 / Math.PI) + 25,
        duration: 100,
        yoyo: true,
        ease: 'Quad.easeOut',
        onComplete: () => {
          this.isAttacking = false;
        }
      });

      // Efecto visual de ataque
      const attackEffect = this.scene.add.circle(attackX, attackY, 20, 0xFFFFFF, 0.4);
      attackEffect.setDepth(999);
      this.scene.tweens.add({
        targets: attackEffect,
        scale: 1.5,
        alpha: 0,
        duration: 200,
        onComplete: () => attackEffect.destroy()
      });
    }

    // Sonido de ataque
    if (this.scene.sound.get('s_pickup')) {
      this.scene.sound.play('s_pickup', { volume: 0.3 });
    }
  }

  /**
   * Actualiza posición del arma (sigue el mouse)
   */
  private updateWeapon(): void {
    if (!this.weapon) return;

    // Obtener posición del mouse en el mundo
    const pointer = this.scene.input.activePointer;
    const worldPoint = this.scene.cameras.main.getWorldPoint(pointer.x, pointer.y);

    // Calcular ángulo hacia el mouse
    this.targetWeaponAngle = Phaser.Math.Angle.Between(
      this.x,
      this.y - 15,
      worldPoint.x,
      worldPoint.y
    );

    // Suavizar rotación (interpolación)
    const lerpFactor = 0.2;
    this.weaponAngle = Phaser.Math.Linear(
      this.weaponAngle,
      this.targetWeaponAngle,
      lerpFactor
    );

    // Posición del arma relativa al jugador
    const distance = 18;
    const weaponX = this.x + Math.cos(this.weaponAngle) * distance;
    const weaponY = this.y - 15 + Math.sin(this.weaponAngle) * distance;

    this.weapon.setPosition(weaponX, weaponY);
    this.weapon.setRotation(this.weaponAngle);

    // Voltear el arma si apunta hacia la izquierda
    if (Math.abs(this.weaponAngle) > Math.PI / 2) {
      this.weapon.setFlipY(true);
      this.setFlipX(true);
    } else {
      this.weapon.setFlipY(false);
      this.setFlipX(false);
    }

    // Ajustar profundidad para que aparezca delante o detrás del jugador
    if (worldPoint.y < this.y) {
      this.weapon.setDepth(this.depth - 1);
    } else {
      this.weapon.setDepth(this.depth + 1);
    }
  }

  /**
   * Recibe daño
   */
  takeDamage(amount: number): void {
    if (this.invulnerable) return;

    // Aplicar defensa
    const itemBonus = this.inventory.getTotalStatsBonus();
    const totalDefense = (this.stats.defense || 0) + (itemBonus.defense || 0);
    const finalDamage = Math.max(1, amount - totalDefense * 0.5);

    this.stats.hp = Math.max(0, this.stats.hp - finalDamage);
    this.progression.updateStats(this.stats);

    // Invulnerabilidad temporal
    this.invulnerable = true;
    this.invulnerabilityTime = 1000;

    // Efecto visual
    this.setTint(0xff0000);
    this.scene.time.delayedCall(100, () => {
      if (this.active) this.clearTint();
    });

    // Flash de cámara
    this.scene.cameras.main.shake(100, 0.005);

    // Sonido de daño
    if (this.scene.sound.get('s_hurt')) {
      this.scene.sound.play('s_hurt', { volume: 0.5 });
    }

    // Verificar muerte
    if (this.stats.hp <= 0) {
      this.die();
    }
  }

  /**
   * Cura al jugador
   */
  heal(amount: number): void {
    this.stats.hp = Math.min(this.stats.maxHp, this.stats.hp + amount);
    this.progression.updateStats(this.stats);

    // Efecto visual
    const particles = this.scene.add.particles(this.x, this.y, 'dot_power', {
      speed: { min: 30, max: 80 },
      scale: { start: 1, end: 0 },
      alpha: { start: 1, end: 0 },
      lifespan: 500,
      quantity: 8,
      tint: 0x00ff00
    });

    this.scene.time.delayedCall(600, () => particles.destroy());
  }

  /**
   * Restaura maná
   */
  restoreMana(amount: number): void {
    this.stats.mana = Math.min(this.stats.maxMana, this.stats.mana + amount);
    this.progression.updateStats(this.stats);
  }

  /**
   * Añade experiencia
   */
  addXP(amount: number): void {
    const leveledUp = this.progression.addXP(amount);
    this.stats = this.progression.getStats();

    if (leveledUp) {
      // Ya se maneja en el callback onLevelUp
    }
  }

  /**
   * Callback de subida de nivel
   */
  private onLevelUp(newLevel: number): void {
    console.log(`¡Subiste al nivel ${newLevel}!`);

    // Efecto visual
    const particles = this.scene.add.particles(this.x, this.y, 'dot_coin', {
      speed: { min: 100, max: 200 },
      angle: { min: 0, max: 360 },
      scale: { start: 1.5, end: 0 },
      alpha: { start: 1, end: 0 },
      lifespan: 800,
      quantity: 20
    });

    this.scene.time.delayedCall(900, () => particles.destroy());

    // Flash dorado
    this.scene.cameras.main.flash(500, 255, 215, 0);

    // Emitir evento
    this.scene.events.emit('player-levelup', newLevel);
  }

  /**
   * Activa boost de velocidad
   */
  activateSpeedBoost(duration: number = 10000): void {
    this.speedBoostActive = true;
    this.speedBoostTimer = duration;
    this.setTint(0x00ffff);
  }

  /**
   * Activa boost de daño
   */
  activateDamageBoost(duration: number = 10000): void {
    this.damageBoostActive = true;
    this.damageBoostTimer = duration;
    this.setTint(0xff6600);
  }

  /**
   * Muerte del jugador
   */
  private die(): void {
    console.log('Game Over');
    this.scene.events.emit('player-death');

    // Efecto de muerte
    this.scene.tweens.add({
      targets: this,
      alpha: 0,
      angle: 90,
      duration: 500
    });

    if (this.weapon) {
      this.weapon.setVisible(false);
    }
  }

  /**
   * Obtiene stats totales (base + items)
   */
  getTotalStats(): PlayerStats {
    const baseStats = this.progression.getStats();
    const itemBonus = this.inventory.getTotalStatsBonus();

    return {
      ...baseStats,
      damage: baseStats.damage + (itemBonus.damage || 0),
      defense: baseStats.defense + (itemBonus.defense || 0),
      speed: baseStats.speed + (itemBonus.speed || 0),
      maxHp: baseStats.maxHp + (itemBonus.maxHp || 0),
      maxMana: baseStats.maxMana + (itemBonus.maxMana || 0)
    };
  }

  /**
   * Limpieza
   */
  destroy(fromScene?: boolean): void {
    if (this.weapon) {
      this.weapon.destroy();
    }
    super.destroy(fromScene);
  }
}

export default PlayerCharacter;
