// ===========================================
// UI管理クラス - モーダル、通知、レスポンシブ制御
// ===========================================

class UIManager {
    constructor() {
        this.modals = new Map();
        this.activeNotifications = new Set();
        this.isMobileView = false;
        
        this.init();
    }

    /**
     * 初期化
     */
    init() {
        this.setupModals();
        this.setupMobileToggle();
        this.setupResponsiveHandlers();
        this.setupKeyboardShortcuts();
    }

    /**
     * モーダルの設定
     */
    setupModals() {
        // すべてのモーダルを取得して管理
        document.querySelectorAll('.modal').forEach(modal => {
            const modalId = modal.id;
            this.modals.set(modalId, {
                element: modal,
                isOpen: false,
                onOpen: null,
                onClose: null
            });

            // クローズボタンのイベントリスナー
            modal.querySelectorAll('.modal-close').forEach(closeBtn => {
                closeBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    this.closeModal(modalId);
                });
            });

            // 背景クリックでクローズ
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.closeModal(modalId);
                }
            });
        });

        // ESCキーでモーダルクローズ
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeAllModals();
            }
        });
    }

    /**
     * モーダルを開く
     * @param {string} modalId - モーダルID
     * @param {Function} onOpen - 開いた時のコールバック
     */
    openModal(modalId, onOpen = null) {
        const modalData = this.modals.get(modalId);
        if (!modalData) {
            console.error(`Modal with id '${modalId}' not found`);
            return;
        }

        // 他のモーダルを閉じる
        this.closeAllModals();

        modalData.element.style.display = 'flex';
        modalData.isOpen = true;
        modalData.onOpen = onOpen;

        // アニメーション
        Utils.showWithAnimation(modalData.element, 'fade-in');

        // ボディのスクロールを無効化
        document.body.style.overflow = 'hidden';

        // フォーカス管理
        this.focusFirstElement(modalData.element);

        // コールバック実行
        if (onOpen) onOpen();

        this.showNotification(`${modalId} を開きました`, 'info');
    }

    /**
     * モーダルを閉じる
     * @param {string} modalId - モーダルID
     * @param {Function} onClose - 閉じた時のコールバック
     */
    closeModal(modalId, onClose = null) {
        const modalData = this.modals.get(modalId);
        if (!modalData || !modalData.isOpen) return;

        modalData.element.style.display = 'none';
        modalData.isOpen = false;

        // ボディのスクロールを有効化
        document.body.style.overflow = '';

        // コールバック実行
        if (onClose) onClose();
        if (modalData.onClose) modalData.onClose();
    }

    /**
     * すべてのモーダルを閉じる
     */
    closeAllModals() {
        this.modals.forEach((modalData, modalId) => {
            if (modalData.isOpen) {
                this.closeModal(modalId);
            }
        });
    }

    /**
     * モーダル内の最初のフォーカス可能要素にフォーカス
     * @param {HTMLElement} modal - モーダル要素
     */
    focusFirstElement(modal) {
        const focusableElements = modal.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        
        if (focusableElements.length > 0) {
            focusableElements[0].focus();
        }
    }

    /**
     * 通知を表示
     * @param {string} message - メッセージ
     * @param {string} type - 通知タイプ（success, error, warning, info）
     * @param {number} duration - 表示時間（ミリ秒）
     */
    showNotification(message, type = 'info', duration = APP_CONFIG.NOTIFICATION_DURATION) {
        // 既存の同じメッセージの通知を削除
        this.removeNotificationByMessage(message);

        const notification = this.createNotificationElement(message, type);
        document.body.appendChild(notification);
        this.activeNotifications.add(notification);

        // アニメーション付きで表示
        setTimeout(() => {
            notification.classList.add('show');
        }, 10);

        // 自動削除
        setTimeout(() => {
            this.removeNotification(notification);
        }, duration);

        // クリックで削除
        notification.addEventListener('click', () => {
            this.removeNotification(notification);
        });

        return notification;
    }

    /**
     * 通知要素を作成
     * @param {string} message - メッセージ
     * @param {string} type - 通知タイプ
     * @returns {HTMLElement} - 通知要素
     */
    createNotificationElement(message, type) {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;

        // スタイル設定
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 12px 20px;
            border-radius: 6px;
            color: white;
            font-weight: 500;
            z-index: 1000;
            cursor: pointer;
            transition: all 0.3s ease;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            transform: translateX(100%);
            opacity: 0;
            max-width: 300px;
            word-wrap: break-word;
        `;

        // タイプに応じた背景色
        const colors = {
            success: '#059669',
            error: '#dc2626',
            warning: '#f59e0b',
            info: '#3b82f6'
        };

        notification.style.backgroundColor = colors[type] || colors.info;

        // アイコンを追加
        const icon = this.getNotificationIcon(type);
        if (icon) {
            notification.innerHTML = `<i class="fas ${icon}"></i> ${message}`;
        }

        return notification;
    }

    /**
     * 通知タイプに応じたアイコンを取得
     * @param {string} type - 通知タイプ
     * @returns {string} - アイコンクラス名
     */
    getNotificationIcon(type) {
        const icons = {
            success: 'fa-check-circle',
            error: 'fa-exclamation-circle',
            warning: 'fa-exclamation-triangle',
            info: 'fa-info-circle'
        };
        return icons[type];
    }

    /**
     * 通知を削除
     * @param {HTMLElement} notification - 通知要素
     */
    removeNotification(notification) {
        if (!notification || !notification.parentNode) return;

        notification.style.opacity = '0';
        notification.style.transform = 'translateX(100%)';

        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
                this.activeNotifications.delete(notification);
            }
        }, 300);
    }

    /**
     * メッセージによる通知削除
     * @param {string} message - メッセージ
     */
    removeNotificationByMessage(message) {
        this.activeNotifications.forEach(notification => {
            if (notification.textContent.includes(message)) {
                this.removeNotification(notification);
            }
        });
    }

    /**
     * すべての通知を削除
     */
    clearAllNotifications() {
        this.activeNotifications.forEach(notification => {
            this.removeNotification(notification);
        });
    }

    /**
     * モバイル表示切り替えの設定
     */
    setupMobileToggle() {
        const toggleBtn = document.querySelector(SELECTORS.togglePreviewBtn);
        if (!toggleBtn) return;

        toggleBtn.addEventListener('click', () => {
            this.toggleMobileView();
        });

        // 初期状態の設定
        this.updateMobileView();
    }

    /**
     * モバイル表示の切り替え
     */
    toggleMobileView() {
        if (window.innerWidth > 1024) return; // デスクトップでは無効

        this.isMobileView = !this.isMobileView;
        this.updateMobileView();
    }

    /**
     * モバイル表示の更新
     */
    updateMobileView() {
        const formSection = document.querySelector('.form-section');
        const previewSection = document.querySelector('#preview-section');
        const toggleIcon = document.querySelector('#toggle-icon');
        const toggleText = document.querySelector('#toggle-text');

        if (window.innerWidth <= 1024) {
            if (this.isMobileView) {
                // プレビュー表示
                formSection.style.display = 'none';
                previewSection.style.display = 'block';
                if (toggleIcon) toggleIcon.className = 'fas fa-edit';
                if (toggleText) toggleText.textContent = 'フォーム表示';
            } else {
                // フォーム表示
                formSection.style.display = 'block';
                previewSection.style.display = 'none';
                if (toggleIcon) toggleIcon.className = 'fas fa-eye';
                if (toggleText) toggleText.textContent = 'プレビュー表示';
            }
        } else {
            // デスクトップ表示
            formSection.style.display = 'block';
            previewSection.style.display = 'block';
        }
    }

    /**
     * レスポンシブハンドラーの設定
     */
    setupResponsiveHandlers() {
        const debouncedResize = Utils.debounce(() => {
            this.updateMobileView();
            this.handleResponsiveChanges();
        }, 250);

        window.addEventListener('resize', debouncedResize);
    }

    /**
     * レスポンシブ変更の処理
     */
    handleResponsiveChanges() {
        // ウィンドウサイズに応じた処理
        const isDesktop = window.innerWidth > 1024;
        const isTablet = window.innerWidth <= 1024 && window.innerWidth > 768;
        const isMobile = window.innerWidth <= 768;

        // プレビューコンテナの高さ調整
        const previewContainer = document.querySelector('.preview-container');
        if (previewContainer) {
            if (isMobile) {
                previewContainer.style.maxHeight = '400px';
            } else if (isTablet) {
                previewContainer.style.maxHeight = '500px';
            } else {
                previewContainer.style.maxHeight = '600px';
            }
        }

        // モーダルのサイズ調整
        this.modals.forEach(modalData => {
            const modalContent = modalData.element.querySelector('.modal-content');
            if (modalContent) {
                if (isMobile) {
                    modalContent.style.width = '95%';
                    modalContent.style.maxHeight = '90vh';
                } else {
                    modalContent.style.width = '';
                    modalContent.style.maxHeight = '';
                }
            }
        });
    }

    /**
     * キーボードショートカットの設定
     */
    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Ctrl/Cmd + S: 設定保存
            if ((e.ctrlKey || e.metaKey) && e.key === 's') {
                e.preventDefault();
                this.triggerSaveTemplate();
            }

            // Ctrl/Cmd + O: 設定読込
            if ((e.ctrlKey || e.metaKey) && e.key === 'o') {
                e.preventDefault();
                this.triggerLoadTemplate();
            }

            // Ctrl/Cmd + Enter: 契約書生成
            if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                e.preventDefault();
                this.triggerGenerateContract();
            }

            // F5: プレビュー更新
            if (e.key === 'F5') {
                e.preventDefault();
                this.triggerPreviewRefresh();
            }
        });
    }

    /**
     * ショートカット：設定保存のトリガー
     */
    triggerSaveTemplate() {
        const saveBtn = document.querySelector(SELECTORS.saveTemplateBtn);
        if (saveBtn && !saveBtn.disabled) {
            saveBtn.click();
            this.showNotification('Ctrl+S で設定を保存しました', 'success');
        }
    }

    /**
     * ショートカット：設定読込のトリガー
     */
    triggerLoadTemplate() {
        const loadBtn = document.querySelector(SELECTORS.loadTemplateBtn);
        if (loadBtn && !loadBtn.disabled) {
            loadBtn.click();
            this.showNotification('Ctrl+O で設定読込を開始しました', 'info');
        }
    }

    /**
     * ショートカット：契約書生成のトリガー
     */
    triggerGenerateContract() {
        const generateBtn = document.querySelector(SELECTORS.generateBtn);
        if (generateBtn && !generateBtn.disabled) {
            generateBtn.click();
            this.showNotification('Ctrl+Enter で契約書を生成しました', 'success');
        }
    }

    /**
     * ショートカット：プレビュー更新のトリガー
     */
    triggerPreviewRefresh() {
        const refreshBtn = document.querySelector(SELECTORS.previewRefreshBtn);
        if (refreshBtn && !refreshBtn.disabled) {
            refreshBtn.click();
            this.showNotification('F5 でプレビューを更新しました', 'info');
        }
    }

    /**
     * ローディング表示
     * @param {HTMLElement} element - ローディング表示する要素
     * @param {boolean} show - 表示するかどうか
     */
    showLoading(element, show = true) {
        if (!element) return;

        if (show) {
            element.style.position = 'relative';
            element.style.pointerEvents = 'none';

            const loader = document.createElement('div');
            loader.className = 'loading-overlay';
            loader.innerHTML = `
                <div class="loading-spinner">
                    <i class="fas fa-spinner fa-spin"></i>
                    <span>処理中...</span>
                </div>
            `;

            loader.style.cssText = `
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(255, 255, 255, 0.8);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 999;
            `;

            element.appendChild(loader);
        } else {
            const loader = element.querySelector('.loading-overlay');
            if (loader) {
                loader.remove();
                element.style.pointerEvents = '';
            }
        }
    }

    /**
     * 確認ダイアログの表示
     * @param {string} message - 確認メッセージ
     * @param {Function} onConfirm - 確認時のコールバック
     * @param {Function} onCancel - キャンセル時のコールバック
     */
    showConfirm(message, onConfirm, onCancel = null) {
        if (confirm(message)) {
            if (onConfirm) onConfirm();
        } else {
            if (onCancel) onCancel();
        }
    }

    /**
     * プログレスバーの表示
     * @param {number} progress - 進捗（0-100）
     * @param {string} message - メッセージ
     */
    showProgress(progress, message = '') {
        let progressBar = document.querySelector('.progress-bar');
        
        if (!progressBar) {
            progressBar = document.createElement('div');
            progressBar.className = 'progress-bar';
            progressBar.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                height: 4px;
                background: #e5e7eb;
                z-index: 1001;
            `;

            const progressFill = document.createElement('div');
            progressFill.className = 'progress-fill';
            progressFill.style.cssText = `
                height: 100%;
                background: #3b82f6;
                transition: width 0.3s ease;
                width: 0%;
            `;

            progressBar.appendChild(progressFill);
            document.body.appendChild(progressBar);
        }

        const fill = progressBar.querySelector('.progress-fill');
        fill.style.width = `${Math.min(100, Math.max(0, progress))}%`;

        if (message) {
            this.showNotification(message, 'info', 1000);
        }

        // 100%になったら自動で非表示
        if (progress >= 100) {
            setTimeout(() => {
                if (progressBar.parentNode) {
                    progressBar.parentNode.removeChild(progressBar);
                }
            }, 500);
        }
    }
}

// グローバルインスタンス
window.uiManager = new UIManager();
