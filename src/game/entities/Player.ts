import Phaser from 'phaser'
import { PLAYER_SPEED, PLAYER_JUMP_VELOCITY, COLORS } from '../../constants'

export default class Player extends Phaser.GameObjects.Container {
  declare body: Phaser.Physics.Arcade.Body

  speedMult = 1
  jumpMult = 1
  gravityMult = 1
  inputInverted = false
  dashBackward = false
  shieldActive = false
  jumpDisabled = false
  icyFloor = false

  private _facing = 1
  private _canJump = false
  private _coyoteFrames = 0
  private static readonly COYOTE_MAX = 8 // ~133ms at 60fps
  private _body!: Phaser.GameObjects.Rectangle
  private _antenna!: Phaser.GameObjects.Rectangle
  private _eye!: Phaser.GameObjects.Rectangle
  private _shieldGfx!: Phaser.GameObjects.Rectangle

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y)

    this._body = scene.add.rectangle(0, 0, 28, 32, COLORS.PLAYER)
    this._antenna = scene.add.rectangle(0, -20, 4, 10, COLORS.PLAYER)
    this._eye = scene.add.rectangle(4, -4, 8, 6, COLORS.PLAYER_DETAIL)
    this._shieldGfx = scene.add.rectangle(0, 0, 36, 40, 0x44ff88, 0)
    this._shieldGfx.setStrokeStyle(2, 0x44ff88)

    this.add([this._shieldGfx, this._body, this._antenna, this._eye])
    scene.add.existing(this)
    scene.physics.add.existing(this)

    const body = this.body as Phaser.Physics.Arcade.Body
    body.setSize(28, 32)
    body.setOffset(-14, -16)
    body.setCollideWorldBounds(false)
    body.setMaxVelocityY(800)
  }

  get facing() { return this._facing }

  handleMovement(
    cursors: Phaser.Types.Input.Keyboard.CursorKeys,
    wasd: { left: Phaser.Input.Keyboard.Key; right: Phaser.Input.Keyboard.Key; up: Phaser.Input.Keyboard.Key }
  ) {
    const body = this.body as Phaser.Physics.Arcade.Body
    const onGround = body.blocked.down

    if (onGround) {
      this._canJump = true
      this._coyoteFrames = Player.COYOTE_MAX
    } else if (this._coyoteFrames > 0) {
      this._coyoteFrames--
    } else {
      this._canJump = false
    }

    const speed = PLAYER_SPEED * this.speedMult
    const leftDown = (cursors.left.isDown || wasd.left.isDown) !== this.inputInverted
    const rightDown = (cursors.right.isDown || wasd.right.isDown) !== this.inputInverted

    if (leftDown) {
      body.setVelocityX(-speed)
      this._facing = -1
      if (this.icyFloor) body.setVelocityX(Math.max(body.velocity.x - 8, -speed))
    } else if (rightDown) {
      body.setVelocityX(speed)
      this._facing = 1
      if (this.icyFloor) body.setVelocityX(Math.min(body.velocity.x + 8, speed))
    } else {
      if (this.icyFloor) {
        body.setVelocityX(body.velocity.x * 0.92)
      } else {
        body.setVelocityX(0)
      }
    }

    const jumpPressed = Phaser.Input.Keyboard.JustDown(cursors.up) ||
      Phaser.Input.Keyboard.JustDown(cursors.space) ||
      Phaser.Input.Keyboard.JustDown(wasd.up)

    if (jumpPressed && this._canJump && !this.jumpDisabled) {
      body.setVelocityY(PLAYER_JUMP_VELOCITY * this.jumpMult)
      this._canJump = false
    }

    // eye flips with direction
    this._eye.setX(this._facing * 5)
  }

  dash() {
    const body = this.body as Phaser.Physics.Arcade.Body
    const dir = this.dashBackward ? -this._facing : this._facing
    body.setVelocityX(dir * 700)
    body.setVelocityY(-120)
  }

  activateShield() {
    this.shieldActive = true
    this._shieldGfx.setAlpha(1)
  }

  absorbDeath(): boolean {
    if (this.shieldActive) {
      this.shieldActive = false
      this._shieldGfx.setAlpha(0)
      this.scene.cameras.main.flash(300, 0, 255, 136)
      return true
    }
    return false
  }

  resetModifiers() {
    this.speedMult = 1
    this.jumpMult = 1
    this.gravityMult = 1
    this.inputInverted = false
    this.dashBackward = false
    this.jumpDisabled = false
    this.icyFloor = false
    const body = this.body as Phaser.Physics.Arcade.Body
    body.setGravityY(0)
  }
}
