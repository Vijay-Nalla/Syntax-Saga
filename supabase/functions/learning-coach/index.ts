// Edge function: AI-powered learning coach using Lovable AI Gateway.
// Includes a simple in-memory token bucket rate-limit keyed by IP (10 req / 5 min).
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

const buckets = new Map<string, { count: number; reset: number }>();
function rateLimit(key: string, limit = 10, windowMs = 5 * 60 * 1000): boolean {
  const now = Date.now();
  const b = buckets.get(key);
  if (!b || now > b.reset) { buckets.set(key, { count: 1, reset: now + windowMs }); return true; }
  if (b.count >= limit) return false;
  b.count++; return true;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() || "anon";
  if (!rateLimit(ip)) {
    return new Response(JSON.stringify({ error: "rate_limited_local" }), {
      status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  try {

    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "LOVABLE_API_KEY missing" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const body = await req.json().catch(() => ({}));
    const { language, strengths = [], weaknesses = [], wrongAnswers = [], accuracy = 0 } = body;

    const sys = "You are an expert coding coach for a multiplayer learning game called Syntax Saga. Respond ONLY with valid JSON matching: { coachNote: string, roadmap: string[], focusAreas: string[], encouragement: string }. Keep coachNote under 240 chars, roadmap 5 day-by-day steps, focusAreas 3 short topics, encouragement under 120 chars.";

    const prompt = `Player just finished a ${language || "coding"} match.\nAccuracy: ${accuracy}%\nStrong topics: ${strengths.join(", ") || "none"}\nWeak topics: ${weaknesses.join(", ") || "none"}\nRecent wrong answers (topic -> question): ${wrongAnswers.slice(0, 5).map((w: any) => `${w.topic}: ${w.question_text?.slice(0, 80) || ""}`).join("; ") || "none"}\nGenerate personalized feedback as JSON.`;

    const r = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${LOVABLE_API_KEY}` },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [{ role: "system", content: sys }, { role: "user", content: prompt }],
        response_format: { type: "json_object" },
      }),
    });

    if (r.status === 429) return new Response(JSON.stringify({ error: "rate_limited" }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    if (r.status === 402) return new Response(JSON.stringify({ error: "credits_exhausted" }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    if (!r.ok) {
      const t = await r.text();
      return new Response(JSON.stringify({ error: "ai_error", detail: t }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const data = await r.json();
    const raw = data?.choices?.[0]?.message?.content || "{}";
    let parsed: any = {};
    try { parsed = JSON.parse(raw); } catch { parsed = { coachNote: raw }; }

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
