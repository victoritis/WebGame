import Phaser from "phaser";

// BootScene mejorada: carga y genera todos los assets necesarios
export default class BootScene extends Phaser.Scene {
  constructor() { super("BootScene"); }

  preload() {
    // Mostrar barra de carga
    this.createLoadingScreen();

    const base = "/items"; // Vite expone /public

    // Texturas básicas
    this.load.image("floor_plain", `${base}/floor_plain.png`);
    this.load.image("hero_basic", `${base}/hero_basic.png`);
    this.load.image("box", `${base}/box.png`);
    this.load.image("column", `${base}/column.png`);
    this.load.image("chest_golden_closed", `${base}/chest_golden_closed.png`);
    this.load.image("monster_bat", `${base}/monster_bat.png`);

    // Items y pociones
    this.load.image("flask_red", `${base}/flask_red.png`);
    this.load.image("flask_blue", `${base}/flask_blue.png`);
    this.load.image("flask_yellow", `${base}/flask_yellow.png`);
    this.load.image("flask_green", `${base}/flask_green.png`);

    // Bordes del mundo
    this.load.image("edge_n", `${base}/Edge_n.png`);
    this.load.image("edge_s", `${base}/Edge_s.png`);
    this.load.image("edge_e", `${base}/Edge_e.png`);
    this.load.image("edge_w", `${base}/Edge_w.png`);
    this.load.image("edge_ne", `${base}/Edge_ne.png`);
    this.load.image("edge_nw", `${base}/Edge_nw.png`);
    this.load.image("edge_se", `${base}/Edge_se.png`);
    this.load.image("edge_sw", `${base}/Edge_sw.png`);
    this.load.image("torch_1", `${base}/torch_1.png`);

    // Audio embebido
    this.load.audio("s_pickup", ["data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AACJWAAACABAAZGF0YQgAAAAA/////wAAAP///wAAAA=="]);
    this.load.audio("s_hurt", ["data:audio/wav;base64,UklGRjQAAABXQVZFZm10IBAAAAABAAEAQB8AACJWAAACABAAZGF0YQwAAAAA/////wD/AP//AAD//wAA//8="]);
    this.load.audio("s_gameover", ["data:audio/wav;base64,UklGRhQAAABXQVZFZm10IBAAAAABAAEAQB8AACJWAAACABAAZGF0YQ4AAAAA//8AAP//AAD//wAA//8AAP8="]);
  }

  /**
   * Crea pantalla de carga
   */
  private createLoadingScreen(): void {
    const { width, height } = this.scale;

    // Fondo
    this.add.rectangle(0, 0, width, height, 0x0b2e13).setOrigin(0);

    // Título
    this.add.text(width / 2, height / 2 - 100, 'DUNGEON CRAWLER', {
      fontSize: '48px',
      color: '#FFD700',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    this.add.text(width / 2, height / 2 - 50, 'Cargando...', {
      fontSize: '24px',
      color: '#ffffff'
    }).setOrigin(0.5);

    // Barra de progreso
    const barWidth = 400;
    const barHeight = 30;
    const barX = width / 2 - barWidth / 2;
    const barY = height / 2;

    const progressBg = this.add.rectangle(barX, barY, barWidth, barHeight, 0x222222).setOrigin(0);
    const progressBar = this.add.rectangle(barX, barY, 0, barHeight, 0xFFD700).setOrigin(0);

    this.load.on('progress', (value: number) => {
      progressBar.width = barWidth * value;
    });
  }

  create() {
    try {
      console.info("[BootScene] Inicializando juego...");

      // Generar fallbacks para texturas faltantes
      this.ensureFallbacks();

      // Generar assets procedurales
      this.generateMiniDots();
      this.generatePlayerArrow();
      this.generateFogBrush();
      this.generateEnemySprites();

      // Inicializar registro global
      this.initRegistry();

      console.info("[BootScene] Iniciando MenuScene");

      // Fade out y luego iniciar el menú
      this.cameras.main.fadeOut(500);
      this.time.delayedCall(500, () => {
        this.scene.start("MenuScene");
      });
    } catch (err) {
      console.error("[BootScene] Error durante inicialización", err);
      // Fallback directo al menú
      this.scene.start("MenuScene");
    }
  }

  /**
   * Inicializa el registro global
   */
  private initRegistry(): void {
    if (this.registry.get("highScore") == null) {
      try {
        const stored = localStorage.getItem("highScore");
        this.registry.set("highScore", stored ? parseInt(stored) : 0);
      } catch {
        this.registry.set("highScore", 0);
      }
    }
  }

  private ensureFallbacks() {
    const g = this.make.graphics({ x: 0, y: 0 });
    if (!this.textures.exists("floor_plain")) {
      const s = 64;
      g.fillStyle(0x2e7d32, 1).fillRect(0, 0, s, s);
      g.generateTexture("floor_plain", s, s); g.clear();
    }
    if (!this.textures.exists("hero_basic")) {
      // Dibujar un pequeño personaje pixel (cabeza + torso + piernas) para evitar apariencia de flecha
      const w = 24, h = 32;
      // Torso
      g.fillStyle(0x1976d2, 1).fillRect(6, 10, 12, 14);
      // Cabeza
      g.fillStyle(0xffe0b2, 1).fillRect(7, 3, 10, 8);
      // Ojos
      g.fillStyle(0x000000, 1).fillRect(9, 6, 2, 2).fillRect(13, 6, 2, 2);
      // Piernas
      g.fillStyle(0x424242, 1).fillRect(7, 24, 4, 6).fillRect(13, 24, 4, 6);
      // Brazos
      g.fillStyle(0x1565c0, 1).fillRect(2, 12, 4, 10).fillRect(18, 12, 4, 10);
      g.generateTexture("hero_basic", w, h); g.clear();
    }
    if (!this.textures.exists("box")) {
      const bs = 32;
      g.fillStyle(0x795548, 1).fillRect(0, 0, bs, bs);
      g.lineStyle(2, 0x5d4037, 1).strokeRect(1, 1, bs - 2, bs - 2);
      g.generateTexture("box", bs, bs); g.clear();
    }
    if (!this.textures.exists("column")) {
      const cw = 24, ch = 48;
      g.fillStyle(0xb0bec5, 1).fillRect(0, 0, cw, ch);
      g.lineStyle(2, 0x90a4ae, 1).strokeRect(1, 1, cw - 2, ch - 2);
      g.generateTexture("column", cw, ch); g.clear();
    }
    if (!this.textures.exists("chest_golden_closed")) {
      const cs = 24;
      g.fillStyle(0xfbc02d, 1).fillRect(0, 0, cs, cs);
      g.lineStyle(2, 0x8d6e63, 1).strokeRect(2, 2, cs - 4, cs - 4);
      g.generateTexture("chest_golden_closed", cs, cs); g.clear();
    }
    g.destroy();
  }

  private generateMiniDots() {
    const makeDot = (key: string, color: number) => {
      if (this.textures.exists(key)) return;
      const g = this.make.graphics({ x: 0, y: 0 });
      g.fillStyle(0x000000, 0.25).fillCircle(4, 4, 5);
      g.fillStyle(color, 1).fillCircle(4, 4, 3);
      g.generateTexture(key, 8, 8);
      g.destroy();
    };
    makeDot("dot_player", 0x90caf9);
    makeDot("dot_coin", 0xfff176);
    makeDot("dot_hazard", 0xef5350);
    makeDot("dot_power", 0x80cbc4);
  }

  /** Icono flecha del jugador para el minimapa */
  private generatePlayerArrow() {
    if (this.textures.exists("arrow_player")) return;
    const g = this.make.graphics({ x: 0, y: 0 });
    g.fillStyle(0x000000, 0.35);
    g.fillTriangle(9, 0, 0, 16, 18, 16);
    g.fillStyle(0xffffff, 1);
    g.fillTriangle(8, 1, 2, 15, 14, 15);
    g.generateTexture("arrow_player", 18, 16);
    g.destroy();
  }

  private generateFogBrush() {
    if (this.textures.exists("fog_brush")) return;
    const g = this.make.graphics({ x: 0, y: 0 });
    const r = 30;
    const gradientSteps = 12;
    for (let i = gradientSteps; i >= 1; i--) {
      const alpha = i / gradientSteps;
      g.fillStyle(0xffffff, alpha * 0.12).fillCircle(r, r, (i / gradientSteps) * r);
    }
    g.generateTexture("fog_brush", r * 2, r * 2);
    g.destroy();
  }

  /**
   * Genera sprites de enemigos si no existen
   */
  private generateEnemySprites(): void {
    const g = this.make.graphics({ x: 0, y: 0 });

    // Slime
    if (!this.textures.exists("monster_slime")) {
      g.clear();
      g.fillStyle(0x00ff00, 1);
      g.fillCircle(16, 20, 12);
      g.fillCircle(10, 18, 4);
      g.fillCircle(22, 18, 4);
      g.fillStyle(0x000000, 1);
      g.fillCircle(12, 16, 2);
      g.fillCircle(20, 16, 2);
      g.generateTexture("monster_slime", 32, 32);
    }

    // Skeleton
    if (!this.textures.exists("monster_skeleton")) {
      g.clear();
      g.fillStyle(0xeeeeee, 1);
      // Cráneo
      g.fillRect(8, 4, 16, 14);
      // Cuerpo
      g.fillRect(10, 18, 12, 10);
      // Ojos
      g.fillStyle(0x000000, 1);
      g.fillRect(12, 8, 3, 4);
      g.fillRect(17, 8, 3, 4);
      g.generateTexture("monster_skeleton", 32, 32);
    }

    // Goblin
    if (!this.textures.exists("monster_goblin")) {
      g.clear();
      g.fillStyle(0x88aa44, 1);
      // Cabeza
      g.fillRect(6, 4, 20, 16);
      // Orejas
      g.fillTriangle(4, 10, 6, 6, 6, 14);
      g.fillTriangle(28, 10, 26, 6, 26, 14);
      // Cuerpo
      g.fillRect(8, 20, 16, 10);
      // Ojos
      g.fillStyle(0xffff00, 1);
      g.fillCircle(12, 12, 3);
      g.fillCircle(20, 12, 3);
      g.generateTexture("monster_goblin", 32, 32);
    }

    // Boss
    if (!this.textures.exists("monster_boss")) {
      g.clear();
      g.fillStyle(0x8b0000, 1);
      // Cuerpo grande
      g.fillRect(0, 8, 48, 36);
      // Cabeza
      g.fillRect(10, 0, 28, 16);
      // Cuernos
      g.fillTriangle(8, 4, 12, 0, 12, 8);
      g.fillTriangle(40, 4, 36, 0, 36, 8);
      // Ojos brillantes
      g.fillStyle(0xff0000, 1);
      g.fillCircle(18, 8, 4);
      g.fillCircle(30, 8, 4);
      g.generateTexture("monster_boss", 48, 48);
    }

    g.destroy();
  }
}
