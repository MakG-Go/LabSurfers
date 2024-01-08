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
                <button class="splash__btn" @click="getStart">Ok</button>
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
                        title: "Пробел",
                        descripton: "Уклонение",
                    },
                    mobile: {
                        title: "Свайп в лево",
                        descripton: "В лево",
                    },
                },
                right: {
                    desctop: {
                        title: "Старт игры",
                        descripton: "Нажми пробел",
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
            this.$emit("show-start", true);
        },
    },
    // mounted() {
    //     this.mobile = GetDetectMobile();
    //     consile.log(this.mobile);
    // },
    created() {
        this.mobile = GetDetectMobile();
        console.log(this.mobile.mobile);
    },
    computed: {
        getTextLeft() {
            if (this.mobile.mobile != null || this.mobile.tablet != null) {
                return this.text.left.mobile;
            } else {
                return this.text.left.desctop;
            }
        },
        getTextRight() {
            if (this.mobile.mobile != null || this.mobile.tablet != null) {
                return this.text.right.mobile;
            } else {
                return this.text.right.desctop;
            }
        },
    },
};
</script>

<style lang="scss">
</style>