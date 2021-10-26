<template>

    <div>
        <b-row class="align-items-start" v-if="ged && ged.fichier">
            <b-col cols="12"  lg="4">
                <b-row class="text-left">
                    <div class="p-5" style="transform: scale(1.2); align-self: center; margin: auto;">
                        <h4 class="text-center">Infos</h4>
                        <table class="table table-sm table-hover" style="transform: scale(1.1);">
                            <tbody>
                                <tr><th>Nom</th><td>{{ ged.nom }}</td></tr>
                                <tr><th>Date</th><td>{{ ChangeDate(ged.date) }}</td></tr>
                                <tr><th>Entreprise</th><td>{{ ged.entreprise }}</td></tr>
                                <tr><th>Type</th><td>{{ ged.type }}</td></tr>
                            </tbody>
                        </table>
                        <b-row v-if="ged.fichier.length > 1">
                            <b-col v-for="(fichier, index) in ged.fichier" :key="index">
                                <b-icon v-b-tooltip.hover.top="`fichier n° ${index+1} ${getFileName(fichier.url)}`" @click="downloadFile(getFileLink(fichier.url), `${ged.nom}_${index+1}.${getFileType(fichier.url)}`)" icon="file-earmark-arrow-down" style="transform: scale(1.5); cursor: pointer; margin-left: 20%; margin-top: 10%;"></b-icon>
                            </b-col>
                        </b-row>
                        <b-icon v-else @click="downloadFile(getFileLink(ged.fichier[0].url), `${ged.nom}.${getFileType(ged.fichier[0].url)}`)" icon="file-earmark-arrow-down" style="transform: scale(1.5); cursor: pointer; margin-left: 20%; margin-top: 10%;"></b-icon>
                    </div>
                </b-row>
            </b-col>
            <b-col cols="12" lg="8" class="mt-3" v-if="ged.fichier.length > 1">
                <b-tabs>
                    <b-tab :title="'fichier n° '+(index+1)" v-for="(fichier, index) in ged.fichier" :key="index">
                        <embed ref="factureRef" :src="getFileLink(fichier.url)" width="100%" height="880" frameborder="0" allowfullscreen />
                    </b-tab>
                </b-tabs>
            </b-col>
            <b-col cols="12" lg="8" class="mt-3" v-else>
                <embed ref="factureRef" :src="getFileLink(ged.fichier[0].url)" width="100%" height="880" frameborder="0" allowfullscreen />
            </b-col>
        </b-row>
        <h2 style="margin-top: 2%;" v-else-if="!search">Nothing found</h2>
    </div>
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
            ged: null,
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
        ChangeDate(date) {
            return date.split('-').reverse().join('/');
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
                    this.search = false
                }).catch((err) => {console.log(err); this.search = false});
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
        getFileType (mediaUrl) {
            return mediaUrl.match(/uploads\/[^/]+\.([A-Za-z0-9]+)$/)[1];
        },
        getFileName (mediaUrl) {
            return mediaUrl.match(/uploads\/([^/]+\.[A-Za-z0-9]+)$/)[1];
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
