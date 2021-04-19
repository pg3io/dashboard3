<template>
    <b-container fluid="sm" style="margin-top: 2%;">
        <b-table
            striped hover
            :items="factures"
            :fields="fields"
            :sort-compare="mySortCompare"
            :sort-by.sync="sortBy"
            :sort-desc.sync="sortDesc"
            responsive="sm"
            ref="selectableTable"
            selectable
            @row-selected="onRowSelected"
            >
            <template #cell(telecharger)="row">
                <b-button variant="link" size="sm" @click="downloadPDF(row.item.media[0].url, row.item.ref)" class="mr-1" style="color: inherit;">
                    <b-icon icon="file-earmark-arrow-down-fill" style="transform: scale(1.25);"></b-icon>
                </b-button>
            </template>
        </b-table>
    </b-container>
</template>

<script>
import { userId, facturesId, minFactureInfo } from '@/graphql/querys.js'
export default {
    name: 'home',
    data() {
        return {
            selectMode: 'single',
            userId: 0,
            factures: [],
            save: null,
            sortBy: 'date',
            sortDesc: true,
            sortByFormatted: true,
            fields: [
          { key: 'ref', sortable: true },
          { key: 'nom', sortable: true },
          { key: 'date', sortable: true },
          { key: 'entreprise', sortable: true },
          { key: 'telecharger', label: 'Télécharger', sortable: false}
            ]
        }
    },
    mounted() {
        this.getUserInfos();
        this.getFactures();
        this.getFactures2();
    },
    methods: {
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
            console.log(items);
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