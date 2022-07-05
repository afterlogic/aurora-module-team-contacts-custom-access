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
function CAdminSettingsView()
{
	CAbstractSettingsFormView.call(this, 'TeamContactsCustomAccess');

	this.iEntityId = 0;
	this.sEntityType = '';

	this.readAccessDom = ko.observable();
	this.writeAccessDom = ko.observable();

	this.readAccessLock = ko.observable(false);
	this.readAccess = ko.observable('').extend({'reversible': true});
	this.readAccess.subscribe(function () {
		if (!this.readAccessLock())
		{
			$(this.readAccessDom()).val(this.readAccess());
			$(this.readAccessDom()).inputosaurus('refresh');
		}
	}, this);

	this.writeAccessLock = ko.observable(false);
	this.writeAccess = ko.observable('').extend({'reversible': true});
	this.writeAccess.subscribe(function () {
		if (!this.writeAccessLock())
		{
			$(this.writeAccessDom()).val(this.writeAccess());
			$(this.writeAccessDom()).inputosaurus('refresh');
		}
	}, this);

	ko.computed(function () {
		if (this.readAccess() && this.readAccessDom()) {
			this.initInputosaurus(this.readAccessDom, this.readAccess, this.readAccessLock);
		}
	}, this);

	ko.computed(function () {
		if (this.writeAccess() && this.writeAccessDom()) {
			this.initInputosaurus(this.writeAccessDom, this.writeAccess, this.writeAccessLock);
		}
	}, this);
}

CAdminSettingsView.prototype.initInputosaurus = function (koDom, koAddr, koLockAddr)
{
	if (koDom() && $(koDom()).length > 0)
	{
		const
			suggestParameters = {
				storage: 'team',
				addContactGroups: false,
				addUserGroups: false,
				exceptEmail: '',
				useEmailAsValues: true
			},
			autoCompleteSource = ModulesManager.run(
				'ContactsWebclient', 'getSuggestionsAutocompleteCallback', [suggestParameters]
			)
		;
		$(koDom()).inputosaurus({
			width: 'auto',
			parseOnBlur: true,
			autoCompleteSource: _.isFunction(autoCompleteSource) ? autoCompleteSource : function () {},
			change : _.bind(function (ev) {
				koLockAddr(true);
				this.setRecipient(koAddr, ev.target.value);
				koLockAddr(false);
			}, this),
			copy: _.bind(function (sVal) {
				this.inputosaurusBuffer = sVal;
			}, this),
			paste: _.bind(function () {
				var sInputosaurusBuffer = this.inputosaurusBuffer || '';
				this.inputosaurusBuffer = '';
				return sInputosaurusBuffer;
			}, this),
			mobileDevice: App.isMobile()
		});
	}
};

_.extendOwn(CAdminSettingsView.prototype, CAbstractSettingsFormView.prototype);

CAdminSettingsView.prototype.ViewTemplate = '%ModuleName%_AdminSettingsView';

CAdminSettingsView.prototype.getCurrentValues = function()
{
	return [
		this.writeAccess(),
		this.readAccess()
	];
};

CAdminSettingsView.prototype.revertGlobalValues = function()
{
	// this.loginLogo(Settings.LoginLogo);
	// this.tabsbarLogo(Settings.TabsbarLogo);
};

CAdminSettingsView.prototype.getParametersForSave = function ()
{
	var oParameters = {
		'WriteAccess': AddressUtils.getArrayRecipients(this.writeAccess()),
		'ReadAccess': AddressUtils.getArrayRecipients(this.readAccess())
	};
	if (Types.isPositiveNumber(this.iTenantId)) // branding is shown for particular tenant
	{
		oParameters.TenantId = this.iTenantId;
	}
	return oParameters;
};

/**
 * Applies saved values to the Settings object.
 * 
 * @param {Object} oParameters Parameters which were saved on the server side.
 */
CAdminSettingsView.prototype.applySavedValues = function (oParameters)
{
	if (!Types.isPositiveNumber(this.iTenantId))
	{
//		Settings.update(oParameters);
	}
};

CAdminSettingsView.prototype.setAccessLevel = function (sEntityType, iEntityId)
{
	this.visible(sEntityType === 'Tenant');
	this.iEntityId = (sEntityType === 'Tenant') ? iEntityId : 0;
	this.sEntityType = sEntityType;
};

CAdminSettingsView.prototype.onRouteChild = function (aParams)
{
	if (this.sEntityType === 'Tenant')
	{
		this.requestPerEntitytSettings();
	}
};

CAdminSettingsView.prototype.requestPerEntitytSettings = function ()
{
	if (Types.isPositiveNumber(this.iEntityId))
	{
		this.readAccess([]);
		this.writeAccess([]);
		Ajax.send('TeamContactsCustomAccess', 'GetUsersWithAccessToTeamContacts', { 'TenantId': this.iEntityId }, function (oResponse) {
			if (oResponse.Result)
			{
				this.readAccess(oResponse.Result.ReadAccess);
				this.writeAccess(oResponse.Result.WriteAccess);
				this.updateSavedState();
			}
		}, this);
	}
	else
	{
		this.revertGlobalValues();
	}
};

CAdminSettingsView.prototype.setRecipient = function (koRecipient, sRecipient)
{
	if (koRecipient() === sRecipient)
	{
		koRecipient.valueHasMutated();
	}
	else
	{
		koRecipient(sRecipient);
	}
};

CAdminSettingsView.prototype.isValidShares = function ()
{
	var 
		aConflictEmails = [],
		aOwners = AddressUtils.getArrayRecipients(this.writeAccess()),
		aGuests = AddressUtils.getArrayRecipients(this.readAccess())
		;
	_.each(aOwners, function (oOwnerAddress) {
		_.each(aGuests, function (oGuestAddress) {
			if (oOwnerAddress.email === oGuestAddress.email) {
				aConflictEmails.push(oOwnerAddress.fullEmail);
			}
		});
	});
	if (aConflictEmails.length > 0) {
		var
			sConflictEmails = TextUtils.encodeHtml(aConflictEmails.join(', ')),
			iConflictCount = aConflictEmails.length
		;
		Screens.showError(TextUtils.i18n('%MODULENAME%/ERROR_SHARE_CONFLICT_EMAILS', {'CONFLICT_EMAILS': sConflictEmails}, null, iConflictCount));
		return false;
	}
	return true;
};

/**
 * Sends a request to the server to save the settings.
 */
 CAdminSettingsView.prototype.save = function ()
 {
	 if (this.isValidShares()) {
		 this.isSaving(true);
		 Ajax.send('TeamContactsCustomAccess', 'UpdateSettings', this.getParametersForSave(), this.onResponse, this);
	 }
 };

module.exports = new CAdminSettingsView();
