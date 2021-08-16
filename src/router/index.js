import Vue from 'vue'
import VueRouter from 'vue-router'
import store from '@/store'
//import LOGIN_USER from '@/store/index.js'
import profile from '@/views/profile.vue'
//import axios from 'axios'
Vue.use(VueRouter)

// const getUserGeds = `query getUserPerms($id: ID!){
//   users(where: {id: $id}) {
//     ged
//     factures
//     activites
//   }
// }`

function guardMyroute(to, from, next)
{
  var connecter = false;

  if(sessionStorage.getItem('apollo-token')) {
    connecter = true;
  } else {
    connecter = false;
  }

  if(connecter == true ) {
    console.log('validation guardroute');
    next();
  } else {
    console.log('Redirection vers login');
    next('/login');
  }
}

const routes = [
  {
    path: '/login',
    name: 'Login',
    meta: {
      title: 'PG3 - Login',
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