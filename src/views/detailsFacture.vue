<template>
    <b-container>
        <b-row class="align-items-start" v-if="facture && facture.media">
            <b-col cols="12"  lg="4">
                <b-row class="text-left">
                    <div class="p-5" style="transform: scale(1.2); align-self: center; mmargin: auto;">
                        <h4 class="text-center">Infos</h4>
                        <table class="table table-sm table-hover" style="transform: scale(1.1);">
                            <tbody>
                                <tr><th>Ref</th><td>{{ facture.ref }}</td></tr>
                                <tr><th>Nom</th><td>{{ facture.nom }}</td></tr>
                                <tr><th>Date</th><td>{{ facture.date }}</td></tr>
                                <tr><th>Entreprise</th><td>{{ facture.entreprise }}</td></tr>
                                <tr><th>Etat</th><td>{{ facture.payer }}</td></tr>
                            </tbody>
                        </table>
                        <b-icon @click="downloadPDF(getPdfLink(facture.media[0].url))" icon="file-earmark-arrow-down-fill" style="transform: scale(1.5); cursor: pointer; margin-left: 20%; margin-top: 10%;"></b-icon>
                        <b-icon @click="previousFacture()" icon="arrow-left-square-fill" style="transform: scale(1.5); cursor: pointer; margin-left: 20%; margin-top: 10%;"></b-icon>
                        <b-icon @click="followingFacture()" icon="arrow-right-square-fill" style="transform: scale(1.5); cursor: pointer; margin-left: 20%; margin-top: 10%;"></b-icon>
                    </div>
                </b-row>
            </b-col>
            <embed ref="factureRef" :src= getPdfLink(facture.media[0].url) width="65%" height="880" frameborder="0" allowfullscreen />
        </b-row>
        <div v-else class="text-center pt-3">
            <b-icon icon="arrow-clockwise" animation="spin" font-scale="4" v-if="search"></b-icon>
            <h2 style="margin-top: 2%;" v-if="!search">Nothing found</h2>
        </div>
    </b-container>
</template>

<script>
import { userId, facturesId, factureInfo, searchFacture } from '@/graphql/querys.js'

export default {
    name: "factureDetails",
    components: {
    },
    data() {
        return {
            search: true,
            facture: []
        }
    },
    mounted() {
        this.getFactId();
    },
    methods: {
        followingFacture() {
            var test = this.facture

            console.log(test)
        },
        previousFacture() {
            var test = this.facture.id

            console.log(test)
        },
        myPayedFact() {
            var temp = this.facture.payer

            if (temp !== true) {
                this.facture.payer = "impayée"
            } else if (temp !== false) {
                this.facture.payer = "payée"
            } else {
                return null
            }
        },
        changeDate() {
            var temp = this.facture.date.split('-')
            this.facture.date = temp[2] + '/' + temp[1] + '/' + temp[0]
        },
        downloadPDF(myUrl) {
            this.axios({
                url: myUrl,
                method: 'GET',
                responseType: 'blob',
            }).then((response) => {
                var fileURL = window.URL.createObjectURL(new Blob([response.data]));
                var fileLink = document.createElement('a');
                fileLink.href = fileURL;
                fileLink.setAttribute('download', this.facture.ref+'.pdf');
                document.body.appendChild(fileLink);
                fileLink.click();
            });
        },
        goToPdf(mediaUrl) {
            var pdf = this.getPdfLink(mediaUrl);
            window.open(pdf);
        },
        getPdfLink(mediaUrl) {
            var temp = process.env.VUE_APP_API_URL || 'http://localhost:1337/graphql'
            var link = temp.replace('/graphql', mediaUrl)
            return link
        },
        getFactureEntreprise(factId, entName) {
            if (!factId || factId <= 0)
                return this.facture = null
            this.$apollo.mutate({
                mutation: factureInfo,
                variables: {"id": factId}
            }).then((data) => {
                this.facture = {}
                this.facture = data['data']['factures'][0]
                this.facture['entreprise'] = entName
                this.changeDate();
                this.myPayedFact();
                document.title = "PG3 - Facture " + this.facture.ref
                this.search = false
            }).catch((error) => {
                console.log(error)
                this.search = false
            })
        },
        getFactInfos(usrId, tempId) {
            if (!usrId || usrId <= 0)
                return this.facture = null
            var temp = '', lock = true
            var factId = 0, entName = ''
            this.$apollo.mutate({
                mutation: facturesId,
                variables: { "id": usrId}
            }).then((data) => {
                temp = data['data']['users'][0]['entreprises']
                for (let i = 0; temp[i] && lock == true; i++) {
                    entName = temp[i]['nom'];
                    for (let y = 0; temp[i]['factures'][y] && lock == true; y++) {
                        factId = temp[i]['factures'][y]['id'];
                        if (temp[i]['factures'][y]['id'] == tempId)
                            lock = false;
                    }
                }
                if (lock != true)
                    return this.getFactureEntreprise(factId, entName)
                this.search = false
                return this.facture = null
            })
        },
        getTempId(usrId) {
            var search = this.$route.path.split('/')[2]
            this.$apollo.mutate({
                mutation: searchFacture,
                variables: {'search': search}
            }).then((data) => {
                if (data['data'] && data['data']['factures'] && data['data']['factures'][0] && data['data']['factures'][0]['id'])
                    this.getFactInfos(usrId, data['data']['factures'][0]['id'])
                else this.search = false;
            }).catch((error) => {
                console.log(error)
            })
        },
        getFactId() {
            this.$apollo.query({
                query: userId
            }).then((data) => {
                return this.getTempId(data['data']['me']['id'])
            }).catch((error) => {
                console.log(error)
            })
        }
    },
}
</script>

<style scoped>
.center{
    position: fixed;
    top: 50%;
    left: 40%;
    transform: translate(-50%, -50%);
}
</style>
