<template>
  <v-app>
    <!-- Navigation Bar -->
    <v-app-bar class="glass-app-bar" v-if="authStore.isAuthenticated" dark elevation="2" app>
      <!-- Brand FlexiRol -->
      <router-link to="/dashboard" class="text-decoration-none d-flex align-items-center">
        <v-icon color="warning" class="me-2">mdi-chart-line</v-icon>
        <v-toolbar-title class="text-h6 font-weight-bold text-white"> FlexiRol </v-toolbar-title>
      </router-link>

      <v-spacer></v-spacer>

      <!-- Desktop Navigation -->
      <div class="hidden-md-and-down">
        <!-- SUPERADMIN NAVIGATION -->
        <template v-if="authStore.isSuperadmin">
          <v-btn
            :to="'/superadmin/solicitudes'"
            text
            class="mx-1"
            prepend-icon="mdi-file-invoice-dollar"
          >
            Solicitudes
          </v-btn>
          <v-btn :to="'/superadmin/empresas'" text class="mx-1" prepend-icon="mdi-domain">
            Empresas
          </v-btn>
          <v-btn :to="'/superadmin/reportes'" text class="mx-1" prepend-icon="mdi-chart-bar">
            Reportes
          </v-btn>
          <v-btn :to="'/superadmin/config'" text class="mx-1" prepend-icon="mdi-cog">
            Configuración
          </v-btn>
          <v-btn :to="'/superadmin/excel-upload'" text class="mx-1" prepend-icon="mdi-file-excel">
            Carga Usuarios
          </v-btn>
        </template>

        <!-- EMPRESA/OPERADOR NAVIGATION -->
        <template v-if="authStore.isEmpresa || authStore.isOperador">
          <v-btn
            :to="'/admin/solicitudes'"
            text
            class="mx-1"
            prepend-icon="mdi-file-invoice-dollar"
          >
            Solicitudes
          </v-btn>
          <v-btn :to="'/admin/empleados'" text class="mx-1" prepend-icon="mdi-account-group">
            Empleados
          </v-btn>
          <v-btn :to="'/admin/reportes'" text class="mx-1" prepend-icon="mdi-chart-line">
            Reportes
          </v-btn>
        </template>

        <!-- USUARIO NAVIGATION -->
        <template v-if="authStore.isUsuario">
          <v-btn :to="'/usuario/solicitudes'" text class="mx-1" prepend-icon="mdi-hand-coin">
            Mis Solicitudes
          </v-btn>
          <v-btn :to="'/usuario/bancos'" text class="mx-1" prepend-icon="mdi-bank">
            Mis Bancos
          </v-btn>
        </template>
      </div>

      <!-- User Menu -->
      <v-menu>
        <template v-slot:activator="{ props }">
          <v-btn v-bind="props" icon class="mx-2">
            <v-avatar color="white" size="32">
              <span class="text-primary font-weight-bold">{{ userInitials }}</span>
            </v-avatar>
          </v-btn>
        </template>

        <v-list min-width="200">
          <v-list-item>
            <v-list-item-title class="font-weight-bold">
              <v-icon class="me-2 text-primary">mdi-account-circle</v-icon>
              {{ userName }}
            </v-list-item-title>
            <v-list-item-subtitle>{{ roleLabel }}</v-list-item-subtitle>
          </v-list-item>

          <v-divider></v-divider>

          <v-list-item @click="goToProfile" prepend-icon="mdi-account">
            <v-list-item-title>Mi Perfil</v-list-item-title>
          </v-list-item>

          <v-list-item @click="goToSettings" prepend-icon="mdi-cog">
            <v-list-item-title>Configuración</v-list-item-title>
          </v-list-item>

          <v-divider></v-divider>

          <v-list-item @click="logout" prepend-icon="mdi-logout" class="text-error">
            <v-list-item-title>Cerrar Sesión</v-list-item-title>
          </v-list-item>
        </v-list>
      </v-menu>

      <!-- Mobile Menu -->
      <v-app-bar-nav-icon class="hidden-lg-and-up" @click="drawer = !drawer"></v-app-bar-nav-icon>
    </v-app-bar>

    <!-- Mobile Navigation Drawer -->
    <v-navigation-drawer v-model="drawer" temporary app>
      <v-list>
        <!-- SUPERADMIN NAVIGATION -->
        <template v-if="authStore.isSuperadmin">
          <v-list-item :to="'/superadmin/solicitudes'" prepend-icon="mdi-file-invoice-dollar">
            <v-list-item-title>Solicitudes</v-list-item-title>
          </v-list-item>
          <v-list-item :to="'/superadmin/empresas'" prepend-icon="mdi-domain">
            <v-list-item-title>Empresas</v-list-item-title>
          </v-list-item>
          <v-list-item :to="'/superadmin/reportes'" prepend-icon="mdi-chart-bar">
            <v-list-item-title>Reportes</v-list-item-title>
          </v-list-item>
          <v-list-item :to="'/superadmin/config'" prepend-icon="mdi-cog">
            <v-list-item-title>Configuración</v-list-item-title>
          </v-list-item>
          <v-list-item :to="'/superadmin/excel-upload'" prepend-icon="mdi-file-excel">
            <v-list-item-title>Carga Usuarios</v-list-item-title>
          </v-list-item>
        </template>

        <!-- EMPRESA/OPERADOR NAVIGATION -->
        <template v-if="authStore.isEmpresa || authStore.isOperador">
          <v-list-item :to="'/admin/solicitudes'" prepend-icon="mdi-file-invoice-dollar">
            <v-list-item-title>Solicitudes</v-list-item-title>
          </v-list-item>
          <v-list-item :to="'/admin/empleados'" prepend-icon="mdi-account-group">
            <v-list-item-title>Empleados</v-list-item-title>
          </v-list-item>
          <v-list-item :to="'/admin/reportes'" prepend-icon="mdi-chart-line">
            <v-list-item-title>Reportes</v-list-item-title>
          </v-list-item>
        </template>

        <!-- USUARIO NAVIGATION -->
        <template v-if="authStore.isUsuario">
          <v-list-item :to="'/usuario/solicitudes'" prepend-icon="mdi-hand-coin">
            <v-list-item-title>Mis Solicitudes</v-list-item-title>
          </v-list-item>
          <v-list-item :to="'/usuario/bancos'" prepend-icon="mdi-bank">
            <v-list-item-title>Mis Bancos</v-list-item-title>
          </v-list-item>
        </template>
      </v-list>
    </v-navigation-drawer>

    <!-- Breadcrumb -->
    <v-container
      v-if="authStore.isAuthenticated && showBreadcrumb"
      fluid
      class="py-0 bg-grey-lighten-5 glass-morphism"
    >
      <v-breadcrumbs :items="breadcrumbItems" divider=">">
        <template v-slot:item="{ item }">
          <v-breadcrumbs-item :to="item.to" :disabled="item.disabled" class="text-body-2">
            <v-icon v-if="item.icon" :icon="item.icon" size="small" class="me-1"></v-icon>
            {{ item.title }}
          </v-breadcrumbs-item>
        </template>
      </v-breadcrumbs>
    </v-container>

    <!-- Main Content -->
    <v-main>
      <!-- Loading Overlay -->
      <v-overlay
        v-if="authStore.isLoading"
        :model-value="authStore.isLoading"
        class="align-center justify-center"
      >
        <v-progress-circular color="primary" indeterminate size="64"></v-progress-circular>
      </v-overlay>

      <!-- Router View -->
      <router-view v-slot="{ Component }">
        <transition name="fade" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
    </v-main>

    <!-- Snackbar para notificaciones -->
    <v-snackbar
      v-model="snackbar.show"
      :color="snackbar.color"
      :timeout="snackbar.timeout"
      location="top"
    >
      {{ snackbar.message }}
      <template v-slot:actions>
        <v-btn variant="text" @click="snackbar.show = false"> Cerrar </v-btn>
      </template>
    </v-snackbar>

    <!-- Footer -->
    <v-footer
      v-if="authStore.isAuthenticated"
      app
      color="grey-lighten-5"
      class="text-center border-t"
    >
      <div class="w-100">
        <span class="text-body-2 text-medium-emphasis">
          © {{ currentYear }} FlexiRol
          <span class="d-none d-md-inline"> - Sistema de Gestión de Adelantos Salariales</span>
        </span>
      </div>
    </v-footer>
  </v-app>
</template>

<script setup>
import { computed, onMounted, watch, ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { getBreadcrumb } from '@/router'

// Router and stores
const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

// Add drawer state
const drawer = ref(false)

// Snackbar state
const snackbar = ref({
  show: false,
  message: '',
  color: 'info',
  timeout: 3000,
})

// Listen for global snackbar events
onMounted(() => {
  // Listen for toast events from stores
  window.addEventListener('show-toast', (event) => {
    const { message, color, timeout } = event.detail
    snackbar.value = {
      show: true,
      message,
      color,
      timeout,
    }
  })
})

// Computed properties

const userName = computed(() => {
  const user = authStore.user
  if (!user) return 'Usuario'
  return `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.email
})

const userInitials = computed(() => {
  const user = authStore.user
  if (!user) return 'U'
  const firstName = user.first_name || ''
  const lastName = user.last_name || ''
  return (
    (firstName.charAt(0) + lastName.charAt(0)).toUpperCase() || user.email.charAt(0).toUpperCase()
  )
})

const roleLabel = computed(() => {
  const roleLabels = {
    superadmin: 'Super Administrador',
    empresa: 'Administrador',
    operador: 'Operador',
    usuario: 'Empleado',
  }
  return roleLabels[authStore.userRole] || 'Usuario'
})

const currentYear = computed(() => new Date().getFullYear())

const showBreadcrumb = computed(() => {
  const hiddenRoutes = ['login', 'dashboard']
  return !hiddenRoutes.includes(route.name)
})

const breadcrumbItems = computed(() => {
  if (!showBreadcrumb.value) return []
  return getBreadcrumb(route, authStore.userRole)
})

// Methods
const logout = async () => {
  try {
    await authStore.logout()
    router.push('/login')
  } catch (error) {
    console.error('Error during logout:', error)
  }
}

const goToProfile = () => {
  // TODO: Implement profile page
  console.log('Navigate to profile')
}

const goToSettings = () => {
  // TODO: Implement settings page
  console.log('Navigate to settings')
}

// Lifecycle
onMounted(() => {
  // Inicializar auth
  authStore.initAuth()
})

// Watch for authentication changes
watch(
  () => authStore.isAuthenticated,
  (isAuthenticated) => {
    if (!isAuthenticated && route.meta.requiresAuth) {
      router.push('/login')
    }
  },
)

// Watch for route changes to close mobile menu
watch(route, () => {
  // Close navbar collapse on mobile after navigation
  const navbar = document.querySelector('.navbar-collapse')
  if (navbar && navbar.classList.contains('show')) {
    const toggleBtn = document.querySelector('.navbar-toggler')
    if (toggleBtn) toggleBtn.click()
  }
})
</script>

<!-- CSS personalizado optimizado usando flexirol.css -->
<style scoped>
/* Usa las variables ya definidas en flexirol.css */
.navbar {
  transition: var(--flexirol-transition);
}

.nav-link {
  transition: var(--flexirol-transition);
  border-radius: var(--flexirol-border-radius);
}

.nav-link:hover {
  background-color: rgba(255, 255, 255, 0.1) !important;
  transform: translateY(-1px);
}

.nav-link.router-link-active {
  background-color: rgba(255, 255, 255, 0.2) !important;
  color: white !important;
  box-shadow: var(--flexirol-shadow-sm);
}

.breadcrumb-container {
  border-bottom: 1px solid var(--flexirol-gray-200);
}

.dropdown-menu {
  border-radius: var(--flexirol-border-radius);
  box-shadow: var(--flexirol-shadow-lg);
}

.dropdown-item:hover {
  background-color: var(--flexirol-bg-light);
}

.avatar-circle {
  font-family: 'Ubuntu', sans-serif;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
