export interface INavigationRoute {
  name: string;
  displayName: string;
  subtitle: string;
  meta: { icon: string };
  children?: INavigationRoute[];
}

export default {
  root: {
    name: '/',
    displayName: 'navigationRoutes.home',
  },
  routes: [
    {
      name: 'HomeView',
      displayName: 'Home',
      meta: {
        icon: 'home',
      },
    },
    {
      name: 'Dashboard',
      displayName: 'Dashboard',
      subtitle: 'Ver las estadísticas recientes del laboratorio',
      meta: {
        icon: 'dashboard',
      },
    },
    {
      name: 'Sistema',
      displayName: 'Sistema',
      subtitle: 'Administrar el personal asignado y los perfiles del usuario y laboratorio',
      meta: {
        icon: 'group',
      },
      children: [
        {
          name: 'UsersView',
          displayName: 'Usuarios',
        },
        {
          name: 'RoleManagement',
          displayName: 'Roles',
        },
        {
          name: 'ProfileUserView',
          displayName: 'Perfil de usuario',
        },
        {
          name: 'ProfileLabView',
          displayName: 'Perfil de Laboratorio',
        },
      ],
    },
    {
      name: 'Patients',
      displayName: 'Pacientes',
      subtitle: 'Añadir, buscar, editar o eliminar pacientes',
      meta: {
        icon: 'healing',
      },
    },
    {
      name: '',
      displayName: 'Exámenes',
      subtitle: 'Administrar los análisis pendientes y completados',
      meta: {
        icon: 'troubleshoot',
      },
      children: [
        {
          name: 'Exams',
          displayName: 'Exámenes',
        },
        {
          name: 'LaboratoryCatalog',
          displayName: 'Catálogo',
        },
        {
          name: 'NewRequest',
          displayName: 'Nueva Solicitud',
        },
      ],
    },
  ] as INavigationRoute[],
};
