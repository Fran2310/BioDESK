export interface INavigationRoute {
  name: string
  displayName: string
  meta: { icon: string }
  children?: INavigationRoute[]
}

export default {
  root: {
    name: '/',
    displayName: 'navigationRoutes.home',
  },
  routes: [
    {
      name: 'homepage',
      displayName: 'Home',
      meta: {
        icon: 'vuestic-iconset-dashboard',
      },
    },
    
    {
      name: 'dashboard',
      displayName: 'menu.dashboard',
      meta: {
        icon: 'vuestic-iconset-dashboard',
      },
    },

    {
      name:'users',
      displayName:'menu.users',
      meta:{
        icon:'group',
      },

    },

    {
      name: 'users',
      displayName: 'menu.patientsdata',
      meta: {
        icon: 'group',
      },

      //Elements that will appear in the dropdown (Users).

      children: [
        {
        name: 'patients', //Patients
        displayName:'menu.patients',
        },
        {
        name: 'med-history', //Medic history
        displayName:'menu.history',
        },
        {
        name: 'test-req', //Test request
        displayName:'menu.testreq',
        },
      ],
    },
    {
      name: 'laboratory',
      displayName: 'Laboratory',
      meta: {
        icon: 'medical_services',
      },
       children: [
        {
        name: 'laboratory-catalog', //Laboratory catalog
        displayName:'Laboratory Catalog',
        },
      ],
    },
  ] as INavigationRoute[],
}
