<template>
  <div class="main-container">
    <b-navbar type="dark" variant="primary">
      <b-button variant="outline-light" @click="back">
        <b-icon icon="arrow-return-left" />
        {{ s('Cancel') }}
      </b-button>
      <b-navbar-brand>{{ s('Join Existing Ledger') }}</b-navbar-brand>
    </b-navbar>
    <div class="scroll">
      <b-alert variant="info" show>
        <div>
          {{ s('JOIN_DESCR') }}
        </div>
      </b-alert>
      <div class="m-4">
        <b-input-group :prepend="s('Token')" class="mt-3">
          <b-form-input v-model="token" :state="state"></b-form-input>
          <b-input-group-append>
            <b-button @click="onClick" variant="primary" :disabled="!state">
              {{ s('Join') }}
            </b-button>
          </b-input-group-append>
        </b-input-group>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from "vue";
import { SyncManager, SyncManagers } from "../Sync";
import { Ledgers } from "../Ledger";
import { s } from "../L10n";

export function makeJoinLink(sync: SyncManager): string {
  return btoa(
    JSON.stringify({
      relayAddress: sync.relayAddress,
      id: sync.id,
      key: sync.key,
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
      await SyncManagers.register(ledger);
      this.$router.push({ name: "ledger", params: { id: id } });
    },
    back() {
      this.$router.push({ name: "list" });
    },
    s(str: string): string {
      return s(str);
    }
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
    },
  },
});
</script>
