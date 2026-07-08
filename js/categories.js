/**
 * BS-NET IPTV - Категории
 * Зареждане и рендиране на категории
 */

// ============================================
// ЗАРЕЖДАНЕ НА КАТЕГОРИИ
// ============================================
async function loadLiveCategories() {
    if (!STATE.user) return;
    
    STATE.isVodMode = false;
    DOM.timeshiftWrapper.style.display = 'flex';
    DOM.dynamicInfoBox.style.display = 'none';
    DOM.searchBox.value = '';
    
    resetVideoPlayer();
    closeSidebar();
    
    const url = buildApiUrl('LIVE_CATEGORIES');
    
    try {
        const response = await fetch(url);
        const categories = await response.json();
        renderCategories(categories, false);
    } catch (error) {
        console.error('Грешка при зареждане на категории:', error);
    }
}

async function loadVodCategories() {
    if (!STATE.user) return;
    
    STATE.isVodMode = true;
    DOM.timeshiftWrapper.style.display = 'none';
    DOM.dynamicInfoBox.style.display = 'none';
    DOM.searchBox.value = '';
    
    resetVideoPlayer();
    closeSidebar();

    // Кешираме всички филми за глобално търсене
    await cacheAllMovies();

    const url = buildApiUrl('VOD_CATEGORIES');
    
    try {
        const response = await fetch(url);
        const categories = await response.json();
        renderCategories(categories, true);
    } catch (error) {
        console.error('Грешка при зареждане на категории:', error);
    }
}

// ============================================
// КЕШИРАНЕ НА ВСИЧКИ ФИЛМИ
// ============================================
async function cacheAllMovies() {
    const url = buildApiUrl('ALL_VOD');
    try {
        const response = await fetch(url);
        STATE.allMovies = await response.json();
        console.log('✅ Кеширани филми:', STATE.allMovies.length);
    } catch (error) {
        console.error('Грешка при кеширане на филми:', error);
    }
}

// ============================================
// ИЗГРАЖДАНЕ НА API URL
// ============================================
function buildApiUrl(action, params = {}) {
    const { username, password } = STATE.user;
    let url = `${CONFIG.DNS}/${CONFIG.API[action]}&username=${username}&password=${password}`;
    
    for (const [key, value] of Object.entries(params)) {
        url += `&${key}=${value}`;
    }
    
    return url;
}

// ============================================
// РЕНДИРАНЕ НА КАТЕГОРИИ
// ============================================
function renderCategories(categories, isVod) {
    DOM.categoriesList.innerHTML = '';
    
    categories.forEach((cat, index) => {
        const li = document.createElement('li');
        li.className = `list-item ${index === 0 ? 'active' : ''}`;
        li.innerHTML = `<i class="fas ${isVod ? 'fa-film' : 'fa-folder'}"></i> ${cat.category_name}`;
        
        li.onclick = () => {
            // Маркиране на активна категория
            document.querySelectorAll('#categories-list .list-item')
                .forEach(el => el.classList.remove('active'));
            li.classList.add('active');
            
            DOM.searchBox.value = '';
            resetVideoPlayer();
            
            if (isVod) {
                loadVodStreams(cat.category_id);
            } else {
                loadLiveStreams(cat.category_id);
            }
        };
        
        DOM.categoriesList.appendChild(li);
    });
    
    // Автоматично зареждане на първата категория
    if (categories.length > 0) {
        if (isVod) {
            loadVodStreams(categories[0].category_id);
        } else {
            loadLiveStreams(categories[0].category_id);
        }
    }
}