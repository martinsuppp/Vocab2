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
        // Cancel any ongoing speech when muting
        if (this.muted) {
            window.speechSynthesis.cancel();
        }
        return this.muted;
    }

    speak(text) {
        if (this.muted || !text) return;

        // Cancel previous speech to prevent overlap/queueing
        window.speechSynthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'en-US'; // English US
        utterance.rate = 1.0; // Normal speed
        utterance.pitch = 1.0;

        window.speechSynthesis.speak(utterance);
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

    playBGM() {
        return; // BGM Disabled by user request
        /*
        if (this.muted || this.bgmOscillator) return;

        // Tense ambient drone (Dissonance)
        const now = this.audioCtx.currentTime;

        // Osc 1: Low Sawtooth (Aggressive base)
        this.bgmOscillator = this.audioCtx.createOscillator();
        this.bgmOscillator.type = 'sawtooth';
        this.bgmOscillator.frequency.value = 60; // Deep low

        // Osc 2: Dissonant Sine (Creates beating/tension)
        this.bgmOscillator2 = this.audioCtx.createOscillator();
        this.bgmOscillator2.type = 'sine';
        this.bgmOscillator2.frequency.value = 63; // Minor secondish clash

        // Gain (Volume)
        this.bgmGain = this.audioCtx.createGain();
        this.bgmGain.gain.setValueAtTime(0.03, now);

        // Wiring
        this.bgmOscillator.connect(this.bgmGain);
        this.bgmOscillator2.connect(this.bgmGain);
        this.bgmGain.connect(this.audioCtx.destination);

        // Start
        this.bgmOscillator.start();
        this.bgmOscillator2.start();
        */
    }

    playHeartbeat() {
        if (this.muted) return;
        console.log("SoundManager: Playing Heartbeat Thud");
        if (this.audioCtx.state === 'suspended') {
            this.audioCtx.resume().catch(e => console.error("Audio Resume Failed", e));
        }

        const now = this.audioCtx.currentTime;

        // Helper to create a thud
        const createThud = (time, freq, decay) => {
            const osc = this.audioCtx.createOscillator();
            const gain = this.audioCtx.createGain();

            // Low sine/triangle for body
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(freq, time);
            osc.frequency.exponentialRampToValueAtTime(freq * 0.5, time + decay);

            // Volume envelope
            gain.gain.setValueAtTime(1.0, time); // Louder start
            gain.gain.exponentialRampToValueAtTime(0.001, time + decay);

            osc.connect(gain);
            gain.connect(this.audioCtx.destination);

            osc.start(time);
            osc.stop(time + decay);
        };

        // Lub (First thud, lower, longer)
        createThud(now, 60, 0.15);

        // Dub (Second thud, slightly higher, shorter, delayed)
        createThud(now + 0.25, 70, 0.12);
    }

    stopBGM() {
        if (this.bgmOscillator) {
            try {
                this.bgmOscillator.stop();
                this.bgmOscillator.disconnect();
                if (this.bgmOscillator2) {
                    this.bgmOscillator2.stop();
                    this.bgmOscillator2.disconnect();
                }
                this.bgmGain.disconnect();
            } catch (e) {
                console.warn("Error stopping BGM", e);
            }
            this.bgmOscillator = null;
            this.bgmOscillator2 = null;
            this.bgmGain = null;
        }
    }
}

export default new SoundManager();
