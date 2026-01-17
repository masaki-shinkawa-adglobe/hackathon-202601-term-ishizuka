import './App.css';

function App() {
  const handleToggle = async () => {
    const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
    if (!tab?.id) return;
    await browser.tabs.sendMessage(tab.id, { type: 'TOGGLE_DOLPHIN_WIDGET' });
  };

  return (
    <div className="popup">
      <h1 className="title">Dolphin Assistant</h1>
      <p className="subtitle">Click to show or hide the mascot on the page.</p>
      <button className="primary" type="button" onClick={handleToggle}>
        Toggle Assistant
      </button>
      <p className="hint">If nothing shows, reload the page once.</p>
    </div>
  );
}

export default App;
