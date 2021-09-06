<template>
    <transition name="fade">
        <b-container fluid="sm" style="margin-top: 2%;">
            <b-row v-if="watchedUrls.length > 0 && values.length > 0 && this.isLoaded">
                <line-chart :library='{"plotOptions": {"series": {"marker" :{"enabled": false}}}, "title": {"text": "Temps de réponse"}}' legend="bottom" :data="values" width="100%" height="500px" :min="0" :max="maxValue" suffix="s" :xmin="new Date(Object.keys(values[0].data)[0])" :xmax="new Date(Date.now())"/>
            </b-row>
        </b-container>
    </transition>
</template>

<script>

import { userId, getEntreprisesTags } from '@/graphql/querys.js';
import {InfluxDB} from '@influxdata/influxdb-client';
import gql from 'graphql-tag';

let self;

function findUrl(elem) {
    if  (elem.name === this.host) return true;
    else return false;
}

export default {
    data () {
        return {
            maxValue: 0,
            actUserId: 0,
            watchedUrls: [],
            urlsTags: null,
            values: [],
            dataQuery: '',
            isLoaded: false,
            InfluxDB: null,
            queryAPI: null
        }
    },
    created () {
        this.getInfluxCredentials();
        this.getUsrId();
        this.sortUrlsTags();
        this.getWatchedUrls();
        this.getDataQuery();
        this.getSitesData();
    },
    methods : {
        getInfluxCredentials () {
            this.$apollo.query({
                query: gql`query{crawlurl{url token org bucket}}`
            }).then((data) => {
                const influx = data.data.crawlurl;
                const client = new InfluxDB({url: influx.url, token: influx.token})
                this.queryAPI = client.getQueryApi(influx.org)
                this.InfluxDB = influx;
            }).catch((err) => {console.log(err)});
        },
        printWatchedUrls () {
            if (this.watchedUrls.length === 0)
                return setTimeout(this.printWatchedUrls, 100);
            console.log("urls", this.watchedUrls)
        },
        getDataQuery () {
            if (this.watchedUrls.length === 0)
                return setTimeout(this.getDataQuery, 100);
            self = this;
            this.dataQuery = `from(bucket: "${self.InfluxDB.bucket}")|> range(start: -12h) |> filter(fn: (r) => r["_measurement"] == "server_response") |> filter(fn: (r) => r["_field"] == "timereq") |> filter(fn: (r) => r["host"] == "${this.watchedUrls[0].urls[0]}"`;
            this.watchedUrls.forEach((corp, index) => {
                corp.urls.forEach((url, i) => {
                    if (index > 0 || i > 0)
                        self.dataQuery += ` or r["host"] == "${url}"`
                    if (i === (corp.urls.length - 1) && index === (self.watchedUrls.length - 1))
                        self.dataQuery += ')  |> aggregateWindow(every: 15m, fn: mean, createEmpty: false) |> yield(name: "mean")';
                })
            });
        },
        getSitesData () {
            if (this.watchedUrls.length > 0 && this.InfluxDB !== null && this.queryAPI !== null) {
                if (!this.dataQuery.endsWith('|> yield(name: "mean")')) {
                    return setTimeout(this.getSitesData, 1000);
                }
                else {
                    let self = this
                    this.queryAPI.queryRows(this.dataQuery, {
                        next(row, tableMeta) {
                            const o = tableMeta.toObject(row)
                            const elemIndex = self.values.findIndex(findUrl, o);
                            if (o._value > self.maxValue)
                                self.maxValue = o._value;
                            if (elemIndex >= 0) {
                                self.values[elemIndex].data[o._time] = o._value;
                            }
                            else {
                                self.values.push(JSON.parse(`{"name": "${o.host}", "data" : {"${o._time}": ${o._value}}}`));
                            }
                        },
                        error(error) {
                            console.error(error)
                        },
                        complete() {
                            self.isLoaded = true;
                        }
                    })
                }
            } else return setTimeout(this.getSitesData, 100);
        },
        sortUrlsTags() {
            if (this.InfluxDB === null || this.queryAPI === null)
                return setTimeout(this.sortUrlsTags, 100);
            const query = `from(bucket: "${this.InfluxDB.bucket}") |> range(start: -2m) |> filter(fn: (r) => r["_measurement"] == "tags") |> filter(fn: (r) => r["_field"] == "tags") |> yield(name: "last")`;
            var urlsTags = {};
            self = this;
            this.queryAPI.queryRows(query, {
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