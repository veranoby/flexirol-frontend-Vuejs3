<template>
  <div class="container mt-4">
    <!-- Header con botón Agregar -->
    <div class="d-flex justify-content-between align-items-center mb-4">
      <h3>Mis Cuentas Bancarias</h3>
      <button @click="openCreateModal" class="btn btn-primary" :disabled="!isFormValid">
        <i class="fas fa-plus"></i> Agregar Cuenta
      </button>
    </div>
    
    <!-- Mensaje de verificación de cuentas -->
    <div v-if="hasPendingVerification" class="alert alert-warning">
      <i class="fas fa-info-circle me-2"></i>
      Las cuentas nuevas requieren 24 horas para verificación antes de poder ser utilizadas.
    </div>

    <!-- Tabla de cuentas -->
    <div class="table-responsive">
      <table class="table table-striped table-hover">
        <thead>
          <tr>
            <th>Banco</th>
            <th>Tipo</th>
            <th>Número</th>
            <th>Propietario</th>
            <th>Estado</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="account in bankAccountsStore.bankAccounts" :key="account.id">
            <td>{{ account.banco_nombre }}</td>
            <td>{{ account.tipo_cuenta }}</td>
            <td>{{ account.numero_cuenta }}</td>
            <td>{{ account.propietario }}</td>
            <td>
              <span 
                v-if="isAccountInVerification(account)"
                class="badge bg-warning text-dark"
                :title="'Verificación en proceso. Disponible ' + formatVerificationTime(account.created_at)"
                data-bs-toggle="tooltip"
                data-bs-placement="top"
              >
                <i class="fas fa-clock me-1"></i> Verificándose...
              </span>
              <span 
                v-else 
                :class="account.activa ? 'badge bg-success' : 'badge bg-secondary'"
              >
                {{ account.activa ? 'Activa' : 'Inactiva' }}
              </span>
            </td>
            <td>
              <button @click="editAccount(account)" class="btn btn-sm btn-outline-primary me-2">
                <i class="fas fa-edit"></i>
              </button>
              <button @click="deleteAccount(account.id)" class="btn btn-sm btn-outline-danger">
                <i class="fas fa-trash"></i>
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Modal Create/Edit -->
    <div class="modal fade" id="bankAccountModal" tabindex="-1">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">{{ formData.id ? 'Editar' : 'Nueva' }} Cuenta Bancaria</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
          <form @submit.prevent="handleSubmit">
            <div class="modal-body">
              <div class="mb-3">
                <label class="form-label">Banco <span class="text-danger">*</span></label>
                <select 
                  v-model="formData.banco_nombre" 
                  class="form-select"
                  required
                  @blur="validateForm"
                >
                  <option value="">Seleccione un banco</option>
                  <option v-for="banco in bancos" :key="banco" :value="banco">{{ banco }}</option>
                </select>
              </div>
              
              <div class="mb-3">
                <label class="form-label">Tipo de Cuenta <span class="text-danger">*</span></label>
                <select 
                  v-model="formData.tipo_cuenta" 
                  class="form-select"
                  required
                >
                  <option value="ahorros">Ahorros</option>
                  <option value="corriente">Corriente</option>
                </select>
              </div>
              
              <div class="mb-3">
                <label class="form-label">Número de Cuenta <span class="text-danger">*</span></label>
                <input 
                  type="text" 
                  v-model="formData.numero_cuenta" 
                  class="form-control" 
                  required
                  @input="validateAccountNumber"
                >
                <div v-if="errors.numero_cuenta" class="text-danger small">{{ errors.numero_cuenta }}</div>
              </div>
              
              <div class="mb-3">
                <label class="form-label">Propietario <span class="text-danger">*</span></label>
                <input 
                  type="text" 
                  v-model="formData.propietario" 
                  class="form-control" 
                  required
                  @input="validateOwnerName"
                >
                <div v-if="errors.propietario" class="text-danger small">{{ errors.propietario }}</div>
              </div>
              
              <div class="mb-3">
                <label class="form-label">Email <span class="text-danger">*</span></label>
                <input 
                  type="email" 
                  v-model="formData.email" 
                  class="form-control" 
                  required
                  @input="validateEmail"
                >
                <div v-if="errors.email" class="text-danger small">{{ errors.email }}</div>
              </div>
              
              <div class="alert alert-info">
                <i class="fas fa-info-circle me-2"></i>
                La cuenta debe estar a nombre del titular y coincidir con la cédula registrada.
              </div>
              
              <div v-if="formErrors.length > 0" class="alert alert-danger">
                <ul class="mb-0">
                  <li v-for="(error, index) in formErrors" :key="index">{{ error }}</li>
                </ul>
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
              <button type="submit" class="btn btn-primary" :disabled="!isFormValid || isSubmitting">
                <span v-if="isSubmitting" class="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
                {{ formData.id ? 'Actualizar' : 'Guardar' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, nextTick } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useBankAccountsStore } from '@/stores/bankAccounts'
import { Modal, Tooltip } from 'bootstrap'

const authStore = useAuthStore()
const bankAccountsStore = useBankAccountsStore()

const modalRef = ref(null)
const formData = ref({
  id: null,
  banco_nombre: '',
  tipo_cuenta: 'ahorros',
  numero_cuenta: '',
  propietario: '',
  email: '',
  activa: true,
  created_at: null
})

const errors = ref({
  numero_cuenta: '',
  propietario: '',
  email: ''
})

const formErrors = ref([])
const isSubmitting = ref(false)
const tooltips = ref([])

const bancos = [
  'Pacífico',
  'Guayaquil',
  'Austro',
  'Produbanco',
  'Pichincha',
  'Internacional',
  'Bolivariano',
  'Solidario',
]

// Computed properties
const userLastName = computed(() => {
  const names = authStore.user?.name?.split(' ') || []
  return names.length > 1 ? names[names.length - 1] : ''
})

const hasPendingVerification = computed(() => {
  return bankAccountsStore.bankAccounts.some(account => isAccountInVerification(account))
})

const isFormValid = computed(() => {
  return (
    formData.value.banco_nombre &&
    formData.value.tipo_cuenta &&
    formData.value.numero_cuenta &&
    formData.value.propietario &&
    formData.value.email &&
    !errors.value.numero_cuenta &&
    !errors.value.propietario &&
    !errors.value.email &&
    formErrors.value.length === 0
  )
})

// Methods
const isAccountInVerification = (account) => {
  if (!account.created_at) return false
  const createdDate = new Date(account.created_at)
  const now = new Date()
  const diffHours = (now - createdDate) / (1000 * 60 * 60)
  return diffHours < 24
}

const formatVerificationTime = (dateString) => {
  if (!dateString) return ''
  const createdDate = new Date(dateString)
  const availableDate = new Date(createdDate.getTime() + 24 * 60 * 60 * 1000)
  return availableDate.toLocaleString('es-EC', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const validateOwnerName = () => {
  if (!formData.value.propietario) {
    errors.value.propietario = 'El nombre del propietario es requerido'
    return false
  }
  
  // Verificar que el apellido del usuario esté incluido en el nombre del propietario
  if (userLastName.value && !formData.value.propietario.toLowerCase().includes(userLastName.value.toLowerCase())) {
    errors.value.propietario = 'El nombre del propietario debe incluir su apellido registrado'
    return false
  }
  
  errors.value.propietario = ''
  return true
}

const validateAccountNumber = () => {
  if (!formData.value.numero_cuenta) {
    errors.value.numero_cuenta = 'El número de cuenta es requerido'
    return false
  }
  
  if (!/^[0-9]+$/.test(formData.value.numero_cuenta)) {
    errors.value.numero_cuenta = 'El número de cuenta solo puede contener dígitos'
    return false
  }
  
  errors.value.numero_cuenta = ''
  return true
}

const validateEmail = () => {
  const email = formData.value.email
  if (!email) {
    errors.value.email = 'El correo electrónico es requerido'
    return false
  }
  
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/
  if (!emailRegex.test(email)) {
    errors.value.email = 'Ingrese un correo electrónico válido'
    return false
  }
  
  errors.value.email = ''
  return true
}

const validateForm = () => {
  formErrors.value = []
  
  // Validar que la cuenta sea personal
  if (formData.value.propietario && userLastName.value && 
      !formData.value.propietario.toLowerCase().includes(userLastName.value.toLowerCase())) {
    formErrors.value.push('La cuenta debe ser PERSONAL del usuario de la empresa')
  }
  
  // Validar formato de email
  if (formData.value.email && !validateEmail()) {
    formErrors.value.push('El correo electrónico no es válido')
  }
  
  return formErrors.value.length === 0
}

const resetForm = () => {
  formData.value = {
    id: null,
    banco_nombre: '',
    tipo_cuenta: 'ahorros',
    numero_cuenta: '',
    propietario: authStore.user?.name || '',
    email: authStore.user?.email || '',
    activa: true,
    created_at: null
  }
  
  // Reset errors
  errors.value = {
    numero_cuenta: '',
    propietario: '',
    email: ''
  }
  
  formErrors.value = [] 
}

const editAccount = (account) => {
  formData.value = { ...account }
  modalRef.value.show()
}

const deleteAccount = async (id) => {
  if (confirm('¿Está seguro de eliminar esta cuenta bancaria?')) {
    await bankAccountsStore.deleteBankAccount(id)
  }
}

// Initialize tooltips when component is mounted
const initTooltips = () => {
  // Destroy existing tooltips
  tooltips.value.forEach(tooltip => tooltip.dispose())
  tooltips.value = []
  
  // Initialize new tooltips
  document.querySelectorAll('[data-bs-toggle="tooltip"]').forEach(el => {
    tooltips.value.push(new Tooltip(el))
  })
}

onMounted(async () => {
  await bankAccountsStore.fetchUserBankAccounts(authStore.user.id)
  modalRef.value = new Modal(document.getElementById('bankAccountModal'))
  
  // Initialize tooltips after component is mounted
  nextTick(() => {
    initTooltips()
  })
})

const openCreateModal = () => {
  resetForm()
  modalRef.value.show()
  
  // Reinitialize tooltips when modal is shown
  nextTick(() => {
    initTooltips()
  })
}

const handleSubmit = async () => {
  if (!validateForm()) {
    return
  }
  
  isSubmitting.value = true
  
  try {
    if (formData.value.id) {
      await bankAccountsStore.updateBankAccount(formData.value.id, formData.value)
    } else {
      await bankAccountsStore.createBankAccount({
        ...formData.value,
        user_id: authStore.user.id,
        created_at: new Date().toISOString()
      })
    }
    
    modalRef.value.hide()
    
    // Show success message
    alert('Cuenta guardada exitosamente. ' + 
      (formData.value.id ? 'Los cambios se han aplicado.' : 
       'La cuenta estará en proceso de verificación por 24 horas.'))
    
  } catch (error) {
    console.error('Error al guardar la cuenta:', error)
    alert('Ocurrió un error al guardar la cuenta. Por favor, intente nuevamente.')
  } finally {
    isSubmitting.value = false
  }
}
</script>
