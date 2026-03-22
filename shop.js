// shop.js
// ショップシステム管理（アイテム、技、特別アイテムの購入）

const ShopManager = {

    // ==========================================
    //  状態管理
    // ==========================================
    currentTab: "items",  // "items", "moves", "special"

    // ==========================================
    //  ショップを開く
    // ==========================================
    open: function() {
        // ホーム画面から遷移
        const homeScreens = ["home-screen", "battle-scene", "training-menu", "cup-select-screen", "work-screen", "zukan-screen", "achievement-screen"];
        const shopScreen = "shop-screen";

        TransitionManager.fade(homeScreens, shopScreen, "block", () => {
            console.log("ショップを開きました");
            this._updateGoldDisplay();
            this.switchTab("items");
        });
    },


    // ==========================================
    //  タブ切り替え
    // ==========================================
    switchTab: function(tab) {
        this.currentTab = tab;

        // タブボタンのアクティブ状態を切り替え
        document.querySelectorAll(".shop-tab").forEach(btn => {
            btn.classList.remove("active");
        });
        document.querySelector(`.shop-tab[data-tab="${tab}"]`).classList.add("active");

        // コンテンツを描画
        if (tab === "items") {
            this.renderItems();
        } else if (tab === "moves") {
            this.renderMoves();
        } else if (tab === "special") {
            this.renderSpecial();
        }
    },

    // ==========================================
    //  アイテムショップタブを描画
    // ==========================================
    renderItems: function() {
        const container = document.getElementById("shop-content");
        if (!container) return;

        container.innerHTML = "";
        container.style.display = "block";

        // GameConfig.shopItems からアイテムを取得
        for (const itemId in GameConfig.shopItems) {
            const itemData = GameConfig.shopItems[itemId];
            const owned = GameState.inventory[itemId] || 0;

            const itemCard = this._createItemCard(itemId, itemData, owned, "item");
            container.appendChild(itemCard);
        }
    },

    // ==========================================
    //  わざショップタブを描画
    // ==========================================
    renderMoves: function() {
        const container = document.getElementById("shop-content");
        if (!container) return;

        container.innerHTML = "";
        container.style.display = "block";

        // GameConfig.moves からショップ購入可能な技を取得
        for (const moveId in GameConfig.moves) {
            const moveData = GameConfig.moves[moveId];

            // price があれば購入可能
            if (!moveData.price) continue;

            // 既に習得しているかチェック
            // aqua_storm と aqua_storm_learn は同一技なので、片方を持っていれば購入済み扱い
            let isOwned = GameState.learnedMoves.includes(moveId) ||
                           GameState.shopPurchasedMoves.includes(moveId);
            if (moveId === "aqua_storm" && GameState.learnedMoves.includes("aqua_storm_learn")) {
                isOwned = true;
            }

            const moveCard = this._createMoveCard(moveId, moveData, isOwned);
            container.appendChild(moveCard);
        }
    },

    // ==========================================
    //  とくべつタブを描画
    // ==========================================
    renderSpecial: function() {
        const container = document.getElementById("shop-content");
        if (!container) return;

        container.innerHTML = "";
        container.style.display = "block";

        // GameConfig.shopSpecial からアイテムを取得
        for (const itemId in GameConfig.shopSpecial) {
            const itemData = GameConfig.shopSpecial[itemId];
            const owned = GameState.inventory[itemId] || 0;

            const itemCard = this._createItemCard(itemId, itemData, owned, "special");
            container.appendChild(itemCard);
        }
    },

    // ==========================================
    //  アイテムカードを作成
    // ==========================================
    _createItemCard: function(itemId, itemData, owned, type) {
        const card = document.createElement("div");
        card.className = "shop-card";

        const canBuy = GameState.gold >= itemData.price &&
                      owned < itemData.maxOwn;

        let icon = "📦";
        if (itemId === "herb" || itemId === "super_herb" || itemId === "full_heal") icon = "🧴";
        if (itemId === "power_seed" || itemId === "speed_seed" || itemId === "guard_seed") icon = "🌱";
        if (itemId === "revive") icon = "✨";
        if (itemId === "rare_candy") icon = "🍭";

        const priceDisplay = itemData.price ? `${itemData.price}G` : "0G";

        const buyBtnClass = canBuy ? "shop-buy-btn" : "shop-buy-btn";
        const buyBtnText = owned >= itemData.maxOwn ? "最大" : (GameState.gold < itemData.price ? "ゴールド不足" : "買う");

        card.innerHTML = `
            <div class="shop-card-icon">${icon}</div>
            <div class="shop-card-info">
                <div class="shop-card-name">${itemData.name}</div>
                <div class="shop-card-desc">${itemData.description}</div>
                <div class="shop-card-price">${priceDisplay}</div>
                <div class="shop-card-owned">所持: ${owned}/${itemData.maxOwn}</div>
            </div>
            <button
                class="${buyBtnClass}"
                id="buy-${type}-${itemId}"
                data-item-id="${itemId}"
                data-item-type="${type}"
                ${!canBuy ? "disabled" : ""}
            >
                ${buyBtnText}
            </button>
        `;

        // 買うボタンのイベント
        const buyBtn = card.querySelector(`#buy-${type}-${itemId}`);
        buyBtn.addEventListener("click", () => {
            if (type === "special") {
                this.buySpecial(itemId);
            } else {
                this.buyItem(itemId);
            }
        });

        return card;
    },

    // ==========================================
    //  わざカードを作成
    // ==========================================
    _createMoveCard: function(moveId, moveData, isOwned) {
        const card = document.createElement("div");
        card.className = "shop-card";

        const canBuy = GameState.gold >= moveData.price && !isOwned;

        // タイプのアイコン
        const typeEmoji = GameConfig.typeEmojis[moveData.type] || "⚪";

        const buyBtnClass = canBuy ? "shop-buy-btn" : "shop-buy-btn";
        const buyBtnText = isOwned ? "習得済み" : (GameState.gold < moveData.price ? "ゴールド不足" : "買う");

        card.innerHTML = `
            <div class="shop-card-icon">${typeEmoji}</div>
            <div class="shop-card-info">
                <div class="shop-card-name">${moveData.name}</div>
                <div class="shop-card-desc">${moveData.description}</div>
                <div class="shop-card-price">${moveData.price}G</div>
                <div style="font-size: 12px; color: #aaa; margin-top: 4px;">
                    <span>威力: ${moveData.power}</span>
                    <span style="margin-left: 12px;">PP: ${moveData.pp}</span>
                </div>
            </div>
            <button
                class="${buyBtnClass}"
                id="buy-move-${moveId}"
                data-move-id="${moveId}"
                ${!canBuy ? "disabled" : ""}
            >
                ${buyBtnText}
            </button>
        `;

        // 買うボタンのイベント
        const buyBtn = card.querySelector(`#buy-move-${moveId}`);
        buyBtn.addEventListener("click", () => {
            this.buyMove(moveId);
        });

        return card;
    },

    // ==========================================
    //  アイテムを購入
    // ==========================================
    buyItem: function(itemId) {
        const itemData = GameConfig.shopItems[itemId];
        if (!itemData) {
            console.warn(`アイテム ${itemId} が見つかりません`);
            return;
        }

        // チェック：ゴールド不足
        if (GameState.gold < itemData.price) {
            ModalManager.show({
                icon: "⚠️",
                type: "warning",
                message: "ゴールドが 足りません！",
                buttons: [{ text: "OK", class: "secondary" }]
            });
            return;
        }

        // チェック：最大所持数に達している
        const owned = GameState.inventory[itemId] || 0;
        if (owned >= itemData.maxOwn) {
            ModalManager.show({
                icon: "⚠️",
                type: "warning",
                message: `${itemData.name}は\nもう これ以上 持てません！`,
                buttons: [{ text: "OK", class: "secondary" }]
            });
            return;
        }

        // 購入実行
        GameState.spendGold(itemData.price);
        GameState.inventory[itemId] = owned + 1;
        StorageManager.save();

        // SE再生
        SoundManager.playSE("select");

        // 画面更新
        this._updateGoldDisplay();
        this.renderItems();

        // 購入完了メッセージ
        ModalManager.show({
            icon: "✨",
            type: "success",
            message: `${itemData.name}を\n買いました！`,
            buttons: [{ text: "OK", class: "primary" }]
        });
    },

    // ==========================================
    //  わざを購入
    // ==========================================
    buyMove: function(moveId) {
        const moveData = GameConfig.moves[moveId];
        if (!moveData || !moveData.price) {
            console.warn(`わざ ${moveId} またはその価格が見つかりません`);
            return;
        }

        // チェック：ゴールド不足
        if (GameState.gold < moveData.price) {
            ModalManager.show({
                icon: "⚠️",
                type: "warning",
                message: "ゴールドが 足りません！",
                buttons: [{ text: "OK", class: "secondary" }]
            });
            return;
        }

        // チェック：既に習得している（aqua_storm と aqua_storm_learn は同一技扱い）
        let alreadyOwned = GameState.learnedMoves.includes(moveId) || GameState.shopPurchasedMoves.includes(moveId);
        if (moveId === "aqua_storm" && GameState.learnedMoves.includes("aqua_storm_learn")) {
            alreadyOwned = true;
        }
        if (alreadyOwned) {
            ModalManager.show({
                icon: "⚠️",
                type: "warning",
                message: `${moveData.name}は\nもう 習得 しています！`,
                buttons: [{ text: "OK", class: "secondary" }]
            });
            return;
        }

        // 購入実行
        GameState.spendGold(moveData.price);
        GameState.learnedMoves.push(moveId);
        GameState.shopPurchasedMoves.push(moveId);
        StorageManager.save();

        // SE再生
        SoundManager.playSE("select");

        // 画面更新
        this._updateGoldDisplay();
        this.renderMoves();

        // 購入完了メッセージ
        ModalManager.show({
            icon: "⚡",
            type: "success",
            message: `${moveData.name}を\n習得した！\n\n別の技に\n切り替えることができます`,
            buttons: [{ text: "OK", class: "primary" }]
        });
    },

    // ==========================================
    //  とくべつアイテムを購入
    // ==========================================
    buySpecial: function(itemId) {
        const itemData = GameConfig.shopSpecial[itemId];
        if (!itemData) {
            console.warn(`とくべつアイテム ${itemId} が見つかりません`);
            return;
        }

        // チェック：ゴールド不足
        if (GameState.gold < itemData.price) {
            ModalManager.show({
                icon: "⚠️",
                type: "warning",
                message: "ゴールドが 足りません！",
                buttons: [{ text: "OK", class: "secondary" }]
            });
            return;
        }

        const owned = GameState.inventory[itemId] || 0;
        if (owned >= itemData.maxOwn) {
            ModalManager.show({
                icon: "⚠️",
                type: "warning",
                message: `${itemData.name}は\nもう これ以上 持てません！`,
                buttons: [{ text: "OK", class: "secondary" }]
            });
            return;
        }

        // 購入実行（共通処理）
        GameState.spendGold(itemData.price);
        GameState.inventory[itemId] = owned + 1;

        // アイテム固有の効果
        let effectMessage = "";
        if (itemId === "rare_candy") {
            // ふしぎなアメ：経験値を100追加
            GameState.addExp(100);
            effectMessage = `経験値 +100 を\n手に入れた！`;
        }

        StorageManager.save();
        SoundManager.playSE("select");

        this._updateGoldDisplay();
        this.renderSpecial();

        ModalManager.show({
            icon: "💫",
            type: "success",
            message: `${itemData.name}を\n買いました！\n\n${effectMessage}`,
            buttons: [{ text: "OK", class: "primary" }]
        });
    },

    // ==========================================
    //  ゴール表示を更新
    // ==========================================
    _updateGoldDisplay: function() {
        const goldEl = document.getElementById("shop-gold-display");
        if (goldEl) {
            goldEl.textContent = GameState.gold;
        }
    },

    // ==========================================
    //  ショップを閉じる
    // ==========================================
    close: function() {
        const shopScreen = "shop-screen";
        const homeScreen = "home-screen";

        TransitionManager.fade([shopScreen], homeScreen, "block", () => {
            console.log("ショップを閉じました");
            TrainingManager.updateHomeDisplay();
        });
    }

};
