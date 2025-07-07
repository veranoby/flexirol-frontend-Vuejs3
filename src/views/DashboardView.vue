<template>
  <div class="dashboard mt-5">
    <!-- Header -->
    <div class="row mb-4">
      <div class="col-12">
        <h2 class="text-flexirol-primary">
          Bienvenido, {{ authStore.user?.name || authStore.user?.email }}
        </h2>
        <p class="text-muted">{{ roleDescription }}</p>
      </div>
    </div>

    <!-- Superadmin Dashboard -->
    <template v-if="authStore.isSuperadmin">
      <div class="row">
        <div class="col-md-3 col-sm-6 mb-4">
          <div class="card card-flexirol text-center">
            <div class="card-body">
              <i class="fas fa-building fa-2x text-flexirol-primary mb-2"></i>
              <h4 class="text-flexirol-primary">{{ stats.totalCompanies }}</h4>
              <p class="mb-0">Empresas Activas</p>
            </div>
          </div>
        </div>
        <div class="col-md-3 col-sm-6 mb-4">
          <div class="card card-flexirol text-center">
            <div class="card-body">
              <i class="fas fa-users fa-2x text-flexirol-secondary mb-2"></i>
              <h4 class="text-flexirol-secondary">{{ stats.totalUsers }}</h4>
              <p class="mb-0">Usuarios Total</p>
            </div>
          </div>
        </div>
        <div class="col-md-3 col-sm-6 mb-4">
          <div class="card card-flexirol text-center">
            <div class="card-body">
              <i class="fas fa-money-check-alt fa-2x text-flexirol-tertiary mb-2"></i>
              <h4 class="text-flexirol-tertiary">{{ stats.totalRequests }}</h4>
              <p class="mb-0">Solicitudes Mes</p>
            </div>
          </div>
        </div>
        <div class="col-md-3 col-sm-6 mb-4">
          <div class="card card-flexirol text-center">
            <div class="card-body">
              <i class="fas fa-dollar-sign fa-2x text-flexirol-quaternary mb-2"></i>
              <h4 class="text-flexirol-quaternary">${{ stats.totalAmount }}</h4>
              <p class="mb-0">Monto Total</p>
            </div>
          </div>
        </div>
      </div>

      <div class="row">
        <div class="col-md-6 mb-4">
          <div class="card card-flexirol">
            <div class="card-header"><i class="fas fa-chart-line me-2"></i>Acciones Rápidas</div>
            <div class="card-body">
              <router-link to="/superadmin/usuarios" class="btn btn-flexirol-primary me-2 mb-2">
                <i class="fas fa-user-plus me-1"></i>Gestionar Usuarios
              </router-link>
              <router-link to="/superadmin/empresas" class="btn btn-flexirol-secondary me-2 mb-2">
                <i class="fas fa-building me-1"></i>Gestionar Empresas
              </router-link>
              <router-link to="/superadmin/config" class="btn btn-flexirol-tertiary mb-2">
                <i class="fas fa-cogs me-1"></i>Configuración Global
              </router-link>
            </div>
          </div>
        </div>
        <div class="col-md-6 mb-4">
          <div class="card card-flexirol">
            <div class="card-header"><i class="fas fa-clock me-2"></i>Actividad Reciente</div>
            <div class="card-body">
              <div v-if="recentActivity.length" class="list-group list-group-flush">
                <div
                  v-for="activity in recentActivity"
                  :key="activity.id"
                  class="list-group-item border-0 px-0"
                >
                  <small class="text-muted">{{ formatDate(activity.created) }}</small>
                  <p class="mb-0">{{ activity.description }}</p>
                </div>
              </div>
              <p v-else class="text-muted mb-0">No hay actividad reciente</p>
            </div>
          </div>
        </div>
      </div>
    </template>

    <!-- Admin Dashboard (Empresa/Operador) -->
    <template v-if="authStore.isEmpresa || authStore.isOperador">
      <div class="row">
        <div class="col-md-4 col-sm-6 mb-4">
          <div class="card card-flexirol text-center">
            <div class="card-body">
              <i class="fas fa-users fa-2x text-flexirol-primary mb-2"></i>
              <h4 class="text-flexirol-primary">{{ stats.myUsers }}</h4>
              <p class="mb-0">Mis Empleados</p>
            </div>
          </div>
        </div>
        <div class="col-md-4 col-sm-6 mb-4">
          <div class="card card-flexirol text-center">
            <div class="card-body">
              <i class="fas fa-clock fa-2x text-flexirol-quaternary mb-2"></i>
              <h4 class="text-flexirol-quaternary">{{ stats.pendingRequests }}</h4>
              <p class="mb-0">Solicitudes Pendientes</p>
            </div>
          </div>
        </div>
        <div class="col-md-4 col-sm-6 mb-4">
          <div class="card card-flexirol text-center">
            <div class="card-body">
              <i class="fas fa-check-circle fa-2x text-flexirol-tertiary mb-2"></i>
              <h4 class="text-flexirol-tertiary">{{ stats.approvedThisMonth }}</h4>
              <p class="mb-0">Aprobadas Este Mes</p>
            </div>
          </div>
        </div>
      </div>

      <div class="row">
        <div class="col-md-8 mb-4">
          <div class="card card-flexirol">
            <div class="card-header"><i class="fas fa-list me-2"></i>Solicitudes Recientes</div>
            <div class="card-body">
              <div v-if="recentRequests.length" class="table-responsive">
                <table class="table table-flexirol">
                  <thead>
                    <tr>
                      <th>Usuario</th>
                      <th>Monto</th>
                      <th>Estado</th>
                      <th>Fecha</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="request in recentRequests" :key="request.id">
                      <td>{{ request.expand?.user_id?.name }}</td>
                      <td>${{ request.monto_solicitado }}</td>
                      <td>
                        <span :class="getStatusClass(request.estado)">
                          {{ request.estado }}
                        </span>
                      </td>
                      <td>{{ formatDate(request.fecha_solicitud) }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p v-else class="text-muted mb-0">No hay solicitudes recientes</p>
            </div>
          </div>
        </div>
        <div class="col-md-4 mb-4">
          <div class="card card-flexirol">
            <div class="card-header"><i class="fas fa-tools me-2"></i>Acciones Rápidas</div>
            <div class="card-body d-grid gap-2">
              <router-link to="/admin/usuarios" class="btn btn-flexirol-primary">
                <i class="fas fa-user-cog me-1"></i>Gestionar Empleados
              </router-link>
              <router-link to="/admin/reportes" class="btn btn-flexirol-secondary">
                <i class="fas fa-chart-bar me-1"></i>Ver Reportes
              </router-link>
            </div>
          </div>
        </div>
      </div>
    </template>

    <!-- Usuario Dashboard -->
    <template v-if="authStore.isUsuario">
      <div class="row">
        <div class="col-md-6 mb-4">
          <div class="card card-flexirol text-center">
            <div class="card-body">
              <i class="fas fa-dollar-sign fa-3x text-flexirol-primary mb-3"></i>
              <h3 class="text-flexirol-primary mb-1">${{ userStats.availableAmount }}</h3>
              <p class="text-muted">Monto Disponible</p>
              <router-link to="/usuario/solicitudes" class="btn btn-flexirol-primary">
                <i class="fas fa-money-check-alt me-1"></i>Solicitar Anticipo
              </router-link>
            </div>
          </div>
        </div>
        <div class="col-md-6 mb-4">
          <div class="card card-flexirol">
            <div class="card-header">
              <i class="fas fa-credit-card me-2"></i>Mis Cuentas Bancarias
            </div>
            <div class="card-body">
              <div v-if="userBankAccounts.length">
                <div
                  v-for="account in userBankAccounts"
                  :key="account.id"
                  class="d-flex justify-content-between align-items-center mb-2"
                >
                  <div>
                    <strong>{{ account.banco_nombre }}</strong
                    ><br />
                    <small class="text-muted">{{ account.numero_cuenta }}</small>
                  </div>
                  <span :class="account.activa ? 'badge bg-success' : 'badge bg-secondary'">
                    {{ account.activa ? 'Activa' : 'Inactiva' }}
                  </span>
                </div>
                <hr />
              </div>
              <router-link to="/usuario/bancos" class="btn btn-flexirol-secondary">
                <i class="fas fa-plus me-1"></i>Gestionar Cuentas
              </router-link>
            </div>
          </div>
        </div>
      </div>

      <div class="row">
        <div class="col-12">
          <div class="card card-flexirol">
            <div class="card-header">
              <i class="fas fa-history me-2"></i>Mis Últimas Solicitudes
            </div>
            <div class="card-body">
              <div v-if="userRequests.length" class="table-responsive">
                <table class="table table-flexirol">
                  <thead>
                    <tr>
                      <th>Monto</th>
                      <th>Estado</th>
                      <th>Fecha Solicitud</th>
                      <th>Banco Destino</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="request in userRequests" :key="request.id">
                      <td>${{ request.monto_solicitado }}</td>
                      <td>
                        <span :class="getStatusClass(request.estado)">
                          {{ request.estado }}
                        </span>
                      </td>
                      <td>{{ formatDate(request.fecha_solicitud) }}</td>
                      <td>{{ request.expand?.banco_destino?.banco_nombre || '-' }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p v-else class="text-muted mb-0">No tienes solicitudes aún</p>
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { api } from '@/services/pocketbase'

const authStore = useAuthStore()

// Reactive data
const stats = ref({
  totalCompanies: 0,
  totalUsers: 0,
  totalRequests: 0,
  totalAmount: 0,
  myUsers: 0,
  pendingRequests: 0,
  approvedThisMonth: 0,
})

const userStats = ref({
  availableAmount: 0,
})

const recentActivity = ref([])
const recentRequests = ref([])
const userRequests = ref([])
const userBankAccounts = ref([])

// Computed

const roleDescription = computed(() => {
  switch (authStore.userRole) {
    case 'superadmin':
      return 'Panel de administración global del sistema'
    case 'empresa':
      return 'Gestión de empleados y solicitudes de tu empresa'
    case 'operador':
      return 'Gestión operativa de empresas asignadas'
    case 'usuario':
      return 'Solicita adelantos y gestiona tus cuentas bancarias'
    default:
      return 'Panel de usuario'
  }
})

// Methods
const loadDashboardData = async () => {
  try {
    if (authStore.isSuperadmin) {
      await loadSuperadminStats()
    } else if (authStore.isEmpresa || authStore.isOperador) {
      await loadAdminStats()
    } else if (authStore.isUsuario) {
      await loadUserStats()
    }
  } catch (error) {
    console.error('Error loading dashboard data:', error)
  }
}

const loadSuperadminStats = async () => {
  const [companies, users, requests] = await Promise.all([
    api.getCompanies(),
    api.getUsers(),
    api.getAdvanceRequests(),
  ])

  stats.value.totalCompanies = companies.totalItems
  stats.value.totalUsers = users.totalItems
  stats.value.totalRequests = requests.totalItems
  stats.value.totalAmount = requests.items.reduce((sum, req) => sum + req.monto_solicitado, 0)
}

const loadAdminStats = async () => {
  const companyFilter = authStore.isEmpresa
    ? { company_id: authStore.user.id }
    : { company_id: authStore.getUserCompanies() }

  const [users, requests] = await Promise.all([
    api.getUsers({ empresa_id: authStore.user.id }),
    api.getAdvanceRequests(companyFilter),
  ])

  stats.value.myUsers = users.totalItems
  stats.value.pendingRequests = requests.items.filter((r) => r.estado === 'pendiente').length
  stats.value.approvedThisMonth = requests.items.filter((r) => r.estado === 'aprobado').length

  recentRequests.value = requests.items.slice(0, 5)
}

const loadUserStats = async () => {
  userStats.value.availableAmount = authStore.user.disponible || 0

  const [requests, bankAccounts] = await Promise.all([
    api.getAdvanceRequests({ user_id: authStore.user.id }),
    api.getBankAccounts(authStore.user.id),
  ])

  userRequests.value = requests.items.slice(0, 5)
  userBankAccounts.value = bankAccounts.items.slice(0, 3)
}

const getStatusClass = (estado) => {
  switch (estado) {
    case 'pendiente':
      return 'badge bg-warning'
    case 'aprobado':
      return 'badge bg-success'
    case 'rechazado':
      return 'badge bg-danger'
    case 'pagado':
      return 'badge bg-info'
    default:
      return 'badge bg-secondary'
  }
}

const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString('es-EC')
}

// Lifecycle
onMounted(() => {
  loadDashboardData()
})
</script>

<style scoped>
.dashboard {
  max-width: 1200px;
  margin: 0 auto;
}

.card-flexirol {
  transition: transform 0.2s ease-in-out;
}

.card-flexirol:hover {
  transform: translateY(-2px);
}

.badge {
  font-size: 0.75em;
}
</style>
