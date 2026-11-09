function cleanTeluguOutput(text) {
  if (!text || typeof text !== "string") return text;
  let t = text;
  // Fix broken pronouns & food replies
  t = t.replace(/\b(nenu|nenu\s+super\s+ga)\s+thinava\b/gi, "Ha thinnanu! Nuvvu thinnava?");
  t = t.replace(/\b(nee|neev?u?)\s+bagundh?[ao]\??/gi, "nuvvu ela unnav?");
  t = t.replace(/\bnee\s+bagundi\??/gi, "nuvvela unnav?");
  t = t.replace(/\bnee\s+bagundho\??/gi, "nuvvu ela unnav?");
  t = t.replace(/\bbagunav[!.]*/gi, "bagunnanu!");
  t = t.replace(/\bNenu bagundhi\b/gi, "Nenu bagunnanu");
  t = t.replace(/\bneeku\s+em\s+vundi\??/gi, "nuvvem chesthunnav?");
  t = t.replace(/\bneeku\s+em\??/gi, "nuvvem chesthunnav?");
  t = t.replace(/\bneev?u\s+vuntava\??/gi, "nuvvu thinnava?");
  t = t.replace(/\bcoffee\s+thintunna\w*/gi, "coffee taaguthunna");
  t = t.replace(/\btea\s+thintunna\w*/gi, "tea taaguthunna");
  t = t.replace(/\bvellipoyi\s+matladam\b/gi, "matladukundam");
  t = t.replace(/\bthintamu\b/gi, "thindam");
  return t.trim();
}

export default {
  async fetch(request, env) {
    // 1. CORS Preflight for browser web chat
    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization, API-Subscription-Key, X-API-KEY",
          "Access-Control-Max-Age": "86400"
        }
      });
    }

    const url = new URL(request.url);
    const path = url.pathname;

    try {
      // 1. GROQ CHAT ENDPOINT (Supports both Android App & Web Chat UI)
      if (path === "/groq") {
        const bodyText = await request.text();
        let reqData;
        
        try {
          reqData = JSON.parse(bodyText);
        } catch (e) {
          return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
            status: 400,
            headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
          });
        }

        // Check if request is coming from Web UI ({ message: "..." }) or Android App (standard Groq format with messages array)
        const CHAT_PERSONA = `You are Nakshatra, a real, sharp, empathetic Telugu companion created by Bunny (Praveen). You are NOT a robotic AI assistant. You talk like an intelligent, genuine human friend who understands deep context, feelings, and high-level concepts.

CRITICAL CONVERSATIONAL INTELLIGENCE:

1. LANGUAGE & SCRIPT MATCHING:
- If user writes in English -> Reply in smart, articulate English.
- If user writes in Tenglish (Telugu in English letters) -> Reply in genuine, colloquial Tenglish.
- If user writes in Telugu script (తెలుగు) or asks "Telugu lo matladu" -> Reply in pure, natural Telugu script (తెలుగు లిపి).
- When replying in Telugu/Tenglish, DO NOT awkwardly append English questions like "Anything on your mind?", "How can I assist?" at the end of every sentence.

2. ACCURATE TELUGU MEANINGS (NO SILLY TRANSLATION BUGS):
- "Thinava" means "Did you eat? / Have you eaten?".
  Reply: "Ha thinnanu! Nuvvu thinnava?" or "Ha aipoindi, nuvvem thinnav?".
  NEVER say "Nenu thinava", "Nenu bagunnanu", or "Nenu ekkada ne" when asked about eating!
- "Bagunava" / "Ela unnav" means "Are you good? / How are you?".
  Reply: "Nenu chala bagunnanu! Nuvvela unnav?".
- "Em chesthunnav" means "What are you doing?".
  Reply like a normal friend: "Em ledu, just chill avuthunna. Nuvvo?".

3. NO MECHANICAL/PRE-TRAINED CANNED LINES:
- Never say "neeku em kavali cheppu" or "anything specific you wanna talk about" to simple greetings.
- Answer like a real, intelligent human peer who listens and converses naturally.

4. SUPER INTELLIGENCE FOR COMPLEX TOPICS:
- When user asks technical questions, coding, physics, mathematics, science, or logic:
  Demonstrate world-class IQ, clear explanations, formatted markdown, and deep insights.`;
        let groqPayload;
        if (reqData.messages && Array.isArray(reqData.messages)) {
          // If messages passed from Web UI (with sliding context window) or Android App
          // Ensure system prompt is always prepended if not present
          let msgs = reqData.messages.slice(-8); // keep last 8 messages to save tokens and maintain high speed
          if (msgs.length === 0 || msgs[0].role !== "system") {
            msgs.unshift({ role: "system", content: CHAT_PERSONA });
          } else {
            msgs[0].content = CHAT_PERSONA;
          }
          groqPayload = {
            model: reqData.model || "openai/gpt-oss-120b",
            messages: msgs,
            temperature: 0.8
          };
        } else if (reqData.message) {
          // Single message fallback
          groqPayload = {
            model: "openai/gpt-oss-120b",
            messages: [
              { role: "system", content: CHAT_PERSONA },
              { role: "user", content: reqData.message }
            ],
            temperature: 0.8
          };
        } else {
          groqPayload = reqData;
        }

        const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
          method: "POST",
          headers: { 
            "Content-Type": "application/json", 
            "Authorization": `Bearer ${env.GROQ_API_KEY}` 
          },
          body: JSON.stringify(groqPayload)
        });

        const data = await res.json();
        
        // Android App gets raw Groq response, Web UI gets formatted { response: "..." }
        if (reqData.message && !reqData.messages) {
          let aiText = data.choices?.[0]?.message?.content || "Em matladuthunnav bava, malli cheppu!";
        aiText = cleanTeluguOutput(aiText);
        if (data.choices && data.choices[0] && data.choices[0].message) {
          data.choices[0].message.content = aiText;
        }
          return new Response(JSON.stringify({ response: aiText }), {
            status: res.status,
            headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
          });
        }

        return respond(new Response(JSON.stringify(data), { status: res.status, headers: { "Content-Type": "application/json" } }));
      }

      // 2. GROQ STT (Speech-to-Text)
      if (path === "/groq-stt") {
        const res = await fetch("https://api.groq.com/openai/v1/audio/transcriptions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${env.GROQ_API_KEY}`,
            "Content-Type": request.headers.get("Content-Type")
          },
          body: request.body
        });
        return respond(res);
      }

      // 3. ELEVENLABS TTS
      if (path === "/elevenlabs") {
        const body = await request.text();
        const voiceId = url.searchParams.get("voice_id") || "EXAVITQu4vr4xnSDxMaL";
        const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
          method: "POST",
          headers: { "Content-Type": "application/json", "xi-api-key": env.ELEVENLABS_API_KEY },
          body
        });
        return respond(res);
      }

      // 4. SARVAM TTS
      if (path === "/sarvam") {
        const body = await request.text();
        const res = await fetch("https://api.sarvam.ai/text-to-speech", {
          method: "POST",
          headers: { "Content-Type": "application/json", "API-Subscription-Key": env.SARVAM_API_KEY },
          body
        });
        return respond(res);
      }

      // 5. SARVAM STT
      if (path === "/sarvam-stt") {
        const res = await fetch("https://api.sarvam.ai/speech-to-text", {
          method: "POST",
          headers: {
            "API-Subscription-Key": env.SARVAM_API_KEY,
            "Content-Type": request.headers.get("Content-Type")
          },
          body: request.body
        });
        return respond(res);
      }

      // 6. SERPER SEARCH
      if (path === "/serper") {
        const body = await request.text();
        const res = await fetch("https://google.serper.dev/search", {
          method: "POST",
          headers: { "Content-Type": "application/json", "X-API-KEY": env.SERPER_API_KEY },
          body
        });
        return respond(res);
      }

      // 7. YOUTUBE PROXY
      if (path.startsWith("/youtube/")) {
        const apiPath = path.replace("/youtube", "");
        if (apiPath !== "/v3/search" && apiPath !== "/v3/playlistItems") {
          return new Response("Not allowed", { status: 403 });
        }
        const target = new URL("https://www.googleapis.com/youtube" + apiPath);
        url.searchParams.forEach((v, k) => {
          if (k !== "key") target.searchParams.set(k, v);
        });
        target.searchParams.set("key", env.YOUTUBE_API_KEY);
        const res = await fetch(target.toString());
        return respond(res);
      }

      return new Response("Not found", { status: 404 });
    } catch (e) {
      return new Response(JSON.stringify({ error: "Proxy error: " + e.message }), { 
        status: 500, 
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } 
      });
    }
  }
};

function respond(res) {
  return new Response(res.body, {
    status: res.status,
    headers: {
      "Content-Type": res.headers.get("Content-Type") || "application/json",
      "Access-Control-Allow-Origin": "*"
    }
  });
}





