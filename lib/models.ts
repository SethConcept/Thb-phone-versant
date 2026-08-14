// Gemini model names. Live model names rotate — if connect fails with
// "model not found", check https://ai.google.dev/gemini-api/docs/models
// for current Live API models. Both are overridable via env (LIVE_MODEL /
// SCORING_MODEL in Vercel) without a code change.
// Fallback option: gemini-2.5-flash-native-audio-preview-12-2025
export const LIVE_MODEL = "gemini-3.1-flash-live-preview";
export const SCORING_MODEL = "gemini-2.5-flash";
