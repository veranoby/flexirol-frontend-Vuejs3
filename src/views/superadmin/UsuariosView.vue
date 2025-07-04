<template>
  <div class="container mt-4">
    <div class="d-flex justify-content-between align-items-center mb-4">
      <h3>Gestión de Empleados</h3>
      <button @click="openCreateModal" class="btn btn-primary">
        <i class="fas fa-user-plus"></i> Crear Empleado
      </button>
    </div>

    <!-- Filtros -->
    <div class="card mb-4">
      <div class="card-body">
        <div class="row">
          <div class="col-md-4">
            <input
              v-model="filters.search"
              type="text"
              class="form-control"
              placeholder="Buscar por nombre, cédula o email..."
            />
          </div>
          <div class="col-md-3">
            <select v-model="filters.status" class="form-select">
              <option value="">Todos los estados</option>
              <option value="active">Activos</option>
              <option value="inactive">Inactivos</option>
            </select>
          </div>
          <div class="col-md-3">
            <button @click="clearFilters" class="btn btn-outline-secondary">
              <i class="fas fa-times"></i> Limpiar
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Tabla usuarios -->
    <div class="table-responsive">
      <table class="table table-striped table-hover">
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Cédula</th>
            <th>Email</th>
            <th>Disponible</th>
            <th>Estado</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="user in filteredUsers" :key="user.id">
            <td>{{ user.name }}</td>
            <td>{{ user.cedula }}</td>
            <td>{{ user.email }}</td>
            <td>${{ user.disponible }}</td>
            <td>
              <span :class="user.gearbox === 'true' ? 'badge bg-success' : 'badge bg-secondary'">
                {{ user.gearbox === 'true' ? 'Activo' : 'Inactivo' }}
              </span>
            </td>
            <td>
              <button @click="editUser(user)" class="btn btn-sm btn-outline-primary me-2">
                <i class="fas fa-edit"></i>
              </button>
              <button @click="toggleUserStatus(user)" class="btn btn-sm btn-outline-warning me-2">
                <i class="fas fa-lock"></i>
              </button>
              <button @click="deleteUser(user.id)" class="btn btn-sm btn-outline-danger">
                <i class="fas fa-trash"></i>
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Modal Create/Edit -->
    <div class="modal fade" id="userModal" tabindex="-1">
      <div class="modal-dialog modal-lg">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">{{ isEdit ? 'Editar' : 'Crear' }} Empleado</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
          </div>
          <form @submit.prevent="handleSubmit">
            <div class="modal-body">
              <div class="row">
                <div class="col-md-6">
                  <label class="form-label">Nombre *</label>
                  <input v-model="formData.name" type="text" class="form-control" required />
                </div>
                <div class="col-md-6">
                  <label class="form-label">Cédula *</label>
                  <input
                    v-model="formData.cedula"
                    type="text"
                    class="form-control"
                    maxlength="10"
                    required
                  />
                </div>
              </div>
              <div class="row mt-3">
                <div class="col-md-6">
                  <label class="form-label">Email *</label>
                  <input v-model="formData.email" type="email" class="form-control" required />
                </div>
                <div class="col-md-6">
                  <label class="form-label">Username *</label>
                  <input v-model="formData.username" type="text" class="form-control" required />
                </div>
              </div>
              <div class="row mt-3">
                <div class="col-md-6">
                  <label class="form-label">Password *</label>
                  <input
                    v-model="formData.password"
                    type="password"
                    class="form-control"
                    required
                  />
                </div>
                <div class="col-md-6">
                  <label class="form-label">Monto Disponible *</label>
                  <div class="input-group">
                    <span class="input-group-text">$</span>
                    <input
                      v-model="formData.disponible"
                      type="number"
                      class="form-control"
                      min="0"
                      required
                    />
                  </div>
                </div>
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">
                Cancelar
              </button>
              <button type="submit" class="btn btn-primary">
                {{ isEdit ? 'Actualizar' : 'Crear' }} Empleado
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useUsersStore } from '@/stores/users'
import { Modal } from 'bootstrap'

const authStore = useAuthStore()
const usersStore = useUsersStore()

const modalRef = ref(null)
const isEdit = ref(false)
const formData = ref({
  name: '',
  cedula: '',
  email: '',
  username: '',
  password: '',
  disponible: 0,
  role: 'usuario',
  gearbox: 'true',
})

const filters = ref({
  search: '',
  status: '',
})

const filteredUsers = computed(() => {
  let users = usersStore.users.filter(
    (user) => user.empresa_id === authStore.user.id && user.role === 'usuario',
  )

  if (filters.value.search) {
    const search = filters.value.search.toLowerCase()
    users = users.filter(
      (user) =>
        user.name.toLowerCase().includes(search) ||
        user.cedula.includes(search) ||
        user.email.toLowerCase().includes(search),
    )
  }

  if (filters.value.status) {
    users = users.filter((user) => {
      if (filters.value.status === 'active') return user.gearbox === 'true'
      if (filters.value.status === 'inactive') return user.gearbox === 'false'
      return true
    })
  }

  return users
})

onMounted(async () => {
  await usersStore.fetchUsersByRole('usuario', authStore.user.id)
  modalRef.value = new Modal(document.getElementById('userModal'))
})

const openCreateModal = () => {
  isEdit.value = false
  resetForm()
  modalRef.value.show()
}

const editUser = (user) => {
  isEdit.value = true
  Object.assign(formData.value, user)
  modalRef.value.show()
}

const handleSubmit = async () => {
  const userData = {
    ...formData.value,
    empresa_id: authStore.user.id,
  }

  if (isEdit.value) {
    await usersStore.updateUser(formData.value.id, userData)
  } else {
    await usersStore.createUser(userData)
  }

  modalRef.value.hide()
  resetForm()
}

const toggleUserStatus = async (user) => {
  await usersStore.toggleUserStatus(user.id)
}

const deleteUser = async (userId) => {
  if (confirm('¿Está seguro de eliminar este empleado?')) {
    await usersStore.deleteUser(userId)
  }
}

const clearFilters = () => {
  filters.value = { search: '', status: '' }
}

const resetForm = () => {
  formData.value = {
    name: '',
    cedula: '',
    email: '',
    username: '',
    password: '',
    disponible: 0,
    role: 'usuario',
    gearbox: 'true',
  }
}
</script>
