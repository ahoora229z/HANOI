(() => {
  const $ = (id) => document.getElementById(id);
  const towers = [[], [], []];
  let diskCount = 3, speed = 2, mode = 'auto', moves = [], moveIndex = 0;
  let running = false, timer = null, startedAt = 0, elapsedBefore = 0, toastTimer = null;
  const colors = ['#62edbd', '#77d9d0', '#77b8fa', '#9d9cff', '#bd91ff', '#ef9bc5', '#ffb779', '#f0d778'];
  const fa = (n) => String(n).replace(/\d/g, d => '۰۱۲۳۴۵۶۷۸۹'[d]);
  const minMoves = n => 2 ** n - 1;

  function solve(n, from, to, aux, list) {
    if (n === 0) return;
    solve(n - 1, from, aux, to, list);
    list.push({ disk: n, from, to });
    solve(n - 1, aux, to, from, list);
  }
  function makeMoves() { const list = []; solve(diskCount, 0, 2, 1, list); return list; }

  function renderTowers() {
    towers.forEach((stack, i) => {
      const el = $('tower' + i);
      el.innerHTML = '';
      stack.forEach(disk => {
        const node = document.createElement('div');
        node.className = 'disk';
        const width = 27 + (disk / diskCount) * 66;
        node.style.width = width + '%';
        node.style.background = `linear-gradient(180deg, ${colors[(disk - 1) % colors.length]}, ${shade(colors[(disk - 1) % colors.length], -24)})`;
        node.style.zIndex = String(disk);
        node.setAttribute('aria-label', `دیسک ${fa(disk)}`);
        el.appendChild(node);
      });
    });
  }
  function shade(hex, amount) {
    const num = parseInt(hex.slice(1), 16);
    const r = Math.max(0, Math.min(255, (num >> 16) + amount));
    const g = Math.max(0, Math.min(255, ((num >> 8) & 255) + amount));
    const b = Math.max(0, Math.min(255, (num & 255) + amount));
    return `rgb(${r},${g},${b})`;
  }
  function renderStats() {
    $('moveCount').innerHTML = `${fa(moveIndex)} <i>/ ${fa(moves.length)}</i>`;
    $('minimumMoves').textContent = fa(minMoves(diskCount));
    const pct = moves.length ? Math.round(moveIndex / moves.length * 100) : 0;
    $('progressLabel').textContent = fa(pct) + '٪';
    $('progressFill').style.width = pct + '%';
    $('formulaResult').textContent = `T(${diskCount}) = ${fa(minMoves(diskCount))}`;
    $('historyCount').textContent = `${fa(moveIndex)} حرکت`;
    $('estimate').textContent = `حدود ${fa(Math.ceil(moves.length * delay() / 1000))} ثانیه`;
    $('diskValue').textContent = fa(diskCount);
    $('speedValue').textContent = `${fa(speed / 2)}×`;
    updateRangePaint($('diskRange'));
    updateRangePaint($('speedRange'));
    updateButtons();
  }
  function updateRangePaint(input) {
    const p = (Number(input.value) - Number(input.min)) / (Number(input.max) - Number(input.min)) * 100;
    input.style.background = `linear-gradient(to left, var(--green) ${p}%, #2d3a4d ${p}%)`;
  }
  function setStatus(text, state = '') {
    $('statusText').textContent = text;
    $('simulation-status');
    const pill = document.querySelector('.simulation-status');
    pill.classList.remove('running', 'done');
    if (state) pill.classList.add(state);
  }
  function updateButtons() {
    $('startLabel').textContent = running ? 'توقف موقت' : (moveIndex === moves.length && moveIndex > 0 ? 'اجرای دوباره' : 'شروع شبیه‌سازی');
    $('startIcon').textContent = running ? 'Ⅱ' : '▶';
    $('stepBtn').disabled = running || moveIndex >= moves.length;
    $('diskRange').disabled = running;
    $('speedRange').disabled = false;
    document.querySelectorAll('.mode-btn').forEach(btn => btn.classList.toggle('active', btn.dataset.mode === mode));
  }
  function renderHistory() {
    const list = $('historyList');
    if (!moveIndex) {
      list.innerHTML = '<div class="empty-history"><span>⌁</span><p>هنوز حرکتی انجام نشده.</p><small>برای شروع، دکمه‌ی شبیه‌سازی را بزن.</small></div>';
      return;
    }
    list.innerHTML = '';
    const start = Math.max(0, moveIndex - 6);
    for (let i = start; i < moveIndex; i++) {
      const m = moves[i];
      const row = document.createElement('div');
      row.className = 'history-item';
      row.innerHTML = `<span class="history-number">${fa(i + 1)}</span><span class="history-route">دیسک <b>${fa(m.disk)}</b> از برج <b>${'ABC'[m.from]}</b> <span>←</span> برج <b>${'ABC'[m.to]}</b></span><small>${fa(i + 1)} / ${fa(moves.length)}</small>`;
      list.appendChild(row);
    }
    list.scrollTop = list.scrollHeight;
  }
  function applyNextMove() {
    if (moveIndex >= moves.length) { finish(); return false; }
    const m = moves[moveIndex];
    const disk = towers[m.from].pop();
    if (disk !== m.disk || (towers[m.to].length && towers[m.to][towers[m.to].length - 1] < disk)) {
      pause(); setStatus('خطا در حرکت'); return false;
    }
    towers[m.to].push(disk);
    moveIndex++;
    renderTowers(); renderStats(); renderHistory();
    if (moveIndex >= moves.length) finish();
    return true;
  }
  function delay() { return Math.max(100, 1050 - (speed - 1) * 205); }
  function tick() {
    if (!running) return;
    if (!applyNextMove()) return;
    if (running) timer = setTimeout(tick, delay());
  }
  function play() {
    if (moveIndex >= moves.length) reset(false);
    running = true;
    if (!startedAt) startedAt = Date.now() - elapsedBefore;
    setStatus('در حال اجرا', 'running'); updateButtons();
    timer = setTimeout(tick, 120);
    updateClock();
  }
  function pause() {
    running = false;
    clearTimeout(timer); timer = null;
    elapsedBefore = startedAt ? Date.now() - startedAt : elapsedBefore;
    startedAt = 0;
    setStatus('متوقف شده'); updateButtons();
  }
  function finish() {
    running = false; clearTimeout(timer); timer = null;
    elapsedBefore = startedAt ? Date.now() - startedAt : elapsedBefore;
    startedAt = 0;
    if (moveIndex >= moves.length) {
      setStatus('با موفقیت انجام شد', 'done');
      showToast(`آفرین! حل برج هانوی با ${fa(moveIndex)} حرکت انجام شد.`);
    }
    updateButtons();
  }
  function updateClock() {
    if (!running) return;
    const ms = Date.now() - startedAt;
    const seconds = Math.floor(ms / 1000);
    $('elapsed').textContent = `${fa(String(Math.floor(seconds / 60)).padStart(2, '0'))}:${fa(String(seconds % 60).padStart(2, '0'))}`;
    timerClock = setTimeout(updateClock, 250);
  }
  let timerClock = null;
  function reset(showMessage = true) {
    pause();
    clearTimeout(timerClock); timerClock = null;
    towers[0] = Array.from({ length: diskCount }, (_, i) => diskCount - i);
    towers[1] = []; towers[2] = [];
    moves = makeMoves(); moveIndex = 0; elapsedBefore = 0; startedAt = 0;
    $('elapsed').textContent = '۰۰:۰۰';
    renderTowers(); renderStats(); renderHistory(); setStatus('آماده اجرا');
    if (showMessage) showToast('شبیه‌سازی از ابتدا آماده شد.');
  }
  function showToast(message) {
    const toast = $('toast'); toast.textContent = message; toast.classList.add('show');
    clearTimeout(toastTimer); toastTimer = setTimeout(() => toast.classList.remove('show'), 2800);
  }
  $('startBtn').addEventListener('click', () => running ? pause() : play());
  $('stepBtn').addEventListener('click', () => {
    if (mode === 'auto') { mode = 'manual'; updateButtons(); }
    if (moveIndex === 0 && !startedAt && elapsedBefore === 0) startedAt = Date.now();
    applyNextMove();
    if (moveIndex < moves.length) setStatus('حالت قدم‌به‌قدم');
  });
  $('resetBtn').addEventListener('click', () => reset());
  $('diskRange').addEventListener('input', e => {
    diskCount = Number(e.target.value); reset(false);
  });
  $('speedRange').addEventListener('input', e => { speed = Number(e.target.value); renderStats(); });
  document.querySelectorAll('.mode-btn').forEach(btn => btn.addEventListener('click', () => {
    mode = btn.dataset.mode; updateButtons();
    if (mode === 'manual' && running) pause();
    if (mode === 'manual') showToast('حالت دستی فعال شد؛ هر بار «یک قدم» را بزن.');
    else showToast('حالت خودکار فعال شد.');
  }));
  reset(false);
})();