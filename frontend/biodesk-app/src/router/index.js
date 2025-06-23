import { createRouter, createWebHistory } from 'vue-router';
import AuthLayout from '@/layouts/AuthLayout.vue';
import Login from '@/views/auth/Login.vue';
const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
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
        },
        {
          path: 'forgot-password',
          name: 'ForgotPassword',
          // Carga dinamica (lazy loading: mejora el rendimiento al cargar solo cuando se necesita)
          component: () => import('@/views/auth/ForgotPassword.vue'),
        },
        // Aquí se agregan mas hijos de auth layout
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
  ],
});

export default router;
