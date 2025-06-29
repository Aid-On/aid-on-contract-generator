// ===========================================
// 条項管理クラス - 条項の追加・編集・削除・並び替え
// ===========================================

class ArticleManager {
    constructor() {
        this.articles = [];
        this.container = null;
        this.currentEditingIndex = null;
        this.draggedElement = null;
        this.changeListeners = new Set();
        
        this.init();
    }

    /**
     * 初期化
     */
    init() {
        this.container = document.querySelector(SELECTORS.articlesContainer);
        if (!this.container) {
            console.error('条項コンテナが見つかりません');
            return;
        }

        this.setupEventListeners();
        this.setupDragAndDrop();
    }

    /**
     * イベントリスナーの設定
     */
    setupEventListeners() {
        // 条項追加ボタン
        const addBtn = document.querySelector(SELECTORS.addArticleBtn);
        if (addBtn) {
            addBtn.addEventListener('click', () => this.openEditor());
        }

        // モーダル内の保存ボタン
        const saveBtn = document.getElementById('save-article');
        if (saveBtn) {
            saveBtn.addEventListener('click', () => this.saveArticle());
        }
    }

    /**
     * ドラッグ&ドロップの設定
     */
    setupDragAndDrop() {
        this.container.addEventListener('dragstart', (e) => this.handleDragStart(e));
        this.container.addEventListener('dragover', (e) => this.handleDragOver(e));
        this.container.addEventListener('drop', (e) => this.handleDrop(e));
        this.container.addEventListener('dragend', (e) => this.handleDragEnd(e));
    }

    /**
     * 条項一覧の読み込み
     * @param {Array} articles - 条項配列
     */
    loadArticles(articles) {
        this.articles = Utils.deepClone(articles) || [];
        this.render();
    }

    /**
     * 条項の取得
     * @returns {Array} - 条項配列
     */
    getArticles() {
        return Utils.deepClone(this.articles);
    }

    /**
     * 条項の追加
     * @param {Object} article - 条項オブジェクト
     * @param {number} index - 挿入位置（省略時は末尾）
     */
    addArticle(article, index = null) {
        const newArticle = {
            id: article.id || Utils.generateRandomId(),
            title: article.title || '',
            content: article.content || '',
            required: Boolean(article.required),
            variables: article.variables || {},
            order: index !== null ? index : this.articles.length,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        if (index !== null && index >= 0 && index <= this.articles.length) {
            this.articles.splice(index, 0, newArticle);
            this.updateOrders();
        } else {
            this.articles.push(newArticle);
        }

        this.render();
        this.notifyChange('add', newArticle, index);
        
        uiManager.showNotification('条項を追加しました', 'success');
    }

    /**
     * 条項の更新
     * @param {number} index - 更新する条項のインデックス
     * @param {Object} updates - 更新内容
     */
    updateArticle(index, updates) {
        if (index < 0 || index >= this.articles.length) {
            console.error('無効な条項インデックス:', index);
            return;
        }

        const oldArticle = Utils.deepClone(this.articles[index]);
        this.articles[index] = {
            ...this.articles[index],
            ...updates,
            updatedAt: new Date().toISOString()
        };

        this.render();
        this.notifyChange('update', this.articles[index], index, oldArticle);
        
        uiManager.showNotification('条項を更新しました', 'success');
    }

    /**
     * 条項の削除
     * @param {number} index - 削除する条項のインデックス
     */
    deleteArticle(index) {
        if (index < 0 || index >= this.articles.length) {
            console.error('無効な条項インデックス:', index);
            return;
        }

        const article = this.articles[index];
        
        if (article.required) {
            uiManager.showNotification('必須条項は削除できません', 'error');
            return;
        }

        uiManager.showConfirm(
            '条項を削除しますか？この操作は元に戻せません。',
            () => {
                const deletedArticle = this.articles.splice(index, 1)[0];
                this.updateOrders();
                this.render();
                this.notifyChange('delete', deletedArticle, index);
                
                uiManager.showNotification('条項を削除しました', 'success');
            }
        );
    }

    /**
     * 条項の移動
     * @param {number} fromIndex - 移動元のインデックス
     * @param {number} toIndex - 移動先のインデックス
     */
    moveArticle(fromIndex, toIndex) {
        if (fromIndex === toIndex) return;
        
        if (fromIndex < 0 || fromIndex >= this.articles.length ||
            toIndex < 0 || toIndex >= this.articles.length) {
            console.error('無効な移動インデックス:', fromIndex, toIndex);
            return;
        }

        const movedArticle = this.articles.splice(fromIndex, 1)[0];
        this.articles.splice(toIndex, 0, movedArticle);
        
        this.updateOrders();
        this.render();
        this.notifyChange('move', movedArticle, { fromIndex, toIndex });
        
        uiManager.showNotification('条項を移動しました', 'success');
    }

    /**
     * 条項の複製
     * @param {number} index - 複製する条項のインデックス
     */
    duplicateArticle(index) {
        if (index < 0 || index >= this.articles.length) {
            console.error('無効な条項インデックス:', index);
            return;
        }

        const originalArticle = this.articles[index];
        const duplicatedArticle = {
            ...Utils.deepClone(originalArticle),
            id: Utils.generateRandomId(),
            title: `${originalArticle.title} (コピー)`,
            required: false, // 複製は必須条項にしない
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        this.addArticle(duplicatedArticle, index + 1);
    }

    /**
     * 条項順序の更新
     */
    updateOrders() {
        this.articles.forEach((article, index) => {
            article.order = index;
        });
    }

    /**
     * 条項エディターを開く
     * @param {number} index - 編集する条項のインデックス（新規作成時はnull）
     */
    openEditor(index = null) {
        this.currentEditingIndex = index;
        
        const modal = document.querySelector(SELECTORS.articleEditorModal);
        if (!modal) {
            console.error('条項エディターモーダルが見つかりません');
            return;
        }

        // フォームをクリア
        this.clearEditorForm();

        // 編集モードの場合、既存データを設定
        if (index !== null && this.articles[index]) {
            this.populateEditorForm(this.articles[index]);
        } else {
            // 新規作成時のデフォルト値設定
            this.setDefaultEditorValues();
        }

        uiManager.openModal('article-editor-modal');
    }

    /**
     * エディターフォームのクリア
     */
    clearEditorForm() {
        document.getElementById('article-title').value = '';
        document.getElementById('article-content').value = '';
        document.getElementById('article-required').checked = false;
        document.getElementById('article-variables').value = '{}';
    }

    /**
     * エディターフォームにデータを設定
     * @param {Object} article - 条項オブジェクト
     */
    populateEditorForm(article) {
        document.getElementById('article-title').value = article.title || '';
        document.getElementById('article-content').value = article.content || '';
        document.getElementById('article-required').checked = Boolean(article.required);
        document.getElementById('article-variables').value = 
            Utils.safeJsonStringify(article.variables || {});
    }

    /**
     * エディターのデフォルト値設定
     */
    setDefaultEditorValues() {
        const nextNumber = this.articles.length + 1;
        document.getElementById('article-title').value = `第${nextNumber}条（）`;
        document.getElementById('article-content').value = '';
        document.getElementById('article-required').checked = false;
        document.getElementById('article-variables').value = '{}';
    }

    /**
     * 条項の保存
     */
    saveArticle() {
        const formData = this.getEditorFormData();
        const validation = this.validateArticleData(formData);
        
        if (!validation.isValid) {
            uiManager.showNotification(validation.message, 'error');
            return;
        }

        const articleData = {
            title: formData.title,
            content: formData.content,
            required: formData.required,
            variables: formData.variables
        };

        if (this.currentEditingIndex !== null) {
            // 更新
            this.updateArticle(this.currentEditingIndex, articleData);
        } else {
            // 新規追加
            this.addArticle(articleData);
        }

        uiManager.closeModal('article-editor-modal');
        this.currentEditingIndex = null;
    }

    /**
     * エディターフォームからデータを取得
     * @returns {Object} - フォームデータ
     */
    getEditorFormData() {
        return {
            title: document.getElementById('article-title').value.trim(),
            content: document.getElementById('article-content').value.trim(),
            required: document.getElementById('article-required').checked,
            variables: Utils.safeJsonParse(
                document.getElementById('article-variables').value.trim(),
                {}
            )
        };
    }

    /**
     * 条項データのバリデーション
     * @param {Object} data - 条項データ
     * @returns {Object} - バリデーション結果
     */
    validateArticleData(data) {
        if (!data.title) {
            return { isValid: false, message: '条項タイトルは必須です' };
        }

        if (!data.content) {
            return { isValid: false, message: '条項内容は必須です' };
        }

        // 変数定義の妥当性チェック
        if (typeof data.variables !== 'object' || Array.isArray(data.variables)) {
            return { isValid: false, message: '変数定義はオブジェクト形式で入力してください' };
        }

        // 重複タイトルのチェック
        const existingTitles = this.articles
            .filter((_, index) => index !== this.currentEditingIndex)
            .map(article => article.title);
        
        if (existingTitles.includes(data.title)) {
            return { isValid: false, message: '同じタイトルの条項が既に存在します' };
        }

        return { isValid: true };
    }

    /**
     * 条項一覧のレンダリング
     */
    render() {
        if (!this.container) return;

        this.container.innerHTML = '';

        if (this.articles.length === 0) {
            this.renderEmptyState();
            return;
        }

        this.articles.forEach((article, index) => {
            const articleElement = this.createArticleElement(article, index);
            this.container.appendChild(articleElement);
        });

        // レンダリング後のアニメーション
        Utils.showWithAnimation(this.container, 'fade-in');
    }

    /**
     * 空状態のレンダリング
     */
    renderEmptyState() {
        const emptyDiv = document.createElement('div');
        emptyDiv.className = 'empty-articles';
        emptyDiv.innerHTML = `
            <div style="text-align: center; padding: 2rem; color: #6b7280;">
                <i class="fas fa-file-alt" style="font-size: 3rem; margin-bottom: 1rem; opacity: 0.5;"></i>
                <p>条項がありません</p>
                <p style="font-size: 0.875rem;">「条項追加」ボタンから新しい条項を追加してください</p>
            </div>
        `;
        this.container.appendChild(emptyDiv);
    }

    /**
     * 条項要素の作成
     * @param {Object} article - 条項オブジェクト
     * @param {number} index - インデックス
     * @returns {HTMLElement} - 条項要素
     */
    createArticleElement(article, index) {
        const articleDiv = document.createElement('div');
        articleDiv.className = 'article-item';
        articleDiv.draggable = true;
        articleDiv.dataset.index = index;
        articleDiv.dataset.articleId = article.id;

        articleDiv.innerHTML = `
            <div class="article-header">
                <div class="article-title-section">
                    <span class="article-title">${Utils.sanitizeHtml(article.title)}</span>
                    ${article.required ? '<span class="article-badge required">必須</span>' : '<span class="article-badge optional">任意</span>'}
                </div>
                <div class="article-controls">
                    ${this.createControlButtons(index, article)}
                </div>
            </div>
            <div class="article-content">
                ${this.formatArticlePreview(article.content)}
            </div>
            <div class="article-meta">
                <span class="meta-item">
                    <i class="fas fa-code"></i>
                    変数: ${Object.keys(article.variables || {}).length}個
                </span>
                <span class="meta-item">
                    <i class="fas fa-clock"></i>
                    更新: ${this.formatDate(article.updatedAt)}
                </span>
            </div>
        `;

        return articleDiv;
    }

    /**
     * コントロールボタンの作成
     * @param {number} index - インデックス
     * @param {Object} article - 条項オブジェクト
     * @returns {string} - ボタンHTML
     */
    createControlButtons(index, article) {
        const isFirst = index === 0;
        const isLast = index === this.articles.length - 1;
        const canDelete = !article.required;

        return `
            <button class="btn btn-move btn-small" onclick="articleManager.moveUp(${index})" 
                    ${isFirst ? 'disabled' : ''} title="上に移動">
                <i class="fas fa-arrow-up"></i>
            </button>
            <button class="btn btn-move btn-small" onclick="articleManager.moveDown(${index})" 
                    ${isLast ? 'disabled' : ''} title="下に移動">
                <i class="fas fa-arrow-down"></i>
            </button>
            <button class="btn btn-edit btn-small" onclick="articleManager.openEditor(${index})" title="編集">
                <i class="fas fa-edit"></i>
            </button>
            <button class="btn btn-secondary btn-small" onclick="articleManager.duplicateArticle(${index})" title="複製">
                <i class="fas fa-copy"></i>
            </button>
            <button class="btn btn-delete btn-small" onclick="articleManager.deleteArticle(${index})" 
                    ${!canDelete ? 'disabled' : ''} title="削除">
                <i class="fas fa-trash"></i>
            </button>
        `;
    }

    /**
     * 条項内容のプレビューフォーマット
     * @param {string} content - 条項内容
     * @returns {string} - フォーマット済みHTML
     */
    formatArticlePreview(content) {
        if (!content) return '<span class="text-muted">内容がありません</span>';
        
        const preview = content.length > 150 ? content.substring(0, 150) + '...' : content;
        return Utils.sanitizeHtml(preview).replace(/\n/g, '<br>');
    }

    /**
     * 日付のフォーマット
     * @param {string} dateString - ISO日付文字列
     * @returns {string} - フォーマット済み日付
     */
    formatDate(dateString) {
        if (!dateString) return '不明';
        
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('ja-JP', {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch (error) {
            return '不明';
        }
    }

    /**
     * 上に移動
     * @param {number} index - 移動する条項のインデックス
     */
    moveUp(index) {
        if (index > 0) {
            this.moveArticle(index, index - 1);
        }
    }

    /**
     * 下に移動
     * @param {number} index - 移動する条項のインデックス
     */
    moveDown(index) {
        if (index < this.articles.length - 1) {
            this.moveArticle(index, index + 1);
        }
    }

    /**
     * ドラッグ開始の処理
     * @param {Event} e - ドラッグイベント
     */
    handleDragStart(e) {
        if (!e.target.classList.contains('article-item')) return;
        
        this.draggedElement = e.target;
        e.target.classList.add('dragging');
        
        // ドラッグデータの設定
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/html', e.target.outerHTML);
    }

    /**
     * ドラッグオーバーの処理
     * @param {Event} e - ドラッグイベント
     */
    handleDragOver(e) {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        
        const target = e.target.closest('.article-item');
        if (target && target !== this.draggedElement) {
            target.classList.add('drag-over');
        }
    }

    /**
     * ドロップの処理
     * @param {Event} e - ドロップイベント
     */
    handleDrop(e) {
        e.preventDefault();
        
        const target = e.target.closest('.article-item');
        if (!target || !this.draggedElement || target === this.draggedElement) {
            this.cleanupDragState();
            return;
        }

        const draggedIndex = parseInt(this.draggedElement.dataset.index);
        const targetIndex = parseInt(target.dataset.index);
        
        this.moveArticle(draggedIndex, targetIndex);
        this.cleanupDragState();
    }

    /**
     * ドラッグ終了の処理
     * @param {Event} e - ドラッグイベント
     */
    handleDragEnd(e) {
        this.cleanupDragState();
    }

    /**
     * ドラッグ状態のクリーンアップ
     */
    cleanupDragState() {
        document.querySelectorAll('.article-item').forEach(item => {
            item.classList.remove('dragging', 'drag-over');
        });
        this.draggedElement = null;
    }

    /**
     * 変更リスナーの追加
     * @param {Function} listener - リスナー関数
     */
    addChangeListener(listener) {
        this.changeListeners.add(listener);
    }

    /**
     * 変更リスナーの削除
     * @param {Function} listener - リスナー関数
     */
    removeChangeListener(listener) {
        this.changeListeners.delete(listener);
    }

    /**
     * 変更の通知
     * @param {string} action - アクション（add, update, delete, move）
     * @param {Object} article - 対象条項
     * @param {any} extra - 追加情報
     * @param {Object} oldData - 変更前のデータ（更新時）
     */
    notifyChange(action, article, extra, oldData) {
        this.changeListeners.forEach(listener => {
            try {
                listener(action, article, extra, oldData, this.articles);
            } catch (error) {
                console.error('条項変更リスナーエラー:', error);
            }
        });
    }

    /**
     * 条項の検索
     * @param {string} query - 検索クエリ
     * @returns {Array} - 検索結果
     */
    searchArticles(query) {
        if (!query) return this.articles;
        
        const lowerQuery = query.toLowerCase();
        return this.articles.filter(article => 
            article.title.toLowerCase().includes(lowerQuery) ||
            article.content.toLowerCase().includes(lowerQuery)
        );
    }

    /**
     * 条項のフィルタリング
     * @param {string} filter - フィルター（all, required, optional）
     * @returns {Array} - フィルター結果
     */
    filterArticles(filter) {
        switch (filter) {
            case 'required':
                return this.articles.filter(article => article.required);
            case 'optional':
                return this.articles.filter(article => !article.required);
            default:
                return this.articles;
        }
    }

    /**
     * 統計情報の取得
     * @returns {Object} - 統計情報
     */
    getStatistics() {
        const total = this.articles.length;
        const required = this.articles.filter(a => a.required).length;
        const optional = total - required;
        const withVariables = this.articles.filter(a => Object.keys(a.variables || {}).length > 0).length;
        
        return {
            total,
            required,
            optional,
            withVariables,
            averageContentLength: total > 0 ? 
                Math.round(this.articles.reduce((sum, a) => sum + a.content.length, 0) / total) : 0
        };
    }

    /**
     * リセット
     */
    reset() {
        this.articles = [];
        this.currentEditingIndex = null;
        this.render();
    }
}

// グローバルインスタンス
window.articleManager = new ArticleManager();
