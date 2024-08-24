<template>
  <div>
    <b-navbar toggleable="lg" type="dark" variant="primary">
      <b-button variant="primary" @click="back">
        <b-icon icon="arrow-return-left" />
      </b-button>
      <b-navbar-brand> Join Existing Ledger </b-navbar-brand>
    </b-navbar>
    <b-alert variant="info" show>
      <div>
        To join an existing expense list, ask somebody to share with you the 
        <i>join token</i> (it is a long string of letters and numbers,
        and can be found in the <i>Settings</i> of a list).
        Paste the token below.
      </div>
    </b-alert>
    <div class="m-4">
      <b-form-group label="Token:" label-cols-sm="2" label-align-sm="right">
        <b-form-input v-model="token" :state="state"></b-form-input>
      </b-form-group>

      <b-form-group label-cols-sm="2" label-align-sm="right" class="mb-0">
        <b-button @click="onClick" variant="primary" :disabled="!state"
          >Join</b-button
        >
      </b-form-group>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from "vue";
import { Client, Clients } from "../Ledger/Client";
import { Ledgers } from "../Ledger/Ledger";

export function makeJoinLink(client: Client): string {
  return btoa(
    JSON.stringify({
      relayAddress: client.relayAddress,
      id: client.id,
      key: client.key,
    })
  );
}

export default Vue.extend({
  data() {
    let token: string = "";
    if (window.location.hash.startsWith("#/join/")) {
      token = window.location.hash.substring(7);
    }
    return { token };
  },
  mounted() {
    if (this.token) {
      this.onClick();
    }
  },
  methods: {
    async onClick() {
      if (!this.parsed) return;
      const [id, key] = this.parsed;
      const ledger = Ledgers.add(id, key);
      await Clients.register(ledger);
      this.$router.push({ name: "ledger", params: { id: id } });
    },
    back() {
      this.$router.push({ name: "list" });
    },
  },
  computed: {
    parsed(): [string, string] | undefined {
      if (!this.token) return;
      if (this.token.length == 0) return;
      try {
        const obj = JSON.parse(atob(this.token));
        const id = obj.id;
        const key = obj.key;
        // const relayAddress = obj.relayAddress;
        if (id.length != 36 || key.length == 0) {
          // FIXME: better checks
          return;
        }
        return [id, key];
      } catch {}
    },
    state(): boolean | null {
      if (!this.token) return null;
      return !!this.parsed;
    }
  },
});
</script>
