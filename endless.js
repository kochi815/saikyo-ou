// endless.js
// エンドレスモード — 全カップクリア後に解放
// ランダムな敵と連続で戦い、何連勝できるかに挑戦

const EndlessManager = {

    _active: false,
    _streak: 0,
    _bestStreak: 0,

    // エンドレスモードが解放済みか
    isUnlocked: function() {
        // 最強王トーナメント（カップ5）クリアで解放
        return GameState.clearedCupIds.includes(5);
    },

    // エンドレスモード開始
    start: function() {
        SoundManager.playSE("select");

        this._active = true;
        this._streak = 0;
        this._bestStreak = GameState.achievementData ? (GameState.achievementData.endlessBest || 0) : 0;

        // ランダムな敵を選出
        this._setupNextEnemy();

        // バトル画面の背景をエンドレス仕様に
        const scene = document.getElementById("battle-scene");
        if (scene) {
            scene.style.background = "linear-gradient(180deg, #1a0020 0%, #2d0040 40%, #400060 100%)";
        }

        // バトルワイプで突入
        TransitionManager.battleWipe(
            ["home-screen", "cup-select-screen"],
            "battle-scene",
            () => {
                SoundManager.playBGM("bgm_battle_final");
            }
        );

        // バトル開始
        GameState.roundIndex = 0;
        GameState.currentStageId = 3; // 高難度
        GameState.currentCupId = 5;   // 最強王杯の問題設定を流用
        GameState.resetBattle();
        BattleAI.initEnemyPP(GameState.currentEnemyData);

        UIManager.setupEnemyInfo();
        UIManager.updateDisplay();
        UIManager.updateRoundBanner(0, "エンドレス");
        UIManager.showMessage(`エンドレスモード スタート！`);

        setTimeout(() => {
            GameManager.showCommandMenu();
        }, 1500);
    },

    // 次の敵をセットアップ
    _setupNextEnemy: function() {
        const allEnemies = GameConfig.enemies;
        // ストリーク数に応じてランクを上げる
        let maxRank = 1;
        if (this._streak >= 15) maxRank = 5;
        else if (this._streak >= 10) maxRank = 4;
        else if (this._streak >= 6) maxRank = 3;
        else if (this._streak >= 3) maxRank = 2;

        const candidates = allEnemies.filter(e => e.rank <= maxRank);
        const enemy = candidates[Math.floor(Math.random() * candidates.length)];

        // ストリーク数に応じてHP補正
        const hpMultiplier = 1 + (this._streak * 0.1);
        const boostedEnemy = Object.assign({}, enemy, {
            hp: Math.floor(enemy.hp * hpMultiplier),
            _originalRef: enemy  // 図鑑登録用に元の敵オブジェクト参照を保持
        });

        GameState.tournamentEnemies = [boostedEnemy];
        GameState.currentEnemyData = boostedEnemy;
    },

    // 勝利処理（GameManagerから呼ばれる）
    onWin: function() {
        this._streak++;

        // ベスト更新
        if (this._streak > this._bestStreak) {
            this._bestStreak = this._streak;
            if (!GameState.achievementData) GameState.achievementData = {};
            GameState.achievementData.endlessBest = this._bestStreak;
            StorageManager.save();
        }

        // 図鑑に記録
        if (GameState.currentEnemyData) {
            ZukanManager.registerDefeat(GameState.currentEnemyData);
        }

        // EXP付与（HP回復は次の敵セットアップ時にまとめて行う）
        GameState.addExp(GameConfig.xpWin);

        // 20連勝報酬：「りゅうのはどう」習得
        let rewardMessage = "";
        if (this._streak === 20 && !GameState.learnedMoves.includes("dragon_pulse")) {
            GameState.learnedMoves.push("dragon_pulse");
            // 装備枠が空いていれば自動装備（エンドレス中でもすぐ使える）
            if (GameState.equippedMoves.length < 4) {
                GameState.equippedMoves.push("dragon_pulse");
                // 現在のバトルPPにも追加して即使用可能にする
                const moveData = GameConfig.moves["dragon_pulse"];
                if (moveData) {
                    GameState.battlePP["dragon_pulse"] = moveData.pp;
                }
                rewardMessage = "\n🎁 新しい技「りゅうのはどう」を覚えた！\n自動で装備したぞ！";
            } else {
                rewardMessage = "\n🎁 新しい技「りゅうのはどう」を覚えた！\nわざへんせいで 装備しよう！";
            }
            StorageManager.save();
        }

        SoundManager.playSE("win");

        // 勝利モーダル
        ModalManager.show({
            icon: this._streak === 20 && rewardMessage ? "🎁" : "🔥",
            title: `${this._streak}連勝！`,
            message: `ベスト: ${this._bestStreak}連勝\n次の敵が来るぞ！${rewardMessage}`,
            type: "success",
            buttons: [{
                text: "つぎへ！",
                class: "primary",
                callback: () => {
                    // 次の敵セットアップ
                    this._setupNextEnemy();

                    // HP・PPを保存してからバフ/ガードのみリセット（PPはリソース管理）
                    const savedHp = GameState.currentPlayerHp;
                    const savedPP = Object.assign({}, GameState.battlePP);

                    GameState.resetBattle();

                    // HP: 前戦から持ち越し + 少量回復
                    GameState.currentPlayerHp = Math.min(savedHp + 10, GameState.maxPlayerHp);
                    // PP: 前戦から持ち越し（大技の乱用を防ぎ、技選択に戦略性を持たせる）
                    GameState.battlePP = savedPP;

                    // 敵HPとPP初期化
                    GameState.currentEnemyHp = GameState.currentEnemyData.hp;
                    GameState.maxEnemyHp = GameState.currentEnemyData.hp;
                    GameState.currentCombo = 0;
                    BattleAI.initEnemyPP(GameState.currentEnemyData);

                    UIManager.setupEnemyInfo();
                    UIManager.updateDisplay();
                    UIManager.updateRoundBanner(0, `エンドレス ${this._streak}れんしょう`);
                    UIManager.showMessage(`第${this._streak + 1}戦！`);

                    setTimeout(() => {
                        GameManager.showCommandMenu();
                    }, 1000);
                }
            }]
        });
    },

    // 敗北処理
    onLose: function() {
        SoundManager.playSE("lose");
        SoundManager.fadeOutBGM(1000);

        this._active = false;

        setTimeout(() => {
            ModalManager.show({
                icon: "🏁",
                title: "ゲームオーバー",
                message: `記録: <span class="modal-highlight">${this._streak}連勝</span>\nベスト: <span class="modal-highlight">${this._bestStreak}連勝</span>`,
                type: "danger",
                buttons: [{
                    text: "ホームに戻る",
                    class: "primary",
                    callback: () => {
                        TrainingManager.updateHomeDisplay();
                        TransitionManager.fade("battle-scene", "home-screen", "block", () => {
                            SoundManager.playBGM("bgm_home");
                            AchievementManager.checkAndNotify();
                        });
                    }
                }]
            });
        }, 1000);
    }
};
