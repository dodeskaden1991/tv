/**
 * BS-NET IPTV - Основен контролер
 * Инициализация и свързване на всички модули
 */

// ============================================
// ИНИЦИАЛИЗАЦИЯ
// ============================================
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 BS-NET IPTV стартира...');
    
    // Опит за автоматичен логин
    const loggedIn = autoLogin();
    
    if (!loggedIn) {
        // Ако няма запаметени данни, показваме login екрана
        DOM.loginScreen.style.display = 'flex';
        DOM.mainLayout.classList.remove('show');
    }
    
    // Затваряне на sidebar при клик извън него (мобилен)
    document.addEventListener('click', function(e) {
        if (window.innerWidth <= 992) {
            const sidebar = DOM.sidebar;
            const isClickInside = sidebar.contains(e.target);
            const isHamburger = e.target.closest('.hamburger');
            
            if (!isClickInside && !isHamburger && sidebar.classList.contains('open')) {
                closeSidebar();
            }
        }
    });
    
    // Sidebar се затваря при избор на категория
    document.addEventListener('click', function(e) {
        if (e.target.closest('.list-item') && window.innerWidth <= 992) {
            setTimeout(closeSidebar, 300);
        }
    });
    
    console.log('✅ BS-NET IPTV готов');
});

// ============================================
// SIDEBAR КОНТРОЛИ
// ============================================
function toggleSidebar() {
    DOM.sidebar.classList.toggle('open');
    DOM.sidebarOverlay.classList.toggle('active');
}

function closeSidebar() {
    DOM.sidebar.classList.remove('open');
    DOM.sidebarOverlay.classList.remove('active');
}

// ============================================
// TIMESHIFT
// ============================================
function changeTimeshift(minutesOffset, buttonElement) {
    if (!STATE.selectedStreamId || STATE.isVodMode) return;
    
    // Активен бутон
    document.querySelectorAll('.ts-btn').forEach(b => b.classList.remove('active'));
    buttonElement.classList.add('active');
    
    STATE.currentOffset = minutesOffset;
    
    // Презареждане на канала с новия offset
    const activeStream = STATE.currentStreams.find(
        s => s.stream_id === STATE.selectedStreamId
    );
    
    if (activeStream) {
        playLiveStream(activeStream);
    }
}