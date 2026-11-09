"use strict";

// Shared by the browser and the index builder. Windows are fixed character
// ranges, not inferred topics; spans preserve links to original messages.
((scope) => {
  const RECIPE = "demo-fixed900-overlap120-long240-v1";
  const MODEL = "Xenova/multilingual-e5-small";
  const REVISION = "761b726dd34fb83930e26aab4e9ac3899aa1fa78";
  const SIZE = 900;
  const OVERLAP = 120;
  const LONG_OVERLAP = 240;
  const STOP = new Set(["что", "как", "когда", "какой", "какая", "какие", "какую", "был", "была", "было", "были", "это", "этот", "эта", "эти", "при", "про", "для", "или", "его", "её", "еще", "ещё", "она", "они", "его", "что-то", "ребенок", "ребёнок", "ученик", "ученица", "алена", "алёна", "занятии", "занятия", "вспомни", "расскажи"]);

  function tokens(text) {
    const words = String(text || "").normalize("NFC").toLocaleLowerCase("ru").match(/[\p{L}\p{N}]+/gu) || [];
    return [...new Set(words.filter(word => word.length >= 2 && !STOP.has(word)))];
  }

  function chunkHistory(history) {
    const chunks = [];
    for (const session of history.sessions) {
      let transcript = "";
      const segments = [];
      for (const turn of session.turns) {
        const prefix = (turn.role === "student" ? "Ребёнок: " : "Ассистент: ");
        transcript += prefix;
        const start = transcript.length;
        transcript += turn.text;
        segments.push({id: turn.id, start, end: transcript.length});
        transcript += "\n\n";
      }
      for (let start = 0; start < transcript.length;) {
        const end = Math.min(transcript.length, start + SIZE);
        const sourceIds = segments.filter(item => item.start < end && item.end > start).map(item => item.id);
        if (sourceIds.length) chunks.push({id:`${session.id}:${start}:${end}`, historyId:history.id, sessionId:session.id, date:session.date, start, end, text:transcript.slice(start,end), sourceIds});
        if (end === transcript.length) break;
        const paragraphStart = transcript.lastIndexOf("\n\n", end - 1) + 2;
        let paragraphEnd = transcript.indexOf("\n\n", end);
        if (paragraphEnd < 0) paragraphEnd = transcript.length;
        start = end - (paragraphEnd - paragraphStart > 2 * SIZE ? LONG_OVERLAP : OVERLAP);
      }
    }
    return chunks;
  }

  function scoreLexical(question, chunk) {
    const terms = tokens(question);
    const document = new Set(tokens(chunk.text));
    const matched = terms.filter(term => document.has(term));
    return {matched, score: terms.length ? matched.length / terms.length : 0};
  }

  function fingerprint(chunks) {
    let hash = 2166136261;
    const text = chunks.map(chunk => `${chunk.id}\u0000${chunk.text}`).join("\u0001");
    for (let i = 0; i < text.length; i++) hash = Math.imul(hash ^ text.charCodeAt(i), 16777619);
    return (hash >>> 0).toString(16).padStart(8, "0");
  }

  function cosine(left, right) {
    if (!Array.isArray(left) || !Array.isArray(right) || left.length !== right.length || !left.length) return null;
    let dot = 0, normLeft = 0, normRight = 0;
    for (let i = 0; i < left.length; i++) {
      if (!Number.isFinite(left[i]) || !Number.isFinite(right[i])) return null;
      dot += left[i] * right[i];
      normLeft += left[i] * left[i];
      normRight += right[i] * right[i];
    }
    return normLeft && normRight ? dot / Math.sqrt(normLeft * normRight) : null;
  }

  function rank({chunks, question, mode, queryVector, vectors, from, through, limit = 5}) {
    const eligible = chunks.filter(chunk => (!from || chunk.date >= from) && (!through || chunk.date <= through));
    const rows = eligible.map(chunk => {
      const lexical = scoreLexical(question, chunk);
      return {chunk, lexicalScore: lexical.score, matched: lexical.matched, semanticScore: mode === "lexical" ? null : cosine(queryVector, vectors?.[chunk.id])};
    });
    if (mode !== "lexical" && rows.some(row => row.semanticScore === null)) throw new Error("Векторный индекс отсутствует или несовместим с моделью.");
    const lexical = rows.filter(row => row.lexicalScore > 0).sort((a,b) => b.lexicalScore - a.lexicalScore || a.chunk.id.localeCompare(b.chunk.id));
    const semantic = rows.filter(row => row.semanticScore !== null).sort((a,b) => b.semanticScore - a.semanticScore || a.chunk.id.localeCompare(b.chunk.id));
    const lexRanks = new Map(lexical.map((row,index) => [row.chunk.id,index + 1]));
    const semRanks = new Map(semantic.map((row,index) => [row.chunk.id,index + 1]));
    if (mode === "lexical") return lexical.slice(0,limit);
    if (mode === "semantic") return semantic.slice(0,limit);
    if (mode !== "hybrid") throw new Error("Неизвестный режим поиска.");
    // Reciprocal-rank fusion makes channel contributions explicit without
    // pretending a similarity score is a probability or an Alёna result.
    return rows.map(row => ({...row, lexicalRank:lexRanks.get(row.chunk.id) || null, semanticRank:semRanks.get(row.chunk.id) || null,
      fusionScore:(lexRanks.has(row.chunk.id) ? 1 / (60 + lexRanks.get(row.chunk.id)) : 0) + (semRanks.has(row.chunk.id) ? 1 / (60 + semRanks.get(row.chunk.id)) : 0)}))
      .sort((a,b) => b.fusionScore - a.fusionScore || a.chunk.id.localeCompare(b.chunk.id)).slice(0,limit);
  }

  scope.MemoryLabCore = {RECIPE, MODEL, REVISION, tokens, chunkHistory, fingerprint, scoreLexical, cosine, rank};
})(typeof window !== "undefined" ? window : globalThis);
