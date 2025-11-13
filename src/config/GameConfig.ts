/**
 * Configuración global del juego
 */
export const GameConfig = {
  // Dimensiones
  GAME_WIDTH: 1280,
  GAME_HEIGHT: 720,
  TILE_SIZE: 64,

  // Mundo
  WORLD_WIDTH: 3000,
  WORLD_HEIGHT: 3000,

  // Jugador
  PLAYER_BASE_SPEED: 200,
  PLAYER_SPRINT_MULT: 1.6,
  PLAYER_BASE_HP: 100,
  PLAYER_BASE_MANA: 100,
  PLAYER_BASE_DAMAGE: 10,

  // Combate
  ATTACK_COOLDOWN: 500,
  ATTACK_RANGE: 80,
  KNOCKBACK_FORCE: 200,

  // Experiencia
  XP_BASE: 100,
  XP_MULTIPLIER: 1.5,

  // Dificultad
  DIFFICULTY_INCREASE_TIME: 30000, // 30 segundos
  ENEMY_SPAWN_RATE: 5000, // 5 segundos
  MAX_ENEMIES: 20,

  // UI
  HUD_PADDING: 16,
  MINIMAP_SIZE: 220,
  INVENTORY_SLOTS: 12,

  // Sistema de guardado
  SAVE_KEY: 'dungeon_crawler_save',
  SETTINGS_KEY: 'dungeon_crawler_settings',
} as const;

export default GameConfig;
