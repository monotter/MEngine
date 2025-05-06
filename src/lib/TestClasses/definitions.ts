import { CFrame } from '$lib/Transformations/CFrame'

export enum objectType {
	Triangle,
	QUAD,
}

export interface RenderData {
	view_transform: CFrame
	projection_transform: CFrame
	object_counts: { [obj in objectType]: number }
}
