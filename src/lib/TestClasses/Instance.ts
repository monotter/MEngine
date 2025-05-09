import { DestroySignal, EmitSignal, Signal } from '$lib/Signal'

export type InstanceProperties = 'Name' | 'Parent'
export class Instance<Properties = InstanceProperties> {
	constructor(readonly className: string) {
		if (className === undefined) throw new Error('ClassName is required')
		this.#Name = className
	}
	// #region Private Properties
	#destroyed = false
	#parent?: Instance<unknown>
	#children = new Map<string, Instance<unknown>>()
	#ancestors: Instance<unknown>[] = []
	#ancestorsPath: string = ''
	#Name: string = ''
	#Attributes: Map<string, any> = new Map()
	#descendants: Instance<unknown>[] = []
	#uniqueId = crypto.randomUUID()
	#propertyChangedSignals = new Map<Properties, Signal<any>>()
	// #endregion

	// #region Private Events
	#AncestryChanged?: Signal<[Instance<unknown>, Instance<unknown> | undefined]>
	#AttributeChanged?: Signal<[string]>
	#ChildAdded?: Signal<[Instance<unknown>]>
	#ChildRemoved?: Signal<[Instance<unknown>]>
	#DescendantAdded?: Signal<[Instance<unknown>]>
	#DescendantRemoving?: Signal<[Instance<unknown>]>
	#Destroying?: Signal<[]>
	// #endregion

	// #region Shared Events
	protected _Changed?: Signal<[Properties]>
	// #endregion

	// #region Private Methods
	#updateAncestors() {
		this.#ancestors = []
		this.#ancestorsPath = this.Name
		if (this.#parent) {
			this.#parent.#updateAncestors()
			this.#ancestorsPath = this.#parent.#ancestorsPath + '.' + this.#ancestorsPath
			this.#ancestors.push(this.#parent)
			this.#ancestors.push(...this.#parent.#ancestors)
		}
	}
	#updateDescendants() {
		this.#descendants = []
		this.#children.forEach((child) => {
			this.#descendants.push(child)
			child.#updateDescendants()
			this.#descendants.push(...child.#descendants)
		})
	}
	#updateAncestorsDescendants() {
		if (this.#parent) {
			this.#parent.#updateDescendants()
			this.#parent.#updateAncestorsDescendants()
		}
	}
	#updateDescendantsAncestors() {
		this.#children.forEach((child) => {
			child.#updateAncestors()
			child.#updateDescendantsAncestors()
		})
	}
	// #endregion

	// #region Public Properties
	set Name(name: string) {
		if (this.#destroyed)
			throw new Error('Instance is destroyed')
		if (typeof name === 'undefined') throw new Error('Name is required')

		this.#Name = name
		this._Changed && EmitSignal(this._Changed, this as any)
	}
	get Name() {
		return this.#Name
	}
	set Parent(parent: Instance<any> | undefined) {
		if (parent && !(parent instanceof Instance)) {
			throw new Error('Parent must be an instance of Instance')
		}
		if (parent && parent === this as any) {
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
			this.#parent.#updateAncestorsDescendants()
			EmitSignal(this.#parent.ChildAdded, this as any)
		}
		this.#updateAncestors()
		this.#updateDescendantsAncestors()
		this._Changed && EmitSignal(this._Changed, 'Parent' as Properties)
		this.#AncestryChanged && EmitSignal(this.#AncestryChanged, this as any, parent)
		this.#ancestors.forEach((ancestor) => {
			ancestor.#DescendantAdded && EmitSignal(ancestor.#DescendantAdded, this as any)
		})
		this.#descendants.forEach((child) => {
			child.#AncestryChanged && EmitSignal(child.#AncestryChanged, this as any, parent)
		})
	}
	get Parent() {
		return this.#parent
	}
	get UniqueId() {
		return this.#uniqueId
	}
	// #endregion

	// #region Public Methods
	GetPropertyChangedSignal(propertyName: Properties) {
		let propertySignal = this.#propertyChangedSignals.get(propertyName)
		if (!propertySignal) {
			propertySignal = new Signal()
			this.Changed.Connect((changedProperty: Properties) => {
				if (changedProperty === propertyName) {
					EmitSignal(propertySignal!)
				}
			})
			this.#propertyChangedSignals.set(propertyName, propertySignal)
		}
		return propertySignal
	}
	ClearAllChildren() {
		this.#descendants.forEach((child) => {
			child.Parent = undefined
			child.Destroy()
		})
		this.#descendants = []
		this.#children.clear()
		this.#updateDescendants()
		this.#updateAncestorsDescendants()
	}
	FindFirstAncestor(name: string) {
		return this.#ancestors.find((child) => child.Name === name) || null
	}
	FindFirstAncestorOfClass(className: string) {
		return this.#ancestors.find((child) => child.className === className) || null
	}
	FindFirstAncestorWhichIsA<T extends Instance<any>>(_class: T) {
		return (this.#ancestors.find((child) => child instanceof (_class as any)) as T) || null
	}
	FindFirstChild(name: string, recursive = false) {
		if (recursive) {
			return this.#descendants.find((child) => child.Name === name) || undefined
		} else {
			for (const child of this.#children.values()) {
				if (child.Name === name) {
					return child
				}
			}
		}
	}
	FindFirstChildOfClass(className: string, recursive = false): Instance<unknown> | undefined {
		if (recursive) {
			return this.#descendants.find((child) => child.className === className)
		} else {
			for (const child of this.#children.values()) {
				if (child.className === className) {
					return child
				}
			}
		}
	}
	FindFirstChildWhichIsA<T extends Instance<any>>(_class: new (...args: any[]) => T, recursive = false): T | null {
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
	FindFirstDescendant(name: string): Instance<unknown> | undefined {
		return this.FindFirstChild(name, true)
	}
	FindFirstDescendantOfClass(className: string): Instance<unknown> | undefined {
		return this.FindFirstChildOfClass(className, true)
	}
	FindFirstDescendantWhichIsA<T extends Instance<any>>(_class: new (...args: any[]) => T): T | null {
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
		return this.#ancestorsPath + this.#Name
	}
	GetTags() {
		throw new Error('GetTags is not implemented')
	}
	HasTag(tag: string) {
		throw new Error('HasTag is not implemented')
	}
	IsAncestorOf(instance: Instance<any>) {
		return instance.#ancestors.includes(this as any)
	}
	IsDescandantOf(instance: Instance<any>) {
		return instance.#descendants.includes(this as any)
	}
	RemoveTag(tag: string) {
		throw new Error('RemoveTag is not implemented')
	}
	WaitForChild<timeout extends number | undefined>(name: string, recursive: boolean = false, timeout?: timeout): Promise<timeout extends number ? Instance<unknown> | undefined : Instance<unknown>> {
		return new Promise((resolve) => {
			const initialChild = this.FindFirstChild(name, recursive)
			if (initialChild) {
				return resolve(initialChild as any)
			}
			const disconnect = this.ChildAdded.Connect((child) => {
				if (child.Name === name) {
					resolve(child as any)
					disconnect()
				}
			})
			if (timeout) {
				setTimeout(() => {
					resolve(undefined as any)
					disconnect()
				}, timeout)
			}
		})
	}
	WaitForChildOfClass<timeout extends number | undefined>(className: string, recursive: boolean = false, timeout?: timeout): Promise<timeout extends number ? Instance<unknown> | undefined : Instance<unknown>> {
		return new Promise((resolve) => {
			const initialChild = this.FindFirstChildOfClass(className, recursive)
			if (initialChild) {
				return resolve(initialChild as any)
			}
			const disconnect = this.ChildAdded.Connect((child) => {
				if (child.className === className) {
					resolve(child as any)
					disconnect()
				}
			})
			if (timeout) {
				setTimeout(() => {
					resolve(undefined as any)
					disconnect()
				}, timeout)
			}
		})
	}
	WaitForChildWhichIsA<timeout extends number | undefined, T extends Instance<unknown>>(_class: new (...args: any[]) => T, recursive: boolean = false, timeout?: timeout): Promise<timeout extends number ? Instance<unknown> | undefined : Instance<unknown>> {
		return new Promise((resolve) => {
			const initialChild = this.FindFirstChildWhichIsA(_class, recursive)
			if (initialChild) {
				return resolve(initialChild as any)
			}
			const disconnect = this.ChildAdded.Connect((child) => {
				if (child instanceof (_class as any)) {
					resolve(child as any)
					disconnect()
				}
			})
			if (timeout) {
				setTimeout(() => {
					resolve(undefined as any)
					disconnect()
				}, timeout)
			}
		})
	}
	Destroy() {
		this.#Destroying && EmitSignal(this.#Destroying)
		this.#descendants.forEach((child) => {
			child.Destroy()
		})
		this.Parent = undefined
		this.#children.clear()

		this._DestroyEvents()
		this.#propertyChangedSignals.forEach((signal) => {
			DestroySignal(signal)
		})
		this.#destroyed = true
	}
	// #endregion

	// #region Shared Methods
	protected _DestroyEvents() {
		this.#AncestryChanged && EmitSignal(this.#AncestryChanged, this as any, undefined)
		this.#AttributeChanged && EmitSignal(this.#AttributeChanged, this as any)
		this.#ChildAdded && EmitSignal(this.#ChildAdded, this as any)
		this.#ChildRemoved && EmitSignal(this.#ChildRemoved, this as any)
		this.#DescendantAdded && EmitSignal(this.#DescendantAdded, this as any)
		this.#DescendantRemoving && EmitSignal(this.#DescendantRemoving, this as any)
		this._Changed && EmitSignal(this._Changed, this as any)
	}
	// #endregion

	// #region Public Events
	get AncestryChanged() {
		if (!this.#AncestryChanged) {
			this.#AncestryChanged = new Signal()
		}
		return this.#AncestryChanged
	}
	get AttributeChanged() {
		if (!this.#AttributeChanged) {
			this.#AttributeChanged = new Signal()
		}
		return this.#AttributeChanged
	}
	get ChildAdded() {
		if (!this.#ChildAdded) {
			this.#ChildAdded = new Signal()
		}
		return this.#ChildAdded
	}
	get ChildRemoved() {
		if (!this.#ChildRemoved) {
			this.#ChildRemoved = new Signal()
		}
		return this.#ChildRemoved
	}
	get DescendantAdded() {
		if (!this.#DescendantAdded) {
			this.#DescendantAdded = new Signal()
		}
		return this.#DescendantAdded
	}
	get DescendantRemoving() {
		if (!this.#DescendantRemoving) {
			this.#DescendantRemoving = new Signal()
		}
		return this.#DescendantRemoving
	}
	get Changed() {
		if (!this._Changed) {
			this._Changed = new Signal()
		}
		return this._Changed
	}
	get Destroying() {
		if (!this.#Destroying) {
			this.#Destroying = new Signal()
		}
		return this.#Destroying
	}
	// #endregion
}