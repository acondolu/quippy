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
        <b-table :items="items" flush />
      </b-card>

      <b-card class="m-2" no-body v-if="reimbursements">
        <template #header>
          <h4 class="mb-0">
            {{ s('Reimbursements') }}
          </h4>
        </template>
        <b-list-group flush>
          <b-list-group-item v-for="r in reimbursements" v-bind:key="r.key">
            <strong>{{ r.debtor }}</strong>
            {{ s('will reimburse') }}
            <strong>{{ r.amount }}€</strong>
            {{ s('to') }}
            <strong>{{ r.creditor }}</strong>
          </b-list-group-item>
        </b-list-group>
      </b-card>
    </div>
    <b-navbar type="light" variant="primary">
      <b-button @click="onExport" variant="secondary">
        <b-icon icon="download" />
        {{ s('Export as CSV') }}
      </b-button>
    </b-navbar>
  </div>
</template>

<script lang="ts">
import Vue from "vue";
import { SyncManagers } from "../Sync";
import { Transaction } from "../Ledger";
import { UserID, Versioned } from "../Utils";
import { round } from "../math";
import {s} from "../L10n";

function getBalances(
  items: Transaction[],
  participants: Map<string, Versioned<string>>
): Map<string, number> {
  // First calculate balances by user ID
  const balancesByUserId: Map<string, number> = new Map();
  const addToBalance = (uid: string, n: number) => {
    return balancesByUserId.set(uid, (balancesByUserId.get(uid) || 0) + n);
  };
  for (let item of items) {
    addToBalance(item.paidBy.content, item.amount.content);
    let perPersonShare = item.amount.content / item.paidFor.content.length;
    for (let uid of item.paidFor.content) {
      addToBalance(uid, -perPersonShare);
    }
  }

  // Convert user IDs to names in the final balance map
  const balancesByName: Map<string, number> = new Map();
  for (let [uid, balance] of balancesByUserId.entries()) {
    const name = participants.get(uid);
    if (!name || balance == null) {
      continue;
    }
    balancesByName.set(name.content, balance);
  }
  return balancesByName;
}

type Transfer = {
  debtor: string,
  creditor: string,
  amount: string,
  key: string,
}

/**
* Calculates the optimal set of reimbursements to settle all balances.
* Complexity: O(n^2) where n is the number of participants.
*/
function computeTransfers(
  balances: Map<string, number>
): Transfer[] | undefined {
  const transfers = [];
  const ROUNDING_TOLERANCE = 0.01;
  while (true) {
    // In each iteration, the balance of either
    // maxCreditor or maxDebtor will be settled
    let maxCredit = 0, // positive
        maxDebt = 0, // negative
        maxCreditor = null,
        maxDebtor = null;
    for (let [user, balance] of balances.entries()) {
      if (balance > maxCredit) {
        maxCredit = balance;
        maxCreditor = user;
      }
      if (balance < maxDebt) {
        maxDebt = balance;
        maxDebtor = user;
      }
    }
    if (maxCredit < 0 || maxDebt > 0) {
      console.log(
        "Balance.computeTransfers: unexpected signs",
        maxCredit, maxCreditor, maxDebt, maxDebtor
      );
      return;
    }
    if (!maxCreditor || !maxDebtor) break; // all zeroes
    if (Math.abs(maxCredit) <= ROUNDING_TOLERANCE || Math.abs(maxDebt) <= ROUNDING_TOLERANCE)
      break;
    balances.set(maxCreditor, Math.max(maxCredit + maxDebt, 0));
    balances.set(maxDebtor, Math.min(maxCredit + maxDebt, 0));
    const amount = round(Math.min(maxCredit, -maxDebt));
    transfers.push({
      debtor: maxDebtor,
      creditor: maxCreditor,
      amount,
      key: `${maxDebtor}-${maxCreditor}-${amount}`,
    });
  }
  return transfers;
}

export default Vue.extend({
  props: {
    ledgerId: String,
  },
  data() {
    const sync = SyncManagers.get(this.ledgerId);
    return {
      sync: sync,
    };
  },
  methods: {
    back() {
      this.$router.push({ name: "ledger", params: { id: this.sync.id } });
    },
    onExport() {
      const csvColumns: string[] = ["Date", "Description", "Amount"];
      const rows: (string | number)[][] = [csvColumns];
      const participants = this.sync.participantList;
      const defaultRow: any[] = ["", "", 0];
      const userIndex: Map<UserID, number> = new Map();
      const set = (row: any[], who: UserID, amt: number) => {
        const i = userIndex.get(who);
        if (!i) throw Error("onExport error");
        row[i] = (row[i] ?? 0) + amt;
      };
      for (let user of participants) {
        userIndex.set(user.value, csvColumns.length);
        csvColumns.push(user.text);
        defaultRow.push(0);
      }

      for (let item of this.sync.items) {
        const row = defaultRow.map(x => x); // copy
        rows.push(row);
        const amount = item.amount.content;
        const paidBy = item.paidBy.content;
        const paidFor = item.paidFor.content;
        row[0] = item.effective_ts.content;
        row[1] = item.description.content;
        row[2] = amount;
        set(row, paidBy, amount);
        let perPersonShare = amount / paidFor.length;
        for (let p of paidFor) {
          set(row, p, -perPersonShare);
        }
      }
      const csv = rows.map(row => row.map((x: any) => JSON.stringify(x)).join(",")).join("\n");
      const blob = new Blob([csv], { type: "text/csv" });
      const link = document.createElement("a");
      link.download = "transactions.csv";
      link.href = window.URL.createObjectURL(blob);
      link.click();
    },
    s(str: string): string {
      return s(str);
    }
  },
  computed: {
    items(): {name: string, balance: string}[] {
      return Array.from(this.balances.entries()).map(([name, amount]) => ({
        name: name,
        balance: round(-amount) + " €",
      }));
    },
    balances(): Map<string, number> {
      return getBalances(
        this.sync.items,
        this.sync.participants
      );
    },
    reimbursements(): Transfer[] | undefined {
      // important: make a copy of the map
      return computeTransfers(new Map(this.balances))
    },
    name() {
      return this.sync.name;
    },
  },
});
</script>
