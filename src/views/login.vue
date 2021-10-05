<template>
  <div class="container-sm text-center">
    <div v-if="!forgotPassword">
      <form class="form-signin" action="POST" @submit.prevent="logIn">
      <img class="mb-4" v-if="image" :src="image" alt="" width="150">
      <h1 class="h3 mb-3 font-weight-normal">Connectez-vous</h1>
      <label for="identifier" class="sr-only">Nom d'utilisateur</label>
      <input type="text" id="identifier" class="form-control" placeholder="Utilisateur" v-model="authDetails.identifier" required autocomplete="off">
      <b-input-group>
        <b-form-input type="password" id="password" class="form-control passwd" placeholder="Mot de passe" v-model="authDetails.password" required autocomplete="off">
        </b-form-input>
        <label for="inputPassword" class="sr-only">Password</label>
        <b-input-group-append class="eyeButton">
          <b-button v-if="showPassword" variant="link" size="sm" @click="show_hidePassword">
            <b-icon class="icon" icon="eye"></b-icon>
          </b-button>
          <b-button v-else variant="link" size="sm" @click="show_hidePassword">
            <b-icon class="icon" icon="eye-slash"></b-icon>
          </b-button>
        </b-input-group-append>
        </b-input-group>
        <div id="errorMessage"  role="alert" style="display: none">Nom d'utilisateur ou mot de passe érroné!</div>
        <div class="forgotPWD mb-2" @click="forgotPassword = true">Mot de passe oublié</div>
        <button class="btn btn-lg btn-primary btn-block" type="submit">Connexion</button>
        <b-form-checkbox id="remember-1" v-model="remember" name="remember-box" class="mt-2">Se souvenir de moi</b-form-checkbox>
      </form>
      <p v-if="loginMessage">{{ loginMessage }}</p>
    </div>
    <transition name="slide-fade">
      <div v-if="forgotPassword" class="form-signin">
        <img class="mb-4" v-if="image" :src="image" alt="" width="150">
        <h5 style="text-align: left; margin-left: 2%;">Entrez votre email</h5>
        <b-input v-model="emailReset" placeholder="Email" type="email" @focus="emailError = ''"></b-input>
        <span class="inputError" v-if="emailError && emailError.length">{{ emailError }}<br></span>
        <div v-if="emailSent">
          <p>Un mail vous a été envoyé.</p>
          <p>S'il n'apparait pas dans votre boîte principale vérifiez dans vos "spam"</p>
          <p v-if="loginMessage">{{ loginMessage }}</p>
        </div>
        <br>
        <div>
          <b-button class="float-left" variant="secondary" @click="forgotPassword = false" v-if="!lock">Annuler</b-button>
          <b-button class="float-left" variant="secondary" v-else>Annuler</b-button>
          <b-button class="float-right" variant="primary" @click="sendEmail" v-if="!lock">Envoyer</b-button>
          <b-button class="float-right" variant="primary" v-else style="margin-right: 2%;">Envoyer <b-icon class="turn-clockWise" icon="arrow-clockwise"></b-icon></b-button>
        </div>
      </div>
    </transition>
  </div>
</template>

<script>
import { mapActions } from 'vuex'
import { resetEmail } from '@/graphql/querys.js'
import gql from 'graphql-tag'
import { getCookie } from '@/cookies.js'
export default {
  name: 'Login',
  data () {
    return {
      lock: false,
      forgotPassword: false,
      emailSent: false,
      emailReset: '',
      emailError: '',
      support : '',
      showPassword: false,
      authDetails: {
        identifier: '',
        password: ''
      },
      remember: false,
      image: '',
      loginMessage: ''
    }
  },
  created() {
    this.autologin();
    this.getImage();
  },
  methods: {
    getImage() {
      var temp = process.env.VUE_APP_API_URL || 'http://localhost:1337/graphql'
      this.$apollo.query({
        query: gql`query {parametre {logo {url} login}}`
      }).then((data) => {
        var link = temp.replace('/graphql', data['data']['parametre']['logo']['url'])
        this.image = link
        this.loginMessage = data.data.parametre.login;
      }).catch((error) => {
        console.log(error)
      })
    },
    sendEmail() {
      if (!this.emailReset.length)
        return this.emailError = 'Veuillez renseigner un mail'
      this.emailError = ''
      this.emailSent = false
      this.lock = true
      this.$apollo.mutate({
        mutation: resetEmail,
        variables: {email: this.emailReset}
      }).then(() => {
        this.lock = false
        this.emailSent = true
      }).catch((error) => {
        this.lock = false
        this.emailError = 'Vérifiez que votre mail soit correct'
        console.log(error)
      })
    },
    show_hidePassword() {
      this.showPassword = !this.showPassword;
      document.getElementById("password").type = (this.showPassword) ? 'text' : 'password';
    },
    ...mapActions(['login']),
    logIn() {
      document.getElementById("errorMessage").style.display = "none"
      console.log('Exec this.login(authDetails, remember)', this.authDetails, this.remember)
      this.login({auth: this.authDetails, remember: this.remember})
        .then(() => {
          if (document.getElementById("errorMessage").style.display != "block") {
            window.location = "/"
          }
        })
    },
    autologin () {
      const creds = {"identifier": window.atob(getCookie(window.btoa('identifier'))), "password": window.atob(getCookie(window.btoa('password')))}
      if (creds.identifier && creds.password) {
        this.login({auth: creds, remember: false})
        .then(() => {
          if (document.getElementById("errorMessage").style.display != "block") {
            window.location = "/"
          }
        })
      }
    },
  },
}
</script>

<style scoped>
html,
body {
  height: 100%;
}

body {
  display: -ms-flexbox;
  display: -webkit-box;
  display: flex;
  -ms-flex-align: center;
  -ms-flex-pack: center;
  -webkit-box-align: center;
  align-items: center;
  -webkit-box-pack: center;
  justify-content: center;
  padding-top: 40px;
  padding-bottom: 40px;
}

#errorMessage {
  color: #e10000;
  width: 100%;
  max-width: 330px;
  margin: 0 auto;
  padding-top: 0;
  margin-bottom: 10px;
  margin-top: 0;
}

.form-signin {
  width: 100%;
  max-width: 330px;
  padding: 15px;
  margin: 0 auto;
  margin-top: 35%;
}
.form-signin .checkbox {
  font-weight: 400;
}
.form-signin .form-control {
  position: relative;
  box-sizing: border-box;
  height: auto;
  padding: 10px;
  font-size: 16px;
}
.form-signin .form-control:focus {
  z-index: 2;
}
.form-signin input[type="username"] {
  margin-bottom: -1px;
  border-bottom-right-radius: 0;
  border-bottom-left-radius: 0;
}
.passwd {
  margin-bottom: 10px;
  border-top-left-radius: 0;
  border-top-right-radius: 0;
}
.eyeButton {
  border: none;
  margin-left: -35px;
  height: 40px;
  cursor: pointer;
  margin-top: 1.25%;
}
.forgotPWD {
  height: auto;
  cursor: pointer;
  margin-top: 2%;
  margin-bottom: 2%;
}
.forgotPWD:hover {
  text-decoration: underline;
}
.icon{
  color: black;
}
.slide-fade-enter-active {
  transition: 1.5s all .3s ease;
}
.slide-fade-enter {
  transform: translateX(10px);
  opacity: 0;
}
.inputError{
    color: rgba(255, 0, 0, 0.6);
    font-style: italic;
    cursor: default;
    margin-left: 2%;
}
@keyframes rotate {
  0% {transform: rotate(0deg);}
  100% {transform: rotate(360deg);}
}
.turn-clockWise {
  animation: rotate 2s infinite linear;
}
</style>