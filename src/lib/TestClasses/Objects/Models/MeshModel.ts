import { QuadMesh } from '$lib/TestClasses/Objects'
import { BaseModel } from './BaseModel'

export class MeshModel extends BaseModel {
	static Mesh = QuadMesh
	constructor(url: string) {
		super('MeshModel')
	}
}
