(function (root) {
  'use strict';
  const OPERATIONS = Object.freeze(['addition', 'subtraction', 'multiplication', 'division']);
  const DEFAULT_SETTINGS = Object.freeze({ min: 0, max: 10, maxSum: 10, operation: 'addition' });
  const DEFAULT_PROGRESS = Object.freeze({ stars: 0, solved: 0, question: null, answer: '', answered: false });

  function calculate(a, b, operation) {
    if (operation === 'addition') return a + b;
    if (operation === 'subtraction') return a - b;
    if (operation === 'multiplication') return a * b;
    if (operation === 'division' && b !== 0 && a % b === 0) return a / b;
    return null;
  }
  function hasQuestion(s) {
    for (let a = s.min; a <= s.max; a++) for (let b = s.min; b <= s.max; b++) {
      const result = calculate(a, b, s.operation);
      if (result !== null && result >= 0 && result <= s.maxSum) return true;
    }
    return false;
  }
  function isValidSettings(s) {
    if (!s || !Number.isInteger(s.min) || !Number.isInteger(s.max) || !Number.isInteger(s.maxSum)) return false;
    const operation = s.operation || 'addition';
    if (!OPERATIONS.includes(operation) || s.min < 0 || s.min > 99 || s.max < s.min || s.max > 99 || s.maxSum < 0 || s.maxSum > 198) return false;
    return hasQuestion({ min: s.min, max: s.max, maxSum: s.maxSum, operation });
  }
  function normalizeSettings(s) {
    const candidate = s && { min: s.min, max: s.max, maxSum: s.maxSum, operation: s.operation || 'addition' };
    return isValidSettings(candidate) ? candidate : { ...DEFAULT_SETTINGS };
  }
  function makeQuestion(settings, random) {
    const c = normalizeSettings(settings), choices = [];
    for (let a = c.min; a <= c.max; a++) for (let b = c.min; b <= c.max; b++) {
      const result = calculate(a, b, c.operation);
      if (result !== null && result >= 0 && result <= c.maxSum) choices.push({ a, b, result, operation: c.operation });
    }
    if (!choices.length) throw new RangeError('Tidak ada pasangan angka yang memenuhi pengaturan.');
    return choices[Math.min(choices.length - 1, Math.floor((random || Math.random)() * choices.length))];
  }
  function checkAnswer(q, answer) {
    const value = String(answer).trim(), expected = q.result === undefined ? q.sum : q.result;
    return value !== '' && /^\d+$/.test(value) && Number(value) === expected;
  }
  function readJSON(storage, key, fallback) { try { const value = storage.getItem(key); return value === null ? fallback : JSON.parse(value); } catch (_) { return fallback; } }
  function loadState(storage) {
    const settings = normalizeSettings(readJSON(storage, 'math-kids-settings', DEFAULT_SETTINGS));
    const raw = readJSON(storage, 'math-kids-progress', DEFAULT_PROGRESS), progress = { ...DEFAULT_PROGRESS, ...raw };
    if (!Number.isSafeInteger(progress.stars) || progress.stars < 0) progress.stars = 0;
    if (!Number.isSafeInteger(progress.solved) || progress.solved < 0) progress.solved = 0;
    progress.answer = typeof progress.answer === 'string' && /^\d{0,3}$/.test(progress.answer) ? progress.answer : '';
    progress.answered = progress.answered === true;
    let question = progress.question;
    if (question && question.result === undefined && question.sum !== undefined) question = { ...question, result: question.sum, operation: question.operation || 'addition' };
    const expected = question && calculate(question.a, question.b, settings.operation);
    if (!question || !Number.isInteger(question.a) || !Number.isInteger(question.b) || question.a < settings.min || question.a > settings.max || question.b < settings.min || question.b > settings.max || question.operation !== settings.operation || expected === null || expected < 0 || expected > settings.maxSum || question.result !== expected) {
      progress.question = makeQuestion(settings); progress.answer = ''; progress.answered = false;
    } else progress.question = question;
    if (progress.answered && !checkAnswer(progress.question, progress.answer)) { progress.answer = ''; progress.answered = false; }
    return { settings, progress };
  }
  function saveState(storage, settings, progress) {
    storage.setItem('math-kids-settings', JSON.stringify(settings));
    storage.setItem('math-kids-progress', JSON.stringify(progress));
  }
  const api = { OPERATIONS, DEFAULT_SETTINGS, DEFAULT_PROGRESS, calculate, isValidSettings, normalizeSettings, makeQuestion, checkAnswer, loadState, saveState };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.MathKids = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
