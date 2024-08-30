import Vue from 'vue';
import { BootstrapVue, IconsPlugin } from 'bootstrap-vue';

import './app.scss';

Vue.use(BootstrapVue);
Vue.use(IconsPlugin);

import VueRouter from 'vue-router';
Vue.use(VueRouter);

import App from "./components/App.vue";
import List from "./components/List.vue";
import MainView from "./components/MainView.vue";
import Join from "./components/Join.vue";
import Metadata from "./components/Metadata.vue";
import ItemEdit from "./components/ItemEdit.vue";
import Balance from "./components/Balance.vue";

const router = new VueRouter({
  routes: [
    { path: '/', name: 'list', component: List },
    { path: '/ledger/overview/:id', name: 'ledger', component: MainView, props: true},
    { path: '/join', name: 'join', component: Join},
    { path: '/ledger/metadata/:id', name: 'metadata', component: Metadata, props: true},
    { path: '/ledger/edit/:ledgerId/:id', name: 'item-edit', component: ItemEdit, props: true},
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

import { Clients } from "./Ledger/Client";
Clients.init().then(main);

if (navigator.serviceWorker.controller) {
  navigator.serviceWorker.controller.postMessage({
    type: 'reload',
  });
  console.log("reload: launched");
} else {
  console.log("reload: failed");
}
