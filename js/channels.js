/**
 * BS-NET IPTV - Канали/Филми
 * Зареждане и рендиране на списъка
 */

// ============================================
// ЗАРЕЖДАНЕ НА СПИСЪК
// ============================================
async function loadLiveStreams(categoryId) {
    const url = buildApiUrl('LIVE_STREAMS', { category_id: categoryId });
    DOM.channelsList.innerHTML = '<div class="loading-text">Зареждане...</div>';
    
    try {
        const response = await fetch(url);
        STATE.currentStreams = await response.json();
        renderMediaCards(STATE.currentStreams, false);
    } catch (error) {
        DOM.channelsList.innerHTML = 'Грешка при зареждане.';
        console.error(error);
    }
}

async function loadVodStreams(categoryId) {
    const url = buildApiUrl('VOD_STREAMS', { category_id: categoryId });
    DOM.channelsList.innerHTML = '<div class="loading-text">Зареждане на филми...</div>';
    
    try {
        const response = await fetch(url);
        STATE.currentStreams = await response.json();
        renderMediaCards(STATE.currentStreams, true);
    } catch (error) {
        DOM.channelsList.innerHTML = 'Грешка при зареждане.';
        console.error(error);
    }
}

// ============================================
// ПОЛУЧАВАНЕ НА ВАЛИДНО ЛОГО
// ============================================
function getValidLogoUrl(stream) {
    const logo = stream.stream_icon || stream.stream_poster || stream.poster || stream.cover || '';
    return isValidUrl(logo) ? logo : null;
}

// ============================================
// РЕНДИРАНЕ НА КАРТИ
// ============================================
function renderMediaCards(streams, isVod) {
    DOM.channelsList.innerHTML = '';
    
    if (!streams || streams.length === 0) {
        DOM.channelsList.innerHTML = '<div class="empty-text">Няма намерено съдържание.</div>';
        return;
    }

    streams.forEach((stream, index) => {
        const div = document.createElement('div');
        div.className = 'channel-card';
        div.setAttribute('data-search', getDualLanguageString(stream.name));

        const logoUrl = getValidLogoUrl(stream);
        
        let logoHtml = '';
        if (logoUrl) {
            logoHtml = `
                <img class="ch-logo" src="${logoUrl}" 
                     onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
                <div class="placeholder-logo" style="display:none;"><i class="fas fa-film"></i></div>
            `;
        } else {
            logoHtml = `<div class="placeholder-logo"><i class="fas fa-film"></i></div>`;
        }

        div.innerHTML = `
            <span class="ch-num">${index + 1}</span>
            ${logoHtml}
            <div class="ch-info">
                <span class="ch-name">${stream.name}</span>
            </div>
        `;

        div.onclick = () => {
            document.querySelectorAll('.channel-card').forEach(el => el.classList.remove('active'));
            div.classList.add('active');
            
            if (!isVod) {
                // TV режим
                document.querySelectorAll('.ts-btn').forEach(b => b.classList.remove('active'));
                document.querySelector('.timeshift-buttons .ts-btn').classList.add('active');
                STATE.currentOffset = 0;
                playLiveStream(stream);
                loadEpgForChannel(stream.stream_id, stream.name);
            } else {
                // VOD режим
                const id = stream.movie_id || stream.id || stream.stream_id;
                const ext = stream.container_extension || stream.extension || 'mkv';
                
                if (!id) {
                    alert('❌ Грешка: Не мога да намеря ID на филма!');
                    return;
                }
                
                DOM.currentChannelName.innerText = stream.name;
                playVideo(id, ext, 'movies');
            }
        };
        
        DOM.channelsList.appendChild(div);
    });
}

// ============================================
// ТЪРСЕНЕ
// ============================================
function filterMediaSearch() {
    const query = DOM.searchBox.value.toLowerCase().trim();
    
    if (STATE.isVodMode && query.length > 0) {
        // Глобално търсене във всички филми
        const filtered = STATE.allMovies.filter(movie => {
            return getDualLanguageString(movie.name).includes(query);
        });
        renderMediaCards(filtered, true);
    } else if (STATE.isVodMode && query.length === 0) {
        renderMediaCards(STATE.currentStreams, true);
    } else {
        // Филтриране на текущия списък
        const cards = document.querySelectorAll('.channel-card');
        cards.forEach(card => {
            const searchData = card.getAttribute('data-search');
            card.style.display = searchData.includes(query) ? 'flex' : 'none';
        });
    }
}