<template>
  <div class="container mt-4">
    <!-- Loading State -->
    <div v-if="loading" class="text-center my-4">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">Cargando...</span>
      </div>
      <p class="mt-2">Verificando estado...</p>
    </div>

    <div v-else>
      <!-- Dynamic Status Message -->
      <div :class="['alert d-flex align-items-center', validation.class]" role="alert">
        <i :class="[validation.icon, 'me-2']"></i>
        <div>{{ validation.message }}</div>
      </div>

      <!-- Company Info -->
      <div v-if="companyInfo" class="card mb-4">
        <div class="card-header bg-light">
          <h6 class="mb-0">Información de la Empresa</h6>
        </div>
        <div class="card-body p-3">
          <div class="row small">
            <div class="col-md-4"><strong>Empresa:</strong> {{ companyInfo.nombre }}</div>
            <div class="col-md-4"><strong>RUC:</strong> {{ companyInfo.ruc }}</div>
            <div class="col-md-4"><strong>Límite de solicitudes:</strong> {{ companyInfo.frecuencia }} por mes</div>
            <div class="col-md-4"><strong>Días hábiles:</strong> Del {{ companyInfo.dia_inicio }} al {{ companyInfo.dia_cierre }}</div>
            <div class="col-md-4"><strong>Última actualización:</strong> {{ companyInfo.fecha_excel || 'No disponible' }}</div>
            <div class="col-md-4"><strong>Porcentaje disponible:</strong> {{ companyInfo.porcentaje }}%</div>
          </div>
        </div>
      </div>

      <!-- Request Form -->
      <div v-if="isRequestFormVisible" class="card mb-4">
        <div class="card-header bg-primary text-white">
          <h5 class="mb-0"><i class="fas fa-hand-holding-usd me-2"></i>Solicitar Nuevo Anticipo</h5>
        </div>
        <div class="card-body">
          <form @submit.prevent="handleSubmitRequest">
            <div class="row g-3">
              <div class="col-md-6">
                <label class="form-label fw-bold">Monto Solicitado</label>
                <div class="input-group">
                  <span class="input-group-text">$</span>
                  <input
                    v-model.number="requestForm.monto_solicitado"
                    type="number"
                    class="form-control form-control-lg"
                    :max="availableAmount"
                    min="1"
                    step="0.01"
                    required
                    :disabled="!isFormEnabled"
                    @input="validateAmount"
                  />
                </div>
                <div class="form-text">
                  <span v-if="availableAmount > 0">
                    Monto disponible: <strong>${{ availableAmount.toFixed(2) }}</strong>
                    ({{ companyInfo.porcentaje }}% de ${{ (availableAmount / (companyInfo.porcentaje / 100)).toFixed(2) }})
                  </span>
                  <span v-else class="text-danger">
                    No hay saldo disponible para anticipos
                  </span>
                </div>
                <div v-if="amountError" class="text-danger small mt-1">
                  <i class="fas fa-exclamation-circle"></i> {{ amountError }}
                </div>
                </div>
                
                <div class="col-md-6">
                  <label class="form-label fw-bold">Cuenta Bancaria</label>
                  <select 
                    v-model="requestForm.banco_destino" 
                    class="form-select form-select-lg" 
                    required
                    :disabled="!isFormEnabled || !bankAccounts.length"
                  >
                    <option value="">Seleccionar cuenta...</option>
                    <option
                      v-for="account in bankAccounts"
                      :key="account.id"
                      :value="account.id"
                      :disabled="!isAccountVerified(account)"
                    >
                      {{ account.banco_nombre }} - {{ account.numero_cuenta }}
                      <template v-if="!isAccountVerified(account)">
                        (En verificación)
                      </template>
                    </option>
                  </select>
                  <div v-if="!bankAccounts.length" class="text-warning small mt-1">
                    <i class="fas fa-exclamation-triangle"></i> No tiene cuentas bancarias registradas.
                    <router-link to="/perfil/bancos">Agregar cuenta bancaria</router-link>
                  </div>
                  <div v-else class="form-text">
                    Seleccione la cuenta donde desea recibir el anticipo
                  </div>
                </div>
                
                <div class="col-12">
                  <label class="form-label fw-bold">Motivo (Opcional)</label>
                  <textarea
                    v-model="requestForm.observaciones"
                    class="form-control"
                    rows="2"
                    placeholder="Especifique el motivo del anticipo (opcional)"
                    :disabled="!isFormEnabled"
                  ></textarea>
                </div>
                
                <div class="col-12 mt-3">
                  <button 
                    type="submit" 
                    class="btn btn-primary btn-lg w-100"
                    :disabled="!isFormEnabled || submitting || !isFormValid"
                  >
                    <template v-if="submitting">
                      <span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                      Procesando...
                    </template>
                    <template v-else>
                      <i class="fas fa-paper-plane me-2"></i> Solicitar Anticipo
                    </template>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>

    <!-- Request History -->
    <div class="card">
      <div class="card-header bg-light">
        <div class="d-flex justify-content-between align-items-center">
          <h5 class="mb-0"><i class="fas fa-history me-2"></i>Historial de Solicitudes</h5>
          <div class="d-flex gap-2">
            <div class="input-group input-group-sm" style="width: 200px;">
              <span class="input-group-text"><i class="fas fa-search"></i></span>
              <input 
                v-model="searchQuery" 
                type="text" 
                class="form-control" 
                placeholder="Buscar..."
                @input="filterRequests"
              >
            </div>
            <select v-model="statusFilter" class="form-select form-select-sm" style="width: 150px;" @change="filterRequests">
              <option value="">Todos los estados</option>
              <option value="pendiente">Pendientes</option>
              <option value="aprobado">Aprobados</option>
              <option value="rechazado">Rechazados</option>
              <option value="pagado">Pagados</option>
            </select>
            <button 
              class="btn btn-sm btn-outline-secondary"
              @click="refreshRequests"
              :disabled="refreshing"
              title="Actualizar lista"
            >
              <i class="fas fa-sync-alt" :class="{'fa-spin': refreshing}"></i>
            </button>
          </div>
        </div>
      </div>
      <div class="card-body p-0">
        <div v-if="filteredRequests.loading && !filteredRequests.data.length" class="text-center py-4">
          <div class="spinner-border text-primary" role="status">
            <span class="visually-hidden">Cargando...</span>
          </div>
        </div>
        <div v-else-if="!filteredRequests.data.length" class="text-muted text-center py-4">
          <i class="fas fa-inbox fa-3x mb-3 text-muted"></i>
          <p class="mb-0">No se encontraron solicitudes</p>
        </div>
        <div v-else class="table-responsive">
          <table class="table table-hover align-middle mb-0">
            <thead class="table-light">
              <tr>
                <th class="ps-3">#</th>
                <th>Fecha</th>
                <th>Monto</th>
                <th>Cuenta</th>
                <th>Estado</th>
                <th class="text-end pe-3">Acciones</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(request, index) in paginatedRequests" :key="request.id">
                <td class="ps-3 text-muted">
                  {{ (currentPage - 1) * itemsPerPage + index + 1 }}
                </td>
                <td>
                  <div class="fw-medium">{{ formatDate(request.fecha_solicitud) }}</div>
                  <small class="text-muted">{{ formatTime(request.fecha_solicitud) }}</small>
                </td>
                <td class="fw-bold">
                  ${{ Number(request.monto_solicitado).toFixed(2) }}
                </td>
                <td>
                  <div v-if="request.expand?.banco_id">
                    {{ request.expand.banco_id.banco_nombre }}
                    <small class="d-block text-muted">•••• {{ request.expand.banco_id.numero_cuenta.slice(-4) }}</small>
                  </div>
                  <div v-else class="text-muted">
                    <small>No especificada</small>
                  </div>
                </td>
                <td>
                  <span :class="getStatusClass(request.estado)">
                    <i :class="getStatusIcon(request.estado)" class="me-1"></i>
                    {{ formatStatus(request.estado) }}
                  </span>
                  <div v-if="request.estado === 'rechazado' && request.motivo_rechazo" 
                       class="small text-danger mt-1">
                    {{ request.motivo_rechazo }}
                  </div>
                </td>
                <td class="text-end pe-3">
                  <div class="btn-group btn-group-sm">
                    <button 
                      class="btn btn-outline-primary"
                      @click="viewRequestDetails(request)"
                      title="Ver detalles"
                    >
                      <i class="fas fa-eye"></i>
                    </button>
                    <button 
                      v-if="canCancelRequest(request)"
                      class="btn btn-outline-danger"
                      @click="confirmCancelRequest(request)"
                      title="Cancelar solicitud"
                      :disabled="cancellingRequestId === request.id"
                    >
                      <i v-if="cancellingRequestId === request.id" 
                         class="fas fa-spinner fa-spin"></i>
                      <i v-else class="fas fa-times"></i>
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        
        <!-- Pagination -->
        <div v-if="totalPages > 1" class="card-footer bg-white">
          <div class="d-flex justify-content-between align-items-center">
            <div class="text-muted small">
              Mostrando {{ (currentPage - 1) * itemsPerPage + 1 }} a 
              {{ Math.min(currentPage * itemsPerPage, filteredRequests.data.length) }} de 
              {{ filteredRequests.data.length }} registros
            </div>
            <nav>
              <ul class="pagination pagination-sm mb-0">
                <li class="page-item" :class="{ disabled: currentPage === 1 }">
                  <button 
                    class="page-link" 
                    @click="changePage(currentPage - 1)"
                    :disabled="currentPage === 1"
                  >
                    &laquo;
                  </button>
                </li>
                
                <template v-for="page in visiblePages" :key="page">
                  <li 
                    v-if="page !== '...'"
                    class="page-item"
                    :class="{ active: page === currentPage }"
                  >
                    <button 
                      class="page-link"
                      @click="changePage(page)"
                    >
                      {{ page }}
                    </button>
                  </li>
                  <li v-else class="page-item disabled">
                    <span class="page-link">...</span>
                  </li>
                </template>
                
                <li class="page-item" :class="{ disabled: currentPage === totalPages }">
                  <button 
                    class="page-link" 
                    @click="changePage(currentPage + 1)"
                    :disabled="currentPage === totalPages"
                  >
                    &raquo;
                  </button>
                </li>
              </ul>
            </nav>
          </div>
        </div>
      </div>
    </div>

    <!-- Request Details Modal -->
    <div class="modal fade" id="requestDetailsModal" tabindex="-1" aria-hidden="true">
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Detalles de la Solicitud</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
          <div class="modal-body">
            <div v-if="selectedRequest" class="row g-3">
              <div class="col-md-6">
                <label class="form-label text-muted small mb-1">Número</label>
                <p class="mb-0">#{{ selectedRequest.id.slice(0, 8) }}</p>
              </div>
              <div class="col-md-6">
                <label class="form-label text-muted small mb-1">Fecha</label>
                <p class="mb-0">{{ formatDateTime(selectedRequest.fecha_solicitud) }}</p>
              </div>
              <div class="col-12">
                <label class="form-label text-muted small mb-1">Estado</label>
                <p class="mb-0">
                  <span :class="getStatusClass(selectedRequest.estado)">
                    <i :class="getStatusIcon(selectedRequest.estado)" class="me-1"></i>
                    {{ formatStatus(selectedRequest.estado) }}
                  </span>
                </p>
              </div>
              <div class="col-md-6">
                <label class="form-label text-muted small mb-1">Monto</label>
                <p class="h5 text-primary mb-0">${{ Number(selectedRequest.monto_solicitado).toFixed(2) }}</p>
              </div>
              <div class="col-md-6">
                <label class="form-label text-muted small mb-1">Cuenta Bancaria</label>
                <p class="mb-0">
                  {{ selectedRequest.expand?.banco_id?.banco_nombre || 'No especificada' }}
                  <span v-if="selectedRequest.expand?.banco_id?.numero_cuenta" class="d-block text-muted">
                    •••• {{ selectedRequest.expand.banco_id.numero_cuenta.slice(-4) }}
                  </span>
                </p>
              </div>
              <div v-if="selectedRequest.observaciones" class="col-12">
                <label class="form-label text-muted small mb-1">Observaciones</label>
                <p class="mb-0">{{ selectedRequest.observaciones }}</p>
              </div>
              <div v-if="selectedRequest.motivo_rechazo" class="col-12">
                <label class="form-label text-muted small mb-1">Motivo de Rechazo</label>
                <div class="alert alert-light border-danger text-danger mb-0">
                  <i class="fas fa-info-circle me-1"></i>
                  {{ selectedRequest.motivo_rechazo }}
                </div>
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cerrar</button>
            <button 
              v-if="canCancelRequest(selectedRequest)"
              type="button" 
              class="btn btn-outline-danger"
              @click="confirmCancelRequest(selectedRequest)"
              :disabled="cancellingRequestId === selectedRequest.id"
            >
              <i v-if="cancellingRequestId === selectedRequest.id" 
                 class="fas fa-spinner fa-spin me-1"></i>
              <i v-else class="fas fa-times me-1"></i>
              Cancelar Solicitud
            </button>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Cancel Confirmation Modal -->
    <div class="modal fade" id="confirmCancelModal" tabindex="-1" aria-hidden="true">
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Confirmar Cancelación</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
          <div class="modal-body">
            <p>¿Está seguro que desea cancelar la solicitud de anticipo por <strong>${{ selectedRequest ? Number(selectedRequest.monto_solicitado).toFixed(2) : '0.00' }}</strong>?</p>
            <p class="text-muted small mb-0">Esta acción no se puede deshacer.</p>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-outline-secondary" data-bs-dismiss="modal">No, volver</button>
            <button 
              type="button" 
              class="btn btn-danger"
              @click="cancelRequest"
              :disabled="cancellingRequest"
            >
              <i v-if="cancellingRequest" class="fas fa-spinner fa-spin me-1"></i>
              <i v-else class="fas fa-times me-1"></i>
              Sí, cancelar solicitud
            </button>
          </div>
        </div>
      </div>
    </div>
  </template>

<style scoped>
/* Custom styles for the component */
.loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(255, 255, 255, 0.8);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 9999;
}

/* Status badges */
.badge {
  font-size: 0.8em;
  font-weight: 500;
  padding: 0.4em 0.8em;
  border-radius: 4px;
  text-transform: capitalize;
}

/* Table styles */
.table {
  margin-bottom: 0;
}

.table th {
  font-weight: 600;
  text-transform: uppercase;
  font-size: 0.75rem;
  letter-spacing: 0.5px;
  color: #6c757d;
  border-top: none;
  padding: 0.75rem 1rem;
}

.table td {
  vertical-align: middle;
  padding: 1rem;
  border-color: #f1f3f9;
}

/* Card styles */
.card {
  border: none;
  border-radius: 0.5rem;
  box-shadow: 0 0.125rem 0.25rem rgba(0, 0, 0, 0.075);
  margin-bottom: 1.5rem;
  overflow: hidden;
}

.card-header {
  background-color: #fff;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
  padding: 1rem 1.5rem;
}

/* Form styles */
.form-control:disabled, 
.form-select:disabled {
  background-color: #f8f9fa;
  opacity: 0.8;
}

/* Button styles */
.btn {
  font-weight: 500;
  padding: 0.5rem 1.25rem;
  border-radius: 0.375rem;
  transition: all 0.2s ease-in-out;
}

.btn-lg {
  padding: 0.625rem 1.5rem;
  font-size: 1.1rem;
}

/* Alert styles */
.alert {
  border: none;
  border-radius: 0.5rem;
  padding: 1rem 1.5rem;
  margin-bottom: 1.5rem;
}

/* Responsive adjustments */
@media (max-width: 767.98px) {
  .card-header {
    padding: 0.75rem 1rem;
  }
  
  .btn {
    padding: 0.4rem 1rem;
  }
  
  .btn-lg {
    padding: 0.5rem 1.25rem;
    font-size: 1rem;
  }
  
  .table-responsive {
    border-radius: 0.5rem;
    border: 1px solid #f1f3f9;
  }
}

/* Animation for status changes */
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

.fade-enter-active {
  animation: fadeIn 0.3s ease-out;
}

/* Custom scrollbar */
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

::-webkit-scrollbar-track {
  background: #f1f3f9;
  border-radius: 4px;
}

::-webkit-scrollbar-thumb {
  background: #c1c9d4;
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background: #a8b3c0;
}
</style>

<script setup>
import { ref, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useUserAdvanceRequestsStore } from '@/stores/userAdvanceRequests'
import { useBankAccountsStore } from '@/stores/bankAccounts'

const authStore = useAuthStore()
const requestsStore = useUserAdvanceRequestsStore()
const bankAccountsStore = useBankAccountsStore()

const requestForm = ref({
  monto_solicitado: '',
  banco_destino: '',
})

onMounted(async () => {
  await Promise.all([
    requestsStore.fetchUserRequests(authStore.user.id),
    requestsStore.fetchUserAvailableAmount(authStore.user.id),
    bankAccountsStore.fetchUserBankAccounts(authStore.user.id),
  ])
})

const handleSubmitRequest = async () => {
  await requestsStore.createAdvanceRequest({
    ...requestForm.value,
    user_id: authStore.user.id,
    company_id: authStore.user.company_id,
  })
  requestForm.value = { monto_solicitado: '', banco_destino: '' }
}

const getStatusClass = (estado) => {
  switch (estado) {
    case 'pendiente':
      return 'badge bg-warning'
    case 'procesando':
      return 'badge bg-primary'
    case 'pagado':
      return 'badge bg-success'
    case 'rechazado':
      return 'badge bg-danger'
    default:
      return 'badge bg-secondary'
  }
}

const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString('es-EC')
}
</script>
