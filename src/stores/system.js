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
   * @param {string|null} [empresa=null] - Company ID to filter by
   * @param {string|null} [cedula=null] - Cedula to filter by
   * @returns {Promise<Array>} List of filtered users with expanded company data
   */
  async function getUsersByRole(role, empresa = null, cedula = null) {
    try {
      const filters = {}
      if (role) filters.role = role
      if (empresa) filters.company_id = empresa
      if (cedula) filters.cedula = cedula
      const result = await api.getUsers(filters)
      return result.items || result
    } catch (error) {
      console.error('Error in getUsersByRole:', error)
      throw new Error('No se pudo obtener la lista de usuarios')
    }
  }

  /**
   * Validación base para datos de usuario (reusable)
   * @param {Object} userData - Datos del usuario
   * @returns {Object} { isValid: boolean, errors: object }
   */
  function validateUserBaseData(userData) {
    const errors = {}

    if (!userData.first_name) {
      errors.first_name = 'El nombre es obligatorio'
    }
    if (!userData.last_name) {
      errors.last_name = 'El apellido es obligatorio'
    }
    if (!userData.email) {
      errors.email = 'El correo electrónico es obligatorio'
    } else if (!validateEmail(userData.email)) {
      errors.email = 'El formato del correo electrónico no es válido'
    }
    if (!userData.cedula) {
      errors.cedula = 'La cédula es obligatoria'
    } else if (!validateCedula(userData.cedula)) {
      errors.cedula = 'La cédula debe tener 10 dígitos numéricos'
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
    }
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
    validateUserBaseData,
    generateUsername,
    calculateAvailableAmount,
    clearCache,
    getUsersByRole,
  }
})

// ========== TOAST SYSTEM (Bootstrap 5) ==========
export const useToastSystem = () => {
  const showToast = (message, type = 'info', duration = 3000) => {
    const toastContainer = document.querySelector('.toast-container')
    if (!toastContainer) {
      console.warn('Toast container not found')
      return
    }
    if (!window.bootstrap || !window.bootstrap.Toast) {
      console.warn('Bootstrap Toast not available, fallback to alert:', message)
      // Fallback: simple alert or console
      // alert(message)
      return
    }
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
