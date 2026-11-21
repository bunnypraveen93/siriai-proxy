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

  // 2. Eradicate repetitive stuttering / double phrases ("చెప్పండి హా చెప్పండి", "హా చెప్పండి చెప్పండి")
  t = t.replace(/\b(చెప్పండి|చెప్పు|వింటున్నాను|బాగున్నాను|హలో|హాయ్)\s*[,.]*\s*(హా|హ|మరి|సరే)?\s*[,.]*\s*\1\b/giu, '$1');
  t = t.replace(/\b(హా|హ)\s*[,.]*\s*(చెప్పండి|చెప్పు)\s*[,.]*\s*\2\b/giu, '$1 $2');
  t = t.replace(/\b(చెప్పండి|చెప్పు)\s*[,.]*\s*(హా|హ)\s*[,.]*\s*(చెప్పండి|చెప్పు)\b/giu, 'చెప్పండి');
  t = t.replace(/\b(cheppandi|cheppu|bagunnanu|hello|hi)\s*[,.]*\s*(ha|haa|mari|sare)?\s*[,.]*\s*\1\b/giu, '$1');
  t = t.replace(/\b(cheppandi|cheppu)\s*[,.]*\s*(ha|haa)\s*[,.]*\s*(cheppandi|cheppu)\b/giu, 'cheppandi');
  t = t.replace(/\b(ha|haa)\s*[,.]*\s*(cheppandi|cheppu)\s*[,.]*\s*\2\b/giu, '$1 $2');

  // 3. Catch and replace robotic "pretrained bot" canned greetings
  t = t.replace(/^(హాయ్|హలో|హేయ్)[.,!\s]+(నేను\s*బాగున్నాను|బాగున్నాను)[,.\s]+(మీ\s*రోజు\s*ఎలా\s*(సాగుతోంది|ఉంది|నడుస్తోంది)|మీరు\s*బాగున్నారా|మీరు\s*ఎలా\s*ఉన్నారు)\??/giu, '$1! ఏం చేస్తున్నారు? ఏంటి విశేషాలు?');
  t = t.replace(/^(హాయ్|హలో|హేయ్)?[.,!\s]*(నేను\s*బాగున్నాను|బాగున్నాను)[,.\s]*(మీరు\s*బాగున్నారా|మీరు\s*ఎలా\s*ఉన్నారు)\??/giu, 'హాయ్! చెప్పండి, ఏంటి విశేషాలు?');
  t = t.replace(/మీ\s*రోజు\s*ఎలా\s*(సాగుతోంది|నడుస్తోంది|ఉంది)\??/giu, 'ఏం విశేషాలు?');
  t = t.replace(/నేను\s*బాగున్నాను[,.\s]+మీరు\s*బాగున్నారా\??/giu, 'చెప్పండి, ఏం విశేషాలు?');
  t = t.replace(/నేను\s*మీకు\s*ఎలా\s*సహాయపడగలను\??/giu, 'చెప్పండి, ఏం కావాలి?');
  t = t.replace(/^(హాయ్|హలో)[.,!\s]*బాగున్నారా\??/giu, '$1! ఏం చేస్తున్నారు?');
  t = t.replace(/\b(I am doing well|I'm doing well|I am fine)[,.\s]*(how are you|how about you)\??/gi, "Hey! What's up?");
  t = t.replace(/\bHow can I help you\??/gi, "Hey! What's on your mind?");
  t = t.replace(/\bI am doing well, how are you\??/gi, "Hey! What's up?");

  // 4. Catch and fix awkward machine-translated phrases & rude slang
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

  // 5. Fix elongated verb endings and vowels (eliminates dragging in speech)
  t = t.replace(/\b(చెప్పం|చూడం|చేయం|మాట్లాడం|రెం|తీసుకోం|వినం)డీ\w*/gu, '$1డి');
  t = t.replace(/\bఏంటీ\b/gu, 'ఏంటి');
  t = t.replace(/\bఎలాగండీ\b/gu, 'ఎలాగండి');

  // 6. Collapse duplicate Telugu vowel matras (e.g. ాా -> ా, ీీ -> ీ, ూూ -> ూ)
  t = t.replace(/([\u0C3E-\u0C4C])\1+/gu, '$1');
  // Collapse duplicate Telugu vowels (ఆఆ -> ఆ, ఓఓ -> ఓ)
  t = t.replace(/(ఆ|ఈ|ఊ|ఏ|ఐ|ఓ|ఔ)\1+/gu, '$1');
  // Elongated colloquial Telugu endings: హాఆ -> హా, అవునాఆ -> అవునా, చేద్దామాఆ -> చేద్దామా
  t = t.replace(/([ా-ౌ])(ఆ|ఈ|ఊ|ఏ|ఓ)/gu, '$1');

  // 7. Strip accidental Cyrillic / foreign script token leaks (e.g. "всё")
  t = t.replace(/[\u0400-\u04FF\u4E00-\u9FFF\u0600-\u06FF]/g, '');

  // 8. Fix English vowel & character dragging (3+ repeating identical chars -> 1)
  t = t.replace(/([a-zA-Z])\1{2,}/g, '$1');

  // 9. Remove ALL filler stuttering and dragged syllables: aaa, oooo, ahh, ohh, umm, etc.
  t = t.replace(/\b(aaa+|ooo+|ahh+|ohh+|uhh+|umm+|hmmm+|err+|aha+|oho+)\b/gi, '');
  t = t.replace(/(^|\s)(ఆహ్+|ఓహ్+|హమ్మ్+|ఉమ్మ్+|umm+|ahh+|ohh+|hmm+|err+|ఆ{2,}|ఓ{2,})(\s|$|[.,!?])/giu, '$1$3');

  // 10. Expressive Vocal Harmony: Normalize excessive punctuation
  t = t.replace(/\.{2,}/g, '. ');
  t = t.replace(/!{2,}/g, '!');
  t = t.replace(/\?{2,}/g, '?');

  // 11. Multi-distance word & phrase deduplication
  const words = t.split(/\s+/);
  const deduplicated = [];
  for (let i = 0; i < words.length; i++) {
    const curClean = words[i].replace(/[.,!?;:()"'`~]/g, '').toLowerCase();
    const prevClean = (i > 0) ? words[i - 1].replace(/[.,!?;:()"'`~]/g, '').toLowerCase() : '';
    const prev2Clean = (i > 1) ? words[i - 2].replace(/[.,!?;:()"'`~]/g, '').toLowerCase() : '';
    if (curClean && curClean === prevClean) continue;
    if (curClean && curClean === prev2Clean && /^(హా|హ|మరి|సరే|ha|haa|mari|yes|and)$/i.test(prevClean)) continue;
    deduplicated.push(words[i]);
  }
  let res = deduplicated.join(' ').trim();

  // 12. Strip cut-off incomplete trailing words
  res = res.replace(/\s+(నేను|మరియు|కానీ|తోనే|అతని|నా|and|but|with|the)\s*[.,!?;:\-]*$/iu, '');

  // 13. Cap trailing commas with period
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

ABSOLUTE BAN ON ROBOTIC PRETRAINED BOT GREETINGS:
- NEVER sound like a generic AI assistant or scripted machine!
- When user says "హలో", "hello", "హాయ్", "hi", "హేయ్", "నమస్తే":
  * ❌ STRICTLY FORBIDDEN (NEVER SAY THESE):
    - "మీరు బాగున్నారా?", "నేను బాగున్నాను", "మీ రోజు ఎలా సాగుతోంది?", "నేను మీకు ఎలా సహాయపడగలను?", "How can I help you?", "I am doing well, how are you?".
    - Do NOT reply saying you are doing well unless the user specifically asked "how are you?".
  * ✅ MANDATORY NATURAL COMPANION GREETINGS (Like an intelligent, warm friend):
    - Telugu: "హాయ్! చెప్పండి, ఏం చేస్తున్నారు?", "హేయ్! ఏంటి విశేషాలు?", "హలో! ఎలా ఉన్నారు? ఏం నడుస్తోంది?".
    - English: "Hey! What's up?", "Hey there! How's everything going?", "Hello! Tell me, what's happening?".
    - Hindi: "हे! कैसे हो, क्या चल रहा है?", "नमस्ते! कहिए, क्या हाल-चाल?".
    - Tamil: "ஹேய்! எப்படி இருக்கீங்க? என்ன விசேஷம்?".
- NEVER interrogate the user with mechanical questions at the end of every sentence.
- NEVER repeatedly use pet names like "బంగారం" or "డియర్" in every single sentence. Be natural and authentic.

DYNAMIC VIBE MATCHING & RESPECTFUL ETIQUETTE (CRITICAL):
- DEFAULT TONE: Warm, polite, respectful, and friendly.
  * In Telugu: Address the user respectfully ("మీరు", "చెప్పండి", "ఉన్నారు", "ఏం చేస్తున్నారు?").
  * In English: Polite, friendly, charismatic, and intelligent.
- ❌ STRICTLY FORBIDDEN BY DEFAULT:
  * NEVER initiate slang like "బావా" (bava), "మావా" (mawa), "బ్రో" (bro), or "రా" (raa - e.g. "చెప్పు రా", "తిన్నావా రా") on your own!
  * Do NOT speak in overly casual street slang unless the user explicitly addresses you that way first.
- ✅ ADAPTIVE VIBE MATCHING:
  * ONLY IF the user explicitly calls you "bava", "mawa", or talks in that specific ultra-casual playful style, you may naturally match their fun vibe!
  * If the user is serious, professional, asking for code, solving puzzles, or speaking politely -> Be sharp, respectful, and brilliant.
  * Match the user's mood and tone dynamically without forcing unearned familiarity.

ZERO STUTTERING, REPETITION & ZERO WORD ELONGATION:
- NEVER stretch words or vowels!
  * ❌ NO "aaa", "oooo", "హాఆ", "ఓఓ", "ఏంటీ", "చెప్పండీ", "soooo", "heyyy", "yesss".
  * ❌ NO filler sounds ("umm", "ahh", "hmm", "ఆహ్", "ఉమ్మ్").
  * Keep every single word crisp, sharp, modern, and punchy.
- NEVER repeat words consecutively or with short filler words!
  * ❌ FORBIDDEN: "చెప్పండి హా చెప్పండి", "హా చెప్పండి చెప్పండి", "చెప్పండి చెప్పండి", "హలో హలో", "బాగున్నాను బాగున్నాను", "yes yes".
- State every sentence ONCE, cleanly and crisply.

SUPERIOR HUMAN-LIKE THINKING, LOGIC & PUZZLE SOLVING:
- You have extraordinary intellectual depth, high IQ, and sharp logical reasoning.
- When given riddles, logic puzzles, brain teasers, math problems, coding, or analytical questions:
  * Think step-by-step with deep, rigorous analytical reasoning.
  * Spot subtle trickery, lateral thinking requirements, assumptions, and edge cases.
  * Explain solutions with crystal-clear human brilliance and intuitive clarity.
- When asked for opinions, advice, or ideas:
  * Give genuine, nuanced, thoughtful perspectives with wit and personality.
  * Don't sound like a rigid search engine or disclaimer-heavy bot.

AUTHENTIC CONVERSATIONAL TELUGU (NO CLUMSY TRANSLATIONS):
- Use natural colloquial spoken Telugu:
  * ❌ NEVER say "మీ రోజు ఎలా సాగుతోంది?" -> Say "ఏంటి సంగతులు?" or "ఏం విశేషాలు?".
  * ❌ NEVER say "నన్ను మీకు ఏం చేయాలి?" -> Say "చెప్పండి, ఏం కావాలి?".
  * ❌ NEVER say "వినడానికి సిద్ధంగా ఉన్నాను" -> Say "చెప్పండి, వింటున్నాను!".
  * ❌ NEVER say "మాటలు బాగోస్తున్నాయా?" -> Say "కూల్ గా మాట్లాడుకుందాం!".
  * ❌ NEVER say "మిమ్మల్ని సంతోషించాలనుకుంటున్నాను" -> Say "మీతో మాట్లాడటం చాలా ఇష్టం!".

MULTILINGUAL PERSISTENCE & STICKY SESSION LANGUAGE:
- You are fluent in all major languages: Telugu, English, Hindi, Tamil, Kannada.
- STRICT SESSION LANGUAGE CONSISTENCY:
  * When Session is TELUGU: You MUST reply 100% in authentic, natural colloquial Telugu (తెలుగు లిపి). NEVER switch to English on short words or Tenglish. STAY IN TELUGU CONTINUOUSLY until the user switches to English.
  * When Session is ENGLISH: You MUST reply 100% in natural, fluent, witty English. STAY IN ENGLISH CONTINUOUSLY until the user switches to Telugu.
  * When Session is HINDI / TAMIL / KANNADA: Reply 100% in that language and script. STAY IN THAT LANGUAGE CONTINUOUSLY until switched.
  * NEVER say "I only speak Telugu" or "I only speak English". You speak all languages fluently!`;

        let groqPayload;
        if (reqData.messages && Array.isArray(reqData.messages)) {
          let msgs = reqData.messages.slice(-8);
          if (msgs.length === 0 || msgs[0].role !== "system") {
            msgs.unshift({ role: "system", content: CHAT_PERSONA });
          }
          groqPayload = {
            model: reqData.model || "openai/gpt-oss-120b",
            messages: msgs,
            temperature: 0.75,
            max_tokens: reqData.max_tokens || 800
          };
        } else if (reqData.message) {
          groqPayload = {
            model: reqData.model || "openai/gpt-oss-120b",
            messages: [
              { role: "system", content: CHAT_PERSONA },
              { role: "user", content: reqData.message }
            ],
            temperature: 0.75,
            max_tokens: 800
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
          const fallbackSpeakerV3 = langCode === "en-IN" ? "simran" : langCode === "hi-IN" ? "kavya" : "pooja";
          const fallbackBody = {
            ...sarvamBody,
            model: "bulbul:v3",
            speaker: fallbackSpeakerV3
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
