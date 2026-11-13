"use strict";

(() => {
  const $ = (q, root = document) => root.querySelector(q);
  const $$ = (q, root = document) => [...root.querySelectorAll(q)];
  const esc = value => String(value ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  const fmt = (n, digits = 1) => Number(n).toLocaleString("ru-RU", {maximumFractionDigits:digits});
  const pct = n => `${fmt(n * 100)}%`;
  const sec = n => `${Number(n).toLocaleString("ru-RU", {minimumFractionDigits:n < 1 ? 3 : 2,maximumFractionDigits:n < 1 ? 3 : 2})} с`;
  const shortMode = {chronological:"По времени",lexical:"По словам",vector:"По смыслу",hybrid:"Гибридный",graph_hybrid:"Гибридный + граф"};
  const modeHint = {chronological:"chronological",lexical:"lexical",vector:"vector",hybrid:"hybrid",graph_hybrid:"graph_hybrid"};
  const methods = [
    {id:"none",label:"Без памяти",kind:"Контрольный вариант",name:"Только текущий вопрос",store:"История занятий не передаётся. Есть лишь общий профиль и новый вопрос.",find:"Искать не в чем. Модель должна признать, что прошлый эпизод ей неизвестен.",risk:"Без источника нельзя восстановить ни ошибку, ни подсказку."},
    {id:"tail",label:"Хвост диалога",kind:"Оригиналы, пока они рядом",name:"Последние реплики",store:"Недавние реплики, даты и ID – близко к исходной формулировке.",find:"Модель читает конец диалога в доступном окне контекста.",risk:"К седьмому уроку первый может быть вытеснен. Граница обрезает вопрос или помощь."},
    {id:"summary",label:"Резюме",kind:"Сжатый пересказ",name:"Одна нить всей истории",store:"Краткое описание прошлого и того, что стоит помнить дальше.",find:"Резюме добавляется к следующему разговору целиком.",risk:"Повторный пересказ может превратить «после подсказки» в «знает сам»."},
    {id:"v1",label:"Структура V1",kind:"Типизированные учебные наблюдения",name:"Ошибка, помощь, исправление",store:"Тема, событие, вид помощи и ссылки на подтверждающие реплики.",find:"Выбор записей по учебной теме и полям структуры.",risk:"Извлекатель может пропустить деталь, которую схема не умеет выразить."},
    {id:"v2",label:"Структура V2",kind:"Больше типов личных событий",name:"Событие с условиями и источниками",store:"Учебные события отделены от просьб, случайных фактов и кандидатов интереса.",find:"Поиск по типу события и его связи с нужным эпизодом.",risk:"Более сложная классификация тоже ошибается. Схема и извлекатель изменены вместе."},
    {id:"topic",label:"Граф учебных тем",kind:"Связи в учебной программе",name:"От темы к наблюдению",store:"Записи V1, привязанные к темам и их предпосылкам.",find:"Переход по учебным связям «дроби → сравнение → наблюдение».",risk:"Для личных событий нужна отдельная модель связей. Наследуются ошибки извлечения V1."},
    {id:"mem0",label:"Mem0",kind:"Извлечённые текстовые воспоминания",name:"Кандидат ведёт к занятию",store:"Короткие текстовые воспоминания и связь с архивом занятия.",find:"Поиск кандидата по вопросу, затем подгрузка связанного оригинала.",risk:"Кандидат может искажать событие. В найденном занятии ещё нужно выбрать точную реплику."},
    {id:"graphiti",label:"Graphiti + LangGraph",kind:"Персональный граф и управление поиском",name:"Связи направляют к источникам",store:"Сущности и связи в Graphiti. Исходные реплики хранятся в отдельном архиве.",find:"LangGraph управляет поиском по графу, архиву и недавним занятиям.",risk:"Ошибочная связь или ограниченный бюджет могут оставить нужный оригинал за пределами контекста."},
    {id:"hybrid-full",label:"Graphiti + Mem0",sub:"и LangGraph",kind:"Несколько путей к одному эпизоду",name:"Граф + воспоминания + оригиналы",store:"Граф связей, текстовые кандидаты Mem0 и архив исходных реплик.",find:"LangGraph объединяет кандидатов и подгружает оригиналы для ответа.",risk:"Больше компонентов не гарантирует верный вывод. Ошибки поиска и понимания остаются."}
  ];

  const lineText = (x,y,lines,cls="",size=16) => `<text x="${x}" y="${y}" font-size="${size}"${cls ? ` class="${cls}"` : ""}>${lines.map((line,i)=>`<tspan x="${x}" dy="${i ? 23 : 0}">${esc(line)}</tspan>`).join("")}</text>`;
  const box = (x,y,w,h,lines,variant="",size=16) => {
    const color = variant==="memory" ? ["#eaf6f2","#8bc1b2"] : variant==="risk" ? ["#fff5df","#d6bc86"] : variant==="source" ? ["#eef4fc","#9ab5cf"] : ["#f8fbfd","#c5d6e2"];
    return `<g><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="7" fill="${color[0]}" stroke="${color[1]}"/>${lineText(x+15,y+28,lines,"",size)}</g>`;
  };
  const path = (d, dashed=false,color="#809cab") => `<path d="${d}" fill="none" stroke="${color}" stroke-width="1.6"${dashed?' stroke-dasharray="5 5"':""} marker-end="url(#flow-arrow)"/>`;
  const graphNode = (cx,cy,r,label,color="#087d77") => `<circle cx="${cx}" cy="${cy}" r="${r}" fill="#fff" stroke="${color}" stroke-width="1.7"/><text x="${cx}" y="${cy+5}" text-anchor="middle" font-size="14">${esc(label)}</text>`;

  function diagram(method) {
    const id = method.id;
    let middle="";
    let leftArrow=path("M195 149H251"), rightArrow=path("M602 149H651V183H682");
    let output=["Вернуться к оригиналу","ошибка → подсказка → ответ"];
    if(id==="none") {
      middle=`<rect x="255" y="64" width="347" height="175" rx="8" fill="#fafcfd" stroke="#c8d7e1" stroke-dasharray="6 6"/>${lineText(284,124,["Нет записей прошлых занятий","Эпизод не передан"],"",18)}`;
      leftArrow="";rightArrow=path("M602 149H650V183H682",true);output=["Сведений недостаточно","для ответа о прошлом"];
    } else if(id==="tail") {
      middle=box(255,64,347,62,["Урок 1 вышел за границу хвоста"],"risk",15)+box(255,137,347,87,["Уроки 5–6 · недавние реплики","…новые задания и ответы"],"source",16);
      leftArrow=path("M195 149H229V96H251",true);output=["Старого эпизода","в текущем хвосте нет"];
    } else if(id==="summary") {
      middle=box(255,72,347,144,["Ребёнок сравнивал ⅓ и ¼.","После примера с пирогом","исправил ответ.","Источники · урок 1"],"memory",17);
      output=["Ответ из пересказа","Точность зависит от резюме"];
    } else if(id==="v1") {
      middle=box(255,55,347,189,["Тема · сравнение дробей","Ошибка · ¼ > ⅓","Помощь · образ одного пирога","Исправление · ⅓ > ¼","Источники · вопрос + 3 реплики"],"memory",17);
    } else if(id==="v2") {
      middle=box(255,54,347,53,["Тип · учебное событие"],"memory",17)+box(255,119,166,113,["Ошибка","Подсказка","Исправление"],"memory",15)+box(433,119,169,113,["Ответ получен","с помощью","преподавателя"],"risk",15);
    } else if(id==="topic") {
      middle=`<path d="M315 100 441 100 550 100M441 123v49" fill="none" stroke="#68a99b" stroke-width="1.6"/>${graphNode(315,100,36,"Дроби")}${graphNode(441,100,47,"Сравнение")}${graphNode(551,100,36,"Части")}`+box(304,176,279,69,["Наблюдение V1 · нужна подсказка","ID исходных реплик"],"memory",15);
      output=["Тема → наблюдение","Учебная часть истории"];
    } else if(id==="mem0") {
      middle=box(255,56,347,69,["Воспоминание-кандидат","«Помог пример с пирогом»"],"memory",17)+path("M427 126V157")+box(255,162,347,76,["Архив занятия 1","Найти исходный эпизод"],"source",17);
    } else if(id==="graphiti") {
      middle=`<path d="M327 94h182M327 110v66M510 110v66" fill="none" stroke="#68a99b" stroke-width="1.6"/>${graphNode(327,92,40,"Ребёнок")}${graphNode(510,92,44,"Подсказка")}${lineText(397,82,["помогла"],"",12)}`+box(255,180,347,63,["Архив · оригинал эпизода","LangGraph выбирает контекст"],"source",15);
    } else {
      middle=box(255,46,166,74,["Graphiti","связи событий"],"memory",16)+box(435,46,167,74,["Mem0","текстовые кандидаты"],"memory",15)+`<path d="M338 121v29h180v-29M428 150v20" fill="none" stroke="#68a99b" stroke-width="1.6"/>`+box(255,177,347,69,["LangGraph → архив оригиналов","Ошибка, помощь и исправление рядом"],"source",15);
    }
    return `<svg viewBox="0 0 900 290" role="img" aria-labelledby="flow-title flow-desc"><title id="flow-title">${esc(method.name)}</title><desc id="flow-desc">Вымышленный эпизод о сравнении дробей. ${esc(method.store)} ${esc(method.find)} ${esc(method.risk)}</desc><defs><marker id="flow-arrow" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto"><path d="m0 0 7 3.5-7 3.5" fill="#809cab"/></marker></defs>${lineText(12,26,["Исходный эпизод"],"",13)}${lineText(257,26,["Что осталось между уроками"],"",13)}${lineText(683,26,["Урок 7"],"",13)}${box(10,64,185,175,["Вопрос · ⅓ или ¼?","Ответ · «¼ больше»","Подсказка · пирог","Ответ · «⅓ больше»","Урок 1 · исходные ID"],"source",15)}${leftArrow}${middle}${rightArrow}${box(682,46,205,76,["Какая подсказка","помогла с дробями?"],"",17)}${path("M784 123V159")}${box(682,166,205,80,output,id==="none"||id==="tail"?"risk":"memory",15)}${lineText(258,277,["Иллюстрация принципа работы · синтетический эпизод"],"",12)}</svg>`;
  }

  function setMethod(id, focus=false) {
    const method = methods.find(m=>m.id===id) || methods[8];
    $$("#method-tabs [role=tab]").forEach(button=>{
      const active=button.dataset.method===method.id;
      button.setAttribute("aria-selected",String(active));button.tabIndex=active?0:-1;
      if(active&&focus)button.focus();
    });
    $("#method-panel").setAttribute("aria-labelledby",`method-tab-${method.id}`);
    $("#method-name").textContent=method.name;$("#method-kind").textContent=method.kind;
    $("#method-store").textContent=method.store;$("#method-find").textContent=method.find;$("#method-risk").textContent=method.risk;
    $("#memory-diagram").innerHTML=diagram(method);
  }
  $("#method-tabs").innerHTML=methods.map(m=>`<button type="button" role="tab" id="method-tab-${m.id}" data-method="${m.id}" aria-controls="method-panel" aria-selected="false" tabindex="-1">${esc(m.label)}${m.sub?`<small>${esc(m.sub)}</small>`:""}</button>`).join("");
  $("#method-tabs").addEventListener("click",event=>{const b=event.target.closest("[data-method]");if(b)setMethod(b.dataset.method);});
  $("#method-tabs").addEventListener("keydown",event=>{
    const b=event.target.closest("[data-method]");if(!b)return;
    const i=methods.findIndex(m=>m.id===b.dataset.method);let next;
    if(["ArrowDown","ArrowRight"].includes(event.key))next=(i+1)%methods.length;
    if(["ArrowUp","ArrowLeft"].includes(event.key))next=(i-1+methods.length)%methods.length;
    if(event.key==="Home")next=0;if(event.key==="End")next=methods.length-1;
    if(next!==undefined){event.preventDefault();setMethod(methods[next].id,true);}
  });
  setMethod("hybrid-full");

  const data=window.MEMORY_RESULTS;
  if(!data){$("#results-chart").innerHTML='<p class="data-pending">Файл измерений не загрузился. Откройте сайт вместе с папкой data.</p>';return;}
  const state={history:"all",metric:"quality",latency:"retrieve",review:data.newReview?.status==="complete"?"new":"previous",pair:data.examples?.[0]?.pairId,a:"hybrid",b:"graph_hybrid"};
  $("#review-series").value=state.review;
  const reviewLabel=()=>state.review==="new"?"Новая слепая автооценка":"Прежняя автооценка";
  const qualityRows=()=>state.review==="new"?data.newReview.byMode:data.answerStats;
  const historyQualityRows=()=>state.review==="new"?data.newReview.byHistoryMode:data.answerStatsByHistory;

  function modeStats(mode) {
    if(state.history==="all")return {quality:qualityRows().find(r=>r.modeId===mode.id),recall:{mean:mode.stats.sourceRecall,n:mode.stats.sourceRecallN},warmRetrieve:mode.stats.warmRetrieve,warmPipeline:mode.stats.warmPipeline};
    const r=data.retrievalStats.find(r=>r.historyId===state.history&&r.modeId===mode.id);
    return {...r,quality:historyQualityRows().find(r=>r.historyId===state.history&&r.modeId===mode.id)};
  }
  function drawChart() {
    const rows=data.modes.map(mode=>({mode,stats:modeStats(mode)}));
    const history=data.histories.find(h=>h.id===state.history);
    $("#history-description").textContent=history?`${history.topic}. ${history.description}`:"Все три истории, одинаковые вопросы для каждого режима";
    $("#latency-switch").hidden=state.metric!=="latency";
    const n=state.history==="all"?18:6;
    if(state.metric==="quality"){
      $("#chart-title").textContent="Сколько ответов оценены корректными";
      $("#chart-subtitle").textContent=`${reviewLabel()} · ${n} ответов на режим · янтарным – частичные`;
      $("#chart-footnote").textContent=state.review==="new"?"Вердикт сравнивает ответ с полной историей. Отдельно оценены опора на цитаты и соответствие видимой памяти. Это автоматическая проверка. Семь из 90 вердиктов отличаются от прежней серии при тех же ответах.":"Вердикт сравнивает ответ с полной историей. Достаточность видимой памяти требует отдельной проверки. Правильность ответа нужно сопоставлять с содержанием цитат.";
      $("#results-chart").innerHTML=rows.map(({mode,stats})=>{
        const q=stats.quality,total=q.n||q.total||n;
        return chartRow(mode,`<div class="chart-fill" style="width:${q.correct/total*100}%"></div><div class="chart-partial" style="left:${q.correct/total*100}%;width:${q.partial/total*100}%"></div>`,`<span>${q.correct} / ${total}</span><small>${q.partial} частично · ${q.incorrect} неверно</small>`,`${q.correct} корректных из ${total}, ${q.partial} частичных, ${q.incorrect} неверных`);
      }).join("");
    }else if(state.metric==="recall"){
      $("#chart-title").textContent="Доля эталонных источников в выбранном контексте";
      $("#chart-subtitle").textContent=`Source recall · среднее по ${state.history==="all"?15:5} вопросам с непустым эталоном`;
      $("#chart-footnote").textContent="Первая попытка поиска, top-k = 8 архивных фрагментов. Два недавних занятия добавляются отдельно. Вопрос без эталонного источника исключён. Найденный источник ещё может быть неверно истолкован моделью.";
      $("#results-chart").innerHTML=rows.map(({mode,stats})=>chartRow(mode,`<div class="chart-fill" style="width:${stats.recall.mean*100}%"></div>`,`<span>${pct(stats.recall.mean)}</span><small>n = ${stats.recall.n} вопросов</small>`,`${pct(stats.recall.mean)} найденных эталонных источников`)).join("");
    }else{
      const k=state.latency==="retrieve"?"warmRetrieve":"warmPipeline";
      const maximum=Math.max(...rows.map(r=>r.stats[k].p95))*1.07;
      $("#chart-title").textContent=state.latency==="retrieve"?"Время извлечения кандидатов":"Полный поисковый процесс";
      $("#chart-subtitle").textContent=`Прогретый поиск · ${state.history==="all"?54:18} повторов на режим · полоса p50, отметка p95`;
      $("#chart-footnote").textContent=state.latency==="retrieve"?"Retrieve измеряет сам поиск после построения индекса и до генерации ответа. Для общей медианы объединены 54 повтора по трём историям.":"Полный процесс включает подготовку, поиск, отбор и подсчёт токенов. Измерен этап после построения индекса и до генерации ответа. Время в секундах. p95 показывает длинный хвост задержки.";
      $("#results-chart").innerHTML=rows.map(({mode,stats})=>{
        const t=stats[k];return chartRow(mode,`<div class="chart-fill" style="width:${t.p50/maximum*100}%"></div><span class="chart-p95" style="left:${t.p95/maximum*100}%" aria-hidden="true"></span>`,`<span>${sec(t.p50)}</span><small>p95 ${sec(t.p95)}</small>`,`медиана ${sec(t.p50)}, p95 ${sec(t.p95)}`);
      }).join("");
    }
  }
  function chartRow(mode,bars,value,accessible) {
    return `<div class="chart-row ${mode.id==="hybrid"?"is-recommended":mode.id==="graph_hybrid"?"is-graph":""}" aria-label="${esc(mode.label)}: ${esc(accessible)}"><div class="chart-mode">${esc(shortMode[mode.id]||mode.label)}<small>${esc(modeHint[mode.id]||mode.id)}</small></div><div class="chart-track" aria-hidden="true">${bars}</div><div class="chart-value" aria-hidden="true">${value}</div></div>`;
  }
  $("#history-filters").addEventListener("click",event=>{
    const b=event.target.closest("[data-history]");if(!b)return;state.history=b.dataset.history;
    $$("#history-filters button").forEach(x=>x.setAttribute("aria-pressed",String(x===b)));drawChart();
  });
  function setMetric(metric,focus=false) {
    state.metric=metric;
    $$(".metric-tabs [role=tab]").forEach(b=>{const active=b.dataset.metric===metric;b.setAttribute("aria-selected",String(active));b.tabIndex=active?0:-1;if(active&&focus)b.focus();});
    $("#metric-panel").setAttribute("aria-labelledby",`metric-tab-${metric}`);drawChart();
  }
  $(".metric-tabs").addEventListener("click",event=>{const b=event.target.closest("[data-metric]");if(b)setMetric(b.dataset.metric);});
  $(".metric-tabs").addEventListener("keydown",event=>{
    if(!["ArrowRight","ArrowLeft","Home","End"].includes(event.key))return;
    const names=["quality","recall","latency"],i=names.indexOf(state.metric);event.preventDefault();
    setMetric(names[event.key==="Home"?0:event.key==="End"?2:(i+(event.key==="ArrowRight"?1:2))%3],true);
  });
  $("#latency-switch").addEventListener("click",event=>{const b=event.target.closest("[data-latency]");if(!b)return;state.latency=b.dataset.latency;$$("#latency-switch button").forEach(x=>x.setAttribute("aria-pressed",String(x===b)));drawChart();});
  const hybrid=data.modes.find(m=>m.id==="hybrid"),graph=data.modes.find(m=>m.id==="graph_hybrid");
  $("#finding-text").textContent=`В новой автоматической оценке hybrid и поиск по смыслу получили одинаковый вердикт на каждом из 18 вопросов. У graph_hybrid – 13/18 корректных ответов, у hybrid – 12/18. Медиана retrieve составляет ${sec(hybrid.stats.warmRetrieve.p50)} у hybrid и ${sec(graph.stats.warmRetrieve.p50)} с графом. Граф полнее находит эталонные источники (${pct(graph.stats.sourceRecall)} против ${pct(hybrid.stats.sourceRecall)}), но один ответ преимущества в малой выборке не устанавливает победителя.`;

  const pairs=[...new Map(data.examples.map(e=>[e.pairId,e])).values()];
  const pairLabels={"pm-h07-q02":"Компас и маяк – уже интерес?","pm-h09-q01":"Как подсказка исправила цикл робота?","pm-h09-q05":"К чему относилось «не знаю»? Спорная оценка","pm-h07-q06":"Что известно о музыкальном инструменте?"};
  $("#example-select").innerHTML=pairs.map(e=>`<option value="${esc(e.pairId)}">${esc(e.historyId.replace("pm-",""))} · ${esc(pairLabels[e.pairId]||e.question)}</option>`).join("");
  function idsHTML(ids){return ids?.length?ids.map(id=>`<span class="source-id">${esc(id)}</span>`).join(""):"нет";}
  function renderExample() {
    const entries=data.examples.filter(e=>e.pairId===state.pair),first=entries[0];if(!first)return;
    const available=data.modes.filter(m=>entries.some(e=>e.modeId===m.id));
    for(const slot of ["a","b"]){
      const select=$(`#example-mode-${slot}`);
      if(!available.some(m=>m.id===state[slot]))state[slot]=available[slot==="a"?0:Math.min(1,available.length-1)].id;
      select.innerHTML=available.map(m=>`<option value="${esc(m.id)}"${m.id===state[slot]?" selected":""}>${esc(shortMode[m.id])}</option>`).join("");
    }
    $("#example-question").innerHTML=`<p class="question-meta">${esc(first.historyId)} · ${esc(first.pairId)}</p><blockquote>${esc(first.question)}</blockquote><div class="expected-sources">Эталонные ID ${idsHTML(first.expectedSourceIds)}</div>`;
    $("#example-series-note").innerHTML=`<strong>${esc(reviewLabel())}</strong>. <a href="#review-series">Переключить серию</a>`;
    const left=entries.find(e=>e.modeId===state.a),right=entries.find(e=>e.modeId===state.b);
    $("#example-comparison").innerHTML=renderAnswer(left)+(available.length>1?renderAnswer(right):'<div class="answer-panel empty-example"><p>В этой подборке сохранён один пример ответа. Выберите другой вопрос, чтобы сравнить два режима.</p></div>');
  }
  function renderAnswer(entry) {
    if(!entry)return'<div class="answer-panel empty-example">Для выбранного режима нет примера в этой подборке.</div>';
    const activeReview=state.review==="new"&&entry.newReview?entry.newReview:entry;
    const verdictLabel=value=>({correct:"Корректно",partial:"Частично",incorrect:"Некорректно"}[value]||value);
    const verdict=verdictLabel(activeReview.verdict);
    const context=(entry.contextExcerpt||[]).map(t=>`<div class="context-turn ${entry.answerSourceIds?.includes(t.turnId)?"cited":""}"><div class="turn-meta">${esc(t.role==="teacher"?"Преподаватель":t.role==="student"?"Ребёнок":t.role)} · ${esc(t.turnId)}</div><p>${esc(t.text)}</p></div>`).join("");
    return `<article class="answer-panel"><div class="answer-panel-header"><h3>${esc(shortMode[entry.modeId]||entry.modeId)}</h3><span class="verdict ${esc(activeReview.verdict)}">${esc(verdict)}</span></div><div class="memory-excerpt"><p class="step-label">Найденная память</p>${context||'<p>В выбранном фрагменте нет подтверждающей реплики.</p>'}<p class="excerpt-note">${esc(entry.contextExcerptNote||"Фрагмент выбранного контекста, не полная память.")}</p><details class="selected-source-details"><summary>Все выбранные ID (${entry.selectedSourceIds?.length||0})</summary><div>${idsHTML(entry.selectedSourceIds)}</div></details></div><div class="answer-text"><p class="step-label">Ответ модели</p><div class="model-answer">${esc(entry.answer)}</div><details><summary>Источники, процитированные в ответе</summary><div>${idsHTML(entry.answerSourceIds)}</div></details></div><div class="judgement"><p class="step-label">${esc(reviewLabel())}</p><p>${esc(activeReview.evidence||entry.judgeExplanation)}</p>${state.review==="new"?`<details class="previous-verdict"><summary>Прежняя оценка: ${esc(verdictLabel(entry.verdict))}</summary><p>${esc(entry.judgeExplanation)}</p></details>`:""}${entry.disputed?`<p class="disputed">Ранее спорный случай. ${state.review==="new"?"Новая серия оценила этот ответ как корректный; это решение автоматического оценщика.":"Полная история и видимый модели контекст дают разные основания для оценки."}</p>`:""}</div></article>`;
  }
  $("#example-select").addEventListener("change",event=>{state.pair=event.target.value;renderExample();});
  for(const slot of ["a","b"])$(`#example-mode-${slot}`).addEventListener("change",event=>{state[slot]=event.target.value;renderExample();});
  $("#review-series").addEventListener("change",event=>{state.review=event.target.value;drawChart();renderExample();});
  $("#limitations-content").innerHTML=`<p>Измерения описывают данный эксперимент. Они не устанавливают лучший метод памяти и не подтверждают готовность к работе с детьми.</p><ul>${data.limitations.map(text=>`<li>${esc(text)}</li>`).join("")}${(data.newReview?.notes||[]).map(text=>`<li>${esc(text)}</li>`).join("")}</ul><p>${esc(data.protocol.timingStages)}</p><p>Бюджет памяти: ${fmt(data.protocol.memoryBudgetTokens,0)} токенов. Окно модели: ${fmt(data.protocol.contextTokens,0)}. ${data.protocol.attempts} попыток поиска, ${data.protocol.answers} ответов.</p>`;
  drawChart();renderExample();
})();
