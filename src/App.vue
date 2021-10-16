<template >
<transition name="fade">
  <div id="app">
    <header>
      <b-navbar id="mobile-nav" :style="`background-color: ${(dark_mode) ? ('var(--light)') : ('var(--dark)')}`" toggleable="lg" type="dark" fixed="top" class="p-O" v-if="isAuthenticated">
        <b-navbar-brand to="/" :class="(dark_mode) ? ('ex-link'): ('')"><b-icon-toggle-on></b-icon-toggle-on> {{ name }} </b-navbar-brand>
        <b-navbar-toggle target="nav-collapse"></b-navbar-toggle>
        <b-collapse id="nav-collapse" is-nav>
          <b-navbar-nav class="d-sm-block d-lg-none">
            <b-nav-item to="/factures" :class="(dark_mode) ? ('ex-link'): ('')" v-if="perms.factures">Factures</b-nav-item>
            <b-nav-item to="/fichiers" :class="(dark_mode) ? ('ex-link'): ('')" v-if="perms.ged">Fichiers</b-nav-item>
            <b-nav-item to="/tickets" :class="(dark_mode) ? ('ex-link'): ('')" v-if="zammad">Tickets</b-nav-item>
            <b-nav-item to="/monitoring" :class="(dark_mode) ? ('ex-link'): ('')" v-if="graph || backups">Monitoring</b-nav-item>
          </b-navbar-nav>
          <b-navbar-nav class="ml-auto">
            <template class="text-align-bottom">
              <i v-if="!dark_mode" class="fa fa-sun mr-2" style="color: white; font-size:1.5rem; margin-top: 0.4rem;"></i>
              <b-form-checkbox id="checkbox-dark" v-model="dark_mode" name="checkbox-dark" class="mt-1"
              size="lg" switch>
              </b-form-checkbox>
              <i v-if="dark_mode" class="fa fa-moon mr-5" style="color: white; font-size:1.2rem; margin-top:0.5rem;"></i>
            </template>
          <template><img class="rounded-circle" :src="gravatar" alt="user profile image" style="width: 40px"/></template>
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
                    <router-link to="/" class="nav-link link" id="homeLink"><b-icon-house-door></b-icon-house-door> 
                     <span class="ml-3 align-top" style="font-size:1.2rem;"> Home</span>
                    </router-link>
                  </li>
                  <li class="nav-item factures" v-if="perms.factures">
                    <router-link to="/factures" class="nav-link link sec-link"  id="factureLink"><b-icon-file-earmark-ruled></b-icon-file-earmark-ruled>
                      <span class="ml-3 align-top" style="font-size:1.2rem;"> Factures</span> 
                    </router-link>
                  </li>
                  <li class="nav-item ged" v-if="perms.ged">
                    <router-link to="/fichiers" class="nav-link link sec-link"  id="fichierLink"><b-icon-folder></b-icon-folder>
                       <span class="ml-3 align-top" style="font-size:1.2rem;"> Fichiers</span>
                    </router-link>
                  </li>
                  <li class="nav-item tickets" v-if="zammad">
                    <router-link to="/tickets" class="nav-link link sec-link"  id="ticketLink">
                      <b-icon-bookmarks></b-icon-bookmarks>
                      <span class="ml-3 align-top" style="font-size:1.2rem;">Tickets</span>
                      <b-badge pill variant="secondary" class="align-center ml-3">beta</b-badge>
                    </router-link>
                  </li>
                  <li class="nav-item graph" v-if="graph || backups">
                    <router-link to="/monitoring" class="nav-link link sec-link"  id="graphLink" style="" >
                      <b-icon-graph-up></b-icon-graph-up>
                      <span class="ml-3 align-top" style="font-size:1.2rem;">Monitoring</span>
                      <b-badge pill variant="secondary" class="align-center ml-3">beta</b-badge>
                    </router-link>
                  </li>
                </ul>
              </div>
            </nav>
          </b-col>
          <b-col class="col-md-10 col-sm-12">
            <div v-if="$route.path=='/profile'" class="profile">
                <Profile :userInfos="userInfos"></Profile>
            </div>
            <div class="home" v-else-if="$route.path=='/'">
            <transition name="slide-fade">
                <home v-if="(graph || backups) && homeText" :dark="dark_mode"  :home="homeText" :tickets="zammad" :graph="graph"></home>
            </transition>
            </div>
            <div class="other" v-else>
                <router-view></router-view>
            </div>
            <footer class="footer py-3 bg-light">
              <div class="container">
                <span v-html="footerText"></span>
              </div>
            </footer>
          </b-col>
        </b-row>
        <router-view v-if="$route.path == '/login'"></router-view>
        </b-container>
      </body>
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
import { setCookie } from './cookies.js';
import $ from 'jquery'

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
      dark_mode: undefined,
    }
  },
  beforeUpdate() {
    this.setTitle()
  },
  mounted() {
    this.setTitle()
    this.getUsrId();
    this.getUserPermissions();
    this.hasZammad();
    this.hasGraph();
    this.getTheme();
    this.setTheme();
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
  watch: {
    dark_mode: function (old, niou) {
      if (this.dark_mode && typeof(Storage) !== 'undefined') {
        localStorage.setItem("dashboard3-dark", 'true')
      }
      else if (typeof(Storage) !== 'undefined') {
        localStorage.setItem("dashboard3-dark", 'false')
      }
      if ((old === true || old === false) && old !== niou && niou !== undefined
      && (window.location.pathname === '/' || window.location.pathname === '/monitoring')) {
        window.location.reload()
      }
      this.setTheme()
    }
  },
  methods: {
    getTheme () {
      const prefersDarkScheme = window.matchMedia("(prefers-color-scheme: dark)");
      if (typeof(Storage) !== "undefined") {
        if (localStorage.getItem('dashboard3-dark') === 'true') {
          this.dark_mode = true
        } else if (prefersDarkScheme.matches && localStorage.getItem('dashboard3-dark') !== 'false') {
          this.dark_mode = true;
          localStorage.setItem('dashboard3-dark','true');
        }
        else {
          localStorage.setItem('dashboard3-dark','false');
          this.dark_mode = false;
        }
      } else this.dark_mode = prefersDarkScheme.matches;
    },
    setTheme () {
      if (this.dark_mode !== undefined) {
          if ($('input#checkbox-dark').length === 1) {
            let stylesheet = $('#theme-stylesheet')[0]
            if (stylesheet.href.search('light') && this.dark_mode)
              stylesheet.href = stylesheet.href.replace('light', 'dark')
            else if (stylesheet.href.search('dark') && !this.dark_mode) {
              stylesheet.href = stylesheet.href.replace('dark', 'light')
            }
            if (!this.dark_mode) {
              $('input#checkbox-dark').parent().css('margin-right', '4rem')
            } else if ($('input#checkbox-dark').parent().css('margin-right')) $('input#checkbox-dark').parent().css('margin-right', '')
        } else { return setTimeout(this.setTheme, 100)}
      } else return setTimeout(this.setTheme, 100);
    },
    setTitle ( ) {
      if (this.isAuthenticated) {
        this.$apollo.query({
          query: gql`query{parametre{title}}`
        }).then((data) => {
          if (data.data.parametre.title !== null)
            if (!document.title.startsWith(data.data.parametre.title))
              document.title = data.data.parametre.title + ' - ' + document.title; 
        }).catch((err) => {console.log(err)});
      } else if (location.pathname !== '/login') return setTimeout(this.setTitle, 100);
      else return
    },
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
      setCookie(window.btoa('identifier'), '', 7, '')
      setCookie(window.btoa('password'), '', 7, '')
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
.footer {
  position: fixed;
  bottom: 0;
  left: 0;
  width: 100%;
  text-align: center;  
}

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

@media only screen and (max-width: 800px){
  #sidebarMenu {
    visibility: hidden;
  }
}

#sidebarMenu a.nav-link {
  padding: 0.5rem
}
.text-big
{
  font-size: 1.2rem;
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

.fade-fast-enter-active, .fade-fast-leave-active
{
  transition: opacity .3s;
}

.fade-fast-enter, .fade-fast-leave-to
{
  opacity: 0;
}

.slide-fade-enter-active {
  transition: all .3s ease;
}
.slide-fade-leave-active {
  transition: all .3s cubic-bezier(1.0, 0.5, 0.8, 1.0);
}
.slide-fade-enter
/* .slide-fade-leave-active below version 2.1.8 */ {
  transform: translateY(-100%);
  opacity: 0;
}
.slide-fade-leave-to {
  transform: translateX(-200%);
  opacity: 0;
}

a.ex-link:visited {
  color: var(--text) !important;
}
a.ex-link {
  color: var(--text) !important;
}

a.nav-link:visited {
  color: var(--text) !important;
}

a.nav-link {
  color: var(--text) !important;
}
a.nav-link.dropdown-toggle {
  color: white !important;
}

a.active, a.sec-link.router-link-active, a.link.router-link-exact-active {
  background-color: var(--dark) !important;
  color: var(--text-invert) !important;
}

.hidden {
  visibility: hidden;
}

.card-body {
      background-color: var(--bg-color) !important;
}

.card-header {
      background-color: var(--light) !important;
}
.text-muted {
  color: var(--gray-muted) !important;
}
.form-control {
  background-color: var(--bg-color) !important;
  color: var(--text) !important;
}
.form-control::placeholder {
  color: var(--light-gray) !important;
}
</style>