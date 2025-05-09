import { createModelMatrix, Vector3 } from '$lib/Transformations'
import { Object3D, type Object3DProperties } from '../Object3D'
export type BasePartProperties = Object3DProperties | 'Size'
export class BasePart<Properties = BasePartProperties> extends Object3D<Properties> {
	#Size: Vector3

	constructor(className: string) {
		super(className)
		this.#Size = new Vector3(1, 1, 1)
	}
	get Size() {
		return this.#Size
	}
	set Size(_Size: Vector3Like) {
		const Size = Vector3.asVector3(_Size)
		if (!Size) throw new Error('Size must be a valid Vector3')
		this.#Size = Size
	}

	get modelTransform() {
		return createModelMatrix(this.CFrame, this.Size)
	}
}
