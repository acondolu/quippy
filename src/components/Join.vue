<template>
  <div>
    <b-navbar toggleable="lg" type="dark" variant="primary">
      <b-button variant="primary" @click="back">
        <b-icon icon="arrow-return-left"/>
      </b-button>
      <b-navbar-brand>
        Join existing ledger
      </b-navbar-brand>
    </b-navbar>
      <div class="m-4">
          <b-form-group
            label="Token:"
            label-cols-sm="2"
            label-align-sm="right"
          >
            <b-form-input v-model="token"></b-form-input>
          </b-form-group>

          <b-form-group
            label-cols-sm="2"
            label-align-sm="right"
            class="mb-0"
          >
            <b-button @click="onClick" variant="primary" :disabled="!valid">Join</b-button>
          </b-form-group>
      </div>
  </div>
</template>

<script lang="ts">
import Vue from "vue";
import { Client, Clients } from "../Ledger/Client";
import { Ledgers } from "../Ledger/Ledger";

export function makeJoinLink(client: Client): string {
  return btoa(JSON.stringify({
    relayAddress: client.relayAddress,
    id: client.id,
    key: client.key,
  }));
}

export default Vue.extend({
  data() {
    let token: string = "";
    if (window.location.hash.startsWith("#/join/")) {
      token = window.location.hash.substring(7);
    }
    return {token};
  },
  mounted() {
    if (this.token) {
      this.onClick();
    }
  },
  methods: {
    async onClick() {
      if (!this.valid) return;
      const obj = JSON.parse(atob(this.token));
      // const relayAddress = obj.relayAddress;
      const id = obj.id;
      const key = obj.key;
      if (id.length != 36 || key.length == 0) {
        // FIXME: better checks
        return;
      }
      const ledger = Ledgers.add(id, key);
      await Clients.register(ledger);
      this.$router.push({name: "ledger", params: {id: id}});
    },
    back() {
      this.$router.push({name: "list"});
    },
  },
  computed: {
    valid(): any {
      return this.token && this.token.length > 0;
    },
  },

});
</script>
