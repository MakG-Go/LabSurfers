import * as THREE from "three"
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { ROOLES } from "@/scripts/rooles.js";
import { enemyCount } from "@/scripts/enemies.js"


class WorldObject {

	constructor(params, side, character, enemi) {

		this.params = params

		this.enemi = enemi
		this.enemiLoadCount = 0

		this.position = new THREE.Vector3(0, 0, 0);
		this.quaternion = new THREE.Quaternion();
		this.collider = new THREE.Box3();
		this.bBox

		this.side = side

		this.skinnedMesh = null
		this.action = null
		this.openIndex = null

		this.character = character

		this._manager = new THREE.LoadingManager();
		this.loadModel(this.params, this.enemi)

	}

	loadModel(params, enemi) {

		this.params = params
		this.enemi = enemi

		new GLTFLoader(this._manager).load(this.enemi.model, (gltf) => {

			this.model = gltf.scene;

			this.model.animations = gltf.animations;

			this.model.updateMatrixWorld(true)

			this.model.traverse((child) => {

				if (child.isMesh) {

					child.material.envMap = this.params.environment;
					child.material.envMapIntensity = 3;
					child.material.needsUpdate = true;

					// child.castShadow = true
					// child.frustumCulled = false;

				}

				if (child.name.includes('alpha') && this.enemi.alpha) {

					let alphaTexture = new THREE.TextureLoader().load(this.enemi.alpha)

					child.material.side = THREE.DoubleSide
					child.material.transparent = true;
					alphaTexture.flipY = false;
					child.material.alphaMap = alphaTexture;

				}

				// if (child.name.includes('colider')) {

				// 	this.bBox = child.geometry.boundingBox.clone();
				// }

				if (child.isSkinnedMesh) {
					this.skinnedMesh = child
				}

			})

			// this.mixer = new THREE.AnimationMixer(this.model);

			// this.SetupAnimations()

			// if (this.side === 0) {
			// 	this.model.position.x = this.model.position.x * -1
			// }

			// this.boxHelper = new THREE.BoxHelper(this.model, 0xff0000);
			// this.boxHelper.position.copy(this.model.position)



			this.params.scene.add(this.model);
			// this.model.add(this.boxHelper)


		});

		this._manager.onLoad = () => {
			enemyCount.eCount = 1
		}
		// this.params.preloader
		// 	.onProgress = (itemUrl, itemsLoaded, itemsTotal) => {
		// 		let loadProc = itemsLoaded / itemsTotal;
		// 		this.loadPercetn = Math.floor(loadProc * 100);

		// 		if (this.loadPercetn == 100) {
		// 			console.log('en')
		// 		}
		// 	}

	}

	// SetupAnimations() {

	// 	if (!this.model) return

	// 	if (this.model.animations) {

	// 		this.model.animations.forEach((clip) => {
	// 			if (clip.name === "open") {
	// 				const action = this.mixer.clipAction(clip);
	// 				action.play();
	// 				action.enabled = false;
	// 				this.action = action
	// 			}
	// 		});
	// 	}

	// 	return
	// }

	Intersects(otherObject) {

		return this.collider.intersectsBox(otherObject);
	}

	GetCharacterAnimation() {

		// this.character.GetDrunckAnimation()
	}

	async GetKeybordOff(state) {


		this.character.GetDetectedColide(state)

		if (!ROOLES.stop_with_interseck) {

			let promise = await new Promise((resolve) => {

				setTimeout(() => {
					this.character.GetDetectedColide(false);
					resolve(false);
				}, 2500)
			});

			return promise
		}
	}

	Update(delta) {
		if (!this.model) {
			return
		}

		// if (this.mixer) {
		// 	this.mixer.update(delta);
		// }

		this.model.position.copy(this.position);

		// if (this.skinnedMesh) {

		// 	this.skinnedMesh.computeBoundingBox()
		// }


		if (this.model.children[0].geometry != null) {

			this.collider.setFromObject(this.model)
		}

		// this.collider.clone(this.bBox)

	}

}

export class WorldManager {

	constructor(params) {

		this.params = params

		this.startGame = false

		/** Меш и box3 персонажа */
		this.player = params.player.GetPlayer()

		params.player ? this.character = params.player : ''

		/** Окружение */
		this.ground = params.ground

		/** Противники */
		this.enemies = this.params.enemies

		/** Скорость игры */
		this.speed = params.speed

		this._objects = []
		this.loadedCounter = 0

		this.onStart = true;
		this.score = 0

		this.enemy = ROOLES.enemy
		// this.sidePosition = [-1.42, 1.42]
		this.startPosition = ROOLES.enemy_startPosition
		this.seporateDistanse = ROOLES.enemy_seporateDistanse

		this.interseck = false

		this.Init()


	}

	Init() {
		this.CreateEnemy()
	}

	GetColliders() {
		return this._objects
	}


	SpawnObj(sPos, idx) {

		let obj = null

		let side = this.getRandom(0, 1)

		let enemi = this.getRandom(0, this.enemies.length - 1)


		obj = new WorldObject(this.params, side, this.character, this.enemies[enemi])

		// obj.openIndex = this.getRandom(1, 10)

		// obj.position.x = this.sidePosition[side];

		obj.position.z = sPos

		// obj.index = idx

		this._objects.push(obj)
	}

	CreateEnemy() {

		if (this.onStart) {

			for (let i = 0; i < this.enemy; i++) {

				this.SpawnObj(this.startPosition + i * this.seporateDistanse, i)
			}

			this.onStart = false

		}


	}

	Update(delta) {

		this.UpdateColliders(delta)
	}

	UpdateColliders(delta) {

		if (this._objects.length === 0) return

		this._objects.forEach((item, key) => {

			/** Останавливаем движение противников если необходимо*/

			if (!this.interseck || !ROOLES.stop_with_interseck) {
				item.position.z -= this.speed
			}

			/** Если есть анимация */

			// if (item.position.z < 5 && item.position.z > 4 && item.action != null && item.openIndex > 3) {

			// 	item.action.reset();
			// 	item.action.timeScale = 1
			// 	item.action.setLoop(THREE.LoopOnce, 1);
			// 	item.action.clampWhenFinished = true;
			// 	item.action.enabled = true;
			// 	item.action.play();

			// 	return
			// }

			if (item.position.z < -3) {

				// item.openIndex = this.getRandom(1, 10)

				let index
				key === 0 ? index = this._objects.length - 1 : index = key - 1

				if (item.action) {

					item.action.reset();
					item.action.clampWhenFinished = true;
					item.action.enabled = false;
				}

				let newPositionZ = this._objects[index].position.z + this.seporateDistanse + this.getRandom(0, ROOLES.enemy_randomSeporateDistanse)
				item.position.z = newPositionZ

				console.log(newPositionZ)

				return

			}

			this.CheckIntersec(item);

			item.Update(delta);
		})

		if (!this.interseck && this.startGame || !ROOLES.stop_with_intersec && this.startGame) {
			this.score += 1
		}

		this._objects = this._objects.filter((item, inx, items) => {

			return item.position.z > -3
		})

	}

	async CheckIntersec(colider) {
		if (!colider) return

		if (this.character.checkIntersec) return

		if (colider.Intersects(this.player)) {

			/** Событие колизии */
			this.interseck = true

			/** для анимаций */

			// if (colider.action) {
			// 	colider.action.paused = false;
			// 	colider.action.timeScale = -1;
			// 	colider.action.setLoop(THREE.LoopOnce);
			// 	colider.action.play();
			// }

			// colider.position.z += 0.1
			// colider.GetCharacterAnimation()

			let as = await colider.GetKeybordOff(true)

			this.interseck = as

			console.log(this.interseck, '1')

		}
	}

	GetScore() {

		this.startGame = this.character.GetStart()
		return this.score
	}

	GetIntersec() {

		// this.ground.getSpeed(this.interseck)

		/** Передаём в компонент */

		return this.interseck
	}

	GetNewSpeed(speed) {

		this.speed = speed

	}

	SetGo(go, speed) {

		this.interseck = go
		this.speed = speed
		this.ground.SetGo(speed)
	}

	getRandom(min, max) {

		min = Math.ceil(min);
		max = Math.floor(max);
		return Math.floor(Math.random() * (max - min + 1)) + min;
	}

}