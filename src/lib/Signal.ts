import type { Instance } from './TestClasses/Instance'

export type disconnectFunction = () => void
export class Signal<T extends any[]> {
	#destroyed = false
	private connections: Map<string, (...args: T) => void> = new Map()
	connect(func: (...args: T) => void): disconnectFunction {
		if (this.#destroyed) {
			throw new Error('Signal has been destroyed')
		}
		const ConnectionId = crypto.randomUUID()
		this.connections.set(ConnectionId, func)
		return () => {
			this.connections.delete(ConnectionId)
		}
	}
	emit(...args: T) {
		if (this.#destroyed) {
			throw new Error('Signal has been destroyed')
		}
		this.connections.forEach((func) => {
			func(...args)
		})
	}

	once(func: (...args: T) => void): disconnectFunction {
		if (this.#destroyed) {
			throw new Error('Signal has been destroyed')
		}
		let disconnect: disconnectFunction
		disconnect = this.connect((...args) => {
			func(...args)
			disconnect()
		})
		return disconnect
	}
	wait(Timeout?: number): Promise<T | undefined> {
		if (this.#destroyed) {
			throw new Error('Signal has been destroyed')
		}
		return new Promise((resolve) => {
			const disconnect = this.once((...args) => resolve(args as T))
			if (Timeout) {
				setTimeout(() => {
					resolve(undefined)
					disconnect()
				}, Timeout)
			}
		})
	}
	destroy() {
		this.connections.clear()
	}
}
