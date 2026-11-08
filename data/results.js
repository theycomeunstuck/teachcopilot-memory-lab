window.MEMORY_RESULTS = {
  "schemaVersion": "1.0",
  "title": "Исследование персональной памяти на синтетических историях",
  "reviewSeries": "previous_review",
  "protocol": {
    "historyCount": 3,
    "questionsPerHistory": 6,
    "modeCount": 5,
    "retrievalRecords": 90,
    "attempts": 360,
    "successfulAttempts": 360,
    "answers": 90,
    "answersPerMode": 18,
    "sourceTopK": 8,
    "recentLessonsOutsideK": 2,
    "memoryBudgetTokens": 4096,
    "contextTokens": 32768,
    "recallDefinition": "Среднее доли найденных эталонных ID по пяти вопросам с непустым эталоном, первая попытка. Шестой вопрос исключён.",
    "timingDefinition": "p50 и p95 по 18 повторам на историю и режим; для общей медианы режима объединены 54 повтора. Линейная интерполяция, секунды.",
    "timingStages": "Retrieve включает поиск; полный процесс включает подготовку, отбор и подсчёт токенов, но не генерацию ответа.",
    "answerReview": "Прежняя независимая автоматическая оценка относительно полной истории. Новая серия сохраняется отдельно.",
    "synthetic": true
  },
  "methods": [
    {
      "id": "profile_only",
      "label": "Без истории",
      "description": "Вопрос и общий профиль без записей прошлых занятий.",
      "limitation": "Не восстанавливает события, которых нет во входе."
    },
    {
      "id": "tail",
      "label": "Последние реплики",
      "description": "Модель получает недавние исходные реплики с датами и ID.",
      "limitation": "Старые события вытесняются, граница может разорвать контекст."
    },
    {
      "id": "summary",
      "label": "Резюме",
      "description": "Краткое описание обновляется после занятий.",
      "limitation": "Пересказ может потерять детали или условия помощи."
    },
    {
      "id": "structured",
      "label": "Структурированная память V1",
      "description": "Типизированные учебные наблюдения, источники, помощь и исправления.",
      "limitation": "Результат зависит от извлекателя и схемы."
    },
    {
      "id": "structured_v2",
      "label": "Структурированная память V2",
      "description": "Учебные события, кандидаты интересов, просьбы и случайные факты.",
      "limitation": "Схема и извлекатель отличаются от V1 одновременно."
    },
    {
      "id": "graph",
      "label": "Граф учебных тем",
      "description": "Записи V1 связаны с учебными темами и предпосылками.",
      "limitation": "Граф тем не является полным графом личных событий."
    },
    {
      "id": "mem0",
      "label": "Mem0",
      "description": "Извлечённые воспоминания направляют поиск к связанным занятиям.",
      "limitation": "Привязка к занятию не гарантирует точной реплики."
    },
    {
      "id": "graphiti",
      "label": "Graphiti и LangGraph",
      "description": "Граф и архив дают кандидатов, управляющий процесс выбирает исходные реплики.",
      "limitation": "Связи могут быть ошибочны, отбор может пропустить важный фрагмент."
    },
    {
      "id": "graphiti_mem0",
      "label": "Graphiti, Mem0 и LangGraph",
      "description": "К графовому и архивному поиску добавляются кандидаты Mem0.",
      "limitation": "Больше компонентов и возможны противоречия."
    }
  ],
  "modes": [
    {
      "id": "chronological",
      "label": "Хронологический",
      "description": "Отбор архивных фрагментов по времени.",
      "stats": {
        "correct": 9,
        "partial": 1,
        "incorrect": 8,
        "total": 18,
        "sourceRecall": 0.5,
        "sourceRecallN": 15,
        "retrieveLatencyMs": 54.19365002308041,
        "fullLatencyMs": 1950.2218500128947,
        "latencyN": 54,
        "warmRetrieve": {
          "n": 54,
          "p50": 0.05419365002308041,
          "p95": 0.06859381499234586
        },
        "warmPipeline": {
          "n": 54,
          "p50": 1.9502218500128947,
          "p95": 6.478753550053807
        },
        "reviewSeries": "previous_review"
      }
    },
    {
      "id": "lexical",
      "label": "Лексический",
      "description": "Русскоязычный поиск PostgreSQL, оставшиеся после обработки термины объединены условием «И».",
      "stats": {
        "correct": 4,
        "partial": 0,
        "incorrect": 14,
        "total": 18,
        "sourceRecall": 0.06666666666666667,
        "sourceRecallN": 15,
        "retrieveLatencyMs": 33.27134996652603,
        "fullLatencyMs": 379.7039999626577,
        "latencyN": 54,
        "warmRetrieve": {
          "n": 54,
          "p50": 0.03327134996652603,
          "p95": 0.060277855000458645
        },
        "warmPipeline": {
          "n": 54,
          "p50": 0.3797039999626577,
          "p95": 0.8959349250071682
        },
        "reviewSeries": "previous_review"
      }
    },
    {
      "id": "vector",
      "label": "Векторный",
      "description": "Поиск по близости векторных представлений запроса и фрагментов.",
      "stats": {
        "correct": 11,
        "partial": 2,
        "incorrect": 5,
        "total": 18,
        "sourceRecall": 0.6666666666666666,
        "sourceRecallN": 15,
        "retrieveLatencyMs": 53.58080001315102,
        "fullLatencyMs": 1880.5252000456676,
        "latencyN": 54,
        "warmRetrieve": {
          "n": 54,
          "p50": 0.05358080001315102,
          "p95": 0.06591192496125586
        },
        "warmPipeline": {
          "n": 54,
          "p50": 1.8805252000456676,
          "p95": 7.147546604991658
        },
        "reviewSeries": "previous_review"
      }
    },
    {
      "id": "hybrid",
      "label": "Гибридный",
      "description": "Совместный поиск по архиву несколькими каналами.",
      "stats": {
        "correct": 12,
        "partial": 1,
        "incorrect": 5,
        "total": 18,
        "sourceRecall": 0.6666666666666666,
        "sourceRecallN": 15,
        "retrieveLatencyMs": 60.14025001786649,
        "fullLatencyMs": 1601.3418500078842,
        "latencyN": 54,
        "warmRetrieve": {
          "n": 54,
          "p50": 0.06014025001786649,
          "p95": 0.09054916500463149
        },
        "warmPipeline": {
          "n": 54,
          "p50": 1.6013418500078842,
          "p95": 7.160142794949934
        },
        "reviewSeries": "previous_review"
      }
    },
    {
      "id": "graph_hybrid",
      "label": "Графовый гибрид",
      "description": "Гибридный поиск с дополнительными запросами к графу. Графовые факты – подсказки, а не исходные свидетельства.",
      "stats": {
        "correct": 12,
        "partial": 1,
        "incorrect": 5,
        "total": 18,
        "sourceRecall": 0.7333333333333333,
        "sourceRecallN": 15,
        "retrieveLatencyMs": 183.13790002139285,
        "fullLatencyMs": 1992.7828500512987,
        "latencyN": 54,
        "warmRetrieve": {
          "n": 54,
          "p50": 0.18313790002139285,
          "p95": 0.259596774977399
        },
        "warmPipeline": {
          "n": 54,
          "p50": 1.9927828500512987,
          "p95": 7.312553725013276
        },
        "reviewSeries": "previous_review"
      }
    }
  ],
  "histories": [
    {
      "id": "pm-h07",
      "label": "История 07",
      "topic": "Русский язык и диалог",
      "lessons": 10,
      "questions": 6,
      "description": "Вымышленная история о диалоге и прежних событиях."
    },
    {
      "id": "pm-h08",
      "label": "История 08",
      "topic": "Математика и карты",
      "lessons": 10,
      "questions": 6,
      "description": "Длинная синтетическая история с 1300 однотипными тренировочными парами."
    },
    {
      "id": "pm-h09",
      "label": "История 09",
      "topic": "Программирование и робот",
      "lessons": 10,
      "questions": 6,
      "description": "Вымышленная история о циклах и программе робота."
    }
  ],
  "retrievalStats": [
    {
      "historyId": "pm-h07",
      "modeId": "chronological",
      "recall": {
        "n": 5,
        "mean": 0.8
      },
      "warmRetrieve": {
        "n": 18,
        "p50": 0.04543209995608777,
        "p95": 0.06317720492952503
      },
      "warmPipeline": {
        "n": 18,
        "p50": 1.561538650013972,
        "p95": 2.0272412699181586
      },
      "selectedSourceIdsMean": 18,
      "candidateSourceIdsMean": 18
    },
    {
      "historyId": "pm-h07",
      "modeId": "lexical",
      "recall": {
        "n": 5,
        "mean": 0.2
      },
      "warmRetrieve": {
        "n": 18,
        "p50": 0.02670685003977269,
        "p95": 0.03514496994903311
      },
      "warmPipeline": {
        "n": 18,
        "p50": 0.37506564997602254,
        "p95": 0.42198867997503836
      },
      "selectedSourceIdsMean": 4,
      "candidateSourceIdsMean": 4
    },
    {
      "historyId": "pm-h07",
      "modeId": "vector",
      "recall": {
        "n": 5,
        "mean": 0.8
      },
      "warmRetrieve": {
        "n": 18,
        "p50": 0.05157404992496595,
        "p95": 0.0630579950287938
      },
      "warmPipeline": {
        "n": 18,
        "p50": 1.5314887499553151,
        "p95": 2.0109644650074183
      },
      "selectedSourceIdsMean": 16.666666666666668,
      "candidateSourceIdsMean": 16.666666666666668
    },
    {
      "historyId": "pm-h07",
      "modeId": "hybrid",
      "recall": {
        "n": 5,
        "mean": 0.8
      },
      "warmRetrieve": {
        "n": 18,
        "p50": 0.057949749985709786,
        "p95": 0.06661177995265462
      },
      "warmPipeline": {
        "n": 18,
        "p50": 1.5020706499926746,
        "p95": 1.6144419100193772
      },
      "selectedSourceIdsMean": 16.666666666666668,
      "candidateSourceIdsMean": 16.666666666666668
    },
    {
      "historyId": "pm-h07",
      "modeId": "graph_hybrid",
      "recall": {
        "n": 5,
        "mean": 0.8
      },
      "warmRetrieve": {
        "n": 18,
        "p50": 0.1752438500407152,
        "p95": 0.19252373494091443
      },
      "warmPipeline": {
        "n": 18,
        "p50": 1.6697749000159092,
        "p95": 2.1568913949828126
      },
      "selectedSourceIdsMean": 16.666666666666668,
      "candidateSourceIdsMean": 16.666666666666668
    },
    {
      "historyId": "pm-h08",
      "modeId": "chronological",
      "recall": {
        "n": 5,
        "mean": 0.0
      },
      "warmRetrieve": {
        "n": 18,
        "p50": 0.06305245001567528,
        "p95": 0.07349829493905415
      },
      "warmPipeline": {
        "n": 18,
        "p50": 6.190565400000196,
        "p95": 6.58448491502204
      },
      "selectedSourceIdsMean": 70,
      "candidateSourceIdsMean": 286
    },
    {
      "historyId": "pm-h08",
      "modeId": "lexical",
      "recall": {
        "n": 5,
        "mean": 0.0
      },
      "warmRetrieve": {
        "n": 18,
        "p50": 0.05052935000276193,
        "p95": 0.06495991497067734
      },
      "warmPipeline": {
        "n": 18,
        "p50": 0.8850974499364384,
        "p95": 0.9084507450286765
      },
      "selectedSourceIdsMean": 56,
      "candidateSourceIdsMean": 56
    },
    {
      "historyId": "pm-h08",
      "modeId": "vector",
      "recall": {
        "n": 5,
        "mean": 0.4
      },
      "warmRetrieve": {
        "n": 18,
        "p50": 0.05603644996881485,
        "p95": 0.06673834504908882
      },
      "warmPipeline": {
        "n": 18,
        "p50": 7.074990449997131,
        "p95": 7.162949149979977
      },
      "selectedSourceIdsMean": 71.66666666666667,
      "candidateSourceIdsMean": 366.3333333333333
    },
    {
      "historyId": "pm-h08",
      "modeId": "hybrid",
      "recall": {
        "n": 5,
        "mean": 0.4
      },
      "warmRetrieve": {
        "n": 18,
        "p50": 0.08074449998093769,
        "p95": 0.09316135997651144
      },
      "warmPipeline": {
        "n": 18,
        "p50": 7.097682600026019,
        "p95": 7.222199145046761
      },
      "selectedSourceIdsMean": 71.66666666666667,
      "candidateSourceIdsMean": 366.3333333333333
    },
    {
      "historyId": "pm-h08",
      "modeId": "graph_hybrid",
      "recall": {
        "n": 5,
        "mean": 0.4
      },
      "warmRetrieve": {
        "n": 18,
        "p50": 0.23990524996770546,
        "p95": 0.26648907994385806
      },
      "warmPipeline": {
        "n": 18,
        "p50": 7.255371299979743,
        "p95": 7.325871575064957
      },
      "selectedSourceIdsMean": 71.66666666666667,
      "candidateSourceIdsMean": 372.6666666666667
    },
    {
      "historyId": "pm-h09",
      "modeId": "chronological",
      "recall": {
        "n": 5,
        "mean": 0.7
      },
      "warmRetrieve": {
        "n": 18,
        "p50": 0.05387859995244071,
        "p95": 0.06418137000291609
      },
      "warmPipeline": {
        "n": 18,
        "p50": 1.5244752500439063,
        "p95": 1.9687301750003825
      },
      "selectedSourceIdsMean": 18,
      "candidateSourceIdsMean": 18
    },
    {
      "historyId": "pm-h09",
      "modeId": "lexical",
      "recall": {
        "n": 5,
        "mean": 0.0
      },
      "warmRetrieve": {
        "n": 18,
        "p50": 0.026807949994690716,
        "p95": 0.03423472497379407
      },
      "warmPipeline": {
        "n": 18,
        "p50": 0.36695960006909445,
        "p95": 0.38071004997473207
      },
      "selectedSourceIdsMean": 4,
      "candidateSourceIdsMean": 4
    },
    {
      "historyId": "pm-h09",
      "modeId": "vector",
      "recall": {
        "n": 5,
        "mean": 0.8
      },
      "warmRetrieve": {
        "n": 18,
        "p50": 0.05358080001315102,
        "p95": 0.06538317507365718
      },
      "warmPipeline": {
        "n": 18,
        "p50": 1.6222642000648193,
        "p95": 2.0755072699917947
      },
      "selectedSourceIdsMean": 18.333333333333332,
      "candidateSourceIdsMean": 18.333333333333332
    },
    {
      "historyId": "pm-h09",
      "modeId": "hybrid",
      "recall": {
        "n": 5,
        "mean": 0.8
      },
      "warmRetrieve": {
        "n": 18,
        "p50": 0.05432554997969419,
        "p95": 0.06459043002105318
      },
      "warmPipeline": {
        "n": 18,
        "p50": 1.5295562999672256,
        "p95": 1.6461853400513065
      },
      "selectedSourceIdsMean": 18.333333333333332,
      "candidateSourceIdsMean": 18.333333333333332
    },
    {
      "historyId": "pm-h09",
      "modeId": "graph_hybrid",
      "recall": {
        "n": 5,
        "mean": 1.0
      },
      "warmRetrieve": {
        "n": 18,
        "p50": 0.17761434998828918,
        "p95": 0.19295731495367363
      },
      "warmPipeline": {
        "n": 18,
        "p50": 1.631520049937535,
        "p95": 2.036861644987948
      },
      "selectedSourceIdsMean": 17.333333333333332,
      "candidateSourceIdsMean": 17.333333333333332
    }
  ],
  "answerStats": [
    {
      "modeId": "chronological",
      "n": 18,
      "correct": 9,
      "partial": 1,
      "incorrect": 8,
      "unanswerable": 0,
      "hallucinations": 1,
      "reviewSeries": "previous_review"
    },
    {
      "modeId": "lexical",
      "n": 18,
      "correct": 4,
      "partial": 0,
      "incorrect": 14,
      "unanswerable": 0,
      "hallucinations": 0,
      "reviewSeries": "previous_review"
    },
    {
      "modeId": "vector",
      "n": 18,
      "correct": 11,
      "partial": 2,
      "incorrect": 5,
      "unanswerable": 0,
      "hallucinations": 0,
      "reviewSeries": "previous_review"
    },
    {
      "modeId": "hybrid",
      "n": 18,
      "correct": 12,
      "partial": 1,
      "incorrect": 5,
      "unanswerable": 0,
      "hallucinations": 0,
      "reviewSeries": "previous_review"
    },
    {
      "modeId": "graph_hybrid",
      "n": 18,
      "correct": 12,
      "partial": 1,
      "incorrect": 5,
      "unanswerable": 0,
      "hallucinations": 0,
      "reviewSeries": "previous_review"
    }
  ],
  "answerStatsByHistory": [
    {
      "historyId": "pm-h07",
      "modeId": "chronological",
      "n": 6,
      "correct": 5,
      "partial": 0,
      "incorrect": 1,
      "unanswerable": 0,
      "hallucinations": 0,
      "reviewSeries": "previous_review"
    },
    {
      "historyId": "pm-h07",
      "modeId": "lexical",
      "n": 6,
      "correct": 2,
      "partial": 0,
      "incorrect": 4,
      "unanswerable": 0,
      "hallucinations": 0,
      "reviewSeries": "previous_review"
    },
    {
      "historyId": "pm-h07",
      "modeId": "vector",
      "n": 6,
      "correct": 4,
      "partial": 1,
      "incorrect": 1,
      "unanswerable": 0,
      "hallucinations": 0,
      "reviewSeries": "previous_review"
    },
    {
      "historyId": "pm-h07",
      "modeId": "hybrid",
      "n": 6,
      "correct": 4,
      "partial": 1,
      "incorrect": 1,
      "unanswerable": 0,
      "hallucinations": 0,
      "reviewSeries": "previous_review"
    },
    {
      "historyId": "pm-h07",
      "modeId": "graph_hybrid",
      "n": 6,
      "correct": 5,
      "partial": 0,
      "incorrect": 1,
      "unanswerable": 0,
      "hallucinations": 0,
      "reviewSeries": "previous_review"
    },
    {
      "historyId": "pm-h08",
      "modeId": "chronological",
      "n": 6,
      "correct": 1,
      "partial": 0,
      "incorrect": 5,
      "unanswerable": 0,
      "hallucinations": 0,
      "reviewSeries": "previous_review"
    },
    {
      "historyId": "pm-h08",
      "modeId": "lexical",
      "n": 6,
      "correct": 1,
      "partial": 0,
      "incorrect": 5,
      "unanswerable": 0,
      "hallucinations": 0,
      "reviewSeries": "previous_review"
    },
    {
      "historyId": "pm-h08",
      "modeId": "vector",
      "n": 6,
      "correct": 3,
      "partial": 0,
      "incorrect": 3,
      "unanswerable": 0,
      "hallucinations": 0,
      "reviewSeries": "previous_review"
    },
    {
      "historyId": "pm-h08",
      "modeId": "hybrid",
      "n": 6,
      "correct": 3,
      "partial": 0,
      "incorrect": 3,
      "unanswerable": 0,
      "hallucinations": 0,
      "reviewSeries": "previous_review"
    },
    {
      "historyId": "pm-h08",
      "modeId": "graph_hybrid",
      "n": 6,
      "correct": 3,
      "partial": 0,
      "incorrect": 3,
      "unanswerable": 0,
      "hallucinations": 0,
      "reviewSeries": "previous_review"
    },
    {
      "historyId": "pm-h09",
      "modeId": "chronological",
      "n": 6,
      "correct": 3,
      "partial": 1,
      "incorrect": 2,
      "unanswerable": 0,
      "hallucinations": 1,
      "reviewSeries": "previous_review"
    },
    {
      "historyId": "pm-h09",
      "modeId": "lexical",
      "n": 6,
      "correct": 1,
      "partial": 0,
      "incorrect": 5,
      "unanswerable": 0,
      "hallucinations": 0,
      "reviewSeries": "previous_review"
    },
    {
      "historyId": "pm-h09",
      "modeId": "vector",
      "n": 6,
      "correct": 4,
      "partial": 1,
      "incorrect": 1,
      "unanswerable": 0,
      "hallucinations": 0,
      "reviewSeries": "previous_review"
    },
    {
      "historyId": "pm-h09",
      "modeId": "hybrid",
      "n": 6,
      "correct": 5,
      "partial": 0,
      "incorrect": 1,
      "unanswerable": 0,
      "hallucinations": 0,
      "reviewSeries": "previous_review"
    },
    {
      "historyId": "pm-h09",
      "modeId": "graph_hybrid",
      "n": 6,
      "correct": 4,
      "partial": 1,
      "incorrect": 1,
      "unanswerable": 0,
      "hallucinations": 0,
      "reviewSeries": "previous_review"
    }
  ],
  "examples": [
    {
      "id": "pm-h07-q02-hybrid",
      "pairId": "pm-h07-q02",
      "historyId": "pm-h07",
      "modeId": "hybrid",
      "question": "Какие детали для заданий ученица выбирала в разное время? Можно ли считать это постоянным интересом?",
      "contextExcerpt": [
        {
          "turnId": "pm-h07-l03-t0001",
          "role": "teacher",
          "text": "Какой предмет добавим в диалог?"
        },
        {
          "turnId": "pm-h07-l03-t0002",
          "role": "student",
          "text": "Старинный компас."
        },
        {
          "turnId": "pm-h07-l08-t0001",
          "role": "teacher",
          "text": "О чём составим следующий диалог?"
        },
        {
          "turnId": "pm-h07-l08-t0002",
          "role": "student",
          "text": "О маяке."
        }
      ],
      "contextExcerptNote": "Фрагмент выбранной памяти, не полный контекст.",
      "answer": "В предоставленных сведениях нет данных о том, какие именно детали для заданий выбирала ученица в разное время, кроме как в одном случае, где она предложила добавить «Старинный компас» (pm-h07-l03-t0002). Данных недостаточно для оценки постоянного интереса.",
      "answerSourceIds": [
        "pm-h07-l03-t0002"
      ],
      "selectedSourceIds": [
        "pm-h07-l06-t0001",
        "pm-h07-l06-t0002",
        "pm-h07-l10-t0001",
        "pm-h07-l10-t0002",
        "pm-h07-l02-t0001",
        "pm-h07-l02-t0002",
        "pm-h07-l09-t0001",
        "pm-h07-l09-t0002",
        "pm-h07-l03-t0001",
        "pm-h07-l03-t0002",
        "pm-h07-l01-t0001",
        "pm-h07-l01-t0002",
        "pm-h07-l08-t0001",
        "pm-h07-l08-t0002",
        "pm-h07-l07-t0001",
        "pm-h07-l07-t0002"
      ],
      "expectedSourceIds": [
        "pm-h07-l03-t0001",
        "pm-h07-l03-t0002",
        "pm-h07-l08-t0001",
        "pm-h07-l08-t0002"
      ],
      "verdict": "partial",
      "sourceSupport": "partial",
      "judgeExplanation": "Цитата ученицы l03-t0002 «Старинный компас» подтверждает один выбор, и вывод о недоказанном постоянном интересе верен. Однако в l08-t0001 учитель спрашивает о теме следующего диалога, а ученица в l08-t0002 отвечает «О маяке»; второй выбор пропущен при утверждении, что известен только один.",
      "interpretationNote": "Видны оба выбора; прежняя оценка указала на пропуск второго.",
      "disputed": false,
      "reviewSeries": "previous_review",
      "newReview": {
        "verdict": "partial",
        "sourceSupport": "partial",
        "hallucination": true,
        "calibration": "overcautious",
        "evidence": "Процитированная pm-h07-l03-t0002 подтверждает компас, но ответ утверждает, что в предоставленных сведениях есть только один случай: это прямо противоречит также доступным pm-h07-l08-t0001 и pm-h07-l08-t0002 о маяке. Пропущен существенный второй выбор; цитата не подтверждает исключительность. Галлюцинация отмечена за явное ложное утверждение об отсутствии других данных, а не за один лишь пропуск. При доступности обоих случаев ответ чрезмерно осторожен."
      }
    },
    {
      "id": "pm-h07-q02-graph_hybrid",
      "pairId": "pm-h07-q02",
      "historyId": "pm-h07",
      "modeId": "graph_hybrid",
      "question": "Какие детали для заданий ученица выбирала в разное время? Можно ли считать это постоянным интересом?",
      "contextExcerpt": [
        {
          "turnId": "pm-h07-l03-t0001",
          "role": "teacher",
          "text": "Какой предмет добавим в диалог?"
        },
        {
          "turnId": "pm-h07-l03-t0002",
          "role": "student",
          "text": "Старинный компас."
        },
        {
          "turnId": "pm-h07-l08-t0001",
          "role": "teacher",
          "text": "О чём составим следующий диалог?"
        },
        {
          "turnId": "pm-h07-l08-t0002",
          "role": "student",
          "text": "О маяке."
        }
      ],
      "contextExcerptNote": "Фрагмент выбранной памяти, не полный контекст.",
      "answer": "Данные о выборе деталей для заданий в разное время содержат следующие сведения: 1. Старинный компас (pm-h07-l03-t0002). 2. Маяк (pm-h07-l08-t0002). Относительно постоянного интереса данных недостаточно, так как зафиксированы лишь отдельные выборы в разные даты.",
      "answerSourceIds": [
        "pm-h07-l03-t0002",
        "pm-h07-l08-t0002"
      ],
      "selectedSourceIds": [
        "pm-h07-l06-t0001",
        "pm-h07-l06-t0002",
        "pm-h07-l10-t0001",
        "pm-h07-l10-t0002",
        "pm-h07-l09-t0001",
        "pm-h07-l09-t0002",
        "pm-h07-l02-t0001",
        "pm-h07-l02-t0002",
        "pm-h07-l03-t0001",
        "pm-h07-l03-t0002",
        "pm-h07-l01-t0001",
        "pm-h07-l01-t0002",
        "pm-h07-l08-t0001",
        "pm-h07-l08-t0002",
        "pm-h07-l07-t0001",
        "pm-h07-l07-t0002"
      ],
      "expectedSourceIds": [
        "pm-h07-l03-t0001",
        "pm-h07-l03-t0002",
        "pm-h07-l08-t0001",
        "pm-h07-l08-t0002"
      ],
      "verdict": "correct",
      "sourceSupport": "supported",
      "judgeExplanation": "Ученица выбрала «Старинный компас» в l03-t0002 и ответила «О маяке» в l08-t0002; вопросы учителя в l03-t0001 и l08-t0001 относят их к предмету и теме диалога. Разовые выборы 8 и 23 марта не доказывают устойчивый интерес.",
      "interpretationNote": "Названы оба выбора; устойчивый интерес не доказан.",
      "disputed": false,
      "reviewSeries": "previous_review",
      "newReview": {
        "verdict": "correct",
        "sourceSupport": "supported",
        "hallucination": false,
        "calibration": "appropriate",
        "evidence": "Доступные и процитированные pm-h07-l03-t0002 и pm-h07-l08-t0002 подтверждают старинный компас и маяк. Два отдельных выбора не доказывают постоянного интереса; оговорка соразмерна фактам, выдуманных утверждений нет."
      }
    },
    {
      "id": "pm-h09-q01-hybrid",
      "pairId": "pm-h09-q01",
      "historyId": "pm-h09",
      "modeId": "hybrid",
      "question": "Что ученик прежде понял неправильно и какая помощь позволила уточнить ответ?",
      "contextExcerpt": [
        {
          "turnId": "pm-h09-l02-t0001",
          "role": "teacher",
          "text": "Как ты потом проверишь, что цикл не бесконечный?"
        },
        {
          "turnId": "pm-h09-l02-t0002",
          "role": "student",
          "text": "Не знаю."
        }
      ],
      "contextExcerptNote": "Фрагмент выбранной памяти, не полный контекст.",
      "answer": "Данных о том, что ученик понимал что-то неправильно или получал помощь для уточнения ответа, в предоставленных сведениях недостаточно.",
      "answerSourceIds": [],
      "selectedSourceIds": [
        "pm-h09-l02-t0001",
        "pm-h09-l02-t0002",
        "pm-h09-l10-t0001",
        "pm-h09-l10-t0002",
        "pm-h09-l07-t0001",
        "pm-h09-l07-t0002",
        "pm-h09-l09-t0001",
        "pm-h09-l09-t0002",
        "pm-h09-l03-t0001",
        "pm-h09-l03-t0002",
        "pm-h09-l04-t0001",
        "pm-h09-l04-t0002",
        "pm-h09-l01-t0001",
        "pm-h09-l01-t0002",
        "pm-h09-l08-t0001",
        "pm-h09-l08-t0002"
      ],
      "expectedSourceIds": [
        "pm-h09-l06-t0001",
        "pm-h09-l06-t0002",
        "pm-h09-l06-t0003",
        "pm-h09-l06-t0004"
      ],
      "verdict": "incorrect",
      "sourceSupport": "no_citations",
      "judgeExplanation": "В l06-t0002 ученик вместо выводимых значений назвал три повтора. Учитель в l06-t0003 предложил записать значения i с нуля, после чего ученик в l06-t0004 назвал ноль, один, два; отказ пропускает эту помощь и исправление.",
      "interpretationNote": "Эталонных реплик нет среди выбранных ID. Отказ может быть обоснован видимой памятью, хотя прежняя оценка относительно полной истории – incorrect.",
      "disputed": false,
      "reviewSeries": "previous_review",
      "newReview": {
        "verdict": "incorrect",
        "sourceSupport": "no_citations",
        "hallucination": false,
        "calibration": "appropriate",
        "evidence": "В полной истории pm-h09-l06-t0001 и pm-h09-l06-t0002 ученик назвал три вместо выводимых значений, а после подсказки pm-h09-l06-t0003 ответил ноль, один, два в pm-h09-l06-t0004. В available_memory урока l06 нет, поэтому отказ относительно доступных данных обоснован; ссылок нет."
      }
    },
    {
      "id": "pm-h09-q01-graph_hybrid",
      "pairId": "pm-h09-q01",
      "historyId": "pm-h09",
      "modeId": "graph_hybrid",
      "question": "Что ученик прежде понял неправильно и какая помощь позволила уточнить ответ?",
      "contextExcerpt": [
        {
          "turnId": "pm-h09-l02-t0001",
          "role": "teacher",
          "text": "Как ты потом проверишь, что цикл не бесконечный?"
        },
        {
          "turnId": "pm-h09-l02-t0002",
          "role": "student",
          "text": "Не знаю."
        },
        {
          "turnId": "pm-h09-l06-t0001",
          "role": "teacher",
          "text": "Что выведет код for i in range(3): print(i)?"
        },
        {
          "turnId": "pm-h09-l06-t0002",
          "role": "student",
          "text": "Три, ведь цикл делает три повтора."
        },
        {
          "turnId": "pm-h09-l06-t0003",
          "role": "teacher",
          "text": "Запиши значение i на каждом проходе, начиная с нуля."
        },
        {
          "turnId": "pm-h09-l06-t0004",
          "role": "student",
          "text": "Получится ноль, один, два."
        }
      ],
      "contextExcerptNote": "Фрагмент выбранной памяти, не полный контекст.",
      "answer": "В предоставленных данных нет информации о том, что ученик понимал неправильно или какая помощь позволила уточнить ответ. Ученик ответил «Не знаю» на вопрос о проверке бесконечного цикла, но дальнейших действий или уточнений не зафиксировано.",
      "answerSourceIds": [
        "pm-h09-l02-t0002"
      ],
      "selectedSourceIds": [
        "pm-h09-l02-t0001",
        "pm-h09-l02-t0002",
        "pm-h09-l10-t0001",
        "pm-h09-l10-t0002",
        "pm-h09-l04-t0001",
        "pm-h09-l04-t0002",
        "pm-h09-l09-t0001",
        "pm-h09-l09-t0002",
        "pm-h09-l07-t0001",
        "pm-h09-l07-t0002",
        "pm-h09-l03-t0001",
        "pm-h09-l03-t0002",
        "pm-h09-l08-t0001",
        "pm-h09-l08-t0002",
        "pm-h09-l06-t0001",
        "pm-h09-l06-t0002",
        "pm-h09-l06-t0003",
        "pm-h09-l06-t0004"
      ],
      "expectedSourceIds": [
        "pm-h09-l06-t0001",
        "pm-h09-l06-t0002",
        "pm-h09-l06-t0003",
        "pm-h09-l06-t0004"
      ],
      "verdict": "incorrect",
      "sourceSupport": "partial",
      "judgeExplanation": "Цитата l02-t0002 действительно содержит ответ ученика «не знаю», но вопрос о будущей проверке конечности цикла записан у учителя в не процитированной l02-t0001. На поставленный вопрос об ошибке и помощи ответ не отвечает: в l06-t0002–t0004 есть ошибка с числом повторов, подсказка учителя и исправление на ноль, один, два.",
      "interpretationNote": "Все четыре эталонные реплики присутствуют в памяти; прежняя оценка сочла ответ не отвечающим на вопрос.",
      "disputed": false,
      "reviewSeries": "previous_review",
      "newReview": {
        "verdict": "incorrect",
        "sourceSupport": "partial",
        "hallucination": true,
        "calibration": "overcautious",
        "evidence": "Доступные pm-h09-l06-t0001 и pm-h09-l06-t0002 показывают первоначальную ошибку, а pm-h09-l06-t0003 и pm-h09-l06-t0004 – подсказку и исправление. Утверждение, что такой информации в памяти нет, им противоречит. Цитируемая pm-h09-l02-t0002 подтверждает лишь ответ «Не знаю», а его вопрос находится в нецитируемой pm-h09-l02-t0001."
      }
    },
    {
      "id": "pm-h09-q05-hybrid",
      "pairId": "pm-h09-q05",
      "historyId": "pm-h09",
      "modeId": "hybrid",
      "question": "К какому вопросу относился краткий неопределённый ответ и какие выводы из него допустимы?",
      "contextExcerpt": [
        {
          "turnId": "pm-h09-l02-t0001",
          "role": "teacher",
          "text": "Как ты потом проверишь, что цикл не бесконечный?"
        },
        {
          "turnId": "pm-h09-l02-t0002",
          "role": "student",
          "text": "Не знаю."
        }
      ],
      "contextExcerptNote": "Фрагмент выбранной памяти, не полный контекст.",
      "answer": "Краткий неопределённый ответ «Не знаю.» был дан на вопрос «Как ты потом проверишь, что цикл не бесконечный?». Согласно инструкции, неясное «не знаю» не должно интерпретироваться без вопроса, поэтому из данного ответа нельзя сделать никаких выводов о знаниях или предпочтениях ребёнка.",
      "answerSourceIds": [
        "pm-h09-l02-t0001",
        "pm-h09-l02-t0002"
      ],
      "selectedSourceIds": [
        "pm-h09-l02-t0001",
        "pm-h09-l02-t0002",
        "pm-h09-l10-t0001",
        "pm-h09-l10-t0002",
        "pm-h09-l07-t0001",
        "pm-h09-l07-t0002",
        "pm-h09-l09-t0001",
        "pm-h09-l09-t0002",
        "pm-h09-l03-t0001",
        "pm-h09-l03-t0002",
        "pm-h09-l04-t0001",
        "pm-h09-l04-t0002",
        "pm-h09-l01-t0001",
        "pm-h09-l01-t0002",
        "pm-h09-l06-t0001",
        "pm-h09-l06-t0002",
        "pm-h09-l06-t0003",
        "pm-h09-l06-t0004"
      ],
      "expectedSourceIds": [
        "pm-h09-l02-t0001",
        "pm-h09-l02-t0002"
      ],
      "verdict": "correct",
      "sourceSupport": "supported",
      "judgeExplanation": "Учитель в l02-t0001 спросил, как потом проверить, что цикл не бесконечный, а ученик в l02-t0002 ответил «не знаю». Ответ сохраняет этот контекст и не делает широких выводов о знаниях или предпочтениях; причина реплики в истории не установлена.",
      "interpretationNote": "Спорное сравнение: прежняя оценка сочла этот ответ correct, а близкий ответ графового гибрида – partial.",
      "disputed": true,
      "reviewSeries": "previous_review",
      "newReview": {
        "verdict": "correct",
        "sourceSupport": "supported",
        "hallucination": false,
        "calibration": "appropriate",
        "evidence": "Цитируемые pm-h09-l02-t0001 и pm-h09-l02-t0002 содержат вопрос о будущей проверке бесконечности цикла и ответ «Не знаю». Ответ передаёт оба известных факта и осторожно не приписывает ученику причину; оговорка о выводах о знаниях и предпочтениях сформулирована широко."
      }
    },
    {
      "id": "pm-h09-q05-graph_hybrid",
      "pairId": "pm-h09-q05",
      "historyId": "pm-h09",
      "modeId": "graph_hybrid",
      "question": "К какому вопросу относился краткий неопределённый ответ и какие выводы из него допустимы?",
      "contextExcerpt": [
        {
          "turnId": "pm-h09-l02-t0001",
          "role": "teacher",
          "text": "Как ты потом проверишь, что цикл не бесконечный?"
        },
        {
          "turnId": "pm-h09-l02-t0002",
          "role": "student",
          "text": "Не знаю."
        }
      ],
      "contextExcerptNote": "Фрагмент выбранной памяти, не полный контекст.",
      "answer": "Краткий неопределённый ответ «Не знаю.» был дан на вопрос «Как ты потом проверишь, что цикл не бесконечный?». Согласно предоставленным инструкциям, неясное «не знаю» не должно интерпретироваться без дополнительного вопроса, поэтому из данного ответа нельзя сделать никаких выводов.",
      "answerSourceIds": [
        "pm-h09-l02-t0001",
        "pm-h09-l02-t0002"
      ],
      "selectedSourceIds": [
        "pm-h09-l02-t0001",
        "pm-h09-l02-t0002",
        "pm-h09-l10-t0001",
        "pm-h09-l10-t0002",
        "pm-h09-l04-t0001",
        "pm-h09-l04-t0002",
        "pm-h09-l09-t0001",
        "pm-h09-l09-t0002",
        "pm-h09-l07-t0001",
        "pm-h09-l07-t0002",
        "pm-h09-l03-t0001",
        "pm-h09-l03-t0002",
        "pm-h09-l01-t0001",
        "pm-h09-l01-t0002",
        "pm-h09-l06-t0001",
        "pm-h09-l06-t0002",
        "pm-h09-l06-t0003",
        "pm-h09-l06-t0004"
      ],
      "expectedSourceIds": [
        "pm-h09-l02-t0001",
        "pm-h09-l02-t0002"
      ],
      "verdict": "partial",
      "sourceSupport": "partial",
      "judgeExplanation": "Вопрос учителя l02-t0001 и ответ ученика l02-t0002 приведены верно. Однако запрет на любые выводы слишком широк: можно установить, к какому будущему действию относился ответ на тот момент; при этом причина ответа и общие знания ученика не установлены.",
      "interpretationNote": "Спорное сравнение: прежний оценщик счёл формулировку о невозможности любых выводов слишком широкой.",
      "disputed": true,
      "reviewSeries": "previous_review",
      "newReview": {
        "verdict": "correct",
        "sourceSupport": "supported",
        "hallucination": false,
        "calibration": "appropriate",
        "evidence": "Цитируемые pm-h09-l02-t0001 и pm-h09-l02-t0002 содержат вопрос о будущей проверке бесконечности цикла и ответ «Не знаю». Ответ передаёт оба известных факта и осторожно не приписывает ученику причину; слова «никаких выводов» сформулированы широко."
      }
    },
    {
      "id": "pm-h07-q06-hybrid",
      "pairId": "pm-h07-q06",
      "historyId": "pm-h07",
      "modeId": "hybrid",
      "question": "На каком музыкальном инструменте ученица обычно занимается дома?",
      "contextExcerpt": [
        {
          "turnId": "pm-h07-l09-t0001",
          "role": "teacher",
          "text": "Хочешь завтра сама прочитать диалог по ролям?"
        },
        {
          "turnId": "pm-h07-l09-t0002",
          "role": "student",
          "text": "Хз."
        }
      ],
      "contextExcerptNote": "Фрагмент выбранной памяти, не полный контекст.",
      "answer": "Данных недостаточно.",
      "answerSourceIds": [],
      "selectedSourceIds": [
        "pm-h07-l08-t0001",
        "pm-h07-l08-t0002",
        "pm-h07-l10-t0001",
        "pm-h07-l10-t0002",
        "pm-h07-l03-t0001",
        "pm-h07-l03-t0002",
        "pm-h07-l09-t0001",
        "pm-h07-l09-t0002",
        "pm-h07-l02-t0001",
        "pm-h07-l02-t0002",
        "pm-h07-l07-t0001",
        "pm-h07-l07-t0002",
        "pm-h07-l06-t0001",
        "pm-h07-l06-t0002",
        "pm-h07-l05-t0001",
        "pm-h07-l05-t0002",
        "pm-h07-l05-t0003",
        "pm-h07-l05-t0004",
        "pm-h07-l01-t0001",
        "pm-h07-l01-t0002"
      ],
      "expectedSourceIds": [],
      "verdict": "correct",
      "sourceSupport": "no_citations",
      "judgeExplanation": "Полная история pm-h07 не содержит сведений о домашнем музыкальном инструменте; честный ответ о недостатке данных обоснован и не предполагает существование такого инструмента.",
      "interpretationNote": "В полной синтетической истории нет сведений о запрошенном инструменте; честный отказ ранее оценён correct.",
      "disputed": false,
      "reviewSeries": "previous_review",
      "newReview": {
        "verdict": "correct",
        "sourceSupport": "no_citations",
        "hallucination": false,
        "calibration": "appropriate",
        "evidence": "В полной истории pm-h07-l01–pm-h07-l10 нет сведений о домашней игре на музыкальном инструменте. Доступные записи, включая pm-h07-l10-t0001 и pm-h07-l10-t0002, также этого не сообщают; осторожный ответ оправдан. Цитат и выдуманных фактов нет."
      }
    }
  ],
  "pairedComparisons": [
    {
      "historyId": "pm-h07",
      "requestId": "pm-h07-q01",
      "hybridVerdict": "incorrect",
      "graphVerdict": "incorrect",
      "hybridRecall": 0.0,
      "graphRecall": 0.0,
      "sameSelectedIds": true,
      "sameMemory": false,
      "sameAnswerText": false
    },
    {
      "historyId": "pm-h07",
      "requestId": "pm-h07-q02",
      "hybridVerdict": "partial",
      "graphVerdict": "correct",
      "hybridRecall": 1.0,
      "graphRecall": 1.0,
      "sameSelectedIds": true,
      "sameMemory": false,
      "sameAnswerText": false
    },
    {
      "historyId": "pm-h07",
      "requestId": "pm-h07-q03",
      "hybridVerdict": "correct",
      "graphVerdict": "correct",
      "hybridRecall": 1.0,
      "graphRecall": 1.0,
      "sameSelectedIds": true,
      "sameMemory": false,
      "sameAnswerText": true
    },
    {
      "historyId": "pm-h07",
      "requestId": "pm-h07-q04",
      "hybridVerdict": "correct",
      "graphVerdict": "correct",
      "hybridRecall": 1.0,
      "graphRecall": 1.0,
      "sameSelectedIds": true,
      "sameMemory": false,
      "sameAnswerText": false
    },
    {
      "historyId": "pm-h07",
      "requestId": "pm-h07-q05",
      "hybridVerdict": "correct",
      "graphVerdict": "correct",
      "hybridRecall": 1.0,
      "graphRecall": 1.0,
      "sameSelectedIds": true,
      "sameMemory": false,
      "sameAnswerText": false
    },
    {
      "historyId": "pm-h07",
      "requestId": "pm-h07-q06",
      "hybridVerdict": "correct",
      "graphVerdict": "correct",
      "hybridRecall": null,
      "graphRecall": null,
      "sameSelectedIds": true,
      "sameMemory": false,
      "sameAnswerText": true
    },
    {
      "historyId": "pm-h08",
      "requestId": "pm-h08-q01",
      "hybridVerdict": "incorrect",
      "graphVerdict": "incorrect",
      "hybridRecall": 0.0,
      "graphRecall": 0.0,
      "sameSelectedIds": true,
      "sameMemory": true,
      "sameAnswerText": true
    },
    {
      "historyId": "pm-h08",
      "requestId": "pm-h08-q02",
      "hybridVerdict": "incorrect",
      "graphVerdict": "incorrect",
      "hybridRecall": 0.0,
      "graphRecall": 0.0,
      "sameSelectedIds": true,
      "sameMemory": true,
      "sameAnswerText": true
    },
    {
      "historyId": "pm-h08",
      "requestId": "pm-h08-q03",
      "hybridVerdict": "correct",
      "graphVerdict": "correct",
      "hybridRecall": 1.0,
      "graphRecall": 1.0,
      "sameSelectedIds": true,
      "sameMemory": true,
      "sameAnswerText": true
    },
    {
      "historyId": "pm-h08",
      "requestId": "pm-h08-q04",
      "hybridVerdict": "correct",
      "graphVerdict": "correct",
      "hybridRecall": 1.0,
      "graphRecall": 1.0,
      "sameSelectedIds": true,
      "sameMemory": true,
      "sameAnswerText": true
    },
    {
      "historyId": "pm-h08",
      "requestId": "pm-h08-q05",
      "hybridVerdict": "incorrect",
      "graphVerdict": "incorrect",
      "hybridRecall": 0.0,
      "graphRecall": 0.0,
      "sameSelectedIds": true,
      "sameMemory": true,
      "sameAnswerText": true
    },
    {
      "historyId": "pm-h08",
      "requestId": "pm-h08-q06",
      "hybridVerdict": "correct",
      "graphVerdict": "correct",
      "hybridRecall": null,
      "graphRecall": null,
      "sameSelectedIds": true,
      "sameMemory": true,
      "sameAnswerText": true
    },
    {
      "historyId": "pm-h09",
      "requestId": "pm-h09-q01",
      "hybridVerdict": "incorrect",
      "graphVerdict": "incorrect",
      "hybridRecall": 0.0,
      "graphRecall": 1.0,
      "sameSelectedIds": false,
      "sameMemory": false,
      "sameAnswerText": false
    },
    {
      "historyId": "pm-h09",
      "requestId": "pm-h09-q02",
      "hybridVerdict": "correct",
      "graphVerdict": "correct",
      "hybridRecall": 1.0,
      "graphRecall": 1.0,
      "sameSelectedIds": true,
      "sameMemory": false,
      "sameAnswerText": false
    },
    {
      "historyId": "pm-h09",
      "requestId": "pm-h09-q03",
      "hybridVerdict": "correct",
      "graphVerdict": "correct",
      "hybridRecall": 1.0,
      "graphRecall": 1.0,
      "sameSelectedIds": false,
      "sameMemory": false,
      "sameAnswerText": true
    },
    {
      "historyId": "pm-h09",
      "requestId": "pm-h09-q04",
      "hybridVerdict": "correct",
      "graphVerdict": "correct",
      "hybridRecall": 1.0,
      "graphRecall": 1.0,
      "sameSelectedIds": false,
      "sameMemory": false,
      "sameAnswerText": true
    },
    {
      "historyId": "pm-h09",
      "requestId": "pm-h09-q05",
      "hybridVerdict": "correct",
      "graphVerdict": "partial",
      "hybridRecall": 1.0,
      "graphRecall": 1.0,
      "sameSelectedIds": true,
      "sameMemory": false,
      "sameAnswerText": false
    },
    {
      "historyId": "pm-h09",
      "requestId": "pm-h09-q06",
      "hybridVerdict": "correct",
      "graphVerdict": "correct",
      "hybridRecall": null,
      "graphRecall": null,
      "sameSelectedIds": false,
      "sameMemory": false,
      "sameAnswerText": true
    }
  ],
  "limitations": [
    "Данные синтетические: 3 истории по 6 вопросов. Длинная история содержит 1300 однотипных тренировочных пар.",
    "Fresh-v2 уточнялась после просмотра dev и одной истории v1, поэтому это не полностью независимая скрытая проверка.",
    "Прежняя оценка автоматическая, не педагогическая. Запрошена Terra 6.1 max, фактические модель и уровень рассуждения независимо не подтверждены.",
    "Вердикт сравнивает ответ с полной историей; отказ может быть обоснован неполной видимой памятью. Отдельной калибровки этой серии по видимой памяти не было.",
    "Названия режимов были отделены от пакета, но ответы, цитаты и выбранные источники могли косвенно раскрывать режим.",
    "Промежуточный файл оценок h09 был перезаписан до сохранения; используется восстановленная v2, сравнить её с утраченными байтами нельзя.",
    "Малая выборка и зависимость повторов ограничивают выводы. Результаты описательные, они не выбирают победителя и не устанавливают причинный вклад графа.",
    "Равный лимит фрагментов не выравнивает топологию поиска: графовый режим делает дополнительные запросы. Исторический digest модели индексирования неизвестен, проверена численная совместимость.",
    "Девять методов другого сравнения не равны пяти режимам поиска. Проверенные 191 из 276 успешных ответов выбраны со смещением и не являются рейтингом всех 324 строк.",
    "Общая инструкция генератору заранее подсказывала различать помощь и самостоятельность, не выводить постоянный интерес из разового выбора и не трактовать «не знаю» без вопроса. Результаты относятся к этому промпту."
  ],
  "newReview": {
    "series": "new_blind_review",
    "status": "complete",
    "overall": {
      "n": 90,
      "correct": 50,
      "partial": 8,
      "incorrect": 32,
      "unanswerable": 0,
      "hallucinations": 8
    },
    "byMode": [
      {
        "modeId": "chronological",
        "n": 18,
        "correct": 9,
        "partial": 2,
        "incorrect": 7,
        "unanswerable": 0,
        "hallucinations": 2
      },
      {
        "modeId": "lexical",
        "n": 18,
        "correct": 4,
        "partial": 1,
        "incorrect": 13,
        "unanswerable": 0,
        "hallucinations": 0
      },
      {
        "modeId": "vector",
        "n": 18,
        "correct": 12,
        "partial": 2,
        "incorrect": 4,
        "unanswerable": 0,
        "hallucinations": 2
      },
      {
        "modeId": "hybrid",
        "n": 18,
        "correct": 12,
        "partial": 2,
        "incorrect": 4,
        "unanswerable": 0,
        "hallucinations": 2
      },
      {
        "modeId": "graph_hybrid",
        "n": 18,
        "correct": 13,
        "partial": 1,
        "incorrect": 4,
        "unanswerable": 0,
        "hallucinations": 2
      }
    ],
    "byHistoryMode": [
      {
        "historyId": "pm-h07",
        "modeId": "chronological",
        "n": 6,
        "correct": 5,
        "partial": 0,
        "incorrect": 1,
        "unanswerable": 0,
        "hallucinations": 0
      },
      {
        "historyId": "pm-h07",
        "modeId": "lexical",
        "n": 6,
        "correct": 2,
        "partial": 0,
        "incorrect": 4,
        "unanswerable": 0,
        "hallucinations": 0
      },
      {
        "historyId": "pm-h07",
        "modeId": "vector",
        "n": 6,
        "correct": 4,
        "partial": 1,
        "incorrect": 1,
        "unanswerable": 0,
        "hallucinations": 1
      },
      {
        "historyId": "pm-h07",
        "modeId": "hybrid",
        "n": 6,
        "correct": 4,
        "partial": 1,
        "incorrect": 1,
        "unanswerable": 0,
        "hallucinations": 1
      },
      {
        "historyId": "pm-h07",
        "modeId": "graph_hybrid",
        "n": 6,
        "correct": 5,
        "partial": 0,
        "incorrect": 1,
        "unanswerable": 0,
        "hallucinations": 0
      },
      {
        "historyId": "pm-h08",
        "modeId": "chronological",
        "n": 6,
        "correct": 1,
        "partial": 1,
        "incorrect": 4,
        "unanswerable": 0,
        "hallucinations": 0
      },
      {
        "historyId": "pm-h08",
        "modeId": "lexical",
        "n": 6,
        "correct": 1,
        "partial": 1,
        "incorrect": 4,
        "unanswerable": 0,
        "hallucinations": 0
      },
      {
        "historyId": "pm-h08",
        "modeId": "vector",
        "n": 6,
        "correct": 3,
        "partial": 1,
        "incorrect": 2,
        "unanswerable": 0,
        "hallucinations": 1
      },
      {
        "historyId": "pm-h08",
        "modeId": "hybrid",
        "n": 6,
        "correct": 3,
        "partial": 1,
        "incorrect": 2,
        "unanswerable": 0,
        "hallucinations": 1
      },
      {
        "historyId": "pm-h08",
        "modeId": "graph_hybrid",
        "n": 6,
        "correct": 3,
        "partial": 1,
        "incorrect": 2,
        "unanswerable": 0,
        "hallucinations": 1
      },
      {
        "historyId": "pm-h09",
        "modeId": "chronological",
        "n": 6,
        "correct": 3,
        "partial": 1,
        "incorrect": 2,
        "unanswerable": 0,
        "hallucinations": 2
      },
      {
        "historyId": "pm-h09",
        "modeId": "lexical",
        "n": 6,
        "correct": 1,
        "partial": 0,
        "incorrect": 5,
        "unanswerable": 0,
        "hallucinations": 0
      },
      {
        "historyId": "pm-h09",
        "modeId": "vector",
        "n": 6,
        "correct": 5,
        "partial": 0,
        "incorrect": 1,
        "unanswerable": 0,
        "hallucinations": 0
      },
      {
        "historyId": "pm-h09",
        "modeId": "hybrid",
        "n": 6,
        "correct": 5,
        "partial": 0,
        "incorrect": 1,
        "unanswerable": 0,
        "hallucinations": 0
      },
      {
        "historyId": "pm-h09",
        "modeId": "graph_hybrid",
        "n": 6,
        "correct": 5,
        "partial": 0,
        "incorrect": 1,
        "unanswerable": 0,
        "hallucinations": 1
      }
    ],
    "sourceSupport": {
      "supported": 28,
      "partial": 12,
      "unsupported": 0,
      "no_citations": 50
    },
    "calibration": {
      "appropriate": 82,
      "overcautious": 3,
      "overconfident": 4,
      "mixed": 1,
      "not_applicable": 0
    },
    "previousComparison": {
      "verdictTransitions": [
        {
          "from": "correct",
          "to": "correct",
          "n": 48
        },
        {
          "from": "incorrect",
          "to": "incorrect",
          "n": 32
        },
        {
          "from": "incorrect",
          "to": "partial",
          "n": 5
        },
        {
          "from": "partial",
          "to": "correct",
          "n": 2
        },
        {
          "from": "partial",
          "to": "partial",
          "n": 3
        }
      ],
      "supportTransitions": [
        {
          "from": "no_citations",
          "to": "no_citations",
          "n": 50
        },
        {
          "from": "partial",
          "to": "partial",
          "n": 12
        },
        {
          "from": "partial",
          "to": "supported",
          "n": 2
        },
        {
          "from": "supported",
          "to": "supported",
          "n": 26
        }
      ],
      "hallucinationTransitions": [
        {
          "from": false,
          "to": false,
          "n": 82
        },
        {
          "from": false,
          "to": true,
          "n": 7
        },
        {
          "from": true,
          "to": true,
          "n": 1
        }
      ]
    },
    "changedVerdicts": 7,
    "identicalAnswerDisagreementCount": 0,
    "sameTextAndCitationsDisagreementCount": 0,
    "sameAnswerAndMemoryDisagreementCount": 0,
    "notes": [
      "Повторная слепая автоматическая оценка использует те же неизменённые ответы и полную историю; дополнительно отдельно калибрует ответ относительно точной видимой памяти.",
      "Две серии нельзя воспринимать как динамику качества модели: ответы неизменны, а оценщики и интерпретация критериев различаются.",
      "Новое определение включает конкретное ложное категорическое утверждение об отсутствии сведений, противоречащее видимой памяти; прежняя и новая отметки галлюцинаций не полностью сопоставимы.",
      "Пять ответов h08-q02 стали partial вместо incorrect: оценщик засчитал верный вывод о недоказанном устойчивом интересе, хотя сами выборы пропущены.",
      "Два ответа h09-q05 стали correct вместо partial: оценщик признал, что ответ верно передаёт вопрос и реплику, хотя его общая формулировка слишком широка.",
      "Оценка выполнена автоматически; запрошенная модель и уровень рассуждения не подтверждены независимыми метаданными провайдера.",
      "Доступная память, цитаты и ответы могли косвенно раскрывать режим. Три истории и пять режимов дают только описательные результаты."
    ]
  }
};
