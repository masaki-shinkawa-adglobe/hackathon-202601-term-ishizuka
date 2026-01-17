import os
import json
import logging
import numpy as np
import pandas as pd
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from openai import OpenAI

logging.basicConfig(level=logging.INFO)
app = FastAPI()

CSV_PATH = os.getenv("CSV_PATH", "/app/embeddings.csv")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
MODEL = "text-embedding-3-small"  # 安定・高速

client = OpenAI(api_key=OPENAI_API_KEY)

# 起動時にCSVをメモリに載せる
rows = []
embeddings_matrix = None


class TextRequest(BaseModel):
    text: str


@app.on_event("startup")
def startup():
    global rows, embeddings_matrix

    logging.info("startup: begin")

    # CSVが壊れていても起動を落とさないため、Pythonエンジンで不正行はスキップする
    df = pd.read_csv(
        CSV_PATH,
        dtype=str,
        keep_default_na=False,
        engine="python",
        on_bad_lines="skip",
    )
    logging.info(f"CSV loaded: rows={len(df)}")

    rows = []
    emb_list = []

    for idx, r in df.iterrows():
        raw = (r.get("embeddings") or r.get("embedding") or "").strip()

        # 空ならスキップ
        if raw == "":
            logging.warning(f"skip row={idx}: embeddings is empty title={r.get('title')}")
            continue

        # JSON配列じゃなさそうならスキップ
        if not raw.startswith("["):
            logging.warning(f"skip row={idx}: embeddings not json array title={r.get('title')} head={raw[:30]}")
            continue

        try:
            emb = np.array(json.loads(raw), dtype=np.float32)
            if emb.ndim != 1 or emb.size == 0:
                raise ValueError("embedding must be non-empty 1D array")
        except Exception as e:
            logging.warning(
                f"skip row={idx}: embeddings parse failed title={r.get('title')} head={raw[:60]} err={e}"
            )
            continue

        rows.append(
            {
                "title": r.get("title", ""),
                "content": r.get("content", ""),
                "url": r.get("url", ""),
            }
        )
        emb_list.append(emb)

    if not emb_list:
        raise RuntimeError("No valid embeddings found in CSV")

    E = np.vstack(emb_list).astype(np.float32)
    embeddings_matrix = E / (np.linalg.norm(E, axis=1, keepdims=True) + 1e-12)

    logging.info(f"valid rows loaded: {len(rows)} / {len(df)}")
    logging.info("startup: done")


@app.post("/api/text/")
def search(req: TextRequest):
    text = req.text.strip()
    if not text:
        raise HTTPException(status_code=400, detail="text is empty")

    # 1️⃣ OpenAIでembedding取得
    response = client.embeddings.create(
        model=MODEL,
        input=text,
    )
    q = np.array(response.data[0].embedding, dtype=np.float32)
    q = q / (np.linalg.norm(q) + 1e-12)

    # 2️⃣ cosine類似度
    scores = embeddings_matrix @ q

    # 3️⃣ 上位5件
    top_k = 5
    idx = np.argsort(-scores)[:top_k]

    results = []
    for i in idx:
        results.append({
            "title": rows[i]["title"],
            "content": rows[i]["content"],
            "url": rows[i]["url"],
            "score": float(scores[i]),
        })

    return {
        "query": text,
        "results": results,
    }
