import localFont from "next/font/local";

// Space Grotesk: the display face. Used for headings and anything that
// needs to feel like a technical instrument label — slightly geometric,
// slightly mechanical, distinct from the generic-SaaS Inter-everywhere
// look. Used with restraint (headings, key numbers), not body text.
export const spaceGrotesk = localFont({
  src: "./fonts/SpaceGrotesk.ttf",
  variable: "--font-display",
  display: "swap",
});

// Inter: the body face. Chosen for what it is — extremely legible at small
// sizes, a dev-tool standard — not because it's the default; it's paired
// deliberately against Space Grotesk's more distinctive character rather
// than used for headings too.
export const inter = localFont({
  src: "./fonts/Inter.ttf",
  variable: "--font-body",
  display: "swap",
});

// JetBrains Mono: the utility face. This is a tool about node IDs,
// execution status, JSON payloads, and Kafka topics — a monospace face
// isn't a nice-to-have here, it's load-bearing for the actual content.
export const jetbrainsMono = localFont({
  src: "./fonts/JetBrainsMono.ttf",
  variable: "--font-mono",
  display: "swap",
});
