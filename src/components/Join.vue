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
            label="Broker:"
            label-cols-sm="2"
            label-align-sm="right"
          >
            <b-form-input v-model="relayAddress" disabled></b-form-input>
          </b-form-group>

          <b-form-group
            label="ID:"
            label-cols-sm="2"
            label-align-sm="right"
          >
            <b-form-input v-model="id"></b-form-input>
          </b-form-group>

          <b-form-group
            label="Key:"
            label-cols-sm="2"
            label-align-sm="right"
          >
            <b-form-input v-model="key"></b-form-input>
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
  const loc = window.location;
  let jd = btoa(JSON.stringify({
    relayAddress: client.relayAddress,
    id: client.id,
    key: client.key,
  }));
  return `${loc.protocol}//${loc.host}${loc.pathname}#/join/${jd}`;
}

export default Vue.extend({
  data() {
    let jd: string | null = null;
    if (window.location.hash.startsWith("#/join/")) {
      jd = window.location.hash.substring(7);
    }
    let relayAddress = "wss://ws.acondolu.me" as string;
    let id = "" as string;
    let key = "" as string;
    if (jd) {
      const obj = JSON.parse(atob(jd));
      relayAddress = obj.relayAddress;
      id = obj.id;
      key = obj.key;
    }
    return {relayAddress, id, key, jd};
  },
  mounted() {
    if (this.jd) {
      this.onClick();
    }
  },
  methods: {
    async onClick() {
      if (this.id.length != 36 || this.key.length == 0) {
        // FIXME: better checks
        return;
      }
      const ledger = Ledgers.add(this.id, this.key);
      await Clients.register(ledger);
      this.$router.push({name: "ledger", params: {id: this.id}});
    },
    back() {
      this.$router.push({name: "list"});
    },
  },
  computed: {
    valid(): any {
      return this.relayAddress && this.id && this.key;
    },
  },

});
</script>
