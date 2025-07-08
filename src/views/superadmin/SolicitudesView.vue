<template>
  <v-container fluid class="mt-4">
    <v-card>
      <v-card-title class="bg-primary text-white">
        <h4 class="mb-0">Gestión de Solicitudes</h4>
      </v-card-title>
      
      <v-card-text>
        <v-tabs v-model="currentTab" color="primary">
          <v-tab value="pendientes" @click="fetchPendientes">
            Pendientes
            <v-chip v-if="solicitudesPendientes.length > 0" color="error" size="small" class="ms-2">
              {{ solicitudesPendientes.length }}
            </v-chip>
          </v-tab>
          <v-tab value="procesando" @click="fetchProcesando">
            En Proceso
            <v-chip v-if="solicitudesProcesando.length > 0" color="warning" size="small" class="ms-2">
              {{ solicitudesProcesando.length }}
            </v-chip>
          </v-tab>
          <v-tab value="pagadas" @click="fetchPagadas">
            Pagadas
          </v-tab>
        </v-tabs>
        
        <v-card-text class="pa-0">
          <v-tabs-window v-model="currentTab">
            <!-- Tab Pendientes -->
            <v-tabs-window-item value="pendientes">
              <div class="d-flex justify-space-between align-center mb-3">
                <h5>Solicitudes Pendientes</h5>
                <v-btn
                  color="success"
                  @click="generarExcel"
                  :disabled="selectedSolicitudes.length === 0 || excelLoading"
                  :loading="excelLoading"
                >
                  {{ excelLoading ? 'Generando...' : 'Generar Excel Bancario' }}
                </v-btn>
              </div>
              
              <div v-if="loading" class="text-center my-5">
                <v-progress-circular
                  indeterminate
                  color="primary"
                  size="40"
                ></v-progress-circular>
                <p class="mt-2">Cargando solicitudes pendientes...</p>
              </div>
              
              <div v-else>
                <v-card>
                  <v-table>
                    <thead>
                      <tr>
                        <th width="50">
                          <v-checkbox
                            :model-value="selectedSolicitudes.length === solicitudesPendientes.length"
                            @update:model-value="toggleSelectAll"
                          ></v-checkbox>
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
                          <v-checkbox
                            :model-value="isSolicitudSelected(solicitud)"
                            @update:model-value="(value) => toggleSolicitud(solicitud, value)"
                          ></v-checkbox>
                        </td>
                        <td>{{ solicitud.id }}</td>
                        <td>{{ formatDate(solicitud.created) }}</td>
                        <td>{{ solicitud.nombre || 'N/A' }}</td>
                        <td>{{ solicitud.banco_nombre || 'N/A' }}</td>
                        <td>{{ solicitud.numero_cuenta || 'N/A' }}</td>
                        <td class="text-end">${{ formatNumber(solicitud.monto_solicitado) }}</td>
                        <td>
                          <v-btn
                            size="small"
                            variant="outlined"
                            color="primary"
                            @click="verDetalle(solicitud)"
                          >
                            <v-icon left>mdi-eye</v-icon>
                            Ver
                          </v-btn>
                        </td>
                      </tr>
                      <tr v-if="solicitudesPendientes.length === 0">
                        <td colspan="8" class="text-center py-4">
                          No hay solicitudes pendientes
                        </td>
                      </tr>
                    </tbody>
                  </v-table>
                </v-card>
              </div>
            </v-tabs-window-item>
          
            <!-- Tab Procesando -->
            <v-tabs-window-item value="procesando">
              <h5 class="mb-3">Solicitudes en Proceso</h5>
              
              <div v-if="loading" class="text-center my-5">
                <v-progress-circular
                  indeterminate
                  color="primary"
                  size="40"
                ></v-progress-circular>
              </div>
              
              <div v-else>
                <v-card>
                  <v-table>
                    <thead>
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
                          <v-btn
                            size="small"
                            color="success"
                            class="mr-2"
                            @click="confirmarPago(solicitud.id)"
                          >
                            <v-icon left>mdi-check</v-icon>
                            Confirmar Pago
                          </v-btn>
                          <v-btn
                            size="small"
                            variant="outlined"
                            color="secondary"
                            @click="verDetalle(solicitud)"
                          >
                            <v-icon>mdi-eye</v-icon>
                          </v-btn>
                        </td>
                      </tr>
                      <tr v-if="solicitudesProcesando.length === 0">
                        <td colspan="7" class="text-center py-4">
                          No hay solicitudes en proceso
                        </td>
                      </tr>
                    </tbody>
                  </v-table>
                </v-card>
              </div>
            </v-tabs-window-item>
            
            <!-- Tab Pagadas -->
            <v-tabs-window-item value="pagadas">
              <h5 class="mb-3">Solicitudes Pagadas</h5>
              
              <v-row class="mb-3">
                <v-col md="4">
                  <v-text-field
                    v-model="filters.search"
                    label="Buscar"
                    prepend-inner-icon="mdi-magnify"
                    clearable
                  ></v-text-field>
                </v-col>
                <v-col md="3">
                  <v-select
                    v-model="filters.banco"
                    :items="bancos"
                    label="Todos los bancos"
                    clearable
                  ></v-select>
                </v-col>
                <v-col md="3">
                  <v-text-field
                    v-model="filters.fecha"
                    type="date"
                    label="Fecha"
                  ></v-text-field>
                </v-col>
                <v-col md="2">
                  <v-btn
                    variant="outlined"
                    color="secondary"
                    block
                    @click="resetFilters"
                  >
                    <v-icon left>mdi-refresh</v-icon>
                    Limpiar
                  </v-btn>
                </v-col>
              </v-row>
              
              <div v-if="loading" class="text-center my-5">
                <v-progress-circular
                  indeterminate
                  color="primary"
                  size="40"
                ></v-progress-circular>
              </div>
              
              <div v-else>
                <v-card>
                  <v-table>
                    <thead>
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
                          <v-chip color="success" size="small">Pagado</v-chip>
                        </td>
                      </tr>
                      <tr v-if="solicitudesPagadas.length === 0">
                        <td colspan="7" class="text-center py-4">
                          No hay solicitudes pagadas
                        </td>
                      </tr>
                    </tbody>
                  </v-table>
                </v-card>
              </div>
            </v-tabs-window-item>
          </v-tabs-window>
        </v-card-text>
      </v-card-text>
    </v-card>
  </v-container>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useReportsStore } from '@/stores/reports'

const reportsStore = useReportsStore()

// State
const loading = ref(false)
const excelLoading = ref(false)
const currentTab = ref('pendientes')
const filters = ref({
  search: '',
  banco: '',
  fecha: ''
})

// Computed
const solicitudesPendientes = computed(() => reportsStore.solicitudesPendientes)
const solicitudesProcesando = computed(() => reportsStore.solicitudesProcesando)
const solicitudesPagadas = computed(() => reportsStore.solicitudesPagadas)
const selectedSolicitudes = computed(() => reportsStore.selectedSolicitudes)

const bancos = [
  'Pacífico', 'Guayaquil', 'Pichincha', 'Produbanco',
  'Bolivariano', 'Internacional', 'Austro', 'Solidario'
]

const solicitudesFiltradas = computed(() => {
  return solicitudesPagadas.value.filter(sol => {
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