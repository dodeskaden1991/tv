/**
 * BS-NET IPTV - EPG (Електронен програмен гид)
 * Информация за текущата програма + EPG назад (под Timeshift)
 */

// ============================================
// === ЧАСТ 1: ТЕКУЩА ПРОГРАМА (за лайв) ===
// ============================================

// ============================================
// ПОКАЗВАНЕ НА EPG СЕКЦИЯТА
// ============================================
function showEpgSection() {
    DOM.epgProgressWrapper.style.display = 'block';
    DOM.epgTimeWrapper.style.display = 'flex';
    DOM.dynamicMeta.innerHTML = '';
    DOM.dynamicLabel.innerText = '📺 В момента предават:';
}

// ============================================
// СКРИВАНЕ НА EPG СЕКЦИЯТА
// ============================================
function hideEpgSection() {
    DOM.dynamicInfoBox.style.display = 'none';
}

// ============================================
// ИЗВЛИЧАНЕ НА ТЕКУЩАТА ПРОГРАМА
// ============================================
function getCurrentProgram(epgList) {
    const now = Math.floor(Date.now() / 1000);
    return epgList.find(prog => {
        return now >= prog.start_timestamp && now <= prog.stop_timestamp;
    }) || epgList[0];
}

// ============================================
// ИЗЧИСЛЯВАНЕ НА ПРОГРЕС БАР
// ============================================
function calculateProgress(start, stop) {
    const now = new Date();
    const total = stop - start;
    const progress = now - start;
    return Math.max(0, Math.min(100, (progress / total) * 100));
}

// ============================================
// ЗАРЕЖДАНЕ НА ТЕКУЩА ПРОГРАМА (за лайв)
// ============================================
async function fetchShortEPG(streamId) {
    showEpgSection();
    
    const url = buildApiUrl('SHORT_EPG', { stream_id: streamId });
    
    try {
        const response = await fetch(url);
        const data = await response.json();
        
        if (data && data.epg_listings && data.epg_listings.length > 0) {
            const current = getCurrentProgram(data.epg_listings);
            
            DOM.dynamicInfoBox.style.display = 'block';
            DOM.dynamicTitle.innerText = decodeBase64Utf8(current.title);
            
            const start = new Date(current.start_timestamp * 1000);
            const stop = new Date(current.stop_timestamp * 1000);
            
            DOM.epgStart.innerText = formatTime(current.start_timestamp);
            DOM.epgEnd.innerText = formatTime(current.stop_timestamp);
            
            DOM.epgProgressFill.style.width = calculateProgress(start, stop) + '%';
        } else {
            hideEpgSection();
        }
    } catch (error) {
        hideEpgSection();
        console.error('EPG грешка:', error);
    }
}

// ============================================
// === ЧАСТ 2: EPG НАЗАД (под Timeshift) ===
// ============================================

let currentEpgData = [];
let currentEpgStreamId = null;

// ============================================
// ЗАРЕЖДАНЕ НА EPG НАЗАД
// ============================================
function loadEpgForChannel(streamId, channelName) {
    if (!DOM.recordingsSection || !DOM.recordingsList) return;
    
    DOM.recordingsSection.style.display = 'flex';
    DOM.recordingsList.innerHTML = '<div class="loading-text">Зареждане на програмата...</div>';
    currentEpgStreamId = streamId;
    
    const url = `${CONFIG.DNS}/player_api.php?username=${STATE.user.username}&password=${STATE.user.password}&action=get_epg&stream_id=${streamId}&limit=100`;
    console.log('📡 EPG заявка:', url);
    
    fetch(url)
        .then(r => r.json())
        .then(data => {
            console.log('📡 EPG отговор получен');
            let epgList = [];
            if (data && data.epg_listings) {
                epgList = data.epg_listings;
            } else if (data && Array.isArray(data)) {
                epgList = data;
            } else if (data && data.epg) {
                epgList = data.epg;
            }
            
            console.log('📡 Брой EPG записи:', epgList.length);
            if (epgList && epgList.length > 0) {
                currentEpgData = epgList;
                renderEpgList(currentEpgData, streamId);
            } else {
                DOM.recordingsList.innerHTML = '<div class="empty-text">Няма налична програма за този канал.</div>';
            }
        })
        .catch(err => {
            DOM.recordingsList.innerHTML = '<div class="empty-text">Грешка при зареждане на програмата.</div>';
            console.error('EPG грешка:', err);
        });
}

// ============================================
// РЕНДИРАНЕ НА EPG НАЗАД
// ============================================
function renderEpgList(epgData, streamId) {
    const list = DOM.recordingsList;
    if (!list) return;
    
    list.innerHTML = '';
    const now = Math.floor(Date.now() / 1000);
    
    // ===== МАХНАХМЕ ФИЛТЪРА - ПОКАЗВАМЕ ВСИЧКИ (и минали, и бъдещи) =====
    const filtered = epgData.filter(prog => {
        const progStart = prog.start || prog.start_timestamp || 0;
        return progStart > 0; // Всички записи
    });
    
    console.log('📡 Всички EPG записи от сървъра:', filtered.length);
    console.log('📡 Най-стар запис:', new Date(filtered[0]?.start * 1000 || 0).toLocaleString());
    console.log('📡 Най-нов запис:', new Date(filtered[filtered.length-1]?.start * 1000 || 0).toLocaleString());
    
    if (filtered.length === 0) {
        list.innerHTML = '<div class="empty-text">Няма налични записи.</div>';
        return;
    }
    
    // Сортираме от най-старото към най-новото
    filtered.sort((a, b) => (a.start || a.start_timestamp || 0) - (b.start || b.start_timestamp || 0));
    
    filtered.forEach((prog) => {
        const div = document.createElement('div');
        div.className = 'epg-record-item';
        
        const startTime = prog.start || prog.start_timestamp || 0;
        const stopTime = prog.end || prog.stop_timestamp || 0;
        const duration = Math.round((stopTime - startTime) / 60);
        const isNow = startTime <= now && stopTime > now;
        const isFuture = startTime > now;
        
        let title = prog.title || prog.name || 'Без заглавие';
        title = decodeBase64Utf8(title);
        
        const startDate = new Date(startTime * 1000);
        const stopDate = new Date(stopTime * 1000);
        
        const dateStr = startDate.toLocaleDateString('bg-BG', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
        
        const timeStr = `${startDate.toLocaleTimeString('bg-BG', {hour: '2-digit', minute:'2-digit'})} - ${stopDate.toLocaleTimeString('bg-BG', {hour: '2-digit', minute:'2-digit'})}`;
        
        div.innerHTML = `
            <div class="epg-record-time">${dateStr} ${timeStr}</div>
            <div class="epg-record-title">${title}</div>
            <div class="epg-record-meta">
                <span>${duration} мин</span>
                ${isNow ? '<span class="epg-record-live"><i class="fas fa-circle"></i> В момента</span>' : ''}
                ${isFuture ? '<span class="epg-record-future"><i class="fas fa-clock"></i> Предстои</span>' : ''}
            </div>
        `;
        
        if (isNow) {
            div.style.borderColor = 'var(--accent-purple)';
            div.style.background = 'rgba(99, 102, 241, 0.08)';
        }
        if (isFuture) {
            div.style.opacity = '0.6';
        }
        
        div.onclick = () => {
            // Не позволяваме клик на бъдещи предавания
            if (isFuture) {
                alert('⏳ Това предаване все още не е започнало!');
                return;
            }
            
            const nowTimestamp = Math.floor(Date.now() / 1000);
            const diffSeconds = nowTimestamp - startTime;
            const diffMinutes = Math.floor(diffSeconds / 60);
            
            console.log(`⏪ Връщаме ${diffMinutes} минути назад`);
            STATE.currentOffset = -diffMinutes;
            STATE.selectedStreamId = streamId;
            
            document.querySelectorAll('.epg-record-item').forEach(el => el.classList.remove('active'));
            div.classList.add('active');
            startTimeshiftFromEpg(streamId, startTime);
        };
        list.appendChild(div);
    });
    
    const nowItem = list.querySelector('.epg-record-item[style*="border-color"]');
    if (nowItem) {
        setTimeout(() => {
            nowItem.scrollIntoView({ block: 'center', behavior: 'smooth' });
        }, 300);
    }
}

// ============================================
// СТАРТИРАНЕ НА TIMESHIFT ОТ EPG НАЗАД
// ============================================
function startTimeshiftFromEpg(streamId, startTimestamp) {
    if (hlsInstance) {
        hlsInstance.destroy();
        hlsInstance = null;
    }
    
    DOM.videoPlayer.pause();
    
    const date = new Date(startTimestamp * 1000);
    const formattedStart = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}:${String(date.getHours()).padStart(2, '0')}-${String(date.getMinutes()).padStart(2, '0')}`;
    const finalUrl = `${CONFIG.DNS}/timeshift/${STATE.user.username}/${STATE.user.password}/15/${formattedStart}/${streamId}.m3u8`;
    
    console.log('📡 Timeshift URL:', finalUrl);
    DOM.loadingSpinner.style.display = 'block';
    DOM.currentChannelName.innerText = `⏪ Връщане назад...`;
    
    if (Hls.isSupported()) {
        if (window.hlsInstance) {
            window.hlsInstance.destroy();
            window.hlsInstance = null;
        }
        
        hlsInstance = new Hls({ 
            maxBufferLength: 30,
            liveDurationInfinity: false,
            manifestLoadingTimeOut: 5000,
            manifestLoadingMaxRetry: 3
        });
        hlsInstance.loadSource(finalUrl);
        hlsInstance.attachMedia(DOM.videoPlayer);
        hlsInstance.on(Hls.Events.MANIFEST_PARSED, () => {
            DOM.loadingSpinner.style.display = 'none';
            DOM.videoPlayer.play();
            STATE.isPlaying = true;
            DOM.currentChannelName.innerText = `⏪ Възпроизвеждане от архив...`;
        });
        hlsInstance.on(Hls.Events.ERROR, (event, data) => {
            DOM.loadingSpinner.style.display = 'none';
            console.error('HLS грешка:', data);
            if (data.type === Hls.ErrorTypes.NETWORK_ERROR) {
                alert('❌ Грешка при зареждане на записа. Моля, опитайте отново.');
            }
        });
    } else {
        DOM.videoPlayer.src = finalUrl;
        DOM.videoPlayer.play().catch(e => {
            DOM.loadingSpinner.style.display = 'none';
            console.log("Автопускането е блокирано.");
        });
    }
}

// ============================================
// ОПРЕСНЯВАНЕ НА EPG НАЗАД
// ============================================
function refreshEpgData() {
    if (currentEpgStreamId) {
        const stream = STATE.currentStreams.find(s => s.stream_id === currentEpgStreamId);
        if (stream) {
            loadEpgForChannel(currentEpgStreamId, stream.name);
        }
    }
}

// ============================================
// ФУНКЦИЯ ЗА БУТОНА "ЗАПИСИ"
// ============================================
function loadRecordings() {
    console.log('📼 Бутонът "Записи" е кликнат - EPG се зарежда автоматично при избор на канал');
}