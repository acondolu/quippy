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
  ["Back", "Indietro"],
  ["Untitled List", "Nuova Lista"],
  ["TOKEN_DESCR", "Condividi questo token con altri per aggiungerli a questa lista"],
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
  ["Back", "Retour"],
  ["Untitled List", "Liste sans nom"],
  ["TOKEN_DESCR", "Partagez cette clé avec d'autres pour leur permettre de rejoindre cette liste"],
];

const locale_en: Locale = [
  ["TOKEN_DESCR", "Share this token with others for allowing them to join this list"],
];

const locales: Map<string, Locale> = new Map([
  ["it", locale_it],
  ["fr", locale_fr],
  ["en", locale_en],
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
  const m = new Map(locale_en);
  return function (str: string) { return lookup(m, str); };
}

export const s = getLocale();
