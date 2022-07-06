'use strict';

module.exports = function (oAppData) {
	const
		TextUtils = require('%PathToCoreWebclientModule%/js/utils/Text.js'),

		App = require('%PathToCoreWebclientModule%/js/App.js'),

		Settings = require('modules/%ModuleName%/js/Settings.js')
	;

	if (App.getUserRole() === Enums.UserRole.SuperAdmin || App.getUserRole() === Enums.UserRole.TenantAdmin) {
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
					Settings.TenantSettingsHash,
					TextUtils.i18n('%MODULENAME%/LABEL_SETTINGS_TAB')
				]);

				ModulesManager.run('AdminPanelWebclient', 'registerAdminPanelTab', [
					function(resolve) {
						require.ensure(
							['modules/%ModuleName%/js/views/AdminPerUserSettingsView.js'],
							function() {
								resolve(require('modules/%ModuleName%/js/views/AdminPerUserSettingsView.js'));
							},
							'admin-bundle'
						);
					},
					Settings.UserSettingsHash,
					TextUtils.i18n('%MODULENAME%/LABEL_SETTINGS_TAB')
				]);
			}
		};
	}

	return null;
};
