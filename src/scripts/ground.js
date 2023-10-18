import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { LoadingManager } from "three";
import * as THREE from 'three'

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
					child.receiveShadow = true
					child.frustumCulled = false;
					child.material.needsUpdate = true

					if (child.material.isMeshStandardMaterial) {

						child.material.envMap = null
					}

				}
			})

			this._params.scene.add(this.model);

			this.model.position.set(
				0, 0, 0
			);


		});

		this._manager.onLoad = () => {
			console.log('ground is loaded')
		}

	}

	Update(delta) {
		if (!this.model) return


		if (this.model.position.z > -18) {
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