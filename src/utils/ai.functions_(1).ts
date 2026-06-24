type Msg = { role: "system" | "user" | "assistant"; content: string };

async function callGateway(messages: Msg[], model = "google/gemini-2.5-flash") {
  const apiKey = import.meta.env.VITE_LOVABLE_API_KEY || "";
  if (!apiKey) throw new Error("AI API key not configured");
  const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({ model, messages }),
  });
  if (res.status === 429) throw new Error("AI rate limit reached. Try again shortly.");
  if (!res.ok) throw new Error(`AI gateway error ${res.status}: ${await res.text()}`);
  const data = await res.json();
  return (data.choices?.[0]?.message?.content ?? "").trim();
}

export async function aiRefereeAssist(input: { sport: string; situation: string; context?: string }) {
  const sport = (input.sport || "football").slice(0, 50);
  const situation = input.situation.slice(0, 1000);
  const context = (input.context || "").slice(0, 500);
  const content = await callGateway([
    {
      role: "system",
      content: `You are an experienced ${sport} referee assistant. Provide a CRISP ruling: 1) Decision (one line), 2) Rule reference, 3) Recommended action (card/restart). Be neutral and concise. Max 120 words.`,
    },
    { role: "user", content: `Situation: ${situation}\nContext: ${context || "n/a"}` },
  ]);
  return { content };
}

export async function aiHalfTimeBrief(input: { home: string; away: string; homeScore: number; awayScore: number; events: string[] }) {
  const home = String(input.home || "Home").slice(0, 80);
  const away = String(input.away || "Away").slice(0, 80);
  const homeScore = Number(input.homeScore) || 0;
  const awayScore = Number(input.awayScore) || 0;
  const events = (Array.isArray(input.events) ? input.events : []).slice(-30).map((e) => String(e).slice(0, 200));
  const content = await callGateway([
    {
      role: "system",
      content: "You are a professional sports commentator. Draft a 120-150 word half-time recap: scoreline, narrative, key moments, tactical note, what to watch for in second half. Energetic, broadcast-ready, no markdown.",
    },
    {
      role: "user",
      content: `${home} ${homeScore} - ${awayScore} ${away}\nEvents:\n${events.join("\n") || "No notable events yet."}`,
    },
  ]);
  return { content };
}
