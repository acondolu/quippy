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
      <b-form-group label="Title:" label-cols-sm="2" label-align-sm="right">
        <b-form-input v-model="name"></b-form-input>
      </b-form-group>
      <b-form-group
        label="Description:"
        label-cols-sm="2"
        label-align-sm="right"
      >
        <b-form-input v-model="description"></b-form-input>
      </b-form-group>
      <b-form-group
        label="Participants:"
        label-cols-sm="2"
        label-align-sm="right"
      >
      <b-form-tags :value="participantsList" placeholder="Add participant..." no-tag-remove @input="addParticipant" duplicate-tag-text="Duplicate names"></b-form-tags>
      </b-form-group>
      <b-form-group label="You are:" label-cols-sm="2" label-align-sm="right">
        <b-form-select v-model="user" :options="participants" />
      </b-form-group>

      <b-form-group label-cols-sm="2" label-align-sm="right">
        <b-button @click="onClick" variant="primary">
          <b-icon icon="save" />
          Save
        </b-button>
        <b-button @click="onDelete" variant="danger" class="ml-1">
          <b-icon icon="trash" />
          Delete
        </b-button>
      </b-form-group>

      <hr>

      <b-form-group
        label="Join Token:"
        label-cols-sm="2"
        label-align-sm="right"
        :description="s('TOKEN_DESCR')"
      >
        <b-input-group>
          <b-form-input :value="link" disabled></b-form-input>
          <b-input-group-append>
            <b-button @click="copyLink" variant="primary">
              <b-icon icon="clipboard" />
              Copy
            </b-button>
          </b-input-group-append>
        </b-input-group>
      </b-form-group>

      <b-form-group label="Broker:" label-cols-sm="2" label-align-sm="right">
        <b-form-input :value="relayAddress" disabled></b-form-input>
      </b-form-group>

      <b-form-group label="ID:" label-cols-sm="2" label-align-sm="right">
        <b-form-input :value="id" disabled></b-form-input>
      </b-form-group>

      <b-form-group label="Key:" label-cols-sm="2" label-align-sm="right">
        <b-form-input :value="key" disabled></b-form-input>
      </b-form-group>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from "vue";
import { Clients } from "../Ledger/Client";
import { UserID } from "../Ledger/Utils";
import { makeJoinLink } from "./Join.vue";
import {s} from "../L10n";

export default Vue.extend({
  props: {
    id: String,
  },
  data() {
    const client = Clients.get(this.id);
    return {
      client,
      relayAddress: client.relayAddress as string,
      key: client.key as string,
      name: client.name as string,
      description: client.description as string,
      participants: client.participantList as { value: UserID; text: string }[],
      user: client.user as string | null,
    };
  },
  methods: {
    onClick() {
      this.client.update(
        this.name,
        this.description,
        this.participants,
        this.user || null
      );
      this.$router.replace({ name: "ledger", params: { id: this.id } });
    },
    onDelete() {
      const resp = confirm(`Really delete "${this.name}"?`);
      if (!resp) return;
      Clients.del(this.client);
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
      return makeJoinLink(this.client);
    },
  },
});
</script>
