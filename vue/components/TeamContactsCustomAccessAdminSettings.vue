<template>
  <q-scroll-area class="full-height full-width relative-position">
    <div class="q-pa-lg ">
      <div class="row q-mb-md">
        <div class="col text-h5" v-t="'TEAMCONTACTSCUSTOMACCESS.HEADING_SETTINGS_TAB'"></div>
      </div>
      <q-card flat bordered class="card-edit-settings">
        <q-card-section>
          <div class="row q-mt-md">
            <div class="col-2 q-mt-sm" v-t="'TEAMCONTACTSCUSTOMACCESS.READ_ACCESS_LABEL'"></div>
            <div class="col-10">
               <q-select
                dense outlined bg-color="white"
                use-input use-chips multiple
                v-model="selectedUserOptions" :options="userOptions"
                @filter="getUserOptions"
              >
                <!-- <template v-slot:selected>
                  <span v-if="selectedUserOptions" class="users-container">
                    <q-chip flat v-for="option in selectedUserOptions" :key="option.value" removable @remove="removeFromSelectedUsers(option.value)">
                      <div class="ellipsis">
                        {{ option.label }}
                      </div>
                    </q-chip>
                  </span>
                </template>
                <template v-slot:no-option>
                  <q-item>
                    <q-item-section class="text-grey" v-t="'TEAMCONTACTSCUSTOMACCESS.LABEL_USERS_NO_OPTIONS'"></q-item-section>
                  </q-item>
                </template>
                <template v-slot:option="scope">
                  <q-item v-close-popup v-bind="scope.itemProps" v-on="scope.itemEvents">
                    <q-item-section class="non-selectable">
                      <q-item-label>
                        {{ scope.opt.label }}
                      </q-item-label>
                    </q-item-section>
                  </q-item>
                </template> -->
              </q-select>
            </div>
          </div>
          <div class="row q-mt-md">
            <div class="col-2 q-mt-sm" v-t="'TEAMCONTACTSCUSTOMACCESS.WRITE_ACCESS_LABEL'"></div>
            <div class="col-10">
 
            </div>
          </div>
        </q-card-section>
      </q-card>
    </div>
  </q-scroll-area>
</template>

<script>
import _ from 'lodash'

import errors from 'src/utils/errors'
import notification from 'src/utils/notification'
import typesUtils from 'src/utils/types'
import webApi from 'src/utils/web-api'

import cache from 'src/cache'
import modulesManager from 'src/modules-manager'
import settings from 'src/settings'

import UserModel from 'src/classes/user'

import enums from 'src/enums'
let UserRoles = {}

export default {
  name: 'TeamContactsCustomAccessAdminSettings',

  props: {
    deletingIds: Array,
    createMode: Boolean,
  },

  data() {
    return {
      otherDataComponents: [],

      allowMakeTenant: settings.getEnableMultiTenant() || true,

      user: null,
      publicId: '',
      isTenantAdmin: false,
      writeSeparateLog: false,

      selectedUserOptions: [],
      userOptions: [],

      loading: false,
      saving: false,
    }
  },

  computed: {
    currentTenantId () {
      return this.$store.getters['tenants/getCurrentTenantId']
    },
  },

  methods: {
    async getUserOtherDataComponents () {
      this.otherDataComponents = await modulesManager.getUserOtherDataComponents()
    },
    
    // parseRoute () {
    //   if (this.createMode) {
    //     const user = new UserModel(this.currentTenantId, {})
    //     this.fillUp(user)
    //   } else {
    //     const userId = typesUtils.pPositiveInt(this.$route?.params?.id)
    //     if (this.user?.id !== userId) {
    //       this.user = {
    //         id: userId,
    //       }
    //       this.populate()
    //     }
    //   }
    // },

    // clear () {
    //   this.publicId = ''
    //   this.isTenantAdmin = false
    //   this.writeSeparateLog = false
    // },

    // fillUp (user) {
    //   this.user = user
    //   this.publicId = user.publicId
    //   this.isTenantAdmin = user.role === UserRoles.TenantAdmin
    //   this.writeSeparateLog = user.writeSeparateLog
    //   this.selectedGroupOptions = user.groups.map(group => {
    //     return {
    //       label: group.name,
    //       value: group.id
    //     }
    //   })
    // },

    // populate () {
    //   this.clear()
    //   this.loading = true
    //   cache.getUser(this.currentTenantId, this.user.id).then(({ user, userId }) => {
    //     if (userId === this.user.id) {
    //       this.loading = false
    //       if (user) {
    //         this.fillUp(user)
    //       } else {
    //         this.$emit('no-user-found')
    //       }
    //     }
    //   })
    // },

    getUserOptions (search, update, abort) {
        let parameters = {
          TenantId: this.currentTenantId,
          Offset: 0, 
          Limit: 0, 
          OrderBy: 'PublicId', 
          OrderType: 0, 
          Search: search
        };
        update(() => {
        webApi.sendRequest({
          moduleName: 'Core',
          methodName: 'GetUsers',
          parameters,
        }).then(result => {
          this.saving = false
          this.userOptions = _.map(result.Items, user => {
            return user.PublicId
          });
        }, response => {
          this.saving = false
          notification.showError(errors.getTextFromResponse(response, this.$t('ADMINPANELWEBCLIENT.ERROR_UPDATE_ENTITY_USER')))
        })
        })

    //   const searchLowerCase = search.toLowerCase()
    //   const selectedGroupsIds = this.selectedUserOptions.map(option => option.value)
    //   let groups = this.allTenantGroups.filter(group => selectedUserIds.indexOf(group.id) === -1)
    //   if (searchLowerCase !== '') {
    //     groups = groups.filter(group => group.name.toLowerCase().indexOf(searchLowerCase) !== -1)
    //   }
    //   update(() => {
    //     this.userOptions = groups
    //       .map(group => {
    //         return {
    //           label: group.name,
    //           value: group.id
    //         }
    //       })
    //       .slice(0, 100)
    //   })
    },

    removeFromSelectedUsers (value) {
//      this.selectedUserOptions = this.selectedUserOptions.filter(option => option.value !== value)
    },

    /**
     * Method is used in doBeforeRouteLeave mixin
     */
    hasChanges () {
      if (this.loading) {
        return false
      }

      const hasOtherDataChanges = _.isFunction(this.$refs?.otherDataComponents?.some)
        ? this.$refs.otherDataComponents.some(component => {
          return _.isFunction(component.hasChanges) ? component.hasChanges() : false
        })
        : false
      return hasOtherDataChanges || this.isTenantAdmin !== (this.user?.role === UserRoles.TenantAdmin) ||
        this.writeSeparateLog !== this.user?.writeSeparateLog || this.hasGroupChanges()
    },

    hasUserChanges () {
    //   const selectedIds = this.selectedUserOptions.map(option => option.value).sort()
    //   const userIds = (this.user.groups || []).map(group => group.id).sort()
    //   return !_.isEqual(selectedIds, userIds)
    },

    /**
     * Method is used in doBeforeRouteLeave mixin,
     * do not use async methods - just simple and plain reverting of values
     * !! hasChanges method must return true after executing revertChanges method
     */
    revertChanges () {
      if (_.isFunction(this.$refs?.otherDataComponents?.forEach)) {
        this.$refs.otherDataComponents.forEach(component => {
          if (_.isFunction(component.revertChanges)) {
            component.revertChanges()
          }
        })
      }
      this.isTenantAdmin = (this.user?.role === UserRoles.TenantAdmin)
    },

    isDataValid () {
      const isOtherDataValid = _.isFunction(this.$refs?.otherDataComponents?.every)
        ? this.$refs.otherDataComponents.every(component => {
          return _.isFunction(component.isDataValid) ? component.isDataValid() : true
        })
        : true
      return isOtherDataValid
    },

    isUserEmailValid () {
    //   const userData = this.$refs.mainDataComponent.getSaveParameters()
    //   const userEmail = userData.PublicId
    //   const userNamePart = userEmail.slice(0, userEmail.lastIndexOf('@'))
    //   const invalidCharactersRegex = /[@\s]/
    //   return !invalidCharactersRegex.test(userNamePart) && userNamePart.length
    },

    handleSave () {
      this.isUserEmailValid()
        ? this.save()
        : notification.showError(this.$t('ADMINPANELWEBCLIENT.ERROR_INVALID_EMAIL_USERNAME_PART'))
    },

    save () {
      if (!this.saving && this.isDataValid()) {
        this.saving = true
        let parameters = _.extend({
          UserId: this.user.id,
          TenantId: this.user.tenantId,
          Role: this.isTenantAdmin ? UserRoles.TenantAdmin : UserRoles.NormalUser,
          WriteSeparateLog: this.writeSeparateLog,
          Forced: true,
          GroupIds: this.selectedGroupOptions.map(option => option.value)
        }, mainDataParameters)
        if (_.isFunction(this.$refs?.otherDataComponents?.forEach)) {
          this.$refs.otherDataComponents.forEach(component => {
            const otherParameters = _.isFunction(component.getSaveParameters)
              ? component.getSaveParameters()
              : {}
            parameters = _.extend(parameters, otherParameters)
          })
        }

        webApi.sendRequest({
          moduleName: 'Core',
          methodName: this.createMode ? 'CreateUser' : 'UpdateUser',
          parameters,
        }).then(result => {
          this.saving = false
          if (this.createMode) {
            this.handleCreateResult(result, parameters)
          } else {
            this.handleUpdateResult(result, parameters)
          }
        }, response => {
          this.saving = false
          const errorConst = this.createMode ? 'ERROR_CREATE_ENTITY_USER' : 'ERROR_UPDATE_ENTITY_USER'
          notification.showError(errors.getTextFromResponse(response, this.$t('ADMINPANELWEBCLIENT.' + errorConst)))
        })
      }
    },

    handleCreateResult (result, parameters) {
      if (_.isSafeInteger(result)) {
        notification.showReport(this.$t('ADMINPANELWEBCLIENT.REPORT_CREATE_ENTITY_USER'))
        this.user.update(parameters)
        this.$emit('user-created', result)
      } else {
        notification.showError(this.$t('ADMINPANELWEBCLIENT.ERROR_CREATE_ENTITY_USER'))
      }
    },

    handleUpdateResult (result, parameters) {
      if (result === true) {
        cache.getUser(parameters.TenantId, parameters.UserId).then(({ user }) => {
          user.update(parameters, this.allTenantGroups)
          this.populate()
        })
        notification.showReport(this.$t('ADMINPANELWEBCLIENT.REPORT_UPDATE_ENTITY_USER'))
      } else {
        notification.showError(this.$t('ADMINPANELWEBCLIENT.ERROR_UPDATE_ENTITY_USER'))
      }
    },

    cancel () {
      this.revertChanges()
      this.$emit('cancel-create')
    },

    deleteUser () {
      this.$emit('delete-user', this.user.id)
    },
  },
}
</script>

<style scoped>
.users-container {
  display: block;
  width: 100%;
}
</style>