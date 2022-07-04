<?php
/**
 * This code is licensed under AGPLv3 license or Afterlogic Software License
 * if commercial version of the product was purchased.
 * For full statements of the licenses see LICENSE-AFTERLOGIC and LICENSE-AGPL3 files.
 */

namespace Aurora\Modules\TeamContactsCustomAccess;

use Aurora\Modules\Contacts\Enums\Access as EnumsAccess;
use Aurora\Modules\Contacts\Enums\PrimaryEmail;
use Aurora\Modules\Contacts\Enums\SortField;
use \Aurora\Modules\Contacts\Enums\StorageType;
use Aurora\Modules\Contacts\Models\Contact;
use Aurora\Modules\Contacts\Module as ContactsModule;
use Aurora\Modules\Core\Models\User;
use Aurora\Modules\TeamContactsCustomAccess\Models\Access;
use Aurora\System\Api;
use Aurora\System\Enums\UserRole;

/**
 * @license https://www.gnu.org/licenses/agpl-3.0.html AGPL-3.0
 * @license https://afterlogic.com/products/common-licensing Afterlogic Software License
 * @copyright Copyright (c) 2019, Afterlogic Corp.
 *
 * @package Modules
 */
class Module extends \Aurora\System\Module\AbstractModule
{
	public $aRequireModules = [
		'TeamContacts'
	];

	public function init()
	{
		$this->subscribeEvent('System::IsAllowedModule', [$this, 'onIsAllowedModule']);
		$this->subscribeEvent('Contacts::GetContact::after', [$this, 'onAfterGetContact']);
		$this->subscribeEvent('Contacts::GetContacts::after', [$this, 'onAfterGetContacts']);
		$this->subscribeEvent('Contacts::CheckAccessToObject::after', [$this, 'onAfterCheckAccessToObject']);
	}

	public function onIsAllowedModule($aArgs, &$mResult)
	{
		if ($aArgs['ModuleName'] === 'TeamContacts') {
			$oAuthenticatedUser = Api::getAuthenticatedUser();
				$iAccess = EnumsAccess::NoAccess;
				if ($oAuthenticatedUser) {
					$iAccess = $oAuthenticatedUser->getExtendedProp(self::GetName() . '::Access', EnumsAccess::NoAccess);
				}
				if ($iAccess === EnumsAccess::NoAccess) {
					$mResult = false;
				} else {
					$mResult = true;
				}
		}
	}

	public function onAfterCheckAccessToObject(&$aArgs, &$mResult)
	{
		$oUser = $aArgs['User'];
		$oContact = isset($aArgs['Contact']) ? $aArgs['Contact'] : null;

		if ($oUser && $oContact instanceof Contact && $oContact->Storage === StorageType::Team) {
			if ($oUser->Role === UserRole::SuperAdmin || $oUser->IdTenant === $oContact->IdTenant) {
				
				$Access = isset($aArgs['Access']) ? (int) $aArgs['Access'] : null;
				if (isset($Access)) {
					$iUserAccess = $oUser->getExtendedProp(self::GetName() . '::Access', EnumsAccess::NoAccess);
					if ($Access === $iUserAccess && $Access === EnumsAccess::Write) {
						$mResult = true;
					} else {
						$mResult = false;
					}
				} else {
					$mResult = true;
				}
			} else {
				$mResult = false;
			}
		}
	}

	public function onAfterGetContacts($aArgs, &$mResult)
	{
		if (\is_array($mResult) && \is_array($mResult['List'])) {
			foreach ($mResult['List'] as $iIndex => $aContact) {
				if ($aContact['Storage'] === StorageType::Team) {
					$oUser = \Aurora\System\Api::getAuthenticatedUser();
					if ($oUser) {
						$iUserAccess = $oUser->getExtendedProp(self::GetName() . '::Access', EnumsAccess::NoAccess);
						$aContact['ReadOnly'] = ($iUserAccess !== EnumsAccess::Write);
					}

					$mResult['List'][$iIndex] = $aContact;
				}
			}
		}
	}

	public function onAfterGetContact($aArgs, &$mResult)
	{
		if ($mResult) {
			$oUser = \Aurora\System\Api::getAuthenticatedUser();
			if ($oUser && $mResult->Storage === StorageType::Team) {
				$oUser = \Aurora\System\Api::getAuthenticatedUser();
				if ($oUser) {
					$iUserAccess = $oUser->getExtendedProp(self::GetName() . '::Access', EnumsAccess::NoAccess);
					$mResult->ExtendedInformation['ReadOnly'] = ($iUserAccess !== EnumsAccess::Write);
				}
			}
		}
	}

	public function GetUserAccess($UserId)
	{
		$iAccess = EnumsAccess::NoAccess;
		Api::checkUserRoleIsAtLeast(UserRole::TenantAdmin);

		$oAuthenticatedUser = Api::getAuthenticatedUser();
		$oUser = Api::getUserById($UserId);
		if ($oAuthenticatedUser && $oUser && ($oAuthenticatedUser->Role === UserRole::SuperAdmin || 
			($oAuthenticatedUser->Role === UserRole::TenantAdmin && $oAuthenticatedUser->IdTenant === $oUser->IdTenant))) {
				$iAccess = $oUser->getExtendedProp(self::GetName() . '::Access', EnumsAccess::NoAccess);
		}

		return $iAccess;
	}

	public function UpdateUserAccess($UserId, $Access = EnumsAccess::NoAccess)
	{
		$mResult = false;
		Api::checkUserRoleIsAtLeast(UserRole::TenantAdmin);

		$oAuthenticatedUser = Api::getAuthenticatedUser();
		$oUser = Api::getUserById($UserId);
		if ($oAuthenticatedUser && $oUser && ($oAuthenticatedUser->Role === UserRole::SuperAdmin || 
			($oAuthenticatedUser->Role === UserRole::TenantAdmin && $oAuthenticatedUser->IdTenant === $oUser->IdTenant))) {
				$oUser->setExtendedProp(self::GetName() . '::Access', $Access);
				$mResult = $oUser->save();
		}

		return $mResult;
	}

	public function GetUsersWithAccessToTeamContacts($TenantId) 
	{
		$aResult = [
			'ReadAccess' => [],
			'WriteAccess' => []
		];

		Api::checkUserRoleIsAtLeast(UserRole::TenantAdmin);

		$oAuthenticatedUser = Api::getAuthenticatedUser();
		if ($oAuthenticatedUser && ($oAuthenticatedUser->Role === UserRole::SuperAdmin || 
			($oAuthenticatedUser->Role === UserRole::TenantAdmin && $oAuthenticatedUser->IdTenant === $TenantId))) {

			$aUsers = User::where('IdTenant', $TenantId)->where('Properties->' . self::GetName() . '::Access', '<>', EnumsAccess::NoAccess)->get();
			foreach ($aUsers as $oUser) {
				if ($oUser->getExtendedProp(self::GetName() . '::Access') === EnumsAccess::Read) {
					$aResult['ReadAccess'][] = $oUser->PublicId;
				} elseif ($oUser->getExtendedProp(self::GetName() . '::Access') === EnumsAccess::Write) {
					$aResult['WriteAccess'][] = $oUser->PublicId;
				}
			}
		}

		return $aResult;
	}

	public function UpdateSettings($TenantId, $WriteAccess, $ReadAccess)
	{
		$bResult = false;
		Api::checkUserRoleIsAtLeast(UserRole::TenantAdmin);

		$aWriteAccessEmails = array_map(function ($item) {
			return $item['email'];
		}, $WriteAccess);
		$aReadAccessEmails = array_map(function ($item) {
			return $item['email'];
		}, $ReadAccess);

		$oAuthenticatedUser = Api::getAuthenticatedUser();
		if ($oAuthenticatedUser && ($oAuthenticatedUser->Role === UserRole::SuperAdmin || 
			($oAuthenticatedUser->Role === UserRole::TenantAdmin && $oAuthenticatedUser->IdTenant === $TenantId))) {
				$bResult = User::whereIn('PublicId', $aWriteAccessEmails)
					->update(['Properties->' . self::GetName() . '::Access' => EnumsAccess::Write]);
				$bResult = $bResult && User::whereIn('PublicId', $aReadAccessEmails)
					->update(['Properties->' . self::GetName() . '::Access' => EnumsAccess::Read]);
		}

		return $bResult;
	}
}
