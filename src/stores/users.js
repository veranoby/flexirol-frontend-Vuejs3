import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useSystemStore } from '@/stores/system'
import { api } from '@/services/pocketbase'

export const useUsersStore = defineStore(
  'users',
  () => {
    const authStore = useAuthStore()
    const systemStore = useSystemStore()

    // State
    const users = ref([])
    const loading = ref(false)
    const error = ref(null)
    const currentPage = ref(1)
    const totalPages = ref(1)
    const itemsPerPage = 50

    // Cache control
    const usersFetchTime = ref({}) // { filterKey: timestamp }
    const USERS_CACHE_DURATION = 5 * 60 * 1000 // 5 minutos

    // Getters

    // All users (for superadmin)
    const allUsers = computed(() => users.value)

    // Company users (for empresa role)
    const myCompanyUsers = computed(() => {
      if (!authStore.user?.id) return []
      return users.value.filter(
        (user) => user.company_id === authStore.user.id && user.role === 'usuario',
      )
    })

    // Users by role
    const usersByRole = computed(() => {
      return (role) => users.value.filter((user) => user.role === role)
    })

    // Active users
    const activeUsers = computed(() => users.value.filter((user) => user.gearbox))

    // Blocked users
    const blockedUsers = computed(() => users.value.filter((user) => !user.gearbox))

    // Empresas (usuarios con role='empresa')
    const empresas = computed(() =>
      users.value.filter(u => u.role === 'empresa')
    )

    // Usuarios por empresa
    const usersByCompany = computed(() => (empresaId) =>
      users.value.filter(u => u.company_id === empresaId)
    )

    // Stats
    const stats = computed(() => ({
      total: users.value.length,
      active: activeUsers.value.length,
      blocked: blockedUsers.value.length,
      companies: companies.value.length,
      employees: users.value.filter((u) => u.role === 'usuario').length,
      operators: users.value.filter((u) => u.role === 'operador').length,
    }))

    // Actions

    /**
     * Optimized fetchUsers with caching by filters
     */
    async function fetchUsers(filters = {}, forceRefresh = false) {
      const cacheKey = JSON.stringify(filters)

      // Check cache first
      if (!forceRefresh && users.value.length > 0 && usersFetchTime.value[cacheKey]) {
        const elapsed = Date.now() - usersFetchTime.value[cacheKey]
        if (elapsed < USERS_CACHE_DURATION) {
          console.log('🎯 Cache hit: users', {
            elapsed: (elapsed / 1000).toFixed(1) + 's',
            filters,
          })
          return {
            items: users.value,
            page: currentPage.value,
            totalPages: totalPages.value,
            totalItems: users.value.length,
          }
        }
      }

      console.log('📡 Fetching users from PocketBase...', filters)
      loading.value = true
      error.value = null

      try {
        // Build filter string for PocketBase
        const filterParts = []

        // Role-based access control
        if (!authStore.isSuperadmin) {
          if (authStore.isEmpresa) {
            // Empresa only sees their employees
            filterParts.push(`company_id="${authStore.user.id}"`)
          } else if (authStore.isOperador) {
            // Operador sees users from assigned companies
            const companies = authStore.getUserCompanies()
            if (companies.length > 0) {
              const companyFilter = companies.map((id) => `company_id="${id}"`).join(' || ')
              filterParts.push(`(${companyFilter})`)
            }
          } else {
            // Regular users shouldn't access this
            throw new Error('Acceso no autorizado')
          }
        }

        // Apply additional filters
        if (filters.role) filterParts.push(`role="${filters.role}"`)
        if (filters.company_id) filterParts.push(`company_id="${filters.company_id}"`)
        if (filters.gearbox !== undefined) filterParts.push(`gearbox=${filters.gearbox}`)
        if (filters.search) {
          const search = filters.search.toLowerCase()
          filterParts.push(
            `(first_name~"${search}" || last_name~"${search}" || email~"${search}" || cedula~"${search}")`,
          )
        }

        const filterString = filterParts.length > 0 ? filterParts.join(' && ') : ''

        const result = await api.getUsers({
          page: currentPage.value,
          perPage: itemsPerPage,
          filter: filterString,
          sort: '-created',
          expand: 'company_id',
        })

        // Map results to consistent format
        users.value = result.items

        // Update cache
        usersFetchTime.value[cacheKey] = Date.now()
        console.log('✅ Users fetched and cached', {
          count: users.value.length,
          filters,
        })

        currentPage.value = result.page
        totalPages.value = result.totalPages

        return {
          items: result.items,
          page: result.page,
          totalPages: result.totalPages,
          totalItems: result.totalItems,
        }
      } catch (err) {
        error.value = `Error al cargar usuarios: ${err.message}`
        console.error('Error fetching users:', err)
        throw err
      } finally {
        loading.value = false
      }
    }

    /**
     * Fetch users by role (legacy compatibility)
     */
    async function fetchUsersByRole(role, companyId = null) {
      const filters = {}
      if (role) filters.role = role
      if (companyId) filters.company_id = companyId

      const result = await fetchUsers(filters)
      return result.items
    }

    /**
     * Create a new user
     */
    async function createUser(userData) {
      loading.value = true
      try {
        // Si es empresa, agregar campos de configuración por defecto
        if (userData.role === 'empresa') {
          const systemConfig = useSystemConfigStore()
          const defaults = await systemConfig.fetchConfig()

          userData = {
            ...userData,
            company_name: userData.company_name || `${userData.first_name} ${userData.last_name}`,
            flexirol: userData.flexirol ?? defaults.porcentaje_servicio,
            flexirol2: userData.flexirol2 ?? defaults.valor_fijo_mensual,
            flexirol3: userData.flexirol3 ?? defaults.plan_default,
            dia_inicio: userData.dia_inicio ?? defaults.dia_inicio,
            dia_cierre: userData.dia_cierre ?? defaults.dia_cierre,
            porcentaje: userData.porcentaje ?? defaults.porcentaje_maximo,
            dia_bloqueo: userData.dia_bloqueo ?? defaults.dias_bloqueo,
            frecuencia: userData.frecuencia ?? defaults.frecuencia_maxima,
            dia_reinicio: userData.dia_reinicio ?? defaults.dias_reinicio,
          }
        }

        const created = await api.createUser(userData)

        // Actualizar cache local
        users.value.unshift(created)

        console.log('✅ User created:', created.id)
        return created
      } catch (error) {
        console.error('Error creating user:', error)
        throw error
      } finally {
        loading.value = false
      }
    }

    /**
     * Update user locally (optimistic updates)
     */
    function updateUserLocal(userId, updates) {
      const user = users.value.find((u) => u.id === userId)
      if (user) {
        Object.assign(user, updates)
        console.log('🔄 User updated locally', { userId, updates })
      }
    }

    /**
     * Optimized updateUser with optimistic updates
     */
    async function updateUser(userId, updates) {
      // Actualización optimista
      const index = users.value.findIndex(u => u.id === userId)
      const original = users.value[index]

      if (index !== -1) {
        users.value[index] = { ...original, ...updates }
      }

      try {
        const updated = await api.updateUser(userId, updates)

        // Actualizar con datos del servidor
        if (index !== -1) {
          users.value[index] = updated
        }

        console.log('✅ User updated:', userId)
        return updated
      } catch (error) {
        // Rollback en caso de error
        if (index !== -1) {
          users.value[index] = original
        }
        throw error
      }
    }

    /**
     * **BUSINESS LOGIC PRESERVADA**: Validaciones exactas del functions.php
     */

    // Check if cédula already exists (functions.php línea 1720+)
    async function checkCedulaExists(cedula, excludeUserId = null) {
      try {
        let filter = `cedula="${cedula}"`
        if (excludeUserId) {
          filter += ` && id!="${excludeUserId}"`
        }
        const users = await api.getUsers({ filter })
        return users.items && users.items.length > 0
      } catch (error) {
        // No user found - that's good
        return false
      }
    }

    // Check if email already exists (functions.php línea 1734+)
    async function checkEmailExists(email, excludeUserId = null) {
      try {
        let filter = `email="${email}"`
        if (excludeUserId) {
          filter += ` && id!="${excludeUserId}"`
        }
        const users = await api.getUsers({ filter })
        return users.items && users.items.length > 0
      } catch (error) {
        // No user found - that's good
        return false
      }
    }

    /**
     * **BUSINESS LOGIC PRESERVADA**: Borrado en cascada (functions.php línea 1650+)
     * Si se borra una empresa, se borran todos sus usuarios
     */
    async function deleteUser(userId) {
      loading.value = true
      error.value = null

      try {
        const user = users.value.find((u) => u.id === userId)
        if (!user) throw new Error('Usuario no encontrado')

        // **LOGIC PRESERVADA**: Si es empresa, borrar empleados primero
        if (user.role === 'empresa') {
          const employeeUsers = users.value.filter(
            (u) => u.company_id === userId && u.role === 'usuario',
          )

          for (const employee of employeeUsers) {
            await api.deleteUser(employee.id)
            users.value = users.value.filter((u) => u.id !== employee.id)
          }

          console.log(`🗑️ Deleted ${employeeUsers.length} employees of company ${user.first_name}`)
        }

        // Borrar el usuario principal
        await api.deleteUser(userId)
        users.value = users.value.filter((u) => u.id !== userId)
        console.log('🗑️ User deleted locally', {
          userId,
          name: `${user.first_name} ${user.last_name}`,
        })

        // Invalidate cache after deletion
        invalidateCache()
        console.log('🔄 Cache invalidated after user deletion')

        return true
      } catch (err) {
        error.value = `Error al eliminar usuario: ${err.message}`
        console.error('Error deleting user:', err)

        // Recargar datos en caso de error
        const currentFilters = {
          role: authStore.isEmpresa ? 'usuario' : null,
          company_id: authStore.isEmpresa ? authStore.user.id : null,
        }
        await fetchUsers(currentFilters, true) // force refresh

        throw err
      } finally {
        loading.value = false
      }
    }

    /**
     * Toggle user status (gearbox)
     */
    async function toggleUserStatus(userId) {
      const user = users.value.find((u) => u.id === userId)
      if (!user) throw new Error('Usuario no encontrado')

      try {
        const updatedUser = await api.updateUser(userId, {
          gearbox: !user.gearbox,
        })

        // Update local state
        const index = users.value.findIndex((u) => u.id === userId)
        if (index !== -1) {
          users.value[index] = updatedUser // Reemplazado de mapUserData(updatedUser)
        }

        return updatedUser
      } catch (err) {
        error.value = `Error al cambiar estado: ${err.message}`
        console.error('Error toggling user status:', err)
        throw err
      }
    }

    /**
     * Update user password
     */
    async function updateUserPassword(userId, newPassword) {
      loading.value = true
      error.value = null

      try {
        await api.updateUser(userId, {
          password: newPassword,
          passwordConfirm: newPassword,
        })

        return true
      } catch (err) {
        error.value = `Error al actualizar contraseña: ${err.message}`
        console.error('Error updating password:', err)
        throw err
      } finally {
        loading.value = false
      }
    }

    /**
     * Get user by ID with cache
     */
    async function getUserById(userId, forceRefresh = false) {
      // Check local cache first
      if (!forceRefresh) {
        const cached = users.value.find((u) => u.id === userId)
        if (cached) {
          console.log('🎯 Cache hit: user by id', { userId })
          return cached
        }
      }

      console.log('📡 Fetching user by id from PocketBase...', { userId })
      try {
        const user = await api.getUserById(userId)
        const mapped = user // Reemplazado de mapUserData(user)

        // Update cache
        const index = users.value.findIndex((u) => u.id === userId)
        if (index >= 0) {
          users.value[index] = mapped
        } else {
          users.value.push(mapped)
        }

        return mapped
      } catch (err) {
        error.value = `Error fetching user: ${err.message}`
        throw err
      }
    }

    /**
     * Search users (advanced search with multiple criteria)
     */
    async function searchUsers(searchTerm, filters = {}) {
      return await fetchUsers({
        ...filters,
        search: searchTerm,
      })
    }

    /**
     * Get users statistics
     */
    function getUserStats(companyId = null) {
      let targetUsers = users.value

      if (companyId) {
        targetUsers = users.value.filter((u) => u.company_id === companyId)
      }

      return {
        total: targetUsers.length,
        active: targetUsers.filter((u) => u.gearbox).length,
        blocked: targetUsers.filter((u) => !u.gearbox).length,
        byRole: {
          empresa: targetUsers.filter((u) => u.role === 'empresa').length,
          operador: targetUsers.filter((u) => u.role === 'operador').length,
          usuario: targetUsers.filter((u) => u.role === 'usuario').length,
        },
        totalAmount: targetUsers
          .filter((u) => u.role === 'usuario')
          .reduce((sum, u) => sum + (u.disponible || 0), 0),
      }
    }

    /**
     * Bulk operations
     */
    async function bulkUpdateUsers(userIds, updateData) {
      loading.value = true
      error.value = null

      try {
        const updates = userIds.map((id) => api.updateUser(id, updateData))

        await Promise.all(updates)

        // Refresh users after bulk update
        await fetchUsers()

        // Invalidate cache after bulk update
        invalidateCache()
        console.log('🔄 Cache invalidated after bulk update')

        return true
      } catch (err) {
        error.value = `Error en actualización masiva: ${err.message}`
        console.error('Error in bulk update:', err)
        throw err
      } finally {
        loading.value = false
      }
    }

    /**
     * Export users data
     */
    function exportUsers(format = 'json', filters = {}) {
      let exportData = users.value

      // Apply filters if needed
      if (filters.role) {
        exportData = exportData.filter((u) => u.role === filters.role)
      }
      if (filters.company_id) {
        exportData = exportData.filter((u) => u.company_id === filters.company_id)
      }
      if (filters.gearbox !== undefined) {
        exportData = exportData.filter((u) => u.gearbox === filters.gearbox)
      }

      // Clean data for export
      const cleanData = exportData.map((user) => ({
        id: user.id,
        nombre: user.first_name,
        apellido: user.last_name,
        email: user.email,
        cedula: user.cedula,
        rol: user.role,
        empresa: user.company?.first_name + ' ' + user.company?.last_name || 'N/A',
        estado: user.gearbox ? 'Habilitado' : 'Bloqueado',
        disponible: user.disponible || 0,
        fechaCreacion: user.created,
        fechaActualizacion: user.updated,
      }))

      return cleanData
    }

    /**
     * Clear store data
     */
    function clearUsers() {
      users.value = []
      error.value = null
      currentPage.value = 1
      totalPages.value = 1
    }

    /**
     * Invalidate entire users cache
     */
    function invalidateCache() {
      usersFetchTime.value = {}
      console.log('🗑️ Users cache invalidated')
    }

    // Helper Functions

    /**
     * Validate user data before operations
     */
    function validateUserData(userData, isUpdate = false) {
      const errors = {}

      if (!userData.first_name?.trim()) {
        errors.first_name = 'El nombre es requerido'
      }

      if (!userData.last_name?.trim()) {
        errors.last_name = 'El apellido es requerido'
      }

      if (!userData.email?.trim()) {
        errors.email = 'El email es requerido'
      } else if (!systemStore.validateEmail(userData.email)) {
        errors.email = 'El formato del email no es válido'
      }

      if (!userData.cedula?.trim()) {
        errors.cedula = 'La cédula es requerida'
      } else if (!systemStore.validateCedula(userData.cedula)) {
        errors.cedula = 'La cédula debe tener 10 dígitos numéricos'
      }

      if (!userData.role) {
        errors.role = 'El rol es requerido'
      }

      // Role-specific validations
      if (['usuario', 'operador'].includes(userData.role) && !userData.company_id) {
        errors.company_id = 'La empresa es requerida para este rol'
      }

      return {
        isValid: Object.keys(errors).length === 0,
        errors,
      }
    }

    return {
      // State
      users,
      loading,
      error,
      currentPage,
      totalPages,

      // Cache state (opcional exponer)
      // usersFetchTime,

      // Getters (existentes)
      allUsers,
      myCompanyUsers,
      usersByRole,
      activeUsers,
      blockedUsers,
      companies,
      stats,

      // Actions
      fetchUsers,
      fetchUsersByRole,
      createUser,
      updateUser,
      deleteUser,
      toggleUserStatus,
      updateUserPassword,
      getUserById,
      searchUsers,
      getUserStats,
      bulkUpdateUsers,
      exportUsers,
      clearUsers,
      invalidateCache,

      // Business logic
      checkCedulaExists,
      checkEmailExists,

      // Helpers
      validateUserData,
      updateUserLocal, // Nueva función expuesta
    }
  },
  {
    persist: {
      key: 'flexirol-users',
      storage: sessionStorage,
      paths: ['users', 'currentPage', 'totalPages', 'usersFetchTime'],
    },
  },
)
