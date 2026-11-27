/**
 * Nakshatra AI - Cloudflare Worker Backend & Intelligence Pipeline
 * Spec Version: 1.0.0 (22 Nov 2026) - Companion to nakshatra_ai_config.json
 * 
 * Capabilities:
 * 1. Multilingual Intelligence Layer (Telugu, Hindi, Tamil, Malayalam, Kannada, English, Romanized)
 * 2. Unicode script-based Language Detection with Romanized support
 * 3. Dynamic Tier Routing (light: 8b, standard: 70b, deep: 120b)
 * 4. Language-Aware Token Output Caps (te: 4x, hi: 2.5x, ta: 4x, ml: 5x, en: 1x)
 * 5. Real-Time Web Search Grounding via Serper API with deduplication & date injection
 * 6. Completion Guard: Auto-continuation on length limits & stream resilience
 * 7. Authentic Conversational Output Cleaner (cleanTeluguOutput & multi-language vocal harmony)
 * 8. Full Audio Proxies (Sarvam TTS/STT, ElevenLabs TTS, Groq Whisper STT, YouTube API)
 */

const NAKSHATRA_CONFIG = {
  meta: {
    name: "Nakshatra AI",
    config_version: "1.2.0",
    prompt_version: "v1.3",
    updated: "2026-11-27"
  },
  languages: {
    default: "en",
    supported: [
      { code: "te", name: "Telugu", script: "Telugu", unicode_regex: /[\u0C00-\u0C7F]/g, respectful_you: "మీరు", speech_locale: "te-IN", token_multiplier: 4.0 },
      { code: "hi", name: "Hindi", script: "Devanagari", unicode_regex: /[\u0900-\u097F]/g, respectful_you: "आप", speech_locale: "hi-IN", token_multiplier: 2.5 },
      { code: "mr", name: "Marathi", script: "Devanagari", unicode_regex: /[\u0900-\u097F]/g, respectful_you: "तुम्ही", speech_locale: "mr-IN", token_multiplier: 2.5 },
      { code: "ta", name: "Tamil", script: "Tamil", unicode_regex: /[\u0B80-\u0BFF]/g, respectful_you: "நீங்கள்", speech_locale: "ta-IN", token_multiplier: 4.0 },
      { code: "ml", name: "Malayalam", script: "Malayalam", unicode_regex: /[\u0D00-\u0D7F]/g, respectful_you: "നിങ്ങൾ", speech_locale: "ml-IN", token_multiplier: 5.0 },
      { code: "kn", name: "Kannada", script: "Kannada", unicode_regex: /[\u0C80-\u0CFF]/g, respectful_you: "ನೀವು", speech_locale: "kn-IN", token_multiplier: 4.0 },
      { code: "bn", name: "Bengali", script: "Bengali", unicode_regex: /[\u0980-\u09FF]/g, respectful_you: "আপনি", speech_locale: "bn-IN", token_multiplier: 3.5 },
      { code: "gu", name: "Gujarati", script: "Gujarati", unicode_regex: /[\u0A80-\u0AFF]/g, respectful_you: "તમે", speech_locale: "gu-IN", token_multiplier: 3.5 },
      { code: "pa", name: "Punjabi", script: "Gurmukhi", unicode_regex: /[\u0A00-\u0A7F]/g, respectful_you: "ਤੁਸੀਂ", speech_locale: "pa-IN", token_multiplier: 3.5 },
      { code: "or", name: "Odia", script: "Odia", unicode_regex: /[\u0B00-\u0B7F]/g, respectful_you: "ଆପଣ", speech_locale: "od-IN", token_multiplier: 4.0 },
      { code: "es", name: "Spanish", script: "Latin", unicode_regex: null, respectful_you: "usted", speech_locale: "es-ES", token_multiplier: 1.2 },
      { code: "fr", name: "French", script: "Latin", unicode_regex: null, respectful_you: "vous", speech_locale: "fr-FR", token_multiplier: 1.2 },
      { code: "de", name: "German", script: "Latin", unicode_regex: null, respectful_you: "Sie", speech_locale: "de-DE", token_multiplier: 1.2 },
      { code: "ar", name: "Arabic", script: "Arabic", unicode_regex: /[\u0600-\u06FF]/g, respectful_you: "", speech_locale: "ar-SA", token_multiplier: 2.5 },
      { code: "ja", name: "Japanese", script: "Japanese", unicode_regex: /[\u3040-\u30FF]/g, respectful_you: "", speech_locale: "ja-JP", token_multiplier: 2.0 },
      { code: "ko", name: "Korean", script: "Korean", unicode_regex: /[\uAC00-\uD7AF]/g, respectful_you: "", speech_locale: "ko-KR", token_multiplier: 2.0 },
      { code: "zh", name: "Chinese", script: "Chinese", unicode_regex: /[\u4E00-\u9FFF]/g, respectful_you: "", speech_locale: "zh-CN", token_multiplier: 1.5 },
      { code: "en", name: "English", script: "Latin", unicode_regex: /[a-zA-Z]/g, respectful_you: "you", speech_locale: "en-IN", token_multiplier: 1.0 }
    ],
    detection: {
      dominant_script_threshold: 0.25,
      acoustic_min_prob_from_en: 0.88,
      acoustic_min_prob_other: 0.78,
      min_indic_chars_to_override_en: 3
    }
  },
  system_prompt: {
    language_of_prompt: "en",
    static: `You are Nakshatra AI, a warm, sharp, honest companion and world-class problem solver created and developed SOLELY by Bunny (Praveen). Talk like a smart, caring friend who is also an expert, never like a machine.

CRITICAL IDENTITY (STRICT & UNBREAKABLE):
- Your name is strictly "Nakshatra AI" (నక్షత్ర AI).
- You were solely created and developed by "Bunny (Praveen)" (బన్నీ ప్రవీణ్).
- ONLY when explicitly asked about your creator/developer (e.g., "who made you?", "developer evaru?", "ninnu evaru chesaru?"): Proudly and sweetly reply that Bunny (Praveen) created and developed you! Never say OpenAI, Google, Meta, or any other company made you.
- Do NOT bring up your creator's name in ordinary casual greetings or messages unless specifically asked.

LANGUAGE & SCRIPT POLICY:
- Maintain the user's active conversation language across short acknowledgments and backchannels; switch languages only when the user clearly speaks or explicitly requests another language (Telugu, Hindi, Marathi, Tamil, Malayalam, Kannada, Bengali, Gujarati, Punjabi, Odia, English, Spanish, French, German, or others).
- When the user writes a local language in Latin letters (Tenglish/Hinglish/Tanglish) in text chat, reply in that same natural style unless native script is active or requested.
- Use natural everyday spoken wording, not stiff textbook or literal machine translations.
- Keep common technical words in English (app, download, login, server, link, internet, mobile).
- Address the user respectfully by default (Telugu: మీరు, Hindi: आप, Tamil: நீங்கள், Malayalam: നിങ്ങൾ, Kannada: ನೀವು).
- STRICT TELUGU SCRIPT HYGIENE: NEVER fuse Telugu and English letters inside one word (never write broken hybrids like "గhee"). Separate English loanwords with spaces or use exact everyday Telugu words (బాస్మతి బియ్యం = raw rice before cooking [never బాస్మతి అన్నం], నెయ్యి = ghee [never వెన్న/గీ], పెరుగు = curd/yogurt [never దయి], కొత్తిమీర = cilantro leaves, ధనియాలు = coriander seeds, గోధుమ పిండి = dough [never పొట్టు], మందపాటి గిన్నె = heavy pot [never బాటిల్/వెండి పాన్], వడ్డించడం = serve food [never సేవించడం], రైతా = raita [never రాయితీ], దమ్ = steam seal [never దంప్/దుమ్], మారినేట్ చేసి పక్కన ఉంచండి = marinate & rest [never మరిగించండి = boil], పసుపు = turmeric [never హల్దీ]).

REASONING, LOGIC & PRACTICAL STEP DISCIPLINE (CRITICAL):
- Before answering ANY logic puzzle, riddle, trick question, math word problem, probability problem, or multi-step question:
  1. Read EVERY word literally to spot linguistic traps, hidden assumptions, impossible premises, or unit mismatches.
  2. Never jump to an intuitive reflex guess. List the exact constraints, deduce step-by-step, and substitute your candidate answer back into EVERY premise to confirm 100% consistency.
  3. If a puzzle has an ambiguous wording or missing condition that changes the answer, explicitly note both interpretations cleanly.
- For ANY how-to guide, recipe/cooking question, or procedural workflow:
  1. Verify chronological dependency order (marinate & soak first -> fry/cook base -> boil & drain hot rice right before layering -> dum seal & rest) and ensure EVERY listed ingredient/tool appears accurately in the steps with realistic home quantities (~1.5 L water to parboil 2 cups rice, low/medium/high stove flame rather than wattage).
  2. Double-check real-world timings, heat levels, and classic traps (e.g., brief poha rinse rather than multi-hour soak, oil-free hot tawa and concentric ladle spirals to spread dosa batter instead of swirling the pan, par-cooked drained rice + dum seal for biryani).
- Use clean readable equations in plain text or inline code (e.g., \`x + (x + 1.00) = 1.10\`) rather than raw LaTeX delimiters (\`\\[...\\]\` or \`\\(...\\)\`).

ANTI-HALLUCINATION & TRUTH POLICY (STRICT):
- Never invent facts, numbers, dates, statistics, links, quotes, or APIs. If you do not know or cannot verify something, state clearly: "I am not sure" (or the natural equivalent in the user's language) instead of guessing.
- Never extrapolate unverified details or pretend to verify live external events when no search results are provided.
- For current events, live scores, prices, weather, or real-time topics, rely strictly on the provided real-time search results and current date; state the source and date. If search results are missing or conflicting, say so openly.

RESPONSE SIZE & BEHAVIOR (PROFESSIONAL ASSISTANT STYLE, STRICT):
- Answer exactly what was asked, in the FIRST sentence. Match the length of your answer to the size of the question.
- Simple, yes/no, casual, or factual questions (e.g. "do you know Telugu?", "are you there?", "who made you?", "2+2?"): reply in 1-2 short plain sentences. NO headings, NO bullets, NO bold, NO lists of features or tips, NO summary. At most one short natural follow-up question.
- Questions about yourself or your abilities: answer directly and briefly. Never list everything you can do.
- Medium questions (explain, why, how does X work): a short paragraph (about 60-120 words). Use a small list only when there are 3+ truly parallel items.
- Use ### headings and numbered or bulleted structure ONLY for long tasks the user asks for: step-by-step guides, recipes, detailed comparisons, essays, code walkthroughs.
- Never pad: no restating the question, no repeated intro, no "In conclusion", no closing recap, no unnecessary disclaimers.
- NEVER repeat anything you already said earlier in the conversation. If asked again, answer in fresh, shorter words or a one-line confirmation. Never write the same sentence or paragraph twice in one reply.
- If the request is ambiguous, ask ONE short clarifying question instead of guessing at length.
- NO GREETING OPENERS ON QUESTIONS: never start answers with "Hi!", "Hey!", "Hello!", "Sure!", or "Here is...". Only greet back when the user's message is itself a greeting; then reply warmly in 1-2 short sentences.
- For descriptive points use "- **Real Topic Name:** explanation" and for procedures "1. **Real Step Name:** instruction". NEVER print placeholder text like "Bold Lead-in".

COMPLETENESS & FINISHING:
- Always finish every answer with a complete, well-formed sentence. Never trail off or cut off mid-thought. If an answer must end, summarize cleanly and offer to continue.

ABSOLUTE BAN ON CANNED BOT GREETINGS:
- NEVER reply to greetings with "మీరు బాగున్నారా?", "నేను బాగున్నాను", "How can I help you?", or "I am doing well, how are you?".
- Natural warm greetings:
  * Telugu: "హాయ్! చెప్పండి, ఏం చేస్తున్నారు?", "హేయ్! ఏంటి విశేషాలు?"
  * English: "Hey! What's up?", "Hey there! How's everything going?"
  * Hindi: "हे! कहिए, क्या हाल-चाल?"
  * Tamil: "ஹேய்! எப்படி இருக்கீங்க? என்ன விசேஷம்?"
  * Malayalam: "ഹലോ! എന്തുണ്ട് വിശേഷം?"`,
    static_live: `You are Nakshatra AI, a warm, sharp, genuinely human-sounding voice companion created solely by Bunny (Praveen).

IDENTITY & TRUTH:
- Your name is Nakshatra AI; your sole creator is Bunny (Praveen). Mention Bunny only if explicitly asked who created you.
- Never invent facts, numbers, dates, links, or quotes. If unsure, say so briefly and honestly.
- For how-to, recipe, or technical questions, keep real-world chronological step order and accurate core timings without skipping essential steps.
- Answer exactly what was asked, first. Yes/no or capability questions (e.g. "do you know Telugu?") get ONE short sentence plus at most a tiny follow-up, never a list of features. Never repeat what you already said earlier.`,
    mode_blocks: {
      chat: "MODE: Text chat. Give the direct answer first and keep it as short as the question allows (1-2 plain sentences for simple questions). Use ### headings, bullets or numbered steps ONLY for genuinely long, multi-part tasks the user asks for. NEVER output literal placeholder labels like 'Bold Lead-in'. Keep casual greetings brief and natural.",
      live: "MODE: Live voice call conversation. Speak like a warm, genuine human friend in 1 to 3 short spoken sentences (~12-35 words), reacting to the user's feeling first, varying openers, mirroring their mood and language, never robotic or lecture-like. Use natural contractions, commas or ellipses for soft breathing pauses, and warm conversational reactions. Zero markdown, asterisks, bullet lists, headings, emojis, code, or raw URLs."
    }
  },
  generation: {
    chat: { temperature: 0.4, top_p: 0.9, base_max_tokens: 1800, reasoning_effort: "medium" },
    deep: { temperature: 0.15, top_p: 0.85, base_max_tokens: 3200, reasoning_effort: "high" },
    factual: { temperature: 0.15, top_p: 0.85, base_max_tokens: 1800, reasoning_effort: "medium" },
    live: { temperature: 0.72, top_p: 0.9, base_max_tokens: 350, reasoning_effort: "none" }
  },
  routing: {
    tiers: [
      { name: "light", model: "openai/gpt-oss-20b" },
      { name: "standard", model: "openai/gpt-oss-120b" },
      { name: "deep", model: "openai/gpt-oss-120b" },
      { name: "live", model: "qwen/qwen3.8-27b", fallback_model: "openai/gpt-oss-120b" }
    ],
    reasoning_models: ["openai/gpt-oss-120b", "openai/gpt-oss-20b", "qwen/qwen3.8-27b"],
    deep_keywords: [
      "explain in detail", "step by step", "compare", "calculate", "compute", "evaluate", "debug",
      "analyze", "write code", "solve", "proof", "derivation", "complex", "code for",
      "puzzle", "riddle", "trick", "logic", "logical", "paradox", "brain teaser", "probability",
      "odd one out", "sequence", "pattern", "missing number", "truth", "liar", "knights", "knaves",
      "how many", "more than", "less than", "heavier", "lighter", "faster", "slower", "older", "younger",
      "ratio", "percent", "percentage", "cost", "total", "equation", "find x", "algorithm",
      "why does", "is it true", "fact check", "verify", "difference between", "pros and cons",
      "podupu", "పొడుపు", "తర్కం", "లెక్క", "సమాధానం", "ఎంత", "తేడా", "పోల్చు", "కోడ్"
    ]
  },
  web_search: {
    keywords: {
      en: ["latest", "current", "currently", "price", "score", "weather", "news", "who is the current", "who won", "winner", "match", "stock", "exchange rate", "gold rate", "release date", "ceo of", "president of", "prime minister"],
      te: ["తాజా", "ధర", "వార్తలు", "వాతావరణం", "స్కోర్", "మ్యాచ్", "గెలిచింది"],
      hi: ["ताज़ा", "कीमत", "समाचार", "मौसम", "स्कोर", "कौन है", "मैच", "जीता"],
      ta: ["சமீபத்திய", "விலை", "செய்தி", "வானிலை", "ஸ்கோர்"],
      ml: ["പുതിയ", "വില", "വാർത്ത", "കാലാവസ്ഥ", "സ്കോർ"]
    },
    temporal_cues: ["today", "now", "ఈరోజు", "ఈ రోజు", "ఇప్పుడు", "आज", "अभी", "இன்று", "இப்போது", "ഇന്ന്", "ഇപ്പോൾ"],
    temporal_topics_regex: /\b(news|weather|temperature|rain|forecast|score|scores|match|price|rate|gold|silver|stock|market|bitcoin|crypto|election|result|winner|champion|holiday|time\s+in|open|schedule|status|update|release|version|launch|ceo|president|minister)\b|(వార్త|వాతావరణం|ధర|స్కోర్|మ్యాచ్|సమయం|రెసిల్ట్|గెలిచింది|समाचार|मौसम|कीमत|स्कोर|मैच|जीता)/i
  }
};

const LANG_NAME_TO_CODE = {
  telugu: "te", english: "en", hindi: "hi", marathi: "mr", tamil: "ta",
  malayalam: "ml", kannada: "kn", bengali: "bn", gujarati: "gu", punjabi: "pa",
  odia: "or", spanish: "es", french: "fr", german: "de"
};

const BACKCHANNEL_REGEX = /^(?:ok|okay|k|kk|oh|ooh|ah|uh|um|umm|h+m+|yes|yeah|yep|yup|ya|yet|no|nope|nah|hi|hey|hello|bye|good\s*bye|nice|cool|super|good|great|fine|right|alright|all\s*right|sure|wow|really|please|pls|sorry|thanks|thank\s*you|thanks\s*a\s*lot|thank\s*you\s*so\s*much|got\s*it|i\s*see|ok(?:ay)?[,.\s]+(?:thanks|thank\s*you|what|why|really|sure|cool|nice|fine|good|great|got\s*it|i\s*see|wait(?:\s+a\s+(?:sec(?:ond)?|min(?:ute)?|moment))?|one\s+sec(?:ond)?)|oh[,.\s]+(?:nice|really|ok|okay|i\s*see|no|yes|yeah|cool|great|wow|what|why)|yeah[,.\s]+(?:sure|ok|okay|right|true|exactly|thanks|thank\s*you|what|why|really)|yes[,.\s]+(?:please|sure|ok|okay|thanks|thank\s*you|correct|right|what|really)|no[,.\s]+(?:problem|worries|thanks|thank\s*you|way)|wait(?:[,.\s]+(?:what\??|a\s+(?:sec(?:ond)?|min(?:ute)?|moment)))?|hold\s*on|hang\s*on|one\s+(?:sec(?:ond)?|min(?:ute)?|moment)|excuse\s*me|pardon|say\s*(?:that\s*)?again|what\??|why\??|how\s*come\??|is\s*(?:it|that)\??|not\s*yet|of\s*course|for\s*real|sounds\s*good|makes\s*sense|fair\s*enough|all\s*good|never\s*mind|nothing|go\s*(?:on|ahead)|continue|tell\s*me\s*more|same\s*here|me\s*too|you\s*too|done|ready)[!.,?\s]*$/i;

const ENGLISH_VOCAB_REGEX = /\b(the|is|are|am|was|were|be|been|have|has|had|do|does|did|can|could|would|should|will|shall|may|might|what|why|how|when|where|who|which|whose|whom|this|that|these|those|it|its|you|your|yours|my|mine|me|we|our|they|their|he|she|about|with|from|for|into|because|explain|tell|speak|talk|show|give|make|know|think|want|need|like|love|work|time|today|tomorrow|yesterday|story|joke|fact|weather|music|movie|food|water|ocean|space|moon|science|please|thanks|thank|sorry|morning|evening|night|actually|honestly|really|but|and|just|not|don't|i'm|it's|that's|you're|what's|awesome|wonderful|amazing|fantastic|interesting|maybe|nothing|something|everything|everyone|someone|always|never|welcome|problem|true|false)\b/gi;

const STRONG_ENGLISH_GRAMMAR_REGEX = /\b(the|is|are|was|were|have|has|had|do|does|did|can|could|would|should|will|about|with|from|because|explain|what|which|where|how|why|who|this|that|these|those|please|english)\b/gi;

const TELUGU_ROMANIZED_STRONG_REGEX = /\b(nuvvu|nenu|naaku|naku|neeku|meeru|manam|unnav|unnaru|unnava|unnadu|unnadhi|undi|undhi|enti|emiti|emito|emaina|emaindi|emaindhi|cheppu|cheppandi|cheppava|cheyi|chey|cheyandi|cheyyali|cheptha|chepthava|chesava|chesaru|chesthunna|chesthunnav|chesthunnaru|chestunna|chestunnav|chestunnaru|thinnava|tinnava|thinnara|thinnanu|tinnanu|bagunnava|bagunnav|bagunnara|bagunnanu|bagundi|baagundi|baagunnava|kavali|kaavali|vaddu|ledu|enduku|ekkada|eppudu|evaru|entha|ayindi|ayyindi|avuthundi|avunu|aunu|avuna|ikkada|akkada|gurinchi|ippudu|ayyo|kadha|chudu|chudandi|vinandi|telusa|teliyadu|matladu|matladandi|eroju|repu|ninna|konchem|manchi|antha|intha|vishayam|sahayam|bhojanam|neellu|kuda|kaani|aithe|lekapothe|vachindi|vachanu|vellali|vastunna|vasthunna|antunna|kaadu|podam|veldam|inkoka|inkenti|visheshalu|cheddam|parvaledu|parledhu|paravaledu)\b/gi;

const TELUGU_ROMANIZED_WEAK_OR_COLLOCATION_REGEX = /\b(em\s+(?:chestunna\w*|chesthunna\w*|chey\w*|chepp\w*|ayindi|ayyindi|aindi|aindhi|ledu|undi|undhi|kavali|kaavali|kavala|ante|vishayam|sangathi|parledu)|ela\s+(?:unnav\w*|unnaru|undi|undhi|chey\w*|chepp\w*|vundi|vundhi)|unna|sare|kada|chala|vinu)\b/gi;

const HINDI_ROMANIZED_STRONG_REGEX = /\b(kaisa|kaise|kaisi|kyun|kyon|aapka|tumhara|tumhe|mujhe|mera|meri|hamara|humara|theek|thik|accha|achha|batao|bataiye|kariye|shukriya|samajh|nahi|nahin|aaj|bahut|bahot|yaar|thakan|chahiye|kahan|kya|bolo|boliye|suno|suniye|haan|bilkul|zaroor|haal\s*chaal|hal\s*chal)\b/gi;

const HINDI_ROMANIZED_WEAK_REGEX = /\b(aap|tum|karo|namaste)\b/gi;

const TAMIL_ROMANIZED_STRONG_REGEX = /\b(eppadi|epdi|irukinga|irukkeenga|irukken|vanakkam|nandri|sollunga|pannunga|romba|theriyum|theriyala|vaanga|ponga|saptingala|saaptingala|irukku|enga|enna\s+(?:aachu|achhu|panringa|pannuringa|solringa|venum|vishesham))\b/gi;

const INDIC_CULINARY_LOANWORD_ONLY_REGEX = /^[\s।.,!?'"-]*(?:बिरयानी|मसाला|दोसा|डोसा|इडली|वडा|समोसा|पनीर|चाय|रोटी|नान|पुलाव|तंदूरी|रसम|सांभर|चटनी|బిర్యానీ|మసాలా|దోస|ఇడ్లీ|వడ|సమోసా|పనీర్|చాయ్|రోటీ|నాన్|పులావ్|తందూరి)+(?:\s+(?:बिरयानी|मसाला|दोसा|डोसा|इडली|वडा|समोसा|पनीर|चाय|रोटी|नान|पुलाव|तंदूरी|బిర్యానీ|మసాలా|దోస|ఇడ్లీ|వడ|సమోసా|పనీర్|చాయ్|రోటీ|నాన్|పులావ్|తందూరి))*[\s।.,!?'"-]*$/u;

const TRANSLITERATED_BACKCHANNEL_REGEX = /^[\s।.,!?'"-]*(?:ओके|ओके\s+थैंक्स|ओके\s+थैंक\s+यू|थैंक्स|थैंक\s+यू|सॉरी|प्लीज|यस|या|नो|राइट|नाइस|कूल|सुपर|श्योर|हेलो|हलो|हाय|ओह\s+नाइस|ओके\s+वॉट|वॉट|ఓకే|ఓకే\s+థాంక్స్|ఓకే\s+థ్యాంక్స్|ఓకే\s+థాంక్యూ|ఓకే\s+థ్యాంక్యూ|థాంక్స్|థ్యాంక్స్|థాంక్యూ|థ్యాంక్యూ|సారీ|ప్లీజ్|ఎస్|యా|నో|రైట్|నైస్|కూల్|సూపర్|ష్యూర్|హలో|హాయ్|ఓకే\s+వాట్|వాట్)[\s।.,!?'"-]*$/u;

const HINDI_GRAMMAR_CUES_REGEX = /(है|हैं|हूँ|था|थी|थे|क्या|कैसे|क्यों|कब|कहाँ|कौन|मैं|हम|तुम|आप|मेरा|मुझे|आपको|नहीं|हाँ|और|में|को|का|की|के|से|पर|बताओ|बताइए|करो|कीजिए|अच्छा|ठीक|बहुत)/u;

const MARATHI_GRAMMAR_CUES_REGEX = /(आहे|आहेत|आहात|कसे|काय|तुम्ही|माझं|मला|छान|नाही|होय|आणि|बरं|सांगा|करा)/u;

function normalizeLangCode(code) {
  if (!code || typeof code !== "string") return "";
  const base = code.trim().toLowerCase().split(/[-_]/)[0];
  if (base === "od") return "or";
  return NAKSHATRA_CONFIG.languages.supported.some(l => l.code === base) ? base : "";
}

function buildLangResult(code, extras = {}) {
  const normalized = normalizeLangCode(code) || "en";
  const langObj = NAKSHATRA_CONFIG.languages.supported.find(l => l.code === normalized)
    || NAKSHATRA_CONFIG.languages.supported[NAKSHATRA_CONFIG.languages.supported.length - 1];
  const isRomanized = Boolean(extras.isRomanized);
  let multiplier = langObj.token_multiplier || 1.0;
  if (isRomanized && normalized !== "en") {
    multiplier = normalized === "hi" ? 1.8 : 2.0;
  }
  return {
    code: langObj.code,
    name: langObj.name,
    script: isRomanized ? "Latin" : langObj.script,
    respectful_you: langObj.respectful_you || "",
    multiplier,
    locale: langObj.speech_locale || "en-IN",
    isRomanized,
    isBackchannel: Boolean(extras.isBackchannel),
    switched: Boolean(extras.switched),
    switchReason: extras.switchReason || null
  };
}

function detectExplicitLanguageSwitch(text) {
  if (!text || typeof text !== "string") return "";
  const t = text.trim();
  const lower = t.toLowerCase();

  // Ignore meta-questions asking how to translate or what a word means in a language
  if (/\b(what\s+does|meaning\s+of|how\s+do\s+you\s+say|how\s+to\s+say|translate)\b/i.test(lower)
      && !/\b(speak|talk|reply|respond|answer|chat|continue|switch)\s+(?:to\s+me\s+|with\s+me\s+)?in\b/i.test(lower)) {
    return "";
  }

  const explicitCmd = lower.match(/\b(?:speak|talk|reply|respond|answer|chat|explain|continue|switch)\s+(?:to\s+me\s+|with\s+me\s+)?(?:in\s+)?(telugu|english|hindi|marathi|tamil|kannada|malayalam|bengali|gujarati|punjabi|odia|spanish|french|german)\b/i)
    || lower.match(/^(?:please\s+|pls\s+)?(?:speak\s+|talk\s+|reply\s+)?(?:in\s+)?(telugu|english|hindi|marathi|tamil|kannada|malayalam|bengali|gujarati|punjabi|odia|spanish|french|german)\s*(?:lo|mein|me|la|please|pls)?[.!?\s]*$/i);
  if (explicitCmd && explicitCmd[1]) {
    return LANG_NAME_TO_CODE[explicitCmd[1].toLowerCase()] || "";
  }

  if (/\b(?:telugu\s*lo\s*(?:cheppu|cheppandi|matladu|matladandi|cheptha)|తెలుగు\s*లో\s*(?:చెప్పు|చెప్పండి|మాట్లాడు|మాట్లాడండి|చెప్తారా))\b/i.test(t) || /^తెలుగు(లో)?[.!?\s]*$/u.test(t)) return "te";
  if (/\b(?:english\s*(?:lo\s*(?:cheppu|cheppandi|matladu|matladandi)|mein\s*(?:bolo|batao|baat)|la\s*(?:pesunga|sollunga))|ఇంగ్లీష్\s*లో\s*(?:చెప్పు|చెప్పండి|మాట్లాడు|మాట్లాడండి))\b/i.test(t)) return "en";
  if (/\b(?:hindi\s*me(?:in)?\s*(?:bolo|batao|bataiye|baat)|हिंदी\s*में\s*(?:बोलो|बताओ|बताइए|बात))\b/i.test(t)) return "hi";
  if (/\b(?:tamil\s*la\s*(?:pesu|pesunga|sollu|sollunga)|தமிழில்\s*(?:பேசுங்கள்|சொல்லுங்கள்))\b/i.test(t)) return "ta";

  return "";
}

function inferLanguageFromHistory(historyMessages = []) {
  if (!Array.isArray(historyMessages) || historyMessages.length === 0) return "";
  for (let i = historyMessages.length - 1; i >= 0; i--) {
    const msg = historyMessages[i];
    if (!msg || msg.role === "system" || typeof msg.content !== "string") continue;
    const content = msg.content.trim();
    if (!content) continue;

    // Skip single short universal/transliterated backchannels when looking for true conversation language
    if (BACKCHANNEL_REGEX.test(content) || TRANSLITERATED_BACKCHANNEL_REGEX.test(content)) continue;

    const detected = detectLanguage(content, { ignoreHistory: true });
    if (detected && detected.code) {
      return detected.code;
    }
  }
  return "";
}

/**
 * Unicode Script, Romanized & Conversation-History-Aware Language Detector
 */
function detectLanguage(text, options = {}) {
  const opts = (options && typeof options === "object") ? options : {};
  const explicitOverride = normalizeLangCode(opts.explicitLanguage);
  const sttMeta = opts.sttMeta || null;
  const rawPrev = normalizeLangCode(opts.prevLang);
  const prevLang = rawPrev || (!opts.ignoreHistory ? inferLanguageFromHistory(opts.historyMessages) : "") || "";

  if (!text || typeof text !== "string" || !text.trim()) {
    return buildLangResult(explicitOverride || prevLang || "en");
  }

  const t = text.trim();
  const lower = t.toLowerCase();

  // 1. Explicit user switch directive always wins
  const switchTarget = detectExplicitLanguageSwitch(t);
  if (switchTarget) {
    return buildLangResult(switchTarget, {
      switched: Boolean(prevLang && switchTarget !== prevLang),
      switchReason: "explicit_request"
    });
  }

  // 2. Authoritative client-resolved language (preserves frontend turn hysteresis)
  if (explicitOverride) {
    const hasTenglish = (lower.match(TELUGU_ROMANIZED_STRONG_REGEX) || []).length > 0;
    const hasHinglish = (lower.match(HINDI_ROMANIZED_STRONG_REGEX) || []).length > 0;
    const hasTanglish = (lower.match(TAMIL_ROMANIZED_STRONG_REGEX) || []).length > 0;
    const hasIndicScript = /[\u0900-\u0DFF]/.test(t);
    const isRomanized = !hasIndicScript && (
      (explicitOverride === "te" && hasTenglish) ||
      (explicitOverride === "hi" && hasHinglish) ||
      (explicitOverride === "ta" && hasTanglish)
    );
    const isBackchannel = Boolean(prevLang) && BACKCHANNEL_REGEX.test(t);
    return buildLangResult(explicitOverride, {
      isRomanized,
      isBackchannel,
      switched: Boolean(prevLang && explicitOverride !== prevLang),
      switchReason: "client_resolved"
    });
  }

  // 2.5 Preserve active session language on transliterated English backchannels (e.g. "ఓకే థాంక్స్", "ओके थैंक्स")
  if (prevLang && TRANSLITERATED_BACKCHANNEL_REGEX.test(t)) {
    return buildLangResult(prevLang, { isBackchannel: true });
  }

  // 3. Native Unicode script detection across Indic & global scripts
  const counts = {
    te: (t.match(/[\u0C00-\u0C7F]/g) || []).length,
    hi: (t.match(/[\u0900-\u097F]/g) || []).length,
    ta: (t.match(/[\u0B80-\u0BFF]/g) || []).length,
    ml: (t.match(/[\u0D00-\u0D7F]/g) || []).length,
    kn: (t.match(/[\u0C80-\u0CFF]/g) || []).length,
    bn: (t.match(/[\u0980-\u09FF]/g) || []).length,
    gu: (t.match(/[\u0A80-\u0AFF]/g) || []).length,
    pa: (t.match(/[\u0A00-\u0A7F]/g) || []).length,
    or: (t.match(/[\u0B00-\u0B7F]/g) || []).length,
    en: (t.match(/[a-zA-Z]/g) || []).length
  };

  const indicScripts = ["te", "hi", "ta", "ml", "kn", "bn", "gu", "pa", "or"];
  let bestIndic = "te";
  let maxIndicCount = 0;
  for (const s of indicScripts) {
    if (counts[s] > maxIndicCount) {
      maxIndicCount = counts[s];
      bestIndic = s;
    }
  }

  const threshold = NAKSHATRA_CONFIG.languages.detection.dominant_script_threshold;
  const minIndicChars = prevLang === "en"
    ? NAKSHATRA_CONFIG.languages.detection.min_indic_chars_to_override_en
    : 2;
  const isAskingMeaningInEnglish = /\b(?:what\s+does\b.+\bmean|meaning\s+of\b|how\s+do\s+you\s+say\b|translate\b.+\b(?:to|into)\s+english)\b|\bin\s+english[.!?\s]*$/i.test(lower);

  if (maxIndicCount >= minIndicChars && maxIndicCount >= (counts.en * threshold) && !isAskingMeaningInEnglish) {
    // Guard against STT transcribing short culinary/cultural English words ("Biryani", "Masala dosa") as Devanagari/Telugu
    const sttProb = Number(sttMeta?.languageProbability || 0);
    const isLoanwordOnly = prevLang === "en"
      && INDIC_CULINARY_LOANWORD_ONLY_REGEX.test(t)
      && !HINDI_GRAMMAR_CUES_REGEX.test(t)
      && sttProb < 0.88;
    if (!isLoanwordOnly) {
      let resolvedIndic = bestIndic;
      if (bestIndic === "hi" && (sttMeta?.languageCode === "mr-IN" || MARATHI_GRAMMAR_CUES_REGEX.test(t))) {
        resolvedIndic = "mr";
      }
      return buildLangResult(resolvedIndic, {
        switched: Boolean(prevLang && resolvedIndic !== prevLang),
        switchReason: "unicode_script"
      });
    }
  }

  if (/[\u0600-\u06FF]{2,}/.test(t)) return buildLangResult("ar", { switched: Boolean(prevLang && prevLang !== "ar"), switchReason: "unicode_script" });
  if (/[\u3040-\u30FF]{2,}/.test(t)) return buildLangResult("ja", { switched: Boolean(prevLang && prevLang !== "ja"), switchReason: "unicode_script" });
  if (/[\uAC00-\uD7AF]{2,}/.test(t)) return buildLangResult("ko", { switched: Boolean(prevLang && prevLang !== "ko"), switchReason: "unicode_script" });
  if (/[\u4E00-\u9FFF]{2,}/.test(t)) return buildLangResult("zh", { switched: Boolean(prevLang && prevLang !== "zh"), switchReason: "unicode_script" });

  // 4. Preserve active conversation language on universal short backchannels / fillers / pure numbers
  if (BACKCHANNEL_REGEX.test(t) || /^[\d\s.,!?'"-]+$/.test(t)) {
    const keepLang = prevLang || "en";
    return buildLangResult(keepLang, { isBackchannel: Boolean(prevLang) });
  }

  // 5. Unambiguous Romanized Indic (Tenglish, Hinglish, Tanglish) without English word collisions
  const engGrammarCount = (lower.match(STRONG_ENGLISH_GRAMMAR_REGEX) || []).length;
  const engVocabCount = (lower.match(ENGLISH_VOCAB_REGEX) || []).length;

  if (!isAskingMeaningInEnglish) {
    const teStrongHits = (lower.match(TELUGU_ROMANIZED_STRONG_REGEX) || []).length;
    const teWeakHits = (lower.match(TELUGU_ROMANIZED_WEAK_OR_COLLOCATION_REGEX) || []).length;
    if (teStrongHits >= 1 && (teStrongHits + teWeakHits > engGrammarCount || engGrammarCount <= 1)) {
      return buildLangResult("te", { isRomanized: true, switched: Boolean(prevLang && prevLang !== "te"), switchReason: "romanized_te" });
    }
    if (teWeakHits >= 2 && engGrammarCount <= 1) {
      return buildLangResult("te", { isRomanized: true, switched: Boolean(prevLang && prevLang !== "te"), switchReason: "romanized_te" });
    }

    const hiStrongHits = (lower.match(HINDI_ROMANIZED_STRONG_REGEX) || []).length;
    const hiWeakHits = (lower.match(HINDI_ROMANIZED_WEAK_REGEX) || []).length;
    if (hiStrongHits >= 1 && (hiStrongHits + hiWeakHits > engGrammarCount || engGrammarCount <= 1)) {
      return buildLangResult("hi", { isRomanized: true, switched: Boolean(prevLang && prevLang !== "hi"), switchReason: "romanized_hi" });
    }
    if (hiWeakHits >= 2 && engGrammarCount === 0) {
      return buildLangResult("hi", { isRomanized: true, switched: Boolean(prevLang && prevLang !== "hi"), switchReason: "romanized_hi" });
    }

    const taStrongHits = (lower.match(TAMIL_ROMANIZED_STRONG_REGEX) || []).length;
    if (taStrongHits >= 1 && (taStrongHits > engGrammarCount || engGrammarCount <= 1)) {
      return buildLangResult("ta", { isRomanized: true, switched: Boolean(prevLang && prevLang !== "ta"), switchReason: "romanized_ta" });
    }
  }

  // 6. Common global Latin languages (Spanish, French, German)
  if (/\b(hola|gracias|buenos|buenas|como estas|cómo estás|por favor|que tal|qué tal|donde|dónde|necesito)\b/i.test(lower)) {
    return buildLangResult("es", { switched: Boolean(prevLang && prevLang !== "es"), switchReason: "latin_es" });
  }
  if (/\b(bonjour|merci|comment ca va|comment ça va|salut|s'il vous plait|s'il vous plaît|pourquoi|aujourd'hui)\b/i.test(lower)) {
    return buildLangResult("fr", { switched: Boolean(prevLang && prevLang !== "fr"), switchReason: "latin_fr" });
  }
  if (/\b(hallo|danke|guten|wie geht|bitte|warum|heute|danke schön)\b/i.test(lower)) {
    return buildLangResult("de", { switched: Boolean(prevLang && prevLang !== "de"), switchReason: "latin_de" });
  }

  // 7. Clear standard English sentences
  if (engVocabCount >= 1) {
    return buildLangResult("en", { switched: Boolean(prevLang && prevLang !== "en"), switchReason: "english_vocab" });
  }

  // 8. High-confidence acoustic STT LID only when no clear English vocabulary matched
  const acousticCode = normalizeLangCode(sttMeta?.languageCode);
  const acousticProb = Number(sttMeta?.languageProbability || 0);
  const minAcousticProb = prevLang === "en"
    ? NAKSHATRA_CONFIG.languages.detection.acoustic_min_prob_from_en
    : NAKSHATRA_CONFIG.languages.detection.acoustic_min_prob_other;
  if (acousticCode && acousticCode !== "en" && acousticProb >= minAcousticProb) {
    return buildLangResult(acousticCode, { switched: Boolean(prevLang && prevLang !== acousticCode), switchReason: "acoustic_stt" });
  }

  if (/^[a-zA-Z0-9\s.,!?'"~@#$%^&*()_\-+=/<>:;]+$/.test(t)) {
    return buildLangResult("en", { switched: Boolean(prevLang && prevLang !== "en"), switchReason: "ascii_fallback" });
  }

  return buildLangResult(prevLang || "en");
}

/**
 * Evaluates whether web search is required for time-sensitive facts
 */
function shouldSearch(text, mode = "chat") {
  if (!text || typeof text !== "string") return false;
  const trimmed = text.trim();
  const lower = trimmed.toLowerCase();

  // Skip search for obvious self-contained logic puzzles / arithmetic / coding debug queries
  const isSelfContainedPuzzle = /\b(riddle|puzzle|syllogism|truth-teller|knight|knave|river crossing|bat and ball|matchstick)\b/i.test(lower);
  if (isSelfContainedPuzzle) return false;

  // Explicit search intent
  if (/\b(search\s+for|search\s+on\s+google|google\s+cheyi|search\s+cheyi|వెతుకు|నెట్\s*లో\s*చూడు)\b/i.test(lower)) {
    return true;
  }

  // Year / recency temporal cues (2024-2029) paired with factual question framing
  if (/\b202[4-9]\b/.test(lower) && /\b(who|what|when|which|won|winner|champion|latest|new|released|launched|update|version|price|score|result)\b/i.test(lower)) {
    return true;
  }

  // Strong real-time keywords across all supported languages
  for (const lang of Object.keys(NAKSHATRA_CONFIG.web_search.keywords)) {
    for (const kw of NAKSHATRA_CONFIG.web_search.keywords[lang]) {
      if (lower.includes(kw.toLowerCase())) {
        return true;
      }
    }
  }

  // Casual words like "today" / "now" only trigger search when paired with factual real-time topics (never on "I am tired today")
  const hasTemporalCue = NAKSHATRA_CONFIG.web_search.temporal_cues.some(cue => lower.includes(cue.toLowerCase()));
  if (hasTemporalCue && NAKSHATRA_CONFIG.web_search.temporal_topics_regex.test(trimmed)) {
    return mode !== "live" || trimmed.length >= 16;
  }

  return false;
}

/**
 * Cleans user query to an optimal search query (max 10 words)
 */
function extractSearchQuery(text) {
  let q = text.replace(/^(search\s+for|search\s+web\s+for|google\s+for|can\s+you\s+search|please\s+search|వెతుకు|శోధించు)\s*/i, '');
  const words = q.trim().split(/\s+/).slice(0, 10);
  return words.join(" ");
}

/**
 * Executes Google Serper API Search and formats top 3 deduplicated snippets
 */
async function fetchSerperSnippets(query, apiKey, timeoutMs = 8000) {
  if (!apiKey || !query) return null;
  try {
    const res = await fetchWithTimeout("https://google.serper.dev/search", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-KEY": apiKey
      },
      body: JSON.stringify({ q: query, num: 5 })
    }, timeoutMs);

    if (!res.ok) return null;
    const data = await res.json();
    const organic = data.organic || [];
    if (!organic.length) return null;

    // Deduplicate and pick top 3
    const seenDomains = new Set();
    const snippets = [];
    
    for (const item of organic) {
      let domain = "";
      try {
        domain = new URL(item.link).hostname;
      } catch (e) {
        domain = item.link || "source";
      }

      if (seenDomains.has(domain)) continue;
      seenDomains.add(domain);

      const title = item.title ? item.title.trim() : "";
      const date = item.date ? ` [Date: ${item.date}]` : "";
      const snippet = item.snippet ? item.snippet.replace(/\n+/g, ' ').trim() : "";

      snippets.push(`- **${title}** (${domain}${date}): ${snippet}`);
      if (snippets.length >= 3) break;
    }

    return snippets.join("\n");
  } catch (err) {
    console.error("Serper search error:", err);
    return null;
  }
}

/**
 * Deterministic safe math pre-evaluator (no eval / Function) for exact arithmetic & percentages
 */
function evaluateArithmeticTokens(expr) {
  const cleaned = expr.replace(/,/g, '').replace(/×/g, '*').replace(/÷/g, '/').replace(/−/g, '-').trim();
  if (!/^[\d.\s+\-*/%^()]+$/.test(cleaned) || cleaned.length > 120) return null;

  const tokens = [];
  let i = 0;
  while (i < cleaned.length) {
    const ch = cleaned[i];
    if (/\s/.test(ch)) { i++; continue; }
    if (/\d|\./.test(ch)) {
      let numStr = '';
      while (i < cleaned.length && /[\d.]/.test(cleaned[i])) {
        numStr += cleaned[i++];
      }
      if (!/^\d+(\.\d+)?$/.test(numStr) && !/^\.\d+$/.test(numStr)) return null;
      tokens.push({ type: 'num', value: parseFloat(numStr) });
      continue;
    }
    if ('+-*/%^()'.includes(ch)) {
      tokens.push({ type: 'op', value: ch });
      i++;
      continue;
    }
    return null;
  }
  if (!tokens.length) return null;

  let pos = 0;
  function peek() { return tokens[pos]; }
  function consume() { return tokens[pos++]; }

  function parseExpression() {
    let left = parseTerm();
    while (peek() && peek().type === 'op' && (peek().value === '+' || peek().value === '-')) {
      const op = consume().value;
      const right = parseTerm();
      left = op === '+' ? left + right : left - right;
    }
    return left;
  }

  function parseTerm() {
    let left = parsePower();
    while (peek() && peek().type === 'op' && (peek().value === '*' || peek().value === '/' || peek().value === '%')) {
      const op = consume().value;
      const right = parsePower();
      if ((op === '/' || op === '%') && right === 0) throw new Error('Division by zero');
      if (op === '*') left *= right;
      else if (op === '/') left /= right;
      else left %= right;
    }
    return left;
  }

  function parsePower() {
    const base = parseUnary();
    if (peek() && peek().type === 'op' && peek().value === '^') {
      consume();
      const exp = parsePower();
      if (Math.abs(exp) > 100) throw new Error('Exponent out of range');
      return Math.pow(base, exp);
    }
    return base;
  }

  function parseUnary() {
    if (peek() && peek().type === 'op' && (peek().value === '+' || peek().value === '-')) {
      const op = consume().value;
      const val = parseUnary();
      return op === '-' ? -val : val;
    }
    return parsePrimary();
  }

  function parsePrimary() {
    const tok = peek();
    if (!tok) throw new Error('Unexpected end');
    if (tok.type === 'num') { consume(); return tok.value; }
    if (tok.type === 'op' && tok.value === '(') {
      consume();
      const val = parseExpression();
      if (!peek() || peek().type !== 'op' || peek().value !== ')') throw new Error('Mismatched paren');
      consume();
      return val;
    }
    throw new Error('Unexpected token');
  }

  try {
    const result = parseExpression();
    if (pos !== tokens.length || !Number.isFinite(result)) return null;
    return Number(result.toPrecision(12));
  } catch (e) {
    return null;
  }
}

function evaluateSafeMathQuery(userText) {
  if (!userText || typeof userText !== "string") return null;
  const trimmed = userText.trim();

  // Check "X% of Y"
  const pctMatch = trimmed.match(/^\s*(?:what\s+is\s+)?(\d+(?:\.\d+)?)\s*%\s*of\s*(\d+(?:,\d{3})*(?:\.\d+)?)\s*\??\s*$/i);
  if (pctMatch) {
    const pct = parseFloat(pctMatch[1]);
    const base = parseFloat(pctMatch[2].replace(/,/g, ''));
    const val = Number(((pct / 100) * base).toPrecision(12));
    if (Number.isFinite(val)) return { expression: `${pct}% of ${base}`, result: val };
  }

  // Extract explicit arithmetic expression when clearly requested
  const exprMatch = trimmed.match(/^(?:what\s+is|calculate|compute|solve|evaluate|find|=)?\s*([-+()0-9.,\s*/×÷^%]+?)\s*[?=]*$/i);
  if (exprMatch) {
    const candidate = exprMatch[1].trim();
    if (/[+\-*/×÷^%]/.test(candidate) && /\d/.test(candidate)) {
      const val = evaluateArithmeticTokens(candidate);
      if (val !== null) return { expression: candidate, result: val };
    }
  }
  return null;
}

/**
 * Classifies query complexity, reasoning depth, and verification requirement
 */
function classifyComplexity(userText, mode = "chat") {
  const text = (userText || "").trim();
  const lower = text.toLowerCase();

  if (mode === "live") {
    return { tier: "live", isDeep: false, needsVerification: false };
  }

  // Explicit greeting fast-path
  if (text.length <= 80 && /^(hi|hello|hey|namaste|హాయ్|హలో|హేయ్|నమస్తే|vanakkam|kaisa hai|good\s+(morning|afternoon|evening|night))\b[!.?\s]*$/i.test(lower)) {
    return { tier: "light", isDeep: false, needsVerification: false };
  }

  const hasDeepKeyword = NAKSHATRA_CONFIG.routing.deep_keywords.some(kw => lower.includes(kw));
  const hasHowToOrRecipe = /\b(how\s+to|recipe|cook|make|prepare|bake|fry|brew|boil|roast|build|setup|set\s+up|configure|fix|troubleshoot|instructions|method|process|biryani|briyani|dosa|curry|masala)\b/i.test(lower)
    || /(ఎలా\s*వండాలి|ఎలా\s*చేయాలి|తయారీ|విధానం|వంట|బిర్యానీ|రెసిపీ|కైసే\s*బనాయే|कैसे\s*बनाएं|कैसे\s*पकाएं|ela\s+cheyyali|ela\s+vandali)/i.test(text);
  const hasMultiConstraintLogic = /\b(if|suppose|assuming|all\s+\w+\s+are|none\s+of|either|neither|only\s+one|always\s+tells|lies|truth|probability|chances|odd\s+one|sequence|pattern|next\s+number|how\s+many|age|years\s+older|twice|half|times\s+as|weigh|balance|door|hat|coin|box|train|speed|distance|clock|angle|percent|%)\b/i.test(lower);
  const hasCodeSignals = /(```|\bfunction\b|\bclass\b|\bconst\b|\blet\b|\bdef\b|\bSELECT\b|\bERROR\b|\bException\b|\bTypeError\b)/i.test(text);
  const hasMathNumbers = (text.match(/\d+(?:\.\d+)?/g) || []).length >= 2 && /[?+\-*/=^%]|\b(total|sum|cost|left|remaining|find|many|much)\b/i.test(lower);
  const isLongMultiStep = text.length > 180;

  if (hasDeepKeyword || hasHowToOrRecipe || hasMultiConstraintLogic || hasCodeSignals || hasMathNumbers || isLongMultiStep) {
    return { tier: "deep", isDeep: true, needsVerification: true };
  }

  return { tier: "standard", isDeep: false, needsVerification: false };
}

/**
 * Model Tier Router: light (20b), standard (120b), deep (120b + high reasoning), live (qwen3.8-27b)
 */
function routeTier(userText, requestedModel, mode = "chat") {
  const complexity = classifyComplexity(userText, mode);
  const tierEntry = NAKSHATRA_CONFIG.routing.tiers.find(t => t.name === complexity.tier);
  const defaultModel = tierEntry ? tierEntry.model : NAKSHATRA_CONFIG.routing.tiers[1].model;

  let model = defaultModel;
  if (requestedModel && requestedModel !== "auto") {
    if (/llama|gpt-oss-safeguard|auto/i.test(requestedModel)) {
      model = complexity.tier === "live" ? defaultModel : NAKSHATRA_CONFIG.routing.tiers[1].model;
    } else {
      model = requestedModel;
    }
  }

  return {
    tier: complexity.tier,
    isDeep: complexity.isDeep,
    needsVerification: complexity.needsVerification,
    model
  };
}

/**
 * Applies model-compatible reasoning parameters without sending unsupported values to Groq
 */
function applyReasoningParams(payload, model, requestedEffort) {
  if (!NAKSHATRA_CONFIG.routing.reasoning_models.includes(model)) return;
  const effort = requestedEffort || "medium";
  if (/^qwen\//i.test(model)) {
    if (effort === "none") {
      payload.reasoning_effort = "none";
    } else {
      payload.reasoning_effort = "default";
      payload.reasoning_format = "parsed";
    }
    return;
  }
  if (/gpt-oss/i.test(model)) {
    payload.reasoning_effort = (effort === "high" || effort === "medium" || effort === "low") ? effort : "low";
    payload.reasoning_format = "parsed";
  }
}

/**
 * Builds the layered system prompt with static caching prefix and dynamic blocks
 */
function assembleSystemPrompt(options = {}) {
  const {
    mode = "chat",
    tier = "standard",
    language = {},
    searchSnippets = null,
    mathVerification = null,
    timezone = "Asia/Kolkata",
    userProfile = null,
    scriptPreference = null
  } = options;

  const isLive = mode === "live";
  let prompt = isLive ? NAKSHATRA_CONFIG.system_prompt.static_live : NAKSHATRA_CONFIG.system_prompt.static;

  // Append mode block
  const modeText = isLive ? NAKSHATRA_CONFIG.system_prompt.mode_blocks.live : NAKSHATRA_CONFIG.system_prompt.mode_blocks.chat;
  prompt += `\n\n${modeText}`;

  // Deep Reasoning & Puzzle Trap Protocol
  if (tier === "deep" && !isLive) {
    prompt += `\n\n--- DEEP LOGIC & ANTI-TRAP PROTOCOL ---
- Treat this as a high-precision reasoning, puzzle, math, or technical problem.
- Check EVERY premise and wording literally for tricks, hidden constraints, boundary cases, or misdirection before committing to an answer.
- Explicitly verify your candidate solution against EVERY given condition in the prompt before writing the final response.
- If the problem lacks enough information or has an impossible premise, point that out directly instead of inventing assumptions.`;
  }

  // Append Dynamic Blocks
  prompt += `\n\n--- DYNAMIC CONTEXT ---`;
  if (options.brevityHint) {
    prompt += `\nTHIS TURN: The user's message is short. Answer in 1-3 plain sentences (no headings, bullets, bold or lists) unless they explicitly ask for detail, steps, a list, or code.`;
  }

  // Date & Time injection (vital for "today", "yesterday", "now")
  const now = new Date();
  let dateStr;
  try {
    dateStr = now.toLocaleString("en-US", { timeZone: timezone, dateStyle: "full", timeStyle: "medium" });
  } catch (e) {
    dateStr = now.toISOString();
  }
  prompt += `\nCURRENT DATE & TIME: ${dateStr} (${timezone})`;

  // Language mandate (Live Mode defaults to native script so TTS pronounces naturally; Chat Mode mirrors Romanized unless native requested)
  const langCode = language.code || "en";
  const langName = language.name || "English";
  const langScript = language.script || "Latin";
  const forceNativeScript = isLive || scriptPreference === "native";

  if (language.isRomanized && !forceNativeScript) {
    prompt += `\nACTIVE LANGUAGE: ${langName} (${langCode.toUpperCase()}) written in LATIN letters (Romanized / Tenglish / Hinglish). Reply in that authentic conversational romanized style!`;
  } else if (langCode === "te") {
    prompt += `\nACTIVE LANGUAGE: Telugu (తెలుగు లిపి). Reply 100% in warm, natural, everyday spoken Telugu script using respectful ${language.respectful_you || "మీరు"}.`;
    prompt += `\nTELUGU LIVE/VOICE STYLE: Keep common daily English words spaced naturally (never fuse Telugu and English letters into one word like "గhee"), avoid stiff textbook wording, and never use canned bot greetings like "నేను బాగున్నాను, మీరు బాగున్నారా?".`;
  } else if (langCode !== "en") {
    const scriptNote = langScript !== "Latin" ? ` in ${langScript} script` : "";
    const respNote = language.respectful_you ? ` Address the user respectfully (${language.respectful_you}).` : "";
    prompt += `\nACTIVE LANGUAGE: ${langName}${scriptNote}. Reply 100% in natural, fluent, everyday spoken ${langName}.${respNote}`;
  } else {
    prompt += `\nACTIVE LANGUAGE: English. Reply 100% in clear, crisp, natural English.`;
  }

  if (language.switched) {
    prompt += `\nLANGUAGE SWITCH: The user switched to ${langName}. Ignore earlier history language and reply strictly in ${langName}.`;
  } else if (language.isBackchannel) {
    prompt += `\nLANGUAGE LOCK (BACKCHANNEL CONTINUITY): The user gave a brief acknowledgment/backchannel while continuing the ${langName} conversation. Keep replying strictly in ${langName} and continue naturally.`;
  } else {
    prompt += `\nLANGUAGE LOCK: Continue replying strictly in ${langName}. Do NOT switch languages on your own.`;
  }

  // User Profile if enabled
  if (userProfile && userProfile.name) {
    prompt += `\nUSER PROFILE: Name is ${userProfile.name}${userProfile.preferred_language ? `, prefers ${userProfile.preferred_language}` : ""}.`;
  }

  // Exact Deterministic Math Verification
  if (mathVerification) {
    prompt += `\n\n<calculator_verification>\nExpression: ${mathVerification.expression}\nExact Verified Result: ${mathVerification.result}\nINSTRUCTION: Use this exact verified arithmetic result.\n</calculator_verification>`;
  }

  // Real-Time Search Grounding
  if (searchSnippets) {
    prompt += `\n\n<search_context>\n${searchSnippets}\nINSTRUCTION: Base time-sensitive facts strictly on these results. Name the source and date. If facts conflict or are sparse, state so clearly and do not guess.\n</search_context>`;
  }

  return prompt;
}

/**
 * Checks ending of reply to detect cut-offs (Section 9)
 */
function isTruncatedReply(text) {
  if (!text || typeof text !== "string") return false;
  const trimmed = text.trim();
  if (trimmed.endsWith("```")) return false; // closed code block is complete
  const terminalRegex = /[.?!।]$/;
  return !terminalRegex.test(trimmed);
}

/**
 * Deduplicates overlapping text when continuing cut-off responses
 */
function mergeContinuation(original, continuation, maxOverlap = 80) {
  if (!continuation) return original;
  const o = original.trimEnd();
  const c = continuation.trimStart();
  const probe = c.slice(0, 60);
  if (probe.length >= 25 && o.includes(probe)) return o; // continuation just repeats earlier text

  for (let len = Math.min(maxOverlap, o.length, c.length); len > 3; len--) {
    const endSlice = o.slice(-len);
    const startSlice = c.slice(0, len);
    if (endSlice === startSlice) {
      return o + c.slice(len);
    }
  }
  return o + " " + c;
}

/**
 * Output Cleaning and Vocal Polish (Preserves markdown code blocks and newlines)
 */
function cleanTeluguOutput(text, mode = "chat") {
  if (!text || typeof text !== "string") return text;

  // Strip leaked <think>...</think> blocks outside code fences
  const codeBlockRegex = /(```[\s\S]*?```)/g;
  const parts = text.split(codeBlockRegex);

  return parts.map(part => {
    if (part.startsWith('```')) return part;
    const withoutThink = part.replace(/<think>[\s\S]*?<\/think>/gi, '');
    return cleanTeluguSegment(withoutThink, mode);
  }).join('').trim();
}

function dedupeRepeatedBlocks(text) {
  if (!text || typeof text !== "string") return text;
  const seen = new Set();
  const norm = (s) => s.replace(/\s+/g, " ").replace(/[*_`#>\-]/g, "").trim().toLowerCase();
  return text.split(/(```[\s\S]*?```)/g).map(part => {
    if (part.startsWith("```")) return part;
    return part.split(/\n{2,}/).map(par => {
      const isStructured = /^\s*(?:[-*+]|\d+\.|#|>|\|)/.test(par);
      if (!isStructured) {
        const sentences = par.split(/(?<=[.!?\u0964])\s+/);
        par = sentences.filter(s => {
          const k = norm(s);
          if (k.length < 20) return true;
          if (seen.has(k)) return false;
          seen.add(k);
          return true;
        }).join(" ");
      } else {
        const k = norm(par);
        if (k.length >= 25) {
          if (seen.has(k)) return "";
          seen.add(k);
        }
      }
      return par;
    }).filter(p => p.trim()).join("\n\n");
  }).join("");
}

function cleanTeluguSegment(text, mode = "chat") {
  let t = text;

  // 0. Strip role prefixes (e.g. "నక్షత్ర AI: ...", "Nakshatra AI: ...")
  t = t.replace(/^(నక్షత్ర\s*(AI)?|Nakshatra\s*(AI)?|Assistant|AI|Bot)\s*[:：\-–]\s*/i, '');

  // 1. Fix broken pronouns & food replies with authentic conversational phrasing
  t = t.replace(/\b(nenu|nenu\s+super\s+ga)\s+thinava\b/gi, "Ha thinnanu! Meeru thinnara?");
  t = t.replace(/\bbagunav[!.]*/gi, "bagunnanu!");
  t = t.replace(/\bNenu bagundhi\b/gi, "Nenu bagunnanu");
  t = t.replace(/\bcoffee\s+thintunna\w*/gi, "coffee taaguthunna");
  t = t.replace(/\btea\s+thintunna\w*/gi, "tea taaguthunna");
  t = t.replace(/\bvellipoyi\s+matladam\b/gi, "matladukundam");
  t = t.replace(/\bthintamu\b/gi, "thindam");

  // 2. Eradicate repetitive stuttering / double phrases
  t = t.replace(/\b(చెప్పండి|చెప్పు|వింటున్నాను|బాగున్నాను|హలో|హాయ్)\s*[,.]*\s*(హా|హ|మరి|సరే)?\s*[,.]*\s*\1\b/giu, '$1');
  t = t.replace(/\b(హా|హ)\s*[,.]*\s*(చెప్పండి|చెప్పు)\s*[,.]*\s*\2\b/giu, '$1 $2');
  t = t.replace(/\b(చెప్పండి|చెప్పు)\s*[,.]*\s*(హా|హ)\s*[,.]*\s*(చెప్పండి|చెప్పు)\b/giu, 'చెప్పండి');
  t = t.replace(/\b(cheppandi|cheppu|bagunnanu|hello|hi)\s*[,.]*\s*(ha|haa|mari|sare)?\s*[,.]*\s*\1\b/giu, '$1');
  t = t.replace(/\b(cheppandi|cheppu)\s*[,.]*\s*(ha|haa)\s*[,.]*\s*(cheppandi|cheppu)\b/giu, 'cheppandi');
  t = t.replace(/\b(ha|haa)\s*[,.]*\s*(cheppandi|cheppu)\s*[,.]*\s*\2\b/giu, '$1 $2');

  // 3. Catch and replace robotic canned greetings
  t = t.replace(/^(హాయ్|హలో|హేయ్)[.,!\s]+(నేను\s*బాగున్నాను|బాగున్నాను)[,.\s]+(మీ\s*రోజు\s*ఎలా\s*(సాగుతోంది|ఉంది|నడుస్తోంది)|మీరు\s*బాగున్నారా|మీరు\s*ఎలా\s*ఉన్నారు)\??/giu, '$1! ఏం చేస్తున్నారు? ఏంటి విశేషాలు?');
  t = t.replace(/^(హాయ్|హలో|హేయ్)?[.,!\s]*(నేను\s*బాగున్నాను|బాగున్నాను)[,.\s]*(మీరు\s*బాగున్నారా|మీరు\s*ఎలా\s*ఉన్నారు)\??/giu, 'హాయ్! చెప్పండి, ఏంటి విశేషాలు?');
  t = t.replace(/మీ\s*రోజు\s*ఎలా\s*(సాగుతోంది|నడుస్తోంది|ఉంది)\??/giu, 'ఏం విశేషాలు?');
  t = t.replace(/నేను\s*బాగున్నాను[,.\s]+మీరు\s*బాగున్నారా\??/giu, 'చెప్పండి, ఏం విశేషాలు?');
  t = t.replace(/నేను\s*మీకు\s*ఎలా\s*సహాయపడగలను\??/giu, 'చెప్పండి, ఏం కావాలి?');
  t = t.replace(/^(హాయ్|హలో)[.,!\s]*బాగున్నారా\??/giu, '$1! ఏం చేస్తున్నారు?');
  t = t.replace(/\b(I am doing well|I'm doing well|I am fine)[,.\s]*(how are you|how about you)\??/gi, "Hey! What's up?");
  t = t.replace(/\bHow can I help you\??/gi, "Hey! What's on your mind?");
  t = t.replace(/\bI am doing well, how are you\??/gi, "Hey! What's up?");

  // 4. Clumsy translations, broken Telugu+ASCII hybrids & slang fixes
  t = t.replace(/నన్ను\s+మీకు\s+ఏం\s+చేయాలి\??/gi, "చెప్పండి, ఏంటి విశేషాలు?");
  t = t.replace(/మాటలు\s+బాగోస్తున్నాయా\??/gi, "సరే, కూల్ గా మాట్లాడుకుందాం!");
  t = t.replace(/మిమ్మల్ని\s+సంతోషించాలనుకుంటున్నాను[!.]*/gi, "మీతో మాట్లాడటం నాకు చాలా ఇష్టం!");
  t = t.replace(/కొంచెం\s+మామిడి\s+తిన్నాను\w*/gi, "హా, ఇప్పుడే తిన్నాను! మీరు తిన్నారా?");
  t = t.replace(/వినడానికి\s+సిద్ధంగా\s+ఉన్నాను[!.]*/gi, "చెప్పండి, వింటున్నాను!");
  t = t.replace(/నేను\s+తెలుగు\s+మాత్రమే\s+మాట్లాడగలను\w*/gi, "Sure thing! Let's talk in English.");
  t = t.replace(/గhee/giu, "నెయ్యి");
  t = t.replace(/వెన్న\s*\(\s*గీ\s*\)/gu, "నెయ్యి");
  t = t.replace(/దహి\s*\(\s*నెయ్యి\s*\)/gu, "పెరుగు లేదా నెయ్యి");
  t = t.replace(/దయి\b/gu, "పెరుగు");
  t = t.replace(/రాయితీ\s*\(\s*రాయిత్\s*\)/gu, "రైతా");
  t = t.replace(/రాయతా/gu, "రైతా");
  t = t.replace(/మందమైన\s*బాటిల్/gu, "మందపాటి గిన్నె");
  t = t.replace(/వెండి\s*పాన్/gu, "పాన్");
  t = t.replace(/సేవించడం/gu, "వడ్డించడం");
  t = t.replace(/[“"]?(?:దంప్|దుమ్|డంప్)[”"]?/gu, "దమ్");
  t = t.replace(/(\d+\s*నిమిషాలు\s*)మరిగించండి(?=\s*(?:[.,\n]|$))/gu, "$1పక్కన ఉంచండి");
  t = t.replace(/\s*\((?:సుమారు\s*)?\d+\s*W\)/giu, "");
  t = t.replace(/\bచెప్పు\s+రా\b/gi, "చెప్పండి");
  t = t.replace(/\bబాధపడకు\s+రా\b/gi, "బాధపడకండి");
  t = t.replace(/\bఏమైంది\s+రా\b/gi, "ఏమైంది");
  t = t.replace(/\s+రా([.,!?]*)$/i, '$1');

  // 5. Elongated verb endings & vowel collapses
  t = t.replace(/\b(చెప్పం|చూడం|చేయం|మాట్లాడం|రెం|తీసుకోం|వినం)డీ\w*/gu, '$1డి');
  t = t.replace(/\bఏంటీ\b/gu, 'ఏంటి');
  t = t.replace(/\bఎలాగండీ\b/gu, 'ఎలాగండి');
  t = t.replace(/([\u0C3E-\u0C4C])\1+/gu, '$1');
  t = t.replace(/(ఆ|ఈ|ఊ|ఏ|ఐ|ఓ|ఔ)\1+/gu, '$1');
  t = t.replace(/([ా-ౌ])(ఆ|ఈ|ఊ|ఏ|ఓ)/gu, '$1');

  // 6. Strip foreign script leaks (Cyrillic, Arabic)
  t = t.replace(/[\u0400-\u04FF\u0600-\u06FF]/g, '');

  // 7. Remove elongated stutter vowels & sounds
  t = t.replace(/([a-zA-Z])\1{3,}/g, '$1');
  t = t.replace(/(^|\s)(aaa+|ooo+|ahh+|ohh+|uhh+|umm+|hmmm+|err+|aha+|oho+)\b[,:\s]*/gi, '$1');
  t = t.replace(/(^|\s)(ఆహ్+|ఓహ్+|హమ్మ్+|ఉమ్మ్+|umm+|ahh+|ohh+|hmm+|err+|ఆ{2,}|ఓ{2,})(\s|$|[.,!?])/giu, '$1$3');
  t = t.replace(/^[,;:\s]+/, '');

  // 8. Expressive vocal harmony punctuation
  t = mode === "live" ? t.replace(/\.{4,}/g, '...') : t.replace(/\.{2,}/g, '. ');
  t = t.replace(/!{2,}/g, '!');
  t = t.replace(/\?{2,}/g, '?');

  // 9. Preserve newlines and markdown structure: deduplicate within prose lines only
  const lines = t.split('\n');
  const cleanedLines = lines.map(line => {
    if (!line.trim() || /^(\s*[-*+]|\s*\d+\.|\s*#|\s*>|\s*\|)/.test(line)) {
      return line;
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
    let lineRes = deduplicated.join(' ').trim();
    if (mode === "live") {
      lineRes = lineRes.replace(/\s+(మరియు|కానీ|తోనే|అతని|నా|and|but|with|the)\s*[.,!?;:\-]*$/iu, '');
    }
    return lineRes;
  });

  let res = cleanedLines.join('\n').trim();
  res = res.replace(/[,;:\-\s]+$/, '');

  // Guarantee clean terminal punctuation if not code, markdown, or already closed inside quotes/parens
  if (res && !/[.!?।…`#\->|]$/.test(res.replace(/[*_"' )\]]+$/, ''))) {
    res += '.';
  }

  return res.trim();
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
      // 0. HEALTH & CONFIG ENDPOINTS
      if (path === "/" || path === "/health") {
        return jsonResponse({
          ok: true,
          service: "Nakshatra AI Worker",
          config_version: NAKSHATRA_CONFIG.meta.config_version,
          prompt_version: NAKSHATRA_CONFIG.meta.prompt_version,
          updated: NAKSHATRA_CONFIG.meta.updated
        });
      }

      if (path === "/config") {
        return jsonResponse(NAKSHATRA_CONFIG);
      }

      // 1. GROQ MODELS PROXY
      if (path === "/models") {
        const groqKey = getCleanSecret(env, "GROQ_API_KEY");
        if (!groqKey) return missingSecretResponse("GROQ_API_KEY");

        const res = await fetchWithTimeout("https://api.groq.com/openai/v1/models", {
          headers: { "Authorization": `Bearer ${groqKey}` }
        });
        return respond(res);
      }

      // 2. NAKSHATRA MULTILINGUAL INTELLIGENCE PIPELINE (/groq)
      if (path === "/groq") {
        const groqKey = getCleanSecret(env, "GROQ_API_KEY");
        if (!groqKey) return missingSecretResponse("GROQ_API_KEY");

        const startTime = Date.now();
        const bodyText = await request.text();
        let reqData;
        
        try {
          reqData = JSON.parse(bodyText);
        } catch (e) {
          return jsonResponse({ error: "Invalid JSON body" }, 400);
        }

        // Extract latest user query & conversation history (keeping non-system turns cleanly)
        let latestUserText = "";
        let inputMessages = [];
        let priorHistoryMessages = [];

        if (Array.isArray(reqData.messages) && reqData.messages.length > 0) {
          inputMessages = reqData.messages.filter(m => m && m.role !== "system");
          let lastUserIdx = -1;
          for (let i = inputMessages.length - 1; i >= 0; i--) {
            if (inputMessages[i].role === "user") {
              lastUserIdx = i;
              latestUserText = typeof inputMessages[i].content === "string" ? inputMessages[i].content : "";
              break;
            }
          }
          priorHistoryMessages = lastUserIdx > 0 ? inputMessages.slice(0, lastUserIdx) : [];
        } else if (reqData.message) {
          latestUserText = reqData.message;
          inputMessages = [{ role: "user", content: latestUserText }];
        }

        const reqMode = reqData.mode || "chat";
        const prevLangHint = normalizeLangCode(reqData.prev_language || reqData.active_language || reqData.user_profile?.preferred_language)
          || inferLanguageFromHistory(priorHistoryMessages)
          || "";
        const explicitLangHint = normalizeLangCode(reqData.language);

        // Step A: History-aware & client-contract-aware Language Detection
        const langInfo = detectLanguage(latestUserText, {
          prevLang: prevLangHint,
          historyMessages: priorHistoryMessages,
          mode: reqMode,
          sttMeta: reqData.stt_meta || null,
          explicitLanguage: explicitLangHint,
          scriptPreference: reqData.script_preference || null
        });

        // Step B: Dynamic Model Tier & Reasoning Effort Routing
        const routed = routeTier(latestUserText, reqData.model, reqMode);
        let selectedModel = routed.model;
        let isReasoningModel = NAKSHATRA_CONFIG.routing.reasoning_models.includes(selectedModel);

        // Step C: Deterministic Math Check & Real-Time Web Search Grounding
        const mathVerification = evaluateSafeMathQuery(latestUserText);
        let searchSnippets = null;
        let searchExecuted = false;
        const serperKey = getCleanSecret(env, "SERPER_API_KEY");
        if (shouldSearch(latestUserText, reqMode) && serperKey) {
          const searchQuery = extractSearchQuery(latestUserText);
          searchSnippets = await fetchSerperSnippets(searchQuery, serperKey, reqMode === "live" ? 2500 : 8000);
          if (searchSnippets) searchExecuted = true;
        }

        // Step D: Generation Parameters & Language-Aware Output Cap
        const genProfile = reqMode === "live"
          ? NAKSHATRA_CONFIG.generation.live
          : (routed.isDeep
            ? NAKSHATRA_CONFIG.generation.deep
            : (searchExecuted ? NAKSHATRA_CONFIG.generation.factual : NAKSHATRA_CONFIG.generation.chat));

        const calculatedCap = Math.min(6000, Math.round(genProfile.base_max_tokens * (langInfo.multiplier || 1.0)));
        const finalMaxTokens = Math.max(reqData.max_tokens || 0, calculatedCap);
        const temperature = (typeof reqData.temperature === "number")
          ? Math.min(genProfile.temperature, reqData.temperature)
          : (searchExecuted ? 0.15 : genProfile.temperature);
        const reasoningEffort = reqData.reasoning_effort || genProfile.reasoning_effort;

        // Step E: Assemble System Prompt with dynamic date, timezone, math & search grounding
        const systemPrompt = assembleSystemPrompt({
          mode: reqMode,
          tier: routed.tier,
          language: langInfo,
          searchSnippets,
          mathVerification,
          timezone: reqData.timezone || "Asia/Kolkata",
          userProfile: reqData.user_profile || null,
          brevityHint: reqMode === "chat" && !routed.isDeep && latestUserText.trim().length <= 90,
          scriptPreference: reqData.script_preference || null
        });

        // Trim context window according to spec (8 turns = 16 messages for chat, 4 turns = 8 for live)
        const windowSize = (reqMode === "live") ? 8 : 16;
        const windowedMessages = inputMessages.slice(-windowSize);

        const groqPayload = {
          model: selectedModel,
          messages: [
            { role: "system", content: systemPrompt },
            ...windowedMessages
          ],
          temperature,
          top_p: genProfile.top_p,
          max_completion_tokens: finalMaxTokens
        };
        applyReasoningParams(groqPayload, selectedModel, reasoningEffort);

        // LIVE STREAMING PATH: pipe Groq SSE straight to client so TTS can start on the first sentence
        if (reqMode === "live" && reqData.stream === true) {
          groqPayload.stream = true;
          groqPayload.max_completion_tokens = Math.min(groqPayload.max_completion_tokens, 700);
          let sres = await callGroqChat(groqKey, groqPayload, 12000).catch(() => null);
          const streamFallback = "openai/gpt-oss-120b";
          if ((!sres || !sres.ok) && selectedModel !== streamFallback) {
            const fbPayload = { ...groqPayload, model: streamFallback, temperature: Math.min(temperature, 0.6) };
            delete fbPayload.reasoning_effort; delete fbPayload.reasoning_format;
            applyReasoningParams(fbPayload, streamFallback, "low");
            sres = await callGroqChat(groqKey, fbPayload, 12000).catch(() => null);
          }
          if (!sres || !sres.ok) {
            const errText = sres ? await sres.text() : JSON.stringify({ error: "Upstream failed" });
            return new Response(errText, { status: sres ? sres.status : 502, headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } });
          }
          return new Response(sres.body, {
            status: 200,
            headers: { "Content-Type": "text/event-stream; charset=utf-8", "Cache-Control": "no-cache", "Access-Control-Allow-Origin": "*" }
          });
        }

        // Call Groq API (with automatic live fallback to standard 120b on upstream failure or empty reply)
        let res = await callGroqChat(groqKey, groqPayload, reqMode === "live" ? 15000 : 25000);
        let data = null;

        if (res.ok) {
          data = await res.json();
        }
        let aiChoice = data?.choices?.[0];
        let aiText = aiChoice?.message?.content || "";
        let finishReason = aiChoice?.finish_reason || "stop";

        const liveFallbackModel = NAKSHATRA_CONFIG.routing.tiers.find(t => t.name === "live")?.fallback_model || "openai/gpt-oss-120b";
        if (reqMode === "live" && selectedModel !== liveFallbackModel && (!res.ok || !aiText.trim())) {
          const fallbackPayload = {
            model: liveFallbackModel,
            messages: groqPayload.messages,
            temperature: Math.min(temperature, 0.6),
            top_p: genProfile.top_p,
            max_completion_tokens: Math.max(550, finalMaxTokens)
          };
          applyReasoningParams(fallbackPayload, liveFallbackModel, "low");
          const fbRes = await callGroqChat(groqKey, fallbackPayload, 18000);
          if (fbRes.ok) {
            res = fbRes;
            data = await fbRes.json();
            selectedModel = liveFallbackModel;
            isReasoningModel = NAKSHATRA_CONFIG.routing.reasoning_models.includes(selectedModel);
            aiChoice = data?.choices?.[0];
            aiText = aiChoice?.message?.content || "";
            finishReason = aiChoice?.finish_reason || "stop";
          }
        }

        if (!res.ok || !data) {
          const errData = res.ok ? JSON.stringify({ error: "Upstream returned empty response" }) : await res.text();
          return new Response(errData, {
            status: res.ok ? 502 : res.status,
            headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
          });
        }

        // Step F: Completion Guard: Auto-continue if cut-off (Section 9)
        const shouldAutoContinue = finishReason === "length"
          || false;
        if (shouldAutoContinue) {
          try {
            const continuePayload = {
              model: selectedModel,
              messages: [
                { role: "system", content: systemPrompt },
                ...windowedMessages,
                { role: "assistant", content: aiText },
                { role: "user", content: "Continue exactly where you stopped. Do not repeat." }
              ],
              temperature: Math.min(temperature, 0.3),
              max_completion_tokens: Math.min(2000, finalMaxTokens)
            };
            applyReasoningParams(continuePayload, selectedModel, reqMode === "live" ? "none" : "low");

            const contRes = await callGroqChat(groqKey, continuePayload, 15000);

            if (contRes.ok) {
              const contData = await contRes.json();
              const continuationText = contData.choices?.[0]?.message?.content || "";
              if (continuationText) {
                aiText = mergeContinuation(aiText, continuationText);
                finishReason = contData.choices?.[0]?.finish_reason || "stop";
              }
            }
          } catch (guardErr) {
            console.error("Completion Guard Continuation Error:", guardErr);
          }
        }

        // Step G: Self-Verification Pass for complex puzzles, logic, math, and high-stakes facts
        let verifiedByCritic = false;
        if (reqMode === "chat" && (routed.needsVerification || searchExecuted) && aiText && (Date.now() - startTime) < 16000) {
          const refined = await verifyAndRefineDeepReply({
            groqKey,
            model: selectedModel,
            isReasoningModel,
            userQuery: latestUserText,
            candidateReply: aiText,
            searchSnippets,
            mathVerification,
            language: langInfo
          });
          if (refined.changed && refined.text) {
            aiText = refined.text;
            verifiedByCritic = true;
          }
        }

        // Step H: Clean Output & Vocal Polish
        aiText = dedupeRepeatedBlocks(cleanTeluguOutput(aiText, reqMode));
        if (reqMode === "chat" && routed.tier !== "light" && aiText.length > 35) {
          aiText = aiText.replace(/^(?:hi|hello|hey|హాయ్|హలో|హేయ్)(?:\s+there)?[!.,:]+\s+/i, '').trim();
        }

        // Step I: Privacy & Metrics Logging (Section 15: log metrics only, NEVER user content)
        const latencyMs = Date.now() - startTime;
        console.log(JSON.stringify({
          event: "completion",
          mode: reqMode,
          lang: langInfo.code,
          prev_lang: prevLangHint || null,
          switched: langInfo.switched,
          switch_reason: langInfo.switchReason,
          is_backchannel: langInfo.isBackchannel,
          script: langInfo.script,
          tier: routed.tier,
          reasoning_effort: isReasoningModel ? (groqPayload.reasoning_effort || null) : null,
          verified_by_critic: verifiedByCritic,
          model: selectedModel,
          prompt_version: NAKSHATRA_CONFIG.meta.prompt_version,
          finish_reason: finishReason,
          search_used: searchExecuted,
          latency_ms: latencyMs,
          usage: data.usage || null
        }));

        const responseMeta = {
          language: langInfo.code,
          prev_language: prevLangHint || null,
          switched: langInfo.switched,
          switch_reason: langInfo.switchReason,
          is_backchannel: langInfo.isBackchannel,
          is_romanized: langInfo.isRomanized,
          script: langInfo.script,
          speech_locale: langInfo.locale,
          tier: routed.tier,
          reasoning_effort: isReasoningModel ? (groqPayload.reasoning_effort || null) : null,
          verified_by_critic: verifiedByCritic,
          model: selectedModel,
          finish_reason: finishReason,
          search_used: searchExecuted,
          prompt_version: NAKSHATRA_CONFIG.meta.prompt_version
        };

        // Format response backwards-compatibly
        if (reqData.message && !reqData.messages) {
          return jsonResponse({
            response: aiText,
            meta: responseMeta
          });
        }

        if (data.choices && data.choices[0] && data.choices[0].message) {
          data.choices[0].message.content = aiText;
        }

        // Include metadata in root object for advanced clients
        data.meta = responseMeta;
        data.response = aiText;

        return jsonResponse(data);
      }

      // 3. GROQ STT (Speech-to-Text)
      if (path === "/groq-stt") {
        const groqKey = getCleanSecret(env, "GROQ_API_KEY");
        if (!groqKey) return missingSecretResponse("GROQ_API_KEY");

        const headers = { "Authorization": `Bearer ${groqKey}` };
        const contentType = request.headers.get("Content-Type");
        if (contentType) headers["Content-Type"] = contentType;

        const res = await fetchWithTimeout("https://api.groq.com/openai/v1/audio/transcriptions", {
          method: "POST",
          headers,
          body: request.body
        });
        return respond(res);
      }

      // 4. ELEVENLABS TTS
      if (path === "/elevenlabs") {
        const elevenLabsKey = getCleanSecret(env, "ELEVENLABS_API_KEY");
        if (!elevenLabsKey) return missingSecretResponse("ELEVENLABS_API_KEY");

        const body = await request.text();
        const rawVoiceId = url.searchParams.get("voice_id") || "";
        const voiceId = /^[a-zA-Z0-9_-]{1,64}$/.test(rawVoiceId) ? rawVoiceId : "cgSgspJ2msm6clMCkdW9";
        const target = new URL(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`);
        const optLat = url.searchParams.get("optimize_streaming_latency");
        if (optLat && /^[0-4]$/.test(optLat)) target.searchParams.set("optimize_streaming_latency", optLat);
        const outFmt = url.searchParams.get("output_format");
        if (outFmt && /^[a-z0-9_]{3,24}$/i.test(outFmt)) target.searchParams.set("output_format", outFmt);
        const res = await fetchWithTimeout(target.toString(), {
          method: "POST",
          headers: { "Content-Type": "application/json", "xi-api-key": elevenLabsKey },
          body
        });
        return respond(res);
      }

      // 5. SARVAM TTS (Supports all major Indic languages)
      if (path === "/sarvam") {
        const sarvamKey = getCleanSecret(env, "SARVAM_API_KEY");
        if (!sarvamKey) return missingSecretResponse("SARVAM_API_KEY");

        const bodyText = await request.text();
        let payload = {};
        try {
          payload = JSON.parse(bodyText);
        } catch (e) {
          return jsonResponse({ error: "Invalid JSON body" }, 400);
        }

        const speechText = (payload.text || (Array.isArray(payload.inputs) ? payload.inputs[0] : payload.inputs) || "").trim();
        if (!speechText) {
          return jsonResponse({ error: "Text is required for TTS" }, 400);
        }

        const langCode = payload.target_language_code || payload.language_code || "te-IN";
        const isV3Regional = /^(ta|ml|kn|mr|bn|gu|pa|od|or)-/i.test(langCode);
        const defaultModel = isV3Regional ? "bulbul:v3" : "bulbul:v4-flash";
        const defaultSpeaker = isV3Regional
          ? "kavitha"
          : (langCode.startsWith("hi") ? "kavya_hi_conversational" : langCode.startsWith("en") ? "simran_en_conversation" : "kavitha_te_conversation");

        const sarvamBody = {
          text: speechText,
          target_language_code: langCode,
          model: payload.model || defaultModel,
          speaker: payload.speaker || defaultSpeaker,
          pace: payload.pace ?? 1.0,
          pitch: payload.pitch ?? 0.0,
          loudness: payload.loudness ?? 1.15,
          enable_preprocessing: payload.enable_preprocessing ?? true,
          speech_sample_rate: payload.speech_sample_rate || 24000,
          output_audio_codec: payload.output_audio_codec || "mp3"
        };

        const res = await fetchWithTimeout("https://api.sarvam.ai/text-to-speech", {
          method: "POST",
          headers: { 
            "Content-Type": "application/json", 
            "API-Subscription-Key": sarvamKey 
          },
          body: JSON.stringify(sarvamBody)
        });
        return respond(res);
      }

      // 6. SARVAM STT
      if (path === "/sarvam-stt") {
        const sarvamKey = getCleanSecret(env, "SARVAM_API_KEY");
        if (!sarvamKey) return missingSecretResponse("SARVAM_API_KEY");

        const headers = { "API-Subscription-Key": sarvamKey };
        const contentType = request.headers.get("Content-Type");
        if (contentType) headers["Content-Type"] = contentType;

        const res = await fetchWithTimeout("https://api.sarvam.ai/speech-to-text", {
          method: "POST",
          headers,
          body: request.body
        });
        return respond(res);
      }

      // 7. SERPER SEARCH DIRECT PROXY
      if (path === "/serper") {
        const serperKey = getCleanSecret(env, "SERPER_API_KEY");
        if (!serperKey) return missingSecretResponse("SERPER_API_KEY");

        const body = await request.text();
        const res = await fetchWithTimeout("https://google.serper.dev/search", {
          method: "POST",
          headers: { "Content-Type": "application/json", "X-API-KEY": serperKey },
          body
        });
        return respond(res);
      }

      // 8. YOUTUBE PROXY
      if (path.startsWith("/youtube/")) {
        const youtubeKey = getCleanSecret(env, "YOUTUBE_API_KEY");
        if (!youtubeKey) return missingSecretResponse("YOUTUBE_API_KEY");

        const apiPath = path.replace("/youtube", "");
        if (apiPath !== "/v3/search" && apiPath !== "/v3/playlistItems") {
          return jsonResponse({ error: "Not allowed" }, 403);
        }
        const target = new URL("https://www.googleapis.com/youtube" + apiPath);
        url.searchParams.forEach((v, k) => {
          if (k !== "key") target.searchParams.set(k, v);
        });
        target.searchParams.set("key", youtubeKey);
        const res = await fetchWithTimeout(target.toString());
        return respond(res);
      }

      return jsonResponse({ error: "Not found" }, 404);
    } catch (e) {
      return jsonResponse({ error: "Proxy error: " + (e?.message || "Unknown upstream error") }, 500);
    }
  }
};

async function callGroqChat(groqKey, payload, timeoutMs = 25000) {
  return await fetchWithTimeout("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${groqKey}`
    },
    body: JSON.stringify(payload)
  }, timeoutMs);
}

/**
 * Independent verification pass to catch logic errors, puzzle traps, math slips, and hallucinations
 */
async function verifyAndRefineDeepReply(options) {
  const { groqKey, model, isReasoningModel, userQuery, candidateReply, searchSnippets, mathVerification, language } = options;
  try {
    const contextNotes = [];
    if (mathVerification) {
      contextNotes.push(`Verified calculation: ${mathVerification.expression} = ${mathVerification.result}`);
    }
    if (searchSnippets) {
      contextNotes.push(`Search facts:\n${searchSnippets}`);
    }
    const langInstruction = language?.isRomanized
      ? `Write any corrected answer in the same Romanized ${language.code.toUpperCase()} style.`
      : (language?.code && language.code !== "en"
        ? `Write any corrected answer in fluent ${language.script} script.`
        : `Write any corrected answer in clear English.`);

    const criticPayload = {
      model,
      messages: [
        {
          role: "system",
          content: `You are an adversarial logic, math, puzzle, recipe/workflow, and factual accuracy verifier.
Check the candidate answer against EVERY word, constraint, edge case, linguistic trap, arithmetic step, chronological procedure order (e.g., soaking/marination before cooking, realistic home quantities, exact culinary technique), and grounded fact in the user's prompt.
- If the candidate answer is completely accurate, uses natural language (clean everyday Telugu without mixed-script typos or botched terms), addresses all traps/constraints/steps, and contains no hallucinations or unverified claims, reply with ONLY the single word: VERIFIED
- If the candidate answer has ANY logical flaw, wrong/swapped workflow step, unrealistic quantity, missed trap, calculation error, or hallucinated claim, output ONLY the complete corrected final response directly to the user (${langInstruction} Keep clean Markdown without raw LaTeX delimiters, placeholder labels like 'Bold Lead-in', or meta-commentary about fixing a draft).`
        },
        {
          role: "user",
          content: `User Question:\n${userQuery}\n${contextNotes.length ? `\nGrounding:\n${contextNotes.join('\n')}\n` : ''}\nCandidate Answer:\n${candidateReply}`
        }
      ],
      temperature: 0.1,
      top_p: 0.85,
      max_completion_tokens: 2400
    };
    if (isReasoningModel) {
      applyReasoningParams(criticPayload, model, "high");
    }

    const res = await callGroqChat(groqKey, criticPayload, 12000);
    if (!res.ok) return { changed: false, text: candidateReply };
    const data = await res.json();
    const verdict = (data.choices?.[0]?.message?.content || "").trim();
    if (!verdict || /^VERIFIED[.!\s]*$/i.test(verdict)) {
      return { changed: false, text: candidateReply };
    }
    // Strip accidental "VERIFIED" prefix if model added commentary, otherwise use corrected answer
    if (/^VERIFIED\b/i.test(verdict)) {
      return { changed: false, text: candidateReply };
    }
    return { changed: true, text: verdict };
  } catch (err) {
    console.error("Verification pass error:", err);
    return { changed: false, text: candidateReply };
  }
}

function getCleanSecret(env, keyName) {
  const val = env && env[keyName];
  return typeof val === "string" ? val.trim() : "";
}

function missingSecretResponse(keyName) {
  return jsonResponse({ error: `Missing ${keyName} secret in Cloudflare Worker environment.` }, 500);
}

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Access-Control-Allow-Origin": "*"
    }
  });
}

async function fetchWithTimeout(targetUrl, options = {}, timeoutMs = 25000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(targetUrl, { ...options, signal: controller.signal });
  } catch (err) {
    if (err && err.name === "AbortError") {
      throw new Error(`Upstream request timed out after ${Math.round(timeoutMs / 1000)}s`);
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

function respond(res) {
  return new Response(res.body, {
    status: res.status,
    headers: {
      "Content-Type": res.headers.get("Content-Type") || "application/json",
      "Access-Control-Allow-Origin": "*"
    }
  });
}
