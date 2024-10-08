<template>
  <div class="main-container">
    <b-navbar type="dark" variant="primary">
      <b-button variant="outline-light" @click="back">
        <b-icon icon="arrow-return-left" variant="sm"/> {{ s('All lists') }}
      </b-button>
      <b-navbar-brand>
        <strong>{{name}}</strong>
      </b-navbar-brand>
    </b-navbar>
    <b-alert variant="danger" :show="state != 'open'" class="mb-0">
      <div>
        <b-spinner small></b-spinner>
        Trying to reconnect to the server...
        Please check your internet connection ⚡️
      </div>
      <div>
        Changes will not be synchronized
        with other participants
        (and viceversa)
        until the app reconnects to the server.
      </div>
    </b-alert>
    <b-list-group class="scroll">
      <b-list-group-item
        v-for="item in items"
        :key="item.id"
        @click="() => onClick(item.id)"
      >
        <Expense :item="item" :client="client"/>
      </b-list-group-item>
    </b-list-group>
    <b-navbar type="light" variant="primary">
      <b-button variant="outline-light" :to="{name: 'metadata', params: {id: id}}">
        <b-icon icon="gear-fill" aria-hidden="true"></b-icon> Settings
      </b-button>
      &nbsp;
      <b-button variant="outline-light" :to="{name: 'balance', params: {ledgerId: id}}">
        <b-icon icon="calculator"/> Balance
      </b-button>
      &nbsp;
      <b-button variant="secondary" :to="{name: 'item-edit', params: {ledgerId: id, id: 'new'}}">
        <span class="text-dark"> <b-icon icon="plus-circle"/> Expense</span>
      </b-button>
    </b-navbar>
  </div>
</template>

<script lang="ts">
import Vue, {PropType} from "vue";
import {type Ledger, type Transaction} from "../Ledger/Ledger";
import {type Client, Clients} from "../Ledger/Client";
import Expense from "./Expense.vue";
import {s} from "../L10n";

function lexy(x: number, y: number): number {
  return x == 0 ? y : x;
}

/**
 * Compare two transactions, returning {-1, 0, +1}.
 * Note: comparison is reversed compared to the natural one,
 * because newer expenses should be displayed on top.
 */
function cmp_transactions(a: Transaction, b: Transaction): number {
  return lexy(
    b.effective_ts.content.localeCompare(a.effective_ts.content),
    Math.sign(b.created_ts - a.created_ts),
  );
}

/**
 * Main view of a ledger.
 */
export default Vue.extend({
  components: {Expense},
  props: {
    id: String as PropType<string>,
  },
  data() {
    const client: Client = Clients.get(this.id);
    const items = client.items.slice();
    items.sort(cmp_transactions);
    return {
      client: client as Client,
      items: items as Transaction[],
      name: client.name as string,
      description: client.description as string,
      state: client.state as string,
    };
  },
  mounted() {
    const client = this.client;
    client.on(
      "change",
      (ledgerId: string, data: Ledger) => this.onChanged(ledgerId, data)
    );
    client.on("open", () => this.state = "open");
    client.on("close", () => this.state = "close");
    client.on("error", () => this.state = "close");
  },
  beforeDestroy() {
    this.client.removeListeners();
  },
  computed: {
    styleOfStatus() {
      if (this.state == "open") {
        return "color: green";
      } else {
        return "color: red";
      }
    },
  },
  methods: {
    onChanged(ledgerId: string, data: Ledger) {
      if (ledgerId == this.id) {
        this.reload(data);
      }
    },
    reload(data: Ledger) {
      this.name = data.name.content;
      this.description = data.description.content;
      const items = this.client!.items.slice();
      items.sort(cmp_transactions);
      this.items = items;
    },
    onClick(itemId: string) {
      this.$router.push({name: 'item-edit', params: {ledgerId: this.id, id: itemId}});
    },
    back() {
      this.$router.push({name: "list"});
    },
    s(str: string): string {
      return s(str);
    },
  },
});
</script>
