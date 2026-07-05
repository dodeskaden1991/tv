const http = require('http');

export default async function handler(req, res) {
    const { username, password, action, stream_id, type, timestamp } = req.query;
    const xtreamBase = "http://tvpro.burgasnet.com";

    // Корс хедъри за пълна сигурност
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    if (!username || !password || !action) {
        return res.status(400).json({ error: "Липсват задължителни параметри (user, pass, action)" });
    }

    // ЛОГИКА 1: ПРОКСИРАНЕ НА ВИДЕО И ТАЙМШИФТ СТРИЙМОВЕ
    if (action === 'stream') {
        if (!stream_id || !type) {
            return res.status(400).send("Липсва stream_id или type при стрийминг.");
        }

        let remoteUrl = '';
        if (type === 'live') {
            remoteUrl = `${xtreamBase}/live/${username}/${password}/${stream_id}.m3u8`;
        } else if (type === 'timeshift') {
            remoteUrl = `${xtreamBase}/timeshift/${username}/${password}/120/${timestamp}/${stream_id}.m3u8`;
        } else {
            remoteUrl = `${xtreamBase}/movie/${username}/${password}/${stream_id}.ts`;
        }

        // Започваме "изпомпване" на данните от твоя HTTP сървър към HTTPS на Vercel
        http.get(remoteUrl, (remoteResponse) => {
            // Препредаваме правилния Content-Type на плеъра
            const contentType = remoteResponse.headers['content-type'] || 
                                (type === 'movie' ? 'video/mp2t' : 'application/x-mpegURL');
            
            res.writeHead(remoteResponse.statusCode || 200, {
                'Content-Type': contentType,
                'Cache-Control': 'no-cache',
                'Connection': 'keep-alive',
                'Access-Control-Allow-Origin': '*'
            });

            // Директно пайпване на стрийма в респонса
            remoteResponse.pipe(res);
        }).on('error', (err) => {
            console.error("Грешка при проксиране на стрийм:", err);
            res.status(500).send("Грешка при проксиране на видеото: " + err.message);
        });

        return;
    }

    // ЛОГИКА 2: ЗАРЕЖДАНЕ НА JSON ДАННИ (КАНАЛИ, ФИЛМИ, КАТЕГОРИИ)
    let xtreamUrl = '';
    if (action === 'get_live_streams') {
        xtreamUrl = `${xtreamBase}/player_api.php?username=${username}&password=${password}&action=get_live_streams`;
    } else if (action === 'get_vod_streams') {
        xtreamUrl = `${xtreamBase}/player_api.php?username=${username}&password=${password}&action=get_vod_streams`;
    } else if (action === 'get_vod_categories') {
        xtreamUrl = `${xtreamBase}/player_api.php?username=${username}&password=${password}&action=get_vod_categories`;
    } else {
        return res.status(400).json({ error: "Невалидно действие (action)" });
    }

    try {
        const response = await fetch(xtreamUrl);
        if (!response.ok) throw new Error(`Сървърът върна грешка: ${response.status}`);
        
        const data = await response.json();
        return res.status(200).json(data);
    } catch (err) {
        return res.status(500).json({ error: "Грешка при извличане на JSON: " + err.message });
    }
}
