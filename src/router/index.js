import Vue from 'vue'
import VueRouter from 'vue-router'
import store from '@/store'
import profile from '@/views/profile.vue'
import { apolloClient } from '@/vue-apollo'
import { getUserPerms, getCustoms } from '@/graphql/querys.js'
import gql from 'graphql-tag'

Vue.use(VueRouter)

function guardMyroute(to, from, next)
{
  var connecter = false;
  if(sessionStorage.getItem('apollo-token')) {
    connecter = true;
  } else {
    connecter = false;
  }
  if(connecter == true ) {
    if (to.name === 'factures' || to.name === 'fichiers') {
      apolloClient.query({query: gql`query { me { id }}`}).then((data) => {
        apolloClient.query({query: getUserPerms, variables: {id: data.data.me.id}}).then(($data) => {
          if (!$data.data.users[0].factures && to.name === 'factures') {window.location.href='/'; next('/')}
          if (!$data.data.users[0].ged && to.name === 'fichiers') {window.location.href='/'; next('/')}
          else next()
        }).catch((err) => {console.log(err)});
      }).catch((err) => {console.log(err);});
    } else if (to.name === 'tickets'||to.name === 'graph') {
      apolloClient.query({query: getCustoms}).then((data) => {
        if (!data.data.parametre.zammad && to.name === 'tickets') {window.location.href='/'; next('/')}
        if (!(data.data.parametre.graph || data.data.parametre.backups) && to.name === 'graph') {window.location.href='/'; next('/')}
        else { next() } 
      })
    } else next()
  } else { next('/login'); }
}

const routes = [
  {
    path: '/login',
    name: 'Login',
    meta: {
      title: 'Dashboard PG3 - Login',
    },
    component: () => import('@/views/login.vue'),
    beforeEnter: (to, from, next) => {
      if (store.getters.isAuthenticated == true) {
        next("/");
      } else {
        next();
      }
    }
  },
  {
    path: '/',
    name: 'home',
    beforeEnter : guardMyroute,
    component: () => import('@/views/home.vue'),
    meta: {
      title: 'PG3',
      requiresAuth: true
    }
  },
  {
    path: '/profile',
    name: 'profile',
    beforeEnter : guardMyroute,
    component: profile,
    meta: {
      title: 'PG3 - profile',
      requiresAuth: true
    }
  },
  {
    path: '/factures',
    name: 'factures',
    beforeEnter : guardMyroute,
    component: () => import('@/views/factures.vue'),
    meta: {
      title: 'PG3 - Factures',
      requiresAuth: true
    }
  },
  {
    path: '/password',
    name: 'resetPassword',
    beforeEnter : guardMyroute,
    component: () => import('@/views/password.vue'),
    meta: {
      title: 'Mot de passe'
    },
    alias: '/password?code=:code'
  },
  {
    path: '/factures/:id',
    name: 'factureDetails',
    beforeEnter : guardMyroute,
    component: () => import('@/views/detailsFacture.vue'),
    meta: {
      title: 'Facture',
      requiresAuth: true
    }
  },
  {
    path: '/fichiers',
    name: 'fichiers',
    beforeEnter : guardMyroute,
    component: () => import('@/views/ged.vue'),
    meta: {
      title: 'PG3 - GED',
      requiresAuth: true
    }
  },
  {
    path: '/fichiers/:id',
    name: 'fichierDetails',
    beforeEnter : guardMyroute,
    component: () => import('@/views/detailsGed.vue'),
    meta: {
      title: 'Détail du fichier',
      requiresAuth: true
    }
  },
  {
    path: '/tickets',
    name: 'tickets',
    beforeEnter : guardMyroute,
    component: () => import('@/views/tickets.vue'),
    meta: {
      title: 'PG3 - Tickets',
      requiresAuth: true
    }
  },
  {
    path: '/monitoring',
    name: 'graph',
    beforeEnter : guardMyroute,
    component: () => import('@/views/graph.vue'),
    meta: {
      title: 'PG3 - Monitoring',
      requiresAuth: true
    }
  },
]

const router = new VueRouter({
  mode: 'history',
  routes
})

router.beforeEach((to, from, next) => {
    const isUserLoggedIn = store.getters.isAuthenticated
    if (to.matched.some(record => record.meta.requiresAuth)) {
      if (!isUserLoggedIn) {
        store.dispatch('logOut')
        document.title = to.meta.title
        next({
          path: '/login',
          query: { redirect: to.fullPath }
        })
      }
       else {
        // document.title = to.meta.title
        next()
      }
    } else {
      // document.title = to.meta.title
      next()
    }
})

export default router