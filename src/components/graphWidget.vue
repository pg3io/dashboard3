<template>
    <b-card class="widget text-center" title="Temps de réponse moyen de vos sites web" style="color: var(--text);">
        <line-chart 
            class="chart"
            :library='{
                "colors": chartColors.colors,
                "plotOptions": {
                    "series": {
                        "marker" :{"enabled": false}
                    }
                },
                "xAxis": {
                    "labels" :{
                        "style": {"color": chartColors.font}
                    }
                },
                "yAxis": {
                    "labels" :{
                        "style": {"color": chartColors.font}
                    }
                },
                "tooltip": {
                    "valueDecimals": 2
                },
                "chart": {
                    "backgroundColor": chartColors.bg
                }
            }'
            :legend="false"
            :data="values" height="300px"
            :min="0" :max="maxValue"
            suffix="s"
            :xmin="new Date(Object.keys(values[0].data)[0])" :xmax="new Date(Date.now())"
            v-if="watchedUrls.length > 0 && values.length > 0 && this.isLoaded"
        />
        <div v-else class="text-center pt-3">
            <b-icon icon="arrow-clockwise" class="mt-5" animation="spin" font-scale="9" v-if="!isLoaded"></b-icon>
            <span class="hidden" v-else> {{ hideBecauseEmpty() }}</span>
        </div>
    </b-card>
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


function findEntreprise(elem) {
    if  (elem.nom === this.nom) return true;
    else return false;
}

export default {
    data () {
        return {
            maxValue: 0,
            actUserId: 0,
            userCorps : [],
            watchedUrls: [],
            urlsTags: null,
            values: [],
            dataQuery: '',
            isLoaded: false,
            InfluxDB: null,
            queryAPI: null,
            hasSliced: true,
            chartColors: {}
        }
    },
    props : {
        dark_mode: Boolean
    },
    created () {
        this.getInfluxCredentials();
        this.getUsrId();
        this.getUserCorps();
        this.sortUrlsTags();
        this.getWatchedUrls();
        this.getDataQuery('7d');
        this.getSitesData();
    },
    mounted() {
        this.setChartColors();
    },
    methods : {
        setChartColors() {
            if (this.dark_mode) {
                this.chartColors.bg = '#343a40';
                this.chartColors.colors = ['#9EDE73', '#AF00BE', "#DE208B", "#B5FFD9", "#0CECDD", "#FFF338", "#FF4848", "#F5F7B2", "#7ECA9C", "#EB596E"]
                this.chartColors.font = "#f8f9fa"
            } else this.chartColors.bg = '#fff'
        },
        hideBecauseEmpty () {
            if (this.isLoaded) {
                this.$emit('IsEmpty', true);
            }
        },
        getInfluxCredentials () {
            this.$apollo.query({
                query: gql`query{crawlurl{url token org bucket}}`
            }).then((data) => {
                const influx = data.data.crawlurl;
                const client = new InfluxDB({url: influx.url, token: influx.token})
                this.queryAPI = client.getQueryApi(influx.org)
                this.InfluxDB = influx;
            }).catch((err) => {
                console.log(err)
                var a = document.createElement('a')
                a.href = '/'
                a.click()
            });
        },
        printWatchedUrls () {
            if (this.watchedUrls.length === 0)
                return setTimeout(this.printWatchedUrls, 100);
            console.log("urls", this.watchedUrls)
        },
        getDataQuery (range) {
            var aggr = '1h';
            if (this.watchedUrls.length === 0)
                return setTimeout(this.getDataQuery, 100, range);
            self = this;
            this.dataQuery = `from(bucket: "${self.InfluxDB.bucket}")|> range(start: -${range}) |> filter(fn: (r) => r["_measurement"] == "server_response") |> filter(fn: (r) => r["_field"] == "timereq") |> filter(fn: (r) => r["host"] == "${this.watchedUrls[0].urls[0]}"`;
            this.watchedUrls.forEach((corp, index) => {
                if (corp.urls.length > 1) {
                    corp.urls.forEach((url, i) => {
                        if (index > 0 || i > 0)
                            self.dataQuery += ` or r["host"] == "${url}"`
                        if ((i === (corp.urls.length - 1) || corp.urls.length === 0) && index === (self.watchedUrls.length - 1))
                            self.dataQuery += `)  |> aggregateWindow(every: ${aggr}, fn: mean, createEmpty: false) |> yield(name: "mean")`;
                    })
                } else if (index === self.watchedUrls.length - 1)
                    self.dataQuery += `)  |> aggregateWindow(every: ${aggr}, fn: mean, createEmpty: false) |> yield(name: "mean")`;
            });
        },
        getUserCorps () {
            if (!this.actUserId) return setTimeout(this.getUserCorps, 100)
            this.$apollo.query({
                query: getEntreprisesTags,
                variables: {"id": this.actUserId}
            }).then((data) => {
                let $elf = this;
                var corps = data.data.users[0].entreprises;
                const len = corps.length
                var index = 0;
                for (let i = 0; i < len; i++) {
                    if (corps[index].tags === null || corps[index].tags === undefined) {
                        corps.splice(corps.findIndex(findEntreprise, corps[index]), 1)
                    }
                    else if (!corps[index].tags.length > 0) {
                        corps.splice(corps.findIndex(findEntreprise, corps[index]), 1)
                    }
                    else index++
                    if (corps.length === index) {$elf.userCorps = corps; this.hasSliced = true}
                }
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
                    if (o._value !== null)
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
                error(error) {name
                    console.error(error)
                },
                complete() {
                    self.urlsTags = urlsTags;
                }
            })
        },
        getWatchedUrls () {
            if (!this.urlsTags) return setTimeout(this.getWatchedUrls, 100)
            if (!this.hasSliced) return setTimeout(this.getWatchedUrls, 100)
            else if (this.userCorps.length <= 0) {this.isLoaded = true; return;}
            self = this;
            const entreprises = this.userCorps
            this.watchedUrls = [];
            if (entreprises.length > 0) {
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
            } else this.isLoaded = true;

        },
        getUsrId() {
            this.$apollo.query({
                query: userId
            }).then((data) => {
                this.actUserId = data['data']['me']['id']
            }).catch((error) => {
                console.log(error)
            })
        }
    }
}
</script>