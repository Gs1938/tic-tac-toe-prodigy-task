/* ===========================================================
   Tic-Tac-Toe — Vanilla JS, beginner-friendly with comments
   Modes: PvP (two players) and Player vs AI (unbeatable minimax)
   =========================================================== */

const boardEl = document.getElementById('board');
const statusEl = document.getElementById('status');
const resetBtn = document.getElementById('resetBtn');
const modeEl = document.getElementById('mode');
const markPickerEl = document.getElementById('markPicker');

const cells = Array.from(document.querySelectorAll('.cell'));
const WINS = [
  [0,1,2],[3,4,5],[6,7,8], // rows
  [0,3,6],[1,4,7],[2,5,8], // cols
  [0,4,8],[2,4,6]          // diagonals
];

// ----- Game state -----
let board, current, gameOver, mode, humanMark, aiMark;

// Initialize on load
init();

function init() {
  board = Array(9).fill(null);  // empty 3x3
  current = 'X';                // X always starts
  gameOver = false;
  mode = modeEl.value;          // 'pvp' or 'ai'
  humanMark = getSelectedMark(); // 'X' or 'O' (only matters in AI mode)
  aiMark = humanMark === 'X' ? 'O' : 'X';

  // Clear UI cells
  cells.forEach(btn => {
    btn.textContent = '';
    btn.disabled = false;
    btn.classList.remove('winning');
  });

  // In AI mode, if human chose 'O', AI (X) moves first
  if (mode === 'ai' && humanMark === 'O') {
    aiMove(); // AI plays opening move
  } else {
    updateStatus();
  }
}

function getSelectedMark(){
  const checked = document.querySelector('input[name="mark"]:checked');
  return checked ? checked.value : 'X';
}

function updateStatus(message){
  if (message) {
    statusEl.textContent = message;
    return;
  }
  if (gameOver) return;

  if (mode === 'pvp') {
    statusEl.textContent = `Turn: ${current}`;
  } else {
    const who = (current === humanMark) ? 'Your' : 'AI';
    statusEl.textContent = `${who} turn: ${current}`;
  }
}

// ----- Event listeners -----
boardEl.addEventListener('click', onCellClick);
resetBtn.addEventListener('click', init);
modeEl.addEventListener('change', () => {
  // Enable mark picker only in AI mode
  markPickerEl.style.opacity = modeEl.value === 'ai' ? '1' : '.5';
  markPickerEl.querySelectorAll('input').forEach(i => i.disabled = modeEl.value !== 'ai');
  init();
});
markPickerEl.addEventListener('change', () => {
  if (modeEl.value === 'ai') init();
});

// ----- Handle user clicks -----
function onCellClick(e){
  const btn = e.target.closest('.cell');
  if (!btn || gameOver) return;

  const idx = +btn.dataset.index;
  if (board[idx]) return; // already filled

  // Place current mark
  placeMark(idx, current);

  // Check outcome
  const result = evaluateBoard(board);
  if (handleEndIfAny(result)) return;

  // Next turn
  current = current === 'X' ? 'O' : 'X';

  // If AI's turn, let AI play
  if (mode === 'ai' && current === aiMark && !gameOver) {
    // Small delay to feel natural
    setTimeout(aiMove, 150);
  } else {
    updateStatus();
  }
}

// Put mark on board + UI
function placeMark(idx, mark){
  board[idx] = mark;
  cells[idx].textContent = mark;
  cells[idx].disabled = true;
}

// Check if someone won or draw, update UI, return true if game ended
function handleEndIfAny(result){
  if (result.winner) {
    gameOver = true;
    highlightWin(result.line);
    updateStatus(`${result.winner} wins!`);
    disableAll();
    return true;
  }
  if (result.draw) {
    gameOver = true;
    updateStatus(`It's a draw.`);
    disableAll();
    return true;
  }
  return false;
}

function highlightWin(line){
  line.forEach(i => cells[i].classList.add('winning'));
}
function disableAll(){
  cells.forEach(c => c.disabled = true);
}

// ----- Board evaluation -----
function evaluateBoard(b){
  for (const line of WINS){
    const [a,b2,c] = line;
    if (b[a] && b[a] === b[b2] && b[a] === b[c]){
      return { winner: b[a], line };
    }
  }
  if (b.every(v => v)) return { draw: true };
  return { ongoing: true };
}

// ----- AI (minimax, unbeatable) -----
function aiMove(){
  // If center is free and it's opening, choose a strong move fast
  if (board.filter(Boolean).length <= 1){
    const opening = [4,0,2,6,8,1,3,5,7].find(i => !board[i]);
    placeMark(opening, aiMark);
  } else {
    const { index } = minimax(board, aiMark, -Infinity, Infinity);
    placeMark(index, aiMark);
  }

  // Check outcome after AI move
  const result = evaluateBoard(board);
  if (handleEndIfAny(result)) return;

  current = current === 'X' ? 'O' : 'X';
  updateStatus();
}

/* Minimax with alpha-beta pruning
   Returns best move object: { score, index }
*/
function minimax(b, player, alpha, beta){
  const result = evaluateBoard(b);
  if (result.winner === aiMark)   return { score: +10 };
  if (result.winner && result.winner !== aiMark) return { score: -10 };
  if (result.draw)                return { score: 0 };

  const empty = b.map((v,i)=> v ? null : i).filter(i => i !== null);
  let best = { score: player === aiMark ? -Infinity : +Infinity, index: empty[0] };

  for (const idx of empty){
    b[idx] = player;
    const next = minimax(b, player === 'X' ? 'O' : 'X', alpha, beta);
    b[idx] = null;

    const withIdx = { score: next.score, index: idx };

    if (player === aiMark){
      if (withIdx.score > best.score) best = withIdx;
      alpha = Math.max(alpha, withIdx.score);
    } else {
      if (withIdx.score < best.score) best = withIdx;
      beta = Math.min(beta, withIdx.score);
    }
    if (beta <= alpha) break; // prune
  }
  return best;
}
