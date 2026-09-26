export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;

    try {
      if (path === "/groq") {
        const body = await request.text();
        const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
          method: "POST",
          headers: { "Content-Type": "application/json", "Authorization": `Bearer ${env.GROQ_API_KEY}` },
          body
        });
        return respond(res);
      }

      if (path === "/elevenlabs") {
        const body = await request.text();
        const voiceId = url.searchParams.get("voice_id") || "21m00Tcm4TlvDq8ikWAM";
        const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
          method: "POST",
          headers: { "Content-Type": "application/json", "xi-api-key": env.ELEVENLABS_API_KEY },
          body
        });
        return respond(res);
      }

      if (path === "/sarvam") {
        const body = await request.text();
        const res = await fetch("https://api.sarvam.ai/text-to-speech", {
          method: "POST",
          headers: { "Content-Type": "application/json", "API-Subscription-Key": env.SARVAM_API_KEY },
          body
        });
        return respond(res);
      }

      if (path === "/serper") {
        const body = await request.text();
        const res = await fetch("https://google.serper.dev/search", {
          method: "POST",
          headers: { "Content-Type": "application/json", "X-API-KEY": env.SERPER_API_KEY },
          body
        });
        return respond(res);
      }

      if (path === "/youtube") {
        const target = new URL("https://www.googleapis.com" + url.searchParams.get("path"));
        url.searchParams.forEach((v, k) => { if (k !== "path") target.searchParams.set(k, v); });
        target.searchParams.set("key", env.YOUTUBE_API_KEY);
        const res = await fetch(target.toString());
        return respond(res);
      }

      return new Response("Not found", { status: 404 });
    } catch (e) {
      return new Response("Proxy error: " + e.message, { status: 500 });
    }
  }
};

async function respond(res) {
  const data = await res.text();
  return new Response(data, {
    status: res.status,
    headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
  });
}
