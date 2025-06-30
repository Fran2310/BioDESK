<template class="home">
  <h1 class="font-bold text-5xl"> Home </h1>

  <BannerHome
    v-for="(content, idx) in banner"
    :key="idx"
    :labName="content.labName"
    :role="content.role ? content.role.charAt(0).toUpperCase() + content.role.slice(1) : ''"
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
  import { ref, onMounted } from 'vue'
  import { useLabStore } from '@/stores/labStore'
  import { userApi } from '@/services/api'
  import CardSimple from './CardSimple.vue'
  import CardComplex from './CardComplex.vue'
  import BannerHome from './BannerHome.vue'
import { GetWithPermissionsQuerys } from '@/services/interfaces/global'

  // Contenido del banner
  const labStore = useLabStore();
  const banner = ref([
    {
      labName: '',
      role: ''
    }
  ])

  onMounted(async () => {
    banner.value[0].labName = labStore.currentLab.name    // asigna el valor de lab para el banner

    // Conseguir el rol del usuario
    try {
      const { data } = await userApi.getMe();
      const query:GetWithPermissionsQuerys = {
        'search-fields': ['email'],
        'search-term': data.email,
        offset: 0,
        limit: 1,
        includePermissions: false
      };

      const response = await userApi.getUsersMix(query)
      console.log('Response: ', response.data)
      const user = response.data.data[0];
 
      console.log('User:', user)
      banner.value[0].role = user?.labUser.role?.role || 'Rol desconocido';   // asigna el valor del rol para el banner
    } catch (error) {
      banner.value[0].role = 'Rol desconocido';
    }
  })

  // Contenido para las tarjetas simples
  const simpleCards = ref([
    {   // Tarjeta al dashboard
      title: 'Dashboard',
      icon: 'dashboard',
      subtitle: 'Ir al dashboard',
      routeName: 'Dashboard'
    },
    {   // Tarjeta a pacientes
      title: 'Pacientes',
      icon: 'healing',
      subtitle: 'Ir a los pacientes',
      routeName: 'Patients'
    },
  ])

  // Contenido para la tarjeta a datos de pacientes
  const complexCard = ref([
    {
      title: 'Sistema',
      icon: 'group',
      option1: 'Usuarios',
      routeName1: 'UsersView',
      option2: 'Roles',
      routeName2: 'RoleManagement',
      option3: '',
      routeName3: ''
    },
    {
      title: 'Exámenes',
      icon: 'troubleshoot',
      option1: 'Exámenes',
      routeName1: 'Exams',
      option2: 'Catálogo',
      routeName2: 'LaboratoryCatalog',
      option3: 'Nueva solicitud',
      routeName3: 'NewRequest'
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
