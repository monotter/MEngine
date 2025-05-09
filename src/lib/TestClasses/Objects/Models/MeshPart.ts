import { Materials } from '../Materials'
import { BasePart } from './BasePart'
import { Meshes } from '../Meshes'
export class MeshPart extends BasePart {
	#MeshURL?: string
	#MaterialURL?: string
	Material: MaterialType
	Mesh: MeshType
	constructor() {
		super('MeshPart')
		this.Material = Materials.PlainMaterial
		this.Mesh = Meshes.Cube;
	}
	get MeshURL() {
		return this.#MeshURL
	}
	set MeshURL(_MeshURL: string | undefined) {
		this.#MeshURL = _MeshURL
	}
	get MaterialURL() {
		return this.#MaterialURL
	}
	set MaterialURL(_MaterialURL: string | undefined) {
		this.#MaterialURL = _MaterialURL
	}
}