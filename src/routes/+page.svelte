<div class="bg-neutral-900 w-full h-full absolute">
    <canvas class="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full">

    </canvas>
</div>

<script lang="ts">;
    import { onMount } from 'svelte';
    import { App } from '$lib/TestClasses/App';
    

    onMount(async () => {
        const canvas = document.querySelector('canvas') as HTMLCanvasElement;
        const app = new App(canvas);
        await app.Initialize();
        app.run();
    })
</script>