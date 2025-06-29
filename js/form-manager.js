// ===========================================
// フォーム管理クラス - 動的フォーム生成・入力処理
// ===========================================

class FormManager {
    constructor() {
        this.formContainer = null;
        this.currentFields = [];
        this.formData = {};
        this.validators = new Map();
        this.changeListeners = new Set();
        
        this.init();
    }

    /**
     * 初期化
     */
    init() {
        this.formContainer = document.querySelector(SELECTORS.dynamicForm);
        if (!this.formContainer) {
            console.error('フォームコンテナが見つかりません');
            return;
        }

        this.setupDefaultValidators();
    }

    /**
     * デフォルトバリデーターの設定
     */
    setupDefaultValidators() {
        // 必須入力チェック
        this.addValidator('required', (value, field) => {
            if (field.required && (!value || value.trim() === '')) {
                return `${field.label}は必須入力です`;
            }
            return null;
        });

        // メールアドレス形式チェック
        this.addValidator('email', (value, field) => {
            if (field.type === 'email' && value) {
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailRegex.test(value)) {
                    return '正しいメールアドレス形式で入力してください';
                }
            }
            return null;
        });

        // 数値チェック
        this.addValidator('number', (value, field) => {
            if (field.type === 'number' && value) {
                if (isNaN(value)) {
                    return '数値を入力してください';
                }
                if (field.min !== undefined && parseFloat(value) < field.min) {
                    return `${field.min}以上の値を入力してください`;
                }
                if (field.max !== undefined && parseFloat(value) > field.max) {
                    return `${field.max}以下の値を入力してください`;
                }
            }
            return null;
        });

        // 日付チェック
        this.addValidator('date', (value, field) => {
            if (field.type === 'date' && value) {
                const date = new Date(value);
                if (isNaN(date.getTime())) {
                    return '正しい日付形式で入力してください';
                }
            }
            return null;
        });

        // 電話番号チェック
        this.addValidator('tel', (value, field) => {
            if (field.type === 'tel' && value) {
                const telRegex = /^[\d\-\(\)\+\s]+$/;
                if (!telRegex.test(value)) {
                    return '正しい電話番号形式で入力してください';
                }
            }
            return null;
        });
    }

    /**
     * バリデーターの追加
     * @param {string} name - バリデーター名
     * @param {Function} validator - バリデーター関数
     */
    addValidator(name, validator) {
        this.validators.set(name, validator);
    }

    /**
     * 動的フォームの生成
     * @param {Array} fields - フィールド定義配列
     */
    generateForm(fields) {
        if (!fields || !Array.isArray(fields)) {
            console.error('フィールド定義が無効です');
            return;
        }

        this.currentFields = fields;
        this.formContainer.innerHTML = '';

        // フィールドをグループ化して配置
        const groups = this.groupFields(fields);
        
        groups.forEach(group => {
            const groupElement = this.createFieldGroup(group);
            this.formContainer.appendChild(groupElement);
        });

        // 初期値の設定
        this.setInitialValues();

        // フォームの表示アニメーション
        Utils.showWithAnimation(this.formContainer, 'slide-in');
    }

    /**
     * フィールドのグループ化
     * @param {Array} fields - フィールド配列
     * @returns {Array} - グループ化されたフィールド配列
     */
    groupFields(fields) {
        const groups = [];
        let currentGroup = [];
        
        fields.forEach(field => {
            currentGroup.push(field);
            
            // テキストエリアや特定のフィールドは単独グループ
            if (field.type === 'textarea' || field.standalone || currentGroup.length >= 2) {
                groups.push([...currentGroup]);
                currentGroup = [];
            }
        });
        
        // 残りのフィールドがある場合
        if (currentGroup.length > 0) {
            groups.push(currentGroup);
        }
        
        return groups;
    }

    /**
     * フィールドグループの作成
     * @param {Array} group - グループ内のフィールド配列
     * @returns {HTMLElement} - グループ要素
     */
    createFieldGroup(group) {
        const groupDiv = document.createElement('div');
        groupDiv.className = this.getGroupClassName(group);
        
        group.forEach(field => {
            const fieldElement = this.createFieldElement(field);
            groupDiv.appendChild(fieldElement);
        });
        
        return groupDiv;
    }

    /**
     * グループのクラス名取得
     * @param {Array} group - フィールドグループ
     * @returns {string} - クラス名
     */
    getGroupClassName(group) {
        if (group.length === 1) {
            const field = group[0];
            if (field.type === 'textarea' || field.standalone) {
                return 'form-group';
            }
        }
        
        if (group.length === 3) {
            return 'form-grid-3';
        }
        
        return group.length === 2 ? 'form-grid' : 'form-group';
    }

    /**
     * フィールド要素の作成
     * @param {Object} field - フィールド定義
     * @returns {HTMLElement} - フィールド要素
     */
    createFieldElement(field) {
        const fieldDiv = document.createElement('div');
        fieldDiv.className = 'form-group';
        fieldDiv.dataset.fieldName = field.name;

        // ラベルの作成
        const label = this.createLabel(field);
        fieldDiv.appendChild(label);

        // 入力要素の作成
        const input = this.createInputElement(field);
        fieldDiv.appendChild(input);

        // ヘルプテキストの作成
        if (field.help) {
            const helpText = this.createHelpText(field.help);
            fieldDiv.appendChild(helpText);
        }

        // エラー表示エリアの作成
        const errorDiv = document.createElement('div');
        errorDiv.className = 'field-error';
        errorDiv.style.cssText = `
            color: #dc2626;
            font-size: 0.75rem;
            margin-top: 0.25rem;
            display: none;
        `;
        fieldDiv.appendChild(errorDiv);

        return fieldDiv;
    }

    /**
     * ラベルの作成
     * @param {Object} field - フィールド定義
     * @returns {HTMLElement} - ラベル要素
     */
    createLabel(field) {
        const label = document.createElement('label');
        label.setAttribute('for', field.name);
        
        let labelText = field.label;
        if (field.required) {
            labelText += '<span class="required">*</span>';
        }
        
        label.innerHTML = labelText;
        return label;
    }

    /**
     * 入力要素の作成
     * @param {Object} field - フィールド定義
     * @returns {HTMLElement} - 入力要素
     */
    createInputElement(field) {
        let input;

        switch (field.type) {
            case 'textarea':
                input = this.createTextarea(field);
                break;
            case 'select':
                input = this.createSelect(field);
                break;
            case 'checkbox':
                input = this.createCheckbox(field);
                break;
            case 'radio':
                input = this.createRadioGroup(field);
                break;
            case 'file':
                input = this.createFileInput(field);
                break;
            default:
                input = this.createTextInput(field);
        }

        // 共通の設定
        this.setupInputElement(input, field);
        return input;
    }

    /**
     * テキストエリアの作成
     * @param {Object} field - フィールド定義
     * @returns {HTMLElement} - テキストエリア要素
     */
    createTextarea(field) {
        const textarea = document.createElement('textarea');
        textarea.rows = field.rows || 3;
        textarea.cols = field.cols;
        return textarea;
    }

    /**
     * セレクトボックスの作成
     * @param {Object} field - フィールド定義
     * @returns {HTMLElement} - セレクト要素
     */
    createSelect(field) {
        const select = document.createElement('select');
        
        // デフォルトオプション
        if (field.placeholder) {
            const defaultOption = document.createElement('option');
            defaultOption.value = '';
            defaultOption.textContent = field.placeholder;
            defaultOption.disabled = true;
            defaultOption.selected = true;
            select.appendChild(defaultOption);
        }

        // オプションの追加
        if (field.options) {
            field.options.forEach(option => {
                const optionElement = document.createElement('option');
                optionElement.value = typeof option === 'object' ? option.value : option;
                optionElement.textContent = typeof option === 'object' ? option.label : option;
                select.appendChild(optionElement);
            });
        }

        return select;
    }

    /**
     * チェックボックスの作成
     * @param {Object} field - フィールド定義
     * @returns {HTMLElement} - チェックボックス要素
     */
    createCheckbox(field) {
        const wrapper = document.createElement('div');
        wrapper.className = 'checkbox-wrapper';

        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        
        const label = document.createElement('label');
        label.appendChild(checkbox);
        label.appendChild(document.createTextNode(field.checkboxLabel || field.label));
        
        wrapper.appendChild(label);
        return wrapper;
    }

    /**
     * ラジオボタングループの作成
     * @param {Object} field - フィールド定義
     * @returns {HTMLElement} - ラジオグループ要素
     */
    createRadioGroup(field) {
        const wrapper = document.createElement('div');
        wrapper.className = 'radio-group';

        if (field.options) {
            field.options.forEach((option, index) => {
                const radioWrapper = document.createElement('div');
                radioWrapper.className = 'radio-item';

                const radio = document.createElement('input');
                radio.type = 'radio';
                radio.name = field.name;
                radio.value = typeof option === 'object' ? option.value : option;
                radio.id = `${field.name}_${index}`;

                const label = document.createElement('label');
                label.setAttribute('for', radio.id);
                label.textContent = typeof option === 'object' ? option.label : option;

                radioWrapper.appendChild(radio);
                radioWrapper.appendChild(label);
                wrapper.appendChild(radioWrapper);
            });
        }

        return wrapper;
    }

    /**
     * ファイル入力の作成
     * @param {Object} field - フィールド定義
     * @returns {HTMLElement} - ファイル入力要素
     */
    createFileInput(field) {
        const input = document.createElement('input');
        input.type = 'file';
        
        if (field.accept) {
            input.accept = field.accept;
        }
        
        if (field.multiple) {
            input.multiple = true;
        }

        return input;
    }

    /**
     * テキスト入力の作成
     * @param {Object} field - フィールド定義
     * @returns {HTMLElement} - 入力要素
     */
    createTextInput(field) {
        const input = document.createElement('input');
        input.type = field.type || 'text';
        return input;
    }

    /**
     * 入力要素の共通設定
     * @param {HTMLElement} input - 入力要素
     * @param {Object} field - フィールド定義
     */
    setupInputElement(input, field) {
        const mainInput = input.tagName === 'DIV' ? 
            input.querySelector('input') || input : input;

        // 基本属性の設定
        mainInput.id = field.name;
        mainInput.name = field.name;
        
        if (field.placeholder) mainInput.placeholder = field.placeholder;
        if (field.required) mainInput.required = true;
        if (field.readonly) mainInput.readOnly = true;
        if (field.disabled) mainInput.disabled = true;
        if (field.min !== undefined) mainInput.min = field.min;
        if (field.max !== undefined) mainInput.max = field.max;
        if (field.step !== undefined) mainInput.step = field.step;
        if (field.pattern) mainInput.pattern = field.pattern;
        if (field.maxlength) mainInput.maxLength = field.maxlength;

        // イベントリスナーの設定
        this.setupInputEvents(mainInput, field);

        // カスタムスタイルの適用
        if (field.style) {
            Object.assign(mainInput.style, field.style);
        }
    }

    /**
     * 入力イベントの設定
     * @param {HTMLElement} input - 入力要素
     * @param {Object} field - フィールド定義
     */
    setupInputEvents(input, field) {
        // 入力値の変更イベント
        const handleChange = Utils.debounce((e) => {
            this.handleFieldChange(e.target, field);
        }, 300);

        input.addEventListener('input', handleChange);
        input.addEventListener('change', handleChange);

        // フォーカスイベント
        input.addEventListener('focus', () => {
            this.handleFieldFocus(input, field);
        });

        input.addEventListener('blur', () => {
            this.handleFieldBlur(input, field);
        });

        // カスタムイベント
        if (field.events) {
            Object.keys(field.events).forEach(eventName => {
                input.addEventListener(eventName, field.events[eventName]);
            });
        }
    }

    /**
     * フィールド値変更の処理
     * @param {HTMLElement} input - 入力要素
     * @param {Object} field - フィールド定義
     */
    handleFieldChange(input, field) {
        const value = this.getInputValue(input, field);
        const oldValue = this.formData[field.name];
        
        // 値の更新
        this.formData[field.name] = value;

        // バリデーション
        const error = this.validateField(field, value);
        this.showFieldError(field.name, error);

        // 変更リスナーに通知
        this.notifyChange(field.name, value, oldValue);

        // 自動保存
        if (field.autoSave !== false) {
            this.autoSave();
        }
    }

    /**
     * フィールドフォーカスの処理
     * @param {HTMLElement} input - 入力要素
     * @param {Object} field - フィールド定義
     */
    handleFieldFocus(input, field) {
        // フィールドのヘルプテキストを表示
        this.showFieldHelp(field);
        
        // フォーカス時のスタイル
        const fieldDiv = input.closest('.form-group');
        if (fieldDiv) {
            fieldDiv.classList.add('field-focused');
        }
    }

    /**
     * フィールドブラーの処理
     * @param {HTMLElement} input - 入力要素
     * @param {Object} field - フィールド定義
     */
    handleFieldBlur(input, field) {
        // バリデーション実行
        const value = this.getInputValue(input, field);
        const error = this.validateField(field, value);
        this.showFieldError(field.name, error);

        // フォーカス時のスタイルを削除
        const fieldDiv = input.closest('.form-group');
        if (fieldDiv) {
            fieldDiv.classList.remove('field-focused');
        }
    }

    /**
     * 入力値の取得
     * @param {HTMLElement} input - 入力要素
     * @param {Object} field - フィールド定義
     * @returns {any} - 入力値
     */
    getInputValue(input, field) {
        switch (field.type) {
            case 'checkbox':
                return input.checked;
            case 'radio':
                const radioGroup = document.getElementsByName(field.name);
                for (const radio of radioGroup) {
                    if (radio.checked) return radio.value;
                }
                return null;
            case 'file':
                return input.files;
            case 'number':
                return input.value ? parseFloat(input.value) : null;
            default:
                return input.value;
        }
    }

    /**
     * フィールドのバリデーション
     * @param {Object} field - フィールド定義
     * @param {any} value - 入力値
     * @returns {string|null} - エラーメッセージまたはnull
     */
    validateField(field, value) {
        for (const [name, validator] of this.validators) {
            const error = validator(value, field);
            if (error) return error;
        }

        // カスタムバリデーター
        if (field.validator) {
            return field.validator(value, field);
        }

        return null;
    }

    /**
     * フィールドエラーの表示
     * @param {string} fieldName - フィールド名
     * @param {string|null} error - エラーメッセージ
     */
    showFieldError(fieldName, error) {
        const fieldDiv = this.formContainer.querySelector(`[data-field-name="${fieldName}"]`);
        if (!fieldDiv) return;

        const errorDiv = fieldDiv.querySelector('.field-error');
        const input = fieldDiv.querySelector('input, textarea, select');

        if (error) {
            errorDiv.textContent = error;
            errorDiv.style.display = 'block';
            input.classList.add('field-invalid');
            fieldDiv.classList.add('has-error');
        } else {
            errorDiv.style.display = 'none';
            input.classList.remove('field-invalid');
            fieldDiv.classList.remove('has-error');
        }
    }

    /**
     * フィールドヘルプの表示
     * @param {Object} field - フィールド定義
     */
    showFieldHelp(field) {
        if (field.help) {
            // ツールチップやヘルプパネルの表示実装
            uiManager.showNotification(field.help, 'info', 2000);
        }
    }

    /**
     * ヘルプテキストの作成
     * @param {string} helpText - ヘルプテキスト
     * @returns {HTMLElement} - ヘルプ要素
     */
    createHelpText(helpText) {
        const helpDiv = document.createElement('div');
        helpDiv.className = 'field-help';
        helpDiv.textContent = helpText;
        helpDiv.style.cssText = `
            font-size: 0.75rem;
            color: #6b7280;
            margin-top: 0.25rem;
        `;
        return helpDiv;
    }

    /**
     * 初期値の設定
     */
    setInitialValues() {
        this.currentFields.forEach(field => {
            if (field.default !== undefined) {
                this.setFieldValue(field.name, field.default);
            }
        });
    }

    /**
     * フィールド値の設定
     * @param {string} fieldName - フィールド名
     * @param {any} value - 設定値
     */
    setFieldValue(fieldName, value) {
        const input = this.formContainer.querySelector(`[name="${fieldName}"]`);
        if (!input) return;

        const field = this.currentFields.find(f => f.name === fieldName);
        if (!field) return;

        switch (field.type) {
            case 'checkbox':
                input.checked = Boolean(value);
                break;
            case 'radio':
                const radio = this.formContainer.querySelector(`[name="${fieldName}"][value="${value}"]`);
                if (radio) radio.checked = true;
                break;
            default:
                input.value = value || '';
        }

        this.formData[fieldName] = value;
    }

    /**
     * フォームデータの取得
     * @returns {Object} - フォームデータ
     */
    getFormData() {
        return { ...this.formData };
    }

    /**
     * フォームデータの設定
     * @param {Object} data - 設定するデータ
     */
    setFormData(data) {
        this.formData = { ...data };
        
        // 各フィールドに値を設定
        Object.keys(data).forEach(fieldName => {
            this.setFieldValue(fieldName, data[fieldName]);
        });
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
     * @param {string} fieldName - フィールド名
     * @param {any} newValue - 新しい値
     * @param {any} oldValue - 古い値
     */
    notifyChange(fieldName, newValue, oldValue) {
        this.changeListeners.forEach(listener => {
            try {
                listener(fieldName, newValue, oldValue, this.formData);
            } catch (error) {
                console.error('変更リスナーエラー:', error);
            }
        });
    }

    /**
     * 自動保存
     */
    autoSave() {
        if (storageManager) {
            const currentData = {
                contractType: window.currentContractType || 'custom',
                contractData: this.formData,
                contractArticles: window.contractArticles || []
            };
            storageManager.saveToLocalStorage(currentData);
        }
    }

    /**
     * フォームのリセット
     */
    reset() {
        this.formData = {};
        this.formContainer.innerHTML = '';
        this.currentFields = [];
    }

    /**
     * フォームの無効化/有効化
     * @param {boolean} disabled - 無効化するかどうか
     */
    setDisabled(disabled) {
        const inputs = this.formContainer.querySelectorAll('input, textarea, select');
        inputs.forEach(input => {
            input.disabled = disabled;
        });
    }
}

// グローバルインスタンス
window.formManager = new FormManager();
