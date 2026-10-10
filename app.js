/* =====================================================================
   Be My Chef — منطق التطبيق
   ===================================================================== */
const App = (function () {
  "use strict";

  let DATA = { recipes: [], ing: {}, units: {}, cats: {} };
  let LANG = null;
  let view = { screen: "chat", cat: null, recipe: null, factor: 1, q: "", cameFrom: "chat" };

  /* ---------- storage ---------- */
  const save = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} };
  const load = (k, d) => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } };

  /* ---------- i18n ---------- */
  const T = {
    app_name: { en: "Be My Chef", ur: "بی مائی شیف", ar: "كن طاهيي" },
    tagline: { en: "Your kitchen companion", ur: "آپ کے باورچی خانے کا ساتھی", ar: "رفيقك في المطبخ" },
    choose_lang: { en: "Choose your language", ur: "اپنی زبان منتخب کریں", ar: "اختر لغتك" },
    search_ph: { en: "Search a dish or an ingredient…", ur: "کھانا یا کوئی جزو تلاش کریں…", ar: "ابحث عن طبق أو مكوّن…" },
    all: { en: "All", ur: "سب", ar: "الكل" },
    serves: { en: "Serves", ur: "افراد", ar: "يكفي" },
    people: { en: "people", ur: "افراد", ar: "أشخاص" },
    prep: { en: "Prep", ur: "تیاری", ar: "التحضير" },
    cook: { en: "Cook", ur: "پکانے کا وقت", ar: "الطهي" },
    min: { en: "min", ur: "منٹ", ar: "دقيقة" },
    ingredients: { en: "Ingredients", ur: "اجزاء", ar: "المكوّنات" },
    method: { en: "Method", ur: "ترکیب", ar: "الطريقة" },
    tip: { en: "Chef's tip", ur: "شیف کا مشورہ", ar: "نصيحة الطاهي" },
    how_much: { en: "How much are you making?", ur: "آپ کتنا بنا رہے ہیں؟", ar: "كم الكمية التي تطبخها؟" },
    i_have: { en: "I have", ur: "میرے پاس ہے", ar: "لديّ" },
    of: { en: "of", ur: "", ar: "من" },
    reset: { en: "Original", ur: "اصل مقدار", ar: "الأصل" },
    back: { en: "Back", ur: "واپس", ar: "رجوع" },
    no_results: { en: "Nothing found. Try another word.", ur: "کچھ نہیں ملا۔ کوئی اور لفظ آزمائیں۔", ar: "لا نتائج، جرّب كلمة أخرى." },
    recipes_n: { en: "recipes", ur: "ریسپیز", ar: "وصفة" },
    by_ingredient: { en: "What can I cook with…", ur: "میں اس سے کیا بنا سکتا ہوں…", ar: "ماذا أطبخ بـ…" },
    scaled_note: { en: "Quantities below are adjusted to your amount.", ur: "نیچے دی گئی مقداریں آپ کی مقدار کے حساب سے ہیں۔", ar: "الكميات أدناه معدّلة حسب كميتك." },
    fav: { en: "Save", ur: "محفوظ کریں", ar: "حفظ" },
    faved: { en: "Saved", ur: "محفوظ ہے", ar: "محفوظة" },
    favs: { en: "Saved recipes", ur: "محفوظ ریسپیز", ar: "الوصفات المحفوظة" },
    no_favs: { en: "You have not saved any recipe yet.", ur: "ابھی آپ نے کوئی ریسپی محفوظ نہیں کی۔", ar: "لم تحفظ أي وصفة بعد." },
    share: { en: "Share", ur: "شیئر کریں", ar: "مشاركة" },
    print: { en: "Print", ur: "پرنٹ", ar: "طباعة" },
    lang_btn: { en: "Language", ur: "زبان", ar: "اللغة" },
    to_taste: { en: "to taste", ur: "حسبِ ذائقہ", ar: "حسب الرغبة" },
    tab_chat: { en: "Ask the chef", ur: "شیف سے پوچھیں", ar: "اسأل الطاهي" },
    tab_browse: { en: "All recipes", ur: "تمام ریسپیز", ar: "كل الوصفات" },
    ask_ph: { en: "e.g. I have 1 kg chicken, what can I make?", ur: "مثلاً: میرے پاس ایک کلو چکن ہے، کیا بناؤں؟", ar: "مثال: عندي كيلو دجاج، ماذا أطبخ؟" },
    greet: { en: "Assalam-o-alaikum! Tell me what you have in the kitchen, or name a dish, and I will give you the full recipe — adjusted to your quantity.",
             ur: "السلام علیکم! بتائیے آپ کے پاس کیا ہے، یا کسی کھانے کا نام لکھیے — میں پوری ترکیب آپ کی مقدار کے حساب سے بتا دوں گا۔",
             ar: "السلام عليكم! أخبرني بما لديك في المطبخ أو اذكر اسم طبق، وسأعطيك الوصفة كاملة معدّلة على كميتك." },
    ans_dish: { en: "Here is the recipe:", ur: "یہ رہی ترکیب:", ar: "إليك الوصفة:" },
    ans_ing: { en: "With that you can make:", ur: "اس سے آپ یہ بنا سکتے ہیں:", ar: "بهذا يمكنك أن تطبخ:" },
    ans_cat: { en: "Here is what I have in that kind:", ur: "اس قسم میں یہ موجود ہے:", ar: "هذا ما لديّ من هذا النوع:" },
    ans_quick: { en: "These are the quickest ones:", ur: "یہ سب سے جلدی بننے والے ہیں:", ar: "هذه أسرع الوصفات:" },
    ans_scaled: { en: "Quantities are already adjusted to", ur: "مقداریں پہلے ہی اس حساب سے ہیں:", ar: "الكميات معدّلة على:" },
    ans_none: { en: "I could not find that dish in my book yet. Try an ingredient (chicken, mince, rice) or a kind of food (sweet, fast food, Chinese).",
                ur: "یہ کھانا ابھی میری کتاب میں نہیں ملا۔ کوئی جزو لکھ کر دیکھیں (چکن، قیمہ، چاول) یا قسم (میٹھا، فاسٹ فوڈ، چائنیز)۔",
                ar: "لم أجد هذا الطبق في كتابي بعد. جرّب مكوّنًا (دجاج، لحم مفروم، أرز) أو نوعًا (حلويات، وجبات سريعة، صيني)." },
    ans_help: { en: "You can ask me like this:", ur: "آپ مجھ سے یوں پوچھ سکتے ہیں:", ar: "يمكنك أن تسألني هكذا:" },
    open_recipe: { en: "Open recipe", ur: "ترکیب کھولیں", ar: "افتح الوصفة" },
    loading: { en: "Loading…", ur: "لوڈ ہو رہا ہے…", ar: "جارٍ التحميل…" },
    err: { en: "Could not load the recipes. Please run the app through a local server.", ur: "ریسپیز لوڈ نہیں ہو سکیں۔ ایپ کو لوکل سرور کے ذریعے چلائیں۔", ar: "تعذّر تحميل الوصفات؛ شغّل التطبيق عبر خادم محلي." },
  };
  const t = (k) => (T[k] && (T[k][LANG] || T[k].en)) || k;
  // Falls back through every language a piece of text actually has, instead
  // of only the current language then English: a recipe added in Urdu only
  // (not yet translated) still shows that Urdu text to an Arabic or English
  // reader, rather than a blank card.
  const pick = (o) => (o && (o[LANG] || o.ur || o.en || o.ar)) || "";
  const isRTL = () => LANG === "ur" || LANG === "ar";

  /* ---------- numbers ---------- */
  const DIG = { ar: "٠١٢٣٤٥٦٧٨٩", ur: "۰۱۲۳۴۵۶۷۸۹" };
  function digits(n) {
    const s = String(n), set = DIG[LANG];
    return set ? s.replace(/[0-9]/g, (d) => set[+d]) : s;
  }
  // pretty fractions for spoon/cup measures
  const FRACT = [[0.125, "⅛"], [0.25, "¼"], [0.333, "⅓"], [0.5, "½"], [0.667, "⅔"], [0.75, "¾"]];
  function niceFraction(x) {
    const whole = Math.floor(x + 1e-9), rest = x - whole;
    if (rest < 0.06) return whole ? digits(whole) : "";
    let best = null, bd = 1;
    for (const [v, s] of FRACT) { const d = Math.abs(rest - v); if (d < bd) { bd = d; best = s; } }
    if (bd > 0.09) return digits(Math.round(x * 10) / 10);
    return (whole ? digits(whole) + " " : "") + best;
  }
  function roundWeight(x) {
    if (x >= 1000) return Math.round(x / 50) * 50;
    if (x >= 200) return Math.round(x / 25) * 25;
    if (x >= 50) return Math.round(x / 5) * 5;
    if (x >= 10) return Math.round(x);
    return Math.round(x * 2) / 2;
  }

  /* ---------- the scaling engine ---------- */
  // returns {qty:"…", unit:"…"} already localised
  function scaleIngredient(item, factor) {
    const u = item.u;
    const unitName = (k) => pick(DATA.units[k]);
    if (u === "tt") return { qty: "", unit: t("to_taste") };
    let q = item.q * factor;

    if (u === "g" || u === "ml") {
      if (q >= 1000) {
        const big = q / 1000;
        return { qty: niceFraction(Math.round(big * 4) / 4), unit: unitName(u === "g" ? "kg" : "l") };
      }
      return { qty: digits(roundWeight(q)), unit: unitName(u) };
    }
    if (u === "kg" || u === "l") {
      if (q < 1) return { qty: digits(roundWeight(q * 1000)), unit: unitName(u === "kg" ? "g" : "ml") };
      return { qty: niceFraction(q), unit: unitName(u) };
    }
    if (u === "pc") {
      // whole items: never go below a half
      let v = q < 0.5 ? 0.5 : Math.round(q * 2) / 2;
      return { qty: niceFraction(v), unit: unitName("pc") };
    }
    if (u === "tsp" || u === "tbsp" || u === "cup") {
      let v = q;
      // convert 3 tsp -> 1 tbsp, 4+ tbsp stays tbsp (cooks think in tbsp)
      if (u === "tsp" && v >= 3) return { qty: niceFraction(v / 3), unit: unitName("tbsp") };
      if (v < 0.125) v = 0.125;
      return { qty: niceFraction(v), unit: unitName(u) };
    }
    return { qty: niceFraction(q), unit: unitName(u) };
  }

  // local weight presets used by Pakistani cooks
  function weightPresets(baseUnit) {
    if (baseUnit === "g" || baseUnit === "kg") {
      return [
        { g: 250, label: { en: "250 g (¼ kg)", ur: "ایک پاؤ (۲۵۰ گرام)", ar: "٢٥٠ غرام" } },
        { g: 500, label: { en: "500 g (½ kg)", ur: "آدھا کلو (۵۰۰ گرام)", ar: "٥٠٠ غرام (نصف كيلو)" } },
        { g: 750, label: { en: "750 g", ur: "پونا کلو (۷۵۰ گرام)", ar: "٧٥٠ غرام" } },
        { g: 1000, label: { en: "1 kg", ur: "ایک کلو", ar: "كيلو واحد" } },
        { g: 1500, label: { en: "1.5 kg", ur: "ڈیڑھ کلو", ar: "كيلو ونصف" } },
        { g: 2000, label: { en: "2 kg", ur: "دو کلو", ar: "كيلوان" } },
      ];
    }
    return null;
  }

  /* ---------- helpers ---------- */
  const norm = (s) => String(s || "").toLowerCase()
    .replace(/[\u064B-\u0652\u0670\u0640]/g, "").replace(/[إأآٱ]/g, "ا").replace(/ة/g, "ه").replace(/ى/g, "ي");
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  function recipeMatches(r, q) {
    if (!q) return true;
    const hay = norm([pick(r.name), r.name.en, r.name.ur, r.name.ar, pick(r.desc), r.tags.join(" "),
      r.ing.map((i) => [pick(DATA.ing[i.k]), DATA.ing[i.k].en].join(" ")).join(" ")].join(" "));
    return q.split(/\s+/).filter(Boolean).every((w) => hay.includes(w));
  }

  /* ---------- rendering ---------- */
  const el = (id) => document.getElementById(id);

  function applyLang() {
    document.documentElement.lang = LANG;
    document.documentElement.dir = isRTL() ? "rtl" : "ltr";
    document.body.classList.toggle("lang-ur", LANG === "ur");
    document.body.classList.toggle("lang-ar", LANG === "ar");
    el("app-title").textContent = t("app_name");
    el("search").placeholder = t("search_ph");
    el("lang-btn").textContent = "🌐 " + t("lang_btn");
    el("ask").placeholder = t("ask_ph");
    const tc = el("tab-chat"), tb = el("tab-browse");
    if (tc) tc.querySelector("span").textContent = t("tab_chat");
    if (tb) tb.querySelector("span").textContent = t("tab_browse");
    chatLog = chatLog.filter((m) => !m.greet);
    chatLog.unshift({ who: "bot", html: esc(t("greet")), cards: [], greet: true });
    render();
  }

  function render() {
    const chat = el("screen-chat"), list = el("screen-list"), rec = el("screen-recipe");
    document.body.classList.toggle("on-chat", view.screen === "chat");
    document.body.classList.toggle("on-browse", view.screen === "home");
    document.body.classList.toggle("on-recipe", view.screen === "recipe");
    if (view.screen === "recipe") { chat.classList.add("is-hidden"); list.classList.add("is-hidden"); renderRecipe(); return; }
    if (view.screen === "chat") { rec.classList.add("is-hidden"); list.classList.add("is-hidden"); chat.classList.remove("is-hidden"); renderChat(); return; }
    chat.classList.add("is-hidden"); renderList();
  }

  function renderCats() {
    const bar = el("cats");
    const cats = [["", t("all")]].concat(Object.keys(DATA.cats).map((k) => [k, pick(DATA.cats[k])]));
    bar.innerHTML = cats.map(([k, label]) =>
      `<button class="chip${view.cat === (k || null) ? " is-on" : ""}" data-cat="${esc(k)}">${esc(label)}</button>`).join("");
  }

  function renderList() {
    el("screen-list").classList.remove("is-hidden");
    el("screen-recipe").classList.add("is-hidden");
    renderCats();
    const q = norm(view.q);
    const favs = load("bmc_favs", []);
    let list = DATA.recipes.filter((r) => (!view.cat || (view.cat === "__fav" ? favs.includes(r.id) : r.cat === view.cat)) && recipeMatches(r, q));
    el("count").textContent = digits(list.length) + " " + t("recipes_n");
    const grid = el("grid");
    if (!list.length) { grid.innerHTML = `<p class="empty">${esc(view.cat === "__fav" ? t("no_favs") : t("no_results"))}</p>`; return; }
    grid.innerHTML = list.map((r) => `
      <button class="card" data-id="${esc(r.id)}">
        <span class="card-emoji">${catEmoji(r.cat)}</span>
        <span class="card-body">
          <span class="card-name">${esc(pick(r.name))}</span>
          <span class="card-desc">${esc(pick(r.desc))}</span>
          <span class="card-meta">⏱ ${digits(r.time.prep + r.time.cook)} ${esc(t("min"))} · 👥 ${digits(r.serves)}</span>
        </span>
      </button>`).join("");
  }

  function catEmoji(c) {
    return { desi: "🍛", bbq: "🍢", rice: "🍚", fastfood: "🍔", chinese: "🥡", arabian: "🥙",
      breakfast: "🍳", bread: "🫓", dessert: "🍮", drink: "🥤", snack: "🥟", veg: "🥬", soup: "🍲" }[c] || "🍽";
  }

  function renderRecipe() {
    const r = view.recipe;
    el("screen-list").classList.add("is-hidden");
    el("screen-recipe").classList.remove("is-hidden");
    const favs = load("bmc_favs", []);
    const isFav = favs.includes(r.id);
    const mainIng = DATA.ing[r.main.k];
    const presets = weightPresets(r.main.u);
    const servesNow = Math.max(1, Math.round(r.serves * view.factor));

    let scaler = `<div class="scaler">
      <div class="scaler-head">${esc(t("how_much"))}</div>`;
    if (presets) {
      const baseG = r.main.u === "kg" ? r.main.q * 1000 : r.main.q;
      scaler += `<div class="scaler-row"><span class="scaler-label">${esc(t("i_have"))} <b>${esc(pick(mainIng))}</b></span></div>
      <div class="presets">` + presets.map((p) =>
        `<button class="chip preset${Math.abs(p.g / baseG - view.factor) < 0.01 ? " is-on" : ""}" data-factor="${p.g / baseG}">${esc(pick(p.label))}</button>`).join("") + `</div>`;
    }
    scaler += `<div class="serve-row">
        <button class="round" data-serve="-1">−</button>
        <span class="serve-text">${esc(t("serves"))} <b>${digits(servesNow)}</b> ${esc(t("people"))}</span>
        <button class="round" data-serve="1">+</button>
        <button class="chip" data-factor="1">${esc(t("reset"))}</button>
      </div></div>`;

    const ings = r.ing.map((i) => {
      const s = scaleIngredient(i, view.factor);
      return `<li><span class="ing-q">${esc(s.qty)} ${esc(s.unit)}</span><span class="ing-n">${esc(pick(DATA.ing[i.k]))}</span></li>`;
    }).join("");

    const steps = r.steps.map((s, i) => `<li><span class="step-n">${digits(i + 1)}</span><span class="step-t">${esc(pick(s))}</span></li>`).join("");

    el("screen-recipe").innerHTML = `
      <button class="back" id="back-btn">← ${esc(t("back"))}</button>
      <header class="r-head">
        <div class="r-emoji">${catEmoji(r.cat)}</div>
        <h1 class="r-title">${esc(pick(r.name))}</h1>
        <p class="r-desc">${esc(pick(r.desc))}</p>
        <div class="r-meta">
          <span>⏱ ${esc(t("prep"))}: ${digits(r.time.prep)} ${esc(t("min"))}</span>
          <span>🔥 ${esc(t("cook"))}: ${digits(r.time.cook)} ${esc(t("min"))}</span>
          <span>👥 ${esc(t("serves"))}: ${digits(servesNow)}</span>
        </div>
        <div class="r-actions">
          <button class="btn" id="fav-btn">${isFav ? "★ " + esc(t("faved")) : "☆ " + esc(t("fav"))}</button>
          <button class="btn" id="print-btn">🖨 ${esc(t("print"))}</button>
        </div>
      </header>
      ${scaler}
      <section class="block">
        <h2>${esc(t("ingredients"))}</h2>
        ${view.factor !== 1 ? `<p class="scaled-note">${esc(t("scaled_note"))}</p>` : ""}
        <ul class="ing-list">${ings}</ul>
      </section>
      <section class="block">
        <h2>${esc(t("method"))}</h2>
        <ol class="step-list">${steps}</ol>
      </section>
      ${r.tips ? `<section class="tip"><b>${esc(t("tip"))}:</b> ${esc(pick(r.tips))}</section>` : ""}`;
    window.scrollTo(0, 0);
  }

  /* ---------- chat ---------- */
  const SUGGEST = {
    en: ["I have 1 kg chicken", "What can I make with mince?", "Something sweet", "Biryani recipe", "Something quick", "Fast food"],
    ur: ["میرے پاس ایک کلو چکن ہے", "ایک پاؤ قیمے سے کیا بنے گا؟", "کچھ میٹھا", "بریانی کی ترکیب", "کچھ جلدی بننے والا", "فاسٹ فوڈ"],
    ar: ["عندي كيلو دجاج", "ماذا أطبخ باللحم المفروم؟", "شيء حلو", "وصفة البرياني", "شيء سريع", "وجبات سريعة"],
  };
  let chatLog = [];

  function addMsg(who, html, cards) {
    chatLog.push({ who, html, cards: cards || [] });
    renderChat();
  }

  function renderChat() {
    const log = el("chat-log"); if (!log) return;
    log.innerHTML = chatLog.map((m) => {
      const cards = (m.cards || []).map((c) => {
        const r = DATA.recipes.find((x) => x.id === c.id);
        if (!r) return "";
        const scaled = c.factor && Math.abs(c.factor - 1) > 0.01
          ? ` · ×${c.factor >= 1 ? (Math.round(c.factor * 100) / 100) : (Math.round(c.factor * 100) / 100)}` : "";
        return `<button class="mini" data-open="${esc(r.id)}" data-factor="${c.factor || 1}">
            <span class="mini-emoji">${catEmoji(r.cat)}</span>
            <span><b class="mini-name">${esc(pick(r.name))}</b>
            <span class="mini-meta">⏱ ${digits(r.time.prep + r.time.cook)} ${esc(t("min"))} · 👥 ${digits(Math.max(1, Math.round(r.serves * (c.factor || 1))))}${scaled}</span></span>
          </button>`;
      }).join("");
      return `<div class="msg ${m.who}">${m.html}${cards ? `<div class="msg-cards">${cards}</div>` : ""}</div>`;
    }).join("");
    const tips = el("chat-tips");
    if (tips) tips.innerHTML = (SUGGEST[LANG] || SUGGEST.en).map((s) => `<button class="tip-chip" data-ask="${esc(s)}">${esc(s)}</button>`).join("");
    try { if (log.scrollIntoView) log.scrollIntoView({ block: "end" }); } catch (e) {}
    try { window.scrollTo(0, document.body.scrollHeight); } catch (e) {}
  }

  function qtyLabel(qty) {
    if (!qty) return "";
    if (qty.grams) return qty.grams >= 1000 ? `${digits(Math.round(qty.grams / 100) / 10)} ${pick(DATA.units.kg)}` : `${digits(qty.grams)} ${pick(DATA.units.g)}`;
    if (qty.pieces) return `${digits(qty.pieces)} ${pick(DATA.units.pc)}`;
    return "";
  }

  // A short "typing" bubble shown while the real AI thinks; replaced in place
  // once the reply arrives.
  function addThinking() {
    chatLog.push({ who: "bot", html: `<span class="thinking"></span>`, cards: [] });
    renderChat();
    return chatLog.length - 1;
  }
  function replaceAt(i, html) {
    if (!chatLog[i]) return;
    chatLog[i] = { who: "bot", html, cards: [] };
    renderChat();
  }

  // Free-text lines become paragraphs; nothing else from the AI is trusted as HTML.
  function escToHtml(text) {
    return esc(text).trim().split(/\n+/).map((line) => `<p>${line}</p>`).join("");
  }

  const AI_DOWN = {
    en: "I couldn't reach the kitchen brain just now. Please check your internet and try again.",
    ur: "ابھی باورچی خانے کے دماغ تک رسائی نہیں ہو سکی۔ اپنا انٹرنیٹ چیک کر کے دوبارہ کوشش کریں۔",
    ar: "تعذر الوصول إلى عقل المطبخ الآن. تحقق من الإنترنت وحاول مرة أخرى.",
  };

  // Every answer comes from the real AI — there is no offline matcher anymore.
  // DATA.recipes still matters here: a few of the closest verified recipes are
  // sent along as reference, so the AI's answer for a dish you actually
  // supplied stays grounded in your real recipe rather than guessing.
  async function askAi(text) {
    const res = await fetch("/.netlify/functions/chef", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: text, lang: LANG, recipes: DATA && DATA.recipes ? DATA.recipes : [] }),
    });
    if (!res.ok) throw new Error("ai_unavailable");
    const data = await res.json();
    if (!data.reply) throw new Error("ai_empty");
    return data.reply;
  }

  function answer(text) {
    addMsg("me", esc(text));
    const slot = addThinking();
    askAi(text)
      .then((reply) => replaceAt(slot, escToHtml(reply)))
      .catch(() => replaceAt(slot, esc(AI_DOWN[LANG] || AI_DOWN.en)));
  }

  function openRecipe(r, factor) {
    view.recipe = r; view.factor = factor || 1; view.screen = "recipe"; render();
  }

  function setScreen(s) {
    view.screen = s;
    document.body.classList.toggle("on-chat", s === "chat");
    document.body.classList.toggle("on-browse", s === "home");
    document.body.classList.toggle("on-recipe", s === "recipe");
    const tc = el("tab-chat"), tb = el("tab-browse");
    if (tc && tb) { tc.classList.toggle("is-on", s === "chat"); tb.classList.toggle("is-on", s === "home"); }
    render();
  }

  /* ---------- events ---------- */
  function initEvents() {
    document.addEventListener("click", (e) => {
      const open = e.target.closest("[data-open]");
      if (open) { const r = DATA.recipes.find((x) => x.id === open.dataset.open);
        if (r) { view.cameFrom = "chat"; openRecipe(r, parseFloat(open.dataset.factor) || 1); } return; }
      const card = e.target.closest(".card");
      if (card) { view.cameFrom = "home"; openRecipe(DATA.recipes.find((r) => r.id === card.dataset.id), 1); return; }
      const chip = e.target.closest("[data-cat]");
      if (chip) { view.cat = chip.dataset.cat || null; render(); return; }
      const f = e.target.closest("[data-factor]");
      if (f && view.recipe && view.screen === "recipe") { view.factor = parseFloat(f.dataset.factor); renderRecipe(); return; }
      const sv = e.target.closest("[data-serve]");
      if (sv && view.recipe && view.screen === "recipe") {
        const cur = Math.max(1, Math.round(view.recipe.serves * view.factor));
        const next = Math.max(1, cur + parseInt(sv.dataset.serve, 10));
        view.factor = next / view.recipe.serves; renderRecipe(); return;
      }
      if (e.target.closest("#back-btn")) { setScreen(view.cameFrom || "chat"); return; }
      const ask = e.target.closest("[data-ask]");
      if (ask) { el("ask").value = ask.dataset.ask; answer(ask.dataset.ask); el("ask").value = ""; return; }
      const scr = e.target.closest("[data-screen]");
      if (scr) { setScreen(scr.dataset.screen); return; }
      if (e.target.closest("#send")) { const v = el("ask").value.trim(); if (v) { answer(v); el("ask").value = ""; } return; }
      if (e.target.closest("#fav-btn")) {
        const favs = load("bmc_favs", []); const id = view.recipe.id;
        const i = favs.indexOf(id); if (i < 0) favs.push(id); else favs.splice(i, 1);
        save("bmc_favs", favs); renderRecipe(); return;
      }
      if (e.target.closest("#print-btn")) { window.print(); return; }
      if (e.target.closest("#lang-btn")) { el("lang-screen").classList.remove("is-hidden"); return; }
      const lb = e.target.closest("[data-lang]");
      if (lb) { LANG = lb.dataset.lang; save("bmc_lang", LANG); el("lang-screen").classList.add("is-hidden"); applyLang(); return; }
    });
    el("ask").addEventListener("keydown", (e) => {
      if (e.key === "Enter") { const v = el("ask").value.trim(); if (v) { answer(v); el("ask").value = ""; } }
    });
    el("search").addEventListener("input", (e) => { view.q = e.target.value; if (view.screen !== "home") { view.screen = "home"; } render(); });
  }

  /* ---------- boot ---------- */
  async function loadData() {
    try {
      const res = await fetch("data.json", { cache: "no-store" });
      DATA = await res.json();
      el("loader").classList.add("is-hidden");
      setScreen("chat");
    } catch (e) {
      el("loader").innerHTML = `<p class="empty">${esc(t("err"))}</p>`;
    }
  }

  let inited = false;
  function init() {
    if (inited) return; inited = true;
    LANG = load("bmc_lang", null);
    initEvents();
    if (!LANG) { el("lang-screen").classList.remove("is-hidden"); LANG = "en"; }
    applyLang();
    loadData();
    if ("serviceWorker" in navigator) {
      window.addEventListener("load", () => navigator.serviceWorker.register("service-worker.js").catch(() => {}));
    }
  }

  return { init, _scale: scaleIngredient, _setLang: (l) => { LANG = l; } };
})();

document.addEventListener("DOMContentLoaded", App.init);
