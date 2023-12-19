import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { LoadingManager } from "three";
import * as THREE from "three";

export class Ground {
	constructor(params) {
		this._params = params
		this.speed = params.speed
		this.loadModel(this._params);
	}

	loadModel(params) {
		this.params = params
		this._manager = new LoadingManager();
		new GLTFLoader().load(this.params.model, (gltf) => {
			this.model = gltf.scene;

			this.model.traverse((child) => {

				if (child.isMesh) {

					child.material.envMap = this.params.environment;
					child.material.envMapIntensity = 4.2;
					child.material.needsUpdate = true;

					console.log(child)

					child.receiveShadow = true
					child.castShadow = true
					child.frustumCulled = false;
					child.material.needsUpdate = true


					// if (child.material.isMeshStandardMaterial) {

					// 	child.material.envMap = null
					// }

					// console.log(child.name)
					if (child.name.includes('alpha')) {
						// console.log(child)
						let alphaTexture = new THREE.TextureLoader().load(this.params.alpha)
						let texture = new THREE.TextureLoader().load("textures/tree_all.png")
						child.material.transparent = true;
						alphaTexture.flipY = false;
						texture.flipY = false;
						child.material.emissiveIntensity = 2.5

						child.material.map = texture
						child.material.alphaMap = alphaTexture;

						child.receiveShadow = false
						child.castShadow = false


					}

				}
			})

			this._params.scene.add(this.model);

			this.model.position.set(
				0, 0, 0
			);


		});

		this._manager.onLoad = () => {
			console.log('ground is loaded ')
		}

	}

	Update(delta) {
		if (!this.model) return


		if (this.model.position.z > -72) {
			this.model.position.z -= this.speed
		}
		else {
			this.model.position.z = 0
		}

	}

	getSpeed(stop) {
		stop ? this.speed = 0 : ""
	}

	SetGo(speed) {
		this.speed = speed
	}


}