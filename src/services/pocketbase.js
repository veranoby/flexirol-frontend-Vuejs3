import PocketBase from 'pocketbase'
import { saveAs } from 'file-saver'
import * as XLSX from 'xlsx'

const pb = new PocketBase(import.meta.env.VITE_POCKETBASE_URL || 'http://127.0.0.1:8090')

// Auto-refresh auth token
pb.authStore.onChange(() => {
  console.log('Auth state changed:', pb.authStore.isValid)
})

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
  async getUsers(filters = {}) {
    const filterString = Object.entries(filters)
      .map(([key, value]) => `${key}="${value}"`)
      .join(' && ')

    return await pb.collection('users').getList(1, 1000, {
      filter: filterString,
      expand: 'empresa_id',
      sort: '-created',
    })
  },

  async getUserById(id) {
    return await pb.collection('users').getOne(id, { expand: 'empresa_id' })
  },

  async getUserCompanyInfo(userId) {
    try {
      const user = await pb.collection('users').getOne(userId, {
        expand: 'empresa_id',
        fields: '*,empresa_id.*',
      })

      // Map to legacy format for compatibility
      return {
        ...user,
        empresa_nombre: user.expand?.empresa_id?.nombre || '',
        empresa_ruc: user.expand?.empresa_id?.ruc || '',
        porcentaje: user.expand?.empresa_id?.porcentaje || 0,
        dia_inicio: user.expand?.empresa_id?.dia_inicio || 1,
        dia_cierre: user.expand?.empresa_id?.dia_cierre || 30,
        dia_bloqueo: user.expand?.empresa_id?.dia_bloqueo || 0,
        dia_reinicio: user.expand?.empresa_id?.dia_reinicio || 1,
        frecuencia: user.expand?.empresa_id?.frecuencia || 'quincenal',
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
  async getCompanies(filters = {}) {
    const filterString = Object.entries(filters)
      .map(([key, value]) => `${key}="${value}"`)
      .join(' && ')

    return await pb.collection('companies').getList(1, 1000, {
      filter: filterString,
      sort: '-created',
    })
  },

  async getCompanyUsers(companyId) {
    return await this.getUsers({ empresa_id: companyId })
  },

  async createCompany(companyData) {
    return await pb.collection('companies').create(companyData)
  },

  async updateCompany(id, companyData) {
    return await pb.collection('companies').update(id, companyData)
  },

  // Advance Requests
  async getAdvanceRequests(filters = {}) {
    const filterString = Object.entries(filters)
      .map(([key, value]) => `${key}="${value}"`)
      .join(' && ')

    return await pb.collection('advance_requests').getList(1, 1000, {
      filter: filterString,
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
    const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
    const blob = new Blob([excelBuffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    })
    saveAs(blob, `pagos_${new Date().toISOString().split('T')[0]}.xlsx`)
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
