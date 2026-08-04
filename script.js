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

    const vinylDisc = document.querySelector('.vinyl-disc');

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

    const tvPrevBtn = document.getElementById('tv-prev-btn');
    const tvNextBtn = document.getElementById('tv-next-btn');
    const tvChannelIndicator = document.getElementById('tv-channel-indicator');

    const tvVideoIds = [
        'tF38EWOJq84', 'RcYHD8Dk388', 'd3zBZQ5OKrg', 'xGC_kfgEieU', 
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
                setPlayingState(true);
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
                    if (vinylDisc) {
                        vinylDisc.classList.remove('paused');
                        vinylDisc.classList.add('spinning');
                    }
                }
            });

            scWidget.bind(SC.Widget.Events.PAUSE, () => {
                if (activePlayer === 'soundcloud') {
                    setPlayingState(false);
                    if (vinylDisc && vinylDisc.classList.contains('spinning')) {
                        vinylDisc.classList.add('paused');
                    }
                }
            });

            scWidget.bind(SC.Widget.Events.FINISH, () => {
                if (vinylDisc) {
                    vinylDisc.classList.remove('spinning', 'paused');
                }
                try { scWidget.next(); } catch(err) {}
            });

            scWidget.bind(SC.Widget.Events.ADVANCE, () => {
                if (vinylDisc) {
                    vinylDisc.classList.add('paused');
                }
                updateCurrentArtwork();
            });
        } catch(err) {}
    }

    const gbaCategories = [
        {
            name: "SFX",
            folder: "/SFX/SFX",
            files: [
                { name: '01. SYNTH PEEP', type: 'synth', subtype: 'laser' },
                { name: '02. RETRO JUMP', type: 'synth', subtype: 'jump' },
                { name: '03. POWER-UP', type: 'synth', subtype: 'powerup' }
            ]
        },
        {
            name: "Sound Design",
            folder: "/SFX/Sound Design",
            files: [
                { name: '01. AMBIENT DRONE', type: 'synth', subtype: 'powerup' },
                { name: '02. LOW RUMBLE', type: 'synth', subtype: 'laser' }
            ]
        },
        {
            name: "Live Recordings",
            folder: "/SFX",
            files: [
                { name: 'ATLANTA TRAFFIC', type: 'audio', path: './SFX/AtlantaTraffic.wav' },
                { name: 'BELTLINE', type: 'audio', path: './SFX/Beltline.wav' },
                { name: 'CAFETERIA', type: 'audio', path: './SFX/Cafeteria.wav' },
                { name: 'CITY PARK', type: 'audio', path: './SFX/CityPark.wav' },
                { name: 'COURTYARD', type: 'audio', path: './SFX/Courtyard.wav' },
                { name: 'ELECTRIC SCOOTERS', type: 'audio', path: './SFX/ElectricScooters.wav' },
                { name: 'ELEVATOR', type: 'audio', path: './SFX/Elevator.wav' },
                { name: 'GOLF CART', type: 'audio', path: './SFX/GolfCart.wav' },
                { name: 'LIGHT TRAFFIC', type: 'audio', path: './SFX/LightTraffic.wav' },
                { name: 'MARKETPLACE', type: 'audio', path: './SFX/Marketplace.wav' },
                { name: 'MEDIUM TRAFFIC', type: 'audio', path: './SFX/MediumTraffic.wav' },
                { name: 'MEN SCREAMING & LAUGHING', type: 'audio', path: './SFX/MenScreamingandLaughing.wav' },
                { name: 'MOTORCYCLE', type: 'audio', path: './SFX/Motorcycle.wav' },
                { name: 'OLD ELEVATOR', type: 'audio', path: './SFX/OldElevator.wav' },
                { name: 'OUTDOOR BASKETBALL CT', type: 'audio', path: './SFX/OutdoorBasketballCourt.wav' },
                { name: 'PARKING LOT', type: 'audio', path: './SFX/ParkingLot.wav' },
                { name: 'PLAYGROUND', type: 'audio', path: './SFX/Playground.wav' },
                { name: 'SIRENS', type: 'audio', path: './SFX/Sirens.wav' },
                { name: 'SKATEBOARDING', type: 'audio', path: './SFX/Skateboarding.wav' },
                { name: 'SUBURB PARK', type: 'audio', path: './SFX/SuburbPark.wav' },
                { name: 'TRAFFIC & DISTANT MUSIC', type: 'audio', path: './SFX/TrafficandDistantMusic.wav' }
            ]
        }
    ];

    let gbaState = 'main';
    let gbaCategoryIndex = 0;
    let gbaFileIndex = 0;
    const gbaScreenContainer = document.querySelector('.gba-screen');
    let currentAudioElement = null;

    function updateGbaDisplay() {
        if (!gbaScreenContainer) return;
        
        const bootScreen = document.getElementById('gba-boot-screen');
        
        Array.from(gbaScreenContainer.children).forEach(child => {
            if (child !== bootScreen) {
                child.remove();
            }
        });
        
        gbaScreenContainer.style.display = 'flex';
        gbaScreenContainer.style.flexDirection = 'column';
        gbaScreenContainer.style.overflowY = 'auto';
        gbaScreenContainer.style.overflowX = 'hidden';
        gbaScreenContainer.style.boxSizing = 'border-box';

        const itemsToRender = gbaState === 'main' ? gbaCategories : gbaCategories[gbaCategoryIndex].files;
        const activeIdx = gbaState === 'main' ? gbaCategoryIndex : gbaFileIndex;

        const listContainer = document.createElement('div');
        listContainer.className = 'gba-menu-list';
        listContainer.style.display = 'flex';
        listContainer.style.flexDirection = 'column';
        listContainer.style.width = '100%';

        itemsToRender.forEach((entry, idx) => {
            const item = document.createElement('div');
            const isActive = idx === activeIdx;
            item.className = `gba-menu-item ${isActive ? 'active' : ''}`;
            item.style.display = 'block';
            item.style.width = '100%';
            item.style.whiteSpace = 'nowrap';
            item.style.overflow = 'hidden';

            const displayText = `> ${entry.name}`;

            if (isActive && displayText.length > 18) {
                item.style.textOverflow = 'clip';
                const track = document.createElement('div');
                track.className = 'gba-marquee-track';
                track.style.display = 'inline-block';
                track.style.whiteSpace = 'nowrap';
                
                const span1 = document.createElement('span');
                span1.textContent = displayText;
                const span2 = document.createElement('span');
                span2.textContent = `     ${displayText}`;
                span2.style.marginLeft = '20px';

                track.appendChild(span1);
                track.appendChild(span2);
                item.appendChild(track);

                const dynamicKey = `marquee-${idx}-${Date.now()}`;
                const textWidthPx = displayText.length * 6;
                
                if (!document.getElementById('gba-dynamic-keyframes')) {
                    const styleElem = document.createElement('style');
                    styleElem.id = 'gba-dynamic-keyframes';
                    document.head.appendChild(styleElem);
                }
                
                const styleSheet = document.getElementById('gba-dynamic-keyframes');
                styleSheet.sheet.insertRule(`
                    @keyframes ${dynamicKey} {
                        0% { transform: translateX(0); }
                        100% { transform: translateX(-${textWidthPx + 20}px); }
                    }
                `, styleSheet.sheet.cssRules.length);

                track.style.animation = `${dynamicKey} 6s linear infinite`;
            } else {
                item.textContent = displayText;
            }

            listContainer.appendChild(item);
        });

        gbaScreenContainer.appendChild(listContainer);

        const activeItem = listContainer.querySelector('.gba-menu-item.active');
        if (activeItem) {
            gbaScreenContainer.scrollTop = activeItem.offsetTop - listContainer.offsetTop;
        }
    }

    function handleGbaUp() {
        if (gbaState === 'main') {
            gbaCategoryIndex = (gbaCategoryIndex - 1 + gbaCategories.length) % gbaCategories.length;
        } else if (gbaState === 'sub') {
            gbaFileIndex = (gbaFileIndex - 1 + gbaCategories[gbaCategoryIndex].files.length) % gbaCategories[gbaCategoryIndex].files.length;
        }
        updateGbaDisplay();
    }

    function handleGbaDown() {
        if (gbaState === 'main') {
            gbaCategoryIndex = (gbaCategoryIndex + 1) % gbaCategories.length;
        } else if (gbaState === 'sub') {
            gbaFileIndex = (gbaFileIndex + 1) % gbaCategories[gbaCategoryIndex].files.length;
        }
        updateGbaDisplay();
    }

    function handleGbaConfirm() {
        if (gbaState === 'main') {
            gbaState = 'sub';
            gbaFileIndex = 0;
            updateGbaDisplay();
        } else if (gbaState === 'sub') {
            activePlayer = 'gba';
            window.activePlayerInstance = activePlayer;
            const selectedFile = gbaCategories[gbaCategoryIndex].files[gbaFileIndex];
            
            if (selectedFile.type === 'audio') {
                playAudioFile(selectedFile.path);
            } else {
                playSynthSound(selectedFile.subtype);
            }
        }
    }

    function handleGbaBack() {
        if (gbaState === 'sub') {
            gbaState = 'main';
            updateGbaDisplay();
        }
    }

    function playAudioFile(filePath) {
        initAudioContext();
        if (currentAudioElement) {
            currentAudioElement.pause();
            currentAudioElement = null;
        }

        currentAudioElement = new Audio(filePath);
        const currentVol = topVolumeSlider ? parseFloat(topVolumeSlider.value) : 1;
        currentAudioElement.volume = currentVol;

        currentAudioElement.play().then(() => {
            setPlayingState(true);
        }).catch((err) => {
            console.warn("Audio playback error:", err);
        });

        currentAudioElement.addEventListener('ended', () => {
            setPlayingState(false);
        });
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
                        if (!paused && vinylDisc) {
                            vinylDisc.classList.remove('paused');
                            vinylDisc.classList.add('spinning');
                        }
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
            
            const bootScreen = document.getElementById('gba-boot-screen');
            const gbaControls = document.querySelector('.gba-interactive-controls');
            
            if (gbaControls) gbaControls.style.pointerEvents = 'none';
            if (bootScreen) {
                bootScreen.classList.add('active', 'play-animation');
            }

            setTimeout(() => {
                if (bootScreen) {
                    bootScreen.classList.remove('active', 'play-animation');
                }
                if (gbaControls) gbaControls.style.pointerEvents = 'auto';
                
                gbaState = 'main';
                gbaCategoryIndex = 0;
                updateGbaDisplay();
            }, 2050);
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

        if (currentAudioElement) {
            currentAudioElement.pause();
            currentAudioElement = null;
        }

        if (scWidget) {
            scWidget.isPaused((paused) => {
                if (paused && vinylDisc) {
                    vinylDisc.classList.remove('spinning', 'paused');
                }
            });
        } else if (vinylDisc) {
            vinylDisc.classList.remove('spinning', 'paused');
        }
        
        if (activePlayer !== 'soundcloud') {
            setPlayingState(false);
        }
        gbaState = 'main';
        gbaCategoryIndex = 0;
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
        if (activePlayer === 'gba' && modalBoard.classList.contains('active')) {
            const bootScreen = document.getElementById('gba-boot-screen');
            if (bootScreen && bootScreen.classList.contains('active')) return;

            if (e.key === 'ArrowUp') { handleGbaUp(); }
            if (e.key === 'ArrowDown') { handleGbaDown(); }
            if (e.key === 'Enter' || e.key === 'a' || e.key === 'A') { handleGbaConfirm(); }
            if (e.key === 'Backspace' || e.key === 'b' || e.key === 'B') { handleGbaBack(); }
        }
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
            handleGbaConfirm();
        }
    }

    function handleNext() {
        if (activePlayer === 'soundcloud') {
            if (!scWidget && window.SC && scIframe) {
                try { scWidget = SC.Widget(scIframe); } catch(err) {}
            }
            if (scWidget) {
                try {
                    scWidget.getSounds((sounds) => {
                        scWidget.getCurrentSoundIndex((currentIndex) => {
                            if (sounds && currentIndex < sounds.length - 1) {
                                if (vinylDisc) vinylDisc.classList.add('paused');
                                scWidget.next();
                            }
                        });
                    });
                } catch(err) {}
            }
        } else if (activePlayer === 'youtube') {
            loadYouTubeVideo(currentTvIndex + 1);
        } else if (activePlayer === 'gba') {
            if (gbaState === 'sub') {
                gbaFileIndex = (gbaFileIndex + 1) % gbaCategories[gbaCategoryIndex].files.length;
                updateGbaDisplay();
                const selectedFile = gbaCategories[gbaCategoryIndex].files[gbaFileIndex];
                if (selectedFile.type === 'audio') {
                    playAudioFile(selectedFile.path);
                } else {
                    playSynthSound(selectedFile.subtype);
                }
            } else {
                handleGbaDown();
            }
        }
    }

    function handlePrev() {
        if (activePlayer === 'soundcloud') {
            if (!scWidget && window.SC && scIframe) {
                try { scWidget = SC.Widget(scIframe); } catch(err) {}
            }
            if (scWidget) {
                try {
                    scWidget.getCurrentSoundIndex((currentIndex) => {
                        if (currentIndex > 0) {
                            if (vinylDisc) vinylDisc.classList.add('paused');
                            scWidget.prev();
                        }
                    });
                } catch(err) {}
            }
        } else if (activePlayer === 'youtube') {
            loadYouTubeVideo(currentTvIndex - 1);
        } else if (activePlayer === 'gba') {
            if (gbaState === 'sub') {
                gbaFileIndex = (gbaFileIndex - 1 + gbaCategories[gbaCategoryIndex].files.length) % gbaCategories[gbaCategoryIndex].files.length;
                updateGbaDisplay();
                const selectedFile = gbaCategories[gbaCategoryIndex].files[gbaFileIndex];
                if (selectedFile.type === 'audio') {
                    playAudioFile(selectedFile.path);
                } else {
                    playSynthSound(selectedFile.subtype);
                }
            } else {
                handleGbaUp();
            }
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

    if (gbaPlayBtn) {
        gbaPlayBtn.addEventListener('click', () => { 
            const bootScreen = document.getElementById('gba-boot-screen');
            if (bootScreen && bootScreen.classList.contains('active')) return;

            activePlayer = 'gba'; 
            window.activePlayerInstance = activePlayer;
            handleGbaConfirm(); 
        });
    }
    if (gbaNextBtn) {
        gbaNextBtn.addEventListener('click', () => { 
            const bootScreen = document.getElementById('gba-boot-screen');
            if (bootScreen && bootScreen.classList.contains('active')) return;

            activePlayer = 'gba'; 
            window.activePlayerInstance = activePlayer;
            handleGbaDown(); 
        });
    }
    if (gbaPrevBtn) {
        gbaPrevBtn.addEventListener('click', () => { 
            const bootScreen = document.getElementById('gba-boot-screen');
            if (bootScreen && bootScreen.classList.contains('active')) return;

            activePlayer = 'gba'; 
            window.activePlayerInstance = activePlayer;
            handleGbaUp(); 
        });
    }

    if (topVolumeSlider) {
        topVolumeSlider.addEventListener('input', (e) => {
            const vol = parseFloat(e.target.value);
            const ytVol = vol * 100;
            
            initAudioContext();
            if (masterGainNode && audioCtx) {
                masterGainNode.gain.setValueAtTime(vol, audioCtx.currentTime);
            }

            if (currentAudioElement) {
                currentAudioElement.volume = vol;
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
        if (currentAudioElement) {
            currentAudioElement.pause();
            currentAudioElement = null;
        }

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
    }
});