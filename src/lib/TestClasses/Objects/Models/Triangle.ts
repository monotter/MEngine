import { TriangleMesh } from '$lib/TestClasses/Objects'
import { BaseModel } from './BaseModel'

export class Triangle extends BaseModel {
	static Mesh = TriangleMesh
	constructor() {
		super('Triangle')
	}
}
