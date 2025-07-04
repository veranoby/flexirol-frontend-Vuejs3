<template>
  <div class="container mt-4 reportes-view">
    <h3 class="mb-3">Reporte de Anticipos</h3>

    <!-- Excel Load Status Alert -->
    <div v-if="canAccessPage" class="alert" :class="claseImportante" role="alert">
      <div v-if="!ultimaCargaExcel" class="d-flex align-items-center">
        <i class="bi bi-exclamation-triangle-fill me-2"></i>
        <div>No se ha cargado el archivo Excel de este mes.</div>
      </div>
      <div v-else class="d-flex justify-content-between align-items-center">
        <div>
          <i class="bi bi-info-circle-fill me-2"></i>
          Última actualización de Excel: {{ formatDate(ultimaCargaExcel) }}
          <span v-if="!habilitadoSwitch"> - Esperando cierre de ciclo para nueva carga</span>
        </div>
      </div>
    </div>

    <div v-if="!canAccessPage" class="alert alert-danger">
      Acceso denegado. Esta sección es solo para roles 'empresa' y 'operador'.
    </div>

    <div v-if="canAccessPage">
      <!-- Filters Card -->
      <div class="card shadow-sm mb-4">
        <div class="card-header">
          Filtros del Reporte
        </div>
        <div class="card-body">
          <div class="row g-3">
            <div class="col-md-4">
              <label for="startDate" class="form-label">Fecha Inicio <span class="text-danger">*</span></label>
              <input type="date" class="form-control" id="startDate" v-model="reportsStore.filters.startDate">
            </div>
            <div class="col-md-4">
              <label for="endDate" class="form-label">Fecha Fin <span class="text-danger">*</span></label>
              <input type="date" class="form-control" id="endDate" v-model="reportsStore.filters.endDate">
            </div>
            <div class="col-md-4 d-flex align-items-end">
              <button class="btn btn-primary me-2" @click="handleFetchReportData" :disabled="reportsStore.loading">
                <span v-if="reportsStore.loading" class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                Aplicar Filtros
              </button>
              <button 
                class="btn btn-success" 
                @click="startExport" 
                :disabled="!habilitadoSwitchExcel || reportsStore.loading || reportsStore.reportData.length === 0"
                :title="!habilitadoSwitchExcel ? 'La descarga de reportes está disponible solo al finalizar el ciclo mensual' : 'Descargar reporte mensual'"
              >
                <i class="bi bi-file-earmark-excel"></i> Descargar Reporte Mensual
              </button>
            </div>
          </div>
          <div v-if="filterError" class="mt-2 text-danger">
            <small>{{ filterError }}</small>
          </div>
          <div v-if="reportsStore.error" class="mt-2 alert alert-warning p-2">
             <small><i class="bi bi-exclamation-triangle-fill"></i> {{ reportsStore.error }}</small>
          </div>
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="reportsStore.loading" class="text-center my-5">
        <div class="spinner-border text-primary" role="status">
          <span class="visually-hidden">Cargando datos del reporte...</span>
        </div>
        <p>Cargando datos del reporte...</p>
      </div>

      <!-- Report Data Table -->
      <div v-if="!reportsStore.loading && reportsStore.reportData.length > 0">
        <h4 class="mt-4">Detalle de Solicitudes</h4>
        <div class="table-responsive">
          <table class="table table-striped table-hover table-sm">
            <thead>
              <tr>
                <th>Nombre Usuario</th>
                <th>Sucursal</th>
                <th>Fecha Solicitud</th>
                <th>Teléfono</th>
                <th>Email</th>
                <th>Plan de Servicio</th>
                <th>Monto Solicitado</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in reportsStore.reportData" :key="item.raw_request.id">
                <td>{{ item.nombre }}</td>
                <td>{{ item.sucursal }}</td>
                <td>{{ item.fecha }}</td>
                <td>{{ item.telefono }}</td>
                <td>{{ item.email }}</td>
                <td>{{ item.plan }}</td>
                <td>${{ item.monto_solicitado?.toFixed(2) }}</td>
                <td><span :class="getStatusClass(item.estado)">{{ item.estado }}</span></td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Totals per User -->
        <h4 class="mt-5">Resumen: Totales por Usuario</h4>
         <div v-if="Object.keys(userTotals).length > 0" class="table-responsive">
          <table class="table table-bordered table-sm">
            <thead class="table-light">
              <tr>
                <th>Nombre Usuario</th>
                <th>Total Solicitado ($)</th>
                <th>Cantidad de Solicitudes</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(total, userId) in userTotals" :key="userId">
                <td>{{ total.userName }}</td>
                <td>${{ total.totalAmount?.toFixed(2) }}</td>
                <td>{{ total.requestCount }}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div v-else class="alert alert-light">
            No hay datos agregados para mostrar un resumen por usuario.
        </div>
      </div>

      <div v-if="!reportsStore.loading && reportsStore.reportData.length === 0 && !reportsStore.error && hasAppliedFilters" class="alert alert-info">
        No se encontraron solicitudes para los filtros seleccionados.
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useReportsStore } from '@/stores/reports'
import { useCompanyStore } from '@/stores/company'

const authStore = useAuthStore()
const reportsStore = useReportsStore()
const companyStore = useCompanyStore()

// State for Excel load status and validations
const ultimaCargaExcel = ref(null)
const mensajeImportante = ref('')
const claseImportante = ref('alert-primary')
const filterError = ref('')
const hasAppliedFilters = ref(false)
const habilitadoSwitch = ref(false)
const habilitadoSwitchExcel = ref(false)

// Company configuration
const configuracionEmpresa = computed(() => companyStore.currentCompany?.configuracion || {})

const canAccessPage = computed(() => {
  return authStore.isAuthenticated && (authStore.isEmpresa || authStore.isOperador)
})

const userTotals = computed(() => {
    return reportsStore.calculateUserTotals()
})

// Check if current date is within allowed period for operations
const verificarHabilitadoSwitch = () => {
  if (!configuracionEmpresa.value) return false
  
  const now = new Date()
  const currentDay = now.getDate()
  const { dia_inicio = 1, dia_cierre = 5, dia_bloqueo = 10 } = configuracionEmpresa.value
  
  // Check if current day is between dia_inicio and dia_cierre
  if (currentDay >= dia_inicio && currentDay <= dia_cierre) {
    habilitadoSwitch.value = true
    mensajeImportante.value = 'Período activo para cargar solicitudes.'
    claseImportante.value = 'alert-primary'
    return true
  } 
  // Check if in blocking period
  else if (currentDay > dia_cierre && currentDay <= dia_bloqueo) {
    habilitadoSwitch.value = false
    mensajeImportante.value = `Período de cierre. Próximo período inicia el día ${dia_inicio} del próximo mes.`
    claseImportante.value = 'alert-danger'
    return false
  } 
  // Outside blocking period but not in active period
  else {
    habilitadoSwitch.value = false
    mensajeImportante.value = 'Fuera del período de carga. Espere al próximo ciclo.'
    claseImportante.value = 'alert-warning'
    return false
  }
}

// Check if Excel export is enabled (only at the end of the month)
const verificarHabilitadoSwitchExcel = () => {
  if (!configuracionEmpresa.value) return false
  
  const now = new Date()
  const currentDay = now.getDate()
  const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
  
  // Enable Excel export in the last 3 days of the month
  habilitadoSwitchExcel.value = currentDay > (lastDayOfMonth - 3)
  return habilitadoSwitchExcel.value
}

// Format date for display
const formatDate = (dateString) => {
  if (!dateString) return 'Nunca'
  const options = { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }
  return new Date(dateString).toLocaleDateString('es-ES', options)
}

// Start Excel export process
const startExport = async () => {
  if (!habilitadoSwitchExcel.value) {
    alert('La descarga de reportes está disponible solo al finalizar el ciclo mensual.')
    return
  }
  
  try {
    await reportsStore.generateExcel()
    // After successful export, update last load date
    ultimaCargaExcel.value = new Date().toISOString()
  } catch (error) {
    console.error('Error al exportar el reporte:', error)
    mensajeImportante.value = 'Error al generar el reporte. Intente nuevamente.'
    claseImportante.value = 'alert-danger'
  }
}

// Initialize component
onMounted(async () => {
  if (canAccessPage.value) {
    await companyStore.fetchCompanyConfig()
    verificarHabilitadoSwitch()
    verificarHabilitadoSwitchExcel()
    
    // Set up monthly check
    setInterval(() => {
      verificarHabilitadoSwitch()
      verificarHabilitadoSwitchExcel()
    }, 3600000) // Check every hour
  }
})

// Client-side validation before hitting the store
const validateFilters = () => {
  filterError.value = '' // Reset previous error
  if (!reportsStore.filters.startDate || !reportsStore.filters.endDate) {
    filterError.value = 'Los campos Fecha Inicio y Fecha Fin son obligatorios.'
    return false
  }
  const startDate = new Date(reportsStore.filters.startDate)
  const endDate = new Date(reportsStore.filters.endDate)

  if (endDate < startDate) {
    filterError.value = 'La Fecha Fin no puede ser anterior a la Fecha Inicio.'
    return false
  }

  const diffTime = Math.abs(endDate - startDate)
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

  if (diffDays > 93) { // Approx 3 months (e.g., 31*3 = 93)
    filterError.value = 'El rango de fechas no puede exceder los 3 meses.'
    return false
  }
  return true
}

const handleFetchReportData = async () => {
  hasAppliedFilters.value = true;
  if (!validateFilters()) {
    reportsStore.reportData = [] // Clear data if filters are invalid
    return
  }
  await reportsStore.fetchReportData()
  // Error from store will be displayed via reportsStore.error
}

const getStatusClass = (status) => {
  switch (status) {
    case 'aprobado': return 'badge bg-success text-light';
    case 'pendiente': return 'badge bg-warning text-dark';
    case 'rechazado': return 'badge bg-danger text-light';
    case 'pagado': return 'badge bg-info text-light';
    default: return 'badge bg-secondary text-light';
  }
}

// Watch for filter changes to clear errors if user corrects them
watch(() => [reportsStore.filters.startDate, reportsStore.filters.endDate], () => {
  if (filterError.value) { // if there was a filter error
    validateFilters(); // re-validate to potentially clear it
  }
  // Also clear store error when filters change, as it might be related to old filter values
  if(reportsStore.error){
    reportsStore.error = null;
  }
});

</script>

<style scoped>
.reportes-view {
  max-width: 1200px;
  margin: auto;
}
.table-sm th, .table-sm td {
  padding: 0.4rem;
  font-size: 0.85rem;
}
.badge {
    font-size: 0.8em;
}
</style>
