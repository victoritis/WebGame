import Phaser from 'phaser';
import { EnemyType, Stats } from '../config/Types';
import { EnemyDatabase } from '../data/EnemyDatabase';

/**
 * Clase base para enemigos
 */
export class Enemy extends Phaser.Physics.Arcade.Sprite {
  public enemyType: EnemyType;
  public stats: Stats;
  public aiType: 'chase' | 'wander' | 'ranged' | 'patrol';
  public xpReward: number;
  public goldReward: number;

  private target: Phaser.GameObjects.GameObject | null = null;
  private wanderTimer: number = 0;
  private wanderDirection: Phaser.Math.Vector2;
  private patrolPoints: Phaser.Math.Vector2[] = [];
  private currentPatrolIndex: number = 0;
  private attackCooldown: number = 0;
  private healthBar: Phaser.GameObjects.Graphics;
  private healthBarBg: Phaser.GameObjects.Graphics;

  constructor(scene: Phaser.Scene, x: number, y: number, type: EnemyType) {
    const config = EnemyDatabase[type];
    super(scene, x, y, config.texture);

    this.enemyType = type;
    this.aiType = config.aiType;
    this.xpReward = config.xpReward;
    this.goldReward = config.goldReward;

    this.stats = {
      maxHp: config.hp,
      hp: config.hp,
      maxMana: 0,
      mana: 0,
      damage: config.damage,
      defense: 0,
      speed: config.speed
    };

    this.wanderDirection = new Phaser.Math.Vector2(
      Phaser.Math.FloatBetween(-1, 1),
      Phaser.Math.FloatBetween(-1, 1)
    ).normalize();

    // Crear barras de vida
    this.healthBarBg = scene.add.graphics();
    this.healthBar = scene.add.graphics();
    this.updateHealthBar();

    this.setOrigin(0.5, 1);
    this.setDepth(this.y);
  }

  /**
   * Establece el objetivo a perseguir
   */
  setTarget(target: Phaser.GameObjects.GameObject): void {
    this.target = target;
  }

  /**
   * Establece puntos de patrulla
   */
  setPatrolPoints(points: Phaser.Math.Vector2[]): void {
    this.patrolPoints = points;
  }

  /**
   * Actualización principal del enemigo
   */
  update(time: number, delta: number): void {
    if (!this.active || !this.body) return;

    this.attackCooldown = Math.max(0, this.attackCooldown - delta);

    // Actualizar comportamiento según IA
    switch (this.aiType) {
      case 'chase':
        this.chaseAI();
        break;
      case 'wander':
        this.wanderAI(delta);
        break;
      case 'patrol':
        this.patrolAI();
        break;
      case 'ranged':
        this.rangedAI();
        break;
    }

    // Actualizar posición de barra de vida
    this.updateHealthBar();

    // Actualizar depth por Y
    this.setDepth(this.y);
  }

  /**
   * IA de persecución
   */
  private chaseAI(): void {
    if (!this.target || !('x' in this.target) || !('y' in this.target)) {
      this.setVelocity(0, 0);
      return;
    }

    const targetX = (this.target as any).x;
    const targetY = (this.target as any).y;
    const distance = Phaser.Math.Distance.Between(this.x, this.y, targetX, targetY);

    if (distance > 50) {
      const angle = Phaser.Math.Angle.Between(this.x, this.y, targetX, targetY);
      this.setVelocity(
        Math.cos(angle) * this.stats.speed,
        Math.sin(angle) * this.stats.speed
      );

      // Flip sprite según dirección
      this.setFlipX(this.body!.velocity.x < 0);
    } else {
      this.setVelocity(0, 0);

      // Atacar si está en cooldown
      if (this.attackCooldown <= 0) {
        this.attack();
      }
    }
  }

  /**
   * IA de vagabundeo
   */
  private wanderAI(delta: number): void {
    this.wanderTimer -= delta;

    if (this.wanderTimer <= 0) {
      // Cambiar dirección aleatoriamente
      this.wanderDirection = new Phaser.Math.Vector2(
        Phaser.Math.FloatBetween(-1, 1),
        Phaser.Math.FloatBetween(-1, 1)
      ).normalize();

      this.wanderTimer = Phaser.Math.Between(1000, 3000);
    }

    // Moverse en la dirección actual
    this.setVelocity(
      this.wanderDirection.x * this.stats.speed * 0.5,
      this.wanderDirection.y * this.stats.speed * 0.5
    );

    this.setFlipX(this.body!.velocity.x < 0);
  }

  /**
   * IA de patrulla
   */
  private patrolAI(): void {
    if (this.patrolPoints.length === 0) {
      this.setVelocity(0, 0);
      return;
    }

    const currentPoint = this.patrolPoints[this.currentPatrolIndex];
    const distance = Phaser.Math.Distance.Between(
      this.x, this.y,
      currentPoint.x, currentPoint.y
    );

    if (distance < 10) {
      // Llegó al punto, ir al siguiente
      this.currentPatrolIndex = (this.currentPatrolIndex + 1) % this.patrolPoints.length;
    } else {
      // Moverse hacia el punto actual
      const angle = Phaser.Math.Angle.Between(
        this.x, this.y,
        currentPoint.x, currentPoint.y
      );

      this.setVelocity(
        Math.cos(angle) * this.stats.speed * 0.7,
        Math.sin(angle) * this.stats.speed * 0.7
      );

      this.setFlipX(this.body!.velocity.x < 0);
    }
  }

  /**
   * IA de ataque a distancia
   */
  private rangedAI(): void {
    if (!this.target || !('x' in this.target) || !('y' in this.target)) {
      this.setVelocity(0, 0);
      return;
    }

    const targetX = (this.target as any).x;
    const targetY = (this.target as any).y;
    const distance = Phaser.Math.Distance.Between(this.x, this.y, targetX, targetY);

    const idealDistance = 150;

    if (distance > idealDistance + 30) {
      // Acercarse
      const angle = Phaser.Math.Angle.Between(this.x, this.y, targetX, targetY);
      this.setVelocity(
        Math.cos(angle) * this.stats.speed,
        Math.sin(angle) * this.stats.speed
      );
    } else if (distance < idealDistance - 30) {
      // Alejarse
      const angle = Phaser.Math.Angle.Between(this.x, this.y, targetX, targetY);
      this.setVelocity(
        -Math.cos(angle) * this.stats.speed,
        -Math.sin(angle) * this.stats.speed
      );
    } else {
      // Mantener distancia y atacar
      this.setVelocity(0, 0);

      if (this.attackCooldown <= 0) {
        this.attack();
      }
    }

    this.setFlipX(this.body!.velocity.x < 0);
  }

  /**
   * Realiza un ataque
   */
  private attack(): void {
    this.attackCooldown = 1000; // 1 segundo de cooldown

    // Emitir evento de ataque para que el sistema de combate lo maneje
    this.scene.events.emit('enemy-attack', this);

    // Efecto visual de ataque
    this.scene.tweens.add({
      targets: this,
      scaleX: this.scaleX * 1.2,
      scaleY: this.scaleY * 1.2,
      duration: 100,
      yoyo: true
    });
  }

  /**
   * Actualiza la barra de vida
   */
  private updateHealthBar(): void {
    const barWidth = 40;
    const barHeight = 4;
    const offsetY = -this.height - 10;

    // Background
    this.healthBarBg.clear();
    this.healthBarBg.fillStyle(0x000000, 0.5);
    this.healthBarBg.fillRect(
      this.x - barWidth / 2,
      this.y + offsetY,
      barWidth,
      barHeight
    );

    // Barra de vida actual
    const hpPercent = this.stats.hp / this.stats.maxHp;
    const color = hpPercent > 0.5 ? 0x00ff00 : hpPercent > 0.25 ? 0xffff00 : 0xff0000;

    this.healthBar.clear();
    this.healthBar.fillStyle(color, 1);
    this.healthBar.fillRect(
      this.x - barWidth / 2,
      this.y + offsetY,
      barWidth * hpPercent,
      barHeight
    );
  }

  /**
   * Recibe daño
   */
  takeDamage(amount: number): void {
    this.stats.hp = Math.max(0, this.stats.hp - amount);

    // Efecto visual
    this.setTint(0xff0000);
    this.scene.time.delayedCall(100, () => {
      if (this.active) this.clearTint();
    });

    if (this.stats.hp <= 0) {
      this.die();
    }
  }

  /**
   * Muerte del enemigo
   */
  private die(): void {
    // Emitir evento de muerte
    this.scene.events.emit('enemy-death', this);

    // Destruir barras de vida
    this.healthBar.destroy();
    this.healthBarBg.destroy();

    // Efecto de muerte
    this.scene.tweens.add({
      targets: this,
      alpha: 0,
      scaleX: 0,
      scaleY: 0,
      duration: 300,
      onComplete: () => {
        this.destroy();
      }
    });
  }

  /**
   * Limpieza al destruir
   */
  destroy(fromScene?: boolean): void {
    if (this.healthBar) this.healthBar.destroy();
    if (this.healthBarBg) this.healthBarBg.destroy();
    super.destroy(fromScene);
  }
}

export default Enemy;
