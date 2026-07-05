export default async function handler(req, res) {
    // Добавяме CORS хедъри, за да може твоят index.html да чете данните от този бекенд
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET');
    res.setHeader('Content-Type', 'application/json; charset=utf-8');

    // Вземаме променливите от фронтенда
    const { username, password, action, stream_id } = req.query;
    const serverUrl = "http://tvpro.burgasnet.com/player_api.php";
    
    // Сглобяваме заявката към реалния Xtream Codes сървър
    let targetUrl = `${serverUrl}?username=${username}&password=${password}&action=${action}`;
    if (stream_id) {
        targetUrl += `&stream_id=${stream_id}`;
    }

    try {
        // Правим HTTP заявка от името на сървъра (заобикаляме Mixed Content)
        const response = await fetch(targetUrl);
        const data = await response.json();
        
        // Връщаме готовия JSON обратно към телефона/браузъра
        return res.status(200).json(data);
    } catch (error) {
        return res.status(500).json({ error: "Грешка при комуникация с Xtream сървъра" });
    }
}
