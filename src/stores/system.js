import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { api } from '@/services/pocketbase'
import { useAuthStore } from '@/stores/auth'

export const useSystemStore = defineStore('system', () => {
  const authStore = useAuthStore()

  // Cache for user info with TTL (5 minutes)
  const userInfoCache = ref({})
  const CACHE_TTL = 5 * 60 * 1000 // 5 minutes in milliseconds

  // Computed properties for quick access to current user info
  const currentUser = computed(() => authStore.user)
  const currentUserId = computed(() => authStore.user?.id)
  const currentUserRole = computed(() => authStore.user?.role)
  const currentCompanyId = computed(() => authStore.user?.empresa_id)

  /**
   * Get user role by user ID
   * @param {string} userId - User ID to get role for
   * @returns {Promise<string>} User role
   */
  async function getUserRole(userId) {
    try {
      const user = await api.collection('users').getOne(userId)
      return user.role
    } catch (error) {
      console.error('Error getting user role:', error)
      throw new Error('No se pudo obtener el rol del usuario')
    }
  }

  /**
   * Get complete user info with company configuration
   * @param {string} userId - User ID to get info for
   * @returns {Promise<Object>} Complete user info with company config
   */
  async function getInfoUsuarioCompleto(userId) {
    const now = Date.now()

    // Check cache first
    const cached = userInfoCache.value[userId]
    if (cached && now - cached.timestamp < CACHE_TTL) {
      return cached.data
    }

    try {
      const user = await api.collection('users').getOne(userId, {
        expand: 'empresa_id',
      })

      const company = user.expand?.empresa_id || {}

      // Map legacy fields with defaults
      const result = {
        // User info
        id: user.id,
        nombre: user.first_name,
        apellido: user.last_name,
        email: user.email,
        cedula: user.cedula,
        role: user.role,
        gearbox: user.gearbox,

        // Company info with defaults
        empresa_id: user.empresa_id,
        empresa_nombre: company.nombre || '',

        // Company configuration with defaults from legacy
        fecha_excel: company.fecha_excel || 'No creado',
        flexirol: company.flexirol || '10',
        flexirol2: company.flexirol2 || '10',
        dia_inicio: company.dia_inicio || '2',
        dia_cierre: company.dia_cierre || '28',
        dia_bloqueo: company.dia_bloqueo || '0',
        dia_reinicio: company.dia_reinicio || '0',
        frecuencia: company.frecuencia || '1',
        porcentaje: company.porcentaje || '30',

        // Timestamp for cache invalidation
        _cachedAt: now,
      }

      // Update cache
      userInfoCache.value[userId] = {
        data: result,
        timestamp: now,
      }

      return result
    } catch (error) {
      console.error('Error getting user info:', error)
      throw new Error('No se pudo obtener la información del usuario')
    }
  }

  /**
   * Validate cédula (10 digits)
   * @param {string} cedula - Cédula to validate
   * @returns {boolean} True if valid
   */
  function validateCedula(cedula) {
    return /^\d{10}$/.test(cedula)
  }

  /**
   * Validate email format
   * @param {string} email - Email to validate
   * @returns {boolean} True if valid
   */
  function validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  /**
   * Generate username from name and cédula
   * @param {string} firstName - First name
   * @param {string} lastName - Last name
   * @param {string} cedula - Cédula (10 digits)
   * @returns {string} Generated username
   */
  function generateUsername(firstName, lastName, cedula) {
    if (!firstName || !lastName || !cedula) {
      throw new Error('Nombre, apellido y cédula son requeridos')
    }

    // Normalize and clean name parts
    const clean = (str) =>
      str
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // Remove accents
        .replace(/[^a-z0-9]/g, '') // Remove special chars
        .trim()

    const first = clean(firstName)
    const last = clean(lastName)
    const id = cedula.toString().trim()

    return `${first}_${last}_${id}`.toLowerCase()
  }

  /**
   * Calculate available amount for advance
   * @param {Object} user - User object
   * @param {Object} company - Company configuration
   * @returns {number} Available amount
   */
  function calculateAvailableAmount(user, company) {
    if (!user || !company) return 0

    const today = new Date()
    const currentDay = today.getDate()
    const endDay = Number(company.dia_cierre) || 30
    const blockDays = Number(company.dia_bloqueo) || 0
    const effectiveEndDay = endDay - blockDays

    if (currentDay > effectiveEndDay) {
      return 0
    }

    // Calculate daily amount based on percentage of available balance
    const dailyAmount =
      (Number(user.disponible) * Number(company.porcentaje)) / 100 / effectiveEndDay

    // Calculate total available up to current day
    const available = dailyAmount * currentDay

    return Math.max(0, Math.floor(available * 100) / 100) // Round to 2 decimal places
  }

  // Clear cache for a specific user or all users
  function clearCache(userId = null) {
    if (userId) {
      delete userInfoCache.value[userId]
    } else {
      userInfoCache.value = {}
    }
  }

  /**
   * Get users by role with optional filters (empresa, cedula)
   * @param {string} role - User role to filter by
   * @param {string} [orderby='created'] - Field to order by
   * @param {string} [order='desc'] - Sort order (asc/desc)
   * @param {string|null} [empresa=null] - Company ID to filter by
   * @param {string|null} [cedula=null] - Cedula to filter by
   * @returns {Promise<Array>} List of filtered users with expanded company data
   */
  async function getUsersByRole(
    role,
    orderby = 'created',
    order = 'desc',
    empresa = null,
    cedula = null,
  ) {
    try {
      // Base filter for role
      let filter = `role = "${role}"`

      // Add empresa filter if provided
      if (empresa) {
        filter += ` && empresa_id = "${empresa}"`
      }

      // Add cedula filter if provided
      if (cedula) {
        filter += ` && cedula = "${cedula}"`
      }

      // Get users with optional expand
      const result = await api.collection('users').getList(1, 500, {
        filter,
        sort: `${order === 'desc' ? '-' : ''}${orderby}`,
        expand: 'empresa_id',
      })

      // Map results to consistent format
      return result.items.map((user) => ({
        id: user.id,
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email,
        cedula: user.cedula,
        role: user.role,
        gearbox: user.gearbox,
        disponible: user.disponible,
        empresa_id: user.empresa_id,
        empresa: user.expand?.empresa_id || null,
        created: user.created,
        updated: user.updated,
      }))
    } catch (error) {
      console.error('Error in getUsersByRole:', error)
      throw new Error('No se pudo obtener la lista de usuarios')
    }
  }

  /**
   * Validación base para datos de usuario (reusable)
   * @param {Object} userData - Datos del usuario
   * @param {boolean} [isUpdate=false] - Si es una actualización
   * @param {string} [userId=null] - ID del usuario (para updates)
   */
  async function validateUserBaseData(userData, isUpdate = false, userId = null) {
    if (!userData.first_name || !userData.last_name || !userData.email || !userData.cedula) {
      throw new Error('Todos los campos son obligatorios')
    }
    if (!validateEmail(userData.email)) {
      throw new Error('El formato del correo electrónico no es válido')
    }
    if (!validateCedula(userData.cedula)) {
      throw new Error('La cédula debe tener 10 dígitos numéricos')
    }

    // Verificar unicidad de email y cédula
    const emailFilter = isUpdate
      ? `email = "${userData.email}" && id != "${userId}"`
      : `email = "${userData.email}"`
    const cedulaFilter = isUpdate
      ? `cedula = "${userData.cedula}" && id != "${userId}"`
      : `cedula = "${userData.cedula}"`

    const [emailExists, cedulaExists] = await Promise.all([
      api
        .collection('users')
        .getFirstListItem(emailFilter, { requestKey: null })
        .catch(() => null),
      api
        .collection('users')
        .getFirstListItem(cedulaFilter, { requestKey: null })
        .catch(() => null),
    ])

    if (emailExists) throw new Error('El correo electrónico ya está registrado')
    if (cedulaExists) throw new Error('La cédula ya está registrada')
  }

  return {
    // Computed properties
    currentUser,
    currentUserId,
    currentUserRole,
    currentCompanyId,

    // Functions
    getUserRole,
    getInfoUsuarioCompleto,
    validateCedula,
    validateEmail,
    generateUsername,
    calculateAvailableAmount,
    clearCache,
    getUsersByRole,
    validateUserBaseData,
  }
})

// ========== TOAST SYSTEM (Bootstrap 5) ==========
export const useToastSystem = () => {
  const showToast = (message, type = 'info', duration = 3000) => {
    const toastContainer = document.querySelector('.toast-container')
    if (!toastContainer) return
    const toastId = `toast-${Date.now()}`
    const typeClass =
      type === 'danger'
        ? 'danger'
        : type === 'success'
          ? 'success'
          : type === 'warning'
            ? 'warning'
            : 'info'
    const toastHTML = `
      <div id="${toastId}" class="toast align-items-center text-bg-${typeClass}" role="alert" aria-live="assertive" aria-atomic="true">
        <div class="d-flex">
          <div class="toast-body">${message}</div>
          <button type="button" class="btn-close me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
        </div>
      </div>
    `
    toastContainer.insertAdjacentHTML('beforeend', toastHTML)
    const toastElement = document.getElementById(toastId)
    const toast = new window.bootstrap.Toast(toastElement, { delay: duration })
    toast.show()
    toastElement.addEventListener('hidden.bs.toast', () => {
      toastElement.remove()
    })
  }
  return { showToast }
}
