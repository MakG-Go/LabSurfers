import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { AnimationMixer, Vector3 } from "three";
import * as THREE from "three"

import { gsap } from 'gsap';
import { ROOLES } from "@/scripts/rooles.js";
import _ from "lodash";

class BasicCharacterControllerProxy {

	constructor(animations, colide) {
		this._animations = animations;
		this.colide = colide
	}

	get animations() {
		return this._animations;
	}

	get collide() {
		return this.colide
	}

};

class BasicCharacterControllerInput {

	constructor(event) {

		this.Init(event);
	}

	Init(event) {
		// this.colide = colide
		this.event = event

		this.mobileKeys = {
			left: false,
			right: false
		}

		this.keys = {
			forward: false,
			backward: false,
			left: false,
			right: false,
			space: false,
			shift: false,
		};

		// this.onKeyDown(this.event)

		// document.addEventListener('touchstart', (e) => this.handleTouchStart(this.getTouches(e)), false);
		// document.addEventListener('touchmove', (e) => this.handleTouchMove(e), false);
	}

	onKeyDown() {

		this.keys.space = true
	}

	onKeyUp() {
		this.keys.space = false;
	}

	getTouches(e) {
		return e.touches
	}

	handleTouchStart(get) {
		const firstTouch = get[0];
		this.xDown = firstTouch.clientX;
		this.yDown = firstTouch.clientY;
	}

	handleTouchMove(e) {
		if (!this.xDown || !this.yDown) {
			return;
		}

		let xUp = e.touches[0].clientX;
		let yUp = e.touches[0].clientY;

		let xDiff = this.xDown - xUp;
		let yDiff = this.yDown - yUp;

		if (Math.abs(xDiff) > Math.abs(yDiff)) {

			(xDiff > 0) ? this.mobileKeys.left = true : this.mobileKeys.right = true;
			// (xDiff > 0) ? console.log('left') : console.log('right');
		}
		// (Math.abs(xDiff), 0) ? "" : "";

		this.xDown = null;
		this.yDown = null;

		// this.mobileKeys.left = false
		// this.mobileKeys.right = false
	}

};

class FiniteStateMachine {

	constructor() {
		this.states = {};
		this.currentState = null;
	}

	AddState(name, stateFunction) {

		this.states[name] = stateFunction;
	}

	SetState(name) {

		const prevState = this.currentState;

		if (prevState) {
			if (prevState.Name == name) {
				return
			}
			prevState.Exit();
		} else {
			// console.error(`State '${name}' does not exist.`);
		}

		const state = new this.states[name](this)
		this.currentState = state
		state.Enter(prevState)
	}

	Update(timeElapsed, input) {
		if (this.currentState) {
			this.currentState.Update(timeElapsed, input);
		} else {
			// console.error('No state set.');
		}
	}
}

class CharacterFSM extends FiniteStateMachine {
	constructor(proxy) {

		super();
		this.proxy = proxy;

		this.Init();
	}

	Init() {

		this.AddState('slow-run', RunState);
		this.AddState('jump', JumpState);
		this.AddState('idle', IdleState);

	}
};

class State {
	constructor(parent) {
		this.parent = parent;
	}

	Enter() { }
	Exit() { }
	Update() { }
};

class RunState extends State {
	constructor(parent) {
		super(parent);
	}

	get Name() {
		return 'slow-run';
	}

	Enter(prevState) {

		const curAction = this.parent.proxy._animations.get('slow-run');

		if (prevState) {

			const prevAction = this.parent.proxy._animations.get(prevState.Name);

			console.log(prevAction, 'prevAction')

			curAction.enabled = true;

			if (prevState.Name != 'slow-run') {

				const ratio = curAction.getClip().duration / prevAction.getClip().duration;
				curAction.time = prevAction.time * ratio;
			}
			else {
				curAction.time = 0.0;
				curAction.setEffectiveTimeScale(1.0);
				curAction.setEffectiveWeight(1.0);
			}



			curAction.crossFadeFrom(prevAction, 0.2, true);
			curAction.play();
		} else {
			curAction.play();
		}
	}

	Exit() {
	}

	Update(timeElapsed, input) {

		if (input.keys.space) {
			this.parent.SetState('jump');
		}
	}
};

class IdleState extends State {
	constructor(parent) {
		super(parent);
	}

	get Name() {
		return 'idle';
	}

	Enter(prevState) {

		const curAction = this.parent.proxy._animations.get('idle');

		if (prevState) {

			const prevAction = this.parent.proxy._animations.get(prevState.Name);

			curAction.enabled = true;

			if (prevState.Name != 'idle') {

				const ratio = curAction.getClip().duration / prevAction.getClip().duration;
				curAction.time = prevAction.time * ratio;
			}

			curAction.time = 0.0;
			curAction.setEffectiveTimeScale(1.0);
			curAction.setEffectiveWeight(1.0);

			curAction.crossFadeFrom(prevAction, 0.2, true);
			curAction.play();

		} else {

			curAction.play();

		}
	}

	Exit() {

	}

	Update(timeElapsed, input) {
		if (input.keys.space) {
			this.parent.SetState('slow-run');
			// this.parent.SetState('jump');
		}

	}
};

class JumpState extends State {

	constructor(parent) {

		super(parent);

		this.FinishedCallback = () => {
			this.Finished();
		}

		this.prevState
	}

	get Name() {
		return 'jump';
	}

	Enter(prevState) {

		this.prevState = this.getPrevName(prevState.Name)


		const curAction = this.parent.proxy._animations.get('jump');
		const mixer = curAction.getMixer();

		console.log(curAction)

		mixer.addEventListener('finished', this.FinishedCallback);

		if (prevState) {
			const prevAction = this.parent.proxy._animations.get(prevState.Name);

			curAction.reset();
			curAction.setLoop(THREE.LoopOnce, 1);
			curAction.clampWhenFinished = true;

			curAction.crossFadeFrom(prevAction, 0.2, true);
			curAction.play();
		} else {
			curAction.play();
		}
	}

	Finished() {

		this.Cleanup();
		this.parent.SetState(this.prevState);

	}
	Cleanup() {
		const action = this.parent.proxy._animations.get('jump');

		action.getMixer().removeEventListener('finished', this.FinishedCallback);
	}

	getPrevName(name) {
		return name
	}

	Exit() {
		this.Cleanup()

	}

	Update(timeElapsed, input) {

	}

}

export class BasicCharacterController {

	constructor(params) {

		this.plaerBox = new THREE.Box3().makeEmpty();
		this.intersecktionBox = new THREE.Box3().makeEmpty();

		this.shortMovePosition = {
			left: 1.2,
			center: 0,
			right: -1.2,
			up: {
				active: 3,
				disable: 2.08,
				zActive: null,
				zDisable: null

			}
		}

		this.intersecCount = ROOLES.life
		this.currPosition = "center"
		this.interseck = false
		this.detectedColide = false
		this.satrtGame = false

		this.Init(params, this.detectedColide);

	}

	get checkIntersec() {
		return this.detectedColide
	}

	Init(params, colide) {

		// this._decceleration = new THREE.Vector3(-0.0005, -0.0001, -5.0);
		// this._acceleration = new THREE.Vector3(1, 0.25, 50.0);
		// this._velocity = new THREE.Vector3(0, 0, 0);

		this.params = params
		this.colide = colide

		this.animations = new Map()
		this.input = new BasicCharacterControllerInput();
		this.stateMachine = new CharacterFSM(new BasicCharacterControllerProxy(this.animations, this.colide));

		this.LoadModels(this.params);

	}

	LoadModels(params) {

		this.params = params

		new GLTFLoader(this.params.preloader).load(this.params.model,
			(gltf) => {

				this.model = gltf.scene;
				this.model.updateMatrixWorld(true)

				this.model.traverse((child) => {

					if (child.isMesh) {

						child.material.transparent = true;
						child.userData.originalColor = child.material.color.clone();
						// console.log(child.material)



						// child.material.emissive = true
						// child.material.emissive = new THREE.Color({ r: 0.01, g: 0.01, b: 0.06 })

						// const vector = new THREE.Vector3();
						// const box = new THREE.Box3().makeEmpty();
						// const position = child.geometry.attributes.position;

						// for (let i = 0; i < position.count; i++) {
						// 	vector.fromBufferAttribute(position, i);
						// 	child.applyBoneTransform(i, vector);
						// 	child.localToWorld(vector);
						// 	box.expandByPoint(vector);
						// }

						// const helper = new THREE.Box3Helper(box, 0xffff00);
						// this.params.scene.add(helper);

						// if (child.material.name === "Yellow") {

						// 	child.material = new THREE.MeshToonMaterial({
						// 		color: ('#FFD700')
						// 	})
						// 	console.log(child)
						// }

						if (child.name === "alpha") {

							let alphaTexture = new THREE.TextureLoader().load(this.params.alpha)
							child.material.side = THREE.DoubleSide
							alphaTexture.flipY = false;
							child.material.alphaMap = alphaTexture;
						}

						child.material.normalScale = new THREE.Vector2(0.9, 0.05)

						child.material.envMapIntensity = 5
						child.material.envMap = this.params.environment;
						child.material.envMapIntensity = 4.2;

						child.castShadow = true
						child.frustumCulled = false;
						child.material.needsUpdate = true;


					}
				})

				this.model.children.forEach(child => {
					if (child.isObject3D) {
						this.truePos = child.position // Позиция меша
					}
				})

				/** Добавляем анимации в хранилище и модель к сцене */
				this.model.animations = gltf.animations;
				this.params.scene.add(this.model);

				/** Устанавливаем размер и позицию модели */
				this.params.scale ? this.model.scale.set(...this.params.scale) : '';
				this.params.pos ? this.model.position.set(...this.params.pos) : '';

				/** для boundingBox */

				this.plaerBox.setFromObject(this.model);


				// this.shortMovePosition.up.disable = this.plaerBox.min.y


				/** -------------------------------------------------------- */

				// console.log(this.plaerBox, "plaerBox");
				// console.log(this.shortMovePosition, "shortMovePosition");

				// this.boxHelper = new THREE.BoxHelper(this.model, 0xffff00);
				// this.boxHelper.position.copy(this.model.position)
				// this.boxHelper.scale.copy(this.model.scale)
				// this.params.scene.add(this.boxHelper)

				/** ---------------------------------------------------------- */

				this.mixer = new AnimationMixer(this.model);

				this.SetupAnimations();

				this.params.mixers.push(this.mixer);

			},

		);

	}

	SetupAnimations() {
		if (this.model) {

			this.model.animations.forEach((clip) => {

				const action = this.mixer.clipAction(clip);
				action.play();
				action.enabled = false;
				this.animations.set(clip.name, action);

			});

			const idleAction = this.animations.get('idle');

			if (idleAction) {
				idleAction.enabled = true;
				idleAction.play()
			}

		}
	}

	Update(delta) {


		if (!this.model) {
			return;
		}

		this.stateMachine.Update(delta, this.input);

		if (this.mixer) {
			this.mixer.update(delta);
		}


	}

	GetPlayer() {
		// return this.plaerBox
		return this.intersecktionBox
	}

	GetIdleAnimation() {

		this.stateMachine.SetState('idle');
	}

	GetRunAnimation() {
		this.stateMachine.SetState('slow-run');
	}


	GetDetectedColide(detected) {

		this.detectedColide = detected
		this.GetIntersecEvent(detected)

		if (!detected) return

		if (this.intersecCount - 1 >= 0) {
			this.intersecCount--
		}
	}

	GetCurrentLive() {

		return this.intersecCount
	}

	GetStart() {


		/** Старт игры  */

		!this.satrtGame ? this.satrtGame = true : ''

		this.GetRunAnimation()

		// console.log('start')

		return this.satrtGame
	}

	GameOverItersec() {

		if (this.InterseckBox.geometry === null) return
		// this.InterseckBox.position.y = 7;
		// this.intersecktionBox.setFromObject(this.InterseckBox);
	}

	/** События для анимации */

	GetKeyDown(event) {

		if (event.keyCode === 32 && !this.input.keys.space && !this.detectedColide) {

			this.input.onKeyDown();
			this.shortMovingUpdate();

			setTimeout(() => {
				if (this.input.keys.space) {
					this.input.keys.space = false
				}
			}, 800)
		}

	}

	GetKeyUp(event) {
		switch (event.keyCode) {

			case 32: // SPACE
				this.input.onKeyUp()
				break;

		}
	}

	/** Intersec  */

	CreateInterseckBox(params) {

		let x, y, z
		let truePos = new Vector3()

		if (params.box.min.x < 0 || params.box.max.x < 0) {
			x = Math.abs(params.box.max.x) + Math.abs(params.box.min.x)
		} else {
			x = Math.abs(params.box.min.x) - Math.abs(params.box.max.x);
		}

		if (params.box.min.y < 0 || params.box.max.y < 0) {
			y = Math.abs(params.box.min.y) + Math.abs(params.box.max.y);
		} else {
			y = Math.abs(params.box.min.y) - Math.abs(params.box.max.y);
		}

		if (params.box.min.z < 0 || params.box.max.z < 0) {
			z = Math.abs(params.box.min.z) + Math.abs(params.box.max.z) - 0.5;
		} else {
			z = Math.abs(params.box.min.z) - Math.abs(params.box.max.z) + 0.5;
		}

		const geometry = new THREE.BoxGeometry(x, y, z);

		const material = new THREE.MeshStandardMaterial({
			color: 0x00ff00,
			wireframe: true,
			transparent: true,
			opacity: 0.3,
			visible: ROOLES.colliderHelper,

		});

		const cube = new THREE.Mesh(geometry, material);

		truePos.x = params.position.x
		truePos.y = params.position.y + Math.abs(x)
		truePos.z = params.position.z + 0.5

		this.shortMovePosition.up.disable = truePos.y
		this.shortMovePosition.up.active = truePos.y * 1.5
		this.shortMovePosition.up.zDisable = truePos.z
		this.shortMovePosition.up.zActive = truePos.z * 3


		cube.position.set(...truePos);

		return cube
	}

	CreateInterseckBoxColide() {

		const group = new THREE.Group();

		this.InterseckBox = this.CreateInterseckBox({
			box: this.plaerBox,
			position: this.truePos,
			intersection: this.intersecktionBox
		})

		// this.InterseckBox.rotateX(Math.PI * -0.30)

		this.params.scene.add(this.InterseckBox);
		this.intersecktionBox.setFromObject(this.InterseckBox)

		const helper = new THREE.Box3Helper(this.intersecktionBox, 0x00ffff);

		/** BoundingBox для хелпера */
		ROOLES.colliderHelper ? this.params.scene.add(helper) : ''



	}

	GetIntersecEvent(e) {
		// console.log(e, 'GetIntersecEvent')
		if (!this.satrtGame) return

		if (this.InterseckBox.geometry === null) return

		switch (e) {

			case true:

				// this.InterseckBox.position.y = 7;
				// this.intersecktionBox.setFromObject(this.InterseckBox);
				this.model.traverse((child) => {


					if (child.isMesh && child.name != "alpha") {

						child.material.emissive = { r: 0.56, g: 0.56, b: 0.98 }
						child.material.color = { r: 0, g: 0, b: 0 }
						gsap.to(child.material, {
							duration: 0.1,
							opacity: 0.3,
							repeat: -1,
							yoyo: true
						})
					}
				});

				break;

			case false:


				this.InterseckBox.position.y = this.shortMovePosition.up.disable;
				this.intersecktionBox.setFromObject(this.InterseckBox);


				this.model.traverse((child) => {
					if (child.isMesh) {
						gsap.killTweensOf(child.material);
					}
				})

				this.model.traverse((child) => {

					if (child.isMesh && child.name != "alpha") {
						child.material.emissive = { r: 0, g: 0, b: 0 }
						child.material.color = { ...child.userData.originalColor }
						gsap.to(child.material, {
							duration: 0.1,
							opacity: 1,
							repeat: 0,
							yoyo: false,

						})
					}
				});

				break;
		}

	}

	updateScinedBox(box) {

		this.model.traverse((child) => {
			if (child.isMesh) {
				child.computeBoundingBox()
			}
		})

	}

	/** Moving */

	movingUpdate(delta) {

		const velocity = this._velocity;
		const frameDecceleration = new THREE.Vector3(
			velocity.x * this._decceleration.x,
			velocity.y * this._decceleration.y,
			velocity.z * this._decceleration.z
		);
		frameDecceleration.multiplyScalar(delta);
		frameDecceleration.z = Math.sign(frameDecceleration.z) * Math.min(
			Math.abs(frameDecceleration.z), Math.abs(velocity.z));

		velocity.add(frameDecceleration);

		const controlObject = this.model;
		const _Q = new THREE.Quaternion();
		const _A = new THREE.Vector3();
		const _R = controlObject.quaternion.clone();

		const acc = this._acceleration.clone();
		if (this.input.keys.shift) {
			acc.multiplyScalar(2.0);
		}

		// if (this.stateMachine.currentState.Name == 'idol') {
		// 	acc.multiplyScalar(0.0);
		// }

		if (this.input.keys.forward) {
			velocity.z += acc.z * delta * 0.08;
		}
		if (this.input.keys.backward) {
			velocity.z -= acc.z * delta * 0.08;
		}
		if (this.input.keys.left) {
			_A.set(0, 1, 0);
			_Q.setFromAxisAngle(_A, 4.0 * Math.PI * delta * this._acceleration.y);
			_R.multiply(_Q);
		}
		if (this.input.keys.right) {
			_A.set(0, 1, 0);
			_Q.setFromAxisAngle(_A, 4.0 * -Math.PI * delta * this._acceleration.y);
			_R.multiply(_Q);
		}

		controlObject.quaternion.copy(_R);

		const oldPosition = new THREE.Vector3();
		oldPosition.copy(controlObject.position);

		const forward = new THREE.Vector3(0, 0, 1);
		forward.applyQuaternion(controlObject.quaternion);
		forward.normalize();

		const sideways = new THREE.Vector3(1, 0, 0);
		sideways.applyQuaternion(controlObject.quaternion);
		sideways.normalize();

		sideways.multiplyScalar(velocity.x * delta);
		forward.multiplyScalar(velocity.z * delta);

		controlObject.position.add(forward);
		controlObject.position.add(sideways);

		oldPosition.copy(controlObject.position);

	}

	shortMovingUpdate() {

		if (!this.model) {
			return;
		}

		if (this.detectedColide) return

		if (this.input.keys.left || this.input.mobileKeys.left) {


			if (this.currPosition === "center") {

				gsap.to(this.model.position, {
					duration: 0.5,
					x: this.shortMovePosition["left"],
					ease: 'Expo.easeOut'

				});
				this.currPosition = "left";
				this.input.keys.left = false;
				this.input.mobileKeys.left = false


				return
			}
			if (this.currPosition === "right") {

				gsap.to(this.model.position, {
					duration: 0.5,
					x: this.shortMovePosition["center"],
					ease: 'Expo.easeOut'

				});

				this.currPosition = "center";
				this.input.keys.left = false;
				this.input.mobileKeys.left = false

				return
			}
		}

		if (this.input.keys.right || this.input.mobileKeys.right) {

			if (this.currPosition === "center") {


				gsap.to(this.model.position, {
					duration: 0.5,
					x: this.shortMovePosition["right"],
					ease: 'Expo.easeOut'

				});

				this.currPosition = "right";
				this.input.keys.right = false;
				this.input.mobileKeys.right = false

				return
			}
			if (this.currPosition === "left") {

				gsap.to(this.model.position, {
					duration: 0.5,
					x: this.shortMovePosition["center"],
					ease: 'Expo.easeOut'

				});
				this.currPosition = "center";
				this.input.keys.right = false;
				this.input.mobileKeys.right = false

				return
			}
		}

		if (this.input.keys.space) {

			gsap.timeline()
				.to(this.InterseckBox.position, {
					duration: 0.4,
					ease: 'sine.in',
					y: this.shortMovePosition.up.active,
					z: this.shortMovePosition.up.zActive,
					onUpdate: () => {
						this.intersecktionBox.setFromObject(this.InterseckBox)
					},
				})
				.to(this.InterseckBox.position, {
					duration: 0.4,
					ease: "sine.out",
					y: this.shortMovePosition.up.disable,
					z: this.shortMovePosition.up.zDisable,
					onUpdate: () => {
						this.intersecktionBox.setFromObject(this.InterseckBox)
					},
					onComplete: () => {

						this.input.keys.space = false
					}

				});

			return;
		}

	}

}





