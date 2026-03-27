// config.js
// ゲームの全設定を管理するファイル（大改修版）

const GameConfig = {
    // ==========================================
    //  1. バトル基本設定
    // ==========================================
    playerStartHp: 70,
    baseAttack: 10,
    baseDefense: 10,
    baseSpeed: 10,
    attackPerLevel: 1.5,
    defensePerLevel: 1.0,
    speedPerLevel: 1,
    hpBonusPerLevel: 4,

    // ダメージ乱数の範囲
    damageRandomMin: 0.85,
    damageRandomMax: 1.0,

    // ==========================================
    //  2. 育成・レベルアップ
    // ==========================================
    xpWin: 10,
    xpLose: 5,
    xpToLevelUp: 100,

    // 特訓・仕事の経験値
    trainingXp: 20,         // 特訓1回あたりの基本経験値
    trainingPerfectXp: 10,  // パーフェクトボーナス経験値
    workXpPerCorrect: 2,    // タイムアタック正解1問あたりの経験値

    // ==========================================
    //  3. 属性相性テーブル
    // ==========================================
    // fire→wind→ground→thunder→water→fire の循環
    typeChart: {
        fire:    { strong: "wind",    weak: "water"   },
        water:   { strong: "fire",    weak: "thunder" },
        thunder: { strong: "water",   weak: "ground"  },
        ground:  { strong: "thunder", weak: "wind"    },
        wind:    { strong: "ground",  weak: "fire"    },
        none:    { strong: null,      weak: null      }
    },

    typeNames: {
        fire: "ほのお", water: "みず", thunder: "いかずち",
        ground: "だいち", wind: "かぜ", none: "なし"
    },

    typeEmojis: {
        fire: "🔥", water: "💧", thunder: "⚡",
        ground: "🪨", wind: "🌪️", none: "⚪"
    },

    advantageMultiplier: 1.3,
    disadvantageMultiplier: 0.8,

    // バフ・デバフ倍率テーブル（段階 → 倍率）
    buffStages: {
        "-3": 0.5, "-2": 0.65, "-1": 0.8,
        "0": 1.0,
        "1": 1.25, "2": 1.5, "3": 2.0
    },

    // ==========================================
    //  4. プレイヤーキャラクターデータ
    // ==========================================
    playerTypes: {
        "blue": {
            name: "王龍",
            type: "water",
            statBias: { attack: 1, defense: 2, speed: 0, hp: 3 },
            images: {
                1: "assets/images/player_blue_1.png",
                3: "assets/images/player_blue_2.png",
                6: "assets/images/player_blue_3.png",
                10: "assets/images/player_blue_4.png"
            },
            // キャラ固有の習得技（レベル: 技ID）
            learnSet: {
                1: ["tackle", "scratch"],
                2: ["guard"],
                3: ["water_shot"],
                4: ["roar"],
                5: ["thunder_fang"],
                6: ["power_up"],
                7: ["rock_throw"],
                8: ["aqua_storm_learn"],
                10: ["thunder_storm"]
            }
        },
        "red": {
            name: "ファイヤードレイク",
            type: "fire",
            statBias: { attack: 2, defense: 0, speed: 2, hp: 0 },
            images: {
                1: "assets/images/player_red_1.png",
                3: "assets/images/player_red_2.png",
                6: "assets/images/player_red_3.png",
                10: "assets/images/player_red_4.png"
            },
            learnSet: {
                1: ["tackle", "scratch"],
                2: ["guard"],
                3: ["fire_breath"],
                4: ["roar"],
                5: ["gust"],
                6: ["power_up"],
                7: ["rock_throw"],
                8: ["flame_storm"],
                10: ["thunder_storm"]
            }
        }
    },

    // ==========================================
    //  5. 技データベース（全20技）
    // ==========================================
    moves: {
        // --- レベル習得技（12技）---
        tackle: {
            name: "たいあたり", type: "none", category: "attack",
            power: 15, accuracy: 100, pp: 30,
            effect: null,
            description: "からだで ぶつかって攻撃！ PPが多い"
        },
        scratch: {
            name: "ひっかく", type: "none", category: "attack",
            power: 25, accuracy: 100, pp: 15,
            effect: null,
            description: "するどいツメで ひっかく！"
        },
        fire_breath: {
            name: "ほのおブレス", type: "fire", category: "attack",
            power: 40, accuracy: 95, pp: 10,
            effect: null,
            description: "はげしい ほのおを はく！"
        },
        water_shot: {
            name: "みずでっぽう", type: "water", category: "attack",
            power: 40, accuracy: 95, pp: 10,
            effect: null,
            description: "いきおいよく みずを とばす！"
        },
        thunder_fang: {
            name: "かみなりキバ", type: "thunder", category: "attack",
            power: 40, accuracy: 95, pp: 10,
            effect: null,
            description: "でんきを まとった キバで かむ！"
        },
        gust: {
            name: "かぜのやいば", type: "wind", category: "attack",
            power: 40, accuracy: 95, pp: 10,
            effect: null,
            description: "するどい かぜで きりつける！"
        },
        rock_throw: {
            name: "いわなげ", type: "ground", category: "attack",
            power: 40, accuracy: 90, pp: 10,
            effect: null,
            description: "おおきな いわを なげつける！"
        },
        guard: {
            name: "まもる", type: "none", category: "defense",
            power: 0, accuracy: 100, pp: 3,
            priority: 1,  // 先制技
            effect: { type: "guard", turns: 1 },
            description: "このターン ダメージを はんぶんにする！"
        },
        roar: {
            name: "おたけび", type: "none", category: "debuff",
            power: 0, accuracy: 90, pp: 5,
            effect: { type: "stat", target: "enemy", stat: "attack", stages: -1 },
            description: "おたけびで てきの こうげきを さげる！"
        },
        power_up: {
            name: "きあいだめ", type: "none", category: "buff",
            power: 0, accuracy: 100, pp: 5,
            effect: { type: "stat", target: "self", stat: "attack", stages: 1 },
            description: "きあいを いれて こうげきりょく UP！"
        },
        flame_storm: {
            name: "ほのおのあらし", type: "fire", category: "attack",
            power: 65, accuracy: 85, pp: 5,
            effect: null,
            description: "はげしい ほのおの うずまき！"
        },
        aqua_storm_learn: {
            name: "みずのうず", type: "water", category: "attack",
            power: 65, accuracy: 85, pp: 5,
            effect: null,
            description: "はげしい みずの うずまき！"
        },
        thunder_storm: {
            name: "らいげき", type: "thunder", category: "attack",
            power: 65, accuracy: 85, pp: 5,
            effect: null,
            description: "そらから かみなりを よぶ！"
        },

        // --- ショップ購入技（8技）---
        aqua_storm: {
            name: "みずのうず", type: "water", category: "attack",
            power: 65, accuracy: 85, pp: 5,
            price: 450,
            effect: null,
            description: "はげしい みずの うずまき！"
        },
        earthquake: {
            name: "じしん", type: "ground", category: "attack",
            power: 65, accuracy: 85, pp: 5,
            price: 450,
            effect: null,
            description: "だいちを ゆらす おおわざ！"
        },
        hurricane: {
            name: "ぼうふう", type: "wind", category: "attack",
            power: 65, accuracy: 85, pp: 5,
            price: 450,
            effect: null,
            description: "すべてを ふきとばす かぜ！"
        },
        heal: {
            name: "かいふく", type: "none", category: "heal",
            power: 0, accuracy: 100, pp: 3,
            price: 300,
            effect: { type: "heal", percent: 30 },
            description: "HPを 30% かいふくする！"
        },
        iron_wall: {
            name: "てっぺき", type: "none", category: "buff",
            power: 0, accuracy: 100, pp: 3,
            price: 400,
            effect: { type: "stat", target: "self", stat: "defense", stages: 2 },
            description: "ぼうぎょを ぐーんと あげる！"
        },
        dragon_claw: {
            name: "ドラゴンクロー", type: "none", category: "attack",
            power: 80, accuracy: 90, pp: 3,
            price: 750,
            effect: null,
            description: "ドラゴンの するどいツメで こうげき！"
        },
        full_burst: {
            name: "ぜんりょくほうか", type: "fire", category: "attack",
            power: 100, accuracy: 70, pp: 3,
            price: 1200,
            effect: null,
            description: "全力の炎！ はずれやすい"
        },
        final_strike: {
            name: "さいきょうのいちげき", type: "none", category: "attack",
            power: 120, accuracy: 75, pp: 2,
            price: 2000,
            effect: null,
            description: "一か八かの大技！"
        },

        // --- 神竜杯・ランク5専用技 ---
        dark_breath: {
            name: "やみのブレス", type: "none", category: "attack",
            power: 80, accuracy: 90, pp: 3,
            effect: null,
            description: "闇をまとった 恐ろしいブレス！"
        },
        flood: {
            name: "こうずい", type: "water", category: "attack",
            power: 75, accuracy: 85, pp: 3,
            effect: null,
            description: "すべてを おし流す 大水！"
        },
        seven_flame: {
            name: "しちとうのほのお", type: "fire", category: "attack",
            power: 90, accuracy: 80, pp: 2,
            effect: null,
            description: "7つの頭から 一斉に 炎を はく！"
        },
        dragon_blade: {
            name: "りゅうけん", type: "none", category: "attack",
            power: 95, accuracy: 85, pp: 3,
            effect: null,
            description: "聖なる竜の剣で 斬りつける！"
        },

        // --- エンドレスモード報酬技 ---
        dragon_pulse: {
            name: "りゅうのはどう", type: "none", category: "attack",
            power: 40, accuracy: 100, pp: 15,
            effect: null,
            description: "必ず当たる 竜の波動！ 長期戦向き"
        }
    },

    // ==========================================
    //  6. 敵キャラクターリスト（全38体）
    // ==========================================
    enemies: [
        // --- ランク1：猛獣・巨大生物 ---
        { name: "オオスズメバチ",         src: "assets/images/enemy_01.png", rank: 1, hp: 40,  attack: 12, defense: 8,  speed: 14, type: "wind",    moves: ["tackle", "gust"],                          ai: "simple" },
        { name: "ヘラクレスオオカブト",   src: "assets/images/enemy_02.png", rank: 1, hp: 45,  attack: 14, defense: 12, speed: 8,  type: "ground",  moves: ["tackle", "scratch"],                       ai: "simple" },
        { name: "キリン",                 src: "assets/images/enemy_03.png", rank: 1, hp: 50,  attack: 10, defense: 10, speed: 12, type: "wind",    moves: ["tackle"],                                  ai: "simple" },
        { name: "フィリピンオオコウモリ", src: "assets/images/enemy_04.png", rank: 1, hp: 50,  attack: 12, defense: 8,  speed: 15, type: "wind",    moves: ["tackle", "gust"],                          ai: "simple" },
        { name: "アンドリューサルクス",   src: "assets/images/enemy_08.png", rank: 1, hp: 55,  attack: 15, defense: 10, speed: 10, type: "ground",  moves: ["tackle", "scratch", "roar"],               ai: "simple" },
        { name: "ライオン",               src: "assets/images/enemy_09.png", rank: 1, hp: 60,  attack: 16, defense: 10, speed: 12, type: "ground",  moves: ["scratch", "roar", "tackle"],               ai: "simple" },
        { name: "オウギワシ",             src: "assets/images/enemy_10.png", rank: 1, hp: 60,  attack: 14, defense: 8,  speed: 16, type: "wind",    moves: ["gust", "scratch"],                         ai: "simple" },
        { name: "インペリアルマンモス",   src: "assets/images/enemy_11.png", rank: 1, hp: 65,  attack: 14, defense: 14, speed: 6,  type: "ground",  moves: ["tackle", "rock_throw"],                    ai: "simple" },
        { name: "プルサウルス",           src: "assets/images/enemy_07.png", rank: 1, hp: 60,  attack: 16, defense: 12, speed: 8,  type: "water",   moves: ["tackle", "water_shot", "scratch"],         ai: "simple" },

        // --- ランク2：恐竜・伝説の幻獣 ---
        { name: "エラスモサウルス",       src: "assets/images/enemy_12.png", rank: 2, hp: 80,  attack: 18, defense: 15, speed: 10, type: "water",   moves: ["water_shot", "tackle", "guard"],           ai: "normal" },
        { name: "ケツァルコアトル",       src: "assets/images/enemy_05.png", rank: 2, hp: 85,  attack: 20, defense: 14, speed: 16, type: "wind",    moves: ["gust", "scratch", "roar"],                 ai: "normal" },
        { name: "リントヴルム",           src: "assets/images/enemy_06.png", rank: 2, hp: 90,  attack: 22, defense: 16, speed: 12, type: "fire",    moves: ["fire_breath", "scratch", "power_up"],      ai: "normal" },
        { name: "蜃（しん）",             src: "assets/images/enemy_15.png", rank: 2, hp: 90,  attack: 18, defense: 18, speed: 12, type: "water",   moves: ["water_shot", "guard", "tackle"],           ai: "normal" },
        { name: "クエレブレ",             src: "assets/images/enemy_21.png", rank: 2, hp: 95,  attack: 20, defense: 16, speed: 14, type: "fire",    moves: ["fire_breath", "scratch", "roar"],          ai: "normal" },
        { name: "ペルーダ",               src: "assets/images/enemy_25.png", rank: 2, hp: 100, attack: 22, defense: 18, speed: 10, type: "ground",  moves: ["rock_throw", "tackle", "power_up"],        ai: "normal" },
        { name: "ティラノサウルス",       src: "assets/images/enemy_17.png", rank: 2, hp: 110, attack: 25, defense: 18, speed: 15, type: "ground",  moves: ["scratch", "rock_throw", "roar"],           ai: "normal" },
        { name: "ヒュドラー",             src: "assets/images/enemy_19.png", rank: 2, hp: 120, attack: 20, defense: 20, speed: 8,  type: "water",   moves: ["water_shot", "scratch", "guard", "heal"],  ai: "normal" },

        // --- ランク3：強力なドラゴン・英雄 ---
        { name: "イルルヤンカシュ",       src: "assets/images/enemy_13.png", rank: 3, hp: 130, attack: 26, defense: 20, speed: 16, type: "thunder", moves: ["thunder_fang", "scratch", "power_up", "guard"],     ai: "normal" },
        { name: "ベーオウルフ・ドラゴン", src: "assets/images/enemy_14.png", rank: 3, hp: 135, attack: 28, defense: 22, speed: 14, type: "fire",    moves: ["fire_breath", "flame_storm", "roar"],              ai: "normal" },
        { name: "聖ゲオルギウス・ドラゴン", src: "assets/images/enemy_16.png", rank: 3, hp: 140, attack: 24, defense: 26, speed: 12, type: "none",  moves: ["dragon_claw", "guard", "power_up", "heal"],        ai: "normal" },
        { name: "フェルニゲシュ",         src: "assets/images/enemy_20.png", rank: 3, hp: 145, attack: 28, defense: 20, speed: 18, type: "fire",    moves: ["flame_storm", "fire_breath", "roar"],              ai: "normal" },
        { name: "ヴイーヴル",             src: "assets/images/enemy_22.png", rank: 3, hp: 150, attack: 26, defense: 24, speed: 14, type: "wind",    moves: ["gust", "hurricane", "power_up"],                   ai: "normal" },
        { name: "レインボーサーペント",   src: "assets/images/enemy_23.png", rank: 3, hp: 155, attack: 24, defense: 22, speed: 16, type: "water",   moves: ["water_shot", "aqua_storm", "guard"],               ai: "normal" },
        { name: "ムシュフシュ",           src: "assets/images/enemy_24.png", rank: 3, hp: 160, attack: 30, defense: 20, speed: 14, type: "thunder", moves: ["thunder_fang", "thunder_storm", "scratch"],         ai: "normal" },
        { name: "ワイヴァーン",           src: "assets/images/enemy_26.png", rank: 3, hp: 165, attack: 28, defense: 22, speed: 20, type: "wind",    moves: ["hurricane", "gust", "roar", "guard"],              ai: "normal" },
        { name: "ヘラクレス",             src: "assets/images/enemy_27.png", rank: 3, hp: 180, attack: 32, defense: 24, speed: 16, type: "none",    moves: ["dragon_claw", "power_up", "tackle", "guard"],      ai: "normal" },

        // --- ランク4：神・魔王クラス ---（特訓済みLv15前提で調整）
        { name: "アジダハーカ",           src: "assets/images/enemy_28.png", rank: 4, hp: 170, attack: 34, defense: 26, speed: 18, type: "fire",    moves: ["flame_storm", "fire_breath", "power_up", "guard"],       ai: "smart" },
        { name: "ヴリトラ",               src: "assets/images/enemy_30.png", rank: 4, hp: 185, attack: 32, defense: 30, speed: 16, type: "ground",  moves: ["earthquake", "rock_throw", "iron_wall", "heal"],         ai: "smart" },
        { name: "シヴァ",                 src: "assets/images/enemy_18.png", rank: 4, hp: 210, attack: 35, defense: 24, speed: 22, type: "fire",    moves: ["full_burst", "flame_storm", "power_up", "roar"],         ai: "smart" },
        { name: "ゼウス",                 src: "assets/images/enemy_29.png", rank: 4, hp: 240, attack: 36, defense: 28, speed: 24, type: "thunder", moves: ["thunder_storm", "thunder_fang", "guard", "power_up"],    ai: "smart" },
        { name: "レヴィアタン",           src: "assets/images/enemy_31.png", rank: 4, hp: 230, attack: 40, defense: 32, speed: 14, type: "water",   moves: ["aqua_storm", "water_shot", "iron_wall", "heal"],         ai: "smart" },

        // --- ランク5：神竜クラス ---（裏カップ全クリ＋特訓済みLv25前提で調整）
        { name: "ラードーン",             src: "assets/images/enemy_32.png", rank: 5, hp: 260, attack: 36, defense: 34, speed: 16, type: "ground",   moves: ["earthquake", "rock_throw", "iron_wall", "heal"],              ai: "smart" },
        { name: "ピュートーン",           src: "assets/images/enemy_33.png", rank: 5, hp: 240, attack: 34, defense: 28, speed: 20, type: "water",    moves: ["flood", "water_shot", "guard", "heal"],                      ai: "smart" },
        { name: "ヤマタノオロチ",         src: "assets/images/enemy_34.png", rank: 5, hp: 280, attack: 42, defense: 24, speed: 18, type: "fire",     moves: ["seven_flame", "flame_storm", "power_up", "roar"],            ai: "smart" },
        { name: "バハムート",             src: "assets/images/enemy_35.png", rank: 5, hp: 300, attack: 44, defense: 36, speed: 22, type: "none",     moves: ["dragon_blade", "dragon_claw", "power_up", "guard"],          ai: "smart" },
        { name: "黙示録の赤い竜",         src: "assets/images/enemy_36.png", rank: 5, hp: 320, attack: 48, defense: 28, speed: 20, type: "fire",     moves: ["seven_flame", "full_burst", "power_up", "roar"],             ai: "smart" },
        { name: "ダークファイヤードレイク", src: "assets/images/enemy_37.png", rank: 5, hp: 280, attack: 46, defense: 30, speed: 28, type: "fire",   moves: ["dark_breath", "flame_storm", "power_up", "guard"],           ai: "smart" },
        { name: "ダーク応龍",             src: "assets/images/enemy_38.png", rank: 5, hp: 300, attack: 38, defense: 36, speed: 22, type: "water",    moves: ["dark_breath", "flood", "iron_wall", "heal"],                 ai: "smart" }
    ],

    // ==========================================
    //  7. 大会（カップ）リスト
    // ==========================================
    cups: [
        { id: 1, name: "ビギナー杯",       desc: "まずはここから！ 猛獣たちとの戦い",              enemyRanks: [1, 1, 1], unlockLevel: 1,  rewardExp: 20,   rewardGold: 30  },
        { id: 2, name: "ブロンズ杯",        desc: "古代の恐竜や幻獣が登場！",                     enemyRanks: [1, 2, 2], unlockLevel: 5,  rewardExp: 30,   rewardGold: 60  },
        { id: 3, name: "シルバー杯",        desc: "世界中のドラゴンが集結！",                     enemyRanks: [2, 3, 3], unlockLevel: 10, rewardExp: 50,   rewardGold: 100 },
        { id: 4, name: "ゴールド杯",        desc: "神話級の怪物に挑め！",                         enemyRanks: [3, 3, 4], unlockLevel: 15, rewardExp: 80,   rewardGold: 150 },
        { id: 5, name: "最強王トーナメント",  desc: "真の最強を決める 最終決戦！",                   enemyRanks: [4, 4, 4], unlockLevel: 20, rewardExp: 200,  rewardGold: 300 },

        // --- 裏カップ（ステータス1.3倍＋AI昇格）---
        { id: 6,  name: "裏ビギナー杯",      desc: "真の猛獣たちが 目を覚ました！",                  enemyRanks: [1, 1, 1], mirror: true, statMultiplier: 1.3, rewardExp: 30,  rewardGold: 50  },
        { id: 7,  name: "裏ブロンズ杯",       desc: "真の恐竜と幻獣が 再び襲来！",                    enemyRanks: [1, 2, 2], mirror: true, statMultiplier: 1.3, rewardExp: 50,  rewardGold: 80  },
        { id: 8,  name: "裏シルバー杯",       desc: "真のドラゴンたちが 本気を見せる！",              enemyRanks: [2, 3, 3], mirror: true, statMultiplier: 1.3, rewardExp: 80,  rewardGold: 120 },
        { id: 9,  name: "裏ゴールド杯",       desc: "真の神話の怪物が 全力で挑む！",                  enemyRanks: [3, 3, 4], mirror: true, statMultiplier: 1.3, rewardExp: 120, rewardGold: 200 },
        { id: 10, name: "裏最強王トーナメント", desc: "裏の最強王を決める 死闘！",                      enemyRanks: [4, 4, 4], mirror: true, statMultiplier: 1.3, rewardExp: 250, rewardGold: 400 },

        // --- 神竜杯（新規ランク5＋ダークミラーボス）---
        { id: 11, name: "神竜杯",             desc: "伝説の神竜と 闇の自分自身に挑め！",              enemyRanks: [5, 5, 5], darkMirrorBoss: true, rewardExp: 500, rewardGold: 1000 }
    ],

    // ==========================================
    //  8. ストーリーテキスト
    // ==========================================
    cupStories: {
        1: {
            intro: "森の奥に 強い動物たちが すんでいるらしい……\nキミのドラゴンで 勝てるかな？",
            clear: "やった！ 森のチャンピオンだ！\nでも もっと強い敵が 待っているぞ……"
        },
        2: {
            intro: "大昔の恐竜と 伝説の幻獣が\n目を覚ました！\n覚悟はいいか？",
            clear: "すごい！ 恐竜たちにも勝った！\n次は世界中のドラゴンが相手だ！"
        },
        3: {
            intro: "世界中からドラゴンたちが\n集まってきた！\n最強の竜は誰だ？",
            clear: "世界中のドラゴンを倒した！\n残るは神話の怪物たちだけだ……"
        },
        4: {
            intro: "ここから先は 神話の世界……\n神々や魔王がキミを待っている！\n負けるな！",
            clear: "神話の怪物にも勝った！\nでも真の戦いは まだ終わっていない……"
        },
        5: {
            intro: "ついに最終決戦！\n最強の神々と決着をつけろ！\nすべての力を出しきれ！",
            clear: "おめでとう！！\nキミこそ真の最強王だ！\n……しかし、闇の気配が 近づいている……"
        },
        6: {
            intro: "最強王を倒したキミの前に\n「真」の姿を取り戻した猛獣たちが 立ちはだかる！",
            clear: "真の猛獣を倒した！\nだが もっと強い「真」の敵が 待っている……"
        },
        7: {
            intro: "真の力を解放した恐竜と幻獣……\nこれが本当の実力だ！",
            clear: "真の恐竜を打ち破った！\nまだ先は 長いぞ……"
        },
        8: {
            intro: "世界中の真のドラゴンたちが\n本気の力で 立ちはだかる！",
            clear: "真のドラゴンにも勝った！\n残るは 神話の真の姿……"
        },
        9: {
            intro: "封印が解かれた 真の神話の怪物たち……\nその力は 以前とは比べものに ならない！",
            clear: "真の神話の怪物も倒した！\nあと一歩で 裏の世界を制覇できる！"
        },
        10: {
            intro: "裏の世界の最終決戦！\n真の最強王を決める 最後の戦いだ！",
            clear: "裏の世界を すべて制覇した！\n……その時、空が 闇に包まれた……\n伝説の神竜が 目を覚ます！"
        },
        11: {
            intro: "世界の果てに眠る 伝説の神竜たち……\nそして 闇に染まった もうひとりのキミが\n最後の敵として 立ちはだかる！\nこれが 本当の最終決戦だ！",
            clear: "すべての戦いに 勝利した！！\n闇のドラゴンを打ち破り\nキミは 真の伝説となった！\nおめでとう！！ 真の最強王！！"
        }
    },

    // ==========================================
    //  9. 称号リスト
    // ==========================================
    titles: {
        0:  { name: "かけだしドラゴン使い", color: "#ccc" },
        1:  { name: "ビギナー チャンピオン", color: "#2ecc71" },
        2:  { name: "ブロンズ チャンピオン", color: "#cd7f32" },
        3:  { name: "シルバー チャンピオン", color: "#c0c0c0" },
        4:  { name: "ゴールド チャンピオン", color: "#ffd700" },
        5:  { name: "最強王", color: "#ff4444" },
        6:  { name: "裏ビギナー チャンピオン", color: "#1a8a4a" },
        7:  { name: "裏ブロンズ チャンピオン", color: "#8b4513" },
        8:  { name: "裏シルバー チャンピオン", color: "#808080" },
        9:  { name: "裏ゴールド チャンピオン", color: "#daa520" },
        10: { name: "裏最強王", color: "#cc0000" },
        11: { name: "真の最強王", color: "#9900ff" }
    },

    // ==========================================
    //  10. とっくんモード設定（ステータス別の出題）
    // ==========================================
    trainingConfig: {
        attack: {
            label: "岩砕き（攻撃 UP）",
            icon: "🪨",
            color: "#e67e22",
            questionTypes: ["addition", "subtraction"],
            maxNum: 15,
            description: "大きな数の計算でパワーUP！"
        },
        speed: {
            label: "猛ダッシュ（素早さ UP）",
            icon: "💨",
            color: "#3498db",
            questionTypes: ["makeTen", "doubles", "addition"],
            maxNum: 10,
            description: "素早く答えてスピードUP！"
        },
        defense: {
            label: "めいそう（防御 UP）",
            icon: "🛡️",
            color: "#9b59b6",
            questionTypes: ["fillBlankAdd", "fillBlankSub", "compare"],
            maxNum: 15,
            description: "じっくり考えて防御UP！"
        },
        hp: {
            label: "体力UP（HP UP）",
            icon: "❤️",
            color: "#2ecc71",
            questionTypes: ["addCarry", "subBorrow", "threeNum"],
            maxNum: 18,
            description: "むずかしい問題で体力UP！"
        }
    },
    trainingMaxQuestions: 5,
    // 正解数 → ステータス上昇量
    trainingRewards: { 5: 3, 4: 2, 3: 1, 2: 1, 1: 0, 0: 0 },

    // ==========================================
    //  11. しごとモード設定
    // ==========================================
    workConfig: {
        timeAttack: {
            duration: 60,       // 秒
            baseReward: 10,     // 1問あたりのゴールド
            comboBonus: 5,      // 最大コンボ × この値がボーナス
            questionTypes: ["addition", "subtraction", "doubles", "makeTen", "fillBlankAdd"],
            maxNum: 15
        }
    },

    // デイリーミッションプール
    missionPool: {
        easy: [
            { id: "add_10",      name: "足し算マスター",          desc: "足し算を 10問 正解せよ",              type: "addition",     target: 10, timeLimit: 0,  reward: 50  },
            { id: "sub_8",       name: "引き算チャレンジ",        desc: "引き算を 8問 正解せよ",              type: "subtraction",  target: 8,  timeLimit: 0,  reward: 50  },
            { id: "solve_20",    name: "たくさん解こう！",         desc: "問題を 合計20問 解け",               type: "any",          target: 20, timeLimit: 0,  reward: 40  }
        ],
        normal: [
            { id: "make_ten_5",  name: "10を作れ！",              desc: "「10をつくろう」を 5問 正解",         type: "makeTen",      target: 5,  timeLimit: 0,  reward: 80  },
            { id: "blank_5",     name: "穴うめ名人",              desc: "穴うめ問題を 5問 正解せよ",           type: "fillBlank",    target: 5,  timeLimit: 0,  reward: 70  },
            { id: "fast_5",      name: "早解き王",                desc: "5問を 30秒以内に 全問正解",          type: "speed",        target: 5,  timeLimit: 30, reward: 120 }
        ],
        hard: [
            { id: "carry_6",     name: "くり上がりの達人",         desc: "くり上がり足し算を 6問 正解",         type: "addCarry",     target: 6,  timeLimit: 0,  reward: 100 },
            { id: "perfect_10",  name: "パーフェクト！",           desc: "10問 連続 正解せよ",                 type: "any",          target: 10, timeLimit: 0,  reward: 150, needsConsecutive: true },
            { id: "combo_8",     name: "コンボマスター",           desc: "タイムアタックで 8コンボ達成",        type: "combo",        target: 8,  timeLimit: 0,  reward: 130 }
        ]
    },

    // ==========================================
    //  12. ショップ アイテム定義
    // ==========================================
    shopItems: {
        herb:        { name: "やくそう",         price: 30,  maxOwn: 5, category: "item", description: "HPを 20 回復する",              effect: { type: "heal", value: 20 }      },
        super_herb:  { name: "すごいやくそう",    price: 80,  maxOwn: 3, category: "item", description: "HPを 50 回復する",              effect: { type: "heal", value: 50 }      },
        power_seed:  { name: "力のもと",          price: 50,  maxOwn: 3, category: "item", description: "1バトル 攻撃力 UP",            effect: { type: "buff", stat: "attack", stages: 1 }   },
        speed_seed:  { name: "速さのもと",        price: 50,  maxOwn: 3, category: "item", description: "1バトル 素早さ UP",            effect: { type: "buff", stat: "speed", stages: 1 }    },
        guard_seed:  { name: "守りのもと",        price: 50,  maxOwn: 3, category: "item", description: "1バトル 防御力 UP",            effect: { type: "buff", stat: "defense", stages: 1 }  },
        revive:      { name: "元気のカケラ",      price: 200, maxOwn: 1, category: "item", description: "HPが0で HP半分で復活",         effect: { type: "revive", percent: 50 }  },
        full_heal:   { name: "万能やく",          price: 150, maxOwn: 1, category: "item", description: "HPを 全回復する",              effect: { type: "fullHeal" }             }
    },

    // 特別アイテム
    shopSpecial: {
        rare_candy:  { name: "ふしぎなアメ",      price: 800,  maxOwn: 99, category: "special", description: "経験値を 100 もらえる" }
    },

    // ==========================================
    //  13. 旧互換：ステージ設定（とっくんで使用）
    // ==========================================
    stages: {
        1: { name: "カンタン",    type: "addition",    maxNum: 10 },
        2: { name: "ふつう",      type: "subtraction",  maxNum: 15 },
        3: { name: "むずかしい",  type: "addCarry",     maxNum: 20 }
    },

    // 大会別ステージ設定（しごとモードでも参照）
    cupStages: {
        1: {
            1: { type: ["addition", "doubles"],              maxNum: 10 },
            2: { type: ["addition", "subtraction"],          maxNum: 10 },
            3: { type: ["addition", "subtraction", "makeTen"], maxNum: 10 }
        },
        2: {
            1: { type: ["addition", "subtraction"],              maxNum: 15 },
            2: { type: ["addition", "subtraction", "fillBlankAdd"], maxNum: 15 },
            3: { type: ["fillBlankAdd", "fillBlankSub", "doubles"], maxNum: 20 }
        },
        3: {
            1: { type: ["addCarry", "subtraction"],             maxNum: 18 },
            2: { type: ["addCarry", "subBorrow", "compare"],    maxNum: 18 },
            3: { type: ["subBorrow", "compare", "fillBlankAdd"], maxNum: 20 }
        },
        4: {
            1: { type: ["addCarry", "subBorrow", "threeNum"],       maxNum: 20 },
            2: { type: ["threeNum", "fillBlankSub", "compare"],     maxNum: 20 },
            3: { type: ["addCarry", "subBorrow", "threeNum", "fillBlankSub"], maxNum: 20 }
        },
        5: {
            1: { type: ["addCarry", "subBorrow", "threeNum", "compare"],           maxNum: 20 },
            2: { type: ["threeNum", "fillBlankAdd", "fillBlankSub", "subBorrow"],  maxNum: 20 },
            3: { type: ["addCarry", "subBorrow", "threeNum", "fillBlankAdd", "fillBlankSub", "compare"], maxNum: 20 }
        },
        // 裏カップ: 最強王と同じ問題レベル
        6:  { 1: { type: ["addCarry", "subBorrow", "threeNum"], maxNum: 20 }, 2: { type: ["threeNum", "fillBlankSub", "compare"], maxNum: 20 }, 3: { type: ["addCarry", "subBorrow", "threeNum", "fillBlankAdd"], maxNum: 20 } },
        7:  { 1: { type: ["addCarry", "subBorrow", "threeNum"], maxNum: 20 }, 2: { type: ["threeNum", "fillBlankSub", "compare"], maxNum: 20 }, 3: { type: ["addCarry", "subBorrow", "threeNum", "fillBlankSub"], maxNum: 20 } },
        8:  { 1: { type: ["addCarry", "subBorrow", "threeNum", "compare"], maxNum: 20 }, 2: { type: ["threeNum", "fillBlankAdd", "fillBlankSub"], maxNum: 20 }, 3: { type: ["addCarry", "subBorrow", "threeNum", "fillBlankAdd", "fillBlankSub", "compare"], maxNum: 20 } },
        9:  { 1: { type: ["addCarry", "subBorrow", "threeNum", "compare"], maxNum: 20 }, 2: { type: ["threeNum", "fillBlankAdd", "fillBlankSub", "subBorrow"], maxNum: 20 }, 3: { type: ["addCarry", "subBorrow", "threeNum", "fillBlankAdd", "fillBlankSub", "compare"], maxNum: 20 } },
        10: { 1: { type: ["addCarry", "subBorrow", "threeNum", "compare"], maxNum: 20 }, 2: { type: ["threeNum", "fillBlankAdd", "fillBlankSub", "subBorrow"], maxNum: 20 }, 3: { type: ["addCarry", "subBorrow", "threeNum", "fillBlankAdd", "fillBlankSub", "compare"], maxNum: 20 } },
        // 神竜杯: 全種フルコース
        11: { 1: { type: ["addCarry", "subBorrow", "threeNum", "fillBlankAdd", "fillBlankSub", "compare"], maxNum: 20 }, 2: { type: ["addCarry", "subBorrow", "threeNum", "fillBlankAdd", "fillBlankSub", "compare"], maxNum: 20 }, 3: { type: ["addCarry", "subBorrow", "threeNum", "fillBlankAdd", "fillBlankSub", "compare"], maxNum: 20 } }
    }
};
