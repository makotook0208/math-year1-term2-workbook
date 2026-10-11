(() => {
  'use strict';

  const STORAGE_KEY = 'year1Term2MathWorkbook.v1';
  const MATH_VERSION = 1;
  const app = document.getElementById('app');
  const homeLink = document.getElementById('homeLink');
  const INSTRUCTIONS_BY_MAJOR = INSTRUCTIONS;
  const QUESTION_BY_ID = new Map(QUESTIONS.map((question) => [question.id, question]));
  const EMPTY_STATE = () => ({ version: MATH_VERSION, history: {}, drafts: {}, run: null });
  let state = loadState();

  function loadState() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
      if (saved && saved.version === MATH_VERSION && saved.history && saved.drafts) return saved;
    } catch (_) { /* 保存データが読めない場合は、学習を続けられるよう初期状態にする */ }
    return EMPTY_STATE();
  }

  function saveState() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      return true;
    } catch (_) {
      const notice = document.querySelector('[data-storage-notice]');
      if (notice) notice.hidden = false;
      return false;
    }
  }

  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, (character) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
    })[character]);
  }

  function formatMath(value) {
    return escapeHtml(value).replace(/\{\{f:([^|]+)\|([^}]+)\}\}/g, (_, numerator, denominator) =>
      `<span class="frac" role="math" aria-label="${escapeHtml(denominator)}分の${escapeHtml(numerator)}"><span class="num">${escapeHtml(numerator)}</span><span class="den">${escapeHtml(denominator)}</span></span>`);
  }

  function questionLabel(question) {
    return `第${question.major}問${question.minor > 0 ? `（${question.minor}）` : ''}`;
  }

  function categoryQuestions(category) {
    return QUESTIONS.filter((question) => question.category === category);
  }

  function getHistory(id) {
    return state.history[id] || { attempts: 0, firstCorrect: null, everCorrect: false, latestAnswer: '' };
  }

  function getMistakeIds(ids = QUESTIONS.map((question) => question.id)) {
    return ids.filter((id) => getHistory(id).firstCorrect === false);
  }

  function getStartedCount() {
    return QUESTIONS.filter((question) => getHistory(question.id).attempts > 0).length;
  }

  function getCorrectCount() {
    return QUESTIONS.filter((question) => getHistory(question.id).everCorrect).length;
  }

  function homeButtonHtml(label, className = 'text-button') {
    return `<button type="button" class="${className}" data-action="home">${escapeHtml(label)}</button>`;
  }

  function renderHome() {
    const started = getStartedCount();
    const correct = getCorrectCount();
    const mistakeCount = getMistakeIds().length;
    const canResume = state.run?.status === 'practice' && state.run.ids?.length;
    const cards = Object.entries(CATEGORY_INFO).map(([key, category]) => {
      const questions = categoryQuestions(key);
      const done = questions.filter((question) => getHistory(question.id).everCorrect).length;
      return `<button type="button" class="category-card" data-category="${key}">
        <span class="category-icon" aria-hidden="true">${escapeHtml(category.icon)}</span>
        <span class="category-copy"><strong>${escapeHtml(category.label)}</strong><small>まずはこの分野から</small></span>
        <span class="category-count"><strong>${questions.length}問</strong>${done ? `${done}問できた` : 'はじめよう'}</span>
      </button>`;
    }).join('');

    app.innerHTML = `<section class="hero" aria-labelledby="page-title">
        <div class="hero-inner">
          <div class="eyebrow">Math practice · 1st grade</div>
          <h1 id="page-title">ひとつずつ解いて、<br>数学のコツをつかもう。</h1>
          <p>文字式、方程式、比例式。中間テスト前の大切なポイントを、58問で練習できます。</p>
          <div class="hero-meta"><strong>58</strong><span>問の演習</span><span class="dot" aria-hidden="true"></span><span>いつでも何度でも</span></div>
        </div>
      </section>

      <div class="main-grid">
        <section class="panel panel-pad" aria-labelledby="categories-title">
          <div class="section-heading"><h2 id="categories-title">今日はどこから解く？</h2><p>分野を選べます</p></div>
          <div class="category-list">${cards}</div>
        </section>

        <aside class="panel panel-pad actions-panel" aria-label="演習を始める">
          <button type="button" class="primary-button" data-start="all">全問にチャレンジ <span aria-hidden="true">→</span></button>
          <button type="button" class="secondary-button" data-start="mistakes" ${mistakeCount ? '' : 'disabled'}>まちがえた問題を復習${mistakeCount ? `（${mistakeCount}問）` : ''}</button>
          ${canResume ? '<button type="button" class="secondary-button" data-action="resume">続きから再開</button>' : ''}
          <div class="mini-progress">
            <div class="mini-progress-head"><strong>これまでの学習</strong><span>${started} / ${QUESTIONS.length}問に挑戦</span></div>
            <div class="progress-track" role="progressbar" aria-label="学習を始めた問題数" aria-valuemin="0" aria-valuemax="58" aria-valuenow="${started}"><div class="progress-fill" style="width:${(started / QUESTIONS.length) * 100}%"></div></div>
            <p class="small">正解できた問題：${correct}問</p>
          </div>
          <div class="callout"><strong>ちょっとずつで大丈夫。</strong><br>分からない問題は飛ばして、あとで戻れます。<br>大問12の（5）〜（8）は、正答をもとに作った類題です。</div>
          <details class="guide">
            <summary>解く前に、4つのコツを確認</summary>
            <div class="guide-content">
              <p>・同じ文字の項どうし、数どうしをまとめる。</p>
              <p>・かっこの前にマイナスがあるときは、符号に注意。</p>
              <p>・方程式では、両辺に同じ操作をする。</p>
              <p>・比例式では、外項の積と内項の積を等しくする。</p>
            </div>
          </details>
          <p class="small" data-storage-notice hidden>このブラウザでは進み具合を保存できません。ページを閉じる前に結果を確認してください。</p>
        </aside>
      </div>
      <div class="button-row" style="justify-content:flex-end;margin-top:9px"><button type="button" class="danger-button" data-action="reset">学習記録をリセット</button></div>`;

    app.querySelectorAll('[data-start]').forEach((button) => button.addEventListener('click', () => {
      const mode = button.dataset.start;
      if (mode === 'all') startRun('all', QUESTIONS.map((question) => question.id));
      if (mode === 'mistakes') startRun('mistakes', getMistakeIds());
    }));
    app.querySelectorAll('[data-category]').forEach((button) => button.addEventListener('click', () => {
      const category = button.dataset.category;
      startRun(category, categoryQuestions(category).map((question) => question.id));
    }));
    bindHomeActions();
    if (!localStorageAvailable()) {
      const notice = document.querySelector('[data-storage-notice]');
      if (notice) notice.hidden = false;
    }
  }

  function localStorageAvailable() {
    try { return typeof localStorage !== 'undefined'; } catch (_) { return false; }
  }

  function bindHomeActions() {
    app.querySelectorAll('[data-action="home"]').forEach((button) => button.addEventListener('click', renderHome));
    app.querySelectorAll('[data-action="resume"]').forEach((button) => button.addEventListener('click', () => {
      if (state.run?.ids?.length) {
        state.run.index = Math.min(state.run.index || 0, state.run.ids.length - 1);
        state.run.status = 'practice';
        saveState();
        renderQuestion();
      }
    }));
    const reset = app.querySelector('[data-action="reset"]');
    reset?.addEventListener('click', () => {
      if (confirm('この端末に保存した学習記録をすべて消します。よろしいですか？')) {
        state = EMPTY_STATE();
        saveState();
        renderHome();
      }
    });
  }

  function startRun(mode, ids) {
    if (!ids.length) return;
    state.run = { mode, ids: [...ids], index: 0, status: 'practice' };
    saveState();
    renderQuestion();
  }

  function currentQuestion() {
    return QUESTION_BY_ID.get(state.run.ids[state.run.index]);
  }

  function getDraft(question) {
    return state.drafts[question.id] ?? (question.type === 'multiChoice' ? [] : {});
  }

  function setDraft(question, draft) {
    state.drafts[question.id] = draft;
    const history = getHistory(question.id);
    history.feedbackVisible = false;
    state.history[question.id] = history;
    saveState();
  }

  function renderAnswerInput(question, draft) {
    if (question.type === 'multiChoice') {
      const selected = Array.isArray(draft) ? draft : [];
      return `<div class="answer-block"><h3 id="answer-heading">あてはまるものをすべて選びましょう</h3><div class="option-list" role="group" aria-labelledby="answer-heading">
        ${question.choices.map((choice) => `<label class="option-label"><input type="checkbox" data-choice="${choice.key}" ${selected.includes(choice.key) ? 'checked' : ''}><span>${escapeHtml(choice.text)}</span></label>`).join('')}
      </div></div>`;
    }
    if (question.type === 'terms') {
      return `<div class="answer-block"><h3 id="answer-heading">項と係数を入力しましょう</h3>
        ${question.fields.map((field) => `<div class="answer-field"><label for="answer-${field.key}">${escapeHtml(field.label)}</label><input id="answer-${field.key}" type="text" autocomplete="off" spellcheck="false" data-field="${field.key}" value="${escapeHtml(draft[field.key] || '')}" placeholder="${field.key === 'terms' ? '例：3x, -1' : '答えを入力'}"></div>`).join('')}
      </div>`;
    }
    const label = question.type === 'value' ? `${question.variable}の値` : '計算した答え';
    const placeholder = question.type === 'value' ? '例：-3、1/2' : '例：11x、8-2a';
    return `<div class="answer-block"><h3 id="answer-heading">答えを入力しましょう</h3><div class="answer-field"><label for="answer">${escapeHtml(label)}</label><input id="answer" type="text" autocomplete="off" spellcheck="false" value="${escapeHtml(typeof draft === 'string' ? draft : '')}" placeholder="${placeholder}"></div></div>`;
  }

  function renderQuestion() {
    if (!state.run?.ids?.length) return renderHome();
    const question = currentQuestion();
    if (!question) return renderHome();
    const draft = getDraft(question);
    const history = getHistory(question.id);
    const index = state.run.index;
    const total = state.run.ids.length;
    const progress = ((index + 1) / total) * 100;
    const isLast = index === total - 1;
    const badge = question.sourceStatus === 'generated-analogue-from-answer'
      ? '<span class="badge analogue">類題</span>'
      : question.sourceStatus === 'reconstructed-from-solution'
        ? '<span class="badge">解説から復元</span>' : '';
    const isLong = question.prompt.length > 22 || question.type === 'multiChoice';
    const checked = history.feedbackVisible === true;
    const lastCorrect = history.latestCorrect === true;
    const checkedAnswer = history.latestAnswer;

    app.innerHTML = `<div class="practice-top">
        ${homeButtonHtml('← ホームへ')}
        <div class="practice-progress">
          <div class="practice-progress-label"><span>演習の進み具合</span><strong>${index + 1} / ${total}</strong></div>
          <div class="progress-track" role="progressbar" aria-label="演習の進み具合" aria-valuemin="0" aria-valuemax="${total}" aria-valuenow="${index + 1}"><div class="progress-fill" style="width:${progress}%"></div></div>
        </div>
      </div>
      <article class="panel question-card" aria-labelledby="question-title">
        <header class="question-card-head"><div class="question-number"><span id="question-title">${questionLabel(question)}</span>${badge}</div><span class="major-label">${escapeHtml(CATEGORY_INFO[question.category].label)}</span></header>
        <div class="question-body">
          <p class="instruction">${escapeHtml(INSTRUCTIONS_BY_MAJOR[question.major])}</p>
          <div class="question-math ${isLong ? 'long' : ''}">${formatMath(question.prompt)}</div>
          ${renderAnswerInput(question, draft)}
          ${renderSymbolPad()}
          <div class="question-tools"><button type="button" class="hint-button" id="hint-button" aria-expanded="false">ヒントを見る <span aria-hidden="true">＋</span></button><span class="small">${history.attempts ? `これまで ${history.attempts} 回入力` : '分からないときは、あとで戻れます'}</span></div>
          <div class="hint-box" id="hint-box" hidden>${escapeHtml(question.hint)}</div>
          <p class="notice" id="answer-notice" aria-live="polite"></p>
          <div class="button-row" style="margin-top:12px"><button type="button" class="primary-button" id="check-button">答え合わせ</button></div>
          ${checked ? feedbackHtml(question, lastCorrect, checkedAnswer, history) : ''}
          <details class="question-nav"><summary>問題一覧から選ぶ</summary><div class="question-nav-grid">${renderQuestionNav()}</div></details>
        </div>
      </article>
      <div class="bottom-nav">
        <button type="button" class="secondary-button" id="previous-button" ${index === 0 ? 'disabled' : ''}>← 前の問題</button>
        <button type="button" class="text-button" id="skip-button">${isLast ? '結果を見る' : 'この問題をとばす →'}</button>
      </div>
      <p class="small" data-storage-notice hidden>進み具合を保存できません。このページを閉じると、今の状態が消える場合があります。</p>`;

    bindHomeActions();
    bindQuestionInputs(question);
    document.getElementById('hint-button').addEventListener('click', (event) => {
      const box = document.getElementById('hint-box');
      const opening = box.hidden;
      box.hidden = !opening;
      event.currentTarget.setAttribute('aria-expanded', String(opening));
      event.currentTarget.innerHTML = opening ? 'ヒントを隠す <span aria-hidden="true">−</span>' : 'ヒントを見る <span aria-hidden="true">＋</span>';
    });
    document.getElementById('check-button').addEventListener('click', () => gradeQuestion(question));
    document.getElementById('previous-button').addEventListener('click', () => moveQuestion(-1));
    document.getElementById('skip-button').addEventListener('click', () => moveQuestion(1));
    app.querySelectorAll('[data-jump]').forEach((button) => button.addEventListener('click', () => {
      state.run.index = Number(button.dataset.jump);
      saveState();
      renderQuestion();
      app.scrollIntoView({ block: 'start', behavior: 'smooth' });
    }));
    const feedbackAction = app.querySelector('[data-feedback-action]');
    if (feedbackAction) feedbackAction.addEventListener('click', () => {
      if (feedbackAction.dataset.feedbackAction === 'retry') {
        const history = getHistory(question.id);
        history.feedbackVisible = false;
        state.history[question.id] = history;
        saveState();
        renderQuestion();
        const answerInput = app.querySelector('input[type="text"]');
        answerInput?.focus();
      } else moveQuestion(1);
    });
    if (!localStorageAvailable()) {
      const notice = document.querySelector('[data-storage-notice]');
      if (notice) notice.hidden = false;
    }
  }

  function renderQuestionNav() {
    return state.run.ids.map((id, index) => {
      const history = getHistory(id);
      const current = index === state.run.index;
      const statusClass = current ? 'current' : history.firstCorrect === false ? 'missed' : history.everCorrect ? 'done' : '';
      const question = QUESTION_BY_ID.get(id);
      return `<button type="button" data-jump="${index}" class="${statusClass}" aria-label="${questionLabel(question)}へ移動${current ? '、現在の問題' : ''}">${question.major}${question.minor}</button>`;
    }).join('');
  }

  function renderSymbolPad() {
    const tokens = [
      { label: '−', value: '−' }, { label: '+', value: '+' }, { label: 'x', value: 'x' },
      { label: 'a', value: 'a' }, { label: 'y', value: 'y' }, { label: '/', value: '/' },
      { label: ':', value: ':' }, { label: ',', value: ', ' }, { label: '=', value: '=' },
    ];
    return `<details class="symbol-details"><summary>記号を入力する</summary><div class="symbol-pad">${tokens.map((token) => `<button type="button" data-insert="${escapeHtml(token.value)}">${escapeHtml(token.label)}</button>`).join('')}</div></details>`;
  }

  function bindQuestionInputs(question) {
    const textInputs = [...app.querySelectorAll('input[type="text"]')];
    const updateTextDraft = () => {
      if (question.type === 'terms') {
        const draft = {};
        app.querySelectorAll('[data-field]').forEach((input) => { draft[input.dataset.field] = input.value; });
        setDraft(question, draft);
      } else setDraft(question, textInputs[0]?.value || '');
    };
    textInputs.forEach((input) => {
      input.addEventListener('input', updateTextDraft);
      input.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') {
          event.preventDefault();
          gradeQuestion(question);
        }
      });
    });
    app.querySelectorAll('[data-choice]').forEach((input) => input.addEventListener('change', () => {
      setDraft(question, [...app.querySelectorAll('[data-choice]:checked')].map((item) => item.dataset.choice));
    }));
    let activeInput = null;
    textInputs.forEach((input) => input.addEventListener('focus', () => { activeInput = input; }));
    app.querySelectorAll('[data-insert]').forEach((button) => button.addEventListener('click', () => {
      if (!activeInput) {
        activeInput = textInputs[0];
        activeInput?.focus();
      }
      if (!activeInput) return;
      const insertion = button.dataset.insert;
      const start = activeInput.selectionStart ?? activeInput.value.length;
      const end = activeInput.selectionEnd ?? activeInput.value.length;
      activeInput.value = activeInput.value.slice(0, start) + insertion + activeInput.value.slice(end);
      activeInput.focus();
      const cursor = start + insertion.length;
      activeInput.setSelectionRange(cursor, cursor);
      activeInput.dispatchEvent(new Event('input', { bubbles: true }));
    }));
  }

  function feedbackHtml(question, correct, answer, history) {
    const title = correct ? '正解です。' : 'もう一度考えてみましょう。';
    const extra = history.attempts > 1 ? `<span class="small"> ${history.attempts}回目の答え合わせ</span>` : '';
    const action = correct
      ? `<button type="button" class="primary-button" data-feedback-action="next">${state.run.index === state.run.ids.length - 1 ? '結果を見る' : '次の問題へ'} →</button>`
      : `<div class="button-row"><button type="button" class="secondary-button" data-feedback-action="retry">答えを直す</button><button type="button" class="primary-button" data-feedback-action="next">${state.run.index === state.run.ids.length - 1 ? '結果を見る' : '次の問題へ'} →</button></div>`;
    const displayAnswer = answer && typeof answer === 'object'
      ? Object.values(answer).filter(Boolean).join('、') || '未選択'
      : String(answer || '');
    return `<section class="feedback ${correct ? '' : 'wrong'}" aria-live="polite"><p class="feedback-title">${title}${extra}</p>
      <p class="solution">${escapeHtml(question.explanation)}</p>
      <p class="small">あなたの答え：${escapeHtml(displayAnswer)}</p>
      <div class="feedback-actions">${action}</div>
    </section>`;
  }

  function readAnswer(question) {
    if (question.type === 'multiChoice') return [...app.querySelectorAll('[data-choice]:checked')].map((input) => input.dataset.choice);
    if (question.type === 'terms') {
      const answer = {};
      app.querySelectorAll('[data-field]').forEach((input) => { answer[input.dataset.field] = input.value.trim(); });
      return answer;
    }
    return app.querySelector('#answer')?.value.trim() || '';
  }

  function normalizeInput(input) {
    return String(input)
      .replace(/[！-～]/g, (character) => String.fromCharCode(character.charCodeAt(0) - 0xfee0))
      .replace(/[−－﹣‐‑‒–—]/g, '-')
      .replace(/[✕✖]/g, '×')
      .replace(/\s+/g, '')
      .toLowerCase();
  }

  function parseNumber(text) {
    const value = String(text);
    const fraction = value.match(/^([+-]?(?:\d+(?:\.\d*)?|\.\d+))\/([+-]?(?:\d+(?:\.\d*)?|\.\d+))$/);
    if (fraction) {
      const denominator = Number(fraction[2]);
      if (!denominator) return NaN;
      return Number(fraction[1]) / denominator;
    }
    if (/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/.test(value)) return Number(value);
    return NaN;
  }

  function parseLinear(input) {
    const expression = normalizeInput(input).replace(/[×*]/g, '');
    if (!expression) return null;
    const coefficients = { a: 0, x: 0, y: 0, constant: 0 };
    const matcher = /([+-]?)(?:(\d+(?:\.\d*)?(?:\/\d+)?)?([axy])|(\d+(?:\.\d*)?(?:\/\d+)?))/gy;
    let position = 0;
    while (position < expression.length) {
      matcher.lastIndex = position;
      const match = matcher.exec(expression);
      if (!match || match.index !== position || match[0].length === 0) return null;
      const sign = match[1] === '-' ? -1 : 1;
      if (match[3]) {
        const coefficient = match[2] ? parseNumber(match[2]) : 1;
        if (!Number.isFinite(coefficient)) return null;
        coefficients[match[3]] += sign * coefficient;
      } else {
        const constant = parseNumber(match[4]);
        if (!Number.isFinite(constant)) return null;
        coefficients.constant += sign * constant;
      }
      position = matcher.lastIndex;
    }
    return coefficients;
  }

  function sameLinearExpression(left, right) {
    const first = parseLinear(left);
    const second = parseLinear(right);
    if (!first || !second) return normalizeInput(left) === normalizeInput(right);
    return Object.keys(first).every((key) => Math.abs(first[key] - second[key]) < 1e-8);
  }

  function canonicalTerm(term) {
    const parsed = parseLinear(term);
    if (!parsed) return `raw:${normalizeInput(term)}`;
    return Object.keys(parsed).map((key) => `${key}:${Math.round(parsed[key] * 1e8) / 1e8}`).join('|');
  }

  function sameTermSet(userValue, expectedTerms) {
    const terms = String(userValue).split(/[,，、;；\s]+/).filter(Boolean);
    if (terms.length !== expectedTerms.length) return false;
    const userTerms = terms.map(canonicalTerm).sort();
    const correctTerms = expectedTerms.map(canonicalTerm).sort();
    return userTerms.every((term, index) => term === correctTerms[index]);
  }

  function checkAnswer(question, answer) {
    if (question.type === 'multiChoice') {
      const selected = [...answer].sort();
      const expected = [...question.correct].sort();
      return selected.length === expected.length && selected.every((choice, index) => choice === expected[index]);
    }
    if (question.type === 'terms') {
      return sameTermSet(answer.terms || '', question.fields[0].expected)
        && question.fields.slice(1).every((field) => sameLinearExpression(answer[field.key] || '', field.expected));
    }
    if (question.type === 'expression') return sameLinearExpression(answer, question.answer);
    const cleaned = normalizeInput(answer).replace(/^[axy]=/, '');
    const userValue = parseNumber(cleaned);
    const correctValue = parseNumber(question.answer);
    return Number.isFinite(userValue) && Number.isFinite(correctValue) && Math.abs(userValue - correctValue) < 1e-8;
  }

  function gradeQuestion(question) {
    const answer = readAnswer(question);
    const empty = Array.isArray(answer)
      ? answer.length === 0
      : typeof answer === 'object'
        ? Object.values(answer).some((value) => !value)
        : !answer;
    if (empty) {
      const notice = document.getElementById('answer-notice');
      if (notice) notice.textContent = '答えを入力するか、当てはまるものを選んでください。';
      const firstInput = app.querySelector('input[type="text"], input[type="checkbox"]');
      firstInput?.focus();
      return;
    }
    const correct = checkAnswer(question, answer);
    const history = getHistory(question.id);
    const answerToSave = typeof answer === 'object' ? answer : String(answer);
    if (history.attempts === 0) {
      history.firstCorrect = correct;
      history.firstAnswer = answerToSave;
    }
    history.attempts += 1;
    history.latestAnswer = answerToSave;
    history.latestCorrect = correct;
    history.everCorrect = history.everCorrect || correct;
    history.feedbackVisible = true;
    state.history[question.id] = history;
    state.drafts[question.id] = answer;
    saveState();
    renderQuestion();
    app.querySelector('.feedback')?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }

  function moveQuestion(direction) {
    const next = state.run.index + direction;
    if (direction > 0 && next >= state.run.ids.length) {
      state.run.status = 'completed';
      saveState();
      renderResult();
      return;
    }
    if (next < 0 || next >= state.run.ids.length) return;
    state.run.index = next;
    saveState();
    renderQuestion();
    app.scrollIntoView({ block: 'start', behavior: 'smooth' });
  }

  function renderResult() {
    const runIds = state.run?.ids || [];
    const runQuestions = runIds.map((id) => QUESTION_BY_ID.get(id)).filter(Boolean);
    const firstTryCorrect = runQuestions.filter((question) => getHistory(question.id).firstCorrect === true).length;
    const eventuallyCorrect = runQuestions.filter((question) => getHistory(question.id).everCorrect).length;
    const attempted = runQuestions.filter((question) => getHistory(question.id).attempts > 0).length;
    const missedIds = getMistakeIds(runIds);
    const categoryStats = Object.entries(CATEGORY_INFO).map(([category, info]) => {
      const questions = runQuestions.filter((question) => question.category === category);
      if (!questions.length) return '';
      const correctCount = questions.filter((question) => getHistory(question.id).everCorrect).length;
      return `<div class="result-category"><strong>${escapeHtml(info.label)}</strong><div class="progress-track" role="progressbar" aria-label="${escapeHtml(info.label)}の正解数" aria-valuemin="0" aria-valuemax="${questions.length}" aria-valuenow="${correctCount}"><div class="progress-fill" style="width:${(correctCount / questions.length) * 100}%"></div></div><span>${correctCount} / ${questions.length}</span></div>`;
    }).join('');

    const questionRows = runQuestions.map((question) => {
      const history = getHistory(question.id);
      const status = history.attempts === 0
        ? ['未回答', '']
        : history.firstCorrect
          ? ['1回目で正解', 'good']
          : history.everCorrect
            ? ['解き直して正解', 'good']
            : ['もう一度練習', 'bad'];
      const sourceBadge = question.sourceStatus === 'generated-analogue-from-answer' ? '<span class="badge analogue">類題</span>' : '';
      return `<div class="result-question"><span class="q-id">${questionLabel(question)}</span><span class="q-status ${status[1]}">${status[0]} ${sourceBadge}</span><button type="button" data-retry-one="${question.id}">もう一度解く →</button></div>`;
    }).join('');
    const title = eventuallyCorrect === runQuestions.length ? '最後まで解きました！' : 'ここまで解けました';
    const successText = attempted < runQuestions.length ? `${attempted}問に挑戦し、${eventuallyCorrect}問で正解できました。` : '解説を見ながら、もう一度練習してみましょう。';

    app.innerHTML = `<div class="practice-top">${homeButtonHtml('← ホームへ')}<span class="grade-tag">今回の結果</span></div>
      <section class="panel result-hero">
        <div class="result-mark ${eventuallyCorrect === runQuestions.length ? '' : 'needs-work'}" aria-hidden="true">${eventuallyCorrect === runQuestions.length ? '✓' : '✎'}</div>
        <div><h1>${title}</h1><p>${successText}</p><div class="result-score"><strong>${eventuallyCorrect}</strong><span>/ ${runQuestions.length}問 正解</span></div></div>
      </section>
      <div class="result-grid">
        <div class="stat-card"><span>1回目で正解</span><strong>${firstTryCorrect} 問</strong></div>
        <div class="stat-card"><span>今回、答え合わせをした問題</span><strong>${attempted} / ${runQuestions.length} 問</strong></div>
      </div>
      <section class="panel panel-pad" style="margin-top:14px"><div class="section-heading"><h2>分野ごとの結果</h2><p>解き直しも応援しています</p></div><div class="result-category-list">${categoryStats}</div></section>
      <section class="panel panel-pad" style="margin-top:14px"><div class="section-heading"><h2>今回の問題</h2><p>${runQuestions.length}小問</p></div><div class="result-question-list">${questionRows || '<p class="empty-state">問題がありません。</p>'}</div></section>
      <section class="panel panel-pad" style="margin-top:14px"><div class="button-row">
        <button type="button" class="primary-button" id="retry-mistakes" ${missedIds.length ? '' : 'disabled'}>まちがえた問題を解き直す${missedIds.length ? `（${missedIds.length}問）` : ''}</button>
        <button type="button" class="secondary-button" id="retry-run">この範囲をもう一度</button>
      </div></section>
      <p class="small" data-storage-notice hidden>このブラウザでは進み具合を保存できません。</p>`;
    bindHomeActions();
    app.querySelectorAll('[data-retry-one]').forEach((button) => button.addEventListener('click', () => startRun('single', [button.dataset.retryOne])));
    document.getElementById('retry-mistakes')?.addEventListener('click', () => {
      if (missedIds.length) startRun('mistakes', missedIds);
    });
    document.getElementById('retry-run')?.addEventListener('click', () => startRun(state.run?.mode || 'all', runIds));
  }

  homeLink.addEventListener('click', (event) => {
    event.preventDefault();
    renderHome();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  if (state.run?.status === 'practice' && state.run.ids?.length) renderQuestion();
  else if (state.run?.status === 'completed') renderResult();
  else renderHome();
})();
