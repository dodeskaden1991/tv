/**
 * BS-NET IPTV - Автентикация
 * Логин, логаут и управление на сесията
 */

// ============================================
// ЛОГИН
// ============================================
async function handleLogin() {
    const user = DOM.usernameField.value.trim();
    const pass = DOM.passwordField.value.trim();
    
    if (!user || !pass) {
        showLoginError('Моля, въведете потребителско име и парола!');
        return;
    }

    const testUrl = `${CONFIG.DNS}/${CONFIG.API.LIVE_CATEGORIES}&username=${user}&password=${pass}`;
    
    try {
        const response = await fetch(testUrl);
        const data = await response.json();
        
        if (Array.isArray(data) || (data && !data.user_info?.auth == 0)) {
            // Успешен логин
            localStorage.setItem('iptv_user', user);
            localStorage.setItem('iptv_pass', pass);
            
            STATE.user = { username: user, password: pass };
            
            DOM.loginError.style.display = 'none';
            showMainLayout();
            loadLiveCategories();
        } else {
            throw new Error('Невалидни данни за достъп');
        }
    } catch (err) {
        showLoginError('Грешни данни за достъп! Моля, опитайте отново.');
    }
}

// ============================================
// ИЗХОД
// ============================================
function handleLogout() {
    localStorage.clear();
    resetVideoPlayer();
    
    DOM.mainLayout.classList.remove('show');
    DOM.loginScreen.style.display = 'flex';
    
    DOM.usernameField.value = '';
    DOM.passwordField.value = '';
    
    STATE.user = null;
    closeSidebar();
}

// ============================================
// ПОКАЗВАНЕ НА ГРЕШКА ПРИ ЛОГИН
// ============================================
function showLoginError(message) {
    DOM.loginError.textContent = message;
    DOM.loginError.style.display = 'block';
}

// ============================================
// ПОКАЗВАНЕ НА ОСНОВНИЯ ИНТЕРФЕЙС
// ============================================
function showMainLayout() {
    DOM.loginScreen.style.display = 'none';
    DOM.mainLayout.classList.add('show');
}

// ============================================
// АВТОМАТИЧЕН ЛОГИН (при запаметени данни)
// ============================================
function autoLogin() {
    const savedUser = localStorage.getItem('iptv_user');
    const savedPass = localStorage.getItem('iptv_pass');
    
    if (savedUser && savedPass) {
        STATE.user = { username: savedUser, password: savedPass };
        showMainLayout();
        loadLiveCategories();
        return true;
    }
    return false;
}