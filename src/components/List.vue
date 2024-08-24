<template>
  <div>
    <b-navbar toggleable="lg" variant="primary">
      <img src="icon.png" width="64">
      <div class="h1 mr-lg-2 ml-lg-2">
        Quippy
      </div>
      <b-dropdown text="Add" right>
        <b-dropdown-item @click="newLedger">
          New Expense List
        </b-dropdown-item>
        <b-dropdown-item @click="joinLedger">
          Join Existing
        </b-dropdown-item>
      </b-dropdown>
    </b-navbar>
    <b-list-group>
      <b-list-group-item
        v-for="client in clientsSorted"
        :to="{ name: 'ledger', params: {id: client.id}}"
        :key="client.id"
      >
        <h6> {{ client.name }} </h6>
        <small> {{ client.description }} </small>
      </b-list-group-item>
      <b-list-group-item v-if="clientsSorted.length == 0" disabled>
        <div>
          There are no expense lists yet.
        </div>
        <div>
          Use the <b>Add</b> button above.
        </div>
      </b-list-group-item>
    </b-list-group>
    <b-navbar type="light" variant="primary">
      <div class="text-white text-center" style="font-size: 0.8em;">
        <a href="https://github.com/acondolu/quippy" target="_blank" class="text-white">Licensed under GNU GPLv3</a>
      </div>
      <div class="text-white text-center ml-2" style="font-size: 0.8em;">
        <a @click="reload" class="text-white">{{ gitHash }}</a>
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
      const ledger = Ledgers.add(undefined, undefined, "Untitled List", " ");
      await Clients.register(ledger);
      this.$router.push({name: "metadata", params: {id: ledger.id}});
    },
    async joinLedger() {
      this.$router.push({name: 'join'});
    },
    reload() {
      if (navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({
          type: 'reload',
        });
        console.log("reload");
      } else {
        console.log("reload failed");
      }
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
    },
    gitHash(): string {
      const h = process.env.VUE_APP_GIT_HASH;
      if (h) {
        return `(${h})`;
      }
      return "";
    }
  },
});
</script>
