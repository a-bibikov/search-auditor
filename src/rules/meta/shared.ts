/** Constants and helpers shared by the META checks. */

export const TITLE = { min: 10, max: 60 };

export const DESCRIPTION = { min: 50, max: 160 };

/** Characters as a person counts them: emoji and letters with marks are one each. */
export const len = (s: string) => [...s.trim()].length;

/** Titles that name a template, not a page: what a framework or an editor leaves when nobody writes one. */
export const GENERIC_TITLE = /^(home|home ?page|index|untitled|untitled document|document|new page|page|welcome|react app|vite app|vite \+ react|next\.?js app|create next app|gatsby|nuxt|my site|главная|главная страница|без названия|новая страница|страница|добро пожаловать)$/i;

/** The same text for a person: case, spaces and trailing punctuation do not matter. */
export const plain = (s: string) => s.toLowerCase().replace(/\s+/g, " ").replace(/[.!…]+$/, "").trim();
