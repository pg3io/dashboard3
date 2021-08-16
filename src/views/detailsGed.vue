<template>
    <b-container>
        <b-row class="align-items-start" v-if="ged && ged.fichier">
            <b-col cols="12"  lg="4">
                <b-row class="text-left">
                    <div class="p-5" style="transform: scale(1.2); align-self: center; mmargin: auto;">
                        <h4 class="text-center">Infos</h4>
                        <table class="table table-sm table-hover" style="transform: scale(1.1);">
                            <tbody>
                                <tr><th>Nom</th><td>{{ ged.nom }}</td></tr>
                                <tr><th>Date</th><td>{{ ged.date }}</td></tr>
                                <tr><th>Entreprise</th><td>{{ ged.entreprise }}</td></tr>
                                <tr><th>Type</th><td>{{ ged.type }}</td></tr>
                            </tbody>
                        </table>
                        <b-icon @click="downloadFile(getFileLink(ged.fichier[0].url), `${ged.nom}.${ged.type.toLowerCase()}`)" icon="file-earmark-arrow-down" style="transform: scale(1.5); cursor: pointer; margin-left: 20%; margin-top: 10%;"></b-icon>
                        <!--b-icon @click="previousFacture()" icon="arrow-left-square-fill" style="transform: scale(1.5); cursor: pointer; margin-left: 20%; margin-top: 10%;"></b-icon-->
                        <!--b-icon @click="nextFacture()" icon="arrow-right-square-fill" style="transform: scale(1.5); cursor: pointer; margin-left: 20%; margin-top: 10%;"></b-icon-->
                    </div>
                </b-row>
            </b-col>
            <embed ref="factureRef" :src= getFileLink(ged.fichier[0].url) width="65%" height="880" frameborder="0" allowfullscreen />
        </b-row>
        <div v-else class="text-center pt-3">
            <b-icon icon="arrow-clockwise" animation="spin" font-scale="4" v-if="search"></b-icon>
            <h2 style="margin-top: 2%;" v-if="!search">Nothing found</h2>
        </div>
    </b-container>
</template>

<script>
import { userId, getUserGeds, getGedInfo } from '@/graphql/querys.js'

export default {
    name: "factureDetails",
    components: {
    },
    data() {
        return {
            search: true,
            ged: [],
            userId: 0,
            entreprise: ''
        }
    },
    created() {
        this.setUserId();
    },
    mounted() {
        this.getEntreprise();
        this.getGed();
    },
    methods: {
        followingFacture() {
            var link = document.createElement('following');
            var url = 'factures/' + 'azertaze';
            console.log(url);
            document.body.appendChild(link);
            link.href = url;
            link.click();
        },
        nextFacture(ref) {
            var link = document.createElement('previous');

            var url = 'factures/' + ref[-1];
            document.body.appendChild(link);
            link.href = url;
            link.click();
        },
        changeDate() {
            var temp = this.ged.date.split('-')
            this.ged.date = temp[2] + '/' + temp[1] + '/' + temp[0]
        },
        downloadFile(mediaUrl, ref) {
            this.axios({
                url: mediaUrl,
                method: 'GET',
                responseType: 'blob',
            }).then((response) => {
                var fileURL = window.URL.createObjectURL(new Blob([response.data]));
                var fileLink = document.createElement('a');
                fileLink.href = fileURL;
                fileLink.setAttribute('download', ref);
                document.body.appendChild(fileLink);
                fileLink.click();
            });
        },
        goToPdf(mediaUrl) {
            var pdf = this.getFileLink(mediaUrl);
            window.open(pdf);
        },
        getFileLink(mediaUrl) {
            var temp = process.env.VUE_APP_API_URL || 'http://localhost:1337/graphql'
            var link = temp.replace('/graphql', mediaUrl)
            return link
        },
        getGed() {
            if (this.entreprise !== '') {
                this.$apollo.mutate({
                    mutation: getGedInfo,
                    variables: {'id': parseInt(/\/([0-9]+)$/.exec(window.location.href)[1], 10)}
                }).then((data) => {
                    this.ged = [];
                    this.ged = data['data']['geds'][0];
                    this.ged['entreprise'] = this.entreprise;
                }).catch((err) => {console.log(err)});
            }
            else return setTimeout(this.getGed, 100);
        },
        setUserId() {
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
        getEntreprise() {
            var gedId = parseInt(/\/([0-9]+)$/.exec(window.location.href)[1], 10);
            if (!this.userId) {
                return setTimeout(this.getEntreprise, 100);
            } else {
                this.$apollo.mutate({
                    mutation: getUserGeds,
                    variables: {'id': this.userId}
                })
                .then((data) => {
                    if (data.data.users[0].ged) {
                        data['data']['users'][0]['entreprises'].forEach((corp) => {
                            corp['geds'].forEach((ged) => {
                                if (parseInt(ged['id'], 10) === gedId)
                                    this.entreprise = corp.nom;
                            });
                        });
                    } else {
                        var link = document.createElement('a');
                        document.body.appendChild(link);
                        link.href = '/';
                        link.click();
                    }
                })
                .catch((err) => {console.log(err)});
            }
        },
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
