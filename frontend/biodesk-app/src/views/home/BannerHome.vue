<template>
    <div class="flex justify-center banner">
        <Logo/>
        
        <!-- Línea vertical -->
        <div class="vl"></div>

        <div class="lab-details">
            <p class="text-5xl text-details"> {{ props.labName }} </p> <!-- Nombre del lab -->

            <p class="text-3xl text-details"> {{ props.role }} </p> <!-- Rol del usuario -->
        </div>
    </div>
</template>


<script setup lang="ts">
    import { defineProps } from 'vue'
    import Logo from '../../components/Logo.vue'

    const props = defineProps<{
        labName?: string
        role?: string
    }>()
</script>


<style>
    .banner {
        display: flex;
        flex-direction: row;
        height: 10em;
        margin-top: 5vh;
        margin-bottom: 12vh;
        align-items: center;
        justify-content: center;
        justify-items: center;
    }

    .vl { /* Línea vertical */
        height: 10em;
        border-left: 6px solid var(--va-primary);
        margin-left: 30px;
        margin-right: 40px;
    }

    .lab-details {
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: left;
        gap: 3vh;
    }

    .text-details {
        color: var(--va-primary);
        justify-items: left;
    }
</style>
