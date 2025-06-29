// ===========================================
// プレビュー管理クラス - リアルタイムプレビュー表示
// ===========================================

class PreviewManager {
    constructor() {
        this.previewContainer = null;
        this.currentContractType = 'consulting';
        this.contractData = {};
        this.articles = [];
        this.isAutoUpdate = true;
        this.updateQueue = [];
        this.isUpdating = false;
        
        this.init();
    }

    /**
     * 初期化
     */
    init() {
        this.previewContainer = document.querySelector(SELECTORS.previewContent);
        if (!this.previewContainer) {
            console.error('プレビューコンテナが見つかりません');
            return;
        }

        this.setupEventListeners();
        this.setupUpdateQueue();
        this.renderPlaceholder();
    }

    /**
     * イベントリスナーの設定
     */
    setupEventListeners() {
        // プレビュー更新ボタン
        const refreshBtn = document.querySelector(SELECTORS.previewRefreshBtn);
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => {
                this.forceUpdate();
                uiManager.showNotification('プレビューを更新しました', 'success');
            });
        }

        // 自動更新の設定
        this.setupAutoUpdate();
    }

    /**
     * 自動更新の設定
     */
    setupAutoUpdate() {
        // デバウンス付きの更新関数
        this.debouncedUpdate = Utils.debounce(() => {
            if (this.isAutoUpdate) {
                this.update();
            }
        }, APP_CONFIG.PREVIEW_UPDATE_DELAY);

        // スクロール位置の保存・復元
        this.setupScrollPreservation();
    }

    /**
     * スクロール位置の保存・復元設定
     */
    setupScrollPreservation() {
        this.lastScrollPosition = 0;
        
        this.previewContainer.addEventListener('scroll', () => {
            this.lastScrollPosition = this.previewContainer.scrollTop;
        });
    }

    /**
     * 更新キューの設定
     */
    setupUpdateQueue() {
        // 更新キューの処理
        setInterval(() => {
            this.processUpdateQueue();
        }, 100);
    }

    /**
     * プレビューデータの設定
     * @param {string} contractType - 契約書タイプ
     * @param {Object} contractData - 契約データ
     * @param {Array} articles - 条項配列
     */
    setData(contractType, contractData, articles) {
        this.currentContractType = contractType;
        this.contractData = { ...contractData };
        this.articles = Utils.deepClone(articles);
        
        this.queueUpdate();
    }

    /**
     * 契約書タイプの設定
     * @param {string} contractType - 契約書タイプ
     */
    setContractType(contractType) {
        if (this.currentContractType !== contractType) {
            this.currentContractType = contractType;
            this.queueUpdate();
        }
    }

    /**
     * 契約データの設定
     * @param {Object} contractData - 契約データ
     */
    setContractData(contractData) {
        this.contractData = { ...contractData };
        this.queueUpdate();
    }

    /**
     * 条項データの設定
     * @param {Array} articles - 条項配列
     */
    setArticles(articles) {
        this.articles = Utils.deepClone(articles);
        this.queueUpdate();
    }

    /**
     * 更新をキューに追加
     */
    queueUpdate() {
        const updateData = {
            contractType: this.currentContractType,
            contractData: { ...this.contractData },
            articles: Utils.deepClone(this.articles),
            timestamp: Date.now()
        };

        this.updateQueue.push(updateData);
        
        // キューが溜まりすぎないように制限
        if (this.updateQueue.length > 10) {
            this.updateQueue = this.updateQueue.slice(-5);
        }
    }

    /**
     * 更新キューの処理
     */
    processUpdateQueue() {
        if (this.updateQueue.length === 0 || this.isUpdating) return;

        // 最新のデータのみ処理
        const latestUpdate = this.updateQueue.pop();
        this.updateQueue = [];

        this.performUpdate(latestUpdate);
    }

    /**
     * 更新の実行
     * @param {Object} updateData - 更新データ
     */
    performUpdate(updateData) {
        if (this.isUpdating) return;

        this.isUpdating = true;

        try {
            this.currentContractType = updateData.contractType;
            this.contractData = updateData.contractData;
            this.articles = updateData.articles;
            
            this.render();
        } catch (error) {
            console.error('プレビュー更新エラー:', error);
            this.renderError(error);
        } finally {
            this.isUpdating = false;
        }
    }

    /**
     * 強制更新
     */
    forceUpdate() {
        this.updateQueue = [];
        this.isUpdating = false;
        this.update();
    }

    /**
     * プレビューの更新
     */
    update() {
        this.queueUpdate();
    }

    /**
     * プレビューのレンダリング
     */
    render() {
        if (!this.previewContainer) return;

        const template = CONTRACT_TEMPLATES[this.currentContractType];
        if (!template) {
            this.renderError(new Error('無効な契約書タイプです'));
            return;
        }

        try {
            const html = this.generatePreviewHtml(template);
            this.previewContainer.innerHTML = html;
            
            // スクロール位置の復元
            this.restoreScrollPosition();
            
            // プレビュー表示アニメーション
            this.addPreviewAnimations();
            
        } catch (error) {
            console.error('プレビューレンダリングエラー:', error);
            this.renderError(error);
        }
    }

    /**
     * プレビューHTMLの生成
     * @param {Object} template - 契約書テンプレート
     * @returns {string} - プレビューHTML
     */
    generatePreviewHtml(template) {
        let html = '';

        // タイトル
        html += this.generateTitle();

        // 当事者情報
        html += this.generateParties();

        // 条項
        html += this.generateArticles();

        // 署名欄
        html += this.generateSignature();

        // プレビュー注記
        html += this.generatePreviewNote();

        return html;
    }

    /**
     * タイトルの生成
     * @returns {string} - タイトルHTML
     */
    generateTitle() {
        const template = CONTRACT_TEMPLATES[this.currentContractType];
        const title = this.contractData.contractTitle || template.name;
        
        return `<h1 class="preview-title">${Utils.sanitizeHtml(title)}</h1>`;
    }

    /**
     * 当事者情報の生成
     * @returns {string} - 当事者情報HTML
     */
    generateParties() {
        const partyA = this.getPartyName('A');
        const partyB = this.getPartyName('B');

        if (!partyA && !partyB) return '';

        return `
            <div class="preview-parties">
                <strong>${Utils.sanitizeHtml(partyA)}</strong>（以下「甲」という。）と 
                <strong>${Utils.sanitizeHtml(partyB)}</strong>（以下「乙」という。）は、以下のとおり契約を締結する。
            </div>
        `;
    }

    /**
     * 当事者名の取得
     * @param {string} party - 当事者（A or B）
     * @returns {string} - 当事者名
     */
    getPartyName(party) {
        const fields = {
            A: ['contractorName', 'employerName', 'discloserName', 'landlordName', 'sellerName', 'partyAName'],
            B: ['clientName', 'employeeName', 'recipientName', 'tenantName', 'buyerName', 'partyBName']
        };

        for (const field of fields[party]) {
            if (this.contractData[field]) {
                return this.contractData[field];
            }
        }

        return party === 'A' ? '甲' : '乙';
    }

    /**
     * 条項の生成
     * @returns {string} - 条項HTML
     */
    generateArticles() {
        if (!this.articles || this.articles.length === 0) {
            return '<div class="preview-no-articles">条項が設定されていません</div>';
        }

        return this.articles.map(article => this.generateArticle(article)).join('');
    }

    /**
     * 個別条項の生成
     * @param {Object} article - 条項オブジェクト
     * @returns {string} - 条項HTML
     */
    generateArticle(article) {
        const content = this.processArticleContent(article);
        
        return `
            <div class="preview-article" data-article-id="${article.id}">
                <div class="preview-article-title">${Utils.sanitizeHtml(article.title)}</div>
                <div class="preview-article-content">${content}</div>
            </div>
        `;
    }

    /**
     * 条項内容の処理
     * @param {Object} article - 条項オブジェクト
     * @returns {string} - 処理済み内容
     */
    processArticleContent(article) {
        let content = article.content || '';
        
        // 変数の置換
        content = this.replaceVariables(content, article.variables);
        
        // リスト形式の処理
        content = this.processLists(content);
        
        // 改行の処理
        content = content.replace(/\n/g, '<br>');
        
        return content;
    }

    /**
     * 変数の置換
     * @param {string} content - 内容
     * @param {Object} variables - 変数定義
     * @returns {string} - 置換後の内容
     */
    replaceVariables(content, variables) {
        if (!variables || typeof variables !== 'object') return content;

        let result = content;
        
        Object.keys(variables).forEach(key => {
            const value = this.contractData[key];
            let displayValue = value || `{{${variables[key]}}}`;
            
            // 値のフォーマット
            displayValue = this.formatVariableValue(key, displayValue);
            
            const replacement = value ? 
                `<strong class="variable-value">${Utils.sanitizeHtml(displayValue)}</strong>` :
                `<span class="variable-placeholder">${Utils.sanitizeHtml(displayValue)}</span>`;
            
            result = result.replace(new RegExp(`{{${key}}}`, 'g'), replacement);
        });

        return result;
    }

    /**
     * 変数値のフォーマット
     * @param {string} key - 変数キー
     * @param {any} value - 変数値
     * @returns {string} - フォーマット済み値
     */
    formatVariableValue(key, value) {
        if (!value) return value;

        // 日付フィールドの処理
        if (key.toLowerCase().includes('date')) {
            return Utils.formatDate(value);
        }

        // 金額フィールドの処理
        if (key.toLowerCase().includes('fee') || 
            key.toLowerCase().includes('salary') || 
            key.toLowerCase().includes('amount') ||
            key.toLowerCase().includes('rent')) {
            return Utils.formatNumber(value);
        }

        return value;
    }

    /**
     * リスト形式の処理
     * @param {string} content - 内容
     * @returns {string} - 処理済み内容
     */
    processLists(content) {
        // 番号付きリストの処理
        content = content.replace(/^(\d+)\.\s(.+)$/gm, '<div class="list-item numbered">$1. $2</div>');
        
        // 箇条書きリストの処理
        content = content.replace(/^[-*]\s(.+)$/gm, '<div class="list-item bulleted">• $1</div>');
        
        return content;
    }

    /**
     * 署名欄の生成
     * @returns {string} - 署名欄HTML
     */
    generateSignature() {
        const hasSignatureData = this.contractData.contractSignDate || 
                                this.contractData.contractorSignature || 
                                this.contractData.clientSignature ||
                                this.hasAnySignatureField();

        if (!hasSignatureData) return '';

        const signDate = this.contractData.contractSignDate ? 
            Utils.formatDate(this.contractData.contractSignDate) : '{{契約締結日}}';

        const contractorSig = this.getSignatureText('contractor');
        const clientSig = this.getSignatureText('client');

        return `
            <div class="preview-signature">
                <div class="signature-intro">
                    以上のとおり合意が成立したので、本書面を<strong>2通</strong>作成し、甲乙それぞれ<strong>1通</strong>を保持する。
                </div>
                <div class="preview-date">${signDate}</div>
                <div class="signature-table">
                    <div class="signature-cell">
                        <div class="signature-header">甲</div>
                        <div class="signature-content">${contractorSig}</div>
                    </div>
                    <div class="signature-cell">
                        <div class="signature-header">乙</div>
                        <div class="signature-content">${clientSig}</div>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * 署名フィールドの存在チェック
     * @returns {boolean} - 署名フィールドが存在するか
     */
    hasAnySignatureField() {
        const signatureFields = [
            'contractorSignature', 'clientSignature', 'employerSignature', 
            'employeeSignature', 'discloserSignature', 'recipientSignature',
            'landlordSignature', 'tenantSignature', 'sellerSignature', 'buyerSignature'
        ];

        return signatureFields.some(field => this.contractData[field]);
    }

    /**
     * 署名テキストの取得
     * @param {string} party - 当事者（contractor/client）
     * @returns {string} - 署名テキスト
     */
    getSignatureText(party) {
        const signatureFields = {
            contractor: ['contractorSignature', 'employerSignature', 'discloserSignature', 'landlordSignature', 'sellerSignature'],
            client: ['clientSignature', 'employeeSignature', 'recipientSignature', 'tenantSignature', 'buyerSignature']
        };

        for (const field of signatureFields[party]) {
            if (this.contractData[field]) {
                return Utils.formatSignature(this.contractData[field]);
            }
        }

        return party === 'contractor' ? '{{甲氏名　住所　印}}' : '{{乙氏名　住所　印}}';
    }

    /**
     * プレビュー注記の生成
     * @returns {string} - 注記HTML
     */
    generatePreviewNote() {
        return `
            <div class="preview-note">
                ※ これはプレビューです。完全版を見るには「契約書を生成」をクリックしてください。
            </div>
        `;
    }

    /**
     * プレースホルダーのレンダリング
     */
    renderPlaceholder() {
        if (!this.previewContainer) return;

        this.previewContainer.innerHTML = `
            <div class="preview-placeholder">
                <i class="fas fa-file-contract"></i>
                <h3>契約書プレビュー</h3>
                <p>契約書タイプを選択し、基本情報を入力するとプレビューが表示されます</p>
            </div>
        `;
    }

    /**
     * エラー表示
     * @param {Error} error - エラーオブジェクト
     */
    renderError(error) {
        if (!this.previewContainer) return;

        console.error('プレビューエラー:', error);

        this.previewContainer.innerHTML = `
            <div class="preview-error">
                <i class="fas fa-exclamation-triangle"></i>
                <h3>プレビューエラー</h3>
                <p>プレビューの生成中にエラーが発生しました</p>
                <details>
                    <summary>詳細情報</summary>
                    <pre>${Utils.sanitizeHtml(error.message)}</pre>
                </details>
                <button onclick="previewManager.forceUpdate()" class="btn btn-primary">
                    再試行
                </button>
            </div>
        `;
    }

    /**
     * スクロール位置の復元
     */
    restoreScrollPosition() {
        if (this.lastScrollPosition && this.previewContainer) {
            // 少し遅延させてレンダリング完了後に実行
            setTimeout(() => {
                this.previewContainer.scrollTop = this.lastScrollPosition;
            }, 50);
        }
    }

    /**
     * プレビューアニメーションの追加
     */
    addPreviewAnimations() {
        // 新しく追加された要素にアニメーションを適用
        const articles = this.previewContainer.querySelectorAll('.preview-article');
        articles.forEach((article, index) => {
            article.style.animationDelay = `${index * 50}ms`;
            article.classList.add('slide-in');
        });
    }

    /**
     * 自動更新の有効/無効切り替え
     * @param {boolean} enabled - 有効にするかどうか
     */
    setAutoUpdate(enabled) {
        this.isAutoUpdate = enabled;
        
        if (enabled) {
            uiManager.showNotification('自動更新を有効にしました', 'info');
        } else {
            uiManager.showNotification('自動更新を無効にしました', 'warning');
        }
    }

    /**
     * プレビューのエクスポート
     * @returns {string} - プレビューHTML
     */
    exportPreview() {
        if (!this.previewContainer) return '';
        
        // プレビュー注記を除いたHTMLを返す
        const clonedContainer = this.previewContainer.cloneNode(true);
        const note = clonedContainer.querySelector('.preview-note');
        if (note) note.remove();
        
        return clonedContainer.innerHTML;
    }

    /**
     * プレビューの印刷
     */
    printPreview() {
        const printWindow = window.open('', '_blank');
        const previewHtml = this.exportPreview();
        
        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>契約書プレビュー</title>
                <style>
                    body { font-family: "Yu Gothic", "Hiragino Sans", "Meiryo", sans-serif; }
                    .preview-title { text-align: center; font-size: 18pt; margin-bottom: 20px; }
                    .preview-parties { text-align: center; margin-bottom: 20px; font-weight: bold; }
                    .preview-article { margin-bottom: 15px; }
                    .preview-article-title { font-weight: bold; margin-bottom: 5px; }
                    .variable-value { font-weight: bold; }
                    .variable-placeholder { color: #999; font-style: italic; }
                    @media print { body { margin: 0; } }
                </style>
            </head>
            <body>${previewHtml}</body>
            </html>
        `);
        
        printWindow.document.close();
        printWindow.print();
    }

    /**
     * 統計情報の取得
     * @returns {Object} - 統計情報
     */
    getStatistics() {
        const filledFields = Object.keys(this.contractData).filter(key => 
            this.contractData[key] && this.contractData[key] !== ''
        ).length;

        const totalVariables = this.articles.reduce((sum, article) => 
            sum + Object.keys(article.variables || {}).length, 0
        );

        const filledVariables = this.articles.reduce((sum, article) => {
            const variables = Object.keys(article.variables || {});
            const filled = variables.filter(key => this.contractData[key]).length;
            return sum + filled;
        }, 0);

        return {
            filledFields,
            totalArticles: this.articles.length,
            totalVariables,
            filledVariables,
            completionPercentage: totalVariables > 0 ? 
                Math.round((filledVariables / totalVariables) * 100) : 100
        };
    }

    /**
     * リセット
     */
    reset() {
        this.currentContractType = 'consulting';
        this.contractData = {};
        this.articles = [];
        this.updateQueue = [];
        this.lastScrollPosition = 0;
        this.renderPlaceholder();
    }
}

// グローバルインスタンス
window.previewManager = new PreviewManager();
