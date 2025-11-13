import { Item, ItemType, WeaponType } from '../config/Types';

/**
 * Base de datos de todos los items del juego
 */
export const ItemDatabase: Record<string, Item> = {
  // Pociones
  health_potion: {
    id: 'health_potion',
    name: 'Poción de Vida',
    type: ItemType.POTION,
    description: 'Restaura 50 HP',
    icon: 'flask_red',
    stackable: true,
    maxStack: 10
  },
  mana_potion: {
    id: 'mana_potion',
    name: 'Poción de Maná',
    type: ItemType.POTION,
    description: 'Restaura 50 Maná',
    icon: 'flask_blue',
    stackable: true,
    maxStack: 10
  },
  speed_potion: {
    id: 'speed_potion',
    name: 'Poción de Velocidad',
    type: ItemType.POTION,
    description: 'Aumenta velocidad por 10s',
    icon: 'flask_yellow',
    stackable: true,
    maxStack: 5
  },
  strength_potion: {
    id: 'strength_potion',
    name: 'Poción de Fuerza',
    type: ItemType.POTION,
    description: 'Aumenta daño por 10s',
    icon: 'flask_green',
    stackable: true,
    maxStack: 5
  },

  // Armas
  rusty_sword: {
    id: 'rusty_sword',
    name: 'Espada Oxidada',
    type: ItemType.WEAPON,
    description: 'Espada básica +5 daño',
    icon: 'weapon_sword',
    stackable: false,
    maxStack: 1,
    stats: { damage: 5 }
  },
  iron_sword: {
    id: 'iron_sword',
    name: 'Espada de Hierro',
    type: ItemType.WEAPON,
    description: 'Espada resistente +10 daño',
    icon: 'weapon_sword',
    stackable: false,
    maxStack: 1,
    stats: { damage: 10 }
  },
  steel_sword: {
    id: 'steel_sword',
    name: 'Espada de Acero',
    type: ItemType.WEAPON,
    description: 'Espada afilada +15 daño',
    icon: 'weapon_sword',
    stackable: false,
    maxStack: 1,
    stats: { damage: 15 }
  },
  legendary_sword: {
    id: 'legendary_sword',
    name: 'Espada Legendaria',
    type: ItemType.WEAPON,
    description: 'Espada mítica +30 daño',
    icon: 'weapon_sword',
    stackable: false,
    maxStack: 1,
    stats: { damage: 30 }
  },
  wooden_bow: {
    id: 'wooden_bow',
    name: 'Arco de Madera',
    type: ItemType.WEAPON,
    description: 'Arco simple +7 daño',
    icon: 'weapon_bow',
    stackable: false,
    maxStack: 1,
    stats: { damage: 7 }
  },
  magic_staff: {
    id: 'magic_staff',
    name: 'Báculo Mágico',
    type: ItemType.WEAPON,
    description: 'Báculo +12 daño, -5 maná',
    icon: 'weapon_staff',
    stackable: false,
    maxStack: 1,
    stats: { damage: 12, maxMana: 20 }
  },

  // Armadura
  leather_armor: {
    id: 'leather_armor',
    name: 'Armadura de Cuero',
    type: ItemType.ARMOR,
    description: 'Armadura ligera +3 defensa',
    icon: 'armor_leather',
    stackable: false,
    maxStack: 1,
    stats: { defense: 3 }
  },
  chain_armor: {
    id: 'chain_armor',
    name: 'Armadura de Malla',
    type: ItemType.ARMOR,
    description: 'Armadura media +7 defensa',
    icon: 'armor_chain',
    stackable: false,
    maxStack: 1,
    stats: { defense: 7 }
  },
  plate_armor: {
    id: 'plate_armor',
    name: 'Armadura de Placas',
    type: ItemType.ARMOR,
    description: 'Armadura pesada +12 defensa',
    icon: 'armor_plate',
    stackable: false,
    maxStack: 1,
    stats: { defense: 12, speed: -20 }
  },

  // Accesorios
  hp_ring: {
    id: 'hp_ring',
    name: 'Anillo de Vida',
    type: ItemType.ACCESSORY,
    description: 'Aumenta vida máxima +30',
    icon: 'ring_red',
    stackable: false,
    maxStack: 1,
    stats: { maxHp: 30 }
  },
  speed_boots: {
    id: 'speed_boots',
    name: 'Botas de Velocidad',
    type: ItemType.ACCESSORY,
    description: 'Aumenta velocidad +40',
    icon: 'boots',
    stackable: false,
    maxStack: 1,
    stats: { speed: 40 }
  },

  // Llaves y oro
  gold_coin: {
    id: 'gold_coin',
    name: 'Oro',
    type: ItemType.GOLD,
    description: 'Moneda de oro',
    icon: 'chest_golden_closed',
    stackable: true,
    maxStack: 999
  },
  dungeon_key: {
    id: 'dungeon_key',
    name: 'Llave de Mazmorra',
    type: ItemType.KEY,
    description: 'Abre puertas cerradas',
    icon: 'key',
    stackable: true,
    maxStack: 5
  }
};

export default ItemDatabase;
