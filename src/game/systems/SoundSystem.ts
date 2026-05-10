class SoundSystem {
  private ctx: AudioContext | null = null
  private master: GainNode | null = null
  private _enabled = true
  private _lastWarningBeep = 0

  private getCtx(): AudioContext {
    if (!this.ctx) {
      this.ctx = new AudioContext()
      this.master = this.ctx.createGain()
      this.master.gain.value = 0.35
      this.master.connect(this.ctx.destination)
    }
    if (this.ctx.state === 'suspended') this.ctx.resume()
    return this.ctx
  }

  private out(): GainNode | null {
    if (!this._enabled) return null
    this.getCtx()
    return this.master
  }

  private osc(
    type: OscillatorType,
    freqStart: number,
    freqEnd: number,
    duration: number,
    vol: number,
    delay = 0,
  ) {
    const out = this.out()
    if (!out) return
    const ctx = this.ctx!
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(out)
    const t = ctx.currentTime + delay
    osc.type = type
    osc.frequency.setValueAtTime(freqStart, t)
    if (freqEnd !== freqStart) osc.frequency.exponentialRampToValueAtTime(freqEnd, t + duration)
    gain.gain.setValueAtTime(vol, t)
    gain.gain.exponentialRampToValueAtTime(0.001, t + duration)
    osc.start(t)
    osc.stop(t + duration + 0.01)
  }

  private noise(duration: number, cutoff: number, vol: number) {
    const out = this.out()
    if (!out) return
    const ctx = this.ctx!
    const rate = ctx.sampleRate
    const len = Math.ceil(rate * duration)
    const buf = ctx.createBuffer(1, len, rate)
    const data = buf.getChannelData(0)
    for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len)

    const src = ctx.createBufferSource()
    src.buffer = buf
    const filter = ctx.createBiquadFilter()
    filter.type = 'lowpass'
    filter.frequency.value = cutoff
    const gain = ctx.createGain()
    gain.gain.value = vol
    src.connect(filter)
    filter.connect(gain)
    gain.connect(out)
    src.start()
  }

  // ── Public sounds ───────────────────────────────────────────

  jump() {
    this.osc('square', 220, 520, 0.12, 0.25)
  }

  land() {
    this.noise(0.06, 220, 0.4)
    this.osc('sine', 120, 60, 0.08, 0.2)
  }

  death() {
    this.osc('sawtooth', 380, 80, 0.45, 0.4)
    this.noise(0.15, 800, 0.3)
  }

  diceCollect() {
    // ascending arpeggio
    ;[440, 554, 659, 880].forEach((f, i) => {
      this.osc('sine', f, f, 0.1, 0.3, i * 0.065)
    })
  }

  moduleActivate() {
    this.osc('sine', 700, 1100, 0.05, 0.3)
    this.osc('sine', 1100, 500, 0.08, 0.2, 0.05)
  }

  moduleActivateNegative() {
    this.osc('sawtooth', 400, 200, 0.12, 0.3)
    this.osc('sawtooth', 200, 100, 0.1, 0.2, 0.1)
  }

  stageClear() {
    ;[523, 659, 784, 1047].forEach((f, i) => {
      this.osc('square', f, f, 0.14, 0.22, i * 0.1)
    })
  }

  gameOver() {
    this.osc('sawtooth', 420, 100, 0.9, 0.45)
    this.noise(0.3, 1000, 0.2)
  }

  warningBeep() {
    const now = Date.now()
    if (now - this._lastWarningBeep < 900) return
    this._lastWarningBeep = now
    this.osc('square', 880, 880, 0.09, 0.18)
  }

  menuHover() {
    this.osc('sine', 440, 480, 0.07, 0.15)
  }

  menuSelect() {
    this.osc('sine', 520, 780, 0.1, 0.2)
    this.osc('sine', 780, 1040, 0.08, 0.15, 0.07)
  }

  toggle(val: boolean) {
    this._enabled = val
  }
}

export const soundSystem = new SoundSystem()
