import Phaser from 'phaser';
import { Stats } from '../config/Types';
import GameConfig from '../config/GameConfig';

/**
 * Sistema de combate centralizado
 */
export class CombatSystem {
  private scene: Phaser.Scene;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  /**
   * Calcula daño considerando defensa
   */
  calculateDamage(attackerDamage: number, defenderDefense: number): number {
    const baseDamage = Math.max(1, attackerDamage - defenderDefense * 0.5);
    const variance = Phaser.Math.Between(-2, 2);
    return Math.max(1, Math.floor(baseDamage + variance));
  }

  /**
   * Aplica daño a una entidad
   */
  applyDamage(target: any, damage: number, knockbackAngle?: number): void {
    if (!target || !target.active) return;

    const finalDamage = this.calculateDamage(damage, target.stats?.defense || 0);

    if (target.stats && target.stats.hp !== undefined) {
      target.stats.hp = Math.max(0, target.stats.hp - finalDamage);
    }

    // Efecto visual de daño
    if (target.setTint) {
      target.setTint(0xff0000);
      this.scene.time.delayedCall(100, () => {
        if (target && target.clearTint) target.clearTint();
      });
    }

    // Knockback si se proporciona ángulo
    if (knockbackAngle !== undefined && target.body) {
      const knockbackX = Math.cos(knockbackAngle) * GameConfig.KNOCKBACK_FORCE;
      const knockbackY = Math.sin(knockbackAngle) * GameConfig.KNOCKBACK_FORCE;
      target.setVelocity(knockbackX, knockbackY);
    }

    // Emitir evento de daño
    this.scene.events.emit('entity-damaged', { target, damage: finalDamage });

    // Verificar muerte
    if (target.stats && target.stats.hp <= 0) {
      this.handleDeath(target);
    }
  }

  /**
   * Maneja la muerte de una entidad
   */
  private handleDeath(entity: any): void {
    this.scene.events.emit('entity-death', entity);

    // Efecto de muerte
    this.createDeathEffect(entity.x, entity.y);

    // Destruir entidad
    if (entity.destroy) {
      entity.destroy();
    }
  }

  /**
   * Crea efecto visual de muerte
   */
  private createDeathEffect(x: number, y: number): void {
    const particles = this.scene.add.particles(x, y, 'dot_hazard', {
      speed: { min: 50, max: 150 },
      angle: { min: 0, max: 360 },
      scale: { start: 1, end: 0 },
      alpha: { start: 1, end: 0 },
      lifespan: 600,
      quantity: 10
    });

    this.scene.time.delayedCall(700, () => {
      particles.destroy();
    });
  }

  /**
   * Verifica si un ataque golpea al objetivo
   */
  checkHit(attacker: any, target: any, range: number): boolean {
    if (!attacker || !target || !target.active) return false;

    const distance = Phaser.Math.Distance.Between(
      attacker.x, attacker.y,
      target.x, target.y
    );

    return distance <= range;
  }

  /**
   * Realiza un ataque de área
   */
  areaAttack(center: Phaser.Math.Vector2, radius: number, damage: number, targets: any[]): void {
    targets.forEach(target => {
      if (!target || !target.active) return;

      const distance = Phaser.Math.Distance.Between(center.x, center.y, target.x, target.y);

      if (distance <= radius) {
        const angle = Phaser.Math.Angle.Between(center.x, center.y, target.x, target.y);
        this.applyDamage(target, damage, angle);
      }
    });

    // Efecto visual de área
    this.createAreaEffect(center.x, center.y, radius);
  }

  /**
   * Crea efecto visual de ataque de área
   */
  private createAreaEffect(x: number, y: number, radius: number): void {
    const circle = this.scene.add.circle(x, y, radius, 0xff9800, 0.3);

    this.scene.tweens.add({
      targets: circle,
      scale: 1.5,
      alpha: 0,
      duration: 300,
      onComplete: () => circle.destroy()
    });
  }

  /**
   * Cura una entidad
   */
  heal(target: any, amount: number): void {
    if (!target || !target.stats) return;

    const healAmount = Math.min(amount, target.stats.maxHp - target.stats.hp);
    target.stats.hp += healAmount;

    // Efecto visual de curación
    this.createHealEffect(target.x, target.y);

    this.scene.events.emit('entity-healed', { target, amount: healAmount });
  }

  /**
   * Crea efecto visual de curación
   */
  private createHealEffect(x: number, y: number): void {
    const particles = this.scene.add.particles(x, y, 'dot_power', {
      speed: { min: 30, max: 80 },
      angle: { min: 0, max: 360 },
      scale: { start: 0.8, end: 0 },
      alpha: { start: 1, end: 0 },
      lifespan: 500,
      quantity: 8,
      tint: 0x00ff00
    });

    this.scene.time.delayedCall(600, () => {
      particles.destroy();
    });
  }
}

export default CombatSystem;
