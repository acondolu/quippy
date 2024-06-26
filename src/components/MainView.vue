<template>
  <div>
    <b-navbar type="dark" variant="primary" toggleable="lg">
      <b-button variant="primary" @click="back">
        <b-icon icon="arrow-return-left"/>
      </b-button>
      <b-navbar-brand>
        <strong>{{name}}</strong>
        &nbsp;
        <span :style="styleOfStatus">&#9679;</span>
      </b-navbar-brand>
      <b-navbar-toggle target="nav-collapse"></b-navbar-toggle>

    <b-collapse id="nav-collapse" is-nav>
      <b-navbar-nav>
      <b-button variant="outline-light" :to="{name: 'metadata', params: {id: id, db: client.ledger}}">
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
      </b-navbar-nav>
    </b-collapse>
    </b-navbar>
    <b-list-group>
      <b-list-group-item
        v-for="item in items"
        :to="{name: 'item-edit', params: {ledgerId: id, id: item.id}}"
      >
        <Item :item="item" :client="client"/>
      </b-list-group-item>
    </b-list-group>
  </div>
</template>

<script lang="ts">
import Vue, {PropType} from "vue";
import {type Ledger, type Transaction} from "../Ledger/Ledger";
import {type Client, Clients} from "../Ledger/Client";
import Item from "./Item.vue";

/**
 * Main view of a ledger.
 */
export default Vue.extend({
  components: {Item},
  props: {
    id: String as PropType<string>,
  },
  data() {
    const client: Client = Clients.get(this.id);
    const items = client.items.slice();
    items.sort((a, b) => b.effective_ts - a.effective_ts);
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
      items.sort((a, b) => b.effective_ts - a.effective_ts);
      this.items = items;
    },
    back() {
      this.$router.push({name: "list"});
    },
  },
});
</script>
