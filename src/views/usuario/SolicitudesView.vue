<template>
  <v-container class="mt-4">
    <!-- Loading State -->
<v-row align="center" justify="center" v-if="loading" class="my-4">
      <v-progress-circular indeterminate color="primary" />
      <v-col class="mt-2">Verificando estado...</v-col>
    </v-row>

    <div v-else>
      <!-- Dynamic Status Message -->
<v-alert :type="validation.type" dismissible>
        <v-icon class="me-2">{{ validation.icon }}</v-icon>
        {{ validation.message }}
      </v-alert>

      <!-- Company Info -->
<v-card v-if="companyInfo" class="mb-4">
        <v-card-title class="bg-grey-lighten-4">
          <h6 class="mb-0">Información de la Empresa</h6>
        </v-card-title>
        <v-card-text class="p-3">
          <v-row class="small">
            <v-col cols="12" md="4"><strong>Empresa:</strong> {{ companyInfo.nombre }}</v-col>
            <v-col cols="12" md="4"><strong>RUC:</strong> {{ companyInfo.ruc }}</v-col>
            <v-col cols="12" md="4"><strong>Límite de solicitudes:</strong> {{ companyInfo.frecuencia }} por mes</v-col>
            <v-col cols="12" md="4"><strong>Días hábiles:</strong> Del {{ companyInfo.dia_inicio }} al {{ companyInfo.dia_cierre }}</v-col>
            <v-col cols="12" md="4"><strong>Última actualización:</strong> {{ companyInfo.fecha_excel || 'No disponible' }}</v-col>
            <v-col cols="12" md="4"><strong>Porcentaje disponible:</strong> {{ companyInfo.porcentaje }}%</v-col>
          </v-row>
        </v-card-text>
      </v-card>

      <!-- Request Form -->
<v-card v-if="isRequestFormVisible" class="mb-4">
        <v-card-title class="bg-primary text-white">
          <h5 class="mb-0"><v-icon>mdi-hand-heart</v-icon>Solicitar Nuevo Anticipo</h5>
        </v-card-title>
        <v-card-text>
          <v-form @submit.prevent="handleSubmitRequest">
            <v-row class="g-3">
              <v-col cols="12" md="6">
                <v-text-field
                  v-model.number="requestForm.monto_solicitado"
                  label="Monto Solicitado"
                  :append-inner-icon="'$'"
                  type="number"
                  :max="availableAmount"
                  min="1"
                  step="0.01"
                  required
                  :disabled="!isFormEnabled"
                  @input="validateAmount"
                />
                <div v-if="availableAmount > 0" class="text-caption text-medium-emphasis">
                  Monto disponible: <strong>${{ availableAmount.toFixed(2) }}</strong>
                  ({{ companyInfo.porcentaje }}% de ${{ (availableAmount / (companyInfo.porcentaje / 100)).toFixed(2) }})
                </div>
                <div v-else class="text-error">
                  No hay saldo disponible para anticipos
                </div>
                <div v-if="amountError" class="text-error text-caption mt-1">
                  <v-icon>mdi-alert-circle</v-icon> {{ amountError }}
                </div>
              </v-col>
              
              <v-col cols="12" md="6">
                <v-select
                  v-model="requestForm.banco_destino"
                  :items="bankAccounts"
                  item-value="id"
                  item-text="banco_nombre"
                  label="Cuenta Bancaria"
                  required
                  :disabled="!isFormEnabled || !bankAccounts.length"
                  :return-object="true"
                  return-object
                />
                <div v-if="!bankAccounts.length" class="text-warning text-caption mt-1">
                  <v-icon>mdi-alert</v-icon> No tiene cuentas bancarias registradas.
                  <router-link to="/perfil/bancos">Agregar cuenta bancaria</router-link>
                </div>
                <div v-else class="text-caption text-medium-emphasis">
                  Seleccione la cuenta donde desea recibir el anticipo
                </div>
              </v-col>
              
              <v-col cols="12">
                <v-textarea
                  v-model="requestForm.observaciones"
                  label="Motivo (Opcional)"
                  rows="2"
                  placeholder="Especifique el motivo del anticipo (opcional)"
                  :disabled="!isFormEnabled"
                />
              </v-col>
              
              <v-col cols="12" class="mt-3">
                <v-btn 
                  type="submit" 
                  color="primary"
                  :loading="submitting"
                  :disabled="!isFormEnabled || submitting || !isFormValid"
                >
                  <v-icon left>mdi-send</v-icon> Solicitar Anticipo
                </v-btn>
              </v-col>
            </v-row>
          </v-form>
        </v-card-text>
      </v-card>
      </div>

    <!-- Request History -->
    <v-card>
      <v-card-title class="d-flex justify-space-between align-center">
        <h5 class="mb-0"><v-icon left>mdi-history</v-icon>Historial de Solicitudes</h5>
        <div class="d-flex ga-2">
          <v-text-field
            v-model="searchQuery"
            dense
            hide-details
            placeholder="Buscar..."
            @input="filterRequests"
            append-inner-icon="mdi-magnify"
          ></v-text-field>

          <v-select
            v-model="statusFilter"
            :items="[{ text: 'Todos los estados', value: '' }, { text: 'Pendientes', value: 'pendiente' }, { text: 'Aprobados', value: 'aprobado' }, { text: 'Rechazados', value: 'rechazado' }, { text: 'Pagados', value: 'pagado' }]"
            dense
            hide-details
            label="Estado"
            @change="filterRequests"
          ></v-select>

          <v-btn
            icon
            size="small"
            @click="refreshRequests"
            :disabled="refreshing"
            :loading="refreshing"
            title="Actualizar lista"
          >
            <v-icon>mdi-refresh</v-icon>
          </v-btn>
        </div>
      </v-card-title>
      <v-card-subtitle v-if="filteredRequests.loading && !filteredRequests.data.length" class="text-center py-4">
        <v-progress-circular indeterminate color="primary"></v-progress-circular>
      </v-card-subtitle>
      <v-card-subtitle v-else-if="!filteredRequests.data.length" class="text-medium-emphasis text-center py-4">
        <v-icon size="large">mdi-inbox</v-icon>
        <p class="mb-0">No se encontraron solicitudes</p>
      </v-card-subtitle>
      <v-card-text v-else>
        <v-simple-table dense>
          <thead>
            <tr>
              <th>#</th>
              <th>Fecha</th>
              <th>Monto</th>
              <th>Cuenta</th>
              <th>Estado</th>
              <th class="text-end">Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(request, index) in paginatedRequests" :key="request.id">
              <td class="text-medium-emphasis">
                {{ (currentPage - 1) * itemsPerPage + index + 1 }}
              </td>
              <td>
                <div class="font-weight-medium">{{ formatDate(request.fecha_solicitud) }}</div>
                <small class="text-medium-emphasis">{{ formatTime(request.fecha_solicitud) }}</small>
              </td>
              <td class="font-weight-bold">
                ${{ Number(request.monto_solicitado).toFixed(2) }}
              </td>
              <td>
                <div v-if="request.expand?.banco_id">
                  {{ request.expand.banco_id.banco_nombre }}
                  <small class="d-block text-medium-emphasis">•••• {{ request.expand.banco_id.numero_cuenta.slice(-4) }}</small>
                </div>
                <div v-else class="text-medium-emphasis">
                  <small>No especificada</small>
                </div>
              </td>
              <td>
                <span :class="getStatusClass(request.estado)">
                  <v-icon :class="getStatusIcon(request.estado)" left></v-icon>
                  {{ formatStatus(request.estado) }}
                </span>
                <div v-if="request.estado === 'rechazado' && request.motivo_rechazo" 
                     class="text-caption text-error mt-1">
                  {{ request.motivo_rechazo }}
                </div>
              </td>
              <td class="text-end">
                <v-btn
                  icon
                  small
                  @click="viewRequestDetails(request)"
                  title="Ver detalles"
                >
                  <v-icon>mdi-eye</v-icon>
                </v-btn>
                <v-btn
                  v-if="canCancelRequest(request)"
                  icon
                  small
                  color="error"
                  @click="confirmCancelRequest(request)"
                  :disabled="cancellingRequestId === request.id"
                  :loading="cancellingRequestId === request.id"
                  title="Cancelar solicitud"
                >
                  <v-icon v-if="cancellingRequestId === request.id">mdi-close</v-icon>
                  <v-icon v-else>mdi-close</v-icon>
                </v-btn>
              </td>
            </tr>
          </tbody>
        </v-simple-table>
      </v-card-text>

      <!-- Pagination -->
      <v-card-actions v-if="totalPages > 1">
        <div class="d-flex justify-between align-center w-100">
          <div class="text-medium-emphasis text-caption">
            Mostrando {{ (currentPage - 1) * itemsPerPage + 1 }} a 
            {{ Math.min(currentPage * itemsPerPage, filteredRequests.data.length) }} de 
            {{ filteredRequests.data.length }} registros
          </div>
          <v-pagination
            v-model="currentPage"
            :length="totalPages"
            total-visible="7"
            prev-icon="mdi-chevron-left"
            next-icon="mdi-chevron-right"
            density="compact"
          ></v-pagination>
        </div>
      </v-card-actions>
    </v-card>

    <!-- Request Details Modal -->
<v-dialog v-model="requestDetailsModal" max-width="600">
      <v-card>
        <v-card-title>
          <span>Detalles de la Solicitud</span>
          <v-spacer></v-spacer>
          <v-btn icon @click="requestDetailsModal = false"><v-icon>mdi-close</v-icon></v-btn>
        </v-card-title>
        <v-card-text>
          <v-row v-if="selectedRequest" class="g-3">
            <v-col cols="12" md="6">
              <v-subheader>Número</v-subheader>
              <div>#{{ selectedRequest.id.slice(0, 8) }}</div>
            </v-col>
            <v-col cols="12" md="6">
              <v-subheader>Fecha</v-subheader>
              <div>{{ formatDateTime(selectedRequest.fecha_solicitud) }}</div>
            </v-col>
            <v-col cols="12">
              <v-subheader>Estado</v-subheader>
              <v-chip :color="getStatusClass(selectedRequest.estado)">
                <v-icon :left="getStatusIcon(selectedRequest.estado)"></v-icon>
                {{ formatStatus(selectedRequest.estado) }}
              </v-chip>
            </v-col>
            <v-col cols="12" md="6">
              <v-subheader>Monto</v-subheader>
              <div class="text-h5 text-primary">${{ Number(selectedRequest.monto_solicitado).toFixed(2) }}</div>
            </v-col>
            <v-col cols="12" md="6">
              <v-subheader>Cuenta Bancaria</v-subheader>
              <div>
                {{ selectedRequest.expand?.banco_id?.banco_nombre || 'No especificada' }}
                <span v-if="selectedRequest.expand?.banco_id?.numero_cuenta" class="d-block text-medium-emphasis">
                  •••• {{ selectedRequest.expand.banco_id.numero_cuenta.slice(-4) }}
                </span>
              </div>
            </v-col>
            <v-col cols="12" v-if="selectedRequest.observaciones">
              <v-subheader>Observaciones</v-subheader>
              <div>{{ selectedRequest.observaciones }}</div>
            </v-col>
            <v-col cols="12" v-if="selectedRequest.motivo_rechazo">
              <v-alert type="error">
                <v-icon>mdi-information</v-icon> {{ selectedRequest.motivo_rechazo }}
              </v-alert>
            </v-col>
          </v-row>
        </v-card-text>
        <v-card-actions>
          <v-btn color="secondary" text @click="requestDetailsModal = false">Cerrar</v-btn>
          <v-btn 
            v-if="canCancelRequest(selectedRequest)"
            color="error"
            @click="confirmCancelRequest(selectedRequest)"
            :loading="cancellingRequestId === selectedRequest.id"
          >
            <v-icon left>mdi-close</v-icon> Cancelar Solicitud
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
    
    <!-- Cancel Confirmation Dialog -->
    <v-dialog v-model="confirmCancelDialog" max-width="500">
      <v-card>
        <v-card-title>
          <span>Confirmar Cancelación</span>
          <v-spacer></v-spacer>
          <v-btn icon @click="confirmCancelDialog = false">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-card-title>
        <v-card-text>
          <p>
            ¿Está seguro que desea cancelar la solicitud de anticipo por
            <strong>${{ selectedRequest ? Number(selectedRequest.monto_solicitado).toFixed(2) : '0.00' }}</strong>?
          </p>
          <p class="text-medium-emphasis text-caption mb-0">Esta acción no se puede deshacer.</p>
        </v-card-text>
        <v-card-actions>
          <v-btn color="secondary" text @click="confirmCancelDialog = false">No, volver</v-btn>
          <v-btn
            color="error"
            @click="cancelRequest"
            :loading="cancellingRequest"
          >
            <v-icon left>mdi-close</v-icon>
            Sí, cancelar solicitud
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
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
