# VidPop

**Search, discover and verify information at the exact moment it appears in a video.**

Built for Google's #BuildHybridAI challenge. Gemini Nano scans the video transcript on-device and finds checkable claims and mentioned products. VidPop then shows a small, dismissible card at the exact timestamp. When the viewer taps it, cloud Gemini with Grounding with Google Search returns a cited answer inside the video.

```
transcript (timestamped) ──► Gemini Nano, on-device ──► moments + segment index
                                                          │ timestamps come from the transcript
                                                          ▼
                              popup at exact time ──► tap ──► Gemini + Google Search (cloud)
                                                              + Fact Check Tools API
                                                          ▼
                              in-video sheet: verdict · sources · Search suggestions · "Open in Google"
```

## Run it

```bash
npm install
cp .env.example .env   # optional: add Firebase or a Gemini key
npm run dev            # http://localhost:5173
```

It runs with **no keys at all**. Extraction falls back to a heuristic and verification falls back to a labelled demo cache, so the demo never dead-ends. Every result shows which engine produced it.

### Turning on the real hybrid AI

| Piece | How |
|---|---|
| **Gemini Nano (on-device)** | Use a Chrome build with the Prompt API (`LanguageModel`). Click **Download Gemini Nano** in the side panel the first time, because Chrome needs a user gesture to start the download. |
| **Firebase AI Logic** (recommended) | Create a Firebase project, enable AI Logic with the Gemini Developer API, register a web app, and fill in `VITE_FIREBASE_*`. Extraction uses `InferenceMode.PREFER_ON_DEVICE`, and the response's `inferenceSource` tells the UI whether Nano or the cloud ran. |
| **Gemini API key** (local dev only) | Set `VITE_GEMINI_API_KEY` if you haven't set up Firebase yet. The key is exposed to the browser, so never deploy with it. |
| **Fact Check Tools API** | Set `VITE_FACTCHECK_API_KEY` to add published fact-checks with publisher and review dates. |
| Cloud model | `VITE_GEMINI_MODEL` (default `gemini-3.6-flash`). |

## Deploy (Firebase Hosting, no backend)

The whole app is static. The browser talks to Gemini through Firebase AI Logic, so there's no server to run and no secret key in the bundle.

1. In the [Firebase console](https://console.firebase.google.com), create a project, enable **AI Logic** with the Gemini Developer API, and register a **Web app**. Put its config in `.env` (`VITE_FIREBASE_*`).
2. **Before sharing the URL**, enable **App Check** (reCAPTCHA Enterprise) for AI Logic. Without it, anyone can use your Gemini quota from your public config.
3. Run these once:
   ```bash
   npx firebase-tools login
   npx firebase-tools use --add      # pick your project
   ```
4. Then, every time you deploy:
   ```bash
   npm run deploy                    # build, then firebase deploy --only hosting
   ```

Notes:
- `VITE_GEMINI_API_KEY` is **dev-only**. Production builds strip it out (checked by building with a test key and searching the bundle).
- If you use the Fact Check API key, restrict it to your hosting domain under *APIs & Services → Credentials → HTTP referrers*.
- Transcripts for demo clips ship as static JSON in `public/clips/`, so a live demo never waits on transcription.
- Gemini Nano is used only when the visitor's Chrome has the built-in model. Everyone else gets the cloud model, which is shown in the UI, so the deployed site works in any browser.

## How it works

- **`src/ai/extract.ts`** finds moments. It tries Firebase hybrid, then the Chrome Prompt API, then the Gemini API, then the heuristic, in that order. The transcript goes in as numbered lines in windows of 8. The model returns JSON (constrained by `responseConstraint` or `responseSchema`) with a **segment index**, not a time. The timestamp is then taken from the transcript, so popups always land on the right moment.
- **`src/ai/verify.ts`** checks claims with cloud Gemini and the `googleSearch` tool, using a neutral prompt that returns a SUPPORTED / CONTRADICTED / MIXED / INSUFFICIENT verdict. Sources come from `groundingMetadata.groundingChunks`. Google's required Search Suggestions chip (`searchEntryPoint.renderedContent`) is rendered in a shadow root. The Fact Check API runs in parallel.
- **`src/ads/inventory.ts`** holds the Discover Mode offers. They're fictional advertisers matched only to *product* moments. Every offer is labelled "Sponsored". Offers never appear on claims or on political content, and they're never targeted by inferred interests. Organic "Search on Google" links always appear above the sponsored card.
- **`src/components/Phone.tsx`** is the player, with a 9:16 screen, captions, the popup, the **claim timeline** (markers on the scrubber you can tap) and the bottom sheet. The video keeps playing while the sheet is open.

## Demo clips

`public/clips/` holds two synthetic, fully licensed clips, generated by `npm run clips` (macOS `say` + ffmpeg). Each line is measured, so the transcript timestamps are exact.

- **4 facts that sound fake** (Verify): Great Wall from space (contradicted), Eiffel Tower thermal growth (supported), 10% of the brain (contradicted), edible tomb honey (mixed).
- **Day 1 in Tokyo** (Discover): a camera, a rail pass and a power bank, plus one claim: "Tokyo is the most populous metro area". The UN's 2025 report changed that ranking, which shows why publication dates matter.

To edit the scripts, change `scripts/make-clips.mjs` and rerun it.

## Uploading your own clip

Drop a video on **+ Upload your own clip**. There is no extra button: VidPop transcribes it, then scans it for moments, automatically.

1. The browser pulls out the audio track and converts it to 16 kHz mono WAV (`src/ai/transcribe.ts`). Only audio is sent, because video frames would cost several times more tokens.
2. **Gemini Flash-Lite** (`VITE_TRANSCRIBE_MODEL`, default `gemini-3.5-flash-lite`) returns sentence segments with MM:SS start times, through Firebase AI Logic. There is no backend.
3. Those times are whole seconds, so `src/ai/align.ts` snaps each one to a real speech onset found from the audio energy, preferring longer pauses because sentence breaks have longer silences. On the demo clips this brings every start to within 0.1 s, even when the model is a second early or late.
4. Gemini Nano scans the new transcript for claims and products, as it does for the demo clips.

Limits: up to 15 minutes (clips over 7 minutes are sent at 8 kHz to stay under Gemini’s 20 MB inline request limit). A 4-minute clip costs well under a cent on Flash-Lite. If you already have captions, paste them under *Already have captions?* to skip transcription.

## 3-minute demo script

1. **0:00–1:00.** Open *4 facts*. Point at the side panel: Gemini Nano scanned the transcript on-device, and the markers on the timeline are the claims. Press play. The "Is this claim true?" card appears exactly as the Great Wall line starts.
2. **1:00–2:00.** Tap **Verify**. The sheet slides up while the video keeps playing. Show the verdict, the cited sources, the Search suggestions and "Open in Google Search". Tap the 0:24 marker to jump to the 10% brain claim.
3. **2:00–3:00.** Switch to *Day 1 in Tokyo* and Discover. The camera card appears, then the sponsored card, which is clearly labelled and kept separate from verification. End on the Tokyo claim, where the "Mixed or outdated" verdict shows that dates matter.

## Next steps

- Add the TikTok embed player (it exposes playback time) for real creator content.
- Cache verifications per claim server-side, so popular claims return instantly.

## License

[MIT](LICENSE). The demo stores and products in `src/ads/catalog.ts` are fictional, and the demo clips in `public/clips/` are synthetic. Third-party services (Gemini, Firebase, Google Search, the Fact Check Tools API) are used under their own terms.
