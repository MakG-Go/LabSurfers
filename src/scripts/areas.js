import { forestEnemie } from "@/scripts/enemies.js"

export let areaTextureCount = {
    count: 0,

    get tCount() {
        return this.count
    },

    set tCount(value) {
        this.count = this.count + value
    },

    set tCountClear(value) {
        this.count = this.count * value
    }
}

export let forest = {
    url: "/images/land-2.png",
    name: "Орбита",
    area: "models/ground_light.glb",
    alpha: "textures/tree_all_alpha.jpg",
    diffuse: "textures/tree_all.png",

    enemies: forestEnemie
}


