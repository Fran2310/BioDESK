import { createRouter, createWebHistory } from 'vue-router';
import AuthLayout from '@/layouts/AuthLayout.vue';
// import AppLayout from '@/layouts/AppLayout.vue';
import Login from '@/views/auth/Login.vue';
import HomeView from '@/views/home/HomeView.vue';
import LoadScreen from '@/layouts/LoadScreen.vue';
import PatientsPage from '@/views/patients/PatientsPage.vue';
import AppLayoutVuestic from '@/layouts/AppLayoutVuestic.vue';
import Exams from '@/views/exams/Exams.vue';
import NewRequest from '@/views/new-request/NewRequest.vue';

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

          // Carga dinamica (lazy loading: mejora el rendimiento al cargar solo cuando se necesita)
          component: () => import('@/views/auth/SignUp/SignUp.vue'),
          children: [
            {
              path: 'user',
              name: 'SignUpUser',
              // Carga dinamica (lazy loading: mejora el rendimiento al cargar solo cuando se necesita)
              component: () => import('@/views/auth/SignUp/SignUpUser.vue'),
            },
            {
              path: 'lab',
              name: 'SignUpLab',
              // Carga dinamica (lazy loading: mejora el rendimiento al cargar solo cuando se necesita)
              component: () => import('@/views/auth/SignUp/SignUpLab.vue'),
            },
            {
              path: '',
              name: 'SignUp',
              redirect: { name: 'SignUpUser' },
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
        // Agrega esta nueva ruta para el Dashboard
        {
          path: 'dashboard',
          name: 'Dashboard',
          // Carga dinámica (recomendado para mejor rendimiento)
          component: () => import('@/views/dashboard/DashboardView.vue'),
        },
        // Aquí se agregan mas hijos de app layout
        {
          path: 'patients',
          name: 'Patients',
          component: PatientsPage,
        },

        {
          path: 'exams/:medicHistoryId?',
          name: 'Exams',
          component: Exams,
          props: true,
        },

        {
          path: 'newrequest',
          name: 'NewRequest',
          component: NewRequest,
        },

        {
          path: '/settings',
          name: 'Settings',
          component: () => import('../views/settings/Settings.vue'),
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
