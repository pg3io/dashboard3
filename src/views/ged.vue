<template>
    <b-container fluid="sm" style="margin-top: 2%;">
        <b-table
            v-if="hasFiles && isLoaded && geds"
            :items="geds"
            :fields="fields"
            :sort-compare="mySortCompare"
            :sort-by.sync="sortBy"
            :sort-desc.sync="sortDesc"
            @row-contextmenu="rightClicked"
            @row-selected="onRowSelected"
            striped hover
            responsive="sm"
            ref="selectableTable"
            selectable>
            <template #cell(payer)="row">
                <span class="statut" style=""> {{ row.item.payer }} </span>
            </template>
            <template #cell(telecharger)="row">
                <b-button variant="link" size="sm" @click="downloadMedias(row.item.nom, row.item.fichier)" class="mr-1" style="color: inherit;">
                    <b-icon icon="file-earmark-arrow-down" style="transform: scale(1.25);"></b-icon>
                </b-button>
            </template>
        </b-table>
        <div v-else class="text-center pt-3">
            <b-icon icon="arrow-clockwise" animation="spin" font-scale="4" v-if="!isLoaded || !geds"></b-icon>
            <h2 style="margin-top: 2%; text-align: center;" v-else>Vous n'avez pas de fichiers dans le GED</h2>
        </div>
    </b-container>
</template>

<script>
import { userId, getUserGeds } from '@/graphql/querys.js'

export default {
    name: 'home',
    data() {
        return {
            selectMode: 'single',
            geds: [],
            userId: 0,
            sortBy: 'date',
            sortDesc: false,
            hasFiles: false,
            isLoaded: false,
            sortByFormatted: true,
            fields: [
                { key: 'nom', sortable: true, class: 'nom' },
                { key: 'date', sortable: true, class: 'date' },
                { key: 'entreprise', sortable: true, class: 'entreprise' },
                { key: 'type', sortable: false, class: 'type' },
                { key: 'telecharger', label: 'Télécharger', sortable: false, class: 'telecharger' }
            ]
        }
    },
    mounted() {
        this.getUserInfos();
        this.getGeds();
    },
    methods: {
        rightClicked (item, index, evt) {
            evt.preventDefault()
        },
        mySortCompare(itemA, itemB, key) {
            if ( key !== 'date') {
                return false
            } else {
                let a = itemA[key]
                let b = itemB[key]
                a = a.split('-')
                b = b.split('-')
                a = (parseInt(a[2], 10) * 10000) + (parseInt(a[1], 10) * 100) + parseInt(a[0])
                b = (parseInt(b[2], 10) * 10000) + (parseInt(b[1], 10) * 100) + parseInt(b[0])
                return a - b
            }
        },
        onRowSelected(items) {
            this.goToDetails(items[0].id);
        },
        downloadFile(mediaUrl, ref) {
            this.axios({
                url: this.downloadMedia(mediaUrl),
                method: 'GET',
                responseType: 'blob',
            }).then((response) => {
                var fileURL = window.URL.createObjectURL(new Blob([response.data]));
                var fileLink = document.createElement('a');
                fileLink.href = fileURL;
                fileLink.setAttribute('download', ref);
                document.body.appendChild(fileLink);
                fileLink.click();
            }).catch((error) => {console.log(error)});
        },
        downloadMedias(nom, medias) {
            medias.forEach((media, index) => {
                this.downloadFile(media.url, `${nom}_${index+1}.${this.getFileType(media.url)}`);
            })
        },
        goToDetails(ref) {
            var link = document.createElement('a');
            var url = 'fichiers/' + ref;
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
            });
        },
        getFileType (mediaUrl) {
            return mediaUrl.match(/uploads\/[^/]+\.([A-Za-z0-9]+)$/)[1];
        },
        getGeds() {
            var tmp_data;
            var counter = 0;
            var i = 0;
            if (!this.userId)
                return setTimeout(this.getGeds, 100);
            this.$apollo.mutate({
                mutation: getUserGeds,
                variables: {'id': this.userId}
            }).then((data) => {
                // console.log(data);
                if (data.data.users[0].ged) {
                    tmp_data = data['data']['users'][0];
                    tmp_data = this.addEntrepriseName(tmp_data);
                    tmp_data['entreprises'].forEach((entreprise) => {
                        entreprise['geds'].forEach((ged) => {
                            i++;
                            this.geds.push(ged);
                        });
                        if (i == 0) {
                            counter++;
                            i = 0;
                        }
                    });
                    if (counter == tmp_data['entreprises'].length) this.hasFiles = false;
                    else this.hasFiles = true;
                    this.isLoaded = true;
                }
                else {
                    var fileLink = document.createElement('a');
                    fileLink.href = '/';
                    fileLink.click();
                }
            }).catch((error) => {
                console.log(error)
            })
        },
        addEntrepriseName(user) {
            user['entreprises'].forEach((corp) => {
                corp['geds'].forEach((ged) => {
                    ged['entreprise'] = corp.nom;
                });
            });
            return user;
        }
    },
}

</script>

<style lang="css" scoped>
.tableServer {
    cursor: default;
}
.tdServer {
    cursor: pointer;
}
</style>
