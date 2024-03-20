<template>
  <div>
    <b-navbar toggleable="lg" variant="primary">
      <img src="icon.png" width="64">
      <div class="h1">
        Quippy
      </div>
      <b-dropdown text="Add" right>
        <b-dropdown-item @click="newLedger">New</b-dropdown-item>
        <b-dropdown-item :to="{name: 'join'}">Join existing</b-dropdown-item>
      </b-dropdown>
    </b-navbar>
    <b-list-group>
      <b-list-group-item
        v-for="client in clientsSorted"
        :to="{ name: 'ledger', params: {id: client.id}}"
      >
        <h6> {{ client.name }} </h6>
        <small> {{ client.description }} </small>
      </b-list-group-item>
    </b-list-group>
    <b-navbar type="light" variant="primary">
      <div class="text-white text-center" style="font-size: 0.8em;">
        <a href="https://github.com/acondolu/quippy" target="_blank">Licensed under GNU GPLv3.</a>
      </div>
    </b-navbar>
  </div>
</template>

<script lang="ts">
import Vue from "vue";
import { Ledgers } from "../Ledger/Ledger";
import { type Client, Clients } from "../Ledger/Client";

export default Vue.extend({
  data: () => {
    return {
      clients: Clients.all() as Client[],
    };
  },
  mounted() {
    for (let client of this.clients) {
      client.on(
        "change",
        () => this.refresh()
      );
    }
  },
  beforeDestroy() {
    for (let client of this.clients) {
      client.removeListeners();
    }
  },
  methods: {
    refresh() {
      this.clients = Clients.all();
    },
    async newLedger() {
      const ledger = Ledgers.add(undefined, undefined, "Untitled Group", " ");
      await Clients.register(ledger);
      this.$router.push({name: "metadata", params: {id: ledger.id}});
    },
  },
  computed: {
    /**
     * Like clients, but sorted alphabetically.
     */
    clientsSorted(): Client[] {
      const ret = this.clients.slice();
      ret.sort((a, b) => a.name.localeCompare(b.name));
      return ret;
    }
  },
});
</script>
