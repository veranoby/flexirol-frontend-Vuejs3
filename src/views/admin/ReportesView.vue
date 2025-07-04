<template>
  <div class="container mt-4 reportes-view">
    <h3 class="mb-3">Reporte de Anticipos</h3>

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
              <button class="btn btn-success" @click="handleExportExcel" :disabled="reportsStore.loading || reportsStore.reportData.length === 0">
                <i class="bi bi-file-earmark-excel"></i> Exportar a Excel
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
import { ref, computed, watch } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useReportsStore } from '@/stores/reports'

const authStore = useAuthStore()
const reportsStore = useReportsStore()

const filterError = ref('')
const hasAppliedFilters = ref(false) // To track if filters have been applied at least once

const canAccessPage = computed(() => {
  return authStore.isAuthenticated && (authStore.isEmpresa || authStore.isOperador)
})

const userTotals = computed(() => {
    return reportsStore.calculateUserTotals()
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

const handleExportExcel = () => {
  if (!canAccessPage.value) {
      alert("No tiene permisos para exportar.");
      return;
  }
  if (reportsStore.reportData.length === 0) {
    alert('No hay datos para exportar. Por favor, aplique filtros y obtenga datos primero.');
    return;
  }
  // Additional check (though store also does it)
  if (!reportsStore.filters.startDate || !reportsStore.filters.endDate) {
     filterError.value = 'El filtro de fecha es obligatorio para exportar.';
     return;
  }
  reportsStore.generateExcel()
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
