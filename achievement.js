// achievement.js
// 実績・バッジシステム

const AchievementManager = {

    // 実績定義
    definitions: [
        { id: "first_win",      icon: "🎉", name: "はじめての勝利",       desc: "はじめて大会に勝った",         check: (s) => s.totalWins >= 1 },
        { id: "win_5",          icon: "⚔️", name: "5回 勝利",            desc: "大会で5回勝った",             check: (s) => s.totalWins >= 5 },
        { id: "win_20",         icon: "🔥", name: "連戦連勝",             desc: "大会で20回勝った",            check: (s) => s.totalWins >= 20 },
        { id: "combo_5",        icon: "💥", name: "コンボマスター",       desc: "5コンボ 達成！",              check: (s) => s.maxCombo >= 5 },
        { id: "combo_10",       icon: "🌟", name: "コンボキング",         desc: "10コンボ 達成！",             check: (s) => s.maxCombo >= 10 },
        { id: "level_5",        icon: "⬆️", name: "レベル5",              desc: "レベル5になった",             check: (s) => s.maxLevel >= 5 },
        { id: "level_10",       icon: "🌙", name: "レベル10",             desc: "レベル10になった",            check: (s) => s.maxLevel >= 10 },
        { id: "level_20",       icon: "👑", name: "レベル20",             desc: "レベル20になった",            check: (s) => s.maxLevel >= 20 },
        { id: "zukan_10",       icon: "📖", name: "図鑑 10体",           desc: "10体のドラゴンを倒した",      check: (s) => s.zukanCount >= 10 },
        { id: "zukan_all",      icon: "🏅", name: "図鑑 コンプリート",    desc: "全部のドラゴンを倒した",      check: (s) => s.zukanCount >= 31 },
        { id: "cup_beginner",   icon: "🏆", name: "ビギナーチャンプ",     desc: "ビギナー杯 クリア",          check: (s) => s.clearedCups.includes(1) },
        { id: "cup_bronze",     icon: "🥉", name: "ブロンズチャンプ",     desc: "ブロンズ杯 クリア",          check: (s) => s.clearedCups.includes(2) },
        { id: "cup_silver",     icon: "🥈", name: "シルバーチャンプ",     desc: "シルバー杯 クリア",          check: (s) => s.clearedCups.includes(3) },
        { id: "cup_gold",       icon: "🥇", name: "ゴールドチャンプ",     desc: "ゴールド杯 クリア",          check: (s) => s.clearedCups.includes(4) },
        { id: "cup_champion",   icon: "👑", name: "最強王！",             desc: "最強王トーナメント 制覇！",   check: (s) => s.clearedCups.includes(5) },
        { id: "training_10",    icon: "💪", name: "特訓の鬼",             desc: "特訓を10回した",              check: (s) => s.trainingCount >= 10 },
    ],

    // 実績のステータスを収集
    _getStats: function() {
        return {
            totalWins: GameState.achievementData ? GameState.achievementData.totalWins || 0 : 0,
            maxCombo: GameState.achievementData ? GameState.achievementData.maxCombo || 0 : 0,
            maxLevel: GameState.playerLevel || 1,
            zukanCount: GameState.defeatedEnemyIndices ? GameState.defeatedEnemyIndices.length : 0,
            clearedCups: GameState.clearedCupIds || [],
            trainingCount: GameState.achievementData ? GameState.achievementData.trainingCount || 0 : 0,
        };
    },

    // 解除済み実績IDのリストを返す
    getUnlocked: function() {
        const stats = this._getStats();
        const unlocked = [];
        this.definitions.forEach(def => {
            try {
                if (def.check(stats)) {
                    unlocked.push(def.id);
                }
            } catch(e) {}
        });
        return unlocked;
    },

    // 新しい実績が解除されたかチェック＆通知
    checkAndNotify: function() {
        const unlocked = this.getUnlocked();
        const prev = GameState.achievementData ? GameState.achievementData.unlockedIds || [] : [];

        const newOnes = unlocked.filter(id => !prev.includes(id));

        if (newOnes.length > 0) {
            // 新実績を記録
            if (!GameState.achievementData) GameState.achievementData = {};
            GameState.achievementData.unlockedIds = unlocked;
            StorageManager.save();

            // 最初の1つだけ通知（複数あっても連続モーダルは煩いので）
            const def = this.definitions.find(d => d.id === newOnes[0]);
            if (def) {
                setTimeout(() => {
                    SoundManager.playSE("trophy");
                    ModalManager.show({
                        icon: def.icon,
                        title: "実績 解放！",
                        message: `「${def.name}」\n${def.desc}`,
                        type: "success",
                        buttons: [{ text: "やったー！", class: "primary" }]
                    });
                }, 500);
            }
        }
    },

    // 勝利数をカウントアップ
    recordWin: function() {
        if (!GameState.achievementData) GameState.achievementData = {};
        GameState.achievementData.totalWins = (GameState.achievementData.totalWins || 0) + 1;
    },

    // コンボ記録
    recordCombo: function(combo) {
        if (!GameState.achievementData) GameState.achievementData = {};
        if (combo > (GameState.achievementData.maxCombo || 0)) {
            GameState.achievementData.maxCombo = combo;
        }
    },

    // 特訓回数カウント
    recordTraining: function() {
        if (!GameState.achievementData) GameState.achievementData = {};
        GameState.achievementData.trainingCount = (GameState.achievementData.trainingCount || 0) + 1;
    },

    // ==========================================
    //  実績一覧画面
    // ==========================================
    open: function() {
        SoundManager.playSE("select");
        this.render();
        TransitionManager.fade("home-screen", "achievement-screen", "block");
    },

    close: function() {
        SoundManager.playSE("select");
        TransitionManager.fade("achievement-screen", "home-screen", "block");
    },

    render: function() {
        const grid = document.getElementById("achievement-grid");
        if (!grid) return;

        const unlocked = this.getUnlocked();
        grid.innerHTML = "";

        this.definitions.forEach(def => {
            const isUnlocked = unlocked.includes(def.id);
            const card = document.createElement("div");
            card.className = "achievement-card" + (isUnlocked ? " unlocked" : " locked");
            card.innerHTML = `
                <div class="achievement-icon">${isUnlocked ? def.icon : "❓"}</div>
                <div class="achievement-name">${isUnlocked ? def.name : "？？？"}</div>
                ${isUnlocked ? `<div class="achievement-desc">${def.desc}</div>` : ""}
            `;
            grid.appendChild(card);
        });

        // カウンター更新
        const counter = document.getElementById("achievement-counter");
        if (counter) {
            counter.textContent = `${unlocked.length} / ${this.definitions.length}`;
        }
    }
};
