import { createModelMatrix, Vector3 } from '$lib/Transformations'
import { Object3D, type Object3DEvents, type Object3DProperties } from '../Object3D'
import { Mesh } from '../Meshes'
export type BaseModelProperties = Object3DProperties | 'Size'
export type BaseModelEvents = Object3DEvents
export class BaseModel<
	Properties extends string = BaseModelProperties,
	Events extends string = BaseModelEvents
> extends Object3D<BaseModelProperties, BaseModelEvents> {
	#Size: Vector3
	static Mesh: Mesh

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

	get model() {
		return createModelMatrix(this.CFrame, this.Size)
	}
}
