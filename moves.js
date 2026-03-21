// moves.js
// 技・わざ管理システム

const MoveManager = {
    // ==========================================
    //  1. 技情報ヘルパー
    // ==========================================

    /**
     * 技IDから技データを取得
     * @param {string} moveId - 技ID
     * @returns {object|null} 技データ、なければnull
     */
    getMoveData: function(moveId) {
        return GameConfig.moves[moveId] || null;
    },

    /**
     * 技IDから日本語名を取得
     * @param {string} moveId - 技ID
     * @returns {string} 技名、なければ空文字列
     */
    getMoveName: function(moveId) {
        const moveData = this.getMoveData(moveId);
        return moveData ? moveData.name : "";
    },

    /**
     * 技IDから属性絵文字を取得
     * @param {string} moveId - 技ID
     * @returns {string} 属性絵文字、なければ空文字列
     */
    getMoveTypeEmoji: function(moveId) {
        const moveData = this.getMoveData(moveId);
        if (!moveData) return "";
        return GameConfig.typeEmojis[moveData.type] || "";
    },

    /**
     * 技IDから説明文を取得
     * @param {string} moveId - 技ID
     * @returns {string} 説明文、なければ空文字列
     */
    getMoveDescription: function(moveId) {
        const moveData = this.getMoveData(moveId);
        return moveData ? moveData.description : "";
    },

    // ==========================================
    //  2. 習得システム
    // ==========================================

    /**
     * プレイヤーが現在習得可能な技の一覧を取得
     * キャラクタータイプと現在のレベルから判定
     * @returns {array} 習得可能な技IDの配列
     */
    getLearnableMoves: function() {
        const charConfig = GameConfig.playerTypes[GameState.selectedCharacterType];
        if (!charConfig || !charConfig.learnSet) return [];

        const learnSet = charConfig.learnSet;
        const learnableMoves = [];

        for (let lvl in learnSet) {
            if (GameState.playerLevel >= parseInt(lvl)) {
                const moves = learnSet[lvl];
                moves.forEach(moveId => {
                    if (!learnableMoves.includes(moveId)) {
                        learnableMoves.push(moveId);
                    }
                });
            }
        }

        return learnableMoves;
    },

    /**
     * 指定したレベルで新しく習得すべき技を取得
     * @param {number} level - レベル
     * @returns {array} その時点で習得する技IDの配列
     */
    getNewMovesForLevel: function(level) {
        const charConfig = GameConfig.playerTypes[GameState.selectedCharacterType];
        if (!charConfig || !charConfig.learnSet) return [];

        const learnSet = charConfig.learnSet;
        return learnSet[level] || [];
    },

    // ==========================================
    //  3. 装備システム
    // ==========================================

    /**
     * 現在装備中の技を取得
     * @returns {array} 装備中の技IDの配列
     */
    getEquippedMoves: function() {
        return GameState.equippedMoves;
    },

    /**
     * 習得済みの全ての技を取得
     * @returns {array} 習得済み技IDの配列
     */
    getAllLearnedMoves: function() {
        return GameState.learnedMoves;
    },

    /**
     * 技を装備スロットに追加
     * 最大4つまで装備可能
     * @param {string} moveId - 技ID
     * @returns {boolean} 成功時true、失敗時false
     */
    equipMove: function(moveId) {
        // 既に習得済みか確認
        if (!GameState.learnedMoves.includes(moveId) && !GameState.shopPurchasedMoves.includes(moveId)) {
            console.log("未習得の技です: " + moveId);
            return false;
        }

        // 既に装備済みか確認
        if (GameState.equippedMoves.includes(moveId)) {
            console.log("既に装備済みです: " + moveId);
            return false;
        }

        // 装備枠に余裕があるか確認
        if (GameState.equippedMoves.length >= 4) {
            console.log("装備枠が満杯です");
            return false;
        }

        GameState.equippedMoves.push(moveId);
        console.log("技を装備しました: " + this.getMoveName(moveId));
        return true;
    },

    /**
     * 技を装備スロットから外す
     * @param {string} moveId - 技ID
     * @returns {boolean} 成功時true、失敗時false
     */
    unequipMove: function(moveId) {
        const index = GameState.equippedMoves.indexOf(moveId);
        if (index === -1) {
            console.log("装備されていない技です: " + moveId);
            return false;
        }

        GameState.equippedMoves.splice(index, 1);
        console.log("技を外しました: " + this.getMoveName(moveId));
        return true;
    },

    /**
     * 装備している技を別の習得済み技と交換
     * @param {string} oldMoveId - 外す技ID
     * @param {string} newMoveId - 装備する技ID
     * @returns {boolean} 成功時true、失敗時false
     */
    swapEquippedMove: function(oldMoveId, newMoveId) {
        // oldMoveIdが装備されているか確認
        if (!GameState.equippedMoves.includes(oldMoveId)) {
            console.log("装備されていない技です: " + oldMoveId);
            return false;
        }

        // newMoveIdが習得済みか確認
        if (!GameState.learnedMoves.includes(newMoveId) && !GameState.shopPurchasedMoves.includes(newMoveId)) {
            console.log("未習得の技です: " + newMoveId);
            return false;
        }

        // newMoveIdが既に装備済みか確認
        if (GameState.equippedMoves.includes(newMoveId)) {
            console.log("既に装備済みです: " + newMoveId);
            return false;
        }

        const index = GameState.equippedMoves.indexOf(oldMoveId);
        GameState.equippedMoves[index] = newMoveId;
        console.log("技を交換しました: " + this.getMoveName(oldMoveId) + " → " + this.getMoveName(newMoveId));
        return true;
    },

    /**
     * 装備できる枠がまだあるか確認
     * @returns {boolean} 装備可能な場合true
     */
    canEquipMore: function() {
        return GameState.equippedMoves.length < 4;
    },

    // ==========================================
    //  4. ショップ技
    // ==========================================

    /**
     * ショップで購入可能な技の一覧を取得
     * 価格が設定されており、未購入の技のみ
     * @returns {array} {moveId, moveData}のオブジェクトの配列
     */
    getShopMoves: function() {
        const shopMoves = [];

        for (let moveId in GameConfig.moves) {
            const moveData = GameConfig.moves[moveId];

            // 価格が設定されているか確認
            if (!moveData.price) continue;

            // 既に購入済みか確認
            if (GameState.shopPurchasedMoves.includes(moveId)) continue;

            shopMoves.push({
                moveId: moveId,
                moveData: moveData
            });
        }

        return shopMoves;
    },

    /**
     * ショップから技を購入
     * ゴールド消費、learnedMovesとshopPurchasedMovesに追加
     * @param {string} moveId - 技ID
     * @returns {object} {success, message}を返す
     */
    purchaseMove: function(moveId) {
        const moveData = this.getMoveData(moveId);

        // 技が存在するか確認
        if (!moveData) {
            return { success: false, message: "技が見つかりません" };
        }

        // 価格が設定されているか確認
        if (!moveData.price) {
            return { success: false, message: "この技は購入できません" };
        }

        // 既に購入済みか確認
        if (GameState.shopPurchasedMoves.includes(moveId)) {
            return { success: false, message: "既に購入済みです" };
        }

        // ゴールドが足りるか確認
        if (GameState.gold < moveData.price) {
            return { success: false, message: "ゴールドが足りません" };
        }

        // ゴールド消費
        GameState.spendGold(moveData.price);

        // 技を追加
        if (!GameState.learnedMoves.includes(moveId)) {
            GameState.learnedMoves.push(moveId);
        }
        GameState.shopPurchasedMoves.push(moveId);

        console.log("技を購入しました: " + this.getMoveName(moveId) + " (" + moveData.price + "G)");
        return { success: true, message: this.getMoveName(moveId) + "を購入しました！" };
    },

    // ==========================================
    //  5. バトルヘルパー
    // ==========================================

    /**
     * ダメージを計算
     * 計算式: (威力 × 攻撃力補正 / 防御力補正) × 属性相性 × 乱数(0.85〜1.00)
     * ガード時はダメージを半減
     *
     * @param {string} moveId - 技ID
     * @param {number} attackerAttack - 攻撃者の攻撃力
     * @param {number} defenderDefense - 防御者の防御力
     * @param {object} attackerBuffs - 攻撃者のバフ（{attack, defense, speed}）
     * @param {object} defenderBuffs - 防御者のバフ（{attack, defense, speed}）
     * @param {string} attackerType - 攻撃者の属性
     * @param {string} defenderType - 防御者の属性
     * @param {boolean} isGuarding - 防御者がガード中か
     * @returns {number} ダメージ値（小数点以下は四捨五入）
     */
    calculateDamage: function(moveId, attackerAttack, defenderDefense, attackerBuffs, defenderBuffs, attackerType, defenderType, isGuarding) {
        const moveData = this.getMoveData(moveId);
        if (!moveData || moveData.category !== "attack") {
            // 攻撃系の技でない場合はダメージ0
            return 0;
        }

        const power = moveData.power || 0;
        if (power === 0) return 0;

        // 攻撃力補正 = 攻撃力 × バフ倍率
        const attackMultiplier = GameConfig.buffStages[attackerBuffs.attack] || 1.0;
        const correctedAttack = attackerAttack * attackMultiplier;

        // 防御力補正 = 防御力 × バフ倍率
        const defenseMultiplier = GameConfig.buffStages[defenderBuffs.defense] || 1.0;
        const correctedDefense = defenderDefense * defenseMultiplier;

        // 基本ダメージ = (威力 × 攻撃力補正 / 防御力補正)
        let baseDamage = (power * correctedAttack) / correctedDefense;

        // 属性相性倍率
        const typeMultiplier = this.getTypeEffectiveness(moveData.type, defenderType);
        baseDamage *= typeMultiplier;

        // 乱数(0.85〜1.00)を適用
        const random = GameConfig.damageRandomMin + Math.random() * (GameConfig.damageRandomMax - GameConfig.damageRandomMin);
        let damage = baseDamage * random;

        // ガード中の場合は半減
        if (isGuarding) {
            damage *= 0.5;
        }

        // 四捨五入して整数化（最低1ダメージ）
        damage = Math.max(1, Math.round(damage));

        return damage;
    },

    /**
     * 技の命中判定
     * @param {string} moveId - 技ID
     * @returns {boolean} 命中時true、外れた場合false
     */
    checkAccuracy: function(moveId) {
        const moveData = this.getMoveData(moveId);
        if (!moveData) return false;

        const accuracy = moveData.accuracy || 100;
        const roll = Math.random() * 100;
        return roll < accuracy;
    },

    /**
     * 属性相性の倍率を取得
     * @param {string} moveType - 技の属性
     * @param {string} defenderType - 防御者の属性
     * @returns {number} 倍率（1.5、0.75、または1.0）
     */
    getTypeEffectiveness: function(moveType, defenderType) {
        // 属性相性テーブルを参照
        const typeChart = GameConfig.typeChart;

        // moveTypeの相性情報を取得
        const moveTypeData = typeChart[moveType];
        if (!moveTypeData) return 1.0;

        // defenderTypeに対して有利か不利か確認
        if (moveTypeData.strong === defenderType) {
            // 有利属性（こうかばつぐん）
            return GameConfig.advantageMultiplier;
        }
        if (moveTypeData.weak === defenderType) {
            // 不利属性（いまひとつ）
            return GameConfig.disadvantageMultiplier;
        }

        // 通常ダメージ
        return 1.0;
    },

    // ==========================================
    //  6. 装備画面表示
    // ==========================================

    /**
     * わざへんせい画面を開く
     */
    openEquipScreen: function() {
        TransitionManager.fade("home-screen", "move-equip-screen", "block", () => {
            this.renderEquipScreen();
        });
    },

    /**
     * わざへんせい画面を閉じる
     */
    closeEquipScreen: function() {
        TrainingManager.updateHomeDisplay();
        TransitionManager.fade("move-equip-screen", "home-screen", "block");
    },

    /**
     * わざへんせい画面を描画
     */
    renderEquipScreen: function() {
        // Render equipped moves in equip-slots
        const slotsContainer = document.getElementById('equip-slots');
        if (!slotsContainer) return;

        slotsContainer.innerHTML = '';
        for (let i = 0; i < 4; i++) {
            const moveId = GameState.equippedMoves[i];
            const slot = document.createElement('div');

            if (moveId) {
                const moveData = GameConfig.moves[moveId];
                slot.className = 'equip-slot';
                slot.style.borderStyle = 'solid';
                slot.style.borderColor = '#ffcc00';
                slot.innerHTML = `
                    <div style="font-weight:bold; color:#fff;">${moveData ? moveData.name : moveId}</div>
                    <div style="font-size:12px; color:#aaa;">${moveData ? moveData.description : ''}</div>
                    <button onclick="MoveManager.unequipMoveAtSlot(${i})" style="margin-top:4px; padding:4px 8px; background:#e74c3c; color:white; border:none; border-radius:4px; cursor:pointer; font-size:12px;">はずす</button>
                `;
            } else {
                slot.className = 'equip-slot empty';
                slot.innerHTML = `<div style="color:#888;">— スロット ${i + 1}</div>`;
            }
            slotsContainer.appendChild(slot);
        }

        // Render learned moves list
        const moveList = document.getElementById('move-select-list');
        if (!moveList) return;

        moveList.innerHTML = '';
        GameState.learnedMoves.forEach(moveId => {
            const moveData = GameConfig.moves[moveId];
            if (!moveData) return;

            const isEquipped = GameState.equippedMoves.includes(moveId);
            const item = document.createElement('div');
            item.className = 'move-select-item';
            if (isEquipped) item.style.opacity = '0.5';

            const typeEmoji = GameConfig.typeEmojis ? GameConfig.typeEmojis[moveData.type] || '⚪' : '⚪';
            item.innerHTML = `
                <div style="font-weight:bold; color:#fff;">${typeEmoji} ${moveData.name} ${isEquipped ? '<span style="color:#ffcc00; font-size:11px;">（そうびちゅう）</span>' : ''}</div>
                <div style="font-size:12px; color:#aaa;">${moveData.description || ''} | PP: ${moveData.pp}</div>
            `;

            if (!isEquipped && GameState.equippedMoves.length < 4) {
                item.style.cursor = 'pointer';
                item.onclick = () => {
                    this.equipMoveFromList(moveId);
                };
            }

            moveList.appendChild(item);
        });
    },

    /**
     * リストから技を装備
     */
    equipMoveFromList: function(moveId) {
        if (GameState.equippedMoves.length >= 4) return;
        if (GameState.equippedMoves.includes(moveId)) return;
        GameState.equippedMoves.push(moveId);
        StorageManager.save();
        this.renderEquipScreen();
    },

    /**
     * スロットから技を外す
     */
    unequipMoveAtSlot: function(index) {
        GameState.equippedMoves.splice(index, 1);
        StorageManager.save();
        this.renderEquipScreen();
    }
};
