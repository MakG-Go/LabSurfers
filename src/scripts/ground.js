import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { areaTextureCount } from "@/scripts/areas.js";

import store from "@/store/index.js"

import * as THREE from "three";


export class Ground {
	constructor(params) {
		this.params = params
		this.speed = params.speed
		this.loadModel(this.params);
	}

	loadModel(params) {
		this.params = params

		this.textureLoader = new THREE.TextureLoader(this.params.textureLoad)

		new GLTFLoader(this.params.preloader).load(this.params.model, (gltf) => {
			this.model = gltf.scene;

			this.model.traverse((child) => {

				if (child.isMesh) {

					child.material.envMap = this.params.environment;
					child.material.envMapIntensity = 4;
					child.receiveShadow = true
					child.userData.originalColor = child.material.color.clone();

					// child.castShadow = true
					child.frustumCulled = false;
					// child.material.needsUpdate = true
					// child.material = new THREE.MeshToonMaterial({
					// 	color: child.userData.originalColor
					// });

					if (child.name.includes('Stratch')) {

						child.castShadow = true
					}

					if (child.name.includes('alpha')) {

						let alphaTexture = this.textureLoader.load(this.params.alpha)
						let texture = this.textureLoader.load(this.params.diffuse)

						// console.log(this.params.diffuse)

						alphaTexture.flipY = false;
						texture.flipY = false;
						// child.material.emissiveIntensity = 2.5

						child.material.map = texture
						child.material.alphaMap = alphaTexture;
						child.material.transparent = true;

						// child.receiveShadow = false
						// child.castShadow = false


					}

				}
			})


			this.params.scene.add(this.model);
			this.model.position.set(
				0, 0, 0
			);

		});


	}

	Update() {
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

		this.speed = speed
	}


}