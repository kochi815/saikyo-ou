// tutorial.js
// 初回起動時のチュートリアル

const TutorialManager = {

    _currentPage: 0,

    pages: [
        {
            icon: "🐉",
            title: "ようこそ！",
            text: "キミだけのドラゴンを育てて\n最強のチャンピオンを目指そう！"
        },
        {
            icon: "➕",
            title: "遊びかた",
            text: "算数の問題に答えると\nドラゴンが攻撃するよ！\n早く答えるとボーナスダメージ！"
        },
        {
            icon: "💪",
            title: "強くなろう！",
            text: "「特訓」でステータスアップ！\n「コロシアム」で大会に挑戦！\n図鑑をコンプリートしよう！"
        }
    ],

    // 初回かどうかチェック
    shouldShow: function() {
        return !localStorage.getItem("dragon_colosseum_tutorial_done");
    },

    // チュートリアル開始
    start: function() {
        this._currentPage = 0;
        this._showPage();
    },

    _showPage: function() {
        const page = this.pages[this._currentPage];
        const isLast = (this._currentPage >= this.pages.length - 1);

        ModalManager.show({
            icon: page.icon,
            title: page.title,
            message: page.text,
            type: "info",
            buttons: [{
                text: isLast ? "はじめる！" : "つぎへ →",
                class: "primary",
                callback: () => {
                    if (isLast) {
                        // チュートリアル完了フラグ
                        localStorage.setItem("dragon_colosseum_tutorial_done", "1");
                    } else {
                        this._currentPage++;
                        this._showPage();
                    }
                }
            }]
        });
    }
};
