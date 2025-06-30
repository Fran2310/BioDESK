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
      name: 'Patients',
      displayName: 'Pacientes',
      meta: {
        icon: 'healing',
      },
    },
    {
      name: 'Exams',
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
          name: 'NewRequest',
          displayName: 'Nueva Solicitud',
        },
      ],
    },
  ] as INavigationRoute[],
};
