<template>
  <div class="row">
    <div class="col">
      <div><strong>{{ item.description.content }}</strong></div>
      <div :class="amountClass"><strong>{{ round(item.amount.content) }} {{ ccy }}</strong></div>
    </div>
    <div class="col text-right">
      <div><span class="text-muted">{{ s('paid by') }}</span> <strong>{{paidBy}}</strong></div>
      <div><span class="text-muted">{{ s('on') }} {{paidOn}}</span></div>
    </div>
  </div>
</template>

<script lang="ts">
import Vue, { PropType } from "vue";
import { SyncManager } from "../Sync";
import { Transaction } from "../Ledger";
import { round } from "../math";
import { s } from "../L10n";
import { prettyCcy } from "../Currency";

export default Vue.extend({
  props: {
    sync: EventTarget as PropType<SyncManager>,
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
      const date = new Date(ts);
      const month = new Intl.DateTimeFormat(undefined, { month: "short" }).format(date);
      const day = String(date.getDate());
      const year = date.getFullYear();
      return `${day} ${month} ${year}`;
    },
    ccy(): string {
      return prettyCcy(this.item.currency.content);
    },
    amountClass(): string {
      return this.item.amount.content < 0 ? "text-danger" : "text-success";
    }
  },
});
</script>
