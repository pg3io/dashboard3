import Vue from 'vue'
import Vuex from 'vuex'
import gql from 'graphql-tag'
import VuexPersistence from 'vuex-persist'
import { apolloClient } from '@/vue-apollo'
import { onLogout } from '@/vue-apollo'
import { onLogin } from '@/vue-apollo'
//import { LOGGED_IN_USER } from '@/graphql/login'
//import { LOGIN_USER } from '@/graphql/login'

Vue.use(Vuex)

const vuexLocal = new VuexPersistence({
  storage: window.localStorage
})

export default new Vuex.Store({
  state: {
    user: {},
    authStatus: false,
    token: localStorage.getItem('apollo-token') || null,
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
      state.token = '' && localStorage.removeItem('apollo-token');
    }
  },
  actions: {
    
    async login ({ commit }, authDetails) {
      console.log('tout debut du login !')
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
        localStorage.setItem('apollo-token', token)
        console.log('IMPORTANT APELLE LOGIN')
        //const { datatest } = await apolloClient.query({ query: LOGGED_IN_USER })
        commit('LOGIN_USER', authDetails)
        console.log('IMPORTANT APRES APELLE LOGIN')

        //cas d'erreure ---->
      } catch (e) {
        console.error("POST https://dashboard.pk3.io/graphql 401 (UNAUTHORIZED)")
        console.log('TEST1')
        console.error(e)
        if (data == null) {
          console.log('TEST2')
          document.getElementById("errorMessage").style.display = "block";
          document.getElementById("password").style.marginBottom = 0;
        }
      }
    },

    /*async logIn({ commit}, authDetails) {
      console.log('tout debut du logIn !')
      let {data:{authenticateUser}} = await apolloClient.query({
        query: LOGIN_USER,
        vavriables: authDetails
      });
      commit('LOGIN_USER', authenticateUser);
      commit('SET_TOKEN', authenticateUser);
      onLogin(apolloClient);
      console.log(('les bails du logn ce sont bien passer'))
      //set token in local storage
      localStorage.setItem('apollo-token', authenticateUser.token.split(' ')[1]);
      //redirect to homepage
      router.push('/');
    },

    /*async getAuthUser ({commit}) {
      let {
        data: {getUserInfos}
      } = await apolloClient.query({
        query: LOGGED_IN_USER
      });
      commit(LOGIN_USER, { user: getUserInfos })
    }*/

    /*async testLogin ({ commit, dispatch }, authDetails) {
      console.log('testlogin ca passe la ??')
      var token = localStorage.getItem('apollo-token')
      onLogout(apolloClient)
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
        token = JSON.stringify("Bearer " + data.login.jwt)
        commit('SET_TOKEN', token)
        localStorage.setItem('apollo-token', token)
        dispatch('setUser')
      } catch (e) {
        console.error(e)
        commit('SET_TOKEN', token)
        localStorage.setItem('apollo-token', token)
        dispatch('setUser')
      }
    },*/
    /*async setUser ({ commit }) {
      const { data } = await apolloClient.query({ query: LOGGED_IN_USER })
      console.log('dansq setUser')
      commit('LOGIN_USER', data.me)
    },*/

    async logOut ({ commit }) {
      commit('LOGOUT_USER')
      console.log('logOut est terminer')
    }
  },
  plugins: [vuexLocal.plugin]
})