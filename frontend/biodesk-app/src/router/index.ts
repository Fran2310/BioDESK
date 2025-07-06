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
import UsersView from '@/views/users/UsersView.vue';

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
        {
          path: 'users',
          name: 'UsersView',
          component: UsersView,
        },
        {
          path: 'profile-user',
          name: 'ProfileUserView',
          component: () => import('@/views/profiles/ProfileUserView.vue'),
        },
        {
          path: 'profile-lab',
          name: 'ProfileLabView',
          component: () => import('@/views/profiles/ProfileLabView.vue'),
        },
        {
          path: 'laboratory-catalog',
          name: 'LaboratoryCatalog',
          component: () => import('@/views/laboratory/LaboratoryCatalog.vue'),
        },
        {
          path: 'patients',
          name: 'Patients',
          component: () => import('@/views/patients/PatientsPage.vue'),
        },
        {
          path: 'roles',
          name: 'RoleManagement',
          component: () => import('@/views/role/RoleManagement.vue'),
        },
        {
          path: 'exams/:medicHistoryId?',
          name: 'Exams',
          component: () => import('@/views/exams/Exams.vue'),
          props: true,
        },
        {
          path: 'newrequest',
          name: 'NewRequest',
          component: NewRequest,
        },
        {
          path: '/lab/request-medic-test/:id/upload',
          name: 'UploadResults',
          component: () => import('@/views/exams/UploadResults.vue'),
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
