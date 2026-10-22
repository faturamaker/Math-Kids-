(() => {
  'use strict';
  const { makeQuestion, checkAnswer, loadState, saveState, isValidSettings } = window.MathKids;
  const $ = id => document.getElementById(id), dialog = $('settings-dialog');
  const symbols = { addition: '+', subtraction: '−', multiplication: '×', division: '÷' };
  let state;
  try { state = loadState(window.localStorage); } catch (_) { state = loadState({ getItem: () => null }); }
  let { settings, progress } = state;
  function feedback(message, kind = '') { const el = $('feedback'); el.textContent = message; el.className = `feedback ${kind}`; }
  function persist() { try { saveState(window.localStorage, settings, progress); } catch (_) { feedback('Penyimpanan penuh. Progres mungkin tidak tersimpan.', 'wrong'); } }
  function render() {
    $('left-number').textContent = progress.question.a;
    $('right-number').textContent = progress.question.b;
    $('operation-symbol').textContent = symbols[settings.operation];
    $('answer').textContent = progress.answer || '?';
    $('stars').textContent = progress.stars;
    $('next-question').hidden = !progress.answered;
    document.querySelectorAll('#keypad button').forEach(button => { button.disabled = progress.answered; });
    $('helper').textContent = progress.answered ? 'Hebat! Kamu berhasil menjawab.' : 'Ayo hitung bersama!';
    if (progress.answered) feedback('Benar! Hebat sekali! ⭐', 'correct');
  }
  function newQuestion() {
    progress.question = makeQuestion(settings); progress.answer = ''; progress.answered = false;
    persist(); render(); feedback('Pilih angka pada papan di bawah.');
  }
  $('keypad').addEventListener('click', event => {
    const button = event.target.closest('button');
    if (!button || progress.answered) return;
    if (button.dataset.digit !== undefined) {
      if (progress.answer.length < 3) progress.answer += button.dataset.digit;
      $('answer').textContent = progress.answer || '?'; persist();
    }
    if (button.dataset.action === 'clear') { progress.answer = progress.answer.slice(0, -1); $('answer').textContent = progress.answer || '?'; persist(); }
    if (button.dataset.action === 'check') {
      if (!progress.answer) { feedback('Pilih angka terlebih dahulu.', 'wrong'); return; }
      if (checkAnswer(progress.question, progress.answer)) { progress.answered = true; progress.stars++; progress.solved++; persist(); render(); }
      else feedback('Belum tepat, coba lagi ya! 💪', 'wrong');
    }
  });
  $('next-question').addEventListener('click', () => { if (progress.answered) newQuestion(); });
  $('open-settings').addEventListener('click', () => {
    $('setting-operation').value = settings.operation;
    $('setting-min').value = settings.min; $('setting-max').value = settings.max; $('setting-sum').value = settings.maxSum;
    $('settings-error').textContent = '';
    if (dialog.showModal) dialog.showModal(); else dialog.setAttribute('open', '');
  });
  function closeDialog() { if (dialog.close) dialog.close(); else dialog.removeAttribute('open'); }
  $('close-settings').addEventListener('click', closeDialog); $('cancel-settings').addEventListener('click', closeDialog);
  $('settings-form').addEventListener('submit', event => {
    event.preventDefault();
    const proposed = { operation: $('setting-operation').value, min: Number($('setting-min').value), max: Number($('setting-max').value), maxSum: Number($('setting-sum').value) };
    if (!isValidSettings(proposed)) {
      $('settings-error').textContent = 'Pengaturan ini tidak menghasilkan soal yang valid. Periksa batas angka; pembagian harus tepat dan tidak dapat memakai pembagi nol.';
      return;
    }
    settings = proposed; progress.question = makeQuestion(settings); progress.answer = ''; progress.answered = false;
    persist(); closeDialog(); render(); feedback('Pengaturan tersimpan. Ayo mulai!');
  });
  render();
  if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost' || location.hostname === '127.0.0.1')) window.addEventListener('load', () => navigator.serviceWorker.register('./service-worker.js').catch(() => {}));
})();
