<template>
  <q-scroll-area class="full-height full-width relative-position">
    <div class="q-pa-lg">
      <div class="row q-mb-md">
        <div class="col text-h5" v-t="'TEAMCONTACTSCUSTOMACCESS.HEADING_SETTINGS_TAB'"></div>
      </div>
      <q-card flat bordered class="card-edit-settings">
        <q-card-section>
          <div class="row q-mt-md">
            <div class="col-2 q-mt-sm" v-t="'TEAMCONTACTSCUSTOMACCESS.LABEL_TENANT_READ_ACCESS'"></div>
            <div class="col-10">
              <select-team-contacts
                :initialSelectedOptions="readAccessOnServer"
                ref="readAccessTeamContacts"
              ></select-team-contacts>
            </div>
          </div>
          <div class="row q-mt-md">
            <div class="col-2 q-mt-sm" v-t="'TEAMCONTACTSCUSTOMACCESS.LABEL_TENANT_WRITE_ACCESS'"></div>
            <div class="col-10">
              <select-team-contacts
                :initialSelectedOptions="writeAccessOnServer"
                ref="writeAccessTeamContacts"
              ></select-team-contacts>
            </div>
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
          @click="save"
        />
      </div>
    </div>
    <q-inner-loading style="justify-content: flex-start" :showing="loading || saving">
      <q-linear-progress query />
    </q-inner-loading>
  </q-scroll-area>
</template>

<script>
import notification from 'src/utils/notification'
import textUtils from 'src/utils/text'
import webApi from 'src/utils/web-api'

import SelectTeamContacts from './SelectTeamContacts'

export default {
  name: 'TeamContactsCustomAccessAdminSettingsPerTenant',

  components: {
    SelectTeamContacts,
  },

  data() {
    return {
      readAccessOnServer: [],
      writeAccessOnServer: [],

      loading: false,
      saving: false,
    }
  },

  computed: {
    currentTenantId() {
      return this.$store.getters['tenants/getCurrentTenantId']
    },
  },

  beforeRouteLeave(to, from, next) {
    this.$root.doBeforeRouteLeave(to, from, next)
  },

  mounted() {
    this.populate()
  },

  methods: {
    populate() {
      this.loading = true
      const parameters = {
        TenantId: this.currentTenantId,
      }
      webApi
        .sendRequest({
          moduleName: 'TeamContactsCustomAccess',
          methodName: 'GetUsersWithAccessToTeamContacts',
          parameters,
        })
        .then(
          (result) => {
            this.loading = false
            this.readAccessOnServer = Array.isArray(result && result.ReadAccess) ? result.ReadAccess : []
            this.writeAccessOnServer = Array.isArray(result && result.WriteAccess) ? result.WriteAccess : []
          },
          (response) => {
            this.loading = false
          }
        )
    },

    /**
     * Method is used in doBeforeRouteLeave mixin
     */
    hasChanges() {
      if (this.loading) {
        return false
      }

      const readAccessTeamContacts = this?.$refs?.readAccessTeamContacts,
        readAccessHasChanges =
          typeof readAccessTeamContacts?.hasChanges === 'function' ? readAccessTeamContacts.hasChanges() : [],
        writeAccessTeamContacts = this?.$refs?.writeAccessTeamContacts,
        writeAccessHasChanges =
          typeof writeAccessTeamContacts?.hasChanges === 'function' ? writeAccessTeamContacts.hasChanges() : []

      return readAccessHasChanges || writeAccessHasChanges
    },

    /**
     * Method is used in doBeforeRouteLeave mixin,
     * do not use async methods - just simple and plain reverting of values
     * !! hasChanges method must return true after executing revertChanges method
     */
    revertChanges() {
      const readAccessTeamContacts = this?.$refs?.readAccessTeamContacts,
        writeAccessTeamContacts = this?.$refs?.writeAccessTeamContacts
      if (typeof readAccessTeamContacts?.revertChanges === 'function') {
        readAccessTeamContacts.revertChanges()
      }
      if (typeof writeAccessTeamContacts?.revertChanges === 'function') {
        writeAccessTeamContacts.revertChanges()
      }
    },

    commitChanges() {
      const readAccessTeamContacts = this?.$refs?.readAccessTeamContacts,
        writeAccessTeamContacts = this?.$refs?.writeAccessTeamContacts
      if (typeof readAccessTeamContacts?.commitChanges === 'function') {
        readAccessTeamContacts.commitChanges()
      }
      if (typeof writeAccessTeamContacts?.commitChanges === 'function') {
        writeAccessTeamContacts.commitChanges()
      }
    },

    isValid(readAccessEmails, writeAccessEmails) {
      const conflictEmails = readAccessEmails.filter((email) => writeAccessEmails.includes(email))
      if (conflictEmails.length > 0) {
        const textReplacer = {
            CONFLICT_EMAILS: textUtils.encodeHtml(conflictEmails.join(', ')),
          },
          conflictsCount = conflictEmails.length
        notification.showError(this.$tc('TEAMCONTACTSCUSTOMACCESS.ERROR_CONFLICT_EMAILS', conflictsCount, textReplacer))
        return false
      }
      return true
    },

    save() {
      if (this.saving) {
        return
      }

      const readAccessTeamContacts = this?.$refs?.readAccessTeamContacts,
        readAccessSelectedOptions =
          typeof readAccessTeamContacts?.getSelectedOptions === 'function'
            ? readAccessTeamContacts.getSelectedOptions()
            : [],
        writeAccessTeamContacts = this?.$refs?.writeAccessTeamContacts,
        writeAccessSelectedOptions =
          typeof writeAccessTeamContacts?.getSelectedOptions === 'function'
            ? writeAccessTeamContacts.getSelectedOptions()
            : [],
        parameters = {
          TenantId: this.currentTenantId,
          ReadAccess: readAccessSelectedOptions,
          WriteAccess: writeAccessSelectedOptions,
        }
      if (!this.isValid(readAccessSelectedOptions, writeAccessSelectedOptions)) {
        return
      }

      this.saving = true
      webApi
        .sendRequest({
          moduleName: 'TeamContactsCustomAccess',
          methodName: 'UpdateSettings',
          parameters,
        })
        .then(
          (result) => {
            this.saving = false
            this.commitChanges()
            notification.showReport(this.$t('COREWEBCLIENT.REPORT_SETTINGS_UPDATE_SUCCESS'))
          },
          (response) => {
            this.saving = false
            notification.showError(this.$t('COREWEBCLIENT.ERROR_SAVING_SETTINGS_FAILED'))
          }
        )
    },
  },
}
</script>

<style scoped></style>
