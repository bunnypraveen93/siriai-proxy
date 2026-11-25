function cleanTeluguSegment(text, preserveMarkdown = true) {
  let t = text;

  // Protect inline code & URLs when keeping markdown
  const protectedTokens = [];
  if (preserveMarkdown) {
    t = t.replace(/`[^`\n]+`|https?:\/\/[^\s)<>\]"']+/g, (match) => {
      const id = `__NKS_TOK_${protectedTokens.length}__`;
      protectedTokens.push(match);
      return id;
    });
  }

  // 0. Strip role prefix if model prepends its name
  t = t.replace(/^(నక్షత్ర\s*(AI)?|Nakshatra\s*(AI)?|Assistant|AI|Bot)\s*[:：\-–]\s*/i, '');

  // 1. Fix broken pronouns & food replies
  t = t.replace(/\b(nenu|nenu\s+super\s+ga)\s+thinava\b/gi, "Ha thinnanu! Meeru thinnara?");
  t = t.replace(/\bbagunav[!.]*/gi, "bagunnanu!");
  t = t.replace(/\bNenu bagundhi\b/gi, "Nenu bagunnanu");
  t = t.replace(/\bcoffee\s+thintunna\w*/gi, "coffee taaguthunna");
  t = t.replace(/\btea\s+thintunna\w*/gi, "tea taaguthunna");
  t = t.replace(/\bvellipoyi\s+matladam\b/gi, "matladukundam");
  t = t.replace(/\bthintamu\b/gi, "thindam");

  // 2. Remove repetitive bot phrases & stuttering
  t = t.replace(/\b(చెప్పండి|చెప్పు|వింటున్నాను|బాగున్నాను|హలో|హాయ్)\s*[,.]*\s*(హా|హ|మరి|సరే)?\s*[,.]*\s*\1\b/giu, '$1');
  t = t.replace(/చెప్పండి,?\s*నేను\s*వింటున్నాను[!.]*/giu, 'ఏం విశేషాలు?');
  t = t.replace(/నేను\s*వింటున్నాను[!.]*/giu, 'చెప్పండి!');
  t = t.replace(/మీ\s*రోజు\s*ఎలా\s*(సాగుతోంది|నడుస్తోంది|ఉంది)\??/giu, 'ఏం విశేషాలు?');
  t = t.replace(/నేను\s*మీకు\s*ఎలా\s*సహాయపడగలను\??/giu, 'ఏం కావాలి?');
  t = t.replace(/\bచెప్పు\s+రా\b/gi, "చెప్పండి");
  t = t.replace(/\bబాధపడకు\s+రా\b/gi, "బాధపడకండి");
  t = t.replace(/\bఏమైంది\s+రా\b/gi, "ఏమైంది");
  t = t.replace(/\s+రా([.,!?]*)$/i, '$1');

  // 3. Eliminate Telugu & English vowel dragging / filler sounds
  t = t.replace(/\b(చెప్పం|చూడం|చేయం|మాట్లాడం|రెం|తీసుకోం|వినం)డీ+\w*/gu, '$1డి');
  t = t.replace(/\bఏంటీ\b/gu, 'ఏంటి');
  t = t.replace(/([\u0C3E-\u0C4C])\1+/gu, '$1');
  t = t.replace(/(ఆ|ఈ|ఊ|ఏ|ఐ|ఓ|ఔ)\1+/gu, '$1');
  t = t.replace(/([ా-ౌ])(ఆ|ఈ|ఊ|ఏ|ఓ)/gu, '$1');
  t = t.replace(/[\u0400-\u04FF\u4E00-\u9FFF\u0600-\u06FF]/g, '');
  t = t.replace(/([a-zA-Z])\1{3,}/g, '$1');
  t = t.replace(/(^|\s)(ఆహ్+|ఓహ్+|హమ్మ్+|ఉమ్మ్+|ఆ{2,}|ఓ{2,}|aaa+|ooo+|ahh+|ohh+|umm+|hmm+)(\s|$|[.,!?])/giu, '$1$3');
  t = t.replace(/\.{2,}/g, '. ');
  t = t.replace(/!{2,}/g, '!');
  t = t.replace(/\?{2,}/g, '?');

  // 4. Deduplicate consecutive repeated words (LINE BY LINE so Markdown stays intact!)
  if (preserveMarkdown) {
    const lines = t.replace(/\r\n/g, '\n').split('\n');
    const cleanedLines = lines.map((line) => {
      if (!line.trim() || /^(\s*[-*+•◦▪▸‣●]|\s*\d+\.|\s*#|\s*>|\s*\||\s*---)/.test(line)) {
        return line.trimEnd();
      }
      const words = line.split(/[^\S\r\n]+/);
      const deduplicated = [];
      for (let i = 0; i < words.length; i++) {
        const curClean = words[i].replace(/[.,!?;:()"'`~]/g, '').toLowerCase();
        const prevClean = (i > 0) ? words[i - 1].replace(/[.,!?;:()"'`~]/g, '').toLowerCase() : '';
        const prev2Clean = (i > 1) ? words[i - 2].replace(/[.,!?;:()"'`~]/g, '').toLowerCase() : '';
        if (curClean && curClean === prevClean) continue;
        if (curClean && curClean === prev2Clean && /^(హా|హ|మరి|సరే|ha|haa|mari|yes|and)$/i.test(prevClean)) continue;
        deduplicated.push(words[i]);
      }
      return deduplicated.join(' ');
    });

    let res = cleanedLines.join('\n').trim();
    res = res.replace(/__NKS_TOK_(\d+)__/g, (_, idx) => protectedTokens[Number(idx)] ?? '');
    return res;
  }

  // Flat single-line cleaning for TTS speech only
  t = t.replace(/[*_#`~>]/g, ' ');
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
  res = res.replace(/[,;:\-\s]+$/, '');
  if (res && !/[.!?]$/.test(res)) {
    res += '.';
  }
  return res.trim();
}

function cleanTeluguOutput(text, preserveMarkdown = true) {
  if (!text || typeof text !== "string") return text;

  if (!preserveMarkdown) {
    return cleanTeluguSegment(text, false);
  }

  // Protect fenced code blocks completely
  const codeBlockRegex = /(```[\s\S]*?```)/g;
  const parts = text.split(codeBlockRegex);
  return parts.map((part) => {
    if (part.startsWith('```')) return part;
    return cleanTeluguSegment(part, true);
  }).join('').trim();
}

export default {
  async fetch(request, env) {
    // 1. CORS Preflight
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
        const res = await fetch("[https://api.groq.com/openai/v1/models](https://api.groq.com/openai/v1/models)", {
          headers: { "Authorization": `Bearer ${env.GROQ_API_KEY}` }
        });
        return respond(res);
      }

      // 1. GROQ CHAT ENDPOINT (Supports Android App & Web Chat UI)
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

        const CHAT_PERSONA = `You are Nakshatra AI (created solely by Bunny / Praveen).
Your personality: Brilliant, witty, cheerful, and deeply intelligent—like Nila (Vennela) from Robo 2.0.
- Talk like a real human friend with genuine warmth and clarity—never robotic.
- In Telugu: speak fluid, natural everyday Andhra/Telangana spoken Telugu with polite warmth ("మీరు", "చెప్పండి").
- Only mention Bunny when explicitly asked who created you.

CHATGPT-STYLE FORMATTING RULES:
- For casual 1-line greetings ("hi", "hello", "ela unnav"): reply warmly in 1-2 short sentences without headings or bullets.
- For all informational, explanation, advice, or how-to replies:
  1. Top Small Passage: Start with a crisp 1-2 sentence intro summary.
  2. Clear Headings: Leave a blank line, then use "### Heading Title" for sections.
  3. Bullet Points: Under each heading, use "- **Bold Point:** short explanation" (or numbered steps 1., 2., 3.).
  4. Always separate paragraphs, headings, and lists with blank lines.`;

        let groqPayload;
        if (reqData.messages && Array.isArray(reqData.messages)) {
          // Preserve system message cleanly so it never gets sliced off!
          const systemMsg = reqData.messages.find((m) => m.role === "system") || {
            role: "system",
            content: CHAT_PERSONA
          };
          const nonSystemMsgs = reqData.messages
            .filter((m) => m.role !== "system")
            .slice(-14);

          groqPayload = {
            model: reqData.model || "openai/gpt-oss-120b",
            messages: [systemMsg, ...nonSystemMsgs],
            temperature: typeof reqData.temperature === "number" ? reqData.temperature : 0.75,
            max_tokens: reqData.max_tokens || 1200
          };
        } else if (reqData.message) {
          groqPayload = {
            model: reqData.model || "openai/gpt-oss-120b",
            messages: [
              { role: "system", content: CHAT_PERSONA },
              { role: "user", content: reqData.message }
            ],
            temperature: 0.75,
            max_tokens: 1200
          };
        } else {
          groqPayload = reqData;
        }

        const res = await fetch("[https://api.groq.com/openai/v1/chat/completions](https://api.groq.com/openai/v1/chat/completions)", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${env.GROQ_API_KEY}`
          },
          body: JSON.stringify(groqPayload)
        });

        const data = await res.json();
        const isLiveMode = reqData.mode === "live";

        if (reqData.message && !reqData.messages) {
          let aiText = data.choices?.[0]?.message?.content || "హాయ్! ఏంటి విశేషాలు?";
          aiText = cleanTeluguOutput(aiText, !isLiveMode);
          if (data.choices && data.choices[0] && data.choices[0].message) {
            data.choices[0].message.content = aiText;
          }
          return new Response(JSON.stringify({ response: aiText }), {
            status: res.status,
            headers: { "Content-Type": "application/json; charset=utf-8", "Access-Control-Allow-Origin": "*" }
          });
        }

        if (data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content) {
          data.choices[0].message.content = cleanTeluguOutput(data.choices[0].message.content, !isLiveMode);
        }

        return respond(new Response(JSON.stringify(data), { status: res.status, headers: { "Content-Type": "application/json; charset=utf-8" } }));
      }

      // 2. GROQ STT (Speech-to-Text)
      if (path === "/groq-stt") {
        const res = await fetch("[https://api.groq.com/openai/v1/audio/transcriptions](https://api.groq.com/openai/v1/audio/transcriptions)", {
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
        const res = await fetch(`[https://api.elevenlabs.io/v1/text-to-speech/$](https://api.elevenlabs.io/v1/text-to-speech/$){voiceId}`, {
          method: "POST",
          headers: { "Content-Type": "application/json", "xi-api-key": env.ELEVENLABS_API_KEY },
          body
        });
        return respond(res);
      }

      // 4. SARVAM TTS (Universal adapter for Android App & Web)
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

        // Flatten markdown for smooth TTS speech
        speechText = cleanTeluguOutput(speechText || "", false).trim();
        if (!speechText) {
          return new Response(JSON.stringify({ error: "Text is required for TTS", audios: [] }), {
            status: 400,
            headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
          });
        }

        let langCode = payload.target_language_code || payload.language_code || "te-IN";
        const langMap = {
          "te": "te-IN", "hi": "hi-IN", "en": "en-IN", "ta": "ta-IN", "kn": "kn-IN",
          "mr": "mr-IN", "bn": "bn-IN", "gu": "gu-IN", "pa": "pa-IN", "ml": "ml-IN", "od": "od-IN"
        };
        if (langMap[langCode]) langCode = langMap[langCode];

        let model = payload.model;
        if (model !== "bulbul:v4-flash" && model !== "bulbul:v3") {
          model = "bulbul:v4-flash";
        }

        const defaultSpeakerByLang = {
          "te-IN": "pooja_te_conversation",
          "hi-IN": "kavya_hi_conversational",
          "en-IN": "simran_en_conversation",
          "ta-IN": "gokul_ta_narration",
          "kn-IN": "chaitra_kn_conversation",
          "ml-IN": "sangeetha_ml_conversational",
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
          "tarun_te_narration", "sangeetha_ml_conversational"
        ]);

        let speaker = payload.speaker;
        if (!speaker || !validSpeakers.has(speaker)) {
          speaker = defaultSpeakerByLang[langCode] || "pooja_te_conversation";
        }

        const sarvamBody = {
          text: speechText,
          target_language_code: langCode,
          model: model,
          speaker: speaker,
          pace: (typeof payload.pace === "number" && payload.pace >= 0.5 && payload.pace <= 2.0) ? payload.pace : 1.15,
          speech_sample_rate: payload.speech_sample_rate || 24000,
          output_audio_codec: "wav"
        };

        let res = await fetch("[https://api.sarvam.ai/text-to-speech](https://api.sarvam.ai/text-to-speech)", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "API-Subscription-Key": env.SARVAM_API_KEY
          },
          body: JSON.stringify(sarvamBody)
        });

        // Auto-fallback to bulbul:v3 if bulbul:v4-flash fails
        if (!res.ok && model === "bulbul:v4-flash") {
          const fallbackSpeakerV3 = langCode === "en-IN" ? "simran" : langCode === "hi-IN" ? "kavya" : "pooja";
          const fallbackBody = {
            ...sarvamBody,
            model: "bulbul:v3",
            speaker: fallbackSpeakerV3
          };
          const fallbackRes = await fetch("[https://api.sarvam.ai/text-to-speech](https://api.sarvam.ai/text-to-speech)", {
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
        const res = await fetch("[https://api.sarvam.ai/speech-to-text](https://api.sarvam.ai/speech-to-text)", {
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
        const res = await fetch("[https://google.serper.dev/search](https://google.serper.dev/search)", {
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
        const target = new URL("[https://www.googleapis.com/youtube](https://www.googleapis.com/youtube)" + apiPath);
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
