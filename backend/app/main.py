import os
import logging
from fastapi import FastAPI, HTTPException, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel

from app.services.data_loader import load_embeddings
from app.services.embedding_search import (
    embed_text,
    search_similar,
    build_final_message,
)

logging.basicConfig(level=logging.INFO)
app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=r"chrome-extension://.*",
    allow_origins=["null"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def allow_options(request: Request, call_next):
    if request.method == "OPTIONS":
        response = Response(status_code=200)
        response.headers["Access-Control-Allow-Origin"] = "*"
        response.headers["Access-Control-Allow-Methods"] = "POST, OPTIONS"
        response.headers["Access-Control-Allow-Headers"] = "*"
        return response
    return await call_next(request)


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
    print("[search] start")
    text = req.text.strip()
    print(f"[search] input length={len(text)}")
    if not text:
        print("[search] empty text -> 400")
        raise HTTPException(status_code=400, detail="text is empty")

    print("[search] embed_text")
    q = embed_text(text, MODEL)
    print("[search] search_similar")
    results = search_similar(
        q,
        embeddings_matrix,
        rows,
        top_k=TOP_K,
        min_score=MIN_SCORE,
    )
    print(f"[search] results count={len(results)}")

    if len(results) == 0:
        print("[search] no results -> empty response")
        return JSONResponse(
            content={
                "text": "結果が見つかりませんでした。",
                "results": [],
            },
            headers={
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "POST, OPTIONS",
                "Access-Control-Allow-Headers": "*",
            },
        )

    print("[search] build_final_message")
    message = build_final_message(results, text)
    print(f"[search] message length={len(message)}")

    print("[search] response ready")
    return JSONResponse(
        content={
            "text": message,
            "results": results,
        },
        headers={
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "POST, OPTIONS",
            "Access-Control-Allow-Headers": "*",
        },
    )
