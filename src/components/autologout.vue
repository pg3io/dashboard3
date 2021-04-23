<template>
    <div> Hello </div>
</template>

<script>

    export default {
        name: "Autologout",
        data : function() {
            return {
                events:['click'],

                warningTimer: null,
                logoutTimer: null,
            }
        },

        mounted() {
            this.events.foreach(function (event){
                window.addEventListener(event, this.resetTimer);
            }, this );

            this.setTimers();
        },

        methods: {
            setTimers: function() {
                //this.warningTimer = setTimeout(this.logOut, 4 * 1000);
                this.warningTimer = setTimeout(this.warningMessage, 4 * 1000);
                this.logoutTimer = setTimeout(this.logOut, 10 * 1000); //15 minutes 15 * 60 * 1000
            },

            warningMessage: function() {
                alert('warning');
            },
 
            resetTimer: function() {
                clearTimeout(this.warningTimer);

                this.setTimers();
            }
        }
    }
</script>

<style scoped>

</style>