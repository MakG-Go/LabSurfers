
<script>
export default {
    props: {
        totalScore: { type: Number, default: 0 },
    },
    methods: {
        restart() {
            this.$emit("get-restart");
        },
        newArea() {
            this.$emit("new-area");
        },
    },
};
</script>

<template>
    <div>
        <div class="over__wrapper">
            <div class="over__container">
                <h1>GAME OVER</h1>
                <h3>Результат: {{ totalScore }}</h3>

                <button class="over__restart" @click="restart">ЗАНОВО!</button>

                <button class="over__restart" @click="newArea">
                    Выбрать другую локацию
                </button>
            </div>
        </div>
    </div>
</template>

<style lang="scss">
</style>