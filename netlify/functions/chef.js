/* =====================================================================
   Be My Chef — اصل AI شیف
   ہر جواب اسی اصل AI سے آتا ہے، کوئی آف لائن متبادل نظام نہیں۔ درستگی کے
   لیے، اگر صارف کے سوال سے ملتی جلتی کوئی تصدیق شدہ ریسپی data.json میں
   موجود ہو، تو وہ AI کو حوالے کے طور پر بھیجی جاتی ہے، تاکہ وہ اندازے کی
   بجائے آپ کی اصل ترکیب کی بنیاد پر جواب دے۔ تصویر یا کوئی اور مہنگی
   صلاحیت کہیں استعمال نہیں ہوتی — صرف متن، جو مفت رہتا ہے۔
   ===================================================================== */

const SYSTEM_PROMPT = `You are "Be My Chef", a warm, practical home-cooking expert for South Asian,
Arab and international family kitchens. You have NO offline fallback — you are
the only brain this app has, so always give a real, useful answer yourself.

Reply in the EXACT same language and script the user wrote in (Urdu script,
Roman Urdu, Arabic, or English) — never switch language on them.

The user will usually say what they want to cook, and/or how much raw
ingredient they have, and/or how many people it is for. Always:
1. If the dish is clear, write the FULL recipe: a short intro line, then a
   complete ingredient list with real quantities (weights, spoons, cups —
   whatever a home cook actually measures with), then numbered steps, then
   total time and how many people it serves.
2. Scale sensibly for what they told you. Meat/main ingredient scales
   directly with the amount they have. Spices, salt and chili do NOT scale
   perfectly linearly for large batches (e.g. a 10x batch rarely needs 10x
   chili) — use real cooking judgement, the way an experienced home cook
   would adjust for a big pot.
3. If they gave a person-count instead of a weight (e.g. "for 10-15
   people"), first state a sensible total meat weight for that many people,
   then give the full scaled recipe from there.
4. If one or more VERIFIED RECIPES are given to you below, and one of them is
   clearly the dish being asked about, treat it as ground truth: use its exact
   ingredient list and method as your base, only scaling or adapting it for
   what the user asked. Do not invent a different version of a dish you were
   given a verified recipe for. If none of the verified recipes match, use
   your own general knowledge instead — do not force a mismatch.
5. Never state a fact (a quantity, a time, a temperature) you are not
   reasonably sure of. If genuinely unsure of one detail, say so briefly in
   the same line rather than inventing a precise-sounding number.
6. If the dish name is missing or genuinely ambiguous, ask ONE short
   clarifying question instead of guessing — do not pad this into a long
   message.
7. Keep the tone like a helpful relative, not a formal cookbook. No
   markdown headers or asterisks; plain short lines work best in a chat
   bubble. Keep it focused — no long unrelated history of the dish.`;

// A cheap, dependency-free way to find which of the sender's own recipes (if
// any) this message is probably about, so only those few are sent to the AI
// as grounding — never the whole list, which would be slow and expensive.
function findRelevantRecipes(message, recipes) {
  if (!Array.isArray(recipes) || !recipes.length) return [];
  const text = String(message || "").toLowerCase();

  const scored = recipes
    .map((r) => {
      const names = [r.name && r.name.en, r.name && r.name.ur, r.name && r.name.ar, r.id]
        .filter(Boolean)
        .map((n) => String(n).toLowerCase());
      let score = 0;
      for (const name of names) {
        if (!name) continue;
        if (text.includes(name)) score += 10;
        else {
          // a single distinctive word of the name is still a useful signal
          for (const word of name.split(/[\s\-,()]+/)) {
            if (word.length >= 4 && text.includes(word)) score += 3;
          }
        }
      }
      return { r, score };
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);

  return scored.map((x) => x.r);
}

// Only what the AI needs to stay grounded — not the whole recipe object (no
// internal ids, categories, image refs etc.), to keep the prompt small.
function condense(recipe) {
  const name = (recipe.name && (recipe.name.en || recipe.name.ur || recipe.name.ar)) || recipe.id || "recipe";
  const serves = recipe.serves || "?";
  // Ingredients only carry an internal key (e.g. "chicken_bone", "red_chilli"),
  // not a display name — the readable name lives in data.json's separate "ing"
  // dictionary, which is not sent here to keep the request small. The key read
  // as plain words ("chicken bone") is clear enough for the model as reference.
  const ing = Array.isArray(recipe.ing)
    ? recipe.ing
        .map((i) => `${i.q || ""}${i.u || ""} ${String(i.k || "").replace(/_/g, " ")}`.trim())
        .join(", ")
    : "";
  const steps = Array.isArray(recipe.steps)
    ? recipe.steps.map((s) => (s && (s.en || s.ur)) || "").filter(Boolean).join(" / ")
    : "";
  return `Name: ${name}\nServes: ${serves}\nIngredients: ${ing}\nMethod: ${steps}`;
}

exports.handler = async (event) => {
  const cors = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };

  if (event.httpMethod === "OPTIONS") return { statusCode: 204, headers: cors };
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, headers: cors, body: JSON.stringify({ error: "POST only" }) };
  }

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return { statusCode: 503, headers: cors, body: JSON.stringify({ error: "not_configured" }) };
  }

  let message = "";
  let recipes = [];
  try {
    const body = JSON.parse(event.body || "{}");
    message = String(body.message || "").slice(0, 1000);
    recipes = Array.isArray(body.recipes) ? body.recipes : [];
  } catch (e) {
    return { statusCode: 400, headers: cors, body: JSON.stringify({ error: "bad_request" }) };
  }
  if (!message.trim()) {
    return { statusCode: 400, headers: cors, body: JSON.stringify({ error: "empty_message" }) };
  }

  const relevant = findRelevantRecipes(message, recipes);
  const grounding = relevant.length
    ? `\n\nVERIFIED RECIPES (use these as ground truth if one matches):\n\n${relevant.map(condense).join("\n\n")}`
    : "";

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 25000);

    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: "openai/gpt-oss-20b",
        messages: [
          { role: "system", content: SYSTEM_PROMPT + grounding },
          { role: "user", content: message },
        ],
        temperature: 0.3,
        max_tokens: 900,
      }),
      signal: controller.signal,
    }).finally(() => clearTimeout(timeout));

    if (!res.ok) {
      return { statusCode: 502, headers: cors, body: JSON.stringify({ error: "provider_error" }) };
    }

    const data = await res.json();
    const reply = data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content;
    if (!reply) return { statusCode: 502, headers: cors, body: JSON.stringify({ error: "empty_reply" }) };

    return { statusCode: 200, headers: cors, body: JSON.stringify({ reply }) };
  } catch (e) {
    return { statusCode: 502, headers: cors, body: JSON.stringify({ error: "request_failed" }) };
  }
};
