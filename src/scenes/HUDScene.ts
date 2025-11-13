import Phaser from 'phaser';
import { PlayerStats } from '../config/Types';

/**
 * HUD mejorado del juego
 */
export class HUDScene extends Phaser.Scene {
  // Barras
  private hpBar!: Phaser.GameObjects.Graphics;
  private hpBarBg!: Phaser.GameObjects.Graphics;
  private manaBar!: Phaser.GameObjects.Graphics;
  private manaBarBg!: Phaser.GameObjects.Graphics;
  private staminaBar!: Phaser.GameObjects.Graphics;
  private xpBar!: Phaser.GameObjects.Graphics;

  // Textos
  private levelText!: Phaser.GameObjects.Text;
  private hpText!: Phaser.GameObjects.Text;
  private manaText!: Phaser.GameObjects.Text;
  private goldText!: Phaser.GameObjects.Text;
  private enemiesText!: Phaser.GameObjects.Text;

  // Notificaciones
  private notificationText!: Phaser.GameObjects.Text;
  private notificationTimer: number = 0;

  constructor() {
    super('HUDScene');
  }

  create(): void {
    const { width, height } = this.scale;

    // Panel superior izquierdo - Stats del jugador
    this.createPlayerStats(16, 16);

    // Panel superior derecho - Recursos
    this.createResourceDisplay(width - 200, 16);

    // Barra de XP (abajo)
    this.createXPBar(width / 2, height - 30);

    // Notificaciones
    this.notificationText = this.add.text(width / 2, 100, '', {
      fontSize: '24px',
      color: '#ffffff',
      backgroundColor: '#000000',
      padding: { x: 16, y: 8 }
    }).setOrigin(0.5).setVisible(false).setDepth(1000);

    // Escuchar eventos
    this.setupEvents();
  }

  /**
   * Crea el panel de stats del jugador
   */
  private createPlayerStats(x: number, y: number): void {
    const bg = this.add.rectangle(x, y, 300, 150, 0x000000, 0.7).setOrigin(0);

    // Nivel
    this.levelText = this.add.text(x + 10, y + 10, 'Nivel: 1', {
      fontSize: '20px',
      color: '#FFD700',
      fontStyle: 'bold'
    });

    // Barra de HP
    this.hpBarBg = this.add.graphics();
    this.hpBar = this.add.graphics();
    this.hpText = this.add.text(x + 10, y + 45, 'HP: 100/100', {
      fontSize: '16px',
      color: '#ffffff'
    });

    // Barra de Maná
    this.manaBarBg = this.add.graphics();
    this.manaBar = this.add.graphics();
    this.manaText = this.add.text(x + 10, y + 85, 'Maná: 100/100', {
      fontSize: '16px',
      color: '#ffffff'
    });

    // Barra de Stamina
    this.staminaBar = this.add.graphics();
    this.add.text(x + 10, y + 125, 'Stamina', {
      fontSize: '14px',
      color: '#aaaaaa'
    });
  }

  /**
   * Crea el display de recursos
   */
  private createResourceDisplay(x: number, y: number): void {
    const bg = this.add.rectangle(x, y, 180, 100, 0x000000, 0.7).setOrigin(0);

    // Oro
    this.goldText = this.add.text(x + 10, y + 10, 'Oro: 0', {
      fontSize: '18px',
      color: '#FFD700'
    });

    // Enemigos eliminados
    this.enemiesText = this.add.text(x + 10, y + 40, 'Enemigos: 0', {
      fontSize: '18px',
      color: '#ff5555'
    });

    // Mini ayuda
    this.add.text(x + 10, y + 70, 'I: Inventario | ESC: Pausa', {
      fontSize: '12px',
      color: '#888888'
    });
  }

  /**
   * Crea la barra de XP
   */
  private createXPBar(x: number, y: number): void {
    const width = 400;
    const height = 20;

    // Fondo
    this.add.rectangle(x, y, width, height, 0x000000, 0.8).setOrigin(0.5);

    // Barra de progreso
    this.xpBar = this.add.graphics();

    // Texto
    this.add.text(x, y - 25, 'EXPERIENCIA', {
      fontSize: '14px',
      color: '#ffffff'
    }).setOrigin(0.5);
  }

  /**
   * Configura eventos
   */
  private setupEvents(): void {
    const gameScene = this.scene.get('GameScene');

    gameScene.events.on('show-notification', (message: string, color: number = 0xffffff) => {
      this.showNotification(message, color);
    });
  }

  update(time: number, delta: number): void {
    this.updatePlayerStats();
    this.updateResources();
    this.updateNotification(delta);
  }

  /**
   * Actualiza stats del jugador
   */
  private updatePlayerStats(): void {
    const stats = this.registry.get('playerStats') as PlayerStats;
    if (!stats) return;

    // Nivel
    this.levelText.setText(`Nivel: ${stats.level}`);

    // HP
    const hpPercent = stats.hp / stats.maxHp;
    this.hpText.setText(`HP: ${Math.floor(stats.hp)}/${stats.maxHp}`);

    const hpBarX = 90;
    const hpBarY = 50;
    const barWidth = 180;
    const barHeight = 16;

    this.hpBarBg.clear();
    this.hpBarBg.fillStyle(0x330000, 1);
    this.hpBarBg.fillRect(hpBarX, hpBarY, barWidth, barHeight);

    this.hpBar.clear();
    const hpColor = hpPercent > 0.5 ? 0x00ff00 : hpPercent > 0.25 ? 0xffff00 : 0xff0000;
    this.hpBar.fillStyle(hpColor, 1);
    this.hpBar.fillRect(hpBarX, hpBarY, barWidth * hpPercent, barHeight);

    // Maná
    const manaPercent = stats.mana / stats.maxMana;
    this.manaText.setText(`Maná: ${Math.floor(stats.mana)}/${stats.maxMana}`);

    const manaBarY = 90;

    this.manaBarBg.clear();
    this.manaBarBg.fillStyle(0x000033, 1);
    this.manaBarBg.fillRect(hpBarX, manaBarY, barWidth, barHeight);

    this.manaBar.clear();
    this.manaBar.fillStyle(0x0099ff, 1);
    this.manaBar.fillRect(hpBarX, manaBarY, barWidth * manaPercent, barHeight);

    // Stamina
    const stamina = this.registry.get('stamina') || 1;
    const staminaBarY = 130;

    this.staminaBar.clear();
    this.staminaBar.fillStyle(0x003300, 1);
    this.staminaBar.fillRect(hpBarX, staminaBarY, barWidth, 8);
    this.staminaBar.fillStyle(0x44ff44, 1);
    this.staminaBar.fillRect(hpBarX, staminaBarY, barWidth * stamina, 8);

    // XP
    const xpPercent = stats.xp / stats.xpToNextLevel;
    const xpBarX = this.scale.width / 2 - 200;
    const xpBarY = this.scale.height - 30;

    this.xpBar.clear();
    this.xpBar.fillStyle(0x9c27b0, 1);
    this.xpBar.fillRect(xpBarX, xpBarY, 400 * xpPercent, 20);
  }

  /**
   * Actualiza recursos
   */
  private updateResources(): void {
    const gold = this.registry.get('gold') || 0;
    const enemies = this.registry.get('enemiesKilled') || 0;

    this.goldText.setText(`Oro: ${gold}`);
    this.enemiesText.setText(`Enemigos: ${enemies}`);
  }

  /**
   * Muestra una notificación
   */
  private showNotification(message: string, color: number): void {
    this.notificationText.setText(message);
    this.notificationText.setColor(`#${color.toString(16).padStart(6, '0')}`);
    this.notificationText.setVisible(true);
    this.notificationTimer = 2000; // 2 segundos

    // Animación
    this.notificationText.setAlpha(0);
    this.tweens.add({
      targets: this.notificationText,
      alpha: 1,
      y: 120,
      duration: 300,
      ease: 'back.out'
    });
  }

  /**
   * Actualiza notificación
   */
  private updateNotification(delta: number): void {
    if (this.notificationTimer > 0) {
      this.notificationTimer -= delta;

      if (this.notificationTimer <= 0) {
        this.tweens.add({
          targets: this.notificationText,
          alpha: 0,
          y: 100,
          duration: 300,
          onComplete: () => {
            this.notificationText.setVisible(false);
          }
        });
      }
    }
  }
}

export default HUDScene;
