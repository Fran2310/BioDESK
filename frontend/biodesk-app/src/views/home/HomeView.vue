<template class="home">
  <h1 class="font-bold text-5xl"> Home </h1>

  <BannerHome
    v-for="(content, idx) in banner"
    :key="idx"
    :labName="content.labName"
    :role="content.role"
  />
  
  <div class="card-container">
    <CardSimple
      v-for="(content, idx) in simpleCards"
      :key="idx"
      :title="content.title"
      :icon="content.icon"
      :subtitle="content.subtitle"
      :routeName="content.routeName"
    />

    <CardComplex 
      v-for="(content, idx) in complexCard"
      :key="idx"
      :title="content.title"
      :icon="content.icon"
      :option1="content.option1"
      :routeName1="content.routeName1"
      :option2="content.option2"
      :routeName2="content.routeName2"
      :option3="content.option3"
      :routeName3="content.routeName3"
    />
  </div>
</template>


<script setup lang="ts">
  import { ref } from 'vue'
  // import { useLabStore } from '@/stores/labStore';
  import CardSimple from './CardSimple.vue'
  import CardComplex from './CardComplex.vue'
  import BannerHome from './BannerHome.vue'
  
  /* const labStore = useLabStore();
  const lab = {
    id: 29,
    name: "jaja",
    status: "active",
    rif: "j987654321",
    logoPath: ""
  }
  labStore.setCurrentLab(lab); */

  // Contenido del banner
  const banner = ref([
    {
      labName: 'Laboratorio de Pruebas',
      role: 'Biologista'
    }
  ])

  // Contenido para las tarjetas simples
  const simpleCards = ref([
    {   // Tarjeta al dashboard
      title: 'Dashboard',
      icon: 'developer_board',
      subtitle: 'Ir al dashboard',
      routeName: ''
    },
    {   // Tarjeta a usuarios
      title: 'Usuarios',
      icon: 'account_circle',
      subtitle: 'Ir a usuarios',
      routeName: 'UsersView'
    },
    {   // Tarjeta al catálogo del laboratorio
      title: 'Laboratorio',
      icon: 'biotech',
      subtitle: 'Ir al catálogo del laboratorio',
      routeName: ''
    }
  ])

  // Contenido para la tarjeta a datos de pacientes
  const complexCard = ref([
    {
      title: 'Datos de pacientes',
      icon: 'assignment_ind',
      option1: 'Pacientes',
      routeName1: '',
      option2: 'Historial médico',
      routeName2: '',
      option3: 'Solicitud de pruebas',
      routeName3: ''
    }
  ])
</script>


<style>
  .home {
    display: flex;
    flex-direction: column;
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
