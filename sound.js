// sound.js
// サウンドエンジン — BGM と SE の再生を一元管理
//
// ファイルがまだ無い場合でもエラーにならず、
// 音素材が追加され次第すぐに鳴るようになる設計。

const SoundManager = {

    // ==========================================
    //  1. 設定
    // ==========================================
    seVolume: 0.6,      // 効果音の音量（0.0 〜 1.0）
    bgmVolume: 0.35,    // BGMの音量（0.0 〜 1.0）

    currentBgm: null,    // 今流れている BGM の Audio オブジェクト
    currentBgmKey: null, // 今流れている BGM のキー名

    // 全サウンドファイルの定義
    // key → ファイルパス
    sounds: {
        // --- SE ---
        correct:    "assets/sounds/se_correct.mp3",
        wrong:      "assets/sounds/se_wrong.mp3",
        attack:     "assets/sounds/se_attack.mp3",
        damage:     "assets/sounds/se_damage.mp3",
        combo:      "assets/sounds/se_combo.mp3",
        burst:      "assets/sounds/se_burst.mp3",
        levelup:    "assets/sounds/se_levelup.mp3",
        win:        "assets/sounds/se_win.mp3",
        lose:       "assets/sounds/se_lose.mp3",
        trophy:     "assets/sounds/se_trophy.mp3",
        select:     "assets/sounds/se_select.mp3",
        evolution:  "assets/sounds/se_evolution.mp3",

        // --- BGM ---
        bgm_home:          "assets/sounds/bgm_home.mp3",
        bgm_battle1:       "assets/sounds/bgm_battle1.mp3",
        bgm_battle2:       "assets/sounds/bgm_battle2.mp3",
        bgm_battle_final:  "assets/sounds/bgm_battle_final.mp3",
        bgm_training:      "assets/sounds/bgm_training.mp3",
        bgm_result:        "assets/sounds/bgm_result.mp3"
    },

    // プリロード済みキャッシュ
    _cache: {},

    // ==========================================
    //  2. 初期化（プリロード）
    // ==========================================
    init: function() {
        for (const key in this.sounds) {
            const audio = new Audio();
            audio.src = this.sounds[key];
            audio.preload = "auto";
            // ファイルが無くてもエラーを握りつぶす
            audio.onerror = () => {
                console.warn(`[Sound] ファイル未検出: ${this.sounds[key]}`);
            };
            this._cache[key] = audio;
        }
        console.log("[Sound] 初期化完了");
    },

    // ==========================================
    //  3. SE を再生する
    // ==========================================
    playSE: function(key) {
        const src = this.sounds[key];
        if (!src) {
            console.warn(`[Sound] 未定義のキー: ${key}`);
            return;
        }

        // 毎回新しい Audio を作ることで重ね再生に対応
        // （同じSEが連続で鳴っても途切れない）
        const audio = new Audio(src);
        audio.volume = this.seVolume;
        audio.onerror = () => {}; // ファイル無しでも静かに無視
        audio.play().catch(() => {});
    },

    // ==========================================
    //  4. BGM を再生する（ループ再生）
    // ==========================================
    playBGM: function(key) {
        // 同じBGMがすでに流れていたら何もしない
        if (this.currentBgmKey === key && this.currentBgm && !this.currentBgm.paused) {
            return;
        }

        // 既存のBGMを停止
        this.stopBGM();

        const src = this.sounds[key];
        if (!src) {
            console.warn(`[Sound] 未定義のBGMキー: ${key}`);
            return;
        }

        const audio = new Audio(src);
        audio.volume = this.bgmVolume;
        audio.loop = true;
        audio.onerror = () => {
            console.warn(`[Sound] BGMファイル未検出: ${src}`);
        };

        audio.play().catch(() => {
            // ユーザー操作前の自動再生ブロック対策
            // → 次のクリック時に再試行するリスナーを仕込む
            const retryPlay = () => {
                audio.play().catch(() => {});
                document.removeEventListener("click", retryPlay);
                document.removeEventListener("touchstart", retryPlay);
            };
            document.addEventListener("click", retryPlay, { once: true });
            document.addEventListener("touchstart", retryPlay, { once: true });
        });

        this.currentBgm = audio;
        this.currentBgmKey = key;
    },

    // ==========================================
    //  5. BGM を停止する
    // ==========================================
    stopBGM: function() {
        if (this.currentBgm) {
            this.currentBgm.pause();
            this.currentBgm.currentTime = 0;
            this.currentBgm = null;
            this.currentBgmKey = null;
        }
    },

    // ==========================================
    //  6. BGM をフェードアウトして停止する
    // ==========================================
    fadeOutBGM: function(duration) {
        const ms = duration || 800;
        if (!this.currentBgm) return;

        // フェード対象を退避し、現在のBGM参照をクリアする
        // （playBGMが途中で呼ばれても新BGMと干渉しない）
        const audio = this.currentBgm;
        this.currentBgm = null;
        this.currentBgmKey = null;

        const startVol = audio.volume;
        const steps = 20;
        const interval = ms / steps;
        const volStep = startVol / steps;
        let step = 0;

        const timer = setInterval(() => {
            step++;
            audio.volume = Math.max(0, startVol - volStep * step);
            if (step >= steps) {
                clearInterval(timer);
                audio.pause();
                audio.currentTime = 0;
            }
        }, interval);
    },

    // ==========================================
    //  7. 大会IDに応じたBGMキーを返すヘルパー
    // ==========================================
    getBattleBgmKey: function(cupId) {
        if (cupId === 5) return "bgm_battle_final";  // 最強王トーナメント
        if (cupId >= 3) return "bgm_battle2";         // シルバー杯・ゴールド杯
        return "bgm_battle1";                          // ビギナー杯・ブロンズ杯
    },

    // ==========================================
    //  8. 音量変更
    // ==========================================
    setSEVolume: function(vol) {
        this.seVolume = Math.max(0, Math.min(1, vol));
    },

    setBGMVolume: function(vol) {
        this.bgmVolume = Math.max(0, Math.min(1, vol));
        if (this.currentBgm) {
            this.currentBgm.volume = this.bgmVolume;
        }
    }
};
