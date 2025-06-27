<template>
    <div class="card">
            <div>
                <!-- Corner icon -->
                <VaIcon :name="icon" color="primary" class="corner-icon material-symbols-outlined" size="48px"/>
                
                <!-- Title -->
                <p class="font-semibold text-3xl" style="cursor: pointer"  @click="toggleOptions"> {{ props.title }} </p>
                
                <!-- Deployable menu -->
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
                
                <!-- Corner triangle -->
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

    // Submenu
    const showOptions = ref(false)

    function toggleOptions() {
    showOptions.value = !showOptions.value
    }
    
    // Navigation shortcuts
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
    /* Basic card content */
    .card { /* characteristics */
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
        transition: transform 0.2s;
    }

    .card:hover {
        background-color: var(--va-base);
        transform: scale(1.05);
    }

    .corner-icon { /* corner icon */
        position: absolute;
        top: 10px;
        left: 10px;
        color: var(--va-primary);
    }

    .triangle { /* corner triangle */
        width: 50px;
        aspect-ratio: 1;
        clip-path: polygon(0 100%,100% 0,100% 100%); /* shape */
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

    /* Arrows */
    .arrow-hide {
        height: 25px;
        aspect-ratio: 1/2;
        clip-path: polygon(0 0,100% 50%,0 100%); /* shape */
        background-color: var(--va-primary);
        transition: transform 0.5s ease; /* go to original orientation */
    }

    .arrow-show { /* rotate the arrow */
        transform: rotate(90deg);
        transition: transform 0.5s ease;
    }

    /* Text options */
    .options {
        justify-items: left;
    }

    .text-card {
        font-size: 1.1rem;
        text-align: center;
    }

    .text-card.italic { /* show more/less */
        color: var(--va-secondary);
    }

    /* Slide animation for the options */
    @keyframes slideDown {
        from {
            opacity: 1;
            transform: translateY(0px);
        }
        to {
            opacity: 0;
            transform: translateY(50px);
        }
    }

    .slidedown-anim {
        animation: slideDown 2s cubic-bezier(0.23, 1, 0.32, 1);
    }

    @keyframes slideUp {
        from {
            opacity: 0;
            transform: translateY(50px);
        }
        to {
            opacity: 1;
            transform: translateY(0px);
        }
    }

    .slideup-anim {
        animation: slideUp 2s cubic-bezier(0.23, 1, 0.32, 1);
    }
</style>
