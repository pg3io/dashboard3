<template>
    <transition name="fade">
        <b-container fluid="sm" style="margin-top: 2%;">
            <b-row v-if="corps">
                <div :id="`myFrame`" width="100%" height="100%" />
            </b-row>
            <!--<b-tabs v-else-if="((corps) ? ((corps.length > 1) ? true : false) : false)">
                <b-tab :title="corp.nom" v-for="(corp, index) in corps" :key="index">
                    <iframe :id="`myFrame${index}`" width="100%" height="100%" :src="grafanaUrl+corp.grafana_id+`?orgId=1&from=now-6h&to=now`" />
                </b-tab>
            </b-tabs>-->
        </b-container>
    </transition>
</template>

<script>

import { userId, getEntreprisesTags } from '@/graphql/querys.js';
import {InfluxDB} from '@influxdata/influxdb-client';
const token = 'IyxHCtOAH68QF8qTVAY2Jge-u3CdcINp5nsIK0Eme0cb4GeYqtADvrS3SYQaOgkccMdACvQpHxvbPowMhzr53g=='
const org = 'PG3'
const bucket = 'crawl-url'

const client = new InfluxDB({url: 'http://localhost:8086', token: token})
const queryApi = client.getQueryApi(org)
let self;

export default {
    data () {
        return {
            corps : null,
            actUserId: 0,
            watchedUrls: null,
            urlsTags: null
        }
    },
    created () {
        this.getUsrId();
        this.sortUrlsTags();
        this.getWatchedUrls();
        this.printWatchedUrls();
    },
    methods : {
        printWatchedUrls () {
            if (!this.watchedUrls)
                return setTimeout(this.printWatchedUrls, 100);
            console.log("Watchedurls", this.watchedUrls);
        },
        sortUrlsTags() {
            const query = `from(bucket: "${bucket}") |> range(start: -2m) |> filter(fn: (r) => r["_measurement"] == "tags") |> filter(fn: (r) => r["_field"] == "tags") |> yield(name: "last")`;
            var urlsTags = {};
            self = this;
            queryApi.queryRows(query, {
                next(row, tableMeta) {
                    const o = tableMeta.toObject(row)
                    o._value = o._value.match(/[a-zA-Z0-9]+/gm);
                    o._value.forEach((tag) => {
                        if (urlsTags[tag] === undefined) {
                            urlsTags[tag] = [];
                            urlsTags[tag].push(o.host)
                        } else {
                            if (!urlsTags[tag].includes(o.host))
                                urlsTags[tag].push(o.host)
                        }
                    });

                },
                error(error) {
                    console.error(error)
                },
                complete() {
                    self.urlsTags = urlsTags;
                    console.log('this.urlsTags', urlsTags)
                }
            })
        },
        getWatchedUrls () {
            if (!this.actUserId) return setTimeout(this.getWatchedUrls, 100);
            if (!this.urlsTags) return setTimeout(this.getWatchedUrls, 100)
            self = this;
            this.$apollo.query({
                query: getEntreprisesTags,
                variables: {"id": this.actUserId}
            }).then((data) => {
                const entreprises = data.data.users[0].entreprises;
                this.watchedUrls = [];
                entreprises.forEach((corp, index) => {
                    self.watchedUrls.push({nom: corp.nom, urls: []})
                    corp.tags.forEach((tag) => {
                        if (self.urlsTags[tag.tag] !== undefined) {
                            self.urlsTags[tag.tag].forEach((url) => {
                                if (!self.watchedUrls[index].urls.includes(url))
                                    self.watchedUrls[index].urls.push(url);
                            })
                        }
                    })
                });
            }).catch((err) => {console.log(err);});
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