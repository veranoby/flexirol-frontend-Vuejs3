import { defineStore } from 'pinia'
import { ref, reactive } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { api } from '@/services/pocketbase' // Assuming pocketbase service is configured

// Helper function to create a default company state
const defaultCompanyState = () => ({
  id: null,
  owner_id: null,
  company_name: '',
  flexirol: 0, // Default to min as per PB schema
  flexirol2: 0, // Default to min as per PB schema
  flexirol3: '1', // Default to "1"
  dia_inicio: 1, // Default to min as per PB schema
  dia_cierre: 1, // Default to min as per PB schema
  porcentaje: 0, // Default to min as per PB schema
  dia_bloqueo: 0, // Default to min as per PB schema
  frecuencia: 1, // Default to min as per PB schema
  dia_reinicio: 1, // Default to min as per PB schema
  // Add other fields from pocketbase_flexirol_schema.txt if they are part of this config view
})

export const useCompaniesStore = defineStore('companies', () => {
  const authStore = useAuthStore()

  const companyConfig = reactive(defaultCompanyState())
  const loading = ref(false)
  const error = ref(null)

  async function fetchCompanyConfig(companyId) {
    if (!companyId) {
      error.value = 'Company ID is required to fetch configuration.'
      console.error(error.value)
      companyConfig.value = defaultCompanyState() // Reset to default
      return
    }

    loading.value = true
    error.value = null
    try {
      const record = await api.collection('companies').getOne(companyId)
      // Map PocketBase record to our reactive state
      companyConfig.id = record.id
      companyConfig.owner_id = record.owner_id
      companyConfig.company_name = record.company_name || ''
      companyConfig.flexirol = record.flexirol !== undefined ? Number(record.flexirol) : defaultCompanyState().flexirol
      companyConfig.flexirol2 = record.flexirol2 !== undefined ? Number(record.flexirol2) : defaultCompanyState().flexirol2
      companyConfig.flexirol3 = record.flexirol3 || defaultCompanyState().flexirol3
      companyConfig.dia_inicio = record.dia_inicio !== undefined ? Number(record.dia_inicio) : defaultCompanyState().dia_inicio
      companyConfig.dia_cierre = record.dia_cierre !== undefined ? Number(record.dia_cierre) : defaultCompanyState().dia_cierre
      companyConfig.porcentaje = record.porcentaje !== undefined ? Number(record.porcentaje) : defaultCompanyState().porcentaje
      companyConfig.dia_bloqueo = record.dia_bloqueo !== undefined ? Number(record.dia_bloqueo) : defaultCompanyState().dia_bloqueo
      companyConfig.frecuencia = record.frecuencia !== undefined ? Number(record.frecuencia) : defaultCompanyState().frecuencia
      companyConfig.dia_reinicio = record.dia_reinicio !== undefined ? Number(record.dia_reinicio) : defaultCompanyState().dia_reinicio

      // console.log('Fetched company config:', companyConfig)

    } catch (e) {
      error.value = `Failed to fetch company configuration: ${e.message}`
      console.error(error.value, e)
      // Reset to default or keep stale data? For now, reset.
      Object.assign(companyConfig, defaultCompanyState())
    } finally {
      loading.value = false
    }
  }

  async function saveCompanyConfig() {
    if (!authStore.isSuperadmin) {
      error.value = 'Only superadmins can save company configuration.'
      console.error(error.value)
      return false
    }

    if (!companyConfig.id) {
      error.value = 'Company ID is missing. Cannot update configuration.'
      console.error(error.value)
      return false
    }

    loading.value = true
    error.value = null

    // Prepare data for PocketBase, ensuring correct types
    const dataToSave = {
      // owner_id and company_name might not be editable here, or handled by another process
      // For now, only saving fields mentioned as editable by superadmin in legacy
      flexirol: Number(companyConfig.flexirol),
      flexirol2: Number(companyConfig.flexirol2),
      flexirol3: String(companyConfig.flexirol3), // Ensure it's a string "1" or "2"
      dia_inicio: Number(companyConfig.dia_inicio),
      dia_cierre: Number(companyConfig.dia_cierre),
      porcentaje: Number(companyConfig.porcentaje),
      dia_bloqueo: Number(companyConfig.dia_bloqueo),
      frecuencia: Number(companyConfig.frecuencia),
      dia_reinicio: Number(companyConfig.dia_reinicio),
    }

    // Validate ranges before saving - This can also be done in the component
    // For simplicity in store, assuming component handles fine-grained validation display
    // but basic type and presence can be checked here or by PB rules.

    try {
      await api.collection('companies').update(companyConfig.id, dataToSave)
      // Optionally, re-fetch or update local state if PB returns the updated record
      // For now, assume the local state is the source of truth for the update
      // console.log('Company configuration updated successfully.');
      return true
    } catch (e) {
      error.value = `Failed to save company configuration: ${e.message}`
      console.error(error.value, e)
      return false
    } finally {
      loading.value = false
    }
  }

  // Function to update a specific field, useful for increment/decrement
  function updateField(field, value) {
    if (companyConfig.hasOwnProperty(field)) {
      companyConfig[field] = value
    }
  }

  // Reset to default state, could be used on logout or error
  function resetConfig() {
    Object.assign(companyConfig, defaultCompanyState())
    error.value = null
  }

  return {
    companyConfig,
    loading,
    error,
    fetchCompanyConfig,
    saveCompanyConfig,
    updateField,
    resetConfig,
    // Expose default state for potential use in component
    defaultCompanyState
  }
})
