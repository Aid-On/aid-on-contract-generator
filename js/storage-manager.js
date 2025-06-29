// ===========================================
// ストレージ管理クラス - 保存・読み込み機能
// ===========================================

class StorageManager {
    constructor() {
        this.storageKey = APP_CONFIG.STORAGE_KEY;
        this.autoSaveInterval = null;
        this.lastSaveData = null;
        
        this.init();
    }

    /**
     * 初期化
     */
    init() {
        this.setupAutoSave();
        this.setupFileHandlers();
        this.setupBackupSystem();
    }

    /**
     * ローカルストレージに保存
     * @param {Object} data - 保存するデータ
     * @returns {boolean} - 保存成功の可否
     */
    saveToLocalStorage(data) {
        try {
            const saveData = {
                ...data,
                timestamp: new Date().toISOString(),
                version: '1.0'
            };

            localStorage.setItem(this.storageKey, JSON.stringify(saveData));
            this.lastSaveData = Utils.deepClone(saveData);
            
            console.log('ローカルストレージに保存しました:', saveData);
            return true;
        } catch (error) {
            console.error('ローカルストレージ保存エラー:', error);
            uiManager.showNotification('データの保存に失敗しました', 'error');
            return false;
        }
    }

    /**
     * ローカルストレージから読み込み
     * @returns {Object|null} - 読み込んだデータ
     */
    loadFromLocalStorage() {
        try {
            const stored = localStorage.getItem(this.storageKey);
            if (!stored) return null;

            const data = JSON.parse(stored);
            this.lastSaveData = Utils.deepClone(data);
            
            console.log('ローカルストレージから読み込みました:', data);
            return data;
        } catch (error) {
            console.error('ローカルストレージ読み込みエラー:', error);
            uiManager.showNotification('データの読み込みに失敗しました', 'error');
            return null;
        }
    }

    /**
     * データの変更チェック
     * @param {Object} currentData - 現在のデータ
     * @returns {boolean} - 変更があるかどうか
     */
    hasDataChanged(currentData) {
        if (!this.lastSaveData) return true;
        
        return JSON.stringify(currentData) !== JSON.stringify(this.lastSaveData);
    }

    /**
     * ファイルとして保存（テンプレートエクスポート）
     * @param {Object} data - 保存するデータ
     * @param {string} filename - ファイル名
     */
    exportToFile(data, filename = null) {
        try {
            const exportData = {
                ...data,
                exportedAt: new Date().toISOString(),
                version: '1.0',
                generator: '汎用契約書ジェネレーター'
            };

            const blob = new Blob([JSON.stringify(exportData, null, 2)], { 
                type: 'application/json' 
            });
            
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename || this.generateFilename(data);
            
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            
            URL.revokeObjectURL(url);
            
            uiManager.showNotification('ファイルをダウンロードしました', 'success');
            return true;
        } catch (error) {
            console.error('ファイル保存エラー:', error);
            uiManager.showNotification('ファイルの保存に失敗しました', 'error');
            return false;
        }
    }

    /**
     * ファイルから読み込み
     * @param {File} file - 読み込むファイル
     * @returns {Promise<Object>} - 読み込んだデータ
     */
    importFromFile(file) {
        return new Promise((resolve, reject) => {
            if (!file) {
                reject(new Error('ファイルが選択されていません'));
                return;
            }

            if (!file.name.endsWith('.json')) {
                reject(new Error('JSONファイルを選択してください'));
                return;
            }

            const reader = new FileReader();
            
            reader.onload = (event) => {
                try {
                    const data = JSON.parse(event.target.result);
                    
                    // データの検証
                    if (!this.validateImportedData(data)) {
                        reject(new Error('無効なデータ形式です'));
                        return;
                    }
                    
                    uiManager.showNotification('ファイルを正常に読み込みました', 'success');
                    resolve(data);
                } catch (error) {
                    console.error('ファイル読み込みエラー:', error);
                    reject(error);
                }
            };

            reader.onerror = () => {
                reject(new Error('ファイルの読み込みに失敗しました'));
            };

            reader.readAsText(file);
        });
    }

    /**
     * インポートデータの検証
     * @param {Object} data - 検証するデータ
     * @returns {boolean} - 有効なデータかどうか
     */
    validateImportedData(data) {
        // 必須フィールドの確認
        const requiredFields = ['contractType', 'contractData'];
        
        for (const field of requiredFields) {
            if (!(field in data)) {
                console.error(`必須フィールド '${field}' が見つかりません`);
                return false;
            }
        }

        // 契約書タイプの確認
        if (!(data.contractType in CONTRACT_TEMPLATES)) {
            console.error(`無効な契約書タイプ: ${data.contractType}`);
            return false;
        }

        // 条項データの確認
        if (data.contractArticles && !Array.isArray(data.contractArticles)) {
            console.error('contractArticles は配列である必要があります');
            return false;
        }

        return true;
    }

    /**
     * ファイル名の生成
     * @param {Object} data - データオブジェクト
     * @returns {string} - ファイル名
     */
    generateFilename(data) {
        const timestamp = new Date().toISOString().slice(0, 19).replace(/[T:]/g, '-');
        const contractType = data.contractType || 'custom';
        const contractName = data.contractData?.contractTitle || CONTRACT_TEMPLATES[contractType]?.name || '契約書';
        
        const safeName = Utils.sanitizeFilename(contractName);
        return `${safeName}-${contractType}-${timestamp}.json`;
    }

    /**
     * 自動保存の設定
     */
    setupAutoSave() {
        // 5分ごとに自動保存
        this.autoSaveInterval = setInterval(() => {
            this.performAutoSave();
        }, 5 * 60 * 1000);

        // ページ離脱時の保存
        window.addEventListener('beforeunload', (e) => {
            this.performAutoSave();
            
            // 未保存の変更がある場合は警告
            if (this.hasUnsavedChanges()) {
                e.preventDefault();
                e.returnValue = '未保存の変更があります。このページを離れますか？';
            }
        });
    }

    /**
     * 自動保存の実行
     */
    performAutoSave() {
        try {
            // グローバルなデータアクセスが必要
            if (typeof window.contractManager !== 'undefined') {
                const currentData = window.contractManager.getCurrentData();
                if (this.hasDataChanged(currentData)) {
                    this.saveToLocalStorage(currentData);
                    console.log('自動保存を実行しました');
                }
            }
        } catch (error) {
            console.error('自動保存エラー:', error);
        }
    }

    /**
     * 未保存の変更があるかチェック
     * @returns {boolean} - 未保存の変更があるかどうか
     */
    hasUnsavedChanges() {
        try {
            if (typeof window.contractManager !== 'undefined') {
                const currentData = window.contractManager.getCurrentData();
                return this.hasDataChanged(currentData);
            }
            return false;
        } catch (error) {
            return false;
        }
    }

    /**
     * ファイルハンドラーの設定
     */
    setupFileHandlers() {
        const fileInput = document.querySelector(SELECTORS.fileInput);
        if (!fileInput) return;

        fileInput.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (!file) return;

            try {
                uiManager.showLoading(document.body, true);
                const data = await this.importFromFile(file);
                
                // データをアプリケーションに適用
                if (typeof window.contractManager !== 'undefined') {
                    window.contractManager.loadData(data);
                }
                
                // ファイル入力をリセット
                fileInput.value = '';
                
            } catch (error) {
                uiManager.showNotification(`読み込みエラー: ${error.message}`, 'error');
            } finally {
                uiManager.showLoading(document.body, false);
            }
        });
    }

    /**
     * バックアップシステムの設定
     */
    setupBackupSystem() {
        // 日次バックアップ
        this.scheduleBackup();
    }

    /**
     * バックアップのスケジューリング
     */
    scheduleBackup() {
        const now = new Date();
        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(2, 0, 0, 0); // 明日の2時

        const timeToBackup = tomorrow.getTime() - now.getTime();

        setTimeout(() => {
            this.createBackup();
            // 次のバックアップをスケジュール（24時間後）
            setInterval(() => {
                this.createBackup();
            }, 24 * 60 * 60 * 1000);
        }, timeToBackup);
    }

    /**
     * バックアップの作成
     */
    createBackup() {
        try {
            const currentData = this.loadFromLocalStorage();
            if (!currentData) return;

            const backupKey = `${this.storageKey}_backup_${new Date().toISOString().slice(0, 10)}`;
            localStorage.setItem(backupKey, JSON.stringify(currentData));

            // 古いバックアップを削除（7日以上前のもの）
            this.cleanupOldBackups();
            
            console.log('バックアップを作成しました:', backupKey);
        } catch (error) {
            console.error('バックアップ作成エラー:', error);
        }
    }

    /**
     * 古いバックアップの削除
     */
    cleanupOldBackups() {
        try {
            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - 7);
            const cutoffString = cutoffDate.toISOString().slice(0, 10);

            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && key.startsWith(`${this.storageKey}_backup_`)) {
                    const dateString = key.split('_backup_')[1];
                    if (dateString < cutoffString) {
                        localStorage.removeItem(key);
                        console.log('古いバックアップを削除しました:', key);
                    }
                }
            }
        } catch (error) {
            console.error('バックアップ削除エラー:', error);
        }
    }

    /**
     * バックアップ一覧の取得
     * @returns {Array} - バックアップ一覧
     */
    getBackupList() {
        const backups = [];
        
        try {
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && key.startsWith(`${this.storageKey}_backup_`)) {
                    const dateString = key.split('_backup_')[1];
                    const data = JSON.parse(localStorage.getItem(key));
                    
                    backups.push({
                        key,
                        date: dateString,
                        timestamp: data.timestamp,
                        contractType: data.contractType,
                        size: JSON.stringify(data).length
                    });
                }
            }
        } catch (error) {
            console.error('バックアップ一覧取得エラー:', error);
        }

        return backups.sort((a, b) => b.date.localeCompare(a.date));
    }

    /**
     * バックアップからの復元
     * @param {string} backupKey - バックアップキー
     * @returns {Object|null} - 復元されたデータ
     */
    restoreFromBackup(backupKey) {
        try {
            const backupData = localStorage.getItem(backupKey);
            if (!backupData) {
                throw new Error('バックアップが見つかりません');
            }

            const data = JSON.parse(backupData);
            uiManager.showNotification('バックアップから復元しました', 'success');
            return data;
        } catch (error) {
            console.error('バックアップ復元エラー:', error);
            uiManager.showNotification(`復元エラー: ${error.message}`, 'error');
            return null;
        }
    }

    /**
     * ストレージ使用量の取得
     * @returns {Object} - ストレージ使用量情報
     */
    getStorageUsage() {
        try {
            let totalSize = 0;
            let itemCount = 0;
            let appSize = 0;

            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                const value = localStorage.getItem(key);
                const size = (key.length + value.length) * 2; // UTF-16で2バイト

                totalSize += size;
                itemCount++;

                if (key.startsWith(this.storageKey)) {
                    appSize += size;
                }
            }

            return {
                totalSize,
                appSize,
                itemCount,
                totalSizeMB: (totalSize / 1024 / 1024).toFixed(2),
                appSizeMB: (appSize / 1024 / 1024).toFixed(2),
                availableSize: 5 * 1024 * 1024 - totalSize, // 5MB制限と仮定
                usagePercentage: ((totalSize / (5 * 1024 * 1024)) * 100).toFixed(1)
            };
        } catch (error) {
            console.error('ストレージ使用量取得エラー:', error);
            return null;
        }
    }

    /**
     * データのクリア
     */
    clearAllData() {
        uiManager.showConfirm(
            'すべてのデータを削除しますか？この操作は元に戻せません。',
            () => {
                try {
                    // アプリケーション関連のデータのみ削除
                    const keysToRemove = [];
                    for (let i = 0; i < localStorage.length; i++) {
                        const key = localStorage.key(i);
                        if (key && key.startsWith(this.storageKey)) {
                            keysToRemove.push(key);
                        }
                    }

                    keysToRemove.forEach(key => {
                        localStorage.removeItem(key);
                    });

                    this.lastSaveData = null;
                    uiManager.showNotification('すべてのデータを削除しました', 'success');
                    
                    // ページをリロード
                    setTimeout(() => {
                        window.location.reload();
                    }, 1000);
                } catch (error) {
                    console.error('データ削除エラー:', error);
                    uiManager.showNotification('データの削除に失敗しました', 'error');
                }
            }
        );
    }

    /**
     * デストラクタ
     */
    destroy() {
        if (this.autoSaveInterval) {
            clearInterval(this.autoSaveInterval);
        }
    }
}

// グローバルインスタンス
window.storageManager = new StorageManager();
