<template>
  <div class="reportes-view">
    <v-container fluid>
      <!-- Header -->
      <v-row class="mb-4">
        <v-col cols="12">
          <h2 class="mb-1">
            <v-icon :class="roleIcon" class="me-2"></v-icon>
            {{ pageTitle }}
          </h2>
          <p class="text-muted">{{ pageDescription }}</p>
        </v-col>
      </v-row>

      <!-- Filters -->
      <v-row class="mb-4">
        <v-col cols="12">
          <v-card>
            <v-card-title>
              <v-icon class="me-2">mdi-filter</v-icon>
              Filtros de Búsqueda
            </v-card-title>
            <v-card-text>
              <v-row>
                <v-col v-if="authStore.isSuperadmin" md="3">
                  <v-select
                    v-model="filters.empresa_id"
                    :items="availableCompanies"
                    item-title="first_name"
                    item-value="id"
                    label="Empresa"
                    clearable
                  >
                    <template #prepend-item>
                      <v-list-item title="Todas las empresas" value=""></v-list-item>
                    </template>
                  </v-select>
                </v-col>

                <v-col md="3">
                  <v-text-field
                    v-model="filters.fechaDesde"
                    type="date"
                    label="Fecha Desde"
                  ></v-text-field>
                </v-col>

                <v-col md="3">
                  <v-text-field
                    v-model="filters.fechaHasta"
                    type="date"
                    label="Fecha Hasta"
                  ></v-text-field>
                </v-col>

                <v-col md="3">
                  <v-select
                    v-model="filters.estado"
                    :items="[
                      { title: 'Todos los estados', value: '' },
                      { title: 'Pendientes', value: 'pendiente' },
                      { title: 'Aprobados', value: 'aprobado' },
                      { title: 'Pagados', value: 'pagado' },
                      { title: 'Rechazados', value: 'rechazado' },
                    ]"
                    label="Estado"
                    clearable
                  ></v-select>
                </v-col>

                <v-col cols="12">
                  <v-btn color="primary" class="me-2" @click="generateReport">
                    <v-icon left>mdi-magnify</v-icon>
                    Generar Reporte
                  </v-btn>
                  <v-btn variant="outlined" color="secondary" class="me-2" @click="clearFilters">
                    <v-icon left>mdi-eraser</v-icon>
                    Limpiar
                  </v-btn>
                  <v-btn v-if="reportData.length > 0" color="success" @click="exportToExcel">
                    <v-icon left>mdi-file-excel</v-icon>
                    Exportar Excel
                  </v-btn>
                </v-col>
              </v-row>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>

      <!-- Stats Summary -->
      <v-row v-if="reportData.length > 0" class="mb-4">
        <v-col md="3">
          <v-card color="primary" dark>
            <v-card-text>
              <h6>Total Solicitudes</h6>
              <h3>{{ reportStats.total }}</h3>
            </v-card-text>
          </v-card>
        </v-col>
        <v-col md="3">
          <v-card color="warning" dark>
            <v-card-text>
              <h6>Monto Solicitado</h6>
              <h3>${{ reportStats.totalSolicitado.toLocaleString() }}</h3>
            </v-card-text>
          </v-card>
        </v-col>
        <v-col md="3">
          <v-card color="success" dark>
            <v-card-text>
              <h6>Monto Aprobado</h6>
              <h3>${{ reportStats.totalAprobado.toLocaleString() }}</h3>
            </v-card-text>
          </v-card>
        </v-col>
        <v-col md="3">
          <v-card color="info" dark>
            <v-card-text>
              <h6>Tasa Aprobación</h6>
              <h3>{{ reportStats.tasaAprobacion }}%</h3>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>

      <!-- Report Results -->
      <div class="row">
        <div class="col-12">
          <div class="card">
            <div class="card-header d-flex justify-content-between align-items-center">
              <h5 class="mb-0">
                <i class="fas fa-table me-2"></i>
                Resultados del Reporte
              </h5>
              <span class="badge bg-primary">{{ reportData.length }} registros</span>
            </div>

            <div class="card-body p-0">
              <div v-if="loading" class="text-center py-5">
                <div class="spinner-border text-primary" role="status">
                  <span class="visually-hidden">Generando reporte...</span>
                </div>
              </div>

              <div v-else-if="!hasSearched" class="text-center py-5">
                <i class="fas fa-chart-bar fa-3x text-muted mb-3"></i>
                <p class="text-muted">
                  Configure los filtros y haga clic en "Generar Reporte" para ver los resultados
                </p>
              </div>

              <div v-else-if="reportData.length === 0" class="text-center py-5">
                <i class="fas fa-search fa-3x text-muted mb-3"></i>
                <p class="text-muted">
                  No se encontraron registros con los criterios especificados
                </p>
              </div>

              <div v-else class="table-responsive">
                <table class="table table-hover mb-0">
                  <thead class="table-light">
                    <tr>
                      <th>Usuario</th>
                      <th v-if="authStore.isSuperadmin">Empresa</th>
                      <th>Monto Solicitado</th>
                      <th>Monto Aprobado</th>
                      <th>Estado</th>
                      <th>Fecha Solicitud</th>
                      <th>Fecha Procesado</th>
                      <th>Banco Destino</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="item in paginatedData" :key="item.id">
                      <td>
                        <div class="d-flex align-items-center">
                          <div class="avatar-sm me-2">
                            <div class="avatar-initial bg-primary rounded-circle">
                              {{ getUserInitials(item.user) }}
                            </div>
                          </div>
                          <div>
                            <div class="fw-semibold">
                              {{ item.user?.first_name }} {{ item.user?.last_name }}
                            </div>
                            <small class="text-muted">{{ item.user?.cedula }}</small>
                          </div>
                        </div>
                      </td>
                      <td v-if="authStore.isSuperadmin">
                        {{ item.empresa?.first_name || 'N/A' }}
                      </td>
                      <td>
                        <span class="fw-bold">${{ item.monto_solicitado.toLocaleString() }}</span>
                      </td>
                      <td>
                        <span v-if="item.monto_aprobado" class="fw-bold text-success">
                          ${{ item.monto_aprobado.toLocaleString() }}
                        </span>
                        <span v-else class="text-muted">-</span>
                      </td>
                      <td>
                        <span :class="getStatusBadgeClass(item.estado)">
                          {{ getStatusLabel(item.estado) }}
                        </span>
                      </td>
                      <td>
                        {{ formatDate(item.fecha_solicitud) }}
                      </td>
                      <td>
                        <span v-if="item.fecha_procesamiento">
                          {{ formatDate(item.fecha_procesamiento) }}
                        </span>
                        <span v-else class="text-muted">-</span>
                      </td>
                      <td>
                        {{ item.banco_destino?.banco_nombre || 'N/A' }}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <!-- Pagination -->
              <div
                v-if="totalPages > 1"
                class="d-flex justify-content-between align-items-center p-3 border-top"
              >
                <div class="text-muted">
                  Mostrando {{ (currentPage - 1) * itemsPerPage + 1 }} a
                  {{ Math.min(currentPage * itemsPerPage, reportData.length) }}
                  de {{ reportData.length }} registros
                </div>
                <nav>
                  <ul class="pagination pagination-sm mb-0">
                    <li class="page-item" :class="{ disabled: currentPage === 1 }">
                      <button class="page-link" @click="goToPage(currentPage - 1)">Anterior</button>
                    </li>
                    <li
                      v-for="page in visiblePages"
                      :key="page"
                      class="page-item"
                      :class="{ active: page === currentPage }"
                    >
                      <button class="page-link" @click="goToPage(page)">{{ page }}</button>
                    </li>
                    <li class="page-item" :class="{ disabled: currentPage === totalPages }">
                      <button class="page-link" @click="goToPage(currentPage + 1)">
                        Siguiente
                      </button>
                    </li>
                  </ul>
                </nav>
              </div>
            </div>
          </div>
        </div>
      </div>
    </v-container>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useUserAdvanceRequestsStore } from '@/stores/userAdvanceRequests'
import { useCompaniesStore } from '@/stores/companies'
import * as XLSX from 'xlsx'

// Stores
const authStore = useAuthStore()
const requestsStore = useUserAdvanceRequestsStore()

// State
const loading = ref(false)
const hasSearched = ref(false)

// Filters
const filters = ref({
  empresa_id: '',
  fechaDesde: '',
  fechaHasta: '',
  estado: '',
})

// Data
const reportData = ref([])
const availableCompanies = ref([])

// Pagination
const currentPage = ref(1)
const itemsPerPage = 50

// Computed properties

// Role-based UI
const roleIcon = computed(() => {
  if (authStore.isSuperadmin) return 'fas fa-crown text-warning'
  if (authStore.isEmpresa) return 'fas fa-building text-primary'
  return 'fas fa-chart-line text-info'
})

const pageTitle = computed(() => {
  if (authStore.isSuperadmin) return 'Reportes del Sistema'
  if (authStore.isEmpresa) return 'Reportes de la Empresa'
  return 'Reportes Operativos'
})

const pageDescription = computed(() => {
  if (authStore.isSuperadmin) return 'Reportes y estadísticas de todas las empresas'
  if (authStore.isEmpresa) return 'Reportes y estadísticas de tu empresa'
  return 'Reportes operativos de empresas asignadas'
})

// Report statistics
const reportStats = computed(() => {
  const total = reportData.value.length
  const totalSolicitado = reportData.value.reduce((sum, item) => sum + item.monto_solicitado, 0)
  const totalAprobado = reportData.value.reduce((sum, item) => sum + (item.monto_aprobado || 0), 0)
  const aprobados = reportData.value.filter((item) =>
    ['aprobado', 'pagado'].includes(item.estado),
  ).length
  const tasaAprobacion = total > 0 ? Math.round((aprobados / total) * 100) : 0

  return {
    total,
    totalSolicitado,
    totalAprobado,
    tasaAprobacion,
  }
})

// Pagination
const totalPages = computed(() => Math.ceil(reportData.value.length / itemsPerPage))

const paginatedData = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage
  const end = start + itemsPerPage
  return reportData.value.slice(start, end)
})

const visiblePages = computed(() => {
  const total = totalPages.value
  const current = currentPage.value
  const pages = []

  const start = Math.max(1, current - 2)
  const end = Math.min(total, current + 2)

  for (let i = start; i <= end; i++) {
    pages.push(i)
  }

  return pages
})

// Methods

// Load initial data
const loadCompanies = async () => {
  if (!authStore.isSuperadmin) return

  try {
    const result = await companiesStore.fetchCompanies()
    availableCompanies.value = result.items || []
  } catch (error) {
    console.error('Error loading companies:', error)
  }
}

// Generate report with filters
const generateReport = async () => {
  loading.value = true
  hasSearched.value = true

  try {
    // Build filter object
    const reportFilters = {}

    if (filters.value.empresa_id) {
      reportFilters.empresa_id = filters.value.empresa_id
    } else if (!authStore.isSuperadmin) {
      // Non-superadmin users only see their company data
      reportFilters.empresa_id = authStore.user.empresa_id
    }

    if (filters.value.fechaDesde) {
      reportFilters.fechaDesde = filters.value.fechaDesde
    }

    if (filters.value.fechaHasta) {
      reportFilters.fechaHasta = filters.value.fechaHasta
    }

    if (filters.value.estado) {
      reportFilters.estado = filters.value.estado
    }

    // Fetch data using the existing store method
    await requestsStore.fetchUserRequests(authStore.user.id, 1, 1000)

    // For now, using the store data (in a real implementation, we'd need a dedicated reports API)
    let data = [...(requestsStore.userRequests || [])]

    // Apply filters
    if (reportFilters.fechaDesde) {
      data = data.filter(
        (item) => new Date(item.fecha_solicitud) >= new Date(reportFilters.fechaDesde),
      )
    }

    if (reportFilters.fechaHasta) {
      data = data.filter(
        (item) => new Date(item.fecha_solicitud) <= new Date(reportFilters.fechaHasta),
      )
    }

    if (reportFilters.estado) {
      data = data.filter((item) => item.estado === reportFilters.estado)
    }

    reportData.value = data
    currentPage.value = 1
  } catch (error) {
    console.error('Error generating report:', error)
    reportData.value = []
  } finally {
    loading.value = false
  }
}

// Clear all filters
const clearFilters = () => {
  filters.value = {
    empresa_id: '',
    fechaDesde: '',
    fechaHasta: '',
    estado: '',
  }
  reportData.value = []
  hasSearched.value = false
  currentPage.value = 1
}

// Export to Excel
const exportToExcel = () => {
  if (reportData.value.length === 0) return

  const exportData = reportData.value.map((item) => ({
    Usuario: `${item.user?.first_name} ${item.user?.last_name}`,
    Cédula: item.user?.cedula,
    Empresa: item.empresa?.first_name || 'N/A',
    'Monto Solicitado': item.monto_solicitado,
    'Monto Aprobado': item.monto_aprobado || 0,
    Estado: getStatusLabel(item.estado),
    'Fecha Solicitud': formatDate(item.fecha_solicitud),
    'Fecha Procesado': item.fecha_procesamiento ? formatDate(item.fecha_procesamiento) : '',
    'Banco Destino': item.banco_destino?.banco_nombre || 'N/A',
  }))

  const wb = XLSX.utils.book_new()
  const ws = XLSX.utils.json_to_sheet(exportData)
  XLSX.utils.book_append_sheet(wb, ws, 'Reporte')

  const filename = `reporte_${new Date().toISOString().split('T')[0]}.xlsx`
  XLSX.writeFile(wb, filename)
}

// Utility methods
const goToPage = (page) => {
  if (page >= 1 && page <= totalPages.value) {
    currentPage.value = page
  }
}

const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString('es-EC')
}

const getStatusLabel = (estado) => {
  const labels = {
    pendiente: 'Pendiente',
    aprobado: 'Aprobado',
    rechazado: 'Rechazado',
    pagado: 'Pagado',
  }
  return labels[estado] || estado
}

const getStatusBadgeClass = (estado) => {
  const classes = {
    pendiente: 'badge bg-warning',
    aprobado: 'badge bg-success',
    rechazado: 'badge bg-danger',
    pagado: 'badge bg-info',
  }
  return classes[estado] || 'badge bg-secondary'
}

const getUserInitials = (user) => {
  if (!user) return 'U'
  return (user.first_name?.charAt(0) + user.last_name?.charAt(0)).toUpperCase()
}

// Lifecycle
onMounted(async () => {
  await loadCompanies()

  // Set default date range (last 30 days)
  const today = new Date()
  const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, today.getDate())

  filters.value.fechaDesde = lastMonth.toISOString().split('T')[0]
  filters.value.fechaHasta = today.toISOString().split('T')[0]
})
</script>
