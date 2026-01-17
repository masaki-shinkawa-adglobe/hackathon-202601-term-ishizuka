import os

import numpy as np
from openai import OpenAI


def _get_client() -> OpenAI:
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        raise RuntimeError("OPENAI_API_KEY is not set")
    return OpenAI(api_key=api_key)


def embed_text(text: str, model: str) -> np.ndarray:
    client = _get_client()
    response = client.embeddings.create(
        model=model,
        input=text,
    )
    q = np.array(response.data[0].embedding, dtype=np.float32)
    return q / (np.linalg.norm(q) + 1e-12)


def search_similar(
    q: np.ndarray,
    embeddings_matrix: np.ndarray,
    rows: list[dict[str, str]],
    top_k: int = 5,
    min_score: float = 0.3,
) -> list[dict[str, str | float]]:
    scores = embeddings_matrix @ q
    idx = np.argsort(-scores)[:top_k]

    results: list[dict[str, str | float]] = []
    for i in idx:
        score = float(scores[i])
        if score < min_score:
            continue
        results.append(
            {
                "title": rows[i]["title"],
                "content": rows[i]["content"],
                "url": rows[i]["url"],
                "score": score,
            }
        )

    return results
