import { UserID, UUID, b64decode, b64encode, type Versioned, versioned, Origin, ts2iso } from "./Utils";
import { pArray, pString, getItem, setItem, pVersioned, pTuple, Parser } from "./JSON";
import { s } from "./L10n";

export namespace Ledgers {
  export function list(): Ledger[] {
    const ids = getItem("ledger-app-list", pArray(pString)) || [];
    return ids.map((id: string) => new Ledger(id));
  }

  export function remove(ledgerId: UUID): void {
    let ids = getItem("ledger-app-list", pArray(pString)) || [];
    ids = ids.filter((id: UUID) => id != ledgerId);
    setItem("ledger-app-list", ids);
  }

  export function add(
      id?: string,
      key?: string,
      name?: string,
      description?: string,
      participants?: [UserID, string][],
  ): Ledger {
    if (!id) {
      id = crypto.randomUUID();
    }
    if (!key) {
      const bs = window.crypto.getRandomValues(new Uint8Array(16));
      key = b64encode(bs);
    }
    let nameTs;
    const now = Date.now();
    if (!name) {
      nameTs = versioned(id, 0);
    } else {
      nameTs = versioned(name, now);
    }
    let descriptionTs;
    if (!description) {
      descriptionTs = versioned(s("Sync in progress"), 0);
    } else {
      descriptionTs = versioned(description, now);
    }
    participants = participants || [];
    const participantsTs = participants.map(([id, name]) => [id, versioned(name, now)] as [string, Versioned<string>]);
    const obj: LedgerDataJSON = {
      id, key,
      name: nameTs,
      description: descriptionTs,
      participants: participantsTs,
      items: [],
    };
    const ls = getItem("ledger-app-list", pArray(pString)) || [];
    if (ls.indexOf(id) == -1) {
      ls.push(id);
      setItem("ledger-app-list", ls);
    }
    setItem(id, obj);
    return new Ledger(id);
  }

  /**
   * Garbage collect local storage.
   */
  export function gc() {
    const liveKeys = new Set<string>();
    liveKeys.add("ledger-app-list");
    const ls = getItem("ledger-app-list", pArray(pString)) || [];
    const liveLists = [];
    for (const l of ls) {
      const x = getItem(l, (obj: any) => new Ledger(obj));
      if (!x) continue;
      liveLists.push(l);
      liveKeys.add(l);
      for (const item of x.items) {
        // FIXME: actually parse
        if (!localStorage.getItem(item)) continue;
        liveKeys.add(item);
      }
    }
    setItem("ledger-app-list", liveLists);
    for(let key in localStorage) {
      if (!liveKeys.has(key)) {
        delete localStorage[key];
      }
    }
  }
}

type LedgerDataJSON = {
  relayAddress?: string,
  id: string,
  key: string,
  name: Versioned<string>,
  description: Versioned<string>,
  participants: [UserID, Versioned<string>][],
  items: string[],
  user?: string | null,
};

export class Ledger extends EventTarget {
  ledgerId: UUID;
  relayAddress: string;
  id: UUID;
  key: Uint8Array;
  name: Versioned<string>;
  description: Versioned<string>;
  participants: Map<UserID, Versioned<string>>;
  items: TransactionID[];
  user: UserID | null;

  /**
   * Load from local storage.
   */
  constructor(ledgerId: UUID) {
    super();
    this.ledgerId = ledgerId;
    const obj: LedgerDataJSON = getItem(ledgerId, (obj: any) => obj);
    if (!obj) {
      throw Error("Ledger: id not found");
    }
    // Patch new mqtt server address
    if (obj.relayAddress == "wss://ws.acondolu.me")
      obj.relayAddress = undefined;
    this.relayAddress = obj.relayAddress || "wss://ws.quippy.it";
    this.id = obj.id;
    this.key = b64decode(obj.key);
    this.name = obj.name;
    this.description = obj.description;
    const pParticipants = pArray(pTuple<[UserID, Versioned<string>]>([pString, pVersioned(pString)]));
    this.participants = new Map(pParticipants(obj.participants));
    this.items = pArray(pString)(obj.items);
    this.user = obj.user || null;
  }

  update(name: string, description: string, participants: {value: UserID, text: string}[], user: string | null) {
    let changed = false;
    let now = Date.now();
    if (name != this.name.content) {
      changed = true;
      this.name = {content: name, timestamp: now};
    }
    if (description != this.description.content) {
      changed = true;
      this.description = {content: description, timestamp: now};
    }
    if (user != this.user) {
      changed = true;
      this.user = user;
    }
    for (let p of participants) {
      const name = this.participants.get(p.value);
      if (name) {
        if (name.content != p.text) {
          name.content = p.text;
          name.timestamp = now;
          changed = true;
        }
      } else {
        changed = true;
        this.participants.set(p.value, {content: p.text, timestamp: now});
      }
    }
    if (changed) {
      this.save(Origin.LOCAL);
    }
  }

  updateTs(name: Versioned<string>, description: Versioned<string>, participants: {value: string, text: Versioned<string>}[]) {
    let changed = false;
    if (this.name.timestamp <= name.timestamp) {
      changed = true;
      this.name = name;
    }
    if (this.description.timestamp <= description.timestamp) {
      changed = true;
      this.description = description;
    }
    for (let p of participants) {
      const c = this.participants.get(p.value);
      if (c) {
        if (c.timestamp <= p.text.timestamp) {
          changed = true;
          c.timestamp = p.text.timestamp;
          c.content = p.text.content;
        }
      } else {
        changed = true;
        this.participants.set(p.value, p.text);
      }
    }
    if (changed) {
      this.save(Origin.REMOTE);
    }
  }

  /**
   * Save to local storage (emits change event).
   */
  private save(origin: Origin) {
    setItem(this.ledgerId, this.toJSON());
    this.dispatchEvent(new CustomEvent("change", { 
      detail: { ledgerId: this.ledgerId, data: this, origin } 
    }));
  }

  private toJSON(): LedgerDataJSON {
    return {
      relayAddress: this.relayAddress,
      id: this.id,
      key: b64encode(this.key),
      name: this.name,
      description: this.description,
      participants: Array.from(this.participants.entries()),
      items: this.items,
      user: this.user,
    };
  }

  setItem(item: Transaction, origin: Origin) {
    const current = this.getItem(item.id);
    if (current) {
      current.updateWith(item);
      item = current;
    }
    let changed = setItem(item.id, item.toJSON());
    if (!this.items.includes(item.id)) {
      this.items.push(item.id);
      changed = true;
    }
    if (changed) this.save(origin);
    this.dispatchEvent(new CustomEvent("set-item", { 
      detail: { item, origin } 
    }));
  }

  getItems(): Transaction[] {
    const ret = [];
    for (let x of this.items) {
      const item = getItem(x, (obj: any) => new Transaction(obj));
      if (item)
        ret.push(item);
    }
    return ret;
  }

  getItem(id: TransactionID): Transaction | null {
    return getItem(id, (obj: any) => new Transaction(obj));
  }

  get participantList(): {value: UserID, text: string}[] {
    return Array.from(this.participants.entries()).map(([userId, name]) => ({value: userId, text: name.content}));
  }

  newItem(): Transaction {
    const now = Date.now();
    const paidFor = Array.from(this.participants.keys());
    return new Transaction({
      id: crypto.randomUUID(),
      description: versioned("", 0),
      amount: versioned(0, 0),
      currency: versioned("EUR", 0),
      paidBy: versioned(this.user || "", 0),
      paidFor: versioned(paidFor, 0),
      weights: versioned(new Array(paidFor.length).fill(1), 0),
      last_modified: 0,
      created_ts: now,
      effective_ts: versioned(ts2iso(now), now),
    });
  }

}


type TransactionID = string;

type TransactionJSON = {
  id: UUID;
  description: Versioned<string>;
  amount: Versioned<number>;
  currency: Versioned<string>;
  paidBy: Versioned<UserID>;
  paidFor: Versioned<UserID[]>;
  weights: Versioned<number[]>;
  last_modified: number;
  created_ts: number;
  effective_ts: number /*legacy*/ | Versioned<string>;
};

export class Transaction {
  id: UUID;
  description: Versioned<string>;
  amount: Versioned<number>;
  currency: Versioned<string>;
  paidBy: Versioned<UserID>;
  paidFor: Versioned<UserID[]>;
  weights: Versioned<number[]>;
  private modified_ts: number;
  created_ts: number;
  effective_ts: Versioned<string>;

  constructor(obj: TransactionJSON) {
    this.id = obj.id;
    this.description = obj.description;
    if (typeof(obj.amount.content) !== "number" || isNaN(obj.amount.content)) {
      obj.amount.content = 0.0;
    }
    this.amount = obj.amount;
    this.currency = obj.currency;
    // temporary fix
    if (this.currency.content == "€") this.currency.content = "EUR";
    if (this.currency.content == "$") this.currency.content = "USD";
    this.paidBy = obj.paidBy;
    this.paidFor = obj.paidFor;
    this.weights = obj.weights;
    this.modified_ts = obj.last_modified;
    this.created_ts = obj.created_ts || 0;
    this.effective_ts = typeof obj.effective_ts === "number" ? versioned(ts2iso(obj.effective_ts), obj.effective_ts): obj.effective_ts;
  }
  toJSON(): TransactionJSON {
    return {
      id: this.id,
      description: this.description,
      amount: this.amount,
      currency: this.currency,
      paidBy: this.paidBy,
      paidFor: this.paidFor,
      weights: this.weights,
      last_modified: this.modified_ts,
      created_ts: this.created_ts,
      effective_ts: this.effective_ts,
    };
  }

  get lastModified(): number{
    return this.modified_ts || 0;
  }

  update(description: string, amount: number, currency: string, effectiveTs: string, paidBy: UserID, paidFor: UserID[], weights: number[]) {
    const timestamp = Date.now();
    let changed = false;
    if (amount != this.amount.content) {
      changed = true;
      this.amount = {content: amount, timestamp};
    }
    if (description != this.description.content) {
      changed = true;
      this.description = {content: description, timestamp};
    }
    if (currency != this.currency.content) {
      changed = true;
      this.currency = {content: currency, timestamp};
    }
    if (effectiveTs != this.effective_ts.content) {
      changed = true;
      this.effective_ts = {content: effectiveTs, timestamp};
    }
    if (paidBy != this.paidBy.content) {
      changed = true;
      this.paidBy = {content: paidBy, timestamp};
    }
    if (!eqArrays(paidFor, this.paidFor.content)) {
      changed = true;
      this.paidFor = {content: paidFor, timestamp};
    }
    if (!eqArrays(weights, this.weights.content)) {
      changed = true;
      this.weights = {content: weights, timestamp};
    }
    if (changed) {
      this.modified_ts = timestamp;
    }
  };

  updateWith(other: Transaction) {
    this.description = takeNewest(other.description, this.description);
    this.amount = takeNewest(other.amount, this.amount);
    this.currency = takeNewest(other.currency, this.currency);
    this.paidBy = takeNewest(other.paidBy, this.paidBy);
    this.paidFor = takeNewest(other.paidFor, this.paidFor);
    this.weights = takeNewest(other.weights, this.weights);
    this.effective_ts = takeNewest(other.effective_ts, this.effective_ts);
    this.modified_ts = Math.max(other.modified_ts, this.modified_ts);
  }
};

function takeNewest<A>(current: Versioned<A>, incoming: Versioned<A>): Versioned<A> {
  if (current.timestamp <= incoming.timestamp) {
    return incoming;
  } else {
    return current;
  }
}

function eqArrays<A>(a: A[], b: A[]): boolean {
  return a.length === b.length && a.every((value, index) => value === b[index])
}
