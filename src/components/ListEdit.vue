<template>
  <div class="main-container">
    <b-navbar type="dark" variant="primary">
      <b-button variant="outline-light" @click="back">
        <b-icon icon="arrow-return-left" />
        {{ s('Cancel') }}
      </b-button>
      <b-navbar-brand>
        <strong>{{ name }}</strong>
      </b-navbar-brand>
    </b-navbar>
    <div class="p-4 scroll">
      <b-form-group :label="s('Title:')" label-cols-sm="2" label-align-sm="right">
        <b-form-input v-model="name"></b-form-input>
      </b-form-group>
      <b-form-group
        :label="s('Description:')"
        label-cols-sm="2"
        label-align-sm="right"
      >
        <b-form-input v-model="description"></b-form-input>
      </b-form-group>
      <b-form-group
        :label="s('Participants:')"
        label-cols-sm="2"
        label-align-sm="right"
      >
      <b-form-tags :value="participantsList" :placeholder="s('Add participant...')" no-tag-remove @input="addParticipant" :duplicate-tag-text="s('Duplicate names')"></b-form-tags>
      </b-form-group>
      <b-form-group :label="s('You are:')" label-cols-sm="2" label-align-sm="right">
        <b-form-select v-model="user" :options="participants" />
      </b-form-group>

      <b-form-group label-cols-sm="2" label-align-sm="right">
        <b-button @click="onClick" variant="primary">
          <b-icon icon="save" />
          {{ s('Save') }}
        </b-button>
        <b-button @click="onDelete" variant="danger" class="ml-1">
          <b-icon icon="trash" />
          {{ s('Delete') }}
        </b-button>
      </b-form-group>

      <hr>

      <b-form-group
        :label="s('Join Token:')"
        label-cols-sm="2"
        label-align-sm="right"
        :description="s('TOKEN_DESCR')"
      >
        <b-input-group>
          <b-form-input :value="link" disabled></b-form-input>
          <b-input-group-append>
            <b-button @click="copyLink" variant="primary">
              <b-icon icon="clipboard" />
              {{ s('Copy') }}
            </b-button>
          </b-input-group-append>
        </b-input-group>
      </b-form-group>

      <b-form-group :label="s('Broker:')" label-cols-sm="2" label-align-sm="right">
        <b-form-input :value="relayAddress" disabled></b-form-input>
      </b-form-group>

      <b-form-group :label="s('ID:')" label-cols-sm="2" label-align-sm="right">
        <b-form-input :value="id" disabled></b-form-input>
      </b-form-group>

      <b-form-group :label="s('Key:')" label-cols-sm="2" label-align-sm="right">
        <b-form-input :value="key" disabled></b-form-input>
      </b-form-group>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from "vue";
import { SyncManagers } from "../Sync";
import { UserID } from "../Utils";
import { makeJoinLink } from "./Join.vue";
import {s} from "../L10n";

export default Vue.extend({
  props: {
    id: String,
  },
  data() {
    const sync = SyncManagers.get(this.id);
    return {
      sync,
      relayAddress: sync.relayAddress as string,
      key: sync.key as string,
      name: sync.name as string,
      description: sync.description as string,
      participants: sync.participantList as { value: UserID; text: string }[],
      user: sync.user as string | null,
    };
  },
  methods: {
    onClick() {
      this.sync.update(
        this.name,
        this.description,
        this.participants,
        this.user || null
      );
      this.$router.replace({ name: "ledger", params: { id: this.id } });
    },
    onDelete() {
      const msg = s('DELETE_CONFIRM').replace('{0}', this.name);
      const resp = confirm(msg);
      if (!resp) return;
      SyncManagers.del(this.sync);
      this.$router.replace({ name: "list" });
    },
    back() {
      this.$router.replace({ name: "ledger", params: { id: this.id } });
    },
    addParticipant(input: string[]) {
      for (let u of input) {
        if (!this.participants.some(v => v.text == u))
          this.participants.push({ value: crypto.randomUUID(), text: u });
      }
    },
    copyLink() {
      navigator.clipboard.writeText(this.link);
    },
    s(str: string): string {
      return s(str);
    }
  },
  computed: {
    participantsList(): string[] {
      return this.participants.map((x) => x.text);
    },
    link(): string {
      return makeJoinLink(this.sync);
    },
  },
});
</script>
