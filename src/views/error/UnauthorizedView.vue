<!-- UnauthorizedView.vue -->
<template>
  <div class="error-page">
    <div class="container">
      <div class="row justify-content-center">
        <div class="col-md-6 text-center">
          <div class="error-icon mb-4">
            <i class="fas fa-ban fa-5x text-warning"></i>
          </div>
          <h1 class="display-4 fw-bold text-dark mb-3">403</h1>
          <h2 class="h4 mb-4">Acceso No Autorizado</h2>
          <p class="text-muted mb-4">
            No tienes permisos para acceder a esta página. Si crees que esto es un error, contacta
            con tu administrador.
          </p>

          <div class="d-flex justify-content-center gap-3">
            <button @click="goBack" class="btn btn-outline-secondary">
              <i class="fas fa-arrow-left me-2"></i>Volver
            </button>
            <router-link :to="dashboardPath" class="btn btn-primary">
              <i class="fas fa-home me-2"></i>Ir al Dashboard
            </router-link>
          </div>

          <div class="mt-5">
            <h6 class="text-muted">Tu rol actual:</h6>
            <span class="badge bg-info fs-6">{{ roleLabel }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()

const roleLabel = computed(() => {
  const roleLabels = {
    superadmin: 'Super Administrador',
    empresa: 'Administrador de Empresa',
    operador: 'Operador',
    usuario: 'Empleado',
  }
  return roleLabels[authStore.userRole] || 'Usuario'
})

const dashboardPath = computed(() => {
  switch (authStore.userRole) {
    case 'superadmin':
    case 'empresa':
      return '/usuarios'
    case 'operador':
      return '/admin/solicitudes'
    case 'usuario':
      return '/usuario/solicitudes'
    default:
      return '/dashboard'
  }
})

const goBack = () => {
  if (window.history.length > 1) {
    router.go(-1)
  } else {
    router.push(dashboardPath.value)
  }
}
</script>
