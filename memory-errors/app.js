"use strict";

(() => {
  const data = window.TEACHCOPILOT_AUDIT;
  const traceData = window.SAVED_RETRIEVAL_TRACE;
  const controls = window.CONTROLLED_COMPARISON;
  const $ = query => document.querySelector(query);
  const esc = value => String(value ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  const arr = value => Array.isArray(value) ? value : [];
  const uniq = values => [...new Set(arr(values))];
  const intersection = (left,right) => { const set = new Set(arr(right)); return uniq(left).filter(id => set.has(id)); };
  const trim = (text,max = 105) => text.length > max ? text.slice(0,max - 1) + "…" : text;
  const labels = {chronological:"По времени", lexical:"По словам", vector:"По смыслу", hybrid:"Гибридный", graph_hybrid:"Гибридный + граф"};
  const verdictLabels = {correct:"корректно", partial:"частично", incorrect:"некорректно", unanswerable:"нет ответа"};
  const supportLabels = {supported:"подтверждена", partial:"частичная", unsupported:"не подтверждена", no_citations:"ссылок нет"};
  const roles = {teacher:"Преподаватель", student:"Ребёнок", assistant:"Ассистент"};
  const $metricMode = $("#metric-mode"), $caseMode = $("#case-mode"), $caseSelect = $("#case-select");
  const $metricCards = $("#metric-cards"), $metricDetail = $("#metric-detail"), $case = $("#case-view");
  const $controlCards = $("#control-cards"), $controlQuestion = $("#control-question");

  if (!data || !Array.isArray(data.cases)) {
    $case.innerHTML = '<p class="error">Данные исследования не загрузились. Обновите страницу или откройте JSON в разделе «Данные».</p>';
    return;
  }
  const cases = data.cases;
  const questions = data.questions;
  const byCase = new Map(cases.map(item => [item.caseId,item]));
  const byHistory = new Map(data.histories.map(item => [item.history_id,item]));
  const byTurn = new Map();
  const byQuestion = new Map(questions.map(item => [item.request_id,item]));
  const controlByKey = new Map(arr(controls?.records).map(item => [`${item.historyId}:${item.requestId}:${item.arm}`,item]));
  data.histories.forEach(history => history.lessons.forEach(lesson => lesson.turns.forEach(turn => {
    byTurn.set(turn.turn_id,{...turn,historyId:history.history_id,lessonId:lesson.lesson_id,date:lesson.observed_on});
  })));
  const state = {metricMode:"hybrid", caseMode:"hybrid", requestId:"pm-h07-q01", lessonId:null};
  const modeName = mode => labels[mode] || mode;
  const currentQuestion = () => byQuestion.get(state.requestId);
  const currentCase = () => { const q = currentQuestion(); return q && byCase.get(`${q.history_id}:${q.request_id}:${state.caseMode}`); };
  const caseFor = (requestId,mode) => { const q = byQuestion.get(requestId); return q && byCase.get(`${q.history_id}:${q.request_id}:${mode}`); };
  const chip = id => `<button type="button" class="source-chip" data-source="${esc(id)}">${esc(id)}</button>`;
  const chips = ids => arr(ids).length ? `<div class="source-chips">${arr(ids).map(chip).join("")}</div>` : '<span class="no-source">нет</span>';
  const percent = (n,d) => d ? `${Math.round(n / d * 1000) / 10}%` : "не применяется";

  function initSelectors() {
    const modes = arr(data.modeOrder).map(mode => `<option value="${esc(mode)}">${esc(modeName(mode))}</option>`).join("");
    $metricMode.innerHTML = modes;
    $caseMode.innerHTML = modes;
    $metricMode.value = state.metricMode;
    $caseMode.value = state.caseMode;
    $caseSelect.innerHTML = questions.map(item => `<option value="${esc(item.request_id)}">${esc(item.request_id)} · ${esc(trim(item.text,110))}</option>`).join("");
    $caseSelect.value = state.requestId;
  }

  function metricDefinitions(records) {
    const withExpected = records.filter(item => arr(item.expectedSourceIds).length);
    const withoutExpected = records.filter(item => !arr(item.expectedSourceIds).length);
    return [
      {id:"any", title:"Хотя бы один эталонный источник", eligible:withExpected,
        pass:item => intersection(item.selectedSourceIds,item.expectedSourceIds).length > 0,
        definition:"Числитель – вопросы, где хотя бы один размеченный ID вошёл в сохранённую память первого прогона. Знаменатель – вопросы с непустым эталоном. Это не проверка ответа.",
        judge:"Сопоставление сохранённых ID с авторским эталоном."},
      {id:"all", title:"Все эталонные источники", eligible:withExpected,
        pass:item => intersection(item.selectedSourceIds,item.expectedSourceIds).length === item.expectedSourceIds.length,
        definition:"Числитель – вопросы, где в выбранной памяти присутствуют все размеченные ID. Знаменатель – вопросы с непустым эталоном. Достаточность именно этих ID оценивалась авторами разметки.",
        judge:"Сопоставление сохранённых ID с авторским эталоном."},
      {id:"supported", title:"Автооценка: верно, ссылки подтверждены", eligible:records,
        pass:item => item.review?.newVerdict === "correct" && item.review?.newSourceSupport === "supported",
        definition:"Числитель – ответы, которым автоматический оценщик одновременно присвоил «correct» и «supported». Знаменатель – все 18 вопросов, в том числе без ожидаемого ответа. Оценка ссылок не доказывает причинное использование памяти.",
        judge:"Новая автоматическая серия; не оценка преподавателя."},
      {id:"absence", title:"Автооценка, когда факта нет", eligible:withoutExpected,
        pass:item => item.review?.newVerdict === "correct",
        definition:"Числитель – автоматически оценённые как корректные ответы на вопросы с пустым эталоном. Знаменатель – вопросы, для которых авторы набора указали отсутствие ответа в истории.",
        judge:"Новая автоматическая серия; в этом наборе таких вопросов три."}
    ];
  }

  function renderMetrics() {
    const records = cases.filter(item => item.modeId === state.metricMode);
    const definitions = metricDefinitions(records);
    $metricCards.innerHTML = definitions.map(metric => {
      const n = metric.eligible.filter(metric.pass).length, d = metric.eligible.length;
      return `<article class="metric"><div class="metric-name">${esc(metric.title)}</div><div class="metric-value">${n}<small> / ${d}</small></div><p>${esc(percent(n,d))} · ${esc(modeName(state.metricMode))}<br>${esc(metric.judge)}</p><details><summary>Как считали</summary><p>${esc(metric.definition)}</p><p>Историй: ${data.coverage.histories}. Сырой набор и манифест доступны ниже.</p></details><button type="button" data-metric="${esc(metric.id)}">Показать случаи</button></article>`;
    }).join("");
    $metricDetail.innerHTML = '<p>Выберите «Показать случаи» в карточке.</p>';
  }

  function showMetricCases(id) {
    const records = cases.filter(item => item.modeId === state.metricMode);
    const metric = metricDefinitions(records).find(item => item.id === id);
    if (!metric) return;
    $metricDetail.innerHTML = `<p><strong>${esc(metric.title)}</strong> · ${esc(modeName(state.metricMode))}</p><div class="table-scroll"><table class="metric-table"><thead><tr><th>Вопрос</th><th>Вошёл в числитель</th><th>Разметка / автооценка</th><th></th></tr></thead><tbody>${metric.eligible.map(item => `<tr><td>${esc(item.requestId)}<br><span class="muted">${esc(trim(item.question,85))}</span></td><td>${metric.pass(item) ? "да" : "нет"}</td><td>${esc(verdictLabels[item.review?.newVerdict] || item.review?.newVerdict)} · ${esc(supportLabels[item.review?.newSourceSupport] || item.review?.newSourceSupport)}</td><td><button type="button" data-case="${esc(item.caseId)}">Открыть</button></td></tr>`).join("")}</tbody></table></div>`;
    $(".metric-rows").open = true;
    $(".metric-rows").scrollIntoView({behavior:"smooth",block:"nearest"});
  }

  function stageCard(number,title,main,description,kind = "") {
    return `<article class="trace-step ${esc(kind)}"><span class="step-number">${number}</span><h4>${esc(title)}</h4><div class="step-main${kind === "unknown" ? " missing" : ""}">${esc(main)}</div><p>${esc(description)}</p></article>`;
  }

  function caseTrace(record) {
    const trace = traceData?.traces?.[record.caseId];
    const expected = arr(record.expectedSourceIds);
    const selectedHits = intersection(record.selectedSourceIds,expected);
    const citedHits = intersection(record.citedSourceIds,expected);
    const candidateHits = trace ? intersection(trace.candidateSourceIds,expected) : [];
    const hitText = (hits,total) => total ? `${hits}/${total} эталонных` : "эталона нет";
    const selectedKind = expected.length ? selectedHits.length === expected.length ? "good" : "bad" : "";
    const traceCards = [
      stageCard("1", "Запуск поиска", "Явный вызов", "Поиск запускался сценарием эксперимента. Автоматический триггер приложения здесь не измеряли."),
      trace ? stageCard("2", "Кандидаты", `${arr(trace.candidateSourceIds).length} реплик`, `${hitText(candidateHits.length,expected.length)} после подгрузки источников; сырых совпадений архива: ${trace.rawArchiveHitCount ?? "нет данных"}.`) : stageCard("2", "Кандидаты", "нет записи", "Первичный журнал этапа не найден.","unknown"),
      stageCard("3", "Передано модели", `${arr(record.selectedSourceIds).length} реплик`, `${hitText(selectedHits.length,expected.length)} в сохранённом блоке памяти.`,selectedKind),
      stageCard("4", "Ссылки ответа", `${arr(record.citedSourceIds).length} реплик`, `${hitText(citedHits.length,expected.length)} среди ссылок ответа. Ссылка не доказывает смысловую опору.`),
      stageCard("5", "Автооценка", verdictLabels[record.review?.newVerdict] || "нет оценки", "Оценка модели-судьи относительно полной истории, не преподавателя.",record.review?.newVerdict === "correct" ? "good" : record.review?.newVerdict === "incorrect" ? "bad" : "")
    ].join("");
    const channelText = trace && Object.keys(trace.channelCounts || {}).length ? Object.entries(trace.channelCounts).map(([key,value]) => `${key}: ${value}`).join(", ") : "нет записанных счётчиков";
    const skipped = trace ? arr(trace.skipped) : [];
    const candidateContent = trace ? `<h4>Кандидаты после подгрузки · ${arr(trace.candidateSourceIds).length}</h4>${chips(trace.candidateSourceIds)}<p>Сохранённые каналы: ${esc(channelText)}. Сырых совпадений архива: ${esc(trace.rawArchiveHitCount)}; лимит чанков: ${esc(trace.sourceTopK)}.</p><p>Пропущено фрагментов при отборе: ${skipped.length}${skipped.length ? ". Причины и ID ниже." : "."}</p>${skipped.length ? `<pre>${esc(JSON.stringify(skipped,null,2))}</pre>` : ""}` : '<p>Список кандидатов не сохранён.</p>';
    const chunkContent = trace ? `<h4>Чанки до и после ограничения</h4><p>Найденные чанки: ${esc(arr(trace.rawCandidateChunkIds).join(", ") || "нет")}</p><p>После ограничения: ${esc(arr(trace.topKChunkIds).join(", ") || "нет")}</p><p>Это ID фрагментов, а не отдельные реплики. Для прошлых прогонов персональные причины ранжирования и внутренние рассуждения модели не записаны.</p>` : '<p>Подробности не сохранены.</p>';
    return `<div class="trace-title"><h3>Что произошло с памятью</h3><p>Этапы ниже взяты из первого сохранённого прогона и его ответа. Цвет не является оценкой ребёнка.</p></div><div class="trace-flow">${traceCards}</div><details class="trace-details"><summary>Раскрыть кандидатов, ограничения и каналы поиска</summary><div class="trace-columns"><div>${candidateContent}</div><div>${chunkContent}</div></div></details>`;
  }

  function renderCase() {
    const record = currentCase();
    if (!record) { $case.innerHTML = '<p class="error">Сохранённый случай не найден.</p>'; return; }
    const expected = arr(record.expectedSourceIds);
    const selected = arr(record.selectedSourceIds);
    const selectedText = selected.map(id => byTurn.get(id)).filter(Boolean);
    const snippets = selectedText.slice(0,8).map(turn => `<div class="turn ${expected.includes(turn.turn_id) ? "gold" : ""} selected"><div class="turn-meta">${esc(roles[turn.role] || turn.role)} · ${esc(turn.turn_id)}</div><p>${esc(turn.text)}</p></div>`).join("");
    const more = selectedText.slice(8).map(turn => `<div class="turn ${expected.includes(turn.turn_id) ? "gold" : ""} selected"><div class="turn-meta">${esc(roles[turn.role] || turn.role)} · ${esc(turn.turn_id)}</div><p>${esc(turn.text)}</p></div>`).join("");
    const review = record.review || {};
    const grade = review.newVerdict || "";
    const history = byHistory.get(record.historyId);
    const preferred = byTurn.get(expected[0] || selected[0]);
    if (!state.lessonId || !history.lessons.some(lesson => lesson.lesson_id === state.lessonId)) state.lessonId = preferred?.lessonId || history.lessons[0]?.lesson_id;
    $case.innerHTML = `<article class="case-shell"><div class="question-block"><div><p class="micro">${esc(record.requestId)} · ${esc(modeName(record.modeId))}</p><h3>${esc(record.question)}</h3></div><div><p class="micro">Что нужно было найти по авторской разметке</p><p>${esc(record.expected || "В истории нет сведений, позволяющих ответить.")}</p>${chips(expected)}</div></div>${caseTrace(record)}<div class="answer-area"><article><p class="micro">Переданный блок памяти · ${esc(record.memoryTokens ?? "–")} токенов</p><p class="muted">Это выбранные исходные реплики. Другие записи могли остаться в архиве.</p>${snippets || '<p class="muted">Сохранённые исходные реплики отсутствуют.</p>'}${more ? `<details class="raw-memory"><summary>Показать остальные выбранные реплики</summary>${more}</details>` : ""}<details class="raw-memory"><summary>Точный сериализованный блок и SHA-256</summary><p class="answer-meta"><code>${esc(record.memorySha256)}</code></p><pre>${esc(record.memoryRaw)}</pre></details></article><article><p class="micro">Сохранённый ответ модели</p><p class="answer-text">${esc(record.answer)}</p><p class="answer-meta">Ссылки ответа:</p>${chips(record.citedSourceIds)}<p class="answer-meta">Автооценка: <span class="verdict ${esc(grade)}">${esc(verdictLabels[grade] || grade)}</span> · опора на источники: ${esc(supportLabels[review.newSourceSupport] || review.newSourceSupport)}</p><p class="answer-meta"><strong>Обоснование автоматического оценщика:</strong> ${esc(review.evidence || "не сохранено")}</p><p class="answer-meta">Вердикт относится к полной истории. Если источник не попал в память, отказ может быть разумным для модели, но бесполезным для пользователя.</p></article></div><div class="history-area"><h3>Вернуться к исходному диалогу</h3><p>Янтарная линия – эталон; зелёная рамка – в выбранной памяти; синий фон – источник, на который сослался ответ. Можно открыть любое занятие истории.</p><label for="lesson-select">Занятие</label><select id="lesson-select">${history.lessons.map(lesson => `<option value="${esc(lesson.lesson_id)}"${lesson.lesson_id === state.lessonId ? " selected" : ""}>${esc(lesson.lesson_id)} · ${esc(lesson.observed_on)} · ${lesson.turns.length} реплик</option>`).join("")}</select><div id="transcript" class="transcript" tabindex="0" aria-label="Исходные реплики занятия"></div></div></article>`;
    $("#lesson-select").addEventListener("change", event => { state.lessonId = event.target.value; renderTranscript(); });
    renderTranscript();
    renderControls(record);
  }

  function renderTranscript() {
    const record = currentCase(), history = byHistory.get(record.historyId);
    const lesson = history.lessons.find(item => item.lesson_id === state.lessonId);
    const expected = new Set(arr(record.expectedSourceIds)), selected = new Set(arr(record.selectedSourceIds)), cited = new Set(arr(record.citedSourceIds));
    const transcript = $("#transcript");
    transcript.innerHTML = lesson.turns.map(turn => {
      const gold = expected.has(turn.turn_id), chosen = selected.has(turn.turn_id), used = cited.has(turn.turn_id);
      return `<article id="turn-${esc(turn.turn_id)}" class="turn${gold ? " gold" : ""}${chosen ? " selected" : ""}${used ? " cited" : ""}" tabindex="-1"><div class="turn-meta"><span>${esc(roles[turn.role] || turn.role)}</span><span>${esc(turn.turn_id)}</span>${gold ? '<span class="turn-mark gold-mark">эталон</span>' : ""}${chosen ? '<span class="turn-mark">в памяти</span>' : ""}${used ? '<span class="turn-mark cited-mark">ссылка ответа</span>' : ""}</div><p>${esc(turn.text)}</p></article>`;
    }).join("");
    transcript.scrollTop = 0;
  }

  function renderControls(record) {
    if (!controls || controls.dataOrigin !== "synthetic_only") {
      $controlCards.innerHTML = '<p class="error">Новый контрольный прогон не загружен. Результаты не подменяются прогнозом.</p>';
      return;
    }
    $controlQuestion.textContent = record.question;
    const descriptions = [
      {id:"no_memory",title:"Без памяти",text:"Вопрос без блока прошлых реплик."},
      {id:"hybrid",title:"С hybrid-памятью",text:"Ранее сохранённый блок гибридного поиска."},
      {id:"oracle",title:"С эталонными источниками",text:"Вручную подставлены все размеченные реплики."}
    ];
    $controlCards.innerHTML = descriptions.map(arm => {
      const item = controlByKey.get(`${record.historyId}:${record.requestId}:${arm.id}`);
      if (!item || item.status !== "ok") return `<article class="control-card"><header><h3>${esc(arm.title)}</h3></header><div class="control-body">Ответ не сохранён.</div></article>`;
      return `<article class="control-card"><header><h3>${esc(arm.title)}</h3><p>${esc(arm.text)}</p></header><div class="control-body"><p class="micro">Новый ответ модели</p><p class="answer-text">${esc(item.answer)}</p><p class="answer-meta">Источники в ответе:</p>${chips(item.citedSourceIds)}<details class="raw-memory"><summary>Что передали модели · ${arr(item.selectedSourceIds).length} реплик</summary><p class="answer-meta">${item.memoryRaw ? `SHA-256: <code>${esc(item.memorySha256)}</code>` : "Пустой блок памяти."}</p>${item.memoryRaw ? `<pre>${esc(item.memoryRaw)}</pre>` : ""}</details></div></article>`;
    }).join("");
    const manifest = controls.manifest || {};
    $("#control-meta").innerHTML = `<p>18 вопросов × 3 условия = ${esc(manifest.completed)} сохранённых ответов; технических отказов: ${esc(manifest.failed)}. Все запросы обработаны локальной моделью ${esc(manifest.model)} с одинаковыми настройками: контекст ${esc(manifest.contextTokens)} токенов, temperature ${esc(manifest.temperature)}, seed ${esc(manifest.seed)}. По одному ответу на условие.</p><p>Отдельный запуск: ${esc(manifest.startedUtc)} – ${esc(manifest.finishedUtc)}. Ответы технически завершены; содержательное качество отдельно не оценивалось.</p><p>Модель SHA-256: <code>${esc(manifest.modelDigest)}</code><br>Исходные данные SHA-256: <code>${esc(manifest.sourceAuditSha256)}</code><br>Результаты SHA-256: <code>${esc(manifest.resultsSha256)}</code></p><p>Новый hybrid-ответ сгенерирован заново на сохранённом блоке памяти. В старой таблице выше показана исходная серия ответов и её автоматическая оценка.</p>`;
  }

  function openCase(caseId) {
    const record = byCase.get(caseId);
    if (!record) return;
    state.requestId = record.requestId;
    state.caseMode = record.modeId;
    state.lessonId = null;
    $caseSelect.value = state.requestId;
    $caseMode.value = state.caseMode;
    renderCase();
    $("#cases").scrollIntoView({behavior:"smooth",block:"start"});
  }

  $metricMode.addEventListener("change", event => { state.metricMode = event.target.value; renderMetrics(); });
  $caseMode.addEventListener("change", event => { state.caseMode = event.target.value; state.lessonId = null; renderCase(); });
  $caseSelect.addEventListener("change", event => { state.requestId = event.target.value; state.lessonId = null; renderCase(); });
  document.addEventListener("click", event => {
    const metric = event.target.closest("[data-metric]");
    if (metric) { showMetricCases(metric.dataset.metric); return; }
    const pick = event.target.closest("[data-pick]");
    if (pick) { const record = caseFor(pick.dataset.pick,"hybrid"); if (record) openCase(record.caseId); return; }
    const caseButton = event.target.closest("[data-case]");
    if (caseButton) { openCase(caseButton.dataset.case); return; }
    const source = event.target.closest("[data-source]");
    if (!source) return;
    const turn = byTurn.get(source.dataset.source);
    const record = currentCase();
    if (!turn || turn.historyId !== record?.historyId) return;
    state.lessonId = turn.lessonId;
    $("#lesson-select").value = state.lessonId;
    renderTranscript();
    const target = document.getElementById(`turn-${turn.turn_id}`);
    target?.scrollIntoView({behavior:"smooth",block:"center"});
    target?.focus({preventScroll:true});
  });

  initSelectors();
  renderMetrics();
  renderCase();
  $("#provenance").innerHTML = `<p>Публичный audit-data.json SHA-256: <code>${esc(traceData?.auditSha256 || "не сохранён")}</code>. Этот же хеш указан во входе нового контрольного прогона.</p><p>Трассировки извлечены из трёх сохранённых синтетических журналов после проверки идентичности памяти и выбранных ID с ответами:</p>${Object.entries(traceData?.sourceFilesSha256 || {}).map(([name,digest]) => `<p>${esc(name)}<br><code>${esc(digest)}</code></p>`).join("")}<p>Эксперимент мал, данные синтетические; оценщик автоматический, а слепота ограничена. Названия режимов были скрыты, но ответы и цитаты могли косвенно раскрывать режим.</p>`;
})();
