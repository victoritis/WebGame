import Phaser from "phaser";

// BootScene simplificada: carga sprites existentes dentro de /public/items.
export default class BootScene extends Phaser.Scene {
  constructor() { super("BootScene"); }

  preload() {
    const base = "/items"; // Vite expone /public
    // Texturas mínimas que usaremos en WorldScene
    this.load.image("floor_plain", `${base}/floor_plain.png`);
    this.load.image("hero_basic", `${base}/hero_basic.png`);
    this.load.image("box", `${base}/box.png`);
    this.load.image("column", `${base}/column.png`);
    this.load.image("chest_golden_closed", `${base}/chest_golden_closed.png`); // usaremos como "moneda"
  this.load.image("monster_bat", `${base}/monster_bat.png`); // peligro

  // Audio embebido (beep simple y sonidos básicos). Base64 wav muy pequeños
  this.load.audio("s_pickup", ["data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AACJWAAACABAAZGF0YQgAAAAA/////wAAAP///wAAAA=="]); // click/beep corto
  this.load.audio("s_hurt", ["data:audio/wav;base64,UklGRjQAAABXQVZFZm10IBAAAAABAAEAQB8AACJWAAACABAAZGF0YQwAAAAA/////wD/AP//AAD//wAA//8="]); // ruido corto
  this.load.audio("s_gameover", ["data:audio/wav;base64,UklGRhQAAABXQVZFZm10IBAAAAABAAEAQB8AACJWAAACABAAZGF0YQ4AAAAA//8AAP//AAD//wAA//8AAP8="]); // tono corto
  }

  create() {
    try {
      console.info("[BootScene] create start");
      // Fallbacks por si falta algún PNG (solo se generan los que no existan)
      this.ensureFallbacks();
      if (this.registry.get("score") == null) this.registry.set("score", 0);
      this.registry.set("finalStats", null);
      if (this.registry.get("highScore") == null) {
        try {
          const stored = localStorage.getItem("highScore");
          if (stored) this.registry.set("highScore", parseInt(stored));
          else this.registry.set("highScore", 0);
        } catch { this.registry.set("highScore", 0); }
      }
      if (this.registry.get("lives") == null) this.registry.set("lives", 3);
      // Volumen global
      if (this.registry.get("volume") == null) {
        try { const v = localStorage.getItem("volume"); this.registry.set("volume", v ? parseFloat(v) : 1); } catch { this.registry.set("volume", 1); }
      }

  // Recursos auxiliares (minimapa y niebla)
  this.generateMiniDots();
  this.generateFogBrush();
      console.info("[BootScene] starting World + UI scenes");
      this.scene.start("WorldScene");
      this.scene.launch("UIScene");
    } catch (err) {
      console.error("[BootScene] error during create", err);
      // Intento mínimo de continuar para evitar pantalla vacía
      if (!this.scene.isActive("WorldScene")) this.scene.start("WorldScene");
      if (!this.scene.isActive("UIScene")) this.scene.launch("UIScene");
    }
  }

  private ensureFallbacks() {
    const g = this.make.graphics({ x: 0, y: 0, add: false });
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
      const g = this.make.graphics({ add: false });
      g.fillStyle(color, 1).fillCircle(4, 4, 4);
      g.generateTexture(key, 8, 8);
      g.destroy();
    };
    makeDot("dot_player", 0x66ff66);
    makeDot("dot_hazard", 0xff5252);
    makeDot("dot_coin", 0xffeb3b);
    makeDot("dot_power", 0x40c4ff);
    if (!this.textures.exists("heart")) {
      const g = this.make.graphics({ add: false });
      g.fillStyle(0xff5252, 1);
      const w = 20, h = 18;
      g.beginPath();
      g.moveTo(w / 2, h);
      g.bezierCurveTo(-4, h - 8, 2, 2, w / 2 - 2, h / 3);
      g.bezierCurveTo(w / 2, -2, w - 2, 2, w + 4, h - 8);
      g.closePath();
      g.fillPath();
      g.generateTexture("heart", w + 4, h + 2);
      g.destroy();
    }
  }

  private createHeroAnimations() {
  // Animaciones direccionales eliminadas para simplificar (no necesarias con sprite estático)
  }

  private generateFogBrush() {
    if (this.textures.exists("fog_brush")) return;
    const g = this.make.graphics({ add: false });
    const r = 30;
    const gradientSteps = 12;
    for (let i = gradientSteps; i >= 1; i--) {
      const alpha = i / gradientSteps;
      g.fillStyle(0xffffff, alpha * 0.12).fillCircle(r, r, (i / gradientSteps) * r);
    }
    g.generateTexture("fog_brush", r * 2, r * 2);
    g.destroy();
  }
}
