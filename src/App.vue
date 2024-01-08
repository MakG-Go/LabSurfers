<script >
import ThreeTemplateVue from "./components/Three-template.vue";
import Choyser from "@/components/Choyser.vue";

export default {
    components: {
        ThreeTemplateVue,
        Choyser,
    },
    data() {
        return {
            choyse: false,
            area: null,
        };
    },
    methods: {
        getChoyse(url) {
            this.choyse = true;
            this.area = url;
        },
        newArea() {
            this.choyse = false;
        },
    },
};
</script>

<template>
    <div>
        <ThreeTemplateVue />
        <!-- <ThreeTemplateVue @new-area="newArea" :get-area="area" v-if="choyse" /> -->
        <!-- <Choyser @get-choyse="getChoyse" v-if="!choyse"></Choyser> -->
    </div>
</template>

<style >
</style>
