import PocketBase from 'pocketbase'
import * as XLSX from 'xlsx'

const pb = new PocketBase(import.meta.env.VITE_POCKETBASE_URL || 'http://127.0.0.1:8090')

// Temporary cache for expensive queries
const cache = {
  systemConfig: null,
  systemConfigTime: 0,
  CACHE_TTL: 5 * 60 * 1000, // 5 minutes
}

// Auto-refresh auth token
pb.authStore.onChange(() => {
  console.log('Auth state changed:', pb.authStore.isValid)
})

/**
 * Builds a safe filter string for PocketBase queries.
 * @param {Object} filters - Key-value pairs for filtering.
 * @returns {string} - Encoded filter string.
 */
function buildFilter(filters = {}) {
  if (!filters || Object.keys(filters).length === 0) return ''

  return Object.entries(filters)
    .filter(([key, value]) => {
      if (['page', 'perPage', 'sort', 'expand'].includes(key)) return false
      return value !== null && value !== undefined
    })
    .map(([key, value]) => {
      if (Array.isArray(value)) {
        return `${key}~"${value.map((v) => String(v).replace(/"/g, '\\"')).join('|')}"`
      }
      return `${key}="${String(value).replace(/"/g, '\\"')}"`
    })
    .join(' && ')
}

// API methods for Flexirol
export const api = {
  // Auth
  async login(email, password) {
    try {
      const authData = await pb.collection('users').authWithPassword(email, password)
      return { success: true, user: authData.record }
    } catch (error) {
      return { success: false, error: error.message }
    }
  },

  async logout() {
    pb.authStore.clear()
  },

  // Users
  async getUsers(filters = {}, page = 1, perPage = 1000) {
    const params = {
      page,
      perPage,
      sort: '-created',
      expand: 'company_id',
      ...(buildFilter(filters) && { filter: buildFilter(filters) }),
    }
    return await pb.collection('users').getList(page, perPage, params)
  },

  async getUserById(id) {
    return await pb.collection('users').getOne(id, { expand: 'company_id' })
  },

  async getUserCompanyInfo(userId) {
    return await pb.collection('users').getOne(userId, {
      expand: 'company_id',
    })
  },

  async createUser(userData) {
    return await pb.collection('users').create(userData)
  },

  async updateUser(id, userData) {
    return await pb.collection('users').update(id, userData)
  },

  async updateUserStatus(userId, status) {
    return await pb.collection('users').update(userId, { gearbox: status })
  },

  async deleteUser(id) {
    return await pb.collection('users').delete(id)
  },

  async bulkCreateUsers(usersArray) {
    const results = []
    for (const user of usersArray) {
      try {
        const result = await this.createUser(user)
        results.push({ success: true, data: result })
      } catch (error) {
        results.push({
          success: false,
          error: error.message,
          data: user,
        })
      }
    }
    return results
  },

  // Companies
  async getCompanies(filters = {}, page = 1, perPage = 1000) {
    const params = {
      page,
      perPage,
      sort: '-created',
      expand: 'owner_id',
      fields:
        'id,company_name,cedula,owner_id,porcentaje,dia_inicio,dia_cierre,frecuencia,dia_bloqueo,dia_reinicio,gearbox,flexirol,flexirol2,flexirol3', // Todos los campos relevantes
      ...(buildFilter(filters) && { filter: buildFilter(filters) }),
    }
    return await pb.collection('companies').getList(page, perPage, params)
  },

  async getCompanyById(id) {
    return await pb.collection('companies').getOne(id, { expand: 'owner_id' })
  },

  async createCompany(companyData) {
    return await pb.collection('companies').create(companyData)
  },

  async updateCompany(id, companyData) {
    return await pb.collection('companies').update(id, companyData)
  },

  async deleteCompany(id) {
    return await pb.collection('companies').delete(id)
  },

  async toggleCompanyStatus(id, status) {
    return await pb.collection('companies').update(id, { gearbox: status })
  },

  async getCompanyUsers(companyId, filters = {}, page = 1, perPage = 1000) {
    const companyFilter = `company_id="${companyId}"`
    const additionalFilters = buildFilter(filters)
    const finalFilter = additionalFilters
      ? `${companyFilter} && ${additionalFilters}`
      : companyFilter

    return await pb.collection('users').getList(page, perPage, {
      filter: finalFilter,
      sort: '-created',
    })
  },

  // Advance Requests
  async getAdvanceRequests(filters = {}) {
    return await pb.collection('advance_requests').getList(1, 1000, {
      filter: buildFilter(filters),
      expand: 'user_id,company_id,banco_id',
      sort: '-fecha_solicitud',
    })
  },

  async getAdvanceRequestsByStatus(status) {
    return await this.getAdvanceRequests({ estado: status })
  },

  async createAdvanceRequest(requestData) {
    return await pb.collection('advance_requests').create(requestData)
  },

  async updateAdvanceRequest(id, requestData) {
    return await pb.collection('advance_requests').update(id, requestData)
  },

  async updateAdvanceRequestStatus(id, newStatus) {
    return await this.updateAdvanceRequest(id, { estado: newStatus })
  },

  // Bank Accounts
  async getBankAccounts(userId) {
    return await pb.collection('bank_accounts').getList(1, 50, {
      filter: `user_id="${userId}"`,
      sort: '-created',
    })
  },

  async createBankAccount(bankData) {
    return await pb.collection('bank_accounts').create(bankData)
  },

  async updateBankAccount(id, bankData) {
    return await pb.collection('bank_accounts').update(id, bankData)
  },

  async deleteBankAccount(id) {
    return await pb.collection('bank_accounts').delete(id)
  },

  // Excel Operations
  async uploadExcelUsers(file, companyId) {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('companyId', companyId)

    return await pb.collection('_imports').create(formData, {
      requestKey: null,
    })
  },

  async generateBankingExcel(requests) {
    // Group requests by bank
    const banks = {}
    requests.forEach((request) => {
      const bankName = request.expand?.banco_id?.nombre || 'Sin Banco'
      if (!banks[bankName]) {
        banks[bankName] = []
      }
      banks[bankName].push(request)
    })

    // Create a new workbook
    const wb = XLSX.utils.book_new()

    // Create a worksheet for each bank
    Object.entries(banks).forEach(([bankName, bankRequests]) => {
      // Convert requests to worksheet data
      const wsData = bankRequests.map((request) => ({
        NOMBRE: request.expand?.user_id?.first_name + ' ' + request.expand?.user_id?.last_name,
        CEDULA: request.expand?.user_id?.cedula || '',
        CUENTA: request.cuenta_bancaria || '',
        TIPO_CUENTA: request.tipo_cuenta || 'Ahorros',
        MONTO: request.monto_solicitado,
        BANCO: bankName,
        EMAIL: request.expand?.user_id?.email || '',
        TELEFONO: request.expand?.user_id?.phone_number || '',
      }))

      // Add worksheet to workbook
      const ws = XLSX.utils.json_to_sheet(wsData)
      XLSX.utils.book_append_sheet(wb, ws, bankName.substring(0, 31)) // Sheet name max 31 chars
    })

    // Generate Excel file
    XLSX.writeFile(wb, `pagos_${new Date().toISOString().split('T')[0]}.xlsx`)
  },

  // ===== SYSTEM CONFIG METHODS =====
  async getSystemConfig(forceRefresh = false) {
    if (!forceRefresh && cache.systemConfig && isCacheValid(cache.systemConfigTime)) {
      console.log('🎯 Cache hit: system config')
      return cache.systemConfig
    }

    try {
      const config = await pb.collection('system_config').getFirstListItem('name="default_config"')

      cache.systemConfig = config
      cache.systemConfigTime = Date.now()
      console.log('📡 System config fetched and cached')

      return config
    } catch (error) {
      // Create default if not exists
      const defaultConfig = {
        name: 'default_config',
        porcentaje_servicio: 10,
        valor_fijo_mensual: 50,
        plan_default: '1',
        dia_inicio: 2,
        dia_cierre: 28,
        porcentaje_maximo: 70,
        frecuencia_maxima: 3,
        dias_bloqueo: 2,
        dias_reinicio: 3,
        activo: true,
      }

      const created = await pb.collection('system_config').create(defaultConfig)
      cache.systemConfig = created
      cache.systemConfigTime = Date.now()

      return created
    }
  },

  async updateSystemConfig(configData) {
    const config = await this.getSystemConfig()
    return await pb.collection('system_config').update(config.id, configData)
  },

  async getDefaultCompanyConfig() {
    const config = await this.getSystemConfig()
    return {
      flexirol: config.porcentaje_servicio,
      flexirol2: config.valor_fijo_mensual,
      flexirol3: config.plan_default,
      dia_inicio: config.dia_inicio,
      dia_cierre: config.dia_cierre,
      porcentaje: config.porcentaje_maximo,
      dia_bloqueo: config.dias_bloqueo,
      frecuencia: config.frecuencia_maxima,
      dia_reinicio: config.dias_reinicio,
    }
  },

  // Global user stats optimized
  async getGlobalUserStats() {
    try {
      const result = await pb.collection('users').getList(1, 1, {
        fields: 'id',
        requestKey: null, // Evita caché de PocketBase
      })
      console.log('getGlobalUserStats result:', result)
      return {
        success: true,
        totalItems: result.totalItems || 0, // Fallback explícito
      }
    } catch (error) {
      console.error('Error en getGlobalUserStats:', error)
      return { success: false, totalItems: 0 }
    }
  },

  // Company-owner gearbox sync
  async updateCompanyWithOwnerSync(companyId, companyData) {
    try {
      // 1. Actualizar solo el campo gearbox de la compañía
      const updatedCompany = await pb.collection('companies').update(companyId, {
        gearbox: companyData.gearbox,
      })

      // 2. Sincronizar solo el gearbox del propietario si existe
      if (updatedCompany.owner_id) {
        await pb.collection('users').update(updatedCompany.owner_id, {
          gearbox: companyData.gearbox,
        })
      }

      return {
        success: true,
        company: updatedCompany,
        message: 'Sincronización completada',
      }
    } catch (error) {
      console.error('Error en sync:', error)
      return {
        success: false,
        error: error.message,
        company: null,
      }
    }
  },
}

// Real-time subscriptions
export const subscriptions = {
  subscribeToAdvanceRequests(callback) {
    return pb.collection('advance_requests').subscribe('*', (e) => {
      callback(e)
    })
  },

  subscribeToUsers(callback) {
    return pb.collection('users').subscribe('*', (e) => {
      callback(e)
    })
  },

  subscribeToCompanyUpdates(companyId, callback) {
    return pb.collection('companies').subscribe(companyId, (e) => {
      callback(e)
    })
  },

  unsubscribe(subscription) {
    return pb.collection(subscription.collection).unsubscribe(subscription.id)
  },
}

export { pb }
export default pb
