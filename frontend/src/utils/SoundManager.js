class SoundManager {
    constructor() {
        this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        this.muted = false;
    }

    setMuted(isMuted) {
        this.muted = isMuted;
    }

    toggleMuted() {
        this.muted = !this.muted;
        return this.muted;
    }

    playTone(frequency, type, duration, startTime = 0) {
        if (this.muted) return;
        if (this.audioCtx.state === 'suspended') {
            this.audioCtx.resume();
        }

        const oscillator = this.audioCtx.createOscillator();
        const gainNode = this.audioCtx.createGain();

        oscillator.type = type;
        oscillator.frequency.value = frequency;

        // Envelope to avoid clicking
        gainNode.gain.setValueAtTime(0.1, this.audioCtx.currentTime + startTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioCtx.currentTime + startTime + duration);

        oscillator.connect(gainNode);
        gainNode.connect(this.audioCtx.destination);

        oscillator.start(this.audioCtx.currentTime + startTime);
        oscillator.stop(this.audioCtx.currentTime + startTime + duration);
    }

    playCorrect() {
        // Ding! (High pitch sine)
        this.playTone(600, 'sine', 0.1);
        this.playTone(1200, 'sine', 0.3, 0.1);
    }

    playWrong() {
        // Buzz! (Low pitch sawtooth)
        this.playTone(150, 'sawtooth', 0.1);
        this.playTone(100, 'sawtooth', 0.3, 0.1);
    }

    playTick() {
        // Ticking sound (short high click)
        this.playTone(800, 'square', 0.05);
    }

    playTimeout() {
        // Time out (Descending glissando)
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(400, this.audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(100, this.audioCtx.currentTime + 0.5);
        gain.gain.setValueAtTime(0.2, this.audioCtx.currentTime);
        gain.gain.linearRampToValueAtTime(0, this.audioCtx.currentTime + 0.5);
        osc.connect(gain);
        gain.connect(this.audioCtx.destination);
        osc.start();
        // High pitch beep
        this.playTone(800, 'sine', 0.1);
        this.playTone(800, 'sine', 0.1, 0.15);
        this.playTone(800, 'sine', 0.3, 0.3);
    }

    playFlip() {
        // Quick swish-like sound (noise buffer would be better but simple tone for now)
        this.playTone(400, 'triangle', 0.05);
    }

    playClick() {
        // Simple click
        this.playTone(300, 'sine', 0.03);
    }

    playFinish() {
        // Victory fanfare
        const now = 0;
        this.playTone(400, 'sine', 0.2, now);
        this.playTone(500, 'sine', 0.2, now + 0.2);
        this.playTone(600, 'sine', 0.2, now + 0.4);
        this.playTone(800, 'sine', 0.4, now + 0.6);
    }
}

export default new SoundManager();
