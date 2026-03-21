// training.js
// 特訓モードを管理するファイル

const TrainingManager = {
    // ============================================
    // 状態管理
    // ============================================
    currentType: null, // 'attack', 'speed', 'defense', 'hp'
    questionCount: 0,
    maxQuestions: 5,   // 1回の特訓は5問
    correctCount: 0,
    streak: 0,         // 連続正解数
    isBonusQuestion: false, // ボーナス問題フラグ
    bonusCount: 0,     // ボーナス問題で正解した数

    // ランダム励ましメッセージ
    _correctMessages: [
        "正解！すごい！",
        "正解！その調子！",
        "正解！天才だ！",
        "正解！バッチリ！",
        "正解！ナイス！",
        "正解！カンペキ！",
        "正解！さすが！"
    ],
    _wrongMessages: [
        "残念…次はいけるぞ！",
        "おしい！もう少し！",
        "ドンマイ！次こそ！",
        "残念…あきらめるな！",
        "ハズレ…集中だ！"
    ],
    _streakMessages: {
        3: "🔥 3連続正解！ボーナス +1！",
        5: "⚡ パーフェクト！ボーナス +2！"
    },

    // ============================================
    // メニュー操作
    // ============================================

    // メニューを開く
    openMenu: function() {
        TransitionManager.fade("home-screen", "training-menu", "block");
    },

    // ホームに戻る
    backToHome: function() {
        // ホーム画面の表示更新
        this.updateHomeDisplay();
        TransitionManager.fade(["training-menu", "battle-scene"], "home-screen", "block");
    },

    // ============================================
    // ホーム画面の表示更新
    // ============================================

    // ホーム画面の表示を更新（ドラゴンの画像やステータス）
    updateHomeDisplay: function() {
        // 画像更新
        const type = GameState.selectedCharacterType;
        const charConfig = GameConfig.playerTypes[type];

        // 画像パス取得ロジック（UI.jsから拝借）
        let targetImage = charConfig.images[1];
        for (let key in charConfig.images) {
            if (GameState.playerLevel >= parseInt(key)) {
                targetImage = charConfig.images[key];
            }
        }
        document.getElementById('home-dragon-img').src = targetImage;
        document.getElementById('home-name').textContent = charConfig.name;
        document.getElementById('home-lv').textContent = GameState.playerLevel;

        // ステータス表示（4つのステータス）
        document.getElementById('stat-atk').textContent = GameState.trainingStats.attack;
        document.getElementById('stat-spd').textContent = GameState.trainingStats.speed;
        document.getElementById('stat-def').textContent = GameState.trainingStats.defense;
        document.getElementById('stat-hp').textContent = GameState.trainingStats.hp;

        // ゴールド表示を更新
        const goldEl = document.getElementById('gold-display');
        if (goldEl) goldEl.textContent = GameState.gold;

        // エンドレスモードボタン表示
        const endlessBtn = document.getElementById('btn-endless');
        if (endlessBtn) {
            endlessBtn.style.display = EndlessManager.isUnlocked() ? "block" : "none";
        }

        // 称号表示
        const titleEl = document.getElementById('home-title-text');
        if (titleEl) {
            const maxCup = Math.max(0, ...(GameState.clearedCupIds || []));
            const titleData = GameConfig.titles[maxCup] || GameConfig.titles[0];
            titleEl.textContent = titleData.name;
            titleEl.style.color = titleData.color;
        }
    },

    // ============================================
    // 特訓の開始と進行
    // ============================================

    // 特訓スタート
    startTraining: function(type) {
        this.currentType = type;
        this.questionCount = 0;
        this.correctCount = 0;
        this.streak = 0;
        this.isBonusQuestion = false;
        this.bonusCount = 0;

        console.log("特訓開始: " + type);

        // 特訓BGM開始
        SoundManager.playSE("select");
        SoundManager.playBGM("bgm_training");

        // 画面切り替え（バトル画面のレイアウトを流用・フェード遷移）
        TransitionManager.fade("training-menu", "battle-scene", "flex");

        // Ensure battle-bottom is visible and command menus are hidden for training
        setTimeout(() => {
            const battleBottom = document.getElementById('battle-bottom');
            if (battleBottom) battleBottom.style.display = 'block';
            UIManager.hideCommandArea();
        }, 50);

        // 敵エリアを特訓用ビジュアルに切り替え
        this._showTrainingVisual(type);
        UIManager.showMessage("特訓 開始！");

        setTimeout(() => {
            this.nextQuestion();
        }, 1000);
    },

    // 次の問題
    nextQuestion: function() {
        // 5問終了で特訓完了
        if (this.questionCount >= this.maxQuestions) {
            this.finishTraining();
            return;
        }

        this.questionCount++;

        // ボーナス問題判定（20%の確率で出現、第1問は除く）
        this.isBonusQuestion = (this.questionCount > 1 && Math.random() < 0.2);

        // 特訓タイプに応じた問題生成
        const question = this._generateTrainingQuestion(this.currentType);
        GameState.currentQuestion = question;

        // ボーナス問題の場合は特別な表示
        let prefix = `第${this.questionCount}問：`;
        if (this.isBonusQuestion) {
            prefix = `⭐ ボーナス問題！：`;
        }
        UIManager.showMessage(prefix + ` ${GameState.currentQuestion.text}`);

        // ボーナス問題の視覚演出
        this._updateBonusVisual(this.isBonusQuestion);

        UIManager.setupButtons();
        this._updateTrainingCounter();

        // options配列の値で比較（比較問題のシンボルにも対応）
        const options = question.options;
        for (let i = 0; i < 3; i++) {
            const btn = document.getElementById(`btn-${i + 1}`);
            btn.onclick = () => this.checkAnswer(options[i]);
        }
    },

    // 答え合わせ
    checkAnswer: function(selectedValue) {
        if (GameState.isInputBlocked) return;
        GameState.isInputBlocked = true;

        const isCorrect = (selectedValue === GameState.currentQuestion.answer);

        if (isCorrect) {
            this.correctCount++;
            this.streak++;

            // ボーナス問題正解で追加カウント
            if (this.isBonusQuestion) {
                this.bonusCount++;
            }

            SoundManager.playSE("correct");

            // ストリークボーナス判定（3連続 or 5連続=パーフェクト）
            if (this._streakMessages[this.streak]) {
                UIManager.showMessage(this._streakMessages[this.streak]);
            } else {
                // ランダム励ましメッセージ
                const msgs = this._correctMessages;
                UIManager.showMessage(msgs[Math.floor(Math.random() * msgs.length)]);
            }
        } else {
            this.streak = 0;
            SoundManager.playSE("wrong");

            // ランダム励ましメッセージ（不正解時）
            const msgs = this._wrongMessages;
            UIManager.showMessage(msgs[Math.floor(Math.random() * msgs.length)]);
        }

        // ボーナス演出リセット
        this._updateBonusVisual(false);

        setTimeout(() => {
            GameState.isInputBlocked = false;
            this.nextQuestion();
        }, 1000);
    },

    // ============================================
    // 特訓用問題生成ヘルパー
    // ============================================

    // 特訓タイプに応じた問題を生成
    // - 設定から questionTypes配列と maxNum を取得
    // - questionTypes から１つランダムに選択
    // - その問題タイプで問題を生成
    _generateTrainingQuestion: function(trainingType) {
        // trainingType = 'attack', 'speed', 'defense', 'hp'
        const config = GameConfig.trainingConfig[trainingType];
        if (!config) {
            console.error("特訓タイプが見つかりません: " + trainingType);
            // フォールバック：通常の問題生成
            return QuestionGenerator.generate(1);
        }

        // questionTypes配列からランダムに１つ選択
        const questionTypes = config.questionTypes;
        const randomIndex = Math.floor(Math.random() * questionTypes.length);
        const selectedType = questionTypes[randomIndex];

        // 選択された問題タイプで問題生成
        // QuestionGenerator.generate() の第2引数として設定を渡す
        const customConfig = {
            type: selectedType,
            maxNum: config.maxNum
        };

        return QuestionGenerator.generate(1, customConfig);
    },

    // ============================================
    // 特訓ビジュアル表示
    // ============================================

    // 特訓ビジュアルの表示
    _showTrainingVisual: function(type) {
        const enemyArea = document.getElementById('enemy-area');
        if (!enemyArea) return;

        // 設定から icon と label を取得
        const config = GameConfig.trainingConfig[type];
        const icon = config ? config.icon : "🎯";
        const label = config ? config.label : "とっくん";

        // 敵エリアの中身を一時的に隠す
        enemyArea.style.visibility = 'hidden';

        // ポーズボタンを隠す（特訓中は使えない）
        const pauseBtn = document.getElementById('btn-pause');
        if (pauseBtn) pauseBtn.style.display = 'none';

        // ラウンドバナーを特訓バナーに差し替え
        const banner = document.getElementById('round-banner');
        if (banner) {
            banner.className = 'training-banner';
            banner.textContent = label;
        }

        // 特訓ターゲット表示用オーバーレイを作成
        let target = document.getElementById('training-target');
        if (!target) {
            target = document.createElement('div');
            target.id = 'training-target';
            target.className = 'training-target';
            enemyArea.parentNode.insertBefore(target, enemyArea.nextSibling);
        }
        target.style.display = 'flex';
        target.innerHTML = `
            <div class="training-target-icon">${icon}</div>
            <div class="training-counter" id="training-counter">0 / ${this.maxQuestions}</div>
        `;
    },

    // 特訓ビジュアルを片付ける
    _hideTrainingVisual: function() {
        const enemyArea = document.getElementById('enemy-area');
        if (enemyArea) enemyArea.style.visibility = 'visible';

        // ポーズボタンを復帰
        const pauseBtn = document.getElementById('btn-pause');
        if (pauseBtn) pauseBtn.style.display = 'flex';

        const banner = document.getElementById('round-banner');
        if (banner) {
            banner.className = '';
            banner.textContent = '';
        }

        const target = document.getElementById('training-target');
        if (target) target.style.display = 'none';
    },

    // 特訓カウンター更新
    _updateTrainingCounter: function() {
        const counter = document.getElementById('training-counter');
        if (counter) {
            counter.textContent = `${this.questionCount} / ${this.maxQuestions}`;
        }
    },

    // ============================================
    // 特訓終了と報酬
    // ============================================

    // 特訓終了：結果発表
    finishTraining: function() {
        // 実績：特訓回数カウント
        AchievementManager.recordTraining();

        // 新しい報酬計算：正解数に応じたテーブルを使用
        const rewardsTable = GameConfig.trainingRewards;
        let gain = rewardsTable[this.correctCount] || 0;

        // ボーナス加算
        let bonusGain = 0;
        let bonusText = "";

        // パーフェクトボーナス（全問正解で +2）
        if (this.correctCount === this.maxQuestions) {
            bonusGain += 2;
            bonusText += "\n⭐ パーフェクトボーナス +2！";
        }

        // ボーナス問題正解ボーナス（1問正解につき +1）
        if (this.bonusCount > 0) {
            bonusGain += this.bonusCount;
            bonusText += `\n🌟 ボーナス問題 ×${this.bonusCount} → +${this.bonusCount}！`;
        }

        const totalGain = gain + bonusGain;

        if (totalGain > 0) {
            // ステータス加算（4タイプに対応）
            if (this.currentType === 'attack') {
                GameState.trainingStats.attack += totalGain;
            } else if (this.currentType === 'speed') {
                GameState.trainingStats.speed += totalGain;
            } else if (this.currentType === 'defense') {
                GameState.trainingStats.defense += totalGain;
            } else if (this.currentType === 'hp') {
                GameState.trainingStats.hp += totalGain;
            }

            // セーブする
            StorageManager.save();
        }

        // 特訓ビジュアルを片付ける
        this._hideTrainingVisual();

        // 特訓BGMフェードアウト
        SoundManager.fadeOutBGM(500);

        // モーダルで結果発表 → 閉じたらホームへ
        StorageManager.save();
        this._showTrainingResultEnhanced(totalGain, bonusText, () => {
            this.backToHome();
            SoundManager.playBGM("bgm_home");
            // 実績チェック
            AchievementManager.checkAndNotify();
        });
    },

    // ============================================
    // 拡張版の結果表示
    // ============================================
    _showTrainingResultEnhanced: function(totalGain, bonusText, onClose) {
        const statLabels = {
            attack: "攻撃力",
            defense: "防御力",
            speed: "素早さ",
            hp: "体力"
        };
        const isPerfect = (this.correctCount === this.maxQuestions);

        if (totalGain > 0) {
            const icon = isPerfect ? "🌟" : "💥";
            const title = isPerfect ? "パーフェクト！！" : "特訓 完了！";
            let message = `<span class="modal-highlight">${this.correctCount}問</span> 正解！\n${statLabels[this.currentType] || this.currentType} が <span class="modal-highlight">+${totalGain}</span> 上がった！`;
            if (bonusText) {
                message += "\n" + bonusText;
            }

            ModalManager.show({
                icon: icon,
                title: title,
                message: message,
                type: "success",
                buttons: [{ text: isPerfect ? "最高！" : "よし！", class: "primary", callback: onClose }]
            });
        } else {
            ModalManager.show({
                icon: "😣",
                title: "残念……",
                message: `${this.correctCount}問 正解……\nステータスは 上がらなかった。\nもう一度チャレンジしよう！`,
                type: "warning",
                buttons: [{ text: "もう一回！", class: "primary", callback: onClose }]
            });
        }
    },

    // ============================================
    // ボーナス問題の視覚演出
    // ============================================
    _updateBonusVisual: function(isBonus) {
        const banner = document.getElementById('round-banner');
        if (!banner) return;

        if (isBonus) {
            banner.style.color = "#ffd700";
            banner.style.textShadow = "0 0 10px #ffd700";
        } else {
            banner.style.color = "";
            banner.style.textShadow = "";
        }
    }
};