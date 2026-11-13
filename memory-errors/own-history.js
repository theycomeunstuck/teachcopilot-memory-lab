"use strict";

(() => {
  const data = window.OWN_HISTORY_EVAL;
  const bars = document.querySelector("#own-eval-bars");
  const questionSelect = document.querySelector("#own-question");
  const caseView = document.querySelector("#own-case");
  const esc = value => String(value ?? "").replace(/[&<>"']/g,
    character => ({"&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;"}[character]));
  const methods = [
    {id:"legacy_cosine+0.04exact", title:"Формула Алёны в стенде", detail:"близость + небольшая поправка за слова"},
    {id:"vector_only", title:"Только по смыслу", detail:"BGE-M3 и косинусная близость"},
    {id:"rrf_cosine+bm25prefix5", title:"Объединение двух поисков", detail:"векторный и лексический списки · RRF"},
    {id:"bm25_prefix5", title:"По словам", detail:"BM25 и упрощённые основы слов"},
  ];
  const roles = {child:"Ребёнок", student:"Ребёнок", assistant:"Ассистент", teacher:"Преподаватель"};
  const percent = value => `${(value * 100).toLocaleString("ru-RU", {minimumFractionDigits:1,maximumFractionDigits:1})}%`;
  if (!data || data.data_origin !== "synthetic_llm_generated" || !Array.isArray(data.questions)) {
    bars.innerHTML = '<p class="error">Сохранённые результаты не загрузились. Их можно открыть в JSON ниже.</p>';
    questionSelect.disabled = true;
    return;
  }

  const histories = new Map(data.histories.map(history => [history.history_id, history]));
  const questions = new Map(data.questions.map(question => [question.request_id, question]));
  const result = (id, method) => data.rows.find(row => row.qid === id && row.method === method);
  const state = {question: "ru-n01-q08-fp", lesson: null};

  bars.innerHTML = methods.map(method => {
    const rows = data.rows.filter(row => row.method === method.id && row.coverage !== null);
    const mean = rows.reduce((sum, row) => sum + row.coverage, 0) / rows.length;
    const hit = rows.filter(row => row.hit).length;
    const all = rows.filter(row => row.coverage === 1).length;
    return `<div class="own-bar-row"><div class="own-method"><strong>${esc(method.title)}</strong><span>${esc(method.detail)}</span></div><div class="own-bar-track" aria-hidden="true"><div class="own-bar-fill" style="width:${Math.max(0,Math.min(100,mean * 100))}%"></div></div><div class="own-bar-number"><strong>${esc(percent(mean))}</strong><span>хотя бы один: ${hit}/${rows.length} · все: ${all}/${rows.length}</span></div></div>`;
  }).join("");

  questionSelect.innerHTML = data.questions.map(question =>
    `<option value="${esc(question.request_id)}">${esc(question.request_id)} · ${esc(question.text)}</option>`).join("");

  function renderTurns() {
    const question = questions.get(state.question);
    const history = histories.get(question.history_id);
    const lessons = state.lesson === "all" ? history.lessons : history.lessons.filter(lesson => lesson.lesson_id === state.lesson);
    const gold = new Set(question.gold_turn_ids);
    document.querySelector("#own-turns").innerHTML = lessons.map(lesson =>
      `<section class="own-lesson"><h4>${esc(lesson.lesson_id)} · ${esc(lesson.observed_on)}</h4>${lesson.turns.map(turn =>
        `<article class="turn${gold.has(turn.turn_id) ? " gold" : ""}"><div class="turn-meta"><span>${esc(roles[turn.role] || turn.role)}</span><span>${esc(turn.turn_id)}</span>${gold.has(turn.turn_id) ? '<span class="turn-mark gold-mark">эталон</span>' : ""}</div><p>${esc(turn.text)}</p></article>`).join("")}</section>`).join("");
  }

  function renderCase(resetLesson = true) {
    const question = questions.get(state.question);
    const history = question && histories.get(question.history_id);
    if (!question || !history) {
      caseView.innerHTML = '<p class="error">Сохранённый вопрос или история не найдены.</p>';
      return;
    }
    questionSelect.value = question.request_id;
    const gold = question.gold_turn_ids;
    if (resetLesson) {
      state.lesson = gold.length
        ? (history.lessons.find(lesson => lesson.turns.some(turn => turn.turn_id === gold[0]))?.lesson_id || "all")
        : "all";
    }
    const cards = methods.map(method => {
      const row = result(question.request_id, method.id);
      if (!row) return `<article><h4>${esc(method.title)}</h4><p>Строка не сохранена.</p></article>`;
      if (!gold.length) return `<article><h4>${esc(method.title)}</h4><strong>${row.returned_any ? "Фрагменты возвращены" : "Ничего не возвращено"}</strong><p>Эталонных реплик нет. Ответ модели не оценивался.</p></article>`;
      const count = Math.round(row.coverage * gold.length);
      return `<article><h4>${esc(method.title)}</h4><strong>${count} из ${gold.length} эталонных</strong><p>${row.returned_any ? `Всего отобрано реплик: ${esc(row.quoted_turns)}.` : "Цитаты не вернулись."}</p></article>`;
    }).join("");
    const expected = gold.length ? question.expected : "По разметке набора ответа на этот вопрос в истории нет.";
    caseView.innerHTML = `<div class="own-case-question" tabindex="-1"><p class="micro">${esc(question.request_id)} · ${esc(question.history_id)}</p><h4>${esc(question.text)}</h4><p><strong>Авторский эталон:</strong> ${esc(expected)}</p>${gold.length ? `<p class="own-gold-ids">Размеченные ID: ${gold.map(esc).join(", ")}</p>` : ""}</div><div class="own-results">${cards}</div><p class="own-trace-limit"><strong>Чего в записи нет:</strong> точных выбранных реплик, их оценок близости и ответа модели. Здесь нельзя определить, какие именно эталонные ID попали при частичном результате.</p><div class="own-dialogue"><h4>Исходная вымышленная переписка</h4><p>Янтарным отмечены эталонные реплики, а не результат поиска. Можно открыть всю историю или другое занятие.</p><label for="own-lesson">Занятие</label><select id="own-lesson"><option value="all">Вся история · ${history.lessons.reduce((n,lesson) => n + lesson.turns.length,0)} реплик</option>${history.lessons.map(lesson => `<option value="${esc(lesson.lesson_id)}">${esc(lesson.lesson_id)} · ${esc(lesson.observed_on)}</option>`).join("")}</select><div id="own-turns" class="own-turns" tabindex="0" aria-label="Исходные реплики синтетической истории"></div></div>`;
    const lessonSelect = document.querySelector("#own-lesson");
    lessonSelect.value = state.lesson;
    lessonSelect.addEventListener("change", event => { state.lesson = event.target.value; renderTurns(); });
    renderTurns();
  }

  questionSelect.addEventListener("change", event => { state.question = event.target.value; renderCase(); });
  document.querySelectorAll("[data-own-pick]").forEach(button => button.addEventListener("click", () => {
    state.question = button.dataset.ownPick;
    renderCase();
    caseView.querySelector(".own-case-question")?.focus();
  }));
  renderCase();
})();
