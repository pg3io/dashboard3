<template>
    <div class="p-3">
        <b-row class="p-3">
                <b-col v-if="tickets && ticketsNotEmpty" sm="12" :md="getWidth('tickets')">
                    <router-link to="/tickets" class="widgetLink" style="color: rgb(0, 0, 0)" >
                        <ticketsWidget @IsEmptyT="hideTickets"/>
                    </router-link>
                </b-col>
            <b-col v-if="graph && graphNotEmpty" sm="12" :md="getWidth('graph')">
                <router-link to="/graph" class="widgetLink" style="color: rgb(0, 0, 0)" >
                    <graphWidget  @IsEmpty="hideGraph"/>
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
    },
    data () {
        return {
            graphNotEmpty : true,
            ticketsNotEmpty : true
            
        }
    },
    methods :  {
        hideGraph () {
            this.graphNotEmpty = false;
        },
        hideTickets () {
            this.ticketsNotEmpty = false;
        },
        getWidth (component) {
            if (component === 'graph') {
                if (this.tickets && this.ticketsNotEmpty) return '6';
                else return '12';
            }
            if (component === 'tickets') {
                if (this.graph && this.graphNotEmpty) return '6';
                else return '12';
            }
        }
    }
}
</script>

<style scoped>
.widgetLink {
    text-decoration: none !important;
}
</style>