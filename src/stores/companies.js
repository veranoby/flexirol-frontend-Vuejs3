import { defineStore } from 'pinia'
import { ref, reactive, computed } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { pb, api } from '@/services/pocketbase'
import { useUsersStore } from '@/stores/users'

// Helper function to create a default company state
const defaultCompanyState = () => ({
  id: null,
  owner_id: null,
  company_name: '',
  ruc: '',
  flexirol: 0,
  flexirol2: 0,
  flexirol3: '1',
  dia_inicio: 1,
  dia_cierre: 28,
  porcentaje: 50,
  dia_bloqueo: 2,
  frecuencia: 3,
  dia_reinicio: 1,
  gearbox: true,
  fecha_excel: null,
})

const defaultCompanyOwner = () => ({
  first_name: '',
  last_name: '',
  email: '',
  username: '',
  password: '',
  role: 'empresa',
  gearbox: true,
})

// ===== GLOBAL SYSTEM CONFIG STATE =====
const globalConfig = ref(null)
const globalConfigLoading = ref(false)
const globalConfigError = ref(null)

export const useCompaniesStore = defineStore('companies', () => {
  const authStore = useAuthStore()

  // EXISTING CONFIG STATE (mantener compatibilidad)
  const companyConfig = reactive(defaultCompanyState())

  // NEW MANAGEMENT STATE
  const companies = ref([])
  const loading = ref(false)
  const error = ref(null)
  const selectedCompany = ref(null)
  const companyUsers = ref([])
  const loadingUsers = ref(false)

  // COMPUTED PROPERTIES
  const companiesWithStats = computed(() => {
    return companies.value.map((company) => ({
      ...company,
      user_stats: {
        total: company.users_count || 0,
        active: company.active_users_count || 0,
        blocked: company.blocked_users_count || 0,
      },
    }))
  })

  const stats = computed(() => {
    const totalCompanies = companies.value.length
    const activeCompanies = companies.value.filter((c) => c.gearbox).length
    const usersStore = useUsersStore()

    return {
      totalCompanies,
      activeCompanies,
      blockedCompanies: totalCompanies - activeCompanies,
      totalUsers: usersStore.users?.value?.length || 0,
      totalOwners: companies.value.filter((c) => c.expand?.owner_id).length,
    }
  })

  // EXISTING CONFIG FUNCTIONS (mantener para compatibilidad)
  function _setCompanyConfig(record) {
    companyConfig.id = record.id
    companyConfig.owner_id = record.owner_id
    companyConfig.company_name = record.company_name || ''
    companyConfig.ruc = record.ruc || ''
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
    companyConfig.gearbox =
      record.gearbox !== undefined ? record.gearbox : defaultCompanyState().gearbox
  }

  // NEW CRUD FUNCTIONS

  /**
   * Fetch all companies with user counts and owner info
   */
  async function fetchCompanies(options = {}) {
    loading.value = true
    error.value = null

    try {
      // Get companies with owner expansion
      const result = await pb.collection('companies').getList(1, 1000, {
        expand: 'owner_id',
        sort: '-created',
        ...options, // Pasa la señal de aborto
      })

      // Optimized: Fetch user counts in a single batch query
      const companyIds = result.items.map((c) => c.id)
      const [totalUsers, activeUsers] = await Promise.all([
        pb.collection('users').getList(1, 1, {
          filter: `company_id ?in [${companyIds.map((id) => `"${id}"`).join(',')}]`,
          fields: 'id,company_id',
        }),
        pb.collection('users').getList(1, 1, {
          filter: `company_id ?in [${companyIds.map((id) => `"${id}"`).join(',')}] && gearbox=true`,
          fields: 'id,company_id',
        }),
      ])

      // Map counts to companies
      const companiesWithCounts = result.items.map((company) => {
        const companyTotal = totalUsers.items.filter((u) => u.company_id === company.id).length
        const companyActive = activeUsers.items.filter((u) => u.company_id === company.id).length

        return {
          ...company,
          users_count: companyTotal,
          active_users_count: companyActive,
          blocked_users_count: companyTotal - companyActive,
        }
      })

      companies.value = companiesWithCounts
    } catch (err) {
      if (err.isAbort) {
        console.log('Request cancelled intentionally')
      } else {
        error.value = `Error fetching companies: ${err.message}`
        console.error('Error fetching companies:', err)
      }
    } finally {
      loading.value = false
    }
  }

  /* CARGAR CONFIGURACION GLOBAL */

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

  /**
   * Create new company with owner user
   */
  async function createCompany(companyData, ownerData) {
    loading.value = true
    error.value = null

    try {
      // Get default config from system_config
      let defaultConfig = {}
      try {
        const systemConfig = await pb
          .collection('system_config')
          .getFirstListItem('name="default_config"')
        defaultConfig = {
          flexirol: systemConfig.flexirol || 0,
          flexirol2: systemConfig.flexirol2 || 0,
          flexirol3: systemConfig.flexirol3 || '1',
          dia_inicio: systemConfig.dia_inicio || 1,
          dia_cierre: systemConfig.dia_cierre || 28,
          porcentaje: systemConfig.porcentaje || 50,
          dia_bloqueo: systemConfig.dia_bloqueo || 2,
          frecuencia: systemConfig.frecuencia || 3,
          dia_reinicio: systemConfig.dia_reinicio || 1,
        }
      } catch (configErr) {
        console.warn('Could not fetch default config, using fallback:', configErr)
        defaultConfig = defaultCompanyState()
      }

      // Create owner user first
      const ownerUserData = {
        ...ownerData,
        username:
          ownerData.username ||
          `${ownerData.first_name}_${ownerData.last_name}`.toLowerCase().replace(/\s+/g, '_'),
        password:
          ownerData.password ||
          ownerData.username ||
          `${ownerData.first_name}_${ownerData.last_name}`.toLowerCase().replace(/\s+/g, '_'),
        role: 'empresa',
        gearbox: true,
      }

      const createdOwner = await pb.collection('users').create(ownerUserData)

      // Create company with owner_id and default config
      const companyCreateData = {
        ...defaultConfig,
        ...companyData,
        owner_id: createdOwner.id,
        gearbox: true,
        fecha_excel: null,
      }

      const createdCompany = await pb.collection('companies').create(companyCreateData)

      // Refresh companies list
      await fetchCompanies()

      return { success: true, company: createdCompany, owner: createdOwner }
    } catch (err) {
      error.value = `Error creating company: ${err.message}`
      console.error('Error creating company:', err)
      return { success: false, error: err.message }
    } finally {
      loading.value = false
    }
  }

  /**
   * Update company information
   */
  async function updateCompany(companyId, companyData, ownerData = null) {
    loading.value = true
    error.value = null

    try {
      // Update company
      const updatedCompany = await pb.collection('companies').update(companyId, companyData)

      // Update owner if provided
      if (ownerData && updatedCompany.owner_id) {
        await pb.collection('users').update(updatedCompany.owner_id, ownerData)
      }

      // Refresh companies list
      await fetchCompanies()

      return { success: true, company: updatedCompany }
    } catch (err) {
      error.value = `Error updating company: ${err.message}`
      console.error('Error updating company:', err)
      return { success: false, error: err.message }
    } finally {
      loading.value = false
    }
  }

  /**
   * Toggle company status (gearbox)
   */
  async function toggleCompanyStatus(companyId) {
    try {
      const company = companies.value.find((c) => c.id === companyId)
      if (!company) throw new Error('Company not found')

      const newStatus = !company.gearbox
      await pb.collection('companies').update(companyId, { gearbox: newStatus })

      // Update local state
      company.gearbox = newStatus

      return { success: true, newStatus }
    } catch (err) {
      error.value = `Error toggling company status: ${err.message}`
      console.error('Error toggling company status:', err)
      return { success: false, error: err.message }
    }
  }

  /**
   * Delete company and all its users
   */
  async function deleteCompany(companyId) {
    loading.value = true
    error.value = null

    try {
      // First, get all users of this company
      const companyUsersResult = await pb.collection('users').getList(1, 1000, {
        filter: `company_id="${companyId}"`,
      })

      // Delete all company users
      for (const user of companyUsersResult.items) {
        await pb.collection('users').delete(user.id)
      }

      // Delete the company
      await pb.collection('companies').delete(companyId)

      // Refresh companies list
      await fetchCompanies()

      return { success: true, deletedUsers: companyUsersResult.items.length }
    } catch (err) {
      error.value = `Error deleting company: ${err.message}`
      console.error('Error deleting company:', err)
      return { success: false, error: err.message }
    } finally {
      loading.value = false
    }
  }

  /**
   * Fetch users for a specific company
   */
  async function fetchCompanyUsers(companyId) {
    loadingUsers.value = true
    error.value = null

    try {
      const result = await pb.collection('users').getList(1, 1000, {
        filter: `company_id="${companyId}"`,
        sort: '-created',
      })

      companyUsers.value = result.items
      return result.items
    } catch (err) {
      error.value = `Error fetching company users: ${err.message}`
      console.error('Error fetching company users:', err)
      return []
    } finally {
      loadingUsers.value = false
    }
  }

  /**
   * Create user for company
   */
  async function createCompanyUser(companyId, userData) {
    loadingUsers.value = true
    error.value = null

    try {
      const userCreateData = {
        ...userData,
        company_id: companyId,
        role: 'usuario',
        username:
          userData.username ||
          `${userData.first_name}_${userData.last_name}_${userData.cedula}`
            .toLowerCase()
            .replace(/\s+/g, '_'),
        password:
          userData.password ||
          userData.username ||
          `${userData.first_name}_${userData.last_name}_${userData.cedula}`
            .toLowerCase()
            .replace(/\s+/g, '_'),
        disponible: userData.disponible || 0,
        gearbox: userData.gearbox !== undefined ? userData.gearbox : true,
      }

      const createdUser = await pb.collection('users').create(userCreateData)

      // Refresh company users
      await fetchCompanyUsers(companyId)

      // Refresh companies to update counts
      await fetchCompanies()

      return { success: true, user: createdUser }
    } catch (err) {
      error.value = `Error creating user: ${err.message}`
      console.error('Error creating user:', err)
      return { success: false, error: err.message }
    } finally {
      loadingUsers.value = false
    }
  }

  // EXISTING CONFIG FUNCTIONS (mantener para compatibilidad)
  async function fetchCompanyById(companyId) {
    loading.value = true
    error.value = null
    try {
      const record = await pb.collection('companies').getOne(companyId)
      _setCompanyConfig(record)
      return record // ✅ Añadir este return
    } catch (e) {
      error.value = `Failed to fetch company configuration for ID ${companyId}: ${e.message}`
      console.error(error.value, e)
      throw e // Relanzar el error para manejo en funciones superiores
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
      try {
        const resultList = await pb.collection('companies').getList(1, 1, { sort: 'created' })
        if (resultList.items && resultList.items.length > 0) {
          _setCompanyConfig(resultList.items[0])
        } else {
          error.value = 'Superadmin: No companies found in the system to configure.'
        }
      } catch (e) {
        error.value = `Failed to fetch companies for superadmin: ${e.message}`
        console.error(error.value, e)
      }
    } else {
      error.value = 'Current user role cannot configure companies.'
    }

    loading.value = false
  }

  async function saveCompanyConfig() {
    loading.value = true
    error.value = null

    if (!companyConfig.id) {
      error.value = 'No company configuration loaded to save.'
      loading.value = false
      return { success: false, error: error.value }
    }

    try {
      const updateData = { ...companyConfig }
      delete updateData.id

      const updatedRecord = await pb.collection('companies').update(companyConfig.id, updateData)
      _setCompanyConfig(updatedRecord)

      return { success: true, data: updatedRecord }
    } catch (e) {
      error.value = `Failed to save company configuration: ${e.message}`
      console.error(error.value, e)
      return { success: false, error: error.value }
    } finally {
      loading.value = false
    }
  }

  function resetCompanyConfig() {
    Object.assign(companyConfig, defaultCompanyState())
    error.value = null
  }

  return {
    // EXISTING STATE (mantener compatibilidad)
    companyConfig,
    loading,
    error,

    // Global System Config State
    globalConfig,
    globalConfigLoading,
    globalConfigError,

    // NEW MANAGEMENT STATE
    companies,
    selectedCompany,
    companyUsers,
    loadingUsers,

    // COMPUTED
    companiesWithStats,
    stats,

    // EXISTING ACTIONS (mantener compatibilidad)
    fetchCompanyById,
    fetchCompanyToConfigure,
    saveCompanyConfig,
    resetCompanyConfig,

    // NEW CRUD ACTIONS
    fetchGlobalConfig,
    saveGlobalConfig,
    fetchCompanies,
    createCompany,
    updateCompany,
    toggleCompanyStatus,
    deleteCompany,
    fetchCompanyUsers,
    createCompanyUser,

    // HELPERS
    defaultCompanyState,
    defaultCompanyOwner,
  }
})
