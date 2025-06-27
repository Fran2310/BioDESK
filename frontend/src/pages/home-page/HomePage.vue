<template class="home-page">
    <h1 class="font-bold text-5xl"> Home </h1>

    <BannerHome :labName="lab" :role="employee"/>

    <div class="card-container">
        <CardSimple :title="cardDash" :icon="screen" :subtitle="cardSubDash" :routeName="routeDash"/> <!-- Dashboard card -->
        <CardSimple :title="cardUsers" :icon="person" :subtitle="cardSubUsers" :routeName="routeUsers"/> <!-- Users card -->
        <CardComplex 
            :title="cardPatients" :icon="person"
            :option1="element1" :routeName1="route1"
            :option2="element2" :routeName2="route2"
            :option3="element3" :routeName3="route3"
        /> <!-- Patients data card -->
        <CardSimple :title="cardLab" :icon="screen" :subtitle="cardSubLab" :routeName="routeLab"/> <!-- Catalog lab card -->
    </div>
</template>


<script setup lang="ts">
    import { ref } from 'vue'
    import CardSimple from './CardSimple.vue'
    import CardComplex from './CardComplex.vue'
    import BannerHome from './BannerHome.vue'

    // Props for banner
    const lab = ref('Laboratorio de Pruebas')
    const employee = ref('Biologista')

    // Props for icons
    const screen = ref('vuestic-iconset-dashboard')
    const person = ref('vuestic-iconset-user')

    // Props for simple cards
    const cardDash = ref('Dashboard')
    const cardSubDash = ref('Ir al dashboard')
    const routeDash = ref('dashboard')

    const cardUsers = ref('Usuarios')
    const cardSubUsers = ref('Ir a usuarios')
    const routeUsers = ref('users')

    const cardLab = ref('Laboratorio')
    const cardSubLab = ref('Ir al catálogo del laboratorio')
    const routeLab = ref('laboratory-catalog')

    // Props for complex card
    const cardPatients = ref('Datos de pacientes')
    const iconPatients = ref('')

    const element1 = ref('Pacientes')
    const route1 = ref('patients')

    const element2 = ref('Historial médico')
    const route2 = ref('med-history')

    const element3 = ref('Solicitud de pruebas')
    const route3 = ref('test-req')
</script>


<style>
    .home-page {
        display: flex;
        flex-direction: row;
        align-items: center;
        padding: 30px;
        gap: 20px;
    }
    
    .card-container {
        display: flex;
        margin-top: 5px;
        gap: 20px;
        justify-content: center;
    }
</style>
