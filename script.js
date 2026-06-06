/**
 * ==========================================================================
 * UNIQLOCK Main Application Logic & Playlist Controller
 * ==========================================================================
 */

// Playlist track definition
const DAY_TRACKS = [
    "sound0.mp3",
    "sound1.mp3",
    "sound2.mp3",
    "sound3.mp3",
    "sound4.mp3",
    "sound5.mp3",
    "sound6.mp3",
    "sound7.mp3",
    "sound8.mp3",
    "sound9.mp3",
    "sound10.mp3", // Note the specific local filename
    "sound11.mp3",
    "sound12.mp3",
    "sound13.mp3"
];

const NIGHT_TRACKS = [
    "soundNight.mp3",
    "soundNight2.mp3",
    "soundNight3.mp3",
    "soundNight4.mp3",
    "soundNight5.mp3"
];

// Theme Colors mapping
const THEME_COLORS = {
    'red': '#E60012',
    'blue': '#0f4c81',
    'green': '#008b45',
    'orange': '#ff5e00',
    'purple': '#5a189a',
    'navy': '#1d2a44',
    'pink': '#ff5c8a'
};

const COLOR_THEMES = Object.keys(THEME_COLORS);

// Application state
const state = {
    playlistMode: 'auto', // 'auto', 'day', 'night'
    isPlaying: false,
    isMuted: false,
    volume: 0.7,
    currentTrackIndex: 0,
    currentPlaylist: [],
    
    // Audio Object
    audio: new Audio(),
    
    // Clock Timing
    lastHour: -1,
    lastMinute: -1,
    hourlyChimeActive: false,
    
    // Screen State
    activeScreen: 'clock', // 'clock', 'dance'
    isTransitioning: false,
    
    // Animation Sync
    playReferenceTime: 0,
    beatCount: 0,
    
    // Theme
    currentThemeIndex: 0,
    currentThemeColorCode: THEME_COLORS['red'],
    
    // Engine Reference
    dancer: null
};

// DOM Cache
const dom = {
    startOverlay: document.getElementById('start-overlay'),
    btnStart: document.getElementById('btn-start'),
    appContainer: document.getElementById('app-container'),
    widgetFrame: document.getElementById('widget-frame'),
    clockScreen: document.getElementById('clock-screen'),
    danceScreen: document.getElementById('dance-screen'),
    clockTime: document.getElementById('clock-time'),
    clockMs: document.getElementById('clock-ms'),
    clockDate: document.getElementById('clock-date'),
    beatPulse: document.getElementById('beat-pulse'),
    transitionCurtain: document.getElementById('transition-curtain'),
    trackName: document.getElementById('track-name'),
    btnTogglePlay: document.getElementById('btn-toggle-play'),
    btnToggleMute: document.getElementById('btn-toggle-mute'),
    volumeSlider: document.getElementById('volume-slider'),
    playlistSelect: document.getElementById('playlist-select'),
    btnFullscreen: document.getElementById('btn-fullscreen'),
    overlayTrackInfo: document.getElementById('overlay-track-info'),
    indicatorLight: document.querySelector('.status-indicator-light'),
    dots: document.querySelectorAll('.dot')
};

/* ==========================================================================
   Initialization and Event Listeners
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
    loadSettings();
    initializeAudioEvents();
    setupEventListeners();
});

// Load settings from localStorage
function loadSettings() {
    const savedVolume = localStorage.getItem('uq_volume');
    if (savedVolume !== null) {
        state.volume = parseFloat(savedVolume);
        dom.volumeSlider.value = state.volume;
        state.audio.volume = state.volume;
    }
    
    const savedMuted = localStorage.getItem('uq_muted');
    if (savedMuted === 'true') {
        state.isMuted = true;
        state.audio.muted = true;
        toggleMuteUI(true);
    }

    const savedMode = localStorage.getItem('uq_mode');
    if (savedMode !== null) {
        state.playlistMode = savedMode;
        dom.playlistSelect.value = savedMode;
    }
}

// Setup core event listeners
function setupEventListeners() {
    // Start button
    dom.btnStart.addEventListener('click', () => {
        startApp();
    });

    // Play/Pause button
    dom.btnTogglePlay.addEventListener('click', () => {
        togglePlay();
    });

    // Mute button
    dom.btnToggleMute.addEventListener('click', () => {
        toggleMute();
    });

    // Volume Slider
    dom.volumeSlider.addEventListener('input', (e) => {
        const val = parseFloat(e.target.value);
        state.volume = val;
        state.audio.volume = val;
        localStorage.setItem('uq_volume', val);
        
        if (state.isMuted && val > 0) {
            toggleMute();
        } else if (val === 0 && !state.isMuted) {
            toggleMute();
        }
    });

    // Playlist Selector
    dom.playlistSelect.addEventListener('change', (e) => {
        state.playlistMode = e.target.value;
        localStorage.setItem('uq_mode', state.playlistMode);
        
        // Reload playlist matching new mode (and change track immediately)
        if (state.isPlaying && !state.hourlyChimeActive) {
            setupPlaylist(true);
        }
    });

    // Fullscreen Toggle
    dom.btnFullscreen.addEventListener('click', () => {
        toggleFullscreen();
    });

    // Handle spacebar for pause/play
    document.addEventListener('keydown', (e) => {
        if (e.code === 'Space' && !dom.startOverlay.classList.contains('fade-out')) {
            // If overlay is still open, do nothing or trigger start
            return;
        }
        if (e.code === 'Space') {
            e.preventDefault();
            togglePlay();
        }
    });
}

function startApp() {
    // Hide overlay and reveal clock
    dom.startOverlay.classList.add('fade-out');
    dom.appContainer.classList.remove('app-hidden');
    
    // Set initial playlist and play
    setupPlaylist(false);
    state.isPlaying = true;
    playTrack();

    // Initialize the canvas dancer
    state.dancer = new SkeletalDancer('dancer-canvas');

    // Trigger theme rotation
    rotateTheme();

    // Start main ticks
    requestAnimationFrame(tick);
}

/* ==========================================================================
   Playlist and Track Management
   ========================================================================== */

// Set up playlist depending on automatic time or manual day/night choice
function setupPlaylist(changeImmediately = false) {
    const now = new Date();
    const hour = now.getHours();
    const minute = now.getMinutes();
    
    let useNight = false;
    if (state.playlistMode === 'night') {
        useNight = true;
    } else if (state.playlistMode === 'auto') {
        // Night mode between 12:00 AM (0) and 5:59 AM (5)
        if (hour >= 0 && hour < 6) {
            useNight = true;
        }
    }
    
    const oldPlaylist = state.currentPlaylist;
    state.currentPlaylist = useNight ? NIGHT_TRACKS : DAY_TRACKS;
    
    // Determine the track index corresponding to the current local minute
    const targetTrackIndex = minute % state.currentPlaylist.length;
    
    // If playlist changed or current track index does not match the target:
    if (oldPlaylist.length !== state.currentPlaylist.length || state.currentTrackIndex !== targetTrackIndex || changeImmediately) {
        state.currentTrackIndex = targetTrackIndex;
        if (state.isPlaying) {
            playTrack();
        }
    }
}

// Play the current track
function playTrack() {
    const filename = state.currentPlaylist[state.currentTrackIndex];
    state.audio.src = `music/${filename}`;
    
    // Update track names
    const displayName = filename.replace('.mp3', '').toUpperCase();
    dom.trackName.textContent = `TRACK: ${displayName}`;
    dom.overlayTrackInfo.textContent = displayName;
    
    // Align playback starting position exactly with local clock seconds + milliseconds
    const now = new Date();
    const currentSec = now.getSeconds() + (now.getMilliseconds() / 1000);
    state.audio.currentTime = currentSec;
    
    state.audio.play()
        .then(() => {
            // Align visual ticks with local clock seconds timeline
            state.playReferenceTime = performance.now() - (currentSec * 1000);
            updatePlayStateUI(true);
        })
        .catch(err => {
            console.error("Error playing audio: ", err);
            updatePlayStateUI(false);
        });
}

function initializeAudioEvents() {
    // Loop playlist: when track ends, select next and play
    state.audio.addEventListener('ended', () => {
        if (state.hourlyChimeActive) {
            // Hourly chime ended! Resume normal playlist
            state.hourlyChimeActive = false;
            setupPlaylist(false);
            playTrack();
        } else {
            // Regular track ended, advance to next track based on current minute
            setupPlaylist(true);
        }
    });

    // Listen for pause/play events to adjust timer reference
    state.audio.addEventListener('pause', () => {
        state.isPlaying = false;
        updatePlayStateUI(false);
    });

    state.audio.addEventListener('play', () => {
        state.isPlaying = true;
        const now = new Date();
        const currentSec = now.getSeconds() + (now.getMilliseconds() / 1000);
        state.playReferenceTime = performance.now() - (currentSec * 1000);
        updatePlayStateUI(true);
    });
}

function togglePlay() {
    if (state.isPlaying) {
        state.audio.pause();
    } else {
        const now = new Date();
        const currentSec = now.getSeconds() + (now.getMilliseconds() / 1000);
        state.audio.currentTime = currentSec;
        
        state.audio.play()
            .then(() => {
                state.playReferenceTime = performance.now() - (currentSec * 1000);
            })
            .catch(e => console.error(e));
    }
}

function toggleMute() {
    state.isMuted = !state.isMuted;
    state.audio.muted = state.isMuted;
    localStorage.setItem('uq_muted', state.isMuted);
    toggleMuteUI(state.isMuted);
}

function updatePlayStateUI(playing) {
    if (playing) {
        dom.btnTogglePlay.querySelector('.icon-pause-svg').classList.remove('hidden');
        dom.btnTogglePlay.querySelector('.icon-play-svg').classList.add('hidden');
        dom.indicatorLight.classList.remove('paused');
    } else {
        dom.btnTogglePlay.querySelector('.icon-pause-svg').classList.add('hidden');
        dom.btnTogglePlay.querySelector('.icon-play-svg').classList.remove('hidden');
        dom.indicatorLight.classList.add('paused');
    }
}

function toggleMuteUI(muted) {
    if (muted) {
        dom.btnToggleMute.querySelector('.icon-volume-high').classList.add('hidden');
        dom.btnToggleMute.querySelector('.icon-volume-mute').classList.remove('hidden');
    } else {
        dom.btnToggleMute.querySelector('.icon-volume-high').classList.remove('hidden');
        dom.btnToggleMute.querySelector('.icon-volume-mute').classList.add('hidden');
    }
}

// Hourly Chime player logic
function playHourlyChime(hour) {
    state.hourlyChimeActive = true;
    
    // Choose chime sound
    let chimeFile = "soundHour.mp3";
    if (hour === 0) {
        chimeFile = "soundHourMidNight.mp3";
    } else if (hour >= 1 && hour < 6) {
        chimeFile = "soundHourNight.mp3";
    } else {
        // Alternate daytime hour chimes
        chimeFile = (Math.random() < 0.5) ? "soundHour.mp3" : "soundHourDay2.mp3";
    }

    state.audio.src = `music/${chimeFile}`;
    dom.trackName.textContent = `CHIME: HORA NUEVA`;
    dom.overlayTrackInfo.textContent = `CHIME HORA NUEVA`;
    
    // Switch to Clock display immediately for the chime alert
    if (state.activeScreen !== 'clock') {
        forceScreenSwitch('clock');
    }

    state.audio.play()
        .then(() => {
            state.playReferenceTime = performance.now();
        })
        .catch(err => console.error(err));
}

/* ==========================================================================
   Clock Update Logic
   ========================================================================== */

function updateClock() {
    const now = new Date();
    
    // Check hour change
    const hour = now.getHours();
    if (state.lastHour !== -1 && hour !== state.lastHour) {
        playHourlyChime(hour);
    }
    state.lastHour = hour;

    // Time calculations
    const hours = String(hour).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    
    // Render time text
    dom.clockTime.textContent = `${hours}:${minutes}:${seconds}`;

    // Precision milliseconds
    const ms = String(Math.floor(now.getMilliseconds() / 10)).padStart(2, '0');
    dom.clockMs.textContent = `.${ms}`;

    // Date formatting
    const days = ['DOM', 'LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB'];
    const months = ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC'];
    
    const dayName = days[now.getDay()];
    const dateNum = String(now.getDate()).padStart(2, '0');
    const monthName = months[now.getMonth()];
    
    dom.clockDate.textContent = `${dayName}. ${dateNum} ${monthName}`;
}

// Theme color changer
function rotateTheme() {
    // Remove old themes
    COLOR_THEMES.forEach(theme => dom.clockScreen.classList.remove(`theme-${theme}`));
    
    // Set next theme
    state.currentThemeIndex = (state.currentThemeIndex + 1) % COLOR_THEMES.length;
    const activeTheme = COLOR_THEMES[state.currentThemeIndex];
    
    dom.clockScreen.classList.add(`theme-${activeTheme}`);
    state.currentThemeColorCode = THEME_COLORS[activeTheme];
}

/* ==========================================================================
   Screen Transitions
   ========================================================================== */

// Forces a screen switch immediately
function forceScreenSwitch(screen) {
    state.activeScreen = screen;
    if (screen === 'clock') {
        dom.clockScreen.classList.add('active');
        dom.danceScreen.classList.remove('active');
    } else {
        dom.clockScreen.classList.remove('active');
        dom.danceScreen.classList.add('active');
    }
}

// Executes the curtain sweep animation and flips screen on peak
function executeTransition(targetScreen) {
    dom.transitionCurtain.classList.add('sweep');
    
    // 250ms matches the half-point of the CSS transition where the screen is covered
    setTimeout(() => {
        forceScreenSwitch(targetScreen);
        
        // If switching to clock, change the color theme
        if (targetScreen === 'clock') {
            rotateTheme();
        } else if (targetScreen === 'dance' && state.dancer) {
            // If switching to dance, let the dancer select a random choreography
            state.dancer.changeRoutine();
        }
    }, 250);

    // 500ms matches the end of the sweep transition
    setTimeout(() => {
        dom.transitionCurtain.classList.remove('sweep');
        state.isTransitioning = false;
    }, 500);
}

/* ==========================================================================
   Fullscreen API Support
   ========================================================================== */

function toggleFullscreen() {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen()
            .then(() => {
                dom.appContainer.classList.add('fullscreen-mode');
                if (state.dancer) state.dancer.resize();
            })
            .catch(err => {
                console.error(`Error entering fullscreen: ${err.message}`);
            });
    } else {
        document.exitFullscreen()
            .then(() => {
                dom.appContainer.classList.remove('fullscreen-mode');
                if (state.dancer) state.dancer.resize();
            })
            .catch(err => {
                console.error(`Error exiting fullscreen: ${err.message}`);
            });
    }
}

// Adjust canvas resolution if fullscreen state changes via browser keys (F11/ESC)
document.addEventListener('fullscreenchange', () => {
    if (!document.fullscreenElement) {
        dom.appContainer.classList.remove('fullscreen-mode');
    } else {
        dom.appContainer.classList.add('fullscreen-mode');
    }
    setTimeout(() => {
        if (state.dancer) state.dancer.resize();
    }, 100);
});

/* ==========================================================================
   Tick / Loop Controller
   ========================================================================== */

function tick() {
    // 1. Always update the clock display (even if paused)
    updateClock();

    const now = new Date();
    const minute = now.getMinutes();

    // Check if local minute changed to transition tracks
    if (state.isPlaying && !state.hourlyChimeActive) {
        if (state.lastMinute === -1) {
            state.lastMinute = minute;
        } else if (minute !== state.lastMinute) {
            state.lastMinute = minute;
            setupPlaylist(true);
        }
    }

    // 2. Playback / Beat timing calculations
    if (state.isPlaying && !state.hourlyChimeActive) {
        // High-precision playback timeline tied directly to local clock seconds!
        const localSec = now.getSeconds() + (now.getMilliseconds() / 1000);
        
        // Guard against drifts (keep audio synced to local wall-clock seconds)
        if (!state.audio.paused && state.audio.readyState >= 1) {
            const diff = Math.abs(state.audio.currentTime - localSec);
            // Only align if drift is meaningful, avoiding changes near minute boundary
            if (diff > 0.3 && localSec < 59.5 && localSec > 0.5) {
                state.audio.currentTime = localSec;
            }
        }

        // 120 BPM = 2 beats per second. Beats are aligned with wall-clock time!
        const beatFloat = localSec * 2;
        const beatCount = Math.floor(beatFloat);
        const beatProgress = beatFloat - beatCount;

        // UI Beat progress bar fill
        dom.beatPulse.style.width = `${beatProgress * 100}%`;

        // Pulse corner dots of dancer screen on every beat peak
        if (beatProgress < 0.2) {
            dom.dots.forEach(d => d.classList.add('pulse'));
        } else {
            dom.dots.forEach(d => d.classList.remove('pulse'));
        }

        // 3. Screen Switching Orchestrator
        // Each loop cycle is 20 beats (10 seconds total: 5s clock, 5s dance)
        const cycleBeat = beatFloat % 20;
        
        if (!state.isTransitioning) {
            if (cycleBeat >= 9.5 && cycleBeat < 10.0 && state.activeScreen === 'clock') {
                state.isTransitioning = true;
                executeTransition('dance');
            } else if (cycleBeat >= 19.5 && cycleBeat < 20.0 && state.activeScreen === 'dance') {
                state.isTransitioning = true;
                executeTransition('clock');
            }
        }

        // 4. Render the dancer model
        if (state.dancer && state.activeScreen === 'dance') {
            state.dancer.render(beatFloat, state.currentThemeColorCode);
        }
    } else {
        // Clear beat pulse bar when paused
        dom.beatPulse.style.width = '0%';
        
        // Show static/standby dancer pose if in dance screen
        if (state.dancer && state.activeScreen === 'dance') {
            // Render at 0 beat (T-pose/standby)
            state.dancer.render(0, state.currentThemeColorCode);
        }
    }

    // Keep loop active
    requestAnimationFrame(tick);
}
