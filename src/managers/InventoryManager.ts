import { Item, InventorySlot, ItemType } from '../config/Types';
import GameConfig from '../config/GameConfig';
import ItemDatabase from '../data/ItemDatabase';

/**
 * Gestor del inventario del jugador
 */
export class InventoryManager {
  private slots: InventorySlot[];
  private maxSlots: number;
  private equippedWeapon: Item | null = null;
  private equippedArmor: Item | null = null;
  private equippedAccessory: Item | null = null;

  constructor(maxSlots: number = GameConfig.INVENTORY_SLOTS) {
    this.maxSlots = maxSlots;
    this.slots = Array.from({ length: maxSlots }, () => ({
      item: null,
      quantity: 0
    }));
  }

  /**
   * Añade un item al inventario
   */
  addItem(itemId: string, quantity: number = 1): boolean {
    const item = ItemDatabase[itemId];
    if (!item) {
      console.warn(`Item no encontrado: ${itemId}`);
      return false;
    }

    // Si es stackable, buscar slot existente
    if (item.stackable) {
      const existingSlot = this.slots.find(
        slot => slot.item?.id === itemId && slot.quantity < item.maxStack
      );

      if (existingSlot && existingSlot.item) {
        const spaceLeft = existingSlot.item.maxStack - existingSlot.quantity;
        const toAdd = Math.min(quantity, spaceLeft);
        existingSlot.quantity += toAdd;
        quantity -= toAdd;

        if (quantity === 0) return true;
      }
    }

    // Buscar slot vacío
    const emptySlot = this.slots.find(slot => slot.item === null);
    if (emptySlot) {
      emptySlot.item = item;
      emptySlot.quantity = Math.min(quantity, item.maxStack);
      return true;
    }

    console.warn('Inventario lleno');
    return false;
  }

  /**
   * Remueve un item del inventario
   */
  removeItem(slotIndex: number, quantity: number = 1): boolean {
    const slot = this.slots[slotIndex];
    if (!slot || !slot.item) return false;

    slot.quantity -= quantity;

    if (slot.quantity <= 0) {
      slot.item = null;
      slot.quantity = 0;
    }

    return true;
  }

  /**
   * Usa un item del inventario
   */
  useItem(slotIndex: number): boolean {
    const slot = this.slots[slotIndex];
    if (!slot || !slot.item) return false;

    const item = slot.item;

    // Solo se pueden usar pociones directamente
    if (item.type === ItemType.POTION) {
      if (item.effect) {
        item.effect();
      }
      this.removeItem(slotIndex, 1);
      return true;
    }

    return false;
  }

  /**
   * Equipa un item
   */
  equipItem(slotIndex: number): boolean {
    const slot = this.slots[slotIndex];
    if (!slot || !slot.item) return false;

    const item = slot.item;

    switch (item.type) {
      case ItemType.WEAPON:
        if (this.equippedWeapon) {
          this.addItem(this.equippedWeapon.id);
        }
        this.equippedWeapon = item;
        this.removeItem(slotIndex, 1);
        return true;

      case ItemType.ARMOR:
        if (this.equippedArmor) {
          this.addItem(this.equippedArmor.id);
        }
        this.equippedArmor = item;
        this.removeItem(slotIndex, 1);
        return true;

      case ItemType.ACCESSORY:
        if (this.equippedAccessory) {
          this.addItem(this.equippedAccessory.id);
        }
        this.equippedAccessory = item;
        this.removeItem(slotIndex, 1);
        return true;

      default:
        return false;
    }
  }

  /**
   * Desequipa un item
   */
  unequipItem(type: ItemType): boolean {
    let item: Item | null = null;

    switch (type) {
      case ItemType.WEAPON:
        item = this.equippedWeapon;
        this.equippedWeapon = null;
        break;
      case ItemType.ARMOR:
        item = this.equippedArmor;
        this.equippedArmor = null;
        break;
      case ItemType.ACCESSORY:
        item = this.equippedAccessory;
        this.equippedAccessory = null;
        break;
    }

    if (item) {
      return this.addItem(item.id);
    }

    return false;
  }

  /**
   * Obtiene todos los slots
   */
  getSlots(): InventorySlot[] {
    return this.slots;
  }

  /**
   * Obtiene el item equipado
   */
  getEquipped(type: ItemType): Item | null {
    switch (type) {
      case ItemType.WEAPON:
        return this.equippedWeapon;
      case ItemType.ARMOR:
        return this.equippedArmor;
      case ItemType.ACCESSORY:
        return this.equippedAccessory;
      default:
        return null;
    }
  }

  /**
   * Calcula bonus de stats de items equipados
   */
  getTotalStatsBonus(): Partial<import('../config/Types').Stats> {
    const bonus: any = {
      maxHp: 0,
      hp: 0,
      maxMana: 0,
      mana: 0,
      damage: 0,
      defense: 0,
      speed: 0
    };

    const equipped = [this.equippedWeapon, this.equippedArmor, this.equippedAccessory];

    equipped.forEach(item => {
      if (item && item.stats) {
        Object.keys(item.stats).forEach(key => {
          bonus[key] += (item.stats as any)[key] || 0;
        });
      }
    });

    return bonus;
  }

  /**
   * Cuenta cantidad de un item específico
   */
  countItem(itemId: string): number {
    return this.slots
      .filter(slot => slot.item?.id === itemId)
      .reduce((sum, slot) => sum + slot.quantity, 0);
  }

  /**
   * Limpia el inventario
   */
  clear(): void {
    this.slots.forEach(slot => {
      slot.item = null;
      slot.quantity = 0;
    });
    this.equippedWeapon = null;
    this.equippedArmor = null;
    this.equippedAccessory = null;
  }

  /**
   * Serializa el inventario para guardado
   */
  serialize(): any {
    return {
      slots: this.slots.map(slot => ({
        itemId: slot.item?.id || null,
        quantity: slot.quantity
      })),
      equippedWeapon: this.equippedWeapon?.id || null,
      equippedArmor: this.equippedArmor?.id || null,
      equippedAccessory: this.equippedAccessory?.id || null
    };
  }

  /**
   * Deserializa el inventario desde guardado
   */
  deserialize(data: any): void {
    this.clear();

    if (data.slots) {
      data.slots.forEach((slotData: any, index: number) => {
        if (slotData.itemId) {
          this.slots[index] = {
            item: ItemDatabase[slotData.itemId] || null,
            quantity: slotData.quantity
          };
        }
      });
    }

    if (data.equippedWeapon) {
      this.equippedWeapon = ItemDatabase[data.equippedWeapon] || null;
    }
    if (data.equippedArmor) {
      this.equippedArmor = ItemDatabase[data.equippedArmor] || null;
    }
    if (data.equippedAccessory) {
      this.equippedAccessory = ItemDatabase[data.equippedAccessory] || null;
    }
  }
}

export default InventoryManager;
