<template>
  <div class="solicitudes-view">
    <!-- Loading Spinner -->
    <div v-if="loading" class="d-flex justify-center my-5">
      <v-progress-circular indeterminate color="primary" size="40"></v-progress-circular>
      <span class="ml-3">Cargando...</span>
    </div>

    <!-- Main Content -->
    <v-container v-else fluid>
      <!-- Dynamic Header -->
      <v-row class="mb-4">
        <v-col cols="12">
          <h2 class="mb-1">
            <v-icon :class="roleIcon" class="me-2"></v-icon>
            {{ pageTitle }}
          </h2>
          <p class="text-medium-emphasis">{{ pageDescription }}</p>
        </v-col>
      </v-row>

      <!-- Action Bar -->
      <v-row class="mb-4">
        <v-col md="8">
          <!-- Advanced Filters (Superadmin/Operador) -->
          <v-row v-if="canProcessRequests">
            <v-col md="3">
              <v-select
                v-model="filters.estado"
                :items="[
                  { title: 'Todos', value: '' },
                  { title: 'Pendientes', value: 'pendiente' },
                  { title: 'Aprobados', value: 'aprobado' },
                  { title: 'Rechazados', value: 'rechazado' },
                  { title: 'Pagados', value: 'pagado' },
                ]"
                label="Estado"
                clearable
              ></v-select>
            </v-col>
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
                label="Fecha desde"
              ></v-text-field>
            </v-col>
            <v-col md="3">
              <v-text-field
                v-model="filters.fechaHasta"
                type="date"
                label="Fecha hasta"
              ></v-text-field>
            </v-col>
          </v-row>

          <!-- Simple Search (Usuario) -->
          <v-row v-else>
            <v-col md="6">
              <v-text-field
                v-model="searchTerm"
                label="Buscar mis solicitudes"
                placeholder="Buscar por monto o estado..."
                prepend-inner-icon="mdi-magnify"
                clearable
              ></v-text-field>
            </v-col>
            <v-col md="3">
              <v-select
                v-model="filters.estado"
                :items="[
                  { title: 'Todos', value: '' },
                  { title: 'Pendientes', value: 'pendiente' },
                  { title: 'Aprobados', value: 'aprobado' },
                  { title: 'Rechazados', value: 'rechazado' },
                  { title: 'Pagados', value: 'pagado' },
                ]"
                label="Estado"
                clearable
              ></v-select>
            </v-col>
          </v-row>
        </v-col>

        <!-- Action Buttons -->
        <v-col md="4" class="text-end">
          <v-btn
            v-if="canCreateRequests"
            color="success"
            class="me-2"
            @click="openCreateRequestModal"
          >
            <v-icon left>mdi-plus</v-icon>
            Nueva Solicitud
          </v-btn>
          <v-btn-group v-if="canProcessRequests">
            <v-btn color="primary" @click="refreshRequests">
              <v-icon left>mdi-refresh</v-icon>
              Actualizar
            </v-btn>
            <v-btn variant="outlined" color="primary" @click="exportToExcel">
              <v-icon left>mdi-file-excel</v-icon>
              Excel
            </v-btn>
          </v-btn-group>
        </v-col>
      </v-row>

      <!-- Stats Cards -->
      <v-row class="mb-4">
        <v-col md="3">
          <v-card color="warning" dark>
            <v-card-text>
              <h6>Pendientes</h6>
              <h3>{{ stats.pendientes }}</h3>
            </v-card-text>
          </v-card>
        </v-col>
        <v-col md="3">
          <v-card color="success" dark>
            <v-card-text>
              <h6>Aprobadas</h6>
              <h3>{{ stats.aprobadas }}</h3>
            </v-card-text>
          </v-card>
        </v-col>
        <v-col md="3">
          <v-card color="info" dark>
            <v-card-text>
              <h6>Pagadas</h6>
              <h3>{{ stats.pagadas }}</h3>
            </v-card-text>
          </v-card>
        </v-col>
        <v-col md="3">
          <v-card color="primary" dark>
            <v-card-text>
              <h6>Total Monto</h6>
              <h3>${{ stats.totalMonto.toLocaleString() }}</h3>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>

      <!-- Requests Table -->
      <v-row>
        <v-col cols="12">
          <v-card>
            <v-card-title class="d-flex justify-space-between align-center">
              <div>
                <v-icon class="me-2">mdi-file-document-multiple</v-icon>
                {{ tableTitle }} ({{ filteredRequests.length }})
              </div>
              <div class="d-flex ga-2">
                <v-btn
                  v-if="canProcessRequests"
                  size="small"
                  variant="outlined"
                  color="success"
                  @click="approveSelected"
                  :disabled="selectedRequests.length === 0"
                >
                  <v-icon left>mdi-check</v-icon>
                  Aprobar Seleccionados
                </v-btn>
                <v-btn size="small" variant="outlined" color="secondary" @click="clearFilters">
                  <v-icon left>mdi-filter-remove</v-icon>
                  Limpiar Filtros
                </v-btn>
              </div>
            </v-card-title>

            <v-card-text class="pa-0">
              <div v-if="filteredRequests.length === 0" class="text-center py-5">
                <v-icon size="48" class="text-medium-emphasis mb-3"
                  >mdi-file-document-multiple</v-icon
                >
                <p class="text-medium-emphasis">{{ emptyMessage }}</p>
              </div>

              <div v-else>
                <v-table>
                  <thead>
                    <tr>
                      <th v-if="canProcessRequests" width="40">
                        <v-checkbox v-model="selectAll" @change="toggleSelectAll"></v-checkbox>
                      </th>
                      <th>Usuario</th>
                      <th v-if="showCompanyColumn">Empresa</th>
                      <th>Monto</th>
                      <th>Estado</th>
                      <th>Fecha Solicitud</th>
                      <th>Banco Destino</th>
                      <th v-if="canProcessRequests">Procesado Por</th>
                      <th width="150">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="request in paginatedRequests" :key="request.id">
                      <td v-if="canProcessRequests">
                        <v-checkbox v-model="selectedRequests" :value="request.id"></v-checkbox>
                      </td>
                      <td>
                        <div class="d-flex align-center">
                          <v-avatar size="32" color="primary" class="me-2">
                            <span class="text-white">{{ getUserInitials(request.user) }}</span>
                          </v-avatar>
                          <div>
                            <div class="font-weight-medium">
                              {{ request.user?.first_name }} {{ request.user?.last_name }}
                            </div>
                            <small class="text-medium-emphasis">{{ request.user?.cedula }}</small>
                          </div>
                        </div>
                      </td>
                      <td v-if="showCompanyColumn">
                        <span v-if="request.empresa">{{ request.empresa.first_name }}</span>
                        <span v-else class="text-medium-emphasis">N/A</span>
                      </td>
                      <td>
                        <span class="font-weight-bold">
                          ${{ request.monto_solicitado.toLocaleString() }}
                        </span>
                        <div
                          v-if="
                            request.monto_aprobado &&
                            request.monto_aprobado !== request.monto_solicitado
                          "
                          class="text-caption text-medium-emphasis"
                        >
                          Aprobado: ${{ request.monto_aprobado.toLocaleString() }}
                        </div>
                      </td>
                      <td>
                        <v-chip :color="getStatusBadgeColor(request.estado)" size="small">
                          {{ getStatusLabel(request.estado) }}
                        </v-chip>
                      </td>
                      <td>
                        <span>{{ formatDate(request.fecha_solicitud) }}</span>
                        <div class="text-caption text-medium-emphasis">
                          {{ formatTime(request.fecha_solicitud) }}
                        </div>
                      </td>
                      <td>
                        <span v-if="request.banco_destino">
                          {{ request.banco_destino.banco_nombre }}
                        </span>
                        <span v-else class="text-medium-emphasis">Sin especificar</span>
                      </td>
                      <td v-if="canProcessRequests">
                        <span v-if="request.procesado_por" class="text-caption">
                          {{ request.procesado_por.first_name }}
                        </span>
                        <span v-else class="text-medium-emphasis text-caption">Pendiente</span>
                      </td>
                      <td>
                        <v-btn-group size="small">
                          <v-btn
                            variant="outlined"
                            color="info"
                            @click="viewRequest(request)"
                            title="Ver detalles"
                          >
                            <v-icon>mdi-eye</v-icon>
                          </v-btn>
                          <v-btn
                            v-if="canProcessRequests && request.estado === 'pendiente'"
                            variant="outlined"
                            color="success"
                            @click="approveRequest(request)"
                            title="Aprobar"
                          >
                            <v-icon>mdi-check</v-icon>
                          </v-btn>
                          <v-btn
                            v-if="canProcessRequests && request.estado === 'pendiente'"
                            variant="outlined"
                            color="error"
                            @click="rejectRequest(request)"
                            title="Rechazar"
                          >
                            <v-icon>mdi-close</v-icon>
                          </v-btn>
                          <v-btn
                            v-if="
                              canDeleteRequests &&
                              ['pendiente', 'rechazado'].includes(request.estado)
                            "
                            variant="outlined"
                            color="error"
                            @click="deleteRequest(request)"
                            title="Eliminar"
                          >
                            <v-icon>mdi-delete</v-icon>
                          </v-btn>
                        </v-btn-group>
                      </td>
                    </tr>
                  </tbody>
                </v-table>
              </div>

              <!-- Pagination -->
              <div v-if="totalPages > 1" class="d-flex justify-space-between align-center pa-3">
                <div class="text-medium-emphasis">
                  Mostrando {{ (currentPage - 1) * itemsPerPage + 1 }} a
                  {{ Math.min(currentPage * itemsPerPage, filteredRequests.length) }}
                  de {{ filteredRequests.length }} solicitudes
                </div>
                <v-pagination
                  v-model="currentPage"
                  :length="totalPages"
                  :total-visible="5"
                  size="small"
                ></v-pagination>
              </div>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
    </v-container>

    <!-- MODAL: Crear Solicitud -->
    <v-dialog
      v-if="canCreateRequests"
      v-model="showCreateRequestModal"
      max-width="500px"
      persistent
    >
      <v-card class="glass-morphism">
        <v-card-title>
          <v-icon class="me-2">mdi-plus</v-icon>
          Nueva Solicitud de Adelanto
          <v-spacer></v-spacer>
          <v-btn icon @click="showCreateRequestModal = false">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-card-title>

        <v-form @submit.prevent="handleCreateRequest">
          <v-card-text>
            <v-row>
              <v-col cols="12">
                <v-text-field
                  v-model.number="requestForm.monto_solicitado"
                  label="Monto Solicitado *"
                  type="number"
                  prefix="$"
                  :max="maxAvailableAmount"
                  min="1"
                  step="0.01"
                  required
                  :hint="`Disponible: $${maxAvailableAmount.toLocaleString()}`"
                  persistent-hint
                ></v-text-field>
              </v-col>

              <v-col cols="12">
                <v-select
                  v-model="requestForm.banco_destino_id"
                  label="Banco Destino *"
                  :items="userBankAccounts"
                  item-title="banco_nombre"
                  item-value="id"
                  required
                >
                  <template #item="{ props, item }">
                    <v-list-item v-bind="props">
                      <v-list-item-title>{{ item.raw.banco_nombre }}</v-list-item-title>
                      <v-list-item-subtitle>{{ item.raw.numero_cuenta }}</v-list-item-subtitle>
                    </v-list-item>
                  </template>
                </v-select>
              </v-col>

              <v-col cols="12">
                <v-textarea
                  v-model="requestForm.motivo"
                  label="Motivo (Opcional)"
                  rows="3"
                  placeholder="Describe brevemente el motivo de la solicitud..."
                ></v-textarea>
              </v-col>
            </v-row>
          </v-card-text>

          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn variant="outlined" @click="showCreateRequestModal = false"> Cancelar </v-btn>
            <v-btn
              type="submit"
              color="primary"
              :loading="submitting"
              :disabled="!isCreateFormValid || submitting"
            >
              Crear Solicitud
            </v-btn>
          </v-card-actions>
        </v-form>
      </v-card>
    </v-dialog>

    <!-- MODAL: Procesar Solicitud -->
    <v-dialog
      v-if="canProcessRequests"
      v-model="showProcessRequestModal"
      max-width="500px"
      persistent
    >
      <v-card class="glass-morphism">
        <v-card-title>
          <v-icon class="me-2">mdi-cog</v-icon>
          Procesar Solicitud
          <v-spacer></v-spacer>
          <v-btn icon @click="showProcessRequestModal = false">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-card-title>

        <v-form @submit.prevent="handleProcessRequest">
          <v-card-text>
            <v-row v-if="selectedRequest">
              <!-- Request Info -->
              <v-col cols="12">
                <v-alert type="info" variant="tonal">
                  <strong>
                    {{ selectedRequest.user?.first_name }}
                    {{ selectedRequest.user?.last_name }} </strong
                  ><br />
                  Monto solicitado:
                  <strong>${{ selectedRequest.monto_solicitado.toLocaleString() }}</strong>
                </v-alert>
              </v-col>

              <v-col cols="12">
                <v-select
                  v-model="processForm.accion"
                  label="Acción *"
                  :items="[
                    { title: 'Aprobar', value: 'aprobar' },
                    { title: 'Rechazar', value: 'rechazar' },
                  ]"
                  required
                ></v-select>
              </v-col>

              <v-col v-if="processForm.accion === 'aprobar'" cols="12">
                <v-text-field
                  v-model.number="processForm.monto_aprobado"
                  label="Monto Aprobado *"
                  type="number"
                  prefix="$"
                  :max="selectedRequest?.monto_solicitado"
                  min="1"
                  step="0.01"
                  required
                ></v-text-field>
              </v-col>

              <v-col cols="12">
                <v-textarea
                  v-model="processForm.observaciones"
                  :label="
                    processForm.accion === 'rechazar' ? 'Motivo del Rechazo *' : 'Observaciones'
                  "
                  rows="3"
                  :required="processForm.accion === 'rechazar'"
                  :placeholder="
                    processForm.accion === 'rechazar'
                      ? 'Explica el motivo del rechazo...'
                      : 'Observaciones adicionales...'
                  "
                ></v-textarea>
              </v-col>
            </v-row>
          </v-card-text>

          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn variant="outlined" @click="showProcessRequestModal = false"> Cancelar </v-btn>
            <v-btn
              type="submit"
              :color="processForm.accion === 'aprobar' ? 'success' : 'error'"
              :loading="submitting"
              :disabled="!isProcessFormValid || submitting"
            >
              {{ processForm.accion === 'aprobar' ? 'Aprobar' : 'Rechazar' }} Solicitud
            </v-btn>
          </v-card-actions>
        </v-form>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useUserAdvanceRequestsStore } from '@/stores/userAdvanceRequests'
import { useCompaniesStore } from '@/stores/companies'
import { useBankAccountsStore } from '@/stores/bankAccounts'
import * as XLSX from 'xlsx'
import { useToastSystem } from '@/stores/system'

// Stores
const authStore = useAuthStore()
const requestsStore = useUserAdvanceRequestsStore()
const companiesStore = useCompaniesStore()
const bankAccountsStore = useBankAccountsStore()
const { showToast } = useToastSystem()

// State
const loading = ref(false)
const submitting = ref(false)

// Modal state
const showCreateRequestModal = ref(false)
const showProcessRequestModal = ref(false)

// Filters & Search
const filters = ref({
  estado: '',
  empresa_id: '',
  fechaDesde: '',
  fechaHasta: '',
})
const searchTerm = ref('')

// Selection
const selectedRequests = ref([])
const selectAll = ref(false)

// Forms
const requestForm = ref({
  monto_solicitado: null,
  banco_destino_id: '',
  motivo: '',
})

const processForm = ref({
  accion: '',
  monto_aprobado: null,
  observaciones: '',
})

const selectedRequest = ref(null)

// Data
const requests = ref([])
const availableCompanies = ref([])
const userBankAccounts = ref([])

// Pagination
const currentPage = ref(1)
const itemsPerPage = 20

// Computed Properties

// Role-based UI
const roleIcon = computed(() => {
  if (authStore.isSuperadmin) return 'fas fa-crown text-warning'
  if (authStore.isEmpresa || authStore.isOperador) return 'fas fa-cogs text-primary'
  return 'fas fa-hand-holding-usd text-info'
})

const pageTitle = computed(() => {
  if (authStore.isSuperadmin) return 'Gestión Global de Solicitudes'
  if (authStore.isEmpresa || authStore.isOperador) return 'Gestión de Solicitudes'
  return 'Mis Solicitudes de Adelanto'
})

const pageDescription = computed(() => {
  if (authStore.isSuperadmin) return 'Administra todas las solicitudes del sistema'
  if (authStore.isEmpresa || authStore.isOperador) return 'Procesa las solicitudes de adelantos'
  return 'Solicita adelantos de salario y consulta su estado'
})

const tableTitle = computed(() => {
  if (authStore.isUsuario) return 'Mis Solicitudes'
  return 'Solicitudes de Adelanto'
})

// Permissions
const canCreateRequests = computed(() => authStore.isUsuario)
const canProcessRequests = computed(() => authStore.isSuperadmin || authStore.isOperador)
const canDeleteRequests = computed(() => authStore.isSuperadmin)

// Table columns visibility
const showCompanyColumn = computed(() => authStore.isSuperadmin && !filters.value.empresa_id)

// User data
const maxAvailableAmount = computed(() => authStore.user?.disponible || 0)

// Filtering
const filteredRequests = computed(() => {
  let filtered = [...requests.value]

  // Role-based filtering
  if (authStore.isUsuario) {
    filtered = filtered.filter((req) => req.user_id === authStore.user.id)
  } else if (authStore.isEmpresa) {
    filtered = filtered.filter((req) => req.empresa_id === authStore.user.id)
  }

  // Apply filters
  if (filters.value.estado) {
    filtered = filtered.filter((req) => req.estado === filters.value.estado)
  }
  if (filters.value.empresa_id) {
    filtered = filtered.filter((req) => req.empresa_id === filters.value.empresa_id)
  }
  if (filters.value.fechaDesde) {
    filtered = filtered.filter(
      (req) => new Date(req.fecha_solicitud) >= new Date(filters.value.fechaDesde),
    )
  }
  if (filters.value.fechaHasta) {
    filtered = filtered.filter(
      (req) => new Date(req.fecha_solicitud) <= new Date(filters.value.fechaHasta),
    )
  }
  if (searchTerm.value) {
    const search = searchTerm.value.toLowerCase()
    filtered = filtered.filter(
      (req) =>
        req.monto_solicitado.toString().includes(search) ||
        req.estado.toLowerCase().includes(search) ||
        req.user?.first_name?.toLowerCase().includes(search) ||
        req.user?.last_name?.toLowerCase().includes(search),
    )
  }

  return filtered
})

// Pagination
const totalPages = computed(() => Math.ceil(filteredRequests.value.length / itemsPerPage))

const paginatedRequests = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage
  const end = start + itemsPerPage
  return filteredRequests.value.slice(start, end)
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

// Stats
const stats = computed(() => {
  const targetRequests = filteredRequests.value
  return {
    pendientes: targetRequests.filter((r) => r.estado === 'pendiente').length,
    aprobadas: targetRequests.filter((r) => r.estado === 'aprobado').length,
    pagadas: targetRequests.filter((r) => r.estado === 'pagado').length,
    totalMonto: targetRequests.reduce((sum, r) => sum + r.monto_solicitado, 0),
  }
})

// Form validation
const isCreateFormValid = computed(() => {
  return (
    requestForm.value.monto_solicitado > 0 &&
    requestForm.value.monto_solicitado <= maxAvailableAmount.value &&
    requestForm.value.banco_destino_id
  )
})

const isProcessFormValid = computed(() => {
  if (!processForm.value.accion) return false
  if (processForm.value.accion === 'aprobar') {
    return (
      processForm.value.monto_aprobado > 0 &&
      processForm.value.monto_aprobado <= selectedRequest.value?.monto_solicitado
    )
  }
  if (processForm.value.accion === 'rechazar') {
    return processForm.value.observaciones.trim().length > 0
  }
  return false
})

const emptyMessage = computed(() => {
  if (searchTerm.value || Object.values(filters.value).some((f) => f)) {
    return 'No se encontraron solicitudes con esos criterios'
  }
  if (authStore.isUsuario) return 'No has creado solicitudes aún'
  return 'No hay solicitudes para mostrar'
})

// Methods

// Data loading
const loadRequests = async () => {
  loading.value = true
  try {
    await requestsStore.fetchUserRequests(authStore.user.id, currentPage.value)
    requests.value = requestsStore.userRequests || []
  } catch (error) {
    console.error('Error loading requests:', error)
    showToast('Error al cargar solicitudes', 'danger')
  } finally {
    loading.value = false
  }
}

const loadCompanies = async () => {
  if (!authStore.isSuperadmin) return

  try {
    const result = await companiesStore.fetchCompanies()
    availableCompanies.value = result.items || []
  } catch (error) {
    console.error('Error loading companies:', error)
  }
}

const loadUserBankAccounts = async () => {
  if (!authStore.isUsuario) return

  try {
    await bankAccountsStore.fetchBankAccounts(authStore.user.id)
    userBankAccounts.value = bankAccountsStore.activeBankAccounts
  } catch (error) {
    console.error('Error loading bank accounts:', error)
  }
}

// Request actions
const openCreateRequestModal = () => {
  resetRequestForm()
  showCreateRequestModal.value = true
}

const handleCreateRequest = async () => {
  submitting.value = true
  try {
    const requestData = {
      ...requestForm.value,
      user_id: authStore.user.id,
      empresa_id: authStore.user.empresa_id,
    }

    await requestsStore.createRequest(requestData)
    showToast('Solicitud creada exitosamente', 'success')
    showCreateRequestModal.value = false
    await loadRequests()
  } catch (error) {
    console.error('Error creating request:', error)
    showToast(error.message || 'Error al crear solicitud', 'danger')
  } finally {
    submitting.value = false
  }
}

const approveRequest = (request) => {
  selectedRequest.value = request
  processForm.value.accion = 'aprobar'
  processForm.value.monto_aprobado = request.monto_solicitado
  processForm.value.observaciones = ''
  showProcessRequestModal.value = true
}

const rejectRequest = (request) => {
  selectedRequest.value = request
  processForm.value.accion = 'rechazar'
  processForm.value.monto_aprobado = null
  processForm.value.observaciones = ''
  showProcessRequestModal.value = true
}

const handleProcessRequest = async () => {
  submitting.value = true
  try {
    const updateData = {
      estado: processForm.value.accion === 'aprobar' ? 'aprobado' : 'rechazado',
      procesado_por: authStore.user.id,
      fecha_procesamiento: new Date().toISOString(),
      observaciones: processForm.value.observaciones,
    }

    if (processForm.value.accion === 'aprobar') {
      updateData.monto_aprobado = processForm.value.monto_aprobado
    }

    await requestsStore.updateRequest(selectedRequest.value.id, updateData)
    showToast(
      `Solicitud ${processForm.value.accion === 'aprobar' ? 'aprobada' : 'rechazada'} exitosamente`,
      'success',
    )
    showProcessRequestModal.value = false
    await loadRequests()
  } catch (error) {
    console.error('Error processing request:', error)
    showToast(error.message || 'Error al procesar solicitud', 'danger')
  } finally {
    submitting.value = false
  }
}

const approveSelected = async () => {
  if (selectedRequests.value.length === 0) return

  try {
    for (const requestId of selectedRequests.value) {
      const request = requests.value.find((r) => r.id === requestId)
      if (request && request.estado === 'pendiente') {
        await requestsStore.updateRequest(requestId, {
          estado: 'aprobado',
          monto_aprobado: request.monto_solicitado,
          procesado_por: authStore.user.id,
          fecha_procesamiento: new Date().toISOString(),
        })
      }
    }

    showToast(`${selectedRequests.value.length} solicitudes aprobadas`, 'success')
    selectedRequests.value = []
    selectAll.value = false
    await loadRequests()
  } catch (error) {
    console.error('Error approving requests:', error)
    showToast('Error al aprobar solicitudes', 'danger')
  }
}

const deleteRequest = async (request) => {
  if (!confirm('¿Está seguro de eliminar esta solicitud?')) return

  try {
    await requestsStore.deleteRequest(request.id)
    showToast('Solicitud eliminada exitosamente', 'success')
    await loadRequests()
  } catch (error) {
    console.error('Error deleting request:', error)
    showToast('Error al eliminar solicitud', 'danger')
  }
}

const viewRequest = (request) => {
  // TODO: Implement view details modal
  console.log('View request details:', request)
}

// Utility methods
const refreshRequests = async () => {
  await loadRequests()
  showToast('Lista actualizada', 'info')
}

const clearFilters = () => {
  filters.value = {
    estado: '',
    empresa_id: '',
    fechaDesde: '',
    fechaHasta: '',
  }
  searchTerm.value = ''
  currentPage.value = 1
}

const toggleSelectAll = () => {
  if (selectAll.value) {
    selectedRequests.value = paginatedRequests.value
      .filter((r) => r.estado === 'pendiente')
      .map((r) => r.id)
  } else {
    selectedRequests.value = []
  }
}

const goToPage = (page) => {
  if (page >= 1 && page <= totalPages.value) {
    currentPage.value = page
  }
}

const resetRequestForm = () => {
  requestForm.value = {
    monto_solicitado: null,
    banco_destino_id: '',
    motivo: '',
  }
}

// Format helpers
const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString('es-EC')
}

const formatTime = (dateString) => {
  return new Date(dateString).toLocaleTimeString('es-EC', {
    hour: '2-digit',
    minute: '2-digit',
  })
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

const getStatusBadgeColor = (estado) => {
  const colors = {
    pendiente: 'warning',
    aprobado: 'success',
    rechazado: 'error',
    pagado: 'info',
  }
  return colors[estado] || 'secondary'
}

const getUserInitials = (user) => {
  if (!user) return 'U'
  return (user.first_name?.charAt(0) + user.last_name?.charAt(0)).toUpperCase()
}

// Export functionality
const exportToExcel = () => {
  const exportData = filteredRequests.value.map((request) => ({
    Usuario: `${request.user?.first_name} ${request.user?.last_name}`,
    Cédula: request.user?.cedula,
    Empresa: request.empresa?.first_name || 'N/A',
    'Monto Solicitado': request.monto_solicitado,
    'Monto Aprobado': request.monto_aprobado || 0,
    Estado: getStatusLabel(request.estado),
    'Fecha Solicitud': formatDate(request.fecha_solicitud),
    'Banco Destino': request.banco_destino?.banco_nombre || 'N/A',
    'Procesado Por': request.procesado_por?.first_name || 'N/A',
    Observaciones: request.observaciones || '',
  }))

  const wb = XLSX.utils.book_new()
  const ws = XLSX.utils.json_to_sheet(exportData)
  XLSX.utils.book_append_sheet(wb, ws, 'Solicitudes')

  const filename = `solicitudes_${new Date().toISOString().split('T')[0]}.xlsx`
  XLSX.writeFile(wb, filename)

  showToast('Archivo Excel descargado', 'success')
}

// Lifecycle
onMounted(async () => {
  // Load initial data
  await Promise.all([loadRequests(), loadCompanies(), loadUserBankAccounts()])
})

onUnmounted(() => {
  // Clean up if needed
})

// Watch for filter changes
watch(
  filters,
  () => {
    currentPage.value = 1
  },
  { deep: true },
)

watch(searchTerm, () => {
  currentPage.value = 1
})
</script>

<style scoped>
.solicitudes-view {
  padding: 1rem;
}

.avatar-sm {
  width: 40px;
  height: 40px;
}

.avatar-initial {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  color: white;
  font-size: 14px;
}

.table th {
  border-top: none;
  font-weight: 600;
  color: #495057;
  background-color: #f8f9fa;
}

.card {
  border: none;
  box-shadow: 0 0.125rem 0.25rem rgba(0, 0, 0, 0.075);
}

.badge {
  font-size: 0.75em;
}

.btn-group-sm > .btn {
  border-radius: 0.2rem;
}
</style>
