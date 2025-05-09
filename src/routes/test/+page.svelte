<div class="w-screen h-screen bg-neutral-900">
    <canvas id="myCanvas" width="500" height="500"></canvas>
</div>
<script lang="ts">
    import { onMount } from 'svelte';

    onMount(() => {
        import('$lib/test/main')
    });
</script>