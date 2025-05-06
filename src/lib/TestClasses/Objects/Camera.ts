import { Vector3, createViewMatrix } from '$lib/Transformations'
import { Object3D } from './Object3D'

export class Camera extends Object3D {
	moveSpeed: number = 0.5
	moveDirection: Vector3 = new Vector3()
	constructor() {
		super('Camera')
	}
	get view() {
		return createViewMatrix(this.CFrame)
	}
}
