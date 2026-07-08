/**
 * BS-NET IPTV - Конфигурация
 * Всички настройки на приложението
 */

// ============================================
// СЪРВЪР
// ============================================
const CONFIG = {
    // Основен DNS на сървъра
    DNS: 'http://tvpro.burgasnet.com:80',
    
    // API ендпойнти
    API: {
        LIVE_CATEGORIES: 'player_api.php?action=get_live_categories',
        VOD_CATEGORIES: 'player_api.php?action=get_vod_categories',
        LIVE_STREAMS: 'player_api.php?action=get_live_streams',
        VOD_STREAMS: 'player_api.php?action=get_vod_streams',
        SHORT_EPG: 'player_api.php?action=get_short_epg',
        ALL_VOD: 'player_api.php?action=get_vod_streams'
    },
    
    // Времеви настройки
    TIMESHIFT: {
        DURATION: 15 // минути архив
    },
    
    // HLS настройки
    HLS: {
        MAX_BUFFER: 10,
        LIVE_DURATION: true
    }
};

// ============================================
// СЪСТОЯНИЕ НА ПРИЛОЖЕНИЕТО
// ============================================
const STATE = {
    user: null,              // { username, password }
    currentStreams: [],      // Текущ списък канали/филми
    allMovies: [],          // Кеш на всички филми
    selectedStreamId: null,  // Избрано ID
    currentOffset: 0,       // Timeshift offset в минути
    isVodMode: false,       // Режим VOD или TV
    isPlaying: false        // Дали се възпроизвежда
};

// ============================================
// DOM РЕФЕРЕНЦИИ
// ============================================
const DOM = {
    // Login
    loginScreen: document.getElementById('login-screen'),
    usernameField: document.getElementById('username-field'),
    passwordField: document.getElementById('password-field'),
    loginError: document.getElementById('login-error-msg'),
    
    // Main
    mainLayout: document.getElementById('main-layout'),
    
    // Sidebar
    sidebar: document.getElementById('sidebar'),
    sidebarOverlay: document.getElementById('sidebarOverlay'),
    categoriesList: document.getElementById('categories-list'),
    
    // Channels
    searchBox: document.getElementById('search-box'),
    channelsList: document.getElementById('channels-list'),
    
    // Player
    videoPlayer: document.getElementById('video-player'),
    fullscreenPlayer: document.getElementById('fullscreenPlayer'),
    fullscreenVideo: document.getElementById('fullscreenVideo'),
    loadingSpinner: document.getElementById('loading-spinner'),
    currentChannelName: document.getElementById('current-channel-name'),
    
    // Info
    dynamicInfoBox: document.getElementById('dynamic-info-box'),
    dynamicLabel: document.getElementById('dynamic-label'),
    dynamicTitle: document.getElementById('dynamic-title'),
    dynamicMeta: document.getElementById('dynamic-meta'),
    vodDetails: document.getElementById('vod-details'),
    
    // EPG
    epgProgressWrapper: document.getElementById('epg-progress-wrapper'),
    epgProgressFill: document.getElementById('epg-current-progress'),
    epgTimeWrapper: document.getElementById('epg-time-wrapper'),
    epgStart: document.getElementById('epg-current-start'),
    epgEnd: document.getElementById('epg-current-end'),
    
    // Timeshift
    timeshiftWrapper: document.getElementById('timeshift-wrapper'),
    timeshiftButtons: document.querySelectorAll('.ts-btn'),
    
    // Recordings (EPG под Timeshift)
    recordingsSection: document.getElementById('recordingsSection'),
    recordingsList: document.getElementById('recordingsList'),
    recordingsBtn: document.getElementById('recordingsBtn')
};