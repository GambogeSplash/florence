/**
 * Default agent voice — a Nigerian female from the ElevenLabs library.
 * Applied automatically after a new agent is created so the demo lands on
 * a great voice without manual library picking. Users can swap to their
 * cloned voice from the dashboard.
 */
export const DEFAULT_AGENT_VOICE_ID = "eOHsvebhdtt0XFeHVMQY";

export type Service = {
  name: string;
  price: number;
  image?: string;
};

export type BusinessProfile = {
  name: string;
  type: string;
  greeting: string;
  availability: string;
  services: Service[];
  voiceId?: string;
  agentId?: string;
  currency: string;
  /** Data URL of the business logo / avatar (resized to ~256px before storing). */
  image?: string;
};

export const DEFAULT_PROFILE: BusinessProfile = {
  name: "Maja's Cake Studio",
  type: "Cake shop",
  greeting:
    "Hi, thanks for calling Maja's Cake Studio. How can I help you today?",
  availability: "Monday to Saturday, 9am to 6pm",
  services: [
    {
      name: "Custom Birthday Cake (8\")",
      price: 45,
      image:
        "https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=400&h=400&fit=crop",
    },
    {
      name: "Wedding Tier (3 tiers)",
      price: 280,
      image:
        "https://images.unsplash.com/photo-1535254973040-607b474cb50d?w=400&h=400&fit=crop",
    },
    {
      name: "Cupcake Box (12)",
      price: 28,
      image:
        "https://images.unsplash.com/photo-1486427944299-d1955d23e34d?w=400&h=400&fit=crop",
    },
    {
      name: "Tasting Session",
      price: 15,
      image:
        "https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=400&h=400&fit=crop",
    },
  ],
  currency: "usd",
};
