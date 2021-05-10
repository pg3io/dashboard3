<template >
<transition name="fade">
  <div id="app">
    <header>
      <b-navbar toggleable="lg" type="dark" variant="dark" fixed="top" class="p-O" v-if="isAuthenticated">
        <b-navbar-brand to="/" ><b-icon-briefcase></b-icon-briefcase> {{ name }} </b-navbar-brand>
        <b-navbar-toggle target="nav-collapse"></b-navbar-toggle>
        <b-collapse id="nav-collapse" is-nav>
          <b-navbar-nav class="d-sm-block d-md-none">
            <b-nav-item to="/factures">Factures</b-nav-item>
          </b-navbar-nav>
          <b-navbar-nav class="ml-auto">
          <template><img class="rounded-circle" :src="gravatar" alt="user profile image" style="width: 35px"/></template>
            <b-nav-item-dropdown right>
              <b-dropdown-item class="nav-link" @click="goToPage('profileLink')"><router-link hidden='true' id="profileLink" to="/profile"></router-link>Profile</b-dropdown-item>
              <b-dropdown-item class="nav-link" size="sm" variant="link" @click="logOut">Déconnexion</b-dropdown-item>
            </b-nav-item-dropdown>
          </b-navbar-nav>
        </b-collapse>
      </b-navbar>
    </header>
    <body>
      <b-container fluid class="py-5">
        <b-row v-if="isAuthenticated">
          <b-col cols="2" class="d-none d-md-block">
            <nav id="sidebarMenu" class="col-md-2 bg-light sidebar">
              <div class="position-sticky pt-3 text-left">
                <ul class="nav flex-column">
                  <li class="nav-item">
                    <router-link to="/" class="nav-link" style="color: rgb(0, 0, 0)"><b-icon-house-door></b-icon-house-door> Home</router-link>
                  </li>
                  <li class="nav-item">
                     <router-link to="/factures" class="nav-link" style="color: rgb(0, 0, 0)"><b-icon-file-text-fill></b-icon-file-text-fill> Factures</router-link>
                  </li>
                </ul>
              </div>
            </nav>
          </b-col>
          <b-col v-if="$route.path=='/profile'" class="profile">
              <Profile :userInfos=userInfos></Profile>
          </b-col>
          <b-col class="home" v-else-if="$route.path=='/'">
              <home :home=homeText></home>
          </b-col>
          <b-col class="other" v-else>
              <router-view></router-view>
          </b-col>
        </b-row>
        <router-view v-if="$route.path == '/login'"></router-view>
        </b-container>
        <!--<autologout></autologout>-->
      </body>
      <footer class="footer mt-auto py-3 bg-light">
        <div class="container">
          <span v-html="footerText"></span>
        </div>
      </footer>
    </div>
  </transition>
</template>

<script>
import { mapGetters } from 'vuex'
import { userId, userBase, getCustoms } from '@/graphql/querys.js'
import Profile from '@/views/profile.vue'
import Home from '@/views/home.vue';
import md5 from "md5";
//import Autologout from '@/components/autologout.vue'

export default {
  name: "App",
  data() {
    return {
      actUserId: 0,
      userInfos: {},
      name: "",
      homeText: "",
      footerText: ""
    }
  },
  mounted() {
    this.getUsrId();
  },
  components: {
    Profile,
    Home,
//    Autologout
  },
  computed: {
    ...mapGetters(['user', 'isAuthenticated']),

    gravatar () {
      const hash = md5(this.userInfos.email);
      return `https://www.gravatar.com/avatar/${hash}`;
    },
  },
  methods: {
    goToPage(id) {
      document.getElementById(id).click()
    },
    getDashboardInfos() {
      this.$apollo.query({
        query: getCustoms,
      }).then((data) => {
        this.name = data['data']['parametre']['title']
        this.homeText = data['data']['parametre']['home']
        this.footerText = data['data']['parametre']['footer']
      }).catch((error) => {
        console.log(error)
      })
    },
    getProfile() {
      this.$apollo.mutate({
        mutation: userBase,
        variables: {'id': this.actUserId}
      }).then((data) => {
        this.userInfos = data['data']['users'][0]
        this.userInfos.username = this.userInfos.username.charAt(0).toUpperCase() + this.userInfos.username.slice(1)
        this.getDashboardInfos()
      }).catch((error) => {
        console.log(error)
      })
    },
    getUsrId() {
      if (!this.isAuthenticated)
        return
      this.$apollo.query({
          query: userId
      }).then((data) => {
        this.actUserId = data['data']['me']['id']
          return this.getProfile();
      }).catch((error) => {
          console.log(error)
      })
    },  
    logOut() {
      this.$store.dispatch('logOut')
        .then(() => this.$router.push('/login'))
      }
    },
}
</script>

<style>
#sidebarMenu {
    position: fixed;
    top: 0;
    bottom: 0;
    left: 0;
    z-index: 100;
    padding: 48px 0 0;
    box-shadow: inset -1px 0 0 rgba(0, 0, 0, .1);
}

#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
}

#nav {
  padding: 30px;
}

#nav a {
  font-weight: bold;
  color: #2c3e50;
}

#nav a.router-link-exact-active {
  color: #42b983;
}

.fade-enter-active, .fade-leave-active {
  transition: opacity .5s;
}

.fade-enter, .fade-leave-to {
  opacity: 0;
}
</style>