import * as Enums from '$lib/Enums'

export class Vector3 {
	#x = 0
	#y = 0
	#z = 0
	#magnitudeCache?: number
	#unitCache?: Vector3
	#absCache?: Vector3
	#ceilCache?: Vector3
	#floorCache?: Vector3
	#signCache?: Vector3
	#stringCache?: string
	#arrayCache?: [number, number, number]
	constructor(x = 0, y = 0, z = 0) {
		this.#x = x
		this.#y = y
		this.#z = z
	}
	static FromNormalId(normal: Enums.NormalId) {
		if (!(normal in Enums.NormalId)) throw new Error('Invalid NormalId')

		switch (normal) {
			case Enums.NormalId.Right:
				return new Vector3(1, 0, 0)
			case Enums.NormalId.Top:
				return new Vector3(0, 1, 0)
			case Enums.NormalId.Back:
				return new Vector3(0, 0, -1)
			case Enums.NormalId.Left:
				return new Vector3(-1, 0, 0)
			case Enums.NormalId.Bottom:
				return new Vector3(0, -1, 0)
			case Enums.NormalId.Front:
				return new Vector3(0, 0, 1)
		}
	}
	static FromAxis(axis: Enums.Axis) {
		if (!(axis in Enums.Axis)) throw new Error('Invalid Axis')
		switch (axis) {
			case Enums.Axis.X:
				return new Vector3(1, 0, 0)
			case Enums.Axis.Y:
				return new Vector3(0, 1, 0)
			case Enums.Axis.Z:
				return new Vector3(0, 0, 1)
		}
	}

	static get zero() {
		return new Vector3(0, 0, 0)
	}
	static get one() {
		return new Vector3(1, 1, 1)
	}
	static get xAxis() {
		return new Vector3(1, 0, 0)
	}
	static get yAxis() {
		return new Vector3(0, 1, 0)
	}
	static get zAxis() {
		return new Vector3(0, 0, 1)
	}
	get X() {
		return this.#x
	}
	get Y() {
		return this.#y
	}
	get Z() {
		return this.#z
	}
	get Magnitude() {
		if (!this.#magnitudeCache)
			this.#magnitudeCache = Math.sqrt(this.#x * this.#x + this.#y * this.#y + this.#z * this.#z)
		return this.#magnitudeCache
	}
	get Unit() {
		if (!this.#unitCache) {
			const mag = this.Magnitude
			if (mag === 0) this.#unitCache = Vector3.zero
			else this.#unitCache = this.multiply(1 / mag)
		}
		return this.#unitCache
	}
	Abs() {
		if (!this.#absCache) this.#absCache = new Vector3(Math.abs(this.#x), Math.abs(this.#y), Math.abs(this.#z))
		return this.#absCache
	}
	Ceil() {
		if (!this.#ceilCache) this.#ceilCache = new Vector3(Math.ceil(this.#x), Math.ceil(this.#y), Math.ceil(this.#z))
		return this.#ceilCache
	}
	Floor() {
		if (!this.#floorCache)
			this.#floorCache = new Vector3(Math.floor(this.#x), Math.floor(this.#y), Math.floor(this.#z))
		return this.#floorCache
	}
	Sign() {
		if (!this.#signCache) this.#signCache = new Vector3(Math.sign(this.#x), Math.sign(this.#y), Math.sign(this.#z))
		return this.#signCache
	}
	Cross(other: Vector3Like) {
		const otherVector = Vector3.asVector3(other)
		if (!otherVector) throw new Error('Argument must be an instance of Vector3 or a compatible object')

		return new Vector3(
			this.#y * otherVector.#z - this.#z * otherVector.#y,
			this.#z * otherVector.#x - this.#x * otherVector.#z,
			this.#x * otherVector.#y - this.#y * otherVector.#x
		)
	}
	Angle(other: Vector3Like, axis: Vector3Like) {
		const otherVector = Vector3.asVector3(other)
		const axisVector = Vector3.asVector3(axis)
		if (!otherVector) throw new Error('Argument must be an instance of Vector3 or a compatible object')
		if (!axisVector) throw new Error('Argument must be an instance of Vector3 or a compatible object')

		const dot = this.Dot(otherVector)
		const magA = this.Magnitude
		const magB = axisVector.Magnitude
		const angle = Math.acos(dot / (magA * magB))
		return angle
	}
	Dot(other: Vector3Like) {
		const otherVector = Vector3.asVector3(other)
		if (!otherVector) throw new Error('Argument must be an instance of Vector3 or a compatible object')

		return this.#x * otherVector.#x + this.#y * otherVector.#y + this.#z * otherVector.#z
	}
	FuzzyEq(other: Vector3Like, epsilon: number) {
		const otherVector = Vector3.asVector3(other)
		if (!otherVector) throw new Error('Argument must be an instance of Vector3 or a compatible object')

		return (
			Math.abs(this.#x - otherVector.#x) < epsilon &&
			Math.abs(this.#y - otherVector.#y) < epsilon &&
			Math.abs(this.#z - otherVector.#z) < epsilon
		)
	}
	Lerp(other: Vector3Like, alpha: number) {
		const otherVector = Vector3.asVector3(other)
		if (!otherVector) throw new Error('Argument must be an instance of Vector3 or a compatible object')

		return new Vector3(
			this.#x + (otherVector.#x - this.#x) * alpha,
			this.#y + (otherVector.#y - this.#y) * alpha,
			this.#z + (otherVector.#z - this.#z) * alpha
		)
	}
	Max(...others: Vector3Like[]) {
		if (others.length === 0) throw new Error('At least one argument is required')

		let maxX = this.#x
		let maxY = this.#y
		let maxZ = this.#z
		for (const other of others) {
			const otherVector = Vector3.asVector3(other)
			if (!otherVector) throw new Error('Argument must be an instance of Vector3 or a compatible object')

			maxX = Math.max(maxX, otherVector.#x)
			maxY = Math.max(maxY, otherVector.#y)
			maxZ = Math.max(maxZ, otherVector.#z)
		}
		return new Vector3(maxX, maxY, maxZ)
	}
	Min(...others: Vector3Like[]) {
		if (others.length === 0) throw new Error('At least one argument is required')

		let minX = this.#x
		let minY = this.#y
		let minZ = this.#z
		for (const other of others) {
			const otherVector = Vector3.asVector3(other)
			if (!otherVector) throw new Error('Argument must be an instance of Vector3 or a compatible object')

			minX = Math.min(minX, otherVector.#x)
			minY = Math.min(minY, otherVector.#y)
			minZ = Math.min(minZ, otherVector.#z)
		}
		return new Vector3(minX, minY, minZ)
	}
	toString() {
		if (!this.#stringCache) this.#stringCache = `Vector3(${this.#x}, ${this.#y}, ${this.#z})`
		return this.#stringCache
	}
	add(other: Vector3Like) {
		const otherVector = Vector3.asVector3(other)
		if (!otherVector) throw new Error('Argument must be an instance of Vector3 or a compatible object')

		return new Vector3(this.#x + otherVector.#x, this.#y + otherVector.#y, this.#z + otherVector.#z)
	}
	subtract(other: Vector3Like) {
		const otherVector = Vector3.asVector3(other)
		if (!otherVector) throw new Error('Argument must be an instance of Vector3 or a compatible object')

		return new Vector3(this.#x - otherVector.#x, this.#y - otherVector.#y, this.#z - otherVector.#z)
	}
	multiply(other: Vector3Like): Vector3
	multiply(scalar: number): Vector3
	multiply(scalar: number | Vector3Like): Vector3 {
		if (typeof scalar === 'number') {
			return new Vector3(this.#x * scalar, this.#y * scalar, this.#z * scalar)
		}
		const scalarVector = Vector3.asVector3(scalar)
		if (!scalarVector) throw new Error('Argument must be a number or an instance of Vector3')

		return new Vector3(this.#x * scalarVector.#x, this.#y * scalarVector.#y, this.#z * scalarVector.#z)
	}
	divide(other: Vector3Like): Vector3
	divide(scalar: number): Vector3
	divide(scalar: number | Vector3Like): Vector3 {
		if (typeof scalar === 'number') {
			return new Vector3(this.#x / scalar, this.#y / scalar, this.#z / scalar)
		}
		const scalarVector = Vector3.asVector3(scalar)
		if (!scalarVector) throw new Error('Argument must be a number or an instance of Vector3')
		return new Vector3(this.#x / scalarVector.#x, this.#y / scalarVector.#y, this.#z / scalarVector.#z)
	}
	floorDivide(other: Vector3Like): Vector3
	floorDivide(scalar: number): Vector3
	floorDivide(scalar: number | Vector3Like): Vector3 {
		if (typeof scalar === 'number') {
			return new Vector3(Math.floor(this.#x / scalar), Math.floor(this.#y / scalar), Math.floor(this.#z / scalar))
		}

		const scalarVector = Vector3.asVector3(scalar)
		if (!scalarVector) throw new Error('Argument must be a number or an instance of Vector3')
		return new Vector3(
			Math.floor(this.#x / scalarVector.#x),
			Math.floor(this.#y / scalarVector.#y),
			Math.floor(this.#z / scalarVector.#z)
		)
	}

	toArray() {
		if (!this.#arrayCache) this.#arrayCache = [this.#x, this.#y, this.#z]

		return this.#arrayCache
	}
	static asVector3(V: Vector3Like): Vector3 | false {
		if (V instanceof Vector3) {
			return V
		} else if (typeof V === 'object') {
			let X = 'x' in V ? V.x : 'X' in V ? V.X : (<number[]>V)[0]
			let Y = 'y' in V ? V.y : 'Y' in V ? V.Y : (<number[]>V)[1]
			let Z = 'z' in V ? V.z : 'Z' in V ? V.Z : (<number[]>V)[2]
			if (typeof X == 'number' || typeof Y == 'number' || typeof Z == 'number') {
				X = typeof X == 'number' ? X : 0
				Y = typeof Y == 'number' ? Y : 0
				Z = typeof Z == 'number' ? Z : 0
			} else {
				return false
			}
			return new Vector3(X, Y, Z)
		}
		return false
	}
}
