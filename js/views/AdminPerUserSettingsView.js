'use strict';

var
	_ = require('underscore'),
	ko = require('knockout'),
	
	App = require('%PathToCoreWebclientModule%/js/App.js'),
	Ajax = require('%PathToCoreWebclientModule%/js/Ajax.js'),
	ModulesManager = require('%PathToCoreWebclientModule%/js/ModulesManager.js'),
	Types = require('%PathToCoreWebclientModule%/js/utils/Types.js'),
	AddressUtils = require('%PathToCoreWebclientModule%/js/utils/Address.js'),
	TextUtils = require('%PathToCoreWebclientModule%/js/utils/Text.js'),
	Screens = require('%PathToCoreWebclientModule%/js/Screens.js'),
	CAbstractSettingsFormView = ModulesManager.run('AdminPanelWebclient', 'getAbstractSettingsFormViewClass')
;

/**
* @constructor
*/
function CAdminPerUserSettingsView()
{
	CAbstractSettingsFormView.call(this, 'TeamContactsCustomAccess');
	
	this.iEntityId = 0;
	this.sEntityType = '';

	this.userAccess = ko.observable('0');
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
	var oParameters = {
		'Access': Types.pInt(this.userAccess())
	};
	if (Types.isPositiveNumber(this.iEntityId)) // branding is shown for particular tenant
	{
		oParameters.UserId = this.iEntityId;
	}
	return oParameters;
};

CAdminPerUserSettingsView.prototype.setAccessLevel = function (sEntityType, iEntityId)
{
	this.visible(sEntityType === 'User');
	this.iEntityId = sEntityType === 'User' ? iEntityId : 0;
	this.sEntityType = sEntityType;
};

CAdminPerUserSettingsView.prototype.onRouteChild = function (aParams)
{
	if (this.sEntityType === 'User')
	{
		this.requestPerEntitytSettings();
	}
};

CAdminPerUserSettingsView.prototype.requestPerEntitytSettings = function ()
{
	if (Types.isPositiveNumber(this.iEntityId))
	{
		Ajax.send('TeamContactsCustomAccess', 'GetUserAccess', { 'UserId': this.iEntityId }, function (oResponse) {
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

/**
 * Sends a request to the server to save the settings.
 */
 CAdminPerUserSettingsView.prototype.save = function ()
 {
	this.isSaving(true);
	Ajax.send('TeamContactsCustomAccess', 'UpdateUserAccess', this.getParametersForSave(), this.onResponse, this);
 };

module.exports = new CAdminPerUserSettingsView();
