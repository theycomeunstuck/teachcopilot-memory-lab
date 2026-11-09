"use strict";

(() => {
  const data = window.TEACHCOPILOT_AUDIT;
  const $ = (selector, root = document) => root.querySelector(selector);
  const esc = value => String(value ?? "").replace(/[&<>"']/g, character => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[character]));
  const asArray = value => Array.isArray(value) ? value : [];
  const unique = values => [...new Set(asArray(values))];
  const intersect = (left, right) => {
    const rightSet = new Set(asArray(right));
    return unique(left).filter(value => rightSet.has(value));
  };
  const labelByRole = {teacher:"Преподаватель", student:"Ребёнок", system:"Система"};
  const verdictLabel = {correct:"корректно", partial:"частично", incorrect:"некорректно", unanswerable:"нет ответа"};
  const supportLabel = {supported:"подтверждено", partial:"подтверждено частично", unsupported:"не подтверждено", no_citations:"нет ссылок"};
  const truncate = (text, length = 92) => text.length > length ? `${text.slice(0, length - 1)}…` : text;

  if (!data || !Array.isArray(data.cases)) {
    const target = $("#audit-case");
    if (target) target.innerHTML = '<p class="audit-error">Не удалось загрузить публичный набор для проверки.</p>';
    return;
  }

  const histories = asArray(data.histories);
  const questions = asArray(data.questions);
  const cases = asArray(data.cases);
  const historyById = new Map(histories.map(history => [history.history_id, history]));
  const caseById = new Map(cases.map(record => [record.caseId, record]));
  const questionById = new Map(questions.map(question => [question.request_id, question]));
  const turnById = new Map();
  const lessonByTurnId = new Map();

  histories.forEach(history => asArray(history.lessons).forEach(lesson => asArray(lesson.turns).forEach(turn => {
    turnById.set(turn.turn_id, {...turn, historyId:history.history_id, lessonId:lesson.lesson_id, observedOn:lesson.observed_on});
    lessonByTurnId.set(turn.turn_id, lesson);
  })));

  const initialHistory = histories[0]?.history_id || "";
  const initialQuestion = questions.find(question => question.history_id === initialHistory)?.request_id || "";
  const preferredMode = data.modeOrder?.includes("hybrid") ? "hybrid" : asArray(data.modeOrder)[0];
  const state = {historyId:initialHistory, requestId:initialQuestion, modeId:preferredMode, transcriptView:"relevant", tableHistory:"all", tableMode:"all", tableVerdict:"all"};

  const control = {
    history: $("#audit-history"),
    question: $("#audit-question"),
    mode: $("#audit-mode"),
    transcript: $("#audit-transcript-view"),
    summary: $("#audit-summary"),
    case: $("#audit-case"),
    transcriptNote: $("#audit-transcript-note"),
    transcriptBody: $("#audit-transcript"),
    tableHistory: $("#audit-table-history"),
    tableMode: $("#audit-table-mode"),
    tableVerdict: $("#audit-table-verdict"),
    tableCount: $("#audit-table-count"),
    tableBody: $("#audit-table-body")
  };

  const currentHistory = () => historyById.get(state.historyId);
  const questionsForHistory = () => questions.filter(question => question.history_id === state.historyId);
  const currentCase = () => cases.find(record => record.historyId === state.historyId && record.requestId === state.requestId && record.modeId === state.modeId);
  const modeName = modeId => data.modeLabels?.[modeId] || modeId;
  const sourceLink = sourceId => `<button type="button" class="audit-source-chip" data-audit-source-id="${esc(sourceId)}">${esc(sourceId)}</button>`;

  function fillOptions(select, options, selectedValue) {
    if (!select) return;
    select.innerHTML = options.map(option => `<option value="${esc(option.value)}">${esc(option.label)}</option>`).join("");
    select.value = options.some(option => option.value === selectedValue) ? selectedValue : options[0]?.value || "";
  }

  function renderSelectors() {
    if (!questionsForHistory().some(question => question.request_id === state.requestId)) state.requestId = questionsForHistory()[0]?.request_id || "";
    const availableModes = asArray(data.modeOrder).filter(modeId => cases.some(record => record.historyId === state.historyId && record.requestId === state.requestId && record.modeId === modeId));
    if (!availableModes.includes(state.modeId)) state.modeId = availableModes[0] || "";

    fillOptions(control.history, histories.map(history => ({value:history.history_id, label:`${history.history_id} · ${asArray(history.lessons).length} занятий`})), state.historyId);
    fillOptions(control.question, questionsForHistory().map(question => ({value:question.request_id, label:`${question.request_id} · ${truncate(question.text, 110)}`})), state.requestId);
    fillOptions(control.mode, availableModes.map(modeId => ({value:modeId, label:modeName(modeId)})), state.modeId);

    const history = currentHistory();
    const transcriptOptions = [
      {value:"relevant", label:"Только реплики этого прогона"},
      {value:"all", label:`Вся история · ${asArray(history?.lessons).flatMap(lesson => asArray(lesson.turns)).length} реплик`},
      ...asArray(history?.lessons).map(lesson => ({value:`lesson:${lesson.lesson_id}`, label:`${lesson.lesson_id} · ${lesson.observed_on} · ${asArray(lesson.turns).length} реплик`}))
    ];
    if (!transcriptOptions.some(option => option.value === state.transcriptView)) state.transcriptView = "relevant";
    fillOptions(control.transcript, transcriptOptions, state.transcriptView);

    fillOptions(control.tableHistory, [{value:"all", label:"Все истории"}, ...histories.map(history => ({value:history.history_id, label:history.history_id}))], state.tableHistory);
    fillOptions(control.tableMode, [{value:"all", label:"Все методы"}, ...asArray(data.modeOrder).map(modeId => ({value:modeId, label:modeName(modeId)}))], state.tableMode);
    fillOptions(control.tableVerdict, [{value:"all", label:"Все вердикты"}, ...Object.keys(verdictLabel).map(value => ({value, label:verdictLabel[value]}))], state.tableVerdict);
  }

  function triggerInfo(hitIds, expectedIds, kind) {
    const expected = unique(expectedIds);
    const hits = unique(hitIds);
    if (!expected.length) return {kind:"na", title:"Не применяется", text:"Для этого вопроса нет эталонных реплик: проверяется отказ от выдуманного прошлого, а не полнота поиска."};
    const ratio = `${hits.length} из ${expected.length}`;
    if (hits.length === expected.length) return {
      kind:"yes",
      title:kind === "selected" ? `Поиск сработал: ${ratio}` : `Ответ сослался: ${ratio}`,
      text:kind === "selected" ? "Все эталонные реплики попали в переданную памяти выборку." : "Все эталонные реплики есть среди ссылок, сохранённых вместе с ответом."
    };
    if (hits.length) return {
      kind:"partial",
      title:kind === "selected" ? `Поиск сработал частично: ${ratio}` : `Ответ сослался частично: ${ratio}`,
      text:kind === "selected" ? "В память попала только часть размеченных исходных реплик." : "Ответ сослался только на часть размеченных источников."
    };
    return {
      kind:"no",
      title:kind === "selected" ? "Поиск не нашёл эталон" : "Ответ не сослался на эталон",
      text:kind === "selected" ? "Ни одна эталонная реплика не вошла в выборку памяти." : "Среди сохранённых ссылок ответа нет эталонной реплики."
    };
  }

  function triggerCard(title, info, extra = "") {
    return `<article class="audit-trigger audit-trigger-${info.kind}"><p>${esc(title)}</p><h4>${esc(info.title)}</h4><span>${esc(info.text)}</span>${extra}</article>`;
  }

  function renderSummary() {
    if (!control.summary) return;
    const total = cases.length;
    const counts = cases.reduce((result, record) => {
      const key = record.review?.newVerdict || "unknown";
      result[key] = (result[key] || 0) + 1;
      return result;
    }, {});
    const expectedCases = cases.filter(record => asArray(record.expectedSourceIds).length > 0);
    const retrievalHits = expectedCases.filter(record => intersect(record.selectedSourceIds, record.expectedSourceIds).length > 0).length;
    control.summary.innerHTML = `<div><strong>${total} сохранённых прогонов</strong><span>${data.coverage?.lessons || "–"} занятий · ${data.coverage?.turns || "–"} синтетических реплик · ${data.coverage?.questions || "–"} вопросов</span></div><div><strong>${counts.correct || 0} корректных · ${counts.partial || 0} частичных · ${counts.incorrect || 0} некорректных</strong><span>автоматическая слепая оценка</span></div><div><strong>${retrievalHits} из ${expectedCases.length} поисков с попаданием</strong><span>хотя бы одна эталонная реплика вошла в память</span></div>`;
  }

  function renderTurn(turn, record, compact = false) {
    const expected = new Set(asArray(record?.expectedSourceIds));
    const selected = new Set(asArray(record?.selectedSourceIds));
    const cited = new Set(asArray(record?.citedSourceIds));
    const markers = [];
    if (expected.has(turn.turn_id)) markers.push('<span class="audit-turn-mark audit-mark-expected">эталон</span>');
    if (selected.has(turn.turn_id)) markers.push('<span class="audit-turn-mark audit-mark-selected">в памяти</span>');
    if (cited.has(turn.turn_id)) markers.push('<span class="audit-turn-mark audit-mark-cited">ссылка ответа</span>');
    const classes = ["audit-turn", expected.has(turn.turn_id) && "is-expected", selected.has(turn.turn_id) && "is-selected", cited.has(turn.turn_id) && "is-cited"].filter(Boolean).join(" ");
    return `<article${compact ? "" : ` id="audit-turn-${esc(turn.turn_id)}"`} class="${classes}"><div class="audit-turn-meta"><span>${esc(labelByRole[turn.role] || turn.role)}</span><span>${esc(turn.turn_id)}</span>${compact ? "" : `<span>${esc(turn.observedOn || "")}</span>`}${markers.join("")}</div><p>${esc(turn.text)}</p></article>`;
  }

  function selectedTurns(record) {
    return unique(record.selectedSourceIds).map(id => turnById.get(id)).filter(Boolean);
  }

  function renderSelectedTurns(record) {
    const turns = selectedTurns(record);
    if (!turns.length) return '<p class="audit-empty">В сохранённом прогоне нет выбранных реплик.</p>';
    const preview = turns.slice(0, 12).map(turn => renderTurn(turn, record, true)).join("");
    const rest = turns.slice(12).map(turn => renderTurn(turn, record, true)).join("");
    return `<div class="audit-selected-turns">${preview}${rest ? `<details><summary>Ещё ${turns.length - 12} выбранных реплик</summary><div class="audit-more-turns">${rest}</div></details>` : ""}</div>`;
  }

  function renderCase() {
    const record = currentCase();
    if (!control.case) return;
    if (!record) {
      control.case.innerHTML = '<p class="audit-error">Для этого сочетания не найден сохранённый прогон.</p>';
      return;
    }
    const selectedHits = intersect(record.selectedSourceIds, record.expectedSourceIds);
    const citedHits = intersect(record.citedSourceIds, record.expectedSourceIds);
    const selection = triggerInfo(selectedHits, record.expectedSourceIds, "selected");
    const citations = triggerInfo(citedHits, record.expectedSourceIds, "cited");
    const review = record.review || {};
    const verdict = review.newVerdict || "unknown";
    const sourceSupport = review.newSourceSupport || "no_citations";
    const expectedLinks = asArray(record.expectedSourceIds).length ? asArray(record.expectedSourceIds).map(sourceLink).join("") : '<span class="audit-no-source">Нет эталонных источников для вопроса с ожидаемым отказом.</span>';
    const selectedLinks = asArray(record.selectedSourceIds).map(sourceLink).join("") || '<span class="audit-no-source">Нет выбранных источников.</span>';
    const citedLinks = asArray(record.citedSourceIds).map(sourceLink).join("") || '<span class="audit-no-source">Ответ не сохранил ссылок.</span>';
    const automatic = {kind:verdict === "correct" ? "yes" : verdict === "partial" ? "partial" : "no", title:`Автовердикт: ${verdictLabel[verdict] || verdict}`, text:`Поддержка источниками: ${supportLabel[sourceSupport] || sourceSupport}. Это автоматическая, а не человеческая оценка.`};

    control.case.innerHTML = `<div class="audit-question-card"><div><p class="audit-overline">Вопрос ${esc(record.requestId)} · ${esc(record.category || "без категории")}</p><h3>${esc(record.question)}</h3></div><div><p class="audit-overline">Эталон для проверки</p><p>${esc(record.expected || "Ожидался осторожный отказ без выдуманного прошлого.")}</p><div class="audit-source-row"><span>Размеченные реплики</span>${expectedLinks}</div></div></div><div class="audit-trigger-grid">${triggerCard("1 · выбранная память", selection, `<div class="audit-trigger-ids">${selectedHits.length ? selectedHits.map(sourceLink).join("") : ""}</div>`)}${triggerCard("2 · ссылки ответа", citations, `<div class="audit-trigger-ids">${citedHits.length ? citedHits.map(sourceLink).join("") : ""}</div>`)}${triggerCard("3 · качество ответа", automatic)}</div><div class="audit-proof-grid"><article><p class="audit-overline">Что действительно передали модели</p><p><strong>${asArray(record.selectedSourceIds).length} реплик</strong> · ${esc(record.memoryTokens ?? "–")} токенов · измерение: ${esc(record.memoryTokenMeasurement || "не указано")}</p><div class="audit-source-row"><span>Выбранные ID</span>${selectedLinks}</div></article><article><p class="audit-overline">Сохранённый след</p><p><code>${esc(record.memorySha256 || "нет SHA-256")}</code></p><p class="audit-small">Хеш связывает этот экран с точной сериализованной памятью из сохранённого прогона.</p><details class="audit-raw"><summary>Открыть точный JSON памяти</summary><pre>${esc(record.memoryRaw || "")}</pre></details></article></div><div class="audit-answer-grid"><article class="audit-selected-panel"><p class="audit-overline">Выбранные исходные реплики</p>${renderSelectedTurns(record)}</article><article class="audit-answer-panel"><p class="audit-overline">Сохранённый ответ модели</p><p class="audit-answer-text">${esc(record.answer || "")}</p><div class="audit-source-row"><span>Ссылки в ответе</span>${citedLinks}</div><div class="audit-review"><strong>Основание автоматической оценки</strong><p>${esc(review.evidence || "Обоснование не сохранено.")}</p></div></article></div>`;
  }

  function renderTranscript() {
    const history = currentHistory();
    const record = currentCase();
    if (!control.transcriptBody || !history || !record) return;
    const allTurns = asArray(history.lessons).flatMap(lesson => asArray(lesson.turns).map(turn => ({...turn, observedOn:lesson.observed_on, lessonId:lesson.lesson_id})));
    let turns;
    let note;
    if (state.transcriptView === "all") {
      turns = allTurns;
      note = `Полная синтетическая история: ${allTurns.length} реплик. Для большой h08 её вывод может занять время.`;
    } else if (state.transcriptView.startsWith("lesson:")) {
      const lessonId = state.transcriptView.slice("lesson:".length);
      turns = allTurns.filter(turn => turn.lessonId === lessonId);
      note = `Одно занятие: ${turns.length} реплик.`;
    } else {
      const related = new Set([...asArray(record.expectedSourceIds), ...asArray(record.selectedSourceIds), ...asArray(record.citedSourceIds)]);
      turns = allTurns.filter(turn => related.has(turn.turn_id));
      note = `Показаны ${turns.length} реплик, связанных с этим прогоном. Нажмите ID, чтобы открыть соответствующее занятие или всю историю.`;
    }
    if (control.transcriptNote) control.transcriptNote.textContent = note;
    if (!turns.length) {
      control.transcriptBody.innerHTML = '<p class="audit-empty">Для этого вопроса в эталоне и сохранённой памяти нет реплик. Это ожидаемо для проверки корректного отказа.</p>';
      return;
    }
    const groups = new Map();
    turns.forEach(turn => {
      if (!groups.has(turn.lessonId)) groups.set(turn.lessonId, []);
      groups.get(turn.lessonId).push(turn);
    });
    control.transcriptBody.innerHTML = [...groups.entries()].map(([lessonId, lessonTurns]) => {
      const lesson = asArray(history.lessons).find(item => item.lesson_id === lessonId);
      return `<section class="audit-lesson"><header><strong>${esc(lessonId)}</strong><span>${esc(lesson?.observed_on || "")}</span><span>${lessonTurns.length} реплик</span></header><div>${lessonTurns.map(turn => renderTurn(turn, record)).join("")}</div></section>`;
    }).join("");
  }

  function cellTrigger(hits, expected) {
    const expectedIds = unique(expected);
    if (!expectedIds.length) return '<span class="audit-cell-na">не применяется</span>';
    const kind = !hits.length ? "no" : hits.length === expectedIds.length ? "yes" : "partial";
    return `<span class="audit-cell-trigger is-${kind}">${hits.length}/${expectedIds.length}</span>`;
  }

  function renderTable() {
    if (!control.tableBody) return;
    const filtered = cases.filter(record => (state.tableHistory === "all" || record.historyId === state.tableHistory) && (state.tableMode === "all" || record.modeId === state.tableMode) && (state.tableVerdict === "all" || record.review?.newVerdict === state.tableVerdict));
    if (control.tableCount) control.tableCount.textContent = `Показано ${filtered.length} из ${cases.length} сохранённых случаев.`;
    control.tableBody.innerHTML = filtered.map(record => {
      const selectedHits = intersect(record.selectedSourceIds, record.expectedSourceIds);
      const citedHits = intersect(record.citedSourceIds, record.expectedSourceIds);
      const verdict = record.review?.newVerdict || "unknown";
      return `<tr><td><strong>${esc(record.historyId)} · ${esc(record.requestId)}</strong><span>${esc(truncate(record.question, 78))}</span></td><td>${esc(modeName(record.modeId))}</td><td>${cellTrigger(selectedHits, record.expectedSourceIds)}</td><td>${cellTrigger(citedHits, record.expectedSourceIds)}</td><td><span class="audit-cell-verdict is-${esc(verdict)}">${esc(verdictLabel[verdict] || verdict)}</span></td><td><button type="button" class="audit-open-case" data-audit-case-id="${esc(record.caseId)}">Открыть</button></td></tr>`;
    }).join("") || '<tr><td colspan="6" class="audit-empty">По выбранным фильтрам нет случаев.</td></tr>';
  }

  function renderAll() {
    renderSelectors();
    renderSummary();
    renderCase();
    renderTranscript();
    renderTable();
  }

  control.history?.addEventListener("change", event => {
    state.historyId = event.target.value;
    state.requestId = questionsForHistory()[0]?.request_id || "";
    state.transcriptView = "relevant";
    renderAll();
  });
  control.question?.addEventListener("change", event => {
    state.requestId = event.target.value;
    state.transcriptView = "relevant";
    renderAll();
  });
  control.mode?.addEventListener("change", event => {
    state.modeId = event.target.value;
    state.transcriptView = "relevant";
    renderAll();
  });
  control.transcript?.addEventListener("change", event => {
    state.transcriptView = event.target.value;
    renderTranscript();
  });
  control.tableHistory?.addEventListener("change", event => {
    state.tableHistory = event.target.value;
    renderTable();
  });
  control.tableMode?.addEventListener("change", event => {
    state.tableMode = event.target.value;
    renderTable();
  });
  control.tableVerdict?.addEventListener("change", event => {
    state.tableVerdict = event.target.value;
    renderTable();
  });
  document.addEventListener("click", event => {
    const source = event.target.closest("[data-audit-source-id]");
    if (source) {
      const sourceId = source.dataset.auditSourceId;
      const lesson = lessonByTurnId.get(sourceId);
      if (lesson) {
        state.transcriptView = `lesson:${lesson.lesson_id}`;
        renderSelectors();
        renderTranscript();
        requestAnimationFrame(() => $("#audit-turn-" + CSS.escape(sourceId))?.scrollIntoView({behavior:"smooth", block:"center"}));
      }
      return;
    }
    const opener = event.target.closest("[data-audit-case-id]");
    if (!opener) return;
    const record = caseById.get(opener.dataset.auditCaseId);
    if (!record) return;
    state.historyId = record.historyId;
    state.requestId = record.requestId;
    state.modeId = record.modeId;
    state.transcriptView = "relevant";
    renderAll();
    $("#audit-case")?.scrollIntoView({behavior:"smooth", block:"start"});
  });

  renderAll();
})();
