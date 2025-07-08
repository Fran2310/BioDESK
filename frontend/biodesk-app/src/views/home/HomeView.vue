<template class="home">
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
      v-bind="content"
    />

    <CardComplex 
      v-for="(content, idx) in complexCard"
      :key="idx"
      v-bind="content"
    />
  </div>
</template>


<script setup lang="ts">
  import { ref, onMounted, computed } from 'vue'
  import { useLabStore } from '@/stores/labStore'
  import CardSimple from './CardSimple.vue'
  import CardComplex from './CardComplex.vue'
  import BannerHome from './BannerHome.vue'
  import navigationRoutes from '@/components/sidebar/NavigationRoutes'
  import { useUserRole } from '@/composables/getBannerData'


  //    Contenido del banner
  const banner = ref([
    {
      labName: '',
      role: ''
    }
  ])
  
  // Nombre del laboratorio
  const labStore = useLabStore()
  onMounted(() => {
    banner.value[0].labName = labStore.currentLab?.name
  })

  // Rol precargado durante la pantalla de carga
  const { userRole } = useUserRole()
  banner.value[0].role = userRole.value


  //    Contenido para las tarjetas simples
  const simpleCards = computed(() =>
  navigationRoutes.routes
    .filter(route => !route.children && route.name !== 'HomeView') // Se excluyen las rutas con "hijos" y el home
    .map(route => ({
      title: route.displayName,
      icon: route.meta?.icon,
      subtitle: route.subtitle,
      routeName: route.name,
    }))
  )

  //    Contenido para las tarjetas complejas
  const complexCard = computed(() =>
  navigationRoutes.routes
    .filter(route => route.children) // Sólo usar las rutas con "hijos"
    .map(route => ({
      title: route.displayName,
      icon: route.meta?.icon,
      subtitle: route.subtitle,
      option1: route.children[0]?.displayName,
      routeName1: route.children[0]?.name,
      option2: route.children[1]?.displayName,
      routeName2: route.children[1]?.name,
      option3: route.children[2]?.displayName,
      routeName3: route.children[2]?.name,
      option4: route.children[3]?.displayName,
      routeName4: route.children[3]?.name,
    }))
  )
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
