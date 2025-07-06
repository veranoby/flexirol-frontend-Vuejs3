<template>
  <div id="app">
    <!-- Navigation Bar -->
    <nav v-if="authStore.isAuthenticated" class="navbar navbar-expand-lg navbar-dark bg-primary">
      <div class="container">
        <!-- Brand -->
        <router-link to="/dashboard" class="navbar-brand fw-bold">
          <i class="fas fa-chart-line me-2"></i>FlexiRol
        </router-link>

        <!-- Mobile Toggle -->
        <button
          class="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navbarNav"
          aria-controls="navbarNav"
          aria-expanded="false"
          aria-label="Toggle navigation"
        >
          <span class="navbar-toggler-icon"></span>
        </button>

        <!-- Navigation Links -->
        <div class="collapse navbar-collapse" id="navbarNav">
          <ul class="navbar-nav me-auto">
            <!-- Dashboard (All roles) -->
            <li class="nav-item">
              <router-link to="/dashboard" class="nav-link">
                <i class="fas fa-tachometer-alt me-1"></i>Dashboard
              </router-link>
            </li>

            <!-- CONSOLIDADO: Usuarios (Superadmin + Empresa) -->
            <li v-if="canManageUsers" class="nav-item">
              <router-link to="/usuarios" class="nav-link">
                <i class="fas fa-users me-1"></i>
                {{ authStore.isSuperadmin ? 'Usuarios' : 'Empleados' }}
              </router-link>
            </li>

            <!-- Superadmin Menu -->
            <template v-if="authStore.isSuperadmin">
              <li class="nav-item dropdown">
                <a
                  class="nav-link dropdown-toggle"
                  href="#"
                  role="button"
                  data-bs-toggle="dropdown"
                  aria-expanded="false"
                >
                  <i class="fas fa-crown me-1"></i>Admin
                </a>
                <ul class="dropdown-menu">
                  <li>
                    <router-link to="/superadmin/empresas" class="dropdown-item">
                      <i class="fas fa-building me-2"></i>Empresas
                    </router-link>
                  </li>
                  <li>
                    <router-link to="/superadmin/config" class="dropdown-item">
                      <i class="fas fa-cogs me-2"></i>Configuración
                    </router-link>
                  </li>
                  <li>
                    <router-link to="/superadmin/excel-upload" class="dropdown-item">
                      <i class="fas fa-file-excel me-2"></i>Carga Excel
                    </router-link>
                  </li>
                  <li><hr class="dropdown-divider" /></li>
                  <li>
                    <router-link to="/superadmin/solicitudes" class="dropdown-item">
                      <i class="fas fa-file-invoice-dollar me-2"></i>Solicitudes
                    </router-link>
                  </li>
                  <li>
                    <router-link to="/superadmin/reportes" class="dropdown-item">
                      <i class="fas fa-chart-bar me-2"></i>Reportes
                    </router-link>
                  </li>
                </ul>
              </li>
            </template>

            <!-- Empresa/Operador Menu -->
            <template v-if="authStore.isEmpresa || authStore.isOperador">
              <li class="nav-item">
                <router-link to="/admin/solicitudes" class="nav-link">
                  <i class="fas fa-file-invoice-dollar me-1"></i>Solicitudes
                </router-link>
              </li>
              <li class="nav-item">
                <router-link to="/admin/reportes" class="nav-link">
                  <i class="fas fa-chart-line me-1"></i>Reportes
                </router-link>
              </li>
            </template>

            <!-- Usuario Menu -->
            <template v-if="authStore.isUsuario">
              <li class="nav-item">
                <router-link to="/usuario/solicitudes" class="nav-link">
                  <i class="fas fa-hand-holding-usd me-1"></i>Solicitudes
                </router-link>
              </li>
              <li class="nav-item">
                <router-link to="/usuario/bancos" class="nav-link">
                  <i class="fas fa-university me-1"></i>Bancos
                </router-link>
              </li>
            </template>
          </ul>

          <!-- User Menu -->
          <div class="navbar-nav">
            <div class="nav-item dropdown">
              <a
                class="nav-link dropdown-toggle d-flex align-items-center"
                href="#"
                role="button"
                data-bs-toggle="dropdown"
                aria-expanded="false"
              >
                <!-- User Avatar -->
                <div class="avatar-sm me-2">
                  <div class="avatar-initial bg-light text-primary rounded-circle">
                    {{ userInitials }}
                  </div>
                </div>
                <!-- User Info -->
                <div class="d-flex flex-column align-items-start">
                  <span class="fw-semibold">{{ userName }}</span>
                  <small class="text-light opacity-75">{{ roleLabel }}</small>
                </div>
              </a>
              <ul class="dropdown-menu dropdown-menu-end">
                <li>
                  <div class="dropdown-header">
                    <div class="fw-semibold">{{ userName }}</div>
                    <small class="text-muted">{{ authStore.user?.email }}</small>
                  </div>
                </li>
                <li><hr class="dropdown-divider" /></li>
                <li>
                  <a class="dropdown-item" href="#" @click.prevent="goToProfile">
                    <i class="fas fa-user me-2"></i>Mi Perfil
                  </a>
                </li>
                <li>
                  <a class="dropdown-item" href="#" @click.prevent="goToSettings">
                    <i class="fas fa-cog me-2"></i>Configuración
                  </a>
                </li>
                <li><hr class="dropdown-divider" /></li>
                <li>
                  <a class="dropdown-item text-danger" href="#" @click.prevent="logout">
                    <i class="fas fa-sign-out-alt me-2"></i>Cerrar Sesión
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </nav>

    <!-- Breadcrumb (only for authenticated users) -->
    <nav v-if="authStore.isAuthenticated && showBreadcrumb" class="breadcrumb-nav bg-light py-2">
      <div class="container">
        <nav aria-label="breadcrumb">
          <ol class="breadcrumb mb-0">
            <li
              v-for="(item, index) in breadcrumbItems"
              :key="index"
              class="breadcrumb-item"
              :class="{ active: index === breadcrumbItems.length - 1 }"
            >
              <router-link v-if="item.to && index < breadcrumbItems.length - 1" :to="item.to">
                {{ item.text }}
              </router-link>
              <span v-else>{{ item.text }}</span>
            </li>
          </ol>
        </nav>
      </div>
    </nav>

    <!-- Main Content -->
    <main class="main-content">
      <!-- Loading Overlay -->
      <div v-if="authStore.isLoading" class="loading-overlay">
        <div class="spinner-border text-primary" role="status">
          <span class="visually-hidden">Cargando...</span>
        </div>
      </div>

      <!-- Router View -->
      <router-view v-slot="{ Component }">
        <transition name="fade" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
    </main>

    <!-- Global Toast Container -->
    <div class="toast-container position-fixed bottom-0 end-0 p-3" style="z-index: 1100">
      <!-- Toasts will be dynamically added here -->
    </div>

    <!-- Footer (only for authenticated users) -->
    <footer v-if="authStore.isAuthenticated" class="footer bg-light text-center py-3 mt-5">
      <div class="container">
        <span class="text-muted">
          © {{ currentYear }} FlexiRol.
          <span class="d-none d-md-inline">Sistema de Gestión de Adelantos Salariales.</span>
        </span>
      </div>
    </footer>
  </div>
</template>

<script setup>
import { computed, onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { getBreadcrumb } from '@/router'

// Router and stores
const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

// Computed properties
const canManageUsers = computed(() => authStore.isSuperadmin || authStore.isEmpresa)

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
  // Initialize auth state
  authStore.initAuth()

  // Initialize Bootstrap components after mount
  import('bootstrap/dist/js/bootstrap.bundle.min.js')
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

<style scoped>
/* App Layout */
#app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.main-content {
  flex: 1;
  padding: 0;
  position: relative;
}

/* Navigation */
.navbar-brand {
  font-size: 1.5rem;
}

.nav-link {
  transition: all 0.3s ease;
  border-radius: 0.375rem;
  margin: 0 0.125rem;
}

.nav-link:hover {
  background-color: rgba(255, 255, 255, 0.1);
}

.nav-link.router-link-active {
  background-color: rgba(255, 255, 255, 0.2);
  font-weight: 600;
}

/* User Avatar */
.avatar-sm {
  width: 32px;
  height: 32px;
}

.avatar-initial {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 0.75rem;
}

/* Dropdown Menu */
.dropdown-menu {
  border: none;
  box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.15);
  border-radius: 0.5rem;
}

.dropdown-item {
  transition: all 0.2s ease;
}

.dropdown-item:hover {
  background-color: #f8f9fa;
  transform: translateX(2px);
}

/* Breadcrumb */
.breadcrumb-nav {
  border-bottom: 1px solid #dee2e6;
}

.breadcrumb {
  font-size: 0.875rem;
}

.breadcrumb-item + .breadcrumb-item::before {
  content: '›';
  font-weight: 600;
}

.breadcrumb-item.active {
  font-weight: 600;
}

/* Loading Overlay */
.loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(255, 255, 255, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}

/* Page Transitions */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* Footer */
.footer {
  border-top: 1px solid #dee2e6;
  margin-top: auto;
}

/* Responsive Design */
@media (max-width: 768px) {
  .navbar-brand {
    font-size: 1.25rem;
  }

  .nav-link {
    margin: 0.125rem 0;
    padding: 0.5rem 1rem;
  }

  .dropdown-menu {
    margin-top: 0.5rem;
  }

  .main-content {
    padding: 0;
  }
}

/* Bootstrap Override */
.navbar-toggler {
  border: none;
}

.navbar-toggler:focus {
  box-shadow: none;
}

/* Custom scrollbar for dropdown menus */
.dropdown-menu {
  max-height: 300px;
  overflow-y: auto;
}

.dropdown-menu::-webkit-scrollbar {
  width: 4px;
}

.dropdown-menu::-webkit-scrollbar-track {
  background: #f1f1f1;
}

.dropdown-menu::-webkit-scrollbar-thumb {
  background: #888;
  border-radius: 2px;
}

.dropdown-menu::-webkit-scrollbar-thumb:hover {
  background: #555;
}
</style>

<style>
/* Global Styles */
.router-link-active {
  font-weight: 600;
}

/* Bootstrap Toast Positioning */
.toast-container .toast {
  margin-bottom: 0.5rem;
}

/* Loading States */
.btn.loading {
  position: relative;
  color: transparent !important;
}

.btn.loading::after {
  content: '';
  position: absolute;
  width: 16px;
  height: 16px;
  top: 50%;
  left: 50%;
  margin-left: -8px;
  margin-top: -8px;
  border: 2px solid transparent;
  border-top-color: currentColor;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

/* Card Hover Effects */
.card {
  transition:
    transform 0.2s ease-in-out,
    box-shadow 0.2s ease-in-out;
}

.card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

/* Form Enhancements */
.form-control:focus,
.form-select:focus {
  border-color: #0d6efd;
  box-shadow: 0 0 0 0.25rem rgba(13, 110, 253, 0.25);
}

.is-invalid {
  border-color: #dc3545;
}

.is-invalid:focus {
  border-color: #dc3545;
  box-shadow: 0 0 0 0.25rem rgba(220, 53, 69, 0.25);
}

/* Table Enhancements */
.table th {
  font-weight: 600;
  color: #495057;
  border-top: none;
}

.table-hover tbody tr:hover {
  background-color: rgba(0, 0, 0, 0.02);
}

/* Badge Improvements */
.badge {
  font-size: 0.75em;
  padding: 0.375em 0.5em;
}

/* Animation Utilities */
.animate-fade-in {
  animation: fadeIn 0.3s ease-in;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-slide-in {
  animation: slideIn 0.3s ease-out;
}

@keyframes slideIn {
  from {
    transform: translateX(-100%);
  }
  to {
    transform: translateX(0);
  }
}
</style>
