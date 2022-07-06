'use strict';

var
	_ = require('underscore'),
	ko = require('knockout'),

	Types = require('%PathToCoreWebclientModule%/js/utils/Types.js'),

	App = require('%PathToCoreWebclientModule%/js/App.js'),
	Ajax = require('%PathToCoreWebclientModule%/js/Ajax.js'),
	Routing = require('%PathToCoreWebclientModule%/js/Routing.js'),
	ModulesManager = require('%PathToCoreWebclientModule%/js/ModulesManager.js'),

	CAbstractSettingsFormView = ModulesManager.run('AdminPanelWebclient', 'getAbstractSettingsFormViewClass'),

	Settings = require('modules/%ModuleName%/js/Settings.js')
;

/**
* @constructor
*/
function CAdminPerUserSettingsView()
{
	CAbstractSettingsFormView.call(this, 'TeamContactsCustomAccess');

	this.userId = ko.observable(0);
	this.isUserTenantAdmin = ko.observable(false);
	this.userAccess = ko.observable('0');

	ko.computed(function () {
		this.visible(this.userId() !== 0 && !this.isUserTenantAdmin());
	}, this);

	this.visible.subscribe(function () {
		if (!this.visible() && this.bShown) {
			const
				hashParts = Routing.getCurrentHashArray(),
				hashPartsCount = hashParts.length
			;

			if (hashPartsCount > 0 && hashParts[hashPartsCount - 1] === Settings.UserSettingsHash) {
				hashParts.pop();
				Routing.replaceHash(hashParts);
			}
		}
	}, this);

	App.subscribeEvent('ReceiveAjaxResponse::after', params => {
		const
			request = params.Request,
			result = params.Response && params.Response.Result
		;
		if (request && request.Module === 'Core' && request.Method === 'GetUser'
			&& request.Parameters && request.Parameters.Id === this.userId() && result
		) {
			this.isUserTenantAdmin(result.Role === Enums.UserRole.TenantAdmin);
		}
	});
}

_.extendOwn(CAdminPerUserSettingsView.prototype, CAbstractSettingsFormView.prototype);

CAdminPerUserSettingsView.prototype.ViewTemplate = '%ModuleName%_AdminPerUserSettingsView';

CAdminPerUserSettingsView.prototype.getCurrentValues = function()
{
	return [
		this.userAccess()
	];
};

CAdminPerUserSettingsView.prototype.revertGlobalValues = function()
{
	this.userAccess('0');
};

CAdminPerUserSettingsView.prototype.getParametersForSave = function ()
{
	return {
		Access: Types.pInt(this.userAccess()),
		UserId: this.userId()
	};
};

CAdminPerUserSettingsView.prototype.setAccessLevel = function (sEntityType, iEntityId)
{
	this.userId(sEntityType === 'User' ? iEntityId : 0);
};

CAdminPerUserSettingsView.prototype.onRouteChild = function (aParams)
{
	this.requestPerEntitytSettings();
};

CAdminPerUserSettingsView.prototype.requestPerEntitytSettings = function ()
{
	if (Types.isPositiveNumber(this.userId()))
	{
		Ajax.send('TeamContactsCustomAccess', 'GetUserAccess', { 'UserId': this.userId() }, function (oResponse) {
			if (oResponse.Result)
			{
				this.userAccess(Types.pString(oResponse.Result));
				this.updateSavedState();
			}
		}, this);
	}
	else
	{
		this.revertGlobalValues();
	}
};

module.exports = new CAdminPerUserSettingsView();
