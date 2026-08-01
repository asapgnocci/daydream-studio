// Load YouTube IFrame Player API script dynamically
const tag = document.createElement('script');
tag.src = "https://www.youtube.com/iframe_api";
const firstScriptTag = document.getElementsByTagName('script')[0];
firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

let ytPlayer = null;

function onYouTubeIframeAPIReady() {
    initYouTubePlayer();
}

function initYouTubePlayer() {
    if (ytPlayer || !window.YT || !window.YT.Player) return;
    
    const ytElem = document.getElementById('youtube-player');
    if (!ytElem) return;

    try {
        ytPlayer = new YT.Player('youtube-player', {
            height: '100%',
            width: '100%',
            playerVars: {
                'autoplay': 1,
                'controls': 0,
                'modestbranding': 1,
                'rel': 0,
                'enablejsapi': 1,
                'playsinline': 1
            },
            events: {
                'onReady': (e) => {
                    const slider = document.getElementById('top-volume-slider');
                    const initialVol = slider ? parseFloat(slider.value) * 100 : 100;
                    if (e.target && typeof e.target.setVolume === 'function') {
                        try { e.target.setVolume(initialVol); } catch (err) {}
                    }
                },
                'onStateChange': (e) => {
                    if (window.activePlayerInstance === 'youtube') {
                        if (e.data === YT.PlayerState.PLAYING) {
                            window.isAppPlaying = true;
                        } else if (e.data === YT.PlayerState.PAUSED || e.data === YT.PlayerState.ENDED) {
                            window.isAppPlaying = false;
                        }
                        if (typeof window.updateGlobalPlayButtonState === 'function') {
                            window.updateGlobalPlayButtonState();
                        }
                    }
                }
            }
        });
    } catch (err) {
        console.warn("YouTube Player initialization deferred:", err);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    // --- State Management ---
    let activePlayer = 'soundcloud';
    let isPlaying = false;

    window.activePlayerInstance = activePlayer;
    window.isAppPlaying = isPlaying;
    
    function updateGlobalPlayButtonState() {
        const symbol = window.isAppPlaying ? "❚❚" : "▶";
        if (topPlayBtn) topPlayBtn.textContent = symbol;
        if (scPlayBtn) scPlayBtn.textContent = symbol;
    }
    window.updateGlobalPlayButtonState = updateGlobalPlayButtonState;

    const scrim = document.getElementById('scrim');
    const closeButtons = document.querySelectorAll('.modal-close-btn');
    const modals = document.querySelectorAll('.custom-modal');
    const pins = document.querySelectorAll('.hotspot-pin');

    const modalMusic = document.getElementById('modal-music');
    const modalTv = document.getElementById('modal-tv');
    const modalBoard = document.getElementById('modal-board');

    const fxTitle = document.getElementById('fx-title');
    const fxStatus = document.getElementById('fx-status');
    const gbaPlayBtn = document.getElementById('gba-play-btn');
    const gbaPrevBtn = document.getElementById('gba-prev-btn');
    const gbaNextBtn = document.getElementById('gba-next-btn');

    const topPlayBtn = document.getElementById('top-play-btn');
    const topPrevBtn = document.getElementById('top-prev-btn');
    const topNextBtn = document.getElementById('top-next-btn');
    const topVolumeSlider = document.getElementById('top-volume-slider');

    const scIframe = document.getElementById('soundcloud-player');
    const scPlayBtn = document.getElementById('sc-play-btn');
    const scPrevBtn = document.getElementById('sc-prev-btn');
    const scNextBtn = document.getElementById('sc-next-btn');
    const dynamicAlbumArt = document.getElementById('dynamic-album-art');

    // --- AUDIO CONTEXT & MASTER GAIN SETUP ---
    let masterGainNode = null;
    let audioCtx = null;

    function initAudioContext() {
        if (!audioCtx) {
            const AudioContextClass = window.AudioContext || window.webkitAudioContext;
            audioCtx = new AudioContextClass();
            masterGainNode = audioCtx.createGain();
            masterGainNode.connect(audioCtx.destination);
            const initialVol = topVolumeSlider ? parseFloat(topVolumeSlider.value) : 1;
            masterGainNode.gain.setValueAtTime(initialVol, audioCtx.currentTime);
        }
        if (audioCtx.state === 'suspended') {
            audioCtx.resume();
        }
    }
    
    initAudioContext();

    // --- YOUTUBE TV SETUP ---
    const tvPrevBtn = document.getElementById('tv-prev-btn');
    const tvNextBtn = document.getElementById('tv-next-btn');
    const tvChannelIndicator = document.getElementById('tv-channel-indicator');

    const tvVideoIds = [
        'xGC_kfgEieU', 'RcYHD8Dk388', 'd3zBZQ5OKrg', 'tF38EWOJq84', 
        '8B_xhNe11H4', 'OpMOZndLIfw', 'He3WL1RJer8', 'BVv9DZOBdjg', 
        'pbc5n7bbL8E', 'mydngHnHTmc', 'UNuUayim3kU', 'r3cPPfDqyRc', 
        'JzJ1qKqMKbo', '_N88rXpdrNs', 'FYJDebjJSvI'
    ];
    let currentTvIndex = 0;

    function loadYouTubeVideo(index) {
        currentTvIndex = (index + tvVideoIds.length) % tvVideoIds.length;
        const videoId = tvVideoIds[currentTvIndex];
        
        const currentVol = topVolumeSlider ? parseFloat(topVolumeSlider.value) * 100 : 100;

        if (ytPlayer && typeof ytPlayer.loadVideoById === 'function') {
            try {
                ytPlayer.loadVideoById(videoId);
                ytPlayer.setVolume(currentVol);
                ytPlayer.playVideo();
                setPlayingState(true);
            } catch (e) {
                fallbackLoadVideo(videoId);
            }
        } else {
            if (window.YT && window.YT.Player && !ytPlayer) {
                initYouTubePlayer();
            }
            setTimeout(() => {
                if (ytPlayer && typeof ytPlayer.loadVideoById === 'function') {
                    ytPlayer.loadVideoById(videoId);
                    ytPlayer.setVolume(currentVol);
                    ytPlayer.playVideo();
                    setPlayingState(true);
                }
            }, 500);
        }

        const channelNum = currentTvIndex + 1;
        const formattedCh = channelNum < 10 ? `CH 0${channelNum}` : `CH ${channelNum}`;
        if (tvChannelIndicator) {
            tvChannelIndicator.textContent = formattedCh;
        }
    }

    function fallbackLoadVideo(videoId) {
        setPlayingState(true);
    }

    function setPlayingState(state) {
        isPlaying = state;
        window.isAppPlaying = isPlaying;
        updateGlobalPlayButtonState();
    }

    let scWidget = null;

    function updateCurrentArtwork() {
        if (!scWidget || activePlayer !== 'soundcloud') return;
        try {
            scWidget.getCurrentSound((sound) => {
                if (sound && sound.artwork_url) {
                    const highResArt = sound.artwork_url.replace('-large.', '-t500x500.');
                    dynamicAlbumArt.src = highResArt;
                } else if (sound && sound.user && sound.user.avatar_url) {
                    dynamicAlbumArt.src = sound.user.avatar_url.replace('-large.', '-t500x500.');
                }
            });
        } catch (e) {}
    }

    if (scIframe && window.SC) {
        try {
            scWidget = SC.Widget(scIframe);
            
            scWidget.bind(SC.Widget.Events.READY, () => {
                const initialVol = topVolumeSlider ? parseFloat(topVolumeSlider.value) * 100 : 100;
                try { scWidget.setVolume(initialVol); } catch(err) {}
                updateCurrentArtwork();
            });

            scWidget.bind(SC.Widget.Events.PLAY_PROGRESS, () => {
                if (!dynamicAlbumArt.src) {
                    updateCurrentArtwork();
                }
            });

            scWidget.bind(SC.Widget.Events.PLAY, () => {
                if (activePlayer === 'soundcloud') {
                    setPlayingState(true);
                    updateCurrentArtwork();
                }
            });

            scWidget.bind(SC.Widget.Events.PAUSE, () => {
                if (activePlayer === 'soundcloud') {
                    setPlayingState(false);
                }
            });

            scWidget.bind(SC.Widget.Events.FINISH, () => {
                try { scWidget.next(); } catch(err) {}
            });

            scWidget.bind(SC.Widget.Events.ADVANCE, () => {
                updateCurrentArtwork();
            });
        } catch(err) {}
    }

    const soundList = [
        { name: '01. SYNTH PEEP', type: 'laser' },
        { name: '02. RETRO JUMP', type: 'jump' },
        { name: '03. POWER-UP', type: 'powerup' }
    ];
    let currentIndex = 0;

    function updateGbaDisplay() {
        if (fxTitle) fxTitle.textContent = soundList[currentIndex].name;
        if (fxStatus) fxStatus.textContent = (isPlaying && activePlayer === 'gba') ? 'PLAYING' : 'READY';
    }

    function openModal(modal) {
        if (!modal) return;
        closeAllModals();
        scrim.classList.add('active');
        modal.classList.add('active');
        
        if (modal === modalMusic) {
            activePlayer = 'soundcloud';
            window.activePlayerInstance = activePlayer;
            if (!scWidget && window.SC && scIframe) {
                try { scWidget = SC.Widget(scIframe); } catch(err) {}
            }
            updateCurrentArtwork();
            if (scWidget) {
                try {
                    scWidget.isPaused((paused) => {
                        setPlayingState(!paused);
                    });
                } catch(err) {}
            }
        } else if (modal === modalTv) {
            activePlayer = 'youtube';
            window.activePlayerInstance = activePlayer;
            if (scWidget) {
                try { scWidget.pause(); } catch (e) {}
            }
            const ytElem = document.getElementById('youtube-player');
            if (ytElem && !ytPlayer && window.YT && window.YT.Player) {
                initYouTubePlayer();
            }
            loadYouTubeVideo(currentTvIndex);
        } else if (modal === modalBoard) {
            activePlayer = 'gba';
            window.activePlayerInstance = activePlayer;
            if (scWidget) {
                try { scWidget.pause(); } catch (e) {}
            }
            updateGbaDisplay();
        }
    }

    function closeAllModals() {
        scrim.classList.remove('active');
        modals.forEach(modal => {
            modal.classList.remove('active');
        });
        
        if (ytPlayer && typeof ytPlayer.pauseVideo === 'function') {
            try { ytPlayer.pauseVideo(); } catch (e) {}
        }
        
        if (activePlayer !== 'soundcloud') {
            setPlayingState(false);
        }
        if (fxStatus) fxStatus.textContent = 'READY';
    }

    pins.forEach(pin => {
        pin.addEventListener('click', () => {
            if (pin.id === 'pin-music') openModal(modalMusic);
            else if (pin.id === 'pin-tv') openModal(modalTv);
            else if (pin.id === 'pin-board') openModal(modalBoard);
        });
    });

    if (scrim) scrim.addEventListener('click', closeAllModals);
    closeButtons.forEach(btn => btn.addEventListener('click', closeAllModals));

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closeAllModals();
    });

    function togglePlayPause() {
        initAudioContext();
        if (activePlayer === 'soundcloud') {
            if (!scWidget && window.SC && scIframe) {
                try { scWidget = SC.Widget(scIframe); } catch(err) {}
            }
            if (scWidget) {
                try {
                    scWidget.isPaused((paused) => {
                        if (paused) {
                            scWidget.play();
                            setPlayingState(true);
                        } else {
                            scWidget.pause();
                            setPlayingState(false);
                        }
                    });
                } catch(err) {}
            }
        } else if (activePlayer === 'youtube') {
            if (ytPlayer && typeof ytPlayer.getPlayerState === 'function') {
                try {
                    const state = ytPlayer.getPlayerState();
                    if (state === YT.PlayerState.PLAYING) {
                        ytPlayer.pauseVideo();
                        setPlayingState(false);
                    } else {
                        ytPlayer.playVideo();
                        setPlayingState(true);
                    }
                } catch (e) {
                    setPlayingState(!isPlaying);
                }
            } else {
                setPlayingState(!isPlaying);
            }
        } else if (activePlayer === 'gba') {
            playSynthSound(soundList[currentIndex].type);
        }
    }

    function handleNext() {
        if (activePlayer === 'soundcloud') {
            if (!scWidget && window.SC && scIframe) {
                try { scWidget = SC.Widget(scIframe); } catch(err) {}
            }
            if (scWidget) {
                try { scWidget.next(); } catch(err) {}
            }
        } else if (activePlayer === 'youtube') {
            loadYouTubeVideo(currentTvIndex + 1);
        } else if (activePlayer === 'gba') {
            currentIndex = (currentIndex + 1) % soundList.length;
            updateGbaDisplay();
            playSynthSound(soundList[currentIndex].type);
        }
    }

    function handlePrev() {
        if (activePlayer === 'soundcloud') {
            if (!scWidget && window.SC && scIframe) {
                try { scWidget = SC.Widget(scIframe); } catch(err) {}
            }
            if (scWidget) {
                try { scWidget.prev(); } catch(err) {}
            }
        } else if (activePlayer === 'youtube') {
            loadYouTubeVideo(currentTvIndex - 1);
        } else if (activePlayer === 'gba') {
            currentIndex = (currentIndex - 1 + soundList.length) % soundList.length;
            updateGbaDisplay();
            playSynthSound(soundList[currentIndex].type);
        }
    }

    if (topPlayBtn) topPlayBtn.addEventListener('click', togglePlayPause);
    if (topNextBtn) topNextBtn.addEventListener('click', handleNext);
    if (topPrevBtn) topPrevBtn.addEventListener('click', handlePrev);

    if (scPlayBtn) scPlayBtn.addEventListener('click', () => { activePlayer = 'soundcloud'; window.activePlayerInstance = activePlayer; togglePlayPause(); });
    if (scNextBtn) scNextBtn.addEventListener('click', () => { activePlayer = 'soundcloud'; window.activePlayerInstance = activePlayer; handleNext(); });
    if (scPrevBtn) scPrevBtn.addEventListener('click', () => { activePlayer = 'soundcloud'; window.activePlayerInstance = activePlayer; handlePrev(); });

    if (tvNextBtn) tvNextBtn.addEventListener('click', () => { activePlayer = 'youtube'; window.activePlayerInstance = activePlayer; handleNext(); });
    if (tvPrevBtn) tvPrevBtn.addEventListener('click', () => { activePlayer = 'youtube'; window.activePlayerInstance = activePlayer; handlePrev(); });

    if (gbaPlayBtn) gbaPlayBtn.addEventListener('click', () => { 
        activePlayer = 'gba'; 
        window.activePlayerInstance = activePlayer;
        playSynthSound(soundList[currentIndex].type); 
    });
    if (gbaNextBtn) gbaNextBtn.addEventListener('click', () => { activePlayer = 'gba'; window.activePlayerInstance = activePlayer; handleNext(); });
    if (gbaPrevBtn) gbaPrevBtn.addEventListener('click', () => { activePlayer = 'gba'; window.activePlayerInstance = activePlayer; handlePrev(); });

    if (topVolumeSlider) {
        topVolumeSlider.addEventListener('input', (e) => {
            const vol = parseFloat(e.target.value);
            const ytVol = vol * 100;
            
            initAudioContext();
            if (masterGainNode && audioCtx) {
                masterGainNode.gain.setValueAtTime(vol, audioCtx.currentTime);
            }

            if (scWidget) {
                try { scWidget.setVolume(ytVol); } catch (err) {}
            }

            if (ytPlayer && typeof ytPlayer.setVolume === 'function') {
                try { ytPlayer.setVolume(ytVol); } catch (err) {}
            }
        });
    }

    function playSynthSound(type) {
        initAudioContext();
        const now = audioCtx.currentTime;
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        
        osc.connect(gain);
        gain.connect(masterGainNode);

        if (type === 'laser') {
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(800, now);
            osc.frequency.exponentialRampToValueAtTime(100, now + 0.15);
            gain.gain.setValueAtTime(0.3, now);
            gain.gain.linearRampToValueAtTime(0.01, now + 0.15);
            osc.start(now);
            osc.stop(now + 0.15);
        } else if (type === 'jump') {
            osc.type = 'square';
            osc.frequency.setValueAtTime(150, now);
            osc.frequency.exponentialRampToValueAtTime(600, now + 0.2);
            gain.gain.setValueAtTime(0.2, now);
            gain.gain.linearRampToValueAtTime(0.01, now + 0.2);
            osc.start(now);
            osc.stop(now + 0.2);
        } else if (type === 'powerup') {
            osc.type = 'sine';
            osc.frequency.setValueAtTime(220, now);
            osc.frequency.setValueAtTime(330, now + 0.08);
            osc.frequency.setValueAtTime(440, now + 0.16);
            osc.frequency.setValueAtTime(660, now + 0.24);
            gain.gain.setValueAtTime(0.25, now);
            gain.gain.linearRampToValueAtTime(0.01, now + 0.35);
            osc.start(now);
            osc.stop(now + 0.35);
        }

        setPlayingState(true);
        if (fxStatus) {
            fxStatus.textContent = 'PLAYING';
            setTimeout(() => {
                if (fxStatus.textContent === 'PLAYING') {
                    fxStatus.textContent = 'READY';
                    setPlayingState(false);
                }
            }, 350);
        }
    }

    updateGbaDisplay();
});