"use strict";

(() => {
  const data = window.ANSWER_EVAL_20261113;
  const bars = document.querySelector("#own-answer-bars");
  const breakdown = document.querySelector("#own-answer-breakdown");
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
  const CATEGORY_LABELS = {
    old_fact:"старый факт", paraphrase_detail:"пересказ с деталью", unfinished_task:"незавершённое дело",
    ambiguous_short_reply:"короткий неоднозначный ответ", abstract_recall:"общий вывод из занятия",
    temporal:"время и сроки", preference_change:"сменившееся предпочтение", absent_fact:"факта в истории нет",
    hedge_recall:"ребёнок ответил «не знаю»", topic_switch_recall:"перескок темы", exact_wording_recall:"точная формулировка",
  };
  const categoryLabel = category => CATEGORY_LABELS[category] || category;
  const GROUPS = [
    {origin:"november_fp", label:"Ноябрьские · от первого лица"},
    {origin:"new_scenario", label:"Новые сценарии 13.11"},
  ];
  const CATEGORY_ORDER = {
    november_fp:["old_fact","paraphrase_detail","unfinished_task","ambiguous_short_reply","abstract_recall","temporal","preference_change","absent_fact"],
    new_scenario:["hedge_recall","topic_switch_recall","exact_wording_recall"],
  };
  const plural = (count, one, few, many) => {
    const mod10 = count % 10, mod100 = count % 100;
    if (mod10 === 1 && mod100 !== 11) return one;
    if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return few;
    return many;
  };
  const questionsLabel = count => `${count} ${plural(count, "вопрос", "вопроса", "вопросов")}`;
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

  const byCategory = new Map();
  data.rows.forEach(row => {
    const key = `${row.origin}:${row.category}`;
    if (!byCategory.has(key)) byCategory.set(key, []);
    byCategory.get(key).push(row);
  });
  const booleanCell = (rows, field) => {
    const eligible = rows.filter(row => typeof row[field] === "boolean");
    if (!eligible.length) return null;
    const yes = eligible.filter(row => row[field]).length;
    return {text:percent(yes / eligible.length), detail:`${yes} из ${eligible.length}`};
  };
  const refusalCell = rows => {
    const absentRows = rows.filter(row => !row.gold_turn_ids.length);
    if (!absentRows.length) return null;
    const yes = absentRows.filter(row => row.correct_refusal).length;
    return {text:percent(yes / absentRows.length), detail:`${yes} из ${absentRows.length}`};
  };
  const cellHtml = cell => cell
    ? `<strong>${esc(cell.text)}</strong><span class="own-breakdown-sub">${esc(cell.detail)}</span>`
    : '<span class="own-breakdown-dash">–</span>';
  const sizes = [];
  const groupsHtml = GROUPS.map(group => {
    const present = [...new Set(data.rows.filter(row => row.origin === group.origin).map(row => row.category))];
    const categories = CATEGORY_ORDER[group.origin].filter(category => present.includes(category))
      .concat(present.filter(category => !CATEGORY_ORDER[group.origin].includes(category)));
    if (!categories.length) return "";
    const originCount = data.rows.filter(row => row.origin === group.origin).length;
    const body = categories.map(category => {
      const rows = byCategory.get(`${group.origin}:${category}`);
      sizes.push(rows.length);
      const goldCount = rows.filter(row => row.gold_turn_ids.length).length;
      const absentCount = rows.length - goldCount;
      const sub = questionsLabel(rows.length) + (absentCount ? ` · без ответа в истории: ${absentCount}` : "");
      return `<tr><th scope="row" class="own-breakdown-cat"><strong>${esc(categoryLabel(category))}</strong><span class="own-breakdown-sub">${esc(sub)}</span></th>
        <td class="own-breakdown-val">${cellHtml(booleanCell(rows, "found_one"))}</td>
        <td class="own-breakdown-val">${cellHtml(booleanCell(rows, "found_all"))}</td>
        <td class="own-breakdown-val">${cellHtml(booleanCell(rows, "answer_correct"))}</td>
        <td class="own-breakdown-val">${cellHtml(refusalCell(rows))}</td></tr>`;
    }).join("");
    return `<tbody><tr class="own-breakdown-group"><th colspan="5" scope="colgroup">${esc(group.label)} · ${esc(questionsLabel(originCount))}</th></tr>${body}</tbody>`;
  }).join("");
  if (groupsHtml) {
    const sizeNote = sizes.length
      ? `<p class="own-breakdown-foot">В каждой ячейке от ${Math.min(...sizes)} до ${Math.max(...sizes)} вопросов: это синтетические истории одного прогона. Разбивка показывает, где поиск справлялся лучше или хуже именно в этом наборе, и не говорит ничего о реальных детях.</p>`
      : "";
    breakdown.innerHTML = `<h3>Разбивка по категориям</h3>
      <p class="own-breakdown-lead">Те же доли, что в карточках выше, но отдельно по каждой категории вопросов – пересчитаны из тех же сохранённых строк.</p>
      <div class="own-breakdown-scroll"><table class="own-breakdown-table">
      <thead><tr><th scope="col">Категория</th><th scope="col">Нашли хотя бы один эталон</th><th scope="col">Нашли все эталонные</th><th scope="col">Ответ верен (автопроверка)*</th><th scope="col">Корректный отказ</th></tr></thead>
      ${groupsHtml}</table></div>
      <p class="own-breakdown-foot">* Верность ответа автопроверкой оценена только для новых сценариев 13 ноября: для ноябрьских вопросов ключевые основы слов не были заданы до прогона, и такая оценка не проводится. «–» – метрика к категории не применяется или не оценивалась.</p>
      ${sizeNote}`;
  }

  questionSelect.innerHTML = GROUPS.map(group => {
    const list = data.questions.filter(question => question.origin === group.origin);
    if (!list.length) return "";
    return `<optgroup label="${esc(group.label)}">${list.map(question =>
      `<option value="${esc(question.request_id)}">${esc(categoryLabel(question.category))} · ${esc(question.request_id)} · ${esc(question.text)}</option>`).join("")}</optgroup>`;
  }).join("");

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
