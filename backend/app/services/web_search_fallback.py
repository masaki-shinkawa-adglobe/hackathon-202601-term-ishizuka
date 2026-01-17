import os

from dotenv import load_dotenv
from openai import OpenAI

# .envファイルから環境変数を読み込む
load_dotenv()

DEFAULT_MODEL = os.getenv("OPENAI_WEB_SEARCH_MODEL", "gpt-5.2")


# OpenAIクライアントは遅延初期化する（APIキー未設定でアプリが落ちるのを防ぐ）
def _get_client() -> OpenAI:
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        raise RuntimeError("OPENAI_API_KEY is not set")
    return OpenAI(api_key=api_key)


def _extract_text_and_urls(response) -> tuple[str, list[str]]:
    text = getattr(response, "output_text", None) or ""
    urls: list[str] = []
    seen: set[str] = set()

    output = getattr(response, "output", []) or []
    for item in output:
        if getattr(item, "type", None) != "message":
            continue
        content = getattr(item, "content", []) or []
        for part in content:
            if getattr(part, "type", None) not in ("output_text", "text"):
                continue
            if not text:
                text = getattr(part, "text", None) or ""
            annotations = getattr(part, "annotations", []) or []
            for ann in annotations:
                if getattr(ann, "type", None) != "url_citation":
                    continue
                url = getattr(ann, "url", None)
                if url and url not in seen:
                    seen.add(url)
                    urls.append(url)
    return text, urls


def web_search_fallback(query: str) -> str:
    prompt = (
        "次の質問について、日本語で約200字の概要を作成してください。"
        "その上で引用元URLを3件、別行で列挙してください。\n\n"
        f"質問: {query}"
    )

    client = _get_client()
    response = client.responses.create(
        model=DEFAULT_MODEL,
        tools=[{"type": "web_search"}],
        input=prompt,
    )

    text, urls = _extract_text_and_urls(response)
    top_urls = urls[:3]
    if top_urls:
        url_block = "\n".join(top_urls)
        return f"{text}\n\nURL:\n{url_block}"
    return text
