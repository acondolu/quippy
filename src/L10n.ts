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

const locale_fr: Locale = [
  ["Sync in progress", "Synchronisation en cours"],
  ["Version", "Version"],
  ["All lists", "Toutes les listes"],
  ["Add", "Ajouter"],
  ["New Expense List", "Nouvelle liste de dépenses"],
  ["Join Existing", "Rejoindre une liste existante"],
  ["There are no expense lists yet", "Il n'y a pas encore de liste de dépenses"],
  ["Licensed under GNU GPLv3", "Sous licence GNU GPLv3"],
];


const locales: Map<string, Locale> = new Map([
  ["it", locale_it],
  ["fr", locale_fr],
]);

function lookup<A>(m: Map<A, A>, k: A): A {
  const v = m.get(k);
  return v ? v : k;
}

function getLocale(): (str: string) => string {
  const languages = navigator.languages ?? [];
  for (let language of languages) {
    const languageCode = language.split("-")[0];
    if (!languageCode) continue;
    if (languageCode == "en") break;
    const locale = locales.get(languageCode);
    if (locale) {
      const m = new Map(locale);
      return (str: string) => lookup(m, str);
    }
  }
  return (str: string) => str;
}

export const s = getLocale();
