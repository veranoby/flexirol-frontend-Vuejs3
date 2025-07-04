<template>
  <div class="container-fluid mt-4">
    <div class="card">
      <div class="card-header bg-primary text-white">
        <h4 class="mb-0">Gestión de Solicitudes</h4>
      </div>
      
      <div class="card-body">
        <ul class="nav nav-tabs" id="solicitudesTabs" role="tablist">
          <li class="nav-item" role="presentation">
            <button class="nav-link active" id="pendientes-tab" data-bs-toggle="tab" 
                    data-bs-target="#pendientes" type="button" role="tab"
                    @click="fetchPendientes">
              Pendientes
              <span v-if="solicitudesPendientes.length > 0" class="badge bg-danger ms-2">
                {{ solicitudesPendientes.length }}
              </span>
            </button>
          </li>
          <li class="nav-item" role="presentation">
            <button class="nav-link" id="procesando-tab" data-bs-toggle="tab" 
                    data-bs-target="#procesando" type="button" role="tab"
                    @click="fetchProcesando">
              En Proceso
              <span v-if="solicitudesProcesando.length > 0" class="badge bg-warning text-dark ms-2">
                {{ solicitudesProcesando.length }}
              </span>
            </button>
          </li>
          <li class="nav-item" role="presentation">
            <button class="nav-link" id="pagadas-tab" data-bs-toggle="tab" 
                    data-bs-target="#pagadas" type="button" role="tab"
                    @click="fetchPagadas">
              Pagadas
            </button>
          </li>
        </ul>
        
        <div class="tab-content p-3 border border-top-0 rounded-bottom">
          <!-- Tab Pendientes -->
          <div class="tab-pane fade show active" id="pendientes" role="tabpanel" aria-labelledby="pendientes-tab">
            <div class="d-flex justify-content-between align-items-center mb-3">
              <h5>Solicitudes Pendientes</h5>
              <button class="btn btn-success" @click="generarExcel" :disabled="selectedSolicitudes.length === 0 || excelLoading">
                <span v-if="excelLoading" class="spinner-border spinner-border-sm me-1"></span>
                {{ excelLoading ? 'Generando...' : 'Generar Excel Bancario' }}
              </button>
            </div>
            
            <div v-if="loading" class="text-center my-5">
              <div class="spinner-border text-primary" role="status">
                <span class="visually-hidden">Cargando...</span>
              </div>
              <p class="mt-2">Cargando solicitudes pendientes...</p>
            </div>
            
            <div v-else>
              <div class="table-responsive">
                <table class="table table-hover table-striped">
                  <thead class="table-light">
                    <tr>
                      <th width="50">
                        <input type="checkbox" class="form-check-input" 
                               :checked="selectedSolicitudes.length === solicitudesPendientes.length"
                               @change="toggleSelectAll">
                      </th>
                      <th># Solicitud</th>
                      <th>Fecha</th>
                      <th>Usuario</th>
                      <th>Banco</th>
                      <th>Cuenta</th>
                      <th class="text-end">Monto</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="solicitud in solicitudesPendientes" :key="solicitud.id">
                      <td>
                        <input type="checkbox" class="form-check-input" 
                               :checked="isSolicitudSelected(solicitud)"
                               @change="toggleSolicitud(solicitud, $event.target.checked)">
                      </td>
                      <td>{{ solicitud.id }}</td>
                      <td>{{ formatDate(solicitud.created) }}</td>
                      <td>{{ solicitud.nombre || 'N/A' }}</td>
                      <td>{{ solicitud.banco_nombre || 'N/A' }}</td>
                      <td>{{ solicitud.numero_cuenta || 'N/A' }}</td>
                      <td class="text-end">${{ formatNumber(solicitud.monto_solicitado) }}</td>
                      <td>
                        <button class="btn btn-sm btn-outline-primary" @click="verDetalle(solicitud)">
                          <i class="fas fa-eye"></i> Ver
                        </button>
                      </td>
                    </tr>
                    <tr v-if="solicitudesPendientes.length === 0">
                      <td colspan="8" class="text-center py-4">
                        No hay solicitudes pendientes
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
          
          <!-- Tab Procesando -->
          <div class="tab-pane fade" id="procesando" role="tabpanel" aria-labelledby="procesando-tab">
            <h5 class="mb-3">Solicitudes en Proceso</h5>
            
            <div v-if="loading" class="text-center my-5">
              <div class="spinner-border text-primary" role="status">
                <span class="visually-hidden">Cargando...</span>
              </div>
            </div>
            
            <div v-else class="table-responsive">
              <table class="table table-hover">
                <thead class="table-light">
                  <tr>
                    <th># Solicitud</th>
                    <th>Fecha</th>
                    <th>Usuario</th>
                    <th>Banco</th>
                    <th>Cuenta</th>
                    <th class="text-end">Monto</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="solicitud in solicitudesProcesando" :key="solicitud.id">
                    <td>{{ solicitud.id }}</td>
                    <td>{{ formatDate(solicitud.updated) }}</td>
                    <td>{{ solicitud.nombre || 'N/A' }}</td>
                    <td>{{ solicitud.banco_nombre || 'N/A' }}</td>
                    <td>{{ solicitud.numero_cuenta || 'N/A' }}</td>
                    <td class="text-end">${{ formatNumber(solicitud.monto_aprobado) }}</td>
                    <td>
                      <button class="btn btn-sm btn-success me-2" 
                              @click="confirmarPago(solicitud.id)">
                        <i class="fas fa-check"></i> Confirmar Pago
                      </button>
                      <button class="btn btn-sm btn-outline-secondary" 
                              @click="verDetalle(solicitud)">
                        <i class="fas fa-eye"></i>
                      </button>
                    </td>
                  </tr>
                  <tr v-if="solicitudesProcesando.length === 0">
                    <td colspan="7" class="text-center py-4">
                      No hay solicitudes en proceso
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
          
          <!-- Tab Pagadas -->
          <div class="tab-pane fade" id="pagadas" role="tabpanel" aria-labelledby="pagadas-tab">
            <h5 class="mb-3">Solicitudes Pagadas</h5>
            
            <div class="row mb-3">
              <div class="col-md-4">
                <div class="input-group">
                  <span class="input-group-text">
                    <i class="fas fa-search"></i>
                  </span>
                  <input type="text" class="form-control" placeholder="Buscar..." v-model="filters.search">
                </div>
              </div>
              <div class="col-md-3">
                <select class="form-select" v-model="filters.banco">
                  <option value="">Todos los bancos</option>
                  <option v-for="banco in bancos" :key="banco" :value="banco">{{ banco }}</option>
                </select>
              </div>
              <div class="col-md-3">
                <input type="date" class="form-control" v-model="filters.fecha">
              </div>
              <div class="col-md-2">
                <button class="btn btn-outline-secondary w-100" @click="resetFilters">
                  <i class="fas fa-sync"></i> Limpiar
                </button>
              </div>
            </div>
            
            <div v-if="loading" class="text-center my-5">
              <div class="spinner-border text-primary" role="status">
                <span class="visually-hidden">Cargando...</span>
              </div>
            </div>
            
            <div v-else class="table-responsive">
              <table class="table table-hover">
                <thead class="table-light">
                  <tr>
                    <th># Solicitud</th>
                    <th>Fecha Pago</th>
                    <th>Usuario</th>
                    <th>Empresa</th>
                    <th>Banco</th>
                    <th class="text-end">Monto</th>
                    <th>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="solicitud in solicitudesFiltradas" :key="solicitud.id">
                    <td>{{ solicitud.id }}</td>
                    <td>{{ formatDate(solicitud.fecha_pago) }}</td>
                    <td>{{ solicitud.nombre || 'N/A' }}</td>
                    <td>{{ solicitud.empresa_nombre || 'N/A' }}</td>
                    <td>{{ solicitud.banco_nombre || 'N/A' }}</td>
                    <td class="text-end">${{ formatNumber(solicitud.monto_aprobado) }}</td>
                    <td>
                      <span class="badge bg-success">Pagado</span>
                    </td>
                  </tr>
                  <tr v-if="solicitudesPagadas.length === 0">
                    <td colspan="7" class="text-center py-4">
                      No hay solicitudes pagadas
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useReportsStore } from '@/stores/reports'

const reportsStore = useReportsStore()

// State
const loading = ref(false)
const excelLoading = ref(false)
const filters = ref({
  search: '',
  banco: '',
  fecha: ''
})

// Computed
const {
  solicitudesPendientes,
  solicitudesProcesando,
  solicitudesPagadas,
  selectedSolicitudes
} = reportsStore

const bancos = [
  'Pacífico', 'Guayaquil', 'Pichincha', 'Produbanco',
  'Bolivariano', 'Internacional', 'Austro', 'Solidario'
]

const solicitudesFiltradas = computed(() => {
  return solicitudesPagadas.filter(sol => {
    const matchesSearch = !filters.value.search || 
      (sol.nombre && sol.nombre.toLowerCase().includes(filters.value.search.toLowerCase())) ||
      (sol.empresa_nombre && sol.empresa_nombre.toLowerCase().includes(filters.value.search.toLowerCase()))
    
    const matchesBanco = !filters.value.banco || 
      (sol.banco_nombre && sol.banco_nombre === filters.value.banco)
    
    const matchesFecha = !filters.value.fecha || 
      (sol.fecha_pago && sol.fecha_pago.startsWith(filters.value.fecha))
    
    return matchesSearch && matchesBanco && matchesFecha
  })
})

// Methods
const fetchPendientes = async () => {
  loading.value = true
  try {
    await reportsStore.fetchSolicitudesPendientes()
  } finally {
    loading.value = false
  }
}

const fetchProcesando = async () => {
  loading.value = true
  try {
    await reportsStore.fetchSolicitudesProcesando()
  } finally {
    loading.value = false
  }
}

const fetchPagadas = async () => {
  loading.value = true
  try {
    await reportsStore.fetchSolicitudesPagadas()
  } finally {
    loading.value = false
  }
}

const toggleSolicitud = (solicitud, isSelected) => {
  reportsStore.toggleSolicitudSelection(solicitud, isSelected)
}

const isSolicitudSelected = (solicitud) => {
  return reportsStore.isSolicitudSelected(solicitud)
}

const toggleSelectAll = (event) => {
  const isChecked = event.target.checked
  if (isChecked) {
    reportsStore.selectedSolicitudes = [...reportsStore.solicitudesPendientes]
  } else {
    reportsStore.selectedSolicitudes = []
  }
}

const generarExcel = async () => {
  if (reportsStore.selectedSolicitudes.length === 0) return
  
  const confirmar = window.confirm(`¿Generar archivo Excel para ${reportsStore.selectedSolicitudes.length} solicitudes seleccionadas?`)
  if (!confirmar) return
  
  excelLoading.value = true
  try {
    const success = await reportsStore.generateBankingExcel(reportsStore.selectedSolicitudes)
    if (success) {
      // Clear selection after successful export
      reportsStore.selectedSolicitudes = []
    }
  } finally {
    excelLoading.value = false
  }
}

const confirmarPago = async (solicitudId) => {
  if (!confirm('¿Confirmar que se ha realizado el pago de esta solicitud?')) return
  
  loading.value = true
  try {
    const success = await reportsStore.confirmarAnticipo(solicitudId)
    if (success) {
      // Refresh both processing and paid lists
      await Promise.all([fetchProcesando(), fetchPagadas()])
    }
  } finally {
    loading.value = false
  }
}

const verDetalle = (solicitud) => {
  // TODO: Implementar vista detallada de la solicitud
  alert(`Detalle de la solicitud #${solicitud.id}`)
}

const resetFilters = () => {
  filters.value = {
    search: '',
    banco: '',
    fecha: ''
  }
}

const formatDate = (dateString) => {
  if (!dateString) return 'N/A'
  const date = new Date(dateString)
  return date.toLocaleDateString('es-EC', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const formatNumber = (value) => {
  if (value === undefined || value === null) return '0.00'
  return parseFloat(value).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",")
}

// Lifecycle
onMounted(() => {
  // Load initial data
  fetchPendientes()
})
</script>

<style scoped>
.nav-tabs .nav-link {
  font-weight: 500;
}

.table th {
  white-space: nowrap;
}

.badge {
  font-size: 0.8em;
}

.form-check-input {
  margin-left: 0;
}
</style>