// storage.js
// セーブ・ロード管理（大改修版）

const StorageManager = {
    saveKey: "dragon_colosseum_save_v2",  // バージョンアップ

    save: function() {
        const saveData = {
            version: 2,
            playerLevel: GameState.playerLevel,
            currentExp: GameState.currentExp,
            selectedCharacterType: GameState.selectedCharacterType,
            trainingStats: GameState.trainingStats,
            gold: GameState.gold,
            learnedMoves: GameState.learnedMoves,
            equippedMoves: GameState.equippedMoves,
            inventory: GameState.inventory,
            shopPurchasedMoves: GameState.shopPurchasedMoves,
            clearedCupIds: GameState.clearedCupIds,
            defeatedEnemyIndices: GameState.defeatedEnemyIndices,
            achievementData: GameState.achievementData,
            dailyMissions: GameState.dailyMissions,
            timeAttackBest: GameState.timeAttackBest
        };

        try {
            localStorage.setItem(this.saveKey, JSON.stringify(saveData));
            console.log("セーブ完了");
        } catch (e) {
            console.error("セーブに失敗しました", e);
        }
    },

    load: function() {
        // v2を試す
        let dataStr = localStorage.getItem(this.saveKey);

        // v1の旧データがあればマイグレーション
        if (!dataStr) {
            const oldData = localStorage.getItem("dragon_colosseum_save_v1");
            if (oldData) {
                dataStr = oldData;
                console.log("v1データを検出。マイグレーションします。");
            }
        }

        if (!dataStr) return false;

        try {
            const data = JSON.parse(dataStr);

            GameState.playerLevel = data.playerLevel || 1;
            GameState.currentExp = data.currentExp || 0;
            GameState.selectedCharacterType = data.selectedCharacterType || "blue";

            // 特訓データ（defenseが無い旧データにも対応）
            if (data.trainingStats) {
                GameState.trainingStats = {
                    attack: data.trainingStats.attack || 0,
                    speed: data.trainingStats.speed || 0,
                    defense: data.trainingStats.defense || 0,
                    hp: data.trainingStats.hp || 0
                };
            }

            // 新規データ
            GameState.gold = data.gold || 0;
            GameState.learnedMoves = data.learnedMoves || [];
            GameState.equippedMoves = data.equippedMoves || [];
            GameState.inventory = data.inventory || {};
            GameState.shopPurchasedMoves = data.shopPurchasedMoves || [];
            GameState.clearedCupIds = data.clearedCupIds || [];
            GameState.defeatedEnemyIndices = data.defeatedEnemyIndices || [];
            GameState.dailyMissions = data.dailyMissions || { date: "", missions: [] };
            GameState.timeAttackBest = data.timeAttackBest || 0;

            // 実績データ
            if (data.achievementData) {
                GameState.achievementData = {
                    totalWins: data.achievementData.totalWins || 0,
                    maxCombo: data.achievementData.maxCombo || 0,
                    trainingCount: data.achievementData.trainingCount || 0,
                    unlockedIds: data.achievementData.unlockedIds || [],
                    endlessBest: data.achievementData.endlessBest || 0
                };
            }

            // v1からのマイグレーション: 技が空なら現在レベルに応じて習得
            if (GameState.learnedMoves.length === 0) {
                GameState._checkLearnMoves();
            }

            // v2として再保存
            if (!data.version || data.version < 2) {
                this.save();
                // 旧データを削除
                localStorage.removeItem("dragon_colosseum_save_v1");
                console.log("v1 → v2 マイグレーション完了");
            }

            console.log("ロード完了");
            return true;
        } catch (e) {
            console.error("ロードデータの読み込みに失敗", e);
            return false;
        }
    },

    clear: function() {
        localStorage.removeItem(this.saveKey);
        localStorage.removeItem("dragon_colosseum_save_v1");
        console.log("セーブデータを削除しました");
    }
};
