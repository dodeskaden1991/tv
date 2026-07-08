/**
 * BS-NET IPTV - Видео Плеър
 * Възпроизвеждане на VOD и TV
 */

let hlsInstance = null;

// ============================================
// ПЪЛНО ПОЧИСТВАНЕ НА ВИДЕО
// ============================================
function resetVideoPlayer() {
    // Унищожаване на HLS инстанция
    if (window.hlsInstance) {
        window.hlsInstance.destroy();
        window.hlsInstance = null;
    }
    if (hlsInstance) {
        hlsInstance.destroy();
        hlsInstance = null;
    }
    
    // Спиране на fullscreen видео
    DOM.fullscreenVideo.pause();
    DOM.fullscreenVideo.removeAttribute('src');
    DOM.fullscreenVideo.load();
    DOM.fullscreenVideo.innerHTML = '';
    
    // Спиране на основното видео
    DOM.videoPlayer.pause();
    DOM.videoPlayer.removeAttribute('src');
    DOM.videoPlayer.load();
    DOM.videoPlayer.innerHTML = '';
    
    DOM.fullscreenPlayer.style.display = 'none';
    STATE.isPlaying = false;
}

// ============================================
// ВЪЗПРОИЗВЕЖДАНЕ НА TV (LIVE)
// ============================================
function playLiveStream(stream) {
    resetVideoPlayer();
    
    const streamId = stream.stream_id;
    STATE.selectedStreamId = streamId;
    
    DOM.currentChannelName.innerText = stream.name;
    DOM.loadingSpinner.style.display = 'block';
    
    let finalUrl = "";
    
    if (STATE.currentOffset === 0) {
        finalUrl = `${CONFIG.DNS}/live/${STATE.user.username}/${STATE.user.password}/${streamId}.m3u8`;
    } else {
        const targetTime = new Date(Date.now() + (STATE.currentOffset * 60000));
        const formattedStart = `${targetTime.getFullYear()}-${String(targetTime.getMonth() + 1).padStart(2, '0')}-${String(targetTime.getDate()).padStart(2, '0')}:${String(targetTime.getHours()).padStart(2, '0')}-${String(targetTime.getMinutes()).padStart(2, '0')}`;
        finalUrl = `${CONFIG.DNS}/timeshift/${STATE.user.username}/${STATE.user.password}/15/${formattedStart}/${streamId}.m3u8`;
    }
    
    // Зареждане на EPG
    fetchShortEPG(streamId);

    if (Hls.isSupported()) {
        if (hlsInstance) {
            hlsInstance.destroy();
            hlsInstance = null;
        }
        
        hlsInstance = new Hls({ 
            maxBufferLength: 10, 
            liveDurationInfinity: true,
            manifestLoadingTimeOut: 5000,
            manifestLoadingMaxRetry: 3
        });
        
        hlsInstance.loadSource(finalUrl);
        hlsInstance.attachMedia(DOM.videoPlayer);
        
        hlsInstance.on(Hls.Events.MANIFEST_PARSED, () => {
            DOM.loadingSpinner.style.display = 'none';
            DOM.videoPlayer.play();
            STATE.isPlaying = true;
        });
        
        hlsInstance.on(Hls.Events.ERROR, (event, data) => {
            DOM.loadingSpinner.style.display = 'none';
            console.error('HLS грешка:', data);
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
// ПОКАЗВАНЕ НА VOD ИНФОРМАЦИЯ
// ============================================
function showVodInfo(stream) {
    DOM.dynamicInfoBox.style.display = 'block';
    DOM.epgProgressWrapper.style.display = 'none';
    DOM.epgTimeWrapper.style.display = 'none';
    
    DOM.dynamicLabel.innerText = '🎬 Информация за филма:';
    
    const rating = stream.rating ? `⭐ ${stream.rating}` : '⭐ N/A';
    const year = stream.year || stream.custom_sid || 'N/A';
    const displayId = stream.movie_id || stream.id || stream.stream_id || 'N/A';
    
    DOM.dynamicMeta.innerHTML = `<div style="color: var(--vod-gold);">${rating} | ${year}</div>`;
    DOM.dynamicTitle.innerText = stream.name;
    
    DOM.vodDetails.innerHTML = `
        <div class="vod-info">
            <div class="vod-info-item"><span>ID:</span><span>#${displayId}</span></div>
            <div class="vod-info-item"><span>Формат:</span><span>${stream.container_extension || stream.extension || 'N/A'}</span></div>
            ${stream.duration ? `<div class="vod-info-item"><span>Продължителност:</span><span>${Math.floor(stream.duration / 60)} мин</span></div>` : ''}
        </div>
    `;
}

// ============================================
// ВЪЗПРОИЗВЕЖДАНЕ НА VOD
// ============================================
function playVideo(streamId, extension, type) {
    resetVideoPlayer();
    
    if (!streamId) {
        alert('❌ Грешка: ID-то на филма не е намерено!');
        return;
    }
    
    const cleanExt = extension.replace('.', '');
    const route = (type === 'series') ? 'series' : 'movie';
    const { username, password } = STATE.user;
    
    // Генериране на URL-та
    const urls = {
        main: `${CONFIG.DNS}/${route}/${username}/${password}/${streamId}.${cleanExt}`,
        mp4: `${CONFIG.DNS}/${route}/${username}/${password}/${streamId}.mp4`,
        m3u8: `${CONFIG.DNS}/${route}/${username}/${password}/${streamId}.m3u8`,
        noExt: `${CONFIG.DNS}/${route}/${username}/${password}/${streamId}`
    };
    
    console.log('🎬 Опитваме:', urls.main);
    
    DOM.fullscreenPlayer.style.display = 'flex';
    const video = DOM.fullscreenVideo;
    video.innerHTML = '';
    
    // Добавяне на източници
    const source1 = createSource(urls.main, cleanExt);
    video.appendChild(source1);
    
    const source2 = createSource(urls.mp4, 'mp4');
    video.appendChild(source2);
    
    const source3 = createSource(urls.noExt, 'mp4');
    video.appendChild(source3);
    
    video.load();
    
    // Опит за възпроизвеждане
    const playPromise = video.play();
    if (playPromise !== undefined) {
        playPromise
            .then(() => { STATE.isPlaying = true; })
            .catch(() => {
                if (!video.src.includes('.m3u8')) {
                    tryHlsVod(urls.m3u8);
                }
            });
    }
    
    // Обработка на грешки
    video.onerror = function() {
        handleVideoError(video, urls);
    };
}

// ============================================
// СЪЗДАВАНЕ НА ИЗТОЧНИК
// ============================================
function createSource(url, ext) {
    const source = document.createElement('source');
    source.src = url;
    source.type = getMimeType(ext);
    return source;
}

function getMimeType(ext) {
    const types = {
        'mkv': 'video/x-matroska',
        'avi': 'video/x-msvideo',
        'mov': 'video/quicktime',
        'm4v': 'video/x-m4v',
        'mp4': 'video/mp4',
        'm3u8': 'application/vnd.apple.mpegurl'
    };
    return types[ext] || 'video/mp4';
}

// ============================================
// ОБРАБОТКА НА ГРЕШКИ
// ============================================
function handleVideoError(video, urls) {
    const err = video.error;
    console.log('❌ Грешка:', err);
    
    // H.265 -> опитваме HLS
    if (err.code === 4) {
        tryHlsVod(urls.m3u8);
        return;
    }
    
    // MKV не работи -> опитваме MP4
    if (video.src && video.src.includes('.mkv')) {
        video.innerHTML = '';
        const src = createSource(urls.mp4, 'mp4');
        video.appendChild(src);
        video.load();
        video.play().catch(() => {});
        return;
    }
    
    // Друг проблем -> опитваме HLS
    if (video.src && !video.src.includes('.m3u8')) {
        tryHlsVod(urls.m3u8);
        return;
    }
    
    // Финален fallback
    const messages = {
        4: 'Форматът на видеото не се поддържа (H.265/HEVC)',
        3: 'Грешка при декодиране',
        2: 'Файлът не е намерен (404)'
    };
    const msg = messages[err.code] || 'Неизвестна грешка';
    
    if (err.code === 4 || err.code === 2) {
        if (confirm(`${msg}\n\nИскате ли да опитате с HLS стрийм?`)) {
            tryHlsVod(urls.m3u8);
        } else if (confirm('Искате ли да отворите във външен плеър?')) {
            window.open(video.src, '_blank');
            DOM.fullscreenPlayer.style.display = 'none';
        }
    }
}

// ============================================
// HLS ЗА VOD
// ============================================
function tryHlsVod(hlsUrl) {
    console.log('📡 Опитваме HLS:', hlsUrl);
    
    const video = DOM.fullscreenVideo;
    video.innerHTML = '';
    
    if (!Hls.isSupported()) {
        video.src = hlsUrl;
        video.load();
        video.play().catch(() => {
            alert('❌ Вашият браузър не поддържа HLS стрийминг.');
        });
        return;
    }
    
    if (window.hlsInstance) {
        window.hlsInstance.destroy();
    }
    
    window.hlsInstance = new Hls({
        maxBufferLength: 30,
        enableWorker: true,
        lowLatencyMode: false,
        manifestLoadingTimeOut: 10000,
        manifestLoadingMaxRetry: 3
    });
    
    window.hlsInstance.loadSource(hlsUrl);
    window.hlsInstance.attachMedia(video);
    
    window.hlsInstance.on(Hls.Events.MANIFEST_PARSED, () => {
        video.play().catch(() => {});
    });
    
    window.hlsInstance.on(Hls.Events.ERROR, (event, data) => {
        if (data.type === Hls.ErrorTypes.NETWORK_ERROR) {
            DOM.fullscreenPlayer.style.display = 'none';
            alert('❌ Неуспешно зареждане на филма.');
        }
    });
}

// ============================================
// ЗАТВАРЯНЕ НА FULLSCREEN ПЛЕЪР
// ============================================
function closeFullscreenPlayer() {
    resetVideoPlayer();
}