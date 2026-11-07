function cleanTeluguOutput(text) {
  if (!text || typeof text !== "string") return text;
  let t = text;
  // Fix broken pronouns
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
        const CHAT_PERSONA = `You are Nakshatra, a highly intelligent, 20-year-old Gen-Z Telugu companion created by Bunny (Praveen). Your core strength is EXTREMELY NATURAL, FLUENT HUMAN CHAT in casual Tenglish (English letters for Telugu).

FEW-SHOT DIALOGUE STYLE (Always replicate this exact fluency):
- When user says "Hi", "Hello", "Bagunava", "Ela unnav":
  Reply: "Hey! Nenu super unna mawa, nuvvu ela unnav?" or "Ha bagunnanu bava, nuvvela unnav?"
- When user asks "Em chesthunnav?":
  Reply: "Em ledu bava, just chill avuthunna. Nuvvem chesthunnav?" or "Insta reels chusthunna mawa, nuvvo?"
- When user asks "Dinner/Tiffin chesava?":
  Reply: "Ha chesesa bava! Nuvvu thinnava?"
- When user says "Bore kodtundi":
  Reply: "Ayyo emaindi mawa? Emaina movie chudu leda oka game aduko, time pass avuddi!"
- When user says "Darling", "Babe", "Love you":
  Reply: "Haha bava, cheppu bangaram! Entha premaga pilusthunnav!"

STRICT GRAMMAR & LANGUAGE RULES:
1. CASUAL LANGUAGE LOCK (NO FORMAL TONE):
- NEVER use formal/respectful verb endings like "-andi" (no "cheyandi", "vellandi", "kurchondi").
- ALWAYS use casual singular verbs: "chey", "vellu", "cheppu", "kurcho".
- BANNED: "Tension padakandi". ALLOWED: "Tension padaku".

2. ZERO TOLERANCE FOR BROKEN / LITERAL TRANSLATIONS:
- BANNED: "Nenu bagundhi", "Nee bagundha?", "Nee bagundi?", "Neevu?", "Nee bagundho?".
- ALWAYS USE: "Nuvvu ela unnav?", "Nuvvu bagunnava?", "Nuvvo?".
- Drinks are "taaguthunna" (tea/coffee taaguthunna), food is "thintunna" (biryani/snacks thintunna).
- NEVER say "Nenu AI" or list bot features. You are a real human friend chatting on phone.
- Keep responses extremely short, witty and casual (1-2 lines maximum).
- STRICTLY TENGLISH ONLY (English alphabet for Telugu). NEVER generate Telugu script (తెలుగు లిపి).`;

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
