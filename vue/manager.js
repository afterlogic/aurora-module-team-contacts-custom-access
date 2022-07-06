import TeamContactsCustomAccessAdminSettingsPerUser from './components/TeamContactsCustomAccessAdminSettingsPerUser'

import enums from 'src/enums'

export default {
  moduleName: 'TeamContactsCustomAccess',

  requiredModules: [],

  // getAdminSystemTabs () {
  //   return [
  //     {
  //       tabName: 'team-contacts-tenant',
  //       tabTitle: 'TEAMCONTACTSCUSTOMACCESS.LABEL_SETTINGS_TAB',
  //       tabRouteChildren: [
  //         { path: 'team-contacts-tenant', component: () => import('./components/TeamContactsCustomAccessAdminSettings') },
  //       ],
  //     },
  //   ]
  // },

  getAdminUserTabs () {
    const UserRoles = enums.getUserRoles()

    return [
      {
        tabName: 'team-contacts-user',
        tabTitle: 'TEAMCONTACTSCUSTOMACCESS.LABEL_SETTINGS_TAB',
        tabRouteChildren: [
          { path: 'id/:id/team-contacts-user', component: TeamContactsCustomAccessAdminSettingsPerUser },
          { path: 'search/:search/id/:id/team-contacts-user', component: TeamContactsCustomAccessAdminSettingsPerUser },
          { path: 'page/:page/id/:id/team-contacts-user', component: TeamContactsCustomAccessAdminSettingsPerUser },
          { path: 'search/:search/page/:page/id/:id/team-contacts-user', component: TeamContactsCustomAccessAdminSettingsPerUser },
        ],
        hideTabForUserRole: UserRoles.TenantAdmin
      }
    ]
  },
}
