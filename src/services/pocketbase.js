import PocketBase from 'pocketbase'

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

    return await pb.collection('users').getList(1, 50, {
      filter: filterString,
      expand: 'empresa_id',
    })
  },

  async createUser(userData) {
    return await pb.collection('users').create(userData)
  },

  async updateUser(id, userData) {
    return await pb.collection('users').update(id, userData)
  },

  async deleteUser(id) {
    return await pb.collection('users').delete(id)
  },

  // Companies
  async getCompanies() {
    return await pb.collection('companies').getList(1, 50, {
      expand: 'owner_id',
    })
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

    return await pb.collection('advance_requests').getList(1, 50, {
      filter: filterString,
      expand: 'user_id,company_id,banco_destino',
      sort: '-created',
    })
  },

  async createAdvanceRequest(requestData) {
    return await pb.collection('advance_requests').create(requestData)
  },

  async updateAdvanceRequest(id, requestData) {
    return await pb.collection('advance_requests').update(id, requestData)
  },

  // Bank Accounts
  async getBankAccounts(userId) {
    return await pb.collection('bank_accounts').getList(1, 50, {
      filter: `user_id="${userId}"`,
      expand: 'user_id',
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
}

// Real-time subscriptions
export const subscriptions = {
  async subscribeToAdvanceRequests(callback) {
    return await pb.collection('advance_requests').subscribe('*', callback)
  },

  async subscribeToUsers(callback) {
    return await pb.collection('users').subscribe('*', callback)
  },

  unsubscribe(subscription) {
    pb.collection('advance_requests').unsubscribe(subscription)
    pb.collection('users').unsubscribe(subscription)
  },
}

export { pb }
export default pb
