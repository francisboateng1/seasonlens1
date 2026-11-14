import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useVoiceAssistant } from '../hooks/useVoiceAssistant.js';
import { parseIntent } from '../voice/intentParser.js';
import { parseTwiCommand } from '../voice/twiCommands.js';
import { speak } from '../voice/speechSynthesis.js';
export default function VoiceAssistant() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [text, setText] = useState('');
  const [language, setLanguage] = useState('en-US');
  const assistant = useVoiceAssistant({ navigate, language });
  function submit(event) {
    event.preventDefault();
    const intent = language === 'tw-GH' ? parseTwiCommand(text) : parseIntent(text);
    if (intent.intent === 'navigate' || intent.type === 'navigate') {
      navigate(intent.route);
      assistant.setMessage(`Opening ${intent.route === '/' ? 'home' : intent.route.slice(1)}.`);
      if (language !== 'tw-GH') speak(`Opening ${intent.route === '/' ? 'home' : intent.route.slice(1)}.`, language);
      setText('');
    } else assistant.setMessage(language === 'tw-GH' ? 'No matching Twi text phrase. Speech recognition is not supported for Twi.' : 'Command not recognized. Try “open dashboard”, “open soil”, “open rotation”, or “open advisory”.');
  }
  return <>
    {open && <section className="voice-panel" aria-label="Optional voice assistant">
      <div className="voice-header"><div><span className="eyebrow">OPTIONAL ASSISTANT</span><h3>Voice and text commands</h3></div><button className="voice-close" onClick={() => { assistant.stop(); setOpen(false); }} aria-label="Close assistant">×</button></div>
      <label className="voice-label">Command language<select className="language-select" value={language} onChange={e => setLanguage(e.target.value)}><option value="en-US">English</option><option value="tw-GH">Twi text examples only</option></select></label>
      <p>English speech recognition depends on browser support. Twi speech recognition is not implemented or verified; a small Twi text dictionary is available as an experimental fallback.</p>
      <form onSubmit={submit}><input aria-label="Command" value={text} onChange={e => setText(e.target.value)} placeholder={language === 'tw-GH' ? 'Try: kɔ dashboard' : 'Try: open dashboard'} /><button type="submit">Send</button></form>
      {language !== 'tw-GH' && <button className="voice-listen" onClick={assistant.listening ? assistant.stop : assistant.start}>{assistant.listening ? 'Stop listening' : 'Start English voice recognition'}</button>}
      <div className="voice-response" role="status">{assistant.message}</div>
    </section>}
    <div className="voice-fab"><button onClick={() => setOpen(value => !value)} aria-label={open ? 'Close voice assistant' : 'Open voice assistant'} title="Voice and text commands">{open ? '×' : '◖'}</button></div>
  </>;
}
