<template>
    <b-card title="Tickets en cours ce mois-ci" class="text-center widget">
        <h1 class="text-bold mt-5" style="font-size: 150px;" v-if="counter && !counter.split()[0].startsWith('0')">{{ counter }}</h1>
        <h2 class="mt-5" v-else-if="counter.split()[0].startsWith('0')">Tous les tickets ont été répondus !</h2>
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
            counter: ''

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
                        self.counter = `${n_open}/${n_tickets}`
                    }
                });
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
                            if (index === this.user.entreprises.length - 1) this.isLoaded = true;
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
    height: 342px
}
</style>