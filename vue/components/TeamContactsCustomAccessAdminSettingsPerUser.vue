<template>
  <q-scroll-area class="full-height full-width">
    <div class="q-pa-lg">
      <div class="row q-mb-md">
        <div class="col text-h5">{{ $t('TEAMCONTACTSCUSTOMACCESS.HEADING_SETTINGS_TAB') }}</div>
      </div>
      <q-card flat bordered class="card-edit-settings">
        <q-card-section>
          <div class="row">
            <q-radio
              dense
              v-model="userAccess"
              :val="0"
              :label="$t('TEAMCONTACTSCUSTOMACCESS.LABEL_NOACCESS_ACCESS')"
            />
            <q-radio
              class="q-ml-md"
              dense
              v-model="userAccess"
              :val="2"
              :label="$t('TEAMCONTACTSCUSTOMACCESS.LABEL_READ_ACCESS')"
            />
            <q-radio
              class="q-ml-md"
              dense
              v-model="userAccess"
              :val="1"
              :label="$t('TEAMCONTACTSCUSTOMACCESS.LABEL_WRITE_ACCESS')"
            />
          </div>
        </q-card-section>
      </q-card>
      <div class="q-pt-md text-right">
        <q-btn
          unelevated
          no-caps
          dense
          class="q-px-sm"
          :ripple="false"
          color="primary"
          :label="$t('COREWEBCLIENT.ACTION_SAVE')"
          @click="updateSettingsForEntity"
        />
      </div>
    </div>
    <q-inner-loading style="justify-content: flex-start" :showing="loading || saving">
      <q-linear-progress query />
    </q-inner-loading>
  </q-scroll-area>
</template>

<script>
import _ from 'lodash'

import errors from 'src/utils/errors'
import notification from 'src/utils/notification'
import typesUtils from 'src/utils/types'
import webApi from 'src/utils/web-api'

import cache from 'src/cache'

export default {
  name: 'TeamContactsCustomAccessAdminSettingsPerUser',

  data() {
    return {
      user: null,
      saving: false,
      loading: false,
      userAccess: 0,
    }
  },

  watch: {
    $route(to, from) {
      this.parseRoute()
    },
  },

  beforeRouteLeave(to, from, next) {
    this.$root.doBeforeRouteLeave(to, from, next)
  },

  mounted() {
    this.parseRoute()
  },

  methods: {
    getAccessFromUser() {
      const userCompleteData = typesUtils.pObject(this.user?.completeData)
      return typesUtils.pInt(userCompleteData['TeamContactsCustomAccess::Access'])
    },

    /**
     * Method is used in doBeforeRouteLeave mixin
     */
    hasChanges() {
      const userAccess = this.getAccessFromUser()
      return this.userAccess !== userAccess
    },

    /**
     * Method is used in doBeforeRouteLeave mixin,
     * do not use async methods - just simple and plain reverting of values
     * !! hasChanges method must return true after executing revertChanges method
     */
    revertChanges() {
      this.userAccess = this.getAccessFromUser()
    },

    parseRoute() {
      const userId = typesUtils.pPositiveInt(this.$route?.params?.id)
      if (this.user?.id !== userId) {
        this.user = {
          id: userId,
        }
        this.populate()
      }
    },

    populate() {
      this.loading = true
      const currentTenantId = this.$store.getters['tenants/getCurrentTenantId']
      cache.getUser(currentTenantId, this.user.id).then(({ user, userId }) => {
        if (userId === this.user.id) {
          this.loading = false
          if (user && _.isFunction(user?.getData)) {
            this.user = user
            this.userAccess = this.getAccessFromUser()
          } else {
            this.$emit('no-user-found')
          }
        }
      })
    },
    updateSettingsForEntity() {
      if (!this.saving) {
        this.saving = true
        const parameters = {
          UserId: this.user?.id,
          Access: typesUtils.pInt(this.userAccess),
        }
        webApi
          .sendRequest({
            moduleName: 'TeamContactsCustomAccess',
            methodName: 'UpdateUserAccess',
            parameters,
          })
          .then(
            (result) => {
              this.saving = false
              if (result) {
                cache.getUser(this.user.tenantId, this.user?.id).then(({ user }) => {
                  user.updateData([
                    {
                      field: 'TeamContactsCustomAccess::Access',
                      value: typesUtils.pInt(this.userAccess),
                    },
                  ])
                  this.populate()
                })
                notification.showReport(this.$t('COREWEBCLIENT.REPORT_SETTINGS_UPDATE_SUCCESS'))
              } else {
                notification.showError(this.$t('COREWEBCLIENT.ERROR_SAVING_SETTINGS_FAILED'))
              }
            },
            (response) => {
              this.saving = false
              notification.showError(
                errors.getTextFromResponse(response, this.$t('COREWEBCLIENT.ERROR_SAVING_SETTINGS_FAILED'))
              )
            }
          )
      }
    },
  },
}
</script>
