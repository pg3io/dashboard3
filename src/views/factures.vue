<template>
    <div>
        <transition name="slide-fade">
            <b-container fluid="sm" style="margin-top: 2%;" v-if="hasFactures && isLoaded && factures">
                <b-table
                    :items="factures"
                    :fields="fields"
                    :sort-compare="mySortCompare"
                    :sort-by.sync="sortBy"
                    :sort-desc.sync="sortDesc"
                    @row-contextmenu="rightClicked"
                    @row-selected="onRowSelected"
                    :tbody-tr-class="rowClass"
                    striped hover
                    responsive="sm"
                    ref="selectableTable"
                    selectable>
                    <template #cell(payer)="row">
                        <span class="statut" style="" > {{ row.item.payer }} </span>
                    </template>
                    <template #cell(telecharger)="row">
                        <b-button variant="link" size="sm" @click="downloadPDFs(row.item.media, row.item.ref)" class="mr-1" style="color: inherit;">
                            <b-icon icon="file-earmark-arrow-down" style="transform: scale(1.25);"></b-icon>
                        </b-button>
                    </template>
                </b-table>
            </b-container>
        </transition>
        <transition name="slide-fade">
            <h2 style="margin-top: 2%; text-align: center;" v-if="!(hasFactures && factures) && isLoaded">Vous n'avez pas de factures</h2>
        </transition>
    </div>
</template>

<script>
import { userId, facturesId, minFactureInfo } from '@/graphql/querys.js'
import $ from 'jquery'

export default {
    name: 'home',
    data() {
        return {
            selectMode: 'single',
            userId: 0,
            factures: [],
            hasFactures: false,
            isLoaded: false,
            save: null,
            sortBy: 'date',
            sortDesc: true,
            sortByFormatted: true,
            factureGang: 0,
            fields: [
          { key: 'ref', sortable: true, class: 'ref' },
          { key: 'nom', sortable: true, class: 'nom' },
          { key: 'date', sortable: true, class: 'date' },
          { key: 'entreprise', sortable: true, class: 'entreprise' },
          { key: 'payer', label: 'Statut', sortable: false, class: 'statut'},
          { key: 'telecharger', label: 'Télécharger', sortable: false, class: 'telecharger' }
            ]
        }
    },
    mounted() {
        this.getUserInfos();
        this.getFactures();
        this.getFactures2();
        this.addClasses();
    },
    methods: {
        addClasses () {
            if (this.factures.length > 0 && this.isLoaded)
                this.factures.forEach((f, index) => {
                    $(`tr.${f.ref}`).addClass('facture'+index);
                });
            else return setTimeout(this.addClasses, 100);
        },
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
        rowClass(item, type) {
            if (item && type === 'row')  {
                if (item.payer === 'payée') {
                    const classe = `payee ${item.ref}`;
                    return classe;
                } else if (item.payer === 'impayée') {
                    const classe = `impayee ${item.ref}`;
                    return classe;
                }
            }
            return null
        },
        onRowSelected(items) {
            // console.log(items);
            this.goToDetails(items[0].ref);
        },
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
        getFileType (mediaUrl) {
            return mediaUrl.match(/uploads\/[^/]+\.([A-Za-z0-9]+)$/)[1];
        },
        downloadPDFs(medias, nom) {
            medias.forEach((media, index) => {
                this.downloadPDF(media.url, `${nom}_${index+1}`);
            })
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
        redirectIndex() {
        var link = document.createElement('a');
            document.body.appendChild(link);
            link.href = '/';
            link.click();
        },
        getFactures() {
            if (!this.userId)
                return setTimeout(this.getFactures, 100)
            this.$apollo.mutate({
                mutation: facturesId,
                variables: {'id': this.userId}
            }).then((data) => {
                this.save = data['data']['users']
                var nEmpty = 0;
                this.save[0].entreprises.forEach((elem) => {
                    if (elem.factures.length <= 0)
                        nEmpty++;
                    else return;
                });
                if (nEmpty === this.save[0].entreprises.length)
                    this.hasFactures = false;
                else this.hasFactures = true;
                this.isLoaded = true;
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
            })
            .catch((error) => { console.log(error) })
        },
    },
}

</script>

<style lang="css" scoped>
.impayee .statut  {
    color: blue;
    border: 1px solid;
    border-radius: 5px;
    padding: 2px 5px;
    background-color: lightblue;
}
.payee .statut {
    color: green;
    border: 1px solid;
    border-radius: 5px;
    padding: 2px 5px;
    background-color: lightgreen;
}
.b-table-statut > td {
    border-color: var(--primary) !important;
}
.tableServer {
    cursor: default;
}
.tdServer {
    cursor: pointer;
}
</style>
