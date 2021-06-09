import Vue from 'vue'
import Vuex from 'vuex'
import gql from 'graphql-tag'
import VuexPersistence from 'vuex-persist'
import { apolloClient } from '@/vue-apollo'
import { onLogout } from '@/vue-apollo'
import { onLogin } from '@/vue-apollo'
import { LOGGED_IN_USER } from '@/graphql/login'
import { LOGIN_USERS } from '@/graphql/login'
//import { TOKEN_USER} from '@/graphql/mutations'

Vue.use(Vuex)

const vuexLocal = new VuexPersistence({
  storage: window.sessionStorage
})

export default new Vuex.Store({
  state: {
    user: {},
    authStatus: false,
    token: sessionStorage.getItem('apollo-token') || null,
  },
  getters: {
    user: state => state.user,
    isAuthenticated: state => !!state.token,
    authStatus: state => state.authStatus,
  },
  mutations: {
    SET_TOKEN (state, payload) {
      state.token = payload.token;
      console.log('on est dans SET_TOKEN')
    },
    LOGIN_USER (state, payload) {
      console.log('on est dans LOGIN_USER');
      onLogin(apolloClient);
      state.authStatus = true;
      state.user = payload.user;
    },
    LOGOUT_USER (state) {
      state.authStatus = '';
      console.log('on est dans LOGOUT_USER');
      state.isAuthenticated = false;
      state.authStatus = false;
      onLogout(apolloClient);
      state.token = '' && sessionStorage.removeItem('apollo-token');
    }
  },
  actions: {
    
    // Realy need a refresh token ?
    /*const refreshToken = sign({ userId: user.id }, 'azertyhbvcghjk', {
      expiresIn:"7d",
    })*/
    
    async login ({ commit }, authDetails) {
      console.log('start login')
      try {
        var {data} = await apolloClient.mutate({
          mutation: gql`
            mutation($identifier: String!, $password: String!) {
              login(input: { identifier: $identifier, password: $password }) {
                  jwt
              }
          }`,
          variables: authDetails
        })
        const token = JSON.stringify("Bearer " + data.login.jwt)
        commit('SET_TOKEN', token)
        sessionStorage.setItem('apollo-token', token)
        //dispatch('setUser')
        //const { datatest } = await apolloClient.query({ query: LOGGED_IN_USER })
        commit('LOGIN_USER', authDetails)

      //cas d'erreure ---->
      } catch (e) {
        console.error("POST https://dashboard.pk3.io/graphql 401 (UNAUTHORIZED)")
        console.error(e)
        if (data == null) {
          document.getElementById("errorMessage").style.display = "block";
          document.getElementById("password").style.marginBottom = 0;
        }
      }
    },

    async logOut ({ commit }) {
      commit('LOGOUT_USER')
      console.log('logOut est terminer')
    },

    async setUser ({ commit }) {
      const { data } = await apolloClient.query({ query: LOGGED_IN_USER })
      commit(({ query: LOGIN_USERS }), data.me)
      console.log('setUser est terminer')
    }
  },
  plugins: [vuexLocal.plugin]
})