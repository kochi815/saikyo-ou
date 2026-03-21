// cup.js
// 大会（カップ）選択モードを管理するファイル

const CupManager = {

    // ==========================================
    //  大会選択画面を開く
    // ==========================================
    openCupSelect: function() {
        SoundManager.playSE("select");
        // リストを事前に生成
        this.renderCupList();
        // ホーム画面 → 大会選択画面（フェード）
        TransitionManager.fade("home-screen", "cup-select-screen", "block");
    },

    // ==========================================
    //  ホームに戻る
    // ==========================================
    backToHome: function() {
        TransitionManager.fade("cup-select-screen", "home-screen", "block");
    },

    // ==========================================
    //  大会リスト（ボタン）を描画する
    // ==========================================
    renderCupList: function() {
        const container = document.getElementById('cup-list-container');
        container.innerHTML = ""; // 前の内容をクリア

        // 設定ファイルから大会リストを読み込んでループ
        GameConfig.cups.forEach(cup => {
            
            // 1. 解放条件のチェック
            // 「前の大会をクリアしているか？」(IDが1より大きい場合)
            let isLocked = false;
            if (cup.id > 1) {
                // クリア済みIDリストに「前のID」が含まれていなければロック
                if (!GameState.clearedCupIds.includes(cup.id - 1)) {
                    isLocked = true;
                }
            }

            // 2. この大会を既にクリアしているか？
            const isCleared = GameState.clearedCupIds.includes(cup.id);

            // 3. ボタン（カード）のHTMLを作る
            const div = document.createElement("div");
            div.className = "cup-card";
            
            // ロック中ならクラスを追加
            if (isLocked) {
                div.className += " locked";
            }

            // 状態テキストの決定
            let statusText = "";
            let statusColor = "#ccc";
            let unlockHint = "";

            if (isLocked) {
                statusText = "🔒 ロック";
                // 解放条件のヒント
                const prevCup = GameConfig.cups.find(c => c.id === cup.id - 1);
                if (prevCup) {
                    unlockHint = `${prevCup.name} をクリアすると遊べるよ！`;
                }
            } else if (isCleared) {
                statusText = "🏆 クリア済";
                statusColor = "#f1c40f";
            } else {
                statusText = "🔥 挑戦 可能";
                statusColor = "#00ff00";
            }

            // HTMLの中身をセット
            div.innerHTML = `
                <div class="cup-title">${cup.name}</div>
                <div class="cup-desc">${cup.desc}</div>
                ${unlockHint ? `<div class="cup-unlock-hint" style="font-size:11px; color:#e67e22; margin-top:4px;">${unlockHint}</div>` : ""}
                <div class="cup-status" style="color:${statusColor}">${statusText}</div>
            `;

            // 4. クリックイベント（ロックされてなければ開始）
            if (!isLocked) {
                div.onclick = () => {
                    this.startCup(cup.id);
                };
            }

            // 画面に追加
            container.appendChild(div);
        });
    },

    // ==========================================
    //  大会を開始する（ストーリー表示 → バトル開始）
    // ==========================================
    startCup: function(cupId) {
        console.log("大会開始 ID: " + cupId);
        SoundManager.playSE("select");

        // 現在のカップIDを保存
        GameState.currentCupId = cupId;

        // ストーリーテキストがあれば表示
        const story = GameConfig.cupStories && GameConfig.cupStories[cupId];
        if (story && story.intro) {
            const cupConfig = GameConfig.cups.find(c => c.id === cupId);
            const cupName = cupConfig ? cupConfig.name : "";
            ModalManager.show({
                icon: "📜",
                title: cupName,
                message: story.intro,
                type: "info",
                buttons: [{
                    text: "出発！",
                    class: "primary",
                    callback: () => {
                        GameManager.startTournament(cupId);
                    }
                }]
            });
        } else {
            GameManager.startTournament(cupId);
        }
    }
};