/**
 * Tipos globales del juego
 */

export interface Position {
  x: number;
  y: number;
}

export interface Stats {
  maxHp: number;
  hp: number;
  maxMana: number;
  mana: number;
  damage: number;
  defense: number;
  speed: number;
}

export interface PlayerStats extends Stats {
  level: number;
  xp: number;
  xpToNextLevel: number;
}

export enum ItemType {
  WEAPON = 'weapon',
  POTION = 'potion',
  ARMOR = 'armor',
  ACCESSORY = 'accessory',
  KEY = 'key',
  GOLD = 'gold'
}

export enum WeaponType {
  SWORD = 'sword',
  BOW = 'bow',
  STAFF = 'staff',
  DAGGER = 'dagger'
}

export enum EnemyType {
  BAT = 'bat',
  SLIME = 'slime',
  SKELETON = 'skeleton',
  GOBLIN = 'goblin',
  BOSS = 'boss'
}

export interface Item {
  id: string;
  name: string;
  type: ItemType;
  description: string;
  icon: string;
  stackable: boolean;
  maxStack: number;
  effect?: () => void;
  stats?: Partial<Stats>;
}

export interface InventorySlot {
  item: Item | null;
  quantity: number;
}

export interface EnemyConfig {
  type: EnemyType;
  hp: number;
  damage: number;
  speed: number;
  xpReward: number;
  goldReward: number;
  texture: string;
  aiType: 'chase' | 'wander' | 'ranged' | 'patrol';
}

export interface GameSaveData {
  playerStats: PlayerStats;
  inventory: InventorySlot[];
  currentLevel: number;
  timestamp: number;
  playTime: number;
}

export interface GameSettings {
  volume: number;
  musicVolume: number;
  sfxVolume: number;
  fullscreen: boolean;
  difficulty: 'easy' | 'normal' | 'hard';
}
