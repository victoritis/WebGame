import Phaser from 'phaser';
import PlayerCharacter from '../entities/PlayerCharacter';

/**
 * Escena de Inventario
 */
export class InventoryScene extends Phaser.Scene {
  private player!: PlayerCharacter;
  private selectedSlot: number = 0;
  private slotGraphics: Phaser.GameObjects.Graphics[] = [];

  constructor() {
    super('InventoryScene');
  }

  init(data: any): void {
    this.player = data.player;
  }

  create(): void {
    const { width, height } = this.scale;

    // Overlay
    this.add.rectangle(0, 0, width, height, 0x000000, 0.85).setOrigin(0);

    // Título
    this.add.text(width / 2, 60, 'INVENTARIO', {
      fontSize: '48px',
      color: '#FFD700',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    // Grid del inventario
    this.createInventoryGrid();

    // Panel de equipamiento
    this.createEquipmentPanel();

    // Panel de descripción
    this.createDescriptionPanel();

    // Instrucciones
    this.add.text(width / 2, height - 30, 'WASD/Flechas: Navegar | ENTER: Usar/Equipar | Q: Soltar | I/ESC: Cerrar', {
      fontSize: '14px',
      color: '#888888'
    }).setOrigin(0.5);

    // Controles
    this.setupControls();
  }

  /**
   * Crea la grid del inventario
   */
  private createInventoryGrid(): void {
    const startX = 100;
    const startY = 150;
    const slotSize = 64;
    const padding = 8;
    const cols = 6;

    const slots = this.player.inventory.getSlots();

    slots.forEach((slot, index) => {
      const col = index % cols;
      const row = Math.floor(index / cols);
      const x = startX + col * (slotSize + padding);
      const y = startY + row * (slotSize + padding);

      // Fondo del slot
      const slotBg = this.add.graphics();
      slotBg.fillStyle(0x333333, 1);
      slotBg.fillRect(x, y, slotSize, slotSize);
      slotBg.lineStyle(2, 0x666666, 1);
      slotBg.strokeRect(x, y, slotSize, slotSize);
      this.slotGraphics.push(slotBg);

      // Item (si existe)
      if (slot.item) {
        const icon = this.add.rectangle(x + slotSize / 2, y + slotSize / 2, 48, 48, 0x666666);

        // Cantidad
        if (slot.quantity > 1) {
          this.add.text(x + slotSize - 8, y + slotSize - 8, slot.quantity.toString(), {
            fontSize: '14px',
            color: '#ffffff',
            backgroundColor: '#000000'
          }).setOrigin(1);
        }

        // Nombre del item
        this.add.text(x + slotSize / 2, y + slotSize + 5, slot.item.name, {
          fontSize: '10px',
          color: '#ffffff'
        }).setOrigin(0.5, 0).setWordWrapWidth(slotSize);
      }

      // Interactividad
      const hitArea = this.add.rectangle(x + slotSize / 2, y + slotSize / 2, slotSize, slotSize, 0x000000, 0);
      hitArea.setInteractive({ useHandCursor: true });

      hitArea.on('pointerdown', () => {
        this.selectedSlot = index;
        this.updateSelection();
      });
    });

    this.updateSelection();
  }

  /**
   * Crea panel de equipamiento
   */
  private createEquipmentPanel(): void {
    const { width } = this.scale;
    const panelX = width - 300;
    const panelY = 150;

    this.add.text(panelX, panelY - 30, 'EQUIPAMIENTO', {
      fontSize: '24px',
      color: '#FFD700'
    });

    // Slots de equipamiento
    const equipment = [
      { label: 'Arma', type: 'weapon', y: panelY },
      { label: 'Armadura', type: 'armor', y: panelY + 80 },
      { label: 'Accesorio', type: 'accessory', y: panelY + 160 }
    ];

    equipment.forEach(equip => {
      this.add.text(panelX, equip.y, equip.label + ':', {
        fontSize: '18px',
        color: '#ffffff'
      });

      // Slot visual
      const slotBg = this.add.graphics();
      slotBg.fillStyle(0x333333, 1);
      slotBg.fillRect(panelX, equip.y + 25, 200, 50);
      slotBg.lineStyle(2, 0x666666, 1);
      slotBg.strokeRect(panelX, equip.y + 25, 200, 50);

      // Item equipado (placeholder)
      const equipped = this.player.inventory.getEquipped(equip.type as any);
      if (equipped) {
        this.add.text(panelX + 100, equip.y + 50, equipped.name, {
          fontSize: '14px',
          color: '#ffffff'
        }).setOrigin(0.5);
      } else {
        this.add.text(panelX + 100, equip.y + 50, '(Vacío)', {
          fontSize: '14px',
          color: '#888888'
        }).setOrigin(0.5);
      }
    });

    // Stats del jugador
    const statsY = panelY + 260;
    this.add.text(panelX, statsY, 'STATS TOTALES', {
      fontSize: '20px',
      color: '#FFD700'
    });

    const totalStats = this.player.getTotalStats();
    const statsText = [
      `Daño: ${totalStats.damage}`,
      `Defensa: ${totalStats.defense}`,
      `Velocidad: ${totalStats.speed}`
    ];

    statsText.forEach((text, index) => {
      this.add.text(panelX, statsY + 30 + index * 25, text, {
        fontSize: '16px',
        color: '#ffffff'
      });
    });
  }

  /**
   * Crea panel de descripción
   */
  private createDescriptionPanel(): void {
    const panelY = 450;
    const panelX = 100;

    this.add.text(panelX, panelY, 'DESCRIPCIÓN', {
      fontSize: '20px',
      color: '#FFD700'
    });

    // Panel de fondo
    this.add.rectangle(panelX, panelY + 30, 600, 100, 0x222222, 1).setOrigin(0);

    // Texto de descripción (se actualizará según selección)
    const slot = this.player.inventory.getSlots()[this.selectedSlot];
    let descText = 'Selecciona un item para ver su descripción.';

    if (slot && slot.item) {
      descText = `${slot.item.name}\n${slot.item.description}`;
    }

    this.add.text(panelX + 10, panelY + 40, descText, {
      fontSize: '16px',
      color: '#ffffff',
      wordWrap: { width: 580 }
    });
  }

  /**
   * Actualiza la selección visual
   */
  private updateSelection(): void {
    this.slotGraphics.forEach((graphic, index) => {
      if (index === this.selectedSlot) {
        // Highlight
        graphic.clear();
        graphic.fillStyle(0x444444, 1);
        const startX = 100;
        const startY = 150;
        const slotSize = 64;
        const padding = 8;
        const cols = 6;
        const col = index % cols;
        const row = Math.floor(index / cols);
        const x = startX + col * (slotSize + padding);
        const y = startY + row * (slotSize + padding);
        graphic.fillRect(x, y, slotSize, slotSize);
        graphic.lineStyle(3, 0xFFD700, 1);
        graphic.strokeRect(x, y, slotSize, slotSize);
      }
    });
  }

  /**
   * Configura controles
   */
  private setupControls(): void {
    const wasd = this.input.keyboard!.addKeys('W,A,S,D') as any;
    const cursors = this.input.keyboard!.createCursorKeys();
    const enterKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);
    const iKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.I);
    const escKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
    const qKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.Q);

    // Navegación
    this.input.keyboard!.on('keydown-RIGHT', () => this.navigate(1, 0));
    this.input.keyboard!.on('keydown-LEFT', () => this.navigate(-1, 0));
    this.input.keyboard!.on('keydown-DOWN', () => this.navigate(0, 1));
    this.input.keyboard!.on('keydown-UP', () => this.navigate(0, -1));

    // WASD
    wasd.D.on('down', () => this.navigate(1, 0));
    wasd.A.on('down', () => this.navigate(-1, 0));
    wasd.S.on('down', () => this.navigate(0, 1));
    wasd.W.on('down', () => this.navigate(0, -1));

    // Acciones
    enterKey.on('down', () => this.useOrEquipItem());
    qKey.on('down', () => this.dropItem());

    // Cerrar
    iKey.on('down', () => this.close());
    escKey.on('down', () => this.close());
  }

  /**
   * Navega por el inventario
   */
  private navigate(dx: number, dy: number): void {
    const cols = 6;
    const currentCol = this.selectedSlot % cols;
    const currentRow = Math.floor(this.selectedSlot / cols);

    let newCol = currentCol + dx;
    let newRow = currentRow + dy;

    const maxRow = Math.ceil(this.player.inventory.getSlots().length / cols) - 1;

    newCol = Phaser.Math.Clamp(newCol, 0, cols - 1);
    newRow = Phaser.Math.Clamp(newRow, 0, maxRow);

    this.selectedSlot = newRow * cols + newCol;
    this.selectedSlot = Phaser.Math.Clamp(this.selectedSlot, 0, this.player.inventory.getSlots().length - 1);

    this.updateSelection();
    this.scene.restart();
  }

  /**
   * Usa o equipa el item seleccionado
   */
  private useOrEquipItem(): void {
    const slot = this.player.inventory.getSlots()[this.selectedSlot];
    if (!slot || !slot.item) return;

    const itemType = slot.item.type;

    if (itemType === 'potion') {
      this.player.inventory.useItem(this.selectedSlot);
    } else if (itemType === 'weapon' || itemType === 'armor' || itemType === 'accessory') {
      this.player.inventory.equipItem(this.selectedSlot);
    }

    this.scene.restart();
  }

  /**
   * Suelta el item seleccionado
   */
  private dropItem(): void {
    const slot = this.player.inventory.getSlots()[this.selectedSlot];
    if (!slot || !slot.item) return;

    const confirm = window.confirm(`¿Soltar ${slot.item.name}?`);
    if (confirm) {
      this.player.inventory.removeItem(this.selectedSlot, slot.quantity);
      this.scene.restart();
    }
  }

  /**
   * Cierra el inventario
   */
  private close(): void {
    this.scene.stop();
    this.scene.resume('GameScene');
  }
}

export default InventoryScene;
