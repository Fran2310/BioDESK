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
      displayName: 'Patients',
      meta: {
        icon: 'group',
      },
    },
    {
      name: 'LaboratoryCatalog',
      displayName: 'Catalogo de laboratorio',
      meta: {
        icon: 'science',
      },
    },
  ] as INavigationRoute[],
};
