// ===========================================
// 契約書テンプレート設定ファイル
// ===========================================

// 契約書テンプレート定義
const CONTRACT_TEMPLATES = {
    consulting: {
        name: '業務委託契約書',
        fields: [
            { name: 'contractorName', label: '受託者名（甲）', type: 'text', required: true, placeholder: '株式会社〇〇' },
            { name: 'clientName', label: '委託者名（乙）', type: 'text', required: true, placeholder: '株式会社△△' },
            { name: 'monthlyFee', label: '月額委託料（円）', type: 'text', required: true, placeholder: '500,000' },
            { name: 'paymentDate', label: '支払日', type: 'text', required: false, default: '20日' },
            { name: 'bankInfo', label: '受託者銀行口座情報', type: 'text', required: false, placeholder: '三菱UFJ銀行 新宿支店 普通 1234567' },
            { name: 'contractStartDate', label: '契約開始日', type: 'date', required: false },
            { name: 'contractEndDate', label: '契約終了日', type: 'date', required: false },
            { name: 'contractPeriodMonths', label: '契約期間', type: 'text', required: false, placeholder: '12ヶ月' },
            { name: 'contractSignDate', label: '契約締結日', type: 'date', required: false },
            { name: 'court', label: '専属管轄裁判所', type: 'text', required: false, placeholder: '東京地方裁判所' },
            { name: 'contractorSignature', label: '甲（受託者）署名欄', type: 'textarea', required: false, placeholder: '山田太郎\n東京都渋谷区〇〇1-1-1\n印' },
            { name: 'clientSignature', label: '乙（委託者）署名欄', type: 'textarea', required: false, placeholder: '田中花子\n東京都新宿区△△2-2-2\n印' }
        ],
        defaultArticles: [
            {
                id: 'purpose',
                title: '第1条（委託業務）',
                content: '乙は、甲に対し、自社サービスの開発支援及びシステム構築に関する業務に関し、以下の業務（以下「本件業務」という。）の遂行に充てることを委託し、甲はこれを受託する。\n1. プログラミング開発支援\n2. システム設計補助\n3. 技術文書作成支援\n4. 開発環境の整備・運用支援\n5. 上記に係る附帯業務\n6. その他甲乙間で別途合意した業務',
                required: true,
                variables: {}
            },
            {
                id: 'fee',
                title: '第2条（委託料）',
                content: '1. 乙は、甲に対し、本件業務の対価として、金 {{monthlyFee}} 円/月（税込）を支払う。\n2. 乙は、前項に定める委託料の当月分を、翌月 {{paymentDate}} までに、甲が別途指定する銀行口座（{{bankInfo}}）に振込送金にて支払う。\n3. 第１条で定めた稼働時間と、甲が実際に業務に従事した時間とが著しく異なった場合の対応については、甲乙間で別途協議の上これを定めるものとする。',
                required: true,
                variables: {
                    monthlyFee: '月額委託料',
                    paymentDate: '支払日',
                    bankInfo: '銀行口座情報'
                }
            },
            {
                id: 'expenses',
                title: '第3条（交通費等の支給）',
                content: '乙は、甲に対して交通費を支払わない。',
                required: false,
                variables: {}
            },
            {
                id: 'deliverables',
                title: '第4条（成果物の提出期限）',
                content: '甲は、本件業務を遂行したことを示すために、翌月5日までに乙に対して営業業務の成果物、稼働報告書及び請求書を提出する。',
                required: false,
                variables: {}
            },
            {
                id: 'obligations',
                title: '第5条（甲の遵守すべき事項）',
                content: '1. 甲は、国内外の法令を遵守し、乙の正当な利益を最大限に擁護することを目的として、乙より委託された業務を誠実に遂行する。\n2. 甲は、本契約期間中または期間終了後を問わず、本件業務に関して知り得た秘密を第三者に漏えいしてはならず、また本件業務の遂行以外の目的に使用してはならない。',
                required: true,
                variables: {}
            },
            {
                id: 'cost_burden',
                title: '第6条（費用等の負担）',
                content: '甲が本件業務を遂行するに当たり必要となる費用は、乙の負担とする。',
                required: false,
                variables: {}
            },
            {
                id: 'intellectual_property',
                title: '第7条（知的財産権の帰属）',
                content: '1. 本契約に基づき甲（受託者）が作成・開発したシステム、プログラム、仕様書、マニュアル等その他一切の成果物に関する著作権その他一切の権利は、完成と同時に乙（委託者）に帰属するものとする。\n2. 甲は、前項の成果物に関し、著作者人格権を行使しないものとする。\n3. ただし、成果物の一部に甲があらかじめ保有していた汎用的なライブラリやノウハウを組み込む場合については、当該部分については甲に帰属するものとし、その使用許諾の条件等は別途協議のうえ取り決めるものとする。',
                required: false,
                variables: {}
            },
            {
                id: 'subcontracting',
                title: '第8条（再委託の制限）',
                content: '甲は、乙の書面による事前の承諾がある場合を除き、本件業務を第三者に再委託してはならない。',
                required: false,
                variables: {}
            },
            {
                id: 'reporting',
                title: '第9条（事務処理の報告）',
                content: '甲は、乙に対し、適時、書面または口頭で、業務処理の進捗状況を報告する。',
                required: false,
                variables: {}
            },
            {
                id: 'term',
                title: '第10条（契約期間等）',
                content: '1. 本契約の期間は、{{contractStartDate}} から {{contractEndDate}} までの {{contractPeriodMonths}} とする。\n2. ただし、期間満了14日前までに甲または乙から別段の意思表示がないときは、本契約と同一条件にて更新され、以後も同様とする。\n3. 甲または乙は、相手方に対してあらかじめ期間満了14日前までに申し出ることによって、本契約を解約することができる。',
                required: false,
                variables: {
                    contractStartDate: '契約開始日',
                    contractEndDate: '契約終了日',
                    contractPeriodMonths: '契約期間'
                }
            },
            {
                id: 'termination',
                title: '第11条（解除）',
                content: '1. 甲は、乙が支払停止に陥り、あるいは仮差押・競売の申請・破産・民事再生・会社更生の手続が開始し、公租公課の滞納処分を受けたとき、または手形交換所の取引停止処分を受けたときは、催告なしに本契約を解除することができる。\n2. 乙は、甲が暴力団等反社会的勢力またはその構成員と関わりを有したことがあるか、有していたと疑われるか、現に有するおそれがあると認めた場合は、催告なしに本契約を解除することができる。',
                required: false,
                variables: {}
            },
            {
                id: 'jurisdiction',
                title: '第12条（専属的合意管轄裁判所）',
                content: '本契約に関する一切の争訟は、{{court}} を第一審の専属的合意管轄裁判所とする。',
                required: false,
                variables: {
                    court: '専属管轄裁判所'
                }
            },
            {
                id: 'consultation',
                title: '第13条（協議）',
                content: '本契約に定めのない事項、または本契約の解釈等に疑義が生じたときは、甲乙は誠意を持って協議し、円満に解決を図るものとする。',
                required: false,
                variables: {}
            }
        ]
    },

    employment: {
        name: '雇用契約書',
        fields: [
            { name: 'employerName', label: '雇用者名（甲）', type: 'text', required: true, placeholder: '株式会社〇〇' },
            { name: 'employeeName', label: '被雇用者名（乙）', type: 'text', required: true, placeholder: '山田太郎' },
            { name: 'position', label: '職位', type: 'text', required: true, placeholder: 'ソフトウェアエンジニア' },
            { name: 'department', label: '所属部署', type: 'text', required: false, placeholder: '開発部' },
            { name: 'salary', label: '基本給（月額・円）', type: 'text', required: true, placeholder: '300,000' },
            { name: 'workingHours', label: '勤務時間', type: 'text', required: false, default: '9:00-18:00' },
            { name: 'workingDays', label: '勤務日', type: 'text', required: false, default: '月曜日から金曜日' },
            { name: 'startDate', label: '雇用開始日', type: 'date', required: true },
            { name: 'probationPeriod', label: '試用期間', type: 'text', required: false, placeholder: '3ヶ月' },
            { name: 'workplace', label: '勤務場所', type: 'text', required: false, placeholder: '東京都渋谷区...' }
        ],
        defaultArticles: [
            {
                id: 'employment',
                title: '第1条（雇用）',
                content: '甲は乙を {{position}} として雇用し、乙はこれを承諾する。雇用期間は {{startDate}} からとする。',
                required: true,
                variables: { position: '職位', startDate: '雇用開始日' }
            },
            {
                id: 'workplace_emp',
                title: '第2条（勤務場所）',
                content: '乙の勤務場所は {{workplace}} とする。ただし、業務上の必要がある場合は、甲の指示により他の場所で勤務することがある。',
                required: false,
                variables: { workplace: '勤務場所' }
            },
            {
                id: 'working_hours',
                title: '第3条（勤務時間）',
                content: '乙の勤務時間は {{workingHours}} とし、勤務日は {{workingDays}} とする。',
                required: true,
                variables: { workingHours: '勤務時間', workingDays: '勤務日' }
            },
            {
                id: 'salary_emp',
                title: '第4条（給与）',
                content: '甲は乙に対し、基本給として月額 {{salary}} 円を支払う。給与の支払いは毎月末日に翌月分を支払うものとする。',
                required: true,
                variables: { salary: '基本給' }
            },
            {
                id: 'probation',
                title: '第5条（試用期間）',
                content: '乙の試用期間は {{probationPeriod}} とする。この期間中に乙が不適格と認められた場合は、甲は乙を解雇することができる。',
                required: false,
                variables: { probationPeriod: '試用期間' }
            }
        ]
    },

    nda: {
        name: '秘密保持契約書',
        fields: [
            { name: 'discloserName', label: '開示者名（甲）', type: 'text', required: true, placeholder: '株式会社〇〇' },
            { name: 'recipientName', label: '受領者名（乙）', type: 'text', required: true, placeholder: '株式会社△△' },
            { name: 'purpose', label: '開示目的', type: 'textarea', required: true, placeholder: '事業提携の検討のため' },
            { name: 'validityPeriod', label: '有効期間', type: 'text', required: false, placeholder: '3年間' },
            { name: 'effectiveDate', label: '効力発生日', type: 'date', required: false }
        ],
        defaultArticles: [
            {
                id: 'nda_purpose',
                title: '第1条（目的）',
                content: '本契約は、{{purpose}}について、甲が乙に開示する秘密情報の取扱いに関して定める。',
                required: true,
                variables: { purpose: '開示目的' }
            },
            {
                id: 'nda_definition',
                title: '第2条（秘密情報の定義）',
                content: '本契約において「秘密情報」とは、甲が乙に対して開示する一切の情報をいう。ただし、以下の各号に該当する情報は秘密情報には含まれない。\n1. 開示の時点で既に公知であった情報\n2. 開示後、乙の責によらずして公知となった情報\n3. 開示の時点で既に乙が保有していた情報\n4. 第三者から正当に取得した情報',
                required: true,
                variables: {}
            },
            {
                id: 'nda_obligations',
                title: '第3条（秘密保持義務）',
                content: '乙は、秘密情報を第三者に開示、漏洩してはならず、また本契約の目的以外に使用してはならない。',
                required: true,
                variables: {}
            },
            {
                id: 'nda_term',
                title: '第4条（有効期間）',
                content: '本契約の有効期間は {{validityPeriod}} とする。ただし、秘密保持義務は本契約終了後も継続するものとする。',
                required: false,
                variables: { validityPeriod: '有効期間' }
            }
        ]
    },

    rental: {
        name: '賃貸借契約書',
        fields: [
            { name: 'landlordName', label: '賃貸人名（甲）', type: 'text', required: true, placeholder: '田中太郎' },
            { name: 'tenantName', label: '賃借人名（乙）', type: 'text', required: true, placeholder: '佐藤花子' },
            { name: 'propertyAddress', label: '物件所在地', type: 'textarea', required: true, placeholder: '東京都渋谷区〇〇1-1-1' },
            { name: 'propertyType', label: '物件種別', type: 'text', required: false, placeholder: 'マンション・アパート等' },
            { name: 'monthlyRent', label: '月額賃料（円）', type: 'text', required: true, placeholder: '120,000' },
            { name: 'deposit', label: '敷金（円）', type: 'text', required: false, placeholder: '240,000' },
            { name: 'keyMoney', label: '礼金（円）', type: 'text', required: false, placeholder: '120,000' },
            { name: 'leasePeriod', label: '賃貸借期間', type: 'text', required: true, placeholder: '2年間' },
            { name: 'leaseStartDate', label: '賃貸借開始日', type: 'date', required: false },
            { name: 'leaseEndDate', label: '賃貸借終了日', type: 'date', required: false }
        ],
        defaultArticles: [
            {
                id: 'rental_object',
                title: '第1条（賃貸借の目的物）',
                content: '甲は乙に対し、下記物件を賃貸し、乙はこれを賃借する。\n所在地：{{propertyAddress}}\n種別：{{propertyType}}',
                required: true,
                variables: { propertyAddress: '物件所在地', propertyType: '物件種別' }
            },
            {
                id: 'rental_period',
                title: '第2条（賃貸借期間）',
                content: '賃貸借期間は {{leasePeriod}} とし、{{leaseStartDate}} から {{leaseEndDate}} までとする。',
                required: true,
                variables: { leasePeriod: '賃貸借期間', leaseStartDate: '賃貸借開始日', leaseEndDate: '賃貸借終了日' }
            },
            {
                id: 'rental_fee',
                title: '第3条（賃料等）',
                content: '月額賃料は {{monthlyRent}} 円とし、敷金は {{deposit}} 円、礼金は {{keyMoney}} 円とする。賃料は毎月末日までに翌月分を支払うものとする。',
                required: true,
                variables: { monthlyRent: '月額賃料', deposit: '敷金', keyMoney: '礼金' }
            }
        ]
    },

    sales: {
        name: '売買契約書',
        fields: [
            { name: 'sellerName', label: '売主名（甲）', type: 'text', required: true, placeholder: '株式会社〇〇' },
            { name: 'buyerName', label: '買主名（乙）', type: 'text', required: true, placeholder: '株式会社△△' },
            { name: 'productName', label: '商品名', type: 'text', required: true, placeholder: 'ソフトウェアライセンス' },
            { name: 'productDescription', label: '商品説明', type: 'textarea', required: false, placeholder: '商品の詳細説明' },
            { name: 'quantity', label: '数量', type: 'text', required: true, placeholder: '1式' },
            { name: 'unitPrice', label: '単価（円）', type: 'text', required: true, placeholder: '1,000,000' },
            { name: 'totalAmount', label: '総額（円）', type: 'text', required: true, placeholder: '1,000,000' },
            { name: 'deliveryDate', label: '納期', type: 'date', required: false },
            { name: 'deliveryLocation', label: '納入場所', type: 'text', required: false, placeholder: '買主指定場所' },
            { name: 'paymentTerms', label: '支払条件', type: 'text', required: false, placeholder: '納品後30日以内' }
        ],
        defaultArticles: [
            {
                id: 'sales_object',
                title: '第1条（売買の目的物）',
                content: '甲は乙に対し、下記商品を売渡し、乙はこれを買受ける。\n商品名：{{productName}}\n数量：{{quantity}}\n単価：{{unitPrice}}円\n総額：{{totalAmount}}円',
                required: true,
                variables: { productName: '商品名', quantity: '数量', unitPrice: '単価', totalAmount: '総額' }
            },
            {
                id: 'delivery',
                title: '第2条（引渡し）',
                content: '甲は {{deliveryDate}} までに {{deliveryLocation}} において商品を乙に引き渡すものとする。',
                required: false,
                variables: { deliveryDate: '納期', deliveryLocation: '納入場所' }
            },
            {
                id: 'payment',
                title: '第3条（代金の支払い）',
                content: '乙は甲に対し、{{paymentTerms}} に代金 {{totalAmount}} 円を支払うものとする。',
                required: true,
                variables: { paymentTerms: '支払条件', totalAmount: '総額' }
            }
        ]
    },

    custom: {
        name: 'カスタム契約書',
        fields: [
            { name: 'partyAName', label: '甲', type: 'text', required: true, placeholder: '当事者A' },
            { name: 'partyBName', label: '乙', type: 'text', required: true, placeholder: '当事者B' },
            { name: 'contractTitle', label: '契約書タイトル', type: 'text', required: true, placeholder: 'カスタム契約書' },
            { name: 'contractPurpose', label: '契約の目的', type: 'textarea', required: false, placeholder: 'この契約の目的を記載' }
        ],
        defaultArticles: [
            {
                id: 'custom_purpose',
                title: '第1条（目的）',
                content: '{{contractPurpose}}',
                required: false,
                variables: { contractPurpose: '契約の目的' }
            }
        ]
    }
};

// アプリケーション設定
const APP_CONFIG = {
    // ローカルストレージキー
    STORAGE_KEY: 'contractGenerator',
    
    // 通知表示時間（ミリ秒）
    NOTIFICATION_DURATION: 3000,
    
    // ドラッグ&ドロップ設定
    DRAG_DELAY: 100,
    
    // プレビュー更新の遅延時間（ミリ秒）
    PREVIEW_UPDATE_DELAY: 500,
    
    // 契約書生成時のスタイル設定
    CONTRACT_STYLES: {
        pageMargin: '2.5cm',
        fontSize: '11pt',
        lineHeight: '1.6',
        fontFamily: '"Yu Gothic", "Hiragino Sans", "Meiryo", sans-serif'
    }
};

// DOM要素のセレクタ
const SELECTORS = {
    // メイン要素
    contractType: '#contract-type',
    dynamicForm: '#dynamic-form',
    articlesContainer: '#articles-container',
    previewContent: '#preview-content',
    
    // ボタン
    generateBtn: '#generate-btn',
    copyBtn: '#copy-btn',
    openBtn: '#open-btn',
    exportPdfBtn: '#export-pdf',
    saveTemplateBtn: '#save-template',
    loadTemplateBtn: '#load-template',
    addArticleBtn: '#add-article',
    previewRefreshBtn: '#preview-refresh',
    togglePreviewBtn: '#toggle-preview',
    toggleCodeBtn: '#toggle-code',
    
    // モーダル
    customTypeModal: '#custom-type-modal',
    articleEditorModal: '#article-editor-modal',
    
    // フォーム要素
    generatedHtml: '#generated-html',
    htmlCodeSection: '#html-code-section',
    fileInput: '#file-input'
};
