<!-- UnauthorizedView.vue -->
<template>
  <div class="error-page">
    <v-container>
      <v-row justify="center">
        <v-col md="6" class="text-center">
          <div class="error-icon mb-4">
            <v-icon size="80" color="warning">mdi-cancel</v-icon>
          </div>
          <h1 class="display-4 font-weight-bold text-dark mb-3">403</h1>
          <h2 class="h4 mb-4">Acceso No Autorizado</h2>
          <p class="text-muted mb-4">
            No tienes permisos para acceder a esta página. Si crees que esto es un error, contacta
            con tu administrador.
          </p>

          <div class="d-flex justify-center gap-3 mb-4">
            <v-btn @click="goBack" variant="outlined" color="secondary">
              <v-icon left>mdi-arrow-left</v-icon>
              Volver
            </v-btn>
            <v-btn :to="dashboardPath" color="primary">
              <v-icon left>mdi-home</v-icon>
              Ir al Dashboard
            </v-btn>
          </div>

          <div class="mt-5">
            <h6 class="text-muted mb-3">Tu rol actual:</h6>
            <v-chip color="info" size="large">{{ roleLabel }}</v-chip>
          </div>
        </v-col>
      </v-row>
    </v-container>
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
