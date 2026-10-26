(function (root) {
  'use strict';
  const OPERATIONS = Object.freeze(['addition', 'subtraction', 'multiplication', 'division']);
  const DEFAULT_SETTINGS = Object.freeze({ min: 0, max: 10, resultMin: 0, maxSum: 10, operations: ['addition'], voicePraise: true, questionModel: 'standard', topMinDigits: 1, topMaxDigits: 2, bottomMinDigits: 1, bottomMaxDigits: 2 });
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
      topMin: 10 ** (settings.topMinDigits - 1), topMax: 10 ** settings.topMaxDigits - 1,
      bottomMin: 10 ** (settings.bottomMinDigits - 1), bottomMax: 10 ** settings.bottomMaxDigits - 1
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
    const digitRangesValid = ['topMinDigits', 'topMaxDigits', 'bottomMinDigits', 'bottomMaxDigits'].every(key => Number.isInteger(s[key] ?? DEFAULT_SETTINGS[key]) && (s[key] ?? DEFAULT_SETTINGS[key]) >= 1 && (s[key] ?? DEFAULT_SETTINGS[key]) <= 2)
      && (s.topMinDigits ?? 1) <= (s.topMaxDigits ?? 2) && (s.bottomMinDigits ?? 1) <= (s.bottomMaxDigits ?? 2);
    if (!operations.length || !['standard', 'susun'].includes(questionModel) || !digitRangesValid || s.min < 0 || s.min > 99 || s.max < s.min || s.max > 99 || resultMin < 0 || resultMin > s.maxSum || s.maxSum > 198) return false;
    return operations.every(operation => hasQuestion({ ...s, resultMin }, operation));
  }
  function normalizeSettings(s) {
    const candidate = s && { min: s.min, max: s.max, resultMin: Number.isInteger(s.resultMin) ? s.resultMin : 0, maxSum: s.maxSum, operations: operationsOf(s), voicePraise: s.voicePraise !== false, questionModel: s.questionModel || 'standard', topMinDigits: s.topMinDigits ?? 1, topMaxDigits: s.topMaxDigits ?? 2, bottomMinDigits: s.bottomMinDigits ?? 1, bottomMaxDigits: s.bottomMaxDigits ?? 2 };
    return isValidSettings(candidate) ? candidate : { ...DEFAULT_SETTINGS, operations: [...DEFAULT_SETTINGS.operations] };
  }
  function makeQuestion(settings, random, previousOperation) {
    const c = normalizeSettings(settings), rng = random || Math.random;
    let operations = c.operations;
    if (operations.length > 1 && operations.includes(previousOperation)) operations = operations.filter(operation => operation !== previousOperation);
    const operation = operations[Math.min(operations.length - 1, Math.floor(rng() * operations.length))];
    const choices = [];
    const ranges = operandRanges(c);
    for (let a = ranges.topMin; a <= ranges.topMax; a++) for (let b = ranges.bottomMin; b <= ranges.bottomMax; b++) {
      if (operation === 'subtraction' && a < b) continue;
      const result = calculate(a, b, operation);
      if (result !== null && result >= c.resultMin && result <= c.maxSum) choices.push({ a, b, result, operation });
    }
    if (!choices.length) throw new RangeError('Tidak ada pasangan angka yang memenuhi pengaturan.');
    return choices[Math.min(choices.length - 1, Math.floor(rng() * choices.length))];
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
    progress.answer = typeof progress.answer === 'string' && /^\d{0,3}$/.test(progress.answer) ? progress.answer : '';
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

