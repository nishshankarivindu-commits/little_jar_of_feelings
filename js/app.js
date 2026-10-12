class Synthesizer {
      constructor() {
        this.ctx = null;
        this.enabled = true;
        this.ambientStarted = false;
        this.ambientTimer = null;
      }

      init() {
        if (!this.ctx) {
          const AudioContext = window.AudioContext || window.webkitAudioContext;
          if (AudioContext) {
            this.ctx = new AudioContext();
          }
        }
        if (this.ctx && this.ctx.state === "suspended") {
          this.ctx.resume();
        }
      }

      toggle() {
        this.enabled = !this.enabled;
        if (this.enabled) {
            this.startAmbient();
        } else {
            this.stopAmbient();
        }
        return this.enabled;
      }

      play(freq, type, start, duration, volume = 0.12) {
        if (!this.enabled || !this.ctx) return;
        try {
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = type;
          osc.frequency.setValueAtTime(freq, start);
          
          gain.gain.setValueAtTime(0, start);
          gain.gain.linearRampToValueAtTime(volume, start + 0.02);
          gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);

          osc.connect(gain);
          gain.connect(this.ctx.destination);

          osc.start(start);
          osc.stop(start + duration);
        } catch (e) {}
      }

      // Sweet magical glissando for unrolling the paper
      chimeUnroll() {
        this.init();
        if (!this.enabled || !this.ctx) return;
        const t = this.ctx.currentTime;
        
        // A gentle, harp-like sweep (Pentatonic scale)
        const scale = [392.00, 440.00, 523.25, 659.25, 783.99, 1046.50]; 
        scale.forEach((freq, i) => {
            this.play(freq, 'sine', t + (i * 0.05), 0.25, 0.06);
        });
        
        // Final sweet sparkle
        this.play(1318.51, 'sine', t + (scale.length * 0.05), 0.4, 0.08); 
      }

      chimeTap() {
        this.init();
        if (!this.enabled || !this.ctx) return;
        const t = this.ctx.currentTime;
        this.play(659.25, 'sine', t, 0.12, 0.15); // E5
        this.play(987.77, 'sine', t + 0.06, 0.2, 0.11); // B5
      }

      chimeShuffle() {
        this.init();
        if (!this.enabled || !this.ctx) return;
        const t = this.ctx.currentTime;
        this.play(880.00, 'sine', t, 0.1, 0.12); // A5
        this.play(1318.51, 'sine', t + 0.05, 0.22, 0.1); // E6
      }

      chimeClose() {
        this.init();
        if (!this.enabled || !this.ctx) return;
        const t = this.ctx.currentTime;
        this.play(587.33, 'sine', t, 0.14, 0.08); // D5
        this.play(392.00, 'sine', t + 0.06, 0.22, 0.07); // G4
      }

      // BACKGROUND AMBIENT SOUND - Calm, sweet, generative pentatonic waves
      playAmbientNote() {
        if (!this.enabled || !this.ctx) return;
        // C Major Pentatonic (C4, D4, E4, G4, A4, C5)
        const notes = [261.63, 293.66, 329.63, 392.00, 440.00, 523.25]; 
        const freq = notes[Math.floor(Math.random() * notes.length)];
        
        const t = this.ctx.currentTime;
        try {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, t);
            
            // Very slow attack and slow release for ambient drone pad
            gain.gain.setValueAtTime(0, t);
            gain.gain.linearRampToValueAtTime(0.012, t + 2.0); // Very quiet
            gain.gain.linearRampToValueAtTime(0, t + 6.0);
            
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            
            osc.start(t);
            osc.stop(t + 6.0);
        } catch(e) {}
        
        // Loop randomly every 1.5 to 3.5 seconds
        this.ambientTimer = setTimeout(() => this.playAmbientNote(), 1500 + Math.random() * 2000);
      }

      startAmbient() {
        this.init();
        if (this.ambientStarted || !this.enabled) return;
        this.ambientStarted = true;
        this.playAmbientNote();
      }

      stopAmbient() {
        if (this.ambientTimer) {
            clearTimeout(this.ambientTimer);
        }
        this.ambientStarted = false;
      }
    }

    const synth = new Synthesizer();

    const dom = {
      audioSwitch: document.getElementById('audioSwitch'),
      audioGlyph: document.getElementById('audioGlyph'),
      audioStatus: document.getElementById('audioStatus'),
      overlayCard: document.getElementById('overlayCard'),
      paperView: document.getElementById('paperView'),
      circleIcon: document.getElementById('circleIcon'),
      headerCategory: document.getElementById('headerCategory'),
      combIndex: document.getElementById('combIndex'),
      modalText: document.getElementById('modalText'),
      btnAbort: document.getElementById('btnAbort'),
      btnShuffle: document.getElementById('btnShuffle'),
      btnCloseTop: document.getElementById('btnCloseTop')
    };

    let targetKey = null;
    let indexArray = null;

    function createCombination(categoryKey) {
      const cat = CATEGORIES_DATA[categoryKey];
      if (!cat) return [0, 0, 0, 0];

      let attempts = 0;
      let check;
      do {
        const a = Math.floor(Math.random() * 10);
        const b = Math.floor(Math.random() * 10);
        const c = Math.floor(Math.random() * 10);
        const d = Math.floor(Math.random() * 10);
        check = [a, b, c, d];
        attempts++;
      } while (
        indexArray && 
        indexArray[0] === check[0] &&
        indexArray[1] === check[1] &&
        indexArray[2] === check[2] &&
        indexArray[3] === check[3] &&
        attempts < 10
      );

      return check;
    }

    function generateCuteNote(categoryKey, check) {
      const cat = CATEGORIES_DATA[categoryKey];
      const [a, b, c, d] = check;
      return `${cat.A[a]} ${cat.B[b]} ${cat.C[c]} ${cat.D[d]}`;
    }

    function findTagIndex(check) {
      const [a, b, c, d] = check;
      return (a * 1000) + (b * 100) + (c * 10) + d + 1;
    }

    function triggerModal(categoryKey) {
      targetKey = categoryKey;
      const cat = CATEGORIES_DATA[categoryKey];
      if (!cat) return;

      indexArray = createCombination(categoryKey);
      const numericalNo = findTagIndex(indexArray);

      dom.circleIcon.textContent = cat.icon;
      dom.circleIcon.style.background = cat.bg_color;
      dom.circleIcon.style.color = cat.text_color;
      dom.headerCategory.textContent = cat.title;
      dom.combIndex.textContent = `Note #${numericalNo.toLocaleString()} / 10,000`;
      dom.modalText.textContent = generateCuteNote(categoryKey, indexArray);

      // Reset unroll animation
      dom.paperView.style.animation = 'none';
      dom.paperView.offsetHeight; 
      dom.paperView.style.animation = null;

      dom.overlayCard.classList.add('visible');
      synth.chimeUnroll(); // Sweet magical harp glissando
    }

    function triggerShuffle() {
      if (!targetKey) return;
      synth.chimeShuffle();

      dom.modalText.classList.add('fading');

      setTimeout(() => {
        indexArray = createCombination(targetKey);
        const numericalNo = findTagIndex(indexArray);

        dom.combIndex.textContent = `Note #${numericalNo.toLocaleString()} / 10,000`;
        dom.modalText.textContent = generateCuteNote(targetKey, indexArray);
        dom.modalText.classList.remove('fading');
      }, 160);
    }

    function dismissModal() {
      if (!dom.overlayCard.classList.contains('visible')) return;
      synth.chimeClose();
      dom.overlayCard.classList.remove('visible');
    }

    document.querySelectorAll('.bottle-embedded-tag').forEach(badge => {
      badge.addEventListener('click', () => {
        // Start background ambient music on very first user interaction if not started!
        synth.startAmbient();
        
        const catKey = badge.getAttribute('data-category');
        badge.classList.add('tugging');
        synth.chimeTap();

        setTimeout(() => {
          badge.classList.remove('tugging');
          triggerModal(catKey);
        }, 300);
      });
    });

    dom.btnAbort.addEventListener('click', dismissModal);
    dom.btnCloseTop.addEventListener('click', dismissModal);
    dom.btnShuffle.addEventListener('click', triggerShuffle);

    dom.overlayCard.addEventListener('click', (e) => {
      if (e.target === dom.overlayCard) dismissModal();
    });

    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') dismissModal();
    });

    dom.audioSwitch.addEventListener('click', () => {
      const isPlayable = synth.toggle();
      dom.audioGlyph.textContent = isPlayable ? '🔔' : '🔕';
      dom.audioStatus.textContent = isPlayable ? 'Sound On' : 'Sound Muted';
    });