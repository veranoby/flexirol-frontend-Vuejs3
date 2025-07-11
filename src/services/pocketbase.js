import PocketBase from 'pocketbase'
import * as XLSX from 'xlsx'

const pb = new PocketBase(import.meta.env.VITE_POCKETBASE_URL || 'http://127.0.0.1:8090')

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
    try {
      const user = await pb.collection('users').getOne(userId, {
        expand: 'company_id',
        fields: '*,company_id.*',
      })

      // Map to legacy format for compatibility
      return {
        ...user,
        empresa_nombre: user.expand?.company_id?.nombre || '',
        empresa_ruc: user.expand?.company_id?.ruc || '',
        porcentaje: user.expand?.company_id?.porcentaje || 0,
        dia_inicio: user.expand?.company_id?.dia_inicio || 1,
        dia_cierre: user.expand?.company_id?.dia_cierre || 30,
        dia_bloqueo: user.expand?.company_id?.dia_bloqueo || 0,
        dia_reinicio: user.expand?.company_id?.dia_reinicio || 1,
        frecuencia: user.expand?.company_id?.frecuencia || 3,
      }
    } catch (error) {
      console.error('Error fetching user company info:', error)
      throw error
    }
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

  async getCompaniesWithStats(filters = {}, page = 1, perPage = 1000) {
    const params = {
      page,
      perPage,
      sort: '-created',
      expand: 'owner_id',
      ...(buildFilter(filters) && { filter: buildFilter(filters) }),
    }

    const result = await pb.collection('companies').getList(page, perPage, params)

    // Add user counts to each company
    const companiesWithStats = await Promise.all(
      result.items.map(async (company) => {
        try {
          // Get total users count
          const totalUsers = await pb.collection('users').getList(1, 1, {
            filter: `company_id="${company.id}"`,
            fields: 'id',
          })

          // Get active users count
          const activeUsers = await pb.collection('users').getList(1, 1, {
            filter: `company_id="${company.id}" && gearbox=true`,
            fields: 'id',
          })

          return {
            ...company,
            users_count: totalUsers.totalItems,
            active_users_count: activeUsers.totalItems,
            blocked_users_count: totalUsers.totalItems - activeUsers.totalItems,
          }
        } catch (err) {
          console.error(`Error getting user counts for company ${company.id}:`, err)
          return {
            ...company,
            users_count: 0,
            active_users_count: 0,
            blocked_users_count: 0,
          }
        }
      }),
    )

    return {
      ...result,
      items: companiesWithStats,
    }
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

  async createCompanyWithOwner(companyData, ownerData) {
    try {
      // Get default config
      const config = await this.getSystemConfig()
      const companyConfig = {
        flexirol: config.porcentaje_servicio,
        flexirol2: config.valor_fijo_mensual,
        flexirol3: config.plan_default,
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
        ...companyConfig,
        ...companyData,
        owner_id: createdOwner.id,
        gearbox: true,
        fecha_excel: null,
      }

      const createdCompany = await pb.collection('companies').create(companyCreateData)

      return {
        success: true,
        company: createdCompany,
        owner: createdOwner,
      }
    } catch (err) {
      return {
        success: false,
        error: err.message,
      }
    }
  },

  async deleteCompanyWithUsers(companyId) {
    try {
      // Get all users of this company
      const companyUsersResult = await pb.collection('users').getList(1, 1000, {
        filter: `company_id="${companyId}"`,
      })

      // Delete all company users
      for (const user of companyUsersResult.items) {
        await pb.collection('users').delete(user.id)
      }

      // Delete the company itself
      await pb.collection('companies').delete(companyId)

      return {
        success: true,
        deletedUsers: companyUsersResult.items.length,
      }
    } catch (err) {
      return {
        success: false,
        error: err.message,
      }
    }
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
    const cacheKey = 'system_config'

    // Verificar cache primero si no es forzado
    if (!forceRefresh && this.configCache && Date.now() - this.configCache.timestamp < 300000) {
      // 5 min cache
      console.log('📦 Using cached system config')
      return this.configCache.data
    }

    try {
      // Obtener o crear configuración
      let config = await pb.collection('system_config').getFirstListItem('name="default_config"', {
        fields:
          'porcentaje_servicio,valor_fijo_mensual,plan_default,dia_inicio,dia_cierre,porcentaje_maximo,dias_bloqueo,frecuencia_maxima,dias_reinicio,activo',
      })

      // Cachear respuesta
      this.configCache = {
        data: config,
        timestamp: Date.now(),
      }

      return config
    } catch (err) {
      if (err.status === 404) {
        // Crear configuración por defecto si no existe
        const defaultConfig = {
          name: 'default_config',
          porcentaje_servicio: 10,
          valor_fijo_mensual: 50,
          plan_default: '1',
          dia_inicio: 1,
          dia_cierre: 28,
          porcentaje_maximo: 50,
          dias_bloqueo: 2,
          frecuencia_maxima: 3,
          dias_reinicio: 1,
          activo: true,
        }
        const newConfig = await pb.collection('system_config').create(defaultConfig)

        this.configCache = {
          data: newConfig,
          timestamp: Date.now(),
        }

        return newConfig
      }
      throw err
    }
  },

  async updateSystemConfig(configData) {
    const config = await this.getSystemConfig()
    return await pb.collection('system_config').update(config.id, configData)
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
