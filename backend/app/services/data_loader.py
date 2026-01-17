import json
import logging

import numpy as np
import pandas as pd


def load_embeddings(csv_path: str) -> tuple[list[dict[str, str]], np.ndarray]:
    logging.info("startup: begin")

    # CSVが壊れていても起動を落とさないため、Pythonエンジンで不正行はスキップする
    df = pd.read_csv(
        csv_path,
        dtype=str,
        keep_default_na=False,
        engine="python",
        on_bad_lines="skip",
    )
    logging.info(f"CSV loaded: rows={len(df)}")

    rows: list[dict[str, str]] = []
    emb_list: list[np.ndarray] = []

    for idx, r in df.iterrows():
        raw = (r.get("embeddings") or r.get("embedding") or "").strip()

        # 空ならスキップ
        if raw == "":
            logging.warning(f"skip row={idx}: embeddings is empty title={r.get('title')}")
            continue

        # JSON配列じゃなさそうならスキップ
        if not raw.startswith("["):
            logging.warning(
                f"skip row={idx}: embeddings not json array title={r.get('title')} head={raw[:30]}"
            )
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

    return rows, embeddings_matrix
