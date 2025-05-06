import { Signal } from '$lib/Signal'
export type InstanceProperties = 'Name' | 'Parent'
export type InstanceEvents =
	| 'AnchestryChanged'
	| 'AttributeChanged'
	| 'ChildAdded'
	| 'ChildRemoved'
	| 'DescendantAdded'
	| 'DescendantRemoving'
	| 'Changed'
	| 'Destroying'
export class Instance<Properties extends string = InstanceProperties, Events extends string = InstanceEvents> {
	#destroyed = false
	#parent: Instance | null = null
	#children = new Map<string, Instance>()
	#anchestors: Instance[] = []
	#fullName: string = ''
	#Attributes: Map<string, any> = new Map()
	#updateAnchestors() {
		this.#anchestors = []
		this.#fullName = this.Name
		if (this.#parent) {
			this.#parent.#updateAnchestors()
			this.#fullName = this.#parent.#fullName + '.' + this.#fullName
			this.#anchestors.push(this.#parent)
			this.#anchestors.push(...this.#parent.#anchestors)
		}
	}
	#descendants: Instance[] = []
	#updateDescendants() {
		this.#descendants = []
		this.#children.forEach((child) => {
			this.#descendants.push(child)
			child.#updateDescendants()
			this.#descendants.push(...child.#descendants)
		})
	}
	#updateAnchestorsDescendants() {
		if (this.#parent) {
			this.#parent.#updateDescendants()
			this.#parent.#updateAnchestorsDescendants()
		}
	}
	#updateDescendantsAnchestors() {
		this.#children.forEach((child) => {
			child.#updateAnchestors()
			child.#updateDescendantsAnchestors()
		})
	}
	#uniqueId = crypto.randomUUID()
	Name: string
	protected _Events = {
		AnchestryChanged: new Signal<[Instance, Instance | null]>(),
		AttributeChanged: new Signal<[string]>(),
		ChildAdded: new Signal<[Instance]>(),
		ChildRemoved: new Signal<[Instance]>(),
		DescendantAdded: new Signal<[Instance]>(),
		DescendantRemoving: new Signal<[Instance]>(),
		Changed: new Signal<[Properties[number]]>(),
		Destroying: new Signal<[]>(),
	}
	get Events() {
		const copy = { ...this._Events }
		return copy
	}
	constructor(readonly className: string) {
		if (className === undefined) throw new Error('ClassName is required')
		this.Name = className
	}
	set Parent(parent: Instance | null) {
		if (parent === this) {
			throw new Error('Cannot set parent to itself')
		}
		if (this.#destroyed) {
			throw new Error('Instance is destroyed')
		}
		if (this.#parent) this.#parent.#children.delete(this.#uniqueId)

		this.#parent = parent
		if (this.#parent) {
			this.#parent.#children.set(this.#uniqueId, this as any)
			this.#parent.#updateDescendants()
			this.#parent.#updateAnchestorsDescendants()
			this.#parent._Events.ChildAdded.emit(this as any)
		}
		this.#updateAnchestors()
		this.#updateDescendantsAnchestors()
		this._Events.Changed.emit('Parent')
		this._Events.AnchestryChanged.emit(this as any, parent)
		this.#anchestors.forEach((anchestor) => {
			anchestor._Events.DescendantAdded.emit(this as any)
		})
		this.#descendants.forEach((child) => {
			child._Events.DescendantAdded.emit(this as any)
		})
	}
	get Parent() {
		return this.#parent
	}
	get UniqueId() {
		return this.#uniqueId
	}
	#propertyChangedSignals = new Set<Signal<any>>()
	GetPropertyChangedSignal(propertyName: Properties) {
		const propertySignal = new Signal()
		this.Events.Changed.connect((changedProperty) => {
			if (changedProperty === propertyName) {
				propertySignal.emit()
			}
		})
		this.#propertyChangedSignals.add(propertySignal)
		return propertySignal
	}
	ClearAllChildren() {
		this.#children.forEach((child) => {
			child.#parent = null
		})
		this.#children.clear()
		this.#updateDescendants()
		this.#updateAnchestorsDescendants()
	}
	FindFirstAnchestor(name: string) {
		return this.#anchestors.find((child) => child.Name === name) || null
	}
	FindFirstAnchestorOfClass(className: string) {
		return this.#anchestors.find((child) => child.className === className) || null
	}
	FindFirstAnchestorWhichIsA<T extends Instance>(_class: T) {
		return (this.#anchestors.find((child) => child instanceof (_class as any)) as T) || null
	}
	FindFirstChild(name: string, recursive = false): Instance | null {
		if (recursive) {
			return this.#descendants.find((child) => child.Name === name) || null
		} else {
			let child = null
			for (const child of this.#children.values()) {
				if (child.Name === name) {
					return child
				}
			}
			return child
		}
	}
	FindFirstChildOfClass(className: string, recursive = false): Instance | null {
		if (recursive) {
			return this.#descendants.find((child) => child.className === className) || null
		} else {
			let child = null
			for (const child of this.#children.values()) {
				if (child.className === className) {
					return child
				}
			}
			return child
		}
	}
	FindFirstChildWhichIsA<T extends Instance>(_class: T, recursive = false): T | null {
		if (recursive) {
			return (this.#descendants.find((child) => child instanceof (_class as any)) as T) || null
		} else {
			let child = null
			for (const child of this.#children.values()) {
				if (child instanceof (_class as any)) {
					return child as T
				}
			}
			return child
		}
	}
	FindFirstDescendant(name: string): Instance | null {
		return this.FindFirstChild(name, true)
	}
	FindFirstDescendantOfClass(className: string): Instance | null {
		return this.FindFirstChildOfClass(className, true)
	}
	FindFirstDescendantWhichIsA<T extends Instance>(_class: T): T | null {
		return this.FindFirstChildWhichIsA(_class, true)
	}
	GetAttribute<T>(name: string): T | undefined {
		return this.#Attributes.get(name)
	}
	SetAttribute(name: string, value: any) {
		this.#Attributes.set(name, value)
	}
	GetAttributes() {
		return new Map(this.#Attributes)
	}
	GetChildren() {
		return Array.from(this.#children.values())
	}
	GetDescendants() {
		return [...this.#descendants]
	}
	GetFullName() {
		return this.#fullName
	}
	GetTags() {
		throw new Error('GetTags is not implemented')
	}
	HasTag(tag: string) {
		throw new Error('HasTag is not implemented')
	}
	IsAnchestorOf(instance: Instance) {
		return instance.#anchestors.includes(this)
	}
	IsDescandantOf(instance: Instance) {
		return instance.#descendants.includes(this)
	}
	RemoveTag(tag: string) {
		throw new Error('RemoveTag is not implemented')
	}
	WaitForChild(name: string, timeout?: number): Promise<Instance | undefined> {
		return new Promise((resolve) => {
			this.Events.ChildAdded.connect((child) => {
				if (child.Name === name) {
					resolve(child)
				}
			})
		})
	}
	Destroy() {
		this._Events.Destroying.emit()
		this.#descendants.forEach((child) => {
			child.Destroy()
		})
		this.Parent = null
		this.#children.clear()
		for (const key in this._Events) {
			const signal = this._Events[key as keyof typeof this._Events]
			signal.destroy()
		}
		for (const signal of this.#propertyChangedSignals) {
			signal.destroy()
		}
		this.#destroyed = true
	}
}
