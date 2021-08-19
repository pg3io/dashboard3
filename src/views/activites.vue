<template>
    <b-container fluid="sm" style="margin-top: 2%;">
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
                <b-button variant="link" size="sm" @click="downloadPDF(row.item.media[0].url, row.item.ref)" class="mr-1" style="color: inherit;">
                    <b-icon icon="file-earmark-arrow-down-fill" style="transform: scale(1.25);"></b-icon>
                </b-button>
            </template>
        </b-table>
    </b-container>
</template>

<script>
import { userId, getZammad } from '@/graphql/querys.js'
import { GetTicketsFromCorp } from '@/zammad/querys.js'

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
        this.getTickets();
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
        rowClass(item, type) {
            if (item && type === 'row')
                if (item.payer === 'payée') {
                    return 'payee'
                } else if (item.payer === 'impayée') {
                    return 'impayee'
                }
            return null
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
                window.open(fileLink.click());
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
        getTickets() {
            let token;
            this.$apollo.query({query: getZammad}).then((data) => {
                token = data.data.zammad.token;
                console.log(GetTicketsFromCorp(token, this.axios));
            });
        }
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
