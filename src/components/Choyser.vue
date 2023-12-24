
<script>
const path_1 = new URL("/images", import.meta.url).href + "/";

export default {
    data() {
        return {
            areas: [
                {
                    url: "/images/land-1.png",
                    name: "Офис",
                    area: "models/ground_2.glb",
                },
                {
                    url: "/images/land-2.png",
                    name: "Орбита",
                    area: "models/ground_light.glb",
                    alpha: "textures/tree_all_alpha.jpg",
                    enemies: ["models/enemie_1.glb", "models/enemie_2.glb"],
                },
            ],
            title: "Выбери локацию",
            choyseArea: null,
            choyceCharacter: null,
            choyseUrl: null,
        };
    },
    methods: {
        selectArea(ndx, area) {
            this.choyseUrl = area;
            this.choyseArea = ndx;
        },
        getStart() {
            this.$emit("get-choyse", this.choyseUrl);
        },
    },
    mounted() {},
    computed: {
        getActiveClass() {
            return (ndx) => {
                return {
                    check: this.choyseArea === ndx,
                };
            };
        },
        showBtn() {
            return this.choyseUrl !== null;
        },
    },
};
</script>

<template>
    <div class="choyser__wrapper">
        <div class="choyser__container">
            <h1>{{ title }}</h1>
            <ul class="choyser__areas">
                <li
                    v-for="(area, key) in areas"
                    :key="area.name + key"
                    :class="getActiveClass(area.name)"
                    @click="selectArea(area.name, area)"
                    class="choyser__card"
                >
                    <img class="choyser__img" :src="area.url" alt="" />
                </li>
            </ul>
            <button v-if="choyseUrl" class="choyser__btn" @click="getStart">
                ПОНЕСЛАСЬ
            </button>
        </div>
    </div>
</template>

<style>
</style>