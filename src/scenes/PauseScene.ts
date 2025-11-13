import Phaser from 'phaser';
import SaveManager from '../managers/SaveManager';

/**
 * Escena de Pausa
 */
export class PauseScene extends Phaser.Scene {
  private saveManager: SaveManager;

  constructor() {
    super('PauseScene');
    this.saveManager = SaveManager.getInstance();
  }

  create(): void {
    const { width, height } = this.scale;

    // Overlay semitransparente
    const overlay = this.add.rectangle(0, 0, width, height, 0x000000, 0.7).setOrigin(0);

    // Título
    this.add.text(width / 2, 150, 'PAUSA', {
      fontSize: '64px',
      color: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    // Opciones del menú
    const startY = 300;
    const spacing = 70;

    this.createMenuOption(width / 2, startY, 'Continuar', () => this.resume());
    this.createMenuOption(width / 2, startY + spacing, 'Guardar Juego', () => this.saveGame());
    this.createMenuOption(width / 2, startY + spacing * 2, 'Configuración', () => this.openSettings());
    this.createMenuOption(width / 2, startY + spacing * 3, 'Salir al Menú', () => this.exitToMenu());

    // Controles
    this.add.text(width / 2, height - 50, 'ESC para continuar', {
      fontSize: '16px',
      color: '#888888'
    }).setOrigin(0.5);

    // Tecla ESC para resumir
    const escKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
    escKey.on('down', () => this.resume());
  }

  /**
   * Crea una opción del menú
   */
  private createMenuOption(x: number, y: number, text: string, callback: () => void): void {
    const option = this.add.text(x, y, text, {
      fontSize: '32px',
      color: '#ffffff'
    }).setOrigin(0.5);

    option.setInteractive({ useHandCursor: true });

    option.on('pointerover', () => {
      option.setColor('#FFD700');
      option.setScale(1.1);
    });

    option.on('pointerout', () => {
      option.setColor('#ffffff');
      option.setScale(1);
    });

    option.on('pointerdown', () => {
      if (this.sound.get('s_pickup')) {
        this.sound.play('s_pickup', { volume: 0.5 });
      }
      callback();
    });
  }

  /**
   * Resume el juego
   */
  private resume(): void {
    this.scene.stop();
    this.scene.resume('GameScene');
  }

  /**
   * Guarda el juego
   */
  private saveGame(): void {
    const gameScene = this.scene.get('GameScene') as any;

    if (gameScene && gameScene.player) {
      const saveData = {
        playerStats: gameScene.player.progression.serialize(),
        inventory: gameScene.player.inventory.serialize(),
        currentLevel: gameScene.difficulty || 1,
        playTime: gameScene.gameTime || 0,
        timestamp: Date.now()
      };

      if (this.saveManager.saveGame(saveData)) {
        // Mostrar notificación
        const notification = this.add.text(this.scale.width / 2, this.scale.height / 2, 'Juego Guardado', {
          fontSize: '32px',
          color: '#00ff00',
          backgroundColor: '#000000',
          padding: { x: 20, y: 10 }
        }).setOrigin(0.5);

        this.tweens.add({
          targets: notification,
          alpha: 0,
          y: notification.y - 50,
          duration: 2000,
          onComplete: () => notification.destroy()
        });
      }
    }
  }

  /**
   * Abre configuración
   */
  private openSettings(): void {
    this.scene.launch('SettingsScene');
    this.scene.pause();
  }

  /**
   * Sale al menú principal
   */
  private exitToMenu(): void {
    const confirm = window.confirm('¿Salir al menú principal? (No olvides guardar)');
    if (confirm) {
      this.scene.stop();
      this.scene.stop('GameScene');
      this.scene.stop('HUDScene');
      this.scene.start('MenuScene');
    }
  }
}

export default PauseScene;
