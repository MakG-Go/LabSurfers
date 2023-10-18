
<script>
import * as dat from "lil-gui";
import * as THREE from "three";
import _ from "lodash";
import { gsap } from "gsap";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { BasicCharacterController } from "@/scripts/models-scripts.js";
import { Ground } from "@/scripts/ground.js";
import { WorldManager } from "@/scripts/world.js";

import QuestionsVue from "@/components/Questions.vue";
import GameOverVue from "@/components//GameOver.vue";
import Splash from "@/components//Splash.vue";

export default {
    components: {
        QuestionsVue,
        GameOverVue,
        Splash,
    },
    data() {
        return {
            letsStart: false,
            color: {
                fogColor: "#0x000000",
            },
            model: {
                character: {
                    url: "models/animate.glb",
                    position: { x: 0, y: 0, z: 0 },
                },
                ground: {
                    url: "models/ground.glb",
                },
                doors: ["models/door-3.glb", "models/door-2.glb"],
            },
            mixers: [],
            meshes: [],
            gameover: false,
            pause: false,
            checkSpeed: false,

            startSpeed: null,
            gameSpeed: 0.1,
            maxSpeed: 0.18,

            score: 0,
            showQuestion: false,
            // controls: null,
        };
    },

    mounted() {
        this.changeSpeed = _.throttle(this.setSpeed, 1);
        this.startSpeed = this.gameSpeed;
        this.sizes = this.getSizes();
        this.init();
        this.resize();
        // this.tick();
        this.timer();
    },

    watch: {
        letsStart() {
            this.tick();
        },
    },

    methods: {
        getStart() {
            this.letsStart = true;
        },

        init() {
            this.createScene();

            // this.createOrbitControl();

            this.getLight();

            this.ground = this.getGround(this.model.ground);
            this.player = this.getModel(this.model.character);
            this.world = this.getWorld(this.player, this.ground);

            // this.getGui();

            /** Clock */

            this.clock = new THREE.Clock();
        },

        createScene() {
            this.canvas = this.$refs.webGl;
            this.scene = new THREE.Scene();
            this.scene.background = new THREE.Color(0x000000);
            this.scene.fog = new THREE.FogExp2(0x000000, 0.04);

            this.camera = new THREE.PerspectiveCamera(
                45,
                this.sizes.width / this.sizes.height,
                0.01,
                100
            );

            this.camera.position.x = 0;
            this.camera.position.y = 2.1;
            this.camera.position.z = -3.5;
            this.camera.lookAt(0, 0, 4);

            /**
             * Renderer
             */
            this.renderer = new THREE.WebGLRenderer({
                antialias: true,
                alpha: true,
            });
            this.renderer.setClearColor(0xfffafa, 1);

            this.renderer.setSize(this.sizes.width, this.sizes.height);
            this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
            this.renderer.shadowMap.enabled = true;
            this.renderer.outputColorSpace = THREE.SRGBColorSpace;

            this.canvas.appendChild(this.renderer.domElement);

            this.scene.add(this.camera);

            this.axisHelper = new THREE.AxesHelper();
            // this.scene.add(this.axisHelper);
        },

        createOrbitControl() {
            /** Controls */
            this.controls = new OrbitControls(this.camera, this.canvas);
            this.controls.enableDamping = true;
            this.controls.minDistance = 3;
            this.controls.maxDistance = 20;
        },

        getGui() {
            this.gui = new dat.GUI({
                width: 500,
            });
            this.gui
                .add(this.pointLight.position, "x")
                .min(-1)
                .max(5)
                .step(0.001)
                .name("P_Light X");
            this.gui
                .add(this.pointLight.position, "y")
                .min(-1)
                .max(5)
                .step(0.001)
                .name("P_Light Y");
            this.gui
                .add(this.pointLight.position, "z")
                .min(-1)
                .max(20)
                .step(0.001)
                .name("P_Light Z");
            this.gui
                .add(this.pointLight, "intensity")
                .min(-1)
                .max(100)
                .step(0.001)
                .name("P_Light intensity");
            this.gui
                .add(this.ambientLight, "intensity")
                .min(0)
                .max(50)
                .step(0.001)
                .name("A_Light intensity");
            this.gui
                .add(this.scene.fog, "density")
                .min(0)
                .max(100)
                .step(0.01)
                .name("fog min");

            this.gui.addColor(this.color, "fogColor").name("Fog color");
        },

        getLight() {
            /** Light */

            this.ambientLight = new THREE.AmbientLight(0x404040, 10);
            this.scene.add(this.ambientLight);

            this.pointLight = new THREE.PointLight(0x404040, 100, 100);
            this.pointLight.position.x = 0;
            this.pointLight.position.y = 2.5;
            this.pointLight.position.z = 15;
            this.sphereSize = 1;
            this.pointLight.castShadow = true;
            // this.pointLightHelper = new THREE.PointLightHelper(
            //   this.pointLight,
            //   this.sphereSize
            // );

            this.scene.add(this.pointLight);
            // this.scene.add(this.pointLightHelper);
        },

        getLoadStatus() {
            return new THREE.LoadingManager(
                () => {
                    gsap.to(this.$refs.preloader, {
                        opacity: 0,
                        onComplete: () => {
                            this.$refs.preloader.classList.remove("active");
                        },
                    });
                },
                (itemUrl, itemsLoaded, itemsTotal) => {
                    let loadProc = itemsLoaded / itemsTotal;
                    this.loadPercetn = Math.floor(loadProc * 100);
                }
            );
        },

        getModel({ url, position }) {
            const newModel = new BasicCharacterController({
                model: url,
                scene: this.scene,
                meshStore: this.meshes,
                mixers: this.mixers,
                pos: new THREE.Vector3(position.x, position.y, position.z),
                preloader: this.getLoadStatus(),
            });

            this.meshes.push(newModel);
            return newModel;
        },

        getGround({ url }) {
            const ground = new Ground({
                model: url,
                scene: this.scene,
                meshStore: this.meshes,
                speed: this.gameSpeed,
            });
            this.meshes.push(ground);
            return ground;
        },

        getWorld(player, ground) {
            const newWorld = new WorldManager({
                scene: this.scene,
                enemies: this.model.doors,
                player: player,
                ground: ground,
                speed: this.gameSpeed,
            });
            return newWorld;
        },

        restart() {
            window.removeEventListener("resize", this.resize);

            this.scene.traverse((child) => {
                if (child.isMesh) {
                    child.geometry.dispose();
                    child.geometry = null;
                    if (child.material.map) {
                        child.material.map.dispose();
                        child.material.map = null;
                    }
                    child.material.dispose();
                    child.material = null;

                    child.userData.parentName = NaN;
                    child.userData.key = NaN;
                    child.userData.originalColor = NaN;
                    if (child instanceof THREE.Texture) {
                        child.dispose();
                        child = null;
                    }
                }
            });

            this.meshes = [];

            this.renderer.forceContextLoss();
            this.renderer.renderLists.dispose();
            this.renderer.dispose();
            this.canvas.removeChild(this.renderer.domElement);

            this.renderer = null;
            this.camera = null;
            this.scene = null;

            this.gameover = false;
            this.gameSpeed = 0.1;
            this.init();
        },

        resize() {
            window.addEventListener("resize", () => {
                // Update sizes
                this.sizes.width = window.innerWidth;
                this.sizes.height = window.innerHeight;

                // Update camera
                this.camera.aspect = this.sizes.width / this.sizes.height;
                this.camera.updateProjectionMatrix();

                // Update renderer
                this.renderer.setSize(this.sizes.width, this.sizes.height);
                this.renderer.setPixelRatio(
                    Math.min(window.devicePixelRatio, 2)
                );
            });
        },

        getSizes() {
            return {
                width: window.innerWidth,
                height: window.innerHeight,
            };
        },

        tick() {
            let lastDelta = null;
            let delta = this.clock.getDelta();
            this.pause ? this.clock.stop() : this.clock.start();

            this.meshes.length > 0
                ? this.meshes.forEach((m) => {
                      m.Update(delta);
                  })
                : "";

            if (this.world) {
                this.world.Update(delta);
            }

            /** Получаем очки */
            this.score = Math.round(this.world.GetScore());

            /** Запускаем квиз */

            this.showQuestion = this.world.GetIntersec();

            /** Изменение скорости игры */
            this.changeSpeed();

            // this.scene.fog.color = new THREE.Color(this.color.fogColor);

            // Controls
            // this.controls.update();
            // Render
            this.renderer.render(this.scene, this.camera);

            !this.pause ? requestAnimationFrame(this.tick) : "";
        },

        timer(sec) {
            let takeData = new Date();
            let seconds = takeData.getSeconds();
        },

        setSpeed() {
            // if (this.score > 1000) {
            //     this.scene.fog.density < 0.16
            //         ? (this.scene.fog.density += 0.01)
            //         : "";
            // }
            if (this.score === 0) return;

            if (this.score % 500 == 0) {
                if (this.gameSpeed < this.maxSpeed) {
                    this.gameSpeed = this.gameSpeed + 0.01;
                    // this.startSpeed = this.gameSpeed;
                    this.world.GetNewSpeed(this.gameSpeed);
                    this.ground.SetGo(this.gameSpeed);
                }
            }
            if (this.score % 1000 == 0) {
                gsap.to(this.scene.fog, {
                    density: 0.16,
                });
            }
            if (this.score % 700 == 0) {
                gsap.to(this.scene.fog, {
                    density: 0.04,
                });
            }
        },

        getPause() {
            this.pause = !this.pause;
            !this.pause ? this.tick() : "";
            console.log(this.pause);
        },

        timeOver() {
            this.gameover = true;
        },

        getCorrect(correct) {
            if (correct) {
                this.world.SetGo(correct, 0);
                this.gameover = true;
            } else {
                this.world.SetGo(correct, this.gameSpeed);
                this.player.GetRunAnimation();
                this.player.GetDetectedColide(false);
            }
        },
    },
};
</script>

<template>
    <div>
        <div class="preloader active" ref="preloader">
            <div class="cssload-spin-box"></div>
        </div>

        <div ref="webGl" class="webGl" tabindex="0"></div>
        <div class="score_container">
            <p class="score_number">Score: {{ score }}</p>
        </div>
        <GameOverVue
            v-if="gameover"
            :total-score="score"
            @get-restart="restart"
        ></GameOverVue>
        <QuestionsVue
            v-if="showQuestion && !gameover"
            :start-question="showQuestion"
            @time-over="timeOver"
            @get-correct="getCorrect"
        >
        </QuestionsVue>
        <Splash @get-start="getStart" v-if="!letsStart"></Splash>>
        <div class="webGl__btn_container">
            <button @click="getPause" class="webGl__btn">Pause</button>
        </div>
    </div>
</template>

<style lang="scss">
.webGl {
    position: fixed;
    top: 0;
    left: 0;
    outline: none;
    clip-path: circle(100%);
    transition-property: clip-path, height;
    transition-duration: 0.8s;
    transition-timing-function: ease-in-out;
    z-index: 1;

    &__btn {
        padding: 1rem;
        background-color: rgb(0, 0, 0);
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
        &:focus {
            outline: none;
        }
        &_container {
            z-index: 2;
            display: flex;
            justify-content: center;
            position: absolute;
            right: 2rem;
            top: 8rem;
        }
    }
}
.score {
    &_container {
        position: absolute;
        top: 0;
        right: 1rem;
        padding: 1rem;
        z-index: 4;
    }
    &_number {
        color: white;
        font-size: 2rem;
    }
}
.preloader {
    width: 100lvw;
    height: 100lvh;
    position: absolute;
    z-index: -1;
    top: 0;
    left: 0;
    right: 0;
    background-color: black;
    &.active {
        z-index: 99;
    }
}
</style>