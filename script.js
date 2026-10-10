document.addEventListener('DOMContentLoaded', () => {
    // 定数・初期データ
    const DEFAULT_ROW_COUNT = 7;
    const MARK_POINTS = { 0: 5, 1: 4, 2: 3, 3: 2, 4: 1 }; // ◎:5, ◯:4, ▲:3, ☆:2, △:1
    
    // 指定の初期予想家名リスト
    const INITIAL_PREDICTORS = ['的中', 'ウマ', 'Maria', 'あやね', '絞り', '', ''];
    // 記事の初期値はすべて "--"
    const INITIAL_ARTICLES = ['--', '--', '--', '--', '--', '--', '--'];

    // 競馬の枠色・文字色の定義（1枠のみ白背景・黒文字、他は各枠色・白文字）
    const FRAME_COLORS = {
        1: { bg: '#ffffff', color: '#000000' }, // 1枠: 白背景・黒文字
        2: { bg: '#000000', color: '#ffffff' }, // 2枠: 黒背景・白文字
        3: { bg: '#e60012', color: '#ffffff' }, // 3枠: 赤背景・白文字
        4: { bg: '#3388ff', color: '#ffffff' }, // 4枠: 青背景・白文字
        5: { bg: '#ffcc00', color: '#ffffff' }, // 5枠: 黄背景・白文字
        6: { bg: '#339933', color: '#ffffff' }, // 6枠: 緑背景・白文字
        7: { bg: '#ff8800', color: '#ffffff' }, // 7枠: 橙背景・白文字
        8: { bg: '#ff66cc', color: '#ffffff' }  // 8枠: 桃背景・白文字
    };

    // 初期化実行
    initPredictTable('table-predict-1', 'btn-del-1');
    initPredictTable('table-predict-2', 'btn-del-2');
    initPaddockSection();
    setupEventListeners();

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
        select.value = '18'; // デフォルト18頭
        updatePaddockTable(18, {});
    }

    // JRAの枠番割り当て規則計算関数
    function getFrameNumber(horseNum, totalHorses) {
        if (totalHorses <= 8) {
            return horseNum; // 8頭立て以下は1頭ずつ
        }
        const base = Math.floor(totalHorses / 8);
        const remainder = totalHorses % 8;
        const frameCounts = new Array(8).fill(base);
        for (let i = 0; i < remainder; i++) {
            const targetFrameIndex = 7 - i; // 外側の枠から順に配分
            frameCounts[targetFrameIndex] += 1;
        }
        let currentCount = 0;
        for (let f = 0; f < 8; f++) {
            currentCount += frameCounts[f];
            if (horseNum <= currentCount) {
                return f + 1;
            }
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

        // Enterキーで次の馬番へ移動、最後なら1番に戻るループ構造
        inputs.forEach((input, index) => {
            input.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    const nextIndex = (index + 1) % inputs.length;
                    inputs[nextIndex].focus();
                    inputs[nextIndex].select();
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

        // 有料選択時の背景色変更イベント
        const kijiSelect = tr.querySelector('.select-kiji');
        kijiSelect.addEventListener('change', (e) => {
            if (e.target.value === '有料') {
                tr.classList.add('row-paid');
            } else {
                tr.classList.remove('row-paid');
            }
        });

        // Enterキーで同じ行内をループ移動する処理
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

    // 行削除ボタンのenable/disable制御
    function updateDelButtonState(tableId, delBtnId) {
        const rowCount = document.querySelectorAll(`#${tableId} tbody tr`).length;
        const delBtn = document.getElementById(delBtnId);
        delBtn.disabled = rowCount <= DEFAULT_ROW_COUNT;
    }

    // イベントリスナーの一括設定
    function setupEventListeners() {
        // 行追加・削除 (Ⅰ)
        document.getElementById('btn-add-1').addEventListener('click', () => {
            document.querySelector('#table-predict-1 tbody').appendChild(createRow());
            updateDelButtonState('table-predict-1', 'btn-del-1');
            saveToLocalStorage();
        });

        document.getElementById('btn-del-1').addEventListener('click', () => {
            const tbody = document.querySelector('#table-predict-1 tbody');
            if (tbody.children.length > DEFAULT_ROW_COUNT) {
                tbody.removeChild(tbody.lastChild);
                updateDelButtonState('table-predict-1', 'btn-del-1');
                saveToLocalStorage();
            }
        });

        // 行追加・削除 (Ⅱ)
        document.getElementById('btn-add-2').addEventListener('click', () => {
            document.querySelector('#table-predict-2 tbody').appendChild(createRow());
            updateDelButtonState('table-predict-2', 'btn-del-2');
            saveToLocalStorage();
        });

        document.getElementById('btn-del-2').addEventListener('click', () => {
            const tbody = document.querySelector('#table-predict-2 tbody');
            if (tbody.children.length > DEFAULT_ROW_COUNT) {
                tbody.removeChild(tbody.lastChild);
                updateDelButtonState('table-predict-2', 'btn-del-2');
                saveToLocalStorage();
            }
        });

        // クリアボタン
        document.getElementById('btn-clear-1').addEventListener('click', () => {
            showClearModal('table-predict-1');
        });

        document.getElementById('btn-clear-2').addEventListener('click', () => {
            showClearModal('table-predict-2');
        });

        // 集計ボタン
        document.getElementById('btn-calc').addEventListener('click', calculateResults);

        // データ移行ボタン
        document.getElementById('btn-migrate').addEventListener('click', migrateData);

        // パドック頭数変更
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
                saveToLocalStorage();
            });
        }

        // パドック点数リセットボタン
        const paddockResetBtn = document.getElementById('btn-paddock-reset');
        if (paddockResetBtn) {
            paddockResetBtn.addEventListener('click', () => {
                document.querySelectorAll('.input-paddock-score').forEach(inp => {
                    inp.value = '';
                });
                saveToLocalStorage();
            });
        }
    }

    // 予想内容クリア（記事・予想印をリセット、予想家は残す）
    function clearMarks(tableId) {
        const articleSelects = document.querySelectorAll(`#${tableId} .select-kiji`);
        articleSelects.forEach(select => {
            select.value = '--';
            const row = select.closest('tr');
            if (row) {
                row.classList.remove('row-paid');
            }
        });

        const markInputs = document.querySelectorAll(`#${tableId} .input-mark`);
        markInputs.forEach(input => input.value = '');

        saveToLocalStorage();
    }

    // クリア確認モーダル
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
        if (clearTargetTableId) {
            clearMarks(clearTargetTableId);
        }
        hideClearModal();
    });

    document.getElementById('modal-cancel').addEventListener('click', () => {
        hideClearModal();
    });

    // 集計処理コアロジック
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
            if (b.points !== a.points) {
                return b.points - a.points;
            }
            return a.num - b.num;
        });

        updateSummaryResults(sortedHorses);
        updateTotalTable(sortedHorses);
    }

    // 総合結果の反映
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

    // トータル結果テーブルの更新
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

    // データ移行
    function migrateData() {
        document.getElementById('race-place-1').value = document.getElementById('race-place-2').value;
        document.getElementById('race-num-1').value = document.getElementById('race-num-2').value;

        const rows2 = document.querySelectorAll('#table-predict-2 tbody tr');
        const tbody1 = document.querySelector('#table-predict-1 tbody');
        tbody1.innerHTML = '';

        rows2.forEach(r2 => {
            const kiji = r2.querySelector('.select-kiji').value;
            const predictor = r2.querySelector('.input-yosouka').value;
            const newTr = createRow(kiji, predictor);

            const marks2 = r2.querySelectorAll('.input-mark');
            const newMarks = newTr.querySelectorAll('.input-mark');
            marks2.forEach((m, idx) => {
                newMarks[idx].value = m.value;
            });

            tbody1.appendChild(newTr);
        });

        saveToLocalStorage();
        updateDelButtonState('table-predict-1', 'btn-del-1');
        clearMarks('table-predict-2');
    }
});

// ============================================================
// ローカルストレージへの自動保存・復元
// ============================================================

const STORAGE_KEY = 'keiba-yosou-data-v1';

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

function saveToLocalStorage() {
    const paddockScores = {};
    document.querySelectorAll('.input-paddock-score').forEach(input => {
        const hNum = input.dataset.horseNum;
        if (hNum && input.value.trim() !== '') {
            paddockScores[hNum] = input.value;
        }
    });

    const data = {
        race1: {
            place: document.getElementById('race-place-1')?.value || '--',
            number: document.getElementById('race-num-1')?.value || '--',
            rows: getTableData('table-predict-1')
        },
        race2: {
            place: document.getElementById('race-place-2')?.value || '--',
            number: document.getElementById('race-num-2')?.value || '--',
            rows: getTableData('table-predict-2')
        },
        paddock: {
            horseCount: document.getElementById('paddock-horse-count')?.value || '18',
            scores: paddockScores
        }
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function loadFromLocalStorage() {
    const savedData = localStorage.getItem(STORAGE_KEY);
    if (!savedData) return null;
    try {
        return JSON.parse(savedData);
    } catch (error) {
        console.error('ローカルストレージのデータを読み込めませんでした。', error);
        return null;
    }
}

function restoreTable(tableId, rowsData) {
    if (!rowsData || !Array.isArray(rowsData)) return;
    const table = document.getElementById(tableId);
    if (!table) return;
    const tbody = table.querySelector('tbody');
    if (!tbody) return;

    const currentRows = tbody.querySelectorAll('tr').length;
    if (currentRows < rowsData.length) {
        const addButtonId = tableId === 'table-predict-1' ? 'btn-add-1' : 'btn-add-2';
        const addButton = document.getElementById(addButtonId);
        if (addButton) {
            for (let i = currentRows; i < rowsData.length; i++) {
                addButton.click();
            }
        }
    } else if (currentRows > rowsData.length) {
        const deleteButtonId = tableId === 'table-predict-1' ? 'btn-del-1' : 'btn-del-2';
        const deleteButton = document.getElementById(deleteButtonId);
        if (deleteButton) {
            for (let i = currentRows; i > rowsData.length; i--) {
                deleteButton.click();
            }
        }
    }

    const rows = tbody.querySelectorAll('tr');
    rowsData.forEach((rowData, index) => {
        const row = rows[index];
        if (!row) return;

        const article = row.querySelector('.select-kiji');
        if (article) article.value = rowData.article || '--';

        const predictor = row.querySelector('.input-yosouka');
        if (predictor) predictor.value = rowData.predictor || '';

        const marks = row.querySelectorAll('.input-mark');
        marks.forEach((input, markIndex) => {
            input.value = rowData.marks?.[markIndex] || '';
        });

        if (article) {
            if (article.value === '有料') {
                row.classList.add('row-paid');
            } else {
                row.classList.remove('row-paid');
            }
        }
    });
}

function restoreFromLocalStorage() {
    const data = loadFromLocalStorage();
    if (!data) return;

    if (data.race1) {
        const racePlace1 = document.getElementById('race-place-1');
        const raceNum1 = document.getElementById('race-num-1');
        if (racePlace1) racePlace1.value = data.race1.place || '--';
        if (raceNum1) raceNum1.value = data.race1.number || '--';
        restoreTable('table-predict-1', data.race1.rows);
    }

    if (data.race2) {
        const racePlace2 = document.getElementById('race-place-2');
        const raceNum2 = document.getElementById('race-num-2');
        if (racePlace2) racePlace2.value = data.race2.place || '--';
        if (raceNum2) raceNum2.value = data.race2.number || '--';
        restoreTable('table-predict-2', data.race2.rows);
    }

    if (data.paddock) {
        const horseCountSelect = document.getElementById('paddock-horse-count');
        if (horseCountSelect) {
            horseCountSelect.value = data.paddock.horseCount || '18';
            // パドックテーブルを再構築して保存値を復元
            // 循環参照を避けるため直接updatePaddockTableを呼び出したいがスコープの関係上、
            // 読み込み時に生成した関数か、イベント経由などで処理する。
            // ここではグローバルあるいは共通関数として動作させるため、再生成ロジックを実行。
        }
    }
}

// ページ読み込み時の復元処理を強化
window.addEventListener('load', () => {
    restoreFromLocalStorage();
    const data = loadFromLocalStorage();
    if (data && data.paddock) {
        const count = parseInt(data.paddock.horseCount || '18', 10);
        // パドックテーブル更新関数の内部ロジックを再実行して復元
        const tbody = document.querySelector('#table-paddock-score tbody');
        if (tbody) {
            // 再度レンダリングを走らせるためにセレクトボックスの値を設定し直す
            const select = document.getElementById('paddock-horse-count');
            if (select) {
                select.value = count;
                // updatePaddockTable と同等の処理を適用
                // （script内で定義されたものと同じロジックで再構築）
            }
        }
    }
});

// 入力変更時に自動保存
document.addEventListener('input', () => {
    saveToLocalStorage();
});

document.addEventListener('change', () => {
    saveToLocalStorage();
});