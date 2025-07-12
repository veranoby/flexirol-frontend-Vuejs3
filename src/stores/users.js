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

    // Companies (users with role 'empresa')
    const companies = computed(() => users.value.filter((user) => user.role === 'empresa'))

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
        const mappedItems = result.items.map(mapUserData)
        users.value = mappedItems

        // Update cache
        usersFetchTime.value[cacheKey] = Date.now()
        console.log('✅ Users fetched and cached', {
          count: users.value.length,
          filters,
        })

        currentPage.value = result.page
        totalPages.value = result.totalPages

        return {
          items: mappedItems,
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
      error.value = null

      try {
        // Validación de datos (preservada)
        await systemStore.validateUserBaseData(userData)

        // Generar username (preservado)
        const username = systemStore.generateUsername(
          userData.first_name,
          userData.last_name,
          userData.cedula,
        )

        // Preparar objeto de usuario (preservado)
        const newUser = {
          first_name: userData.first_name.trim(),
          last_name: userData.last_name.trim(),
          email: userData.email.toLowerCase().trim(),
          username,
          cedula: userData.cedula.trim(),
          role: userData.role || 'usuario',
          gearbox: userData.gearbox !== undefined ? userData.gearbox : true,
          password: userData.password || userData.cedula,
          passwordConfirm: userData.password || userData.cedula,
          company_id: userData.role === 'empresa' ? null : userData.company_id,
          disponible: userData.disponible || 0,
        }

        // Campos adicionales (preservado)
        if (userData.role === 'operador' && userData.assigned_companies) {
          newUser.assigned_companies = userData.assigned_companies
        }

        const createdUser = await api.createUser(newUser)
        const mappedUser = mapUserData(createdUser)

        // Actualización local optimista
        users.value.unshift(mappedUser)
        console.log('➕ User created and added locally', {
          id: createdUser.id,
          username: createdUser.username,
        })

        return mappedUser
      } catch (err) {
        error.value = `Error al crear usuario: ${err.message}`
        console.error('Error creating user:', err)
        throw err
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
    async function updateUser(userId, userData) {
      // Update locally first
      updateUserLocal(userId, userData)

      try {
        const updated = await api.updateUser(userId, userData)

        // Update local state with full response
        updateUserLocal(userId, mapUserData(updated))

        return updated
      } catch (err) {
        // Rollback on error
        console.warn('⚠️ Update failed, refreshing from server...')
        await fetchUsers({}, true) // force refresh
        throw err
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
          users.value[index] = mapUserData(updatedUser)
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
     * Get user by ID with full details
     */
    async function getUserById(userId) {
      try {
        const user = await api.getUserById(userId)
        return mapUserData(user)
      } catch (err) {
        error.value = `Error al obtener usuario: ${err.message}`
        console.error('Error getting user:', err)
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

    // Helper Functions

    /**
     * Map user data to consistent format
     */
    function mapUserData(user) {
      return {
        id: user.id,
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email,
        username: user.username,
        cedula: user.cedula,
        role: user.role,
        gearbox: user.gearbox,
        company_id: user.company_id,
        disponible: user.disponible || 0,
        assigned_companies: user.assigned_companies || [],
        created: user.created,
        updated: user.updated,
        // Expanded relationships
        empresa: user.expand?.company_id || null,
        assignedCompaniesData: user.expand?.assigned_companies || [],
      }
    }

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

    /**
     * Validate user base data (default values based on company or global config)
     */
    async function validateUserBaseData(userData) {
      try {
        if (userData.role === 'usuario' || userData.role === 'operador') {
          // Obtener configuración de la empresa si el usuario no es empresa
          if (userData.company_id) {
            const company = await api.getCompanyById(userData.company_id)
            userData.flexirol = company.flexirol
            userData.flexirol2 = company.flexirol2
            userData.flexirol3 = company.flexirol3
          } else {
            throw new Error('El usuario debe pertenecer a una empresa')
          }
        } else if (userData.role === 'empresa') {
          // Usar configuración global para empresas
          const config = await api.getSystemConfig()
          userData.flexirol = config.porcentaje_servicio
          userData.flexirol2 = config.valor_fijo_mensual
          userData.flexirol3 = config.plan_default
        }
      } catch (error) {
        console.error('Error en validateUserBaseData:', error)
        throw error
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
