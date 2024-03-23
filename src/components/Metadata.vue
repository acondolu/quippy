<template>
  <div>
    <b-navbar toggleable="lg" type="dark" variant="primary">
      <b-button variant="primary" @click="back">
        <b-icon icon="arrow-return-left"/>
      </b-button>
      <b-navbar-brand>
        {{name}}
      </b-navbar-brand>
    </b-navbar>
    <div class="m-4">
      <b-form-group
        label="Broker:"
        label-cols-sm="2"
        label-align-sm="right"
      >
        <b-form-input :value="relayAddress" disabled></b-form-input>
      </b-form-group>

      <b-form-group
        label="ID:"
        label-cols-sm="2"
        label-align-sm="right"
      >
        <b-form-input :value="id" disabled></b-form-input>
      </b-form-group>

      <b-form-group
        label="Key:"
        label-cols-sm="2"
        label-align-sm="right"
      >
        <b-form-input :value="key" disabled></b-form-input>
      </b-form-group>
      <b-form-group
        label="Join Token:"
        label-cols-sm="2"
        label-align-sm="right"
      >
      <b-input-group>
        <b-form-input :value="link" disabled></b-form-input>
        <b-input-group-append>
          <b-button @click="copyLink" variant="primary">
            <b-icon icon="clipboard"/>
            Copy
          </b-button>
        </b-input-group-append>
      </b-input-group>
      </b-form-group>
      <b-form-group
        label="Name:"
        label-cols-sm="2"
        label-align-sm="right"
      >
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
        <div>{{ participantsList }}</div>
        <b-input-group>
          <b-form-input v-model="userAddContent"/>
          <b-input-group-append>
            <b-button @click="userAdd" variant="primary">
              <b-icon icon="plus-circle"/>
              Add
            </b-button>
          </b-input-group-append>
        </b-input-group>

      </b-form-group>
      <b-form-group
        label="You are:"
        label-cols-sm="2"
        label-align-sm="right"
      >
        <b-form-select v-model="user" :options="participants"/>
      </b-form-group>

      <b-form-group
        label-cols-sm="2"
        label-align-sm="right"
        class="mb-0"
      >
        <b-button @click="onClick" variant="primary">
          <b-icon icon="save"/>
          Save
        </b-button>
        <b-button @click="onDelete" variant="danger" class="ml-1">
          <b-icon icon="trash"/>
          Delete
        </b-button>
      </b-form-group>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from "vue";
import { Clients } from "../Ledger/Client";
import { UserID } from "../Ledger/Utils";
import { makeJoinLink } from "./Join.vue";

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
      participants: client.participantList as {value: UserID, text: string}[],
      user: client.user as string | null,
      userAddContent: "" as string,
    };
  },
  methods: {
    onClick() {
      this.client.update(this.name, this.description, this.participants, this.user || null);
      this.$router.replace({name: "ledger", params: {id: this.id}});
    },
    onDelete() {
      const resp = confirm(`Really delete "${this.name}"?`);
      if (!resp) return;
      Clients.del(this.client);
      this.$router.replace({name: "list"});
    },
    back() {
      this.$router.replace({ name: 'ledger', params: {id: this.id}});
    },
    userAdd() {
      const u = this.userAddContent.trim();
      if (u.length == 0) return;
      this.userAddContent = "";
      this.participants.push({value: crypto.randomUUID(), text: u});
    },
    copyLink() {
      navigator.clipboard.writeText(this.link);
    },
  },
  computed: {
    participantsList(): string {
      return this.participants.map(x => x.text).join(", ");
    },
    link(): string {
      return makeJoinLink(this.client);
    },
  },
});
</script>
