# Florence

An AI voice receptionist for small businesses. Customers call. The agent answers in the owner's voice, knows the prices, and sends a Stripe payment link mid-conversation to close the sale.

Built for the **ElevenLabs × Stripe hackathon**.

The hero isn't the voice clone — it's that the **agent autonomously decides when to send a Stripe payment link**. Most AI receptionists schedule callbacks. This one collects.

## Stack
- Next.js 16 (App Router) + React 19 + Tailwind 4
- **ElevenLabs Conversational AI** — `@elevenlabs/react` for browser-embedded WebRTC calls, voice cloning, agent creation
- **Stripe Payment Links API** — created on-the-fly by an ElevenLabs client tool
- No Twilio. Calls happen in the browser (faster to demo, no phone provisioning).

## What's in here

```
app/
  page.tsx              landing — interactive call script preview
  setup/                3-step flow: details → services → voice clone
  dashboard/            status + mock call log + services
  demo/                 the money shot — embed live call + live transcript + payment card
  api/
    clone-voice/        POST audio blob → ElevenLabs instant voice cloning
    create-agent/       POST profile → creates ElevenLabs Conversational AI agent w/ client tool
    generate-payment-link/  POST {amount, description} → Stripe Payment Link
    signed-url/         GET ?agent_id=... → returns short-lived signed WebSocket URL
components/
  DemoCall.tsx          ConversationProvider + useConversation, registers generate_payment_link client tool
  VoiceRecorder.tsx     browser-mic recorder for the voice sample
  PaymentCard.tsx       the green card that animates in mid-call
  ...
lib/
  elevenlabs.ts         API client (cloneVoice, createAgent, getSignedUrl)
  stripe.ts             Stripe client
  prompt.ts             system-prompt builder from business profile
  storage.ts            localStorage for the business profile
```

## Setup

1. **Install**

   ```bash
   cd /Users/fubara/florence
   npm install
   ```

2. **Environment** — copy `.env.example` to `.env.local` and fill in:

   ```bash
   ELEVENLABS_API_KEY=...           # https://elevenlabs.io/app/settings/api-keys
   STRIPE_SECRET_KEY=sk_test_...    # https://dashboard.stripe.com/apikeys (test mode is fine)
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
   STRIPE_CURRENCY=usd              # or eur, gbp, ngn, etc.
   NEXT_PUBLIC_APP_URL=http://localhost:3000

   # Optional: a pre-built agent_id used on /demo when no local setup exists.
   # Fill this AFTER you've run /setup once and got a real agent_id back.
   NEXT_PUBLIC_DEMO_AGENT_ID=
   ```

3. **Run**

   ```bash
   npm run dev
   ```

   Open http://localhost:3000.

## How to demo

1. Go to `/setup`. Fill in business details, add services, record 30 seconds of voice. Click "Create my receptionist." This:
   - clones your voice (ElevenLabs `POST /v1/voices/add`)
   - creates an agent with your system prompt + `generate_payment_link` client tool (ElevenLabs `POST /v1/convai/agents/create`)
   - saves `voice_id`, `agent_id`, and the business profile to `localStorage`
2. Lands on `/dashboard`. Status card shows "Live", agent_id is printed at the bottom.
3. Hit **"Test your agent →"** to go to `/demo`.
4. Click **"Answer call →"**. Grant mic. The agent greets you in your cloned voice.
5. Ask about a service. Then say you want to book / pay a deposit.
6. The agent calls `generate_payment_link` — a real Stripe payment link is created server-side and the **green payment card animates in** on screen with the URL.
7. Click "Pay deposit →" and Stripe Checkout opens (test mode, use `4242 4242 4242 4242`).

For the hackathon video: pre-build a "Maja's Cake Studio" agent, copy its `agent_id` into `NEXT_PUBLIC_DEMO_AGENT_ID`, and `/demo` works for any visitor in fresh browsers — no setup needed.

## How the autonomous payment works

When you create the agent, we register a **client tool** in its config:

```ts
tools: [{
  type: "client",
  name: "generate_payment_link",
  description: "Generate a Stripe payment link...",
  parameters: { ... }
}]
```

In the browser, `useConversation({ clientTools: { generate_payment_link: async ({ amount, description }) => { ... } } })` provides the implementation. The agent decides on its own — based on the prompt — when to call it. The tool fetches `/api/generate-payment-link` (Stripe `paymentLinks.create`), updates UI state to render `<PaymentCard>`, and returns a confirmation string back to the agent so it can tell the caller.

## Deploy to Vercel

```bash
npx vercel
```

Add the same env vars in the Vercel dashboard. The demo agent the judges will hit is the one whose `agent_id` you put in `NEXT_PUBLIC_DEMO_AGENT_ID`.

## Verification status (read this before demo day)

What's verified locally (no API keys needed):
- `tsc --noEmit` clean
- `next build` clean — all 10 routes generated
- Pages render, API routes reachable
- Tool name + parameter shape match between server-registered tool spec (`generate_payment_link`) and the client-side handler in `DemoCall.tsx` — checked against the `ClientToolCall` wire type in `@elevenlabs/types`

What needs verification with real keys (do this **before** filming the video):
1. **Voice cloning accepts webm/opus.** Browser `MediaRecorder` emits `audio/webm;codecs=opus`. ElevenLabs documents MP3/WAV/M4A/FLAC; webm is widely reported to work but I haven't confirmed against the current API. If `/api/clone-voice` 400s, the fix is to convert webm → wav client-side (see `components/VoiceRecorder.tsx`).
2. **Agent tool config shape.** I send tools inline at `conversation_config.agent.prompt.tools` (the legacy path). ElevenLabs is shifting toward workspace tools (`POST /v1/convai/tools` first, then reference `tool_ids` on the agent). If `/api/create-agent` rejects the inline tool, change `lib/elevenlabs.ts:createAgent` to:
   - first POST the tool definition to `/v1/convai/tools/create`, get back `tool_id`,
   - then send `prompt.tool_ids: [tool_id]` instead of `prompt.tools`.
3. **WebRTC call connects + cloned voice plays back.** Run `/demo` after setup, click "Answer call," grant mic.
4. **Agent autonomously calls the tool.** Ask about a price, then say "I'd like to book a deposit." Watch for the payment card to animate in. If the agent describes sending a link but the card doesn't appear, check the browser console — the SDK fires `onUnhandledClientToolCall` when the tool name doesn't match.
5. **Stripe currency is enabled on your account.** NGN, KES, ZAR are not on by default — check `dashboard.stripe.com/settings/payments`.
6. **ElevenLabs plan tier.** Instant Voice Cloning requires Starter ($5/mo) or higher.

## What this isn't (yet)

- **No phone numbers.** Calls run over WebRTC in the browser. ElevenLabs + Twilio for real PSTN is a 1-day follow-up.
- **Mock call log.** `/dashboard` shows mock recent calls — wire to ElevenLabs conversation history API to make real.
- **Single-tenant.** Profile + agent_id live in `localStorage`. Multi-tenant needs auth + DB.

## License

MIT for the hackathon.
