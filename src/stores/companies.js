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
  cedula: '',
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

export const useCompaniesStore = defineStore(
  'companies',
  () => {
    const authStore = useAuthStore()

    // ========== CACHE CONTROL ==========
    const lastFetch = ref(null)
    const CACHE_DURATION = 5 * 60 * 1000 // 5 minutos

    // ========== EXISTING CONFIG STATE (MANTENER PARA CONFIGVIEW) ==========
    const companyConfig = reactive(defaultCompanyState())
    const globalConfig = ref(null)
    const globalConfigLoading = ref(false)
    const loading = ref(false)
    const error = ref(null)

    // ========== NEW MANAGEMENT STATE ==========
    const companies = ref([])
    const selectedCompany = ref(null)
    const companyUsers = ref([])
    const loadingUsers = ref(false)
    const usersHierarchy = ref({
      owner: null,
      admins: [],
      employees: [],
    })

    // ========== COMPUTED ==========
    const stats = computed(() => {
      const totalCompanies = companies.value.length
      const activeCompanies = companies.value.filter((c) => c.gearbox).length
      const totalUsers = companies.value.reduce((sum, c) => sum + (c.users_count || 0), 0)

      return {
        totalCompanies,
        activeCompanies,
        blockedCompanies: totalCompanies - activeCompanies,
        totalUsers,
        totalOwners: companies.value.filter((c) => c.expand?.owner_id).length,
      }
    })

    // ========== EXISTING CONFIG FUNCTIONS (MANTENER EXACTO) ==========
    function _setCompanyConfig(record) {
      companyConfig.id = record.id
      companyConfig.owner_id = record.owner_id
      companyConfig.company_name = record.company_name || ''
      companyConfig.cedula = record.cedula || ''
      companyConfig.flexirol =
        record.flexirol !== undefined ? Number(record.flexirol) : defaultCompanyState().flexirol
      companyConfig.flexirol2 =
        record.flexirol2 !== undefined ? Number(record.flexirol2) : defaultCompanyState().flexirol2
      companyConfig.flexirol3 = record.flexirol3 || defaultCompanyState().flexirol3
      companyConfig.dia_inicio =
        record.dia_inicio !== undefined
          ? Number(record.dia_inicio)
          : defaultCompanyState().dia_inicio
      companyConfig.dia_cierre =
        record.dia_cierre !== undefined
          ? Number(record.dia_cierre)
          : defaultCompanyState().dia_cierre
      companyConfig.porcentaje =
        record.porcentaje !== undefined
          ? Number(record.porcentaje)
          : defaultCompanyState().porcentaje
      companyConfig.dia_bloqueo =
        record.dia_bloqueo !== undefined
          ? Number(record.dia_bloqueo)
          : defaultCompanyState().dia_bloqueo
      companyConfig.frecuencia =
        record.frecuencia !== undefined
          ? Number(record.frecuencia)
          : defaultCompanyState().frecuencia
      companyConfig.dia_reinicio =
        record.dia_reinicio !== undefined
          ? Number(record.dia_reinicio)
          : defaultCompanyState().dia_reinicio
      companyConfig.gearbox =
        record.gearbox !== undefined ? record.gearbox : defaultCompanyState().gearbox
    }

    async function fetchGlobalConfig() {
      globalConfigLoading.value = true
      error.value = null

      // Verificar cache primero
      if (globalConfig.value) {
        globalConfigLoading.value = false
        return globalConfig.value
      }

      try {
        const record = await pb
          .collection('system_config')
          .getFirstListItem('name="default_config"')
        globalConfig.value = record
        return record
      } catch (e) {
        error.value = `Failed to fetch global configuration: ${e.message}`
        console.error(error.value, e)
        globalConfig.value = null
        throw e
      } finally {
        globalConfigLoading.value = false
      }
    }

    async function saveGlobalConfig(configData) {
      globalConfigLoading.value = true
      error.value = null

      try {
        // Opción 1: Usar el ID del cache si está disponible
        if (globalConfig.value?.id) {
          const updatedConfig = await pb
            .collection('system_config')
            .update(globalConfig.value.id, configData)

          globalConfig.value = updatedConfig
          console.log('✅ Global config updated (using cached ID)')
          return updatedConfig
        }

        // Opción 2: Si no hay cache, hacer una sola llamada con filtro
        const updatedConfig = await pb.collection('system_config').update(
          'name="default_config"', // Filtro directo
          configData,
        )

        // Actualizar cache
        globalConfig.value = updatedConfig
        console.log('✅ Global config updated (direct filter update)')
        return updatedConfig
      } catch (error) {
        error.value = `Error saving global config: ${error.message}`
        console.error('Error saving global config:', error)
        throw error
      } finally {
        globalConfigLoading.value = false
      }
    }

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
        try {
          const resultList = await pb.collection('companies').getList(1, 1, { sort: 'created' })
          if (resultList.items && resultList.items.length > 0) {
            _setCompanyConfig(resultList.items[0])
          } else {
            error.value = 'Superadmin: No companies found in the system to configure.'
          }
        } catch (e) {
          error.value = `Superadmin: Failed to fetch first company: ${e.message}`
          console.error(error.value, e)
        }
      } else {
        error.value = 'No company ID associated with this user account.'
      }
      loading.value = false
    }

    /*   async function saveCompanyConfig(configDataToSave) {
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
    } */

    function resetCompanyConfig() {
      Object.assign(companyConfig, defaultCompanyState())
      error.value = null
    }

    // ========== NEW OPTIMIZED EMPRESAS FUNCTIONS ==========

    /**
     * OPTIMIZED: Single query to avoid PocketBase autocancellation
     */
    async function fetchCompanies(forceRefresh = false) {
      // Check cache first
      if (!forceRefresh && companies.value.length > 0 && lastFetch.value) {
        const elapsed = Date.now() - lastFetch.value
        if (elapsed < CACHE_DURATION) {
          console.log('🎯 Cache hit: companies', {
            elapsed: (elapsed / 1000).toFixed(1) + 's',
            count: companies.value.length,
          })
          return companies.value
        }
      }

      console.log('📡 Fetching companies from PocketBase...')
      loading.value = true
      error.value = null

      try {
        // Single query for companies with owner expansion
        const result = await pb.collection('companies').getList(1, 1000, {
          expand: 'owner_id',
          sort: '-created',
          fields:
            'id,owner_id,company_name,flexirol,flexirol2,flexirol3,dia_inicio,dia_cierre,porcentaje,dia_bloqueo,frecuencia,dia_reinicio,fecha_excel,gearbox,created,expand.owner_id.id,expand.owner_id.first_name,expand.owner_id.last_name,expand.owner_id.email,expand.owner_id.cedula,expand.owner_id.username,expand.owner_id.created,expand.owner_id.gearbox,expand.owner_id.phone_number,expand.owner_id.address,expand.owner_id.city,expand.owner_id.state,expand.owner_id.zip_code',
        })

        companies.value = result.items
        lastFetch.value = Date.now()
        console.log('✅ Companies fetched and cached', { count: companies.value.length })

        // Background update of user counts
        loadUserCountsInBackground()

        return companies.value
      } catch (err) {
        error.value = `Error fetching companies: ${err.message}`
        console.error('Error fetching companies:', err)
        throw err
      } finally {
        loading.value = false
      }
    }

    /**
     * Get company by ID with cache
     */
    async function getCompanyById(companyId, forceRefresh = false) {
      // Try to find in local cache first
      if (!forceRefresh) {
        const cached = companies.value.find((c) => c.id === companyId)
        if (cached) {
          console.log('🎯 Cache hit: company by id', { companyId })
          return cached
        }
      }

      console.log('📡 Fetching company by id from PocketBase...', { companyId })
      try {
        const company = await api.getCompanyById(companyId)

        // Update local cache
        const index = companies.value.findIndex((c) => c.id === companyId)
        if (index >= 0) {
          companies.value[index] = company
        } else {
          companies.value.push(company)
        }

        return company
      } catch (err) {
        error.value = `Error fetching company: ${err.message}`
        throw err
      }
    }

    /**
     * Background user count loading to avoid blocking
     */
    async function loadUserCountsInBackground() {
      try {
        // Get all users in one query and count by company
        const allUsers = await pb.collection('users').getList(1, 5000, {
          filter: 'company_id != ""',
          fields: 'company_id,gearbox',
        })

        // Count users per company locally
        const companyCounts = {}
        allUsers.items.forEach((user) => {
          if (!companyCounts[user.company_id]) {
            companyCounts[user.company_id] = { total: 0, active: 0 }
          }
          companyCounts[user.company_id].total++
          if (user.gearbox) {
            companyCounts[user.company_id].active++
          }
        })

        // Update companies with counts
        companies.value = companies.value.map((company) => ({
          ...company,
          users_count: companyCounts[company.id]?.total || 0,
          active_users_count: companyCounts[company.id]?.active || 0,
          blocked_users_count:
            (companyCounts[company.id]?.total || 0) - (companyCounts[company.id]?.active || 0),
        }))
      } catch (err) {
        console.warn('Background user count loading failed:', err)
      }
    }

    /**
     * OPTIMIZED: Get company users in single query
     */
    async function fetchCompanyUsersHierarchy(companyId) {
      loadingUsers.value = true
      error.value = null

      try {
        // Single query for company + all users
        const [company, usersResult] = await Promise.all([
          pb.collection('companies').getOne(companyId, {
            expand: 'owner_id',
            fields:
              'id,company_name,owner_id,expand.owner_id.id,expand.owner_id.first_name,expand.owner_id.last_name,expand.owner_id.email,expand.owner_id.gearbox,expand.owner_id.created',
          }),
          pb.collection('users').getList(1, 1000, {
            filter: `company_id="${companyId}" && role="usuario"`,
            sort: 'first_name',
            fields: 'id,first_name,last_name,email,cedula,disponible,gearbox,created,username',
          }),
        ])

        usersHierarchy.value = {
          owner: company.expand?.owner_id || null,
          admins: [], // No admins in current schema
          employees: usersResult.items || [],
        }

        companyUsers.value = usersResult.items || []
        return usersHierarchy.value
      } catch (err) {
        error.value = `Error fetching company users: ${err.message}`
        console.error('Error fetching company users:', err)
        usersHierarchy.value = { owner: null, admins: [], employees: [] }
        companyUsers.value = []
        return usersHierarchy.value
      } finally {
        loadingUsers.value = false
      }
    }

    /**
     * OPTIMIZED: Create company with owner (avoid multiple transactions)
     */
    async function createCompanyWithOwner(companyData, ownerData) {
      loading.value = true
      error.value = null

      try {
        const createdOwner = await pb.collection('users').create(ownerData)

        const createdCompany = await pb.collection('companies').create(companyData)

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
     * OPTIMIZED: Update company without affecting unrelated data
     */
    async function updateCompany(companyId, companyData, ownerData = null) {
      console.log('🔄 Ready to update: companyData')
      console.log(companyData)

      console.log('🔄 Ready to update: ownerData')
      console.log(ownerData)

      /* Update locally first (optimistic update)
      updateCompanyLocal(companyId, companyData)
      if (ownerData && companies.value.find((c) => c.id === companyId)?.owner_id) {
        console.log('🔄 Optimistic owner update skipped (needs API call)')
      }*/

      try {
        const usersStore = useUsersStore()
        await usersStore.updateUser(updated.owner_id, ownerData)

        const updated = await pb.collection('companies').update(companyId, companyData)

        // 3. Re-fetch con expand para obtener datos completos
        const completeCompany = await pb.collection('companies').getOne(companyId, {
          expand: 'owner_id',
          fields: '*,expand.owner_id.*',
        })

        // Actualizar en cache local
        const index = companies.value.findIndex((c) => c.id === companyId)
        if (index !== -1) {
          companies.value[index] = completeCompany
        }

        console.log('✅ Company updated with complete data:', completeCompany)
        return { success: true, company: completeCompany }
      } catch (err) {
        // Rollback on error
        console.warn('⚠️ Update failed, refreshing from server...')
        await fetchCompanies(true) // force refresh
        throw err
      }
    }

    /**
     * OPTIMIZED: Delete company and users sequentially (avoid batch)
     */
    async function deleteCompanyWithUsers(companyId) {
      loading.value = true
      error.value = null

      try {
        // Get users to delete first
        const usersResult = await pb.collection('users').getList(1, 1000, {
          filter: `company_id="${companyId}"`,
          fields: 'id',
        })

        let deletedCount = 0

        // Delete users one by one (PocketBase doesn't support batch delete)
        for (const user of usersResult.items) {
          try {
            await pb.collection('users').delete(user.id)
            deletedCount++
          } catch (userErr) {
            console.warn(`Failed to delete user ${user.id}:`, userErr)
          }
        }

        // Delete company
        await pb.collection('companies').delete(companyId)

        // Invalidate cache after deletion
        invalidateCompany(companyId)
        console.log('🔄 Cache invalidated after company deletion')

        return { success: true, deletedUsers: deletedCount }
      } catch (err) {
        error.value = `Error deleting company: ${err.message}`
        console.error('Error deleting company:', err)
        return { success: false, error: err.message }
      } finally {
        loading.value = false
      }
    }

    /**
     * OPTIMIZED: Create user for company (legacy mapping)
     */
    async function createUserForCompany(companyId, userData) {
      loadingUsers.value = true
      error.value = null

      try {
        const userCreateData = {
          first_name: userData.first_name || '',
          last_name: userData.last_name || '',
          email: userData.user_email || userData.email || '',
          cedula: userData.cedula || '',
          company_id: companyId,
          role: 'usuario',
          username:
            userData.user_login ||
            `${userData.first_name}_${userData.last_name}_${userData.cedula}`
              .toLowerCase()
              .replace(/\s+/g, '_'),
          password:
            userData.user_pass ||
            userData.password ||
            userData.user_login ||
            `${userData.first_name}_${userData.last_name}_${userData.cedula}`
              .toLowerCase()
              .replace(/\s+/g, '_'),
          disponible: userData.disponible || 0,
          gearbox: userData.gearbox === 'true' || userData.gearbox === true,
          emailVisibility: true, // CRÍTICO: users deben tener email visible
          phone_number: userData.phone_number || '',
        }

        const createdUser = await pb.collection('users').create(userCreateData)

        // Update local state without refetching everything
        if (companyUsers.value) {
          companyUsers.value.push(createdUser)
        }
        if (usersHierarchy.value.employees) {
          usersHierarchy.value.employees.push(createdUser)
        }

        // Update company user count locally
        const company = companies.value.find((c) => c.id === companyId)
        if (company) {
          company.users_count = (company.users_count || 0) + 1
          if (createdUser.gearbox) {
            company.active_users_count = (company.active_users_count || 0) + 1
          } else {
            company.blocked_users_count = (company.blocked_users_count || 0) + 1
          }
        }

        return { success: true, user: createdUser }
      } catch (err) {
        error.value = `Error creating user: ${err.message}`
        console.error('Error creating user:', err)
        return { success: false, error: err.message }
      } finally {
        loadingUsers.value = false
      }
    }

    // ========== CACHE FUNCTIONS ==========
    function updateCompanyLocal(companyId, updates) {
      const index = companies.value.findIndex((c) => c.id === companyId)
      if (index !== -1) {
        companies.value[index] = { ...companies.value[index], ...updates }
        console.log('🔄 Company updated locally', { companyId, updates })
      }
    }

    /**
     * Invalidate entire companies cache
     */
    function invalidateCache() {
      lastFetch.value = null
      console.log('🗑️ Companies cache invalidated')
    }

    /**
     * Invalidate specific company from cache
     */
    function invalidateCompany(companyId) {
      const index = companies.value.findIndex((c) => c.id === companyId)
      if (index >= 0) {
        companies.value.splice(index, 1)
        console.log('🗑️ Company cache invalidated', { companyId })
      }
    }

    return {
      // ========== EXISTING CONFIG STATE (MANTENER PARA CONFIGVIEW) ==========
      companyConfig,
      globalConfig,
      globalConfigLoading,
      loading,
      error,

      // ========== NEW MANAGEMENT STATE ==========
      companies,
      selectedCompany,
      companyUsers,
      loadingUsers,
      usersHierarchy,

      // ========== NEW CACHE CONTROL ==========
      lastFetch,
      updateCompanyLocal,

      // ========== COMPUTED ==========
      stats,

      // ========== EXISTING FUNCTIONS (MANTENER PARA CONFIGVIEW) ==========
      fetchGlobalConfig,
      fetchCompanyById,
      fetchCompanyToConfigure,
      // saveCompanyConfig,
      resetCompanyConfig,
      saveGlobalConfig, // <-- Asegurarse de exportar

      // ========== NEW OPTIMIZED FUNCTIONS ==========
      fetchCompanies,
      loadUserCountsInBackground,
      fetchCompanyUsersHierarchy,
      createCompanyWithOwner,
      updateCompany,
      deleteCompanyWithUsers,
      createUserForCompany,
      getCompanyById, // <-- Add this to the exports
      invalidateCache,
      invalidateCompany,

      // ========== HELPERS ==========
      defaultCompanyState,
    }
  },
  {
    persist: {
      key: 'flexirol-companies',
      storage: sessionStorage,
      paths: ['companies', 'globalConfig'], // Temporalmente sin lastFetch
      serializer: {
        deserialize: (value) => {
          const parsed = JSON.parse(value)
          // Validar que las empresas tengan expand
          if (parsed.companies) {
            parsed.companies = parsed.companies.filter((c) => c.id && c.owner_id)
          }
          return parsed
        },
        serialize: JSON.stringify,
      },
    },
  },
)
