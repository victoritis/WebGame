import Phaser from 'phaser';
import PlayerCharacter from '../entities/PlayerCharacter';
import Enemy from '../entities/Enemy';
import { EnemyType } from '../config/Types';
import GameConfig from '../config/GameConfig';
import CombatSystem from '../systems/CombatSystem';
import SaveManager from '../managers/SaveManager';
import ItemDatabase from '../data/ItemDatabase';

/**
 * Escena principal del juego refactorizada
 */
export class GameScene extends Phaser.Scene {
  // Mundo
  private worldW: number = GameConfig.WORLD_WIDTH;
  private worldH: number = GameConfig.WORLD_HEIGHT;

  // Entidades
  public player!: PlayerCharacter;
  private enemies!: Phaser.GameObjects.Group;
  private items!: Phaser.Physics.Arcade.StaticGroup;
  private obstacles!: Phaser.Physics.Arcade.StaticGroup;
  private decorations!: Phaser.GameObjects.Group;

  // Sistemas
  private combatSystem!: CombatSystem;
  private saveManager: SaveManager;

  // Cámaras
  private mainCam!: Phaser.Cameras.Scene2D.Camera;
  private minimapCam!: Phaser.Cameras.Scene2D.Camera;

  // Estado del juego
  private gameTime: number = 0;
  private enemySpawnTimer: number = 0;
  private difficulty: number = 1;
  private isPaused: boolean = false;

  // Controles
  private keys: any;

  constructor() {
    super('GameScene');
    this.saveManager = SaveManager.getInstance();
  }

  init(data: any): void {
    // Verificar si se debe cargar partida guardada
    if (data?.loadSave) {
      this.loadGameData();
    }
  }

  create(): void {
    console.log('[GameScene] Iniciando...');

    // Configurar mundo
    this.physics.world.setBounds(0, 0, this.worldW, this.worldH);

    // Registrar datos iniciales
    this.registry.set('score', 0);
    this.registry.set('gold', 0);
    this.registry.set('enemiesKilled', 0);

    // Crear fondo
    this.createBackground();

    // Crear grupos
    this.obstacles = this.physics.add.staticGroup();
    this.items = this.physics.add.staticGroup();
    this.enemies = this.add.group({
      runChildUpdate: true
    });
    this.decorations = this.add.group();

    // Crear borde del mundo
    this.createWorldBorders();

    // Generar obstáculos y items iniciales
    this.spawnObstacles(40);
    this.spawnItems(20);

    // Añadir decoraciones al mapa
    this.spawnDecorations();
    this.addFloorDetails();

    // Crear jugador
    this.createPlayer();

    // Inicializar sistemas
    this.combatSystem = new CombatSystem(this);

    // Configurar colisiones
    this.setupCollisions();

    // Configurar cámaras
    this.setupCameras();

    // Configurar controles
    this.setupControls();

    // Iniciar HUD
    this.scene.launch('HUDScene');

    // Configurar eventos
    this.setupEvents();

    // Auto-guardado cada 30 segundos
    this.time.addEvent({
      delay: 30000,
      loop: true,
      callback: () => this.autoSave()
    });

    console.log('[GameScene] Iniciado correctamente');
  }

  /**
   * Crea el fondo del mundo
   */
  private createBackground(): void {
    // Suelo base
    const floor = this.add.tileSprite(0, 0, this.worldW, this.worldH, 'floor_plain')
      .setOrigin(0)
      .setDepth(0);
  }

  /**
   * Crea bordes del mundo
   */
  private createWorldBorders(): void {
    const tileSize = GameConfig.TILE_SIZE;
    const maxX = this.worldW - tileSize;
    const maxY = this.worldH - tileSize;

    // Bordes horizontales
    for (let x = 0; x <= maxX; x += tileSize) {
      if (this.textures.exists('edge_n')) {
        this.obstacles.create(x, 0, 'edge_n').setOrigin(0).refreshBody();
        this.obstacles.create(x, maxY, 'edge_s').setOrigin(0).refreshBody();
      }
    }

    // Bordes verticales
    for (let y = tileSize; y < maxY; y += tileSize) {
      if (this.textures.exists('edge_w')) {
        this.obstacles.create(0, y, 'edge_w').setOrigin(0).refreshBody();
        this.obstacles.create(maxX, y, 'edge_e').setOrigin(0).refreshBody();
      }
    }

    // Esquinas
    if (this.textures.exists('edge_nw')) {
      this.obstacles.create(0, 0, 'edge_nw').setOrigin(0).refreshBody();
      this.obstacles.create(maxX, 0, 'edge_ne').setOrigin(0).refreshBody();
      this.obstacles.create(0, maxY, 'edge_sw').setOrigin(0).refreshBody();
      this.obstacles.create(maxX, maxY, 'edge_se').setOrigin(0).refreshBody();
    }
  }

  /**
   * Genera obstáculos aleatorios
   */
  private spawnObstacles(count: number): void {
    const spawnPoints = this.generateSpawnPoints(count, 150, 300);

    spawnPoints.forEach(point => {
      const type = Phaser.Math.Between(0, 2);
      let texture = 'box';

      if (type === 0 && this.textures.exists('column')) {
        texture = 'column';
      } else if (type === 1 && this.textures.exists('box')) {
        texture = 'box';
      }

      const obstacle = this.obstacles.create(point.x, point.y, texture);
      obstacle.setOrigin(0.5, 1);
      obstacle.refreshBody();

      if (obstacle.body) {
        obstacle.body.setSize(
          obstacle.width * 0.6,
          obstacle.height * 0.4
        );
      }
    });
  }

  /**
   * Genera items aleatorios
   */
  private spawnItems(count: number): void {
    const spawnPoints = this.generateSpawnPoints(count, 100, 300);

    spawnPoints.forEach(point => {
      const roll = Math.random();
      let itemId = 'gold_coin';

      if (roll < 0.4) {
        itemId = 'gold_coin';
      } else if (roll < 0.6) {
        itemId = 'health_potion';
      } else if (roll < 0.75) {
        itemId = 'mana_potion';
      } else if (roll < 0.85) {
        itemId = 'speed_potion';
      } else {
        itemId = 'strength_potion';
      }

      const itemData = ItemDatabase[itemId];
      if (!itemData) return;

      const texture = this.textures.exists(itemData.icon) ? itemData.icon : 'chest_golden_closed';
      const item = this.items.create(point.x, point.y, texture);
      item.setOrigin(0.5, 1);
      item.setData('itemId', itemId);
      item.refreshBody();

      // Animación flotante
      this.tweens.add({
        targets: item,
        y: item.y - 5,
        duration: 1000,
        yoyo: true,
        repeat: -1,
        ease: 'sine.inOut'
      });
    });
  }

  /**
   * Genera puntos de spawn aleatorios sin superposición
   */
  private generateSpawnPoints(count: number, minSpacing: number, minDistFromCenter: number): Phaser.Math.Vector2[] {
    const points: Phaser.Math.Vector2[] = [];
    const centerX = this.worldW / 2;
    const centerY = this.worldH / 2;
    const maxAttempts = 100;

    for (let i = 0; i < count; i++) {
      let attempts = 0;
      let point: Phaser.Math.Vector2;

      do {
        point = new Phaser.Math.Vector2(
          Phaser.Math.Between(100, this.worldW - 100),
          Phaser.Math.Between(100, this.worldH - 100)
        );
        attempts++;
      } while (
        attempts < maxAttempts &&
        (Phaser.Math.Distance.Between(point.x, point.y, centerX, centerY) < minDistFromCenter ||
          points.some(p => Phaser.Math.Distance.Between(point.x, point.y, p.x, p.y) < minSpacing))
      );

      if (attempts < maxAttempts) {
        points.push(point);
      }
    }

    return points;
  }

  /**
   * Crea al jugador
   */
  private createPlayer(): void {
    const spawnX = this.worldW / 2;
    const spawnY = this.worldH / 2;

    this.player = new PlayerCharacter(this, spawnX, spawnY);
    this.add.existing(this.player);
    this.physics.add.existing(this.player);
    this.player.setCollideWorldBounds(true);
  }

  /**
   * Configura colisiones
   */
  private setupCollisions(): void {
    // Jugador con obstáculos
    this.physics.add.collider(this.player, this.obstacles);

    // Jugador con items
    this.physics.add.overlap(this.player, this.items, this.collectItem, undefined, this);

    // Enemigos con obstáculos
    this.physics.add.collider(this.enemies, this.obstacles);

    // Enemigos entre sí
    this.physics.add.collider(this.enemies, this.enemies);
  }

  /**
   * Configura cámaras
   */
  private setupCameras(): void {
    // Cámara principal
    this.mainCam = this.cameras.main;
    this.mainCam.startFollow(this.player, true, 0.1, 0.1);
    this.mainCam.setBounds(0, 0, this.worldW, this.worldH);
    this.mainCam.setZoom(2);
    this.mainCam.setRoundPixels(true);

    // Minimapa (opcional, simplificado)
    const mmSize = 200;
    const mmPad = 16;
    this.minimapCam = this.cameras.add(
      this.scale.width - mmSize - mmPad,
      mmPad,
      mmSize,
      mmSize
    );
    this.minimapCam.setZoom(mmSize / this.worldW);
    this.minimapCam.setBackgroundColor(0x000000);
    this.minimapCam.setBounds(0, 0, this.worldW, this.worldH);
    this.minimapCam.scrollX = 0;
    this.minimapCam.scrollY = 0;
  }

  /**
   * Configura controles
   */
  private setupControls(): void {
    this.keys = {
      pause: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.ESC),
      inventory: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.I),
      save: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.F5)
    };

    // Pausa
    this.keys.pause.on('down', () => {
      this.togglePause();
    });

    // Inventario
    this.keys.inventory.on('down', () => {
      this.toggleInventory();
    });

    // Guardar
    this.keys.save.on('down', () => {
      this.saveGame();
    });
  }

  /**
   * Configura eventos
   */
  private setupEvents(): void {
    // Ataque del jugador
    this.events.on('player-attack', (data: any) => {
      this.handlePlayerAttack(data);
    });

    // Ataque enemigo
    this.events.on('enemy-attack', (enemy: Enemy) => {
      this.handleEnemyAttack(enemy);
    });

    // Muerte de enemigo
    this.events.on('enemy-death', (enemy: Enemy) => {
      this.handleEnemyDeath(enemy);
    });

    // Muerte del jugador
    this.events.on('player-death', () => {
      this.handlePlayerDeath();
    });

    // Subida de nivel
    this.events.on('player-levelup', (level: number) => {
      this.handleLevelUp(level);
    });
  }

  /**
   * Update principal
   */
  update(time: number, delta: number): void {
    if (this.isPaused || !this.player || !this.player.active) return;

    // Actualizar jugador
    this.player.update(time, delta);

    // Actualizar tiempo de juego
    this.gameTime += delta;

    // Spawn de enemigos
    this.enemySpawnTimer += delta;
    if (this.enemySpawnTimer >= GameConfig.ENEMY_SPAWN_RATE) {
      this.spawnEnemy();
      this.enemySpawnTimer = 0;
    }

    // Aumentar dificultad progresivamente
    const newDifficulty = Math.floor(this.gameTime / GameConfig.DIFFICULTY_INCREASE_TIME) + 1;
    if (newDifficulty > this.difficulty) {
      this.difficulty = newDifficulty;
      this.events.emit('difficulty-increased', this.difficulty);
    }

    // Limitar número de enemigos
    if (this.enemies.getLength() > GameConfig.MAX_ENEMIES) {
      const enemiesArray = this.enemies.getChildren() as Enemy[];
      enemiesArray.sort((a, b) => {
        const distA = Phaser.Math.Distance.Between(a.x, a.y, this.player.x, this.player.y);
        const distB = Phaser.Math.Distance.Between(b.x, b.y, this.player.x, this.player.y);
        return distB - distA;
      });

      // Eliminar el más lejano
      enemiesArray[enemiesArray.length - 1]?.destroy();
    }
  }

  /**
   * Genera un enemigo aleatorio
   */
  private spawnEnemy(): void {
    // Elegir tipo de enemigo según dificultad
    const types: EnemyType[] = [EnemyType.BAT, EnemyType.SLIME];
    if (this.difficulty >= 2) types.push(EnemyType.SKELETON);
    if (this.difficulty >= 3) types.push(EnemyType.GOBLIN);
    if (this.difficulty >= 5 && Math.random() < 0.1) types.push(EnemyType.BOSS);

    const enemyType = Phaser.Math.RND.pick(types);

    // Spawn lejos del jugador
    const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
    const distance = Phaser.Math.Between(400, 600);
    const x = this.player.x + Math.cos(angle) * distance;
    const y = this.player.y + Math.sin(angle) * distance;

    // Verificar límites
    if (x < 100 || x > this.worldW - 100 || y < 100 || y > this.worldH - 100) {
      return;
    }

    const enemy = new Enemy(this, x, y, enemyType);
    this.add.existing(enemy);
    this.physics.add.existing(enemy);
    this.enemies.add(enemy);

    enemy.setTarget(this.player);
    enemy.setCollideWorldBounds(true);

    // Efecto visual de aparición
    enemy.setAlpha(0);
    enemy.setScale(0.5);
    this.tweens.add({
      targets: enemy,
      alpha: 1,
      scale: 1,
      duration: 400,
      ease: 'Back.easeOut'
    });

    // Partículas de aparición
    const spawnEffect = this.add.circle(x, y, 30, 0xFF0000, 0.5);
    spawnEffect.setDepth(999);
    this.tweens.add({
      targets: spawnEffect,
      scale: 2,
      alpha: 0,
      duration: 400,
      onComplete: () => spawnEffect.destroy()
    });

    // Colisión con jugador
    this.physics.add.overlap(enemy, this.player, (obj1, obj2) => {
      // La colisión se maneja en el sistema de combate
    });
  }

  /**
   * Maneja el ataque del jugador
   */
  private handlePlayerAttack(data: any): void {
    const enemies = this.enemies.getChildren() as Enemy[];

    enemies.forEach(enemy => {
      if (this.combatSystem.checkHit(this.player, enemy, data.range)) {
        const angle = Phaser.Math.Angle.Between(this.player.x, this.player.y, enemy.x, enemy.y);
        this.combatSystem.applyDamage(enemy, data.damage, angle);
      }
    });
  }

  /**
   * Maneja el ataque de un enemigo
   */
  private handleEnemyAttack(enemy: Enemy): void {
    if (this.combatSystem.checkHit(enemy, this.player, 60)) {
      this.player.takeDamage(enemy.stats.damage);
    }
  }

  /**
   * Maneja la muerte de un enemigo
   */
  private handleEnemyDeath(enemy: Enemy): void {
    // Dar XP y oro al jugador
    this.player.addXP(enemy.xpReward);

    const currentGold = this.registry.get('gold') || 0;
    this.registry.set('gold', currentGold + enemy.goldReward);

    const enemiesKilled = (this.registry.get('enemiesKilled') || 0) + 1;
    this.registry.set('enemiesKilled', enemiesKilled);

    // Efecto visual de muerte mejorado
    const deathEffect = this.add.circle(enemy.x, enemy.y, 40, 0xFF4444, 0.6);
    deathEffect.setDepth(999);
    this.tweens.add({
      targets: deathEffect,
      scale: 2.5,
      alpha: 0,
      duration: 500,
      ease: 'Quad.easeOut',
      onComplete: () => deathEffect.destroy()
    });

    // Partículas de muerte
    if (this.textures.exists('dot_hazard')) {
      const particles = this.add.particles(enemy.x, enemy.y, 'dot_hazard', {
        speed: { min: 50, max: 150 },
        angle: { min: 0, max: 360 },
        scale: { start: 1, end: 0 },
        alpha: { start: 1, end: 0 },
        lifespan: 600,
        quantity: 15
      });
      this.time.delayedCall(700, () => particles.destroy());
    }

    // Chance de drop de item
    if (Math.random() < 0.3) {
      this.dropItem(enemy.x, enemy.y);
    }
  }

  /**
   * Suelta un item en una posición
   */
  private dropItem(x: number, y: number): void {
    const roll = Math.random();
    let itemId = 'health_potion';

    if (roll < 0.4) itemId = 'health_potion';
    else if (roll < 0.6) itemId = 'mana_potion';
    else if (roll < 0.75) itemId = 'speed_potion';
    else if (roll < 0.85) itemId = 'gold_coin';
    else if (roll < 0.95) itemId = 'rusty_sword';
    else itemId = 'iron_sword';

    const itemData = ItemDatabase[itemId];
    if (!itemData) return;

    const texture = this.textures.exists(itemData.icon) ? itemData.icon : 'chest_golden_closed';
    const item = this.items.create(x, y, texture);
    item.setOrigin(0.5, 1);
    item.setData('itemId', itemId);
    item.refreshBody();

    this.tweens.add({
      targets: item,
      y: item.y - 5,
      duration: 1000,
      yoyo: true,
      repeat: -1,
      ease: 'sine.inOut'
    });
  }

  /**
   * Recoge un item
   */
  private collectItem(playerObj: any, itemObj: any): void {
    const itemId = itemObj.getData('itemId');
    if (!itemId) return;

    const success = this.player.inventory.addItem(itemId);

    if (success) {
      itemObj.disableBody(true, true);

      // Efecto visual
      this.tweens.add({
        targets: itemObj,
        y: itemObj.y - 30,
        alpha: 0,
        scale: 0.5,
        duration: 300,
        onComplete: () => itemObj.destroy()
      });

      // Sonido
      if (this.sound.get('s_pickup')) {
        this.sound.play('s_pickup', { volume: 0.4 });
      }

      // Efecto especial para pociones
      if (itemId === 'health_potion') {
        this.player.heal(50);
      } else if (itemId === 'mana_potion') {
        this.player.restoreMana(50);
      } else if (itemId === 'speed_potion') {
        this.player.activateSpeedBoost(10000);
      } else if (itemId === 'strength_potion') {
        this.player.activateDamageBoost(10000);
      } else if (itemId === 'gold_coin') {
        const gold = this.registry.get('gold') || 0;
        this.registry.set('gold', gold + 10);
      }
    }
  }

  /**
   * Maneja la muerte del jugador
   */
  private handlePlayerDeath(): void {
    this.time.delayedCall(2000, () => {
      this.scene.start('GameOverScene', {
        stats: {
          gold: this.registry.get('gold') || 0,
          enemiesKilled: this.registry.get('enemiesKilled') || 0,
          level: this.player.progression.getLevel(),
          playTime: this.gameTime
        }
      });
    });
  }

  /**
   * Maneja subida de nivel
   */
  private handleLevelUp(level: number): void {
    console.log(`¡Nivel ${level} alcanzado!`);
    this.events.emit('show-notification', `¡Nivel ${level}!`, 0xFFD700);
  }

  /**
   * Alterna pausa
   */
  private togglePause(): void {
    this.isPaused = !this.isPaused;

    if (this.isPaused) {
      this.scene.pause();
      this.scene.launch('PauseScene');
    }
  }

  /**
   * Alterna inventario
   */
  private toggleInventory(): void {
    if (this.scene.isActive('InventoryScene')) {
      this.scene.stop('InventoryScene');
      this.scene.resume();
    } else {
      this.scene.pause();
      this.scene.launch('InventoryScene', { player: this.player });
    }
  }

  /**
   * Guarda el juego
   */
  private saveGame(): void {
    const saveData = {
      playerStats: this.player.progression.serialize(),
      inventory: this.player.inventory.serialize(),
      currentLevel: this.difficulty,
      playTime: this.gameTime,
      timestamp: Date.now()
    };

    if (this.saveManager.saveGame(saveData)) {
      this.events.emit('show-notification', 'Juego guardado', 0x00ff00);
    }
  }

  /**
   * Auto-guardado
   */
  private autoSave(): void {
    const saveData = {
      playerStats: this.player.progression.serialize(),
      inventory: this.player.inventory.serialize(),
      currentLevel: this.difficulty,
      playTime: this.gameTime,
      timestamp: Date.now()
    };

    this.saveManager.autoSave(saveData);
  }

  /**
   * Carga datos del juego
   */
  private loadGameData(): void {
    const saveData = this.saveManager.loadGame();
    if (!saveData) return;

    // La carga se realizará después de crear el jugador
    this.registry.set('loadedSaveData', saveData);
  }

  /**
   * Genera decoraciones por todo el mapa
   */
  private spawnDecorations(): void {
    const tileSize = GameConfig.TILE_SIZE;
    const padding = 150;

    // Antorchas en las paredes del borde (cada cierta distancia)
    const torchSpacing = 200;
    for (let x = torchSpacing; x < this.worldW - padding; x += torchSpacing) {
      // Antorchas en pared norte
      if (this.textures.exists('torch_1')) {
        const torch1 = this.add.sprite(x, 80, Phaser.Math.RND.pick(['torch_1', 'torch_2', 'torch_3', 'torch_4']));
        torch1.setOrigin(0.5, 1);
        torch1.setDepth(100);
        this.decorations.add(torch1);
        this.addTorchAnimation(torch1);
      }

      // Antorchas en pared sur
      if (this.textures.exists('torch_1')) {
        const torch2 = this.add.sprite(x, this.worldH - 80, Phaser.Math.RND.pick(['torch_1', 'torch_2', 'torch_3', 'torch_4']));
        torch2.setOrigin(0.5, 1);
        torch2.setDepth(100);
        this.decorations.add(torch2);
        this.addTorchAnimation(torch2);
      }
    }

    for (let y = torchSpacing; y < this.worldH - padding; y += torchSpacing) {
      // Antorchas en pared oeste
      if (this.textures.exists('torch_1')) {
        const torch3 = this.add.sprite(80, y, Phaser.Math.RND.pick(['torch_1', 'torch_2', 'torch_3', 'torch_4']));
        torch3.setOrigin(0.5, 1);
        torch3.setDepth(100);
        this.decorations.add(torch3);
        this.addTorchAnimation(torch3);
      }

      // Antorchas en pared este
      if (this.textures.exists('torch_1')) {
        const torch4 = this.add.sprite(this.worldW - 80, y, Phaser.Math.RND.pick(['torch_1', 'torch_2', 'torch_3', 'torch_4']));
        torch4.setOrigin(0.5, 1);
        torch4.setDepth(100);
        this.decorations.add(torch4);
        this.addTorchAnimation(torch4);
      }
    }

    // Cofres decorativos cerrados (no interactuables) en posiciones estratégicas
    const chestPositions = [
      { x: 200, y: 200 },
      { x: this.worldW - 200, y: 200 },
      { x: 200, y: this.worldH - 200 },
      { x: this.worldW - 200, y: this.worldH - 200 },
      { x: this.worldW / 2 - 300, y: this.worldH / 2 },
      { x: this.worldW / 2 + 300, y: this.worldH / 2 }
    ];

    chestPositions.forEach(pos => {
      const chestTexture = Phaser.Math.RND.pick(['chest_golden_closed', 'chest_closed']);
      if (this.textures.exists(chestTexture)) {
        const chest = this.add.sprite(pos.x, pos.y, chestTexture);
        chest.setOrigin(0.5, 1);
        chest.setDepth(10);
        this.decorations.add(chest);

        // Animación de brillo para cofres dorados
        if (chestTexture === 'chest_golden_closed') {
          this.tweens.add({
            targets: chest,
            alpha: 0.8,
            duration: 2000,
            yoyo: true,
            repeat: -1,
            ease: 'sine.inOut'
          });
        }
      }
    });

    // Gárgolas y fuentes distribuidas por el mapa
    const gargoylePositions = this.generateSpawnPoints(8, 200, 250);
    gargoylePositions.forEach(pos => {
      const gargoyleTexture = Phaser.Math.RND.pick([
        'floor_gargoyle_blue_basin',
        'floor_gargoyle_red_basin',
        'floor_gargoyle_green_basin',
        'floor_gargoyle_mid_red_left'
      ]);

      if (this.textures.exists(gargoyleTexture)) {
        const gargoyle = this.add.sprite(pos.x, pos.y, gargoyleTexture);
        gargoyle.setOrigin(0.5, 1);
        gargoyle.setDepth(5);
        this.decorations.add(gargoyle);
      }
    });

    // Columnas decorativas adicionales
    const columnPositions = this.generateSpawnPoints(15, 150, 200);
    columnPositions.forEach(pos => {
      const columnTexture = this.textures.exists('column_wall') ? 'column_wall' : 'column';
      const column = this.add.sprite(pos.x, pos.y, columnTexture);
      column.setOrigin(0.5, 1);
      column.setDepth(20);
      this.decorations.add(column);
    });

    // Banderas en posiciones aleatorias
    const flagPositions = this.generateSpawnPoints(12, 180, 220);
    flagPositions.forEach(pos => {
      const flagTexture = Phaser.Math.RND.pick(['wall_flag_blue', 'wall_flag_red', 'wall_flag_green']);
      if (this.textures.exists(flagTexture)) {
        const flag = this.add.sprite(pos.x, pos.y, flagTexture);
        flag.setOrigin(0.5, 1);
        flag.setDepth(15);
        this.decorations.add(flag);

        // Animación de ondeo
        this.tweens.add({
          targets: flag,
          scaleX: 1.05,
          duration: 1500 + Math.random() * 500,
          yoyo: true,
          repeat: -1,
          ease: 'sine.inOut'
        });
      }
    });

    // Mesas y racks de armas
    const furniturePositions = this.generateSpawnPoints(6, 250, 280);
    furniturePositions.forEach((pos, index) => {
      let texture = '';
      if (index % 3 === 0 && this.textures.exists('weapon_rack')) {
        texture = 'weapon_rack';
      } else if (index % 3 === 1 && this.textures.exists('armor_stand')) {
        texture = 'armor_stand';
      } else if (this.textures.exists('table_long_ne')) {
        texture = Phaser.Math.RND.pick(['table_long_ne', 'table_long_nw']);
      }

      if (texture && this.textures.exists(texture)) {
        const furniture = this.add.sprite(pos.x, pos.y, texture);
        furniture.setOrigin(0.5, 1);
        furniture.setDepth(12);
        this.decorations.add(furniture);
      }
    });

    console.log(`[GameScene] ${this.decorations.getLength()} decoraciones añadidas al mapa`);
  }

  /**
   * Añade animación de parpadeo a las antorchas
   */
  private addTorchAnimation(torch: Phaser.GameObjects.Sprite): void {
    this.tweens.add({
      targets: torch,
      alpha: 0.7,
      scale: 0.95,
      duration: 300 + Math.random() * 200,
      yoyo: true,
      repeat: -1,
      ease: 'sine.inOut'
    });

    // Luz ambiental alrededor de la antorcha
    const light = this.add.circle(torch.x, torch.y - 20, 40, 0xFFAA00, 0.15);
    light.setDepth(1);
    this.decorations.add(light);

    this.tweens.add({
      targets: light,
      alpha: 0.25,
      scale: 1.1,
      duration: 400 + Math.random() * 200,
      yoyo: true,
      repeat: -1,
      ease: 'sine.inOut'
    });
  }

  /**
   * Añade detalles visuales al suelo
   */
  private addFloorDetails(): void {
    const floorTextures = ['floor_stain_1', 'floor_stain_2', 'floor_stain_3', 'floor_mud_mid_1'];
    const detailCount = 80;

    for (let i = 0; i < detailCount; i++) {
      const x = Phaser.Math.Between(100, this.worldW - 100);
      const y = Phaser.Math.Between(100, this.worldH - 100);

      const texture = Phaser.Math.RND.pick(floorTextures);
      if (this.textures.exists(texture)) {
        const detail = this.add.sprite(x, y, texture);
        detail.setOrigin(0.5, 0.5);
        detail.setDepth(1);
        detail.setAlpha(0.6);
        detail.setRotation(Phaser.Math.FloatBetween(0, Math.PI * 2));
        this.decorations.add(detail);
      }
    }

    // Charcos de gárgolas
    const puddleCount = 20;
    for (let i = 0; i < puddleCount; i++) {
      const x = Phaser.Math.Between(150, this.worldW - 150);
      const y = Phaser.Math.Between(150, this.worldH - 150);

      if (this.textures.exists('floor_gargoyle_blue_puddle')) {
        const puddle = this.add.sprite(x, y, 'floor_gargoyle_blue_puddle');
        puddle.setOrigin(0.5, 0.5);
        puddle.setDepth(2);
        puddle.setAlpha(0.7);
        this.decorations.add(puddle);

        // Animación sutil de charcos
        this.tweens.add({
          targets: puddle,
          alpha: 0.5,
          scaleX: 1.05,
          scaleY: 0.95,
          duration: 3000,
          yoyo: true,
          repeat: -1,
          ease: 'sine.inOut'
        });
      }
    }

    console.log(`[GameScene] ${detailCount + puddleCount} detalles de suelo añadidos`);
  }
}

export default GameScene;
