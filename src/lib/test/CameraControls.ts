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

    constructor(canvas: HTMLCanvasElement) {
        this.canvas = canvas;
        this.updateViewMatrix();

        this.canvas.addEventListener('mousedown', this.onMouseDown.bind(this));
        this.canvas.addEventListener('mousemove', this.onMouseMove.bind(this));
        this.canvas.addEventListener('mouseup', this.onMouseUp.bind(this));
        this.canvas.addEventListener('mouseleave', this.onMouseUp.bind(this)); // Fare tuvaldan ayrılırsa sürüklemeyi durdur
        this.canvas.addEventListener('wheel', this.onWheel.bind(this), { passive: false }); // passive: false, preventDefault için
        this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());
    }

    private onMouseDown(event: MouseEvent) {
        if (event.button === 0 || event.button === 2) { // Sol veya sağ tıklama
            this.isDragging = true;
            this.lastMouseX = event.clientX;
            this.lastMouseY = event.clientY;
            this.canvas.style.cursor = 'grabbing'; // Sürükleme sırasında imleci değiştir
        }
    }

    private onMouseMove(event: MouseEvent) {
        if (!this.isDragging) return;

        const dx = event.clientX - this.lastMouseX;
        const dy = event.clientY - this.lastMouseY;

        this.lastMouseX = event.clientX;
        this.lastMouseY = event.clientY;

        this.phi -= dx * this.sensitivity;
        this.theta -= dy * this.sensitivity;

        this.theta = Math.max(0.01, Math.min(Math.PI - 0.01, this.theta)); // Kutuplarda takla atmayı önle

        this.updateViewMatrix();
    }

    private onMouseUp() {
        if (this.isDragging) {
            this.isDragging = false;
            this.canvas.style.cursor = 'grab'; // Varsayılan imlece geri dön
        }
    }

    private onWheel(event: WheelEvent) {
        event.preventDefault(); // Sayfanın kaymasını önle
        this.radius += event.deltaY * this.zoomSensitivity;
        this.radius = Math.max(1, this.radius); // Hedefin içinden geçmeyi veya negatif yarıçapı önle
        this.updateViewMatrix();
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
