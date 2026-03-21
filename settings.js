// settings.js
// 設定画面の管理

const SettingsManager = {

    open: function() {
        SoundManager.playSE("select");
        // 現在の音量をスライダーに反映
        const bgmSlider = document.getElementById("settings-bgm-vol");
        const seSlider = document.getElementById("settings-se-vol");
        if (bgmSlider) {
            bgmSlider.value = Math.round(SoundManager.bgmVolume * 100);
            document.getElementById("settings-bgm-label").textContent = bgmSlider.value + "%";
        }
        if (seSlider) {
            seSlider.value = Math.round(SoundManager.seVolume * 100);
            document.getElementById("settings-se-label").textContent = seSlider.value + "%";
        }
        TransitionManager.fade("home-screen", "settings-screen", "block");
    },

    close: function() {
        SoundManager.playSE("select");
        TransitionManager.fade("settings-screen", "home-screen", "block");
    },

    onBgmChange: function(val) {
        const v = parseInt(val);
        SoundManager.setBGMVolume(v / 100);
        document.getElementById("settings-bgm-label").textContent = v + "%";
    },

    onSeChange: function(val) {
        const v = parseInt(val);
        SoundManager.setSEVolume(v / 100);
        document.getElementById("settings-se-label").textContent = v + "%";
        // テスト再生
        SoundManager.playSE("select");
    },

    confirmReset: function() {
        SoundManager.playSE("select");
        ModalManager.confirm(
            "本当にデータを消しますか？\n全部のデータが消えてしまいます！",
            () => {
                // はい → データ削除
                StorageManager.clear();
                // 画面をリロードして最初からやりなおし
                location.reload();
            },
            () => {
                // いいえ → なにもしない
            },
            {
                type: "danger",
                title: "データ削除",
                icon: "⚠️",
                yesText: "けす",
                noText: "やめる"
            }
        );
    }
};
