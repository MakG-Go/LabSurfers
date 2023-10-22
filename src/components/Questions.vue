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
.question {
    &__wrapper {
        width: 100dvw;
        height: 100dvh;
        position: fixed;
        top: 0;
        left: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 3;
        backdrop-filter: blur(3px);
    }
    &__container {
        background-color: rgba(255, 255, 255, 0.45);
        padding: 2rem;
        border-radius: 50px;
        display: flex;
        flex-direction: column;
        backdrop-filter: blur(5px);
        max-width: 75vw;
    }
    &__title {
        color: black;
        font-size: 22px;
        font-weight: 600;
        margin-bottom: 2rem;
    }
    &__answer {
        padding: 1rem;
        background-color: rgb(116 64 0);
        border-radius: 10px;
        transform: translateY(0);
        color: white;
        font-size: 16px;
        font-weight: 600;
        box-shadow: 0px 0px 0px -0px rgba(34, 60, 80, 0);

        transition-property: box-shadow, transform, background-color;
        transition-duration: 0.25s;
        transition-timing-function: ease;

        &:not(:last-child) {
            margin-bottom: 1rem;
        }

        @media (hover: hover) {
            background-color: rgb(177, 97, 0);
            transform: translateY(-5px);
            box-shadow: 0px 20px 15px -10px rgba(34, 60, 80, 0.5);
        }
    }
    &__time {
        width: 100%;
        height: 2px;
        background-color: rgb(43, 55, 222);
        transition-property: width;
        transition-duration: 0.25s;
        transition-timing-function: ease;
    }
}
</style>