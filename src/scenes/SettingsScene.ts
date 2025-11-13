import Phaser from 'phaser';
import SaveManager from '../managers/SaveManager';
import { GameSettings } from '../config/Types';

/**
 * Escena de configuración
 */
export class SettingsScene extends Phaser.Scene {
  private settings: GameSettings;
  private saveManager: SaveManager;

  constructor() {
    super('SettingsScene');
    this.saveManager = SaveManager.getInstance();
    this.settings = this.saveManager.loadSettings();
  }

  create(): void {
    const { width, height } = this.scale;

    // Overlay oscuro
    this.add.rectangle(0, 0, width, height, 0x000000, 0.9).setOrigin(0);

    // Título
    this.add.text(width / 2, 100, 'CONFIGURACIÓN', {
      fontSize: '48px',
      color: '#FFD700'
    }).setOrigin(0.5);

    const startY = 200;
    const spacing = 80;

    // Volumen General
    this.createSlider('Volumen General', this.settings.volume, startY, (value) => {
      this.settings.volume = value;
      this.saveSettings();
    });

    // Volumen Música
    this.createSlider('Volumen Música', this.settings.musicVolume, startY + spacing, (value) => {
      this.settings.musicVolume = value;
      this.saveSettings();
    });

    // Volumen SFX
    this.createSlider('Volumen SFX', this.settings.sfxVolume, startY + spacing * 2, (value) => {
      this.settings.sfxVolume = value;
      this.saveSettings();
    });

    // Dificultad
    const difficultyY = startY + spacing * 3;
    this.add.text(width / 2 - 200, difficultyY, 'Dificultad:', {
      fontSize: '24px',
      color: '#ffffff'
    });

    const difficulties: Array<'easy' | 'normal' | 'hard'> = ['easy', 'normal', 'hard'];
    const difficultyLabels = ['Fácil', 'Normal', 'Difícil'];

    difficulties.forEach((diff, index) => {
      const btn = this.add.text(
        width / 2 - 50 + index * 100,
        difficultyY,
        difficultyLabels[index],
        {
          fontSize: '20px',
          color: this.settings.difficulty === diff ? '#FFD700' : '#888888'
        }
      ).setOrigin(0.5);

      btn.setInteractive({ useHandCursor: true });
      btn.on('pointerdown', () => {
        this.settings.difficulty = diff;
        this.saveSettings();
        this.scene.restart();
      });
    });

    // Botón volver
    const backBtn = this.add.text(width / 2, height - 100, 'VOLVER', {
      fontSize: '32px',
      color: '#ffffff'
    }).setOrigin(0.5);

    backBtn.setInteractive({ useHandCursor: true });
    backBtn.on('pointerover', () => backBtn.setColor('#FFD700'));
    backBtn.on('pointerout', () => backBtn.setColor('#ffffff'));
    backBtn.on('pointerdown', () => this.goBack());

    // ESC para volver
    this.input.keyboard!.on('keydown-ESC', () => this.goBack());
  }

  /**
   * Crea un slider de volumen
   */
  private createSlider(label: string, value: number, y: number, onChange: (value: number) => void): void {
    const { width } = this.scale;

    this.add.text(width / 2 - 200, y, label, {
      fontSize: '24px',
      color: '#ffffff'
    });

    const sliderX = width / 2 + 50;
    const sliderWidth = 200;

    // Fondo del slider
    const sliderBg = this.add.rectangle(sliderX, y, sliderWidth, 10, 0x444444).setOrigin(0, 0.5);

    // Barra de progreso
    const sliderBar = this.add.rectangle(sliderX, y, sliderWidth * value, 10, 0xFFD700).setOrigin(0, 0.5);

    // Handle
    const handle = this.add.circle(sliderX + sliderWidth * value, y, 15, 0xffffff);
    handle.setInteractive({ useHandCursor: true, draggable: true });

    // Texto del valor
    const valueText = this.add.text(sliderX + sliderWidth + 30, y, `${Math.round(value * 100)}%`, {
      fontSize: '20px',
      color: '#ffffff'
    }).setOrigin(0, 0.5);

    // Drag handler
    this.input.on('drag', (pointer: any, gameObject: any, dragX: number) => {
      if (gameObject !== handle) return;

      const newX = Phaser.Math.Clamp(dragX, sliderX, sliderX + sliderWidth);
      handle.setPosition(newX, y);

      const newValue = (newX - sliderX) / sliderWidth;
      sliderBar.setDisplaySize(sliderWidth * newValue, 10);
      valueText.setText(`${Math.round(newValue * 100)}%`);

      onChange(newValue);
    });
  }

  /**
   * Guarda configuración
   */
  private saveSettings(): void {
    this.saveManager.saveSettings(this.settings);
    this.registry.set('settings', this.settings);
  }

  /**
   * Vuelve al menú anterior
   */
  private goBack(): void {
    this.scene.stop();
    this.scene.resume('MenuScene');
  }
}

export default SettingsScene;
