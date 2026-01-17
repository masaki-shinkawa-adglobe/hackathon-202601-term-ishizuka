const WIDGET_ID = "wxt-dolphin-widget";
const API_URL = "http://localhost:8000/api/text";
const USE_MOCK = false;
const MOCK_RESPONSE = "これはモック応答です。";

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
        background: #f6f2bf;
        border: 2px solid #2b2b2b;
        border-radius: 12px;
        padding: 12px 12px 10px;
        box-shadow: 0 6px 14px rgba(0, 0, 0, 0.2);
        position: relative;
        pointer-events: auto;
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
      }
      #${WIDGET_ID} .actions {
        display: flex;
        justify-content: flex-end;
        margin-top: 10px;
      }
      #${WIDGET_ID} .btn {
        padding: 6px 14px;
        border: 2px solid #bdb58f;
        border-radius: 6px;
        background: #f6f2bf;
        font-weight: bold;
        cursor: pointer;
      }
      #${WIDGET_ID} .result {
        max-height: 220px;
        overflow: auto;
        white-space: pre-wrap;
        line-height: 1.4;
        padding: 6px 4px 2px;
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
        <div class="actions">
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
  const inputBubble = container.querySelector<HTMLDivElement>(".bubble-input");
  const resultBubble =
    container.querySelector<HTMLDivElement>(".bubble-result");
  const resultText = container.querySelector<HTMLDivElement>(".result-text");

  const setInputMode = (enabled: boolean) => {
    if (!inputBubble || !resultBubble) return;
    inputBubble.classList.toggle("is-hidden", !enabled);
    resultBubble.classList.toggle("is-hidden", enabled);
  };

  const handleSearch = async () => {
    if (!textarea || !searchButton || !resultText) return;
    const text = textarea.value.trim();
    if (!text) return;

    searchButton.disabled = true;
    searchButton.textContent = "送信中...";
    try {
      if (USE_MOCK) {
        await new Promise((resolve) => setTimeout(resolve, 400));
        resultText.textContent = MOCK_RESPONSE;
      } else {
        const response = await fetch(API_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text }),
        });
        const data = (await response.json()) as { text?: string };
        resultText.textContent = data?.text ?? "";
      }
      setInputMode(false);
    } catch {
      resultText.textContent = "エラーが発生しました。";
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
    setInputMode(true);
  });

  return container;
};

const toggleWidget = () => {
  const existing = document.getElementById(WIDGET_ID);
  if (existing) {
    existing.remove();
    return;
  }
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
