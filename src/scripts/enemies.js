export let enemyCount = {
    count: 0,

    get eCount() {
        return this.count
    },

    set eCount(value) {
        this.count = this.count + value
    },

    set eCountClear(value) {
        this.count = this.count * value
    }
}

export let forestEnemie = [
    {
        model: "models/enemie_1.glb",
        alpha: "textures/zabor_alpha.png",
    },
    // {
    //     model: "models/enemie_2.glb",
    // },
]

