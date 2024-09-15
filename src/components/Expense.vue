<template>
  <div class="row">
    <div class="col">
      <div><strong>{{item.description.content}}</strong></div>
      <div><strong>{{ round(item.amount.content) }} {{ item.currency.content }}</strong></div>
    </div>
    <div class="col text-right">
      <div>paid by {{paidBy}}</div>
      <div>on {{paidOn}} </div>
    </div>
  </div>
</template>

<script lang="ts">
import Vue, {PropType} from "vue";
import { Client } from "../Ledger/Client";
import {Transaction} from "../Ledger/Ledger";
import { round } from "../Ledger/Utils";

export default Vue.extend({
  props: {
    client: Object as PropType<Client>,
    item: Object as PropType<Transaction>,
  },
  methods: {
    debug(x: any): string {
      if (!x) return "<???>";
      return JSON.stringify(x.toJSON());
    },
    round(x: number): string {
      return round(x);
    }
  },
  computed: {
    paidBy(): string {
      const p = this.item.paidBy.content;
      return this.client.participants.get(p)?.content || "Unknown";
    },
    paidOn(): string {
      const ts = this.item.effective_ts.content;
      return new Date(ts).toDateString();
    }
  },
});
</script>
