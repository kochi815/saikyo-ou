// result.js
// 勝利・敗北の専用フルスクリーン演出画面を管理する

const ResultManager = {

    // ==========================================
    //  勝利画面を表示
    // ==========================================
    showVictory: function(cupName, rewardExp, dragonImgSrc, onNext) {
        const screen = document.getElementById("victory-screen");
        if (!screen) return;

        // テキストをセット
        document.getElementById("victory-cupname").textContent = cupName;
        document.getElementById("victory-reward-exp").textContent = rewardExp;

        // ドラゴン画像をセット
        const dragonImg = document.getElementById("victory-dragon-img");
        if (dragonImg && dragonImgSrc) {
            dragonImg.src = dragonImgSrc;
        }

        // 紙吹雪アニメーションをリセット＆発動
        this._resetConfetti();

        // 画面表示（インラインstyleをクリアしてからactiveクラスを付与）
        screen.style.display = "";
        screen.classList.add("active");

        // 紙吹雪を少し遅らせて発動（トロフィー登場後）
        setTimeout(() => {
            this._startConfetti();
        }, 600);

        // 紙吹雪を繰り返す（3秒ごとに追加発射）
        this._confettiTimer = setInterval(() => {
            this._resetConfetti();
            setTimeout(() => this._startConfetti(), 50);
        }, 3500);

        // ボタンのイベント
        const btn = document.getElementById("btn-victory-next");
        if (btn) {
            btn.onclick = () => {
                SoundManager.playSE("select");
                // タイマーだけ停止（画面非表示はTransitionManagerに任せる）
                this._stopVictoryTimers();
                if (onNext) onNext();
            };
        }
    },

    // ==========================================
    //  勝利画面を非表示
    // ==========================================
    _hideVictory: function() {
        const screen = document.getElementById("victory-screen");
        if (screen) screen.classList.remove("active");
        this._stopVictoryTimers();
    },

    _stopVictoryTimers: function() {
        if (this._confettiTimer) {
            clearInterval(this._confettiTimer);
            this._confettiTimer = null;
        }
    },

    // ==========================================
    //  紙吹雪の制御
    // ==========================================
    _resetConfetti: function() {
        const container = document.getElementById("confetti-container");
        if (!container) return;
        const pieces = container.querySelectorAll(".confetti");
        pieces.forEach(p => {
            p.classList.remove("active");
        });
    },

    _startConfetti: function() {
        const container = document.getElementById("confetti-container");
        if (!container) return;
        const pieces = container.querySelectorAll(".confetti");
        pieces.forEach(p => {
            // リフローを強制してアニメーションを再スタート
            void p.offsetWidth;
            p.classList.add("active");
        });
    },

    _confettiTimer: null,

    // ==========================================
    //  敗北画面を表示
    // ==========================================
    showDefeat: function(dragonImgSrc, onTrain, onHome) {
        const screen = document.getElementById("defeat-screen");
        if (!screen) return;

        // ドラゴン画像をセット
        const dragonImg = document.getElementById("defeat-dragon-img");
        if (dragonImg && dragonImgSrc) {
            dragonImg.src = dragonImgSrc;
        }

        // 敗北パーティクルをリセット＆発動
        this._resetDefeatParticles();
        setTimeout(() => this._startDefeatParticles(), 100);

        // パーティクルを繰り返す
        this._defeatTimer = setInterval(() => {
            this._resetDefeatParticles();
            setTimeout(() => this._startDefeatParticles(), 50);
        }, 4500);

        // 画面表示（インラインstyleをクリアしてからactiveクラスを付与）
        screen.style.display = "";
        screen.classList.add("active");

        // ボタン：とっくんする
        const btnTrain = document.getElementById("btn-defeat-train");
        if (btnTrain) {
            btnTrain.onclick = () => {
                SoundManager.playSE("select");
                this._stopDefeatTimers();
                if (onTrain) onTrain();
            };
        }

        // ボタン：ホームにもどる
        const btnHome = document.getElementById("btn-defeat-home");
        if (btnHome) {
            btnHome.onclick = () => {
                SoundManager.playSE("select");
                this._stopDefeatTimers();
                if (onHome) onHome();
            };
        }
    },

    // ==========================================
    //  敗北画面を非表示
    // ==========================================
    _hideDefeat: function() {
        const screen = document.getElementById("defeat-screen");
        if (screen) screen.classList.remove("active");
        this._stopDefeatTimers();
    },

    _stopDefeatTimers: function() {
        if (this._defeatTimer) {
            clearInterval(this._defeatTimer);
            this._defeatTimer = null;
        }
    },

    // ==========================================
    //  敗北パーティクルの制御
    // ==========================================
    _resetDefeatParticles: function() {
        const container = document.getElementById("defeat-particles");
        if (!container) return;
        const particles = container.querySelectorAll(".defeat-particle");
        particles.forEach(p => p.classList.remove("active"));
    },

    _startDefeatParticles: function() {
        const container = document.getElementById("defeat-particles");
        if (!container) return;
        const particles = container.querySelectorAll(".defeat-particle");
        particles.forEach(p => {
            void p.offsetWidth;
            p.classList.add("active");
        });
    },

    _defeatTimer: null,

    // ==========================================
    //  ドラゴンの現在の画像パスを取得するヘルパー
    // ==========================================
    getCurrentDragonSrc: function() {
        const type = GameState.selectedCharacterType;
        const charConfig = GameConfig.playerTypes[type];
        if (!charConfig) return "";

        const images = charConfig.images;
        let targetImage = images[1];
        for (let key in images) {
            if (GameState.playerLevel >= parseInt(key)) {
                targetImage = images[key];
            }
        }
        return targetImage || "";
    }
};
