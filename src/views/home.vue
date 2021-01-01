<template>
    <div class="p-3">
        <span v-html="home"></span>
    </div>
</template>

<script>
export default {
    name: "home",
    props: {
        home: String || null
    }
}
</script>