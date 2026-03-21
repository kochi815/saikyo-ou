// state.js
// ゲームの状態を管理するファイル（大改修版）

const GameState = {
    // ==========================================
    //  1. セーブデータ（永続）
    // ==========================================
    playerLevel: 1,
    currentExp: 0,
    selectedCharacterType: "blue",

    // 特訓で上がったステータス
    trainingStats: {
        attack: 0,
        speed: 0,
        defense: 0,  // ★新規追加
        hp: 0
    },

    // 通貨
    gold: 0,

    // 習得済みの技（技IDの配列）
    learnedMoves: [],
    // バトルに装備中の技（最大4つ）
    equippedMoves: [],

    // 所持アイテム（アイテムID → 個数）
    inventory: {},

    // ショップで購入した技（技IDの配列）
    shopPurchasedMoves: [],

    // 大会クリア履歴
    clearedCupIds: [],
    currentCupId: 1,

    // 図鑑：撃破した敵のインデックスリスト
    defeatedEnemyIndices: [],

    // 実績データ
    achievementData: {
        totalWins: 0,
        maxCombo: 0,
        trainingCount: 0,
        unlockedIds: [],
        endlessBest: 0
    },

    // デイリーミッション
    dailyMissions: {
        date: "",
        missions: []
    },

    // タイムアタック最高記録
    timeAttackBest: 0,

    // ==========================================
    //  2. バトル中のデータ（一時的）
    // ==========================================
    maxPlayerHp: 0,
    maxEnemyHp: 0,
    currentPlayerHp: 0,
    currentEnemyHp: 0,
    currentCombo: 0,

    // バトル中のバフ・デバフ段階
    playerBuffs: { attack: 0, defense: 0, speed: 0 },
    enemyBuffs:  { attack: 0, defense: 0, speed: 0 },

    // まもる状態
    playerGuard: false,
    enemyGuard: false,

    // げんきのかけら（自動復活）フラグ
    hasRevive: false,

    // バトル中の技PP残量（技ID → 残りPP）
    battlePP: {},

    // バトル中のアイテム（一時コピー）
    battleInventory: {},

    tournamentEnemies: [],
    roundIndex: 0,
    currentStageId: 1,
    currentEnemyData: null,

    // 旧互換（とっくん・しごとモードで使用）
    currentQuestion: {
        text: "",
        answer: 0,
        options: []
    },

    isInputBlocked: false,

    // ==========================================
    //  3. ステータス計算
    // ==========================================

    // プレイヤーの実効攻撃力
    getPlayerAttack: function() {
        const charConfig = GameConfig.playerTypes[this.selectedCharacterType];
        const bias = charConfig ? charConfig.statBias.attack : 0;
        return GameConfig.baseAttack
            + (this.playerLevel * GameConfig.attackPerLevel)
            + this.trainingStats.attack
            + bias;
    },

    // プレイヤーの実効防御力
    getPlayerDefense: function() {
        const charConfig = GameConfig.playerTypes[this.selectedCharacterType];
        const bias = charConfig ? charConfig.statBias.defense : 0;
        return GameConfig.baseDefense
            + Math.floor(this.playerLevel * GameConfig.defensePerLevel)
            + this.trainingStats.defense
            + bias;
    },

    // プレイヤーの実効素早さ
    getPlayerSpeed: function() {
        const charConfig = GameConfig.playerTypes[this.selectedCharacterType];
        const bias = charConfig ? charConfig.statBias.speed : 0;
        return GameConfig.baseSpeed
            + (this.playerLevel * GameConfig.speedPerLevel)
            + this.trainingStats.speed
            + bias;
    },

    // プレイヤーの最大HP
    getPlayerMaxHp: function() {
        const charConfig = GameConfig.playerTypes[this.selectedCharacterType];
        const bias = charConfig ? charConfig.statBias.hp : 0;
        return GameConfig.playerStartHp
            + (this.playerLevel - 1) * GameConfig.hpBonusPerLevel
            + (this.trainingStats.hp * 2)
            + bias;
    },

    // ==========================================
    //  4. バトル初期化
    // ==========================================
    resetBattle: function() {
        this.maxPlayerHp = this.getPlayerMaxHp();
        this.currentPlayerHp = this.maxPlayerHp;

        if (this.currentEnemyData) {
            this.maxEnemyHp = this.currentEnemyData.hp;
        } else {
            this.maxEnemyHp = 50;
        }
        this.currentEnemyHp = this.maxEnemyHp;

        this.currentCombo = 0;
        this.isInputBlocked = false;

        // バフ・デバフリセット
        this.playerBuffs = { attack: 0, defense: 0, speed: 0 };
        this.enemyBuffs  = { attack: 0, defense: 0, speed: 0 };
        this.playerGuard = false;
        this.enemyGuard = false;

        // 技のPPを初期化
        this.battlePP = {};
        this.equippedMoves.forEach(moveId => {
            const moveData = GameConfig.moves[moveId];
            if (moveData) {
                this.battlePP[moveId] = moveData.pp;
            }
        });

        // バトル用アイテムのコピー（バトル中の消費はここから）
        this.battleInventory = JSON.parse(JSON.stringify(this.inventory));

        // げんきのかけら確認
        this.hasRevive = (this.battleInventory["revive"] || 0) > 0;

        console.log(`バトルセットアップ完了: Round ${this.roundIndex + 1}`);
        console.log(`HP: ${this.maxPlayerHp}, ATK: ${this.getPlayerAttack()}, DEF: ${this.getPlayerDefense()}, SPD: ${this.getPlayerSpeed()}`);
    },

    // ==========================================
    //  5. 経験値とレベルアップ
    // ==========================================
    addExp: function(amount) {
        this.currentExp += amount;
        let leveledUp = false;

        while (this.currentExp >= GameConfig.xpToLevelUp) {
            this.currentExp -= GameConfig.xpToLevelUp;
            this.playerLevel++;
            leveledUp = true;
            console.log("レベルアップ！ Lv." + this.playerLevel);

            // レベルアップ時に技を習得
            this._checkLearnMoves();
        }
        return leveledUp;
    },

    // レベルに応じた技の習得チェック
    _checkLearnMoves: function() {
        const charConfig = GameConfig.playerTypes[this.selectedCharacterType];
        if (!charConfig || !charConfig.learnSet) return;

        const learnSet = charConfig.learnSet;
        for (let lvl in learnSet) {
            if (this.playerLevel >= parseInt(lvl)) {
                const movesToLearn = learnSet[lvl];
                movesToLearn.forEach(moveId => {
                    if (!this.learnedMoves.includes(moveId)) {
                        this.learnedMoves.push(moveId);
                        console.log("技を習得: " + moveId);

                        // 装備枠が空いていれば自動装備
                        if (this.equippedMoves.length < 4) {
                            this.equippedMoves.push(moveId);
                        }
                    }
                });
            }
        }
    },

    // ==========================================
    //  6. ゴールド管理
    // ==========================================
    addGold: function(amount) {
        this.gold += amount;
        console.log("ゴールド獲得: +" + amount + "G (合計: " + this.gold + "G)");
    },

    spendGold: function(amount) {
        if (this.gold >= amount) {
            this.gold -= amount;
            return true;
        }
        return false;
    },

    // ==========================================
    //  7. 初期化（新規ゲーム開始時）
    // ==========================================
    initNewGame: function(characterType) {
        this.playerLevel = 1;
        this.currentExp = 0;
        this.selectedCharacterType = characterType;
        this.trainingStats = { attack: 0, speed: 0, defense: 0, hp: 0 };
        this.gold = 0;
        this.learnedMoves = [];
        this.equippedMoves = [];
        this.inventory = {};
        this.shopPurchasedMoves = [];
        this.clearedCupIds = [];
        this.defeatedEnemyIndices = [];
        this.achievementData = {
            totalWins: 0, maxCombo: 0, trainingCount: 0,
            unlockedIds: [], endlessBest: 0
        };
        this.dailyMissions = { date: "", missions: [] };
        this.timeAttackBest = 0;

        // 初期技を習得
        this._checkLearnMoves();
    }
};
