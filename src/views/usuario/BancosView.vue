<template>
  <v-container class="mt-4">
    <!-- Header con botón Agregar -->
    <div class="d-flex justify-space-between align-center mb-4">
      <h3>Mis Cuentas Bancarias</h3>
      <v-btn @click="openCreateModal" color="primary" :disabled="!isFormValid">
        <v-icon left>mdi-plus</v-icon>
        Agregar Cuenta
      </v-btn>
    </div>
    
    <!-- Mensaje de verificación de cuentas -->
    <v-alert v-if="hasPendingVerification" type="warning" class="mb-4">
      <v-icon>mdi-information</v-icon>
      Las cuentas nuevas requieren 24 horas para verificación antes de poder ser utilizadas.
    </v-alert>

    <!-- Tabla de cuentas -->
    <v-card>
      <v-table>
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
              <v-chip
                v-if="isAccountInVerification(account)"
                color="warning"
                size="small"
                :title="'Verificación en proceso. Disponible ' + formatVerificationTime(account.created_at)"
              >
                <v-icon left size="small">mdi-clock</v-icon>
                Verificándose...
              </v-chip>
              <v-chip
                v-else
                :color="account.activa ? 'success' : 'secondary'"
                size="small"
              >
                {{ account.activa ? 'Activa' : 'Inactiva' }}
              </v-chip>
            </td>
            <td>
              <v-btn @click="editAccount(account)" size="small" variant="outlined" color="primary" class="me-2">
                <v-icon>mdi-pencil</v-icon>
              </v-btn>
              <v-btn @click="deleteAccount(account.id)" size="small" variant="outlined" color="error">
                <v-icon>mdi-delete</v-icon>
              </v-btn>
            </td>
          </tr>
        </tbody>
      </v-table>
    </v-card>

    <!-- Modal Create/Edit -->
    <v-dialog v-model="showModal" max-width="600px" persistent>
      <v-card>
        <v-card-title>{{ formData.id ? 'Editar' : 'Nueva' }} Cuenta Bancaria</v-card-title>
        <v-form @submit.prevent="handleSubmit">
          <v-card-text>
            <v-row>
              <v-col cols="12">
                <v-select
                  v-model="formData.banco_nombre"
                  :items="bancos"
                  label="Banco *"
                  required
                  @blur="validateForm"
                ></v-select>
              </v-col>
              
              <v-col cols="12">
                <v-select
                  v-model="formData.tipo_cuenta"
                  :items="[
                    { title: 'Ahorros', value: 'ahorros' },
                    { title: 'Corriente', value: 'corriente' }
                  ]"
                  label="Tipo de Cuenta *"
                  required
                ></v-select>
              </v-col>
              
              <v-col cols="12">
                <v-text-field
                  v-model="formData.numero_cuenta"
                  label="Número de Cuenta *"
                  required
                  @input="validateAccountNumber"
                  :error-messages="errors.numero_cuenta"
                ></v-text-field>
              </v-col>
              
              <v-col cols="12">
                <v-text-field
                  v-model="formData.propietario"
                  label="Propietario *"
                  required
                  @input="validateOwnerName"
                  :error-messages="errors.propietario"
                ></v-text-field>
              </v-col>
              
              <v-col cols="12">
                <v-text-field
                  v-model="formData.email"
                  label="Email *"
                  type="email"
                  required
                  @input="validateEmail"
                  :error-messages="errors.email"
                ></v-text-field>
              </v-col>
              
              <v-col cols="12">
                <v-alert type="info" variant="tonal">
                  <v-icon>mdi-information</v-icon>
                  La cuenta debe estar a nombre del titular y coincidir con la cédula registrada.
                </v-alert>
              </v-col>
              
              <v-col v-if="formErrors.length > 0" cols="12">
                <v-alert type="error" variant="tonal">
                  <ul class="mb-0">
                    <li v-for="(error, index) in formErrors" :key="index">{{ error }}</li>
                  </ul>
                </v-alert>
              </v-col>
            </v-row>
          </v-card-text>
          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn variant="outlined" @click="showModal = false">Cancelar</v-btn>
            <v-btn type="submit" color="primary" :loading="isSubmitting" :disabled="!isFormValid || isSubmitting">
              {{ formData.id ? 'Actualizar' : 'Guardar' }}
            </v-btn>
          </v-card-actions>
        </v-form>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup>
import { ref, onMounted, computed, nextTick } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useBankAccountsStore } from '@/stores/bankAccounts'
const authStore = useAuthStore()
const bankAccountsStore = useBankAccountsStore()

const showModal = ref(false)
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
  showModal.value = true
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
