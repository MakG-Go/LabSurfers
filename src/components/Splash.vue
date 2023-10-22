<template>
    <div>
        <div class="splash__wrapper">
            <div class="splash__container">
                <h1>{{ title }}</h1>
                <div class="splash__keys">
                    <div>
                        <h1>{{ getTextLeft.title }}</h1>
                        <p>{{ getTextLeft.descripton }}</p>
                    </div>
                    <div>
                        <h1>{{ getTextRight.title }}</h1>
                        <p>{{ getTextRight.descripton }}</p>
                    </div>
                </div>
                <button class="splash__btn" @click="getStart">ПОНЕСЛАСЬ</button>
            </div>
        </div>
    </div>
</template>

<script>
import { GetDetectMobile } from "@/scripts/mobileDetect.js";
export default {
    data() {
        return {
            mobile: null,
            title: "Управление",
            text: {
                left: {
                    desctop: {
                        title: "A",
                        descripton: "В лево",
                    },
                    mobile: {
                        title: "Свайп в лево",
                        descripton: "В лево",
                    },
                },
                right: {
                    desctop: {
                        title: "D",
                        descripton: "В право",
                    },
                    mobile: {
                        title: "Свайп в право",
                        descripton: "В право",
                    },
                },
            },
        };
    },
    methods: {
        getStart() {
            this.$emit("get-start", true);
        },
    },
    mounted() {
        this.mobile = GetDetectMobile();
    },
    computed: {
        getTextLeft() {
            if (this.mobile !== null) {
                return this.text.left.mobile;
            } else {
                return this.text.left.desctop;
            }
        },
        getTextRight() {
            if (this.mobile !== null) {
                return this.text.right.mobile;
            } else {
                return this.text.right.desctop;
            }
        },
    },
};
</script>

<style lang="scss">
.splash {
    &__wrapper {
        width: 100dvw;
        height: 100dvh;
        position: fixed;
        top: 0;
        left: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 4;
        background-color: rgba(0, 0, 0, 0.846);
        backdrop-filter: blur(3px);
    }
    &__container {
        width: 75vw;
        background-color: rgba(255, 255, 255, 0.45);
        padding: 2rem;
        border-radius: 50px;
        display: flex;
        flex-direction: column;
        backdrop-filter: blur(5px);
    }
    &__title {
        color: black;
        font-size: 22px;
        font-weight: 600;
        margin-bottom: 2rem;
    }
    &__btn {
        padding: 1rem;
        background-color: rgb(91, 188, 143);
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

        &:hover {
            background-color: rgb(43, 55, 222);
            transform: translateY(-5px);
            box-shadow: 0px 20px 15px -10px rgba(34, 60, 80, 0.5);
        }
    }
    &__keys {
        display: flex;
        justify-content: space-around;
        font-size: 2rem;
    }
}
</style>