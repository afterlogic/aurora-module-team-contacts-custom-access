'use strict';

module.exports = function (oAppData) {
	require('%PathToCoreWebclientModule%/js/vendors/jquery.cookie.js');
	
	var
		TextUtils = require('%PathToCoreWebclientModule%/js/utils/Text.js'),
		
		App = require('%PathToCoreWebclientModule%/js/App.js')
	;

	if (App.getUserRole() === Enums.UserRole.SuperAdmin || App.getUserRole() === Enums.UserRole.TenantAdmin)
	{
		return {
			start: function (ModulesManager) {
				ModulesManager.run('AdminPanelWebclient', 'registerAdminPanelTab', [
					function(resolve) {
						require.ensure(
							['modules/%ModuleName%/js/views/AdminSettingsView.js'],
							function() {
								resolve(require('modules/%ModuleName%/js/views/AdminSettingsView.js'));
							},
							'admin-bundle'
						);
					},
					'TeamContactsCustomAccess',
					TextUtils.i18n('%MODULENAME%/ADMIN_SETTINGS_TAB_LABEL')
				]);
			}
		};
	}
	
	return null;
};
