<template>
    <div>
        <transition name="fade">
        <b-table
            v-if="hasServers && isLoad && backups.length > 0"
            :items="backups"
            :fields="getFields()"
            :sort-compare="mySortCompare"
            :sort-by.sync="sortBy"
            :sort-desc.sync="sortDesc"
            @row-contextmenu="rightClicked"
            striped hover
            responsive="md"
            ref="selectableTable">
        </b-table>
        </transition>
        <h2 style="margin-top: 2%; text-align: center;" v-if="!(hasServers && backups.length > 0) && isLoad">Vous n'avez pas de serveurs à backuper</h2>
    </div>
</template>
<script>
import { userId, getEntreprisesTags } from '@/graphql/querys.js';
import {InfluxDB} from '@influxdata/influxdb-client';
import gql from 'graphql-tag';
import $ from 'jquery';

let self

function findEntreprise(elem) {
    if  (elem.nom === this.nom) return true;
    else return false;
}


function findUrl(elem) {
    if  (elem.host === this.host) return true;
    else return false;
}

function DateToDayMonth(date) {
    if (typeof date === 'string') {
        const newDate = new Date(date)
        return `${newDate.getDate()}/${newDate.getMonth()+1}`
    } else if (date instanceof Date) return `${date.getDate()}/${date.getMonth()+1}`
    else {
        console.log('DateToDayMonth function expects a string or a Date')
        console.log(TypeError)
    }
}

export default {
    data () {
        return {
            selectMode: 'single',
            userId: 0,
            isLoad: false,
            hasServers: false,
            hasSlice: false,
            backups: [],
            watcherUri: [],
            userCorp: [],
            InfluxDB: null,
            QueryAPI: null,
            myQuery: '',
            sortBy: 'last_bkp',
            sortDesc: true, 
            rangeDays: 14

        }
    },
    created () {
        this.getInfluxCredentials();
        this.getUserId();
        this.getuserCorp();
        this.sortUrlsTags();
        this.getwatcherUri();
        this.getmyQuery();
        this.getSitesData();
    },
    mounted() {
        this.$nextTick(function () {
            this.setIcons();
        });
    },
    methods: {
        getFields() {
            var fields = [{key: "host", sortable: true, stickyColumn: (window.screen.width > 500)}]
            var flag = true;
            const now = Date.now()
            for (var i = 0; i < this.rangeDays; i++)
                fields.push({key: DateToDayMonth(new Date(now - (i * 3600 * 24 * 1000))), sortable: false})
            while (flag) {
                if (fields.length >= this.rangeDays) {
                    flag = false;
                    return fields;
                }
            }
        },
        setIcons () {
            if (!this.isLoad)
                return setTimeout(this.setIcons, 100)
            $('td.table-success').html('<span style="color: var(--success); font-size: 1.2rem; margin: 0 0 0 1rem"><i class="far fa-check-circle"></i></span>')
            $('td.table-danger').html('<span style="color: var(--danger); font-size: 1.2rem; margin: 0 0 0 1rem"><i class="far fa-times-circle"></i></span>')
        },
        getmyQuery () {
            if (this.watcherUri.length === 0)
                return setTimeout(this.getmyQuery, 100);
            self = this;
            this.myQuery = `from(bucket: "backups")
    |> range(start: -${this.rangeDays}d)
    |> filter(fn: (r) => r["_measurement"] == "backup")
    |> filter(fn: (r) => r["_field"] == "status")
    |> filter(fn: (r) => r["host"] == "${this.watcherUri[0].urls[0]}"`;
            this.watcherUri.forEach((corp, index) => {
                if (corp.urls.length > 1) {
                    corp.urls.forEach((url, i) => {
                        if (index > 0 || i > 0)
                            self.myQuery += ` or r["host"] == "${url}"`
                        if ((i === (corp.urls.length - 1) || corp.urls.length === 0) && index === (self.watcherUri.length - 1))
                            self.myQuery += `)   |> aggregateWindow(every: 24h, fn: last) |> yield(name: "last")`;
                    })
                } else if (index === self.watcherUri.length - 1)
                    self.myQuery += `)   |> aggregateWindow(every: 24h, fn: last) |> yield(name: "last")`;
            });
        },
        getSitesData () {
            if (this.watcherUri.length > 0 && this.InfluxDB !== null && this.queryAPI !== null) {
                if (!this.myQuery.endsWith('|> yield(name: "last")')) {
                    return setTimeout(this.getSitesData, 1000);
                }
                else {
                    let self = this
                    this.queryAPI.queryRows(this.myQuery, {
                        next(row, tableMeta) {
                            const o = tableMeta.toObject(row)
                            const elemIndex = self.backups.findIndex(findUrl, o);
                            if (elemIndex >= 0) {
                                if (o._value > 75) {
                                    self.backups[elemIndex][DateToDayMonth(o._time)] = "KO";
                                    self.backups[elemIndex]._cellVariants[DateToDayMonth(o._time)] = "danger"
                                }
                                else {
                                    self.backups[elemIndex][DateToDayMonth(o._time)] = "OK"
                                    self.backups[elemIndex]._cellVariants[DateToDayMonth(o._time)] = "success"
                                }
                            }
                            else {
                                if (o._value > 75) {
                                    self.backups.push(JSON.parse(`{"host": "${o.host}", "${DateToDayMonth(o._time)}" : "KO", "_cellVariants": {"${DateToDayMonth(o._time)}": "danger"}}`));
                                }
                                else self.backups.push(JSON.parse(`{"host": "${o.host}", "${DateToDayMonth(o._time)}" : "OK", "_cellVariants": {"${DateToDayMonth(o._time)}": "success"}}`));
                            }
                        },
                        error(error) {
                            console.error(error)
                        },
                        complete() {
                            self.isLoad = true;
                            self.hasServers = true;
                            // console.log(self.backups)
                        }
                    })
                }
            } else return setTimeout(this.getSitesData, 100);
        },
        printwatcherUri () {
            if (this.watcherUri.length === 0||!this.myQuery)
                return setTimeout(this.printwatcherUri, 100);
            console.log("urls", this.watcherUri, this.myQuery)
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
        rowClass (item) {
            return item.replaceAll(' ', '-');
        },
        rightClicked (item, index, evt) {
            evt.preventDefault()
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
        getUserId() {
            this.$apollo.query({
                query: userId
            }).then((data) => {
                this.actUserId = data['data']['me']['id']
            }).catch((error) => {
                console.log(error)
            })
        },
        getuserCorp () {
            if (!this.actUserId) return setTimeout(this.getuserCorp, 100)
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
                    if (corps.length === index) {$elf.userCorp = corps; this.hasSlice = true}
                }
            });
        },
        sortUrlsTags() {
            if (this.InfluxDB === null || this.queryAPI === null)
                return setTimeout(this.sortUrlsTags, 100);
            const query = `from(bucket: "backups") |> range(start: -24h) |> filter(fn: (r) => r["_measurement"] == "backup") |> filter(fn: (r) => r["_field"] == "tags") |> yield(name: "last")`;
            var urlsTags = {};
            self = this;
            this.queryAPI.queryRows(query, {
                next(row, tableMeta) {
                    const o = tableMeta.toObject(row)
                    const tab = o._value.match(/([a-z0-9]+)/gm);
                    if (tab != null) {
                        tab.forEach((tag) => {
                            if (urlsTags[tag] === undefined) {
                                urlsTags[tag] = [];
                                urlsTags[tag].push(o.host)
                            } else {
                                if (!urlsTags[tag].includes(o.host))
                                    urlsTags[tag].push(o.host)
                            }
                        });
                    }
                },
                error(error) {name
                    console.error(error)
                },
                complete() {
                    self.urlsTags = urlsTags;
                }
            })
        },
        getwatcherUri () {
            if (!this.urlsTags) return setTimeout(this.getwatcherUri, 100)
            if (!this.hasSlice) return setTimeout(this.getwatcherUri, 100)
            else if (this.userCorp.length <= 0) {this.isLoad = true; return;}
            self = this;
            const entreprises = this.userCorp
            this.watcherUri = [];
            if (entreprises.length > 0) {
                entreprises.forEach((corp, index) => {
                    self.watcherUri.push({nom: corp.nom, urls: []})
                    corp.tags.forEach((tag) => {
                        if (self.urlsTags[tag.tag] !== undefined) {
                            self.urlsTags[tag.tag].forEach((url) => {
                                if (!self.watcherUri[index].urls.includes(url))
                                    self.watcherUri[index].urls.push(url);
                            })
                        }
                    })
                });
            } else this.isLoad = true;

        },
    }
}
</script>