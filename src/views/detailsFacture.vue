<template>
    <b-container>
        <transition name="slide-fade">
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
                        <b-row v-if="facture.media.length > 1">
                            <b-col v-for="(fichier, index) in facture.media" :key="index">
                                <b-icon class="download" v-b-tooltip.hover.top="`${facture.nom} n° ${index+1}`" @click="downloadPDF(getPdfLink(fichier.url), `${facture.nom}_${index+1}.pdf`)" icon="file-earmark-arrow-down" style="transform: scale(1.5); cursor: pointer; margin-left: 20%; margin-top: 10%;"></b-icon>
                            </b-col>
                        </b-row>
                        <b-icon  class="download" v-else @click="downloadPDF(getPdfLink(facture.media[0].url), `${facture.nom}.${getFileType(facture.media[0].url)}`)" icon="file-earmark-arrow-down" style="transform: scale(1.5); cursor: pointer; margin-left: 20%; margin-top: 10%;"></b-icon>
                        <b-row class="mt-3 d-flex justify-content-between">
                            <b-col>
                                <b-icon id="arrowBackward" v-if="prevFacture" v-b-tooltip.hover.bottom="'Facture précédente'" @click="previousFacture()" icon="arrow-left-square" style="transform: scale(1.5); cursor: pointer; margin-left: 20%; margin-top: 10%;"></b-icon>
                            </b-col>
                            <b-col>
                                <b-icon id="arrowForward" v-if="nxtFacture" @click="nextFacture()" v-b-tooltip.hover.bottom="'Facture suivante'" icon="arrow-right-square" style="transform: scale(1.5); cursor: pointer; margin-left: 20%; margin-top: 10%;"></b-icon>
                            </b-col>
                        </b-row>
                    </div>
                </b-row>
            </b-col>
            <b-col cols="12" lg="8" class="mt-3" v-if="facture.media.length > 1">
                <b-tabs>
                    <b-tab :title="facture.nom+' n° '+(index+1)" v-for="(fichier, index) in facture.media" :key="index">
                        <embed ref="factureRef" :src="getPdfLink(fichier.url)" width="100%" height="880" frameborder="0" allowfullscreen />
                    </b-tab>
                </b-tabs>
            </b-col>
            <b-col cols="12" lg="8" class="mt-3" v-else>
                <embed ref="factureRef" :src="getPdfLink(facture.media[0].url)" width="100%" height="880" frameborder="0" allowfullscreen />
            </b-col>
        </b-row>
        </transition>
        <h2 style="margin-top: 2%;" v-if="!search && !(facture && facture.media)">Nothing found</h2>
    </b-container>
</template>

<script>
import { userId, getUserPerms, facturesId, factureInfo, searchFacture, minFactureInfo } from '@/graphql/querys.js'

function exchangeDate (date) {
    var arr = date.split('-');
    const tmp = arr[0];
    arr[0] = arr[1];
    arr[1] = tmp;
    return arr.join('-');
}

function sorter(a, b) {
    var DateA = new Date(exchangeDate(a.date));
    var DateB = new Date(exchangeDate(b.date));
    return (DateA.getTime() - DateB.getTime())
}

export default {
    name: "factureDetails",
    data() {
        return {
            search: true,
            facture: null,
            userId: 0,
            factures: null,
            save: null,
            myFactIds: [],
            prevFacture: '',
            nxtFacture: '',
            factureIndex: null,
        }
    },
    mounted() {
        this.getFactId();
        this.checkPerm();
        this.getFactures();
        this.getFactures2();
        this.getFactureIndex();
        this.setArrows();
    },
    methods: {
        setArrows() {
            if (this.factureIndex === null)
                return setTimeout(this.setArrows, 100);
            else {
                if (this.factureIndex >= 0) {
                    if (this.factureIndex > 0)
                        this.prevFacture = this.factures[this.factureIndex-1].ref;
                    if (this.factureIndex < this.factures.length - 1)
                        this.nxtFacture = this.factures[this.factureIndex+1].ref;
                }
            }
        },
        checkPerm() {
            if (!this.userId) {
                return setTimeout(this.checkPerm, 100);
            }
            else {
                this.$apollo.mutate({
                    mutation: getUserPerms,
                    variables: {"id": this.userId}
                }).then((data) => {
                    if (!data.data.users[0].factures) {
                        var link = document.createElement('a');
                        document.body.appendChild(link);
                        link.href = '/';
                        link.click();
                    }
                }).catch((error) => {console.log(error);});
            }
        },
        getFactureIndex() {
            if (!this.factures||!this.facture)
                return setTimeout(this.getFactureIndex, 100);
            else if (this.factures.length === 0) return setTimeout(this.getFactureIndex, 100);
            else {
                for (let i = 0; i < this.factures.length; i++) {
                    var elem = this.factures[i];
                    if (elem.ref === this.facture.ref) {
                        this.factureIndex = i;
                        break;
                    }
                    if (i === (this.factures.length - 1) && elem.ref !==  this.facture.ref) {
                        this.factureIndex = -1;
                    }
                }
            }
        },
        getFileType(mediaUrl) {
            return mediaUrl.match(/uploads\/[^/]+\.([A-Za-z0-9]+)$/)[1];
        },
        getFactures() {
            if (!this.userId)
                return setTimeout(this.getFactures, 100)
            this.$apollo.mutate({
                mutation: facturesId,
                variables: {'id': this.userId}
            }).then((data) => {
                this.save = data['data']['users']
                if (!this.save[0].factures) {
                    this.redirectIndex();
                }
            }).catch((error) => {
                console.log(error)
            })
        },
        getFactures2() {
            if (!this.save)
                return setTimeout(this.getFactures2, 100);
            this.factures = []
            var myFactIds = []
            var temp = {}
            var tmp = {}
            for (let x = 0; this.save[0]['entreprises'][x]; x++) {
                for (let y = 0; this.save[0]['entreprises'][x]['factures'][y]; y++) {
                    myFactIds.push(this.save[0]['entreprises'][x]['factures'][y]['id'])
                }
            }
            this.$apollo.mutate({
                mutation: minFactureInfo,
                variables: {'id': myFactIds}
            }).then((data) => {
                for (let i = 0; data['data']['factures'][i]; i++) {
                    this.factures.push(data['data']['factures'][i]);
                    for (let y = 0; this.save[0]['entreprises'][y]; y++) {
                        for (let x = 0; this.save[0]['entreprises'][y]['factures'][x]; x++) {
                            if (this.save[0]['entreprises'][y]['factures'][x].id == this.factures[i].id)
                                this.factures[i]['entreprise'] = this.save[0]['entreprises'][y].nom
                        }
                    }
                }
                for (let i = 0; this.factures[i]; i++) {
                    temp = this.factures[i].date.split('-')
                    this.factures[i].date = temp[2] + '-' + temp[1] + '-' + temp[0]
                }
                for (let i = 0; this.factures[i]; i++) {
                    tmp = this.factures[i].payer
                    if (tmp !== true) {
                        this.factures[i].payer = "impayée";
                    } else if (tmp !== false) {
                        this.factures[i].payer = "payée";
                    }
                }
                this.factures.sort(sorter);
                
            })
            .catch((error) => { console.log(error) })
        },
        previousFacture() {
            var link = document.createElement('a');
            var url = this.prevFacture;
            document.body.appendChild(link);
            link.href = url;
            link.click();
        },
        nextFacture() {
            var link = document.createElement('a');
            var url = this.nxtFacture;
            document.body.appendChild(link);
            link.href = url;
            link.click();
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
        downloadPDF(myUrl, nom) {
            this.axios({
                url: myUrl,
                method: 'GET',
                responseType: 'blob',
            }).then((response) => {
                var fileURL = window.URL.createObjectURL(new Blob([response.data]));
                var fileLink = document.createElement('a');
                fileLink.href = fileURL;
                fileLink.setAttribute('download', nom);
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
                if (!data.data.users[0].factures) {
                     var link = document.createElement('a');
                    document.body.appendChild(link);
                    link.href = '/';
                    link.click();
                }
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
                this.userId = data.data.me.id;
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
