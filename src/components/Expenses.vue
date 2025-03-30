<template>
  <div class="main-container">
    <b-navbar type="dark" variant="primary">
      <b-button variant="outline-light" @click="back">
        <b-icon icon="arrow-return-left" variant="sm"/> {{ s('All lists') }}
      </b-button>
      <b-navbar-brand>
        <strong>{{name}}</strong>
      </b-navbar-brand>
    </b-navbar>
    <b-alert variant="danger" :show="state != 'open'" class="mb-0">
      <div>
        <b-spinner small></b-spinner>
        {{ s('RECONNECT_MSG') }} ⚡️
      </div>
      <div>
        {{ s('SYNC_WARNING') }}
      </div>
    </b-alert>
    <b-list-group class="scroll">
      <b-list-group-item
        v-for="item in filteredItems"
        :key="item.id"
        @click="() => onClickItem(item.id)"
      >
        <Expense :item="item" :sync="sync"/>
      </b-list-group-item>
    </b-list-group>
    <div v-if="searchShow">
      <b-form-input v-model="searchString" :placeholder="s('Search string')" type="text" debounce="100"/>
    </div>
    <b-navbar type="light" variant="primary">
      <b-button variant="outline-light" :to="{name: 'metadata', params: {id: id}}">
        <b-icon icon="gear-fill" aria-hidden="true"></b-icon> {{ s('Settings') }}
      </b-button>
      &nbsp;
      <b-button variant="outline-light" :to="{name: 'balance', params: {ledgerId: id}}">
        <b-icon icon="calculator"/> {{ s('Balance') }}
      </b-button>
      &nbsp;
      <b-button variant="outline-light" @click="toggleSearch">
        <b-icon icon="search"/>
        {{ s('Search') }}
      </b-button>
      &nbsp;
      <b-button variant="secondary" :to="{name: 'item-edit', params: {ledgerId: id, id: 'new'}}">
        <span class="text-dark"> <b-icon icon="plus-circle"/> {{ s('Expense') }}</span>
      </b-button>
    </b-navbar>
  </div>
</template>

<script lang="ts">
import Vue, {PropType} from "vue";
import {type Ledger, type Transaction} from "../Ledger";
import {type SyncManager, SyncManagers} from "../Sync";
import Expense from "./Expense.vue";
import {s} from "../L10n";

function lexy(x: number, y: number): number {
  return x == 0 ? y : x;
}

/**
 * Compare two transactions, returning {-1, 0, +1}.
 * Note: comparison is reversed compared to the natural one,
 * because newer expenses should be displayed on top.
 */
function cmp_transactions(a: Transaction, b: Transaction): number {
  return lexy(
    b.effective_ts.content.localeCompare(a.effective_ts.content),
    Math.sign(b.created_ts - a.created_ts),
  );
}

export default Vue.extend({
  components: { Expense },
  props: {
    id: String as PropType<string>,
  },
  data() {
    const sync: SyncManager = SyncManagers.get(this.id);
    const items = sync.items.slice();
    items.sort(cmp_transactions);
    return {
      sync: sync as SyncManager,
      items: items as Transaction[],
      name: sync.name as string,
      description: sync.description as string,
      state: sync.state as string,
      searchShow: false as boolean,
      searchString: "" as string,
      handleChange: null as ((_: any) => void) | null,
      handleOpen: null as (() => void) | null,
      handleClose: null as (() => void) | null,
    };
  },
  mounted() {
    const sync = this.sync;
    this.handleChange = (e: any) => {
      let { ledgerId, data, origin } = e.detail;
      this.onChanged(ledgerId, data)
    };
    this.handleOpen = () => this.state = "open";
    this.handleClose = () => this.state = "close";
    sync.addEventListener("change", this.handleChange);
    sync.addEventListener("open", this.handleOpen);
    sync.addEventListener("close", this.handleClose);
    sync.addEventListener("error", this.handleClose);
  },
  beforeDestroy() {
    this.sync.removeEventListener("change", this.handleChange);
    this.sync.removeEventListener("open", this.handleOpen);
    this.sync.removeEventListener("close", this.handleClose);
    this.sync.removeEventListener("error", this.handleClose);
  },
  computed: {
    styleOfStatus() {
      if (this.state == "open") {
        return "color: green";
      } else {
        return "color: red";
      }
    },
    filteredItems(): Transaction[] {
      if (this.searchString == "") {
        return this.items;
      }
      const str = this.searchString.toLocaleLowerCase();
      return this.items.filter((t: Transaction) =>
        t.description.content.toLocaleLowerCase().includes(str)
      );
    },
  },
  methods: {
    onChanged(ledgerId: string, data: Ledger) {
      if (ledgerId == this.id) {
        this.reload(data);
      }
    },
    reload(data: Ledger) {
      this.name = data.name.content;
      this.description = data.description.content;
      const items = this.sync!.items.slice();
      items.sort(cmp_transactions);
      this.items = items;
    },
    onClickItem(itemId: string) {
      this.$router.push({name: 'item-edit', params: {ledgerId: this.id, id: itemId}});
    },
    toggleSearch() {
      this.searchShow = !this.searchShow;
    },
    back() {
      this.$router.push({name: "list"});
    },
    s(str: string): string {
      return s(str);
    },
  },
});
</script>
