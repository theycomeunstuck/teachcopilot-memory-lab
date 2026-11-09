"use strict";

(() => {
  const data = window.MEMORY_LAB_DATA;
  const core = window.MemoryLabCore;
  const index = window.MEMORY_LAB_INDEX;
  const $ = selector => document.querySelector(selector);
  const esc = value => String(value ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  const control = {history:$("#history-select"), description:$("#history-description"), chat:$("#conversation"), examples:$("#examples"), query:$("#query"), form:$("#search-form"), button:$("#search-button"), status:$("#status"), results:$("#results"), count:$("#result-count"), from:$("#date-from"), through:$("#date-to"), all:$("#show-all")};
  if (!data?.synthetic || !Array.isArray(data.histories) || !core) {
    control.status.textContent = "Не удалось загрузить синтетические истории. Обновите страницу.";
    control.status.className = "status error";
    control.button.disabled = true;
    return;
  }

  const allChunks = data.histories.flatMap(history => core.chunkHistory(history));
  const indexValid = !!index && index.model === core.MODEL && index.revision === core.REVISION && index.recipe === core.RECIPE && index.fingerprint === core.fingerprint(allChunks) && index.chunkCount === allChunks.length && allChunks.every(chunk => Array.isArray(index.vectors?.[chunk.id]) && index.vectors[chunk.id].length === 384);
  const state = {historyId:data.histories[0].id, exampleId:null, selected:new Set(), expected:new Set(), worker:null, pending:new Map(), sequence:0, modelReady:false, results:[]};
  const history = () => data.histories.find(item => item.id === state.historyId);
  const status = (message, kind = "") => { control.status.textContent = message; control.status.className = `status${kind ? ` ${kind}` : ""}`; };
  const formatDate = date => { const [year,month,day] = date.split("-"); return `${day}.${month}.${year}`; };
  const methodName = method => ({lexical:"по словам", semantic:"по смыслу", hybrid:"комбинированный"}[method]);
  const selectedMethod = () => document.querySelector('input[name="method"]:checked')?.value || "hybrid";
  const unique = list => [...new Set(list)];
  const currentExample = () => history()?.questions.find(question => question.id === state.exampleId && question.text === control.query.value.trim());

  function setHistory() {
    control.history.innerHTML = data.histories.map(item => `<option value="${esc(item.id)}">${esc(item.label)}</option>`).join("");
    control.history.value = state.historyId;
    control.description.textContent = history().description;
    control.examples.innerHTML = history().questions.map(item => `<button type="button" data-example="${esc(item.id)}">${esc(item.text)}</button>`).join("");
    state.selected = new Set();
    state.expected = new Set();
    state.results = [];
    state.exampleId = null;
    control.query.value = "";
    control.from.value = "";
    control.through.value = "";
    control.results.innerHTML = '<div class="empty"><span aria-hidden="true">⌕</span><p>Здесь появятся фрагменты и объяснение, почему поиск их выбрал.</p></div>';
    control.count.textContent = "";
    renderChat();
  }

  function renderChat() {
    control.chat.innerHTML = history().sessions.map(session => `<section class="chat-day" aria-label="Занятие ${esc(formatDate(session.date))}"><div class="day-heading"><span>${esc(formatDate(session.date))}</span></div>${session.turns.map(turn => {
      const selected = state.selected.has(turn.id), expected = state.expected.has(turn.id);
      return `<article class="message ${esc(turn.role)}${selected ? " selected" : ""}${expected ? " expected" : ""}" id="turn-${esc(turn.id)}"><div class="avatar" aria-hidden="true">${turn.role === "student" ? "У" : "А"}</div><div class="bubble"><p>${esc(turn.text)}</p><div class="message-meta"><span>${turn.role === "student" ? "Ученик" : "Ассистент"}</span><span>${esc(turn.id)}</span>${selected ? '<span class="tag">найдено</span>' : ""}${expected ? '<span class="tag expected-tag">эталон примера</span>' : ""}</div></div></article>`;
    }).join("")}</section>`).join("");
  }

  function highlight(text, terms) {
    const matched = new Set(terms);
    let result = "", start = 0;
    for (const match of text.matchAll(/[\p{L}\p{N}]+/gu)) {
      result += esc(text.slice(start,match.index));
      const word = esc(match[0]);
      result += matched.has(match[0].normalize("NFC").toLocaleLowerCase("ru")) ? `<mark>${word}</mark>` : word;
      start = match.index + match[0].length;
    }
    return result + esc(text.slice(start));
  }

  function renderResults(rows, method, question) {
    const example = currentExample();
    const foundIds = new Set(rows.flatMap(row => row.chunk.sourceIds));
    state.selected = foundIds;
    state.expected = new Set(example?.expectedSourceIds || []);
    state.results = rows;
    renderChat();
    control.count.textContent = `${rows.length} фрагм. · ${methodName(method)}`;
    let annotation = "";
    if (example) {
      const expected = example.expectedSourceIds || [];
      const hit = expected.filter(id => foundIds.has(id)).length;
      annotation = expected.length
        ? `<div class="status ${hit === expected.length ? "" : "warning"}"><strong>Авторская разметка:</strong> найденные фрагменты пересекаются с ${hit} из ${expected.length} ожидаемых реплик. Проверьте исходный контекст: реплика может попасть в фрагмент частично. ${esc(example.note)}</div>`
        : `<div class="status warning"><strong>Внимание:</strong> по авторской разметке ответа в этой истории нет. Поиск всё равно может показать похожие фрагменты – это не означает, что информация найдена. ${esc(example.note)}</div>`;
    }
    if (!rows.length) {
      control.results.innerHTML = `${annotation}<div class="empty"><p>Совпадений не нашлось. Попробуйте другие слова или расширьте диапазон дат.</p></div>`;
      return;
    }
    control.results.innerHTML = annotation + rows.map((row, index) => {
      const evidence = [];
      if (method !== "semantic") evidence.push(row.matched.length ? `Слова: <strong>${row.matched.map(esc).join(", ")}</strong>` : "Совпадающих слов нет");
      if (method !== "lexical") evidence.push(`Смысловая близость: <strong>${esc(row.semanticScore.toFixed(3))}</strong>`);
      if (method === "hybrid") evidence.push(`Место в каналах: слова ${row.lexicalRank || "–"}, смысл ${row.semanticRank || "–"}`);
      const sourceButtons = row.chunk.sourceIds.map(sourceId => `<button type="button" data-source="${esc(sourceId)}">${esc(sourceId)}</button>`).join("");
      return `<article class="result"><div class="result-header"><strong>Фрагмент ${index + 1}</strong><span>${esc(formatDate(row.chunk.date))} · ${esc(row.chunk.sessionId)}</span></div><div class="result-body"><p class="result-quote">${highlight(row.chunk.text,row.matched)}</p><p class="result-signal">${evidence.join(" · ")}</p><div class="result-actions"><span>Перейти к реплике:</span>${sourceButtons}</div></div></article>`;
    }).join("");
  }

  function failPending(message) {
    for (const pending of state.pending.values()) { clearTimeout(pending.timer); pending.reject(new Error(message)); }
    state.pending.clear();
  }

  function getWorker() {
    if (state.worker) return state.worker;
    const worker = new Worker("semantic-worker.js", {type:"module"});
    worker.addEventListener("error", () => {
      failPending("Не удалось загрузить модуль смыслового поиска. Проверьте сеть или используйте поиск по словам.");
      worker.terminate();
      state.worker = null;
    });
    worker.addEventListener("message", event => {
      const message = event.data || {};
      if (message.type === "progress") {
        status(`Загрузка модели: ${message.file} – ${message.progress}%. При первом запуске скачивается около 135 МБ.`);
      } else if (message.type === "ready") {
        state.modelReady = true;
        status("Модель загружена в браузер. Вопросы и истории не отправляются на сервер модели.");
      } else if (message.type === "calculating") {
        status("Сравниваем вопрос с сохранёнными фрагментами в браузере…");
      } else if (message.type === "result" || message.type === "error") {
        const pending = state.pending.get(message.id);
        if (!pending) return;
        clearTimeout(pending.timer);
        state.pending.delete(message.id);
        if (message.type === "result") pending.resolve(message.vector);
        else pending.reject(new Error(message.message || "Модель недоступна"));
      }
    });
    state.worker = worker;
    return worker;
  }

  function vectorize(question) {
    if (!indexValid) return Promise.reject(new Error("Смысловой индекс не загружен или не соответствует историям. Выберите поиск по словам."));
    const id = ++state.sequence;
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        state.pending.delete(id);
        if (state.worker) state.worker.terminate();
        state.worker = null;
        reject(new Error("Модель загружается слишком долго. Проверьте сеть или используйте поиск по словам."));
      }, 240000);
      state.pending.set(id, {resolve,reject,timer});
      try { getWorker().postMessage({id,question}); }
      catch (error) { clearTimeout(timer); state.pending.delete(id); reject(error); }
    });
  }

  async function search() {
    const question = control.query.value.trim();
    const from = control.from.value, through = control.through.value;
    const method = selectedMethod();
    const selectedHistory = state.historyId;
    if (!question) { status("Введите вопрос или выберите пример.", "warning"); control.query.focus(); return; }
    if (from && through && from > through) { status("Начало диапазона дат позже его конца.", "warning"); return; }
    const chunks = allChunks.filter(chunk => chunk.historyId === selectedHistory);
    if (!chunks.some(chunk => (!from || chunk.date >= from) && (!through || chunk.date <= through))) {
      state.selected = new Set(); state.expected = new Set(); renderChat();
      control.count.textContent = "0 фрагм.";
      control.results.innerHTML = '<div class="empty"><p>В выбранном диапазоне нет занятий. Расширьте даты.</p></div>';
      status("Для этих дат история пуста.", "warning");
      return;
    }
    control.button.disabled = true;
    try {
      let queryVector = null;
      if (method !== "lexical") {
        status(state.modelReady ? "Сравниваем вопрос в браузере…" : "Готовим смысловую модель. При первом запуске загрузка займёт время…");
        queryVector = await vectorize(question);
      }
      if (selectedHistory !== state.historyId || question !== control.query.value.trim() || method !== selectedMethod() || from !== control.from.value || through !== control.through.value) {
        status("Параметры изменились во время поиска. Запустите поиск ещё раз.", "warning");
        return;
      }
      const rows = core.rank({chunks, question, mode:method, queryVector, vectors:index?.vectors, from, through});
      renderResults(rows,method,question);
      status(method === "lexical" ? "Поиск по словам выполнен в браузере. Похожие по смыслу формулировки он может пропустить." : "Поиск выполнен в браузере на синтетической истории. Близость не является уверенностью в правильности.");
    } catch (error) {
      status(`${error.message || "Не удалось выполнить поиск."} Выберите «По словам» и повторите поиск.`, "error");
      control.results.innerHTML = '<div class="empty"><p>Смысловой поиск недоступен. Поиск по словам остаётся доступным.</p></div>';
      control.count.textContent = "";
      state.selected = new Set(); state.expected = new Set(); renderChat();
    } finally { control.button.disabled = false; }
  }

  control.form.addEventListener("submit", event => { event.preventDefault(); search(); });
  control.history.addEventListener("change", event => { state.historyId = event.target.value; setHistory(); status("Выбрана новая синтетическая история. Введите вопрос или выберите пример."); });
  function invalidateResults() {
    if (!state.results.length && !control.count.textContent) return;
    state.results = [];
    state.selected = new Set();
    state.expected = new Set();
    control.count.textContent = "";
    control.results.innerHTML = '<div class="empty"><p>Параметры изменились. Запустите поиск, чтобы обновить результаты.</p></div>';
    renderChat();
  }
  control.query.addEventListener("input", () => { if (state.exampleId && !currentExample()) state.exampleId = null; invalidateResults(); });
  control.form.addEventListener("change", event => { if (event.target.matches('input[name="method"], input[type="date"]')) invalidateResults(); });
  control.examples.addEventListener("click", event => {
    const button = event.target.closest("[data-example]");
    const example = history().questions.find(item => item.id === button?.dataset.example);
    if (!example) return;
    state.exampleId = example.id;
    control.query.value = example.text;
    invalidateResults();
    search();
  });
  control.results.addEventListener("click", event => {
    const button = event.target.closest("[data-source]");
    if (!button) return;
    const target = document.getElementById(`turn-${button.dataset.source}`);
    if (target) { target.scrollIntoView({behavior:"smooth", block:"center"}); target.setAttribute("tabindex","-1"); target.focus({preventScroll:true}); }
  });
  control.all.addEventListener("click", () => { control.chat.scrollTo({top:0,behavior:"smooth"}); control.chat.focus({preventScroll:true}); });
  setHistory();
  if (!indexValid) status("Смысловой индекс недоступен или не соответствует историям. Поиск по словам работает.", "warning");
})();
