/**
 * BS-NET IPTV - Помощни функции
 * Общи utility функции
 */

// ============================================
// ТРАНСЛИТЕРАЦИЯ (Кирилица ↔ Латиница)
// ============================================
const CHAR_MAP = {
    'a':'а', 'b':'б', 'v':'в', 'g':'г', 'd':'д', 'e':'е', 
    'zh':'ж', 'z':'з', 'i':'и', 'j':'й', 'k':'к', 'l':'л', 
    'm':'м', 'n':'н', 'o':'о', 'p':'п', 'r':'р', 's':'с', 
    't':'т', 'u':'у', 'f':'ф', 'h':'х', 'c':'ц', 'ch':'ч', 
    'sh':'ш', 'sht':'щ', 'u':'ъ', 'y':'ь', 'yu':'ю', 'ya':'я',
    'а':'a', 'б':'b', 'в':'v', 'г':'g', 'д':'d', 'е':'e', 
    'ж':'zh', 'з':'z', 'и':'i', 'й':'j', 'к':'k', 'л':'l', 
    'м':'m', 'н':'n', 'о':'o', 'п':'p', 'р':'r', 'с':'s', 
    'т':'t', 'у':'u', 'ф':'f', 'х':'h', 'ц':'c', 'ч':'ch', 
    'ш':'sh', 'щ':'sht', 'ъ':'u', 'ь':'y', 'ю':'yu', 'я':'ya'
};

/**
 * Генерира двуезичен низ за търсене
 */
function getDualLanguageString(str) {
    if (!str) return '';
    let text = str.toLowerCase();
    let converted = '';
    for (let i = 0; i < text.length; i++) {
        let char = text[i];
        converted += CHAR_MAP[char] || char;
    }
    return text + ' ' + converted;
}

// ============================================
// ДЕКОДИРАНЕ НА BASE64 (UTF-8)
// ============================================
function decodeBase64Utf8(base64Str) {
    try {
        const binaryString = atob(base64Str);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }
        return new TextDecoder('utf-8').decode(bytes);
    } catch (e) {
        return 'Грешка при четене на заглавието';
    }
}

// ============================================
// ВАЛИДАЦИЯ НА URL
// ============================================
function isValidUrl(string) {
    try {
        const url = new URL(string);
        return url.protocol === 'http:' || url.protocol === 'https:';
    } catch (_) {
        return false;
    }
}

// ============================================
// ФОРМАТИРАНЕ НА ВРЕМЕ
// ============================================
function formatTime(timestamp) {
    const date = new Date(timestamp * 1000);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

// ============================================
// ЗАКЪСНЕНИЕ (debounce)
// ============================================
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}