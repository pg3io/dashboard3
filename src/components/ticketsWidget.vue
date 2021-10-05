<template>
    <b-card class="text-center widget" title="Tickets résolus">
        <h5 class="text-center text-muted">30 derniers jours</h5>
        <div  v-if="hasTickets">
            <h1 class="mt-5" style="font-size: 150px;">{{allTickets - openTickets}}<span class="text-muted" style="font-size: 100px">/{{allTickets}}</span></h1>
            <h6>Tickets ouverts : {{ openTickets }}</h6>
        </div>
        <b-icon icon="arrow-clockwise" class="mt-5" animation="spin" font-scale="9" v-else></b-icon>
    </b-card>
</template>

<script>
//        <!--<pie-chart v-if="counter" :data="values" :colors="['#17a2b8', '#20c997']"></pie-chart> -->

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
            values: [],
            noTicket: false,
            n_corps: 0,
            handeld_corps : 0
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
            if (this.tickets.length > 0) { console.log(this.tickets)
            } else return setTimeout(this.printTickets, 100)
        },
        countTickets () {
            if ((this.tickets.length > 0 || this.noTicket) && this.user !== null) {
                if (this.tickets.length === this.n_corps && this.hasTickets) {
                    var n_tickets = 0;
                    var n_open = 0;
                    let self =this
                    this.tickets.forEach((corp, ind) => {
                        corp.forEach((ticket, index) => {
                            if (ticket.state != 'closed') {
                                n_open++;
                                n_tickets++;
                            }
                            else if (moment().diff(moment(ticket.close_at), 'days') < 30)
                                n_tickets++;
                            if (index >= corp.length - 1 && ind >= self.tickets.length - 1) {
                                self.openTickets = n_open;
                                self.allTickets = n_tickets
                                self.values = [["Ouverts", (n_open / n_tickets) * 100], ["Fermés", ((n_tickets - n_open) / n_tickets) * 100]]
                                self.hasTickets = true;
                                if (n_tickets <= 0) this.$emit('IsEmptyT', true);
                                else self.isLoaded = true;
                            }
                        });
                    });
                } else return setTimeout(this.countTickets, 100)
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
                    let $self = this;
                    this.user.entreprises.forEach((corp) => {
                        GetTicketsFromCorp(token, url, $self.axios, corp.nom).then((data) => {
                            ticketsArray = data;
                            if (ticketsArray.length > 0) {
                                $self.tickets.push(ticketsArray);
                                $self.n_corps++
                                $self.handeld_corps++
                            } else $self.handeld_corps++
                            ticketsArray = null;
                            if ($self.handeld_corps === $self.user.entreprises.length && $self.n_corps > 0) {
                                $self.hasTickets = true;
                                }
                            else if ($self.handeld_corps === $self.user.entreprises.length) {$self.hasTickets = false;}
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
    height: 400px;
}
</style>