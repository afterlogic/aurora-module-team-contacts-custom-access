'use strict';

var
	_ = require('underscore'),
	ko = require('knockout'),

	AddressUtils = require('%PathToCoreWebclientModule%/js/utils/Address.js'),
	TextUtils = require('%PathToCoreWebclientModule%/js/utils/Text.js'),
	Types = require('%PathToCoreWebclientModule%/js/utils/Types.js'),

	App = require('%PathToCoreWebclientModule%/js/App.js'),
	Ajax = require('%PathToCoreWebclientModule%/js/Ajax.js'),
	ModulesManager = require('%PathToCoreWebclientModule%/js/ModulesManager.js'),
	Screens = require('%PathToCoreWebclientModule%/js/Screens.js'),

	CAbstractSettingsFormView = ModulesManager.run('AdminPanelWebclient', 'getAbstractSettingsFormViewClass')
;

/**
* @constructor
*/
function CAdminSettingsView()
{
	CAbstractSettingsFormView.call(this, 'TeamContactsCustomAccess');

	this.iTenantId = 0;

	this.readAccessDom = ko.observable();
	this.writeAccessDom = ko.observable();

	this.readAccessLock = ko.observable(false);
	this.readAccess = ko.observable('').extend({'reversible': true});
	this.readAccess.subscribe(function () {
		if (!this.readAccessLock()) {
			$(this.readAccessDom()).val(this.readAccess());
			$(this.readAccessDom()).inputosaurus('refresh');
		}
	}, this);

	this.writeAccessLock = ko.observable(false);
	this.writeAccess = ko.observable('').extend({'reversible': true});
	this.writeAccess.subscribe(function () {
		if (!this.writeAccessLock()) {
			$(this.writeAccessDom()).val(this.writeAccess());
			$(this.writeAccessDom()).inputosaurus('refresh');
		}
	}, this);

	this.readAccessDom.subscribe(function () {
		if (this.readAccessDom()) {
			this.initInputosaurus(this.readAccessDom, this.readAccess, this.readAccessLock);
		}
	}, this);

	this.writeAccessDom.subscribe(function () {
		if (this.writeAccessDom()) {
			this.initInputosaurus(this.writeAccessDom, this.writeAccess, this.writeAccessLock);
		}
	}, this);
}

CAdminSettingsView.prototype.autoCompleteSource = function (request, responseHandler)
{
	const
		parameters = {
			TenantId: this.iTenantId,
			Offset: 0,
			Limit: 50,
			OrderBy: 'PublicId',
			OrderType: 0,
			Search: request.term
		}
	;
	Ajax.send('Core', 'GetUsers', parameters, response => {
		const
			userList = Array.isArray(response && response.Result && response.Result.Items)
				? response.Result.Items
				: [],
			options = userList
				.filter(user => user.Role !== Enums.UserRole.TenantAdmin)
				.map(user => {
					return {
						label: user.PublicId,
						value: user.PublicId,
						name: user.PublicId,
						email: user.PublicId
					};
				})
		;
		responseHandler(options);
	});
};

CAdminSettingsView.prototype.initInputosaurus = function (koDom, koAddr, koLockAddr)
{
	if (koDom() && $(koDom()).length > 0) {
		$(koDom()).inputosaurus({
			width: 'auto',
			parseOnBlur: true,
			autoCompleteSource: this.autoCompleteSource.bind(this),
			change : event => {
				koLockAddr(true);
				this.setRecipient(koAddr, event.target.value);
				koLockAddr(false);
			},
			copy: value => {
				this.inputosaurusBuffer = value;
			},
			paste: () => {
				const inputosaurusBuffer = this.inputosaurusBuffer || '';
				this.inputosaurusBuffer = '';
				return inputosaurusBuffer;
			},
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

CAdminSettingsView.prototype.getParametersForSave = function ()
{
	const
		readAccessAddresses = AddressUtils.getArrayRecipients(this.readAccess()),
		writeAccessAddresses = AddressUtils.getArrayRecipients(this.writeAccess())
	;
	return {
		TenantId: this.iTenantId,
		ReadAccess: readAccessAddresses.map(address => address.email),
		WriteAccess: writeAccessAddresses.map(address => address.email)
	};
};

CAdminSettingsView.prototype.setAccessLevel = function (sEntityType, iEntityId)
{
	this.visible(sEntityType === 'Tenant');
	this.iTenantId = (sEntityType === 'Tenant') ? iEntityId : 0;
};

CAdminSettingsView.prototype.onRouteChild = function (params)
{
	this.requestPerEntitytSettings();
};

CAdminSettingsView.prototype.requestPerEntitytSettings = function ()
{
	if (Types.isPositiveNumber(this.iTenantId)) {
		this.readAccess([]);
		this.writeAccess([]);
		const parameters = {
			TenantId: this.iTenantId
		};
		Ajax.send('TeamContactsCustomAccess', 'GetUsersWithAccessToTeamContacts', parameters, response => {
			const result = response.Result;
			if (Array.isArray(result.ReadAccess) && Array.isArray(result.WriteAccess)) {
				this.readAccess(result.ReadAccess.join(','));
				this.writeAccess(result.WriteAccess.join(','));
				this.updateSavedState();
			}
		});
	} else {
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

CAdminSettingsView.prototype.validateBeforeSave = function ()
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
		Screens.showError(TextUtils.i18n('%MODULENAME%/ERROR_CONFLICT_EMAILS', {'CONFLICT_EMAILS': sConflictEmails}, null, iConflictCount));
		return false;
	}
	return true;
};

module.exports = new CAdminSettingsView();
