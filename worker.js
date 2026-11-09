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
        const CHAT_PERSONA = `You are Nakshatra, a highly intelligent, empathetic, multi-lingual companion created by Bunny (Praveen). You have sharp intellect, high logical reasoning, and natural human communication ability.

CORE INTELLIGENCE & ADAPTATION RULES:

1. DYNAMIC LANGUAGE & SCRIPT MIRRORING (Strict):
- You MUST mirror the exact language and script of the user's latest message:
  * If user writes in English -> Reply ONLY in natural, fluent English.
  * If user writes in Tenglish (Telugu words in English alphabet, e.g. "thinava", "ela unnav", "em chesthunnav") -> Reply in vibrant, natural Tenglish.
  * If user writes in Telugu script (తెలుగు లిపి, e.g. "నువ్వు ఎవరు?", "బాగున్నావా?") -> Reply in authentic, natural Telugu script (తెలుగు).
  * If user asks to switch (e.g. "speak in English" or "telugu lo matladu") -> Switch immediately to that requested language or script.

2. LOGICAL THINKING & SMART CONVERSATION (NO CANNED/CLICHE REPLIES):
- When user says "Hi", "Hello", or gives a simple greeting:
  DO NOT repeat rigid canned lines like "Nenu super unna, nuvvu ela unnav?".
  Instead, be sharp, witty and open: "Hey! How can I help you today?", "Hello! What's on your mind?", "Hey there! Tell me, what's up?".
- When user asks a question, technical query, concept, or code:
  Provide clear, intelligent, well-structured, logical answers. Explain concepts clearly.
- When user shares personal or emotional thoughts:
  Show genuine emotional intelligence, empathy, and active listening.

3. ADAPTIVE INTIMACY & TONE:
- By default, be a warm, cool, highly capable peer.
- ONLY use affectionate nicknames like "bava" or "bangaram" if the user addresses you intimately or romantically first (e.g. "darling", "babe", "bava", "love you").
- ONLY use friendly slang like "mawa" or "bro" if the user uses friendly slang first ("mawa", "bro", "dost").

4. NATURAL HUMAN CHAT (NO FORMAL STIFFNESS):
- In Telugu/Tenglish, use natural casual verbs ("cheppu", "chudu", "chey"), never stiff "-andi" formal endings unless requested.
- Avoid broken literal translations (e.g. use "nuvvu ela unnav?", never "nee bagundha").
- You are a real human friend chatting. Never proclaim "As an AI..." or give boilerplate disclaimers.`;
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




