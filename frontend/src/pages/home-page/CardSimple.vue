<template>
    <div class="card" @click="goToX" style="cursor: pointer;">
            <div>
                <!-- Corner icon -->
                <div :class="['va-icon', 'vuestic-iconset', props.icon, 'upper-iconset']"></div>

                <!-- Card content -->
                <p class="font-semibold text-3xl"> {{ props.title }} </p>
                <p class="text-card"> {{ props.subtitle }} </p>
                
                <!-- Corner triangle-->
                <div class="triangle"></div>
            </div>
        </div>
</template>


<script setup lang="ts">
    import { useRouter } from 'vue-router'
    import { defineProps } from 'vue'

    const props = defineProps<{
        title?: string
        icon?: string
        subtitle?: string
        routeName?: string
    }>()

    // Navigation shortcuts
    const router = useRouter()

    function goToX() {
    router.push({ name: props.routeName })
    }
</script>


<style>
    /* Card characteristics */
    .card {
        position: relative;
        display: grid;
        flex-wrap: wrap;
        justify-content: space-around;
        align-items: center;
        text-align: center;
        width: 280px;
        height: 280px;
        padding: 15px;
        margin: 10px;
        background-color: var(--va-eleven);
        border: 3px solid var(--va-five);
        border-radius: 8px;
    }

    .card:hover {
        background-color: var(--va-nineteen);
        transition: transform 0.2s; /* Size transition */
        transform: scale(1.05);
    }

    /* Corner icon */
    .upper-iconset {
        position: absolute;
        top: 10px;
        left: 10px;
        color: var(--va-fifteen);
        font-size: 300%;
    }

    /* Corner triangle */
    .triangle {
        width: 50px;
        aspect-ratio: 1;
        clip-path: polygon(0 100%,100% 0,100% 100%); /* Shape */ 
        background-color: var(--va-five);
        position: absolute;
        bottom: 0;
        right: 0;
    }
</style>
