<template>
    <div class="p-3">
        <b-row class="p-3">
                <b-col v-if="tickets">
                    <router-link to="/tickets" class="widgetLink" style="color: rgb(0, 0, 0)" >
                        <ticketsWidget />
                    </router-link>
                </b-col>
            <b-col v-if="graph" >
                <router-link to="/graph" class="widgetLink" style="color: rgb(0, 0, 0)" >
                    <graphWidget />
                </router-link>
            </b-col>
        </b-row>
        <span v-html="home"></span>
    </div>
</template>

<script>
import ticketsWidget from "../components/ticketsWidget.vue"
import graphWidget from "../components/graphWidget.vue"

export default {
    name: "home",
    props: {
        home: String || null,
        graph: Boolean,
        tickets: Boolean,
    },
    components: {
        ticketsWidget: ticketsWidget,
        graphWidget: graphWidget
    }
}
</script>

<style scoped>
.widgetLink {
    text-decoration: none !important;
}
</style>