<template>
    <div v-if="warningZone"> Vous etes encore la ? </div>
</template>

<script>
    export default {
        name: "Autologout",
        data : function() {
            return {
                events:['click'],

                warningTimer: null,
                logoutTimer: null,
                warningZone: false,
            }
        },

        // foreach ne fonctionne pas ( trouver autre chose pour le remplacer ?? )
        /*mounted() {
            this.events.foreach(function (event){
                window.addEventListener(event, this.resetTimer);
            }, this );

            this.setTimers();
        },

        destroyed() {
            this.events.foreach(function (event) {
            window.removeEventListener(event, this.resetTimer);
            }, this);

            this.resetTimer();
        },*/

        methods: {
            setTimers: function() {
                this.warningTimer = setTimeout(this.warningMessage, 4 * 1000);
                this.logoutTimer = setTimeout(this.logOut, 10 * 1000); //15 minutes 15 * 60 * 1000

                this.warningZone = false;
            },

            warningMessage: function() {
                this.warningZone = true;
            },
 
            resetTimer: function() {
                clearTimeout(this.warningTimer);
                clearTimeout(this.logoutTimer);

                this.setTimers();
            }
        }
    }
</script>

<style scoped>

</style>