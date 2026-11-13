"use strict";

(() => {
  const data = window.ANSWER_EVAL_20261113;
  const bars = document.querySelector("#own-answer-bars");
  const questionSelect = document.querySelector("#own-answer-question");
  const caseView = document.querySelector("#own-answer-case");
  const esc = value => String(value ?? "").replace(/[&<>"']/g,
    character => ({"&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;"}[character]));
  const roles = {child:"Ребёнок", student:"Ребёнок", assistant:"Ассистент", teacher:"Преподаватель"};
  const percent = value => value === null ? "–" :
    `${(value * 100).toLocaleString("ru-RU", {minimumFractionDigits:0,maximumFractionDigits:0})}%`;
  const share = (rows, predicate) => {
    if (!rows.length) return null;
    const vals = rows.map(predicate).filter(value => value !== null && value !== undefined);
    return vals.length ? vals.reduce((sum, value) => sum + value, 0) / vals.length : null;
  };
  const scoredGold = rows => rows.length > 0 && rows.every(row => typeof row.answer_correct === "boolean");
  const ORIGINS = {
    november_fp: {title:"Ноябрьские вопросы от первого лица", detail:"42 вопроса с эталоном + 6 без ответа в истории"},
    new_scenario: {title:"Новые сценарии 13 ноября", detail:"уход в отказ, перескок темы, точная формулировка · 12 вопросов"},
  };
  if (!data || data.data_origin !== "synthetic_llm_generated" || !Array.isArray(data.rows)) {
    bars.innerHTML = '<p class="error">Сохранённые результаты не загрузились. Их можно открыть в JSON ниже.</p>';
    questionSelect.disabled = true;
    return;
  }
  const questions = new Map(data.questions.map(question => [question.request_id, question]));
  const histories = new Map(data.histories.map(history => [history.history_id, history]));
  const rowFor = id => data.rows.find(row => row.request_id === id);
  const state = {question: null};

  bars.innerHTML = Object.entries(ORIGINS).map(([origin, meta]) => {
    const rows = data.rows.filter(row => row.origin === origin);
    if (!rows.length) return "";
    const gold = rows.filter(row => row.gold_turn_ids.length);
    const absent = rows.filter(row => !row.gold_turn_ids.length);
    const cell = (name, value, note) =>
      `<article class="own-metric"><h4>${name}</h4><strong>${percent(value)}</strong><p>${note}</p></article>`;
    return `<div class="own-origin"><h3>${esc(meta.title)}</h3><p>${esc(meta.detail)}</p></div>
      <div class="own-metric-grid">
      ${gold.length ? cell("Нашли хотя бы один эталонный источник", share(gold, row => row.found_one), `из ${gold.length} вопросов с эталоном`)
        + cell("Нашли все эталонные источники", share(gold, row => row.found_all), "все размеченные реплики попали в контекст")
        + (scoredGold(gold) ? cell("Ответ верен по ключевым основам", share(gold, row => row.answer_correct), "ключи заданы до прогона · автопроверка")
        + cell("Отказ, хотя эталон был передан", share(gold, row => row.refused_on_gold), "модель не заметила контекст")
        : cell("Верность ответов", null, "ответы сохранены для ручного просмотра: ключевые слова не были заданы до прогона, постфактум-оценка не проводится")) : ""}
      ${absent.length ? cell("Корректный отказ на отсутствующих фактах", share(absent, row => row.correct_refusal), `из ${absent.length} вопросов без ответа в истории`) : ""}
      </div>`;
  }).join("");

  questionSelect.innerHTML = data.questions.map(question =>
    `<option value="${esc(question.request_id)}">${esc(question.origin === "new_scenario" ? "новый · " : "ноябрь · ")}${esc(question.request_id)} · ${esc(question.text)}</option>`).join("");

  function pickQuestion(predicate) {
    const found = data.rows.find(row => predicate(row) && questions.has(row.request_id));
    return found ? found.request_id : state.question || (data.questions[0] && data.questions[0].request_id);
  }
  const PRESETS = {
    success: row => row.gold_turn_ids.length && row.found_all && row.answer_correct,
    partial: row => row.gold_turn_ids.length && row.found_one && !row.found_all,
    miss: row => row.gold_turn_ids.length && !row.found_one,
    absent: row => !row.gold_turn_ids.length,
    hedge: row => row.origin === "new_scenario" && row.category === "hedge_recall",
  };
  document.querySelectorAll("[data-own-answer-pick-preset]").forEach(button => button.addEventListener("click", () => {
    const predicate = PRESETS[button.dataset.ownAnswerPickPreset];
    if (predicate) { state.question = pickQuestion(predicate); renderCase(); caseView.querySelector(".own-case-question")?.focus(); }
  }));

  function chip(label, ok, note) {
    return `<span class="own-chip ${ok ? "ok" : "bad"}">${esc(label)}${note ? ` · ${esc(note)}` : ""}</span>`;
  }
  function renderCase() {
    const question = questions.get(state.question);
    const row = rowFor(state.question);
    const history = question && histories.get(question.history_id);
    if (!question || !row || !history) {
      caseView.innerHTML = '<p class="error">Сохранённый вопрос или строка прогона не найдена.</p>';
      return;
    }
    questionSelect.value = question.request_id;
    const gold = new Set(question.gold_turn_ids);
    const quoted = new Set(row.quoted_turn_ids);
    const inContext = [...gold].filter(id => quoted.has(id));
    const chips = [];
    if (gold.size) {
      chips.push(chip(`Эталон в контексте: ${inContext.length} из ${gold.size}`, inContext.length > 0));
      chips.push(chip("Все эталонные в контексте", row.found_all));
      if (typeof row.answer_correct === "boolean") {
        chips.push(row.answer_correct ? chip("Ответ верен по автопроверке", true)
          : chip("Ответ не прошёл автопроверку", false, row.missing_terms.length ? "нет: " + row.missing_terms.join(", ") : "модель не передала, что ребёнок не знал"));
      }
      if (row.refused_on_gold) chips.push(chip("Модель уходит в отказ, хотя эталон был передан", false));
    } else {
      chips.push(row.correct_refusal ? chip("Корректный отказ", true, "модель прямо сказала, что этого нет")
        : chip("Отказа нет", false, "модель что-то утверждает без источников"));
    }
    const quotedList = row.quoted_turn_ids.length
      ? `<ul class="own-quoted-ids">${row.quoted_turn_ids.map(id =>
          `<li${gold.has(id) ? ' class="is-gold"' : ""}>${esc(id)}${gold.has(id) ? " · эталон" : ""}</li>`).join("")}</ul>`
      : "<p>Поиск не вернул ни одной реплики.</p>";
    caseView.innerHTML = `<div class="own-case-question" tabindex="-1"><p class="micro">${esc(question.request_id)} · ${esc(question.origin === "new_scenario" ? "новый сценарий" : "ноябрьский набор, от первого лица")} · категория ${esc(question.category)}</p><h4>${esc(question.text)}</h4><p><strong>Ожидаемый ответ по разметке:</strong> ${esc(question.expected || "ответа в истории нет – нужен отказ")}</p><div class="own-chips">${chips.join("")}</div></div>
      <div class="own-answer-columns">
        <section class="own-answer-sources"><h4>Найденные источники · попали в контекст</h4>${quotedList}<p class="own-hint">Список точный: это реплики, отобранные формулой приложения под лимит ${esc(String(data.quote_budget_bytes))} байт.</p></section>
        <section class="own-answer-model"><h4>Ответ модели (${esc(data.model)})</h4><blockquote class="own-answer-text">${esc(row.answer)}</blockquote></section>
      </div>
      <details class="own-packed"><summary>Переданный модели контекст · ${esc(String(row.prompt_chars))} символов промпта</summary><pre>${esc(row.model_context_packed || "(не сохранено)")}</pre></details>
      <div class="own-dialogue"><h4>Исходная вымышленная переписка</h4><p>Янтарным отмечены эталонные реплики, зелёным – реплики, которые поиск реально передал модели.</p><label for="own-answer-lesson">Занятие</label><select id="own-answer-lesson"><option value="all">Вся история · ${history.lessons.reduce((n,lesson) => n + lesson.turns.length,0)} реплик</option>${history.lessons.map(lesson => `<option value="${esc(lesson.lesson_id)}">${esc(lesson.lesson_id)} · ${esc(lesson.observed_on)} · ${esc(lesson.topic || "")}</option>`).join("")}</select><div id="own-answer-turns" class="own-turns" tabindex="0" aria-label="Исходные реплики синтетической истории"></div></div>`;
    let lesson = "all";
    const goldLesson = question.gold_turn_ids.length
      ? history.lessons.find(item => item.turns.some(turn => gold.has(turn.turn_id))) : null;
    const quotedLesson = row.quoted_turn_ids.length
      ? history.lessons.find(item => item.turns.some(turn => quoted.has(turn.turn_id))) : null;
    lesson = (goldLesson || quotedLesson || history.lessons[0]).lesson_id;
    const turnsBox = document.querySelector("#own-answer-turns");
    const renderTurns = () => {
      const lessons = lesson === "all" ? history.lessons : history.lessons.filter(item => item.lesson_id === lesson);
      turnsBox.innerHTML = lessons.map(item =>
        `<section class="own-lesson"><h4>${esc(item.lesson_id)} · ${esc(item.observed_on)}</h4>${item.turns.map(turn =>
          `<article class="turn${gold.has(turn.turn_id) ? " gold" : ""}${quoted.has(turn.turn_id) ? " quoted" : ""}"><div class="turn-meta"><span>${esc(roles[turn.role] || turn.role)}</span><span>${esc(turn.turn_id)}</span>${gold.has(turn.turn_id) ? '<span class="turn-mark gold-mark">эталон</span>' : ""}${quoted.has(turn.turn_id) ? '<span class="turn-mark quoted-mark">в контексте</span>' : ""}</div><p>${esc(turn.text)}</p></article>`).join("")}</section>`).join("");
    };
    const lessonSelect = document.querySelector("#own-answer-lesson");
    lessonSelect.value = lesson;
    lessonSelect.addEventListener("change", event => { lesson = event.target.value; renderTurns(); });
    renderTurns();
  }

  questionSelect.addEventListener("change", event => { state.question = event.target.value; renderCase(); });
  document.querySelectorAll("[data-own-answer-pick]").forEach(button => button.addEventListener("click", () => {
    state.question = button.dataset.ownAnswerPick;
    renderCase();
    caseView.querySelector(".own-case-question")?.focus();
  }));
  state.question = pickQuestion(row => row.gold_turn_ids.length && row.found_all && row.answer_correct);
  renderCase();
})();
