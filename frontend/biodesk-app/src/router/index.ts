import { createRouter, createWebHistory } from 'vue-router';
import AuthLayout from '@/layouts/AuthLayout.vue';
import AppLayout from '@/layouts/AppLayout.vue';
import Login from '@/views/auth/Login.vue';
import HomeView from '@/views/home/HomeView.vue';
import LoadScreen from '@/layouts/LoadScreen.vue';

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
      component: AppLayout,
      children: [
        {
          path: 'home',
          name: 'HomeView',
          component: HomeView,
        },
        // Aquí se agregan mas hijos de app layout
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
