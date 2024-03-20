import { UserID, UUID, getItem, pArray, b64decode, pString, b64encode, setItem, type WithTs, withTs, Origin } from "./Utils";

export namespace Ledgers {
  export function lst(): Ledger[] {
    const ids = getItem("ledger-app-list", pArray(pString)) || [];
    return ids.map((id: string) => new Ledger(id));
  }

  export function del(ledgerId: UUID): void {
    throw Error("Ledgers.del: STUB")
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
      nameTs = withTs(id, 0);
    } else {
      nameTs = withTs(name, now);
    }
    let descriptionTs;
    if (!description) {
      descriptionTs = withTs("Sync in progress", 0);
    } else {
      descriptionTs = withTs(description, now);
    }
    participants = participants || [];
    const participantsTs = participants.map(([id, name]) => [id, withTs(name, now)] as [string, WithTs<string>]);
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
    const reachable = new Set<string>();
    reachable.add("ledger-app-list");
    const ls = getItem("ledger-app-list", pArray(pString)) || [];
    const ls2 = [];
    for (const l of ls) {
      const x = getItem(l, (obj: any) => new Ledger(obj));
      if (!x) continue;
      ls2.push(l);
      reachable.add(l);
      for (const item of x.items) {
        // FIXME: actually parse
        if (!localStorage.getItem(item)) continue;
        reachable.add(item);
      }
    }
    setItem("ledger-app-list", ls2);
    for(let key in localStorage) {
      if (!reachable.has(key)) {
        delete localStorage[key];
      }
    }
  }
}

type LedgerDataJSON = {
  relayAddress?: string,
  id: string,
  key: string,
  name: WithTs<string>,
  description: WithTs<string>,
  participants: [UserID, WithTs<string>][],
  items: string[],
  user?: string | null,
};

export class Ledger {
  ledgerId: UUID;
  relayAddress: string;
  id: UUID;
  key: Uint8Array;
  name: WithTs<string>;
  description: WithTs<string>;
  participants: Map<UserID, WithTs<string>>;
  items: TransactionID[];
  // data: LedgerData;
  listeners: [string, () => void][] = new Array();
  user: UserID | null;

  /**
   * Load from local storage.
   */
  constructor(ledgerId: UUID) {
    this.ledgerId = ledgerId;
    const obj: LedgerDataJSON = getItem(ledgerId, (obj: any) => obj);
    if (!obj) {
      throw Error("Ledger: id not found");
    }
    this.relayAddress = obj.relayAddress || "wss://ws.acondolu.me";
    this.id = obj.id;
    this.key = b64decode(obj.key);
    this.name = obj.name;
    this.description = obj.description;
    let p = pArray((x: any) => {
      return x as [UserID, WithTs<string>];
    });
    this.participants = new Map(p(obj.participants));
    this.items = pArray(pString)(obj.items);
    this.user = obj.user || null;
  }

  // Event handling

  on(eventName: string, callback: any) {
    this.listeners.push([eventName, callback]);
  }

  private emit(eventName: string, ...args: any[]) {
    for (let [e, callback] of this.listeners) {
      if (e == eventName) {
        (callback as any)(...args);
      }
    }
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

  updateTs(name: WithTs<string>, description: WithTs<string>, participants: {value: string, text: WithTs<string>}[]) {
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
    this.emit("change", this.ledgerId, this, origin);
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
    this.emit("set-item", item, origin);
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
      description: withTs("", 0),
      amount: withTs(0, 0),
      currency: withTs("€", 0),
      paidBy: withTs(this.user || "", 0),
      paidFor: withTs(paidFor, 0),
      weights: withTs(new Array(paidFor.length).fill(1), 0),
      last_modified: 0,
      created_ts: now,
      effective_ts: now,
    });
  }

}


type TransactionID = string;

type TransactionJSON = {
  id: UUID;
  description: WithTs<string>;
  amount: WithTs<number>;
  currency: WithTs<string>;
  paidBy: WithTs<UserID>;
  paidFor: WithTs<UserID[]>;
  weights: WithTs<number[]>;
  last_modified: number;
  created_ts: number;
  effective_ts: number;
};

export class Transaction {
  id: UUID;
  description: WithTs<string>;
  amount: WithTs<number>;
  currency: WithTs<string>;
  paidBy: WithTs<UserID>;
  paidFor: WithTs<UserID[]>;
  weights: WithTs<number[]>;
  private modified_ts: number;
  created_ts: number;
  effective_ts: number;

  constructor(obj: TransactionJSON) {
    this.id = obj.id;
    this.description = obj.description;
    this.amount = obj.amount;
    this.currency = obj.currency;
    this.paidBy = obj.paidBy;
    this.paidFor = obj.paidFor;
    this.weights = obj.weights;
    this.modified_ts = obj.last_modified;
    this.created_ts = obj.created_ts || 0;
    this.effective_ts = obj.effective_ts || 0;
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

  update(description: string, amount: number, currency: string, paidBy: UserID, paidFor: UserID[], weights: number[]) {
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
    this.modified_ts = Math.max(other.modified_ts, this.modified_ts);
  }
};

function takeNewest<A>(current: WithTs<A>, incoming: WithTs<A>): WithTs<A> {
  if (current.timestamp <= incoming.timestamp) {
    return incoming;
  } else {
    return current;
  }
}

function eqArrays<A>(a: A[], b: A[]): boolean {
  return a.length === b.length && a.every((value, index) => value === b[index])
}
