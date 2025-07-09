<template>
  <v-container class="dashboard mt-5">
    <!-- Header -->
    <v-row class="mb-4">
      <v-col cols="12">
        <h2 class="text-primary">
          Bienvenido, {{ authStore.user?.name || authStore.user?.email }}
        </h2>
        <p class="text-grey-darken-1">{{ roleDescription }}</p>
      </v-col>
    </v-row>

    <!-- Superadmin Dashboard -->
    <template v-if="authStore.isSuperadmin">
      <v-row>
        <v-col md="3" sm="6" class="mb-4">
          <v-card class="glass-morphism text-center">
            <v-card-text>
              <v-icon class="mb-2" size="36" color="primary">mdi-office-building</v-icon>
              <h4 class="text-primary">{{ stats.totalCompanies }}</h4>
              <p class="text-grey-darken-1 mb-0">Empresas Activas</p>
            </v-card-text>
          </v-card>
        </v-col>
        <v-col md="3" sm="6" class="mb-4">
          <v-card class="glass-morphism text-center">
            <v-card-text>
              <v-icon class="mb-2" size="36" color="secondary">mdi-account</v-icon>
              <h4 class="text-secondary">{{ stats.totalUsers }}</h4>
              <p class="text-grey-darken-1 mb-0">Usuarios Total</p>
            </v-card-text>
          </v-card>
        </v-col>
        <v-col md="3" sm="6" class="mb-4">
          <v-card class="glass-morphism text-center">
            <v-card-text>
              <v-icon class="mb-2" size="36" color="tertiary">mdi-cash</v-icon>
              <h4 class="text-tertiary">{{ stats.totalRequests }}</h4>
              <p class="text-grey-darken-1 mb-0">Solicitudes Mes</p>
            </v-card-text>
          </v-card>
        </v-col>
        <v-col md="3" sm="6" class="mb-4">
          <v-card class="glass-morphism text-center">
            <v-card-text>
              <v-icon class="mb-2" size="36" color="quaternary">mdi-currency-usd</v-icon>
              <h4 class="text-quaternary">${{ stats.totalAmount }}</h4>
              <p class="text-grey-darken-1 mb-0">Monto Total</p>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>

      <v-row>
        <v-col md="6" class="mb-4">
          <v-card class="glass-morphism">
            <v-card-title
              ><v-icon class="mr-2">mdi-chart-line</v-icon>Acciones Rápidas</v-card-title
            >
            <v-card-text>
              <div class="d-flex flex-column ga-2">
                <v-btn to="/superadmin/usuarios" color="primary" variant="outlined">
                  <v-icon class="mr-2">mdi-account-plus</v-icon>Gestionar Usuarios
                </v-btn>
                <v-btn to="/superadmin/empresas" color="secondary" variant="outlined">
                  <v-icon class="mr-2">mdi-office-building</v-icon>Gestionar Empresas
                </v-btn>
                <v-btn to="/superadmin/config" color="tertiary" variant="outlined">
                  <v-icon class="mr-2">mdi-cogs</v-icon>Configuración Global
                </v-btn>
              </div>
            </v-card-text>
          </v-card>
        </v-col>
        <v-col md="6" class="mb-4">
          <v-card class="glass-morphism">
            <v-card-title
              ><v-icon class="mr-2">mdi-clock-outline</v-icon>Actividad Reciente</v-card-title
            >
            <v-card-text>
              <v-list v-if="recentActivity.length">
                <v-list-item v-for="activity in recentActivity" :key="activity.id" class="px-0">
                  <small class="text-grey-darken-1">{{ formatDate(activity.created) }}</small>
                  <p class="mb-0">{{ activity.description }}</p>
                </v-list-item>
              </v-list>
              <p v-else class="text-grey-darken-1 mb-0">No hay actividad reciente</p>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
    </template>

    <!-- Admin Dashboard (Empresa/Operador) -->
    <template v-if="authStore.isEmpresa || authStore.isOperador">
      <v-row>
        <v-col md="4" sm="6" class="mb-4">
          <v-card class="glass-morphism text-center">
            <v-card-text>
              <v-icon class="mb-2" size="36" color="primary">mdi-account</v-icon>
              <h4 class="text-primary">{{ stats.myUsers }}</h4>
              <p class="text-grey-darken-1 mb-0">Mis Empleados</p>
            </v-card-text>
          </v-card>
        </v-col>
        <v-col md="4" sm="6" class="mb-4">
          <v-card class="glass-morphism text-center">
            <v-card-text>
              <v-icon class="mb-2" size="36" color="quaternary">mdi-timer</v-icon>
              <h4 class="text-quaternary">{{ stats.pendingRequests }}</h4>
              <p class="text-grey-darken-1 mb-0">Solicitudes Pendientes</p>
            </v-card-text>
          </v-card>
        </v-col>
        <v-col md="4" sm="6" class="mb-4">
          <v-card class="glass-morphism text-center">
            <v-card-text>
              <v-icon class="mb-2" size="36" color="tertiary">mdi-check-circle</v-icon>
              <h4 class="text-tertiary">{{ stats.approvedThisMonth }}</h4>
              <p class="text-grey-darken-1 mb-0">Aprobadas Este Mes</p>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>

      <v-row>
        <v-col md="8" class="mb-4">
          <v-card class="glass-morphism">
            <v-card-title
              ><v-icon class="mr-2">mdi-format-list-bulleted</v-icon>Solicitudes
              Recientes</v-card-title
            >
            <v-card-text>
              <v-responsive v-if="recentRequests.length">
                <v-table>
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
                        <v-chip :color="getStatusColor(request.estado)" size="small">
                          {{ request.estado }}
                        </v-chip>
                      </td>
                      <td>{{ formatDate(request.fecha_solicitud) }}</td>
                    </tr>
                  </tbody>
                </v-table>
              </v-responsive>
              <p v-else class="text-grey-darken-1 mb-0">No hay solicitudes recientes</p>
            </v-card-text>
          </v-card>
        </v-col>
        <v-col md="4" class="mb-4">
          <v-card class="glass-morphism">
            <v-card-title><v-icon class="mr-2">mdi-tools</v-icon>Acciones Rápidas</v-card-title>
            <v-card-text>
              <div class="d-flex flex-column ga-2">
                <v-btn to="/admin/usuarios" color="primary" variant="outlined">
                  <v-icon class="mr-2">mdi-account-cog</v-icon>Gestionar Empleados
                </v-btn>
                <v-btn to="/admin/reportes" color="secondary" variant="outlined">
                  <v-icon class="mr-2">mdi-chart-bar</v-icon>Ver Reportes
                </v-btn>
              </div>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
    </template>

    <!-- Usuario Dashboard -->
    <template v-if="authStore.isUsuario">
      <v-row>
        <v-col md="6" class="mb-4">
          <v-card class="glass-morphism text-center">
            <v-card-text>
              <v-icon class="mb-3" size="48" color="primary">mdi-currency-usd</v-icon>
              <h3 class="text-primary mb-1">${{ userStats.availableAmount }}</h3>
              <p class="text-grey-darken-1">Monto Disponible</p>
              <v-btn to="/usuario/solicitudes" color="primary" variant="outlined">
                <v-icon class="mr-2">mdi-cash-multiple</v-icon>Solicitar Anticipo
              </v-btn>
            </v-card-text>
          </v-card>
        </v-col>
        <v-col md="6" class="mb-4">
          <v-card class="glass-morphism">
            <v-card-title>
              <v-icon class="mr-2">mdi-credit-card</v-icon>Mis Cuentas Bancarias
            </v-card-title>
            <v-card-text>
              <v-list v-if="userBankAccounts.length">
                <v-list-item
                  v-for="account in userBankAccounts"
                  :key="account.id"
                  class="justify-space-between align-center mb-2"
                >
                  <div>
                    <strong>{{ account.banco_nombre }}</strong
                    ><br />
                    <small class="text-grey-darken-1">{{ account.numero_cuenta }}</small>
                  </div>
                  <v-chip :color="account.activa ? 'success' : 'secondary'" size="small">
                    {{ account.activa ? 'Activa' : 'Inactiva' }}
                  </v-chip>
                </v-list-item>
                <v-divider></v-divider>
              </v-list>
              <v-btn to="/usuario/bancos" color="secondary" variant="outlined">
                <v-icon class="mr-2">mdi-plus</v-icon>Gestionar Cuentas
              </v-btn>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>

      <v-row>
        <v-col cols="12">
          <v-card class="glass-morphism">
            <v-card-title>
              <v-icon class="mr-2">mdi-history</v-icon>Mis Últimas Solicitudes
            </v-card-title>
            <v-card-text>
              <v-responsive v-if="userRequests.length">
                <v-table>
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
                        <v-chip :color="getStatusColor(request.estado)" size="small">
                          {{ request.estado }}
                        </v-chip>
                      </td>
                      <td>{{ formatDate(request.fecha_solicitud) }}</td>
                      <td>{{ request.expand?.banco_destino?.banco_nombre || '-' }}</td>
                    </tr>
                  </tbody>
                </v-table>
              </v-responsive>
              <p v-else class="text-grey-darken-1 mb-0">No tienes solicitudes aún</p>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
    </template>
  </v-container>
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

const getStatusColor = (estado) => {
  switch (estado) {
    case 'pendiente':
      return 'warning'
    case 'aprobado':
      return 'success'
    case 'rechazado':
      return 'error'
    case 'pagado':
      return 'info'
    default:
      return 'secondary'
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
