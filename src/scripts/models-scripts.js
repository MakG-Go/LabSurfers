import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { AnimationMixer, Vector3 } from "three";
import * as THREE from "three"
import { gsap } from 'gsap';

class BasicCharacterControllerProxy {
	constructor(animations) {
		this._animations = animations;
	}

	get animations() {
		return this._animations;
	}

};

class BasicCharacterControllerInput {
	constructor() {
		this.Init();
		this.pressing_button = ''
	}

	Init() {
		console.log('init')
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

		document.addEventListener('keydown', (e) => this.onKeyDown(e), false);
		document.addEventListener('keyup', (e) => this.onKeyUp(e), false);

		document.addEventListener('touchstart', (e) => this.handleTouchStart(this.getTouches(e)), false);
		document.addEventListener('touchmove', (e) => this.handleTouchMove(e), false);

		document.removeEventListener('keydown', (e) => this.onKeyDown(e), false);
	}

	onKeyDown(event) {

		switch (event.keyCode) {

			// case 87: // w
			// 	this.keys.forward = true;
			// 	break;
			// case 65: // a
			// 	this.keys.left = true;
			// 	break;
			// case 83: // s
			// 	this.keys.backward = true;
			// 	break;
			// case 68: // d
			// 	this.keys.right = true;
			// 	break;
			case 32: // SPACE

				console.log(event.keyCode, "keyCode")
				console.log(this.pressing_button !== event.keyCode)
				if (this.pressing_button !== event.keyCode) {

					this.keys.space = true;
				}
				this.pressing_button = event.keyCode
				console.log(this.pressing_button, 'pressing_button')
				break;
			case 16: // SHIFT
				this.keys.shift = true;
				break;
		}
	}

	onKeyUp(event) {
		switch (event.keyCode) {
			// case 87: // w
			// 	this.keys.forward = false;
			// 	break;
			// case 65: // a
			// 	this.keys.left = false;
			// 	break;
			// case 83: // s
			// 	this.keys.backward = false;
			// 	break;
			// case 68: // d
			// 	this.keys.right = false;
			// 	break;
			case 32: // SPACE
				this.pressing_button = ''
				this.keys.space = false;
				break;
			case 16: // SHIFT
				this.keys.shift = false;
				break;
		}
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
		// this.AddState('run-left', RunLeft);
		// this.AddState('run-right', RunRight);

		this.AddState('jump', JumpState);
		// this.AddState('walk-back', BackWalkState);
		// this.AddState('drunk', DrunkState);
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

			curAction.enabled = true;

			if (prevState.Name == 'walk' || prevState.Name == 'run-jump') {
				const ratio = curAction.getClip().duration / prevAction.getClip().duration;
				curAction.time = prevAction.time * ratio;
			} else {
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

		if (input.keys.backward) {
			this.parent.SetState('walk-back');
		}
		if (input.keys.space) {
			this.parent.SetState('jump');
		}
		else if (input.keys.left || input.mobileKeys.left) {
			this.parent.SetState('run-left');
		}
		else if (input.keys.right || input.mobileKeys.right) {
			this.parent.SetState('run-right');
		}
	}
};

class RunLeft extends State {
	constructor(parent) {
		super(parent);
	}

	get Name() {
		return 'run-left';
	}

	Enter(prevState) {
		const curAction = this.parent.proxy._animations.get('run-left');
		if (prevState) {
			const prevAction = this.parent.proxy._animations.get(prevState.Name);

			curAction.enabled = true;

			if (prevState.Name == 'slow-run' || prevState.Name == 'run-jump' || prevState.Name == 'run-left') {
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
		if (input.keys.left || input.mobileKeys.left) {
			if (input.keys.space) {
				this.parent.SetState('run-jump');
			}
			return;
		}

		this.parent.SetState('slow-run');
	}
};

class RunRight extends State {
	constructor(parent) {
		super(parent);
	}

	get Name() {
		return 'run-right';
	}

	Enter(prevState) {
		const curAction = this.parent.proxy._animations.get('run-right');
		if (prevState) {
			const prevAction = this.parent.proxy._animations.get(prevState.Name);

			curAction.enabled = true;

			if (prevState.Name == 'slow-run' || prevState.Name == 'run-jump' || prevState.Name == 'run-right' || prevState.Name == 'run-left') {
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
		if (input.keys.right || input.mobileKeys.right) {
			if (input.keys.space) {
				this.parent.SetState('run-jump');
			}
			return;
		}

		this.parent.SetState('slow-run');
	}
};

class WalkState extends State {
	constructor(parent) {
		super(parent);
	}

	get Name() {
		return 'walk';
	}

	Enter(prevState) {
		const curAction = this.parent.proxy._animations.get('walk');
		if (prevState) {
			const prevAction = this.parent.proxy._animations.get(prevState.Name);

			curAction.enabled = true;

			if (prevState.Name == 'slow-run' || prevState.Name == 'run-jump') {
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
		if (input.keys.forward) {
			if (input.keys.shift) {
				this.parent.SetState('slow-run');
			}
			if (input.keys.space) {
				this.parent.SetState('run-jump');
			}
			return;
		}

		this.parent.SetState('idle');
	}
};

class BackWalkState extends State {
	constructor(parent) {
		super(parent);
	}

	get Name() {
		return 'walk-back';
	}

	Enter(prevState) {
		const curAction = this.parent.proxy._animations.get('walk-back');
		if (prevState) {
			const prevAction = this.parent.proxy._animations.get(prevState.Name);

			curAction.enabled = true;

			if (prevState.Name == 'slow-run' || prevState.Name == 'run-jump' || prevState.Name == 'walk-back') {
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
		if (input.keys.backward) {
			if (input.keys.space) {
				this.parent.SetState('run-jump');
			}
			return;
		}

		this.parent.SetState('slow-run');
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

class DrunkState extends State {

	constructor(parent) {
		super(parent);
	}

	get Name() {
		return 'drunk';
	}

	Enter(prevState) {

		const curAction = this.parent.proxy._animations.get('drunk');

		if (prevState) {
			const prevAction = this.parent.proxy._animations.get(prevState.Name);

			curAction.enabled = true;

			if (prevState.Name != 'drunk') {
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
		if (input.keys.forward) {
			this.parent.SetState('slow-run');
		}
	}


}

export class BasicCharacterController {
	constructor(params) {
		this.Init(params);
		this.plaerBox = new THREE.Box3()

		this.shortMovePosition = {
			left: 1.2,
			center: 0,
			right: -1.2,
			up: {
				min: new THREE.Vector3(),
				max: new THREE.Vector3(),
				active: 3,
				disable: null

			}
		}
		this.currPosition = "center"
		this.interseck = false
		this.detectedColide = false
	}

	Init(params) {

		// this._decceleration = new THREE.Vector3(-0.0005, -0.0001, -5.0);
		// this._acceleration = new THREE.Vector3(1, 0.25, 50.0);
		// this._velocity = new THREE.Vector3(0, 0, 0);

		this.params = params
		this.animations = new Map()
		this.input = new BasicCharacterControllerInput();
		this.stateMachine = new CharacterFSM(new BasicCharacterControllerProxy(this.animations));

		this.LoadModels(this.params);

	}

	LoadModels(params) {
		this.params = params
		this._manager = new THREE.LoadingManager();

		new GLTFLoader(this.params.preloader).load(this.params.model, (gltf) => {

			this.model = gltf.scene;
			this.model.updateMatrixWorld(true)

			this.model.traverse((child) => {

				if (child.isMesh) {

					child.material.envMap = this.params.environment;
					child.material.envMapIntensity = 6;

					child.castShadow = true
					child.frustumCulled = false;
					child.material.needsUpdate = true;

					if (child.name === "alpha") {
						child.material.transparent = true;
						this.params.alpha.flipY = false;
						child.material.alphaMap = this.params.alpha;

					}
				}


			})

			/** Добавляем анимации в хранилище и модель к сцене */
			this.model.animations = gltf.animations;
			this.params.scene.add(this.model);

			/** Устанавливаем размер и позицию модели */
			this.params.scale ? this.model.scale.set(...this.params.scale) : '';
			this.params.pos ? this.model.position.set(...this.params.pos) : '';

			/** для boundingBox */

			this.plaerBox.setFromObject(this.model)

			this.shortMovePosition.up.min = this.plaerBox.min
			this.shortMovePosition.up.max = this.plaerBox.max
			this.shortMovePosition.up.disable = this.plaerBox.min.y


			/** -------------------------------------------------------- */

			// console.log(this.plaerBox, "plaerBox");
			// console.log(this.shortMovePosition, "shortMovePosition");

			// this.boxHelper = new THREE.BoxHelper(this.model, 0xffff00);
			// this.boxHelper.position.copy(this.model.position)
			// this.boxHelper.scale.copy(this.model.scale)

			// this.model.add(this.boxHelper)

			this.mixer = new AnimationMixer(this.model);

			this.SetupAnimations();

			this.params.mixers.push(this.mixer);

			// console.log(this.boxHelper.scale, 'helper')
			// console.log(this.plaerBox, 'Box3')

		});
		// this.params.preloader.onLoad = () => {
		// 	this.stateMachine.SetState('slow-run');
		// };
	}

	SetupAnimations() {
		if (this.model) {
			this.model.animations.forEach((clip) => {
				const action = this.mixer.clipAction(clip);
				action.play();
				action.enabled = false;
				this.animations.set(clip.name, action);
			});

			const idleAction = this.animations.get('slow-run');
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

		this.shortMovingUpdate(delta)

		if (this.mixer) {
			this.mixer.update(delta);
		}
	}

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

		// this.plaerBox.setFromObject(this.model)

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

			// console.log(this.shortMovePosition.up.min, 'custom')
			// console.log(this.plaerBox.min.y, 'player')

			gsap.timeline().to(this.shortMovePosition.up.min, {
				duration: 0.5,
				y: this.shortMovePosition.up.active,
				ease: 'Expo.easeOut',

				onStart: () => {

				},
				onUpdate: () => {

					this.plaerBox.set(this.shortMovePosition.up.min, this.shortMovePosition.up.max)
				},

				onComplete: () => {

				},


			})
				.to(this.shortMovePosition.up.min, {
					duration: 0.5,
					y: this.shortMovePosition.up.disable,
					ease: 'Sine.easeOut',
					onStart: () => {

					},
					onUpdate: () => {

						this.plaerBox.set(this.shortMovePosition.up.min, this.shortMovePosition.up.max)
					},
					onComplete: () => {

						this.input.keys.space = false
					}

				}, '>');


			return
		}

	}

	GetPlayer() {
		return this.plaerBox
	}

	GetDrunckAnimation() {
		this.stateMachine.SetState('drunk');
	}

	GetRunAnimation() {
		this.stateMachine.SetState('slow-run');
	}

	GetDetectedColide(detected) {
		this.detectedColide = detected
	}

	/** Fore future */

	generateBoundingBox(currentMesh) {

		currentMesh.geometry.computeBoundingBox();
		this.plaerBox.setFromObject(currentMesh, true);
		const min = this.plaerBox.min.clone();
		const max = this.plaerBox.max.clone();
		const boundingBoxLengths = new Vector3(
			Math.abs(min.x - max.x),
			Math.abs(min.y - max.y),
			Math.abs(min.z - max.z)
		);
		let p0 = min;
		let p1 = new Vector3(min.x + boundingBoxLengths.x, min.y, min.z);
		let p2 = new Vector3(min.x, min.y + boundingBoxLengths.y, min.z);
		let p3 = new Vector3(
			min.x + boundingBoxLengths.x,
			min.y + boundingBoxLengths.y,
			min.z
		);
		let p4 = new Vector3(min.x, min.y, min.z + boundingBoxLengths.z);
		let p5 = new Vector3(
			min.x + boundingBoxLengths.x,
			min.y,
			min.z + boundingBoxLengths.z
		);
		let p6 = new Vector3(
			min.x,
			min.y + boundingBoxLengths.y,
			min.z + boundingBoxLengths.z
		);
		let p7 = max;

		let lineMaterial = new THREE.MeshBasicMaterial({ side: DoubleSide });

		// Front Face

		let L0 = this.generateLinearLine(p0, p1, lineMaterial);
		let L1 = this.generateLinearLine(p0, p2, lineMaterial);
		let L2 = this.generateLinearLine(p2, p3, lineMaterial);
		let L3 = this.generateLinearLine(p1, p3, lineMaterial);

		// Connection between faces

		let L4 = this.generateLinearLine(p0, p4, lineMaterial);
		let L5 = this.generateLinearLine(p1, p5, lineMaterial);
		let L6 = this.generateLinearLine(p2, p6, lineMaterial);
		let L7 = this.generateLinearLine(p3, p7, lineMaterial);

		// Back face

		let L8 = this.generateLinearLine(p4, p5, lineMaterial);
		let L9 = this.generateLinearLine(p4, p6, lineMaterial);
		let L10 = this.generateLinearLine(p6, p7, lineMaterial);
		let L11 = this.generateLinearLine(p5, p7, lineMaterial);

		// Diagonal line

		let L12 = this.generateLinearLine(min, max, lineMaterial);

		let lineGroup = new Group();

		lineGroup.add(L0, L1, L2, L3, L4, L5, L6, L7, L8, L9, L10, L11, L12);

		return lineGroup;
	};

	generateLinearLine = (
		p1,
		p2,
		material
	) => {
		const points =
			points.push(p1);
		points.push(p1);
		points.push(p2);
		const geometry = new BufferGeometry().setFromPoints(points);
		return new Line(geometry, material);
	};

}





