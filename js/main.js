// ===========================================
// メインアプリケーション - 統合・初期化・データ管理
// ===========================================

class ContractGeneratorApp {
    constructor() {
        this.currentContractType = 'consulting';
        this.contractData = {};
        this.contractArticles = [];
        this.isInitialized = false;
        this.eventBus = new Map();
        
        this.init();
    }

    /**
     * アプリケーション初期化
     */
    async init() {
        try {
            // 初期化開始
            console.log('契約書ジェネレーター初期化開始...');
            
            // DOM読み込み完了待ち
            if (document.readyState === 'loading') {
                await new Promise(resolve => {
                    document.addEventListener('DOMContentLoaded', resolve);
                });
            }

            // 初期化順序が重要
            await this.initializeCore();
            await this.initializeManagers();
            await this.setupEventListeners();
            await this.loadInitialData();
            await this.setupIntegration();
            
            this.isInitialized = true;
            
            console.log('契約書ジェネレーター初期化完了');
            this.emit('app:initialized');
            
            uiManager.showNotification('アプリケーションを読み込みました', 'success');
            
        } catch (error) {
            console.error('初期化エラー:', error);
            uiManager.showNotification(`初期化エラー: ${error.message}`, 'error');
        }
    }

    /**
     * コア機能の初期化
     */
    async initializeCore() {
        // グローバル変数の設定
        window.currentContractType = this.currentContractType;
        window.contractData = this.contractData;
        window.contractArticles = this.contractArticles;
        window.contractManager = this;

        // 初期日付の設定
        const today = Utils.getTodayDate();
        this.contractData.contractSignDate = today;
    }

    /**
     * 各マネージャーの初期化確認
     */
    async initializeManagers() {
        const managers = {
            uiManager: window.uiManager,
            storageManager: window.storageManager,
            formManager: window.formManager,
            articleManager: window.articleManager,
            previewManager: window.previewManager,
            contractGenerator: window.contractGenerator
        };

        // 各マネージャーが正常に初期化されているかチェック
        Object.keys(managers).forEach(name => {
            if (!managers[name]) {
                throw new Error(`${name} が初期化されていません`);
            }
        });

        console.log('全マネージャーの初期化確認完了');
    }

    /**
     * イベントリスナーの設定
     */
    async setupEventListeners() {
        // 契約書タイプ変更
        const contractTypeSelect = document.querySelector(SELECTORS.contractType);
        if (contractTypeSelect) {
            contractTypeSelect.addEventListener('change', (e) => {
                this.handleContractTypeChange(e.target.value);
            });
        }

        // カスタムタイプ追加
        const addCustomTypeBtn = document.getElementById('add-custom-type');
        if (addCustomTypeBtn) {
            addCustomTypeBtn.addEventListener('click', () => {
                this.openCustomTypeModal();
            });
        }

        // 設定保存・読込
        const saveBtn = document.querySelector(SELECTORS.saveTemplateBtn);
        const loadBtn = document.querySelector(SELECTORS.loadTemplateBtn);
        
        if (saveBtn) {
            saveBtn.addEventListener('click', () => this.saveTemplate());
        }
        
        if (loadBtn) {
            loadBtn.addEventListener('click', () => this.loadTemplate());
        }

        // ページ離脱時の確認
        window.addEventListener('beforeunload', (e) => {
            if (storageManager.hasUnsavedChanges()) {
                e.preventDefault();
                e.returnValue = '未保存の変更があります。このページを離れますか？';
            }
        });

        // ウィンドウリサイズ
        window.addEventListener('resize', Utils.debounce(() => {
            this.handleWindowResize();
        }, 250));

        console.log('イベントリスナー設定完了');
    }

    /**
     * 初期データの読み込み
     */
    async loadInitialData() {
        try {
            // ローカルストレージからの復元を試行
            const savedData = storageManager.loadFromLocalStorage();
            
            if (savedData && this.validateSavedData(savedData)) {
                console.log('保存されたデータを復元します');
                await this.loadData(savedData);
                uiManager.showNotification('前回の作業内容を復元しました', 'info');
            } else {
                // デフォルトデータの読み込み
                console.log('デフォルトデータを読み込みます');
                await this.loadDefaultData();
            }
        } catch (error) {
            console.error('初期データ読み込みエラー:', error);
            await this.loadDefaultData();
        }
    }

    /**
     * 保存データの検証
     * @param {Object} data - 保存データ
     * @returns {boolean} - 有効なデータかどうか
     */
    validateSavedData(data) {
        return data && 
               data.contractType && 
               CONTRACT_TEMPLATES[data.contractType] &&
               data.contractData &&
               Array.isArray(data.contractArticles);
    }

    /**
     * デフォルトデータの読み込み
     */
    async loadDefaultData() {
        this.currentContractType = 'consulting';
        this.contractData = {
            contractSignDate: Utils.getTodayDate()
        };
        this.contractArticles = [];
        
        // デフォルト契約書タイプを読み込み
        await this.loadContractType(this.currentContractType);
    }

    /**
     * マネージャー間の統合設定
     */
    async setupIntegration() {
        // フォーム変更 → プレビュー更新
        formManager.addChangeListener((fieldName, newValue, oldValue, allData) => {
            this.contractData = { ...allData };
            this.updateGlobalData();
            previewManager.setContractData(this.contractData);
            this.autoSave();
        });

        // 条項変更 → プレビュー更新
        articleManager.addChangeListener((action, article, extra, oldData, allArticles) => {
            this.contractArticles = [...allArticles];
            this.updateGlobalData();
            previewManager.setArticles(this.contractArticles);
            this.autoSave();
        });

        console.log('マネージャー統合設定完了');
    }

    /**
     * 契約書タイプの変更処理
     * @param {string} contractType - 新しい契約書タイプ
     */
    async handleContractTypeChange(contractType) {
        if (contractType === this.currentContractType) return;

        try {
            // 変更確認（未保存の変更がある場合）
            if (this.hasUnsavedChanges()) {
                const confirmed = confirm('現在の内容は失われます。契約書タイプを変更しますか？');
                if (!confirmed) {
                    // 元のタイプに戻す
                    const select = document.querySelector(SELECTORS.contractType);
                    if (select) select.value = this.currentContractType;
                    return;
                }
            }

            // 新しいタイプを読み込み
            await this.loadContractType(contractType);
            uiManager.showNotification(`契約書タイプを${CONTRACT_TEMPLATES[contractType].name}に変更しました`, 'success');
            
        } catch (error) {
            console.error('契約書タイプ変更エラー:', error);
            uiManager.showNotification(`変更エラー: ${error.message}`, 'error');
        }
    }

    /**
     * 契約書タイプの読み込み
     * @param {string} contractType - 契約書タイプ
     */
    async loadContractType(contractType) {
        const template = CONTRACT_TEMPLATES[contractType];
        if (!template) {
            throw new Error('無効な契約書タイプです');
        }

        // データのリセット
        this.currentContractType = contractType;
        this.contractData = {
            contractSignDate: Utils.getTodayDate()
        };

        // デフォルト値の設定
        template.fields.forEach(field => {
            if (field.default !== undefined) {
                this.contractData[field.name] = field.default;
            }
        });

        // 条項の読み込み
        this.contractArticles = Utils.deepClone(template.defaultArticles);

        // 各マネージャーの更新
        this.updateGlobalData();
        formManager.generateForm(template.fields);
        formManager.setFormData(this.contractData);
        articleManager.loadArticles(this.contractArticles);
        previewManager.setData(contractType, this.contractData, this.contractArticles);
        contractGenerator.reset();

        // 自動保存
        this.autoSave();
    }

    /**
     * データの読み込み
     * @param {Object} data - 読み込むデータ
     */
    async loadData(data) {
        try {
            this.currentContractType = data.contractType || 'consulting';
            this.contractData = { ...data.contractData } || {};
            this.contractArticles = Utils.deepClone(data.contractArticles) || [];

            // 契約書タイプセレクトの更新
            const select = document.querySelector(SELECTORS.contractType);
            if (select) {
                select.value = this.currentContractType;
            }

            // テンプレートの取得
            const template = CONTRACT_TEMPLATES[this.currentContractType];
            if (!template) {
                throw new Error('無効な契約書タイプです');
            }

            // 各マネージャーの更新
            this.updateGlobalData();
            formManager.generateForm(template.fields);
            formManager.setFormData(this.contractData);
            articleManager.loadArticles(this.contractArticles);
            previewManager.setData(this.currentContractType, this.contractData, this.contractArticles);
            contractGenerator.reset();

        } catch (error) {
            console.error('データ読み込みエラー:', error);
            throw error;
        }
    }

    /**
     * グローバルデータの更新
     */
    updateGlobalData() {
        window.currentContractType = this.currentContractType;
        window.contractData = this.contractData;
        window.contractArticles = this.contractArticles;
    }

    /**
     * 現在のデータを取得
     * @returns {Object} - 現在のデータ
     */
    getCurrentData() {
        return {
            contractType: this.currentContractType,
            contractData: { ...this.contractData },
            contractArticles: Utils.deepClone(this.contractArticles),
            timestamp: new Date().toISOString()
        };
    }

    /**
     * 未保存の変更があるかチェック
     * @returns {boolean} - 未保存の変更があるか
     */
    hasUnsavedChanges() {
        return storageManager.hasDataChanged(this.getCurrentData());
    }

    /**
     * 自動保存
     */
    autoSave() {
        const currentData = this.getCurrentData();
        storageManager.saveToLocalStorage(currentData);
    }

    /**
     * 設定の保存
     */
    async saveTemplate() {
        try {
            const currentData = this.getCurrentData();
            const success = storageManager.exportToFile(currentData);
            
            if (success) {
                uiManager.showNotification('設定をファイルに保存しました', 'success');
            }
        } catch (error) {
            console.error('設定保存エラー:', error);
            uiManager.showNotification(`保存エラー: ${error.message}`, 'error');
        }
    }

    /**
     * 設定の読み込み
     */
    async loadTemplate() {
        const fileInput = document.querySelector(SELECTORS.fileInput);
        if (fileInput) {
            fileInput.click();
        }
    }

    /**
     * カスタムタイプモーダルを開く
     */
    openCustomTypeModal() {
        uiManager.openModal('custom-type-modal');
        
        // カスタムタイプ保存ボタンのイベント設定
        const saveBtn = document.getElementById('save-custom-type');
        if (saveBtn) {
            saveBtn.onclick = () => this.saveCustomType();
        }
    }

    /**
     * カスタムタイプの保存
     */
    saveCustomType() {
        const name = document.getElementById('custom-type-name').value.trim();
        const description = document.getElementById('custom-type-description').value.trim();

        if (!name) {
            uiManager.showNotification('タイプ名を入力してください', 'error');
            return;
        }

        if (CONTRACT_TEMPLATES[name]) {
            uiManager.showNotification('既存のタイプ名です', 'error');
            return;
        }

        // カスタムテンプレートの作成
        const customTemplate = {
            name: name,
            description: description,
            fields: [
                { name: 'partyAName', label: '甲', type: 'text', required: true, placeholder: '当事者A' },
                { name: 'partyBName', label: '乙', type: 'text', required: true, placeholder: '当事者B' },
                { name: 'contractTitle', label: '契約書タイトル', type: 'text', required: true, placeholder: name }
            ],
            defaultArticles: [
                {
                    id: 'custom_purpose',
                    title: '第1条（目的）',
                    content: 'この契約の目的を記載してください。',
                    required: false,
                    variables: {}
                }
            ]
        };

        // テンプレートに追加
        CONTRACT_TEMPLATES[name] = customTemplate;

        // セレクトボックスに追加
        this.addCustomTypeToSelect(name, customTemplate);

        // モーダルを閉じる
        uiManager.closeModal('custom-type-modal');
        
        // フォームクリア
        document.getElementById('custom-type-name').value = '';
        document.getElementById('custom-type-description').value = '';

        uiManager.showNotification(`カスタムタイプ「${name}」を追加しました`, 'success');
    }

    /**
     * カスタムタイプをセレクトボックスに追加
     * @param {string} name - タイプ名
     * @param {Object} template - テンプレート
     */
    addCustomTypeToSelect(name, template) {
        const select = document.querySelector(SELECTORS.contractType);
        if (select) {
            const option = document.createElement('option');
            option.value = name;
            option.textContent = template.name;
            select.appendChild(option);
        }
    }

    /**
     * ウィンドウリサイズの処理
     */
    handleWindowResize() {
        // モバイル表示の更新
        if (uiManager) {
            uiManager.updateMobileView();
        }

        // プレビューの再描画
        if (previewManager) {
            previewManager.forceUpdate();
        }
    }

    /**
     * イベントの発行
     * @param {string} eventName - イベント名
     * @param {any} data - イベントデータ
     */
    emit(eventName, data) {
        const listeners = this.eventBus.get(eventName) || [];
        listeners.forEach(listener => {
            try {
                listener(data);
            } catch (error) {
                console.error(`イベントリスナーエラー (${eventName}):`, error);
            }
        });
    }

    /**
     * イベントリスナーの追加
     * @param {string} eventName - イベント名
     * @param {Function} listener - リスナー関数
     */
    on(eventName, listener) {
        if (!this.eventBus.has(eventName)) {
            this.eventBus.set(eventName, []);
        }
        this.eventBus.get(eventName).push(listener);
    }

    /**
     * イベントリスナーの削除
     * @param {string} eventName - イベント名
     * @param {Function} listener - リスナー関数
     */
    off(eventName, listener) {
        const listeners = this.eventBus.get(eventName);
        if (listeners) {
            const index = listeners.indexOf(listener);
            if (index > -1) {
                listeners.splice(index, 1);
            }
        }
    }

    /**
     * アプリケーションの統計情報
     * @returns {Object} - 統計情報
     */
    getStatistics() {
        const formStats = formManager ? {
            filledFields: Object.keys(this.contractData).filter(key => 
                this.contractData[key] && this.contractData[key] !== ''
            ).length
        } : {};

        const articleStats = articleManager ? articleManager.getStatistics() : {};
        const previewStats = previewManager ? previewManager.getStatistics() : {};

        return {
            contractType: this.currentContractType,
            isInitialized: this.isInitialized,
            ...formStats,
            ...articleStats,
            ...previewStats,
            lastUpdate: new Date().toISOString()
        };
    }

    /**
     * アプリケーションのリセット
     */
    async reset() {
        uiManager.showConfirm(
            'すべての内容をリセットしますか？この操作は元に戻せません。',
            async () => {
                try {
                    // 各マネージャーのリセット
                    formManager.reset();
                    articleManager.reset();
                    previewManager.reset();
                    contractGenerator.reset();

                    // データのリセット
                    await this.loadDefaultData();

                    uiManager.showNotification('アプリケーションをリセットしました', 'success');
                } catch (error) {
                    console.error('リセットエラー:', error);
                    uiManager.showNotification(`リセットエラー: ${error.message}`, 'error');
                }
            }
        );
    }

    /**
     * デバッグ情報の出力
     */
    debug() {
        console.group('契約書ジェネレーター デバッグ情報');
        console.log('統計情報:', this.getStatistics());
        console.log('現在のデータ:', this.getCurrentData());
        console.log('ローカルストレージ使用量:', storageManager.getStorageUsage());
        console.groupEnd();
    }

    /**
     * アプリケーションの破棄
     */
    destroy() {
        // イベントリスナーのクリア
        this.eventBus.clear();

        // 自動保存の実行
        this.autoSave();

        // マネージャーの破棄
        if (storageManager && storageManager.destroy) {
            storageManager.destroy();
        }

        console.log('契約書ジェネレーター破棄完了');
    }
}

// アプリケーションの初期化
let app;

// DOM読み込み完了後に初期化
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        app = new ContractGeneratorApp();
        window.contractGeneratorApp = app;
    });
} else {
    app = new ContractGeneratorApp();
    window.contractGeneratorApp = app;
}

// デバッグ用のグローバル関数
window.debugContractGenerator = () => {
    if (app) app.debug();
};

// エラーハンドリング
window.addEventListener('error', (error) => {
    console.error('グローバルエラー:', error);
    if (window.uiManager) {
        uiManager.showNotification('予期しないエラーが発生しました', 'error');
    }
});

window.addEventListener('unhandledrejection', (event) => {
    console.error('未処理のPromise拒否:', event.reason);
    if (window.uiManager) {
        uiManager.showNotification('非同期処理でエラーが発生しました', 'error');
    }
});

console.log('契約書ジェネレーター メインスクリプト読み込み完了');
