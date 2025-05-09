<canvas id="myCanvas" width="500" height="500"></canvas>

<script lang="ts">
    import { onMount } from 'svelte';

    onMount(() => {
        import('$lib/test')
    });
</script>