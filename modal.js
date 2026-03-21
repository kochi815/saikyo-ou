// modal.js
// ゲーム内モーダル（ダイアログ）システム
// alert() / confirm() を完全に置き換える

const ModalManager = {

    _closing: false, // 連打防止フラグ

    // ==========================================
    //  モーダルを表示する（汎用）
    // ==========================================
    show: function(options) {
        // options の構造:
        // {
        //   title:    "タイトル",          （省略可）
        //   message:  "メッセージ本文",
        //   icon:     "⚔️",               （省略可）大きなアイコン
        //   type:     "info" | "success" | "danger" | "warning" | "confirm"
        //   buttons:  [{ text: "OK", class: "primary", callback: fn }]
        //   onClose:  fn                   （省略可）閉じた後のコールバック
        // }

        const overlay = document.getElementById("modal-overlay");
        const box = document.getElementById("modal-box");
        const iconEl = document.getElementById("modal-icon");
        const titleEl = document.getElementById("modal-title");
        const msgEl = document.getElementById("modal-message");
        const btnArea = document.getElementById("modal-buttons");

        // --- アイコン ---
        if (options.icon) {
            iconEl.textContent = options.icon;
            iconEl.style.display = "block";
        } else {
            iconEl.style.display = "none";
        }

        // --- タイトル ---
        if (options.title) {
            titleEl.textContent = options.title;
            titleEl.style.display = "block";
        } else {
            titleEl.style.display = "none";
        }

        // --- メッセージ ---
        msgEl.innerHTML = (options.message || "").replace(/\n/g, "<br>");

        // --- ボックスの色テーマ ---
        box.className = "modal-box"; // リセット
        if (options.type) {
            box.classList.add("modal-" + options.type);
        }

        // --- ボタン ---
        btnArea.innerHTML = "";
        const buttons = options.buttons || [{ text: "OK", class: "primary" }];

        buttons.forEach(btnDef => {
            const btn = document.createElement("button");
            btn.className = "modal-btn modal-btn-" + (btnDef.class || "primary");
            btn.textContent = btnDef.text;
            btn.onclick = () => {
                // 連打防止：既に閉じ処理中なら無視
                if (this._closing) return;
                this._closing = true;

                // ボタン押下SE
                if (typeof SoundManager !== "undefined") {
                    SoundManager.playSE("select");
                }
                this.hide();
                if (btnDef.callback) {
                    setTimeout(() => { this._closing = false; btnDef.callback(); }, 200);
                } else if (options.onClose) {
                    setTimeout(() => { this._closing = false; options.onClose(); }, 200);
                } else {
                    setTimeout(() => { this._closing = false; }, 200);
                }
            };
            btnArea.appendChild(btn);
        });

        // --- 表示 ---
        overlay.classList.add("modal-visible");
        box.classList.add("modal-animate-in");
    },

    // ==========================================
    //  モーダルを非表示にする
    // ==========================================
    hide: function() {
        const overlay = document.getElementById("modal-overlay");
        const box = document.getElementById("modal-box");

        box.classList.remove("modal-animate-in");
        box.classList.add("modal-animate-out");

        setTimeout(() => {
            overlay.classList.remove("modal-visible");
            box.classList.remove("modal-animate-out");
        }, 180);
    },

    // ==========================================
    //  便利メソッド：単純な通知（alert の代わり）
    // ==========================================
    alert: function(message, onClose, options) {
        this.show({
            message: message,
            type: (options && options.type) || "info",
            title: (options && options.title) || null,
            icon: (options && options.icon) || null,
            buttons: [{ text: "OK", class: "primary", callback: onClose }],
        });
    },

    // ==========================================
    //  便利メソッド：確認ダイアログ（confirm の代わり）
    // ==========================================
    confirm: function(message, onYes, onNo, options) {
        this.show({
            message: message,
            type: (options && options.type) || "confirm",
            title: (options && options.title) || null,
            icon: (options && options.icon) || null,
            buttons: [
                { text: (options && options.yesText) || "はい", class: "primary", callback: onYes },
                { text: (options && options.noText) || "いいえ", class: "secondary", callback: onNo }
            ]
        });
    },

    // ==========================================
    //  特殊演出：レベルアップ
    // ==========================================
    showLevelUp: function(level, onClose) {
        this.show({
            icon: "⬆️",
            title: "レベルアップ！",
            message: `Lv.${level} になった！\nドラゴンが強くなったぞ！`,
            type: "success",
            buttons: [{ text: "やったー！", class: "primary", callback: onClose }]
        });
    },

    // ==========================================
    //  特殊演出：1戦勝利（ラウンド突破）
    // ==========================================
    showRoundWin: function(roundNum, onClose) {
        this.show({
            icon: "✊",
            title: `第${roundNum}回戦 突破！`,
            message: "次はもっと強い相手だ！\n気合いを入れろ！",
            type: "success",
            buttons: [{ text: "次へ！", class: "primary", callback: onClose }]
        });
    },

    // ==========================================
    //  特殊演出：大会優勝
    // ==========================================
    showTrophy: function(cupName, rewardExp, onClose) {
        this.show({
            icon: "🏆",
            title: "優勝 おめでとう！",
            message: `${cupName} を 制覇した！\n\n賞金として 経験値 <span class="modal-highlight">${rewardExp}</span> をゲット！`,
            type: "success",
            buttons: [{ text: "次もがんばるぞ！", class: "primary", callback: onClose }]
        });
    },

    // ==========================================
    //  特殊演出：敗北
    // ==========================================
    showDefeat: function(onClose) {
        this.show({
            icon: "💪",
            title: "負けてしまった……",
            message: "でも大丈夫！\n特訓してもっと強くなろう！",
            type: "danger",
            buttons: [{ text: "特訓する！", class: "primary", callback: onClose }]
        });
    },

    // ==========================================
    //  特殊演出：特訓結果
    // ==========================================
    showTrainingResult: function(correctCount, gain, statName, onClose) {
        if (gain > 0) {
            const statLabels = {
                attack: "攻撃力",
                defense: "防御力",
                speed: "素早さ",
                hp: "体力"
            };
            this.show({
                icon: "💥",
                title: "特訓 完了！",
                message: `<span class="modal-highlight">${correctCount}問</span> 正解！\n${statLabels[statName] || statName} が <span class="modal-highlight">+${gain}</span> 上がった！`,
                type: "success",
                buttons: [{ text: "よし！", class: "primary", callback: onClose }]
            });
        } else {
            this.show({
                icon: "😣",
                title: "残念……",
                message: `${correctCount}問 正解……\nステータスは 上がらなかった。\nもう一度チャレンジしよう！`,
                type: "warning",
                buttons: [{ text: "もう一回！", class: "primary", callback: onClose }]
            });
        }
    },

    // ==========================================
    //  特殊演出：セーブデータ復帰
    // ==========================================
    showSaveConfirm: function(charName, level, onYes, onNo) {
        this.show({
            icon: "📖",
            title: "続きから遊ぶ？",
            message: `前のデータが残っているよ！\n\n仲間： <span class="modal-highlight">${charName}</span>\nレベル： <span class="modal-highlight">${level}</span>`,
            type: "confirm",
            buttons: [
                { text: "続きから！", class: "primary", callback: onYes },
                { text: "最初から", class: "secondary", callback: onNo }
            ]
        });
    }
};
