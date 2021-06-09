<template>
    <b-container class="p-3" style="margin-top: 2%;" v-if="userInfos">
        <h2>{{ userInfos.username }}</h2>
        <table class="table table-hover bg-light">
            <tbody>
                <tr><th><a href="https://fr.gravatar.com/" style="color:black"> Profile gravatar </a></th><td><img class="rounded-circle" :src="gravatar" alt="user profile image" /> </td></tr>
                <tr><th>E-mail</th><td> {{ userInfos.email }} </td></tr>
                <tr>
                    <th v-if="userInfos.entreprises && userInfos.entreprises.length > 1">Entreprises</th>
                    <th v-else>Entreprise</th>
                    <td>
                        <span v-for="(entreprise, index) in userInfos.entreprises" :key="entreprise.nom">
                            <span v-if="index == userInfos.entreprises.length - 1">{{ entreprise.nom }}</span>
                            <span v-else>{{ entreprise.nom }}, </span>
                        </span>
                    </td>
                </tr>
            </tbody>
        </table>
        <span  class="changepwd" @click="editPwd" style="cursor: pointer; margin-left: 2%;">Changer le mot de passe</span>
        <b-modal size="xl" id="changePassword" :no-close-on-esc=true :no-close-on-backdrop=true title='Changer le mot de passe' hide-footer>
            <label for='oldPassword'>Entrez votre mot de passe actuel</label>
            <b-input-group>
                <b-form-input v-model="oldPassword" name="oldPassword" id="oldPassword" type="password"></b-form-input>
                <b-input-group-append>
                    <b-button variant="outline" class="onInput" @click="changeState('old')">
                        <b-icon icon="eye-slash" v-if="!old"></b-icon>
                        <b-icon icon="eye" v-else></b-icon>
                    </b-button>
                </b-input-group-append>
            </b-input-group>
            <div class="inputError" v-if="oldError && oldError.length">{{ oldError }}</div>
            <label for="newPassword">Entrez votre nouveau mot de passe</label>
            <b-input-group>
                <b-form-input v-model="newPassword" name="newPassword" id="newPassword" type="password"></b-form-input>
                <b-input-group-append>
                    <b-button variant="outline" class="onInput" @click="changeState('new')">
                        <b-icon icon="eye-slash" v-if="!yesNew"></b-icon>
                        <b-icon icon="eye" v-else></b-icon>
                    </b-button>
                </b-input-group-append>
            </b-input-group>
            <div class="inputError" v-if="newError && newError.length">{{ newError }}</div>
            <label for="confirmNewPassword">Confirmez votre nouveau mot de passe</label>
            <b-input-group>
                <b-form-input v-model="confirmNewPassword" name="confirmNewPassword" id="confirmNewPassword" type="password"></b-form-input>
                <b-input-group-append>
                    <b-button variant="outline" class="onInput" @click="changeState('confirm')">
                        <b-icon icon="eye-slash" v-if="!confirm"></b-icon>
                        <b-icon icon="eye" v-else></b-icon>
                    </b-button>
                </b-input-group-append>
            </b-input-group>
            <div class="inputError" v-if="confirmError && confirmError.length">{{ confirmError }}</div>
            <br>
            <b-button class="float-right" variant="success" style="margin-right: 5%;" @click="checkValid">Valider</b-button>
            <b-button class="float-right" variant="secondary" style="margin-right: 1%;" @click="$bvModal.hide('changePassword')">Annuler</b-button>
        </b-modal>
    </b-container>
</template>

<script>
import { changePassword } from '@/graphql/querys.js'
import { mapActions } from 'vuex'
import md5 from "js-md5";

export default {
    name: 'profile',
    data() {
        return {
            oldPassword: '',
            old: false,
            oldError: '',
            newPassword: '',
            yesNew: false,
            newError: '',
            confirmNewPassword: '',
            confirm: false,
            confirmError: ''
        }
    },
    props: {
        userInfos: Object,
    },
    computed: {
        gravatar () {
            const hash = md5(this.userInfos.email);
            return `https://www.gravatar.com/avatar/${hash}`;
        },
    },
    methods: {
        checkValid() {
            if (this.newPassword.length < 6)
                this.newError = (this.newPassword.length == 0) ? 'Veuillez entrer un mot de passe' : 'Votre mot de passe est trop court'
            else this.newError = ''
            if (this.confirmNewPassword != this.newPassword)
                this.confirmError = 'Les deux mot de passe entrés ne sont pas identique'
            else this.confirmError = ''
            if (!(this.newError == '' && this.confirmError == ''))
                return
            this.checkOld()
        },
        changePassword() {
            this.$apollo.mutate({
                mutation: changePassword,
                variables: {'id': this.userInfos.id, 'password': this.confirmNewPassword}
            }).then((data) => {
                void data
                this.$bvModal.hide('changePassword')
            }).catch((error) => {
                console.log(error)
            })
        },
        changeState(ofWhat) {
            if (ofWhat == 'old') {
                this.old = !this.old;
                document.getElementById('oldPassword').type = (document.getElementById('oldPassword').type == 'password') ? 'text' : 'password'
            }
            else if (ofWhat == 'new') {
                this.yesNew = !this.yesNew;
                document.getElementById('newPassword').type = (document.getElementById('newPassword').type == 'password') ? 'text' : 'password'
            } else {
                this.confirm = !this.confirm;
                document.getElementById('confirmNewPassword').type = (document.getElementById('confirmNewPassword').type == 'password') ? 'text' : 'password'
            }
        },
        editPwd() {
            this.oldPassword = '',
            this.newPassword = '',
            this.confirmNewPassword = ''
            this.$bvModal.show('changePassword')
        },
        ...mapActions(['testLogin']),
        checkOld() {
            var auths = {identifier: this.userInfos.username.toLowerCase(), password: this.oldPassword}
            this.testLogin(auths)
                .then(() => {
                    this.oldError = ""
                    this.changePassword();
                }).catch(() => {
                    this.oldError = "Votre mot de passe n'est pas correct"
                })
        },
    },
}
</script>

<style scoped>
label{
    margin-top: 1%;
    margin-left: 2%;
}
span:hover {
    text-decoration: underline;
}
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