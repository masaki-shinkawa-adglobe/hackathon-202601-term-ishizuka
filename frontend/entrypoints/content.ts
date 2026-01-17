const WIDGET_ID = 'wxt-dolphin-widget';

const createWidget = () => {
  const container = document.createElement('div');
  container.id = WIDGET_ID;
  container.innerHTML = `
    <style>
      #${WIDGET_ID} {
        position: fixed;
        right: 24px;
        bottom: 24px;
        z-index: 2147483647;
        font-family: "Trebuchet MS", "Verdana", "Arial", sans-serif;
        color: #111;
        user-select: none;
      }
      #${WIDGET_ID} .bubble {
        background: #f7f1c8;
        border: 2px solid #111;
        border-radius: 12px;
        padding: 12px 14px;
        width: 240px;
        box-shadow: 0 4px 10px rgba(0,0,0,0.2);
        position: relative;
      }
      #${WIDGET_ID} .bubble::after {
        content: "";
        position: absolute;
        right: 24px;
        bottom: -10px;
        width: 18px;
        height: 18px;
        background: #f7f1c8;
        border-right: 2px solid #111;
        border-bottom: 2px solid #111;
        transform: rotate(45deg);
      }
      #${WIDGET_ID} .title {
        font-weight: bold;
        margin-bottom: 6px;
      }
      #${WIDGET_ID} .input {
        margin: 8px 0;
        padding: 6px 8px;
        border: 2px solid #111;
        border-radius: 6px;
        background: #fff;
      }
      #${WIDGET_ID} .actions {
        display: flex;
        gap: 8px;
      }
      #${WIDGET_ID} .btn {
        flex: 1;
        padding: 6px 8px;
        border: 2px solid #111;
        border-radius: 6px;
        background: #eee;
        font-weight: bold;
        cursor: pointer;
      }
      #${WIDGET_ID} .dolphin {
        width: 120px;
        height: 80px;
        margin-top: 6px;
        background: #2e7edb;
        border: 2px solid #111;
        border-radius: 60px 60px 40px 40px;
        position: relative;
      }
      #${WIDGET_ID} .dolphin::before {
        content: "";
        position: absolute;
        right: 16px;
        top: 18px;
        width: 10px;
        height: 10px;
        background: #111;
        border-radius: 50%;
      }
      #${WIDGET_ID} .dolphin::after {
        content: "";
        position: absolute;
        left: -10px;
        top: 30px;
        width: 22px;
        height: 20px;
        background: #2e7edb;
        border: 2px solid #111;
        border-right: none;
        border-radius: 10px 0 0 10px;
      }
    </style>
    <div class="bubble">
      <div class="title">What are you looking for?</div>
      <div class="input">Type here...</div>
      <div class="actions">
        <button class="btn" type="button">Options</button>
        <button class="btn" type="button">Search</button>
      </div>
    </div>
    <div class="dolphin" aria-hidden="true"></div>
  `;
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
  matches: ['<all_urls>'],
  main() {
    browser.runtime.onMessage.addListener((message) => {
      if (message?.type === 'TOGGLE_DOLPHIN_WIDGET') {
        toggleWidget();
      }
    });
  },
});
