<template>
    <div class="flex justify-center banner">
        <BiodeskLogo class="logo"/>
        
        <!-- Vertical line -->
        <div class="vl"></div>

        <div class="lab-details">
            <p class="text-5xl text-details"> {{ props.labName }} </p> <!-- Lab name -->

            <p class="text-3xl text-details"> {{ props.role }} </p> <!-- User role -->
        </div>
    </div>
</template>


<script setup lang="ts">
    import { defineProps } from 'vue'
    import BiodeskLogo from '../../components/Biodesk-logo.vue';

    const props = defineProps<{
        labName?: string
        role?: string
    }>()
</script>


<style>
    .banner {
        height: 9em;
        margin-top: 30px;
        margin-bottom: 100px;
        justify-content: center;
    }

    .vl { /* Vertical line */
        margin-left: 30px;
        border-left: 6px solid var(--va-five);
        height: 130px;
    }

    .lab-details {
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: left;
        margin-left: 30px;
        gap: 20px;
    }

    .text-details {
        color: var(--va-five);
        justify-items: left;
    }
</style>
