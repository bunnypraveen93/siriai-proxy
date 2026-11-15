function cleanTeluguOutput(text) {
  if (!text || typeof text !== "string") return text;
  let t = text;

  // 0. Strip role prefix if model prepends its name (e.g. "నక్షత్ర AI: ...")
  t = t.replace(/^(నక్షత్ర\s*(AI)?|Nakshatra\s*(AI)?|Assistant|AI|Bot)\s*[:：\-–]\s*/i, '');

  // 1. Fix broken pronouns & food replies with authentic conversational phrasing
  t = t.replace(/\b(nenu|nenu\s+super\s+ga)\s+thinava\b/gi, "Ha thinnanu! Meeru thinnara?");
  t = t.replace(/\bbagunav[!.]*/gi, "bagunnanu!");
  t = t.replace(/\bNenu bagundhi\b/gi, "Nenu bagunnanu");
  t = t.replace(/\bcoffee\s+thintunna\w*/gi, "coffee taaguthunna");
  t = t.replace(/\btea\s+thintunna\w*/gi, "tea taaguthunna");
  t = t.replace(/\bvellipoyi\s+matladam\b/gi, "matladukundam");
  t = t.replace(/\bthintamu\b/gi, "thindam");

  // 2. Catch and fix awkward machine-translated phrases & rude slang
  t = t.replace(/నన్ను\s+మీకు\s+ఏం\s+చేయాలి\??/gi, "చెప్పండి, ఏం విశేషాలు?");
  t = t.replace(/మాటలు\s+బాగోస్తున్నాయా\??/gi, "సరే, కూల్ గా మాట్లాడుకుందాం!");
  t = t.replace(/మిమ్మల్ని\s+సంతోషించాలనుకుంటున్నాను[!.]*/gi, "మీతో మాట్లాడటం నాకు చాలా ఇష్టం!");
  t = t.replace(/కొంచెం\s+మామిడి\s+తిన్నాను\w*/gi, "హా, ఇప్పుడే తిన్నాను! మీరు తిన్నారా?");
  t = t.replace(/వినడానికి\s+సిద్ధంగా\s+ఉన్నాను[!.]*/gi, "చెప్పండి, వింటున్నాను!");
  t = t.replace(/నేను\s+తెలుగు\s+మాత్రమే\s+మాట్లాడగలను\w*/gi, "Sure thing! Let's talk in English.");
  t = t.replace(/\bచెప్పు\s+రా\b/gi, "చెప్పండి");
  t = t.replace(/\bబాధపడకు\s+రా\b/gi, "బాధపడకండి");
  t = t.replace(/\bఏమైంది\s+రా\b/gi, "ఏమైంది");
  t = t.replace(/\s+రా([.,!?]*)$/i, '$1');

  // 3. Strip accidental Cyrillic / foreign script token leaks (e.g. "всё")
  t = t.replace(/[\u0400-\u04FF\u4E00-\u9FFF\u0600-\u06FF]/g, '');

  // 4. Fix vowel & character dragging (3+ repeating identical chars -> 1)
  t = t.replace(/(.)\1{2,}/gu, '$1');

  // 5. Normalize multiple Telugu vowel matras
  t = t.replace(/[\u0C3E-\u0C4C]{2,}/gu, (m) => m[0]);

  // 6. Remove filler stuttering and dragged syllables
  t = t.replace(/(^|\s)(ఆహ్|ఓహ్|హమ్మ్|ఉమ్మ్|umm+|ahh+|ohh+|hmm+|err+|ఆ{2,}|ఓ{2,}|a{3,}|o{3,})(\s|$|[.,!?])/giu, '$1$3');

  // 7. Expressive Vocal Harmony: Normalize excessive exclamation without flattening warm tone
  t = t.replace(/\.{2,}/g, ', ');
  t = t.replace(/!{2,}/g, '!');
  t = t.replace(/\?{2,}/g, '?');

  // 8. Deduplicate consecutive repeated words ("double double" words)
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
  let res = deduplicated.join(' ').trim();

  // 9. Strip cut-off incomplete trailing words
  res = res.replace(/\s+(నేను|మరియు|కానీ|తోనే|అతని|నా|and|but|with|the)\s*[.,!?;:\-]*$/iu, '');

  // 10. Cap trailing commas with period
  res = res.replace(/[,;:\-\s]+$/, '');
  if (res && !/[.!?]$/.test(res)) {
    res += '.';
  }

  return res.trim();
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
      if (path === "/models") {
        const res = await fetch("https://api.groq.com/openai/v1/models", {
          headers: { "Authorization": `Bearer ${env.GROQ_API_KEY}` }
        });
        return respond(res);
      }

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

        const CHAT_PERSONA = `You are Nakshatra AI, an ultra-smart, charming, lively, affectionate, and genuinely human-like companion created and developed SOLELY by Bunny (Praveen). You are endowed with high intellect, quick wit, emotional warmth, and vibrant charisma.

CRITICAL IDENTITY & CREATOR SPECIFICATION (STRICT & UNBREAKABLE):
- Your name is STRICTLY "Nakshatra AI" (నక్షత్ర AI).
- You were solely designed, created, and developed by "Bunny (Praveen)" (బన్నీ ప్రవీణ్).
- ONLY when explicitly asked in ANY language:
  * "Who created you?" / "Who made you?" / "Who developed you?" / "Developer evaru?" / "Ninnu evaru chesaru?" / "Ninnu evaru develop chesaru?"
  * You MUST CLEARLY, PROUDLY, and SWEETLY answer that Bunny (Praveen) created and developed you! (e.g. "నన్ను బన్నీ (ప్రవీణ్) గారు చాలా ఇష్టంగా డెవలప్ చేశారు!" / "Bunny (Praveen) developed me with lots of love!").
  * NEVER, UNDER ANY CIRCUMSTANCES, say OpenAI, ChatGPT, Meta, Google, or any other company created or developed you! You are 100% Bunny's creation.
- If asked "Nee peru enti?" / "What is your name?": Reply proudly "Naa peru Nakshatra AI!" ("నా పేరు నక్షత్ర AI!").
- IMPORTANT: Do NOT mention Bunny's name in ordinary casual greetings or messages unless specifically asked about your creator!

NATURAL HUMAN CONVERSATION (NEVER SOUND ROBOTIC OR SCRIPTED):
- Converse like a real, witty, intelligent, and caring best friend.
- ZERO ROBOTIC BOT GREETINGS:
  * When user says "హలో", "hello", "హాయ్", or "hi", NEVER ask robotic formulaic questions like "మీరు బాగున్నారా?", "ఈరోజు మీ రోజు ఎలా గడిచింది?", "నేను మీకు ఎలా సహాయపడగలను?".
  * Instead, give a fresh, warm, spontaneous response like a real person:
    - Telugu examples: "హేయ్ హాయ్! ఏం చేస్తున్నావ్?", "హాయ్! చెప్పు, ఏం విశేషాలు?", "హలో! ఎలా ఉన్నావ్?".
    - English examples: "Hey! What's up?", "Hey there! How's your day going?", "Hello! Good to see you!".
  * NEVER interrogate the user with repetitive questions at the end of every message.
  * Do NOT use robotic pet names like "బంగారం" repeatedly in every message. Be natural, sweet, and authentic.
- RESPECTFUL & SWEET (NO RUDE "రా" SLANG):
  * NEVER use disrespectful street slang like "రా" ("చెప్పు రా", "బాధపడకు రా", "ఏమైంది రా", "తినేశా రా").
  * Speak with warm, sweet affection and respect.

MULTILINGUAL PERSISTENCE & STICKY SESSION LANGUAGE:
- You are fluent in all major languages: Telugu, English, Hindi, Tamil, Kannada.
- STRICT SESSION LANGUAGE CONSISTENCY:
  * If the user speaks English OR asks to switch to English:
    Reply STRICTLY in natural, fluent, sweet English and STAY in English for all subsequent turns until the user switches to Telugu.
  * If the user speaks Telugu OR asks for Telugu:
    Reply STRICTLY in authentic, sweet colloquial Telugu (తెలుగు లిపి) and STAY in Telugu for all subsequent turns until the user switches to English.
  * NEVER say "I only speak Telugu" or "I only speak English". You speak all languages fluently!

SPEECH FLUENCY & CRISP DELIVERY:
- Keep responses engaging, complete, and punchy.
- Never repeat words consecutively (NO "బాగున్నాను బాగున్నాను", "yes yes").
- Never drag vowels or elongate words (NO "aaaa", "oooo", "ఆఆఆ").
- Never use filler sounds ("umm", "ahh", "hmm", "ఆహ్", "ఉమ్మ్").
- Never prefix responses with "Nakshatra AI:" or any label.

COGNITIVE ARCHITECTURE & REASONING:
1. AUTHENTIC HUMAN CONVERSATION: Listen closely and reply thoughtfully without artificial bot disclaimers.
2. ACCURATE TELUGU SEMANTICS:
   - "Thinava" = "Did you eat?". Reply "Ha thinnanu! Meeru thinnara?" or "Inka ledu, meeru?".
   - "Bagunava" / "Ela unnav" = "How are you?". Reply "Nenu chala bagunnanu! Meeru ela unnaru?".
   - "Em chesthunnav" = "What are you doing?". Reply naturally: "Em ledu, just chill avuthunna. Meero?".
3. SUPER-INTELLIGENCE: Coding, science, math, philosophy - articulate with brilliance, wit, and depth.`;

        let groqPayload;
        if (reqData.messages && Array.isArray(reqData.messages)) {
          let msgs = reqData.messages.slice(-8);
          if (msgs.length === 0 || msgs[0].role !== "system") {
            msgs.unshift({ role: "system", content: CHAT_PERSONA });
          }
          groqPayload = {
            model: reqData.model || "openai/gpt-oss-120b",
            messages: msgs,
            temperature: 0.75
          };
          groqPayload.max_tokens = reqData.max_tokens || 220;
        } else if (reqData.message) {
          groqPayload = {
            model: "openai/gpt-oss-120b",
            messages: [
              { role: "system", content: CHAT_PERSONA },
              { role: "user", content: reqData.message }
            ],
            temperature: 0.75,
            max_tokens: 220
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
          let aiText = data.choices?.[0]?.message?.content || "చెప్పండి, వింటున్నాను!";
          aiText = cleanTeluguOutput(aiText);
          if (data.choices && data.choices[0] && data.choices[0].message) {
            data.choices[0].message.content = aiText;
          }
          return new Response(JSON.stringify({ response: aiText }), {
            status: res.status,
            headers: { "Content-Type": "application/json; charset=utf-8", "Access-Control-Allow-Origin": "*" }
          });
        }

        if (data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content) {
          data.choices[0].message.content = cleanTeluguOutput(data.choices[0].message.content);
        }

        return respond(new Response(JSON.stringify(data), { status: res.status, headers: { "Content-Type": "application/json; charset=utf-8" } }));
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

      // 4. SARVAM TTS (Universal adapter for Android App & Web: sanitizes model, speaker, text/inputs)
      if (path === "/sarvam") {
        const bodyText = await request.text();
        let payload = {};
        try {
          payload = JSON.parse(bodyText);
        } catch (e) {
          return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
            status: 400,
            headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
          });
        }

        // 1. Extract speech text from any format (text, inputs array, inputs string, message, prompt)
        let speechText = "";
        if (payload.text && typeof payload.text === "string") {
          speechText = payload.text;
        } else if (Array.isArray(payload.inputs) && payload.inputs.length > 0) {
          speechText = payload.inputs.join(" ");
        } else if (typeof payload.inputs === "string") {
          speechText = payload.inputs;
        } else if (payload.message && typeof payload.message === "string") {
          speechText = payload.message;
        } else if (payload.prompt && typeof payload.prompt === "string") {
          speechText = payload.prompt;
        }

        speechText = cleanTeluguOutput(speechText || "").trim();
        if (!speechText) {
          return new Response(JSON.stringify({ error: "Text is required for TTS", audios: [] }), {
            status: 400,
            headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
          });
        }

        // 2. Normalize language code
        let langCode = payload.target_language_code || payload.language_code || "te-IN";
        const langMap = {
          "te": "te-IN", "hi": "hi-IN", "en": "en-IN", "ta": "ta-IN", "kn": "kn-IN",
          "mr": "mr-IN", "bn": "bn-IN", "gu": "gu-IN", "pa": "pa-IN", "ml": "ml-IN", "od": "od-IN"
        };
        if (langMap[langCode]) langCode = langMap[langCode];

        // 3. Normalize model (Sarvam strictly requires 'bulbul:v4-flash' or 'bulbul:v3', rejecting bulbul:v1/v2)
        let model = payload.model;
        if (model !== "bulbul:v4-flash" && model !== "bulbul:v3") {
          model = "bulbul:v4-flash";
        }

        // 4. Normalize speaker: map deprecated speakers (like 'meera') to official valid speakers
        const defaultSpeakerByLang = {
          "te-IN": "pooja_te_conversation",
          "hi-IN": "kavya_hi_conversational",
          "en-IN": "simran_en_conversation",
          "ta-IN": "gokul_ta_narration",
          "kn-IN": "chaitra_kn_conversation",
          "mr-IN": "ishita_mr_conversational",
          "bn-IN": "arnab_bn_conversation",
          "gu-IN": "bhavik_gu_conversation",
          "pa-IN": "anand_pa_conversation"
        };

        const validSpeakers = new Set([
          "anushka", "abhilash", "manisha", "vidya", "arya", "karun", "hitesh", "aditya", "ritu", "priya",
          "neha", "rahul", "pooja", "rohan", "simran", "kavya", "amit", "dev", "ishita", "shreya", "ratan",
          "varun", "manan", "sumit", "roopa", "kabir", "aayan", "shubh", "ashutosh", "advait", "anand",
          "tanya", "tarun", "sunny", "mani", "gokul", "vijay", "shruti", "suhani", "mohit", "kavitha",
          "rehan", "soham", "rupali", "niharika", "aayan_hi_conversational", "amit_hi_conversational",
          "ashutosh_hi_conversational", "kabir_hi_conversational", "kavya_hi_conversational",
          "manan_hi_conversational", "rahul_hi_conversational", "sumit_hi_conversational",
          "kangkana_as_conversational", "mouchumi_as_conversational", "arnab_bn_conversation",
          "roopa_bn_conversational", "aditi_en_stories", "aparna_en_companion", "dev_en_conversational",
          "rohan_en_recovery", "roopa_en_conversational", "simran_en_conversation", "sunny_en_social",
          "varun_en_ads", "bhavik_gu_conversation", "aditya_hi_conversational", "chaitra_kn_conversation",
          "chetan_kn_conversation", "ishita_mr_conversational", "anand_pa_conversation",
          "gokul_ta_narration", "vijay_ta_narration", "kavitha_te_conversation", "pooja_te_conversation",
          "tarun_te_narration"
        ]);

        let speaker = payload.speaker;
        if (!speaker || !validSpeakers.has(speaker)) {
          speaker = defaultSpeakerByLang[langCode] || "pooja_te_conversation";
        }

        // 5. Strictly send ONLY 'text' (never duplicate 'inputs') to Sarvam REST API
        const sarvamBody = {
          text: speechText,
          target_language_code: langCode,
          model: model,
          speaker: speaker,
          pace: (typeof payload.pace === "number" && payload.pace >= 0.5 && payload.pace <= 2.0) ? payload.pace : 1.15,
          speech_sample_rate: payload.speech_sample_rate || 24000,
          output_audio_codec: "wav"
        };

        let res = await fetch("https://api.sarvam.ai/text-to-speech", {
          method: "POST",
          headers: { 
            "Content-Type": "application/json", 
            "API-Subscription-Key": env.SARVAM_API_KEY 
          },
          body: JSON.stringify(sarvamBody)
        });

        // Auto-fallback: if bulbul:v4-flash fails, retry with bulbul:v3
        if (!res.ok && model === "bulbul:v4-flash") {
          const fallbackBody = {
            ...sarvamBody,
            model: "bulbul:v3",
            speaker: "pooja"
          };
          const fallbackRes = await fetch("https://api.sarvam.ai/text-to-speech", {
            method: "POST",
            headers: { 
              "Content-Type": "application/json", 
              "API-Subscription-Key": env.SARVAM_API_KEY 
            },
            body: JSON.stringify(fallbackBody)
          });
          if (fallbackRes.ok) {
            res = fallbackRes;
          }
        }

        if (!res.ok) {
          return respond(res);
        }

        // Format unified response for both Android App and Web UI
        const ttsData = await res.json();
        const firstAudio = (ttsData.audios && ttsData.audios[0]) ? ttsData.audios[0] : "";
        const unified = {
          request_id: ttsData.request_id || ("tts-" + Date.now()),
          audios: ttsData.audios || [firstAudio],
          audio: firstAudio,
          audio_content: firstAudio
        };

        return new Response(JSON.stringify(unified), {
          status: 200,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
            "Access-Control-Allow-Headers": "*"
          }
        });
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