import MQTT from "mqtt";
import { b64decode, b64encode } from "./Ledger/Utils";

type State = "WAIT" | "OPEN" | "CONN" | "DONE";

export default class Room implements EventTarget {
  private listenOpen: Set<EventListenerOrEventListenerObject> = new Set();
  private listenError: Set<EventListenerOrEventListenerObject> = new Set();
  private listenMessage: Set<EventListenerOrEventListenerObject> = new Set();
  private listenClose: Set<EventListenerOrEventListenerObject> = new Set();
  private client: MQTT.MqttClient;
  private state: State;
  private broker: string;
  private topic: string;

  
  /**
   * broker: "mqtt://test.mosquitto.org"
   */
  constructor(broker: string, topic: Uint8Array) {
    this.broker = broker;
    this.topic = "ledgerapp/" + b64encode(topic);
    this.state = "WAIT";
    const client = MQTT.connect(this.broker);
    client.on("connect", () => {
      this.state = "OPEN";
      console.log("on connect", arguments);
      this.client.subscribe(this.topic, (err) => {
        if (err) {
          console.log("subscribe error:", err);
          this.doError(new Event("error"));
          return;
        }
        console.log("subscribe okay");
        this.state = "CONN";
        return this.fire(new Event("open"), this.listenOpen);
      })
    });
    client.on("close", () => this.doClose());
    client.on("error", () => this.doError(new Event("error")));
    client.on("message", (_topic, data) => {
      console.log("recv", data);
      const event = new MessageEvent("message", {data: b64decode(data.toString())}) as MessageEvent;
      return this.fire(event, this.listenMessage);
    });
    this.client = client;
  }

  reconnect() {
    if (this.state != "DONE") return;
    this.state = "WAIT";
    this.client.reconnect();
  }

  private doClose() {
    this.state = "DONE";
    this.fire(new Event("close"), this.listenClose);
  }

  private doError(event: Event) {
    this.state = "DONE";
    this.fire(event, this.listenError);
  }

  private fire(event: Event, listeners: Set<EventListenerOrEventListenerObject>) {
    listeners.forEach((ls: EventListenerOrEventListenerObject) => {
      if ("handleEvent" in ls) {
        ls.handleEvent(event);
      } else {
        ls(event);
      }
    });
  }

  send(data: Uint8Array): void {
    console.log("send", this.state, data);
    if (this.state == "CONN") {
      this.client.publish(this.topic, b64encode(data));
    }
  }

  close(): void {
    if (this.state == "CONN") {
      this.client.end();
    }
  }

  addEventListener(type: "open" | "error" | "message" | "close", callback: EventListenerOrEventListenerObject | null, options?: boolean | AddEventListenerOptions | undefined): void {
    if (!callback) return; // FIXME
    switch (type) {
      case "open": {
        this.listenOpen.add(callback);
        return;
      }
      case "error": {
        this.listenError.add(callback);
        return;
      }
      case "message": {
        this.listenMessage.add(callback);
        return;
      }
      case "close": {
        this.listenClose.add(callback);
        return;
      }
      default: {
        throw Error(`addEventListener: unsupported event type '${type}'`);
      }
    }
  }

  removeEventListener(type: string, callback: EventListenerOrEventListenerObject | null, options?: boolean | EventListenerOptions | undefined): void {
    throw Error("STUB");
  }

  dispatchEvent(event: Event): boolean {
    throw Error("STUB");
  }

}