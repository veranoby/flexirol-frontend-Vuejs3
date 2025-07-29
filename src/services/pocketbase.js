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
  pb, // ✅ AGREGAR esta línea

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
  async getUsers(filters = {}, page = 1, perPage = 50) {
    console.log('🚨 POCKETBASE.JS GETUSERS CALLED!', { filters, page, perPage })
    console.log('🚨 STACK TRACE:', new Error().stack)

    const result = await pb.collection('users').getList(page, perPage, {
      filter: buildFilter(filters),
      sort: '-created',
    })

    console.log('🚨 POCKETBASE RAW RESULT:', result.items[0])
    return result
  },

  async createUser(userData) {
    return await pb.collection('users').create(userData)
  },

  async updateUser(userId, data) {
    return await pb.collection('users').update(userId, data)
  },

  async deleteUser(userId) {
    return await pb.collection('users').delete(userId)
  },

  // Excel Operations
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

  // Company operations (now using users with role='empresa')
  async getCompanies(filters = {}, page = 1, perPage = 50) {
    const companyFilters = { ...filters, role: 'empresa' }
    return await pb.collection('users').getList(page, perPage, {
      filter: buildFilter(companyFilters),
      sort: '-created',
      expand: 'company_id',
    })
  },

  // Advance Requests operations
  async getAdvanceRequests(filters = {}, page = 1, perPage = 50) {
    return await pb.collection('advance_requests').getList(page, perPage, {
      filter: buildFilter(filters),
      sort: '-created',
      expand: 'user_id,company_id,banco_destino',
    })
  },

  async getAdvanceRequestsByStatus(status, filters = {}) {
    const statusFilters = { ...filters, estado: status }
    return await pb.collection('advance_requests').getList(1, 500, {
      filter: buildFilter(statusFilters),
      sort: '-created',
      expand: 'user_id,company_id,banco_destino',
    })
  },

  // Bank Accounts operations
  async getBankAccounts(userId, page = 1, perPage = 50) {
    const filters = userId ? { user_id: userId } : {}
    return await pb.collection('bank_accounts').getList(page, perPage, {
      filter: buildFilter(filters),
      sort: '-created',
      expand: 'user_id',
    })
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

  unsubscribe(subscription) {
    return pb.collection(subscription.collection).unsubscribe(subscription.id)
  },
}

export { pb }
export default pb
