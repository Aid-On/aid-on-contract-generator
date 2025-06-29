// ===========================================
// 契約書生成クラス - HTML/PDF出力機能
// ===========================================

class ContractGenerator {
    constructor() {
        this.generatedHtml = '';
        this.isGenerating = false;
        this.templates = new Map();
        
        this.init();
    }

    /**
     * 初期化
     */
    init() {
        this.setupEventListeners();
        this.loadCustomTemplates();
    }

    /**
     * イベントリスナーの設定
     */
    setupEventListeners() {
        // 生成ボタン
        const generateBtn = document.querySelector(SELECTORS.generateBtn);
        if (generateBtn) {
            generateBtn.addEventListener('click', () => this.generateContract());
        }

        // コピーボタン
        const copyBtn = document.querySelector(SELECTORS.copyBtn);
        if (copyBtn) {
            copyBtn.addEventListener('click', () => this.copyToClipboard());
        }

        // 新しいタブで開くボタン
        const openBtn = document.querySelector(SELECTORS.openBtn);
        if (openBtn) {
            openBtn.addEventListener('click', () => this.openInNewWindow());
        }

        // PDF出力ボタン
        const pdfBtn = document.querySelector(SELECTORS.exportPdfBtn);
        if (pdfBtn) {
            pdfBtn.addEventListener('click', () => this.exportToPdf());
        }

        // HTMLコード表示切り替え
        const toggleCodeBtn = document.querySelector(SELECTORS.toggleCodeBtn);
        if (toggleCodeBtn) {
            toggleCodeBtn.addEventListener('click', () => this.toggleCodeDisplay());
        }
    }

    /**
     * カスタムテンプレートの読み込み
     */
    loadCustomTemplates() {
        // ローカルストレージからカスタムテンプレートを読み込み
        try {
            const saved = localStorage.getItem('customContractTemplates');
            if (saved) {
                const customTemplates = JSON.parse(saved);
                Object.keys(customTemplates).forEach(key => {
                    this.templates.set(key, customTemplates[key]);
                });
            }
        } catch (error) {
            console.error('カスタムテンプレート読み込みエラー:', error);
        }
    }

    /**
     * 契約書の生成
     * @param {string} contractType - 契約書タイプ
     * @param {Object} contractData - 契約データ
     * @param {Array} articles - 条項配列
     * @returns {Promise<string>} - 生成されたHTML
     */
    async generateContract(contractType = null, contractData = null, articles = null) {
        if (this.isGenerating) {
            uiManager.showNotification('生成中です。しばらくお待ちください。', 'warning');
            return;
        }

        this.isGenerating = true;
        
        try {
            // データの取得
            const type = contractType || window.currentContractType || 'consulting';
            const data = contractData || window.contractData || {};
            const articleList = articles || window.contractArticles || [];

            // バリデーション
            const validation = this.validateContractData(type, data, articleList);
            if (!validation.isValid) {
                throw new Error(validation.message);
            }

            // 生成プロセスの開始
            uiManager.showLoading(document.querySelector(SELECTORS.generateBtn), true);
            uiManager.showProgress(10, '契約書テンプレートを準備中...');

            // テンプレートの取得
            const template = this.getTemplate(type);
            
            uiManager.showProgress(30, '契約内容を処理中...');

            // HTML生成
            const html = await this.buildContractHtml(template, data, articleList);
            
            uiManager.showProgress(80, '最終調整中...');

            // 生成結果の保存
            this.generatedHtml = html;
            this.displayGeneratedCode(html);
            this.enableExportButtons();

            uiManager.showProgress(100, '契約書生成完了！');
            uiManager.showNotification('契約書が正常に生成されました！', 'success');

            return html;

        } catch (error) {
            console.error('契約書生成エラー:', error);
            uiManager.showNotification(`生成エラー: ${error.message}`, 'error');
            throw error;
        } finally {
            this.isGenerating = false;
            uiManager.showLoading(document.querySelector(SELECTORS.generateBtn), false);
        }
    }

    /**
     * 契約データのバリデーション
     * @param {string} contractType - 契約書タイプ
     * @param {Object} contractData - 契約データ
     * @param {Array} articles - 条項配列
     * @returns {Object} - バリデーション結果
     */
    validateContractData(contractType, contractData, articles) {
        // 契約書タイプの確認
        if (!contractType || !CONTRACT_TEMPLATES[contractType]) {
            return { isValid: false, message: '無効な契約書タイプです' };
        }

        // 必須フィールドの確認
        const template = CONTRACT_TEMPLATES[contractType];
        const requiredFields = template.fields.filter(field => field.required);
        
        for (const field of requiredFields) {
            if (!contractData[field.name] || contractData[field.name].trim() === '') {
                return { 
                    isValid: false, 
                    message: `${field.label}は必須入力です` 
                };
            }
        }

        // 条項の確認
        if (!articles || articles.length === 0) {
            return { isValid: false, message: '条項が設定されていません' };
        }

        // 必須条項の確認
        const requiredArticles = articles.filter(article => article.required);
        const hasRequiredArticles = requiredArticles.length > 0;
        
        if (!hasRequiredArticles && template.defaultArticles.some(a => a.required)) {
            return { 
                isValid: false, 
                message: '必須条項が不足しています' 
            };
        }

        return { isValid: true };
    }

    /**
     * テンプレートの取得
     * @param {string} contractType - 契約書タイプ
     * @returns {Object} - テンプレート
     */
    getTemplate(contractType) {
        // カスタムテンプレートを優先
        if (this.templates.has(contractType)) {
            return this.templates.get(contractType);
        }

        // デフォルトテンプレート
        return CONTRACT_TEMPLATES[contractType];
    }

    /**
     * 契約書HTMLの構築
     * @param {Object} template - テンプレート
     * @param {Object} contractData - 契約データ
     * @param {Array} articles - 条項配列
     * @returns {Promise<string>} - 生成されたHTML
     */
    async buildContractHtml(template, contractData, articles) {
        const config = APP_CONFIG.CONTRACT_STYLES;
        
        const html = `<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${Utils.sanitizeHtml(contractData.contractTitle || template.name)}</title>
    <style>
        ${this.generateContractStyles(config)}
    </style>
</head>
<body>
    ${await this.generateContractBody(template, contractData, articles)}
</body>
</html>`;

        return this.optimizeHtml(html);
    }

    /**
     * 契約書スタイルの生成
     * @param {Object} config - スタイル設定
     * @returns {string} - CSS
     */
    generateContractStyles(config) {
        return `
            @page {
                size: A4;
                margin: ${config.pageMargin};
            }
            
            body {
                font-family: ${config.fontFamily};
                font-size: ${config.fontSize};
                line-height: ${config.lineHeight};
                margin: 0;
                padding: 20px;
                background-color: white;
                color: #000;
                max-width: 21cm;
                margin: 0 auto;
            }
            
            h1 {
                text-align: center;
                font-size: 18pt;
                font-weight: bold;
                margin-bottom: 30px;
                margin-top: 20px;
                page-break-after: avoid;
            }
            
            .contract-parties {
                text-align: center;
                margin-bottom: 20px;
                font-weight: bold;
                page-break-after: avoid;
            }
            
            .article {
                margin-bottom: 20px;
                page-break-inside: avoid;
            }
            
            .article-title {
                font-weight: bold;
                margin-bottom: 8px;
                page-break-after: avoid;
            }
            
            .article-content {
                margin-left: 0;
            }
            
            .article-list {
                margin: 10px 0;
                padding-left: 20px;
            }
            
            .article-list ol,
            .article-list ul {
                margin: 5px 0;
                padding-left: 20px;
            }
            
            .article-list li {
                margin-bottom: 5px;
                line-height: 1.6;
            }
            
            .highlight {
                font-weight: bold;
                color: #1a1a1a;
            }
            
            .signature-section {
                margin-top: 40px;
                page-break-inside: avoid;
            }
            
            .signature-intro {
                margin-bottom: 20px;
                text-align: center;
            }
            
            .signature-date {
                text-align: center;
                margin-bottom: 20px;
                font-weight: bold;
            }
            
            .signature-table {
                width: 100%;
                border-collapse: collapse;
                margin-top: 20px;
            }
            
            .signature-table th,
            .signature-table td {
                border: 1px solid #000;
                padding: 15px;
                text-align: center;
                vertical-align: top;
            }
            
            .signature-table th {
                background-color: #f9f9f9;
                font-weight: bold;
                width: 50%;
            }
            
            .signature-table td {
                height: 100px;
                font-size: 10pt;
            }
            
            .contract-footer {
                margin-top: 30px;
                text-align: center;
                font-size: 9pt;
                color: #666;
                border-top: 1px solid #ddd;
                padding-top: 10px;
            }
            
            hr {
                border: none;
                border-top: 1px solid #000;
                margin: 30px 0;
            }
            
            @media print {
                body {
                    padding: 0;
                }
                
                .signature-section,
                .article {
                    page-break-inside: avoid;
                }
                
                .contract-footer {
                    position: fixed;
                    bottom: 0;
                    width: 100%;
                }
            }
            
            /* 追加スタイル */
            .variable-placeholder {
                background-color: #f0f0f0;
                padding: 2px 4px;
                border-radius: 3px;
                font-style: italic;
            }
            
            .contract-meta {
                font-size: 9pt;
                color: #666;
                margin-bottom: 20px;
                text-align: right;
            }
        `;
    }

    /**
     * 契約書本文の生成
     * @param {Object} template - テンプレート
     * @param {Object} contractData - 契約データ
     * @param {Array} articles - 条項配列
     * @returns {Promise<string>} - 本文HTML
     */
    async generateContractBody(template, contractData, articles) {
        let body = '';

        // メタ情報
        body += this.generateMetaInfo(contractData);

        // タイトル
        body += this.generateTitleSection(template, contractData);

        // 当事者情報
        body += this.generatePartiesSection(contractData);

        // 条項
        body += await this.generateArticlesSection(articles, contractData);

        // 区切り線
        body += '<hr>';

        // 署名欄
        body += this.generateSignatureSection(contractData);

        return body;
    }

    /**
     * メタ情報の生成
     * @param {Object} contractData - 契約データ
     * @returns {string} - メタ情報HTML
     */
    generateMetaInfo(contractData) {
        const now = new Date();
        const generatedDate = now.toLocaleDateString('ja-JP');
        const generatedTime = now.toLocaleTimeString('ja-JP');

        return `
            <div class="contract-meta">
                生成日時: ${generatedDate} ${generatedTime}
            </div>
        `;
    }

    /**
     * タイトルセクションの生成
     * @param {Object} template - テンプレート
     * @param {Object} contractData - 契約データ
     * @returns {string} - タイトルHTML
     */
    generateTitleSection(template, contractData) {
        const title = contractData.contractTitle || template.name;
        return `<h1>${Utils.sanitizeHtml(title)}</h1>`;
    }

    /**
     * 当事者セクションの生成
     * @param {Object} contractData - 契約データ
     * @returns {string} - 当事者情報HTML
     */
    generatePartiesSection(contractData) {
        const partyA = this.getPartyName(contractData, 'A');
        const partyB = this.getPartyName(contractData, 'B');

        return `
            <div class="contract-parties">
                <strong>${Utils.sanitizeHtml(partyA)}</strong>（以下「甲」という。）と 
                <strong>${Utils.sanitizeHtml(partyB)}</strong>（以下「乙」という。）は、以下のとおり契約を締結する。
            </div>
        `;
    }

    /**
     * 当事者名の取得
     * @param {Object} contractData - 契約データ
     * @param {string} party - 当事者（A or B）
     * @returns {string} - 当事者名
     */
    getPartyName(contractData, party) {
        const fields = {
            A: ['contractorName', 'employerName', 'discloserName', 'landlordName', 'sellerName', 'partyAName'],
            B: ['clientName', 'employeeName', 'recipientName', 'tenantName', 'buyerName', 'partyBName']
        };

        for (const field of fields[party]) {
            if (contractData[field]) {
                return contractData[field];
            }
        }

        return party === 'A' ? '甲' : '乙';
    }

    /**
     * 条項セクションの生成
     * @param {Array} articles - 条項配列
     * @param {Object} contractData - 契約データ
     * @returns {Promise<string>} - 条項HTML
     */
    async generateArticlesSection(articles, contractData) {
        if (!articles || articles.length === 0) {
            return '<div class="no-articles">条項が設定されていません</div>';
        }

        const articlePromises = articles.map(article => 
            this.generateArticleHtml(article, contractData)
        );

        const articleHtmls = await Promise.all(articlePromises);
        return articleHtmls.join('');
    }

    /**
     * 個別条項HTMLの生成
     * @param {Object} article - 条項オブジェクト
     * @param {Object} contractData - 契約データ
     * @returns {Promise<string>} - 条項HTML
     */
    async generateArticleHtml(article, contractData) {
        const content = await this.processArticleContent(article, contractData);
        
        return `
            <div class="article" data-article-id="${article.id}">
                <div class="article-title">${Utils.sanitizeHtml(article.title)}</div>
                <div class="article-content">${content}</div>
            </div>
        `;
    }

    /**
     * 条項内容の処理
     * @param {Object} article - 条項オブジェクト
     * @param {Object} contractData - 契約データ
     * @returns {Promise<string>} - 処理済み内容
     */
    async processArticleContent(article, contractData) {
        let content = article.content || '';
        
        // 変数の置換
        content = this.replaceVariablesForHtml(content, article.variables, contractData);
        
        // リスト形式の処理
        content = this.processListsForHtml(content);
        
        // 改行の処理
        content = content.replace(/\n/g, '<br>');
        
        // 特殊フォーマットの処理
        content = await this.processSpecialFormats(content, contractData);
        
        return content;
    }

    /**
     * HTML用変数置換
     * @param {string} content - 内容
     * @param {Object} variables - 変数定義
     * @param {Object} contractData - 契約データ
     * @returns {string} - 置換後の内容
     */
    replaceVariablesForHtml(content, variables, contractData) {
        if (!variables || typeof variables !== 'object') return content;

        let result = content;
        
        Object.keys(variables).forEach(key => {
            const value = contractData[key];
            let displayValue = value || `{{${variables[key]}}}`;
            
            // 値のフォーマット
            displayValue = this.formatValueForHtml(key, displayValue);
            
            const replacement = value ? 
                `<span class="highlight">${Utils.sanitizeHtml(displayValue)}</span>` :
                `<span class="variable-placeholder">${Utils.sanitizeHtml(displayValue)}</span>`;
            
            result = result.replace(new RegExp(`{{${key}}}`, 'g'), replacement);
        });

        return result;
    }

    /**
     * HTML用値フォーマット
     * @param {string} key - 変数キー
     * @param {any} value - 変数値
     * @returns {string} - フォーマット済み値
     */
    formatValueForHtml(key, value) {
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
     * HTML用リスト処理
     * @param {string} content - 内容
     * @returns {string} - 処理済み内容
     */
    processListsForHtml(content) {
        // 番号付きリストの検出と変換
        if (/^\d+\.\s/.test(content.trim())) {
            const items = content.split('\n').filter(line => line.trim());
            const listItems = items.map(item => {
                if (/^\d+\.\s/.test(item.trim())) {
                    return `<li>${item.replace(/^\d+\.\s/, '')}</li>`;
                }
                return item;
            }).join('');
            
            if (listItems.includes('<li>')) {
                return `<div class="article-list"><ol>${listItems}</ol></div>`;
            }
        }

        // 箇条書きリストの処理
        content = content.replace(/^[-*]\s(.+)$/gm, '<li>$1</li>');
        if (content.includes('<li>')) {
            content = `<div class="article-list"><ul>${content}</ul></div>`;
            content = content.replace(/([^>])\n<li>/g, '$1</li>\n<li>');
        }

        return content;
    }

    /**
     * 特殊フォーマットの処理
     * @param {string} content - 内容
     * @param {Object} contractData - 契約データ
     * @returns {Promise<string>} - 処理済み内容
     */
    async processSpecialFormats(content, contractData) {
        // テーブル形式の処理
        content = this.processTableFormat(content);
        
        // 条件付きテキストの処理
        content = this.processConditionalText(content, contractData);
        
        // 計算式の処理
        content = await this.processCalculations(content, contractData);
        
        return content;
    }

    /**
     * テーブル形式の処理
     * @param {string} content - 内容
     * @returns {string} - 処理済み内容
     */
    processTableFormat(content) {
        // 簡単なテーブル記法 |col1|col2| の処理
        const tableRegex = /\|(.+)\|/g;
        return content.replace(tableRegex, (match, cells) => {
            const cellArray = cells.split('|').map(cell => cell.trim());
            const cellsHtml = cellArray.map(cell => `<td>${cell}</td>`).join('');
            return `<table style="border-collapse: collapse; width: 100%;"><tr>${cellsHtml}</tr></table>`;
        });
    }

    /**
     * 条件付きテキストの処理
     * @param {string} content - 内容
     * @param {Object} contractData - 契約データ
     * @returns {string} - 処理済み内容
     */
    processConditionalText(content, contractData) {
        // {{if:field}}text{{/if}} 形式の条件付きテキスト
        return content.replace(/\{\{if:(\w+)\}\}(.*?)\{\{\/if\}\}/g, (match, field, text) => {
            return contractData[field] ? text : '';
        });
    }

    /**
     * 計算式の処理
     * @param {string} content - 内容
     * @param {Object} contractData - 契約データ
     * @returns {Promise<string>} - 処理済み内容
     */
    async processCalculations(content, contractData) {
        // {{calc:expression}} 形式の計算式
        return content.replace(/\{\{calc:(.*?)\}\}/g, (match, expression) => {
            try {
                // 安全な計算のため、基本的な四則演算のみ許可
                const safeExpression = expression.replace(/[^0-9+\-*/.() ]/g, '');
                const result = Function(`"use strict"; return (${safeExpression})`)();
                return Utils.formatNumber(result);
            } catch (error) {
                console.error('計算エラー:', error);
                return match; // エラー時は元の文字列を返す
            }
        });
    }

    /**
     * 署名セクションの生成
     * @param {Object} contractData - 契約データ
     * @returns {string} - 署名欄HTML
     */
    generateSignatureSection(contractData) {
        const signDate = contractData.contractSignDate ? 
            Utils.formatDate(contractData.contractSignDate) : '{{契約締結日}}';

        const contractorSig = this.getSignatureHtml(contractData, 'contractor');
        const clientSig = this.getSignatureHtml(contractData, 'client');

        return `
            <div class="signature-section">
                <div class="signature-intro">
                    以上のとおり合意が成立したので、本書面を<strong>2通</strong>作成し、甲乙それぞれ<strong>1通</strong>を保持する。
                </div>
                
                <div class="signature-date">
                    ${signDate}
                </div>

                <table class="signature-table">
                    <thead>
                        <tr>
                            <th>甲</th>
                            <th>乙</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>${contractorSig}</td>
                            <td>${clientSig}</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        `;
    }

    /**
     * 署名HTMLの取得
     * @param {Object} contractData - 契約データ
     * @param {string} party - 当事者（contractor/client）
     * @returns {string} - 署名HTML
     */
    getSignatureHtml(contractData, party) {
        const signatureFields = {
            contractor: ['contractorSignature', 'employerSignature', 'discloserSignature', 'landlordSignature', 'sellerSignature'],
            client: ['clientSignature', 'employeeSignature', 'recipientSignature', 'tenantSignature', 'buyerSignature']
        };

        for (const field of signatureFields[party]) {
            if (contractData[field]) {
                return Utils.formatSignature(contractData[field]);
            }
        }

        return party === 'contractor' ? '{{甲氏名　住所　印}}' : '{{乙氏名　住所　印}}';
    }

    /**
     * HTMLの最適化
     * @param {string} html - 最適化対象のHTML
     * @returns {string} - 最適化されたHTML
     */
    optimizeHtml(html) {
        // 不要な空白行の削除
        html = html.replace(/\n\s*\n/g, '\n');
        
        // インデントの整理
        html = html.replace(/^\s+/gm, '');
        
        // HTMLの整形
        html = this.formatHtml(html);
        
        return html;
    }

    /**
     * HTMLの整形
     * @param {string} html - 整形対象のHTML
     * @returns {string} - 整形されたHTML
     */
    formatHtml(html) {
        // 基本的なHTML整形
        return html
            .replace(/></g, '>\n<')
            .replace(/^\s*\n/gm, '')
            .trim();
    }

    /**
     * 生成されたコードの表示
     * @param {string} html - 生成されたHTML
     */
    displayGeneratedCode(html) {
        const textarea = document.querySelector(SELECTORS.generatedHtml);
        const codeSection = document.querySelector(SELECTORS.htmlCodeSection);
        
        if (textarea) {
            textarea.value = html;
        }
        
        if (codeSection) {
            codeSection.style.display = 'block';
            Utils.showWithAnimation(codeSection, 'slide-in');
        }
    }

    /**
     * エクスポートボタンの有効化
     */
    enableExportButtons() {
        const buttons = [
            document.querySelector(SELECTORS.copyBtn),
            document.querySelector(SELECTORS.openBtn),
            document.querySelector(SELECTORS.exportPdfBtn)
        ];

        buttons.forEach(btn => {
            if (btn) {
                btn.disabled = false;
                btn.classList.remove('disabled');
            }
        });
    }

    /**
     * クリップボードにコピー
     */
    async copyToClipboard() {
        if (!this.generatedHtml) {
            uiManager.showNotification('先に契約書を生成してください', 'error');
            return;
        }

        try {
            await navigator.clipboard.writeText(this.generatedHtml);
            uiManager.showNotification('HTMLコードをクリップボードにコピーしました！', 'success');
        } catch (error) {
            console.error('コピーエラー:', error);
            uiManager.showNotification('コピーに失敗しました', 'error');
        }
    }

    /**
     * 新しいウィンドウで開く
     */
    openInNewWindow() {
        if (!this.generatedHtml) {
            uiManager.showNotification('先に契約書を生成してください', 'error');
            return;
        }

        const newWindow = window.open('', '_blank');
        newWindow.document.write(this.generatedHtml);
        newWindow.document.close();
    }

    /**
     * PDF出力
     */
    exportToPdf() {
        if (!this.generatedHtml) {
            uiManager.showNotification('先に契約書を生成してください', 'error');
            return;
        }

        // 新しいウィンドウで開いて印刷ダイアログを表示
        const printWindow = window.open('', '_blank');
        printWindow.document.write(this.generatedHtml);
        printWindow.document.close();
        
        // 印刷ダイアログを表示
        setTimeout(() => {
            printWindow.print();
        }, 500);
    }

    /**
     * HTMLコード表示の切り替え
     */
    toggleCodeDisplay() {
        const textarea = document.querySelector(SELECTORS.generatedHtml);
        const button = document.querySelector(SELECTORS.toggleCodeBtn);
        
        if (!textarea || !button) return;

        if (textarea.style.display === 'none') {
            textarea.style.display = 'block';
            button.textContent = '非表示';
        } else {
            textarea.style.display = 'none';
            button.textContent = '表示';
        }
    }

    /**
     * カスタムテンプレートの追加
     * @param {string} name - テンプレート名
     * @param {Object} template - テンプレートオブジェクト
     */
    addCustomTemplate(name, template) {
        this.templates.set(name, template);
        this.saveCustomTemplates();
    }

    /**
     * カスタムテンプレートの保存
     */
    saveCustomTemplates() {
        try {
            const customTemplates = {};
            this.templates.forEach((template, name) => {
                if (!CONTRACT_TEMPLATES[name]) {
                    customTemplates[name] = template;
                }
            });
            
            localStorage.setItem('customContractTemplates', JSON.stringify(customTemplates));
        } catch (error) {
            console.error('カスタムテンプレート保存エラー:', error);
        }
    }

    /**
     * 生成されたHTMLの取得
     * @returns {string} - 生成されたHTML
     */
    getGeneratedHtml() {
        return this.generatedHtml;
    }

    /**
     * リセット
     */
    reset() {
        this.generatedHtml = '';
        this.isGenerating = false;
        
        // ボタンの無効化
        const buttons = [
            document.querySelector(SELECTORS.copyBtn),
            document.querySelector(SELECTORS.openBtn),
            document.querySelector(SELECTORS.exportPdfBtn)
        ];

        buttons.forEach(btn => {
            if (btn) {
                btn.disabled = true;
                btn.classList.add('disabled');
            }
        });

        // コード表示エリアの非表示
        const codeSection = document.querySelector(SELECTORS.htmlCodeSection);
        if (codeSection) {
            codeSection.style.display = 'none';
        }
    }
}

// グローバルインスタンス
window.contractGenerator = new ContractGenerator();
