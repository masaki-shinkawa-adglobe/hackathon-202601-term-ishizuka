import os
import pandas as pd
from openai import OpenAI
from dotenv import load_dotenv

# .envファイルから環境変数を読み込む
load_dotenv()

# OpenAIクライアントの初期化
# 環境変数 OPENAI_API_KEY が設定されている必要があります
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

CSV_FILE = "embeddings.csv"
SOURCE_CSV = "source_data.csv"

def save_to_csv(title, url, content, embedding):
    """
    タイトル、URL、本文、エンベディングをCSVファイルに保存する
    """
    data = {
        "title": [title],
        "url": [url],
        "content": [content],
        "embedding": [str(embedding)]
    }
    df_new = pd.DataFrame(data)

    if os.path.exists(CSV_FILE):
        df_old = pd.read_csv(CSV_FILE)
        df = pd.concat([df_old, df_new], ignore_index=True)
    else:
        df = df_new

    df.to_csv(CSV_FILE, index=False)
    print(f"データを {CSV_FILE} に保存しました。")

def get_embedding(text, model="text-embedding-3-small"):
    """
    指定されたテキストの埋め込みベクトルを取得する
    """
    # 改行をスペースに置換（推奨される前処理）
    text = text.replace("\n", " ")

    # APIリクエスト
    response = client.embeddings.create(
        input=[text],
        model=model
    )

    # レスポンスからベクトルを抽出
    return response.data[0].embedding

if __name__ == "__main__":
    # ソースデータをCSVから読み込む
    if not os.path.exists(SOURCE_CSV):
        print(f"エラー: {SOURCE_CSV} が見つかりません。")
        exit(1)

    df_source = pd.read_csv(SOURCE_CSV)

    for _, row in df_source.iterrows():
        title = row["title"]
        url = row["url"]
        content = row["content"] if pd.notna(row["content"]) else ""

        # タイトルと本文を組み合わせてベクトル化（,区切り）
        text_to_embed = f"{title}, {content}"

        try:
            # 埋め込みベクトルの取得
            embedding = get_embedding(text_to_embed)

            print(f"処理中: {title}")
            print(f"URL: {url}")
            print(f"ベクトルの次元数: {len(embedding)}")
            print(f"ベクトルの先頭5要素: {embedding[:5]}...")

            # CSV（DB代わり）に保存
            save_to_csv(title, url, content, embedding)

        except Exception as e:
            print(f"エラーが発生しました ({title}): {e}")

    # 保存された内容を表示してみる
    if os.path.exists(CSV_FILE):
        print("\n--- 現在の保存データ ---")
        print(pd.read_csv(CSV_FILE))
