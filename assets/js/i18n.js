const LANGUAGE_LIST = [
  { code: "en", nameKey: "language.english" },
  { code: "gu", nameKey: "language.gujarati" },
  { code: "hi", nameKey: "language.hindi" },
  { code: "bn", nameKey: "language.bengali" },
  { code: "te", nameKey: "language.telugu" },
  { code: "mr", nameKey: "language.marathi" },
  { code: "ta", nameKey: "language.tamil" },
  { code: "ur", nameKey: "language.urdu" },
  { code: "kn", nameKey: "language.kannada" },
  { code: "or", nameKey: "language.odia" },
  { code: "pa", nameKey: "language.punjabi" },
  { code: "as", nameKey: "language.assamese" },
  { code: "ml", nameKey: "language.malayalam" },
  { code: "sa", nameKey: "language.sanskrit" },
  { code: "ks", nameKey: "language.kashmiri" },
  { code: "ne", nameKey: "language.nepali" },
  { code: "kok", nameKey: "language.konkani" },
  { code: "mai", nameKey: "language.maithili" },
  { code: "mni", nameKey: "language.manipuri" },
  { code: "brx", nameKey: "language.bodo" },
  { code: "doi", nameKey: "language.dogri" },
  { code: "sd", nameKey: "language.sindhi" }
];

async function loadLanguage(code) {
  const r = await fetch(`config/languages/${code}.json`, { cache: "no-store" });
  if (!r.ok) throw new Error(`Missing language file: ${code}.json`);
  return await r.json();
}

export async function createI18n({ initialLanguage, languageSelectEl }) {
  let lang = initialLanguage || "en";
  let dict = await loadLanguage(lang);
  const listeners = new Set();

  function t(key) {
    const v = dict[key];
    if (typeof v === "string") return v;
    return key;
  }

  function populateLanguageSelect() {
    languageSelectEl.innerHTML = "";
    for (const item of LANGUAGE_LIST) {
      const opt = document.createElement("option");
      opt.value = item.code;

      const selfNameKey = `language.self.${item.code}`;
      const label = dict[selfNameKey] || t(item.nameKey) || item.code;
      opt.textContent = label;

      languageSelectEl.appendChild(opt);
    }
    languageSelectEl.value = lang;
  }

  async function setLanguage(newLang) {
    lang = newLang;
    dict = await loadLanguage(lang);
    populateLanguageSelect();
    for (const fn of listeners) fn(lang);
  }

  languageSelectEl.addEventListener("change", async () => {
    await setLanguage(languageSelectEl.value);
  });

  populateLanguageSelect();

  return {
    t,
    getLanguage: () => lang,
    setLanguage,
    onLanguageChanged: (fn) => listeners.add(fn)
  };
}
