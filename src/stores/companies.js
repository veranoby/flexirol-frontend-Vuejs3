import { defineStore } from 'pinia'
import { ref, reactive } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { pb, api } from '@/services/pocketbase'

// Helper function to create a default company state
const defaultCompanyState = () => ({
  id: null,
  owner_id: null,
  company_name: '',
  flexirol: 0,
  flexirol2: 0,
  flexirol3: '1',
  dia_inicio: 1,
  dia_cierre: 1,
  porcentaje: 0,
  dia_bloqueo: 0,
  frecuencia: 1,
  dia_reinicio: 1,
})

export const useCompaniesStore = defineStore('companies', () => {
  const authStore = useAuthStore()

  // ===== COMPANY CONFIG STATE =====
  const companyConfig = reactive(defaultCompanyState())
  const loading = ref(false)
  const error = ref(null)

  // ===== GLOBAL SYSTEM CONFIG STATE =====
  const globalConfig = ref(null)
  const globalConfigLoading = ref(false)
  const globalConfigError = ref(null)

  // ===== HELPER FUNCTIONS =====
  function _setCompanyConfig(record) {
    companyConfig.id = record.id
    companyConfig.owner_id = record.owner_id
    companyConfig.company_name = record.company_name || ''
    companyConfig.flexirol =
      record.flexirol !== undefined ? Number(record.flexirol) : defaultCompanyState().flexirol
    companyConfig.flexirol2 =
      record.flexirol2 !== undefined ? Number(record.flexirol2) : defaultCompanyState().flexirol2
    companyConfig.flexirol3 = record.flexirol3 || defaultCompanyState().flexirol3
    companyConfig.dia_inicio =
      record.dia_inicio !== undefined ? Number(record.dia_inicio) : defaultCompanyState().dia_inicio
    companyConfig.dia_cierre =
      record.dia_cierre !== undefined ? Number(record.dia_cierre) : defaultCompanyState().dia_cierre
    companyConfig.porcentaje =
      record.porcentaje !== undefined ? Number(record.porcentaje) : defaultCompanyState().porcentaje
    companyConfig.dia_bloqueo =
      record.dia_bloqueo !== undefined
        ? Number(record.dia_bloqueo)
        : defaultCompanyState().dia_bloqueo
    companyConfig.frecuencia =
      record.frecuencia !== undefined ? Number(record.frecuencia) : defaultCompanyState().frecuencia
    companyConfig.dia_reinicio =
      record.dia_reinicio !== undefined
        ? Number(record.dia_reinicio)
        : defaultCompanyState().dia_reinicio
  }

  // ===== COMPANY CONFIG FUNCTIONS =====
  async function fetchCompanyById(companyId) {
    loading.value = true
    error.value = null
    try {
      const record = await pb.collection('companies').getOne(companyId)
      _setCompanyConfig(record)
    } catch (e) {
      error.value = `Failed to fetch company configuration for ID ${companyId}: ${e.message}`
      console.error(error.value, e)
      Object.assign(companyConfig, defaultCompanyState())
    } finally {
      loading.value = false
    }
  }

  async function fetchCompanyToConfigure() {
    loading.value = true
    error.value = null
    Object.assign(companyConfig, defaultCompanyState())

    if (!authStore.user) {
      error.value = 'User not authenticated. Cannot determine company to configure.'
      loading.value = false
      return
    }

    let companyIdToFetch = null

    if (authStore.isEmpresa || authStore.isSuperadmin) {
      if (authStore.user.assigned_companies && authStore.user.assigned_companies.length > 0) {
        companyIdToFetch = authStore.user.assigned_companies[0]
      } else if (authStore.user.company_id) {
        companyIdToFetch = authStore.user.company_id
      }
    }

    if (companyIdToFetch) {
      await fetchCompanyById(companyIdToFetch)
    } else if (authStore.isSuperadmin) {
      console.log(
        'Superadmin: No specific company assigned, attempting to fetch first available company.',
      )
      try {
        const resultList = await pb.collection('companies').getList(1, 1, { sort: 'created' })
        if (resultList.items && resultList.items.length > 0) {
          _setCompanyConfig(resultList.items[0])
        } else {
          error.value = 'Superadmin: No companies found in the system to configure.'
          console.warn(error.value)
        }
      } catch (e) {
        error.value = `Superadmin: Failed to fetch first company: ${e.message}`
        console.error(error.value, e)
      }
    } else {
      error.value = 'No company ID associated with this user account.'
      console.warn(error.value)
    }
    loading.value = false
  }

  async function saveCompanyConfig(configDataToSave) {
    if (!authStore.isSuperadmin) {
      error.value = 'Only superadmins can save company configuration.'
      console.error(error.value)
      return false
    }

    const idToUpdate = configDataToSave.id || companyConfig.id
    if (!idToUpdate) {
      error.value = 'Company ID is missing. Cannot update configuration.'
      console.error(error.value)
      return false
    }

    loading.value = true
    error.value = null

    const dataForApi = {
      flexirol: Number(configDataToSave.flexirol),
      flexirol2: Number(configDataToSave.flexirol2),
      flexirol3: String(configDataToSave.flexirol3),
      dia_inicio: Number(configDataToSave.dia_inicio),
      dia_cierre: Number(configDataToSave.dia_cierre),
      porcentaje: Number(configDataToSave.porcentaje),
      dia_bloqueo: Number(configDataToSave.dia_bloqueo),
      frecuencia: Number(configDataToSave.frecuencia),
      dia_reinicio: Number(configDataToSave.dia_reinicio),
    }

    try {
      const updatedRecord = await pb.collection('companies').update(idToUpdate, dataForApi)
      _setCompanyConfig(updatedRecord)
      return true
    } catch (e) {
      error.value = `Failed to save company configuration: ${e.message}`
      console.error(error.value, e)
      return false
    } finally {
      loading.value = false
    }
  }

  function updateField(field, value) {
    if (Object.prototype.hasOwnProperty.call(companyConfig, field)) {
      companyConfig[field] = value
    }
  }

  function resetConfig() {
    Object.assign(companyConfig, defaultCompanyState())
    error.value = null
  }

  async function fetchCompanies(params = {}) {
    try {
      loading.value = true
      const result = await api.getCompanies(params)
      return result
    } catch (error) {
      console.error('Error al cargar empresas:', error)
      return { items: [], totalItems: 0 }
    } finally {
      loading.value = false
    }
  }

  // ===== GLOBAL SYSTEM CONFIG FUNCTIONS =====
  async function fetchGlobalConfig() {
    globalConfigLoading.value = true // ✅ CORRECCIÓN: Sin `this`
    globalConfigError.value = null

    try {
      const config = await api.getSystemConfig()
      globalConfig.value = config
      return config
    } catch (err) {
      globalConfigError.value = `Error al cargar configuración global: ${err.message}`
      console.error('Error fetching global config:', err)
      throw err
    } finally {
      globalConfigLoading.value = false
    }
  }

  async function saveGlobalConfig(configData) {
    if (!authStore.isSuperadmin) {
      throw new Error('Solo superadministradores pueden guardar configuración global')
    }

    globalConfigLoading.value = true // ✅ CORRECCIÓN: Sin `this`
    globalConfigError.value = null

    try {
      const updatedConfig = await api.updateSystemConfig(configData)
      globalConfig.value = updatedConfig
      return updatedConfig
    } catch (err) {
      globalConfigError.value = `Error al guardar configuración global: ${err.message}`
      console.error('Error saving global config:', err)
      throw err
    } finally {
      globalConfigLoading.value = false
    }
  }

  // ✅ CORRECCIÓN CRÍTICA: Mapeo correcto system_config → companies
  async function createCompanyWithDefaults(companyData) {
    try {
      const defaults = await fetchGlobalConfig() // ✅ CORRECCIÓN: Sin `this`

      const companyWithDefaults = {
        ...companyData,
        // ✅ MAPEO CORRECTO system_config → companies schema
        flexirol: defaults.porcentaje_servicio, // porcentaje_servicio → flexirol
        flexirol2: defaults.valor_fijo_mensual, // valor_fijo_mensual → flexirol2
        flexirol3: '1', // Default plan 1 (porcentaje)
        dia_inicio: defaults.dia_inicio, // dia_inicio → dia_inicio ✅
        dia_cierre: defaults.dia_cierre, // dia_cierre → dia_cierre ✅
        porcentaje: defaults.porcentaje_maximo, // porcentaje_maximo → porcentaje
        dia_bloqueo: defaults.dias_bloqueo, // dias_bloqueo → dia_bloqueo
        frecuencia: defaults.frecuencia_maxima, // frecuencia_maxima → frecuencia
        dia_reinicio: defaults.dias_reinicio, // dias_reinicio → dia_reinicio ✅
      }

      return await api.createCompanyWithOwner(companyWithDefaults)
    } catch (err) {
      console.error('Error creating company with defaults:', err)
      throw err
    }
  }

  // ===== RETURN ALL STATE AND FUNCTIONS =====
  return {
    // Company Config State
    companyConfig,
    loading,
    error,

    // Company Config Functions
    fetchCompanyToConfigure,
    fetchCompanyById,
    saveCompanyConfig,
    updateField,
    resetConfig,
    fetchCompanies,
    defaultCompanyState,

    // Global System Config State
    globalConfig,
    globalConfigLoading,
    globalConfigError,

    // Global System Config Functions
    fetchGlobalConfig,
    saveGlobalConfig,
    createCompanyWithDefaults,
  }
})
