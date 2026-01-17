export default defineBackground(() => {
  browser.action.onClicked.addListener(async () => {
    const [tab] = await browser.tabs.query({
      active: true,
      currentWindow: true,
    });
    if (!tab?.id) return;
    await browser.tabs.sendMessage(tab.id, { type: "TOGGLE_DOLPHIN_WIDGET" });
  });
});
