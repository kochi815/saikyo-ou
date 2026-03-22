// game.js
// ターン制バトルシステム（大改修版）
// ポケモン風のコマンド選択式バトル

const GameManager = {

    // ==========================================
    //  ゲーム開始（キャラ選択時）
    // ==========================================
    startGame: function(characterType) {
        console.log("キャラ選択: " + characterType);
        GameState.initNewGame(characterType);
        StorageManager.save();
        TrainingManager.updateHomeDisplay();
        TransitionManager.fade("select-screen", "home-screen", "block", () => {
            SoundManager.playBGM("bgm_home");
        });
    },

    // ==========================================
    //  大会スタート（cup.jsから呼ばれる）
    // ==========================================
    startTournament: function(cupId) {
        UIManager.setBattleBackground(cupId);
        TransitionManager.battleWipe(
            ["home-screen", "cup-select-screen"],
            "battle-scene",
            () => { SoundManager.playBGM(SoundManager.getBattleBgmKey(cupId)); }
        );
        this.init(cupId);
    },

    init: function(cupId) {
        console.log("Tournament Init! Cup ID: " + cupId);
        this.setupTournament(cupId);
        GameState.roundIndex = 0;
        this.startRound();
    },

    // ==========================================
    //  敵の選出ロジック
    // ==========================================
    setupTournament: function(cupId) {
        const targetCupId = cupId || 1;
        const cupConfig = GameConfig.cups.find(c => c.id === targetCupId);
        if (!cupConfig) { console.error("Cup config not found!"); return; }
        GameState.currentCupId = targetCupId;

        const allEnemies = GameConfig.enemies;
        const tournamentEnemies = [];

        cupConfig.enemyRanks.forEach(rank => {
            const candidates = allEnemies.filter(e => e.rank === rank);
            if (candidates.length > 0) {
                tournamentEnemies.push(candidates[Math.floor(Math.random() * candidates.length)]);
            } else {
                tournamentEnemies.push(allEnemies[0]);
            }
        });

        GameState.tournamentEnemies = tournamentEnemies;
        console.log("対戦カード決定:", GameState.tournamentEnemies.map(e => e.name));
    },

    // ==========================================
    //  ラウンド（1戦）開始
    // ==========================================
    startRound: function() {
        const enemy = GameState.tournamentEnemies[GameState.roundIndex];
        GameState.currentEnemyData = enemy;
        GameState.currentStageId = GameState.roundIndex + 1;

        if (GameState.roundIndex === 0) {
            // 初戦: 全リセット（HP・PP・バフ・アイテム全て初期化）
            GameState.resetBattle();
        } else {
            // 2戦目以降: バフ/ガード/敵HPのみリセット、PP・HP は継続
            GameState.playerBuffs = { attack: 0, defense: 0, speed: 0 };
            GameState.enemyBuffs  = { attack: 0, defense: 0, speed: 0 };
            GameState.playerGuard = false;
            GameState.enemyGuard = false;

            // 敵HPセット
            GameState.maxEnemyHp = enemy.hp;
            GameState.currentEnemyHp = enemy.hp;
            GameState.currentCombo = 0;

            // PP はそのまま持ち越し（HP と同様にリソース管理が戦略要素）
        }

        // 敵のPP初期化
        BattleAI.initEnemyPP(enemy);

        // ラウンドバナー更新
        const cupConfig = GameConfig.cups.find(c => c.id === GameState.currentCupId);
        UIManager.updateRoundBanner(GameState.roundIndex, cupConfig ? cupConfig.name : "");

        // 画面表示更新
        UIManager.setupEnemyInfo();
        UIManager.updateDisplay();

        // 敵の属性表示
        const typeEmoji = GameConfig.typeEmojis[enemy.type] || "";
        const typeName = GameConfig.typeNames[enemy.type] || "";

        if (GameState.roundIndex === 0) {
            UIManager.showMessage(`${enemy.name} が 現れた！ ${typeEmoji}${typeName}タイプ`);
            setTimeout(() => { this.showCommandMenu(); }, 2000);
        } else if (GameState.roundIndex === 2) {
            this._playBossEntrance();
        } else {
            UIManager.showMessage(`第${GameState.roundIndex + 1}回戦 開始！\n${enemy.name} ${typeEmoji}${typeName}タイプ`);
            setTimeout(() => { this.showCommandMenu(); }, 2000);
        }
    },

    // ==========================================
    //  コマンドメニュー表示
    // ==========================================
    showCommandMenu: function() {
        GameState.isInputBlocked = false;
        UIManager.showCommandMenu();
    },

    // ==========================================
    //  コマンド選択：たたかう
    // ==========================================
    onFight: function() {
        if (GameState.isInputBlocked) return;
        SoundManager.playSE("select");
        UIManager.showMoveSelect();
    },

    // ==========================================
    //  コマンド選択：アイテム
    // ==========================================
    onItem: function() {
        if (GameState.isInputBlocked) return;
        SoundManager.playSE("select");
        UIManager.showItemSelect();
    },

    // ==========================================
    //  コマンド選択：にげる
    // ==========================================
    onRun: function() {
        if (GameState.isInputBlocked) return;
        SoundManager.playSE("select");
        // トーナメントでは逃げられない
        UIManager.showMessage("トーナメントからは 逃げられない！");
        setTimeout(() => { this.showCommandMenu(); }, 1500);
    },

    // ==========================================
    //  技を選択してターン実行
    // ==========================================
    onMoveSelected: function(moveId) {
        if (GameState.isInputBlocked) return;
        GameState.isInputBlocked = true;

        // PP確認
        if ((GameState.battlePP[moveId] || 0) <= 0) {
            UIManager.showMessage("PPが 足りない！");
            setTimeout(() => {
                GameState.isInputBlocked = false;
                UIManager.showMoveSelect();
            }, 1000);
            return;
        }

        SoundManager.playSE("select");
        UIManager.hideCommandArea();

        // プレイヤーの行動を決定
        const playerAction = { type: "move", moveId: moveId };

        // 敵の行動を決定
        const enemyMoveId = BattleAI.chooseAction(
            GameState.currentEnemyData,
            GameState.currentEnemyHp,
            GameState.maxEnemyHp,
            GameState.currentPlayerHp,
            GameState.maxPlayerHp,
            GameState.enemyBuffs
        );
        const enemyAction = { type: "move", moveId: enemyMoveId };

        // 行動順を決定（素早さ比較）
        this._executeTurn(playerAction, enemyAction);
    },

    // ==========================================
    //  アイテムを使用してターン実行
    // ==========================================
    onItemSelected: function(itemId) {
        if (GameState.isInputBlocked) return;
        GameState.isInputBlocked = true;

        SoundManager.playSE("select");
        UIManager.hideCommandArea();

        const playerAction = { type: "item", itemId: itemId };

        // 敵の行動
        const enemyMoveId = BattleAI.chooseAction(
            GameState.currentEnemyData,
            GameState.currentEnemyHp,
            GameState.maxEnemyHp,
            GameState.currentPlayerHp,
            GameState.maxPlayerHp,
            GameState.enemyBuffs
        );
        const enemyAction = { type: "move", moveId: enemyMoveId };

        // アイテム使用は常に先制
        this._executeActions(playerAction, enemyAction, true);
    },

    // ==========================================
    //  ターン実行（行動順決定）
    // ==========================================
    _executeTurn: function(playerAction, enemyAction) {
        // まもるは優先度+1
        const playerMove = GameConfig.moves[playerAction.moveId];
        const enemyMove = GameConfig.moves[enemyAction.moveId];

        const playerPriority = (playerMove && playerMove.priority) || 0;
        const enemyPriority = (enemyMove && enemyMove.priority) || 0;

        let playerFirst;
        if (playerPriority !== enemyPriority) {
            playerFirst = playerPriority > enemyPriority;
        } else {
            // 素早さ比較（バフ込み）
            const playerSpd = GameState.getPlayerSpeed() * (GameConfig.buffStages[String(GameState.playerBuffs.speed)] || 1);
            const enemySpd = (GameState.currentEnemyData.speed || 10) * (GameConfig.buffStages[String(GameState.enemyBuffs.speed)] || 1);

            if (playerSpd === enemySpd) {
                playerFirst = Math.random() < 0.5;
            } else {
                playerFirst = playerSpd >= enemySpd;
            }
        }

        this._executeActions(playerAction, enemyAction, playerFirst);
    },

    // ==========================================
    //  行動を順番に実行
    // ==========================================
    _executeActions: function(playerAction, enemyAction, playerFirst) {
        const first = playerFirst ? playerAction : enemyAction;
        const second = playerFirst ? enemyAction : playerAction;
        const firstIsPlayer = playerFirst;

        // ガード状態をリセット
        GameState.playerGuard = false;
        GameState.enemyGuard = false;

        // 1手目
        this._executeOneAction(first, firstIsPlayer, () => {
            // 勝敗チェック
            if (GameState.currentEnemyHp <= 0) {
                this._onEnemyDefeated();
                return;
            }
            if (GameState.currentPlayerHp <= 0) {
                this._onPlayerDefeated();
                return;
            }

            // 2手目
            this._executeOneAction(second, !firstIsPlayer, () => {
                // 勝敗チェック
                if (GameState.currentEnemyHp <= 0) {
                    this._onEnemyDefeated();
                    return;
                }
                if (GameState.currentPlayerHp <= 0) {
                    this._onPlayerDefeated();
                    return;
                }

                // ターン終了 → 次のコマンド選択
                setTimeout(() => { this.showCommandMenu(); }, 800);
            });
        });
    },

    // ==========================================
    //  1つの行動を実行
    // ==========================================
    _executeOneAction: function(action, isPlayer, callback) {
        if (action.type === "item") {
            this._executeItem(action.itemId, callback);
            return;
        }

        const moveId = action.moveId;
        const moveData = GameConfig.moves[moveId];
        if (!moveData) { callback(); return; }

        const attackerName = isPlayer
            ? GameConfig.playerTypes[GameState.selectedCharacterType].name
            : GameState.currentEnemyData.name;

        // PP消費
        if (isPlayer) {
            if (GameState.battlePP[moveId] !== undefined) GameState.battlePP[moveId]--;
        }

        // メッセージ表示
        const moveEmoji = GameConfig.typeEmojis[moveData.type] || "";
        UIManager.showMessage(`${attackerName} の\n${moveEmoji} ${moveData.name}！`);

        setTimeout(() => {
            // 技の種類で分岐
            if (moveData.category === "attack") {
                this._executeAttackMove(moveId, isPlayer, callback);
            } else if (moveData.category === "defense") {
                this._executeDefenseMove(moveId, isPlayer, callback);
            } else if (moveData.category === "buff" || moveData.category === "debuff") {
                this._executeStatMove(moveId, isPlayer, callback);
            } else if (moveData.category === "heal") {
                this._executeHealMove(moveId, isPlayer, callback);
            } else {
                callback();
            }
        }, 1000);
    },

    // ==========================================
    //  攻撃技の実行
    // ==========================================
    _executeAttackMove: function(moveId, isPlayer, callback) {
        const moveData = GameConfig.moves[moveId];

        // 命中判定
        if (!MoveManager.checkAccuracy(moveId)) {
            SoundManager.playSE("wrong");
            UIManager.showMessage("攻撃は はずれた！");
            setTimeout(callback, 1200);
            return;
        }

        // ダメージ計算
        let damage;
        if (isPlayer) {
            const atkStat = GameState.getPlayerAttack();
            const defStat = GameState.currentEnemyData.defense || 10;
            const atkType = GameConfig.playerTypes[GameState.selectedCharacterType].type;
            const defType = GameState.currentEnemyData.type || "none";
            damage = MoveManager.calculateDamage(
                moveId, atkStat, defStat,
                GameState.playerBuffs, GameState.enemyBuffs,
                atkType, defType, GameState.enemyGuard
            );
        } else {
            const atkStat = GameState.currentEnemyData.attack || 15;
            const defStat = GameState.getPlayerDefense();
            const atkType = GameState.currentEnemyData.type || "none";
            const defType = GameConfig.playerTypes[GameState.selectedCharacterType].type;
            damage = MoveManager.calculateDamage(
                moveId, atkStat, defStat,
                GameState.enemyBuffs, GameState.playerBuffs,
                atkType, defType, GameState.playerGuard
            );
        }

        // 速さボーナス: 先制した側はダメージ+10%
        const playerSpd = GameState.getPlayerSpeed() * (GameConfig.buffStages[String(GameState.playerBuffs.speed)] || 1);
        const enemySpd = (GameState.currentEnemyData.speed || 10) * (GameConfig.buffStages[String(GameState.enemyBuffs.speed)] || 1);
        if ((isPlayer && playerSpd > enemySpd) || (!isPlayer && enemySpd > playerSpd)) {
            damage = Math.round(damage * 1.1);
        }

        // ダメージ適用
        if (isPlayer) {
            GameState.currentEnemyHp = Math.max(0, GameState.currentEnemyHp - damage);
            SoundManager.playSE("attack");
            EffectManager.playPlayerAttack(damage, false);
        } else {
            GameState.currentPlayerHp = Math.max(0, GameState.currentPlayerHp - damage);
            SoundManager.playSE("damage");
            EffectManager.playEnemyDamage(damage);
        }

        // 属性相性メッセージ
        const effectiveness = MoveManager.getTypeEffectiveness(
            moveData.type,
            isPlayer ? (GameState.currentEnemyData.type || "none") : GameConfig.playerTypes[GameState.selectedCharacterType].type
        );

        UIManager.updateDisplay();
        UIManager.triggerShake();

        setTimeout(() => {
            if (effectiveness > 1) {
                UIManager.showMessage("効果は バツグンだ！");
                setTimeout(callback, 1000);
            } else if (effectiveness < 1) {
                UIManager.showMessage("効果は いまひとつ……");
                setTimeout(callback, 1000);
            } else {
                callback();
            }
        }, 600);
    },

    // ==========================================
    //  防御技の実行
    // ==========================================
    _executeDefenseMove: function(moveId, isPlayer, callback) {
        if (isPlayer) {
            GameState.playerGuard = true;
        } else {
            GameState.enemyGuard = true;
        }

        const name = isPlayer
            ? GameConfig.playerTypes[GameState.selectedCharacterType].name
            : GameState.currentEnemyData.name;
        UIManager.showMessage(`${name} は 身構えた！`);
        setTimeout(callback, 1200);
    },

    // ==========================================
    //  ステータス変化技の実行
    // ==========================================
    _executeStatMove: function(moveId, isPlayer, callback) {
        const moveData = GameConfig.moves[moveId];
        if (!moveData.effect) { callback(); return; }

        // 命中判定
        if (!MoveManager.checkAccuracy(moveId)) {
            UIManager.showMessage("しかし うまくいかなかった！");
            setTimeout(callback, 1200);
            return;
        }

        const eff = moveData.effect;
        let targetBuffs;
        let targetName;

        if (eff.target === "self") {
            targetBuffs = isPlayer ? GameState.playerBuffs : GameState.enemyBuffs;
            targetName = isPlayer
                ? GameConfig.playerTypes[GameState.selectedCharacterType].name
                : GameState.currentEnemyData.name;
        } else {
            targetBuffs = isPlayer ? GameState.enemyBuffs : GameState.playerBuffs;
            targetName = isPlayer
                ? GameState.currentEnemyData.name
                : GameConfig.playerTypes[GameState.selectedCharacterType].name;
        }

        // 段階変更
        const oldStage = targetBuffs[eff.stat] || 0;
        const newStage = Math.max(-3, Math.min(3, oldStage + eff.stages));
        targetBuffs[eff.stat] = newStage;

        const statNames = { attack: "攻撃", defense: "防御", speed: "素早さ" };
        const statName = statNames[eff.stat] || eff.stat;
        const direction = eff.stages > 0 ? "上がった" : "下がった";
        const degree = Math.abs(eff.stages) >= 2 ? "ぐーんと " : "";

        SoundManager.playSE(eff.stages > 0 ? "correct" : "wrong");
        UIManager.showMessage(`${targetName} の ${statName} が\n${degree}${direction}！`);
        setTimeout(callback, 1500);
    },

    // ==========================================
    //  回復技の実行
    // ==========================================
    _executeHealMove: function(moveId, isPlayer, callback) {
        const moveData = GameConfig.moves[moveId];
        if (!moveData.effect) { callback(); return; }

        const eff = moveData.effect;
        let maxHp, currentHp;
        if (isPlayer) {
            maxHp = GameState.maxPlayerHp;
            currentHp = GameState.currentPlayerHp;
        } else {
            maxHp = GameState.maxEnemyHp;
            currentHp = GameState.currentEnemyHp;
        }

        const healAmount = Math.floor(maxHp * (eff.percent / 100));
        const newHp = Math.min(maxHp, currentHp + healAmount);
        const actualHeal = newHp - currentHp;

        if (isPlayer) {
            GameState.currentPlayerHp = newHp;
        } else {
            GameState.currentEnemyHp = newHp;
        }

        SoundManager.playSE("correct");
        UIManager.updateDisplay();

        const name = isPlayer
            ? GameConfig.playerTypes[GameState.selectedCharacterType].name
            : GameState.currentEnemyData.name;
        UIManager.showMessage(`${name} は HPを ${actualHeal} 回復した！`);
        setTimeout(callback, 1500);
    },

    // ==========================================
    //  アイテム使用
    // ==========================================
    _executeItem: function(itemId, callback) {
        const itemData = GameConfig.shopItems[itemId];
        if (!itemData) { callback(); return; }

        // 消費
        if (GameState.battleInventory[itemId] > 0) {
            GameState.battleInventory[itemId]--;
            // 実際のインベントリも消費
            if (GameState.inventory[itemId] > 0) {
                GameState.inventory[itemId]--;
            }
        }

        const eff = itemData.effect;
        const playerName = GameConfig.playerTypes[GameState.selectedCharacterType].name;

        UIManager.showMessage(`${playerName} は\n${itemData.name} を 使った！`);

        setTimeout(() => {
            if (eff.type === "heal") {
                const newHp = Math.min(GameState.maxPlayerHp, GameState.currentPlayerHp + eff.value);
                const actualHeal = newHp - GameState.currentPlayerHp;
                GameState.currentPlayerHp = newHp;
                SoundManager.playSE("correct");
                UIManager.updateDisplay();
                UIManager.showMessage(`HPが ${actualHeal} 回復した！`);
                setTimeout(callback, 1200);
            } else if (eff.type === "fullHeal") {
                GameState.currentPlayerHp = GameState.maxPlayerHp;
                SoundManager.playSE("correct");
                UIManager.updateDisplay();
                UIManager.showMessage("HPが 全回復した！");
                setTimeout(callback, 1200);
            } else if (eff.type === "buff") {
                const oldStage = GameState.playerBuffs[eff.stat] || 0;
                GameState.playerBuffs[eff.stat] = Math.min(3, oldStage + eff.stages);
                const statNames = { attack: "攻撃", defense: "防御", speed: "素早さ" };
                SoundManager.playSE("correct");
                UIManager.showMessage(`${statNames[eff.stat]} が 上がった！`);
                setTimeout(callback, 1200);
            } else {
                callback();
            }
        }, 1000);
    },

    // ==========================================
    //  敵を倒した
    // ==========================================
    _onEnemyDefeated: function() {
        UIManager.showMessage(`${GameState.currentEnemyData.name} を 倒した！`);
        SoundManager.playSE("win");

        setTimeout(() => { this.handleWin(); }, 1500);
    },

    // ==========================================
    //  プレイヤーが倒された
    // ==========================================
    _onPlayerDefeated: function() {
        // げんきのかけら チェック
        if (GameState.hasRevive && (GameState.battleInventory["revive"] || 0) > 0) {
            GameState.battleInventory["revive"]--;
            if (GameState.inventory["revive"] > 0) GameState.inventory["revive"]--;
            GameState.hasRevive = false;

            const reviveHp = Math.floor(GameState.maxPlayerHp * 0.5);
            GameState.currentPlayerHp = reviveHp;

            SoundManager.playSE("levelup");
            UIManager.updateDisplay();
            UIManager.showMessage("元気のカケラ が 発動！\nHPが 半分 回復した！");

            setTimeout(() => { this.showCommandMenu(); }, 2000);
            return;
        }

        UIManager.showMessage("力つきた……");
        SoundManager.playSE("lose");

        setTimeout(() => { this.handleLose(); }, 1500);
    },

    // ==========================================
    //  勝利処理（カップ優勝含む）
    // ==========================================
    handleWin: function() {
        // エンドレスモード中は専用処理
        if (EndlessManager._active) {
            EndlessManager.onWin();
            return;
        }

        // 図鑑に記録
        if (GameState.currentEnemyData) {
            ZukanManager.registerDefeat(GameState.currentEnemyData);
        }

        // 経験値
        const leveledUp = GameState.addExp(GameConfig.xpWin);
        UIManager.updateDisplay();
        StorageManager.save();

        if (GameState.roundIndex < 2) {
            // ラウンド突破
            const roundNum = GameState.roundIndex + 1;
            SoundManager.playSE("win");

            const showRoundWin = () => {
                ModalManager.showRoundWin(roundNum, () => {
                    GameState.roundIndex++;
                    this.startRound();
                });
            };

            if (leveledUp) {
                setTimeout(() => {
                    SoundManager.playSE("levelup");
                    EffectManager.playLevelUp();
                    ModalManager.showLevelUp(GameState.playerLevel, showRoundWin);
                }, 500);
            } else {
                setTimeout(showRoundWin, 1000);
            }
        } else {
            // 優勝！
            SoundManager.fadeOutBGM(600);

            const cupId = GameState.currentCupId;
            const cupConfig = GameConfig.cups.find(c => c.id === cupId);
            const rewardExp = cupConfig ? cupConfig.rewardExp : 0;
            const rewardGold = cupConfig ? (cupConfig.rewardGold || 0) : 0;
            const cupName = cupConfig ? cupConfig.name : "大会";

            if (!GameState.clearedCupIds.includes(cupId)) {
                GameState.clearedCupIds.push(cupId);
            }

            // ゴールド報酬
            if (rewardGold > 0) {
                GameState.addGold(rewardGold);
            }

            AchievementManager.recordWin();
            StorageManager.save();

            const showVictoryScreen = () => {
                const dragonSrc = ResultManager.getCurrentDragonSrc();

                TransitionManager.fade("battle-scene", null, null, () => {
                    SoundManager.playSE("trophy");
                    SoundManager.playBGM("bgm_result");

                    ResultManager.showVictory(cupName, rewardExp, dragonSrc, () => {
                        GameState.addExp(rewardExp);
                        StorageManager.save();

                        const story = GameConfig.cupStories && GameConfig.cupStories[cupId];
                        const goHome = () => {
                            TrainingManager.updateHomeDisplay();
                            TransitionManager.fade("victory-screen", "home-screen", "block", () => {
                                SoundManager.playBGM("bgm_home");
                                AchievementManager.checkAndNotify();
                            });
                        };

                        if (story && story.clear) {
                            ModalManager.show({
                                icon: "✨", title: "物語は 続く……",
                                message: story.clear, type: "success",
                                buttons: [{ text: "次へ！", class: "primary", callback: goHome }]
                            });
                        } else {
                            goHome();
                        }
                    });
                }, "fade-white");
            };

            if (leveledUp) {
                setTimeout(() => {
                    SoundManager.playSE("levelup");
                    EffectManager.playLevelUp();
                    ModalManager.showLevelUp(GameState.playerLevel, showVictoryScreen);
                }, 500);
            } else {
                setTimeout(showVictoryScreen, 1000);
            }
        }
    },

    // ==========================================
    //  ボス戦 特別登場演出
    // ==========================================
    _playBossEntrance: function() {
        const enemy = GameState.currentEnemyData;
        const typeEmoji = GameConfig.typeEmojis[enemy.type] || "";

        UIManager.showMessage("── 決勝戦 ──");

        const enemyImg = document.getElementById("enemy-img");
        if (enemyImg) {
            enemyImg.style.opacity = "0";
            enemyImg.style.transform = "scale(1.5)";
        }

        setTimeout(() => {
            UIManager.showMessage(`⚡ ボス 登場！ ⚡\n${enemy.name} ${typeEmoji}`);
            SoundManager.playSE("burst");

            if (enemyImg) {
                enemyImg.style.transition = "opacity 0.5s, transform 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)";
                enemyImg.style.opacity = "1";
                enemyImg.style.transform = "scale(1)";
            }

            UIManager.triggerShake();

            if (GameState.currentCupId >= 4) {
                SoundManager.playBGM("bgm_battle_final");
            }
        }, 1000);

        setTimeout(() => {
            if (enemyImg) enemyImg.style.transition = "";
            this.showCommandMenu();
        }, 2500);
    },

    // ==========================================
    //  敗北処理
    // ==========================================
    handleLose: function() {
        if (EndlessManager._active) {
            EndlessManager.onLose();
            return;
        }

        SoundManager.playSE("lose");
        SoundManager.fadeOutBGM(1000);
        GameState.addExp(GameConfig.xpLose);
        StorageManager.save();

        setTimeout(() => {
            const dragonSrc = ResultManager.getCurrentDragonSrc();

            const goHome = () => {
                TrainingManager.updateHomeDisplay();
                TransitionManager.fade("defeat-screen", "home-screen", "block", () => {
                    SoundManager.playBGM("bgm_home");
                });
            };

            const goTraining = () => {
                TrainingManager.updateHomeDisplay();
                TransitionManager.fade("defeat-screen", "home-screen", "block", () => {
                    SoundManager.playBGM("bgm_home");
                    setTimeout(() => { TrainingManager.openMenu(); }, 200);
                });
            };

            TransitionManager.fade("battle-scene", null, null, () => {
                ResultManager.showDefeat(dragonSrc, goTraining, goHome);
            });
        }, 1000);
    }
};
