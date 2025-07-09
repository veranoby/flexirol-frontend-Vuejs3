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
        frecuencia: user.expand?.company_id?.frecuencia || 'quincenal',
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
      fields: 'id,nombre,ruc,owner_id,created',
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

  async getDefaultCompanyConfig() {
    try {
      const systemConfig = await pb
        .collection('system_config')
        .getFirstListItem('name="default_config"')
      return {
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
    } catch (err) {
      console.warn('Could not fetch default config:', err)
      return {
        flexirol: 0,
        flexirol2: 0,
        flexirol3: '1',
        dia_inicio: 1,
        dia_cierre: 28,
        porcentaje: 50,
        dia_bloqueo: 2,
        frecuencia: 3,
        dia_reinicio: 1,
      }
    }
  },

  async createCompanyWithOwner(companyData, ownerData) {
    try {
      // Get default config
      const defaultConfig = await this.getDefaultCompanyConfig()

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
  async getSystemConfig() {
    try {
      // Buscar configuración por nombre único
      const result = await pb.collection('system_config').getFirstListItem('name="default_config"')
      return result
    } catch (error) {
      // Si no existe, crear configuración por defecto
      console.log('Creating default system config due to:', error.message)
      return await pb.collection('system_config').create({
        name: 'default_config',
        porcentaje_servicio: 10,
        valor_fijo_mensual: 50,
        dia_inicio: 2,
        dia_cierre: 28,
        porcentaje_maximo: 70,
        frecuencia_maxima: 3,
        dias_bloqueo: 2,
        dias_reinicio: 3,
        activo: true,
      })
    }
  },

  async updateSystemConfig(configData) {
    const config = await this.getSystemConfig()
    return await pb.collection('system_config').update(config.id, configData)
  },

  // Global user stats optimized
  async getGlobalUserStats() {
    const result = await pb.collection('users').getList(1, 1, { fields: 'id' })
    return { totalItems: result.totalItems }
  },

  // Company-owner gearbox sync
  async updateCompanyWithOwnerSync(companyId, companyData) {
    const updatedCompany = await pb.collection('companies').update(companyId, {
      company_name: companyData.company_name,
      ruc: companyData.ruc,
      gearbox: companyData.gearbox,
    })

    // Sync owner gearbox
    if (updatedCompany.owner_id) {
      await pb.collection('users').update(updatedCompany.owner_id, {
        gearbox: companyData.gearbox,
      })
    }

    return { success: true, company: updatedCompany }
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
