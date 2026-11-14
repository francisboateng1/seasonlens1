# Optional voice interface

Voice is an optional convenience. All core workflows remain available through keyboard, pointer and touch input.

## Supported behavior

- Browser text input accepts supported commands in English.
- When the browser exposes the Web Speech `SpeechRecognition`/`webkitSpeechRecognition` interface, the microphone control can request English recognition (`en-GH` / browser-supported English variant). Actual availability and recognition quality depend on browser, operating system, permissions and network.
- Browser `speechSynthesis` can speak a short response when voices are available.
- Navigation phrases include “open dashboard”, “show soil”, “open rotation”, “open advisory” and “go home”.
- The backend `/api/voice/intent` endpoint parses text commands only; it is not an AI assistant or speech service.

## Twi

The separate `twiCommands.js` module contains a small editable phrase dictionary for navigation-intent matching. It is not a trained Twi speech-recognition model, has not been validated with Twi-speaking users, and does not make browser speech recognition work in Twi. The UI must report that Twi voice recognition is unsupported/unverified and retain text-entry fallback.

## Privacy and permissions

Microphone access is requested only after a direct user action. Voice recognition is performed by browser facilities and may involve browser-vendor services. Do not use the microphone in insecure contexts unless the browser explicitly supports it. Users can deny permission and continue using the application normally.

## Browser support

Check `window.SpeechRecognition || window.webkitSpeechRecognition` at runtime. Check `window.speechSynthesis` and available voices before speaking. There is no bundled speech model or Abena AI endpoint. The `voiceModelLoader` reports no local model configured.
