const WIDGET_ID = "wxt-dolphin-widget";
const API_URL = "http://localhost:8000/api/text";
const USE_MOCK = false;
const MOCK_RESPONSE: SearchResponse = {
  text: "勤怠については下記のような情報がありました！業務内容や勤怠ルールは部署によって若干異なる場合がありますので、社内ポータルの最新情報もあわせて確認してください。\n\n1. 勤怠システムへのログイン手順\n- 会社ポータルからアクセス\n- 社員IDとパスワードを入力\n\n2. 休暇申請の流れ\n- 休暇種別を選択\n- 期間と理由を記入\n- 上長へ送信\n\n3. 参考リンク\nhttps://www.google.com",
  results: [
    {
      title: "勤怠ポリシー",
      content: "全社共通の勤怠ポリシー概要です。",
      url: "https://example.com/policy",
      score: 0.62,
    },
  ],
};
const ERASE_KEYWORDS = [
  "お前を消す方法",
  "おまえをけす方法",
  "お前をけす方法",
  "おまえを消す方法",
];
const ERASE_ANIMATIONS = [
  "erase-fade",
  "erase-shrink",
  "erase-spiral",
  "erase-pop",
  "erase-slide",
  "erase-flip",
];

type SearchResult = {
  title: string;
  content: string;
  url: string;
  score: number;
};

type SearchResponse = {
  text?: string;
  results?: SearchResult[];
};

const createWidget = () => {
  const container = document.createElement("div");
  container.id = WIDGET_ID;
  container.innerHTML = `
    <style>
      #${WIDGET_ID} {
        position: fixed;
        right: 24px;
        bottom: 24px;
        z-index: 2147483647;
        user-select: none;
        background: transparent;
        font-family: "Trebuchet MS", "Verdana", "Arial", sans-serif;
        color: #222;
      }
      #${WIDGET_ID} .bubble {
        width: 280px;
        max-width: 600px;
        min-width: 360px;
        background: #f6f2bf;
        border: 2px solid #2b2b2b;
        border-radius: 12px;
        padding: 12px 12px 10px;
        box-shadow: 0 6px 14px rgba(0, 0, 0, 0.2);
        position: relative;
        pointer-events: auto;
        color: #222;
      }
      #${WIDGET_ID} .bubble.is-hidden {
        display: none;
      }
      #${WIDGET_ID} .bubble::after {
        content: "";
        position: absolute;
        left: 70%;
        bottom: -12px;
        width: 18px;
        height: 18px;
        background: #f6f2bf;
        border-right: 2px solid #2b2b2b;
        border-bottom: 2px solid #2b2b2b;
        transform: rotate(45deg);
      }
      #${WIDGET_ID} .title {
        font-weight: bold;
        margin-bottom: 8px;
      }
      #${WIDGET_ID} .input {
        width: 100%;
        padding: 8px 10px;
        border: 2px solid #bdb58f;
        border-radius: 6px;
        background: #fff;
        font-size: 14px;
        box-sizing: border-box;
        resize: none;
        min-height: 56px;
        color: #222;
      }
      #${WIDGET_ID} .actions {
        display: flex;
        justify-content: flex-end;
        margin-top: 10px;
      }
      #${WIDGET_ID} .actions.actions-result {
        gap: 16px;
      }
      #${WIDGET_ID} .btn {
        padding: 6px 14px;
        border: 2px solid #bdb58f;
        border-radius: 6px;
        background: #f6f2bf;
        font-weight: bold;
        cursor: pointer;
        color: #222;
      }
      #${WIDGET_ID} .result {
        max-height: 240px;
        min-height: 120px;
        overflow-y: auto;
        white-space: pre-wrap;
        line-height: 1.4;
        padding: 6px 4px 2px;
        color: #222;
      }
      #${WIDGET_ID} .result > a{
        word-wrap: break-word;
      }
      #${WIDGET_ID} .stack {
        display: flex;
        flex-direction: column;
        align-items: flex-end;
        gap: 8px;
      }
      #${WIDGET_ID} .iruka {
        width: 180px;
        height: auto;
        display: block;
        background: transparent;
        filter: drop-shadow(0 6px 12px rgba(0, 0, 0, 0.25));
      }
      #${WIDGET_ID} .iruka.is-erasing {
        pointer-events: none;
      }
      #${WIDGET_ID} .iruka.erase-fade {
        animation: iruka-fade 0.7s ease-out forwards;
      }
      #${WIDGET_ID} .iruka.erase-shrink {
        animation: iruka-shrink 0.7s ease-in forwards;
      }
      #${WIDGET_ID} .iruka.erase-spiral {
        animation: iruka-spiral 0.9s ease-in forwards;
      }
      #${WIDGET_ID} .iruka.erase-pop {
        animation: iruka-pop 0.6s ease-out forwards;
      }
      #${WIDGET_ID} .iruka.erase-slide {
        animation: iruka-slide 0.8s ease-in forwards;
      }
      #${WIDGET_ID} .iruka.erase-flip {
        animation: iruka-flip 0.7s ease-in forwards;
      }
      @keyframes iruka-fade {
        to {
          opacity: 0;
          transform: translateY(10px);
        }
      }
      @keyframes iruka-shrink {
        to {
          opacity: 0;
          transform: scale(0.1);
        }
      }
      @keyframes iruka-spiral {
        to {
          opacity: 0;
          transform: translate(40px, 30px) rotate(540deg) scale(0.1);
        }
      }
      @keyframes iruka-pop {
        40% {
          transform: scale(1.15);
        }
        to {
          opacity: 0;
          transform: scale(0.2);
        }
      }
      @keyframes iruka-slide {
        to {
          opacity: 0;
          transform: translateX(120px);
        }
      }
      @keyframes iruka-flip {
        to {
          opacity: 0;
          transform: rotateY(180deg) scale(0.2);
        }
      }
    </style>
    <div class="stack">
      <div class="bubble bubble-input">
        <div class="title">何について調べますか？</div>
        <textarea class="input" rows="3"></textarea>
        <div class="actions">
          <button class="btn btn-search" type="button">検索</button>
        </div>
      </div>
      <div class="bubble bubble-result is-hidden">
        <div class="title">結果</div>
        <div class="result result-text"></div>
        <div class="actions actions-result">
          <button class="btn btn-speak" type="button">読み上げ</button>
          <button class="btn btn-ok" type="button">OK</button>
        </div>
      </div>
      <img class="iruka" src="${browser.runtime.getURL("iruka.webp")}" alt="イルカ" />
    </div>
  `;
  const textarea = container.querySelector<HTMLTextAreaElement>(".input");
  const searchButton =
    container.querySelector<HTMLButtonElement>(".btn-search");
  const okButton = container.querySelector<HTMLButtonElement>(".btn-ok");
  const speakButton = container.querySelector<HTMLButtonElement>(".btn-speak");
  const inputBubble = container.querySelector<HTMLDivElement>(".bubble-input");
  const resultBubble =
    container.querySelector<HTMLDivElement>(".bubble-result");
  const resultText = container.querySelector<HTMLDivElement>(".result-text");
  const irukaImage = container.querySelector<HTMLImageElement>(".iruka");
  let latestResponse: SearchResponse | null = null;
  let latestResultText = "";
  let isDebugView = false;

  const debugButton = createDebugButton(() => {
    if (!resultText) return;
    stopSpeech();
    if (!isDebugView) {
      const results = latestResponse?.results ?? [];
      setResultText(resultText, formatDebugResults(results));
      isDebugView = true;
      debugButton.textContent = "戻る";
      return;
    }
    setResultText(resultText, latestResultText || "結果がありません。");
    isDebugView = false;
    debugButton.textContent = "デバッグ";
  });
  if (speakButton?.parentElement) {
    speakButton.parentElement.insertBefore(debugButton, speakButton);
  }

  const setInputMode = (enabled: boolean) => {
    if (!inputBubble || !resultBubble) return;
    inputBubble.classList.toggle("is-hidden", !enabled);
    resultBubble.classList.toggle("is-hidden", enabled);
  };

  const handleSearch = async () => {
    if (!textarea || !searchButton || !resultText) return;
    const text = textarea.value.trim();
    if (!text) return;

    if (shouldEraseIruka(text)) {
      hideBubbles();
      eraseIruka(irukaImage);
      return;
    }

    searchButton.disabled = true;
    searchButton.textContent = "送信中...";
    try {
      if (USE_MOCK) {
        await new Promise((resolve) => setTimeout(resolve, 400));
        latestResponse = MOCK_RESPONSE;
        latestResultText = latestResponse.text ?? "";
        setResultText(resultText, latestResultText);
      } else {
        const response = await fetch(API_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text }),
        });
        const data = (await response.json()) as SearchResponse;
        latestResponse = data;
        latestResultText = data?.text ?? "";
        setResultText(resultText, latestResultText);
      }
      isDebugView = false;
      debugButton.textContent = "デバッグ";
      setInputMode(false);
    } catch {
      setResultText(resultText, "エラーが発生しました。");
      setInputMode(false);
    } finally {
      searchButton.disabled = false;
      searchButton.textContent = "検索";
    }
  };

  searchButton?.addEventListener("click", () => {
    void handleSearch();
  });

  okButton?.addEventListener("click", () => {
    if (textarea) textarea.value = "";
    stopSpeech();
    setInputMode(true);
  });

  speakButton?.addEventListener("click", () => {
    if (!resultText) return;
    speakText(resultText.textContent ?? "");
  });

  return container;
};

const shouldEraseIruka = (text: string) => {
  return ERASE_KEYWORDS.some((keyword) => text.includes(keyword));
};

const setResultText = (target: HTMLDivElement, text: string) => {
  target.innerHTML = linkifyText(text);
};

const formatDebugResults = (results: SearchResult[]) => {
  if (!results.length) return "resultsが空です。";
  return results
    .map((item, index) => {
      const title = item.title
        ? `#${index + 1} ${item.title}`
        : `#${index + 1}`;
      return [
        title,
        `score: ${item.score}`,
        `url: ${item.url}`,
        "content:",
        item.content ?? "",
      ].join("\n");
    })
    .join("\n\n---\n\n");
};

const createDebugButton = (onClick: () => void) => {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "btn btn-debug";
  button.textContent = "デバッグ";
  button.addEventListener("click", onClick);
  return button;
};

const linkifyText = (text: string) => {
  const urlRegex = /https?:\/\/[^\s]+/g;
  const parts: string[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = urlRegex.exec(text)) !== null) {
    const url = match[0];
    const start = match.index;
    const end = start + url.length;

    const before = text.slice(lastIndex, start);
    parts.push(escapeHtml(before));

    const safeUrl = escapeHtml(url);
    parts.push(
      `<a href="${safeUrl}" target="_blank" rel="noopener noreferrer">${safeUrl}</a>`,
    );

    lastIndex = end;
  }

  parts.push(escapeHtml(text.slice(lastIndex)));

  return parts.join("").replaceAll("\n", "<br>");
};

const escapeHtml = (value: string) => {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
};

const speakText = (text: string) => {
  if (!("speechSynthesis" in window)) return;
  const cleaned = stripUrls(text).trim();
  if (!cleaned) return;
  stopSpeech();
  const utterance = new SpeechSynthesisUtterance(cleaned);
  utterance.lang = "ja-JP";
  window.speechSynthesis.speak(utterance);
};

const stopSpeech = () => {
  if (!("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
};

const stripUrls = (text: string) => {
  return text.replace(/https?:\/\/[^\s]+/g, "");
};

const eraseIruka = (image: HTMLImageElement | null) => {
  if (!image || image.classList.contains("is-erasing")) return;
  image.classList.add("is-erasing");
  const animation =
    ERASE_ANIMATIONS[Math.floor(Math.random() * ERASE_ANIMATIONS.length)];
  if (animation) image.classList.add(animation);
  image.addEventListener(
    "animationend",
    () => {
      removeWidget();
    },
    { once: true },
  );
};

const removeWidget = () => {
  const existing = document.getElementById(WIDGET_ID);
  if (existing) existing.remove();
};

const hideBubbles = () => {
  const widget = document.getElementById(WIDGET_ID);
  if (!widget) return;
  widget.querySelectorAll(".bubble").forEach((bubble) => {
    bubble.classList.add("is-hidden");
  });
};

const toggleWidget = () => {
  const existing = document.getElementById(WIDGET_ID);
  if (existing) return;
  document.documentElement.appendChild(createWidget());
};

export default defineContentScript({
  matches: ["<all_urls>"],
  main() {
    browser.runtime.onMessage.addListener((message) => {
      if (message?.type === "TOGGLE_DOLPHIN_WIDGET") {
        toggleWidget();
      }
    });
  },
});
