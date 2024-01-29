import * as THREE from "three";
import { gsap } from "gsap";
import { ROOLES } from "@/scripts/rooles.js";


export class SpriteElement {

    constructor(options) {
        this.options = options
        this.score = 0
        this.lives = ROOLES.life
        this.sprite
        this.pause = false
        this.hideStartBtn = new THREE.Vector3(0, 0, 0)

        this._createSptite(this.options)
    }


    get currentScore() {
        return this.score
    }

    set currentScore(value) {
        return this.score = value
    }

    get currentLives() {
        return this.lives
    }

    set currentLives(value) {
        return this.lives = value
    }

    get currentSprite() {
        return this.sprite
    }


    _createSptite(options) {

        this.options = options

        this.back = new Image(this.options.width, this.options.height)
        this.back.src = this.options.back

        const canvas = document.createElement("canvas");
        canvas.width = this.options.width;
        canvas.height = this.options.height;

        this.ctx = canvas.getContext("2d");
        this.texture = new THREE.CanvasTexture(canvas);

        this.ctx.drawImage(this.back, 0, 0, this.options.width, this.options.height);

        if (this.options.name == 'score') {
            this.ctx.fillStyle = this.options.color;
            this.ctx.font = "bold 20px sans-serif";
            this.ctx.fillText(`Очки: ${this.score}`, 30, 52);
            this.ctx.fillText(`Жизни: ${this.lives}`, 45, 92);
        }

        this.texture.needsUpdate = true;

        let material = new THREE.SpriteMaterial({ map: this.texture });
        const sprite = new THREE.Sprite(material);

        sprite.center.set(0.5, 0.5);
        sprite.scale.set(this.options.width, this.options.height, 1);
        sprite.name = this.options.name

        this.sprite = sprite

    }

    _Update() {

        this.ctx.drawImage(this.back, 0, 0, this.options.width, this.options.height);

        if (this.options.name == 'score') {
            this.ctx.fillStyle = this.options.color;
            this.ctx.font = "bold 20px sans-serif";
            this.ctx.fillText(`Очки: ${this.score}`, 30, 52);
            this.ctx.fillText(`Жизни: ${this.lives}`, 45, 92);
            this.texture.needsUpdate = true;
            return
        }


        if (this.options.name == 'pause') {

            if (this.pause) {
                this.back.src = this.options.toggleBack
                this.ctx.drawImage(this.back, 0, 0, this.options.width, this.options.height);
                this.texture.needsUpdate = true;
                return

            }

            this.back.src = this.options.back
            this.ctx.drawImage(this.back, 0, 0, this.options.width, this.options.height);
            this.texture.needsUpdate = true;
            return
        }

        this.texture.needsUpdate = true;
    }

    _hideBtn() {

        gsap.to(this.sprite.scale, {
            duration: 0.2,
            ...this.hideStartBtn
        })
    }

    _togleBtn() {
        this.pause = !this.pause

        let click_1 = new THREE.Vector3(this.options.width * 0.8, this.options.height * 0.8, 1)
        let click_2 = new THREE.Vector3(this.options.width, this.options.height, 1)
        let tl = gsap.timeline();

        tl.fromTo(this.sprite.scale, { ...click_2 }, { ...click_1, duration: 0.15 }).to(this.sprite.scale, { ...click_2, duration: 0.15 })

        // this.sprite.scale.set()
    }

    _getPositions(params) {

        this.params = params

        const width = window.innerWidth / 2;
        const height = window.innerHeight / 2;

        switch (this.params.name) {


            case "start":
                this.params.element.position.set(0, 0, 1);
                break;

            case "pause":
                this.params.element.position.set(-width * 0.7, height * 0.4, 1);
                break;

            case "score":
                this.params.element.position.set(-width * 0.7, height * 0.7, 1);
                break;
        }
    }

} 