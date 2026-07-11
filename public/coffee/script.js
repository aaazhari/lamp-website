function trackCoffeeEvent(eventName, data = {}) {
    window.parent.postMessage(
        {
            source: "coffee-game",
            event: eventName,
            data
        },
        window.location.origin
    );
}

const Game = {
    phases: ['grind', 'extract', 'steam', 'pour', 'result'],
    currentPhase: 0,
    scores: { grind: 0, extract: 0, steam: 0, pour: 0 },

    grindAmount: 0, grindSeconds: 0, extractionTime: 0, tempAmount: 0, pourAmount: 0,
    isActionActive: false, actionInterval: null,

    GRIND_ZONE_MIN: 78, GRIND_ZONE_MAX: 94,
    EXTRACT_ZONE_MIN: 65, EXTRACT_ZONE_MAX: 90,
    STEAM_ZONE_MIN: 65, STEAM_ZONE_MAX: 75,
    POUR_ZONE_MIN: 70, POUR_ZONE_MAX: 95,
    POUR_BASE_FILL: 85, // % of the cup already holding the pulled espresso shot before milk is poured

    hardFailed: false, failedStage: null,
    stageResolved: false, // true from the moment a stage passes/fails until the next screen is shown — blocks re-triggering the same control mid-transition
    gameStartedTracked: false,

    sounds: {},
    _steamWasGaining: false,

    preventZoom: function() {
        // Block iOS Safari's pinch-zoom gesture events (CSS touch-action doesn't cover these)
        document.addEventListener('gesturestart', (e) => e.preventDefault());
        document.addEventListener('gesturechange', (e) => e.preventDefault());
        document.addEventListener('gestureend', (e) => e.preventDefault());

        // Block any genuine two-finger touch from starting a native zoom,
        // regardless of which element it lands on
        document.addEventListener('touchstart', (e) => {
            if (e.touches.length > 1) e.preventDefault();
        }, { passive: false });
        document.addEventListener('touchmove', (e) => {
            if (e.touches.length > 1) e.preventDefault();
        }, { passive: false });

        // Block double-tap-to-zoom as a fallback (in case touch-action is
        // bypassed on some Android/Chrome builds that ignore the viewport meta tag)
        let lastTouchEnd = 0;
        document.addEventListener('touchend', (e) => {
            const now = Date.now();
            if (now - lastTouchEnd <= 300) e.preventDefault();
            lastTouchEnd = now;
        }, { passive: false });
    },

    init: function() {
        this.preventZoom();
        trackCoffeeEvent("coffee_game_loaded");

        this.bindHoldButton('btn-grind', 'grind');
        this.bindHoldButton('btn-extract', 'extract');
        this.bindPitcherDrag();
        this.bindPitcherPourDrag();

        this.initSounds();
        this.startBackgroundMusic();
        this.generateBeans();
        this.showScreen('grind');
    },

    initSounds: function() {
        // Swap these filenames if you'd rather use the freesound_community versions
        this.sounds.grind = new Audio('coffee grinder.mp3');
        this.sounds.extract = new Audio('espresso machine.mp3');
        this.sounds.steam = new Audio('milk steaming.mp3');
        this.sounds.pour = new Audio('coffee pouring.mp3');
        this.sounds.bgm = new Audio('CoffeeBackgroundMusic.mp3');
        this.sounds.bgm.loop = true;
        this.sounds.bgm.volume = 0.1;
        this.sounds.sparkle = new Audio('sparkle.mp3');
        this.sounds.fail = new Audio('fail.mp3');

        Object.entries(this.sounds).forEach(([key, a]) => {
            a.preload = 'auto';
            a.load();
            a.addEventListener('error', () => {
                console.error(`[audio] "${key}" failed to load (check filename/path):`, a.src, a.error);
            });
        });
    },

    // iOS Safari (and some Android browsers) require EACH individual Audio
    // element to receive its own play() call from inside a real user gesture
    // before it will play later from code (a setInterval, a mid-drag callback,
    // etc). Unlocking just one sound (e.g. bgm) does NOT unlock the others —
    // that's why only some sounds would work and others would fail silently
    // or only "sometimes" depending on gesture timing. This unlocks all of
    // them together on the very first touch of the page.
    // Primes a single Audio element so it's allowed to play later from
    // non-gesture code (a setInterval tick, etc). Only used for the steam
    // sound, since that's the only one not triggered directly inside a tap
    // or drag handler. Guarded so it never stomps on a real play() that may
    // have started for the same sound while this is still resolving.
    primeSound: function(sound, realFlagKey) {
        if(!sound) return;
        const originalVolume = sound.volume;
        sound.muted = true;
        sound.volume = 0;
        const p = sound.play();
        const restore = () => {
            if(this[realFlagKey]) {
                sound.muted = false;
                sound.volume = originalVolume;
                return;
            }
            sound.pause();
            try { sound.currentTime = 0; } catch (e) {}
            sound.muted = false;
            sound.volume = originalVolume;
        };
        if(p && typeof p.then === 'function') {
            p.then(restore).catch(restore);
        } else {
            restore();
        }
    },

    // Plays a sound from the start (or from `fromTime` seconds in if given).
    // Waits for metadata to load before seeking, since setting currentTime
    // too early can silently fail in some browsers.
    playSound: function(sound, fromTime) {
        if(!sound) return;
        const start = (typeof fromTime === 'number') ? fromTime : 0;
        const seekAndPlay = () => {
            try { sound.currentTime = start; } catch (e) {}
            const playPromise = sound.play();
            if(playPromise && typeof playPromise.catch === 'function') {
                playPromise.catch((err) => {
                    console.warn('[audio] play() rejected for', sound.src, err && err.message);
                });
            }
        };
        // Only pause first if it's actually playing — calling pause() on an
        // already-paused element right before play() is what tends to leave
        // iOS Safari's playback promise in a stuck state.
        if(!sound.paused) {
            sound.pause();
        }
        if(sound.readyState >= 1) {
            seekAndPlay();
        } else {
            sound.addEventListener('loadedmetadata', seekAndPlay, { once: true });
        }
    },

    stopSound: function(sound) {
        if(!sound) return;
        sound.pause();
        sound.currentTime = 0;
    },

    // Most browsers block audio.play() until the user has interacted with the
    // page. Try immediately; if that's rejected, retry once on the very first
    // pointerdown anywhere, then stop listening.
    startBackgroundMusic: function() {
        const bgm = this.sounds.bgm;
        if(!bgm) return;
        bgm.muted = true;
        bgm.play().catch(() => {});
        const unmute = () => {
            bgm.muted = false;
            bgm.play().catch(() => {});
            document.removeEventListener('pointerdown', unmute);
        };
        document.addEventListener('pointerdown', unmute, { once: true });
    },

    generateBeans: function() {
        const hopper = document.getElementById('grind-beans-bg');
        for(let i=0; i<30; i++) {
            let bean = document.createElement('div');
            bean.className = 'bean';
            bean.style.left = (Math.random() * 100 + 5) + 'px';
            bean.style.top = (Math.random() * 70 + 5) + 'px';
            bean.style.transform = `rotate(${Math.random() * 360}deg)`;
            hopper.appendChild(bean);
        }
    },

    bindHoldButton: function(btnId, action) {
        const el = document.getElementById(btnId);
        if(!el) return;
    
        const startHolding = (e) => {
            e.preventDefault();
    
            if(this.stageResolved || this.isActionActive) return;
    
            if(!this.gameStartedTracked) {
                this.gameStartedTracked = true;
                trackCoffeeEvent("coffee_game_start", { stage: action });
            }
    
            el.setPointerCapture(e.pointerId);
            this.startAction(action);
        };
    
        const stopHolding = (e) => {
            e.preventDefault();
    
            if(!this.isActionActive || this.stageResolved) return;
    
            try {
                el.releasePointerCapture(e.pointerId);
            } catch(error) {}
    
            this.stopAction(action);
        };
    
        el.addEventListener("pointerdown", startHolding);
        el.addEventListener("pointerup", stopHolding);
        el.addEventListener("pointercancel", stopHolding);
    },

    bindPitcherPourDrag: function() {
        const pp = document.getElementById('pour-pitcher-wrap');
        const stream = document.getElementById('pour-stream');
        
        this.pourDrag = { active: false, startX: 0, startY: 0, px: 0, py: 0, cx: 0, cy: 0 };
        
        const ppDown = (e) => {
            if(!document.getElementById('screen-pour').classList.contains('active')) return;
            if(this.stageResolved) return;
            e.preventDefault();
            this.pourDrag.active = true;
            this.pourDrag.startX = e.clientX;
            this.pourDrag.startY = e.clientY;
            this.pourDrag.cx = this.pourDrag.px;
            this.pourDrag.cy = this.pourDrag.py;
            pp.setPointerCapture(e.pointerId);
            pp.style.cursor = 'grabbing';
            pp.style.transform = `translate(${this.pourDrag.px}px, ${this.pourDrag.py}px) rotate(-55deg)`;
            stream.style.transform = `translate(${this.pourDrag.px}px, ${this.pourDrag.py}px)`;
            this.startAction('pour');
        };
        const ppMove = (e) => {
            if(!this.pourDrag.active) return;
            e.preventDefault();
            let dx = e.clientX - this.pourDrag.startX;
            let dy = e.clientY - this.pourDrag.startY;
            let nx = this.pourDrag.px + dx;
            let ny = this.pourDrag.py + dy;
            nx = Math.max(-110, Math.min(80, nx));
            ny = Math.max(-80, Math.min(100, ny));
            this.pourDrag.cx = nx;
            this.pourDrag.cy = ny;
            pp.style.transform = `translate(${nx}px, ${ny}px) rotate(-55deg)`;
            stream.style.transform = `translate(${nx}px, ${ny}px)`;
        };
        const ppUp = (e) => {
            if(!this.pourDrag.active) return;
            e.preventDefault();
            this.pourDrag.active = false;
            this.pourDrag.px = this.pourDrag.cx;
            this.pourDrag.py = this.pourDrag.cy;
            pp.releasePointerCapture(e.pointerId);
            pp.style.cursor = 'grab';
            pp.style.transform = `translate(${this.pourDrag.px}px, ${this.pourDrag.py}px) rotate(0deg)`;
            stream.style.transform = `translate(${this.pourDrag.px}px, ${this.pourDrag.py}px)`;
            this.stopAction('pour');
        };
        // Same reasoning as the steam pitcher: a pointercancel is the
        // browser interrupting the gesture, not a deliberate release. The
        // pour is interval-driven (not paused/resumed by dragging), so just
        // snap the pitcher graphic back to neutral and keep pouring — don't
        // call stopAction here.
        const ppCancel = (e) => {
            if(!this.pourDrag.active) return;
            e.preventDefault();
            this.pourDrag.active = false;
            this.pourDrag.px = this.pourDrag.cx;
            this.pourDrag.py = this.pourDrag.cy;
            try { pp.releasePointerCapture(e.pointerId); } catch(err) {}
            pp.style.cursor = 'grab';
            pp.style.transform = `translate(${this.pourDrag.px}px, ${this.pourDrag.py}px) rotate(0deg)`;
            stream.style.transform = `translate(${this.pourDrag.px}px, ${this.pourDrag.py}px)`;
        };

        pp.addEventListener('pointerdown', ppDown);
        pp.addEventListener('pointermove', ppMove);
        pp.addEventListener('pointerup', ppUp);
        pp.addEventListener('pointercancel', ppCancel);
    },

    showScreen: function(id) {
        document.querySelectorAll('.screen').forEach((screen) => {
            screen.classList.remove('active');
        });
    
        document.getElementById('screen-' + id).classList.add('active');
    
        const replayBtn = document.getElementById('btn-replay');
    
        if (replayBtn) {
            replayBtn.style.display = 'none';
        }
    },

    nextPhase: function() {
        this.stageResolved = false;
        this.currentPhase++;
        const phaseName = this.phases[this.currentPhase];
        this.showScreen(phaseName);

        if (phaseName === 'steam') {
            this.startSteamLoop();
        } else if (phaseName === 'result') {
            this.calculateFinalRank();
        }
    },

    startAction: function(type) {
        if(this.isActionActive) return;
        this.isActionActive = true;

        if(type === 'grind') {
            document.getElementById('grind-fall').style.height = "55px";
            this.playSound(this.sounds.grind);
            const btn = document.getElementById('btn-grind');
            const label = document.getElementById('grind-label');
            btn.classList.remove('state-off');
            btn.classList.add('state-on');
            label.innerText = 'ON';
            this.actionInterval = setInterval(() => {
                this.grindAmount += 1.5;
                this.grindSeconds += 0.1;
                if(this.grindAmount > 100) this.grindAmount = 100;

                document.getElementById('grind-timer').innerText = this.grindSeconds.toFixed(1);
                document.getElementById('grind-fill').style.width = this.grindAmount + '%';
                const pile = document.getElementById('grind-pile');
                const pileW = this.grindAmount * 0.74;
                const pileH = this.grindAmount * 0.32;
                pile.style.width = pileW + 'px';
                pile.style.height = pileH + 'px';

                if(this.grindAmount >= this.GRIND_ZONE_MIN && this.grindAmount <= this.GRIND_ZONE_MAX) {
                    btn.classList.add('state-zone');
                    label.innerText = 'RELEASE!';
                } else {
                    btn.classList.remove('state-zone');
                    label.innerText = 'ON';
                }

                if(this.grindAmount === 100) {
                    this.stopAction('grind');
                }
            }, 40);
        }
        else if(type === 'extract') {
            document.getElementById('stream').style.height = "70px";
            document.getElementById('stream-2').style.height = "70px";
            this.playSound(this.sounds.extract);
            const extractBtn = document.getElementById('btn-extract');
            const extractLabel = document.getElementById('extract-label');
            extractBtn.classList.remove('state-off');
            extractBtn.classList.add('state-on');
            extractLabel.innerText = 'ON';
            this.actionInterval = setInterval(() => {
                this.extractionTime += 1.2;
                if(this.extractionTime > 100) this.extractionTime = 100;

                document.getElementById('extract-fill').style.width = this.extractionTime + '%';
                document.getElementById('liquid').style.height = this.extractionTime + '%';

                let fill = document.getElementById('extract-fill');
                if(this.extractionTime > 65 && this.extractionTime < 90) {
                    fill.style.background = 'var(--accent-green)';
                } else if (this.extractionTime >= 90) {
                    fill.style.background = 'var(--accent-pink)';
                }

                if(this.extractionTime >= this.EXTRACT_ZONE_MIN && this.extractionTime <= this.EXTRACT_ZONE_MAX) {
                    extractBtn.classList.add('state-zone');
                    extractLabel.innerText = 'RELEASE!';
                } else {
                    extractBtn.classList.remove('state-zone');
                    extractLabel.innerText = 'ON';
                }
            }, 40);
        }
        else if (type === 'pour') {
            document.getElementById('pour-stream').style.height = "100px";
            this.playSound(this.sounds.pour);
            const hudText = document.getElementById('pour-hud-text');
            this.actionInterval = setInterval(() => {
                this.pourAmount += 1.2;
                if(this.pourAmount > 100) this.pourAmount = 100;
                
                document.getElementById('pour-fill').style.width = this.pourAmount + '%';
                
                let liquid = document.getElementById('pour-base-liquid');
                liquid.style.height = (this.POUR_BASE_FILL + (100 - this.POUR_BASE_FILL) * (this.pourAmount / 100)) + '%';
                liquid.style.backgroundColor = this.getPourColor(this.pourAmount);

                if(this.pourAmount >= 70 && this.pourAmount <= 95) {
                    hudText.style.color = 'var(--accent-red)';
                    hudText.innerText = 'Release Now!';
                } else {
                    hudText.style.color = 'var(--outline)';
                    hudText.innerText = 'Drag Pitcher to Pour';
                }

                if(this.pourAmount === 100) {
                    this.pourDrag.active = false;
                    const pp = document.getElementById('pour-pitcher-wrap');
                    pp.style.cursor = 'grab';
                    pp.style.transform = `translate(${this.pourDrag.px}px, ${this.pourDrag.py}px) rotate(0deg)`;
                    document.getElementById('pour-stream').style.transform = `translate(${this.pourDrag.px}px, ${this.pourDrag.py}px)`;
                    this.stopAction('pour');
                }
            }, 40);
        }
    },

    stopAction: function(type) {
        if(!this.isActionActive) return;
        this.isActionActive = false;
        this.stageResolved = true;
        clearInterval(this.actionInterval);

        if(type === 'grind') {
            document.getElementById('grind-fall').style.height = "0px";
            this.stopSound(this.sounds.grind);
            const btn = document.getElementById('btn-grind');
            const label = document.getElementById('grind-label');
            btn.classList.remove('state-zone', 'state-on');
            btn.classList.add('state-off');
            label.innerText = 'OFF';
            label.style.color = '';
            if(this.grindAmount < this.GRIND_ZONE_MIN || this.grindAmount > this.GRIND_ZONE_MAX) {
                if(this.grindAmount > 0) this.failGame('grind', label);
                return;
            }
            this.scores.grind = Math.max(0, 100 - Math.abs(86 - this.grindAmount) * 3);
            if(this.grindAmount > 0) setTimeout(() => this.nextPhase(), 700);
        }
        else if(type === 'extract') {
            document.getElementById('stream').style.height = "0px";
            document.getElementById('stream-2').style.height = "0px";
            this.stopSound(this.sounds.extract);
            const extractBtn = document.getElementById('btn-extract');
            const extractLabel = document.getElementById('extract-label');
            extractBtn.classList.remove('state-zone', 'state-on');
            extractBtn.classList.add('state-off');
            extractLabel.innerText = 'OFF';
            extractLabel.style.color = '';
            const extractHud = document.getElementById('extract-hud-text');
            if(this.extractionTime < this.EXTRACT_ZONE_MIN || this.extractionTime > this.EXTRACT_ZONE_MAX) {
                if(this.extractionTime > 0) this.failGame('extract', extractHud);
                return;
            }
            this.scores.extract = 100;
            setTimeout(() => this.nextPhase(), 900);
        }
        else if(type === 'pour') {
            document.getElementById('pour-stream').style.height = "0px";
            this.stopSound(this.sounds.pour);
            const hudText = document.getElementById('pour-hud-text');
            hudText.style.color = 'var(--outline)';
            hudText.innerText = 'Drag Pitcher to Pour';
            if(this.pourAmount < this.POUR_ZONE_MIN || this.pourAmount > this.POUR_ZONE_MAX) {
                if(this.pourAmount > 0) this.failGame('pour', hudText);
                return;
            }
            this.scores.pour = 100;
            if(this.pourAmount > 0) setTimeout(() => this.nextPhase(), 700);
        }
    },

    // Called when a stage is released outside its target zone — either past
    // it or short of it. Ends the game immediately and forces a bad rank on
    // the result screen, skipping any remaining stages.
    failGame: function(type, feedbackEl) {
        if(this.hardFailed) return;
        this.hardFailed = true;
        this.failedStage = type;
        this.scores[type] = 0;
        trackCoffeeEvent("coffee_game_fail", {
            stage: type
        });

        if(feedbackEl) {
            feedbackEl.innerText = 'Missed It!';
            feedbackEl.style.color = 'var(--accent-red)';
        }

        setTimeout(() => {
            this.currentPhase = this.phases.indexOf('result');
            this.showScreen('result');
            this.calculateFinalRank();
        }, 700);
    },

    bindPitcherDrag: function() {
        const pitcher = document.getElementById('pitcher-simple');
        this.pitcherPos = { x: 0, y: 0 }; 
        this.pitcherDragStart = { x: 0, y: 0, px: 0, py: 0 };
        this.pitcherDragging = false;
        this.pitcherAligned = false;

        const bounds = { x: 75, y: 70 }; 
        const restOffsetY = 26; 

        const applyPos = () => {
            const ty = restOffsetY + this.pitcherPos.y;
            pitcher.style.transform = `translate(calc(-50% + ${this.pitcherPos.x}px), calc(-50% + ${ty}px))`;
            const dx = Math.abs(this.pitcherPos.x);
            const dy = Math.abs(this.pitcherPos.y);
            this.pitcherAligned = dx < 24 && dy < 20;
            pitcher.classList.toggle('aligned', this.pitcherAligned);
        };

        const onDown = (e) => {
            if(!document.getElementById('screen-steam').classList.contains('active')) return;
            if(this.stageResolved) return;
            e.preventDefault();
            this.pitcherDragging = true;
            this.pitcherDragStart = { x: e.clientX, y: e.clientY, px: this.pitcherPos.x, py: this.pitcherPos.y };
            pitcher.classList.add('dragging');
            pitcher.setPointerCapture(e.pointerId);

            if(!this._steamPrimed) {
                this._steamPrimed = true;
                this.primeSound(this.sounds.steam, '_steamRealPlayStarted');
            }
        };
        const onMove = (e) => {
            if(!this.pitcherDragging) return;
            e.preventDefault();
            let nx = this.pitcherDragStart.px + (e.clientX - this.pitcherDragStart.x);
            let ny = this.pitcherDragStart.py + (e.clientY - this.pitcherDragStart.y);
            nx = Math.max(-bounds.x, Math.min(bounds.x, nx));
            ny = Math.max(-bounds.y, Math.min(bounds.y, ny));
            this.pitcherPos.x = nx;
            this.pitcherPos.y = ny;
            applyPos();
        };
        const onUp = (e) => {
            if(!this.pitcherDragging) return;
            this.pitcherDragging = false;
            pitcher.classList.remove('dragging');

            if(this.stageResolved) return;

            // Pulling the pitcher off the wand and letting go there ends
            // the phase early, same as releasing early on grind/pour —
            // as long as some steam progress had actually been made.
            if(document.getElementById('screen-steam').classList.contains('active') &&
               !this.pitcherAligned && this.tempAmount > 0) {
                this.finishSteam(this.tempAmount);
            }
        };
        // A pointercancel fires when the browser interrupts the gesture
        // (common on fast/erratic touch drags being mistaken for a scroll)
        // — it is NOT a deliberate release, so just drop the drag state and
        // leave the pitcher (and any in-progress steaming) exactly where it
        // was. Treating this the same as onUp was why quickly moving the
        // pitcher away and back could end the round unexpectedly.
        const onCancel = (e) => {
            this.pitcherDragging = false;
            pitcher.classList.remove('dragging');
        };

        pitcher.addEventListener('pointerdown', onDown);
        pitcher.addEventListener('pointermove', onMove);
        pitcher.addEventListener('pointerup', onUp);
        pitcher.addEventListener('pointercancel', onCancel);

        this.pitcherPos = { x: 60, y: 55 };
        applyPos();
    },

    startSteamLoop: function() {
        document.getElementById('heat-haze').classList.remove('active');
        this._steamWasGaining = false;
        this._steamGainingStreak = 0;
        this._steamLosingStreak = 0;
        this.steamInterval = setInterval(() => {
            const gaining = this.pitcherAligned;
            document.getElementById('heat-haze').classList.toggle('active', gaining);

            // Steaming sound: starts at 0.46s once the pitcher holds alignment
            // for a few ticks in a row (not just one), and stops once it's been
            // out of alignment for a few ticks too. This small debounce absorbs
            // the natural finger jitter on touchscreens, which otherwise causes
            // rapid play/pause cycling that iOS Safari can silently drop.
            if(gaining) {
                this._steamGainingStreak++;
                this._steamLosingStreak = 0;
            } else {
                this._steamLosingStreak++;
                this._steamGainingStreak = 0;
            }
            if(this._steamGainingStreak === 2 && !this._steamWasGaining) {
                this._steamRealPlayStarted = true;
                this.playSound(this.sounds.steam, 0.46);
                this._steamWasGaining = true;
            } else if(this._steamLosingStreak === 2 && this._steamWasGaining) {
                this.stopSound(this.sounds.steam);
                this._steamWasGaining = false;
            }

            if(gaining) {
                this.tempAmount += 0.9;
            }
            if(this.tempAmount > 100) this.tempAmount = 100;
            if(this.tempAmount < 0) this.tempAmount = 0;

            document.getElementById('temp-fill').style.width = this.tempAmount + '%';

            const steamHud = document.getElementById('steam-hud-text');
            if(this.tempAmount >= this.STEAM_ZONE_MIN && this.tempAmount <= this.STEAM_ZONE_MAX) {
                steamHud.style.color = 'var(--accent-red)';
                steamHud.innerText = 'Release Now!';
            } else {
                steamHud.style.color = 'var(--outline)';
                steamHud.innerText = 'Move the Pitcher Under the Wand';
            }

            if(gaining && this.tempAmount > this.STEAM_ZONE_MAX) {
                this.finishSteam(this.tempAmount);
                return;
            }

            if(gaining) {
                const bubbleChance = 0.45 + (this.tempAmount / 100) * 0.5;
                if(Math.random() < bubbleChance) this.createMilkBubble();
                if(this.tempAmount > 60 && Math.random() < 0.4) this.createMilkBubble();
                if(this.tempAmount > 30 && Math.random() > 0.5) this.createSteamWisp();
            }
        }, 40);
    },

    // Shared wrap-up for the steam phase: called either when the milk's temp
    // rises past the target zone (overheated), or early — from
    // bindPitcherDrag's onUp — when the player pulls the pitcher off the wand
    // and lets go. `score` is whatever tempAmount had reached at that point.
    // Ending outside the target zone (too low or too high) is an immediate
    // hard fail, same as missing the zone on grind/extract/pour.
    finishSteam: function(score) {
        if(!this.steamInterval) return;
        this.stageResolved = true;
        clearInterval(this.steamInterval);
        this.steamInterval = null;
        this.stopSound(this.sounds.steam);

        if(score < this.STEAM_ZONE_MIN || score > this.STEAM_ZONE_MAX) {
            this.scores.steam = 0;
            this.failGame('steam', document.getElementById('steam-hud-text'));
            return;
        }
        this.scores.steam = 100;
        setTimeout(() => this.nextPhase(), 150);
    },

    createMilkBubble: function() {
        const g = document.getElementById('pg-bubbles');
        if(!g) return;
        const ns = 'http://www.w3.org/2000/svg';
        const circle = document.createElementNS(ns, 'circle');
        const cx = 32 + Math.random() * 76;
        const cy = 68 + Math.random() * 8;   
        const r  = 1.5 + Math.random() * (2 + this.tempAmount / 40);
        circle.setAttribute('cx', cx);
        circle.setAttribute('cy', cy);
        circle.setAttribute('r', r);
        circle.setAttribute('fill', 'rgba(255,255,255,0.75)');
        circle.setAttribute('stroke', 'rgba(180,160,120,0.3)');
        circle.setAttribute('stroke-width', '0.5');
        g.appendChild(circle);
        let frame = 0;
        const anim = setInterval(() => {
            frame++;
            const progress = frame / 18;
            circle.setAttribute('r', r * (1 + progress * 0.6));
            circle.setAttribute('fill', `rgba(255,255,255,${0.75 - progress * 0.75})`);
            if(frame >= 18) { clearInterval(anim); circle.remove(); }
        }, 55);
    },

    createSteamWisp: function() {
        const haze = document.getElementById('heat-haze');
        const w = document.createElement('div');
        w.className = 'steam-wisp';
        const size = Math.random() * 16 + 12;
        w.style.width = size + 'px';
        w.style.height = size + 'px';
        w.style.left = (Math.random() * 40 + 8) + 'px';
        w.style.bottom = (Math.random() * 8) + 'px';
        haze.appendChild(w);
        setTimeout(() => w.remove(), 1800);
    },

    // Interpolates the cup liquid color from dark espresso to a light latte tone
    // as milk is poured in, so the dark "OVERDOSE" logo hidden underneath
    // gradually gains contrast and becomes visible.
    getPourColor: function(amount) {
        const t = Math.min(1, Math.max(0, amount / 100));
        const start = [74, 44, 26];    // --coffee-dark
        const end   = [219, 184, 143]; // light milky latte tone
        const r = Math.round(start[0] + (end[0] - start[0]) * t);
        const g = Math.round(start[1] + (end[1] - start[1]) * t);
        const b = Math.round(start[2] + (end[2] - start[2]) * t);
        return `rgb(${r}, ${g}, ${b})`;
    },

    spawnConfetti: function() {
        const colors = ['var(--accent-green)', 'var(--accent-yellow)', 'var(--accent-pink)', 'var(--accent-red)', '#C9A6D9'];
        const container = document.getElementById('game-container');
        for(let i = 0; i < 28; i++) {
            setTimeout(() => {
                const piece = document.createElement('div');
                piece.className = 'confetti-piece';
                piece.style.left = (Math.random() * 100) + '%';
                piece.style.top = '-10px';
                piece.style.background = colors[Math.floor(Math.random() * colors.length)];
                piece.style.width = (8 + Math.random() * 8) + 'px';
                piece.style.height = (8 + Math.random() * 8) + 'px';
                piece.style.animationDelay = (Math.random() * 0.6) + 's';
                piece.style.animationDuration = (2 + Math.random() * 1.5) + 's';
                container.appendChild(piece);
                setTimeout(() => piece.remove(), 4000);
            }, i * 40);
        }
    },

    calculateFinalRank: function() {
        const s = this.scores;
        let total = Math.round((s.grind + s.extract + s.steam + s.pour) / 4);
        if(this.hardFailed) total = 15; // missing a target zone always ranks as Poor
        trackCoffeeEvent("coffee_game_result", {
            total,
            failed: this.hardFailed,
            failedStage: this.failedStage
        });

        let rank, rankColor, rankBg, totalLabel;
        const replayBtn = document.getElementById("btn-replay");
        if(total >= 80) {
            rank = 'S'; rankColor = '#FFFFFF'; rankBg = 'var(--accent-green)'; totalLabel = 'Excellent';
        } else if(total >= 65) {
            rank = 'A'; rankColor = '#FFFFFF'; rankBg = '#B07DC7'; totalLabel = 'Good';
        } else if(total >= 50) {
            rank = 'B'; rankColor = 'var(--outline)'; rankBg = 'var(--accent-yellow)'; totalLabel = 'Fair';
        } else {
            rank = 'C'; rankColor = '#FFFFFF'; rankBg = 'var(--accent-red)'; totalLabel = 'Poor';
        }

        document.getElementById('s-total').innerText = totalLabel;

        const badge = document.getElementById('rank-badge');
        badge.style.background = rankBg;
        document.getElementById('rank-letter').innerText = rank;
        document.getElementById('rank-letter').style.color = rankColor;

        const isGood = total >= 60;

        const headline = document.getElementById('verdict-headline');
        const sub = document.getElementById('verdict-sub');
        const bubble = document.getElementById('verdict-bubble');
        const inviteLabel = document.getElementById('invite-label');
        const invitePin = document.getElementById('invite-pin');

        if(isGood) {
            bubble.style.background = '#FFF0F8';
            bubble.style.borderColor = '#FF3DA0';
            headline.innerText = 'Impressive work. You have a natural feel for the craft.';
            sub.innerText = 'Your extraction was dialed in and your technique shows real attention to detail. That is exactly the standard we hold at Overdose. Come experience it in person.';
            inviteLabel.innerText = 'Join Us';
            invitePin.innerText = '📍';
            this.playSound(this.sounds.sparkle);
            this.spawnConfetti();
            const invitation = document.querySelector(".result-invitation-image");
if (invitation) {
    invitation.animate(
        [
            { opacity: 0, transform: "scale(0.92)" },
            { opacity: 1, transform: "scale(1)" }
        ],
        {
            duration: 700,
            easing: "ease-out",
            fill: "forwards"
        }
    );
}
            if (replayBtn) {
                replayBtn.style.display = "none";
            }
        } else {
            bubble.style.background = '#FFE4F0';
            bubble.style.borderColor = '#E8327A';
            headline.innerText = 'There is room for improvement — quite a bit of it.';
            if(this.hardFailed) {
                const stageLabels = { grind: 'grind', extract: 'extraction', steam: 'milk steaming', pour: 'pour' };
                const label = stageLabels[this.failedStage] || 'technique';
                sub.innerText = `You missed the target zone on the ${label} — that one mistake threw off the whole cup. The good news: Overcamp is exactly the place to sharpen that up.`;
            } else {
                sub.innerText = 'The grind was uneven, the extraction needed work, and the pour left something to be desired. The good news: Overcamp is exactly the place to turn that around.';
            }
            inviteLabel.innerText = 'Come Learn From Us';
            invitePin.innerText = '📍';
            this.playSound(this.sounds.fail);
            if (replayBtn) {
                replayBtn.style.display = "block";
            }
        }
    }
};

window.onload = () => Game.init();