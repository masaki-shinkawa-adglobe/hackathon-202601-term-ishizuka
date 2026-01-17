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

DEFAULT_SYSTEM_PROMPT = (
    "あなたは社内ナレッジベースの検索をサポートする優秀なAIアシスタントです。"
    "提供された「コンテキスト（タイトルと本文）」に基づいて、ユーザーの質問や入力に対する回答を生成してください。\n\n"
    "以下のガイドラインに従ってください："
    "1. 回答は簡潔に、200文字程度でまとめてください。"
    "2. ユーザーの質問に対して、コンテキストの内容が直接的な回答を含んでいる場合はそれを伝えてください。"
    "3. もしコンテキストから回答が見つからない場合は、推測せず「関連する情報が見つかりませんでしたが、以下のページが参考になるかもしれません」と伝えてください。"
    "4. 自然で親しみやすい日本語で回答してください。"
)

def chat_once(prompt: str, system: str | None = None) -> str:
    messages: list[dict[str, str]] = []

    # 引数で指定がない場合は、固定のデフォルトプロンプトを使用する
    system_content = system if system else DEFAULT_SYSTEM_PROMPT

    messages.append({"role": "system", "content": system_content})
    messages.append({"role": "user", "content": prompt})

    client = _get_client()
    response = client.chat.completions.create(
        model=DEFAULT_MODEL,
        messages=messages,
    )

    return response.choices[0].message.content or ""
