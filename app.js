(() => {
  'use strict';
  const { makeQuestion, checkAnswer, loadState, saveState, isValidSettings } = window.MathKids;
  const $ = id => document.getElementById(id), dialog = $('settings-dialog');
  const symbols = { addition: '+', subtraction: '−', multiplication: '×', division: '÷' };
  const praises = ['Yeay, kamu benar! Anak pintar!', 'Hebat sekali, jawabanmu benar!', 'Wah, kamu keren! Terus semangat ya!', 'Pintar! Kamu berhasil menjawab!'];
  let state;
  try { state = loadState(window.localStorage); } catch (_) { state = loadState({ getItem: () => null }); }
  let { settings, progress } = state, nextQuestionTimer = null;
  function feedback(message, kind = '') { const el = $('feedback'); el.textContent = message; el.className = `feedback ${kind}`; }
  function persist() { try { saveState(window.localStorage, settings, progress); } catch (_) { feedback('Penyimpanan penuh. Progres mungkin tidak tersimpan.', 'wrong'); } }
  function clearNextTimer() { if (nextQuestionTimer !== null) { window.clearTimeout(nextQuestionTimer); nextQuestionTimer = null; } }
  function scheduleNextQuestion() {
    clearNextTimer();
    nextQuestionTimer = window.setTimeout(() => { nextQuestionTimer = null; if (progress.answered) newQuestion(); }, 2000);
  }
  function render() {
    $('left-number').textContent = progress.question.a;
    $('right-number').textContent = progress.question.b;
    $('operation-symbol').textContent = symbols[progress.question.operation];
    $('answer').textContent = progress.answer || '?';
    $('stars').textContent = progress.stars;
    document.querySelectorAll('#keypad button').forEach(button => { button.disabled = progress.answered; });
    $('helper').textContent = progress.answered ? 'Hebat! Soal berikutnya sebentar lagi…' : 'Ayo hitung bersama!';
    if (progress.answered) { feedback('Benar! Hebat sekali! ⭐', 'correct'); scheduleNextQuestion(); }
  }
  function newQuestion() {
    clearNextTimer();
    progress.question = makeQuestion(settings, Math.random, progress.question && progress.question.operation);
    progress.answer = ''; progress.answered = false;
    persist(); render(); feedback('Pilih angka pada papan di bawah.');
  }
  function sayPraise() {
    if (!settings.voicePraise || !('speechSynthesis' in window) || !('SpeechSynthesisUtterance' in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(praises[Math.floor(Math.random() * praises.length)]);
    utterance.lang = 'id-ID'; utterance.rate = 0.95; utterance.pitch = 1.08;
    window.speechSynthesis.speak(utterance);
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
      if (checkAnswer(progress.question, progress.answer)) { progress.answered = true; progress.stars++; progress.solved++; persist(); render(); sayPraise(); }
      else feedback('Belum tepat, coba lagi ya! 💪', 'wrong');
    }
  });
  $('open-settings').addEventListener('click', () => {
    document.querySelectorAll('[name="setting-operations"]').forEach(input => { input.checked = settings.operations.includes(input.value); });
    $('setting-voice').checked = settings.voicePraise;
    $('setting-min').value = settings.min; $('setting-max').value = settings.max; $('setting-sum').value = settings.maxSum;
    $('settings-error').textContent = '';
    if (dialog.showModal) dialog.showModal(); else dialog.setAttribute('open', '');
  });
  function closeDialog() { if (dialog.close) dialog.close(); else dialog.removeAttribute('open'); }
  $('close-settings').addEventListener('click', closeDialog); $('cancel-settings').addEventListener('click', closeDialog);
  $('reset-stars').addEventListener('click', () => {
    if (!window.confirm('Reset semua bintang menjadi 0?')) return;
    progress.stars = 0; persist(); $('stars').textContent = '0'; $('reset-message').textContent = 'Bintang sudah direset ke 0.';
  });
  $('settings-form').addEventListener('submit', event => {
    event.preventDefault();
    const proposed = { operations: [...document.querySelectorAll('[name="setting-operations"]:checked')].map(input => input.value), voicePraise: $('setting-voice').checked, min: Number($('setting-min').value), max: Number($('setting-max').value), maxSum: Number($('setting-sum').value) };
    if (!isValidSettings(proposed)) {
      $('settings-error').textContent = 'Pilih setidaknya satu operasi dan pastikan batas angka menghasilkan soal yang valid untuk semua operasi terpilih. Pembagian harus tepat dan tidak dapat memakai pembagi nol.';
      return;
    }
    clearNextTimer(); settings = proposed; progress.question = makeQuestion(settings, Math.random, progress.question && progress.question.operation); progress.answer = ''; progress.answered = false;
    persist(); closeDialog(); render(); feedback('Pengaturan tersimpan. Ayo mulai!');
  });
  render();
  if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost' || location.hostname === '127.0.0.1')) window.addEventListener('load', () => navigator.serviceWorker.register('./service-worker.js').catch(() => {}));
})();
