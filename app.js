(() => {
  'use strict';

  const STORAGE_KEY = 'year1Term2MathWorkbook.v1';
  const MATH_VERSION = 2;
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
      // 選択式への変更前に保存された正誤記録は残し、入力途中の答えだけを初期化します。
      if (saved && saved.version === 1 && saved.history) {
        Object.values(saved.history).forEach((history) => { history.feedbackVisible = false; });
        return { version: MATH_VERSION, history: saved.history, drafts: {}, run: null };
      }
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

  const LESSONS = {
    terms: {
      title: '式を「項」と「係数」に分ける',
      lead: '式を足し算・引き算のまとまりに分け、文字にかかっている数を見つけます。',
      sections: [
        { title: '項は、符号ごとにひとまとまり', body: '項は、式を足し算でつないだときの一つひとつのまとまりです。引き算の項は、符号を付けたまま取り出します。', example: '3x−1 → 3x と −1' },
        { title: '係数は、文字にかけられている数', body: '3x は 3×x なので係数は3です。−b は −1×b と考えるため、bの係数は−1です。文字だけの項にも、見えない1がかかっています。', example: '−6a−b+2 → aの係数は−6、bの係数は−1' },
      ],
      check: ['引き算の符号を項に付けたままにした？', '文字だけの項を、係数1または−1として見た？'],
    },
    expressions: {
      title: '文字式を整理して計算する',
      lead: '同じ文字の項をまとめ、かっこ・符号・分数の順に落ち着いて処理します。',
      sections: [
        { title: '同類項だけをまとめる', body: '文字の部分が同じ項どうしなら、係数を計算できます。文字の違う項や、文字と数だけの項はまとめられません。', example: '4x+7x=(4+7)x=11x\n3a+2−5a+6=(3−5)a+(2+6)=−2a+8' },
        { title: 'かっこの前がマイナスなら、符号を変える', body: 'かっこの前の−は、かっこの中のすべての項に−1をかける合図です。', example: '(6a+9)−(4a+2)=6a+9−4a−2=2a+7' },
        { title: '分配法則と割り算', body: '数をかっこの中の各項にかけます。分数で割るときは、逆数をかけます。負の数の符号にも気をつけましょう。', example: '−7(3a−8)=−21a+56\n12a÷(−6/7)=12a×(−7/6)=−14a' },
      ],
      check: ['同じ文字の項だけをまとめた？', 'かっこの前の−を中の全項に反映した？', '分数で割るとき逆数をかけた？'],
    },
    equations: {
      title: '等式のバランスを保って方程式を解く',
      lead: '等式の両辺に同じ計算をして、文字を片側に残します。',
      sections: [
        { title: '移項は「反対の計算」と考える', body: '等式の両辺に同じ数を足す・引く・かける・割ると、等式は保たれます。移項はこの操作を短く書いたものです。', example: 'x−8=5\n両辺に8を足す → x=13' },
        { title: '文字を集め、最後に係数で割る', body: '文字を片側、数を反対側に移します。符号が変わることと、係数で割ることを忘れないようにします。', example: '3x−5=−17\n3x=−12 → x=−4' },
        { title: 'かっこ・小数・分数は、先に扱いやすくする', body: 'かっこを外して整理します。小数は10や100をかけて整数に、分数は分母の最小公倍数を両辺にかけて消せます。', example: '0.5x=0.2x−0.9\n両辺を10倍 → 5x=2x−9 → x=−3' },
      ],
      check: ['同じ操作を両辺にした？', '移項した項の符号を変えた？', '最後に係数で割った？'],
    },
    proportions: {
      title: '比例式は、外項と内項の積を使う',
      lead: '比の等しさを、かけ算の等式に直してxを求めます。',
      sections: [
        { title: '外側どうし・内側どうしをかける', body: 'a:b=c:d なら、外項 a と d の積、内項 b と c の積が等しくなります。これを使うと比例式を方程式に直せます。', example: 'x:2=5:1\n外項の積 x×1、内項の積 2×5\nx=10' },
        { title: 'xを含む式にしてから解く', body: '比にかっこがあっても、外項の積と内項の積を等しくします。その後はいつもの方程式と同じように整理します。', example: '6:9=2:(x−1)\n6(x−1)=9×2 → 6x−6=18 → x=4' },
        { title: '分数の答えもそのままで大丈夫', body: '割り切れない答えは、無理に小数にせず分数で表せます。最後に元の比例式へ代入して、比が合うか確かめましょう。', example: '4:5=1:x\n4x=5 → x=5/4' },
      ],
      check: ['外項と内項を取り違えていない？', '積の式からxを正しく解いた？', '分数の答えを約分し、代入して確かめた？'],
    },
  };

  function renderHome(activeTab = 'lesson', selectedLesson = 'terms') {
    const started = getStartedCount();
    const correct = getCorrectCount();
    const mistakeCount = getMistakeIds().length;
    const canResume = state.run?.status === 'practice' && state.run.ids?.length;
    const lesson = LESSONS[selectedLesson] || LESSONS.terms;
    const categoryTabs = Object.entries(CATEGORY_INFO).map(([key, category]) =>
      `<button type="button" class="lesson-tab ${key === selectedLesson ? 'active' : ''}" data-lesson-select="${key}" role="tab" aria-selected="${key === selectedLesson}">${escapeHtml(category.label)}</button>`).join('');
    const lessonSections = lesson.sections.map((section, index) =>
      `<article class="lesson-step"><span class="lesson-step-number">${index + 1}</span><div><h3>${escapeHtml(section.title)}</h3><p>${escapeHtml(section.body)}</p><pre>${formatMath(section.example)}</pre></div></article>`).join('');
    const lessonChecks = lesson.check.map((item) => `<li>${escapeHtml(item)}</li>`).join('');
    const cards = Object.entries(CATEGORY_INFO).map(([key, category]) => {
      const questions = categoryQuestions(key);
      const done = questions.filter((question) => getHistory(question.id).everCorrect).length;
      return `<article class="category-card">
        <span class="category-icon" aria-hidden="true">${escapeHtml(category.icon)}</span>
        <span class="category-copy"><strong>${escapeHtml(category.label)}</strong><small>${done} / ${questions.length}問正解</small></span>
        <span class="category-actions"><button type="button" class="secondary-button" data-open-lesson="${key}">講義</button><button type="button" class="primary-button" data-category="${key}">演習へ</button></span>
      </article>`;
    }).join('');

    app.innerHTML = `<section class="hero" aria-labelledby="page-title">
        <div class="hero-inner">
          <div class="eyebrow">Math study · 1st grade</div>
          <h1 id="page-title">学んでから解く。<br>解いて、理解を深める。</h1>
          <p>まずは分野別の講義で解き方を確認。そのあと選択式の問題に挑戦し、答え合わせで手順まで振り返れます。</p>
          <div class="hero-meta"><strong>58</strong><span>問の演習</span><span class="dot" aria-hidden="true"></span><span>いつでも何度でも</span></div>
        </div>
      </section>

      <nav class="study-tabs" role="tablist" aria-label="学習メニュー">
        <button type="button" role="tab" aria-selected="${activeTab === 'lesson'}" class="study-tab ${activeTab === 'lesson' ? 'active' : ''}" data-home-tab="lesson">分野別講義</button>
        <button type="button" role="tab" aria-selected="${activeTab === 'practice'}" class="study-tab ${activeTab === 'practice' ? 'active' : ''}" data-home-tab="practice">問題演習</button>
      </nav>
      ${activeTab === 'lesson' ? `<section class="panel lesson-panel" aria-labelledby="lesson-title">
        <div class="section-heading"><div><h2 id="lesson-title">講義で解き方を確認</h2><p>分野を切り替えて、例題と手順を読めます</p></div><span class="lesson-duration">目安 3分</span></div>
        <div class="lesson-tabs" role="tablist" aria-label="講義の分野">${categoryTabs}</div>
        <div class="lesson-intro"><span class="eyebrow">${escapeHtml(CATEGORY_INFO[selectedLesson].label)}</span><h3>${escapeHtml(lesson.title)}</h3><p>${escapeHtml(lesson.lead)}</p></div>
        <div class="lesson-steps">${lessonSections}</div>
        <aside class="lesson-check"><strong>問題を解く前の確認</strong><ul>${lessonChecks}</ul></aside>
        <button type="button" class="primary-button lesson-cta" data-category="${selectedLesson}">この分野の問題へ進む（${categoryQuestions(selectedLesson).length}問） →</button>
      </section>` : `<div class="main-grid">
        <section class="panel panel-pad" aria-labelledby="categories-title">
          <div class="section-heading"><div><h2 id="categories-title">今日はどこから解く？</h2><p>講義を読み直してから演習にも戻れます</p></div></div>
          <div class="category-list">${cards}</div>
        </section>
        <aside class="panel panel-pad actions-panel" aria-label="演習を始める">
          <button type="button" class="primary-button" data-start="all">全58問にチャレンジ <span aria-hidden="true">→</span></button>
          <button type="button" class="secondary-button" data-start="mistakes" ${mistakeCount ? '' : 'disabled'}>まちがえた問題を復習${mistakeCount ? `（${mistakeCount}問）` : ''}</button>
          ${canResume ? '<button type="button" class="secondary-button" data-action="resume">続きから再開</button>' : ''}
          <div class="mini-progress"><div class="mini-progress-head"><strong>これまでの学習</strong><span>${started} / ${QUESTIONS.length}問に挑戦</span></div><div class="progress-track" role="progressbar" aria-label="学習を始めた問題数" aria-valuemin="0" aria-valuemax="58" aria-valuenow="${started}"><div class="progress-fill" style="width:${(started / QUESTIONS.length) * 100}%"></div></div><p class="small">正解できた問題：${correct}問</p></div>
          <div class="callout"><strong>選んで答えて、解説で確認。</strong><br>正解でも間違いでも、答え合わせ後に正しい答えと解き方を確認できます。<br>大問12の（5）〜（8）は、正答をもとに作った類題です。</div>
          <p class="small" data-storage-notice hidden>このブラウザでは進み具合を保存できません。ページを閉じる前に結果を確認してください。</p>
        </aside>
      </div>`}
      <div class="button-row home-reset"><button type="button" class="danger-button" data-action="reset">学習記録をリセット</button></div>`;

    app.querySelectorAll('[data-home-tab]').forEach((button) => button.addEventListener('click', () => renderHome(button.dataset.homeTab, selectedLesson)));
    app.querySelectorAll('[data-lesson-select]').forEach((button) => button.addEventListener('click', () => renderHome('lesson', button.dataset.lessonSelect)));
    app.querySelectorAll('[data-open-lesson]').forEach((button) => button.addEventListener('click', () => renderHome('lesson', button.dataset.openLesson)));
    app.querySelectorAll('[data-start]').forEach((button) => button.addEventListener('click', () => {
      if (button.dataset.start === 'all') startRun('all', QUESTIONS.map((question) => question.id));
      if (button.dataset.start === 'mistakes') startRun('mistakes', getMistakeIds());
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

  function asDisplayMath(value) {
    return String(value).replace(/-/g, '−');
  }

  function termsAnswerObject(question) {
    const answer = {};
    question.fields.forEach((field) => { answer[field.key] = field.expected; });
    return answer;
  }

  function termsAnswerText(question, answer) {
    return question.fields.map((field) => {
      const value = Array.isArray(answer[field.key]) ? answer[field.key].join('、') : answer[field.key];
      const label = field.key === 'terms' ? '項' : field.label.replace(/（.*$/, '');
      return `${label}：${asDisplayMath(value ?? '')}`;
    }).join(' ／ ');
  }

  function makeChoiceOptions(question) {
    const correct = question.type === 'terms' ? termsAnswerObject(question) : question.answer;
    const candidates = [{ value: correct, correct: true }];
    const add = (value) => {
      if (question.type === 'terms') {
        const same = question.fields.every((field) => {
          const left = value[field.key];
          const right = correct[field.key];
          if (Array.isArray(left) || Array.isArray(right)) return JSON.stringify(left) === JSON.stringify(right);
          return sameLinearExpression(left, right);
        });
        if (same) return;
        if (!candidates.some((item) => question.fields.every((field) => JSON.stringify(item.value[field.key]) === JSON.stringify(value[field.key])))) candidates.push({ value, correct: false });
        return;
      }
      const equal = question.type === 'expression' ? sameLinearExpression(value, correct) : Math.abs(parseNumber(normalizeInput(value)) - parseNumber(normalizeInput(correct))) < 1e-8;
      if (!equal && !candidates.some((item) => (question.type === 'expression' ? sameLinearExpression(item.value, value) : Math.abs(parseNumber(item.value) - parseNumber(value)) < 1e-8))) candidates.push({ value, correct: false });
    };

    if (question.type === 'terms') {
      const base = termsAnswerObject(question);
      const termField = question.fields.find((field) => Array.isArray(field.expected));
      if (termField) {
        termField.expected.forEach((term, index) => {
          const changed = JSON.parse(JSON.stringify(base));
          changed[termField.key] = [...termField.expected];
          changed[termField.key][index] = term.startsWith('-') ? term.slice(1) : `-${term}`;
          add(changed);
        });
      }
      question.fields.filter((field) => !Array.isArray(field.expected)).forEach((field) => {
        const n = parseNumber(field.expected);
        [String(-n), String(n + (n >= 0 ? 1 : -1)), String(n - (n >= 0 ? 1 : -1))].forEach((variant) => {
          const changed = JSON.parse(JSON.stringify(base));
          changed[field.key] = variant;
          add(changed);
        });
      });
    } else if (question.type === 'value') {
      const value = parseNumber(normalizeInput(correct));
      const direction = value >= 0 ? 1 : -1;
      const variants = [-value, value + direction, value - direction, value * 2, value / 2,
        value + direction * 2, value - direction * 2, value + direction * 3, value - direction * 3];
      if (value !== 0) variants.push(1 / value);
      variants.map(formatRational).forEach(add);
    } else {
      const parsed = parseLinear(correct);
      if (parsed) {
        const variables = ['a', 'x', 'y'].filter((key) => parsed[key] !== 0);
        const first = variables[0];
        const changed = { ...parsed };
        Object.keys(changed).forEach((key) => { changed[key] *= -1; });
        add(formatLinear(changed));
        if (first) {
          [1, -1, 2, -2, 3, -3].forEach((delta) => {
            const altered = { ...parsed, [first]: parsed[first] + delta };
            add(formatLinear(altered));
          });
        }
        if (parsed.constant !== 0) {
          add(formatLinear({ ...parsed, constant: -parsed.constant }));
          const direction = parsed.constant > 0 ? 1 : -1;
          [1, -1, 2, -2].forEach((delta) => add(formatLinear({ ...parsed, constant: parsed.constant + direction * delta })));
        }
      }
    }

    // 固定シードで並び順を安定させつつ、正答が毎回同じ位置にならないようにします。
    let seed = [...question.id].reduce((sum, character) => (sum * 31 + character.charCodeAt(0)) >>> 0, 7);
    const options = candidates.slice(0, 4);
    for (let i = options.length - 1; i > 0; i -= 1) {
      seed = (seed * 1664525 + 1013904223) >>> 0;
      const j = seed % (i + 1);
      [options[i], options[j]] = [options[j], options[i]];
    }
    return options.map((option, index) => ({ ...option, key: String.fromCharCode(65 + index) }));
  }

  function formatRational(value) {
    if (!Number.isFinite(value)) return '0';
    if (Math.abs(value - Math.round(value)) < 1e-8) return String(Math.round(value));
    for (let denominator = 2; denominator <= 100; denominator += 1) {
      const numerator = Math.round(value * denominator);
      if (Math.abs(numerator / denominator - value) < 1e-8) {
        let a = Math.abs(numerator);
        let b = denominator;
        while (b) [a, b] = [b, a % b];
        return `${numerator / a}/${denominator / a}`;
      }
    }
    return String(Number(value.toFixed(3)));
  }

  function formatLinear(coefficients) {
    const pieces = [];
    ['a', 'x', 'y', 'constant'].forEach((key) => {
      const value = coefficients[key];
      if (!value) return;
      const abs = Math.abs(value);
      const body = key === 'constant' ? formatRational(abs) : `${abs === 1 ? '' : formatRational(abs)}${key}`;
      if (!pieces.length) pieces.push(value < 0 ? `-${body}` : body);
      else pieces.push(`${value < 0 ? '-' : '+'}${body}`);
    });
    return pieces.join('') || '0';
  }

  function makeAnswerOptionText(question, option) {
    if (question.type === 'terms') return termsAnswerText(question, option.value);
    return question.type === 'value' ? `${question.variable} = ${asDisplayMath(option.value)}` : asDisplayMath(option.value);
  }

  function renderAnswerInput(question, draft) {
    if (question.type === 'multiChoice') {
      const selected = Array.isArray(draft) ? draft : [];
      return `<div class="answer-block"><h3 id="answer-heading">あてはまるものをすべて選びましょう</h3><div class="option-list" role="group" aria-labelledby="answer-heading">
        ${question.choices.map((choice) => `<label class="option-label"><input type="checkbox" data-choice="${choice.key}" ${selected.includes(choice.key) ? 'checked' : ''}><span>${escapeHtml(choice.text)}</span></label>`).join('')}
      </div></div>`;
    }
    const options = makeChoiceOptions(question);
    return `<div class="answer-block"><h3 id="answer-heading">答えを1つ選びましょう</h3><div class="option-list" role="radiogroup" aria-labelledby="answer-heading">
      ${options.map((option) => `<label class="option-label"><input type="radio" name="answer-choice" data-answer-choice="${option.key}" value="${option.key}" ${draft === option.key ? 'checked' : ''}><span class="option-letter">${option.key}</span><span>${formatMath(escapeHtml(makeAnswerOptionText(question, option)))}</span></label>`).join('')}
    </div></div>`;
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
          <div class="question-tools"><button type="button" class="hint-button" id="hint-button" aria-expanded="false">ヒントを見る <span aria-hidden="true">＋</span></button><span class="small">${history.attempts ? `これまで ${history.attempts} 回回答` : '分からないときは、あとで戻れます'}</span></div>
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
        const answerInput = app.querySelector('[data-answer-choice], [data-choice]');
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

  function bindQuestionInputs(question) {
    app.querySelectorAll('[data-choice]').forEach((input) => input.addEventListener('change', () => {
      setDraft(question, [...app.querySelectorAll('[data-choice]:checked')].map((item) => item.dataset.choice));
    }));
    app.querySelectorAll('[data-answer-choice]').forEach((input) => input.addEventListener('change', () => {
      setDraft(question, input.value);
    }));
  }

  function feedbackHtml(question, correct, answer, history) {
    const title = correct ? '正解です。解き方も確認しましょう。' : '大丈夫。正しい答えと解き方を確認しましょう。';
    const extra = history.attempts > 1 ? `<span class="small"> ${history.attempts}回目の答え合わせ</span>` : '';
    const action = correct
      ? `<button type="button" class="primary-button" data-feedback-action="next">${state.run.index === state.run.ids.length - 1 ? '結果を見る' : '次の問題へ'} →</button>`
      : `<div class="button-row"><button type="button" class="secondary-button" data-feedback-action="retry">答えを直す</button><button type="button" class="primary-button" data-feedback-action="next">${state.run.index === state.run.ids.length - 1 ? '結果を見る' : '次の問題へ'} →</button></div>`;
    const displayAnswer = question.type === 'multiChoice'
      ? (answer || []).map((key) => question.choices.find((choice) => choice.key === key)?.text || key).join('、') || '未選択'
      : makeChoiceOptions(question).find((option) => option.key === answer) ? makeAnswerOptionText(question, makeChoiceOptions(question).find((option) => option.key === answer)) : '未選択';
    const correctAnswer = question.type === 'multiChoice'
      ? question.correct.map((key) => question.choices.find((choice) => choice.key === key)?.text || key).join('、')
      : makeAnswerOptionText(question, makeChoiceOptions(question).find((option) => option.correct));
    return `<section class="feedback ${correct ? '' : 'wrong'}" aria-live="polite"><p class="feedback-title">${title}${extra}</p>
      <p class="your-answer"><strong>あなたの選択：</strong>${formatMath(escapeHtml(displayAnswer))}</p>
      ${correct ? '' : `<p class="correct-answer"><strong>正しい答え：</strong>${formatMath(escapeHtml(correctAnswer))}</p>`}
      <div class="solution-block"><h3>解き方</h3><p class="solution">${formatMath(escapeHtml(question.explanation))}</p></div>
      <div class="feedback-actions">${action}</div>
    </section>`;
  }

  function readAnswer(question) {
    if (question.type === 'multiChoice') return [...app.querySelectorAll('[data-choice]:checked')].map((input) => input.dataset.choice);
    return app.querySelector('[data-answer-choice]:checked')?.value || '';
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

  function checkAnswer(question, answer) {
    if (question.type === 'multiChoice') {
      const selected = [...answer].sort();
      const expected = [...question.correct].sort();
      return selected.length === expected.length && selected.every((choice, index) => choice === expected[index]);
    }
    return makeChoiceOptions(question).some((option) => option.key === answer && option.correct);
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
      if (notice) notice.textContent = '答えを選んでください。';
      const firstInput = app.querySelector('input[type="radio"], input[type="checkbox"]');
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
