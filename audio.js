// FM Synth Audio Engine for Butterfly Survivors
// 16-bit Sega Genesis / arcade style procedural audio

// --- FMVoice: 2-operator FM synthesis voice ---
class FMVoice {
    play(ctx, params, destination, startTime) {
        const now = startTime || ctx.currentTime;

        // Modulator oscillator
        const mod = ctx.createOscillator();
        const modGain = ctx.createGain();
        mod.type = params.modType || 'sine';
        const modFreq = params.carrierFreq * params.modRatio;
        mod.frequency.value = modFreq;

        // Modulation depth (index)
        const modDepth = modFreq * params.modIndex;
        modGain.gain.setValueAtTime(modDepth, now);
        if (params.modDecay) {
            const endDepth = modFreq * (params.modIndexEnd || 0.1);
            modGain.gain.exponentialRampToValueAtTime(Math.max(endDepth, 0.01), now + params.modDecay);
        }

        // Carrier oscillator
        const carrier = ctx.createOscillator();
        const carrierGain = ctx.createGain();
        carrier.type = params.carrierType || 'sine';
        carrier.frequency.value = params.carrierFreq;

        // Pitch sweep
        if (params.pitchStart && params.pitchEnd) {
            carrier.frequency.setValueAtTime(params.pitchStart, now);
            carrier.frequency.exponentialRampToValueAtTime(
                Math.max(params.pitchEnd, 1), now + (params.pitchTime || params.duration)
            );
        }

        // Vibrato
        if (params.vibrato) {
            const lfo = ctx.createOscillator();
            const lfoGain = ctx.createGain();
            lfo.frequency.value = params.vibrato.rate;
            lfoGain.gain.value = params.vibrato.depth;
            lfo.connect(lfoGain);
            lfoGain.connect(carrier.frequency);
            lfo.start(now);
            lfo.stop(now + params.duration + 0.05);
        }

        // FM wiring: mod -> modGain -> carrier.frequency
        mod.connect(modGain);
        modGain.connect(carrier.frequency);

        // Output: carrier -> carrierGain -> destination
        carrier.connect(carrierGain);
        carrierGain.connect(destination);

        // Amplitude envelope
        const env = params.envelope;
        const peak = env.peak || 1.0;
        const sustain = env.sustain || 0.3;
        carrierGain.gain.setValueAtTime(0.001, now);
        carrierGain.gain.linearRampToValueAtTime(peak, now + env.attack);
        carrierGain.gain.linearRampToValueAtTime(sustain, now + env.attack + env.decay);
        const releaseStart = now + params.duration - env.release;
        if (releaseStart > now + env.attack + env.decay) {
            carrierGain.gain.setValueAtTime(sustain, releaseStart);
        }
        carrierGain.gain.linearRampToValueAtTime(0.001, now + params.duration);

        // Start and auto-stop
        mod.start(now);
        carrier.start(now);
        mod.stop(now + params.duration + 0.05);
        carrier.stop(now + params.duration + 0.05);
    }
}

// --- Noise generator for drums/percussion ---
function playNoise(ctx, params, destination, startTime) {
    const now = startTime || ctx.currentTime;
    const dur = params.duration || 0.1;
    const bufferSize = Math.ceil(ctx.sampleRate * dur);
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = params.filterType || 'lowpass';
    filter.frequency.value = params.filterFreq || 1000;
    if (params.filterQ) filter.Q.value = params.filterQ;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(params.volume || 0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + dur);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(destination);

    noise.start(now);
    noise.stop(now + dur + 0.01);
}

// --- SFX Recipes ---
const SFX_LIBRARY = {
    pollenShot: {
        voices: [{
            carrierFreq: 880, carrierType: 'sine',
            modRatio: 3, modIndex: 4, modDecay: 0.08, modIndexEnd: 0.1,
            duration: 0.12,
            envelope: { attack: 0.005, decay: 0.04, sustain: 0.1, release: 0.06, peak: 0.35 }
        }],
        cooldown: 0
    },

    sparkleBurst: {
        voices: [{
            carrierFreq: 1100, carrierType: 'sine',
            modRatio: 2, modIndex: 5, modDecay: 0.06, modIndexEnd: 0.2,
            duration: 0.15, pitchStart: 1300, pitchEnd: 1100, pitchTime: 0.05,
            envelope: { attack: 0.003, decay: 0.05, sustain: 0.15, release: 0.07, peak: 0.3 }
        }],
        cooldown: 0
    },

    wingBlade: {
        voices: [{
            carrierFreq: 220, carrierType: 'sawtooth',
            modRatio: 1.414, modIndex: 2, modDecay: 0.15,
            duration: 0.2,
            envelope: { attack: 0.01, decay: 0.08, sustain: 0.1, release: 0.1, peak: 0.18 }
        }],
        cooldown: 900
    },

    enemyHit: {
        voices: [{
            carrierFreq: 440, carrierType: 'square',
            modRatio: 7, modIndex: 3, modDecay: 0.04,
            duration: 0.08,
            envelope: { attack: 0.002, decay: 0.03, sustain: 0.05, release: 0.04, peak: 0.25 }
        }],
        noise: { duration: 0.04, filterType: 'bandpass', filterFreq: 2000, volume: 0.12, filterQ: 2 },
        cooldown: 50
    },

    enemyDeath: {
        voices: [{
            carrierFreq: 300, carrierType: 'square',
            modRatio: 3, modIndex: 8, modDecay: 0.3, modIndexEnd: 0.5,
            duration: 0.4, pitchStart: 500, pitchEnd: 100, pitchTime: 0.35,
            envelope: { attack: 0.005, decay: 0.15, sustain: 0.1, release: 0.2, peak: 0.35 }
        }],
        noise: { duration: 0.25, filterType: 'lowpass', filterFreq: 3000, volume: 0.15 },
        cooldown: 100
    },

    playerDamage: {
        voices: [{
            carrierFreq: 200, carrierType: 'sawtooth',
            modRatio: 1.5, modIndex: 6, modDecay: 0.2,
            duration: 0.3,
            vibrato: { rate: 30, depth: 40 },
            envelope: { attack: 0.005, decay: 0.1, sustain: 0.15, release: 0.15, peak: 0.4 }
        }],
        cooldown: 300
    },

    levelUp: {
        // Ascending arpeggio: C5 -> E5 -> G5 -> C6
        voices: [
            { carrierFreq: 523, carrierType: 'sine', modRatio: 2, modIndex: 3, modDecay: 0.15, duration: 0.25, delay: 0.0, envelope: { attack: 0.01, decay: 0.08, sustain: 0.3, release: 0.12, peak: 0.3 } },
            { carrierFreq: 659, carrierType: 'sine', modRatio: 2, modIndex: 3, modDecay: 0.15, duration: 0.25, delay: 0.1, envelope: { attack: 0.01, decay: 0.08, sustain: 0.3, release: 0.12, peak: 0.3 } },
            { carrierFreq: 784, carrierType: 'sine', modRatio: 2, modIndex: 3, modDecay: 0.15, duration: 0.25, delay: 0.2, envelope: { attack: 0.01, decay: 0.08, sustain: 0.3, release: 0.12, peak: 0.3 } },
            { carrierFreq: 1047, carrierType: 'sine', modRatio: 2, modIndex: 3, modDecay: 0.2, duration: 0.4, delay: 0.35, envelope: { attack: 0.01, decay: 0.1, sustain: 0.4, release: 0.2, peak: 0.35 } }
        ],
        cooldown: 500
    },

    gameStart: {
        voices: [{
            carrierFreq: 200, carrierType: 'sawtooth',
            modRatio: 2, modIndex: 5, modDecay: 0.8, modIndexEnd: 1,
            duration: 1.0, pitchStart: 200, pitchEnd: 800, pitchTime: 0.8,
            envelope: { attack: 0.05, decay: 0.3, sustain: 0.4, release: 0.3, peak: 0.35 }
        }],
        cooldown: 1000
    },

    gameOver: {
        voices: [
            { carrierFreq: 440, carrierType: 'sawtooth', modRatio: 3, modIndex: 2, modDecay: 0.4, duration: 0.6, delay: 0.0, envelope: { attack: 0.02, decay: 0.2, sustain: 0.2, release: 0.3, peak: 0.3 } },
            { carrierFreq: 330, carrierType: 'sawtooth', modRatio: 3, modIndex: 2, modDecay: 0.4, duration: 0.8, delay: 0.5, envelope: { attack: 0.02, decay: 0.2, sustain: 0.2, release: 0.4, peak: 0.3 } }
        ],
        cooldown: 1000
    },

    newHighScore: {
        // Triumphant ascending fanfare: C5 -> E5 -> G5 -> C6 -> E6, longer and louder than levelUp
        voices: [
            { carrierFreq: 523, carrierType: 'sawtooth', modRatio: 2, modIndex: 4, modDecay: 0.2, duration: 0.3, delay: 0.0, envelope: { attack: 0.01, decay: 0.1, sustain: 0.35, release: 0.15, peak: 0.4 } },
            { carrierFreq: 659, carrierType: 'sawtooth', modRatio: 2, modIndex: 4, modDecay: 0.2, duration: 0.3, delay: 0.12, envelope: { attack: 0.01, decay: 0.1, sustain: 0.35, release: 0.15, peak: 0.4 } },
            { carrierFreq: 784, carrierType: 'sawtooth', modRatio: 2, modIndex: 4, modDecay: 0.2, duration: 0.3, delay: 0.24, envelope: { attack: 0.01, decay: 0.1, sustain: 0.35, release: 0.15, peak: 0.4 } },
            { carrierFreq: 1047, carrierType: 'sawtooth', modRatio: 2, modIndex: 3, modDecay: 0.25, duration: 0.4, delay: 0.4, envelope: { attack: 0.01, decay: 0.1, sustain: 0.4, release: 0.2, peak: 0.45 } },
            { carrierFreq: 1319, carrierType: 'sine', modRatio: 2, modIndex: 2, modDecay: 0.3, duration: 0.6, delay: 0.55, envelope: { attack: 0.02, decay: 0.15, sustain: 0.3, release: 0.3, peak: 0.4 } }
        ],
        cooldown: 5000
    },

    upgradeSelect: {
        voices: [
            { carrierFreq: 660, carrierType: 'sine', modRatio: 2, modIndex: 2, modDecay: 0.1, duration: 0.15, delay: 0.0, envelope: { attack: 0.005, decay: 0.05, sustain: 0.2, release: 0.08, peak: 0.25 } },
            { carrierFreq: 990, carrierType: 'sine', modRatio: 2, modIndex: 2, modDecay: 0.1, duration: 0.2, delay: 0.08, envelope: { attack: 0.005, decay: 0.05, sustain: 0.25, release: 0.1, peak: 0.3 } }
        ],
        cooldown: 200
    },

    xpCollect: {
        voices: [{
            carrierFreq: 1500, carrierType: 'sine',
            modRatio: 2, modIndex: 1.5, modDecay: 0.03,
            duration: 0.06,
            envelope: { attack: 0.002, decay: 0.02, sustain: 0.05, release: 0.03, peak: 0.12 }
        }],
        cooldown: 80
    },

    pause: {
        voices: [{
            carrierFreq: 400, carrierType: 'sine',
            modRatio: 2, modIndex: 1, modDecay: 0.05,
            duration: 0.1,
            envelope: { attack: 0.005, decay: 0.03, sustain: 0.1, release: 0.05, peak: 0.2 }
        }],
        cooldown: 200
    },

    resume: {
        voices: [{
            carrierFreq: 600, carrierType: 'sine',
            modRatio: 2, modIndex: 1, modDecay: 0.05,
            duration: 0.1,
            envelope: { attack: 0.005, decay: 0.03, sustain: 0.1, release: 0.05, peak: 0.2 }
        }],
        cooldown: 200
    }
};

// --- Music Sequencer ---
class MusicSequencer {
    constructor(ctx, destination) {
        this.ctx = ctx;
        this.destination = destination;
        this.bpm = 140;
        this.beatDuration = 60 / this.bpm;
        this.sixteenthDuration = this.beatDuration / 4;

        this.currentStep = 0;
        this.totalSteps = 64; // 16 beats * 4 subdivisions
        this.loopCount = 0;

        this.scheduleAheadTime = 0.1;
        this.timerInterval = 25;
        this.nextStepTime = 0;
        this.timerID = null;

        this.fmVoice = new FMVoice();

        // E minor pentatonic scale frequencies across octaves
        this.scale = [
            164.81, 196.00, 220.00, 246.94, 293.66, // E3, G3, A3, B3, D4
            329.63, 392.00, 440.00, 493.88, 587.33, // E4, G4, A4, B4, D5
            659.25, 783.99, 880.00                    // E5, G5, A5
        ];

        // Bass notes (lower octave)
        this.bassNotes = [82.41, 98.00, 110.00, 123.47, 146.83]; // E2, G2, A2, B2, D3

        // Chord progression: Em - G - Am - Bm (4 beats each, i-III-iv-v)
        this.chordRoots = [0, 1, 2, 3]; // indices into bassNotes
        this.chordTones = [
            [0, 2, 4],  // Em: E, A, D (pentatonic approx)
            [1, 3, 0],  // G:  G, B, E
            [2, 4, 1],  // Am: A, D, G
            [3, 0, 2]   // Bm: B, E, A
        ];

        this.melodyPattern = [];
        this.generateMelody();
        this.drumPattern = this.generateDrums();
    }

    generateMelody() {
        this.melodyPattern = [];
        let prevNote = 5; // Start at E4

        for (let beat = 0; beat < 16; beat++) {
            // 20% chance of rest
            if (Math.random() < 0.2) {
                this.melodyPattern.push(null);
                continue;
            }

            // Get current chord (changes every 4 beats)
            const chordIdx = Math.floor(beat / 4);
            const chordToneIndices = this.chordTones[chordIdx];

            // Bias toward chord tones (60% chance)
            let noteIdx;
            if (Math.random() < 0.6) {
                const ct = chordToneIndices[Math.floor(Math.random() * chordToneIndices.length)];
                // Pick from octave 1 (indices 5-9) biased
                noteIdx = ct + 5;
            } else {
                // Step from previous note (max 3 steps)
                const step = Math.floor(Math.random() * 7) - 3;
                noteIdx = Math.max(0, Math.min(this.scale.length - 1, prevNote + step));
            }

            prevNote = noteIdx;
            this.melodyPattern.push(this.scale[noteIdx]);
        }
    }

    generateDrums() {
        // Classic arcade drum pattern per sixteenth note (64 steps)
        const pattern = [];
        for (let i = 0; i < 64; i++) {
            const beat = i % 16; // position within a bar (16 sixteenths)
            pattern.push({
                kick: beat === 0 || beat === 8,
                snare: beat === 4 || beat === 12,
                hihat: beat % 2 === 0
            });
        }
        return pattern;
    }

    start() {
        if (this.timerID) return;
        this.nextStepTime = this.ctx.currentTime + 0.1;
        this.currentStep = 0;
        this.scheduler();
    }

    stop() {
        if (this.timerID) {
            clearTimeout(this.timerID);
            this.timerID = null;
        }
    }

    scheduler() {
        while (this.nextStepTime < this.ctx.currentTime + this.scheduleAheadTime) {
            this.scheduleStep(this.currentStep, this.nextStepTime);
            this.advanceStep();
        }
        this.timerID = setTimeout(() => this.scheduler(), this.timerInterval);
    }

    advanceStep() {
        this.nextStepTime += this.sixteenthDuration;
        this.currentStep++;
        if (this.currentStep >= this.totalSteps) {
            this.currentStep = 0;
            this.loopCount++;
            if (this.loopCount % 4 === 0) {
                this.generateMelody();
            }
        }
    }

    scheduleStep(step, time) {
        const beat = Math.floor(step / 4); // which beat (0-15)
        const sub = step % 4; // which sixteenth within the beat

        // Melody: play on each beat (every 4 sixteenths)
        if (sub === 0 && this.melodyPattern[beat] !== null && this.melodyPattern[beat] !== undefined) {
            this.playMelodyNote(this.melodyPattern[beat], time);
        }

        // Bass: play root on beats 0, 4, 8, 12 (every bar quarter)
        if (sub === 0 && beat % 2 === 0) {
            const chordIdx = Math.floor(beat / 4);
            const bassIdx = this.chordRoots[chordIdx];
            this.playBassNote(this.bassNotes[bassIdx], time);
        }

        // Harmony pad: sustained on beat 0 of each chord change
        if (sub === 0 && beat % 4 === 0) {
            const chordIdx = Math.floor(beat / 4);
            this.playHarmony(chordIdx, time);
        }

        // Drums
        const drum = this.drumPattern[step];
        if (drum) {
            if (drum.kick) this.playKick(time);
            if (drum.snare) this.playSnare(time);
            if (drum.hihat) this.playHihat(time);
        }
    }

    playMelodyNote(freq, time) {
        this.fmVoice.play(this.ctx, {
            carrierFreq: freq,
            carrierType: 'sine',
            modRatio: 2,
            modIndex: 2.5,
            modDecay: 0.15,
            modIndexEnd: 0.3,
            duration: this.beatDuration * 0.8,
            envelope: { attack: 0.01, decay: 0.06, sustain: 0.25, release: 0.08, peak: 0.18 }
        }, this.destination, time);
    }

    playBassNote(freq, time) {
        this.fmVoice.play(this.ctx, {
            carrierFreq: freq,
            carrierType: 'square',
            modRatio: 1,
            modIndex: 4,
            modDecay: 0.2,
            modIndexEnd: 0.5,
            duration: this.beatDuration * 1.8,
            envelope: { attack: 0.01, decay: 0.1, sustain: 0.2, release: 0.15, peak: 0.15 }
        }, this.destination, time);
    }

    playHarmony(chordIdx, time) {
        const tones = this.chordTones[chordIdx];
        tones.forEach(t => {
            const freq = this.scale[t + 5]; // octave 1
            this.fmVoice.play(this.ctx, {
                carrierFreq: freq,
                carrierType: 'sine',
                modRatio: 3,
                modIndex: 1,
                modDecay: 0.5,
                modIndexEnd: 0.2,
                duration: this.beatDuration * 3.5,
                envelope: { attack: 0.1, decay: 0.3, sustain: 0.08, release: 0.5, peak: 0.07 }
            }, this.destination, time);
        });
    }

    playKick(time) {
        // FM kick: sine carrier with pitch sweep down
        this.fmVoice.play(this.ctx, {
            carrierFreq: 55,
            carrierType: 'sine',
            modRatio: 2,
            modIndex: 4,
            modDecay: 0.05,
            pitchStart: 150,
            pitchEnd: 40,
            pitchTime: 0.08,
            duration: 0.15,
            envelope: { attack: 0.003, decay: 0.06, sustain: 0.05, release: 0.08, peak: 0.3 }
        }, this.destination, time);
    }

    playSnare(time) {
        // FM body + noise
        this.fmVoice.play(this.ctx, {
            carrierFreq: 200,
            carrierType: 'sine',
            modRatio: 3.7,
            modIndex: 5,
            modDecay: 0.04,
            duration: 0.1,
            envelope: { attack: 0.002, decay: 0.04, sustain: 0.02, release: 0.05, peak: 0.15 }
        }, this.destination, time);
        playNoise(this.ctx, {
            duration: 0.1,
            filterType: 'highpass',
            filterFreq: 2000,
            volume: 0.12
        }, this.destination, time);
    }

    playHihat(time) {
        playNoise(this.ctx, {
            duration: 0.04,
            filterType: 'highpass',
            filterFreq: 7000,
            volume: 0.06
        }, this.destination, time);
    }
}

// --- AudioManager: public API ---
const AudioManager = {
    ctx: null,
    masterGain: null,
    sfxGain: null,
    musicGain: null,
    muted: false,
    volume: 0.7,
    sequencer: null,
    musicPlaying: false,
    _fmVoice: new FMVoice(),
    _lastPlayTimes: {},

    init() {
        if (this.ctx) {
            if (this.ctx.state === 'suspended') {
                this.ctx.resume();
            }
            return;
        }

        this.ctx = new (window.AudioContext || window.webkitAudioContext)();

        // Master gain
        this.masterGain = this.ctx.createGain();
        this.masterGain.connect(this.ctx.destination);

        // SFX bus
        this.sfxGain = this.ctx.createGain();
        this.sfxGain.gain.value = 0.7;
        this.sfxGain.connect(this.masterGain);

        // Music bus
        this.musicGain = this.ctx.createGain();
        this.musicGain.gain.value = 0.3;
        this.musicGain.connect(this.masterGain);

        // Restore saved settings
        const savedVolume = localStorage.getItem('bsVolume');
        if (savedVolume !== null) this.setVolume(parseFloat(savedVolume));
        const savedMute = localStorage.getItem('bsMuted');
        if (savedMute === 'true') {
            this.muted = true;
            this.masterGain.gain.value = 0;
        }

        this.sequencer = new MusicSequencer(this.ctx, this.musicGain);
    },

    play(eventName) {
        if (!this.ctx || this.muted) return;
        if (this.ctx.state === 'suspended') return;

        const recipe = SFX_LIBRARY[eventName];
        if (!recipe) return;

        // Rate limiting
        const now = performance.now();
        const cooldown = recipe.cooldown || 0;
        if (cooldown > 0 && now - (this._lastPlayTimes[eventName] || 0) < cooldown) return;
        this._lastPlayTimes[eventName] = now;

        // Play all voices
        recipe.voices.forEach(voiceParams => {
            const delay = voiceParams.delay || 0;
            const startTime = this.ctx.currentTime + delay;
            this._fmVoice.play(this.ctx, voiceParams, this.sfxGain, startTime);
        });

        // Play noise component if defined
        if (recipe.noise) {
            playNoise(this.ctx, recipe.noise, this.sfxGain);
        }
    },

    startMusic() {
        if (!this.ctx || !this.sequencer) return;
        if (this.musicPlaying) this.sequencer.stop();
        this.sequencer.start();
        this.musicPlaying = true;
    },

    stopMusic() {
        if (!this.sequencer) return;
        this.sequencer.stop();
        this.musicPlaying = false;
    },

    setVolume(value) {
        this.volume = Math.max(0, Math.min(1, value));
        if (this.masterGain && !this.muted) {
            this.masterGain.gain.value = this.volume;
        }
        localStorage.setItem('bsVolume', this.volume);
    },

    toggleMute() {
        this.muted = !this.muted;
        if (this.masterGain) {
            this.masterGain.gain.value = this.muted ? 0 : this.volume;
        }
        localStorage.setItem('bsMuted', this.muted);
        return this.muted;
    },

    isMuted() {
        return this.muted;
    }
};
