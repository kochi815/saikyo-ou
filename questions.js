// questions.js
// 算数の問題と、3択の選択肢を作成するファイル
// 小学校5年生向け：四則演算・小数・分数・穴あき算・計算順序

const QuestionGenerator = {

    // ==========================================
    //  メイン機能：設定に合わせて問題を作る
    // ==========================================
    generate: function(stageId, cupIdOrConfig) {
        let stageConfig;
        if (cupIdOrConfig && typeof cupIdOrConfig === 'object' && cupIdOrConfig.type) {
            stageConfig = cupIdOrConfig;
        } else if (cupIdOrConfig && GameConfig.cupStages && GameConfig.cupStages[cupIdOrConfig]) {
            const cupStages = GameConfig.cupStages[cupIdOrConfig];
            stageConfig = cupStages[stageId] || cupStages[1];
        } else {
            stageConfig = GameConfig.stages[stageId] || GameConfig.stages[1];
        }

        let problemType = stageConfig.type;
        if (Array.isArray(problemType)) {
            problemType = problemType[Math.floor(Math.random() * problemType.length)];
        }

        const maxNum = stageConfig.maxNum || 100;
        let questionData = {};

        switch (problemType) {
            case "addition":
                questionData = this.makeAddition(maxNum);
                break;
            case "subtraction":
                questionData = this.makeSubtraction(maxNum);
                break;
            case "multiplication":
                questionData = this.makeMultiplication(maxNum);
                break;
            case "division":
                questionData = this.makeDivision(maxNum);
                break;
            case "decimalAdd":
                questionData = this.makeDecimalAdd();
                break;
            case "decimalSub":
                questionData = this.makeDecimalSub();
                break;
            case "decimalMul":
                questionData = this.makeDecimalMul();
                break;
            case "fractionAdd":
                questionData = this.makeFractionAdd();
                break;
            case "fractionSub":
                questionData = this.makeFractionSub();
                break;
            case "fillBlankAdd":
                questionData = this.makeFillBlankAdd(maxNum);
                break;
            case "fillBlankSub":
                questionData = this.makeFillBlankSub(maxNum);
                break;
            case "fillBlankMul":
                questionData = this.makeFillBlankMul(maxNum);
                break;
            case "fillBlankDiv":
                questionData = this.makeFillBlankDiv(maxNum);
                break;
            case "orderOps":
                questionData = this.makeOrderOps();
                break;
            case "compare":
                questionData = this.makeCompare();
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
    //  ヘルパー：ランダム整数
    // ==========================================
    _randInt: function(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    },

    // ==========================================
    //  足し算 (3桁+3桁)
    // ==========================================
    makeAddition: function(maxNum) {
        const limit = Math.min(maxNum, 999);
        const a = this._randInt(10, limit);
        const b = this._randInt(10, limit);
        return { text: `${a} + ${b} = ?`, answer: a + b };
    },

    // ==========================================
    //  引き算 (3桁−3桁、答えは正)
    // ==========================================
    makeSubtraction: function(maxNum) {
        const limit = Math.min(maxNum, 999);
        let a = this._randInt(20, limit);
        let b = this._randInt(10, a - 1);
        return { text: `${a} - ${b} = ?`, answer: a - b };
    },

    // ==========================================
    //  掛け算 (2桁×1〜2桁)
    // ==========================================
    makeMultiplication: function(maxNum) {
        const a = this._randInt(2, Math.min(maxNum, 99));
        const bMax = a >= 10 ? 19 : Math.min(maxNum, 99);
        const b = this._randInt(2, bMax);
        return { text: `${a} × ${b} = ?`, answer: a * b };
    },

    // ==========================================
    //  割り算 (割り切れる)
    // ==========================================
    makeDivision: function(maxNum) {
        const b = this._randInt(2, 12);
        const quotient = this._randInt(2, Math.min(Math.floor(maxNum / b), 50));
        const a = b * quotient;
        return { text: `${a} ÷ ${b} = ?`, answer: quotient };
    },

    // ==========================================
    //  小数の足し算 (例: 2.3 + 1.8 = ?)
    // ==========================================
    makeDecimalAdd: function() {
        const a = (this._randInt(11, 99) / 10); // 1.1 ~ 9.9
        const b = (this._randInt(11, 99) / 10);
        const answer = Math.round((a + b) * 10) / 10;
        return { text: `${a.toFixed(1)} + ${b.toFixed(1)} = ?`, answer: answer };
    },

    // ==========================================
    //  小数の引き算 (例: 5.6 - 2.3 = ?)
    // ==========================================
    makeDecimalSub: function() {
        let a = (this._randInt(30, 99) / 10); // 3.0 ~ 9.9
        let b = (this._randInt(11, Math.floor(a * 10) - 1) / 10);
        const answer = Math.round((a - b) * 10) / 10;
        return { text: `${a.toFixed(1)} - ${b.toFixed(1)} = ?`, answer: answer };
    },

    // ==========================================
    //  小数×整数 (例: 2.5 × 4 = ?)
    // ==========================================
    makeDecimalMul: function() {
        const a = (this._randInt(11, 49) / 10); // 1.1 ~ 4.9
        const b = this._randInt(2, 9);
        const answer = Math.round(a * b * 10) / 10;
        return { text: `${a.toFixed(1)} × ${b} = ?`, answer: answer };
    },

    // ==========================================
    //  分数の足し算 (通分あり)
    //  例: 1/3 + 1/4 = 7/12
    //  答えは「分子」で出題（分母を表示）
    // ==========================================
    makeFractionAdd: function() {
        // 分母のペアを用意（通分しやすいもの）
        const pairs = [
            [2, 3], [2, 5], [3, 4], [3, 5], [4, 5],
            [2, 7], [3, 7], [4, 7], [5, 6], [3, 8]
        ];
        const [d1, d2] = pairs[this._randInt(0, pairs.length - 1)];
        const n1 = this._randInt(1, d1 - 1);
        const n2 = this._randInt(1, d2 - 1);
        const lcm = this._lcm(d1, d2);
        const answerNumerator = n1 * (lcm / d1) + n2 * (lcm / d2);
        // 約分
        const g = this._gcd(answerNumerator, lcm);
        const finalN = answerNumerator / g;
        const finalD = lcm / g;

        return {
            text: `${n1}/${d1} + ${n2}/${d2} = ?/${finalD}`,
            answer: finalN
        };
    },

    // ==========================================
    //  分数の引き算 (通分あり)
    //  例: 3/4 - 1/3 = 5/12
    // ==========================================
    makeFractionSub: function() {
        const pairs = [
            [2, 3], [2, 5], [3, 4], [3, 5], [4, 5],
            [2, 7], [3, 7], [4, 7], [5, 6], [3, 8]
        ];
        const [d1, d2] = pairs[this._randInt(0, pairs.length - 1)];
        const lcm = this._lcm(d1, d2);

        // a/d1 - b/d2 が正になるように
        let n1, n2, resultNumerator;
        do {
            n1 = this._randInt(1, d1 - 1);
            n2 = this._randInt(1, d2 - 1);
            resultNumerator = n1 * (lcm / d1) - n2 * (lcm / d2);
        } while (resultNumerator <= 0);

        const g = this._gcd(resultNumerator, lcm);
        const finalN = resultNumerator / g;
        const finalD = lcm / g;

        return {
            text: `${n1}/${d1} - ${n2}/${d2} = ?/${finalD}`,
            answer: finalN
        };
    },

    // ==========================================
    //  穴あき足し算 (□ + B = C)
    // ==========================================
    makeFillBlankAdd: function(maxNum) {
        const answer = this._randInt(10, Math.min(maxNum, 500));
        const b = this._randInt(10, Math.min(maxNum, 500));
        const total = answer + b;
        return { text: `□ + ${b} = ${total}`, answer: answer };
    },

    // ==========================================
    //  穴あき引き算 (A - □ = C)
    // ==========================================
    makeFillBlankSub: function(maxNum) {
        const a = this._randInt(30, Math.min(maxNum, 999));
        const answer = this._randInt(10, a - 10);
        const result = a - answer;
        return { text: `${a} - □ = ${result}`, answer: answer };
    },

    // ==========================================
    //  穴あき掛け算 (□ × B = C)
    // ==========================================
    makeFillBlankMul: function(maxNum) {
        const answer = this._randInt(2, Math.min(maxNum, 20));
        const b = this._randInt(2, 12);
        const product = answer * b;
        return { text: `□ × ${b} = ${product}`, answer: answer };
    },

    // ==========================================
    //  穴あき割り算 (A ÷ □ = C)
    // ==========================================
    makeFillBlankDiv: function(maxNum) {
        const answer = this._randInt(2, 12); // □ の値（割る数）
        const c = this._randInt(2, Math.min(Math.floor(maxNum / answer), 30));
        const a = answer * c;
        return { text: `${a} ÷ □ = ${c}`, answer: answer };
    },

    // ==========================================
    //  計算の順序（四則混合）
    //  例: 3 + 4 × 2 = ?
    // ==========================================
    makeOrderOps: function() {
        const patterns = [
            // a + b × c
            () => {
                const b = this._randInt(2, 9);
                const c = this._randInt(2, 9);
                const a = this._randInt(1, 20);
                return { text: `${a} + ${b} × ${c} = ?`, answer: a + b * c };
            },
            // a × b - c
            () => {
                const a = this._randInt(2, 9);
                const b = this._randInt(2, 9);
                const product = a * b;
                const c = this._randInt(1, product - 1);
                return { text: `${a} × ${b} - ${c} = ?`, answer: product - c };
            },
            // a × b + c × d (小さめの数)
            () => {
                const a = this._randInt(2, 5);
                const b = this._randInt(2, 5);
                const c = this._randInt(2, 5);
                const d = this._randInt(2, 5);
                return { text: `${a} × ${b} + ${c} × ${d} = ?`, answer: a * b + c * d };
            },
            // (a + b) × c
            () => {
                const a = this._randInt(2, 10);
                const b = this._randInt(2, 10);
                const c = this._randInt(2, 6);
                return { text: `(${a} + ${b}) × ${c} = ?`, answer: (a + b) * c };
            },
            // a - b ÷ c (割り切れる)
            () => {
                const c = this._randInt(2, 6);
                const quotient = this._randInt(2, 8);
                const b = c * quotient;
                const a = this._randInt(b, b + 20);
                return { text: `${a} - ${b} ÷ ${c} = ?`, answer: a - quotient };
            }
        ];

        const fn = patterns[this._randInt(0, patterns.length - 1)];
        return fn();
    },

    // ==========================================
    //  大小比較 (式 vs 式)
    // ==========================================
    makeCompare: function() {
        // 2つの計算式を作って比較
        const makeExpr = () => {
            const type = this._randInt(0, 2);
            if (type === 0) {
                const a = this._randInt(10, 50);
                const b = this._randInt(10, 50);
                return { text: `${a}+${b}`, val: a + b };
            } else if (type === 1) {
                const a = this._randInt(2, 12);
                const b = this._randInt(2, 12);
                return { text: `${a}×${b}`, val: a * b };
            } else {
                const a = this._randInt(30, 99);
                const b = this._randInt(1, a - 1);
                return { text: `${a}-${b}`, val: a - b };
            }
        };

        const left = makeExpr();
        let right;
        const roll = Math.random();
        if (roll < 0.33) {
            right = { text: String(left.val), val: left.val }; // 同じ値
        } else {
            right = makeExpr();
        }

        let correctAnswer;
        if (left.val > right.val) correctAnswer = 1;
        else if (left.val < right.val) correctAnswer = 2;
        else correctAnswer = 3;

        return {
            text: `${left.text} ○ ${right.text}`,
            answer: correctAnswer,
            options: [1, 2, 3],
            optionLabels: [">", "<", "="]
        };
    },

    // ==========================================
    //  数学ヘルパー
    // ==========================================
    _gcd: function(a, b) {
        a = Math.abs(a); b = Math.abs(b);
        while (b) { [a, b] = [b, a % b]; }
        return a;
    },

    _lcm: function(a, b) {
        return (a * b) / this._gcd(a, b);
    },

    // ==========================================
    //  3択の選択肢を作る機能
    // ==========================================
    makeOptions: function(correctAnswer) {
        const options = new Set();
        options.add(correctAnswer);

        // 答えの大きさに応じてダミーの幅を調整
        const range = Math.max(5, Math.ceil(Math.abs(correctAnswer) * 0.2));

        while (options.size < 3) {
            const offset = this._randInt(1, range) * (Math.random() < 0.5 ? 1 : -1);
            const dummy = correctAnswer + offset;
            if (dummy >= 0 && dummy !== correctAnswer) {
                // 小数の場合は丸める
                const rounded = Math.round(dummy * 10) / 10;
                if (rounded !== correctAnswer && rounded >= 0) {
                    options.add(rounded);
                }
            }
        }

        return Array.from(options).sort(() => Math.random() - 0.5);
    }
};