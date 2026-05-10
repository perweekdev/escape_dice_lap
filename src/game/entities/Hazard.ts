import Phaser from 'phaser'
import type { HazardDef } from '../data/levels'
import { COLORS } from '../../constants'

export default class Hazard extends Phaser.GameObjects.Rectangle {
  isActive = true
  kind: 'spike' | 'laser'

  constructor(scene: Phaser.Scene, def: HazardDef) {
    super(scene, def.x + def.width / 2, def.y + def.height / 2, def.width, def.height)
    this.kind = def.kind

    if (def.kind === 'spike') {
      this.setFillStyle(COLORS.SPIKE)
      scene.add.existing(this)
      scene.physics.add.existing(this, true)
    } else {
      // laser
      this.setFillStyle(COLORS.LASER_ON)
      scene.add.existing(this)
      scene.physics.add.existing(this, true)

      const interval = def.flashInterval ?? 2000
      // alternate between active and inactive
      scene.time.addEvent({
        delay: interval,
        loop: true,
        callback: () => this.toggleLaser(),
      })
    }
  }

  private toggleLaser() {
    this.isActive = !this.isActive
    this.setFillStyle(this.isActive ? COLORS.LASER_ON : COLORS.LASER_OFF)
    const body = this.body as Phaser.Physics.Arcade.StaticBody
    if (this.isActive) {
      body.enable = true
    } else {
      body.enable = false
    }
  }
}
