// ===========================================
// ユーティリティ関数集
// ===========================================

/**
 * 日付フォーマット関数
 * @param {string} dateString - ISO形式の日付文字列
 * @returns {string} - 日本語形式の日付文字列
 */
function formatDate(dateString) {
    if (!dateString) return '';
    
    try {
        const date = new Date(dateString);
        const year = date.getFullYear();
        const month = date.getMonth() + 1;
        const day = date.getDate();
        return `${year}年${month}月${day}日`;
    } catch (error) {
        console.error('日付フォーマットエラー:', error);
        return dateString;
    }
}

/**
 * 署名フォーマット関数（改行をbrタグに変換）
 * @param {string} signature - 署名文字列
 * @returns {string} - HTMLフォーマットされた署名
 */
function formatSignature(signature) {
    if (!signature) return '';
    return signature.replace(/\n/g, '<br>');
}

/**
 * 変数置換関数
 * @param {string} content - 置換対象のコンテンツ
 * @param {Object} variables - 変数定義オブジェクト
 * @param {Object} contractData - 契約データ
 * @param {boolean} isHtml - HTML出力用かどうか
 * @returns {string} - 置換後のコンテンツ
 */
function replaceVariables(content, variables, contractData, isHtml = false) {
    if (!content || !variables) return content;
    
    let result = content;
    
    // テンプレート変数の置換
    Object.keys(variables).forEach(key => {
        const value = contractData[key] || `{{${variables[key]}}}`;
        const replacement = isHtml ? `<span class="highlight">${value}</span>` : `<strong>${value}</strong>`;
        result = result.replace(new RegExp(`{{${key}}}`, 'g'), replacement);
    });
    
    // 改行をbrタグに変換
    result = result.replace(/\n/g, '<br>');
    
    return result;
}

/**
 * デバウンス関数
 * @param {Function} func - 実行する関数
 * @param {number} wait - 遅延時間（ミリ秒）
 * @returns {Function} - デバウンスされた関数
 */
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

/**
 * 要素の表示/非表示切り替え
 * @param {HTMLElement} element - 対象要素
 * @param {boolean} show - 表示するかどうか
 */
function toggleElement(element, show) {
    if (!element) return;
    
    if (show) {
        element.style.display = '';
        element.classList.remove('hidden');
    } else {
        element.style.display = 'none';
        element.classList.add('hidden');
    }
}

/**
 * 要素のアニメーション付き表示
 * @param {HTMLElement} element - 対象要素
 * @param {string} animationClass - アニメーションクラス名
 */
function showWithAnimation(element, animationClass = 'fade-in') {
    if (!element) return;
    
    element.style.display = '';
    element.classList.remove('hidden');
    element.classList.add(animationClass);
    
    // アニメーション終了後にクラスを削除
    setTimeout(() => {
        element.classList.remove(animationClass);
    }, 300);
}

/**
 * 深いコピーを作成
 * @param {any} obj - コピー対象のオブジェクト
 * @returns {any} - 深いコピーされたオブジェクト
 */
function deepClone(obj) {
    if (obj === null || typeof obj !== 'object') return obj;
    if (obj instanceof Date) return new Date(obj.getTime());
    if (obj instanceof Array) return obj.map(item => deepClone(item));
    if (typeof obj === 'object') {
        const clonedObj = {};
        for (const key in obj) {
            if (obj.hasOwnProperty(key)) {
                clonedObj[key] = deepClone(obj[key]);
            }
        }
        return clonedObj;
    }
}

/**
 * 配列内の要素を移動
 * @param {Array} array - 対象配列
 * @param {number} fromIndex - 移動元のインデックス
 * @param {number} toIndex - 移動先のインデックス
 * @returns {Array} - 移動後の配列
 */
function moveArrayElement(array, fromIndex, toIndex) {
    const newArray = [...array];
    const element = newArray.splice(fromIndex, 1)[0];
    newArray.splice(toIndex, 0, element);
    return newArray;
}

/**
 * 文字列をサニタイズ（HTMLエスケープ）
 * @param {string} str - サニタイズする文字列
 * @returns {string} - サニタイズされた文字列
 */
function sanitizeHtml(str) {
    if (!str) return '';
    
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

/**
 * JSON文字列を安全にパース
 * @param {string} jsonString - JSON文字列
 * @param {any} defaultValue - パースに失敗した場合のデフォルト値
 * @returns {any} - パース結果またはデフォルト値
 */
function safeJsonParse(jsonString, defaultValue = {}) {
    try {
        return JSON.parse(jsonString);
    } catch (error) {
        console.warn('JSON パースエラー:', error);
        return defaultValue;
    }
}

/**
 * オブジェクトを安全にJSON文字列化
 * @param {any} obj - 文字列化するオブジェクト
 * @param {number} space - インデントスペース数
 * @returns {string} - JSON文字列
 */
function safeJsonStringify(obj, space = 2) {
    try {
        return JSON.stringify(obj, null, space);
    } catch (error) {
        console.error('JSON 文字列化エラー:', error);
        return '{}';
    }
}

/**
 * 現在の日付を取得（ISO形式）
 * @returns {string} - 今日の日付（YYYY-MM-DD形式）
 */
function getTodayDate() {
    return new Date().toISOString().split('T')[0];
}

/**
 * ファイル名を安全な形式に変換
 * @param {string} filename - 元のファイル名
 * @returns {string} - 安全なファイル名
 */
function sanitizeFilename(filename) {
    if (!filename) return 'untitled';
    
    return filename
        .replace(/[<>:"/\\|?*]/g, '-')
        .replace(/\s+/g, '-')
        .toLowerCase();
}

/**
 * 数値をカンマ区切りでフォーマット
 * @param {number|string} value - フォーマットする数値
 * @returns {string} - カンマ区切りの文字列
 */
function formatNumber(value) {
    if (!value) return '';
    
    const number = typeof value === 'string' ? parseFloat(value.replace(/,/g, '')) : value;
    if (isNaN(number)) return value;
    
    return number.toLocaleString('ja-JP');
}

/**
 * 配列から重複を除去
 * @param {Array} array - 対象配列
 * @returns {Array} - 重複を除去した配列
 */
function uniqueArray(array) {
    return [...new Set(array)];
}

/**
 * オブジェクトが空かどうかチェック
 * @param {Object} obj - チェック対象のオブジェクト
 * @returns {boolean} - 空の場合true
 */
function isEmpty(obj) {
    if (obj == null) return true;
    if (Array.isArray(obj) || typeof obj === 'string') return obj.length === 0;
    return Object.keys(obj).length === 0;
}

/**
 * 要素が画面内に表示されているかチェック
 * @param {HTMLElement} element - チェック対象の要素
 * @returns {boolean} - 表示されている場合true
 */
function isElementInViewport(element) {
    if (!element) return false;
    
    const rect = element.getBoundingClientRect();
    return (
        rect.top >= 0 &&
        rect.left >= 0 &&
        rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
        rect.right <= (window.innerWidth || document.documentElement.clientWidth)
    );
}

/**
 * スムーズスクロール
 * @param {HTMLElement} element - スクロール先の要素
 * @param {number} offset - オフセット（ピクセル）
 */
function smoothScrollTo(element, offset = 0) {
    if (!element) return;
    
    const targetPosition = element.offsetTop - offset;
    window.scrollTo({
        top: targetPosition,
        behavior: 'smooth'
    });
}

/**
 * ランダムなIDを生成
 * @param {number} length - ID の長さ
 * @returns {string} - ランダムID
 */
function generateRandomId(length = 8) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

/**
 * パスワード強度チェック
 * @param {string} password - チェック対象のパスワード
 * @returns {Object} - 強度情報オブジェクト
 */
function checkPasswordStrength(password) {
    if (!password) return { score: 0, message: 'パスワードを入力してください' };
    
    let score = 0;
    const checks = {
        length: password.length >= 8,
        lowercase: /[a-z]/.test(password),
        uppercase: /[A-Z]/.test(password),
        numbers: /[0-9]/.test(password),
        symbols: /[^A-Za-z0-9]/.test(password)
    };
    
    score = Object.values(checks).filter(Boolean).length;
    
    const messages = [
        '非常に弱い',
        '弱い',
        '普通',
        '強い',
        '非常に強い'
    ];
    
    return {
        score,
        message: messages[score] || messages[0],
        checks
    };
}

/**
 * ブラウザ情報を取得
 * @returns {Object} - ブラウザ情報オブジェクト
 */
function getBrowserInfo() {
    const ua = navigator.userAgent;
    
    return {
        isChrome: /Chrome/.test(ua) && /Google Inc/.test(navigator.vendor),
        isFirefox: /Firefox/.test(ua),
        isSafari: /Safari/.test(ua) && /Apple Computer/.test(navigator.vendor),
        isEdge: /Edg/.test(ua),
        isIE: /Trident/.test(ua),
        isMobile: /Mobi|Android/i.test(ua),
        isTablet: /Tablet|iPad/i.test(ua)
    };
}

// エクスポート（ES6モジュール未対応ブラウザ対応のため、グローバル変数として定義）
window.Utils = {
    formatDate,
    formatSignature,
    replaceVariables,
    debounce,
    toggleElement,
    showWithAnimation,
    deepClone,
    moveArrayElement,
    sanitizeHtml,
    safeJsonParse,
    safeJsonStringify,
    getTodayDate,
    sanitizeFilename,
    formatNumber,
    uniqueArray,
    isEmpty,
    isElementInViewport,
    smoothScrollTo,
    generateRandomId,
    checkPasswordStrength,
    getBrowserInfo
};
