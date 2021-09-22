<template>
    <b-card class="text-center widget" title="Tickets en cours ce mois-ci">
        <h1 class="mt-5" style="font-size: 150px;" v-if="hasTickets">{{openTickets}}<span class="text-muted" style="font-size: 100px">/{{allTickets}}</span></h1>
        <!--<pie-chart v-if="counter" :data="values" :colors="['#17a2b8', '#20c997']"></pie-chart> -->
        <b-icon icon="arrow-clockwise" class="mt-5" animation="spin" font-scale="9" v-else></b-icon>
    </b-card>
</template>

<script>
import {getZammad, userInfos, userId} from '@/graphql/querys.js'
import { GetTicketsFromCorp } from '@/zammad/querys.js'
import moment from 'moment'
export default {
    name: "TicketsWidget",
    data () {
        return {
            userId: 0,
            user: null,
            tickets: [],
            token: '',
            zammad_url: '',
            isLoaded : false,
            hasTickets: false,
            openTickets: 0,
            allTickets: 0,
            values: []

        }

    },
    created () {
        this.getUserInfos()
        this.getUserInfos2()
        this.getTickets()
        this.countTickets()
        
    },
    methods : {
        printTickets () {
            if (this.tickets.length > 0) {
                console.log('this.tickets', this.tickets)
            } else return setTimeout(this.printTickets, 100)
        },
        countTickets () {
            if (this.tickets.length > 0) {
                var n_tickets = 0;
                var n_open = 0;
                let self = this
                this.tickets[0].forEach((ticket, index) => {
                    if (ticket.state != 'closed') {
                        n_open++;
                        n_tickets++;
                    }
                    else if (moment().diff(moment(ticket.close_at), 'days') < 30)
                        n_tickets++;
                    if (index >= self.tickets.length - 1) {
                        self.openTickets = n_open;
                        self.allTickets = n_tickets
                        self.values = [["Ouverts", (n_open / n_tickets) * 100], ["Fermés", ((n_tickets - n_open) / n_tickets) * 100]]
                        self.hasTickets = true;
                        if (n_tickets <= 0) this.$emit('IsEmptyT', true);
                        else this.isLoaded = true;
                    }
                });
                if (this.tickets[0].length <= 0) this.$emit('IsEmptyT', true);
            } else return setTimeout(this.countTickets, 100)
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
                    this.user.entreprises.forEach((corp, index) => {
                        GetTicketsFromCorp(token, url, this.axios, corp.nom).then((data) => {
                            ticketsArray = data;
                            if (ticketsArray.length > 0)
                                this.tickets.push(ticketsArray);
                            ticketsArray = null;
                            if (index === this.user.entreprises.length - 1 && this.tickets.length > 0) this.hasTickets = true;
                            else if (index === this.user.entreprises.length - 1 ) this.$emit('IsEmptyT', true);
                        });
                    });
                }
            }).catch((err) => {console.log(err)});
        },
    }
}
</script>

<style>
.widget {
    height: 400px
}
</style>