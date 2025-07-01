<template>
    <div class="card" style="cursor: pointer" @click="toggleOptions(); changeArrow()">
        <!-- Ícono -->
        <VaIcon :name="icon" color="primary" class="corner-icon material-symbols-outlined" size="48px"/>

        <!-- Título y subtítulo con animación de slide-out -->
        <transition name="fade" mode="out-in">
            <div v-if="!showOptions" key="main-content" class="main-content">
            <p class="font-semibold text-3xl">{{ props.title }}</p>
            <p class="text-card"> {{ props.subtitle }} </p>

            </div>
        </transition>

        <!-- Menú de opciones con animación de slide-in -->
        <transition name="slide-fade-right" mode="out-in">
            <div v-if="showOptions" key="options-content" class="options-content">
                <p class="text-card italic back-title"> Regresar al título... </p>
                <p v-if="props.option1" class="text-card font-semibold italic option" style="cursor: pointer" @click="goToX()"> {{ props.option1 }} </p>
                <p v-if="props.option2" class="text-card font-semibold italic option" style="cursor: pointer" @click="goToY()"> {{ props.option2 }} </p>
                <p v-if="props.option3" class="text-card font-semibold italic option" style="cursor: pointer" @click="goToZ()"> {{ props.option3 }} </p>
            </div>
        </transition>

        <!-- Triángulo de la esquina -->
        <div class="triangle"></div>

        <!-- Flecha -->
        <transition name="fade" mode="out-in">
            <VaIcon v-if="showOptions" name="arrow_back" color="base" size="32px" class="material-symbols-outlined arrow"/>
        </transition>
    </div>
</template>


<script setup lang="ts">
    import { useRouter } from 'vue-router'
    import { ref, defineProps } from 'vue'

    const props = defineProps<{
        title?: string
        icon?: string
        subtitle?: string
        option1?: string
        routeName1?: string
        option2?: string
        routeName2?: string
        option3?: string
        routeName3?: string
    }>()

    //      Desplegar el menú
    const showOptions = ref(false)

    function toggleOptions() {
    showOptions.value = !showOptions.value
    }
    
    //      Atajos de navegación
    const router = useRouter()

    function goToX() {
    router.push({ name: props.routeName1 })
    }
    function goToY() {
        router.push({ name: props.routeName2 })
    }
    function goToZ() {
    router.push({ name: props.routeName3 })
    }

    const arrow = ref(true)
    function changeArrow() {
        arrow.value = !arrow.value
    }
</script>


<style>
    /*      Características de la tarjeta       */

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
        transition: transform 0.2s;
    }

    @media (min-width: 1420px) {    /* límite de tamaño de la tarjeta */
        .card {
            width: 280px;
            min-width: 280px;
            max-width: 300px;
            height: 280px;
            min-height: 280px;
            max-height: 300px;
            padding: 10px
        }
    }

    .card:hover {
        background-color: var(--va-base);
        transform: scale(1.05);
    }

    .card:active {
        filter: brightness(0.92);
        background-color: var(--va-background-border);
        transition: filter 0.1s, background-color 0.1s;
        transform: scale(0.97)      /* encojer */
    }

    .text-card {
        font-size: 1.1rem;
        text-align: center;
    }

    .corner-icon {      /* ícono de la esquina */
        position: absolute;
        top: 10px;
        left: 10px;
        color: var(--va-primary);
    }

    .material-symbols-outlined {        /* ajustes de Google Fonts para los íconos */
        font-variation-settings:
        'FILL' 0,
        'wght' 400,
        'GRAD' 0,
        'opsz' 48
    }

    .triangle {     /* triángulo de la esquina */
        width: 50px;
        aspect-ratio: 1;
        clip-path: polygon(0 100%,100% 0,100% 100%);    /* forma */
        background-color: var(--va-primary);
        position: absolute;
        bottom: 0;
        right: 0;
    }

    /*      Contenido de la tarjeta      */

    .main-content, .options-content {
        position: absolute;
        width: 100%;
        display: flex;
        flex-direction: column;
    }

    .options-content {
        width: 130%;
        display: flex;
        flex-direction: column;
        align-items: center;    /* centra el bloque de opciones horizontalmente */
        justify-content: center;
        position: relative;
    }

    .options-content > * {
        text-align: left;       /* alinea cada opción a la izquierda */
        width: 100%;            /* cada "hijo" toma el ancho completo para la alineación */
        min-width: 50%;
        max-width: 220px;       /* límite de ancho */
    }

    .back-title {     /* regresar al título */
        color: var(--va-secondary);
    }

    .option:hover {
        color: var(--va-primary);
    }


    /*      Flecha      */

    .arrow {        /* posición */
        position: absolute;
        bottom: -2px;
        right: -2px;
    }

    /*    Animaciones para el contenido de las tarjetas   */

    /* Aparecer/Desvanecer */
    .fade-enter-active, .fade-leave-active {
        transition: opacity 0.3s;
    }
    .fade-enter-from, .fade-leave-to {
        opacity: 0;
    }

    /* Deslizar hacia la izquierda */
    .slide-fade-left-enter-active,
    .slide-fade-left-leave-active {
    transition: all 0.5s cubic-bezier(0.23, 1, 0.32, 1);
    }
    .slide-fade-left-enter-from,
    .slide-fade-left-leave-to {
    opacity: 0;
    transform: translateX(0);
    }
    .slide-fade-left-leave-active {
    position: absolute;
    width: 100%;
    }
    .slide-fade-left-leave-to {
    transform: translateX(-80px);
    opacity: 0;
    }

    /* Deslizar hacia la derecha */
    .slide-fade-right-enter-active,
    .slide-fade-right-leave-active {
    transition: all 0.5s cubic-bezier(0.23, 1, 0.32, 1);
    }
    .slide-fade-right-enter-from {
    opacity: 0;
    transform: translateX(80px);
    }
    .slide-fade-right-leave-to {
    opacity: 0;
    transform: translateX(80px);
    }
    .slide-fade-right-leave-active {
    position: absolute;
    width: 100%;
    }
</style>
