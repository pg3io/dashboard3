import Vue from 'vue'
import App from './App.vue'
import router from './router'
import store from './store'
import axios from 'axios'
import VueAxios from 'vue-axios'
import { createProvider } from './vue-apollo'
import 'bootstrap'
import { BootstrapVue } from 'bootstrap-vue'
// import './assets/custom.scss'
import './assets/light.css'
import { BootstrapVueIcons } from 'bootstrap-vue'
import 'bootstrap-vue/dist/bootstrap-vue-icons.min.css'
import Chartkick from 'vue-chartkick'
import Highcharts from 'highcharts'

Vue.use(Chartkick.use(Highcharts))

Vue.use(BootstrapVue)
Vue.use(BootstrapVueIcons)
Vue.use(VueAxios, axios)


Vue.config.productionTip = false

new Vue({
  router,
  store,
  apolloProvider: createProvider(),
  render: h => h(App)
}).$mount('#app')