<template>
  <q-select dense outlined bg-color="white" use-input use-chips multiple
            v-model="selectedOptions" :options="options" @filter="getOptions"
  >
    <template v-slot:selected>
      <span v-if="selectedOptions">
        <q-chip flat removable v-for="option in selectedOptions" :key="option.value"
                @remove="removeFromSelectedOptions(option.value)"
        >
          <div class="ellipsis">{{ option.label }}</div>
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
</template>

<script>
import webApi from 'src/utils/web-api'

import enums from 'src/enums'
let UserRoles = {}

export default {
  name: 'SelectTeamContacts',

  props: {
    initialSelectedOptions: Array,
  },

  data() {
    return {
      options: [],
      selectedOptions: [],
      savedSelectedOptions: [],
    }
  },

  computed: {
    currentTenantId () {
      return this.$store.getters['tenants/getCurrentTenantId']
    },
  },

  watch: {
    initialSelectedOptions () {
      this.savedSelectedOptions = [...this.initialSelectedOptions]
      this.fillUpSelectedOptions()
    },
  },

  mounted() {
    UserRoles = enums.getUserRoles()
    this.savedSelectedOptions = [...this.initialSelectedOptions]
    this.fillUpSelectedOptions()
  },

  methods: {
    fillUpSelectedOptions () {
      this.selectedOptions = this.savedSelectedOptions.map(email => {
        return {
          label: email,
          value: email,
        }
      })
    },

    getOptions (search, update, abort) {
      const parameters = {
        TenantId: this.currentTenantId,
        Search: search,
        Offset: 0,
        Limit: 20
      }
      update(() => {
        webApi.sendRequest({
          moduleName: 'Core',
          methodName: 'GetUsers',
          parameters,
        }).then(result => {
          const userList = Array.isArray(result.Items) ? result.Items : []
          this.options = userList
            .filter(user => user.Role !== UserRoles.TenantAdmin)
            .map(user => {
              return {
                label: user.PublicId,
                value: user.PublicId
              }
            })
        }, response => {
          this.options = []
        })
      })
    },

    removeFromSelectedOptions (value) {
      this.selectedOptions = this.selectedOptions.filter(option => option.value !== value)
    },

    getSelectedOptions () {
      return this.selectedOptions.map(option => option.value)
    },

    hasChanges () {
      const
        savedSelectedOptions = [...this.savedSelectedOptions].sort(),
        selectedOptions = this.selectedOptions.map(option => option.value).sort()
      return savedSelectedOptions.join(',') !== selectedOptions.join(',')
    },

    revertChanges () {
      this.fillUpSelectedOptions()
    },

    commitChanges () {
      this.savedSelectedOptions = this.selectedOptions.map(option => option.value)
      this.fillUpSelectedOptions()
    },
  },
}
</script>

<style scoped>
</style>
