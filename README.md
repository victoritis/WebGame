# 🎮 Dungeon Crawler - Aventura Épica

Un juego web completo de tipo dungeon crawler/roguelike desarrollado con Phaser 3, TypeScript y Vite.

## 🌟 Características

### Sistemas de Juego Completos

- **Sistema de Combate Avanzado**: Combate en tiempo real con diferentes tipos de armas y habilidades
- **Inventario y Equipamiento**: Sistema completo de gestión de items con diferentes categorías
- **Sistema de Progresión**: Experiencia, niveles y mejora de estadísticas
- **Enemigos con IA**: 5 tipos de enemigos con comportamientos únicos (persecución, vagabundeo, patrulla, a distancia)
- **Sistema de Guardado**: Guardado automático y manual con LocalStorage
- **Dificultad Progresiva**: El juego se vuelve más difícil con el tiempo

### Mecánicas de Juego

- **Movimiento fluido** con sistema de sprint y stamina
- **Combate** con cooldowns y knockback
- **Recolección de items**: Pociones, armas, armaduras y accesorios
- **Power-ups temporales**: Boosts de velocidad y daño
- **Sistema de vidas** con respawn
- **Minimapa** en tiempo real
- **Efectos visuales** y partículas

### Interfaz y Menús

- **Menú Principal** con opciones de nueva partida y continuar
- **HUD Completo**: Barras de vida, maná, stamina y experiencia
- **Inventario Visual**: Sistema de grid con equipamiento
- **Pantalla de Pausa** con opciones de guardado
- **Game Over Mejorado** con estadísticas detalladas
- **Sistema de Configuración**: Ajustes de volumen y dificultad

## 🚀 Instalación y Ejecución

### Requisitos Previos

- Node.js >= 18.0.0
- npm o yarn

### Instalación

```bash
# Clonar el repositorio
git clone <tu-repo>
cd WebGame

# Instalar dependencias
npm install
```

### Ejecución en Localhost

```bash
# Modo desarrollo
npm run dev

# El juego estará disponible en http://localhost:5173
```

### Build para Producción

```bash
# Crear build optimizado
npm run build

# Preview del build
npm run preview
```

### Docker (Opcional)

```bash
# Construir imagen
docker-compose build

# Ejecutar contenedor
docker-compose up

# Acceder en http://localhost:8080
```

## 🎮 Controles

### Movimiento
- **WASD** o **Flechas**: Mover al jugador
- **SHIFT**: Correr (consume stamina)

### Combate
- **ESPACIO**: Atacar enemigos cercanos
- **Q**: Usar poción rápida

### Menús
- **I**: Abrir/Cerrar inventario
- **ESC**: Pausa
- **F5**: Guardar manualmente
- **ENTER**: Seleccionar/Confirmar
- **TAB**: Alternar tamaño de minimapa (en juego antiguo)

### Inventario
- **WASD/Flechas**: Navegar por los slots
- **ENTER**: Usar/Equipar item
- **Q**: Soltar item
- **I/ESC**: Cerrar

## 📦 Items y Objetos

### Pociones
- **Poción de Vida** (Roja): Restaura 50 HP
- **Poción de Maná** (Azul): Restaura 50 Maná
- **Poción de Velocidad** (Amarilla): Aumenta velocidad por 10s
- **Poción de Fuerza** (Verde): Aumenta daño por 10s

### Armas
- **Espada Oxidada**: +5 daño
- **Espada de Hierro**: +10 daño
- **Espada de Acero**: +15 daño
- **Espada Legendaria**: +30 daño
- **Arco de Madera**: +7 daño
- **Báculo Mágico**: +12 daño, +20 maná

### Armadura
- **Armadura de Cuero**: +3 defensa
- **Armadura de Malla**: +7 defensa
- **Armadura de Placas**: +12 defensa, -20 velocidad

### Accesorios
- **Anillo de Vida**: +30 HP máxima
- **Botas de Velocidad**: +40 velocidad

## 👾 Enemigos

### Tipos de Enemigos

1. **Murciélago** (Bat)
   - HP: 30 | Daño: 5 | Velocidad: 120
   - IA: Persecución agresiva
   - Recompensa: 10 XP, 2 Oro

2. **Slime**
   - HP: 40 | Daño: 7 | Velocidad: 80
   - IA: Vagabundeo aleatorio
   - Recompensa: 15 XP, 3 Oro

3. **Esqueleto**
   - HP: 60 | Daño: 12 | Velocidad: 90
   - IA: Patrulla por rutas
   - Recompensa: 25 XP, 5 Oro

4. **Goblin**
   - HP: 50 | Daño: 10 | Velocidad: 100
   - IA: Combate a distancia
   - Recompensa: 20 XP, 7 Oro

5. **Jefe** (Boss)
   - HP: 200 | Daño: 20 | Velocidad: 70
   - IA: Persecución
   - Recompensa: 100 XP, 50 Oro

## 🎯 Sistema de Progresión

### Niveles
- **XP Base**: 100 XP para nivel 2
- **Multiplicador**: x1.5 por cada nivel
- Al subir de nivel:
  - +15 HP máxima
  - +10 Maná máximo
  - +2 Daño
  - +1 Defensa
  - Curación completa

### Dificultad
- Aumenta cada 30 segundos
- Más enemigos aparecen
- Enemigos más fuertes se desbloquean
- Máximo 20 enemigos simultáneos

## 💾 Sistema de Guardado

### Auto-guardado
- Se ejecuta cada 30 segundos automáticamente
- No interrumpe el juego

### Guardado Manual
- Presiona **F5** en cualquier momento
- También disponible en el menú de pausa

### Datos Guardados
- Estadísticas del jugador
- Inventario completo
- Nivel de dificultad actual
- Tiempo de juego
- Items equipados

## 🏗️ Estructura del Proyecto

```
src/
├── config/          # Configuraciones globales
│   ├── GameConfig.ts
│   └── Types.ts
├── data/            # Bases de datos
│   ├── ItemDatabase.ts
│   └── EnemyDatabase.ts
├── entities/        # Entidades del juego
│   ├── PlayerCharacter.ts
│   └── Enemy.ts
├── managers/        # Gestores de sistemas
│   ├── InventoryManager.ts
│   ├── ProgressionManager.ts
│   └── SaveManager.ts
├── systems/         # Sistemas de juego
│   └── CombatSystem.ts
├── scenes/          # Escenas de Phaser
│   ├── BootScene.ts
│   ├── MenuScene.ts
│   ├── GameScene.ts
│   ├── HUDScene.ts
│   ├── InventoryScene.ts
│   ├── PauseScene.ts
│   ├── GameOverScene.ts
│   └── SettingsScene.ts
└── main.ts          # Punto de entrada
```

## 🛠️ Tecnologías Utilizadas

- **Phaser 3.60.0**: Motor de juego
- **TypeScript 5.4.0**: Lenguaje
- **Vite 5.0.0**: Build tool y dev server
- **LocalStorage API**: Sistema de guardado
- **Canvas/WebGL**: Renderizado

## 🎨 Assets

Los assets gráficos se generan proceduralmente usando Phaser Graphics cuando no están disponibles:
- Sprites de personajes
- Sprites de enemigos
- Items y pociones
- Elementos del entorno
- Partículas y efectos

## 📝 Notas de Desarrollo

### Características Implementadas ✅

- ✅ Sistema de combate completo
- ✅ Inventario y equipamiento
- ✅ Sistema de progresión (XP/Niveles)
- ✅ 5 tipos de enemigos con IA
- ✅ Sistema de guardado
- ✅ Menú principal y configuración
- ✅ HUD completo
- ✅ Sistema de items y pociones
- ✅ Dificultad progresiva
- ✅ Efectos visuales y partículas
- ✅ Sistema de stamina
- ✅ Power-ups temporales

### Posibles Mejoras Futuras 🚀

- [ ] Generación procedural de mazmorras
- [ ] Más tipos de enemigos y jefes
- [ ] Sistema de habilidades especiales
- [ ] Crafteo de items
- [ ] Múltiples biomas/niveles
- [ ] Sistema de logros
- [ ] Música de fondo
- [ ] Multijugador local
- [ ] Tutorial interactivo
- [ ] Más armas y items únicos

## 🐛 Solución de Problemas

### El juego no carga
- Verifica que Node.js esté instalado correctamente
- Ejecuta `npm install` nuevamente
- Limpia la caché: `npm run build --force`

### Errores de TypeScript
- Asegúrate de tener TypeScript 5.4.0 o superior
- Ejecuta `npm run typecheck` para ver errores específicos

### Problemas con el guardado
- Verifica que el navegador permita LocalStorage
- Limpia los datos del navegador si hay corrupciones

## 📄 Licencia

MIT License - Libre para uso personal y comercial

## 👨‍💻 Autor

Desarrollado con ❤️ usando Phaser 3, TypeScript y Vite

---

## 🎮 ¡Disfruta del Juego!

¡Sumérgete en las mazmorras, derrota enemigos, mejora tu personaje y conviértete en el héroe definitivo!

**¡Buena suerte, aventurero!** ⚔️🛡️✨
