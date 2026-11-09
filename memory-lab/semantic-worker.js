import {pipeline, env} from "https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.8.1/dist/transformers.min.js";

const MODEL = "Xenova/multilingual-e5-small";
const REVISION = "761b726dd34fb83930e26aab4e9ac3899aa1fa78";
env.backends.onnx.wasm.numThreads = 1;
let modelPromise;

function model() {
  if (!modelPromise) {
    modelPromise = pipeline("feature-extraction", MODEL, {
      revision:REVISION,
      dtype:"q8",
      progress_callback: event => {
        if (event.status === "progress" && Number.isFinite(event.progress)) {
          self.postMessage({type:"progress", file:event.file || "файл модели", progress:Math.round(event.progress)});
        } else if (event.status === "ready") {
          self.postMessage({type:"ready"});
        }
      }
    }).catch(error => { modelPromise = null; throw error; });
  }
  return modelPromise;
}

self.addEventListener("message", async event => {
  const {id, question} = event.data || {};
  if (!id || typeof question !== "string" || !question.trim()) return;
  try {
    const extractor = await model();
    self.postMessage({type:"calculating", id});
    const result = await extractor(`query: ${question}`, {pooling:"mean", normalize:true});
    const vector = result.tolist()?.[0];
    if (!Array.isArray(vector) || vector.length !== 384 || vector.some(value => !Number.isFinite(value))) throw new Error("Некорректный вектор запроса");
    self.postMessage({type:"result", id, vector});
  } catch (error) {
    self.postMessage({type:"error", id, message:String(error?.message || error)});
  }
});
