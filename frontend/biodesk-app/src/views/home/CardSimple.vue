<template>
    <div class="card" @click="goToX" style="cursor: pointer;">
            <div>
                <!-- Ícono -->
                <VaIcon :name="props.icon" color="primary" class="corner-icon material-symbols-outlined" size="48px"/>

                <!-- Contenido de la tarjeta -->
                <p class="font-semibold text-3xl"> {{ props.title }} </p>
                <p class="text-card"> {{ props.subtitle }} </p>

                <!-- Triángulo de la esquina-->
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

    // Atajo de navegación
    const router = useRouter()

    function goToX() {
    router.push({ name: props.routeName })
    }

    // Vuestic breakpoint logic

</script>


<style scoped>
    /* Características de la tarjeta */
    .card {
        position: relative;
        display: grid;
        flex-wrap: wrap;
        justify-content: space-around;
        align-items: center;
        text-align: center;
        width: 20vw;
        min-width: 20vw;
        max-width: 25vw;
        height: 20vw;
        min-height: 20vw;
        max-height: 25vw;
        padding: 1%;
        margin: 10px;
        background-color: var(--va-background-light-secondary);
        border: 3px solid var(--va-primary);
        border-radius: 8px;
    }

    @media (min-width: 1420px) {    /* Límite de tamaño de las tarjetas */
        .card {
            width: 300px;
            min-width: 280px;
            max-width: 350px;
            height: 300px;
            min-height: 280px;
            max-height: 350px;
            padding: 10px;
        }
    }

    .card:hover {
        background-color: var(--va-base);
        transition: transform 0.2s;     /* transición del tamaño */
        transform: scale(1.05);
    }

    /* Corner icon */
    .corner-icon {
        position: absolute;
        top: 10px;
        left: 10px;
        color: var(--va-primary);
    }

    .material-symbols-outlined {
        font-variation-settings:
        'FILL' 0,
        'wght' 400,
        'GRAD' 0,
        'opsz' 48
    }

    /* Triángulo de la esquina */
    .triangle {
        width: 50px;
        aspect-ratio: 1;
        clip-path: polygon(0 100%,100% 0,100% 100%);    /* forma */ 
        background-color: var(--va-primary);
        position: absolute;
        bottom: 0;
        right: 0;
    }
</style>
