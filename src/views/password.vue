
<template>
    <div class="container text-center" style="width: 60%; background-color: rgba(0, 0, 0, 0.02);"><br>
        <img class="mb-4" :src="getImage" alt="" width="150">
        <h5 style="margin-bottom: 2%;">Entrez votre nouveau mot de passe</h5>
        <div class="container" style="width: 60%;">
            <b-input-group style="margin-left: 2%;">
                <b-form-input id='password' type="password" placeholder="Nouveau mot de passe" v-model="password" @focus="passwordError = ''"></b-form-input>
                <b-input-group-append>
                    <b-button class="onInput" variant="outline" @click="changeVisible('password')">
                        <b-icon v-if="!showPass" icon="eye-slash"></b-icon>
                        <b-icon v-else icon="eye"></b-icon>
                    </b-button>
                </b-input-group-append>
            </b-input-group>
            <span class="inputError" v-if="passwordError && passwordError.length">{{ passwordError }}</span>
            <b-input-group style="margin-top: 1%; margin-left: 2%;">
                <b-form-input id='confirmPassword' type="password" placeholder="Confirmez votre nouveau mot de passe" v-model="confirmPassword" @focus="confirmError = ''"></b-form-input>
                <b-input-group-append>
                    <b-button class="onInput" variant="outline" @click="changeVisible('confirmPassword')">
                        <b-icon v-if="!showConfirm" icon="eye-slash"></b-icon>
                        <b-icon v-else icon="eye"></b-icon>
                    </b-button>
                </b-input-group-append>
            </b-input-group>
            <span class="inputError" v-if="confirmError && confirmError.length">{{ confirmError }}</span>
        </div><br>
        <b-button variant="primary" @click="checkValid">Valider</b-button><br><br>
    </div>
</template>

<script>
import { resetPassword } from '@/graphql/querys.js'
import gql from 'graphql-tag'
export default {
    data() {
        return {
            password: '',
            showPass: false,
            passwordError: '',
            confirmPassword: '',
            confirmError: '',
            showConfirm: false,
            code: ''
        }
    },
    mounted() {
        this.getCode();
    },
    methods: {
        checkValid() {
            if (!this.password.length || this.password.length < 6)
                this.passwordError = (this.password.length) ? 'Veuillez entrer un mot de passe' : 'votre mot de passe est trop court'
            else this.passwordError = ''
            if (this.confirmPassword != this.password)
                this.confirmError = 'Les deux mots de passe ne correspondent pas'
            else this.confirmError = ''
            if (this.confirmError.length || this.passwordError.length)
                return
            this.changePassword()
        },
        changeVisible(ofWhat) {
            if (ofWhat == 'password')
                this.showPass = !this.showPass
            else
                this.showConfirm = !this.showConfirm
            document.getElementById(ofWhat).type = (document.getElementById(ofWhat).type == 'password') ? 'text' : 'password'
        },
        changePassword() {
            this.$apollo.mutate({
                mutation: resetPassword,
                variables: {"password": this.password, "confirmPassword": this.confirmPassword, "code": this.code}
            }).then((data) => {
                void data
                window.location.href = '/'
            }).catch((error) => {
                console.log(error)
            })
        },
        getImage() {
          var temp = process.env.VUE_APP_API_URL || 'http://localhost:1337/graphql'
          this.$apollo.query({
            query: gql`query {
              parametre {
                logo {
                  url
                }
              }
            }`
          }).then((data) => {
            console.log(data['data']['parametre']['logo'][0]['url'])
            var link = temp.replace('/graphql', data['data']['parametre']['logo'][0]['url'])
            return link
          }).catch((error) => {
            console.log(error)
          })
        },
        getCode() {
            var location = window.location.href
            if (!location.includes('?code='))
                return this.router.push('/')
            this.code = location.split('?code=')[1]
        }
    },
}
</script>

<style>
.onInput:focus {
    outline:none !important;
    outline-width: 0 !important;
    box-shadow: none;
    -moz-box-shadow: none;
    -webkit-box-shadow: none;
}
.inputError{
    color: rgba(255, 0, 0, 0.6);
    font-style: italic;
    cursor: default;
    margin-left: 2%;
}
</style>