// zukan.js
// ドラゴン図鑑（モンスター図鑑）の表示・管理

const ZukanManager = {

    // 現在表示中のランクフィルター（0=全て、1〜4=各ランク）
    currentFilter: 0,

    // 新規発見フラグ（セッション中に追加されたもの）
    _newlyDiscovered: [],

    // ランク名
    rankLabels: {
        1: "猛獣・巨大生物",
        2: "恐竜・伝説の幻獣",
        3: "強力なドラゴン",
        4: "神・魔王クラス"
    },

    // ==========================================
    //  図鑑画面を開く
    // ==========================================
    open: function() {
        SoundManager.playSE("select");
        this.currentFilter = 0;
        this.render();
        TransitionManager.fade("home-screen", "zukan-screen", "block");
    },

    // ==========================================
    //  ホームに戻る
    // ==========================================
    backToHome: function() {
        SoundManager.playSE("select");
        // 新規バッジをリセット
        this._newlyDiscovered = [];
        TransitionManager.fade("zukan-screen", "home-screen", "block");
    },

    // ==========================================
    //  敵を撃破記録に追加する
    //  戻り値: true=新規発見 / false=既に登録済み
    // ==========================================
    registerDefeat: function(enemyData) {
        const allEnemies = GameConfig.enemies;
        const idx = allEnemies.indexOf(enemyData);
        if (idx === -1) return false;

        if (!GameState.defeatedEnemyIndices.includes(idx)) {
            GameState.defeatedEnemyIndices.push(idx);
            this._newlyDiscovered.push(idx);
            return true; // 新規発見！
        }
        return false;
    },

    // ==========================================
    //  図鑑を描画する
    // ==========================================
    render: function() {
        const allEnemies = GameConfig.enemies;
        const defeated = GameState.defeatedEnemyIndices || [];
        const total = allEnemies.length;
        const discovered = defeated.length;

        // カウンター更新
        const counterEl = document.getElementById("zukan-counter");
        if (counterEl) {
            counterEl.innerHTML = `<span class="counter-num">${discovered}</span> / ${total} はっけん`;
        }

        // プログレスバー更新
        const progressFill = document.getElementById("zukan-progress-fill");
        if (progressFill) {
            const pct = total > 0 ? (discovered / total * 100) : 0;
            progressFill.style.width = pct + "%";
        }

        // タブの状態を更新
        this._updateTabs();

        // グリッドを描画
        const grid = document.getElementById("zukan-grid");
        if (!grid) return;
        grid.innerHTML = "";

        allEnemies.forEach((enemy, idx) => {
            // フィルターチェック
            if (this.currentFilter > 0 && enemy.rank !== this.currentFilter) {
                return;
            }

            const isDiscovered = defeated.includes(idx);
            const isNew = this._newlyDiscovered.includes(idx);

            const card = document.createElement("div");
            card.className = "zukan-card " + (isDiscovered ? "discovered" : "locked");

            // 番号
            const noEl = document.createElement("span");
            noEl.className = "zukan-card-no";
            noEl.textContent = "No." + String(idx + 1).padStart(2, "0");
            card.appendChild(noEl);

            // NEW バッジ
            if (isNew && isDiscovered) {
                const badge = document.createElement("span");
                badge.className = "zukan-new-badge";
                badge.textContent = "NEW";
                card.appendChild(badge);
            }

            // 画像
            const img = document.createElement("img");
            img.className = "zukan-card-img";
            img.src = enemy.src;
            img.alt = isDiscovered ? enemy.name : "???";
            card.appendChild(img);

            // 名前
            const nameEl = document.createElement("div");
            nameEl.className = "zukan-card-name";
            nameEl.textContent = isDiscovered ? enemy.name : "???";
            card.appendChild(nameEl);

            // ランク星
            const rankEl = document.createElement("div");
            rankEl.className = "zukan-card-rank";
            rankEl.textContent = "★".repeat(enemy.rank);
            card.appendChild(rankEl);

            // クリックイベント（発見済みのみ）
            if (isDiscovered) {
                card.onclick = () => this.showDetail(idx);
            }

            grid.appendChild(card);
        });
    },

    // ==========================================
    //  タブを更新
    // ==========================================
    _updateTabs: function() {
        const tabs = document.querySelectorAll(".zukan-tab");
        tabs.forEach(tab => {
            const rank = parseInt(tab.dataset.rank);
            if (rank === this.currentFilter) {
                tab.classList.add("tab-active");
            } else {
                tab.classList.remove("tab-active");
            }
        });
    },

    // ==========================================
    //  タブクリック
    // ==========================================
    setFilter: function(rank) {
        SoundManager.playSE("select");
        this.currentFilter = rank;
        this.render();
    },

    // ==========================================
    //  詳細モーダルを表示
    // ==========================================
    showDetail: function(enemyIdx) {
        SoundManager.playSE("select");

        const enemy = GameConfig.enemies[enemyIdx];
        if (!enemy) return;

        const overlay = document.getElementById("zukan-detail-overlay");

        document.getElementById("zukan-detail-no").textContent = "No." + String(enemyIdx + 1).padStart(2, "0");
        document.getElementById("zukan-detail-img").src = enemy.src;
        document.getElementById("zukan-detail-name").textContent = enemy.name;
        document.getElementById("zukan-detail-rank").textContent = "★".repeat(enemy.rank) + " " + (this.rankLabels[enemy.rank] || "");
        document.getElementById("zukan-detail-hp").textContent = enemy.hp;

        // 敵の攻撃力を表示
        document.getElementById("zukan-detail-atk").textContent = enemy.attack;

        overlay.classList.add("zukan-detail-visible");
    },

    // ==========================================
    //  詳細モーダルを閉じる
    // ==========================================
    hideDetail: function() {
        const overlay = document.getElementById("zukan-detail-overlay");
        overlay.classList.remove("zukan-detail-visible");
    },

    // ==========================================
    //  発見数を取得（ホーム画面表示用）
    // ==========================================
    getDiscoveredCount: function() {
        return (GameState.defeatedEnemyIndices || []).length;
    },

    getTotalCount: function() {
        return GameConfig.enemies.length;
    }
};
