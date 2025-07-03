import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { api, pb } from '@/services/pocketbase'

export const useAuthStore = defineStore('auth', () => {
  // State
  const user = ref(null)
  const isLoading = ref(false)
  const error = ref(null)

  // Getters
  const isAuthenticated = computed(() => !!user.value && pb.authStore.isValid)
  const userRole = computed(() => user.value?.role || null)
  const isSuperadmin = computed(() => userRole.value === 'superadmin')
  const isEmpresa = computed(() => userRole.value === 'empresa')
  const isOperador = computed(() => userRole.value === 'operador')
  const isUsuario = computed(() => userRole.value === 'usuario')

  // Actions
  async function login(email, password) {
    isLoading.value = true
    error.value = null

    try {
      const result = await api.login(email, password)

      if (result.success) {
        user.value = result.user
        return { success: true }
      } else {
        error.value = result.error
        return { success: false, error: result.error }
      }
    } catch (err) {
      error.value = err.message
      return { success: false, error: err.message }
    } finally {
      isLoading.value = false
    }
  }

  async function logout() {
    isLoading.value = true

    try {
      await api.logout()
      user.value = null
      error.value = null
    } catch (err) {
      error.value = err.message
    } finally {
      isLoading.value = false
    }
  }

  function initAuth() {
    // Check if user is already authenticated
    if (pb.authStore.isValid && pb.authStore.model) {
      user.value = pb.authStore.model
    }
  }

  function clearError() {
    error.value = null
  }

  // Check user permissions
  function canAccessCompany(companyId) {
    if (isSuperadmin.value) return true
    if (isEmpresa.value && user.value.id === companyId) return true
    if (isOperador.value && user.value.assigned_companies?.includes(companyId)) return true
    return false
  }

  function canManageUsers() {
    return isSuperadmin.value || isEmpresa.value || isOperador.value
  }

  function canApproveRequests() {
    return isSuperadmin.value || isEmpresa.value || isOperador.value
  }

  function getUserCompanies() {
    if (isSuperadmin.value) return 'all'
    if (isEmpresa.value) return [user.value.id]
    if (isOperador.value) return user.value.assigned_companies || []
    return []
  }

  return {
    // State
    user,
    isLoading,
    error,

    // Getters
    isAuthenticated,
    userRole,
    isSuperadmin,
    isEmpresa,
    isOperador,
    isUsuario,

    // Actions
    login,
    logout,
    initAuth,
    clearError,

    // Permissions
    canAccessCompany,
    canManageUsers,
    canApproveRequests,
    getUserCompanies,
  }
})
