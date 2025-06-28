<template>
    <div class="card">
            <div>
                <!-- Ícono -->
                <VaIcon :name="icon" color="primary" class="corner-icon material-symbols-outlined" size="48px"/>
                
                <!-- Título -->
                <p class="font-semibold text-3xl" style="cursor: pointer"  @click="toggleOptions"> {{ props.title }} </p>

                <!-- Menú desplegable -->
                <div class="menu">
                    <div class="arrow-hide" style="cursor: pointer" :class="showOptions ? 'arrow-show' : 'arrow-hide'" @click="toggleOptions"/>

                    <transition enter-active-class="slideup-anim" leave-active-class="slidedown-anim">
                        <div class="options">
                            <div class="slideup-anim slidedown-anim" v-if="!showOptions">
                                <p class="text-card italic" style="cursor: pointer" @click="toggleOptions"> Mostrar más... </p>
                            </div>
                            
                            <div class="slideup-anim slidedown-anim" v-if="showOptions">
                                <p class="text-card italic" style="cursor: pointer" v-if="showOptions" @click="toggleOptions"> Mostrar menos... </p>
                                <p class="text-card font-semibold" style="cursor: pointer" @click="goToX"> · {{ props.option1 }} </p>
                                <p class="text-card font-semibold" style="cursor: pointer" @click="goToY"> · {{ props.option2}} </p>
                                <p class="text-card font-semibold" style="cursor: pointer" @click="goToZ"> · {{ props.option3 }} </p>
                            </div>
                        </div>
                    </transition>
                </div>
                
                <!-- Triángulo de la esquina -->
                <div class="triangle"></div>
            </div>
        </div>
</template>


<script setup lang="ts">
    import { useRouter } from 'vue-router'
    import { ref, defineProps } from 'vue'

    const props = defineProps<{
        title?: string
        icon?: string
        option1?: string
        routeName1?: string
        option2?: string
        routeName2?: string
        option3?: string
        routeName3?: string
    }>()

    // Desplegar el menú
    const showOptions = ref(false)

    function toggleOptions() {
    showOptions.value = !showOptions.value
    }
    
    // Atajos de navegación
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
</script>


<style>
    /* Contenido básico de la tarjeta */
    .card {     /* características */
        position: relative;
        display: grid;
        flex-wrap: wrap;
        justify-content: space-around;
        align-items: center;
        text-align: center;
        max-width: 15vw;    /* 300px */
        max-height: 15vw;   /* 280px */
        padding: 1%;
        margin: 10px;
        background-color: var(--va-background-light-secondary);
        border: 3px solid var(--va-primary);
        border-radius: 8px;
    }

    .card:hover {
        background-color: var(--va-base);
        transform: scale(1.05);
        transition: transform 0.2s;
    }

    /* Tamaño para tablets */
    @media (max-width: 1024px) {
        .card {
            width: 20vw;
            height: 20vh;
            min-width: 220px;
            min-height: 180px;
            margin: 5px;
        }
    }

    /* Tamaño para móviles */
    @media (max-width: 425px) {
        .card {
            width: 10vw;
            height: 5vh;
            min-width: 150px;
            min-height: 120px;
            padding: 5px;
        }
    }

    .corner-icon {      /* ícono */
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

    .triangle {     /* triángulo de la esquina */
        width: 50px;
        aspect-ratio: 1;
        clip-path: polygon(0 100%,100% 0,100% 100%);    /* forma */
        background-color: var(--va-primary);
        position: absolute;
        bottom: 0;
        right: 0;
    }

    /* Deployable menu content  */
    .menu {
        display: flex;
        gap: 8px;
        justify-content: center;
    }

    /* Flecha del menú */
    .arrow-hide {
        height: 25px;
        aspect-ratio: 1/2;
        clip-path: polygon(0 0,100% 50%,0 100%);    /* forma */
        background-color: var(--va-primary);
        transition: transform 0.5s ease;    /* regresar a su orientación original */
    }

    .arrow-show {       /* rotar la flecha */
        transform: rotate(90deg);
        transition: transform 0.5s ease;
    }

    /* Opciones del menú */
    .options {
        justify-items: left;
    }

    .text-card {
        font-size: 1.1rem;
        text-align: center;
    }

    .text-card.italic {     /* mostrar más/menos */
        color: var(--va-secondary);
    }

    /* Animación de salida */
    @keyframes slideDown {
        from {
            opacity: 1;
            transform: translateY(0px);
        }
        to {
            opacity: 0;
            transform: translateY(40px);
        }
    }

    .slidedown-anim {
        animation: slideDown 1s cubic-bezier(0.23, 1, 0.32, 1);
    }

    /* Animación de entrada */
    @keyframes slideUp {
        from {
            opacity: 0;
            transform: translateY(40px);
        }
        to {
            opacity: 1;
            transform: translateY(0px);
        }
    }

    .slideup-anim {
        animation: slideUp 1s cubic-bezier(0.23, 1, 0.32, 1);
    }
</style>
