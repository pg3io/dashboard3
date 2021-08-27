<template>
    <transition name="fade">
        <b-container fluid="sm" style="margin-top: 2%;">
            <b-row v-if="corps">
                <iframe v-if="corps.length === 1" width="100%" :src="grafanaUrl+corps[0].grafana_id+`?orgId=1&from=now-6h&to=now&refresh=10s`" />
            </b-row>
            <b-tabs v-else-if="((corps) ? ((corps.length > 1) ? true : false) : false)">
                <b-tab :title="corp.nom" v-for="(corp, index) in corps" :key="index">
                    <iframe width="100%" :src="grafanaUrl+corp.grafana_id+`?orgId=1&from=now-6h&to=now&refresh=10s`" />
                </b-tab>
            </b-tabs>
        </b-container>
    </transition>
</template>

<script>

import { getGrafana, userId } from '@/graphql/querys.js';
import gql from 'graphql-tag';

export default {
    data () {
        return {
            corps : null,
            actUserId: 0,
            grafanaUrl: ''
        }
    },
    created () {
        this.getUsrId();
        this.GetGrafanaUrl();
        this.GetPanels();
    },
    methods : {
        GetGrafanaUrl () {
            this.$apollo.query({
                query: gql`query{parametre{grafana_url}}`
            }).then((data) => {
                this.grafanaUrl = data.data.parametre.grafana_url;
            }).catch((err)=>{console.log(err)});  
        },
        GetPanels () {
            if (!this.actUserId || !this.grafanaUrl)
                return setTimeout(this.GetPanels, 100);
            this.$apollo.query({
                query: getGrafana,
                variables: {id : this.actUserId}
            }).then((data) => {
                this.corps = data.data.users[0].entreprises;
            }).catch((err) => {console.log(err)});
        },
        getUsrId() {
        this.$apollo.query({
            query: userId
        }).then((data) => {
            this.actUserId = data['data']['me']['id']
        }).catch((error) => {
            console.log(error)
        })
        },
    }
}
</script>