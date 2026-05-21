# Florence

The voice that picks up when you can't.

An AI voice receptionist for small businesses. Customers call, Florence picks up, knows the prices, and sends a Stripe payment link mid-conversation to close the sale before anyone hangs up.

Built for the **ElevenLabs × Stripe hackathon**.

→ **Live demo: [florence-theta.vercel.app](https://florence-theta.vercel.app)**

The wedge isn't the voice — every AI receptionist has voice now. The wedge is that Florence **autonomously decides when to send the Stripe Payment Link** based on the conversation. Most AI receptionists schedule callbacks. This one collects.

## Stack

- **Next.js 16** + React 19 + Tailwind 4
- **ElevenLabs Conversational AI** — `@elevenlabs/react`, browser-embedded WebRTC (no Twilio)
- **Stripe Payment Links API** — created on-the-fly by an ElevenLabs client tool

## Quick start

```bash
git clone https://github.com/GambogeSplash/florence
cd florence
cp .env.example .env.local   # then fill in your keys
npm install
npm run dev
```

Then open http://localhost:3000.

You'll need:
- An **ElevenLabs API key** with `Voices: write`, `ElevenAgents: read+write`, `Text to Speech: access` scopes ([get one](https://elevenlabs.io/app/settings/api-keys))
- A **Stripe secret key** ([dashboard](https://dashboard.stripe.com/test/apikeys), test mode is fine)

## Demo flow

1. **`/setup`** — name your business, add services + prices, record a voice sample (we use a curated voice for the hackathon, but the recording UX is there)
2. **`/dashboard`** — confirms your agent is live; lets you swap voice or change config
3. **`/demo`** — tap **Call Florence**. Ask about a service, then say you want to book.
4. Florence calls `generate_payment_link` autonomously. The payment card appears inline in the transcript.
5. Click **Pay deposit →** (test card `4242 4242 4242 4242`). Stripe redirects to `/paid`, which broadcasts back to the call window so Florence can verbally confirm and hang up.

## How the autonomous payment works

When the agent is created, `generate_payment_link` is registered as an ElevenLabs **client tool** in its config. The agent decides — based on the system prompt — when to call it. The tool runs in the browser, fires `/api/generate-payment-link` (Stripe `paymentLinks.create`), and returns the URL back to the agent so it can tell the caller.

When Stripe redirects to `/paid`, the page broadcasts a `paid` message on a `BroadcastChannel`. The original call window listens, fires `conversation.sendContextualUpdate()` so Florence learns the payment landed, and renders a "Payment received ✓" line in the transcript.

## License

MIT.
