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
  ["Cancel", "Annulla"],
  ["Save", "Salva"],
  ["Delete", "Elimina"],
  ["Copy", "Copia"],
  ["Untitled List", "Nuova Lista"],
  ["TOKEN_DESCR", "Condividi questo token con altri per aggiungerli a questa lista"],
  ["JOIN_DESCR", "Per unirti a una lista spese esistente, chiedi a qualcuno di condividere con te il token di accesso (è una lunga stringa di lettere e numeri, che può essere trovata nelle Impostazioni di una lista). Incolla il token qui sotto."],
  ["Balances", "Bilanci"],
  ["Reimbursements", "Rimborsi"],
  ["will reimburse", "rimborserà"],
  ["to", "a"],
  ["Export as CSV", "Esporta come CSV"],
  ["Join Existing Ledger", "Unisciti alla Lista Esistente"],
  ["Token", "Token"],
  ["Join", "Unisciti"],
  ["Edit Expense", "Modifica Spesa"],
  ["Amount", "Importo"],
  ["Description", "Descrizione"],
  ["Date", "Data"],
  ["Paid by", "Pagato da"],
  ["Paid for", "Pagato per"],
  ["paid by", "pagato da"],
  ["on", "il"],
  ["RECONNECT_MSG", "Tentativo di riconnessione al server... Controlla la tua connessione internet"],
  ["SYNC_WARNING", "I cambiamenti non saranno sincronizzati con altri partecipanti (e viceversa) finché l'app non si riconnette al server."],
  ["Search", "Cerca"],
  ["Search string", "Testo di ricerca"],
  ["Expense", "Spesa"],
  ["Balance", "Bilancio"],
  ["Settings", "Impostazioni"],
  ["Title:", "Titolo:"],
  ["Description:", "Descrizione:"],
  ["Participants:", "Partecipanti:"],
  ["Add participant...", "Aggiungi partecipante..."],
  ["Duplicate names", "Nomi duplicati"],
  ["You are:", "Tu sei:"],
  ["Join Token:", "Token di accesso:"],
  ["Broker:", "Broker:"],
  ["ID:", "ID:"],
  ["Key:", "Chiave:"],
  ["DELETE_CONFIRM", "Vuoi davvero eliminare \"{0}\"?"],
  ["New Item", "Nuovo articolo"],
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
  ["Cancel", "Annuler"],
  ["Save", "Enregistrer"],
  ["Delete", "Supprimer"],
  ["Copy", "Copier"],
  ["Untitled List", "Liste sans nom"],
  ["TOKEN_DESCR", "Partagez cette clé avec d'autres pour leur permettre de rejoindre cette liste"],
  ["JOIN_DESCR", "Pour rejoindre une liste de dépenses existante, demandez à quelqu'un de partager avec vous le jeton d'accès (c'est une longue chaîne de lettres et de chiffres, qui se trouve dans les Paramètres d'une liste). Collez le jeton ci-dessous."],
  ["Balances", "Soldes"],
  ["Reimbursements", "Remboursements"],
  ["will reimburse", "remboursera"],
  ["to", "à"],
  ["Export as CSV", "Exporter en CSV"],
  ["Join Existing Ledger", "Rejoindre une liste existante"],
  ["Token", "Jeton"],
  ["Join", "Rejoindre"],
  ["Edit Expense", "Modifier la dépense"],
  ["Amount", "Montant"],
  ["Description", "Description"],
  ["Date", "Date"],
  ["Paid by", "Payé par"],
  ["Paid for", "Payé pour"],
  ["paid by", "payé par"],
  ["on", "le"],
  ["RECONNECT_MSG", "Tentative de reconnexion au serveur... Veuillez vérifier votre connexion internet"],
  ["SYNC_WARNING", "Les modifications ne seront pas synchronisées avec les autres participants (et vice versa) jusqu'à ce que l'application se reconnecte au serveur."],
  ["Search", "Rechercher"],
  ["Search string", "Texte de recherche"],
  ["Expense", "Dépense"],
  ["Balance", "Solde"],
  ["Settings", "Paramètres"],
  ["Title:", "Titre:"],
  ["Description:", "Description:"],
  ["Participants:", "Participants:"],
  ["Add participant...", "Ajouter un participant..."],
  ["Duplicate names", "Noms en double"],
  ["You are:", "Vous êtes:"],
  ["Join Token:", "Jeton d'accès:"],
  ["Broker:", "Courtier:"],
  ["ID:", "ID:"],
  ["Key:", "Clé:"],
  ["DELETE_CONFIRM", "Voulez-vous vraiment supprimer \"{0}\"?"],
  ["New Item", "Nouvel élément"],
];

const locale_en: Locale = [
  ["TOKEN_DESCR", "Share this token with others for allowing them to join this list"],
  ["JOIN_DESCR", "To join an existing expense list, ask somebody to share with you the join token string (it is a long string of letters and numbers, and can be found in the Settings of a list). Paste the token below."],
  ["RECONNECT_MSG", "Trying to reconnect to the server... Please check your internet connection"],
  ["SYNC_WARNING", "Changes will not be synchronized with other participants (and viceversa) until the app reconnects to the server."],
  ["DELETE_CONFIRM", "Really delete \"{0}\"?"],
];

const locales: Map<string, Locale> = new Map([
  ["it", locale_it],
  ["fr", locale_fr],
  ["en", locale_en],
]);

function lookup(m: Map<string, string>, k: string): string {
  return m.get(k)
    ?? locale_en.find(([kk]) => kk === k)?.[1]
    ?? k;
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
