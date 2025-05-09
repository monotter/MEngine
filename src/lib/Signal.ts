type Emitter<T extends any[] = any[]> = (...args: T) => void
const Emitters = new Map<Signal, Emitter>()
const Destroyers = new Map<Signal, () => void>()

export function DestroySignal(signal: Signal) {
	const destroyer = Destroyers.get(signal)
	if (destroyer) {
		destroyer()
		Destroyers.delete(signal)
		Emitters.delete(signal)
	}
}
export function EmitSignal<T extends any[]>(signal: Signal<T>, ...args: T) {
	const emitter = Emitters.get(signal)
	if (emitter) {
		emitter(...args)
	}
}
export type disconnectFunction = () => void
export class Signal<T extends any[] = any[]> {
	#destroyed = false
	private connections: Map<string, (...args: T) => void> = new Map()
	#signalId = crypto.randomUUID()
	constructor() {
		Destroyers.set(this, this.#destroy)
		Emitters.set(this, this.#emit)
	}
	Connect(func: (...args: T) => void): disconnectFunction {
		if (this.#destroyed) {
			throw new Error('Signal has been destroyed')
		}
		const ConnectionId = crypto.randomUUID()
		this.connections.set(ConnectionId, func)
		return () => {
			this.connections.delete(ConnectionId)
		}
	}

	Once(func: (...args: T) => void): disconnectFunction {
		if (this.#destroyed) {
			throw new Error('Signal has been destroyed')
		}
		let disconnect: disconnectFunction
		disconnect = this.Connect((...args) => {
			func(...args)
			disconnect()
		})
		return disconnect
	}
	Wait(Timeout?: number): Promise<T | undefined> {
		if (this.#destroyed) {
			throw new Error('Signal has been destroyed')
		}
		return new Promise((resolve) => {
			const disconnect = this.Once((...args) => resolve(args as T))
			if (Timeout) {
				setTimeout(() => {
					resolve(undefined)
					disconnect()
				}, Timeout)
			}
		})
	}
	#emit(...args: T) {
		if (this.#destroyed) {
			throw new Error('Signal has been destroyed')
		}
		this.connections.forEach((func) => {
			func(...args)
		})
	}
	#destroy() {
		this.connections.clear()
	}
}
