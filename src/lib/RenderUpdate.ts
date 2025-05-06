import { browser } from "$app/environment";

export const updateFunctions: Map<any, (deltaTime: number) => void> = new Map();

const CurrentId = crypto.randomUUID()
if (browser) {
    (window as any).MENGINECURRENTANIMATIONID = CurrentId
    function animate() {
        let lastTime = performance.now();
        requestAnimationFrame(() => {
            if (window instanceof Window) {
                if ((window as any).MENGINECURRENTANIMATIONID !== CurrentId) { return }
            }
            updateFunctions.forEach((value, key) => {
                try {
                    const dt = (performance.now() - lastTime) / 1000;
                    lastTime = performance.now()
                    value(dt)
                } catch (e) {
                    console.error(e)
                }
            })
            animate();
        })
    }
    animate();
}

