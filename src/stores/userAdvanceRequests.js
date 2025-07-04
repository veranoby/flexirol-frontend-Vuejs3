import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { api } from '@/services/pocketbase'
import { useAuthStore } from '@/stores/auth'
import { useSystemStore } from '@/stores/system'

export const useUserAdvanceRequestsStore = defineStore('userAdvanceRequests', () => {
  const authStore = useAuthStore()
  const systemStore = useSystemStore()

  // State
  const userRequests = ref([])
  const availableAmount = ref(0)
  const companyConfig = ref({})
  const loading = ref(false)
  const error = ref(null)
  const validationMessage = ref('')
  const validationClass = ref('alert alert-info')
  
  // Pagination
  const currentPage = ref(1)
  const totalPages = ref(1)
  const itemsPerPage = 20
  const totalItems = ref(0)

  // Getters
  const pendingRequests = computed(() =>
    userRequests.value.filter((req) => req.estado === 'pendiente'),
  )

  const processedRequests = computed(() =>
    userRequests.value.filter((req) => req.estado === 'procesando' || req.estado === 'pagado'),
  )

  const canRequestAdvance = computed(() => {
    return validateRequestLimits().valid
  })

  // Main validation function migrated from habilitado_switch
  function validateRequestLimits(requestedAmount = 0) {
    const today = new Date()
    const currentDay = today.getDate()
    const currentMonth = today.getMonth()
    const currentYear = today.getFullYear()

    // Default response
    const response = {
      valid: true,
      message: 'Usuario Activo y Habilitado para Anticipos..',
      class: 'alert alert-success',
    }

    // 1. Check if company has uploaded Excel for the month
    if (!companyConfig.value.fecha_excel) {
      response.valid = false
      response.message =
        'Usuario Bloqueado! Su Empresa no ha cargado sus Datos actualizados de Anticipos - Por favor comuniquese su empresa para normalizar su estado..'
      response.class = 'alert alert-danger'
      return response
    }

    // 2. Check if user and company are active
    if (!authStore.user?.gearbox || !companyConfig.value.gearbox) {
      response.valid = false
      response.message =
        'Usuario Bloqueado por Admin! Por favor comuniquese su empresa para normalizar su estado..'
      response.class = 'alert alert-danger'
      return response
    }

    // 3. Check request frequency limit
    if (pendingRequests.value.length >= Number(companyConfig.value.frecuencia)) {
      response.valid = false
      response.message = `El Usuario ha alcanzado el limite de solicitudes (solicitudes permitidas: ${companyConfig.value.frecuencia})`
      response.class = 'alert alert-warning'
      return response
    }

    // 4. Check cooldown period between requests
    const lastRequest = userRequests.value[0] // Assuming most recent is first
    if (lastRequest) {
      const requestDate = new Date(lastRequest.fecha_solicitud)
      const cooldownDays = Number(companyConfig.value.dia_reinicio) || 0

      if (cooldownDays > 0) {
        const cooldownDate = new Date(requestDate)
        cooldownDate.setDate(cooldownDate.getDate() + cooldownDays)

        if (today < cooldownDate) {
          const daysLeft = Math.ceil((cooldownDate - today) / (1000 * 60 * 60 * 24))
          response.valid = false
          response.message = `Solicitud en proceso. Pronto podra volver a solicitar un nuevo Anticipo.. (dias pendientes: ${daysLeft})`
          response.class = 'alert alert-warning'
          return response
        }
      }
    }

    // 5. Check monthly cycle dates
    const startDay = Number(companyConfig.value.dia_inicio) || 1
    const endDay = Number(companyConfig.value.dia_cierre) || 30
    const blockDays = Number(companyConfig.value.dia_bloqueo) || 0
    const effectiveEndDay = endDay - blockDays
    const effectiveStartDay = startDay + blockDays

    if (currentDay > effectiveEndDay) {
      response.valid = false
      response.message = `Ha superado el ultimo dia disponible para solicitar Anticipos (fecha limite de solicitud: ${effectiveEndDay} de este mes)`
      response.class = 'alert alert-warning'
      return response
    }

    if (currentDay < effectiveStartDay) {
      response.valid = false
      response.message = `Aun no esta disponible el servicio de solicitudes de Anticipos (fecha de inicio: ${effectiveStartDay} de este mes)`
      response.class = 'alert alert-warning'
      return response
    }

    // 6. Check if Excel is up to date
    const excelDate = new Date(companyConfig.value.fecha_excel)
    const endOfLastMonth = new Date(currentYear, currentMonth, 0) // Last day of previous month

    if (excelDate < endOfLastMonth) {
      response.valid = false
      response.message = `Su Empresa no ha cargado sus Datos actualizados de Anticipos! (última actualización: ${formatDate(excelDate)}) - Ha sido bloqueado. Por favor comuniquese con su empresa para normalizar su estado..`
      response.class = 'alert alert-danger'
      return response
    }

    // 7. Check available amount if requested
    if (requestedAmount > 0) {
      const maxAmount = calculateAvailableAmount()
      if (requestedAmount > maxAmount) {
        response.valid = false
        response.message = `El monto solicitado excede el disponible. Monto máximo permitido: $${maxAmount.toFixed(2)}`
        response.class = 'alert alert-warning'
        return response
      }
    }

    return response
  }

  // Calculate available amount based on company rules
  function calculateAvailableAmount() {
    if (!authStore.user || !companyConfig.value) return 0
    
    // Use the system store's calculation
    return systemStore.calculateAvailableAmount(authStore.user, companyConfig.value)
  }

  /**
   * Reset the store to its initial state
   */
  function $reset() {
    userRequests.value = []
    availableAmount.value = 0
    companyConfig.value = {}
    loading.value = false
    error.value = null
    validationMessage.value = ''
    validationClass.value = 'alert alert-info'
    currentPage.value = 1
    totalPages.value = 1
    totalItems.value = 0
  }

  /**
   * Fetch paginated advance requests for a user
   * @param {string} userId - The ID of the user
   * @param {number} [page=1] - Page number to fetch
   * @param {number} [perPage=20] - Number of items per page
   * @returns {Promise<Array>} - List of advance requests
   */
  async function fetchUserRequests(userId, page = 1, perPage = itemsPerPage) {
    loading.value = true
    error.value = null
    currentPage.value = page

    try {
      const result = await api.collection('advance_requests').getList(page, perPage, {
        filter: `user_id = "${userId}"`,
        sort: '-fecha_solicitud',
        expand: 'user_id,company_id',
      })

      userRequests.value = result.items.map((item) => ({
        id: item.id,
        user_id: item.user_id,
        company_id: item.company_id,
        monto_solicitado: item.monto_solicitado,
        monto_aprobado: item.monto_aprobado,
        estado: item.estado,
        fecha_solicitud: item.fecha_solicitud,
        fecha_procesado: item.fecha_procesado,
        fecha_pagado: item.fecha_pagado,
        observaciones: item.observaciones,
        // Expand user and company data
        user: item.expand?.user_id,
        company: item.expand?.company_id,
      }))

      // Update pagination info
      totalPages.value = result.totalPages
      totalItems.value = result.totalItems
      
      console.log(`Fetched ${userRequests.value.length} user requests (page ${currentPage.value} of ${totalPages.value})`)
      return {
        items: userRequests.value,
        pagination: {
          currentPage: currentPage.value,
          totalPages: totalPages.value,
          totalItems: totalItems.value,
          itemsPerPage: itemsPerPage
        }
      }
    } catch (err) {
      error.value = `Error al cargar solicitudes: ${err.message}`
      console.error('Error fetching user requests:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  // Create new advance request
  async function createAdvanceRequest(requestData) {
    loading.value = true
    error.value = null

    try {
      // Validate request data
      if (!requestData.user_id || !requestData.company_id || !requestData.monto_solicitado) {
        throw new Error('Datos de solicitud incompletos')
      }

      // Validate request limits
      const validation = validateRequestLimits(requestData.monto_solicitado)
      if (!validation.valid) {
        validationMessage.value = validation.message
        validationClass.value = validation.class
        throw new Error(validation.message)
      }

      // Prepare request data
      const request = {
        user_id: requestData.user_id,
        company_id: requestData.company_id,
        monto_solicitado: Number(requestData.monto_solicitado),
        estado: 'pendiente',
        fecha_solicitud: new Date().toISOString(),
        banco_id: requestData.banco_id,
        cuenta_bancaria: requestData.cuenta_bancaria,
        observaciones: requestData.observaciones || ''
      }

      // Create request in PocketBase
      const result = await api.collection('advance_requests').create(request)

      // Update user's available amount
      const user = await api.collection('users').getOne(requestData.user_id)
      if (user) {
        await api.collection('users').update(requestData.user_id, {
          disponible: (Number(user.disponible || 0) - Number(requestData.monto_solicitado)).toString()
        })
      }

      // Add to local state
      userRequests.value.unshift({
        ...result,
        user: authStore.user,
        company: companyConfig.value
      })

      // Update available amount
      availableAmount.value = calculateAvailableAmount()
      
      console.log('Created advance request:', result.id)
      return result
    } catch (err) {
      error.value = err.message || 'Error al crear la solicitud'
      console.error('Error creating advance request:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  function formatDate(date) {
    if (!date) return 'N/A'
    const d = new Date(date)
    return d.toLocaleDateString('es-EC', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })
  }

  // Fetch user's available amount
  async function fetchUserAvailableAmount() {
    try {
      if (!authStore.user?.id) return 0
      
      // Get fresh user data with company config
      const userInfo = await systemStore.getInfoUsuarioCompleto(authStore.user.id)
      
      // Update company config
      companyConfig.value = {
        id: userInfo.empresa_id,
        nombre: userInfo.empresa_nombre,
        porcentaje: userInfo.porcentaje,
        dia_cierre: userInfo.dia_cierre,
        dia_bloqueo: userInfo.dia_bloqueo
      }
      
      // Calculate and return available amount
      availableAmount.value = systemStore.calculateAvailableAmount(userInfo, companyConfig.value)
      return availableAmount.value
    } catch (err) {
      console.error('Error fetching available amount:', err)
      error.value = 'Error al cargar el monto disponible'
      throw err
    }
  }

  // Initialize store
  async function init() {
    if (authStore.user?.id) {
      await Promise.all([
        fetchUserRequests(authStore.user.id),
        fetchUserAvailableAmount()
      ])
    }
  }

  // Return store methods and state
  return {
    // State
    userRequests,
    availableAmount,
    companyConfig,
    loading,
    error,
    validationMessage,
    validationClass,
    
    // Pagination state
    currentPage,
    totalPages,
    itemsPerPage,
    totalItems,

    // Getters
    pendingRequests,
    processedRequests,
    canRequestAdvance,

    // Actions
    fetchUserRequests,
    createAdvanceRequest,
    fetchUserAvailableAmount,
    validateRequestLimits,
    init,
    $reset,
  }
})
