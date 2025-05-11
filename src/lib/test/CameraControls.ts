import { mat4, vec3 } from 'gl-matrix';

export class CameraControls {
    private canvas: HTMLCanvasElement;
    private viewMatrix: mat4 = mat4.create();
    private phi: number = Math.PI / 2; // Y etrafındaki açı (azimut)
    private theta: number = Math.PI / 2; // Y'den açı (kutupsal/yükseklik)
    private radius: number = 10; // Hedefden uzaklık
    private target: vec3 = vec3.fromValues(0, 0, 0);

    private isDragging: boolean = false;
    private lastMouseX: number = 0;
    private lastMouseY: number = 0;

    private sensitivity: number = 0.008; // Fare hassasiyeti düşürüldü
    private zoomSensitivity: number = 0.05; // Yakınlaştırma hassasiyeti düşürüldü

    private pressedKeys: Set<string> = new Set();
    private movementSpeed: number = 0.1; // Speed for W,A,S,D movement
    private panSpeed: number = 0.1; // Speed for Q,E movement (vertical)

    constructor(canvas: HTMLCanvasElement) {
        this.canvas = canvas;
        this.updateViewMatrix();
        this.canvas.addEventListener('mousedown', this.onMouseDown.bind(this));
        this.canvas.addEventListener('mousemove', this.onMouseMove.bind(this));
        this.canvas.addEventListener('mouseup', this.onMouseUp.bind(this));
        this.canvas.addEventListener('mouseleave', this.onMouseUp.bind(this)); // Fare tuvaldan ayrılırsa sürüklemeyi durdur
        this.canvas.addEventListener('wheel', this.onWheel.bind(this), { passive: false }); // passive: false, preventDefault için
        this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());

        // Add keyboard listeners to the document to capture keys globally
        document.addEventListener('keydown', this.onKeyDown.bind(this));
        document.addEventListener('keyup', this.onKeyUp.bind(this));

        // Add pointer lock listeners
        document.addEventListener('pointerlockchange', this.onPointerLockChange.bind(this), false);
        document.addEventListener('pointerlockerror', this.onPointerLockError.bind(this), false);
    }

    private onPointerLockChange() {
        if (document.pointerLockElement === this.canvas) {
            this.isDragging = true;
            this.canvas.style.cursor = 'none'; // Hide cursor
        } else {
            this.isDragging = false;
            this.canvas.style.cursor = 'grab'; // Show cursor
        }
    }

    private onPointerLockError(event: Event) {
        console.error('Pointer Lock Error:', event);
    }

    private onMouseDown(event: MouseEvent) {
        if (event.button === 0) { // Sol tıklama
            this.canvas.requestPointerLock();
        } else if (event.button === 2) { // Sağ tıklama (mevcut sürükleme davranışı için)
            this.isDragging = true;
            this.lastMouseX = event.clientX;
            this.lastMouseY = event.clientY;
            this.canvas.style.cursor = 'grabbing';
        }
    }

    private onMouseMove(event: MouseEvent) {
        if (!this.isDragging) return;

        let dx: number;
        let dy: number;

        if (document.pointerLockElement === this.canvas) {
            dx = event.movementX;
            dy = event.movementY;
        } else {
            // Fallback for non-pointer lock dragging (e.g., right-click drag)
            dx = event.clientX - this.lastMouseX;
            dy = event.clientY - this.lastMouseY;
            this.lastMouseX = event.clientX;
            this.lastMouseY = event.clientY;
        }

        this.phi -= dx * this.sensitivity;
        this.theta -= dy * this.sensitivity;

        this.theta = Math.max(0.01, Math.min(Math.PI - 0.01, this.theta)); // Kutuplarda takla atmayı önle

        this.updateViewMatrix();
    }

    private onMouseUp(event: MouseEvent) { // Added event parameter
        // For non-pointer lock dragging (e.g. right-click)
        if (event.button === 2 && this.isDragging && document.pointerLockElement !== this.canvas) {
            this.isDragging = false;
            this.canvas.style.cursor = 'grab';
        }
        // Pointer lock is handled by onPointerLockChange
    }

    private onWheel(event: WheelEvent) {
        event.preventDefault(); // Sayfanın kaymasını önle
        this.radius += event.deltaY * this.zoomSensitivity;
        this.radius = Math.max(1, this.radius); // Hedefin içinden geçmeyi veya negatif yarıçapı önle
        this.updateViewMatrix();
    }

    private onKeyDown(event: KeyboardEvent): void {
        this.pressedKeys.add(event.key.toLowerCase());
    }

    private onKeyUp(event: KeyboardEvent): void {
        this.pressedKeys.delete(event.key.toLowerCase());
    }

    public update(): void {
        let moved = false;
        const tempTarget = vec3.clone(this.target);

        // Calculate camera's XZ orientation based on phi (yaw)
        const cosPhi = Math.cos(this.phi);
        const sinPhi = Math.sin(this.phi);

        // W/S: Move target forward/backward relative to camera's XZ orientation
        if (this.pressedKeys.has('w')) {
            tempTarget[0] -= sinPhi * this.movementSpeed; // Move target in camera's local -Z direction
            tempTarget[2] -= cosPhi * this.movementSpeed;
            moved = true;
        }
        if (this.pressedKeys.has('s')) {
            tempTarget[0] += sinPhi * this.movementSpeed; // Move target in camera's local +Z direction
            tempTarget[2] += cosPhi * this.movementSpeed;
            moved = true;
        }
        // A/D: Move target left/right relative to camera's XZ orientation
        if (this.pressedKeys.has('a')) {
            tempTarget[0] -= cosPhi * this.movementSpeed; // Move target in camera's local -X direction
            tempTarget[2] += sinPhi * this.movementSpeed;
            moved = true;
        }
        if (this.pressedKeys.has('d')) {
            tempTarget[0] += cosPhi * this.movementSpeed; // Move target in camera's local +X direction
            tempTarget[2] -= sinPhi * this.movementSpeed;
            moved = true;
        }
        // E/Q: Move target up/down
        if (this.pressedKeys.has('e')) { // E for up
            tempTarget[1] += this.panSpeed;
            moved = true;
        }
        if (this.pressedKeys.has('q')) { // Q for down
            tempTarget[1] -= this.panSpeed;
            moved = true;
        }

        if (moved) {
            this.target = tempTarget;
            this.updateViewMatrix();
        }
    }

    private updateViewMatrix() {
        // Küresel koordinatlardan Kartezyen koordinatlara
        const x = this.target[0] + this.radius * Math.sin(this.theta) * Math.sin(this.phi);
        const y = this.target[1] + this.radius * Math.cos(this.theta);
        const z = this.target[2] + this.radius * Math.sin(this.theta) * Math.cos(this.phi);
        const eye = vec3.fromValues(x, y, z);

        mat4.lookAt(this.viewMatrix, eye, this.target, vec3.fromValues(0, 1, 0)); // Y yukarı
    }

    public getViewMatrix(): mat4 {
        return this.viewMatrix;
    }

    public setInitialPosition(radius: number, phi: number, theta: number, target: vec3 = vec3.fromValues(0,0,0)) {
        this.radius = radius;
        this.phi = phi;
        this.theta = theta;
        this.target = target;
        this.updateViewMatrix();
        // Başlangıç imlecini ayarla
        this.canvas.style.cursor = 'grab';
    }
}
