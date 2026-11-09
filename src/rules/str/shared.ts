/** Constants and helpers shared by the STR checks. */

/** Languages written in Cyrillic: a page in one of them is mostly Cyrillic letters. */
export const CYRILLIC_LANGS = new Set(["ru", "uk", "be", "bg", "sr", "mk", "kk", "ky", "tg", "mn"]);
/** Languages written in Latin letters that a page may declare. */
export const LATIN_LANGS = new Set(["en", "de", "fr", "es", "it", "pt", "nl", "pl", "cs", "sk", "sv", "no", "nb", "da", "fi", "tr", "ro", "hu", "id", "vi", "lv", "lt", "et", "hr", "sl", "az", "uz"]);
/** Below this many letters a page says too little to tell its language. */
export const MIN_LETTERS = 200;

/** Share of Cyrillic among the letters of a text, and how many letters there are. */
export function scriptOf(text: string): { cyrillic: number; letters: number } {
  const cyr = (text.match(/[Ѐ-ӿ]/g) ?? []).length;
  const lat = (text.match(/[A-Za-zÀ-ɏ]/g) ?? []).length;
  const letters = cyr + lat;
  return { cyrillic: letters ? cyr / letters : 0, letters };
}

/** Words of four letters and more, cut to five: «engineers» and «engineer», «инженер» and «инженера» match. */
export const stems = (s: string) =>
  new Set((s.toLowerCase().match(/[\p{L}\p{N}]{4,}/gu) ?? []).map((w) => w.slice(0, 5)));
