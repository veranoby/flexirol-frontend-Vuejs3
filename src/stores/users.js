import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { api } from '@/services/pocketbase'
import { useSystemStore } from '@/stores/system'

export const useUsersStore = defineStore('users', () => {
  const systemStore = useSystemStore()

  // State
  const users = ref([])
  const companies = ref([])
  const loading = ref(false)
  const error = ref(null)
  const currentPage = ref(1)
  const totalPages = ref(1)
  const itemsPerPage = 20

  // Getters
  const activeUsers = computed(() => users.value.filter((user) => user.gearbox === true))

  const usersByCompany = computed(
    () => (companyId) => users.value.filter((user) => user.empresa_id === companyId),
  )

  const userStats = computed(() => {
    return users.value.reduce(
      (stats, user) => {
        stats.total++
        if (user.gearbox) stats.active++
        else stats.inactive++

        if (!stats.byRole[user.role]) {
          stats.byRole[user.role] = 0
        }
        stats.byRole[user.role]++

        return stats
      },
      { total: 0, active: 0, inactive: 0, byRole: {} },
    )
  })

  // Use system store's generateUsername function
  const generateUsername = systemStore.generateUsername

  // Helper function to validate user data
  const validateUserData = async (userData, isUpdate = false, userId = null) => {
    // Validate required fields
    if (!userData.first_name || !userData.last_name || !userData.email || !userData.cedula) {
      throw new Error('Todos los campos son obligatorios')
    }

    // Use system store's validation functions
    if (!systemStore.validateEmail(userData.email)) {
      throw new Error('El formato del correo electrónico no es válido')
    }

    if (!systemStore.validateCedula(userData.cedula)) {
      throw new Error('La cédula debe tener 10 dígitos numéricos')
    }

    // Check if email already exists (skip for current user on update)
    const emailFilter = isUpdate
      ? `email = "${userData.email}" && id != "${userId}"`
      : `email = "${userData.email}"`

    const emailExists = await api
      .collection('users')
      .getFirstListItem(emailFilter, { requestKey: null })
      .catch(() => null)

    if (emailExists) {
      throw new Error('El correo electrónico ya está registrado')
    }

    // Check if cédula already exists (skip for current user on update)
    const cedulaFilter = isUpdate
      ? `cedula = "${userData.cedula}" && id != "${userId}"`
      : `cedula = "${userData.cedula}"`

    const cedulaExists = await api
      .collection('users')
      .getFirstListItem(cedulaFilter, { requestKey: null })
      .catch(() => null)

    if (cedulaExists) {
      throw new Error('La cédula ya está registrada')
    }
  }

  // Fetch users by role and optionally filter by company
  async function fetchUsersByRole(role, companyId = null) {
    loading.value = true
    error.value = null

    try {
      let filter = `role = "${role}"`

      // If companyId is provided and role is not 'empresa', filter by company
      if (companyId && role !== 'empresa') {
        filter += ` && empresa_id = "${companyId}"`
      }

      const result = await api.collection('users').getList(currentPage.value, itemsPerPage, {
        filter,
        sort: '-created',
        expand: 'empresa_id',
      })

      users.value = result.items.map((item) => ({
        id: item.id,
        first_name: item.first_name,
        last_name: item.last_name,
        email: item.email,
        username: item.username,
        cedula: item.cedula,
        role: item.role,
        gearbox: item.gearbox,
        empresa_id: item.empresa_id,
        created: item.created,
        updated: item.updated,
        // Expanded fields
        empresa: item.expand?.empresa_id,
      }))

      totalPages.value = result.totalPages
      return users.value
    } catch (err) {
      error.value = `Error al cargar usuarios: ${err.message}`
      console.error('Error fetching users:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  // Create a new user
  async function createUser(userData) {
    loading.value = true
    error.value = null

    try {
      await systemStore.validateUserBaseData(userData)
      const username = generateUsername(userData.first_name, userData.last_name, userData.cedula)
      const user = {
        first_name: userData.first_name.trim(),
        last_name: userData.last_name.trim(),
        email: userData.email.toLowerCase().trim(),
        username,
        cedula: userData.cedula.trim(),
        role: userData.role || 'usuario',
        gearbox: userData.gearbox !== undefined ? userData.gearbox : true,
        password: userData.password || userData.cedula,
        passwordConfirm: userData.password || userData.cedula,
        empresa_id: userData.role === 'empresa' ? null : userData.empresa_id || null,
      }
      const result = await api.collection('users').create(user)
      users.value.unshift({
        ...result,
        empresa: user.empresa_id ? { id: user.empresa_id } : null,
      })
      return result
    } catch (err) {
      error.value = err.message || 'Error al crear el usuario'
      console.error('Error creating user:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  // Update an existing user
  async function updateUser(userId, userData) {
    loading.value = true
    error.value = null

    try {
      // Validate user data
      await validateUserData(userData, true, userId)

      // Generate new username if name or cédula changed
      const existingUser = users.value.find((u) => u.id === userId)
      let username = existingUser.username

      if (userData.first_name || userData.last_name || userData.cedula) {
        const firstName = userData.first_name || existingUser.first_name
        const lastName = userData.last_name || existingUser.last_name
        const cedula = userData.cedula || existingUser.cedula
        username = generateUsername(firstName, lastName, cedula)
      }

      // Prepare update data
      const updateData = {
        first_name: userData.first_name ? userData.first_name.trim() : existingUser.first_name,
        last_name: userData.last_name ? userData.last_name.trim() : existingUser.last_name,
        email: userData.email ? userData.email.toLowerCase().trim() : existingUser.email,
        username,
        cedula: userData.cedula ? userData.cedula.trim() : existingUser.cedula,
        role: userData.role || existingUser.role,
        gearbox: userData.gearbox !== undefined ? userData.gearbox : existingUser.gearbox,
        empresa_id:
          userData.role === 'empresa' ? null : userData.empresa_id || existingUser.empresa_id,
      }

      // Update user in PocketBase
      const result = await api.collection('users').update(userId, updateData)

      // Update in local state
      const index = users.value.findIndex((u) => u.id === userId)
      if (index !== -1) {
        users.value[index] = {
          ...users.value[index],
          ...result,
          empresa: updateData.empresa_id ? { id: updateData.empresa_id } : null,
        }
      }

      return result
    } catch (err) {
      error.value = err.message || 'Error al actualizar el usuario'
      console.error('Error updating user:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  // Delete a user
  async function deleteUser(userId) {
    loading.value = true
    error.value = null

    try {
      // Delete user from PocketBase
      await api.collection('users').delete(userId)

      // Remove from local state
      users.value = users.value.filter((user) => user.id !== userId)

      return true
    } catch (err) {
      error.value = 'Error al eliminar el usuario'
      console.error('Error deleting user:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  // Toggle user status (gearbox)
  async function toggleUserStatus(userId) {
    loading.value = true
    error.value = null

    try {
      const user = users.value.find((u) => u.id === userId)
      if (!user) throw new Error('Usuario no encontrado')

      // Toggle gearbox status
      const newStatus = !user.gearbox

      // Update in PocketBase
      const result = await api.collection('users').update(userId, {
        gearbox: newStatus,
      })

      // Update in local state
      const index = users.value.findIndex((u) => u.id === userId)
      if (index !== -1) {
        users.value[index].gearbox = newStatus
      }

      return result
    } catch (err) {
      error.value = 'Error al cambiar el estado del usuario'
      console.error('Error toggling user status:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  // Bulk create users from Excel/CSV
  async function bulkCreateUsers(usersArray) {
    loading.value = true
    error.value = null

    try {
      if (!Array.isArray(usersArray) || usersArray.length === 0) {
        throw new Error('No se proporcionaron usuarios para crear')
      }

      const results = []
      const errors = []

      // Process each user sequentially to maintain order and handle errors properly
      for (const [index, userData] of usersArray.entries()) {
        try {
          // Validate required fields for bulk import
          if (!userData.first_name || !userData.last_name || !userData.email || !userData.cedula) {
            throw new Error('Faltan campos obligatorios')
          }

          // Set default role if not provided
          if (!userData.role) {
            userData.role = 'usuario'
          }

          // Create the user
          const result = await createUser(userData)
          results.push({
            success: true,
            data: result,
            index,
          })
        } catch (err) {
          errors.push({
            success: false,
            error: err.message,
            data: userData,
            index,
          })

          // Continue with next user even if one fails
          continue
        }
      }

      return {
        total: usersArray.length,
        success: results.length,
        failed: errors.length,
        results,
        errors,
      }
    } catch (err) {
      error.value = 'Error en la carga masiva de usuarios'
      console.error('Error in bulk user creation:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Reset the store to its initial state
   */
  function $reset() {
    users.value = []
    companies.value = []
    loading.value = false
    error.value = null
    currentPage.value = 1
    totalPages.value = 1
  }

  /**
   * Fetch a single user by ID with expanded company data
   * @param {string} userId - The ID of the user to fetch
   * @returns {Promise<Object>} The user object with expanded company data
   */
  async function fetchUserById(userId) {
    loading.value = true
    error.value = null

    try {
      const user = await api.collection('users').getOne(userId, {
        expand: 'empresa_id',
      })

      // Format the user object to match our store's format
      const formattedUser = {
        id: user.id,
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email,
        username: user.username,
        cedula: user.cedula,
        role: user.role,
        gearbox: user.gearbox,
        empresa_id: user.empresa_id,
        created: user.created,
        updated: user.updated,
        empresa: user.expand?.empresa_id,
      }

      return formattedUser
    } catch (err) {
      error.value = `Error al cargar el usuario: ${err.message}`
      console.error('Error fetching user:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  // Export store methods and state
  return {
    // State
    users,
    companies,
    loading,
    error,
    currentPage,
    totalPages,
    itemsPerPage,

    // Getters
    activeUsers,
    usersByCompany,
    userStats,

    // Actions
    fetchUsersByRole,
    fetchUserById,
    createUser,
    updateUser,
    deleteUser,
    toggleUserStatus,
    bulkCreateUsers,
    $reset,
  }
})
