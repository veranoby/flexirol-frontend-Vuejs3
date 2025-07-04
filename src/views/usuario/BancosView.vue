<template>
  <div class="container mt-4">
    <!-- Header con botón Agregar -->
    <div class="d-flex justify-content-between align-items-center mb-4">
      <h3>Mis Cuentas Bancarias</h3>
      <button @click="openCreateModal" class="btn btn-primary">
        <i class="fas fa-plus"></i> Agregar Cuenta
      </button>
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
              <span :class="account.activa ? 'badge bg-success' : 'badge bg-secondary'">
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
      <!-- Modal content with form -->
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useBankAccountsStore } from '@/stores/bankAccounts'
import { Modal } from 'bootstrap'

const authStore = useAuthStore()
const bankAccountsStore = useBankAccountsStore()

const modalRef = ref(null)
const formData = ref({
  banco_nombre: '',
  tipo_cuenta: 'ahorros',
  numero_cuenta: '',
  propietario: '',
  activa: true,
})

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

onMounted(async () => {
  await bankAccountsStore.fetchUserBankAccounts(authStore.user.id)
  modalRef.value = new Modal(document.getElementById('bankAccountModal'))
})

const openCreateModal = () => {
  resetForm()
  modalRef.value.show()
}

const handleSubmit = async () => {
  if (formData.value.id) {
    await bankAccountsStore.updateBankAccount(formData.value.id, formData.value)
  } else {
    await bankAccountsStore.createBankAccount({
      ...formData.value,
      user_id: authStore.user.id,
    })
  }
  modalRef.value.hide()
}
</script>
