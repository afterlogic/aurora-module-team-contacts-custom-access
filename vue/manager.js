import enums from 'src/enums'
import userSettings from 'src/settings'

import TeamContactsCustomAccessAdminSettingsPerUser from './components/TeamContactsCustomAccessAdminSettingsPerUser'
import TeamContactsCustomAccessAdminSettingsPerTenant from './components/TeamContactsCustomAccessAdminSettingsPerTenant'

export default {
  moduleName: 'TeamContactsCustomAccess',

  requiredModules: [],

  getAdminSystemTabs () {
    if (userSettings.getEnableMultiTenant()) {
      return []
    }
    return [
      {
        tabName: 'team-contacts-tenant',
        tabTitle: 'TEAMCONTACTSCUSTOMACCESS.LABEL_SETTINGS_TAB',
        tabRouteChildren: [
          { path: 'team-contacts-tenant', component: TeamContactsCustomAccessAdminSettingsPerTenant },
        ],
      },
    ]
  },

  getAdminTenantTabs () {
    if (!userSettings.getEnableMultiTenant()) {
      return []
    }
    return [
      {
        tabName: 'team-contacts-tenant',
        tabTitle: 'TEAMCONTACTSCUSTOMACCESS.LABEL_SETTINGS_TAB',
        tabRouteChildren: [
          { path: 'id/:id/team-contacts-tenant', component: TeamContactsCustomAccessAdminSettingsPerTenant },
          { path: 'search/:search/id/:id/team-contacts-tenant', component: TeamContactsCustomAccessAdminSettingsPerTenant },
          { path: 'page/:page/id/:id/team-contacts-tenant', component: TeamContactsCustomAccessAdminSettingsPerTenant },
          { path: 'search/:search/page/:page/id/:id/team-contacts-tenant', component: TeamContactsCustomAccessAdminSettingsPerTenant },
        ],
      },
    ]
  },

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
