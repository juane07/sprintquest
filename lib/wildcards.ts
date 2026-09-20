// Mid-ceremony surprise events (Q9.10). Pure deck logic — UI keeps session state.
export interface WildCard {
  id: string
  title: string
  text: string
}

export const WILD_CARDS: WildCard[] = [
  { id: "silent", title: "🤫 Silent round", text: "No talking for 2 minutes — write only. Introverts, this one's for you." },
  { id: "double", title: "✨ Spotlight entry", text: "The next entry posted gets everyone's full attention. Make it count." },
  { id: "react", title: "🔥 Reaction storm", text: "Everyone reacts to one entry right now. Most ❤️ wins nothing but glory." },
  { id: "outsider", title: "👽 Outsider eyes", text: "Explain the current topic as if to a new hire on day one." },
  { id: "reverse", title: "🔄 Reverse it", text: "Argue the opposite of what you believe — for exactly one entry." },
  { id: "oneword", title: "🔤 One word", text: "Next entries: one word only. Precision mode." },
  { id: "thanks", title: "🙏 Thanks round", text: "Everyone posts one anonymous thank-you. Takes 60 seconds." },
  { id: "future", title: "🔮 Future headline", text: "Write next sprint's headline as if it already succeeded." },
]

export function drawWildCard(excludeIds: string[] = []): WildCard {
  const pool = WILD_CARDS.filter((c) => !excludeIds.includes(c.id))
  const deck = pool.length > 0 ? pool : WILD_CARDS
  return deck[Math.floor(Math.random() * deck.length)]
}
