// work.js
// しごとモード（タイムアタック＆デイリーミッション）管理
// 算数問題を解いてゴールドを稼ぐモード

const WorkManager = {

    // ==========================================
    //  状態管理
    // ==========================================
    currentMode: null,      // "timeAttack" or "missions"
    timerInterval: null,
    timeRemaining: 0,
    correctCount: 0,
    currentCombo: 0,
    maxCombo: 0,
    isFever: false,         // フィーバーモード中か
    feverTimer: null,        // フィーバータイマー
    feverDuration: 8,        // フィーバー継続秒数
    feverCorrectCount: 0,    // フィーバー中の正解数
    milestoneNext: 5,        // 次のマイルストーン（5問ごと）
    milestoneGoldEarned: 0,  // マイルストーンで獲得したゴールド合計

    // タイムアタック用の問題生成設定
    timeAttackConfig: null,

    // ==========================================
    //  初期化
    // ==========================================
    init: function() {
        // コンフィグを取得
        this.timeAttackConfig = GameConfig.workConfig.timeAttack;
        console.log("WorkManager 初期化完了");
    },

    // ==========================================
    //  メニューを開く
    // ==========================================
    openMenu: function() {
        // タイマーが残っていたらクリア（安全策）
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
        // しごとモードのメニュー画面を表示
        const homeScreens = ["home-screen", "battle-scene", "training-menu", "cup-select-screen", "shop-screen", "zukan-screen", "achievement-screen", "work-timeattack-screen"];
        const workScreenId = "work-screen";

        TransitionManager.fade(homeScreens, workScreenId, "block", () => {
            console.log("しごとモードメニューを開きました");
            // Update the gold display in the static HTML
            document.getElementById('work-gold-display').textContent = GameState.gold;
        });
    },


    // ==========================================
    //  タイムアタックを開始
    // ==========================================
    startTimeAttack: function() {
        if (!this.timeAttackConfig) {
            this.timeAttackConfig = GameConfig.workConfig.timeAttack;
        }

        this.currentMode = "timeAttack";
        this.timeRemaining = this.timeAttackConfig.duration;
        this.correctCount = 0;
        this.currentCombo = 0;
        this.maxCombo = 0;
        this.isFever = false;
        this.feverCorrectCount = 0;
        this.milestoneNext = 5;
        this.milestoneGoldEarned = 0;
        if (this.feverTimer) {
            clearTimeout(this.feverTimer);
            this.feverTimer = null;
        }

        // ゲーム状態をリセット
        GameState.currentQuestion = {};
        GameState.isInputBlocked = false;

        // 画面を遷移
        const homeScreens = ["home-screen", "battle-scene", "training-menu", "cup-select-screen", "shop-screen", "zukan-screen", "achievement-screen", "work-screen"];
        const gameScreen = "work-timeattack-screen";

        TransitionManager.fade(homeScreens, gameScreen, "block", () => {
            console.log("タイムアタック開始");
            this._startTimer();
            this._generateNextQuestion();
        });
    },


    // ==========================================
    //  タイマー開始
    // ==========================================
    _startTimer: function() {
        if (this.timerInterval) clearInterval(this.timerInterval);

        this.timerInterval = setInterval(() => {
            this.timeRemaining--;
            const timerEl = document.getElementById("timer-display");
            if (timerEl) {
                const minutes = Math.floor(this.timeRemaining / 60);
                const seconds = this.timeRemaining % 60;
                timerEl.textContent = minutes + ":" + (seconds < 10 ? "0" : "") + seconds;
                // 時間が減ると色が変わる効果
                if (this.timeRemaining <= 10) {
                    timerEl.style.color = "#e74c3c";
                }
            }

            // 時間終了
            if (this.timeRemaining <= 0) {
                clearInterval(this.timerInterval);
                this._finishTimeAttack();
            }
        }, 1000);
    },

    // ==========================================
    //  次の問題を生成
    // ==========================================
    _generateNextQuestion: function() {
        if (this.currentMode !== "timeAttack") return;

        const config = this.timeAttackConfig;
        // questionTypes からランダムに1つ選ぶ
        const types = Array.isArray(config.questionTypes) ? config.questionTypes : [config.questionTypes];
        const selectedType = types[Math.floor(Math.random() * types.length)];

        // QuestionGenerator の generate() を使用
        // 簡易版として、config に合わせた問題を生成
        const questionData = this._generateQuestionByType(selectedType, config.maxNum);

        // Add options if not present
        if (!questionData.options) {
            questionData.options = QuestionGenerator.makeOptions(questionData.answer);
        }

        GameState.currentQuestion = questionData;

        this._displayQuestion();
    },

    // ==========================================
    //  問題タイプごとに問題を生成
    // ==========================================
    _generateQuestionByType: function(type, maxNum) {
        switch (type) {
            case "addition":
                return QuestionGenerator.makeAddition(maxNum);
            case "subtraction":
                return QuestionGenerator.makeSubtraction(maxNum);
            case "doubles":
                return QuestionGenerator.makeDoubles(maxNum);
            case "makeTen":
                return QuestionGenerator.makeMakeTen();
            case "fillBlankAdd":
                return QuestionGenerator.makeFillBlankAdd(maxNum);
            default:
                return QuestionGenerator.makeAddition(maxNum);
        }
    },

    // ==========================================
    //  問題を表示
    // ==========================================
    _displayQuestion: function() {
        const questionData = GameState.currentQuestion;
        if (!questionData.text) return;

        const questionEl = document.getElementById("ta-question-text");
        if (questionEl) {
            questionEl.textContent = questionData.text;
        }

        // Update answer buttons with the three options
        const options = questionData.options || [questionData.answer];
        const buttonIds = ["ta-btn-1", "ta-btn-2", "ta-btn-3"];

        for (let i = 0; i < 3 && i < options.length; i++) {
            const btn = document.getElementById(buttonIds[i]);
            if (btn) {
                btn.textContent = options[i];
                btn.onclick = () => this._handleAnswer(options[i]);
            }
        }

        // 入力ブロック解除
        GameState.isInputBlocked = false;
    },

    // ==========================================
    //  答えの判定
    // ==========================================
    _handleAnswer: function(selectedAnswer) {
        if (GameState.isInputBlocked) return;
        GameState.isInputBlocked = true;

        const questionData = GameState.currentQuestion;
        const isCorrect = selectedAnswer === questionData.answer;

        if (isCorrect) {
            // 正解
            this.correctCount++;
            this.currentCombo++;
            if (this.currentCombo > this.maxCombo) {
                this.maxCombo = this.currentCombo;
            }
            SoundManager.playSE("correct");

            // フィーバー中の正解をカウント（ゴールド2倍用）
            if (this.isFever) {
                this.feverCorrectCount++;
            }

            // フィーバーモード突入判定（10コンボで発動）
            if (this.currentCombo === 10 && !this.isFever) {
                this._startFever();
            }

            // マイルストーン判定（5問ごと）
            if (this.correctCount >= this.milestoneNext) {
                this._showMilestone(this.milestoneNext);
                this.milestoneNext += 5;
            }
        } else {
            // 不正解（コンボリセット）
            this.currentCombo = 0;
            // フィーバー中に不正解でもフィーバーは継続（タイマーで終了）
            SoundManager.playSE("wrong");
        }

        // UI更新
        const correctEl = document.getElementById("ta-score-display");
        const comboEl = document.getElementById("ta-combo-display");
        if (correctEl) correctEl.textContent = this.correctCount;
        if (comboEl) {
            comboEl.textContent = this.currentCombo;
            // コンボ演出
            this._updateComboVisual(this.currentCombo);
        }

        // 次の問題へ（少し遅延）
        setTimeout(() => {
            GameState.isInputBlocked = false;
            this._generateNextQuestion();
        }, 300);
    },

    // ==========================================
    //  コンボ視覚演出
    // ==========================================
    _updateComboVisual: function(combo) {
        const comboEl = document.getElementById("ta-combo-display");
        if (!comboEl) return;

        // コンボ数に応じて色を変える
        if (combo >= 10) {
            comboEl.style.color = "#ff4444";
            comboEl.style.textShadow = "0 0 10px #ff4444";
            comboEl.style.fontSize = "1.5em";
        } else if (combo >= 7) {
            comboEl.style.color = "#ff8800";
            comboEl.style.textShadow = "0 0 8px #ff8800";
            comboEl.style.fontSize = "1.3em";
        } else if (combo >= 5) {
            comboEl.style.color = "#ffcc00";
            comboEl.style.textShadow = "0 0 5px #ffcc00";
            comboEl.style.fontSize = "1.2em";
        } else if (combo >= 3) {
            comboEl.style.color = "#44cc44";
            comboEl.style.textShadow = "none";
            comboEl.style.fontSize = "1.1em";
        } else {
            comboEl.style.color = "";
            comboEl.style.textShadow = "none";
            comboEl.style.fontSize = "";
        }
    },

    // ==========================================
    //  マイルストーン報酬表示
    // ==========================================
    _showMilestone: function(count) {
        const bonusGold = count; // 5問=5G, 10問=10G, 15問=15G...
        this.milestoneGoldEarned += bonusGold;

        // 画面上にフロート通知を表示
        const screen = document.getElementById("work-timeattack-screen");
        if (!screen) return;

        const notification = document.createElement("div");
        notification.className = "milestone-notification";
        notification.innerHTML = `🎉 ${count}問突破！ +${bonusGold}G`;
        notification.style.cssText = "position:absolute;top:30%;left:50%;transform:translateX(-50%);background:linear-gradient(135deg,#ffd700,#ffaa00);color:#333;font-weight:bold;padding:8px 20px;border-radius:20px;font-size:1.1em;z-index:100;animation:milestoneFloat 1.5s ease-out forwards;pointer-events:none;";
        screen.style.position = "relative";
        screen.appendChild(notification);

        // アニメーション後に削除
        setTimeout(() => {
            if (notification.parentNode) notification.parentNode.removeChild(notification);
        }, 1500);
    },

    // ==========================================
    //  フィーバーモード
    // ==========================================
    _startFever: function() {
        this.isFever = true;

        // フィーバー通知
        const screen = document.getElementById("work-timeattack-screen");
        if (screen) {
            const feverBanner = document.createElement("div");
            feverBanner.id = "fever-banner";
            feverBanner.innerHTML = "🔥 FEVER TIME！ゴールド2倍！🔥";
            feverBanner.style.cssText = "position:absolute;top:15%;left:50%;transform:translateX(-50%);background:linear-gradient(135deg,#ff4444,#ff8800);color:#fff;font-weight:bold;padding:10px 24px;border-radius:25px;font-size:1.2em;z-index:100;animation:feverPulse 0.5s ease-in-out infinite alternate;pointer-events:none;";
            screen.style.position = "relative";
            screen.appendChild(feverBanner);
        }

        // 背景色を変える
        const taScreen = document.getElementById("work-timeattack-screen");
        if (taScreen) {
            taScreen.style.transition = "background 0.3s";
            taScreen.style.background = "linear-gradient(180deg, #2a0000 0%, #440000 100%)";
        }

        // タイマーで終了
        if (this.feverTimer) clearTimeout(this.feverTimer);
        this.feverTimer = setTimeout(() => {
            this._endFever();
        }, this.feverDuration * 1000);
    },

    _endFever: function() {
        this.isFever = false;
        this.feverTimer = null;

        // バナー削除
        const banner = document.getElementById("fever-banner");
        if (banner && banner.parentNode) banner.parentNode.removeChild(banner);

        // 背景色を戻す
        const taScreen = document.getElementById("work-timeattack-screen");
        if (taScreen) {
            taScreen.style.background = "";
        }
    },

    // ==========================================
    //  タイムアタック終了
    // ==========================================
    _finishTimeAttack: function() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }

        // フィーバー終了（残っていれば）
        if (this.isFever) this._endFever();

        // 報酬計算
        const baseReward = this.timeAttackConfig.baseReward;
        const comboBonus = this.timeAttackConfig.comboBonus;
        const baseGold = (this.correctCount * baseReward) + (this.maxCombo * comboBonus);
        const milestoneGold = this.milestoneGoldEarned;
        // フィーバーボーナス：フィーバー中の正解分 × baseReward（2倍の差額分）
        const feverGold = this.feverCorrectCount * baseReward;
        const goldReward = baseGold + milestoneGold + feverGold;

        // ゴールドを追加
        GameState.addGold(goldReward);

        // 最高記録を更新
        let isNewRecord = false;
        if (this.correctCount > GameState.timeAttackBest) {
            GameState.timeAttackBest = this.correctCount;
            isNewRecord = true;
        }

        // コンボ実績を記録
        AchievementManager.recordCombo(this.maxCombo);

        // デイリーミッションの進捗を更新
        this.updateMissionProgress("combo", this.maxCombo);
        this.updateMissionProgress("any", this.correctCount);

        // 経験値付与（正解数 × workXpPerCorrect）
        const xpPerCorrect = GameConfig.workXpPerCorrect || 2;
        const xpGain = this.correctCount * xpPerCorrect;
        const leveledUp = GameState.addExp(xpGain);

        // コンボ演出リセット
        this._updateComboVisual(0);

        // セーブ
        StorageManager.save();

        // 結果テキスト組み立て
        let resultMsg = `正解数: <span class="modal-highlight">${this.correctCount}問</span>`;
        if (isNewRecord) resultMsg += " 🆕 新記録！";
        resultMsg += `\n最大コンボ: <span class="modal-highlight">${this.maxCombo}</span>`;
        resultMsg += `\n\nゴールド報酬:`;
        resultMsg += `\n  基本: +${baseGold}G`;
        if (milestoneGold > 0) {
            resultMsg += `\n  マイルストーン: +${milestoneGold}G`;
        }
        if (feverGold > 0) {
            resultMsg += `\n  🔥 フィーバー: +${feverGold}G`;
        }
        resultMsg += `\n  合計: <span class="modal-highlight">+${goldReward}G</span>`;
        resultMsg += `\n\n📖 経験値 +${xpGain}`;

        // レベルアップ後に結果モーダルを表示する関数
        const showResult = () => {
            ModalManager.show({
                title: isNewRecord ? "🎊 新記録達成！" : "タイムアタック終了！",
                icon: "⏱️",
                type: "success",
                message: resultMsg,
                buttons: [
                    {
                        text: "もう一度",
                        class: "primary",
                        callback: () => this.startTimeAttack()
                    },
                    {
                        text: "メニューへ",
                        class: "secondary",
                        callback: () => this.openMenu()
                    }
                ]
            });
        };

        // レベルアップ演出 → 結果モーダル
        if (leveledUp) {
            ModalManager.showLevelUp(GameState.playerLevel, showResult);
        } else {
            showResult();
        }
    },

    // ==========================================
    //  タイムアタック終了（手動）
    // ==========================================
    endTimeAttack: function() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
        this._finishTimeAttack();
    },

    // ==========================================
    //  デイリーミッション関連
    // ==========================================

    // ==========================================
    //  ミッション画面を開く
    // ==========================================
    openMissions: function() {
        this.generateDailyMissions();

        // For now, show a modal for daily missions instead of a separate screen
        const missions = this.getMissions();
        let missionText = "デイリーミッション:\n\n";
        missions.forEach((mission, idx) => {
            const progress = mission.progress || 0;
            const target = mission.target || 1;
            const status = mission.claimed ? "（獲得済み）" : (progress >= target ? "（クリア）" : "（進行中）");
            missionText += `${idx + 1}. ${mission.name} ${progress}/${target} ${status}\n報酬: ${mission.reward}G\n\n`;
        });

        ModalManager.show({
            title: "📋 デイリーミッション",
            type: "info",
            message: missionText,
            buttons: [{ text: "OK", class: "primary" }]
        });
    },

    // ==========================================
    //  デイリーミッション生成
    // ==========================================
    generateDailyMissions: function() {
        const today = new Date().toISOString().split('T')[0]; // "YYYY-MM-DD" 形式

        // 既存ミッションと日付をチェック
        if (GameState.dailyMissions.date === today && GameState.dailyMissions.missions.length === 3) {
            // 今日のミッションは既に生成済み
            return;
        }

        // 新しく生成
        GameState.dailyMissions.date = today;
        GameState.dailyMissions.missions = [];

        const poolEasy = GameConfig.missionPool.easy;
        const poolNormal = GameConfig.missionPool.normal;
        const poolHard = GameConfig.missionPool.hard;

        // 各難度から1つずつランダムに選ぶ
        const easy = JSON.parse(JSON.stringify(poolEasy[Math.floor(Math.random() * poolEasy.length)]));
        const normal = JSON.parse(JSON.stringify(poolNormal[Math.floor(Math.random() * poolNormal.length)]));
        const hard = JSON.parse(JSON.stringify(poolHard[Math.floor(Math.random() * poolHard.length)]));

        // 進度フィールドを追加
        easy.progress = 0;
        easy.completed = false;
        easy.claimed = false;

        normal.progress = 0;
        normal.completed = false;
        normal.claimed = false;

        hard.progress = 0;
        hard.completed = false;
        hard.claimed = false;

        GameState.dailyMissions.missions = [easy, normal, hard];
        console.log("デイリーミッション生成:", GameState.dailyMissions.missions);
    },

    // _renderMissionsScreen: 削除済み（ミッション表示はモーダル経由 openMissions() で実装）

    // ==========================================
    //  ミッション取得（進捗を含める）
    // ==========================================
    getMissions: function() {
        this.generateDailyMissions();
        return GameState.dailyMissions.missions || [];
    },

    // ==========================================
    //  ミッション進捗を更新
    // ==========================================
    updateMissionProgress: function(type, amount) {
        const missions = this.getMissions();

        missions.forEach(mission => {
            if (mission.claimed) return; // 報酬獲得済みはスキップ

            let shouldUpdate = false;

            // タイプマッチングの判定
            if (type === "any" && (mission.type === "any" || mission.type === "speed")) {
                shouldUpdate = true;
            } else if (mission.type === type) {
                shouldUpdate = true;
            } else if (type === "combo" && mission.type === "combo") {
                shouldUpdate = true;
            }

            if (shouldUpdate) {
                mission.progress += amount;
                if (mission.progress >= mission.target) {
                    mission.completed = true;
                    console.log(`ミッション達成: ${mission.name}`);
                }
            }
        });

        StorageManager.save();
    },

    // ==========================================
    //  ミッション報酬を獲得
    // ==========================================
    claimMissionReward: function(index) {
        const missions = this.getMissions();
        if (index < 0 || index >= missions.length) return;

        const mission = missions[index];
        if (mission.claimed || mission.progress < mission.target) {
            return;
        }

        // ゴールドを追加
        GameState.addGold(mission.reward);
        mission.claimed = true;

        StorageManager.save();

        // UI更新
        ModalManager.show({
            icon: "💰",
            type: "success",
            message: `${mission.name}\n報酬: +${mission.reward}G を獲得しました！`,
            buttons: [{ text: "OK", class: "primary", callback: () => this.openMissions() }]
        });
    },

    // ==========================================
    //  ホームに戻る
    // ==========================================
    backToHome: function() {
        const workScreens = ["work-screen", "work-timeattack-screen"];
        const homeScreen = "home-screen";

        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }

        TransitionManager.fade(workScreens, homeScreen, "block", () => {
            console.log("ホームに戻りました");
            TrainingManager.updateHomeDisplay();
        });
    }

};
