// pause.js
// バトル中の一時停止管理

const PauseManager = {

    _paused: false,

    pause: function() {
        if (this._paused) return;
        // エンドレスモード中でもポーズ可能にする
        this._paused = true;

        // 入力をブロック
        GameState.isInputBlocked = true;

        // ポーズボタンを無効化（連打防止）
        const pauseBtn = document.getElementById('btn-pause');
        if (pauseBtn) pauseBtn.disabled = true;

        SoundManager.playSE("select");

        ModalManager.show({
            icon: "⏸",
            title: "一時停止",
            message: "どうする？",
            type: "info",
            buttons: [
                {
                    text: "続ける",
                    class: "primary",
                    callback: () => {
                        this._paused = false;
                        GameState.isInputBlocked = false;
                        if (pauseBtn) pauseBtn.disabled = false;
                    }
                },
                {
                    text: "ホームに戻る",
                    class: "secondary",
                    callback: () => {
                        this._paused = false;
                        GameState.isInputBlocked = false;
                        if (pauseBtn) pauseBtn.disabled = false;

                        // エンドレスモードを終了
                        if (EndlessManager._active) {
                            EndlessManager._active = false;
                        }

                        // BGMフェードアウト
                        SoundManager.fadeOutBGM(400);

                        // バトル画面 → ホームへ
                        TrainingManager.updateHomeDisplay();
                        TransitionManager.fade("battle-scene", "home-screen", "block", () => {
                            SoundManager.playBGM("bgm_home");
                        });
                    }
                }
            ]
        });
    }
};
