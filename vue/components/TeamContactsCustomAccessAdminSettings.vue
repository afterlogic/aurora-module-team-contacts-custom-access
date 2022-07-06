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
                v-model="selectedReadAccessOptions" :options="readAccessOptions"
                @filter="getReadAccessOptions"
              >
                <template v-slot:selected>
                  <span v-if="selectedReadAccessOptions">
                    <q-chip flat v-for="option in selectedReadAccessOptions" :key="option.value" removable @remove="removeFromSelectedReadAccessOptions(option.value)">
                      <div class="ellipsis">
                        {{ option.label }}
                      </div>
                    </q-chip>
                  </span>
                </template>
                <template v-slot:no-option>
                  <q-item>
                    <q-item-section class="text-grey" v-t="'TEAMCONTACTSCUSTOMACCESS.LABEL_CONTACTS_NO_OPTIONS'"></q-item-section>
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
                </template>
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
      <div class="q-pt-md text-right">
        <q-btn unelevated no-caps dense class="q-px-sm" :ripple="false" color="primary"
               :label="$t('COREWEBCLIENT.ACTION_SAVE')" @click="save"/>
      </div>
    </div>
  </q-scroll-area>
</template>

<script>
import notification from 'src/utils/notification'
import webApi from 'src/utils/web-api'

import settings from 'src/settings'

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

      readAccessOptions: [],
      selectedReadAccessOptions: [],
      readAccessOnServer: [],

      loading: false,
      saving: false,
    }
  },

  computed: {
    currentTenantId () {
      return this.$store.getters['tenants/getCurrentTenantId']
    },
  },

  watch: {
    $route(to, from) {
      this.parseRoute()
    },
  },

  beforeRouteLeave (to, from, next) {
    this.doBeforeRouteLeave(to, from, next)
  },

  mounted() {
    this.parseRoute()
  },

  methods: {
    parseRoute () {
      this.populate()
    },

    clear () {
      this.selectedReadAccessOptions = []
    },

    populate () {
      this.clear()
      this.loading = true
      const parameters = {
        TenantId: this.currentTenantId
      }
      webApi.sendRequest({
        moduleName: 'TeamContactsCustomAccess',
        methodName: 'GetUsersWithAccessToTeamContacts',
        parameters,
      }).then(result => {
        this.loading = false
        this.readAccessOnServer = Array.isArray(result && result.ReadAccess) ? result.ReadAccess : []
        this.selectedReadAccessOptions = this.readAccessOnServer.map(email => {
          return {
            label: email,
            value: email,
          }
        })
      }, response => {
        this.loading = false
      })
    },

    getReadAccessOptions (search, update, abort) {
      const parameters = {
        TenantId: this.currentTenantId,
        Offset: 0,
        Limit: 0,
        OrderBy: 'PublicId',
        OrderType: 0,
        Search: search
      }
      update(() => {
        webApi.sendRequest({
          moduleName: 'Core',
          methodName: 'GetUsers',
          parameters,
        }).then(result => {
          const userList = Array.isArray(result.Items) ? result.Items : []
          this.readAccessOptions = userList.map(user => {
            return {
              label: user.PublicId,
              value: user.PublicId
            }
          })
        }, response => {
          this.readAccessOptions = []
        })
      })
    },

    removeFromSelectedReadAccessOptions (value) {
      this.selectedReadAccessOptions = this.selectedReadAccessOptions.filter(option => option.value !== value)
    },

    /**
     * Method is used in doBeforeRouteLeave mixin
     */
    hasChanges () {
      if (this.loading) {
        return false
      }

      const
        readAccessOnServer = this.readAccessOnServer.sort(),
        readAccess = this.selectedReadAccessOptions.map(option => option.value).sort()

      return readAccessOnServer.join(',') !== readAccess.join(',')
    },

    /**
     * Method is used in doBeforeRouteLeave mixin,
     * do not use async methods - just simple and plain reverting of values
     * !! hasChanges method must return true after executing revertChanges method
     */
    revertChanges () {
      this.readAccessOnServer = this.selectedReadAccessOptions.map(option => option.value)
    },

    save () {
      if (!this.saving) {
        this.saving = true
        const parameters = {
          WriteAccess: [],
          ReadAccess: this.selectedReadAccessOptions.map(option => {
            return {
              name: '',
              email: option.value,
              fullEmail: option.value,
            }
          }),
          TenantId: this.currentTenantId
        }
        webApi.sendRequest({
          moduleName: 'TeamContactsCustomAccess',
          methodName: 'UpdateSettings',
          parameters,
        }).then(result => {
          this.saving = false
          notification.showReport(this.$t('COREWEBCLIENT.REPORT_SETTINGS_UPDATE_SUCCESS'))
        }, response => {
          this.saving = false
          notification.showError(this.$t('COREWEBCLIENT.ERROR_SAVING_SETTINGS_FAILED'))
        })
      }
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
