
<script>
import * as dat from "lil-gui";
import * as THREE from "three";
import _ from "lodash";
import { gsap } from "gsap";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { BasicCharacterController } from "@/scripts/models-scripts.js";
import { Ground } from "@/scripts/ground.js";
import { WorldManager } from "@/scripts/world.js";

import { GetDetectMobile } from "@/scripts/mobileDetect.js";

import QuestionsVue from "@/components/Questions.vue";
import GameOverVue from "@/components/GameOver.vue";
import Splash from "@/components/Splash.vue";
import Audio from "./Audio.vue";

import { ROOLES } from "@/scripts/rooles.js";
import { forest } from "@/scripts/areas.js";
import { knitted_man } from "@/scripts/character.js";
import { enemyCount } from "@/scripts/enemies.js";
import { areaTextureCount } from "@/scripts/areas.js";

export default {
    components: {
        QuestionsVue,
        GameOverVue,
        Splash,
        Audio,
    },
    // props: {
    //     getArea: { type: Object, default: () => {} },
    // },

    data() {
        return {
            mobile: null,
            getArea: forest,
            fov: { value: 85 },
            showGame: false,
            startGame: false,

            target: new THREE.Vector3(0, 0, 6.5),
            cameraPos: [1.2, 3, -1.65],
            color: {
                fogColor: "#0x000000",
            },

            model: {
                character: {
                    url: "models/toy_1.glb",
                    position: { x: 0, y: 0, z: 0 },
                    scale: { x: 1, y: 1, z: 1 },
                    alpha: new THREE.TextureLoader().load("textures/hear.jpg"),
                },
                doors: ["models/door-3.glb", "models/door-2.glb"],
            },

            mixers: [],
            meshes: [],
            gameover: false,
            pause: false,
            checkSpeed: false,
            gameSpeed: {
                startSpeed: ROOLES.startSpeed,
                current: 0,
                maxSpeed: ROOLES.maxSpeed,
            },

            intersection: false,

            // gameSpeed: 0,
            // maxSpeed: 0.8,

            loadCounter: 0,
            score: 0,
            showQuestion: false,
            // controls: null,

            allContentLoaded: false,

            live: null,
        };
    },

    created() {
        this.mobile = GetDetectMobile();
    },

    mounted() {
        this.getFov();
        this.changeSpeed = _.throttle(this.setSpeed, 1);
        this.sizes = this.getSizes();
        this.init();
        this.resize();
        this.orientationchange();
        this.getCurrentLive();

        console.log(this.meshes)
        // this.timer();
    },

    watch: {
        showGame() {
            this.tick();
        },

        startGame() {
            switch (this.startGame) {
                case true:
                    gsap.to(this.gameSpeed, {
                        current: this.gameSpeed.startSpeed,
                        duration: 1.2,
                        onUpdate: () => {
                            this.world.GetNewSpeed(this.gameSpeed.current);
                            this.ground.SetGo(this.gameSpeed.current);
                        },
                    });

                    break;
            }
        },
    },

    beforeUnmount() {
        this.destroyScene();
    },
    unmounted() {
        cancelAnimationFrame(this.animationFrameId);
    },

    methods: {
        /** Методы сцены */

        init() {
            this.createScene();

            // this.createOrbitControl();

            this.getLight();
            this.getEnvierment();

            this.ground = this.getGround(this.getArea);
            this.player = this.getModel(knitted_man);

            this.world = this.getEnemies(
                this.player,
                this.ground,
                this.getArea.enemies
            );

            // this.getGui();

            /** Clock */

            this.clock = new THREE.Clock();
        },

        showStart() {
            this.showGame = true;
        },

        getStartGame() {
            this.startGame = true;
        },

        getFov() {
            // window.innerWidth < 719
            //     ? (this.fov.value = 45)
            //     : (this.fov.value = 80);
            this.mobile.mobile != null || this.mobile.tablet != null
                ? (this.fov.value = 80)
                : (this.fov.value = 85);
        },

        createScene() {
            this.canvas = this.$refs.webGl;
            this.scene = new THREE.Scene();
            this.scene.background = new THREE.Color(0xffffff);
            this.scene.fog = new THREE.FogExp2(0xffffff, 0.04);

            this.camera = new THREE.PerspectiveCamera(
                this.fov.value,
                this.sizes.width / this.sizes.height,
                0.01,
                50
            );

            // this.camera.position.x = 0;
            // this.camera.position.y = 3.45;
            // this.camera.position.z = -4.5;
            this.camera.position.set(...this.cameraPos);
            this.camera.lookAt(this.target);

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

        getLight() {
            /** Light */

            this.ambientLight = new THREE.AmbientLight(0x404040, 7);
            this.scene.add(this.ambientLight);

            this.pointLight = new THREE.PointLight(0x404040, 1000, 15);
            this.pointLight.position.x = 0;
            this.pointLight.position.y = 8;
            this.pointLight.position.z = -6;
            this.pointLight.shadow.bias = -0.002;
            // this.sphereSize = 1;

            this.pointLight.castShadow = true;
            // this.pointLightHelper = new THREE.PointLightHelper(
            //   this.pointLight,
            //   this.sphereSize
            // );

            this.scene.add(this.pointLight);
            // this.scene.add(this.pointLightHelper);
        },

        getSize() {
            // Update sizes
            let w, h;

            // this.sizes.width = window.innerWidth;
            // this.sizes.height = window.innerHeight;
            w = window.innerWidth;
            h = window.innerHeight;

            console.log(w, h);

            // Update camera
            this.camera.aspect = w / h;
            this.camera.updateProjectionMatrix();

            // Update renderer
            this.renderer.setSize(w, h);
            this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        },

        resize() {
            window.addEventListener(
                "resize",
                () => {
                    this.getSize();
                },
                false
            );
        },

        orientationchange() {
            window.addEventListener(
                "orientationchange",
                () => {
                    this.getSize();
                    this.$nextTick(() => {
                        this.getFov();
                    });
                },
                false
            );
        },

        getSizes() {
            return {
                width: window.innerWidth,
                height: window.innerHeight,
            };
        },

        /** Методы игрового движка */

        getLoadStatus() {
            return new THREE.LoadingManager(
                () => {
                    this.loadCounter++;

                    //  enemyCount.eCount == ROOLES.enemy
                    // console.log(enemyCount.eCount, "enemyCount");
                    // console.log(areaTextureCount.tCount, "areaTextureCount");

                    if (this.loadCounter == 2) {
                        gsap.to(this.$refs.preloader, {
                            opacity: 0,
                            onComplete: () => {
                                this.$refs.preloader
                                    ? this.$refs.preloader.classList.remove(
                                        "active"
                                    )
                                    : "";
                                this.player.GetIdleAnimation();
                                this.player.CreateInterseckBoxColide();
                            },
                        });
                    }
                }
                // (itemUrl, itemsLoaded, itemsTotal) => {
                //     let loadProc = itemsLoaded / itemsTotal;
                //     this.loadPercetn = Math.floor(loadProc * 100);
                // }
            );
        },

        getModel({ url, position, scale, alpha }) {
            const newModel = new BasicCharacterController({
                model: url,
                scale: new THREE.Vector3(scale.x, scale.y, scale.z),
                alpha: alpha,
                pos: new THREE.Vector3(position.x, position.y, position.z),

                scene: this.scene,
                meshStore: this.meshes,
                mixers: this.mixers,
                environment: this.environmentMap,
                start: this.startGame,

                preloader: this.getLoadStatus(),
            });

            this.meshes.push(newModel);
            return newModel;
        },

        getGround(area) {
            const ground = new Ground({
                model: area.area,
                alpha: area.alpha,
                diffuse: area.diffuse,
                scene: this.scene,
                meshStore: this.meshes,
                speed: this.gameSpeed.current,
                environment: this.environmentMap,
                preloader: this.getLoadStatus(),
            });
            this.meshes.push(ground);
            return ground;
        },

        getEnemies(player, ground, enemies) {
            const newWorld = new WorldManager({
                scene: this.scene,
                enemies: enemies,
                player: player,
                ground: ground,
                speed: this.gameSpeed.current,
                environment: this.environmentMap,
                preloader: this.getLoadStatus(),
            });
            return newWorld;
        },

        getEnvierment() {
            let path = "environment/";
            this.cubeTextureLoader = new THREE.CubeTextureLoader();
            this.environmentMap = this.cubeTextureLoader.load([
                path + "px.jpg",
                path + "nx.jpg",
                path + "py.jpg",
                path + "ny.jpg",
                path + "pz.jpg",
                path + "nz.jpg",
            ]);

            this.environmentMap.minFilter = THREE.NearestFilter;
            this.environmentMap.magFilter = THREE.NearestFilter;
            this.environmentMap.generateMipmaps = false;

            this.environmentMap.colorSpace = THREE.SRGBColorSpace;
        },

        getScore() {
            if (this.startGame && !this.gameover) {
                this.score = Math.round(this.world.GetScore());
            }
        },

        setSpeed() {
            if (!this.startGame) {
                this.startGame = this.player.satrtGame;
                return;
            }

            if (this.score % 500 == 0) {
                if (this.gameSpeed.current < this.gameSpeed.maxSpeed) {
                    this.gameSpeed.current += 0.01;

                    this.world.GetNewSpeed(this.gameSpeed.current);

                    this.ground.SetGo(this.gameSpeed.current);
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

        setIntersectedSpeed(value) {
            if (value) {
                this.world.GetNewSpeed(ROOLES.collideSpeed);
                this.ground.SetGo(ROOLES.collideSpeed);
                return;
            }

            if (this.gameSpeed.current < this.gameSpeed.maxSpeed) {
                this.world.GetNewSpeed(this.gameSpeed.current);
                this.ground.SetGo(this.gameSpeed.current);
                return
            }

            this.world.GetNewSpeed(this.gameSpeed.maxSpeed);
            this.ground.SetGo(this.gameSpeed.maxSpeed);



        },

        checkIntersection(value) {
            this.intersection = value;

            this.setIntersectedSpeed(value);
        },

        getCurrentLive() {
            this.live = this.player.GetCurrentLive();

            /** Условие проигрыша  */

            if (this.live === 0) {
                this.gameover = true;
                this.world.SetGo(false, 0);
                this.player.GetIdleAnimation();
                this.player.GameOverItersec();
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

        restart() {
            gsap.globalTimeline.clear();

            this.$refs.preloader.classList.add("active");
            gsap.to(this.$refs.preloader, {
                opacity: 1,
                duration: 0.2,
            });

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
            this.startGame = false;
            this.gameSpeed.current = 0;
            this.score = 0;
            this.loadCounter = 0;
            enemyCount.eCountClear = 0;
            areaTextureCount.tCountClear = 0;

            this.init();
        },

        destroyScene() {
            enemyCount.eCountClear = 0;

            gsap.killTweensOf(this.targetCamera);
            gsap.globalTimeline.clear();
            window.removeEventListener("orientationchange", () => {
                this.getSize();
                this.getFov();
            });
            window.removeEventListener("resize", this.resize);
            window.removeEventListener("mousemove", this.throttledHoverModel);
            window.removeEventListener("click", this.clickModel);

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
        },

        tick() {
            let delta = this.clock.getDelta();
            this.pause ? this.clock.stop() : this.clock.start();

            // this.camera.lookAt(this.target);
            // this.camera.fov = this.fov.value;
            // this.camera.updateProjectionMatrix();

            // this.meshes.length > 0
            //     ? this.meshes.forEach((m) => {
            //         m.Update(delta);
            //     })
            //     : "";

            if (this.world) {
                this.world.totalUpdate(delta);
            }

            /** Получаем пересечение */

            this.checkIntersection(this.world.GetIntersec());

            /** Получаем очки */
            // this.score = Math.round(this.world.GetScore());
            this.getScore();

            /** Проверяем жизни */

            this.getCurrentLive();

            // this.showQuestion = this.world.GetIntersec();

            /** Изменение скорости игры */
            this.changeSpeed();

            // this.scene.fog.color = new THREE.Color(this.color.fogColor);

            // Controls
            // this.controls.update();

            // Render
            this.renderer.render(this.scene, this.camera);

            !this.pause ? requestAnimationFrame(this.tick) : "";
        },

        // timer(sec) {
        //     let takeData = new Date();
        //     let seconds = takeData.getSeconds();
        // },

        /** Для вопросов */
        // getCorrect(correct) {
        //     if (correct) {
        //         this.world.SetGo(correct, 0);
        //         this.gameover = true;
        //     } else {
        //         this.world.SetGo(correct, this.gameSpeed.current); //Прокидываем текущую скорость
        //         // this.player.GetRunAnimation();
        //         this.player.GetDetectedColide(false);
        //     }
        // },

        /** Вспомогательные методы */

        getGui() {
            this.gui = new dat.GUI({
                width: 500,
            });
            // this.gui
            //     .add(this.pointLight.position, "x")
            //     .min(-1)
            //     .max(5)
            //     .step(0.001)
            //     .name("P_Light X");
            // this.gui
            //     .add(this.pointLight.position, "y")
            //     .min(-1)
            //     .max(10)
            //     .step(0.001)
            //     .name("P_Light Y");
            // this.gui
            //     .add(this.pointLight.position, "z")
            //     .min(-10)
            //     .max(20)
            //     .step(0.001)
            //     .name("P_Light Z");
            // this.gui
            //     .add(this.pointLight, "intensity")
            //     .min(-1)
            //     .max(5000)
            //     .step(0.001)
            //     .name("P_Light intensity");
            // this.gui
            //     .add(this.ambientLight, "intensity")
            //     .min(0)
            //     .max(50)
            //     .step(0.001)
            //     .name("A_Light intensity");
            // this.gui
            //     .add(this.scene.fog, "density")
            //     .min(0)
            //     .max(100)
            //     .step(0.01)
            //     .name("fog min");

            // this.gui.addColor(this.color, "fogColor").name("Fog color");

            this.gui
                .add(this.fov, "value")
                .min(0)
                .max(170)
                .step(1)
                .name("Camera Fov")
                .onFinishChange(this.camera.updateProjectionMatrix());

            this.gui
                .add(this.camera.position, "y")
                .min(0)
                .max(10)
                .step(0.01)
                .name("Camera Y");

            this.gui
                .add(this.camera.position, "z")
                .min(-10)
                .max(0)
                .step(0.01)
                .name("Camera z");

            this.gui
                .add(this.camera.position, "x")
                .min(-10)
                .max(10)
                .step(0.01)
                .name("Camera x");

            this.gui
                .add(this.target, "z")
                .min(0)
                .max(10)
                .step(0.01)
                .name("Camera target Z")
                .onFinishChange(this.camera.updateProjectionMatrix());
            this.gui
                .add(this.target, "y")
                .min(-2)
                .max(10)
                .step(0.01)
                .name("Camera target Y")
                .onFinishChange(this.camera.updateProjectionMatrix());
        },

        // newArea() {
        //     this.$emit("new-area");
        // },
    },
};
</script>

<template>
    <div>
        <Audio :show-question="showQuestion" :pause="pause" :start="showGame" :volume-params="0.8"
            :music-data="'./music/back.mp3'"></Audio>

        <div class="preloader active" ref="preloader">
            <div class="cssload-spin-box"></div>
        </div>

        <div ref="webGl" class="webGl" tabindex="0"></div>

        <div class="score_container">
            <p class="score_number">Очки: {{ score }}</p>

            <p class="score_number">Жизней: {{ live }}</p>
        </div>

        <GameOverVue v-if="gameover" :total-score="score" @get-restart="restart"></GameOverVue>

        <!-- <QuestionsVue
            v-if="showQuestion && !gameover"
            :start-question="showQuestion"
            @time-over="timeOver"
            @get-correct="getCorrect"
        >
        </QuestionsVue> -->

        <Splash @show-start="showStart" v-if="!showGame"></Splash>

        <div class="webGl__btn_container" tabindex="0" ref="pauseBtn">
            <button @click="getPause" class="webGl__btn">Pause</button>
        </div>
    </div>
</template>

<style lang="scss"></style>