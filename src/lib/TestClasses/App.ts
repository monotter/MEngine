import { updateFunctions } from '$lib/RenderUpdate'
import { Materials } from './Objects/Materials'
import { Renderer } from './Renderer'
import { Scene } from './Scene'

export class App {
	canvas: HTMLCanvasElement
	renderer: Renderer
	scene: Scene
	constructor(canvas: HTMLCanvasElement) {
		this.canvas = canvas
		this.renderer = new Renderer(canvas)
		this.scene = new Scene()
	}
	async Initialize() {
		await this.renderer.Initialize()
		Materials.initialize(this.renderer.device!)
		updateFunctions.set('mainapprun', () => {
			this.run()
		})
	}
	run() {
		this.scene.update()
		this.scene.ObjectMap
		this.scene.VertexData
		this.renderer.render({
			VertexData: this.scene.VertexData,
			ObjectMap: this.scene.ObjectMap,
			View: new Float32Array(this.scene.camera.viewTransform),
		})
	}
}
