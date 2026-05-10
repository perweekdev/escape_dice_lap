import Phaser from 'phaser'

export const EventBus = new Phaser.Events.EventEmitter()

export const Events = {
  STAGE_CHANGED: 'stage-changed',
  TIMER_UPDATED: 'timer-updated',
  DEATH_COUNT_UPDATED: 'death-count-updated',
  MODULE_UPDATED: 'module-updated',
  MODULE_ACTIVATED: 'module-activated',
  DICE_COLLECTED: 'dice-collected',
  GAME_OVER: 'game-over',
  GAME_WIN: 'game-win',
  PLAYER_DIED: 'player-died',
  SHOW_BANNER: 'show-banner',
}
