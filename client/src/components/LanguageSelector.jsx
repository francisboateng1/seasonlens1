import {languages} from '../voice/languageConfig.js';
export default function LanguageSelector({value='en-US',onChange=()=>{}}){return <select aria-label="Language" value={value} onChange={e=>onChange(e.target.value)}>{languages.map(language=><option key={language.code} value={language.code}>{language.label}</option>)}</select>;}
