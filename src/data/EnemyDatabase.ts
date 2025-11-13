import { EnemyConfig, EnemyType } from '../config/Types';

/**
 * Base de datos de enemigos con sus configuraciones
 */
export const EnemyDatabase: Record<EnemyType, EnemyConfig> = {
  [EnemyType.BAT]: {
    type: EnemyType.BAT,
    hp: 30,
    damage: 5,
    speed: 120,
    xpReward: 10,
    goldReward: 2,
    texture: 'monster_bat',
    aiType: 'chase'
  },
  [EnemyType.SLIME]: {
    type: EnemyType.SLIME,
    hp: 40,
    damage: 7,
    speed: 80,
    xpReward: 15,
    goldReward: 3,
    texture: 'monster_slime',
    aiType: 'wander'
  },
  [EnemyType.SKELETON]: {
    type: EnemyType.SKELETON,
    hp: 60,
    damage: 12,
    speed: 90,
    xpReward: 25,
    goldReward: 5,
    texture: 'monster_skeleton',
    aiType: 'patrol'
  },
  [EnemyType.GOBLIN]: {
    type: EnemyType.GOBLIN,
    hp: 50,
    damage: 10,
    speed: 100,
    xpReward: 20,
    goldReward: 7,
    texture: 'monster_goblin',
    aiType: 'ranged'
  },
  [EnemyType.BOSS]: {
    type: EnemyType.BOSS,
    hp: 200,
    damage: 20,
    speed: 70,
    xpReward: 100,
    goldReward: 50,
    texture: 'monster_boss',
    aiType: 'chase'
  }
};

export default EnemyDatabase;
