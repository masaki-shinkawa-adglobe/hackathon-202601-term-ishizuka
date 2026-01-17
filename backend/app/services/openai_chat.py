import os

from dotenv import load_dotenv
from openai import OpenAI

# .envファイルから環境変数を読み込む
load_dotenv()

# OpenAIクライアントは遅延初期化する（APIキー未設定でアプリが落ちるのを防ぐ）
def _get_client() -> OpenAI:
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        raise RuntimeError("OPENAI_API_KEY is not set")
    return OpenAI(api_key=api_key)

DEFAULT_MODEL = os.getenv("OPENAI_CHAT_MODEL", "gpt-4o-mini")

def chat_once(prompt: str, system: str | None = None) -> str:
    messages: list[dict[str, str]] = []

    if system:
        messages.append({"role": "system", "content": system})
    messages.append({"role": "user", "content": prompt})

    client = _get_client()
    response = client.chat.completions.create(
        model=DEFAULT_MODEL,
        messages=messages,
    )

    return response.choices[0].message.content or ""
