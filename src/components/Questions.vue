<script>
import { QUESTIONS } from "@/scripts/questions.js";

export default {
    props: {
        startQuestion: { type: Boolean, default: false },
    },
    data() {
        return {
            time: 10,
            timerId: null,
            curTimerCount: null,
        };
    },
    mounted() {
        this.timer(this.time);
    },
    methods: {
        checkAnswer(incorrect) {
            this.$emit("get-correct", incorrect);
        },
        timeOver() {
            this.$emit("time-over");
        },
        timer(sec) {
            const currentTime = Date.now();

            const endTime = currentTime + sec * 1000;

            this.curTimerCount = sec;

            this.timerId = setInterval(() => {
                const secondsLeft = Math.round((endTime - Date.now()) / 1000);

                if (secondsLeft < 1) {
                    clearInterval(this.timerId);
                    this.timeOver();
                }

                this.curTimerCount = secondsLeft;

                if (this.$refs.time) {
                    this.$refs.time.style.width =
                        (secondsLeft * 100) / this.time + "%";
                }
            }, 1000);
        },
        getRandom(min, max) {
            min = Math.ceil(min);
            max = Math.floor(max);
            return Math.floor(Math.random() * (max - min + 1)) + min;
        },
    },
    computed: {
        curentQuestion() {
            return QUESTIONS[this.getRandom(0, QUESTIONS.length - 1)];
        },
    },
};
</script>

<template>
    <div>
        <div class="question__wrapper">
            <div class="question__container">
                <h1>{{ curTimerCount }}</h1>
                <p class="question__time" ref="time"></p>

                <p class="question__title">{{ curentQuestion.title }}</p>

                <button
                    class="question__answer"
                    v-for="(answer, key) in curentQuestion.answers"
                    :key="answer.text + key * Math.random()"
                    @click="checkAnswer(answer.incorrect)"
                >
                    {{ answer.text }}
                </button>
            </div>
        </div>
    </div>
</template>

<style lang="scss">
</style>