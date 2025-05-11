<div class="w-screen h-screen bg-neutral-900">
    <canvas id="myCanvas" class="w-full h-full"></canvas>
</div>
<script lang="ts">
    import { onMount } from 'svelte';

    onMount(() => {
        import('$lib/test/main')
    });
</script>