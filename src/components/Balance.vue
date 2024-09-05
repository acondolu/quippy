<template>
  <div class="main-container">
    <b-navbar type="dark" variant="primary">
      <b-button variant="outline-light" @click="back">
        <b-icon icon="arrow-return-left" />
        {{ s('Back') }}
      </b-button>
      <b-navbar-brand>
        <strong>{{ name }}</strong>
      </b-navbar-brand>
    </b-navbar>
    <div class="scroll">
      <b-card class="m-2" no-body>
        <template #header>
          <h4 class="mb-0">
            {{ s('Balances') }}
          </h4>
        </template>
        <b-table :items="items" flush />
      </b-card>

      <b-card class="m-2" no-body>
        <template #header>
          <h4 class="mb-0">
            {{ s('Reimbursements') }}
          </h4>
        </template>
        <b-list-group flush>
          <b-list-group-item v-for="r in reimbursements">
            <strong>{{ r[0] }}</strong> will reimburse
            <strong>{{ r[2] }}€</strong> to <strong>{{ r[1] }}</strong>
          </b-list-group-item>
        </b-list-group>
      </b-card>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from "vue";
import { Clients } from "../Ledger/Client";
import { Transaction } from "../Ledger/Ledger";
import { WithTs, round } from "../Ledger/Utils";
import {s} from "../L10n";

function reimbursements(
  pays: Map<string, number>
): [string, string, number][] | undefined {
  const res: [string, string, number][] = [];
  while (true) {
    let M = 0,
      m = 0,
      Mu = null,
      mu = null;
    for (let [user, paid] of pays.entries()) {
      if (paid > M) {
        M = paid;
        Mu = user;
      }
      if (paid < m) {
        m = paid;
        mu = user;
      }
    }
    if (M < 0 || m > 0) {
      console.log("WTF", M, Mu, m, mu);
      return;
    }
    if (!Mu || !mu) break; // all zeroes
    if (Math.abs(M) < 0.01 || Math.abs(m) <= 0.01) break;
    pays.set(Mu, Math.max(M + m, 0));
    pays.set(mu, Math.min(M + m, 0));
    res.push([mu, Mu, round(Math.min(M, -m))]);
  }
  return res;
}

function sums(
  items: Transaction[],
  participants: Map<string, WithTs<string>>
): Map<string, number> {
  const ret: Map<string, number> = new Map();
  const add = (uid: string, n: number) => {
    console.log("Add", uid, n);
    return ret.set(uid, (ret.get(uid) || 0) + n);
  };
  for (let item of items) {
    add(item.paidBy.content, item.amount.content);
    let n = item.amount.content / item.paidFor.content.length;
    for (let p of item.paidFor.content) {
      add(p, -n);
    }
  }
  const ret2: Map<string, number> = new Map();
  for (let key of ret.keys()) {
    const p = participants.get(key);
    const r = ret.get(key);
    if (!p || r == null) {
      continue;
    }
    console.log("ret2", p.content, r);
    ret2.set(p.content, r);
  }
  console.log(ret2);
  return ret2;
}

export default Vue.extend({
  props: {
    ledgerId: String,
  },
  data() {
    const client = Clients.get(this.ledgerId);
    const pays = sums(client.items, client.participants);
    return {
      client,
      reimbursements: reimbursements(new Map(pays)),
      name: client.name,
      sums: pays,
    };
  },
  methods: {
    back() {
      this.$router.push({ name: "ledger", params: { id: this.client.id } });
    },
    s(str: string): string {
      return s(str);
    }
  },
  computed: {
    items(): any[] {
      console.log("computed", this.sums);
      return Array.from(this.sums.entries()).map(([name, amount]) => ({
        name: name,
        paid: round(amount) + "€",
      }));
    },
  },
});
</script>
