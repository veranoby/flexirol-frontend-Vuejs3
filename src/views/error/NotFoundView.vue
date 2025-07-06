<!-- NotFoundView.vue -->
<template>
  <div class="error-page">
    <div class="container">
      <div class="row justify-content-center">
        <div class="col-md-6 text-center">
          <div class="error-icon mb-4">
            <i class="fas fa-search fa-5x text-muted"></i>
          </div>
          <h1 class="display-4 fw-bold text-dark mb-3">404</h1>
          <h2 class="h4 mb-4">Página No Encontrada</h2>
          <p class="text-muted mb-4">
            La página que buscas no existe o ha sido movida. Verifica la URL o navega usando el menú
            principal.
          </p>

          <div class="d-flex justify-content-center gap-3">
            <button @click="goBack" class="btn btn-outline-secondary">
              <i class="fas fa-arrow-left me-2"></i>Volver
            </button>
            <router-link to="/dashboard" class="btn btn-primary">
              <i class="fas fa-home me-2"></i>Ir al Dashboard
            </router-link>
          </div>

          <div class="mt-5">
            <h6 class="text-muted mb-3">Páginas disponibles:</h6>
            <div class="d-flex flex-wrap justify-content-center gap-2">
              <router-link
                v-for="route in availableRoutes"
                :key="route.path"
                :to="route.path"
                class="btn btn-sm btn-outline-primary"
              >
                <i :class="route.icon + ' me-1'"></i>{{ route.label }}
              </router-link>
            </div>
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

const availableRoutes = computed(() => {
  const routes = [
    {
      path: '/dashboard',
      icon: 'fas fa-tachometer-alt',
      label: 'Dashboard',
      roles: ['superadmin', 'empresa', 'operador', 'usuario'],
    },
  ]

  // Add role-specific routes
  if (authStore.isSuperadmin || authStore.isEmpresa) {
    routes.push({
      path: '/usuarios',
      icon: 'fas fa-users',
      label: 'Usuarios',
    })
  }

  if (authStore.isSuperadmin) {
    routes.push(
      {
        path: '/superadmin/empresas',
        icon: 'fas fa-building',
        label: 'Empresas',
      },
      {
        path: '/superadmin/config',
        icon: 'fas fa-cogs',
        label: 'Configuración',
      },
    )
  }

  if (authStore.isEmpresa || authStore.isOperador) {
    routes.push(
      {
        path: '/admin/solicitudes',
        icon: 'fas fa-file-invoice-dollar',
        label: 'Solicitudes',
      },
      {
        path: '/admin/reportes',
        icon: 'fas fa-chart-line',
        label: 'Reportes',
      },
    )
  }

  if (authStore.isUsuario) {
    routes.push(
      {
        path: '/usuario/solicitudes',
        icon: 'fas fa-hand-holding-usd',
        label: 'Mis Solicitudes',
      },
      {
        path: '/usuario/bancos',
        icon: 'fas fa-university',
        label: 'Mis Bancos',
      },
    )
  }

  return routes
})

const goBack = () => {
  if (window.history.length > 1) {
    router.go(-1)
  } else {
    router.push('/dashboard')
  }
}
</script>

<style scoped>
.error-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
}

.error-icon {
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.05);
  }
  100% {
    transform: scale(1);
  }
}

.display-4 {
  font-size: 4rem;
  background: linear-gradient(45deg, #007bff, #6610f2);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.btn {
  transition: all 0.3s ease;
}

.btn:hover {
  transform: translateY(-2px);
}
</style>
