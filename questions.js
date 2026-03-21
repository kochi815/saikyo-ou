// questions.js
// 算数の問題と、3択の選択肢を作成するファイル
// ★Step 8 で大幅拡張：8種類の問題タイプ対応

const QuestionGenerator = {

    // ==========================================
    //  メイン機能：ステージ設定に合わせて問題を作る
    //  stageId は旧互換用。cupId があれば大会別設定を使う
    // ==========================================
    generate: function(stageId, cupIdOrConfig) {
        // 大会別の設定を取得
        let stageConfig;
        // 第2引数がオブジェクトの場合、直接configとして使用（特訓モード等）
        if (cupIdOrConfig && typeof cupIdOrConfig === 'object' && cupIdOrConfig.type) {
            stageConfig = cupIdOrConfig;
        } else if (cupIdOrConfig && GameConfig.cupStages && GameConfig.cupStages[cupIdOrConfig]) {
            const cupStages = GameConfig.cupStages[cupIdOrConfig];
            stageConfig = cupStages[stageId] || cupStages[1];
        } else {
            stageConfig = GameConfig.stages[stageId] || GameConfig.stages[1];
        }

        // 問題タイプがリスト（配列）の場合、ランダムに1つ選ぶ
        let problemType = stageConfig.type;
        if (Array.isArray(problemType)) {
            problemType = problemType[Math.floor(Math.random() * problemType.length)];
        }

        const maxNum = stageConfig.maxNum || 10;
        let questionData = {};

        // 問題タイプごとに生成
        switch (problemType) {
            case "addition":
                questionData = this.makeAddition(maxNum);
                break;
            case "subtraction":
                questionData = this.makeSubtraction(maxNum);
                break;
            case "addCarry":
                questionData = this.makeAddCarry();
                break;
            case "subBorrow":
                questionData = this.makeSubBorrow();
                break;
            case "fillBlankAdd":
                questionData = this.makeFillBlankAdd(maxNum);
                break;
            case "fillBlankSub":
                questionData = this.makeFillBlankSub(maxNum);
                break;
            case "compare":
                questionData = this.makeCompare(maxNum);
                break;
            case "threeNum":
                questionData = this.makeThreeNum(maxNum);
                break;
            case "doubles":
                questionData = this.makeDoubles(maxNum);
                break;
            case "makeTen":
                questionData = this.makeMakeTen();
                break;
            default:
                questionData = this.makeAddition(maxNum);
                break;
        }

        // 比較問題以外は3択を生成
        if (problemType !== "compare") {
            questionData.options = this.makeOptions(questionData.answer);
        }

        return questionData;
    },

    // ==========================================
    //  足し算 (A + B = ?)
    // ==========================================
    makeAddition: function(maxNum) {
        const a = Math.floor(Math.random() * (maxNum - 1)) + 1;
        const b = Math.floor(Math.random() * (maxNum - a)) + 1;
        return {
            text: `${a} + ${b} = ?`,
            answer: a + b
        };
    },

    // ==========================================
    //  引き算 (A - B = ?)
    // ==========================================
    makeSubtraction: function(maxNum) {
        const a = Math.floor(Math.random() * (maxNum - 1)) + 2;
        const b = Math.floor(Math.random() * (a - 1)) + 1;
        return {
            text: `${a} - ${b} = ?`,
            answer: a - b
        };
    },

    // ==========================================
    //  繰り上がり足し算 (例: 7 + 8 = 15)
    //  答えが11〜18になる問題
    // ==========================================
    makeAddCarry: function() {
        // A: 2〜9, B: 答えが10を超えるように
        const a = Math.floor(Math.random() * 8) + 2; // 2〜9
        const minB = Math.max(2, 11 - a); // 答えが11以上になるB の最小値
        const maxB = Math.min(9, 18 - a); // 答えが18以下になるBの最大値
        const b = Math.floor(Math.random() * (maxB - minB + 1)) + minB;
        return {
            text: `${a} + ${b} = ?`,
            answer: a + b
        };
    },

    // ==========================================
    //  繰り下がり引き算 (例: 15 - 8 = 7)
    //  被減数が11〜18、引く数で一の位を下回る
    // ==========================================
    makeSubBorrow: function() {
        const a = Math.floor(Math.random() * 8) + 11; // 11〜18
        const onesA = a % 10;
        // 引く数はonesAより大きい（繰り下がりが発生する）
        const minB = onesA + 1;
        const maxB = Math.min(9, a - 2); // 答えが2以上になるように
        if (minB > maxB) {
            // フォールバック
            return { text: `${a} - ${onesA} = ?`, answer: a - onesA };
        }
        const b = Math.floor(Math.random() * (maxB - minB + 1)) + minB;
        return {
            text: `${a} - ${b} = ?`,
            answer: a - b
        };
    },

    // ==========================================
    //  穴埋め足し算 (□ + B = C)
    // ==========================================
    makeFillBlankAdd: function(maxNum) {
        const answer = Math.floor(Math.random() * (maxNum - 2)) + 1; // □ の値
        const b = Math.floor(Math.random() * (maxNum - answer)) + 1;
        const total = answer + b;
        return {
            text: `□ + ${b} = ${total}`,
            answer: answer
        };
    },

    // ==========================================
    //  穴埋め引き算 (A - □ = C)
    // ==========================================
    makeFillBlankSub: function(maxNum) {
        const a = Math.floor(Math.random() * (maxNum - 2)) + 3; // 3以上
        const answer = Math.floor(Math.random() * (a - 1)) + 1; // □ の値
        const result = a - answer;
        return {
            text: `${a} - □ = ${result}`,
            answer: answer
        };
    },

    // ==========================================
    //  比較問題 (A ○ B、どっちが大きい？)
    //  選択肢が特殊（>, <, = の3択）
    // ==========================================
    makeCompare: function(maxNum) {
        // 2つの式を作って比較させる
        const a1 = Math.floor(Math.random() * maxNum) + 1;
        const a2 = Math.floor(Math.random() * (maxNum - a1)) + 1;
        const leftVal = a1 + a2;

        // 右辺を生成（同じ場合もある）
        const roll = Math.random();
        let rightVal;
        if (roll < 0.33) {
            rightVal = leftVal; // 同じ
        } else if (roll < 0.66) {
            rightVal = leftVal + Math.floor(Math.random() * 3) + 1; // 右が大きい
        } else {
            rightVal = Math.max(1, leftVal - Math.floor(Math.random() * 3) - 1); // 左が大きい
        }

        // 右辺を式にする（単純な数字で表示）
        let correctAnswer;
        if (leftVal > rightVal) {
            correctAnswer = 1; // >
        } else if (leftVal < rightVal) {
            correctAnswer = 2; // <
        } else {
            correctAnswer = 3; // =
        }

        return {
            text: `${a1}+${a2} ○ ${rightVal}`,
            answer: correctAnswer,
            options: [1, 2, 3],
            // UIで表示するためのラベル
            optionLabels: [">", "<", "="]
        };
    },

    // ==========================================
    //  3つの数の足し算 (A + B + C = ?)
    // ==========================================
    makeThreeNum: function(maxNum) {
        const limit = Math.min(maxNum, 20);
        const a = Math.floor(Math.random() * Math.floor(limit / 3)) + 1;
        const b = Math.floor(Math.random() * Math.floor((limit - a) / 2)) + 1;
        const maxC = Math.min(limit - a - b, 9);
        const c = Math.floor(Math.random() * maxC) + 1;
        return {
            text: `${a} + ${b} + ${c} = ?`,
            answer: a + b + c
        };
    },

    // ==========================================
    //  同じ数の足し算（ダブルス） (A + A = ?)
    // ==========================================
    makeDoubles: function(maxNum) {
        const half = Math.floor(maxNum / 2);
        const a = Math.floor(Math.random() * half) + 1;
        return {
            text: `${a} + ${a} = ?`,
            answer: a + a
        };
    },

    // ==========================================
    //  10をつくろう！ (A + □ = 10)
    // ==========================================
    makeMakeTen: function() {
        const a = Math.floor(Math.random() * 9) + 1; // 1〜9
        return {
            text: `${a} + □ = 10`,
            answer: 10 - a
        };
    },

    // ==========================================
    //  3択の選択肢を作る機能
    // ==========================================
    makeOptions: function(correctAnswer) {
        const options = new Set();
        options.add(correctAnswer);

        while (options.size < 3) {
            const offset = Math.floor(Math.random() * 7) - 3;
            const dummy = correctAnswer + offset;
            if (dummy >= 0 && dummy !== correctAnswer) {
                options.add(dummy);
            }
        }

        return Array.from(options).sort(() => Math.random() - 0.5);
    }
};
