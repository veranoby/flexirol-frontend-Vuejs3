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

  async function fetchCompanyById(companyId) {
    loading.value = true
    error.value = null
    try {
      const record = await api.collection('companies').getOne(companyId)
      _setCompanyConfig(record)
      // console.log('Fetched company config by ID:', companyConfig)
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
    Object.assign(companyConfig, defaultCompanyState()) // Reset before fetching

    if (!authStore.user) {
      error.value = 'User not authenticated. Cannot determine company to configure.'
      loading.value = false
      return
    }

    let companyIdToFetch = null

    if (authStore.isEmpresa || authStore.isSuperadmin) {
      // Superadmin might also be an owner or have an assigned company
      if (authStore.user.assigned_companies && authStore.user.assigned_companies.length > 0) {
        companyIdToFetch = authStore.user.assigned_companies[0]
      } else if (authStore.user.company_id) {
        // This field might exist on the user record in PocketBase
        companyIdToFetch = authStore.user.company_id
      }
    }

    if (companyIdToFetch) {
      await fetchCompanyById(companyIdToFetch)
    } else if (authStore.isSuperadmin) {
      // Superadmin fallback: try to fetch the first company from the collection
      console.log(
        'Superadmin: No specific company assigned, attempting to fetch first available company.',
      )
      try {
        const resultList = await api.collection('companies').getList(1, 1, { sort: 'created' })
        if (resultList.items && resultList.items.length > 0) {
          _setCompanyConfig(resultList.items[0])
          // console.log('Superadmin fetched first available company:', companyConfig)
        } else {
          error.value = 'Superadmin: No companies found in the system to configure.'
          console.warn(error.value)
        }
      } catch (e) {
        error.value = `Superadmin: Failed to fetch first company: ${e.message}`
        console.error(error.value, e)
      }
    } else {
      // Non-superadmin without a company ID
      error.value = 'No company ID associated with this user account.'
      console.warn(error.value)
    }
    loading.value = false
  }

  async function saveCompanyConfig(configDataToSave) {
    // Accepts data as parameter
    if (!authStore.isSuperadmin) {
      error.value = 'Only superadmins can save company configuration.'
      console.error(error.value)
      return false
    }

    // The ID of the company to update is taken from the passed-in data or current store state if not in data.
    const idToUpdate = configDataToSave.id || companyConfig.id
    if (!idToUpdate) {
      error.value = 'Company ID is missing. Cannot update configuration.'
      console.error(error.value)
      return false
    }

    loading.value = true
    error.value = null

    // Prepare data for PocketBase from the passed object, ensuring correct types
    // Only include fields relevant to this configuration form
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
      // Update using the id from the form data, which should match companyConfig.id
      const updatedRecord = await api.collection('companies').update(idToUpdate, dataForApi)
      // Update local state with the response from the server
      _setCompanyConfig(updatedRecord)
      // console.log('Company configuration updated successfully and local state synced.');
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
    if (Object.prototype.hasOwnProperty.call(companyConfig, field)) {
      companyConfig[field] = value
    }
  }

  // Reset to default state, could be used on logout or error
  function resetConfig() {
    Object.assign(companyConfig, defaultCompanyState())
    error.value = null
  }

  /**
   * Lista todas las empresas (usuarios con role='empresa') para filtros y administración
   * @param {Object} params - Opcional: { page, perPage, search }
   * @returns {Promise<{ items: Array, totalItems: number, totalPages: number }>}
   */
  async function fetchCompanies(params = {}) {
    loading.value = true
    error.value = null
    try {
      const page = params.page || 1
      const perPage = params.perPage || 100 // Suficiente para dropdowns y listados
      const search = params.search || ''
      let filter = 'role="empresa"'
      if (search) {
        // Buscar por nombre o email
        filter += ` && (first_name~"${search}" || last_name~"${search}" || email~"${search}")`
      }
      const result = await api.collection('users').getList(page, perPage, {
        filter,
        sort: 'first_name',
        expand: params.expand || '',
      })
      // Estructura compatible con legacy: empresa_info_set
      return {
        items: result.items || [],
        totalItems: result.totalItems || result.items?.length || 0,
        totalPages: result.totalPages || 1,
      }
    } catch (e) {
      error.value = `Error al listar empresas: ${e.message}`
      console.error(error.value, e)
      return { items: [], totalItems: 0, totalPages: 1 }
    } finally {
      loading.value = false
    }
  }

  async function fetchCompanies() {
    try {
      loading.value = true
      const { items } = await companies.fetchCompanies({
        expand: 'assigned_companies,empresa_id', // Relaciones según schema
      })
      companies.value = items.map((company) => ({
        ...company,
        userCount: company.expand?.assigned_companies?.length || 0,
      }))
    } catch (error) {
      showToast('Error al cargar empresas', 'danger')
      console.error(error)
    } finally {
      loading.value = false
    }
  }

  return {
    companyConfig,
    loading,
    error,
    fetchCompanyToConfigure,
    saveCompanyConfig,
    updateField,
    resetConfig,
    // Expose default state for potential use in component
    defaultCompanyState,
    // NUEVO: Listar todas las empresas
    fetchCompanies,
  }
})
