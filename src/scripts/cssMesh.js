import { ROOLES } from "@/scripts/rooles.js";
import * as THREE from "three";

import { CSS3DObject } from 'three/addons/renderers/CSS3DRenderer.js';

export class CssMesh {
    constructor(options) {
        this.options = options
        this.score = 0
        this.live = 0
        this.elem
    }

    get compliteMash() {

        const mesh = new THREE.Object3D()

        let cssobject = this.makeElementObject(this.options)

        cssobject.position.copy(this.options.position)
        cssobject.rotation.copy(this.options.rotation)

        mesh.add(cssobject)

        return mesh
    }

    get curretLive() {

        return this.live
    }

    set curretLive(value) {

        // this.live = value
        // document.querySelector('.js-live').innerHTML = value
        if (document.querySelector('.js-live') != null) {
            document.querySelector('.js-live').innerHTML = `Жизни: ${value}`
        }

    }

    get curentScore() {

        return this.score
    }

    set curentScore(value) {

        document.querySelector('.js-score').innerHTML = `Очки: ${value}`
    }

    makeElementObject(options) {

        this.options = options
        this.element = this.createHtmlElement(this.options)
        console.log(this.element)

        const obj = new THREE.Object3D

        let css3dObject = new CSS3DObject(this.element);
        obj.css3dObject = css3dObject
        // css3dObject.scale.set(0.01, 0.01, 0.01)
        css3dObject.scale.set(1, 1, 1)
        obj.add(css3dObject)

        let material = new THREE.MeshPhongMaterial({
            // transparent: true,
            opacity: 0,
            color: new THREE.Color(0x111111),
            blending: THREE.NoBlending,
            // side: THREE.DoubleSide,
        });
        let geometry = new THREE.PlaneGeometry(this.options.width, this.options.height);
        let mesh = new THREE.Mesh(geometry, material);

        mesh.name = this.options.name
        obj.lightShadowMesh = mesh
        obj.rotation.y = Math.PI
        obj.add(mesh);

        return obj
    }

    createHtmlElement(options) {
        this.options = options
        let innerHtml

        if (this.options.name) {
            innerHtml = this.options.name
        }
        else {
            innerHtml = `
            <p class="score_number js-score">Очки: ${this.curentScore}</p>
            <p class="score_number js-live">Жизни: ${this.curretLive}</p>
            `
        }

        const element = document.createElement(this.options.type);
        element.innerHTML = `${innerHtml}`;
        element.classList.add(this.options.class)
        // element.style.width = `${this.options.width * 100}px`;
        // element.style.height = `${this.options.height * 100}px`;
        element.style.width = `${this.options.width}px`;
        element.style.height = `${this.options.height}px`;
        element.style.opacity = 1;
        element.style.boxSizing = 'border-box'

        return element

    }



}
