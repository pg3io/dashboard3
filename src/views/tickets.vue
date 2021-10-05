<template>
    <b-container fluid="sm" style="margin-top: 2%;">
        <b-row class="d-flex justify-content-between">
            <b-form-checkbox
            id="checkbox-1"
            v-model="closed_tickets"
            name="checkbox-1"
            size="lg" switch>
            Tickets fermés
            </b-form-checkbox>
            <a class="btn btn-dark" :href="`${this.zammad_url}#ticket/view/my_organization_tickets`">Tous les tickets</a>
        </b-row>
        <b-modal ref="popup" size="lg" centered scrollable>
            <template #modal-header="{ close }" class="ticket-header">
                <h5>{{ modal.title }} <span v-html="modal.badge"></span></h5>
                <a @click="close()">
                    <b-icon-x-square style="transform: scale(1.5); cursor: pointer; margin-right: 20%; margin-top: 20%;"></b-icon-x-square>
                </a>
            </template>
             <div :class="striper(elem.sender)" v-for="(elem, index) in modal.articles" :key="index">
               <div class="card-header">
                <h5>{{ elem.from }} {{ diffFormatter (elem.updated_at) }}</h5>
               </div>
                <div class="card-body"><div v-html="elem.body"></div></div>
             </div>
             <template modal-footer="">
                <b-button size="lg" variant="primary" @click="goToDetails(modal.number - 35000)">
                  Détails
                </b-button>
            </template>
        </b-modal>
        <b-table
            v-if="hasTickets && (new_tickets.length > 0) && (handeld_corps === user.entreprises.length)"
            :items="new_tickets"
            :fields="fields"
            :sort-by.sync="sortBy"
            :sort-desc.sync="sortDesc"
            @row-contextmenu="rightClicked"
            @row-clicked="onRowSelected"
            striped hover
            responsive="sm"
            ref="selectableTable"
            style="cursor: pointer;">
        </b-table>
        <div v-else class="text-center pt-3">
            <b-icon icon="arrow-clockwise" animation="spin" font-scale="4" v-if="!isLoaded"></b-icon>
            <h2 style="margin-top: 2%; text-align: center;" v-if="isLoaded && !hasTickets">Vous n'avez pas de tickets.</h2>
        </div>
    </b-container>
</template>

<script>
import { getZammad, userId, userInfos } from '@/graphql/querys.js'
import { GetTicketsFromCorp, GetArticlesFromTicket } from '@/zammad/querys.js'
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

function striper (value) {
    if (value === "Customer") return "bg-light customer-message card rounded-3";
    else return "bg-light card rounded-3 admin-message";
}

export default {
    name: 'home',
    data() {
        return {
            selectMode: 'single',
            userId: 0,
            n_corps: 0,
            handeld_corps : 0,
            tickets: [],
            ticketsArray : null,
            new_tickets : [],
            user: null,
            save: null,
            sortBy: 'created_at',
            sortDesc: true,
            sortByFormatted: false,
            hasTickets: false,
            isLoaded: false,
            token: "",
            modal: {},
            striper : striper,
            diffFormatter : diffFormatter,
            closed_tickets: false,
            zammad_url: "",
            fields: [
          { key: 'number', label: '#', sortable: true, class: 'number' },
          { key: 'title', label: 'Titre', sortable: true, class: 'title' },
          { key: 'created_at', label: 'Création',  sortable: true, class: 'date', formatter: (value)=>{return moment(value).format("DD/MM à HH:mm")}},
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
            this.handeld_corps = 0;
            this.n_corps = 0;
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
        onRowSelected(item) {
            if (item.state === "closed")
                item.badge = `<span style="color:white" class="badge rounded-pill bg-success ml-3">Fermé</span>`;
            if (item.state === "open")
                item.badge = `<span style="color:white" class="badge rounded-pill bg-warning ml-3">Ouvert</span>`;
            if (item.state === "new") 
                item.badge = `<span style="color:white" class="badge rounded-pill bg-primary ml-3">Nouveau</span>`;
            GetArticlesFromTicket(this.token, this.zammad_url, this.axios, item.id).then((data) => {
                item.articles = data;
                this.modal = item;
                this.$refs['popup'].show();
            }).catch((e) => {console.log(e)});

        },
        goToDetails(ref) {
            var link = document.createElement('a');
            document.body.appendChild(link);
            link.href = `${this.zammad_url}#ticket/zoom/${ref}`;
            window.open(link.href);
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
                    this.user = data.data['users'][0]
                }).catch((err) => {console.log(err)});
            }
        },  
        getTickets() {
            if (!this.user)
                return setTimeout(this.getTickets, 100);
            let token;
            let url;
            let ticketsArray;
            this.$apollo.query({query: getZammad}).then((data) => {
                token = data.data.zammad.token;
                url = data.data.zammad.url;
                this.token = token;
                this.zammad_url = url;
                if (token === null) {
                    var link = document.createElement('a');
                    link.href = '/';
                    document.body.appendChild(link);
                    link.click();
                }
                else {
                    this.n_corps = 0;
                    this.user.entreprises.forEach((corp) => {
                        GetTicketsFromCorp(token, url, this.axios, corp.nom).then((data) => {
                            ticketsArray = data;
                            if (ticketsArray.length > 0) {
                                this.tickets.push(ticketsArray);
                                this.n_corps++;
                                this.handeld_corps++;
                            } else this.handeld_corps++;
                            ticketsArray = null;
                            if (this.handeld_corps === this.user.entreprises.length && this.n_corps > 0) {
                                this.hasTickets = true;
                                this.isLoaded = true;
                            }
                            else if (this.handeld_corps === this.user.entreprises.length) {this.hasTickets = false;}
                        });
                    });
                }
            }).catch((err) => {console.log(err)});
        },
        formatTickets () {
            if (this.isLoaded) {
                if (this.hasTickets) {
                    this.new_tickets = []
                    var ticketsTampon = this.tickets;
                    this.tickets = [];
                    var tmp = 0;
                    ticketsTampon.forEach((elem) => {
                        elem.forEach((element, index) => {
                            if (moment().diff(moment(element.last_contact_at), 'days') > 30 && element.state === 'open')
                                element._rowVariant = 'danger';
                            if (element.state === 'closed')
                                element._rowVariant = 'success';
                            else if (element.priority_id > 2)
                                element._rowVariant = 'warning';
                            else if (element.priority_id < 2)
                                element._rowVariant = 'info';
                            if (moment().diff(moment(element.last_contact_at), 'days') > 30 && element.state === 'closed')
                                tmp = index
                            else if (element.state === 'closed' && !this.closed_tickets)
                                tmp = index
                            else {
                                this.new_tickets.push(element)
                            }
                        });
                    });
                } else return setTimeout(this.formatTickets, 100+tmp);
            } else return setTimeout(this.formatTickets, 100);
        }
    },
}

</script>

<style lang="css" scoped>
.b-table-statut > td {
    border-color: var(--primary) !important;
}
td {
    cursor: pointer !important;
}
.customer-message {
    margin-top: 2rem;
    margin-left: 15%;
}
.admin-message {
    margin-top: 2rem;
    margin-right: 15%;
}
.customer-message h5 {
    text-align: right;
}

</style>
