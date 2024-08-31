type Locale = [string, string][];

const locale_it: Locale = [
  ["Sync in progress", "Caricamento in corso"],
  ["Version", "Versione"],
  ["All lists", "Tutte le liste"],
  ["Add", "Aggiungi"],
  ["New Expense List", "Nuova lista spese"],
  ["Join Existing", "Lista già esistente"],
  ["There are no expense lists yet", "Nessuna lista spese al momento"],
  ["Licensed under GNU GPLv3", "Licenza GNU GPLv3"],
];

const locales: Map<string, Locale> = new Map([
  ["it", locale_it],
]);

const lang = "en"; // FIXME: TODO:

function lookup<A>(m: Map<A, A>, k: A): A {
  const v = m.get(k);
  return v ? v : k;
}

let _s: (str: string) => string = (str: string) => str;
const g = locales.get(lang);
if (g) {
  const m = new Map(g);
  _s = (str: string) => lookup(m, str);
}

export const s = _s;