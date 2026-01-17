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

def build_final_message(search_results, user_input):
    messages = []

    for item in search_results:
        title = item["title"]
        content = item["content"]
        url = item["url"]

        # AIに内容生成させる
        answer = generate_content_answer(title, content, user_input)

        # URLを追記
        message_with_url = f"""{answer}

参考URL:
{url}
"""

        messages.append(message_with_url)

    # 1メッセージにまとめる（空行1行あけ）
    final_message = "\n\n".join(messages)

    return final_message

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