<template>
  <div class="main-container">
    <b-navbar variant="primary">
      <img src="icon.png" width="64" style="border-radius: 15px;">
      <div class="h1 mr-lg-2 ml-lg-2">
        Quippy
      </div>
      <b-dropdown :text="s('Add')" right>
        <b-dropdown-item @click="newLedger">
          {{ s('New Expense List') }}
        </b-dropdown-item>
        <b-dropdown-item @click="joinLedger">
          {{ s('Join Existing') }}
        </b-dropdown-item>
      </b-dropdown>
    </b-navbar>
    <b-list-group class="scroll">
      <b-list-group-item
        v-for="client in clientsSorted"
        :key="client.id"
        @click="() => onClick(client.id)"
      >
        <h6> {{ client.name }} </h6>
        <small> {{ client.description }} </small>
      </b-list-group-item>
      <b-list-group-item v-if="clientsSorted.length == 0" disabled>
        <div>
          {{ s("There are no expense lists yet") }} 🥲
        </div>
      </b-list-group-item>
    </b-list-group>
    <b-navbar type="light" variant="primary">
      <div class="text-white text-center" style="font-size: 0.8em;">
        <a href="https://github.com/acondolu/quippy" target="_blank" class="text-white">
          {{ s('Licensed under GNU GPLv3') }}
        </a>
        {{ gitHash }}
      </div>
    </b-navbar>
  </div>
</template>

<script lang="ts">
import Vue from "vue";
import { Ledgers } from "../Ledger/Ledger";
import { type Client, Clients } from "../Ledger/Client";
import {s} from "../L10n";

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
    onClick(clientId: string) {
      this.$router.push({ name: 'ledger', params: {id: clientId}});
    },
    async newLedger() {
      const ledger = Ledgers.add(undefined, undefined, s("Untitled List"), " ");
      await Clients.register(ledger);
      this.$router.push({name: "metadata", params: {id: ledger.id}});
    },
    async joinLedger() {
      this.$router.push({name: 'join'});
    },
    s(str: string): string {
      return s(str);
    }
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
        return ` · ${s('Version')} ${h}`;
      }
      return "";
    }
  },
});
</script>
