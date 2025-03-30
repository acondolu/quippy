import Vue from 'vue';
import { BootstrapVue, IconsPlugin } from 'bootstrap-vue';

import './app.scss';

Vue.use(BootstrapVue);
Vue.use(IconsPlugin);

import VueRouter from 'vue-router';
Vue.use(VueRouter);

import App from "./components/App.vue";
import Lists from "./components/Lists.vue";
import Expenses from "./components/Expenses.vue";
import Join from "./components/Join.vue";
import ListEdit from "./components/ListEdit.vue";
import ExpenseEdit from "./components/ExpenseEdit.vue";
import Balance from "./components/Balance.vue";

const router = new VueRouter({
  routes: [
    { path: '/', name: 'list', component: Lists },
    { path: '/ledger/overview/:id', name: 'ledger', component: Expenses, props: true},
    { path: '/join', name: 'join', component: Join},
    { path: '/ledger/metadata/:id', name: 'metadata', component: ListEdit, props: true},
    { path: '/ledger/edit/:ledgerId/:id', name: 'item-edit', component: ExpenseEdit, props: true},
    { path: '/ledger/balance/:ledgerId', name: 'balance', component: Balance, props: true},
  ],
  mode: "abstract",
});

if (window.location.hash.startsWith("#/join/")) {
  router.push({name: 'join'});
} else {
  router.push({name: 'list'});
}

function main() {
  new Vue({
    router,
    render(createElement) {
      return createElement(App);
    }
  }).$mount('#app');
}

import { SyncManagers } from "./Sync";
SyncManagers.init().then(main);
