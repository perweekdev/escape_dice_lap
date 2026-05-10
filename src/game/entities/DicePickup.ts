import Phaser from 'phaser'
import { COLORS } from '../../constants'

export default class DicePickup extends Phaser.GameObjects.Container {
  collected = false

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y)

    const cube = scene.add.rectangle(0, 0, 22, 22, COLORS.DICE)
    cube.setStrokeStyle(2, COLORS.DICE_GLOW)

    // dots as children relative to cube center
    const dotPositions = [[-6, -6], [6, -6], [-6, 6], [6, 6], [0, 0]]
    const dots = dotPositions.map(([dx, dy]) => scene.add.rectangle(dx, dy, 4, 4, COLORS.BG))

    // Group cube + dots into inner container so they move together
    const visual = scene.add.container(0, 0, [cube, ...dots])

    this.add(visual)
    scene.add.existing(this)
    scene.physics.add.existing(this, true)

    const body = this.body as Phaser.Physics.Arcade.StaticBody
    body.setSize(22, 22)
    body.setOffset(-11, -11)

    // Tween the inner visual container — physics body stays fixed
    scene.tweens.add({
      targets: visual,
      y: -8,
      duration: 1200,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    })

    // glow pulse on cube only
    scene.tweens.add({
      targets: cube,
      alpha: 0.5,
      duration: 800,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    })
  }

  collect() {
    this.collected = true
    this.scene.tweens.add({
      targets: this,
      scaleX: 2,
      scaleY: 2,
      alpha: 0,
      duration: 300,
      onComplete: () => this.destroy(),
    })
  }
}
