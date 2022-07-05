import TeamContactsCustomAccessAdminSettingsPerUser from './components/TeamContactsCustomAccessAdminSettingsPerUser'

export default {
  moduleName: 'TeamContactsCustomAccess',

  requiredModules: [],

  // getAdminSystemTabs () {
  //   return [
  //     {
  //       tabName: 'teamcontactscustomaccess',
  //       tabTitle: 'TEAMCONTACTSCUSTOMACCESS.LABEL_SETTINGS_TAB',
  //       tabRouteChildren: [
  //         { path: 'teamcontactscustomaccess', component: () => import('./components/TeamContactsCustomAccessAdminSettings') },
  //       ],
  //     },
  //   ]
  // },

  getAdminUserTabs () {
    return [
      {
        tabName: 'teamcontactscustomaccess',
        tabTitle: 'TEAMCONTACTSCUSTOMACCESS.LABEL_SETTINGS_TAB',
        tabRouteChildren: [
          { path: 'id/:id/teamcontactscustomaccess', component: TeamContactsCustomAccessAdminSettingsPerUser },
          { path: 'search/:search/id/:id/teamcontactscustomaccess', component: TeamContactsCustomAccessAdminSettingsPerUser },
          { path: 'page/:page/id/:id/teamcontactscustomaccess', component: TeamContactsCustomAccessAdminSettingsPerUser },
          { path: 'search/:search/page/:page/id/:id/teamcontactscustomaccess', component: TeamContactsCustomAccessAdminSettingsPerUser },
        ],
      }
    ]
  },
}
