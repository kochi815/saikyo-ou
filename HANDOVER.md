# 算数最強王 — 引き継ぎプロンプト

以下をそのまま新しいClaude Coworkチャットの最初のメッセージとして貼り付けてください。

---

## プロジェクト引き継ぎ：算数最強王

### ゲーム概要
「算数最強王 - ドラゴンドリル・コロシアム」は、ブラウザベースのHTML/JS教育RPGです。
『ドラゴン最強王図鑑 バトルコロシアム -Switch』をトレースし、算数の勉強と融合させたゲームです。

- 対象: 小学校1年〜2年前半（掛け算は含まない）
- 漢字＋カタカナ表記OK（ひらがなのみにする必要なし）
- ポケモン風のターン制バトルRPG。算数の勉強（特訓モード・しごとモード）はバトルとは分離されている

### ファイル構成（全約9,550行）

| ファイル | 行数 | 役割 |
|---------|------|------|
| index.html | 1135 | 全画面のHTML構造、onclick定義 |
| style.css | 787 | メインCSS |
| effects.css | 484 | バトルエフェクトCSS |
| result.css | 441 | リザルト画面CSS |
| modal.css | 185 | モーダルCSS |
| transition.css | 148 | 画面遷移アニメーションCSS |
| zukan.css | 333 | 図鑑CSS |
| config.js | 478 | 全設定データ（技・敵・大会・ショップ等） |
| state.js | 269 | ゲーム状態管理（ステータス計算含む） |
| storage.js | 114 | セーブ/ロード（localStorage, v1→v2マイグレーション） |
| game.js | 756 | バトルエンジン（コマンド選択→ターン実行→勝敗判定） |
| battle-ai.js | 262 | 敵AI（simple/normal/smart 3段階） |
| moves.js | 472 | 技管理＋装備画面 |
| ui.js | 427 | バトルUI（HP表示、コマンドメニュー） |
| training.js | 306 | 特訓モード（4ステータスの算数問題） |
| work.js | 505 | しごとモード（タイムアタック＋デイリーミッション） |
| shop.js | 407 | ショップ（アイテム/技/特別） |
| questions.js | 260 | 算数問題生成 |
| effects.js | 200 | バトルエフェクト（アニメーション） |
| result.js | 197 | リザルト画面 |
| modal.js | 230 | モーダルダイアログ |
| transition.js | 144 | 画面遷移マネージャー |
| sound.js | 187 | サウンド管理 |
| zukan.js | 207 | 図鑑 |
| endless.js | 163 | エンドレスモード |
| achievement.js | 141 | 実績/称号 |
| cup.js | 127 | 大会選択画面 |
| settings.js | 63 | 設定画面 |
| pause.js | 62 | ポーズ |
| tutorial.js | 61 | チュートリアル |

### 主要アーキテクチャ

**バトルシステム:**
- コマンド: たたかう/アイテム/こうたい/にげる
- ターン制: スピードで行動順決定、priority:1で先制
- ダメージ計算: `(power × attack / defense) × 属性倍率 × バフ倍率 × 乱数(0.85〜1.0)`
- 5属性: fire→wind→ground→thunder→water→fire（1.5倍/0.75倍）
- バフ/デバフ: -3〜+3段階（0.5x〜2.0x）

**ステータス計算（state.js）:**
- HP: `70 + (level-1)×5 + trainingStats.hp×2 + charBias`
- 攻撃: `10 + level×2 + trainingStats.attack + charBias`
- 防御: `10 + floor(level×1.5) + trainingStats.defense + charBias`
- 速さ: `10 + level×1 + trainingStats.speed + charBias`

**技システム:**
- 全20技（12個レベル習得、8個ショップ購入）
- バトルには4技を装備
- PP制（各技に使用回数あり）

**経済:**
- しごとモード（タイムアタック＋デイリーミッション）でゴールド獲得
- ショップでアイテム・技・特別アイテム購入

**画面遷移:**
- `TransitionManager.fade(hideIds, showId, showDisplay, callback)` を全画面遷移で使用

**セーブ:**
- localStorage、v1→v2マイグレーション対応（storage.js）

### 画面ID一覧（index.html）
select-screen, home-screen, achievement-screen, settings-screen, cup-select-screen, zukan-screen, training-menu, work-screen, work-timeattack-screen, shop-screen, move-equip-screen, battle-scene, victory-screen, defeat-screen

### 直近で修正済みのバグ（再発に注意）

1. **onclick参照不一致** — index.htmlのonclick名とJS側のメソッド名が不一致だったものを全修正済み
2. **画面ID不一致** — JS内のgetElementById()がHTMLのid属性と不一致だった箇所を全修正済み
3. **重複ID** — battle-sceneとwork-timeattack-screenでquestion-text, btn-1/2/3が重複 → work側をta-接頭辞に変更済み
4. **「もどる」ボタン遷移バグ** — 各画面の戻るボタンが正しいhideIds/showIdで遷移するよう全修正済み
5. **shop.js CSSクラス名不一致** — shop-item-card → shop-card に統一済み
6. **ui.js 設定参照ミス** — GameConfig.items → GameConfig.shopItems に修正済み
7. **battle-ai.js バフ判定・属性有利判定** — ロジックバグ修正済み
8. **入力ブロック制御** — training.js, work.js で連打防止のisInputBlocked制御を修正済み
9. **endless.js メソッド名** — GameManager.nextTurn() → showCommandMenu() に修正済み

### 直近のバランス調整

- 初期HP: 60→70（序盤のRNG依存を緩和）
- 特訓報酬: 2問正解で+1に変更（{5:3, 4:2, 3:1, 2:1, 1:0, 0:0}）
- 「まもる」PP: 5→3（防御技連打でテンポ悪化を防止）

### 既知の注意点

- ゴールド杯（Rank4）はLevel 15解禁だが、特訓なしだとHP=140 vs 敵HP=200超で苦しい。特訓による育成が前提のバランス
- 画面遷移は `TransitionManager.fade()` で統一。直接display操作すると表示崩れの原因になる
- しごとモードのタイムアタック設定（timeAttackConfig）は遅延初期化されている

---

## 最初のタスク

まず全ファイルを読み込んで、以下の観点でバグチェックをお願いします：

1. **onclick参照チェック** — index.htmlの全onclickが、対応するJSファイルに存在する関数/メソッドを正しく参照しているか
2. **画面ID整合性** — JS内のgetElementById()で参照しているIDがindex.htmlに全て存在するか
3. **関数呼び出し整合性** — JS間で呼び出している関数/メソッドが実際に定義されているか（引数の数や型も含む）
4. **画面遷移の網羅チェック** — 全ての「もどる」ボタンや画面遷移が正しいhideIds/showIdを使っているか
5. **入力制御** — ボタン連打による二重実行がないか（isInputBlockedの設定/解除漏れ）
6. **ゲームロジック** — ダメージ計算、経験値、ゴールド報酬、レベルアップ処理にバグがないか
7. **セーブ/ロード** — 全ての永続データが正しく保存・復元されるか

発見したバグは「ファイル名・行番号・内容・修正案」の形式で報告してください。
