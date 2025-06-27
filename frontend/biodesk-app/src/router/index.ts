import { createRouter, createWebHistory } from 'vue-router';
import AuthLayout from '@/layouts/AuthLayout.vue';
import AppLayout from '@/layouts/AppLayout.vue';
import Login from '@/views/auth/Login.vue';
import HomeView from '@/views/home/HomeView.vue';
import LoadScreen from '@/layouts/LoadScreen.vue';
import PatientsPage from '@/views/patients/PatientsPage.vue';
import AppLayoutVuestic from '@/layouts/AppLayoutVuestic.vue';

const router = createRouter({
  history: createWebHistory(import.meta.env.VITE_BASE_URL_APP_DEV),
  routes: [
    {
      path: '/auth',
      component: AuthLayout,
      children: [
        {
          path: 'login',
          name: 'Login',
          component: Login, // Carga estatica
        },
        {
          path: 'signup',
          name: 'SignUp',
          // Carga dinamica (lazy loading: mejora el rendimiento al cargar solo cuando se necesita)
          component: () => import('@/views/auth/SignUp.vue'),
          children: [
            {
              path: 'user',
              name: 'RegisterUser',
              // Carga dinamica (lazy loading: mejora el rendimiento al cargar solo cuando se necesita)
              component: () => import('@/views/auth/RegisterUser.vue'),
            },
            {
              path: 'lab',
              name: 'RegisterLab',
              // Carga dinamica (lazy loading: mejora el rendimiento al cargar solo cuando se necesita)
              component: () => import('@/views/auth/RegisterLab.vue'),
            },
          ],
        },
        {
          path: 'forgot-password',
          name: 'ForgotPassword',
          // Carga dinamica (lazy loading: mejora el rendimiento al cargar solo cuando se necesita)
          component: () => import('@/views/auth/ForgotPassword.vue'),
        },
        {
          path: 'select-lab',
          name: 'SelectLab',
          // Carga dinamica (lazy loading: mejora el rendimiento al cargar solo cuando se necesita)
          component: () => import('@/views/auth/SelectLab.vue'),
        },
        // Aquí se agregan mas hijos de auth layout
      ],
    },
    {
      path: '/app',
      component: AppLayoutVuestic,
      children: [
        {
          path: 'home',
          name: 'HomeView',
          component: HomeView,
        },
        {
          path: 'laboratory-catalog',
          name: 'LaboratoryCatalog',
          component: () => import('@/views/laboratory/LaboratoryCatalog.vue'),
        },
        // Aquí se agregan mas hijos de app layout
        {
          path: 'patients',
          name: 'Patients',
          component: PatientsPage,
        },
      ],
    },
    // Redirección de la raíz a /auth/login
    {
      path: '/',
      redirect: '/auth/login',
    },
    // Redirección para cualquier ruta no definida
    {
      path: '/:pathMatch(.*)*',
      redirect: '/auth/login',
    },
    {
      path: '/load',
      name: 'LoadScreen',
      component: LoadScreen,
    },
  ],
});

export default router;
