export type SoundType =
  | 'select'
  | 'deselect'
  | 'move'
  | 'error'
  | 'undo'
  | 'win'
  | 'star'

class SoundService {
  private ctx: AudioContext | null = null
  private enabled = true

  setEnabled(enabled: boolean): void {
    this.enabled = enabled
  }

  isEnabled(): boolean {
    return this.enabled
  }

  private getContext(): AudioContext {
    if (!this.ctx) {
      this.ctx = new AudioContext()
    }
    if (this.ctx.state === 'suspended') {
      void this.ctx.resume()
    }
    return this.ctx
  }

  play(type: SoundType): void {
    if (!this.enabled) return

    try {
      const ctx = this.getContext()
      switch (type) {
        case 'select':
          this.playTone(ctx, 880, 0.06, 'sine', 0.18)
          break
        case 'deselect':
          this.playTone(ctx, 660, 0.05, 'sine', 0.12)
          break
        case 'move':
          this.playMove(ctx)
          break
        case 'error':
          this.playError(ctx)
          break
        case 'undo':
          this.playTone(ctx, 520, 0.1, 'triangle', 0.15, -0.08)
          break
        case 'win':
          this.playWin(ctx)
          break
        case 'star':
          this.playTone(ctx, 1200 + Math.random() * 200, 0.12, 'sine', 0.2)
          break
      }
    } catch {
      // Audio no disponible en este entorno
    }
  }

  private playTone(
    ctx: AudioContext,
    freq: number,
    duration: number,
    type: OscillatorType,
    volume = 0.2,
    pitchSlide = 0,
  ): void {
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = type
    osc.frequency.setValueAtTime(freq, ctx.currentTime)
    if (pitchSlide !== 0) {
      osc.frequency.linearRampToValueAtTime(
        freq * (1 + pitchSlide),
        ctx.currentTime + duration,
      )
    }
    gain.gain.setValueAtTime(volume, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration)
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start(ctx.currentTime)
    osc.stop(ctx.currentTime + duration + 0.02)
  }

  private playMove(ctx: AudioContext): void {
    const now = ctx.currentTime

    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'square'
    osc.frequency.setValueAtTime(320, now)
    osc.frequency.exponentialRampToValueAtTime(180, now + 0.08)
    gain.gain.setValueAtTime(0.08, now)
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12)
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start(now)
    osc.stop(now + 0.14)

    const click = ctx.createOscillator()
    const clickGain = ctx.createGain()
    click.type = 'sine'
    click.frequency.setValueAtTime(1400, now + 0.04)
    click.frequency.exponentialRampToValueAtTime(600, now + 0.1)
    clickGain.gain.setValueAtTime(0.001, now)
    clickGain.gain.setValueAtTime(0.15, now + 0.04)
    clickGain.gain.exponentialRampToValueAtTime(0.001, now + 0.12)
    click.connect(clickGain)
    clickGain.connect(ctx.destination)
    click.start(now)
    click.stop(now + 0.14)
  }

  private playError(ctx: AudioContext): void {
    const now = ctx.currentTime
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'sawtooth'
    osc.frequency.setValueAtTime(180, now)
    for (let i = 0; i < 4; i++) {
      osc.frequency.setValueAtTime(180 + (i % 2) * 40, now + i * 0.05)
    }
    gain.gain.setValueAtTime(0.12, now)
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22)
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start(now)
    osc.stop(now + 0.24)
  }

  private playWin(ctx: AudioContext): void {
    const notes = [523.25, 659.25, 783.99, 1046.5]
    notes.forEach((freq, i) => {
      const start = ctx.currentTime + i * 0.12
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'sine'
      osc.frequency.setValueAtTime(freq, start)
      gain.gain.setValueAtTime(0.001, start)
      gain.gain.linearRampToValueAtTime(0.22, start + 0.02)
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.35)
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start(start)
      osc.stop(start + 0.38)
    })
  }
}

export const soundService = new SoundService()
