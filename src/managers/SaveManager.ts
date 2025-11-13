import { GameSaveData, GameSettings } from '../config/Types';
import GameConfig from '../config/GameConfig';

/**
 * Gestor de guardado y carga del juego
 */
export class SaveManager {
  private static instance: SaveManager;

  private constructor() {}

  static getInstance(): SaveManager {
    if (!SaveManager.instance) {
      SaveManager.instance = new SaveManager();
    }
    return SaveManager.instance;
  }

  /**
   * Guarda el progreso del juego
   */
  saveGame(data: GameSaveData): boolean {
    try {
      const saveData = {
        ...data,
        timestamp: Date.now()
      };

      localStorage.setItem(GameConfig.SAVE_KEY, JSON.stringify(saveData));
      console.log('Juego guardado exitosamente');
      return true;
    } catch (error) {
      console.error('Error al guardar:', error);
      return false;
    }
  }

  /**
   * Carga el progreso del juego
   */
  loadGame(): GameSaveData | null {
    try {
      const saveDataStr = localStorage.getItem(GameConfig.SAVE_KEY);
      if (!saveDataStr) return null;

      const saveData = JSON.parse(saveDataStr);
      console.log('Juego cargado exitosamente');
      return saveData;
    } catch (error) {
      console.error('Error al cargar:', error);
      return null;
    }
  }

  /**
   * Verifica si existe un guardado
   */
  hasSaveData(): boolean {
    return localStorage.getItem(GameConfig.SAVE_KEY) !== null;
  }

  /**
   * Elimina el guardado
   */
  deleteSave(): boolean {
    try {
      localStorage.removeItem(GameConfig.SAVE_KEY);
      console.log('Guardado eliminado');
      return true;
    } catch (error) {
      console.error('Error al eliminar guardado:', error);
      return false;
    }
  }

  /**
   * Guarda la configuración del juego
   */
  saveSettings(settings: GameSettings): boolean {
    try {
      localStorage.setItem(GameConfig.SETTINGS_KEY, JSON.stringify(settings));
      return true;
    } catch (error) {
      console.error('Error al guardar configuración:', error);
      return false;
    }
  }

  /**
   * Carga la configuración del juego
   */
  loadSettings(): GameSettings {
    try {
      const settingsStr = localStorage.getItem(GameConfig.SETTINGS_KEY);
      if (!settingsStr) {
        return this.getDefaultSettings();
      }

      return JSON.parse(settingsStr);
    } catch (error) {
      console.error('Error al cargar configuración:', error);
      return this.getDefaultSettings();
    }
  }

  /**
   * Obtiene configuración por defecto
   */
  private getDefaultSettings(): GameSettings {
    return {
      volume: 0.7,
      musicVolume: 0.5,
      sfxVolume: 0.7,
      fullscreen: false,
      difficulty: 'normal'
    };
  }

  /**
   * Exporta el guardado como JSON
   */
  exportSave(): string | null {
    try {
      const saveData = this.loadGame();
      if (!saveData) return null;

      return JSON.stringify(saveData, null, 2);
    } catch (error) {
      console.error('Error al exportar guardado:', error);
      return null;
    }
  }

  /**
   * Importa un guardado desde JSON
   */
  importSave(jsonData: string): boolean {
    try {
      const saveData = JSON.parse(jsonData);

      // Validación básica
      if (!saveData.playerStats || !saveData.inventory) {
        throw new Error('Formato de guardado inválido');
      }

      localStorage.setItem(GameConfig.SAVE_KEY, jsonData);
      console.log('Guardado importado exitosamente');
      return true;
    } catch (error) {
      console.error('Error al importar guardado:', error);
      return false;
    }
  }

  /**
   * Obtiene información del guardado sin cargarlo completamente
   */
  getSaveInfo(): { level: number; playTime: number; timestamp: number } | null {
    try {
      const saveDataStr = localStorage.getItem(GameConfig.SAVE_KEY);
      if (!saveDataStr) return null;

      const saveData = JSON.parse(saveDataStr);
      return {
        level: saveData.playerStats.level,
        playTime: saveData.playTime,
        timestamp: saveData.timestamp
      };
    } catch (error) {
      console.error('Error al obtener info de guardado:', error);
      return null;
    }
  }

  /**
   * Crea un auto-guardado
   */
  autoSave(data: GameSaveData): void {
    const AUTO_SAVE_KEY = `${GameConfig.SAVE_KEY}_auto`;

    try {
      localStorage.setItem(AUTO_SAVE_KEY, JSON.stringify({
        ...data,
        timestamp: Date.now()
      }));
    } catch (error) {
      console.error('Error en auto-guardado:', error);
    }
  }

  /**
   * Recupera el auto-guardado
   */
  loadAutoSave(): GameSaveData | null {
    const AUTO_SAVE_KEY = `${GameConfig.SAVE_KEY}_auto`;

    try {
      const autoSaveStr = localStorage.getItem(AUTO_SAVE_KEY);
      if (!autoSaveStr) return null;

      return JSON.parse(autoSaveStr);
    } catch (error) {
      console.error('Error al cargar auto-guardado:', error);
      return null;
    }
  }
}

export default SaveManager;
