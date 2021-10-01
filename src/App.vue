<template >
<transition name="fade">
  <div id="app">
    <header>
      <b-navbar toggleable="lg" type="dark" variant="dark" fixed="top" class="p-O" v-if="isAuthenticated">
        <b-navbar-brand to="/"><b-icon-toggle-on></b-icon-toggle-on> {{ name }} </b-navbar-brand>
        <b-navbar-toggle target="nav-collapse"></b-navbar-toggle>
        <b-collapse id="nav-collapse" is-nav>
          <b-navbar-nav class="d-sm-block d-md-none">
            <b-nav-item to="/factures" v-if="perms.factures">Factures</b-nav-item>
            <b-nav-item to="/fichiers" v-if="perms.ged">Fichiers</b-nav-item>
            <b-nav-item to="/tickets" v-if="zammad">Tickets</b-nav-item>
            <b-nav-item to="/monitoring" v-if="graph || backups">Monitoring</b-nav-item>
          </b-navbar-nav>
          <b-navbar-nav class="ml-auto">
          <template><img class="rounded-circle" :src="gravatar" alt="user profile image" style="width: 35px"/></template>
            <b-nav-item-dropdown right>
              <b-dropdown-item class="nav-link" @click="goToPage('profileLink')">
                <router-link to="/profile" custom v-slot="{ navigate }" hidden='true' id="profileLink">
                  <span @click="navigate" @keypress.enter="navigate" role="link"/>
                </router-link>
              Profile
              </b-dropdown-item>
              <b-dropdown-item class="nav-link" size="sm" variant="link" id="logout" @click="logOut">Déconnexion</b-dropdown-item>
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
              <div class="d-flex text-big flex-column flex-shrink-0 p-3 bg-light">
                <ul class="nav flex-column nav-pills mb-auto mt-3 text-align-center">
                  <li class="nav-item">
                    <router-link to="/" class="nav-link link" id="homeLink"  style="color: rgb(0, 0, 0)" ><b-icon-house-door></b-icon-house-door> 
                     <span class="ml-3 align-top" style="font-size:1.2rem;"> Home</span> 
                    </router-link>
                  </li>
                  <li class="nav-item factures" v-if="perms.factures">
                    <router-link to="/factures" class="nav-link link sec-link"  id="factureLink" style="color: rgb(0, 0, 0)" ><b-icon-file-earmark-ruled></b-icon-file-earmark-ruled>
                      <span class="ml-3 align-top" style="font-size:1.2rem;"> Factures</span> 
                    </router-link>
                  </li>
                  <li class="nav-item ged" v-if="perms.ged">
                    <router-link to="/fichiers" class="nav-link link sec-link"  id="fichierLink" style="color: rgb(0, 0, 0)" ><b-icon-folder></b-icon-folder>
                       <span class="ml-3 align-top" style="font-size:1.2rem;"> Fichiers</span>
                    </router-link>
                  </li>
                  <li class="nav-item tickets" v-if="zammad">
                    <router-link to="/tickets" class="nav-link link sec-link"  id="ticketLink" style="color: rgb(0, 0, 0)" >
                      <b-icon-bookmarks></b-icon-bookmarks>
                      <span class="ml-3 align-top" style="font-size:1.2rem;">Tickets</span>
                      <b-badge pill variant="secondary" class="align-center ml-3">beta</b-badge>
                    </router-link>
                  </li>
                  <li class="nav-item graph" v-if="graph || backups">
                    <router-link to="/monitoring" class="nav-link link sec-link"  id="graphLink" style="color: rgb(0, 0, 0)" >
                      <b-icon-graph-up></b-icon-graph-up>
                      <span class="ml-3 align-top" style="font-size:1.2rem;">Monitoring</span>
                      <b-badge pill variant="secondary" class="align-center ml-3">beta</b-badge>
                    </router-link>
                  </li>
                </ul>
              </div>
            </nav>
          </b-col>
          <b-col v-if="$route.path=='/profile'" class="profile">
              <Profile :userInfos="userInfos"></Profile>
          </b-col>
          <b-col class="home" v-else-if="$route.path=='/'">
              <home v-if="homeText"  :home="homeText" :tickets="zammad" :graph="graph"></home>
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
import { userId, userBase, getCustoms, getUserPerms, getZammad } from '@/graphql/querys.js'
import Profile from '@/views/profile.vue'
import Home from '@/views/home.vue'
import md5 from 'js-md5';
import gql from 'graphql-tag';

export default {
  name: "App",
  data() {
    return {
      actUserId: 0,
      userInfos: {},
      name: "",
      homeText: "",
      footerText: "",
      perms: {},
      zammad: false,
      graph: false,
      backups: false,
    }
  },
  mounted() {
    this.getUsrId();
    this.getUserPermissions();
    this.hasZammad();
    this.hasGraph();
  },
  components: {
    Profile,
    Home
    //    Autologout
  },
  computed: {
    ...mapGetters(['user', 'isAuthenticated']),

    // mettre en async (await md5) pour le warning illegal argument
    gravatar () {
      const link = this.userInfos.email;
      const hash = md5(link);
      return (`https://www.gravatar.com/avatar/${hash}`);
    },
  },
  methods: {
    goToPage(id) {
      document.getElementById(id).click()
    },
    hasZammad () {
      if (!this.isAuthenticated)
          return
      this.$apollo.query({
        query: gql`query{parametre{zammad}}`
      }).then((data) => {
          if (data.data.parametre.zammad)
            this.$apollo.query({
              query: getZammad
            }).then((data) => {
              if (data.data.zammad !== null) {
                this.zammad = true;
              } else {
                this.zammad = false;
              }
            }).catch((e) => {console.log(e);});
      }).catch((err) => {console.log(err)})
    },
    hasGraph () {
      if (!this.isAuthenticated)
          return
      if (!this.actUserId) return setTimeout(this.hasGraph, 100);
      this.$apollo.query({
        query: gql`query{parametre{graph backups}}`
      }).then((data) => {
          this.graph = data.data.parametre.graph;
          this.backups = data.data.parametre.backups;
      }).catch((e) => {console.log(e)});
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
      if (!this.isAuthenticated)
          return
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
    },
    getUserPermissions () {
      if (!this.actUserId)
        return setTimeout(this.getUserPermissions, 100);
      else {
        this.$apollo.mutate({
          mutation: getUserPerms,
          variables: {'id': this.actUserId}
        }).then((data) => {
          this.perms = data['data']['users'][0];
        }).catch((error) => {
          console.log(error)
        });
      }
    }
  }
}
</script>

<style lang="css">
#sidebarMenu
{
    position: fixed;
    top: 0;
    bottom: 0;
    left: 0;
    z-index: 100;
    padding: 48px 0 0;
    box-shadow: inset -1px 0 0 rgba(0, 0, 0, .1);
}
#sidebarMenu a.nav-link {
  padding: 0.5rem
}
.text-big
{
  font-size: 1.2rem;
}
a.active, a.sec-link.router-link-active, a.link.router-link-exact-active {
  background : #343a40 !important;
  color: #f8f9fa !important;
}

#app
{
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
}

#nav
{
  padding: 30px;
}

#nav a
{
  font-weight: bold;
  color: #2c3e50;
}

#nav a.router-link-exact-active 
{
  color: #42b983;
}

.fade-enter-active, .fade-leave-active
{
  transition: opacity .5s;
}

.fade-enter, .fade-leave-to
{
  opacity: 0;
}
.hidden {
  visibility: hidden;
}
</style>