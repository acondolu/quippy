<template>
  <div class="main-container">
    <b-navbar type="dark" variant="primary">
      <b-button variant="outline-light" @click="back">
        <b-icon icon="arrow-return-left"/>
        {{ s('Back') }}
      </b-button>
      <b-navbar-brand>
        {{ s('Edit Expense') }}
      </b-navbar-brand>
    </b-navbar>
    <div class="p-4 scroll">
      <b-form-group
        :label="s('Amount')"
        label-cols-sm="2"
        label-align-sm="right"
      >
        <b-form-input v-model="amount" :state="evalAmount != null"></b-form-input>
      </b-form-group>
      <b-form-group
        :label="s('Description')"
        label-cols-sm="2"
        label-align-sm="right"
      >
        <b-form-input v-model="description" :placeholder="s('New Item')" :state="description != ''"></b-form-input>
      </b-form-group>
      <b-form-group
        :label="s('Date')"
        label-cols-sm="2"
        label-align-sm="right"
      >
        <input type="date" v-model="date">
      </b-form-group>
      <b-form-group
        :label="s('Paid by')"
        label-cols-sm="2"
        label-align-sm="right"
      >
        <b-form-select v-model="paidBy" :options="participantList"/>
      </b-form-group>
      <b-form-group
        :label="s('Paid for')"
        label-cols-sm="2"
        label-align-sm="right"
      >
        <b-form-select v-model="paidFor" :options="participantList" :select-size="4" multiple/>
      </b-form-group>

      <b-form-group
        label-cols-sm="2"
        label-align-sm="right"
        class="mb-0"
      >
        <b-button @click="onClick" variant="primary" :disabled="disabled">{{ s('Save') }}</b-button>
      </b-form-group>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from "vue";
import { SyncManagers } from "../Sync";
import { UserID } from "../Utils";
import { evalExpr } from "../math";
import { s } from "../L10n";

export default Vue.extend({
  props: {
    ledgerId: String,
    id: String,
  },
  data() {
    const sync = SyncManagers.get(this.ledgerId);
    let item;
    if (this.id == 'new') {
      item = sync.newTransaction();
    } else {
      item = sync.getItem(this.id);
    }
    if (!item) {
      throw Error();
    }
    return {
      sync,
      item,
      description: item.description.content as string,
      amount: item.amount.content.toString() as string,
      currency: item.currency.content as string,
      date: item.effective_ts.content,
      paidBy: item.paidBy.content as UserID,
      paidFor: item.paidFor.content as UserID[],
      participantList: sync.participantList,
    };
  },
  methods: {
    onClick() {
      if (this.evalAmount == null) return;
      const item = this.item;
      item.update(this.description, this.evalAmount, this.currency, this.date, this.paidBy, this.paidFor, new Array(this.paidFor.length).fill(1));
      this.sync.setItem(item);
      this.$router.push({ name: 'ledger', params: {id: this.ledgerId}});
    },
    back() {
      this.$router.push({ name: 'ledger', params: {id: this.ledgerId}});
    },
    s(str: string): string {
      return s(str);
    }
  },
  computed: {
    disabled(): boolean {
      return this.evalAmount == null || !this.paidBy || !this.description;
    },
    evalAmount(): number | null {
      return evalExpr(this.amount);
    }
  },
});
</script>
