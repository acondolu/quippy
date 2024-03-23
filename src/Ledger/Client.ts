import {Ledgers, Ledger, Transaction } from "./Ledger";
import Room from "../LibMQTT";
import AES_GCM from "../AES-GCM";
import { UUID, getDeviceID, roomIdOfLegerId, type WithTs, Origin, type UserID, b64encode } from "./Utils";



export namespace Clients {
  const CLIENTS: Map<string, Client> = new Map();

  /**
   * Initialize all clients and cache them.
   */
  export async function init(): Promise<void> {
    const ledgers = Ledgers.lst();
    for (let ledger of ledgers) {
      let client = new Client(ledger);
      await client.init();
      CLIENTS.set(ledger.id, client);
    }
  }
  /**
   * Register a newly-created ledger.
   */
  export async function register(ledger: Ledger): Promise<Client> {
    let client = CLIENTS.get(ledger.id);
    if (!client) {
      client = new Client(ledger);
      await client.init();
      CLIENTS.set(ledger.id, client);
    }
    return client;
  }

  /**
   * Get client by Ledger ID.
   * Warning: throws an exception when ID is unknown.
   */
  export function get(id: string): Client {
    const ret = CLIENTS.get(id);
    if (!ret) {
      throw Error(`Clients.get: ${id} not found.`);
    }
    return ret;
  }

  /**
   * Return all known clients.
   */
  export function all(): Client[] {
    return Array.from(CLIENTS.values());
  }

  export function del(client: Client) {
    const ledgerId: UUID = client.id;
    Ledgers.del(ledgerId);
    CLIENTS.delete(ledgerId);
  }
}

/**
 * Distributed layer over a local ledger.
 * @example
 * const client = new Client(ledger)
 * await client.init()
 */
/* emitted messages: 
   - connection: wait, open, error
   - change (metadata + items)
*/
export class Client {
  private broadcastTimeout?: number;
  private crypto?: AES_GCM;
  private ledger: Ledger;
  private room?: Room;
  private deviceId: string;
  private listeners: [string, () => void][] = new Array();
  state: "open" | "close";

  constructor(ledger: Ledger) {
    this.deviceId = getDeviceID();
    this.ledger = ledger;
    ledger.on("change", this.onChange.bind(this));
    ledger.on("set-item", (item: Transaction, origin: Origin) => {
      if (origin == Origin.LOCAL) {
        this.send({tag: "set-item", device: this.deviceId, item: item})
      }
    });
    this.state = "open";
  }

  private onChange(ledgerId: string, data: Ledger, origin: Origin) {
    this.emit("change", ledgerId, data, origin);
    if (origin == Origin.LOCAL) {
      this.broadcast();
    }
  }

  /**
   * Initialise crypto and WebSocket.
   */
  async init() {
    this.crypto = await AES_GCM.importKey(this.ledger.key);
    const room_id = roomIdOfLegerId(this.ledger.ledgerId);
    const room = new Room(this.ledger.relayAddress, room_id);
    room.addEventListener("open", () => this.onOpen());
    room.addEventListener("close", () => this.onClose());
    room.addEventListener("error", (evt) => this.onError(evt));
    room.addEventListener("message", (evt) => this.onMessage(evt as MessageEvent));
    this.room = room;
  }

  reconnect() {
    return this.room!.reconnect();
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

  removeListeners() {
    this.listeners.length = 0;
  }

  // Messages

  /**
   * Send a message to the room with a mapping
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
    this.room!.send(await this.crypto!.encryptMessage(msg), obj.tag);
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
    console.log("onMessage", data);
    const obj: RemoteMessage = JSON.parse(new TextDecoder("utf-8").decode(data));
    console.log("onMessage", obj);
    // TODO: do something with the message
    if (obj.device == this.deviceId) {
      console.log("ignoring");
      return;
    }
    console.log("not ignoring!");
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
        console.log(obj);
        return; // TODO
      }
      case "get-items": {
        console.log(obj);
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
    this.emit("open");
  }

  private onClose() {
    if (this.broadcastTimeout) window.clearTimeout(this.broadcastTimeout);
    this.state = "close";
    this.emit("close");
    // this.reconnect();
  }

  private onError(err: any) {
    this.emit("close");
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
  get participants(): Map<UserID, WithTs<string>> {
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
  | {tag: "broadcast", device: string, map: [string, number][], name: WithTs<string>, description: WithTs<string>, participants: {value: string, text: WithTs<string>}[]}
  | {tag: "send-items", device: string, items: any[]}
  | {tag: "get-items", items: UUID[], device: string}
  | {tag: "hello", device: string}
;
