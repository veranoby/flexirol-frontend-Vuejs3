<template>
  <div class="container mt-4">
    <!-- Alert de estado del usuario -->
    <div v-if="requestsStore.canRequestAdvance" class="alert alert-success">
      <i class="fas fa-check-circle"></i> Usuario habilitado para anticipos
    </div>
    <div v-else class="alert alert-danger">
      <i class="fas fa-exclamation-triangle"></i> {{ requestsStore.blockMessage }}
    </div>

    <!-- Formulario nueva solicitud -->
    <div v-if="requestsStore.canRequestAdvance" class="card mb-4">
      <div class="card-header">
        <h5>Solicitar Nuevo Anticipo</h5>
      </div>
      <div class="card-body">
        <form @submit.prevent="handleSubmitRequest">
          <div class="row">
            <div class="col-md-6">
              <label class="form-label">Monto Solicitado</label>
              <div class="input-group">
                <span class="input-group-text">$</span>
                <input
                  v-model="requestForm.monto_solicitado"
                  type="number"
                  class="form-control"
                  :max="requestsStore.availableAmount"
                  required
                />
              </div>
              <small class="text-muted">Disponible: ${{ requestsStore.availableAmount }}</small>
            </div>
            <div class="col-md-6">
              <label class="form-label">Cuenta Destino</label>
              <select v-model="requestForm.banco_destino" class="form-select" required>
                <option value="">Seleccionar cuenta...</option>
                <option
                  v-for="account in bankAccountsStore.activeBankAccounts"
                  :key="account.id"
                  :value="account.id"
                >
                  {{ account.banco_nombre }} - {{ account.numero_cuenta }}
                </option>
              </select>
            </div>
          </div>
          <div class="mt-3">
            <button type="submit" class="btn btn-primary">
              <i class="fas fa-paper-plane"></i> Solicitar Anticipo
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Historial de solicitudes -->
    <div class="card">
      <div class="card-header">
        <h5>Mis Solicitudes</h5>
      </div>
      <div class="card-body">
        <div class="table-responsive">
          <table class="table table-striped">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Monto</th>
                <th>Banco Destino</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="request in requestsStore.userRequests" :key="request.id">
                <td>{{ formatDate(request.fecha_solicitud) }}</td>
                <td>${{ request.monto_solicitado }}</td>
                <td>{{ request.expand?.banco_destino?.banco_nombre }}</td>
                <td>
                  <span :class="getStatusClass(request.estado)">
                    {{ request.estado }}
                  </span>
                </td>
                <td>
                  <button @click="viewDetails(request)" class="btn btn-sm btn-outline-info">
                    <i class="fas fa-eye"></i> Ver
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>

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
