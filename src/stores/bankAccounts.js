import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { api } from '@/services/pocketbase'

export const useBankAccountsStore = defineStore('bankAccounts', () => {
  const authStore = useAuthStore()

  // State
  const bankAccounts = ref([])
  const loading = ref(false)
  const error = ref(null)

  // Getters
  const activeBankAccounts = computed(() => bankAccounts.value.filter((account) => account.activa))

  const inactiveBankAccounts = computed(() =>
    bankAccounts.value.filter((account) => !account.activa),
  )

  const verifiedBankAccounts = computed(() =>
    bankAccounts.value.filter((account) => !isUnderVerification(account.created)),
  )

  // Validation Functions (migrated from legacy code)
  const validateEmail = (email) => {
    const emailRegex =
      /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
    return emailRegex.test(email)
  }

  const isUnderVerification = (createdDate) => {
    // Migrated from bloqueo() function - 24 hour verification period
    const accountDate = new Date(createdDate)
    const currentDate = new Date()
    const timeDifference = currentDate - accountDate
    const oneDayInMs = 86400000 // 24 hours in milliseconds

    return timeDifference <= oneDayInMs
  }

  const validatePersonalAccount = (accountData) => {
    // Migrated from btn_switch() - account must be personal to user
    const user = authStore.user
    if (!user) return { valid: false, message: 'Usuario no autenticado' }

    const userLastName = user.last_name?.toLowerCase() || ''
    const userCedula = user.cedula?.toLowerCase() || ''
    const accountOwner = accountData.propietario?.toLowerCase() || ''
    const accountCedula = accountData.cedula?.toLowerCase() || ''

    // Check email validation
    if (!validateEmail(accountData.email)) {
      return { valid: false, message: 'Se requiere email válido' }
    }

    // Check required fields
    if (
      !accountData.propietario ||
      !accountData.cedula ||
      !accountData.email ||
      !accountData.numero_cuenta
    ) {
      return { valid: false, message: 'Llene los campos obligatorios para poder grabar por favor' }
    }

    // Check personal account validation
    const isPersonalAccount =
      accountOwner.includes(userLastName) && accountCedula.includes(userCedula)
    if (!isPersonalAccount) {
      return { valid: false, message: 'La cuenta debe ser PERSONAL del usuario de la empresa' }
    }

    return { valid: true, message: 'Validación exitosa' }
  }

  // Actions
  async function fetchUserBankAccounts(userId) {
    loading.value = true
    error.value = null

    try {
      const result = await api.collection('bank_accounts').getList(1, 50, {
        filter: `user_id="${userId}"`,
        sort: '-created',
        expand: 'user_id',
      })

      bankAccounts.value = result.items.map((item) => ({
        id: item.id,
        user_id: item.user_id,
        banco_nombre: item.banco_nombre,
        tipo_cuenta: item.tipo_cuenta,
        numero_cuenta: item.numero_cuenta,
        propietario: item.propietario,
        cedula: item.cedula,
        email: item.email,
        activa: item.activa,
        created: item.created,
        updated: item.updated,
        // Computed properties for UI
        bank_display_name: `${item.banco_nombre}:${item.numero_cuenta}`,
        is_under_verification: isUnderVerification(item.created),
      }))

      console.log('Bank accounts fetched:', bankAccounts.value.length)
    } catch (err) {
      error.value = `Error al cargar cuentas bancarias: ${err.message}`
      console.error('Error fetching bank accounts:', err)
      bankAccounts.value = []
    } finally {
      loading.value = false
    }
  }

  async function createBankAccount(accountData) {
    // Validate before creating
    const validation = validatePersonalAccount(accountData)
    if (!validation.valid) {
      error.value = validation.message
      return { success: false, error: validation.message }
    }

    loading.value = true
    error.value = null

    try {
      // Prepare data for PocketBase (migrated from grabar_bancos)
      const pbData = {
        user_id: accountData.user_id,
        banco_nombre: accountData.banco_nombre,
        tipo_cuenta: accountData.tipo_cuenta,
        numero_cuenta: accountData.numero_cuenta,
        propietario: accountData.propietario,
        cedula: accountData.cedula,
        email: accountData.email,
        activa: true, // New accounts are active by default
      }

      const result = await api.collection('bank_accounts').create(pbData)

      // Add to local state
      const newAccount = {
        ...result,
        bank_display_name: `${result.banco_nombre}:${result.numero_cuenta}`,
        is_under_verification: true, // New accounts are under verification
      }

      bankAccounts.value.unshift(newAccount)

      console.log('Bank account created:', result.id)
      return { success: true, data: result }
    } catch (err) {
      error.value = `Error al crear cuenta bancaria: ${err.message}`
      console.error('Error creating bank account:', err)
      return { success: false, error: err.message }
    } finally {
      loading.value = false
    }
  }

  async function updateBankAccount(accountId, accountData) {
    // Validate before updating
    const validation = validatePersonalAccount(accountData)
    if (!validation.valid) {
      error.value = validation.message
      return { success: false, error: validation.message }
    }

    loading.value = true
    error.value = null

    try {
      // Prepare updated data
      const pbData = {
        banco_nombre: accountData.banco_nombre,
        tipo_cuenta: accountData.tipo_cuenta,
        numero_cuenta: accountData.numero_cuenta,
        propietario: accountData.propietario,
        cedula: accountData.cedula,
        email: accountData.email,
        activa: accountData.activa,
      }

      const result = await api.collection('bank_accounts').update(accountId, pbData)

      // Update local state
      const index = bankAccounts.value.findIndex((account) => account.id === accountId)
      if (index !== -1) {
        bankAccounts.value[index] = {
          ...result,
          bank_display_name: `${result.banco_nombre}:${result.numero_cuenta}`,
          is_under_verification: isUnderVerification(result.created),
        }
      }

      console.log('Bank account updated:', accountId)
      return { success: true, data: result }
    } catch (err) {
      error.value = `Error al actualizar cuenta bancaria: ${err.message}`
      console.error('Error updating bank account:', err)
      return { success: false, error: err.message }
    } finally {
      loading.value = false
    }
  }

  async function deleteBankAccount(accountId) {
    loading.value = true
    error.value = null

    try {
      await api.collection('bank_accounts').delete(accountId)

      // Remove from local state
      bankAccounts.value = bankAccounts.value.filter((account) => account.id !== accountId)

      console.log('Bank account deleted:', accountId)
      return { success: true }
    } catch (err) {
      error.value = `Error al eliminar cuenta bancaria: ${err.message}`
      console.error('Error deleting bank account:', err)
      return { success: false, error: err.message }
    } finally {
      loading.value = false
    }
  }

  async function toggleAccountStatus(accountId) {
    const account = bankAccounts.value.find((acc) => acc.id === accountId)
    if (!account) {
      error.value = 'Cuenta no encontrada'
      return { success: false, error: 'Cuenta no encontrada' }
    }

    return await updateBankAccount(accountId, {
      ...account,
      activa: !account.activa,
    })
  }

  // Helper function to get account by ID
  function getAccountById(accountId) {
    return bankAccounts.value.find((account) => account.id === accountId)
  }

  // Get available banks list (migrated from legacy select options)
  function getAvailableBanks() {
    return [
      'Pacífico',
      'Guayaquil',
      'Austro',
      'Produbanco',
      'Pichincha',
      'Internacional',
      'Bolivariano',
      'Solidario',
    ]
  }

  // Get account types
  function getAccountTypes() {
    return [
      { value: 'ahorros', label: 'Ahorros' },
      { value: 'corriente', label: 'Corriente' },
    ]
  }

  // Clear store state
  function clearBankAccounts() {
    bankAccounts.value = []
    error.value = null
  }

  return {
    // State
    bankAccounts,
    loading,
    error,

    // Getters
    activeBankAccounts,
    inactiveBankAccounts,
    verifiedBankAccounts,

    // Actions
    fetchUserBankAccounts,
    createBankAccount,
    updateBankAccount,
    deleteBankAccount,
    toggleAccountStatus,

    // Helper functions
    getAccountById,
    getAvailableBanks,
    getAccountTypes,
    validatePersonalAccount,
    isUnderVerification,
    clearBankAccounts,
  }
})
