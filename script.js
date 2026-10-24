document.addEventListener('DOMContentLoaded', () => {
    // 定数・初期データ
    const DEFAULT_ROW_COUNT = 7;
    const MARK_POINTS = { 0: 5, 1: 4, 2: 3, 3: 2, 4: 1 }; // ◎:5, ◯:4, ▲:3, ☆:2, △:1
    
    // 指定の初期予想家名リスト
    const INITIAL_PREDICTORS = ['的中', 'ウマ', 'Maria', 'あやね', '絞り', '', ''];
    // 記事の初期値はすべて "--"
    const INITIAL_ARTICLES = ['--', '--', '--', '--', '--', '--', '--'];

    // 競馬の枠色・文字色の定義
    const FRAME_COLORS = {
        1: { bg: '#ffffff', color: '#000000' },
        2: { bg: '#000000', color: '#ffffff' },
        3: { bg: '#e60012', color: '#ffffff' },
        4: { bg: '#3388ff', color: '#ffffff' },
        5: { bg: '#ffcc00', color: '#ffffff' },
        6: { bg: '#339933', color: '#ffffff' },
        7: { bg: '#ff8800', color: '#ffffff' },
        8: { bg: '#ff66cc', color: '#ffffff' }
    };

    // 切り替え直前の状態（現在表示中のレース情報）を正確に保持する変数
    let currentRace1 = { place: '--', num: '--' };
    let currentRace2 = { place: '--', num: '--' };

    // 初期化実行
    initPredictTable('table-predict-1', 'btn-del-1');
    initPredictTable('table-predict-2', 'btn-del-2');
    initPaddockSection();
    setupEventListeners();

    // R番号ボタンの選択状態取得・設定ヘルパー関数
    function getSelectedRaceNum(gridId) {
        const activeBtn = document.querySelector(`#${gridId} .btn-rnum.active`);
        return activeBtn ? activeBtn.dataset.r : '--';
    }

    function setSelectedRaceNum(gridId, rVal) {
        const buttons = document.querySelectorAll(`#${gridId} .btn-rnum`);
        buttons.forEach(btn => {
            if (btn.dataset.r === String(rVal)) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
    }

    // テーブルの初期行構築
    function initPredictTable(tableId, delBtnId) {
        const tbody = document.querySelector(`#${tableId} tbody`);
        tbody.innerHTML = '';
        for (let i = 0; i < DEFAULT_ROW_COUNT; i++) {
            const tr = createRow(INITIAL_ARTICLES[i], INITIAL_PREDICTORS[i] || '');
            tbody.appendChild(tr);
        }
        updateDelButtonState(tableId, delBtnId);
    }

    // パドック点数の初期化
    function initPaddockSection() {
        const select = document.getElementById('paddock-horse-count');
        if (!select) return;
        select.innerHTML = '';
        for (let i = 5; i <= 18; i++) {
            const opt = document.createElement('option');
            opt.value = i;
            opt.textContent = `${i}頭`;
            select.appendChild(opt);
        }
        select.value = '18';
        updatePaddockTable(18, {});
    }

    // JRAの枠番割り当て規則計算関数
    function getFrameNumber(horseNum, totalHorses) {
        if (totalHorses <= 8) return horseNum;
        const base = Math.floor(totalHorses / 8);
        const remainder = totalHorses % 8;
        const frameCounts = new Array(8).fill(base);
        for (let i = 0; i < remainder; i++) {
            frameCounts[7 - i] += 1;
        }
        let currentCount = 0;
        for (let f = 0; f < 8; f++) {
            currentCount += frameCounts[f];
            if (horseNum <= currentCount) return f + 1;
        }
        return 8;
    }

    // パドック点数テーブルの動的生成
    function updatePaddockTable(totalHorses, savedScores = {}) {
        const tbody = document.querySelector('#table-paddock-score tbody');
        if (!tbody) return;
        tbody.innerHTML = '';

        const inputs = [];

        for (let i = 1; i <= totalHorses; i++) {
            const tr = document.createElement('tr');
            const frameNum = getFrameNumber(i, totalHorses);
            const style = FRAME_COLORS[frameNum] || FRAME_COLORS[1];
            const scoreVal = savedScores[i] !== undefined ? savedScores[i] : (savedScores[String(i)] !== undefined ? savedScores[String(i)] : '');

            tr.innerHTML = `
                <td style="background-color: ${style.bg}; color: ${style.color}; font-weight: bold; text-align: center;">${i}</td>
                <td><input type="text" class="input-cell input-paddock-score" data-horse-num="${i}" value="${scoreVal}" placeholder="-"></td>
            `;
            tbody.appendChild(tr);

            const input = tr.querySelector('.input-paddock-score');
            inputs.push(input);
        }

        inputs.forEach((input, index) => {
            input.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === 'ArrowDown') {
                    e.preventDefault();
                    const nextIndex = (index + 1) % inputs.length;
                    inputs[nextIndex].focus();
                    inputs[nextIndex].select();
                } else if (e.key === 'Tab' || e.key === 'ArrowUp') {
                    e.preventDefault();
                    const prevIndex = (index - 1 + inputs.length) % inputs.length;
                    inputs[prevIndex].focus();
                    inputs[prevIndex].select();
                }
            });
        });
    }

    // 行生成ヘルパー
    function createRow(articleVal = '--', predictorVal = '') {
        const tr = document.createElement('tr');
        if (articleVal === '有料') tr.classList.add('row-paid');

        tr.innerHTML = `
            <td>
                <select class="input-cell select-kiji">
                    <option value="--" ${articleVal === '--' ? 'selected' : ''}>--</option>
                    <option value="SS" ${articleVal === 'SS' ? 'selected' : ''}>SS</option>
                    <option value="S" ${articleVal === 'S' ? 'selected' : ''}>S</option>
                    <option value="A" ${articleVal === 'A' ? 'selected' : ''}>A</option>
                    <option value="B" ${articleVal === 'B' ? 'selected' : ''}>B</option>
                    <option value="C" ${articleVal === 'C' ? 'selected' : ''}>C</option>
                    <option value="有料" ${articleVal === '有料' ? 'selected' : ''}>有料</option>
                </select>
            </td>
            <td>
                <input type="text" class="input-cell input-yosouka" value="${predictorVal}" placeholder="名前を入力">
            </td>
            <td><input type="text" class="input-cell input-mark" data-mark-idx="0"></td>
            <td><input type="text" class="input-cell input-mark" data-mark-idx="1"></td>
            <td><input type="text" class="input-cell input-mark" data-mark-idx="2"></td>
            <td><input type="text" class="input-cell input-mark" data-mark-idx="3"></td>
            <td><input type="text" class="input-cell input-mark" data-mark-idx="4"></td>
        `;

        const kijiSelect = tr.querySelector('.select-kiji');
        kijiSelect.addEventListener('change', (e) => {
            if (e.target.value === '有料') {
                tr.classList.add('row-paid');
            } else {
                tr.classList.remove('row-paid');
            }
            saveCurrentData();
        });

        const markInputs = tr.querySelectorAll('.input-mark');
        markInputs.forEach((input, index) => {
            input.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    const nextIndex = (index + 1) % markInputs.length;
                    markInputs[nextIndex].focus();
                    markInputs[nextIndex].select();
                }
            });
        });

        return tr;
    }

    function updateDelButtonState(tableId, delBtnId) {
        const rowCount = document.querySelectorAll(`#${tableId} tbody tr`).length;
        const delBtn = document.getElementById(delBtnId);
        delBtn.disabled = rowCount <= DEFAULT_ROW_COUNT;
    }

    // イベントリスナーの一括設定
    function setupEventListeners() {
        document.getElementById('btn-add-1').addEventListener('click', () => {
            document.querySelector('#table-predict-1 tbody').appendChild(createRow());
            updateDelButtonState('table-predict-1', 'btn-del-1');
            saveCurrentData();
        });

        document.getElementById('btn-del-1').addEventListener('click', () => {
            const tbody = document.querySelector('#table-predict-1 tbody');
            if (tbody.children.length > DEFAULT_ROW_COUNT) {
                tbody.removeChild(tbody.lastChild);
                updateDelButtonState('table-predict-1', 'btn-del-1');
                saveCurrentData();
            }
        });

        document.getElementById('btn-add-2').addEventListener('click', () => {
            document.querySelector('#table-predict-2 tbody').appendChild(createRow());
            updateDelButtonState('table-predict-2', 'btn-del-2');
            saveCurrentData();
        });

        document.getElementById('btn-del-2').addEventListener('click', () => {
            const tbody = document.querySelector('#table-predict-2 tbody');
            if (tbody.children.length > DEFAULT_ROW_COUNT) {
                tbody.removeChild(tbody.lastChild);
                updateDelButtonState('table-predict-2', 'btn-del-2');
                saveCurrentData();
            }
        });

        // --- ブロック1: レース場・R番号変更処理 ---
        function changeRaceBlock1(targetPlace, targetNum) {
            // ① 変更前のキー（currentRace1）で現行データを確実に退避保存
            saveBlockByKey('table-predict-1', currentRace1.place, currentRace1.num, 'import-text-1', true);

            // ② 変数 currentRace1 を新しい選択内容に更新
            currentRace1.place = targetPlace;
            currentRace1.num = targetNum;

            // ③ 新しいレースデータをロード（データがない場合はクリア）
            loadBlockData('table-predict-1', currentRace1.place, currentRace1.num, 'import-text-1');
            
            // ④ 全体状態（currentStates）を保存
            saveCurrentStatesOnly();
        }

        document.querySelectorAll('#race-num-grid-1 .btn-rnum').forEach(btn => {
            btn.addEventListener('click', () => {
                const targetNum = btn.dataset.r;
                const targetPlace = document.getElementById('race-place-1').value;
                if (currentRace1.place === targetPlace && currentRace1.num === targetNum) return;

                setSelectedRaceNum('race-num-grid-1', targetNum);
                changeRaceBlock1(targetPlace, targetNum);
            });
        });

        document.getElementById('race-place-1')?.addEventListener('change', (e) => {
            const targetPlace = e.target.value;
            const targetNum = getSelectedRaceNum('race-num-grid-1');
            if (currentRace1.place === targetPlace && currentRace1.num === targetNum) return;

            changeRaceBlock1(targetPlace, targetNum);
        });

        // --- ブロック2: レース場・R番号変更処理 ---
        function changeRaceBlock2(targetPlace, targetNum) {
            saveBlockByKey('table-predict-2', currentRace2.place, currentRace2.num, 'import-text-2', false);

            currentRace2.place = targetPlace;
            currentRace2.num = targetNum;

            loadBlockData('table-predict-2', currentRace2.place, currentRace2.num, 'import-text-2');
            saveCurrentStatesOnly();
        }

        document.querySelectorAll('#race-num-grid-2 .btn-rnum').forEach(btn => {
            btn.addEventListener('click', () => {
                const targetNum = btn.dataset.r;
                const targetPlace = document.getElementById('race-place-2').value;
                if (currentRace2.place === targetPlace && currentRace2.num === targetNum) return;

                setSelectedRaceNum('race-num-grid-2', targetNum);
                changeRaceBlock2(targetPlace, targetNum);
            });
        });

        document.getElementById('race-place-2')?.addEventListener('change', (e) => {
            const targetPlace = e.target.value;
            const targetNum = getSelectedRaceNum('race-num-grid-2');
            if (currentRace2.place === targetPlace && currentRace2.num === targetNum) return;

            changeRaceBlock2(targetPlace, targetNum);
        });

        document.getElementById('btn-clear-1').addEventListener('click', () => {
            showClearModal('table-predict-1');
        });

        document.getElementById('btn-clear-2').addEventListener('click', () => {
            showClearModal('table-predict-2');
        });

        document.getElementById('btn-calc').addEventListener('click', calculateResults);
        document.getElementById('btn-migrate').addEventListener('click', migrateData);

        // AIインポートボタン
        document.getElementById('btn-import-1').addEventListener('click', () => {
            importTwitterText('table-predict-1', 'import-text-1');
        });

        document.getElementById('btn-import-2').addEventListener('click', () => {
            importTwitterText('table-predict-2', 'import-text-2');
        });

        // インポートテキストエリア全選択処理
        ['import-text-1', 'import-text-2'].forEach(id => {
            const textarea = document.getElementById(id);
            if (textarea) {
                textarea.addEventListener('focus', () => {
                    if (textarea.value) textarea.select();
                });
            }
        });

        // インポートテキストクリアボタン
        document.getElementById('btn-import-clear-1').addEventListener('click', () => {
            document.getElementById('import-text-1').value = '';
            saveCurrentData();
        });

        document.getElementById('btn-import-clear-2').addEventListener('click', () => {
            document.getElementById('import-text-2').value = '';
            saveCurrentData();
        });

        const paddockSelect = document.getElementById('paddock-horse-count');
        if (paddockSelect) {
            paddockSelect.addEventListener('change', () => {
                const count = parseInt(paddockSelect.value, 10);
                const currentScores = {};
                document.querySelectorAll('.input-paddock-score').forEach(inp => {
                    if (inp.value.trim() !== '') {
                        currentScores[inp.dataset.horseNum] = inp.value;
                    }
                });
                updatePaddockTable(count, currentScores);
                saveCurrentData();
            });
        }

        const paddockResetBtn = document.getElementById('btn-paddock-reset');
        if (paddockResetBtn) {
            paddockResetBtn.addEventListener('click', () => {
                document.querySelectorAll('.input-paddock-score').forEach(inp => {
                    inp.value = '';
                });
                saveCurrentData();
            });
        }
    }

    // Twitterテキスト解析関数
    function importTwitterText(tableId, textareaId) {
        const text = document.getElementById(textareaId).value;
        if (!text.trim()) {
            alert('貼り付けられたテキストが空です。');
            return;
        }

        const table = document.getElementById(tableId);
        const tbody = table.querySelector('tbody');
        const rows = tbody.querySelectorAll('tr');
        if (rows.length === 0) return;

        let targetRow = null;
        let matchedPredictorName = '';

        for (let row of rows) {
            const predictorInput = row.querySelector('.input-yosouka');
            const predictorName = predictorInput ? predictorInput.value.trim() : '';

            if (predictorName !== '' && text.includes(predictorName)) {
                targetRow = row;
                matchedPredictorName = predictorName;
                break;
            }
        }

        if (!targetRow) {
            for (let row of rows) {
                const predictorInput = row.querySelector('.input-yosouka');
                const predictorName = predictorInput ? predictorInput.value.trim() : '';
                if (predictorName === '') {
                    targetRow = row;
                    break;
                }
            }
        }

        if (!targetRow) {
            const newTr = createRow('--', '');
            tbody.appendChild(newTr);

            const delBtnId = tableId === 'table-predict-1' ? 'btn-del-1' : 'btn-del-2';
            updateDelButtonState(tableId, delBtnId);

            targetRow = newTr;
        }

        const markInputs = targetRow.querySelectorAll('.input-mark');
        const articleSelect = targetRow.querySelector('.select-kiji');

        const targetPredictorInput = targetRow.querySelector('.input-yosouka');
        const targetPredictorName = targetPredictorInput ? targetPredictorInput.value.trim() : '';

        // 記事抽出
        let extractedArticle = '--';

        if (/有料/.test(text)) {
            extractedArticle = '有料';
        } else if (targetPredictorName.includes('絞り') && /[【\[［]([★☆]+)[】\]］]/.test(text)) {
            const starMatch = text.match(/[【\[［]([★☆]+)[】\]］]/);
            if (starMatch && starMatch[1]) {
                const blackStarCount = (starMatch[1].match(/★/g) || []).length;
                if (blackStarCount === 1) extractedArticle = 'C';
                else if (blackStarCount === 2) extractedArticle = 'B';
                else if (blackStarCount === 3) extractedArticle = 'A';
                else if (blackStarCount === 4) extractedArticle = 'S';
                else if (blackStarCount >= 5) extractedArticle = 'SS';
            }
        } else {
            const bracketMatch = text.match(/[【\[［]\s*(SS|S|A|B|C)[+\-＋－]?\s*[】\]］]/i);
            if (bracketMatch && bracketMatch[1]) {
                extractedArticle = bracketMatch[1].toUpperCase();
            } else {
                const keywordMatch = text.match(/(?:信頼度|自信度|勝負度|評価|ランク|クラス)\s*[:：]?\s*(SS|S|A|B|C)[+\-＋－]?/i);
                if (keywordMatch && keywordMatch[1]) {
                    extractedArticle = keywordMatch[1].toUpperCase();
                } else {
                    const generalMatch = text.match(/\b(SS|S|A|B|C)[+\-＋－]?\b/i);
                    if (generalMatch && generalMatch[1]) {
                        extractedArticle = generalMatch[1].toUpperCase();
                    }
                }
            }
        }

        if (articleSelect) {
            articleSelect.value = extractedArticle;
            if (extractedArticle === '有料') {
                targetRow.classList.add('row-paid');
            } else {
                targetRow.classList.remove('row-paid');
            }
        }

        function normalizeNumberString(str) {
            const circleMap = {
                '①': '1', '②': '2', '③': '3', '④': '4', '⑤': '5',
                '⑥': '6', '⑦': '7', '⑧': '8', '⑨': '9', '⑩': '10',
                '⑪': '11', '⑫': '12', '⑬': '13', '⑭': '14', '⑮': '15',
                '⑯': '16', '⑰': '17', '⑱': '18', '⑲': '19', '⑳': '20',
                '❶': '1', '❷': '2', '❸': '3', '❹': '4', '❺': '5',
                '❻': '6', '❼': '7', '❽': '8', '❾': '9', '❿': '10',
                '⓫': '11', '⓬': '12', '⓭': '13', '⓮': '14', '⓯': '15',
                '⓰': '16', '⓱': '17', '⓲': '18', '⓳': '19', '⓴': '20'
            };

            let converted = str;
            for (let key in circleMap) {
                converted = converted.replaceAll(key, circleMap[key]);
            }
            converted = converted.replace(/[０-９]/g, s => String.fromCharCode(s.charCodeAt(0) - 0xFEE0));

            return converted;
        }

        const extractedMarks = { 0: '', 1: '', 2: '', 3: '', 4: '' };
        const normalizedText = normalizeNumberString(text);
        const lines = normalizedText.split(/\r?\n/);

        lines.forEach(line => {
            const patterns = [
                { regex: /[◎]\s*([0-9,.\s、・]+)/u, idx: 0 },
                { regex: /[◯〇○]\s*([0-9,.\s、・]+)/u, idx: 1 },
                { regex: /[▲]\s*([0-9,.\s、・]+)/u, idx: 2 },
                { regex: /[☆★]\s*([0-9,.\s、・]+)/u, idx: 3 },
                { regex: /[△穴]\s*([0-9,.\s、・]+)/u, idx: 4 }
            ];

            patterns.forEach(p => {
                const match = line.match(p.regex);
                if (match && match[1]) {
                    let rawVal = match[1].trim();

                    const nameMatch = rawVal.match(/^([0-9,.\s、・]+)/);
                    if (nameMatch) {
                        rawVal = nameMatch[1];
                    }

                    let cleaned = rawVal
                        .replace(/[,，\s、・]+/g, '.')
                        .replace(/^\.+|\.+$/g, '');

                    if (cleaned) {
                        if (p.idx === 4 && extractedMarks[4]) {
                            if (!extractedMarks[4].includes(cleaned)) {
                                extractedMarks[4] += '.' + cleaned;
                            }
                        } else {
                            extractedMarks[p.idx] = cleaned;
                        }
                    }
                }
            });
        });

        if (targetPredictorName.includes('あやね')) {
            extractedMarks[4] = extractedMarks[3] || '';
            extractedMarks[3] = '';
        } else if (targetPredictorName.includes('絞り')) {
            extractedMarks[3] = extractedMarks[4] || '';
            extractedMarks[4] = '';
        }

        let matchedCount = 0;
        Object.keys(extractedMarks).forEach(idx => {
            const val = extractedMarks[idx];
            if (val) {
                markInputs[idx].value = val;
                matchedCount++;
            } else {
                markInputs[idx].value = '';
            }
        });

        if (matchedCount > 0 || extractedArticle !== '--') {
            let msg = 'テキストを解析し、自動入力しました！';
            if (matchedPredictorName) {
                msg += `\n（対象予想家: 「${matchedPredictorName}」の行に入力）`;
            } else {
                msg += '\n（一致する予想家がいないため、空欄または新規追加行に入力しました）';
            }
            alert(msg);
            saveCurrentData();
        } else {
            alert('有効な予想印（◎◯▲☆★△と馬番）が見つかりませんでした。');
        }
    }

    function clearMarks(tableId) {
        const articleSelects = document.querySelectorAll(`#${tableId} .select-kiji`);
        articleSelects.forEach(select => {
            select.value = '--';
            const row = select.closest('tr');
            if (row) row.classList.remove('row-paid');
        });

        const markInputs = document.querySelectorAll(`#${tableId} .input-mark`);
        markInputs.forEach(input => input.value = '');

        saveCurrentData();
    }

    let clearTargetTableId = null;

    function showClearModal(tableId) {
        clearTargetTableId = tableId;
        document.getElementById('clear-modal').classList.add('show');
    }

    function hideClearModal() {
        clearTargetTableId = null;
        document.getElementById('clear-modal').classList.remove('show');
    }

    document.getElementById('modal-ok').addEventListener('click', () => {
        if (clearTargetTableId) clearMarks(clearTargetTableId);
        hideClearModal();
    });

    document.getElementById('modal-cancel').addEventListener('click', () => {
        hideClearModal();
    });

    function calculateResults() {
        const rows = document.querySelectorAll('#table-predict-1 tbody tr');
        const horseStats = {};

        rows.forEach(row => {
            const markInputs = row.querySelectorAll('.input-mark');
            markInputs.forEach((input, markIdx) => {
                const val = input.value.trim();
                if (!val) return;

                const horseNums = val.split('.').map(n => n.trim()).filter(n => n !== '');
                
                horseNums.forEach(num => {
                    if (!horseStats[num]) {
                        horseStats[num] = { points: 0, count: 0 };
                    }
                    horseStats[num].points += MARK_POINTS[markIdx];
                });
            });

            const rowHorseSet = new Set();
            markInputs.forEach(input => {
                const val = input.value.trim();
                if (val) {
                    val.split('.').forEach(n => {
                        const clean = n.trim();
                        if (clean) rowHorseSet.add(clean);
                    });
                }
            });
            rowHorseSet.forEach(num => {
                if (horseStats[num]) horseStats[num].count += 1;
            });
        });

        const sortedHorses = Object.keys(horseStats).map(num => ({
            num: parseInt(num, 10),
            points: horseStats[num].points,
            count: horseStats[num].count
        })).sort((a, b) => {
            if (b.points !== a.points) return b.points - a.points;
            return a.num - b.num;
        });

        updateSummaryResults(sortedHorses);
        updateTotalTable(sortedHorses);
    }

    function updateSummaryResults(sortedHorses) {
        document.getElementById('res-double-circle').textContent = '-';
        document.getElementById('res-circle').textContent = '-';
        document.getElementById('res-triangle').textContent = '-';
        document.getElementById('res-star').textContent = '-';
        document.getElementById('res-check').textContent = '-';
        document.getElementById('res-single').textContent = '-';

        if (sortedHorses.length === 0) return;

        if (sortedHorses[0]) document.getElementById('res-double-circle').textContent = sortedHorses[0].num;
        if (sortedHorses[1]) document.getElementById('res-circle').textContent = sortedHorses[1].num;
        if (sortedHorses[2]) document.getElementById('res-triangle').textContent = sortedHorses[2].num;
        if (sortedHorses[3]) document.getElementById('res-star').textContent = sortedHorses[3].num;

        const checkHorses = sortedHorses.slice(4)
            .filter(h => h.count >= 2)
            .map(h => h.num);
        document.getElementById('res-check').textContent = checkHorses.length > 0 ? checkHorses.join(' ') : '-';

        const singleHorses = sortedHorses
            .filter(h => h.count === 1)
            .map(h => h.num)
            .sort((a, b) => a - b);
        document.getElementById('res-single').textContent = singleHorses.length > 0 ? singleHorses.join(' ') : '-';
    }

    function updateTotalTable(sortedHorses) {
        const tbody = document.querySelector('#table-total-result tbody');
        tbody.innerHTML = '';

        if (sortedHorses.length === 0) {
            tbody.innerHTML = '<tr><td colspan="3" class="empty-msg">該当データがありません</td></tr>';
            return;
        }

        sortedHorses.forEach(h => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><strong>${h.num}</strong></td>
                <td>${h.points}</td>
                <td>${h.count}</td>
            `;
            tbody.appendChild(tr);
        });
    }

    function migrateData() {
        document.getElementById('race-place-1').value = document.getElementById('race-place-2').value;
        const place2Val = document.getElementById('race-place-2').value;
        const r2Val = getSelectedRaceNum('race-num-grid-2');

        setSelectedRaceNum('race-num-grid-1', r2Val);

        currentRace1.place = place2Val;
        currentRace1.num = r2Val;

        loadBlockData('table-predict-1', currentRace1.place, currentRace1.num, 'import-text-1');

        saveCurrentData();
        updateDelButtonState('table-predict-1', 'btn-del-1');
        clearMarks('table-predict-2');
    }

    // --- ストレージ処理用内部関数 ---

    // 明示的に渡された place/num キーで単体保存する関数
    function saveBlockByKey(tableId, place, num, textareaId, includePaddock = false) {
        if (place === '--' || num === '--') return;

        const savedData = loadFromLocalStorage() || { savedDate: getTodayString(), races: {} };
        savedData.savedDate = getTodayString();
        if (!savedData.races) savedData.races = {};

        const key = `${place}_${num}`;
        const blockData = {
            rows: getTableData(tableId),
            importText: document.getElementById(textareaId)?.value || ''
        };

        if (includePaddock) {
            const paddockScores = {};
            document.querySelectorAll('.input-paddock-score').forEach(input => {
                const hNum = input.dataset.horseNum;
                if (hNum && input.value.trim() !== '') {
                    paddockScores[hNum] = input.value;
                }
            });
            const paddockHorseCount = document.getElementById('paddock-horse-count')?.value || '18';

            blockData.paddock = {
                horseCount: paddockHorseCount,
                scores: paddockScores
            };
        } else if (savedData.races[key]?.paddock) {
            blockData.paddock = savedData.races[key].paddock;
        }

        savedData.races[key] = blockData;
        localStorage.setItem(STORAGE_KEY, JSON.stringify(savedData));
    }

    function saveCurrentData() {
        saveBlockByKey('table-predict-1', currentRace1.place, currentRace1.num, 'import-text-1', true);
        saveBlockByKey('table-predict-2', currentRace2.place, currentRace2.num, 'import-text-2', false);
        saveCurrentStatesOnly();
    }

    function saveCurrentStatesOnly() {
        const savedData = loadFromLocalStorage() || { savedDate: getTodayString(), races: {} };
        savedData.savedDate = getTodayString();
        savedData.currentStates = {
            place1: currentRace1.place,
            num1: currentRace1.num,
            place2: currentRace2.place,
            num2: currentRace2.num
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(savedData));
    }

    // 初期復元処理
    function restoreFromLocalStorage() {
        const data = loadFromLocalStorage();
        if (!data) return;

        if (data.currentStates) {
            currentRace1.place = data.currentStates.place1 || '--';
            currentRace1.num = data.currentStates.num1 || '--';
            currentRace2.place = data.currentStates.place2 || '--';
            currentRace2.num = data.currentStates.num2 || '--';

            const place1 = document.getElementById('race-place-1');
            if (place1) place1.value = currentRace1.place;
            if (currentRace1.num !== '--') {
                setSelectedRaceNum('race-num-grid-1', currentRace1.num);
            }

            const place2 = document.getElementById('race-place-2');
            if (place2) place2.value = currentRace2.place;
            if (currentRace2.num !== '--') {
                setSelectedRaceNum('race-num-grid-2', currentRace2.num);
            }
        }

        loadBlockData('table-predict-1', currentRace1.place, currentRace1.num, 'import-text-1');
        loadBlockData('table-predict-2', currentRace2.place, currentRace2.num, 'import-text-2');
    }

    // 入力イベント経由の自動保存リスナー
    document.addEventListener('input', (e) => {
        // レース切り替え用のドロップダウン等での入力時を除く
        if (e.target.id === 'race-place-1' || e.target.id === 'race-place-2') return;
        saveCurrentData();
    });

    restoreFromLocalStorage();
});

// ============================================================
// ローカルストレージ制御定義
// ============================================================

const STORAGE_KEY = 'keiba-yosou-data-v7';

function getTodayString() {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function getTableData(tableId) {
    const table = document.getElementById(tableId);
    if (!table) return [];
    const rows = table.querySelectorAll('tbody tr');

    return Array.from(rows).map(row => {
        const article = row.querySelector('.select-kiji');
        const predictor = row.querySelector('.input-yosouka');
        const marks = row.querySelectorAll('.input-mark');

        return {
            article: article ? article.value : '--',
            predictor: predictor ? predictor.value : '',
            marks: Array.from(marks).map(input => input.value)
        };
    });
}

function loadFromLocalStorage() {
    const savedDataStr = localStorage.getItem(STORAGE_KEY);
    if (!savedDataStr) return null;
    try {
        const data = JSON.parse(savedDataStr);
        if (data.savedDate !== getTodayString()) {
            console.log('日付が変わったため、過去の予想データをリセットしました。');
            localStorage.removeItem(STORAGE_KEY);
            return null;
        }
        return data;
    } catch (error) {
        console.error('データの読み込みに失敗しました。', error);
        return null;
    }
}

function loadBlockData(tableId, place, num, textareaId) {
    const savedData = loadFromLocalStorage();

    if (savedData && savedData.races && place !== '--' && num !== '--') {
        const key = `${place}_${num}`;
        const raceData = savedData.races[key];

        if (raceData) {
            restoreTable(tableId, raceData.rows);
            const textarea = document.getElementById(textareaId);
            if (textarea) textarea.value = raceData.importText || '';

            if (tableId === 'table-predict-1') {
                const paddockData = raceData.paddock || { horseCount: '18', scores: {} };
                const count = parseInt(paddockData.horseCount || '18', 10);
                const event = new CustomEvent('restorePaddock', { detail: { count, scores: paddockData.scores || {} } });
                window.dispatchEvent(event);
            }
            return;
        }
    }

    // 該当データが存在しない場合、未入力状態へ初期化
    initBlockDefault(tableId, textareaId);
}

function initBlockDefault(tableId, textareaId) {
    const DEFAULT_ROW_COUNT = 7;
    const INITIAL_PREDICTORS = ['的中', 'ウマ', 'Maria', 'あやね', '絞り', '', ''];
    const INITIAL_ARTICLES = ['--', '--', '--', '--', '--', '--', '--'];

    const defaultRows = [];
    for (let i = 0; i < DEFAULT_ROW_COUNT; i++) {
        defaultRows.push({
            article: INITIAL_ARTICLES[i],
            predictor: INITIAL_PREDICTORS[i] || '',
            marks: ['', '', '', '', '']
        });
    }
    restoreTable(tableId, defaultRows);
    const textarea = document.getElementById(textareaId);
    if (textarea) textarea.value = '';

    if (tableId === 'table-predict-1') {
        const select = document.getElementById('paddock-horse-count');
        if (select) select.value = '18';
        const event = new CustomEvent('restorePaddock', { detail: { count: 18, scores: {} } });
        window.dispatchEvent(event);
    }
}

function restoreTable(tableId, rowsData) {
    if (!rowsData || !Array.isArray(rowsData)) return;
    const table = document.getElementById(tableId);
    if (!table) return;
    const tbody = table.querySelector('tbody');
    if (!tbody) return;

    tbody.innerHTML = '';
    
    rowsData.forEach((rowData) => {
        const tr = document.createElement('tr');
        if (rowData.article === '有料') tr.classList.add('row-paid');

        tr.innerHTML = `
            <td>
                <select class="input-cell select-kiji">
                    <option value="--" ${rowData.article === '--' ? 'selected' : ''}>--</option>
                    <option value="SS" ${rowData.article === 'SS' ? 'selected' : ''}>SS</option>
                    <option value="S" ${rowData.article === 'S' ? 'selected' : ''}>S</option>
                    <option value="A" ${rowData.article === 'A' ? 'selected' : ''}>A</option>
                    <option value="B" ${rowData.article === 'B' ? 'selected' : ''}>B</option>
                    <option value="C" ${rowData.article === 'C' ? 'selected' : ''}>C</option>
                    <option value="有料" ${rowData.article === '有料' ? 'selected' : ''}>有料</option>
                </select>
            </td>
            <td>
                <input type="text" class="input-cell input-yosouka" value="${rowData.predictor || ''}" placeholder="名前を入力">
            </td>
            <td><input type="text" class="input-cell input-mark" data-mark-idx="0" value="${rowData.marks?.[0] || ''}"></td>
            <td><input type="text" class="input-cell input-mark" data-mark-idx="1" value="${rowData.marks?.[1] || ''}"></td>
            <td><input type="text" class="input-cell input-mark" data-mark-idx="2" value="${rowData.marks?.[2] || ''}"></td>
            <td><input type="text" class="input-cell input-mark" data-mark-idx="3" value="${rowData.marks?.[3] || ''}"></td>
            <td><input type="text" class="input-cell input-mark" data-mark-idx="4" value="${rowData.marks?.[4] || ''}"></td>
        `;

        const markInputs = tr.querySelectorAll('.input-mark');
        markInputs.forEach((input, index) => {
            input.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    const nextIndex = (index + 1) % markInputs.length;
                    markInputs[nextIndex].focus();
                    markInputs[nextIndex].select();
                }
            });
        });

        tbody.appendChild(tr);
    });

    const delBtnId = tableId === 'table-predict-1' ? 'btn-del-1' : 'btn-del-2';
    const delBtn = document.getElementById(delBtnId);
    if (delBtn) delBtn.disabled = tbody.children.length <= 7;
}

// パドック復元イベント
window.addEventListener('restorePaddock', (e) => {
    const { count, scores } = e.detail;
    const tbody = document.querySelector('#table-paddock-score tbody');
    if (!tbody) return;

    const select = document.getElementById('paddock-horse-count');
    if (select) select.value = count;

    function getFrameNumber(horseNum, totalHorses) {
        if (totalHorses <= 8) return horseNum;
        const base = Math.floor(totalHorses / 8);
        const remainder = totalHorses % 8;
        const frameCounts = new Array(8).fill(base);
        for (let i = 0; i < remainder; i++) {
            frameCounts[7 - i] += 1;
        }
        let currentCount = 0;
        for (let f = 0; f < 8; f++) {
            currentCount += frameCounts[f];
            if (horseNum <= currentCount) return f + 1;
        }
        return 8;
    }

    const FRAME_COLORS = {
        1: { bg: '#ffffff', color: '#000000' },
        2: { bg: '#000000', color: '#ffffff' },
        3: { bg: '#e60012', color: '#ffffff' },
        4: { bg: '#3388ff', color: '#ffffff' },
        5: { bg: '#ffcc00', color: '#ffffff' },
        6: { bg: '#339933', color: '#ffffff' },
        7: { bg: '#ff8800', color: '#ffffff' },
        8: { bg: '#ff66cc', color: '#ffffff' }
    };

    tbody.innerHTML = '';
    const inputs = [];

    for (let i = 1; i <= count; i++) {
        const tr = document.createElement('tr');
        const frameNum = getFrameNumber(i, count);
        const style = FRAME_COLORS[frameNum] || FRAME_COLORS[1];
        const scoreVal = scores[i] !== undefined ? scores[i] : (scores[String(i)] !== undefined ? scores[String(i)] : '');

        tr.innerHTML = `
            <td style="background-color: ${style.bg}; color: ${style.color}; font-weight: bold; text-align: center;">${i}</td>
            <td><input type="text" class="input-cell input-paddock-score" data-horse-num="${i}" value="${scoreVal}" placeholder="-"></td>
        `;
        tbody.appendChild(tr);

        const input = tr.querySelector('.input-paddock-score');
        inputs.push(input);
    }

    inputs.forEach((input, index) => {
        input.addEventListener('keydown', (evt) => {
            if (evt.key === 'Enter' || evt.key === 'ArrowDown') {
                evt.preventDefault();
                const nextIndex = (index + 1) % inputs.length;
                inputs[nextIndex].focus();
                inputs[nextIndex].select();
            } else if (evt.key === 'Tab' || evt.key === 'ArrowUp') {
                evt.preventDefault();
                const prevIndex = (index - 1 + inputs.length) % inputs.length;
                inputs[prevIndex].focus();
                inputs[prevIndex].select();
            }
        });
    });
});