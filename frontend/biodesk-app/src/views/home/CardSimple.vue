<template>
    <div class="card" @click="goToX" style="cursor: pointer;">
            <div>
                <!-- Corner icon -->
                <VaIcon :name="icon" color="primary" class="corner-icon material-symbols-outlined" size="48px"/>

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


<style scoped>
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
        background-color: var(--va-background-light-secondary);
        border: 3px solid var(--va-primary);
        border-radius: 8px;
    }

    .card:hover {
        background-color: var(--va-base);
        transition: transform 0.2s; /* Size transition */
        transform: scale(1.05);
    }

    /* Corner icon */
    .corner-icon {
        position: absolute;
        top: 10px;
        left: 10px;
        color: var(--va-primary);
    }

    /* Corner triangle */
    .triangle {
        width: 50px;
        aspect-ratio: 1;
        clip-path: polygon(0 100%,100% 0,100% 100%); /* Shape */ 
        background-color: var(--va-primary);
        position: absolute;
        bottom: 0;
        right: 0;
    }
</style>
