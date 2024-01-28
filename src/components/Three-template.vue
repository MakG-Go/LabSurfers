
<script>
import * as dat from "lil-gui";
import Stats from "three/addons/libs/stats.module.js";
import { GetDetectMobile } from "@/scripts/mobileDetect.js";

import * as THREE from "three";
import { CSS3DRenderer } from "three/examples/jsm/renderers/CSS3DRenderer.js";
import _ from "lodash";
import { gsap } from "gsap";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { ShaderPass } from "three/examples/jsm/postprocessing/ShaderPass.js";
import { GammaCorrectionShader } from "three/examples/jsm/shaders/GammaCorrectionShader.js";
import { DotScreenPass } from "three/examples/jsm/postprocessing/DotScreenPass.js";
import { RenderPixelatedPass } from "three/examples/jsm/postprocessing/RenderPixelatedPass.js";
import { HalftonePass } from "three/addons/postprocessing/HalftonePass.js";

import { BasicCharacterController } from "@/scripts/models-scripts.js";
import { Ground } from "@/scripts/ground.js";
import { WorldManager } from "@/scripts/world.js";
import { CssMesh } from "@/scripts/cssMesh.js";
import { SpriteElement } from "@/scripts/createSprite.js";

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
            fov: { value: 85 },
            // renderTarget: null,
            // effectComposer: null,

            raycaster: new THREE.Raycaster(),
            mouse: new THREE.Vector2(),
            target: new THREE.Vector3(0, 0, 6.5),
            sizes: {
                width: window.innerWidth,
                height: window.innerHeight,
            },
            cameraPos: [1.2, 3, -1.65],
            color: {
                fogColor: "#0x000000",
            },

            showGame: false,
            startGame: false,
            pauseButton: null,

            alterPauseButton: null,
            alterStartButton: null,

            startButton: null,
            scoreContainer: null,
            intersectionBtns: [],
            model: {
                character: {
                    url: "models/toy_1.glb",
                    position: { x: 0, y: 0, z: 0 },
                    scale: { x: 1, y: 1, z: 1 },
                    alpha: new THREE.TextureLoader().load("textures/hear.jpg"),
                },
                doors: ["models/door-3.glb", "models/door-2.glb"],
            },
            getArea: forest,

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

            loadCounter: 0,
            score: 0,
            cssScore: null,
            showQuestion: false,
            allContentLoaded: false,
            live: null,

            /** Post */
            halfToneParams: {
                shape: 1,
                radius: 6,
                rotateR: Math.PI / 12,
                rotateB: (Math.PI / 12) * 2,
                rotateG: (Math.PI / 12) * 3,
                scatter: 0,
                blending: 1,
                blendingMode: 1,
                greyscale: false,
                disable: false,
            },
        };
    },

    created() {
        this.mobile = GetDetectMobile();
    },

    mounted() {
        this.getFov();
        this.changeSpeed = _.throttle(this.setSpeed, 1);

        this.init();
        this.resize();
        this.orientationchange();
        this.getCurrentLive();
        this.$refs.webGl.focus();

        // console.log(this.scene.children);
        // this.scene.children.traverse((child) => {
        //     if (child.isMesh) {
        //         console.log(child);
        //     }
        // });

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

            if (ROOLES.orbitControls) {
                this.createOrbitControl();
            }

            this.getLight();
            this.getEnvierment();
            // this.createStartButton();
            // this.createPauseButton();

            this.createScoreContainer();
            this.createAlterPauseButton();
            this.createAlterStartButton();

            this.ground = this.getGround(this.getArea);
            this.player = this.getModel(knitted_man);
            this.world = this.getEnemies(
                this.player,
                this.ground,
                this.getArea.enemies
            );

            this.createPostProcess();
            // this.createPixelPass();
            // this.createDotPass();
            this.createHalfTonePos();

            if (ROOLES.guiHelper) {
                this.getGui();
            }

            /** Clock */

            this.clock = new THREE.Clock();
        },

        showStart() {
            this.showGame = true;
        },

        getStartGame() {
            this.startGame = true;
            this.player.GetStart();
            this.world.GetStartGame(true);
            this.alterStartButton._hideBtn();
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
            this.cssCanvas = this.$refs.webglCss;

            this.scene = new THREE.Scene();
            this.sceneOrtho = new THREE.Scene();

            this.scene.background = new THREE.Color(0xffffff);
            this.scene.fog = new THREE.FogExp2(0xffffff, 0.055);

            // this.sceneOrtho.background = new THREE.Color(0xff0000);

            this.camera = new THREE.PerspectiveCamera(
                this.fov.value,
                this.sizes.width / this.sizes.height,
                0.01,
                40
            );

            this.camera.position.set(...this.cameraPos);
            this.camera.lookAt(this.target);

            this.cameraOrtho = new THREE.OrthographicCamera(
                -this.sizes.width / 2,
                this.sizes.width / 2,
                this.sizes.height / 2,
                -this.sizes.height / 2,
                1,
                10
            );
            this.cameraOrtho.position.z = 10;

            /**
             * Renderer
             */
            this.renderer = new THREE.WebGLRenderer({
                antialias: true,
                alpha: true,
            });

            // this.renderer.setClearColor(0xfffafa, 1);

            this.renderer.setSize(this.sizes.width, this.sizes.height);
            this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
            this.renderer.shadowMap.enabled = true;
            this.renderer.outputColorSpace = THREE.SRGBColorSpace;
            // this.renderer.toneMapping = THREE.AgXToneMapping;
            // this.renderer.toneMappingExposure = 1;

            this.renderer.autoClear = false;

            this.canvas.appendChild(this.renderer.domElement);

            this.scene.add(this.camera);

            this.axisHelper = new THREE.AxesHelper();

            this.stats = new Stats();
            this.canvas.appendChild(this.stats.dom);

            /** css render */

            this.cssRenderer = new CSS3DRenderer();
            this.cssRenderer.setSize(this.sizes.width, this.sizes.height);
            this.cssCanvas.appendChild(this.cssRenderer.domElement);

            // this.scene.add(this.axisHelper);
        },

        /** POST----------------------------- */

        createPostProcess() {
            let RenderTargetClass = null;

            // if (
            //     this.renderer.getPixelRatio() === 1 &&
            //     this.renderer.capabilities.isWebGL2
            // ) {
            //     console.log("1");
            //     RenderTargetClass = THREE.WebGL1Renderer;
            //     console.log("Using WebGLMultisampleRenderTarget");
            // } else {
            //     console.log("2");
            //     RenderTargetClass = THREE.WebGLRenderTarget;
            //     console.log("Using WebGLRenderTarget");
            // }

            RenderTargetClass = THREE.WebGLRenderTarget;

            this.renderTarget = new RenderTargetClass(800, 600, {
                minFilter: THREE.LinearFilter,
                magFilter: THREE.LinearFilter,
                format: THREE.RGBAFormat,
            });

            this.effectComposer = new EffectComposer(
                this.renderer,
                this.renderTarget
            );
            this.effectComposer.setPixelRatio(
                Math.min(window.devicePixelRatio, 2)
            );
            this.effectComposer.setSize(this.sizes.width, this.sizes.height);

            this.renderPass = new RenderPass(this.scene, this.camera);
            this.effectComposer.addPass(this.renderPass);

            this.renderPass.renderToScreen = true;

            this.createGammaCorector();
        },

        createGammaCorector() {
            const gammaCorrectionPass = new ShaderPass(GammaCorrectionShader);
            this.effectComposer.addPass(gammaCorrectionPass);
        },

        createDotPass() {
            this.dotScreenPass = new DotScreenPass();
            this.dotScreenPass.enabled = true;

            this.effectComposer.addPass(this.dotScreenPass);
            console.log(this.effectComposer);
        },

        createPixelPass() {
            this.renderPixelatedPass = new RenderPixelatedPass(
                10,
                this.scene,
                this.camera
            );
            this.renderPixelatedPass.normalEdgeStrength = 0;
            this.renderPixelatedPass.depthEdgeStrength = 2;
            this.effectComposer.addPass(this.renderPixelatedPass);
        },

        /** -------------------------------- */

        createHalfTonePos() {
            this.halftonePass = new HalftonePass(
                this.sizes.width,
                this.sizes.height,
                this.halfToneParams
            );

            this.effectComposer.addPass(this.halftonePass);

            this.controller = {
                radius: this.halftonePass.uniforms["radius"].value,
                rotateR:
                    this.halftonePass.uniforms["rotateR"].value /
                    (Math.PI / 180),
                rotateG:
                    this.halftonePass.uniforms["rotateG"].value /
                    (Math.PI / 180),
                rotateB:
                    this.halftonePass.uniforms["rotateB"].value /
                    (Math.PI / 180),
                scatter: this.halftonePass.uniforms["scatter"].value,
                shape: this.halftonePass.uniforms["shape"].value,
                greyscale: this.halftonePass.uniforms["greyscale"].value,
                blending: this.halftonePass.uniforms["blending"].value,
                blendingMode: this.halftonePass.uniforms["blendingMode"].value,
                disable: this.halftonePass.uniforms["disable"].value,
            };
        },

        onGUIChange() {
            // update uniforms
            this.halftonePass.uniforms["radius"].value = this.controller.radius;
            this.halftonePass.uniforms["rotateR"].value =
                this.controller.rotateR * (Math.PI / 180);
            this.halftonePass.uniforms["rotateG"].value =
                this.controller.rotateG * (Math.PI / 180);
            this.halftonePass.uniforms["rotateB"].value =
                this.controller.rotateB * (Math.PI / 180);
            this.halftonePass.uniforms["scatter"].value =
                this.controller.scatter;
            this.halftonePass.uniforms["shape"].value = this.controller.shape;
            this.halftonePass.uniforms["greyscale"].value =
                this.controller.greyscale;
            this.halftonePass.uniforms["blending"].value =
                this.controller.blending;
            this.halftonePass.uniforms["blendingMode"].value =
                this.controller.blendingMode;
            this.halftonePass.uniforms["disable"].value =
                this.controller.disable;
        },

        /** -------------------------------- */

        createOrbitControl() {
            /** Controls */
            this.controls = new OrbitControls(this.camera, this.canvas);
            this.controls.enableDamping = true;
            this.controls.minDistance = 3;
            this.controls.maxDistance = 20;

            this.controls2 = new OrbitControls(
                this.camera,
                this.cssRenderer.domElement
            );
            this.controls2.enableDamping = true;
            this.controls2.minDistance = 3;
            this.controls2.maxDistance = 20;
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
            this.sizes.width = window.innerWidth;
            this.sizes.height = window.innerHeight;

            console.log(this.sizes.width / this.sizes.height);
            if (this.sizes.width / this.sizes.height == null) return;

            // Update camera
            this.camera.aspect = this.sizes.width / this.sizes.height;
            this.camera.updateProjectionMatrix();

            this.cameraOrtho.left = -this.sizes.width / 2;
            this.cameraOrtho.right = this.sizes.width / 2;
            this.cameraOrtho.top = this.sizes.height / 2;
            this.cameraOrtho.bottom = -this.sizes.height / 2;
            this.cameraOrtho.updateProjectionMatrix();

            this.scoreContainer._getPositions({
                name: "score",
                element: this.scoreContainer.currentSprite,
            });

            this.alterPauseButton._getPositions({
                name: "pause",
                element: this.alterPauseButton.currentSprite,
            });

            // Update renderer
            this.renderer.setSize(this.sizes.width, this.sizes.height);
            this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

            this.cssRenderer.setSize(this.sizes.width, this.sizes.height);

            return;
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

        /** Методы игрового движка */

        // ------------------Кнопки------------------------

        btnClick(event) {
            this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
            this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

            this.raycaster.setFromCamera(this.mouse, this.cameraOrtho);

            // const intersects = this.raycaster.intersectObjects(
            //     this.intersectionBtns
            // );

            const intersects = this.raycaster.intersectObjects(
                this.sceneOrtho.children,
                true
            );

            if (intersects.length > 0) {
                console.log(intersects);

                const hoveredObject = intersects[0].object;

                // console.log(hoveredObject);

                if (hoveredObject.name == "pause") {
                    return this.getPause();
                }
                if (hoveredObject.name == "start") {
                    return this.getStartGame();
                }
            }
        },

        createStartCssButton() {
            let buttonGeometry = new THREE.PlaneGeometry(0.5, 0.25);
            let buttonMaterial = new THREE.MeshBasicMaterial({
                color: "rgb(48, 59, 78)",
            });

            let button = new THREE.Mesh(buttonGeometry, buttonMaterial);
            button.name = "start";
            button.rotation.x = Math.PI;
            button.position.y = 2.8;
            button.position.x = 0.6;
            button.position.z = -0.75;
            button.lookAt(this.camera.position);
            this.startButton = button;
            this.scene.add(button);

            let cssElem = new CssMesh({
                name: "Старт",
                type: "div",
                class: "webglCss__btn",
                width: 0.5,
                height: 0.25,
                position: button.position,
                rotation: button.rotation,
            });
            // this.intersectionBtns.push(this.startButton);
            this.scene.add(cssElem.compliteMash);
        },

        createScoreContainer() {
            let scoreContainer = new SpriteElement({
                back: "/backgrounds/board-1.png",
                width: 182,
                height: 132,
                fontSize: 20,
                color: "#4b261b",
                name: "score",
            });

            this.sceneOrtho.add(scoreContainer.currentSprite);
            this.scoreContainer = scoreContainer;

            this.scoreContainer._getPositions({
                name: "score",
                element: scoreContainer.currentSprite,
            });
        },

        createAlterStartButton() {
            let startBtn = new SpriteElement({
                back: "/backgrounds/start.png",
                width: 127,
                height: 127,
                name: "start",
            });

            this.sceneOrtho.add(startBtn.currentSprite);

            this.alterStartButton = startBtn;

            this.alterStartButton._getPositions({
                name: "start",
                element: startBtn.currentSprite,
            });

            this.intersectionBtns.push(startBtn.currentSprite);
        },

        createAlterPauseButton() {
            let pauseBtn = new SpriteElement({
                back: "/backgrounds/pause.png",
                width: 127,
                height: 127,
                name: "pause",
            });

            this.sceneOrtho.add(pauseBtn.currentSprite);

            this.alterPauseButton = pauseBtn;

            this.alterPauseButton._getPositions({
                name: "pause",
                element: pauseBtn.currentSprite,
            });

            this.intersectionBtns.push(pauseBtn.currentSprite);

            console.log(this.intersectionBtns);
        },

        // -----------------------------------------

        getLoadStatus() {
            return new THREE.LoadingManager(
                () => {
                    this.loadCounter++;

                    console.log("auf");

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
            if (this.gameover) return;

            if (this.startGame && !this.gameover) {
                this.score = Math.round(this.world.GetScore());
            }

            if (this.scoreContainer != null) {
                this.scoreContainer.currentScore = this.score;
                this.scoreContainer.currentLives = this.live;
                this.scoreContainer._Update();
            }

            if (this.alterPauseButton != null) {
                this.alterPauseButton._Update();
            }

            if (this.alterStartButton != null) {
                this.alterStartButton._Update();
            }

            if (this.cssScore != null) {
                return (this.cssScore.curentScore = this.score);
            }
        },

        setSpeed() {
            if (!this.startGame) {
                this.startGame = this.player.satrtGame;
                return;
            }

            if (this.score % 700 == 0) {
                if (this.gameSpeed.current < this.gameSpeed.maxSpeed) {
                    this.gameSpeed.current += 0.01;

                    this.world.GetNewSpeed(this.gameSpeed.current);

                    this.ground.SetGo(this.gameSpeed.current);
                }
            }

            if (this.score % 1000 == 0 || this.score % 800 == 0) {
                gsap.to(this.scene.fog, {
                    density: 0.18,
                });
            }

            if (this.score % 700 == 0) {
                gsap.to(this.scene.fog, {
                    density: 0.055,
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
                return;
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

            if (this.cssScore != null) {
                return (this.cssScore.curretLive = this.live);
            }
        },

        getPause() {
            this.pause = !this.pause;
            !this.pause ? this.tick() : "";
            console.log(this.pause);
        },

        startAction(event) {
            if (!this.startGame) return;
            this.player.GetKeyDown(event);
        },

        stopAction(event) {
            if (!this.startGame) return;
            this.player.GetKeyUp(event);
        },

        timeOver() {
            this.gameover = true;
        },

        restart() {
            gsap.globalTimeline.clear();

            console.log("restart");

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
            this.mixers = [];

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
            this.mixers = [];

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

            this.stats.update();

            this.startButton != null
                ? this.startButton.lookAt(this.camera.position)
                : "";
            this.pauseButton != null
                ? this.pauseButton.lookAt(this.camera.position)
                : "";
            // this.camera.lookAt(this.target);
            // this.camera.fov = this.fov.value;
            // this.camera.updateProjectionMatrix();

            if (this.world) {
                this.world.totalUpdate(delta);
            }

            /** Получаем пересечение */
            this.checkIntersection(this.world.GetIntersec());

            /** Получаем очки */
            this.getScore();

            /** Проверяем жизни */
            this.getCurrentLive();

            /** Изменение скорости игры */
            this.changeSpeed();

            // this.scene.fog.color = new THREE.Color(this.color.fogColor);

            // Controls
            // this.controls.update();

            // Render
            // this.renderer.clear();
            this.renderer.render(this.scene, this.camera);
            // this.renderer.clearDepth();
            this.renderer.render(this.sceneOrtho, this.cameraOrtho);
            // this.effectComposer.render();
            // console.log(this.effectComposer);
            // this.cssRenderer.render(this.scene, this.camera);

            !this.pause ? requestAnimationFrame(this.tick) : "";
        },

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

            // this.gui
            //     .add(this.fov, "value")
            //     .min(0)
            //     .max(170)
            //     .step(1)
            //     .name("Camera Fov")
            //     .onFinishChange(this.camera.updateProjectionMatrix());

            // this.gui
            //     .add(this.camera.position, "y")
            //     .min(0)
            //     .max(10)
            //     .step(0.01)
            //     .name("Camera Y");

            // this.gui
            //     .add(this.camera.position, "z")
            //     .min(-10)
            //     .max(0)
            //     .step(0.01)
            //     .name("Camera z");

            // this.gui
            //     .add(this.camera.position, "x")
            //     .min(-10)
            //     .max(10)
            //     .step(0.01)
            //     .name("Camera x");

            // this.gui
            //     .add(this.target, "z")
            //     .min(0)
            //     .max(10)
            //     .step(0.01)
            //     .name("Camera target Z")
            //     .onFinishChange(this.camera.updateProjectionMatrix());
            // this.gui
            //     .add(this.target, "y")
            //     .min(-2)
            //     .max(10)
            //     .step(0.01)
            //     .name("Camera target Y")
            //     .onFinishChange(this.camera.updateProjectionMatrix());
            if (this.startButton) {
                this.gui
                    .add(this.startButton.position, "x")
                    .min(-5)
                    .max(10)
                    .step(0.01)
                    .name("start pos x");

                this.gui
                    .add(this.startButton.position, "y")
                    .min(-5)
                    .max(10)
                    .step(0.01)
                    .name("start pos y");

                this.gui
                    .add(this.startButton.position, "z")
                    .min(-5)
                    .max(10)
                    .step(0.01)
                    .name("start pos z");
            }

            if (this.pauseButton) {
                this.gui
                    .add(this.pauseButton.position, "x")
                    .min(-5)
                    .max(10)
                    .step(0.01)
                    .name("pause pos x");

                this.gui
                    .add(this.pauseButton.position, "y")
                    .min(-5)
                    .max(10)
                    .step(0.01)
                    .name("pause pos y");

                this.gui
                    .add(this.pauseButton.position, "z")
                    .min(-5)
                    .max(10)
                    .step(0.01)
                    .name("pause pos z");
            }

            // this.gui
            //     .add(this.controller, "shape", {
            //         Dot: 1,
            //         Ellipse: 2,
            //         Line: 3,
            //         Square: 4,
            //     })
            //     .onChange(this.onGUIChange);
            // this.gui
            //     .add(this.controller, "radius", 1, 25)
            //     .onChange(this.onGUIChange);
            // this.gui
            //     .add(this.controller, "rotateR", 0, 90)
            //     .onChange(this.onGUIChange);
            // this.gui
            //     .add(this.controller, "rotateG", 0, 90)
            //     .onChange(this.onGUIChange);
            // this.gui
            //     .add(this.controller, "rotateB", 0, 90)
            //     .onChange(this.onGUIChange);
            // this.gui
            //     .add(this.controller, "scatter", 0, 1, 0.01)
            //     .onChange(this.onGUIChange);
            // this.gui
            //     .add(this.controller, "greyscale")
            //     .onChange(this.onGUIChange);
            // this.gui
            //     .add(this.controller, "blending", 0, 1, 0.01)
            //     .onChange(this.onGUIChange);
            // this.gui
            //     .add(this.controller, "blendingMode", {
            //         Linear: 1,
            //         Multiply: 2,
            //         Add: 3,
            //         Lighter: 4,
            //         Darker: 5,
            //     })
            //     .onChange(this.onGUIChange);
            // this.gui.add(this.controller, "disable").onChange(this.onGUIChange);
        },
    },
};
</script>

<template>
    <div @keydown="startAction($event)" tabindex="0">
        <Audio
            :show-question="showQuestion"
            :pause="pause"
            :start="showGame"
            :volume-params="0.8"
            :music-data="'./music/back.mp3'"
            tabindex="-1"
        ></Audio>

        <div class="preloader active" ref="preloader" tabindex="-1">
            <div class="cssload-spin-box"></div>
        </div>

        <img class="webGl__background" src="/backgrounds/back-1.png" alt="" />
        <div ref="webglCss" class="webglCss"></div>
        <div ref="webGl" class="webGl" @click="btnClick($event)"></div>

        <!-- <div class="score_container" tabindex="-1" ref="score">
            <p class="score_number">Очки: {{ score }}</p>

            <p class="score_number">Жизней: {{ live }}</p>
        </div> -->

        <GameOverVue
            tabindex="-1"
            v-if="gameover"
            :total-score="score"
            @get-restart="restart"
        ></GameOverVue>

        <!-- <QuestionsVue
            v-if="showQuestion && !gameover"
            :start-question="showQuestion"
            @time-over="timeOver"
            @get-correct="getCorrect"
        >
        </QuestionsVue> -->

        <Splash @show-start="showStart" v-if="!showGame" tabindex="-1"></Splash>

        <!-- <div class="webGl__btn_container" ref="pauseBtn" tabindex="-1">
            <button @click="getPause" class="webGl__btn">Pause</button>
        </div> -->
    </div>
</template>

<style lang="scss"></style>