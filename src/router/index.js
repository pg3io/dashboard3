import Vue from 'vue'
import VueRouter from 'vue-router'
import store from '@/store'
import profile from '@/views/profile.vue'

Vue.use(VueRouter)

const routes = [
  {
    path: '/',
    name: 'home',
    component: () => import('@/views/home.vue'),
    meta: {
      title: 'PG3',
      requiresAuth: true
    }
  },
  {
    path: '/profile',
    name: 'profile',
    component: profile,
    meta: {
      title: 'PG3 - profile',
      requiresAuth: true
    }
  },
  {
    path: '/factures',
    name: 'factures',
    component: () => import('@/views/factures.vue'),
    meta: {
      title: 'PG3 - Factures',
      requiresAuth: true
    }
  },
  {
    path: '/factures/:id',
    name: 'factureDetails',
    component: () => import('@/views/detailsFacture.vue'),
    meta: {
      title: 'Facture',
      requiresAuth: true
    }
  },
  {
    path: '/password',
    name: 'resetPassword',
    component: () => import('@/views/password.vue'),
    meta: {
      title: 'Mot de passe'
    },
    alias: '/password?code=:code'
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/login.vue'),
    meta: {
      title: 'PG3 - Login',
    }
  },
  {
    path: '*',
    redirect: '/'
  }
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
  } else {
    document.title = to.meta.title
    next()
  }
} else {
  document.title = to.meta.title
  next()
}
})

export default router
