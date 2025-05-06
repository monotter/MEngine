import { updateFunctions } from '$lib/RenderUpdate'
import { Quad, Triangle } from './Objects'
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
		updateFunctions.set('mainapprun', () => {
			this.run()
		})
	}
	run() {
		this.scene.update()
		this.scene.quad_count
		this.scene.triangle_count

		this.renderer.render({
			Models: this.scene.object_data,
			ModelCounts: new Map([
				[Triangle, this.scene.triangle_count],
				[Quad, this.scene.quad_count],
			]),
			View: new Float32Array(this.scene.camera.view),
		})
	}
}
