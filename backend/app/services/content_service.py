from app.services.openai_chat import chat_once

DEFAULT_SYSTEM_PROMPT = (
    "あなたは社内ナレッジベースの検索をサポートする優秀なAIアシスタントです。\n"
    "提供された「コンテキスト（タイトルと本文）」に基づいて、ユーザーの質問や入力に対する回答を生成してください。\n\n"
    "以下のガイドラインに従ってください：\n"
    "1. 回答は簡潔に、200文字程度でまとめてください。\n"
    "2. ユーザーの質問に対して、コンテキストの内容が直接的な回答を含んでいる場合はそれを伝えてください。\n"
    "3. もしコンテキストから回答が見つからない場合は、推測せず「関連する情報が見つかりませんでしたが、以下のページが参考になるかもしれません」と伝えてください。\n"
    "4. 自然で親しみやすい日本語で回答してください。"
)

def generate_content_answer(title: str, content: str, user_input: str) -> str:
    """
    ナレッジベースの情報に基づいた要約回答を生成する
    """
    prompt = (
        f"ユーザーの入力: {user_input}\n\n"
        f"--- コンテキスト ---\n"
        f"タイトル: {title}\n"
        f"本文: {content}"
    )

    return chat_once(prompt, system=DEFAULT_SYSTEM_PROMPT)
