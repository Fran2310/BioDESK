export interface INavigationRoute {
  name: string;
  displayName: string;
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
      meta: {
        icon: 'dashboard',
      },
    },
    {
      name: 'Sistema',
      displayName: 'Sistema',
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
      ],
    },
    {
      name: 'Patients',
      displayName: 'Pacientes',
      meta: {
        icon: 'healing',
      },
    },
    {
      name: '',
      displayName: 'Exámenes',
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
