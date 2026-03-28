// 画面の表示（見た目）を更新するファイル

const UIManager = {

    commentaryList: {
        start:  ["さあ 世紀の対決が始まるぞ！", "最強の座をかけたバトルだ！", "レディ…… ゴー！！"],
        attack: ["おっと！ 強烈な一撃だ！", "ナイス攻撃！ うまいぞ！", "ドラゴンの体勢がくずれた！", "その調子で押し切れーっ！"],
        damage: ["痛い！ 強烈な反撃だ！", "あぶない！ ふんばれ！", "まだだ！ まだ終わっていないぞ！"],
        pinch:  ["もう後がない！ 逆転できるか！？", "絶体絶命のピンチだーっ！"],
        win:    ["勝負ありーーーっ！", "勝者、決定ッ！！", "見たか！ これが新しい最強王だ！"],
        lose:   ["残念！ ここで力つきた……", "勝負あり！ 次は勝てるはずだ！"]
    },

    // ==========================================
    //  メイン更新
    // ==========================================
    updateDisplay: function() {
        this.updateHpBar('player', GameState.currentPlayerHp, GameState.maxPlayerHp);
        this.updateHpBar('enemy', GameState.currentEnemyHp, GameState.maxEnemyHp);

        // バトル中（コマンドメニューが存在する画面）は問題テキストを上書きしない
        // （showMessage() でメッセージを制御しているため）
        const commandMenu = document.getElementById('command-menu');
        const isBattle = commandMenu && commandMenu.closest('#battle-scene');
        if (!isBattle) {
            const qText = document.getElementById('question-text');
            if (qText && GameState.currentQuestion.text) {
                qText.textContent = GameState.currentQuestion.text;
            }
        }

        this.updateStatusDisplay(GameState.currentExp, GameConfig.xpToLevelUp, GameState.playerLevel);
        this.updateDragonImage(GameState.playerLevel);
    },

    // ==========================================
    //  敵の画像・名前をセット
    // ==========================================
    setupEnemyInfo: function() {
        const enemyData = GameState.currentEnemyData;
        if (!enemyData) return;

        const img = document.getElementById("enemy-img");
        const nameLabel = document.getElementById("enemy-name");

        if (img) img.src = enemyData.src;
        if (nameLabel) nameLabel.textContent = enemyData.name;
    },

    // ==========================================
    //  回答ボタンのセットアップ
    // ==========================================
    setupButtons: function() {
        const q = GameState.currentQuestion;
        const options = q.options;
        const labels = q.optionLabels || null; // 比較問題用ラベル

        for (let i = 0; i < 3; i++) {
            const btn = document.getElementById(`btn-${i+1}`);
            if (btn) {
                // 比較問題はラベル（>, <, =）を表示、値は内部で管理
                btn.textContent = labels ? labels[i] : options[i];
                // 正解/不正解フィードバック色をリセット
                btn.classList.remove("btn-correct", "btn-wrong");
                // NOTE: onclick は training.js / work.js の各モードで個別に設定される
                btn.onclick = null;
            }
        }
    },

    // ==========================================
    //  HPバー更新（数値テキスト + 危険色 対応）
    // ==========================================
    updateHpBar: function(type, current, max) {
        const bar = document.getElementById(`${type}-hp-fill`);
        const hpText = document.getElementById(`${type}-hp-text`);
        if (!bar) return;

        if (!max || max <= 0) {
            bar.style.width = '100%';
            if (hpText) hpText.textContent = "0/0";
            return;
        }

        let percent = (current / max) * 100;
        if (percent < 0) percent = 0;
        if (percent > 100) percent = 100;

        bar.style.width = percent + '%';

        // 危険色クラスの切り替え
        bar.classList.remove("hp-danger", "hp-warning");
        if (percent <= 25) {
            bar.classList.add("hp-danger");
        } else if (percent <= 50) {
            bar.classList.add("hp-warning");
        }

        // HP数値テキスト
        if (hpText) {
            hpText.textContent = `${Math.max(0, current)}/${max}`;
        }
    },

    // ==========================================
    //  問題エリアにメッセージ表示
    // ==========================================
    showMessage: function(text) {
        const qText = document.getElementById('question-text');
        if (qText) qText.textContent = text;
    },

    // ==========================================
    //  実況テキスト
    // ==========================================
    playCommentary: function(type) {
        const msgBox = document.getElementById("combo-message");
        if (!msgBox) return;

        const list = this.commentaryList[type];
        if (!list) return;
        const text = list[Math.floor(Math.random() * list.length)];

        msgBox.innerText = text;
        msgBox.classList.remove("combo-active");
        void msgBox.offsetWidth;
        msgBox.classList.add("combo-active");

        setTimeout(() => {
            msgBox.classList.remove("combo-active");
        }, 2000);
    },

    // ==========================================
    //  ダメージ揺れ
    // ==========================================
    triggerShake: function() {
        const scene = document.getElementById("battle-scene");
        if (scene) {
            scene.classList.remove("shake-effect");
            void scene.offsetWidth;
            scene.classList.add("shake-effect");
        }

        const enemyImg = document.getElementById('enemy-img');
        if (enemyImg) {
            enemyImg.classList.remove('shake');
            void enemyImg.offsetWidth;
            enemyImg.classList.add('shake');
        }
    },

    // ==========================================
    //  経験値バー & レベル表示
    // ==========================================
    updateStatusDisplay: function(exp, maxExp, level) {
        const bar = document.getElementById("exp-bar-fill");
        const lvNum = document.getElementById("level-display");

        let percentage = 0;
        if (maxExp > 0) {
            percentage = Math.floor((exp / maxExp) * 100);
        }

        if (bar) bar.style.width = percentage + "%";
        if (lvNum) lvNum.innerText = level;
    },

    // ==========================================
    //  コンボエフェクト
    // ==========================================
    showComboEffect: function(comboCount) {
        const msgBox = document.getElementById("combo-message");
        if (!msgBox) return;

        if (comboCount >= 2) {
            let text = `${comboCount}コンボ！`;
            if (comboCount >= 5) {
                text = `${comboCount}コンボ！ ドラゴンバースト！！`;
                SoundManager.playSE("burst");
                // ★バーストエフェクト発動
                EffectManager.playBurst();
            } else if (comboCount >= 3) {
                text += " ファイア！";
                SoundManager.playSE("combo");
            } else {
                SoundManager.playSE("combo");
            }

            msgBox.innerText = text;
            msgBox.classList.remove("combo-active");
            void msgBox.offsetWidth;
            msgBox.classList.add("combo-active");

            setTimeout(() => {
                msgBox.classList.remove("combo-active");
            }, 2000);

        } else {
            this.playCommentary("attack");
        }
    },

    // ==========================================
    //  ラウンドバナーの更新
    // ==========================================
    updateRoundBanner: function(roundIndex, cupName) {
        const banner = document.getElementById("round-banner");
        if (!banner) return;

        const roundLabels = ["予選", "準決勝", "決勝"];
        const label = roundLabels[roundIndex] || `第${roundIndex + 1}回戦`;

        banner.textContent = `${cupName || ""} ─ ${label}`;
    },

    // ==========================================
    //  バトル背景の切り替え（大会ランクに応じて）
    // ==========================================
    setBattleBackground: function(cupId) {
        const scene = document.getElementById("battle-scene");
        if (!scene) return;

        const backgrounds = {
            1: "linear-gradient(180deg, #1a2a1a 0%, #0d3b1e 40%, #1a5030 100%)",   // ビギナー: 森
            2: "linear-gradient(180deg, #2a1a0a 0%, #3e2816 40%, #604020 100%)",   // ブロンズ: 荒野
            3: "linear-gradient(180deg, #1a0a2e 0%, #16213e 40%, #0f3460 100%)",   // シルバー: 夜空
            4: "linear-gradient(180deg, #2e0a0a 0%, #3e1616 40%, #600f0f 100%)",   // ゴールド: 火山
            5: "linear-gradient(180deg, #0a0a2e 0%, #1a0033 40%, #2e0050 100%)",   // 最強王: 深淵
            6: "linear-gradient(180deg, #0f1f0f 0%, #082a12 40%, #061f0e 100%)",   // 裏ビギナー: 暗い森
            7: "linear-gradient(180deg, #1f1008 0%, #2e1a0a 40%, #3a1c08 100%)",   // 裏ブロンズ: 暗い荒野
            8: "linear-gradient(180deg, #10061e 0%, #0e1830 40%, #082050 100%)",   // 裏シルバー: 暗い夜空
            9: "linear-gradient(180deg, #200606 0%, #300e0e 40%, #480808 100%)",   // 裏ゴールド: 暗い火山
            10: "linear-gradient(180deg, #0a0a2e 0%, #1a0033 40%, #2e0050 100%)",  // 裏最強王: 深淵
            11: "linear-gradient(180deg, #1a0020 0%, #2d0040 40%, #400060 100%)"   // 神竜杯: 闇の深淵
        };

        scene.style.background = backgrounds[cupId] || backgrounds[1];
    },

    // ==========================================
    //  ドラゴン画像の進化更新
    // ==========================================
    updateDragonImage: function(level) {
        const img = document.getElementById("player-img");
        if (!img) return;

        const type = GameState.selectedCharacterType;
        const charConfig = GameConfig.playerTypes[type];
        if (!charConfig) return;

        const images = charConfig.images;
        let targetImage = images[1];

        for (let key in images) {
            if (level >= parseInt(key)) {
                targetImage = images[key];
            }
        }

        if (targetImage && !img.src.includes(targetImage)) {
            img.src = targetImage;
            console.log(`進化反映: ${targetImage}`);
            const evoText = document.getElementById("evolution-text");
            if (evoText) evoText.textContent = charConfig.name;
        }
    },

    // ==========================================
    //  バトルコマンドメニュー表示
    // ==========================================
    showCommandMenu: function() {
        const commandMenu = document.getElementById('command-menu');
        const moveSelect = document.getElementById('move-select-menu');
        const itemSelect = document.getElementById('item-select-menu');
        const battleBottom = document.getElementById('battle-bottom');
        const msgBox = document.getElementById('battle-message-box');

        if (moveSelect) moveSelect.style.display = 'none';
        if (itemSelect) itemSelect.style.display = 'none';
        if (battleBottom) battleBottom.style.display = 'none';
        if (commandMenu) commandMenu.style.display = 'block';

        if (msgBox) msgBox.textContent = 'どうする？';
    },

    // ==========================================
    //  わざ選択メニュー表示
    // ==========================================
    showMoveSelect: function() {
        const commandMenu = document.getElementById('command-menu');
        const moveSelect = document.getElementById('move-select-menu');
        const moveList = document.getElementById('move-list');

        if (commandMenu) commandMenu.style.display = 'none';
        if (moveSelect) moveSelect.style.display = 'block';

        if (moveList) {
            moveList.innerHTML = '';

            const equippedMoves = GameState.equippedMoves || [];
            equippedMoves.forEach((moveId, index) => {
                if (!moveId) return;

                const moveData = GameConfig.moves[moveId];
                if (!moveData) return;

                const currentPP = GameState.battlePP[moveId] !== undefined ? GameState.battlePP[moveId] : moveData.pp;
                const isDisabled = currentPP <= 0;

                const card = document.createElement('div');
                card.className = `move-card ${isDisabled ? 'disabled' : ''}`;
                if (isDisabled) card.style.pointerEvents = 'none';

                const typeEmoji = (GameConfig.typeEmojis && GameConfig.typeEmojis[moveData.type]) || '⚪';
                card.innerHTML = `
                    <div class="move-card-icon">${typeEmoji}</div>
                    <div class="move-card-info">
                        <div class="move-card-name">${moveData.name}</div>
                        <div class="move-card-pp">PP: ${currentPP}/${moveData.pp}</div>
                    </div>
                `;

                if (!isDisabled) {
                    card.onclick = () => {
                        if (GameManager && GameManager.onMoveSelected) {
                            GameManager.onMoveSelected(moveId);
                        }
                    };
                }

                moveList.appendChild(card);
            });
        }
    },

    // ==========================================
    //  アイテム選択メニュー表示
    // ==========================================
    showItemSelect: function() {
        const commandMenu = document.getElementById('command-menu');
        const itemSelect = document.getElementById('item-select-menu');
        const itemList = document.getElementById('item-list');

        if (commandMenu) commandMenu.style.display = 'none';
        if (itemSelect) itemSelect.style.display = 'block';

        if (itemList) {
            itemList.innerHTML = '';

            const battleInventory = GameState.battleInventory || {};
            const hasItems = Object.keys(battleInventory).length > 0 && Object.values(battleInventory).some(count => count > 0);

            if (!hasItems) {
                const noItemsMsg = document.createElement('div');
                noItemsMsg.style.cssText = 'text-align: center; padding: 20px; color: #aaa; font-size: 14px;';
                noItemsMsg.textContent = 'アイテムが ない！';
                itemList.appendChild(noItemsMsg);
                return;
            }

            for (const itemId in battleInventory) {
                const count = battleInventory[itemId];
                if (count <= 0) continue;

                const itemData = GameConfig.shopItems[itemId];
                if (!itemData) continue;

                // 元気のカケラ（自動発動アイテム）は手動使用メニューに表示しない
                if (itemData.effect && itemData.effect.type === "revive") continue;

                const card = document.createElement('div');
                card.className = 'item-card';

                const icon = itemData.icon || '💊';
                card.innerHTML = `
                    <div class="item-card-icon">${icon}</div>
                    <div class="item-card-name">${itemData.name}</div>
                    <div class="item-card-count">×${count}</div>
                `;

                card.onclick = () => {
                    if (GameManager && GameManager.onItemSelected) {
                        GameManager.onItemSelected(itemId);
                    }
                };

                itemList.appendChild(card);
            }
        }
    },

    // ==========================================
    //  コマンド・わざ・アイテムメニュー非表示
    // ==========================================
    hideCommandArea: function() {
        const commandMenu = document.getElementById('command-menu');
        const moveSelect = document.getElementById('move-select-menu');
        const itemSelect = document.getElementById('item-select-menu');

        if (commandMenu) commandMenu.style.display = 'none';
        if (moveSelect) moveSelect.style.display = 'none';
        if (itemSelect) itemSelect.style.display = 'none';
    },

    // ==========================================
    //  メッセージ表示（戦闘メッセージボックス対応）
    // ==========================================
    showMessageOriginal: function(text) {
        const msgBox = document.getElementById('battle-message-box');
        const qText = document.getElementById('question-text');
        const commandMenu = document.getElementById('command-menu');

        if (msgBox && commandMenu && commandMenu.style.display !== 'none') {
            msgBox.textContent = text;
        } else if (qText) {
            qText.textContent = text;
        }
    },

    // ==========================================
    //  敵の属性タイプバッジ表示
    // ==========================================
    showEnemyType: function() {
        const enemyData = GameState.currentEnemyData;
        if (!enemyData) return;

        const nameLabel = document.getElementById('enemy-name');
        if (!nameLabel) return;

        let existingBadge = nameLabel.querySelector('.type-badge');
        if (existingBadge) existingBadge.remove();

        if (enemyData.type) {
            const badge = document.createElement('span');
            badge.className = `type-badge type-${enemyData.type}`;
            badge.textContent = enemyData.type;
            nameLabel.appendChild(badge);
        }
    }
};
