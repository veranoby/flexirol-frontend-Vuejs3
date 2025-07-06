<template>
  <div class="solicitudes-view">
    <!-- Loading Spinner -->
    <div v-if="loading" class="d-flex justify-content-center my-5">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">Cargando...</span>
      </div>
    </div>

    <!-- Main Content -->
    <div v-else class="container-fluid">
      <!-- Dynamic Header -->
      <div class="row mb-4">
        <div class="col-12">
          <h2 class="mb-1">
            <i :class="roleIcon" class="me-2"></i>
            {{ pageTitle }}
          </h2>
          <p class="text-muted">{{ pageDescription }}</p>
        </div>
      </div>

      <!-- Action Bar -->
      <div class="row mb-4">
        <div class="col-md-8">
          <!-- Advanced Filters (Superadmin/Operador) -->
          <div v-if="canProcessRequests" class="row g-3">
            <div class="col-md-3">
              <label class="form-label">Estado:</label>
              <select v-model="filters.estado" class="form-select">
                <option value="">Todos</option>
                <option value="pendiente">Pendientes</option>
                <option value="aprobado">Aprobados</option>
                <option value="rechazado">Rechazados</option>
                <option value="pagado">Pagados</option>
              </select>
            </div>
            <div v-if="authStore.isSuperadmin" class="col-md-3">
              <label class="form-label">Empresa:</label>
              <select v-model="filters.empresa_id" class="form-select">
                <option value="">Todas las empresas</option>
                <option v-for="company in availableCompanies" :key="company.id" :value="company.id">
                  {{ company.first_name }} {{ company.last_name }}
                </option>
              </select>
            </div>
            <div class="col-md-3">
              <label class="form-label">Fecha desde:</label>
              <input v-model="filters.fechaDesde" type="date" class="form-control" />
            </div>
            <div class="col-md-3">
              <label class="form-label">Fecha hasta:</label>
              <input v-model="filters.fechaHasta" type="date" class="form-control" />
            </div>
          </div>

          <!-- Simple Search (Usuario) -->
          <div v-else class="row g-3">
            <div class="col-md-6">
              <label class="form-label">Buscar mis solicitudes:</label>
              <input
                v-model="searchTerm"
                type="text"
                class="form-control"
                placeholder="Buscar por monto o estado..."
              />
            </div>
            <div class="col-md-3">
              <label class="form-label">Estado:</label>
              <select v-model="filters.estado" class="form-select">
                <option value="">Todos</option>
                <option value="pendiente">Pendientes</option>
                <option value="aprobado">Aprobados</option>
                <option value="rechazado">Rechazados</option>
                <option value="pagado">Pagados</option>
              </select>
            </div>
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="col-md-4 text-end">
          <button
            v-if="canCreateRequests"
            class="btn btn-success me-2"
            @click="openCreateRequestModal"
          >
            <i class="fas fa-plus me-1"></i>Nueva Solicitud
          </button>
          <div v-if="canProcessRequests" class="btn-group">
            <button class="btn btn-primary" @click="refreshRequests">
              <i class="fas fa-sync-alt me-1"></i>Actualizar
            </button>
            <button class="btn btn-outline-primary" @click="exportToExcel">
              <i class="fas fa-file-excel me-1"></i>Excel
            </button>
          </div>
        </div>
      </div>

      <!-- Stats Cards -->
      <div class="row mb-4">
        <div class="col-md-3">
          <div class="card bg-warning text-white">
            <div class="card-body">
              <h6>Pendientes</h6>
              <h3>{{ stats.pendientes }}</h3>
            </div>
          </div>
        </div>
        <div class="col-md-3">
          <div class="card bg-success text-white">
            <div class="card-body">
              <h6>Aprobadas</h6>
              <h3>{{ stats.aprobadas }}</h3>
            </div>
          </div>
        </div>
        <div class="col-md-3">
          <div class="card bg-info text-white">
            <div class="card-body">
              <h6>Pagadas</h6>
              <h3>{{ stats.pagadas }}</h3>
            </div>
          </div>
        </div>
        <div class="col-md-3">
          <div class="card bg-primary text-white">
            <div class="card-body">
              <h6>Total Monto</h6>
              <h3>${{ stats.totalMonto.toLocaleString() }}</h3>
            </div>
          </div>
        </div>
      </div>

      <!-- Requests Table -->
      <div class="row">
        <div class="col-12">
          <div class="card">
            <div class="card-header d-flex justify-content-between align-items-center">
              <h5 class="mb-0">
                <i class="fas fa-file-invoice-dollar me-2"></i>
                {{ tableTitle }} ({{ filteredRequests.length }})
              </h5>
              <div class="d-flex gap-2">
                <button
                  v-if="canProcessRequests"
                  class="btn btn-sm btn-outline-success"
                  @click="approveSelected"
                  :disabled="selectedRequests.length === 0"
                >
                  <i class="fas fa-check me-1"></i>Aprobar Seleccionados
                </button>
                <button class="btn btn-sm btn-outline-secondary" @click="clearFilters">
                  <i class="fas fa-filter me-1"></i>Limpiar Filtros
                </button>
              </div>
            </div>

            <div class="card-body p-0">
              <div v-if="filteredRequests.length === 0" class="text-center py-5">
                <i class="fas fa-file-invoice-dollar fa-3x text-muted mb-3"></i>
                <p class="text-muted">{{ emptyMessage }}</p>
              </div>

              <div v-else class="table-responsive">
                <table class="table table-hover mb-0">
                  <thead class="table-light">
                    <tr>
                      <th v-if="canProcessRequests" width="40">
                        <input
                          v-model="selectAll"
                          type="checkbox"
                          class="form-check-input"
                          @change="toggleSelectAll"
                        />
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
                        <input
                          v-model="selectedRequests"
                          :value="request.id"
                          type="checkbox"
                          class="form-check-input"
                        />
                      </td>
                      <td>
                        <div class="d-flex align-items-center">
                          <div class="avatar-sm me-2">
                            <div class="avatar-initial bg-primary rounded-circle">
                              {{ getUserInitials(request.user) }}
                            </div>
                          </div>
                          <div>
                            <div class="fw-semibold">
                              {{ request.user?.first_name }} {{ request.user?.last_name }}
                            </div>
                            <small class="text-muted">{{ request.user?.cedula }}</small>
                          </div>
                        </div>
                      </td>
                      <td v-if="showCompanyColumn">
                        <span v-if="request.empresa">{{ request.empresa.first_name }}</span>
                        <span v-else class="text-muted">N/A</span>
                      </td>
                      <td>
                        <span class="fw-bold"
                          >${{ request.monto_solicitado.toLocaleString() }}</span
                        >
                        <div
                          v-if="
                            request.monto_aprobado &&
                            request.monto_aprobado !== request.monto_solicitado
                          "
                          class="small text-muted"
                        >
                          Aprobado: ${{ request.monto_aprobado.toLocaleString() }}
                        </div>
                      </td>
                      <td>
                        <span :class="getStatusBadgeClass(request.estado)">
                          {{ getStatusLabel(request.estado) }}
                        </span>
                      </td>
                      <td>
                        <span>{{ formatDate(request.fecha_solicitud) }}</span>
                        <div class="small text-muted">
                          {{ formatTime(request.fecha_solicitud) }}
                        </div>
                      </td>
                      <td>
                        <span v-if="request.banco_destino">{{
                          request.banco_destino.banco_nombre
                        }}</span>
                        <span v-else class="text-muted">Sin especificar</span>
                      </td>
                      <td v-if="canProcessRequests">
                        <span v-if="request.procesado_por" class="small">{{
                          request.procesado_por.first_name
                        }}</span>
                        <span v-else class="text-muted small">Pendiente</span>
                      </td>
                      <td>
                        <div class="btn-group btn-group-sm">
                          <button
                            class="btn btn-outline-info"
                            @click="viewRequest(request)"
                            title="Ver detalles"
                          >
                            <i class="fas fa-eye"></i>
                          </button>
                          <button
                            v-if="canProcessRequests && request.estado === 'pendiente'"
                            class="btn btn-outline-success"
                            @click="approveRequest(request)"
                            title="Aprobar"
                          >
                            <i class="fas fa-check"></i>
                          </button>
                          <button
                            v-if="canProcessRequests && request.estado === 'pendiente'"
                            class="btn btn-outline-danger"
                            @click="rejectRequest(request)"
                            title="Rechazar"
                          >
                            <i class="fas fa-times"></i>
                          </button>
                          <button
                            v-if="
                              canDeleteRequests &&
                              ['pendiente', 'rechazado'].includes(request.estado)
                            "
                            class="btn btn-outline-danger"
                            @click="deleteRequest(request)"
                            title="Eliminar"
                          >
                            <i class="fas fa-trash"></i>
                          </button>
                        </div>
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
                  {{ Math.min(currentPage * itemsPerPage, filteredRequests.length) }}
                  de {{ filteredRequests.length }} solicitudes
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
    </div>

    <!-- Create Request Modal (Usuario) -->
    <div
      v-if="canCreateRequests"
      class="modal fade"
      id="createRequestModal"
      tabindex="-1"
      aria-hidden="true"
      ref="createRequestModalRef"
    >
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title"><i class="fas fa-plus me-2"></i>Nueva Solicitud de Adelanto</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
          </div>

          <form @submit.prevent="handleCreateRequest">
            <div class="modal-body">
              <div class="row g-3">
                <div class="col-12">
                  <label class="form-label">Monto Solicitado *</label>
                  <div class="input-group">
                    <span class="input-group-text">$</span>
                    <input
                      v-model.number="requestForm.monto_solicitado"
                      type="number"
                      class="form-control"
                      :max="maxAvailableAmount"
                      min="1"
                      step="0.01"
                      required
                    />
                  </div>
                  <div class="form-text">
                    Disponible: ${{ maxAvailableAmount.toLocaleString() }}
                  </div>
                </div>

                <div class="col-12">
                  <label class="form-label">Banco Destino *</label>
                  <select v-model="requestForm.banco_destino_id" class="form-select" required>
                    <option value="">Seleccionar banco...</option>
                    <option v-for="bank in userBankAccounts" :key="bank.id" :value="bank.id">
                      {{ bank.banco_nombre }} - {{ bank.numero_cuenta }}
                    </option>
                  </select>
                </div>

                <div class="col-12">
                  <label class="form-label">Motivo (Opcional)</label>
                  <textarea
                    v-model="requestForm.motivo"
                    class="form-control"
                    rows="3"
                    placeholder="Describe brevemente el motivo de la solicitud..."
                  ></textarea>
                </div>
              </div>
            </div>

            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">
                Cancelar
              </button>
              <button
                type="submit"
                class="btn btn-primary"
                :disabled="!isCreateFormValid || submitting"
              >
                <span v-if="submitting" class="spinner-border spinner-border-sm me-2"></span>
                Crear Solicitud
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>

    <!-- Process Request Modal -->
    <div
      v-if="canProcessRequests"
      class="modal fade"
      id="processRequestModal"
      tabindex="-1"
      aria-hidden="true"
      ref="processRequestModalRef"
    >
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title"><i class="fas fa-cogs me-2"></i>Procesar Solicitud</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
          </div>

          <form @submit.prevent="handleProcessRequest">
            <div class="modal-body">
              <div v-if="selectedRequest" class="row g-3">
                <!-- Request Info -->
                <div class="col-12">
                  <div class="alert alert-info">
                    <strong
                      >{{ selectedRequest.user?.first_name }}
                      {{ selectedRequest.user?.last_name }}</strong
                    ><br />
                    Monto solicitado:
                    <strong>${{ selectedRequest.monto_solicitado.toLocaleString() }}</strong>
                  </div>
                </div>

                <div class="col-12">
                  <label class="form-label">Acción *</label>
                  <select v-model="processForm.accion" class="form-select" required>
                    <option value="">Seleccionar acción...</option>
                    <option value="aprobar">Aprobar</option>
                    <option value="rechazar">Rechazar</option>
                  </select>
                </div>

                <div v-if="processForm.accion === 'aprobar'" class="col-12">
                  <label class="form-label">Monto Aprobado *</label>
                  <div class="input-group">
                    <span class="input-group-text">$</span>
                    <input
                      v-model.number="processForm.monto_aprobado"
                      type="number"
                      class="form-control"
                      :max="selectedRequest?.monto_solicitado"
                      min="1"
                      step="0.01"
                      required
                    />
                  </div>
                </div>

                <div class="col-12">
                  <label class="form-label">
                    {{ processForm.accion === 'rechazar' ? 'Motivo del Rechazo' : 'Observaciones' }}
                    {{ processForm.accion === 'rechazar' ? ' *' : '' }}
                  </label>
                  <textarea
                    v-model="processForm.observaciones"
                    class="form-control"
                    rows="3"
                    :required="processForm.accion === 'rechazar'"
                    :placeholder="
                      processForm.accion === 'rechazar'
                        ? 'Explica el motivo del rechazo...'
                        : 'Observaciones adicionales...'
                    "
                  ></textarea>
                </div>
              </div>
            </div>

            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">
                Cancelar
              </button>
              <button
                type="submit"
                class="btn"
                :class="processForm.accion === 'aprobar' ? 'btn-success' : 'btn-danger'"
                :disabled="!isProcessFormValid || submitting"
              >
                <span v-if="submitting" class="spinner-border spinner-border-sm me-2"></span>
                {{ processForm.accion === 'aprobar' ? 'Aprobar' : 'Rechazar' }} Solicitud
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useUserAdvanceRequestsStore } from '@/stores/userAdvanceRequests'
import { useCompaniesStore } from '@/stores/companies'
import { useBankAccountsStore } from '@/stores/bankAccounts'
import { Modal } from 'bootstrap'
import * as XLSX from 'xlsx'

// Stores
const authStore = useAuthStore()
const requestsStore = useUserAdvanceRequestsStore()
const companiesStore = useCompaniesStore()
const bankAccountsStore = useBankAccountsStore()

// State
const loading = ref(false)
const submitting = ref(false)

// Modal refs
const createRequestModalRef = ref(null)
const processRequestModalRef = ref(null)
let createRequestModal = null
let processRequestModal = null

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
  createRequestModal.show()
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
    createRequestModal.hide()
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
  processRequestModal.show()
}

const rejectRequest = (request) => {
  selectedRequest.value = request
  processForm.value.accion = 'rechazar'
  processForm.value.monto_aprobado = null
  processForm.value.observaciones = ''
  processRequestModal.show()
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
    processRequestModal.hide()
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

// Toast notifications
const showToast = (message, type = 'info') => {
  console.log(`[${type.toUpperCase()}] ${message}`)
  // TODO: Implement with Bootstrap Toast
}

// Lifecycle
onMounted(async () => {
  // Initialize Bootstrap modals
  if (createRequestModalRef.value) {
    createRequestModal = new Modal(createRequestModalRef.value)
  }
  if (processRequestModalRef.value) {
    processRequestModal = new Modal(processRequestModalRef.value)
  }

  // Load initial data
  await Promise.all([loadRequests(), loadCompanies(), loadUserBankAccounts()])
})

onUnmounted(() => {
  if (createRequestModal) createRequestModal.dispose()
  if (processRequestModal) processRequestModal.dispose()
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
