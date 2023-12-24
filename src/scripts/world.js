import * as THREE from "three"
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

class WorldObject {

	constructor(params, side, character, enemi) {

		this.params = params
		this.enemi = enemi

		this.position = new THREE.Vector3(0, 0, 0);
		this.quaternion = new THREE.Quaternion();
		this.collider = new THREE.Box3();

		this.side = side

		this.skinnedMesh = null
		this.action = null
		this.openIndex = null

		this.character = character

		console.log(this.enemi
			, 'in WorldObject')

		this.loadModel(this.params, this.enemi)


	}

	loadModel(params, enemi) {

		this.params = params
		this.enemi = enemi
		this._manager = new THREE.LoadingManager();

		new GLTFLoader(this._manager).load(this.enemi, (gltf) => {

			this.model = gltf.scene;

			this.model.animations = gltf.animations;

			this.model.updateMatrixWorld(true)

			this.model.traverse((child) => {

				if (child.isMesh) {

					child.material.envMap = this.params.environment;
					child.material.envMapIntensity = 3;
					child.material.needsUpdate = true;


					child.frustumCulled = false;
				}

				if (child.isSkinnedMesh) {

					this.skinnedMesh = child
				}

			})

			this.mixer = new THREE.AnimationMixer(this.model);

			this.SetupAnimations()


			this.boxHelper = new THREE.BoxHelper(this.model, 0xff0000);
			this.boxHelper.position.copy(this.model.position)

			this.params.scene.add(this.model);
			this.model.add(this.boxHelper)


		});

	}

	SetupAnimations() {

		if (!this.model) return

		if (this.model.animations) {

			this.model.animations.forEach((clip) => {
				if (clip.name === "open") {
					const action = this.mixer.clipAction(clip);
					action.play();
					action.enabled = false;
					this.action = action
				}
			});
		}

		return
	}

	Intersects(otherObject) {

		return this.collider.intersectsBox(otherObject);
	}

	GetCharacterAnimation() {

		// this.character.GetDrunckAnimation()
	}

	GetKeybordOff() {
		this.character.GetDetectedColide(true)
	}


	Update(delta) {
		if (!this.model) {
			return
		}

		if (this.mixer) {
			this.mixer.update(delta);
		}

		this.model.position.copy(this.position);

		if (this.skinnedMesh) {

			this.skinnedMesh.computeBoundingBox()
		}

		this.collider.setFromObject(this.model)

	}

	Remove() {
		this.model.traverse((child) => {

			if (child.isMesh) {
				child.geometry.dispose();

				if (child.material.map) {
					child.material.map.dispose();

				}
			}

		})
	}

}

export class WorldManager {

	constructor(params) {

		this.params = params

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

		this.onStart = true;
		this.score = 0

		this.enemy = 5
		// this.sidePosition = [-1.42, 1.42]
		this.startPosition = 23
		this.seporateDistanse = 20

		this.interseck = false


	}

	GetColliders() {
		return this._objects
	}


	SpawnObj(sPos, idx) {

		let obj = null

		let side = this.getRandom(0, 1)
		let enemi = this.getRandom(0, this.enemies.length - 1)

		// console.log(enemi, 'SpawnObj')

		obj = new WorldObject(this.params, side, this.character, this.enemies[enemi])

		obj.openIndex = this.getRandom(1, 10)

		// obj.position.x = this.sidePosition[side];

		obj.position.z = sPos

		obj.index = idx

		this._objects.push(obj)
	}

	CreateEnemy(delta) {

		if (this.onStart) {

			for (let i = 0; i < this.enemy; i++) {

				this.SpawnObj(this.startPosition + i * this.seporateDistanse, i)
			}

			this.onStart = false

		}


	}

	Update(delta) {

		this.CreateEnemy(delta)

		this.UpdateColliders(delta)
	}

	UpdateColliders(delta) {


		this._objects.forEach((item, key) => {

			/** Останавливаем движение противников */
			if (!this.interseck) {
				item.position.z -= this.speed
			}

			/** Если есть анимация */

			if (item.position.z < 5 && item.position.z > 4 && item.action != null && item.openIndex > 3) {

				item.action.reset();
				item.action.timeScale = 1
				item.action.setLoop(THREE.LoopOnce, 1);
				item.action.clampWhenFinished = true;
				item.action.enabled = true;
				item.action.play();

				return
			}

			if (item.position.z < -3) {

				item.openIndex = this.getRandom(1, 10)

				let index
				key === 0 ? index = this._objects.length - 1 : index = key - 1

				if (item.action) {

					item.action.reset();
					item.action.clampWhenFinished = true;
					item.action.enabled = false;
				}

				let newPositionZ = this._objects[index].position.z + this.seporateDistanse + this.getRandom(-1, 2)
				item.position.z = newPositionZ

				return

				// console.log(item.position.z)
				// item.Remove()
				// this.params.scene.remove(item.model)
			}


			this.CheckIntersec(item)

			item.Update(delta)
		})

		if (!this.interseck) {
			this.score += 1
		}

		this._objects = this._objects.filter((item, inx, items) => {

			return item.position.z > -3
		})



	}

	CheckIntersec(colider) {
		if (!colider) return

		if (colider.Intersects(this.player)) {

			this.interseck = true

			if (colider.action) {
				colider.action.paused = false;
				colider.action.timeScale = -1;
				colider.action.setLoop(THREE.LoopOnce);
				colider.action.play();
			}

			colider.position.z += 0.1
			colider.GetCharacterAnimation()
			colider.GetKeybordOff(true)

		}
	}

	GetScore() {
		return this.score
	}

	GetIntersec() {
		this.ground.getSpeed(this.interseck)
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