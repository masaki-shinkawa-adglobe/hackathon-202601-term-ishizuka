import os
import logging
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

from app.services.data_loader import load_embeddings
from app.services.embedding_search import embed_text, search_similar, build_final_message

logging.basicConfig(level=logging.INFO)
app = FastAPI()

CSV_PATH = os.getenv("CSV_PATH", "/app/embeddings.csv")
MODEL = "text-embedding-3-small"  # 安定・高速
TOP_K = 5
MIN_SCORE = 0.3

# 起動時にCSVをメモリに載せる
rows = []
embeddings_matrix = None


class TextRequest(BaseModel):
    text: str


@app.on_event("startup")
def startup():
    global rows, embeddings_matrix
    rows, embeddings_matrix = load_embeddings(CSV_PATH)


@app.post("/api/text")
def search(req: TextRequest):
    text = req.text.strip()
    if not text:
        raise HTTPException(status_code=400, detail="text is empty")

    q = embed_text(text, MODEL)
    results = search_similar(
        q,
        embeddings_matrix,
        rows,
        top_k=TOP_K,
        min_score=MIN_SCORE,
    )

    message = build_final_message(results, text)


    return {
        "text": message,
        "results": results,
    }
