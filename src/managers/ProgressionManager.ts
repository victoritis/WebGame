import { PlayerStats } from '../config/Types';
import GameConfig from '../config/GameConfig';

/**
 * Gestor de progresión y niveles del jugador
 */
export class ProgressionManager {
  private stats: PlayerStats;
  private onLevelUp?: (newLevel: number) => void;

  constructor(initialLevel: number = 1) {
    this.stats = {
      level: initialLevel,
      xp: 0,
      xpToNextLevel: this.calculateXPForLevel(initialLevel + 1),
      maxHp: GameConfig.PLAYER_BASE_HP,
      hp: GameConfig.PLAYER_BASE_HP,
      maxMana: GameConfig.PLAYER_BASE_MANA,
      mana: GameConfig.PLAYER_BASE_MANA,
      damage: GameConfig.PLAYER_BASE_DAMAGE,
      defense: 0,
      speed: GameConfig.PLAYER_BASE_SPEED
    };
  }

  /**
   * Calcula XP necesaria para alcanzar un nivel
   */
  private calculateXPForLevel(level: number): number {
    return Math.floor(GameConfig.XP_BASE * Math.pow(GameConfig.XP_MULTIPLIER, level - 1));
  }

  /**
   * Añade experiencia
   */
  addXP(amount: number): boolean {
    this.stats.xp += amount;

    let leveledUp = false;

    // Verificar si sube de nivel
    while (this.stats.xp >= this.stats.xpToNextLevel) {
      this.stats.xp -= this.stats.xpToNextLevel;
      this.levelUp();
      leveledUp = true;
    }

    return leveledUp;
  }

  /**
   * Sube de nivel al jugador
   */
  private levelUp(): void {
    this.stats.level++;
    this.stats.xpToNextLevel = this.calculateXPForLevel(this.stats.level + 1);

    // Mejoras por nivel
    const hpIncrease = 15;
    const manaIncrease = 10;
    const damageIncrease = 2;
    const defenseIncrease = 1;

    this.stats.maxHp += hpIncrease;
    this.stats.hp = this.stats.maxHp; // Curación completa al subir de nivel
    this.stats.maxMana += manaIncrease;
    this.stats.mana = this.stats.maxMana;
    this.stats.damage += damageIncrease;
    this.stats.defense += defenseIncrease;

    // Callback de nivel subido
    if (this.onLevelUp) {
      this.onLevelUp(this.stats.level);
    }
  }

  /**
   * Obtiene las estadísticas actuales
   */
  getStats(): PlayerStats {
    return { ...this.stats };
  }

  /**
   * Actualiza las estadísticas
   */
  updateStats(newStats: Partial<PlayerStats>): void {
    Object.assign(this.stats, newStats);

    // Asegurar límites
    this.stats.hp = Math.min(this.stats.hp, this.stats.maxHp);
    this.stats.mana = Math.min(this.stats.mana, this.stats.maxMana);
  }

  /**
   * Registra callback de subida de nivel
   */
  setLevelUpCallback(callback: (newLevel: number) => void): void {
    this.onLevelUp = callback;
  }

  /**
   * Obtiene el nivel actual
   */
  getLevel(): number {
    return this.stats.level;
  }

  /**
   * Obtiene el progreso de XP (0-1)
   */
  getXPProgress(): number {
    return this.stats.xp / this.stats.xpToNextLevel;
  }

  /**
   * Serializa para guardado
   */
  serialize(): PlayerStats {
    return { ...this.stats };
  }

  /**
   * Deserializa desde guardado
   */
  deserialize(data: PlayerStats): void {
    this.stats = { ...data };
  }

  /**
   * Reinicia stats a valores iniciales
   */
  reset(): void {
    this.stats = {
      level: 1,
      xp: 0,
      xpToNextLevel: this.calculateXPForLevel(2),
      maxHp: GameConfig.PLAYER_BASE_HP,
      hp: GameConfig.PLAYER_BASE_HP,
      maxMana: GameConfig.PLAYER_BASE_MANA,
      mana: GameConfig.PLAYER_BASE_MANA,
      damage: GameConfig.PLAYER_BASE_DAMAGE,
      defense: 0,
      speed: GameConfig.PLAYER_BASE_SPEED
    };
  }
}

export default ProgressionManager;
