// battle-ai.js
// 敵AIの行動判断ロジック

const BattleAI = {
    // ==========================================
    // 敵のPPを管理するオブジェクト
    // （敵各体ごとに異なるPPを追跡）
    // ==========================================
    enemyPP: {},

    // ==========================================
    // 初期化：敵が現れたときにPPを設定
    // ==========================================
    initEnemyPP(enemyData) {
        // 敵が複数回戦うことを想定し、敵名またはIDで識別
        const enemyKey = enemyData.name || `enemy_${Date.now()}`;

        // PPを初期化（各技のPPの最大値）
        this.enemyPP[enemyKey] = {};
        enemyData.moves.forEach(moveId => {
            const moveData = GameConfig.moves[moveId];
            if (moveData) {
                this.enemyPP[enemyKey][moveId] = moveData.pp;
            }
        });

        return this.enemyPP[enemyKey];
    },

    // ==========================================
    // メイン：敵が使用する技を決定
    // ==========================================
    chooseAction(enemyData, enemyHp, maxEnemyHp, playerHp, maxPlayerHp, enemyBuffs) {
        const enemyKey = enemyData.name || `enemy_${Date.now()}`;

        // PPが初期化されていなければ初期化
        if (!this.enemyPP[enemyKey]) {
            this.initEnemyPP(enemyData);
        }

        // 敵のAIタイプに応じた行動選択
        const aiType = enemyData.ai || "simple";

        let selectedMoveId;

        if (aiType === "simple") {
            selectedMoveId = this._simpleAI(enemyData, enemyHp, maxEnemyHp);
        } else if (aiType === "normal") {
            selectedMoveId = this._normalAI(enemyData, enemyHp, maxEnemyHp, playerHp, maxPlayerHp, enemyBuffs);
        } else if (aiType === "smart") {
            selectedMoveId = this._smartAI(enemyData, enemyHp, maxEnemyHp, playerHp, maxPlayerHp, enemyBuffs);
        } else {
            selectedMoveId = this._simpleAI(enemyData, enemyHp, maxEnemyHp);
        }

        // PPをデクリメント（技が選択されたら）
        if (selectedMoveId && this.enemyPP[enemyKey][selectedMoveId] > 0) {
            this.enemyPP[enemyKey][selectedMoveId]--;
        }

        return selectedMoveId;
    },

    // ==========================================
    // SIMPLE AI：ランダムに攻撃技を選択
    // ==========================================
    _simpleAI(enemyData, enemyHp, maxEnemyHp) {
        // PPが残っている攻撃技のみを対象
        const validMoves = this._getValidAttackMoves(enemyData);

        if (validMoves.length === 0) {
            // 有効な技がなければ「たいあたり」にフォールバック
            return "tackle";
        }

        // ランダムに選択
        return validMoves[Math.floor(Math.random() * validMoves.length)];
    },

    // ==========================================
    // NORMAL AI：基本的な戦略を使用
    // ==========================================
    _normalAI(enemyData, enemyHp, maxEnemyHp, playerHp, maxPlayerHp, enemyBuffs) {
        const enemyKey = enemyData.name || `enemy_${Date.now()}`;
        const hpPercent = enemyHp / maxEnemyHp;

        // 1. HPが30%未満かつ回復技がある → 50%の確率で回復
        if (hpPercent < 0.3) {
            const healMoves = this._getValidHealMoves(enemyData);
            if (healMoves.length > 0 && Math.random() < 0.5) {
                return healMoves[0];
            }
        }

        // 2. バフをまだ使ってない && バフ技がある → 30%の確率でバフを使用
        const hasBuffs = enemyBuffs && (enemyBuffs.attack > 0 || enemyBuffs.defense > 0 || enemyBuffs.speed > 0);
        if (!hasBuffs) {
            const buffMoves = this._getValidBuffMoves(enemyData);
            if (buffMoves.length > 0 && Math.random() < 0.3) {
                return buffMoves[0];
            }
        }

        // 3. それ以外は攻撃技をランダムに選択
        const validMoves = this._getValidAttackMoves(enemyData);
        if (validMoves.length === 0) {
            return "tackle";
        }

        return validMoves[Math.floor(Math.random() * validMoves.length)];
    },

    // ==========================================
    // SMART AI：高度な戦略を使用
    // ==========================================
    _smartAI(enemyData, enemyHp, maxEnemyHp, playerHp, maxPlayerHp, enemyBuffs) {
        const enemyKey = enemyData.name || `enemy_${Date.now()}`;
        const hpPercent = enemyHp / maxEnemyHp;

        // 1. HPが30%未満かつ回復技がある → 60%の確率で回復
        if (hpPercent < 0.3) {
            const healMoves = this._getValidHealMoves(enemyData);
            if (healMoves.length > 0 && Math.random() < 0.6) {
                return healMoves[0];
            }
        }

        // 2. HPが50%未満かつ防御技がある → 40%の確率で防御
        if (hpPercent < 0.5) {
            const guardMoves = this._getValidGuardMoves(enemyData);
            if (guardMoves.length > 0 && Math.random() < 0.4) {
                return guardMoves[0];
            }
        }

        // 3. バフをまだ使ってない && バフ技がある → 40%の確率でバフを使用
        const hasBuffs = enemyBuffs && (enemyBuffs.attack > 0 || enemyBuffs.defense > 0 || enemyBuffs.speed > 0);
        if (!hasBuffs) {
            const buffMoves = this._getValidBuffMoves(enemyData);
            if (buffMoves.length > 0 && Math.random() < 0.4) {
                return buffMoves[0];
            }
        }

        // 4. 60%の確率で相性有利な技を優先
        if (Math.random() < 0.6) {
            const advantageMoves = this._getValidMovesByAdvantage(enemyData);
            if (advantageMoves.length > 0) {
                return advantageMoves[Math.floor(Math.random() * advantageMoves.length)];
            }
        }

        // 5. それ以外は攻撃技をランダムに選択
        const validMoves = this._getValidAttackMoves(enemyData);
        if (validMoves.length === 0) {
            return "tackle";
        }

        return validMoves[Math.floor(Math.random() * validMoves.length)];
    },

    // ==========================================
    // ヘルパー関数：有効な技を絞り込む
    // ==========================================

    // PPが残っていて有効な攻撃技のみを取得
    _getValidAttackMoves(enemyData) {
        const enemyKey = enemyData.name || `enemy_${Date.now()}`;
        return enemyData.moves.filter(moveId => {
            const moveData = GameConfig.moves[moveId];
            if (!moveData) return false;

            // 攻撃カテゴリ、かつPPが残っている
            return (
                moveData.category === "attack" &&
                this.enemyPP[enemyKey][moveId] > 0
            );
        });
    },

    // PPが残っていて有効な回復技のみを取得
    _getValidHealMoves(enemyData) {
        const enemyKey = enemyData.name || `enemy_${Date.now()}`;
        return enemyData.moves.filter(moveId => {
            const moveData = GameConfig.moves[moveId];
            if (!moveData) return false;

            // 回復カテゴリ、かつPPが残っている
            return (
                moveData.category === "heal" &&
                this.enemyPP[enemyKey][moveId] > 0
            );
        });
    },

    // PPが残っていて有効なバフ技のみを取得
    _getValidBuffMoves(enemyData) {
        const enemyKey = enemyData.name || `enemy_${Date.now()}`;
        return enemyData.moves.filter(moveId => {
            const moveData = GameConfig.moves[moveId];
            if (!moveData) return false;

            // バフカテゴリ（buff or debuff）、かつPPが残っている
            return (
                (moveData.category === "buff" || moveData.category === "debuff") &&
                this.enemyPP[enemyKey][moveId] > 0
            );
        });
    },

    // PPが残っていて有効な防御技のみを取得
    _getValidGuardMoves(enemyData) {
        const enemyKey = enemyData.name || `enemy_${Date.now()}`;
        return enemyData.moves.filter(moveId => {
            const moveData = GameConfig.moves[moveId];
            if (!moveData) return false;

            // 防御効果を持つ技、かつPPが残っている
            return (
                moveData.effect &&
                moveData.effect.type === "guard" &&
                this.enemyPP[enemyKey][moveId] > 0
            );
        });
    },

    // ==========================================
    // ヘルパー関数：属性相性で有利な技を取得
    // ==========================================
    _getValidMovesByAdvantage(enemyData) {
        const enemyKey = enemyData.name || `enemy_${Date.now()}`;

        // プレイヤーの属性を取得
        const playerType = GameState.selectedCharacterType || "blue";
        const playerCharData = GameConfig.playerTypes[playerType];
        const playerElemType = playerCharData ? playerCharData.type : "none";

        // 敵の属性
        const enemyElemType = enemyData.type || "none";

        // 相性テーブルからプレイヤーに有利な属性を取得
        const playerTypeData = GameConfig.typeChart[playerElemType];
        const advantageType = playerTypeData ? playerTypeData.weak : null;

        if (!advantageType) {
            // 有利な属性がなければ空配列
            return [];
        }

        // 敵の技の中で、有利な属性で、かつPPが残っている技を取得
        return enemyData.moves.filter(moveId => {
            const moveData = GameConfig.moves[moveId];
            if (!moveData) return false;

            return (
                moveData.type === advantageType &&
                moveData.category === "attack" &&
                this.enemyPP[enemyKey][moveId] > 0
            );
        });
    }
};
