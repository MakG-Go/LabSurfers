import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { areaTextureCount } from "@/scripts/areas.js";

import store from "@/store/index.js"

import * as THREE from "three";


export class Ground {
	constructor(params) {
		this.params = params
		this.speed = params.speed
		this.loadModel(this.params);

		console.log(store)
	}

	loadModel(params) {
		this.params = params
		this.textureLoader = new THREE.TextureLoader()


		new GLTFLoader(this.params.preloader).load(this.params.model, (gltf) => {
			this.model = gltf.scene;

			this.model.traverse((child) => {

				if (child.isMesh) {

					child.material.envMap = this.params.environment;
					child.material.envMapIntensity = 4.2;
					child.material.needsUpdate = true;

					child.receiveShadow = true
					child.castShadow = true
					child.frustumCulled = false;
					child.material.needsUpdate = true


					if (child.name.includes('alpha')) {

						let alphaTexture = this.textureLoader.load(this.params.alpha,
							() => {
								areaTextureCount.tCount = 1
							}
						)
						let texture = this.textureLoader.load(this.params.diffuse,
							() => {
								areaTextureCount.tCount = 1
							}
						)

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



			this.params.scene.add(this.model);
			this.model.position.set(
				0, 0, 0
			);




		});


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

		// stop ? this.speed = 0 : ""
	}

	SetGo(speed) {

		// console.log(speed, 'SetGo')
		this.speed = speed
	}


}