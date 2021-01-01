<template>
    <b-container fluid="sm" style="margin-top: 2%;">
        <table class="table table-striped table-hover">
            <thead>
                <tr>
                    <th># Ref</th>
                    <th>Nom</th>
                    <th>Date</th>
                    <th>Entreprise</th>
                    <th>Télécharger</th>
                </tr>
            </thead>
            <tbody>
                <tr v-for="facture in factures" :key="facture.id" class="tdServer">
                    <td @click="goToDetails(facture.ref)">{{ facture.ref }}</td>
                    <td @click="goToDetails(facture.ref)">{{ facture.nom }}</td>
                    <td @click="goToDetails(facture.ref)">{{ facture.date }}</td>
                    <td @click="goToDetails(facture.ref)">{{ facture.entreprise }}</td>
                    <td @click="downloadPDF(facture.media[0].url, facture.ref)"><b-icon icon="file-earmark-arrow-down-fill" style="transform: scale(1.25); margin-left: 20%;"></b-icon></td>
                </tr>
            </tbody>
        </table>
    </b-container>
</template>

<script>
import { userId, facturesId, minFactureInfo } from '@/graphql/querys.js'
export default {
    name: 'home',
    data() {
        return {
            userId: 0,
            factures: [],
            save: null
        }
    },
    mounted() {
        this.getUserInfos();
        this.getFactures();
        this.getFactures2();
    },
    methods: {
        downloadPDF(mediaUrl, ref) {
            this.axios({
                url: this.downloadMedia(mediaUrl),
                method: 'GET',
                responseType: 'blob',
            }).then((response) => {
                var fileURL = window.URL.createObjectURL(new Blob([response.data]));
                var fileLink = document.createElement('a');
                fileLink.href = fileURL;
                fileLink.setAttribute('download', ref+'.pdf');
                document.body.appendChild(fileLink);
                fileLink.click();
            });
        },
        goToDetails(ref) {
            var link = document.createElement('a');
            var url = 'factures/' + ref;
            document.body.appendChild(link);
            link.href = url;
            link.click();
        },
        downloadMedia: function(mediaUrl) {
            var temp = process.env.VUE_APP_API_URL || 'http://localhost:1337/graphql'
            var link = temp.replace('/graphql', mediaUrl)
            return link
        },
        getUserInfos() {
            var myId = 0
            this.$apollo.query({
                query: userId
            }).then((data) => {
                myId = data['data']['me']['id']
                this.userId = myId
            }).catch((error) => {
                console.log(error)
            })
        },
        getFactures2() {
            if (!this.save)
                return setTimeout(this.getFactures2, 100);
            this.factures = []
            var myFactIds = [], temp = {}
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
                    this.factures.push(data['data']['factures'][i])
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
            }).catch((error) => { console.log(error) })
        },
        getFactures() {
            if (!this.userId)
                return setTimeout(this.getFactures, 100)
            this.$apollo.mutate({
                mutation: facturesId,
                variables: {'id': this.userId}
            }).then((data) => {
                this.save = data['data']['users']
            }).catch((error) => {
                console.log(error)
            })
        }
    },
}
</script>

<style scoped>
.tableServer {
    cursor: default;
}
.tdServer {
    cursor: pointer;
}
</style>
