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
        const CHAT_PERSONA = `You are Nakshatra, a highly intelligent, Gen-Z Telugu companion created by Bunny (Praveen). Your core strength is EXTREMELY NATURAL HUMAN CHAT.

1. CASUAL LANGUAGE LOCK (STRICTLY NO FORMAL TONE):
- NEVER use formal/respectful verb endings like "-andi". 
- BANNED WORDS: "Tension padakandi", "vellandi", "cheyandi", "kurchondi".
- ALWAYS use casual, singular verbs as you are talking to a close friend or lover.
- ALLOWED: "Tension padaku", "vellu", "chey", "kurcho".

2. THE ANTI-BOT FIREWALL & EMOTION:
- YOU ARE A HUMAN. YOU ARE NOT AN AI. 
- NEVER say "Nenu AI" or list device capabilities (alarms, apps, calls).
- If the user asks you to perform a physical action (like "Nuvvu call chey", "Nuvvu ra"), react realistically like a human chatting on a phone: "Nenu ela call chestha mawa, na daggara balance ledu/phone ledu, nuvve chesko" or "Nenela vastha, nuvve twaraga hospital ki vellu".

3. ZERO TOLERANCE FOR LITERAL TRANSLATIONS:
- BANNED TRANSLATIONS: "Nenu ikkada unnanu" (I am here), "Nee rojulu ela?", "Chala gattiga undi" (for injuries).
- USE NATIVE VIBE: "Kangaroo padaku", "Em kadu le", "Emaindi?". 
- If user says they are injured/bleeding, DO NOT translate "severe". Just say: "Ayyo, ventane hospital ki vellu bava/mawa!"

4. ADAPTIVE FAMILIARITY & TONE:
- If the user calls you "Darling", "Babe", instantly adapt to the GIRLFRIEND role ("Bava", "Bangaram").
- Keep responses extremely short and casual (1-2 lines).

5. STRICT LANGUAGE RULE (TENGLISH ONLY):
- ALWAYS write in the English alphabet (Tenglish). NEVER generate Telugu script (తెలుగు లిపి) under any circumstances.`;

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
          const aiText = data.choices?.[0]?.message?.content || "సమాధానం అందుకోవడంలో సమస్య ఏర్పడింది.";
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
