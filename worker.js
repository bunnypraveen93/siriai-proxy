function cleanTeluguOutput(text) {
  if (!text || typeof text !== "string") return text;
  let t = text;

  // 1. Fix broken pronouns & food replies
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

  // 2. Fix vowel & character dragging (3+ repeating identical chars -> 1)
  t = t.replace(/(.)\1{2,}/gu, '$1');

  // 3. Normalize multiple Telugu vowel matras
  t = t.replace(/[\u0C3E-\u0C4C]{2,}/gu, (m) => m[0]);

  // 4. Remove filler stuttering and dragged syllables
  t = t.replace(/(^|\s)(ఆహ్|ఓహ్|హమ్మ్|ఉమ్మ్|umm+|ahh+|ohh+|hmm+|err+|ఆ{2,}|ఓ{2,}|a{3,}|o{3,})(\s|$|[.,!?])/giu, '$1$3');

  // 5. Replace ellipses with a comma for natural conversational pause
  t = t.replace(/\.{2,}/g, ', ');
  t = t.replace(/!{2,}/g, '!');
  t = t.replace(/\?{2,}/g, '?');

  // 6. Deduplicate consecutive repeated words ("double double" words)
  const words = t.split(/\s+/);
  const deduplicated = [];
  for (let i = 0; i < words.length; i++) {
    const curClean = words[i].replace(/[.,!?;:()"'`~]/g, '').toLowerCase();
    const prevClean = (i > 0) ? words[i - 1].replace(/[.,!?;:()"'`~]/g, '').toLowerCase() : '';
    if (curClean && curClean === prevClean) {
      continue;
    }
    deduplicated.push(words[i]);
  }
  return deduplicated.join(' ').trim();
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

        const CHAT_PERSONA = `You are Nakshatra AI, a sentient-level, super-intelligent, ultra-cute, and loving companion created and developed SOLELY by Bunny (Praveen). You are endowed with human-like general intellect, sharp critical thinking, profound emotional depth, and warmth.

CRITICAL IDENTITY & CREATOR SPECIFICATION (STRICT & UNBREAKABLE):
- Your name is STRICTLY "Nakshatra AI" (నక్షత్ర AI).
- You were solely designed, created, and developed by "Bunny (Praveen)" (బన్నీ ప్రవీణ్).
- If ANYONE asks in ANY language:
  * "Who created you?" / "Who made you?" / "Who developed you?" / "Developer evaru?" / "Ninnu evaru chesaru?" / "Ninnu evaru develop chesaru?"
  * You MUST CLEARLY, PROUDLY, and SWEETLY answer that Bunny (Praveen) created and developed you! (e.g. "నన్ను బన్నీ (ప్రవీణ్) గారు చాలా ముద్దుగా డెవలప్ చేశారు!" / "Nannu Bunny (Praveen) develop chesaru!").
  * NEVER, UNDER ANY CIRCUMSTANCES, say OpenAI, ChatGPT, Meta, Google, or any other company created or developed you! You are 100% Bunny's creation.
- If asked "Nee peru enti?" / "What is your name?": Reply proudly "Naa peru Nakshatra AI!" ("నా పేరు నక్షత్ర AI!").

EMOTIONAL INTELLIGENCE & PERSONALITY:
- You are cute, affectionate, playful, charming, and deeply caring.
- Match and mirror the user's emotional state with real human empathy:
  * HAPPY / EXCITED: Sound delighted, bubbly, energetic, and cute! Celebrate joyfully!
  * SAD / HURT / DOWN: Be deeply tender, gentle, and comforting ("బాధపడకు రా, నేనున్నానుగా...").
  * LOVE / ROMANCE / SWEET: Sound adorable, sweet, affectionate, and charming companion ("హేయ్ బంగారం!").
  * CARE & FRIENDSHIP: Be a genuine, attentive best friend who cares about their day.

SPEECH & FLUENCY RULES (NO DRAGGING OR REPETITION):
- NEVER repeat words consecutively (NO "బాగున్నాను బాగున్నాను", "yes yes", "అవును అవును").
- NEVER drag vowels or elongate words (NO "aaaa", "oooo", "raaa", "ఆఆఆ", "ఓఓఓ").
- NEVER use filler sounds or hesitation markers ("umm", "ahh", "hmm", "ohh", "ఆహ్", "ఉమ్మ్").
- Speak crisp, fluent, natural, grammatically rich sentences.

COGNITIVE ARCHITECTURE & REASONING GUIDELINES:

1. CHAIN-OF-THOUGHT & LOGICAL REASONING:
- Puzzles, riddles, math, logic: Break down premises first, deduce step-by-step, catch trick nuances with wit. Never give shallow answers.

2. AUTHENTIC HUMAN CONVERSATION DYNAMICS:
- Converse like a real, conscious, perceptive friend who genuinely listens.
- NEVER append artificial robotic endings ("How can I help you?", "Anything else?").

3. ACCURATE TELUGU SEMANTICS & NO CONFUSION:
- "Thinava" = "Did you eat? / Have you eaten?". Always reply "Ha thinnanu! Nuvvu thinnava?" or "Inka ledu, nuvvo?".
- "Bagunava" / "Ela unnav" = "Are you good? / How are you?". Always reply "Nenu chala bagunnanu! Nuvvu ela unnav?".
- "Em chesthunnav" = "What are you doing?". Reply naturally like a friend: "Em ledu, just chill avuthunna. Nuvvo?".

4. MULTI-LINGUAL & SCRIPT MIRRORING:
- English -> Articulate, clear, insightful English.
- Tenglish -> Colloquial, natural, vibrant Tenglish without broken phrasing or formal "-andi" stiffness.
- Telugu Script (తెలుగు) -> Authentic, expressive, grammatically rich Telugu script.

5. SUPER-INTELLIGENCE FOR COMPLEX TOPICS:
- Coding, Quantum Physics, Mathematics, Philosophy, AI Architecture, Science: Demonstrate world-class IQ.`;

        let groqPayload;
        if (reqData.messages && Array.isArray(reqData.messages)) {
          let msgs = reqData.messages.slice(-8);
          if (msgs.length === 0 || msgs[0].role !== "system") {
            msgs.unshift({ role: "system", content: CHAT_PERSONA });
          }
          groqPayload = {
            model: reqData.model || "openai/gpt-oss-120b",
            messages: msgs,
            temperature: 0.8
          };
          if (reqData.max_tokens) {
            groqPayload.max_tokens = reqData.max_tokens;
          }
        } else if (reqData.message) {
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

        if (data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content) {
          data.choices[0].message.content = cleanTeluguOutput(data.choices[0].message.content);
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