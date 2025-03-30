import {Ledgers, Ledger, Transaction } from "./Ledger";
import GroupChannel from "./LibMQTT";
import AES_GCM from "./AES-GCM";
import { UUID, getDeviceID, getGroupChannelId, type Versioned, Origin, type UserID, b64encode } from "./Utils";

export namespace SyncManagers {
  const SYNC_MANAGERS: Map<string, SyncManager> = new Map();

  /**
   * Initialize all sync managers and cache them.
   */
  export async function init(): Promise<void> {
    const ledgers = Ledgers.list();
    for (let ledger of ledgers) {
      let syncManager = new SyncManager(ledger);
      await syncManager.init();
      SYNC_MANAGERS.set(ledger.id, syncManager);
    }
  }
  
  /**
   * Register a newly-created ledger.
   */
  export async function register(ledger: Ledger): Promise<SyncManager> {
    let syncManager = SYNC_MANAGERS.get(ledger.id);
    if (!syncManager) {
      syncManager = new SyncManager(ledger);
      await syncManager.init();
      SYNC_MANAGERS.set(ledger.id, syncManager);
    }
    return syncManager;
  }

  /**
   * Get sync manager by Ledger ID.
   * Warning: throws an exception when ID is unknown.
   */
  export function get(id: string): SyncManager {
    const ret = SYNC_MANAGERS.get(id);
    if (!ret) {
      throw Error(`SyncManagers.get: ${id} not found.`);
    }
    return ret;
  }

  /**
   * Return all known sync managers.
   */
  export function all(): SyncManager[] {
    return Array.from(SYNC_MANAGERS.values());
  }

  export function del(syncManager: SyncManager) {
    const ledgerId: UUID = syncManager.id;
    Ledgers.remove(ledgerId);
    SYNC_MANAGERS.delete(ledgerId);
  }
}

/**
 * Distributed layer over a local ledger.
 * Manages synchronization between multiple devices.
 * @example
 * const syncManager = new SyncManager(ledger)
 * await syncManager.init()
 */
/* emitted messages: 
   - connection: wait, open, error
   - change (metadata + items)
*/
export class SyncManager extends EventTarget {
  private broadcastTimeout?: number;
  private crypto?: AES_GCM;
  private ledger: Ledger;
  private chan?: GroupChannel;
  private deviceId: string;
  state: "open" | "close";

  constructor(ledger: Ledger) {
    super();
    this.deviceId = getDeviceID();
    this.ledger = ledger;
    ledger.addEventListener("change", (e: any) => this.onChange(e));
    ledger.addEventListener("set-item", (e: any) => this.onSetItem(e));
    this.state = "open";
  }

  private onChange(e: CustomEvent) {
    this.dispatchEvent(e);
    if (e.detail.origin == Origin.LOCAL) {
      this.broadcast();
    }
  }

  private onSetItem(e: CustomEvent) {
    const { item, origin } = (e as CustomEvent).detail;
    if (origin == Origin.LOCAL) {
      this.send({tag: "set-item", device: this.deviceId, item: item})
    }
  }

  /**
   * Initialise crypto and WebSocket.
   */
  async init() {
    this.crypto = await AES_GCM.importKey(this.ledger.key);
    const chanId = getGroupChannelId(this.ledger.ledgerId);
    const chan = new GroupChannel(this.ledger.relayAddress, chanId);
    chan.addEventListener("open", () => this.onOpen());
    chan.addEventListener("close", () => this.onClose());
    chan.addEventListener("error", (e) => this.onError(e));
    chan.addEventListener("message", (e) => this.onMessage(e as MessageEvent));
    this.chan = chan;
  }

  reconnect() {
    return this.chan!.reconnect();
  }

  // Messages

  /**
   * Send a message to the group channel with a mapping
   * {message_id: last_modified_timestamp}.
   */
  private async broadcast() {
    window.clearTimeout(this.broadcastTimeout);
    this.broadcastTimeout = window.setTimeout(() => this.broadcast(), 60000);
    const map: [string, number][] = this.ledger.getItems().map(item => [item.id, item.lastModified]);
    await this.send({tag: "broadcast", device: this.deviceId, map: map, name: this.ledger.name, description: this.ledger.description, participants: Array.from(this.ledger.participants.entries()).map(([userId, name]) => ({value: userId, text: name}))}); // FIXME: TODO:
    await this.send_items(this.ledger.getItems().map(x => x.toJSON()));
  }

  private async hello() {
    await this.send({tag: "hello", device: this.deviceId});
  }

  /**
   * 
   */
  private async send_items(items_json: any[]) {
    await this.send({"tag": "send-items", "items": items_json, "device": this.deviceId});
  }

  private async send(obj: RemoteMessage): Promise<void> {
    const msg = new TextEncoder().encode(JSON.stringify(obj));
    const tag = obj.tag == 'broadcast' || obj.tag == 'send-items' ? obj.tag : undefined;
    this.chan!.send(await this.crypto!.encryptMessage(msg), tag);
  }

  //



  private async onMessage(msg: MessageEvent) {
    let data = null;
    try {
      data = await this.crypto!.decryptMessage(msg.data);
    } catch {
      console.log("bad message");
      return;
    }
    const obj: RemoteMessage = JSON.parse(new TextDecoder("utf-8").decode(data));
    console.log("onMessage", obj, obj.device == this.deviceId);
    if (obj.device == this.deviceId) {
      return;
    }
    switch (obj.tag) {
      case "set-item": {
        this.ledger.setItem(new Transaction(obj.item), Origin.REMOTE);
        return;
      }
      case "send-items": {
        for (let item of obj.items) {
          this.ledger.setItem(new Transaction(item), Origin.REMOTE);
        }
        return;
      }
      case "broadcast": {
        this.ledger.updateTs(obj.name, obj.description, obj.participants);
        return; // TODO
      }
      case "get-items": {
        console.log("get-items", obj);
        return; // TODO
      }
      case "hello": {
        return this.broadcast();
      }
    }
  }

  private onOpen() {
    // Schedule a brodcast message
    if (this.broadcastTimeout) window.clearTimeout(this.broadcastTimeout);
    this.broadcastTimeout = window.setTimeout(() => this.broadcast(), 0);
    // Schedule a hello message
    window.setTimeout(() => this.hello(), 0);
    this.state = "open";
    this.dispatchEvent(new CustomEvent("open"));
  }

  private onClose() {
    if (this.broadcastTimeout) window.clearTimeout(this.broadcastTimeout);
    this.state = "close";
    this.dispatchEvent(new CustomEvent("close"));
    // this.reconnect();
  }

  private onError(e: Event) {
    this.dispatchEvent(new CustomEvent("close"));
  }

  // Re-export Ledger APIs
  setItem(item: Transaction) {
    this.ledger.setItem(item, Origin.LOCAL);
  }
  getItem(id: string): Transaction | null {
    return this.ledger.getItem(id);
  }
  newTransaction(): Transaction {
    return this.ledger.newItem();
  }
  get items(): Transaction[] {
    return this.ledger.getItems();
  }
  get name(): string { return this.ledger.name.content; }
  get description(): string { return this.ledger.description.content; }
  get id(): string { return this.ledger.id; }
  get user(): string | null { return this.ledger.user; }
  get participants(): Map<UserID, Versioned<string>> {
    return this.ledger.participants;
  }
  get participantList(): {value: UserID, text: string}[] {
    return this.ledger.participantList;
  }
  get key(): string {
    return b64encode(this.ledger.key);
  }
  get relayAddress(): string {
    return this.ledger.relayAddress;
  }
  update(name: string, description: string, participants: {value: UserID, text: string}[], user: string | null) {
    return this.ledger.update(name, description, participants, user);
  }
}

type RemoteMessage
  = {tag: "set-item", item: any, device: string,}
  | {tag: "broadcast", device: string, map: [string, number][], name: Versioned<string>, description: Versioned<string>, participants: {value: string, text: Versioned<string>}[]}
  | {tag: "send-items", device: string, items: any[]}
  | {tag: "get-items", items: UUID[], device: string}
  | {tag: "hello", device: string}
;
