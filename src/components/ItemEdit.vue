<template>
  <div class="main-container">
    <b-navbar type="dark" variant="primary">
      <b-navbar-brand>
        <b-button variant="outline-light" @click="back">
          <b-icon icon="arrow-return-left"/>
          Back
        </b-button>
        Edit Expense
      </b-navbar-brand>
    </b-navbar>
    <div class="p-4 scroll">
      <b-form-group
        label="Description:"
        label-cols-sm="2"
        label-align-sm="right"
      >
        <b-form-input v-model="description" placeholder="New Item" :state="description != ''"></b-form-input>
      </b-form-group>
      <b-form-group
        label="Amount:"
        label-cols-sm="2"
        label-align-sm="right"
      >
        <b-form-input v-model="amount" :state="evalAmount != null"></b-form-input>
      </b-form-group>
      <b-form-group
        label="Paid by:"
        label-cols-sm="2"
        label-align-sm="right"
      >
        <b-form-select v-model="paidBy" :options="participantList"/>
      </b-form-group>
      <b-form-group
        label="Paid for:"
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
        <b-button @click="onClick" variant="primary" :disabled="disabled">Save</b-button>
      </b-form-group>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from "vue";
import { Clients } from "../Ledger/Client";
import { UserID } from "../Ledger/Utils";
import { evalExpr } from "../math";

export default Vue.extend({
  props: {
    ledgerId: String,
    id: String,
  },
  data() {
    const client = Clients.get(this.ledgerId);
    let item;
    if (this.id == 'new') {
      item = client.newTransaction();
    } else {
      item = client.getItem(this.id);
    }
    if (!item) {
      throw Error();
    }
    return {
      client,
      item,
      description: item.description.content as string,
      amount: item.amount.content.toString() as string,
      currency: item.currency.content as string,
      paidBy: item.paidBy.content as UserID,
      paidFor: item.paidFor.content as UserID[],
      participantList: client.participantList,
    };
  },
  methods: {
    onClick() {
      if (this.evalAmount == null) return;
      const item = this.item;
      item.update(this.description, this.evalAmount, this.currency, this.paidBy, this.paidFor, new Array(this.paidFor.length).fill(1));
      this.client.setItem(item);
      this.$router.push({ name: 'ledger', params: {id: this.ledgerId}});
    },
    back() {
      this.$router.push({ name: 'ledger', params: {id: this.ledgerId}});
    },
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
