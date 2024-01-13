
<script>
import { gsap } from "gsap";
export default {
    props: {
        volumeParams: { type: Number, default: 0.5 },
        musicData: { type: String, require: true },
        start: { type: Boolean, default: false },
        pause: { type: Boolean, default: false },
        showQuestion: { type: Boolean, default: false },
    },

    data() {
        return {};
    },

    methods: {
        getPlay() {
            this.$refs.gameMusic.play();
        },

        getVolume() {
            if (this.pause || this.showQuestion) {
                gsap.to(this.$refs.gameMusic, {
                    volume: 0.01,
                });
            } else {
                gsap.to(this.$refs.gameMusic, {
                    volume: 0.5,
                });
            }
        },
    },
    watch: {
        start() {
            this.start ? this.getPlay() : "";
        },
        pause() {
            this.getVolume();
        },
        showQuestion() {
            this.getVolume();
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