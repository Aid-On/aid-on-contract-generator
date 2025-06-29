# 汎用契約書ジェネレーター

純粋なHTML/CSS/JavaScriptで構築された、契約書作成Webアプリケーションです。フレームワークやビルドツールを使用せず、どこでも動作します。

## 🌟 特徴

### 完全なクライアントサイド動作
- **フレームワーク不要** - Vanilla JavaScript (ES6+) のみで実装
- **ビルド不要** - そのままブラウザで動作
- **サーバー不要** - すべての処理がブラウザ内で完結
- **外部依存最小** - Font Awesome以外の外部ライブラリ不使用

### 📝 対応契約書タイプ

#### 1. 業務委託契約書 (`consulting`)
フリーランスや外部委託向けの契約書
- 必須フィールド: 受託者名、委託者名、月額委託料
- オプション: 支払日、銀行口座情報、契約期間など

#### 2. 雇用契約書 (`employment`)
正社員・パートタイム採用向けの契約書
- 必須フィールド: 雇用者名、被雇用者名、職位、基本給、雇用開始日
- オプション: 部署、勤務時間、勤務場所、試用期間など

#### 3. 秘密保持契約書 (`nda`)
機密情報の取り扱いに関する契約書
- 必須フィールド: 開示者名、受領者名、開示目的
- オプション: 有効期間、効力発生日

#### 4. 賃貸借契約書 (`rental`)
不動産賃貸に関する契約書
- 必須フィールド: 賃貸人名、賃借人名、物件所在地、月額賃料、賃貸借期間
- オプション: 物件種別、敷金、礼金、契約日など

#### 5. 売買契約書 (`sales`)
商品・サービスの売買に関する契約書
- 必須フィールド: 売主名、買主名、商品名、数量、単価、総額
- オプション: 商品説明、納期、納入場所、支払条件など

#### 6. カスタム契約書 (`custom`)
自由にカスタマイズ可能な契約書
- 必須フィールド: 甲（当事者A）、乙（当事者B）、契約書タイトル
- オプション: 契約の目的

## 📦 セットアップ

### 必要なもの
- モダンなWebブラウザ（Chrome 90+, Firefox 88+, Safari 14+, Edge 90+）
- ローカルファイルアクセスのためのHTTPサーバー（開発時）

### インストール

1. ファイルをダウンロード
```bash
git clone https://github.com/yourusername/contract-generator.git
cd contract-generator
```

2. シンプルなHTTPサーバーで起動

Python 3を使う場合:
```bash
python -m http.server 8000
```

Node.jsを使う場合:
```bash
npx serve .
```

VSCodeを使う場合:
Live Server拡張機能をインストールして右クリック→「Open with Live Server」

3. ブラウザでアクセス
```
http://localhost:8000
```

## 📖 使い方

### 基本的な流れ

1. **契約書タイプを選択**
   - プルダウンメニューから必要な契約書タイプを選択

2. **基本情報を入力**
   - 赤い * マークは必須項目
   - 日付は日付ピッカーで選択
   - 金額は自動的にカンマ区切り表示

3. **条項を編集**
   - デフォルト条項の編集・削除
   - 「条項追加」で新規追加
   - ドラッグ&ドロップで並び替え
   - {{変数名}}で動的な値を挿入

4. **リアルタイムプレビュー**
   - 右側パネルで常に最新状態を確認
   - モバイルでは切り替えボタンで表示

5. **契約書を出力**
   - 「契約書を生成」ボタンをクリック
   - HTMLコードをコピー
   - 新しいタブで開く
   - PDF出力（印刷ダイアログ経由）

### 💾 設定の保存と読み込み

契約書の設定はJSON形式で保存・読み込みが可能です。

**保存方法:**
1. 「設定保存」ボタンをクリック
2. JSONファイルが自動的にダウンロード

**読み込み方法:**
1. 「設定読込」ボタンをクリック
2. 保存したJSONファイルを選択

## 📄 JSONフォーマット仕様

### 基本構造

```json
{
  "contractType": "契約書タイプ",
  "contractData": {
    // 入力フィールドの値
  },
  "contractArticles": [
    // 条項の配列
  ],
  "timestamp": "保存日時",
  "exportedAt": "エクスポート日時",
  "version": "フォーマットバージョン",
  "generator": "生成元アプリケーション名"
}
```

### contractType の値

| 値 | 契約書タイプ |
|---|---|
| `consulting` | 業務委託契約書 |
| `employment` | 雇用契約書 |
| `nda` | 秘密保持契約書 |
| `rental` | 賃貸借契約書 |
| `sales` | 売買契約書 |
| `custom` | カスタム契約書 |

### contractData フィールド

#### 共通フィールド
- `contractSignDate`: 契約締結日（YYYY-MM-DD形式）
- `court`: 専属管轄裁判所

#### 業務委託契約書 (consulting)
| フィールド名 | 説明 | 必須 | 例 |
|---|---|---|---|
| `contractorName` | 受託者名（甲） | ✓ | "山田太郎" |
| `clientName` | 委託者名（乙） | ✓ | "株式会社ABC" |
| `monthlyFee` | 月額委託料（円） | ✓ | "500000" |
| `paymentDate` | 支払日 | - | "20日" |
| `bankInfo` | 銀行口座情報 | - | "三菱UFJ銀行 新宿支店 普通 1234567" |
| `contractStartDate` | 契約開始日 | - | "2025-01-01" |
| `contractEndDate` | 契約終了日 | - | "2025-12-31" |
| `contractPeriodMonths` | 契約期間 | - | "12ヶ月" |

#### 雇用契約書 (employment)
| フィールド名 | 説明 | 必須 | 例 |
|---|---|---|---|
| `employerName` | 雇用者名（甲） | ✓ | "株式会社XYZ" |
| `employeeName` | 被雇用者名（乙） | ✓ | "佐藤花子" |
| `position` | 職位 | ✓ | "ソフトウェアエンジニア" |
| `salary` | 基本給（月額・円） | ✓ | "300000" |
| `startDate` | 雇用開始日 | ✓ | "2025-04-01" |
| `department` | 所属部署 | - | "開発部" |
| `workingHours` | 勤務時間 | - | "9:00-18:00" |
| `workingDays` | 勤務日 | - | "月曜日から金曜日" |
| `probationPeriod` | 試用期間 | - | "3ヶ月" |
| `workplace` | 勤務場所 | - | "東京都渋谷区..." |

#### 秘密保持契約書 (nda)
| フィールド名 | 説明 | 必須 | 例 |
|---|---|---|---|
| `discloserName` | 開示者名（甲） | ✓ | "株式会社DEF" |
| `recipientName` | 受領者名（乙） | ✓ | "株式会社GHI" |
| `purpose` | 開示目的 | ✓ | "事業提携の検討のため" |
| `validityPeriod` | 有効期間 | - | "3年間" |
| `effectiveDate` | 効力発生日 | - | "2025-01-01" |

#### 賃貸借契約書 (rental)
| フィールド名 | 説明 | 必須 | 例 |
|---|---|---|---|
| `landlordName` | 賃貸人名（甲） | ✓ | "田中太郎" |
| `tenantName` | 賃借人名（乙） | ✓ | "鈴木一郎" |
| `propertyAddress` | 物件所在地 | ✓ | "東京都新宿区〇〇1-1-1" |
| `monthlyRent` | 月額賃料（円） | ✓ | "120000" |
| `leasePeriod` | 賃貸借期間 | ✓ | "2年間" |
| `propertyType` | 物件種別 | - | "マンション" |
| `deposit` | 敷金（円） | - | "240000" |
| `keyMoney` | 礼金（円） | - | "120000" |
| `leaseStartDate` | 賃貸借開始日 | - | "2025-02-01" |
| `leaseEndDate` | 賃貸借終了日 | - | "2027-01-31" |

#### 売買契約書 (sales)
| フィールド名 | 説明 | 必須 | 例 |
|---|---|---|---|
| `sellerName` | 売主名（甲） | ✓ | "株式会社JKL" |
| `buyerName` | 買主名（乙） | ✓ | "株式会社MNO" |
| `productName` | 商品名 | ✓ | "ソフトウェアライセンス" |
| `quantity` | 数量 | ✓ | "10式" |
| `unitPrice` | 単価（円） | ✓ | "100000" |
| `totalAmount` | 総額（円） | ✓ | "1000000" |
| `productDescription` | 商品説明 | - | "バージョン2.0..." |
| `deliveryDate` | 納期 | - | "2025-03-31" |
| `deliveryLocation` | 納入場所 | - | "買主指定場所" |
| `paymentTerms` | 支払条件 | - | "納品後30日以内" |

### contractArticles の構造

```json
{
  "id": "一意のID",
  "title": "条項タイトル",
  "content": "条項の内容",
  "required": true/false,
  "variables": {
    "変数名": "説明"
  },
  "order": 表示順序
}
```

### 変数システム

条項内で `{{変数名}}` の形式で動的な値を挿入できます：

```json
{
  "content": "乙は、甲に対し、月額 {{monthlyFee}} 円を支払う。",
  "variables": {
    "monthlyFee": "月額委託料"
  }
}
```

## 🛠️ 技術仕様

### ファイル構成
```
├── index.html          # 単一のHTMLファイル
├── styles.css          # 単一のCSSファイル
└── js/                 # JavaScriptモジュール群
    ├── config.js       # 設定とテンプレート
    ├── utils.js        # 汎用ユーティリティ
    ├── main.js         # アプリケーション起動
    └── *-manager.js    # 各機能マネージャー
```

### ブラウザAPI使用
- **LocalStorage** - 自動保存機能
- **File API** - ファイルの読み書き
- **Blob API** - ファイルダウンロード
- **Drag and Drop API** - 条項の並び替え

### パフォーマンス最適化
- デバウンス処理でリアルタイムプレビューを最適化
- 非同期処理で重い処理をブロックしない
- CSSアニメーションでスムーズなUI

## 🔧 カスタマイズ

### 新しい契約書タイプの追加

`js/config.js` の `CONTRACT_TEMPLATES` に追加：

```javascript
CONTRACT_TEMPLATES.myContract = {
    name: '私の契約書',
    fields: [
        { 
            name: 'fieldName', 
            label: 'フィールド表示名', 
            type: 'text',         // text, textarea, date, number, email, tel
            required: true,       // 必須かどうか
            placeholder: '例...',
            default: 'デフォルト値'
        }
    ],
    defaultArticles: [
        {
            id: 'unique_id',
            title: '第1条（タイトル）',
            content: '条項の内容...',
            required: true,
            variables: {
                fieldName: 'フィールド説明'
            }
        }
    ]
};
```

### スタイルのカスタマイズ

`styles.css` で全体のデザインを変更可能。CSS変数は使用していないため、直接値を変更：

```css
/* 色の変更 */
.btn-primary { background-color: #059669; }

/* レイアウトの変更 */
.main-content { max-width: 1600px; }

/* フォントの変更 */
body { font-family: "游ゴシック", sans-serif; }
```

## 🔒 セキュリティとプライバシー

- **完全ローカル動作** - データは一切外部送信されません
- **ブラウザストレージ** - LocalStorageにのみ保存
- **暗号化なし** - 機密情報の保存は自己責任で

## 📝 ライセンス

MITライセンス - 商用利用可能

## 🤝 貢献

プルリクエスト歓迎！以下の点にご注意ください：

- Vanilla JavaScriptを維持（フレームワーク不要）
- ES6+の機能は積極的に使用
- コードコメントは日本語でOK
