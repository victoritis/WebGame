import Phaser from "phaser";
import BootScene from "./scenes/BootScene";
import MenuScene from "./scenes/MenuScene";
import SettingsScene from "./scenes/SettingsScene";
import GameScene from "./scenes/GameScene";
import HUDScene from "./scenes/HUDScene";
import GameOverScene from "./scenes/GameOverScene";
import PauseScene from "./scenes/PauseScene";
import InventoryScene from "./scenes/InventoryScene";
import GameConfig from "./config/GameConfig";

/**
 * Configuración principal del juego refactorizado
 */
const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: "app",
  backgroundColor: "#0b2e13",
  width: GameConfig.GAME_WIDTH,
  height: GameConfig.GAME_HEIGHT,
  pixelArt: true,
  render: {
    antialias: false,
    pixelArt: true,
    roundPixels: true
  },
  physics: {
    default: "arcade",
    arcade: {
      gravity: { y: 0 },
      debug: false // Cambiar a true para debug
    }
  },
  scene: [
    BootScene,      // Carga inicial
    MenuScene,      // Menú principal
    SettingsScene,  // Configuración
    GameScene,      // Juego principal
    HUDScene,       // HUD del juego
    PauseScene,     // Menú de pausa
    InventoryScene, // Inventario
    GameOverScene   // Game over
  ],
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH
  }
};

// Iniciar el juego
console.log("🎮 Iniciando Dungeon Crawler...");
const game = new Phaser.Game(config);

// Mensaje de bienvenida en consola
console.log(`
╔════════════════════════════════════════╗
║     DUNGEON CRAWLER - Web Game         ║
║                                        ║
║  Aventura épica en las mazmorras      ║
║  Desarrollado con Phaser 3            ║
╚════════════════════════════════════════╝
`);

export default game;
