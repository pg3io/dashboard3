<template>
    <b-container fluid="sm" style="margin-top: 2%;">
        <b-form-checkbox
        id="checkbox-1"
        v-model="closed_tickets"
        name="checkbox-1"
        size="lg" switch>
        Tickets fermés
        </b-form-checkbox>
        <b-modal ref="popup" :title="modal.title">

        </b-modal>
        <b-table
            v-if="hasTickets && (tickets !== undefined)"
            :items="tickets"
            :fields="fields"
            :sort-by.sync="sortBy"
            :sort-desc.sync="sortDesc"
            @row-contextmenu="rightClicked"
            @row-selected="onRowSelected"
            :tbody-tr-class="rowClass"
            striped hover
            responsive="sm"
            ref="selectableTable"
            selectable>
        </b-table>
        <div v-else class="text-center pt-3">
            <b-icon icon="arrow-clockwise" animation="spin" font-scale="4" v-if="!isLoaded"></b-icon>
            <h2 style="margin-top: 2%; text-align: center;" v-if="isLoaded && !hasTickets">Vous n'avez pas de tickets.</h2>
        </div>
    </b-container>
</template>

<script>
import { getZammad, userId, userInfos } from '@/graphql/querys.js'
import { GetTicketsFromCorp } from '@/zammad/querys.js'
import moment from 'moment'
import $ from 'jquery'

function diffFormatter (value) {
    const secDiff = moment().diff(moment(value), 'seconds');
    const minDiff = moment().diff(moment(value), 'minutes'); 
    const hoursDiff = moment().diff(moment(value), 'hours');
    const daysDiff = moment().diff(moment(value), 'days');
    if (secDiff < 60)
        if (secDiff > 1)
            return `Il y a ${secDiff} secondes`;
        else return `Il y a une seconde`;
    else if (secDiff < 3600)
        if (minDiff > 1)
            return `Il y a ${minDiff} minutes`;
        else return `Il y a une minute`;
    else if (secDiff < 24*3600)
        if (hoursDiff > 1)
            return `Il y a ${hoursDiff} heures`;
        else return `Il y a une heure`;
    else
        if (daysDiff > 1)
            return `Il y a ${daysDiff} jours`;
        else return `Il y a un jour`;
}

export default {
    name: 'home',
    data() {
        return {
            selectMode: 'single',
            userId: 0,
            tickets: [],
            ticketsArray : null,
            user: null,
            save: null,
            sortBy: 'created_at',
            sortDesc: true,
            sortByFormatted: false,
            hasTickets: false,
            isLoaded: false,
            modal: {},
            closed_tickets: true,
            fields: [
          { key: 'number', label: '#', sortable: true, class: 'number' },
          { key: 'title', label: 'Titre', sortable: true, class: 'title' },
          { key: 'created_at', label: 'Création',  sortable: true, class: 'date', formatter: (value)=>{return moment(value).format("DD/MM, HH:mm")}},
          { key: 'last_contact_at', label: 'Dernière réponse',  sortable: true, class: 'date_rep', formatter:diffFormatter },
          { key: 'customer', label: 'Rédacteur', sortable: true, class: 'customer' },
          { key: 'organization', label: 'Entreprise', sortable: true, class: 'organization' },
          { key: 'state', label: 'Statut', sortable: false, class: 'statut'}
            ]
        }
    },
    watch : {
        closed_tickets: function () {
            this.hasTickets = false;
            this.isLoaded = false;
            this.tickets = [];
            this.getTickets();
            this.formatTickets();
            this.assureTickets();
        }
    },
    created() {
        this.getUserInfos();
        this.getUserInfos2();
        this.getTickets();
        this.formatTickets();
        $('#checkbox-1').click(()=> {
            this.toggleClosedTickets()
        })
    },
    methods: {
        assureTickets() {
            if (!this.hasTickets) {
                return setTimeout(this.assureTickets, 100);
            }
            else this.$refs.selectableTable.refresh()
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
            this.goToDetails(items[0].number - 35000)
            
            // this.modal = items[0];
            // this.$refs['popup'].show();

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
            document.body.appendChild(link);
            link.href = `https://helpdesk.pg3.io/#ticket/zoom/${ref}`;
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
        getUserInfos2 () {
            if (!this.userId) return setTimeout(this.getUserInfos2, 100);
            else {
                this.$apollo.query({
                    query: userInfos,
                    variables: {'id': this.userId}
                }).then((data) => {
                    this.user = data.data.['users'][0]
                }).catch((err) => {console.log(err)});
            }
        },  
        getTickets() {
            if (!this.user)
                return setTimeout(this.getTickets, 100);
            let token;
            let ticketsArray;
            this.$apollo.query({query: getZammad}).then((data) => {
                token = data.data.zammad.token;
                if (token === null) {
                    var link = document.createElement('a');
                    link.href = '/';
                    document.body.appendChild(link);
                    link.click();
                }
                else {
                    this.user.entreprises.forEach((corp, index) => {
                        GetTicketsFromCorp(token, this.axios, corp.nom).then((data) => {
                            ticketsArray = data;
                            if (ticketsArray.length > 0)
                                this.tickets.push(ticketsArray);
                            else console.log(ticketsArray)
                            ticketsArray = null;
                            if (index === this.user.entreprises.length - 1 && this.tickets.length > 0) this.hasTickets = true;
                            if (index === this.user.entreprises.length - 1) this.isLoaded = true;
                        });
                    });
                }
            }).catch((err) => {console.log(err)});
        },
        formatTickets () {
            if (this.isLoaded) {
                if (this.hasTickets) {
                    const ticketsTampon = this.tickets;
                    this.tickets = [];
                    ticketsTampon.forEach((elem) => {
                        elem.forEach((element) => {
                            this.tickets.push(element);
                        });
                    });
                    this.tickets.forEach((elem, index) => {
                        if (moment().diff(moment(elem.last_contact_at), 'months') > 1 && elem.state === 'closed')
                            this.tickets.splice(index, 1);
                        else if (elem.state === 'closed' && !this.closed_tickets) {
                            this.tickets.splice(index, 1);
                        }
                        else if (moment().diff(moment(elem.last_contact_at), 'months') > 1)
                            elem._rowVariant = 'danger';
                        else if (elem.state === 'closed')
                            elem._rowVariant = 'success';
                        else if (elem.priority_id > 2)
                            elem._rowVariant = 'warning';
                        else if (elem.priority_id < 2)
                            elem._rowVariant = 'info';
                    })
                } else return setTimeout(this.formatTickets, 100);
            } else return setTimeout(this.formatTickets, 100);
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
