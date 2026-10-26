(function (root) {
  'use strict';
  const OPERATIONS = Object.freeze(['addition', 'subtraction', 'multiplication', 'division']);
  const DEFAULT_SETTINGS = Object.freeze({ min: 0, max: 10, resultMin: 0, maxSum: 10, operations: ['addition'], voicePraise: true, questionModel: 'standard', topDigits: 1, bottomDigits: 1 });
  const DEFAULT_PROGRESS = Object.freeze({ stars: 0, solved: 0, wrong: 0, question: null, answer: '', answered: false });

  function calculate(a, b, operation) {
    if (operation === 'addition') return a + b;
    if (operation === 'subtraction') return a - b;
    if (operation === 'multiplication') return a * b;
    if (operation === 'division' && b !== 0 && a % b === 0) return a / b;
    return null;
  }
  function operationsOf(settings) {
    const listed = Array.isArray(settings.operations) ? settings.operations : [settings.operation || 'addition'];
    return [...new Set(listed.filter(operation => OPERATIONS.includes(operation)))];
  }
  function operandRanges(settings) {
    if (settings.questionModel !== 'susun') return { topMin: settings.min, topMax: settings.max, bottomMin: settings.min, bottomMax: settings.max };
    return {
      topMin: 10 ** (settings.topDigits - 1), topMax: 10 ** settings.topDigits - 1,
      bottomMin: 10 ** (settings.bottomDigits - 1), bottomMax: 10 ** settings.bottomDigits - 1
    };
  }
  function hasQuestion(s, operation) {
    const ranges = operandRanges(s);
    for (let a = ranges.topMin; a <= ranges.topMax; a++) for (let b = ranges.bottomMin; b <= ranges.bottomMax; b++) {
      if (operation === 'subtraction' && a < b) continue;
      const result = calculate(a, b, operation);
      if (result !== null && result >= s.resultMin && result <= s.maxSum) return true;
    }
    return false;
  }
  function isValidSettings(s) {
    if (!s || !Number.isInteger(s.min) || !Number.isInteger(s.max) || !Number.isInteger(s.maxSum)) return false;
    const resultMin = Number.isInteger(s.resultMin) ? s.resultMin : 0;
    const operations = operationsOf(s);
    const questionModel = s.questionModel || 'standard';
    const digitsValid = ['topDigits', 'bottomDigits'].every(key => Number.isInteger(s[key] ?? DEFAULT_SETTINGS[key]) && (s[key] ?? DEFAULT_SETTINGS[key]) >= 1 && (s[key] ?? DEFAULT_SETTINGS[key]) <= 3);
    if (!operations.length || !['standard', 'susun'].includes(questionModel) || !digitsValid || s.min < 0 || s.min > 999 || s.max < s.min || s.max > 999 || resultMin < 0 || resultMin > s.maxSum || s.maxSum > 998001) return false;
    return operations.every(operation => hasQuestion({ ...s, resultMin }, operation));
  }
  function normalizeSettings(s) {
    const candidate = s && { min: s.min, max: s.max, resultMin: Number.isInteger(s.resultMin) ? s.resultMin : 0, maxSum: s.maxSum, operations: operationsOf(s), voicePraise: s.voicePraise !== false, questionModel: s.questionModel || 'standard', topDigits: s.topDigits ?? s.topMaxDigits ?? 1, bottomDigits: s.bottomDigits ?? s.bottomMaxDigits ?? 1 };
    return isValidSettings(candidate) ? candidate : { ...DEFAULT_SETTINGS, operations: [...DEFAULT_SETTINGS.operations] };
  }
  function makeQuestion(settings, random, previousOperation) {
    const c = normalizeSettings(settings), rng = random || Math.random;
    let operations = c.operations;
    if (operations.length > 1 && operations.includes(previousOperation)) operations = operations.filter(operation => operation !== previousOperation);
    const operation = operations[Math.min(operations.length - 1, Math.floor(rng() * operations.length))];
    const ranges = operandRanges(c);
    for (let attempt = 0; attempt < 20000; attempt++) {
      const a = ranges.topMin + Math.floor(rng() * (ranges.topMax - ranges.topMin + 1));
      const b = ranges.bottomMin + Math.floor(rng() * (ranges.bottomMax - ranges.bottomMin + 1));
      if (operation === 'subtraction' && a < b) continue;
      const result = calculate(a, b, operation);
      if (result !== null && result >= c.resultMin && result <= c.maxSum) return { a, b, result, operation };
    }
    let selected = null, count = 0;
    for (let a = ranges.topMin; a <= ranges.topMax; a++) for (let b = ranges.bottomMin; b <= ranges.bottomMax; b++) {
      if (operation === 'subtraction' && a < b) continue;
      const result = calculate(a, b, operation);
      if (result !== null && result >= c.resultMin && result <= c.maxSum && Math.floor(rng() * ++count) === 0) selected = { a, b, result, operation };
    }
    if (!selected) throw new RangeError('Tidak ada pasangan angka yang memenuhi pengaturan.');
    return selected;
  }
  function checkAnswer(q, answer) {
    const value = String(answer).trim(), expected = q.result === undefined ? q.sum : q.result;
    return value !== '' && /^\d+$/.test(value) && Number(value) === expected;
  }
  function readJSON(storage, key, fallback) { try { const value = storage.getItem(key); return value === null ? fallback : JSON.parse(value); } catch (_) { return fallback; } }
  function loadState(storage) {
    const settings = normalizeSettings(readJSON(storage, 'math-kids-settings', DEFAULT_SETTINGS));
    const raw = readJSON(storage, 'math-kids-progress', DEFAULT_PROGRESS), progress = { ...DEFAULT_PROGRESS, ...raw };
    for (const key of ['stars', 'solved', 'wrong']) if (!Number.isSafeInteger(progress[key]) || progress[key] < 0) progress[key] = 0;
    progress.answer = typeof progress.answer === 'string' && /^\d{0,6}$/.test(progress.answer) ? progress.answer : '';
    progress.answered = progress.answered === true;
    let question = progress.question;
    if (question && question.result === undefined && question.sum !== undefined) question = { ...question, result: question.sum, operation: question.operation || 'addition' };
    const expected = question && calculate(question.a, question.b, question.operation), ranges = operandRanges(settings);
    if (!question || !Number.isInteger(question.a) || !Number.isInteger(question.b) || question.a < ranges.topMin || question.a > ranges.topMax || question.b < ranges.bottomMin || question.b > ranges.bottomMax || (question.operation === 'subtraction' && question.a < question.b) || !settings.operations.includes(question.operation) || expected === null || expected < settings.resultMin || expected > settings.maxSum || question.result !== expected) {
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

