import Phaser from 'phaser';
import SaveManager from '../managers/SaveManager';

/**
 * Escena de Game Over mejorada
 */
export class GameOverScene extends Phaser.Scene {
  private stats: any;
  private saveManager: SaveManager;

  constructor() {
    super('GameOverScene');
    this.saveManager = SaveManager.getInstance();
  }

  init(data: any): void {
    this.stats = data.stats || {};
  }

  create(): void {
    const { width, height } = this.scale;

    // Fondo oscuro
    this.cameras.main.setBackgroundColor(0x000000);

    // Título
    const title = this.add.text(width / 2, 100, 'GAME OVER', {
      fontSize: '72px',
      color: '#ff0000',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    // Animación del título
    this.tweens.add({
      targets: title,
      scale: 1.1,
      duration: 1000,
      yoyo: true,
      repeat: -1,
      ease: 'sine.inOut'
    });

    // Estadísticas
    const statsY = 220;
    const statsText = [
      `Nivel Alcanzado: ${this.stats.level || 1}`,
      `Oro Recolectado: ${this.stats.gold || 0}`,
      `Enemigos Derrotados: ${this.stats.enemiesKilled || 0}`,
      `Tiempo Jugado: ${this.formatTime(this.stats.playTime || 0)}`
    ];

    statsText.forEach((text, index) => {
      this.add.text(width / 2, statsY + index * 40, text, {
        fontSize: '24px',
        color: '#ffffff'
      }).setOrigin(0.5);
    });

    // Puntuación total
    const score = this.calculateScore();
    this.add.text(width / 2, statsY + 180, `Puntuación Total: ${score}`, {
      fontSize: '32px',
      color: '#FFD700',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    // High score
    this.checkAndDisplayHighScore(score, width / 2, statsY + 230);

    // Botones
    const buttonY = height - 150;
    this.createButton(width / 2 - 120, buttonY, 'Reintentar', () => {
      this.restartGame();
    });

    this.createButton(width / 2 + 120, buttonY, 'Menú', () => {
      this.goToMenu();
    });

    // Instrucciones
    this.add.text(width / 2, height - 50, 'Presiona ENTER para reintentar o ESC para volver al menú', {
      fontSize: '14px',
      color: '#888888'
    }).setOrigin(0.5);

    // Controles
    const enterKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);
    const escKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);

    enterKey.on('down', () => this.restartGame());
    escKey.on('down', () => this.goToMenu());

    // Efecto de partículas
    this.createParticleEffect();
  }

  /**
   * Crea un botón
   */
  private createButton(x: number, y: number, text: string, callback: () => void): void {
    const button = this.add.text(x, y, text, {
      fontSize: '28px',
      color: '#ffffff',
      backgroundColor: '#333333',
      padding: { x: 20, y: 10 }
    }).setOrigin(0.5);

    button.setInteractive({ useHandCursor: true });

    button.on('pointerover', () => {
      button.setColor('#FFD700');
      button.setScale(1.1);
    });

    button.on('pointerout', () => {
      button.setColor('#ffffff');
      button.setScale(1);
    });

    button.on('pointerdown', callback);
  }

  /**
   * Calcula la puntuación total
   */
  private calculateScore(): number {
    return (
      (this.stats.level || 1) * 100 +
      (this.stats.gold || 0) * 2 +
      (this.stats.enemiesKilled || 0) * 10 +
      Math.floor((this.stats.playTime || 0) / 1000)
    );
  }

  /**
   * Verifica y muestra el high score
   */
  private checkAndDisplayHighScore(score: number, x: number, y: number): void {
    try {
      const highScore = parseInt(localStorage.getItem('highScore') || '0');

      if (score > highScore) {
        localStorage.setItem('highScore', score.toString());
        this.add.text(x, y, '¡NUEVO RÉCORD!', {
          fontSize: '24px',
          color: '#00ff00',
          fontStyle: 'bold'
        }).setOrigin(0.5);
      } else {
        this.add.text(x, y, `Récord: ${highScore}`, {
          fontSize: '20px',
          color: '#cccccc'
        }).setOrigin(0.5);
      }
    } catch (error) {
      console.error('Error al acceder a localStorage:', error);
    }
  }

  /**
   * Formatea el tiempo
   */
  private formatTime(ms: number): string {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) {
      return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  }

  /**
   * Reinicia el juego
   */
  private restartGame(): void {
    this.cameras.main.fadeOut(500);
    this.time.delayedCall(500, () => {
      this.scene.start('GameScene');
    });
  }

  /**
   * Vuelve al menú
   */
  private goToMenu(): void {
    this.cameras.main.fadeOut(500);
    this.time.delayedCall(500, () => {
      this.scene.start('MenuScene');
    });
  }

  /**
   * Crea efecto de partículas
   */
  private createParticleEffect(): void {
    const { width, height } = this.scale;

    for (let i = 0; i < 30; i++) {
      const x = Phaser.Math.Between(0, width);
      const y = Phaser.Math.Between(0, height);
      const particle = this.add.circle(x, y, 3, 0xff0000, 0.3);

      this.tweens.add({
        targets: particle,
        y: y + Phaser.Math.Between(50, 150),
        alpha: 0,
        duration: Phaser.Math.Between(2000, 4000),
        repeat: -1,
        delay: Phaser.Math.Between(0, 2000)
      });
    }
  }
}

export default GameOverScene;
