import MQTT from "mqtt";

const enum State {
  WAIT = "WAIT",
  OPEN = "OPEN",
  CONN = "CONN",
  DONE = "DONE"
}

// Wrapper over mqtt library
export default class GroupChannel extends EventTarget {
  private client: MQTT.MqttClient;
  private state: State;
  private broker: string;
  private topic: string;

  constructor(broker: string, chanId: string) {
    super();

    this.broker = broker;
    this.topic = "ledgerapp/" + chanId + "/";
    this.state = State.WAIT;

    const client = MQTT.connect(this.broker);

    client.on("connect", () => {
      this.state = State.OPEN;
      this.client.subscribe(this.topic + "#", (err) => {
        if (err) {
          this.dispatchEvent(new Event("error"));
          return;
        }
        this.state = State.CONN;
        this.dispatchEvent(new Event("open"));
      });
    });
    
    client.on("close", () => {
      this.state = State.DONE;
      this.dispatchEvent(new Event("close"));
    });
    
    client.on("error", () => {
      this.state = State.DONE;
      this.dispatchEvent(new Event("error"));
    });
    
    client.on("message", (_topic, data) => {
      this.dispatchEvent(new MessageEvent("message", {
        data: data as Uint8Array
      }));
    });
    
    this.client = client;
  }

  reconnect(): void {
    if (this.state != State.DONE) return;
    this.state = State.WAIT;
    this.client.reconnect();
  }

  send(data: Uint8Array, topic?: string): void {
    if (this.state == State.CONN) {
      let topic2 = topic ? this.topic + topic : this.topic;
      this.client.publish(topic2, data as Buffer, { retain: topic ? true : false });
    }
  }

  close(): void {
    if (this.state == State.CONN) {
      this.client.end();
    }
  }
}
