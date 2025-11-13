import Phaser from 'phaser';
import SaveManager from '../managers/SaveManager';
import GameConfig from '../config/GameConfig';

/**
 * Menú principal del juego
 */
export class MenuScene extends Phaser.Scene {
  private selectedOption: number = 0;
  private menuOptions: Phaser.GameObjects.Text[] = [];
  private saveManager: SaveManager;
  private hasSaveData: boolean = false;

  constructor() {
    super('MenuScene');
    this.saveManager = SaveManager.getInstance();
  }

  create(): void {
    const { width, height } = this.scale;

    // Verificar si hay guardado
    this.hasSaveData = this.saveManager.hasSaveData();

    // Título del juego
    const title = this.add.text(width / 2, height / 4, 'DUNGEON CRAWLER', {
      fontSize: '64px',
      color: '#FFD700',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    // Animación del título
    this.tweens.add({
      targets: title,
      scaleX: 1.05,
      scaleY: 1.05,
      duration: 1000,
      yoyo: true,
      repeat: -1,
      ease: 'sine.inOut'
    });

    // Subtítulo
    this.add.text(width / 2, height / 4 + 70, 'Aventura Épica en las Mazmorras', {
      fontSize: '20px',
      color: '#cccccc'
    }).setOrigin(0.5);

    // Opciones del menú
    const startY = height / 2;
    const spacing = 60;

    const options: string[] = this.hasSaveData
      ? ['Nueva Partida', 'Continuar', 'Configuración', 'Créditos', 'Salir']
      : ['Nueva Partida', 'Configuración', 'Créditos', 'Salir'];

    options.forEach((option, index) => {
      const text = this.add.text(width / 2, startY + index * spacing, option, {
        fontSize: '32px',
        color: '#ffffff'
      }).setOrigin(0.5);

      text.setInteractive({ useHandCursor: true });

      text.on('pointerover', () => {
        this.selectedOption = index;
        this.updateSelection();
      });

      text.on('pointerdown', () => {
        this.selectOption(index);
      });

      this.menuOptions.push(text);
    });

    this.updateSelection();

    // Controles con teclado
    const cursorKeys = this.input.keyboard!.createCursorKeys();
    const enterKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);
    const spaceKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

    this.input.keyboard!.on('keydown-UP', () => {
      this.selectedOption = Math.max(0, this.selectedOption - 1);
      this.updateSelection();
    });

    this.input.keyboard!.on('keydown-DOWN', () => {
      this.selectedOption = Math.min(this.menuOptions.length - 1, this.selectedOption + 1);
      this.updateSelection();
    });

    enterKey.on('down', () => this.selectOption(this.selectedOption));
    spaceKey.on('down', () => this.selectOption(this.selectedOption));

    // Información de guardado si existe
    if (this.hasSaveData) {
      const saveInfo = this.saveManager.getSaveInfo();
      if (saveInfo) {
        const date = new Date(saveInfo.timestamp);
        const timeStr = this.formatPlayTime(saveInfo.playTime);
        this.add.text(width / 2, height - 100,
          `Último guardado: Nivel ${saveInfo.level} | ${timeStr} | ${date.toLocaleDateString()}`,
          {
            fontSize: '16px',
            color: '#888888'
          }).setOrigin(0.5);
      }
    }

    // Controles
    this.add.text(width / 2, height - 50, 'Controles: ↑↓ para navegar, ENTER para seleccionar', {
      fontSize: '14px',
      color: '#666666'
    }).setOrigin(0.5);

    // Partículas de fondo
    this.createBackgroundEffect();
  }

  /**
   * Actualiza la selección visual
   */
  private updateSelection(): void {
    this.menuOptions.forEach((option, index) => {
      if (index === this.selectedOption) {
        option.setColor('#FFD700');
        option.setScale(1.1);
      } else {
        option.setColor('#ffffff');
        option.setScale(1);
      }
    });
  }

  /**
   * Selecciona una opción
   */
  private selectOption(index: number): void {
    // Sonido de selección
    if (this.sound.get('s_pickup')) {
      this.sound.play('s_pickup', { volume: 0.5 });
    }

    const optionText = this.menuOptions[index].text;

    switch (optionText) {
      case 'Nueva Partida':
        this.confirmNewGame();
        break;
      case 'Continuar':
        this.continueGame();
        break;
      case 'Configuración':
        this.openSettings();
        break;
      case 'Créditos':
        this.showCredits();
        break;
      case 'Salir':
        this.exitGame();
        break;
    }
  }

  /**
   * Confirma nueva partida
   */
  private confirmNewGame(): void {
    if (this.hasSaveData) {
      // Mostrar confirmación
      const confirm = window.confirm('¿Deseas iniciar una nueva partida? Se perderá el progreso actual.');
      if (!confirm) return;
    }

    this.cameras.main.fadeOut(500);
    this.time.delayedCall(500, () => {
      this.scene.start('GameScene');
    });
  }

  /**
   * Continúa la partida guardada
   */
  private continueGame(): void {
    this.cameras.main.fadeOut(500);
    this.time.delayedCall(500, () => {
      this.scene.start('GameScene', { loadSave: true });
    });
  }

  /**
   * Abre configuración
   */
  private openSettings(): void {
    this.scene.launch('SettingsScene');
    this.scene.pause();
  }

  /**
   * Muestra créditos
   */
  private showCredits(): void {
    const { width, height } = this.scale;

    // Overlay oscuro
    const overlay = this.add.rectangle(0, 0, width, height, 0x000000, 0.8).setOrigin(0);

    const credits = this.add.text(width / 2, height / 2,
      `CRÉDITOS

Desarrollado con Phaser 3
TypeScript + Vite

Game Design & Programming
[Tu Nombre]

Assets
Public Domain & Custom

Gracias por jugar!

[Presiona ESC para volver]`, {
      fontSize: '24px',
      color: '#ffffff',
      align: 'center',
      lineSpacing: 10
    }).setOrigin(0.5);

    const escKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
    const closeCredits = () => {
      overlay.destroy();
      credits.destroy();
      escKey.off('down', closeCredits);
    };

    escKey.on('down', closeCredits);

    overlay.setInteractive();
    overlay.on('pointerdown', closeCredits);
  }

  /**
   * Sale del juego
   */
  private exitGame(): void {
    if (typeof window !== 'undefined') {
      const confirm = window.confirm('¿Deseas salir del juego?');
      if (confirm) {
        window.close();
      }
    }
  }

  /**
   * Formatea tiempo de juego
   */
  private formatPlayTime(ms: number): string {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    } else {
      return `${minutes}m ${seconds % 60}s`;
    }
  }

  /**
   * Crea efecto de fondo
   */
  private createBackgroundEffect(): void {
    const { width, height } = this.scale;

    // Partículas flotantes
    for (let i = 0; i < 20; i++) {
      const x = Phaser.Math.Between(0, width);
      const y = Phaser.Math.Between(0, height);

      const particle = this.add.circle(x, y, 2, 0xFFD700, 0.3);

      this.tweens.add({
        targets: particle,
        y: y + Phaser.Math.Between(-50, 50),
        alpha: { from: 0.1, to: 0.5 },
        duration: Phaser.Math.Between(2000, 4000),
        yoyo: true,
        repeat: -1,
        ease: 'sine.inOut'
      });
    }
  }
}

export default MenuScene;
