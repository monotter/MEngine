import { QuadMesh } from '$lib/TestClasses/Objects'
import { BaseModel } from './BaseModel'

export class Quad extends BaseModel {
	static Mesh = QuadMesh
	constructor() {
		super('Quad')
	}
}
