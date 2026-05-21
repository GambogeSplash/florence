# Florence

The voice that picks up when you can't.

→ **[florence-theta.vercel.app](https://florence-theta.vercel.app)**

AI voice receptionist for small businesses. Florence picks up, knows the prices, and **autonomously sends a Stripe payment link mid-conversation** to close the sale before the call ends. Most AI receptionists schedule callbacks. This one collects.

Built for the ElevenLabs × Stripe hackathon.

## How it works

The agent is an ElevenLabs Convai voice agent running over WebRTC in the browser. `generate_payment_link` is registered as a client tool in the agent's config — the agent decides on its own when to call it based on the conversation. The tool fires `paymentLinks.create` and returns the URL back to the agent.

After Stripe Checkout, the customer redirects to `/paid`. That page broadcasts on a `BroadcastChannel`, the original call window listens, fires `conversation.sendContextualUpdate()` so Florence learns the payment landed, and the agent verbally confirms before hanging up.

## Stack

Next.js 16, ElevenLabs Convai (`@elevenlabs/react`), Stripe Payment Links. No Twilio.

## Running locally

See `.env.example` for required keys (ElevenLabs + Stripe).

```
npm install && npm run dev
```
