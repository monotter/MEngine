export class Vector2 {
	#x = 0
	#y = 0
	#magnitudeCache?: number
	#unitCache?: Vector2
	#absCache?: Vector2
	#ceilCache?: Vector2
	#floorCache?: Vector2
	#signCache?: Vector2
	#stringCache?: string
	#vec2Float32ArrayCache?: Float32Array
	constructor(x: number = 0, y: number = 0) {
		this.#x = x
		this.#y = y
	}
	static get zero() {
		return new Vector2()
	}
	static get one() {
		return new Vector2(1, 1)
	}
	static get xAxis() {
		return new Vector2(1, 0)
	}
	static get yAxis() {
		return new Vector2(0, 1)
	}
	get X() {
		return this.#x
	}
	get Y() {
		return this.#y
	}
	get Magnitude() {
		if (!this.#magnitudeCache) this.#magnitudeCache = Math.sqrt(this.#x * this.#x + this.#y * this.#y)
		return this.#magnitudeCache
	}
	get Unit() {
		if (!this.#unitCache) {
			const mag = this.Magnitude
			if (mag === 0) this.#unitCache = Vector2.zero
			else this.#unitCache = this.multiply(1 / mag)
		}
		return this.#unitCache
	}
	Cross(other: Vector2Like) {
		const otherVector = Vector2.asVector2(other)
		if (!otherVector) throw new Error('Argument must be a Vector2 or a compatible object')

		return this.X * otherVector.Y - this.Y * otherVector.X
	}
	Abs() {
		if (!this.#absCache) this.#absCache = new Vector2(Math.abs(this.#x), Math.abs(this.#y))
		return this.#absCache
	}
	Ceil() {
		if (!this.#ceilCache) this.#ceilCache = new Vector2(Math.ceil(this.#x), Math.ceil(this.#y))
		return this.#ceilCache
	}
	Floor() {
		if (!this.#floorCache) this.#floorCache = new Vector2(Math.floor(this.#x), Math.floor(this.#y))
		return this.#floorCache
	}
	Sign() {
		if (!this.#signCache) this.#signCache = new Vector2(Math.sign(this.#x), Math.sign(this.#y))
		return this.#signCache
	}
	Angle(other: Vector2Like, isSigned: boolean = false) {
		const otherVector = Vector2.asVector2(other)
		if (!otherVector) throw new Error('Argument must be a Vector2 or a compatible object')
		if (typeof isSigned !== 'boolean') throw new Error('isSigned must be a boolean')

		const dot = this.Dot(otherVector)
		const magA = this.Magnitude
		const magB = otherVector.Magnitude
		const angle = Math.acos(dot / (magA * magB))
		if (isSigned) {
			const cross = this.Cross(otherVector)
			return cross < 0 ? -angle : angle
		}
		return angle
	}
	Dot(other: Vector2Like) {
		const otherVector = Vector2.asVector2(other)
		if (!otherVector) throw new Error('Argument must be a Vector2 or a compatible object')

		return this.#x * otherVector.#x + this.#y * otherVector.#y
	}
	Lerp(other: Vector2Like, alpha: number) {
		const otherVector = Vector2.asVector2(other)
		if (!otherVector) throw new Error('Argument must be a Vector2 or a compatible object')

		return new Vector2(this.#x + (otherVector.#x - this.#x) * alpha, this.#y + (otherVector.#y - this.#y) * alpha)
	}
	Max(...others: Vector2Like[]) {
		if (others.length === 0) throw new Error('At least one argument is required')

		let maxX = this.#x
		let maxY = this.#y
		for (const other of others) {
			const otherVector = Vector2.asVector2(other)
			if (!otherVector) throw new Error('Argument must be a Vector2 or a compatible object')

			maxX = Math.max(maxX, otherVector.#x)
			maxY = Math.max(maxY, otherVector.#y)
		}
		return new Vector2(maxX, maxY)
	}
	Min(...others: Vector2Like[]) {
		if (others.length === 0) throw new Error('At least one argument is required')

		let minX = this.#x
		let minY = this.#y
		for (const other of others) {
			const otherVector = Vector2.asVector2(other)
			if (!otherVector) throw new Error('Argument must be a Vector2 or a compatible object')

			minX = Math.min(minX, otherVector.#x)
			minY = Math.min(minY, otherVector.#y)
		}
		return new Vector2(minX, minY)
	}
	FuzzyEq(other: Vector2Like, epsilon: number) {
		const otherVector = Vector2.asVector2(other)
		if (!otherVector) throw new Error('Argument must be a Vector2 or a compatible object')

		return Math.abs(this.#x - otherVector.#x) < epsilon && Math.abs(this.#y - otherVector.#y) < epsilon
	}
	toString() {
		if (!this.#stringCache) this.#stringCache = `Vector2(${this.#x}, ${this.#y})`
		return this.#stringCache
	}
	add(other: Vector2Like) {
		const otherVector = Vector2.asVector2(other)
		if (!otherVector) throw new Error('Argument must be a Vector2 or a compatible object')

		return new Vector2(this.#x + otherVector.#x, this.#y + otherVector.#y)
	}
	subtract(other: Vector2Like) {
		const otherVector = Vector2.asVector2(other)
		if (!otherVector) throw new Error('Argument must be a Vector2 or a compatible object')

		return new Vector2(this.#x - otherVector.#x, this.#y - otherVector.#y)
	}
	multiply(other: Vector2Like): Vector2
	multiply(scalar: number): Vector2
	multiply(scalar: number | Vector2Like): Vector2 {
		if (typeof scalar === 'number') {
			return new Vector2(this.#x * scalar, this.#y * scalar)
		}
		const scalarVector = Vector2.asVector2(scalar)
		if (!scalarVector) throw new Error('Argument must be a number or an instance of Vector2')
		return new Vector2(this.#x * scalarVector.#x, this.#y * scalarVector.#y)
	}
	divide(other: Vector2Like): Vector2
	divide(scalar: number): Vector2
	divide(scalar: number | Vector2Like): Vector2 {
		if (typeof scalar === 'number') {
			return new Vector2(this.#x / scalar, this.#y / scalar)
		}
		const scalarVector = Vector2.asVector2(scalar)
		if (!scalarVector) throw new Error('Argument must be a number or an instance of Vector2')
		return new Vector2(this.#x / scalarVector.#x, this.#y / scalarVector.#y)
	}

	get vec2Float32Array() {
		if (!this.#vec2Float32ArrayCache) this.#vec2Float32ArrayCache = new Float32Array([this.#x, this.#y])

		return this.#vec2Float32ArrayCache
	}
	static asVector2(V: Vector2Like): Vector2 | false {
		if (V instanceof Vector2) {
			return V
		} else if (typeof V === 'object') {
			let X = 'x' in V ? V.x : 'X' in V ? V.X : (<number[]>V)[0]
			let Y = 'y' in V ? V.y : 'Y' in V ? V.Y : (<number[]>V)[1]
			if (typeof X == 'number' || typeof Y == 'number') {
				X = typeof X == 'number' ? X : 0
				Y = typeof Y == 'number' ? Y : 0
			} else {
				return false
			}
			return new Vector2(X, Y)
		}
		return false
	}
}
