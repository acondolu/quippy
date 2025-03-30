<template>
  <div class="row">
    <div class="col">
      <div><strong>{{ item.description.content }}</strong></div>
      <div><strong>{{ round(item.amount.content) }} {{ item.currency.content }}</strong></div>
    </div>
    <div class="col text-right">
      <div>{{ s('paid by') }} {{paidBy}}</div>
      <div>{{ s('on') }} {{paidOn}} </div>
    </div>
  </div>
</template>

<script lang="ts">
import Vue, { PropType } from "vue";
import { SyncManager } from "../Sync";
import { Transaction } from "../Ledger";
import { round } from "../math";
import { s } from "../L10n";

export default Vue.extend({
  props: {
    sync: Object as PropType<SyncManager>,
    item: Object as PropType<Transaction>,
  },
  methods: {
    round(x: number): string {
      return round(x);
    },
    s(str: string): string {
      return s(str);
    }
  },
  computed: {
    paidBy(): string {
      const p = this.item.paidBy.content;
      return this.sync.participants.get(p)?.content || "Unknown";
    },
    paidOn(): string {
      const ts = this.item.effective_ts.content;
      return new Date(ts).toDateString();
    }
  },
});
</script>
