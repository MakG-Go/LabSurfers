
<script>
export default {
    props: {
        volumeParams: { type: Number, default: 0.5 },
        musicData: { type: String, require: true },
        start: { type: Boolean, default: false },
    },

    data() {
        return {};
    },

    methods: {
        getPlay() {
            this.$refs.gameMusic.play();
        },
    },
    watch: {
        start() {
            this.start ? this.getPlay() : "";
        },
    },
};
</script>

<template>
    <div>
        <audio
            loop
            ref="gameMusic"
            :src="musicData"
            :data-volume="volumeParams"
        ></audio>
    </div>
</template>

<style>
</style>