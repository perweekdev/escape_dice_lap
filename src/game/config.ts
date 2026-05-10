import Phaser from 'phaser'
import { CANVAS_WIDTH, CANVAS_HEIGHT, GRAVITY } from '../constants'
import BootScene from './scenes/BootScene'
import MenuScene from './scenes/MenuScene'
import GameScene from './scenes/GameScene'
import UIScene from './scenes/UIScene'
import ResultScene from './scenes/ResultScene'

export const gameConfig: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: CANVAS_WIDTH,
  height: CANVAS_HEIGHT,
  backgroundColor: '#0a0a1a',
  pixelArt: true,
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { x: 0, y: GRAVITY },
      debug: false,
    },
  },
  scene: [BootScene, MenuScene, GameScene, UIScene, ResultScene],
}
