<template>
  <div class="create-users">
    <!-- Loading & Alerts -->
    <div v-if="loading" class="text-center p-4">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">Cargando...</span>
      </div>
    </div>

    <!-- Alert Messages -->
    <div
      v-if="alertMessage"
      class="alert alert-dismissible fade show position-fixed fixed-top"
      :class="alertClass"
      style="z-index: 2000"
    >
      <h4>
        <strong>{{ alertMessage }}</strong>
      </h4>
      <button type="button" class="btn-close" @click="clearAlert"></button>
    </div>

    <!-- Main Content -->
    <div v-show="!loading">
      <!-- Header Controls -->
      <div class="row mb-4">
        <div class="col-md-6">
          <h3 class="text-flexirol-primary">
            <i class="fas fa-users me-2"></i>
            Gestión de Usuarios
          </h3>
        </div>
        <div class="col-md-6 text-end">
          <div class="btn-group" role="group">
            <button
              type="button"
              class="btn btn-flexirol-primary"
              :class="{ active: tipoUsuario === 'empresa' }"
              @click="tipoUsuario = 'empresa'"
            >
              <i class="fas fa-building me-1"></i>Empresas
            </button>
            <button
              type="button"
              class="btn btn-flexirol-secondary"
              :class="{ active: tipoUsuario === 'personal' }"
              @click="tipoUsuario = 'personal'"
            >
              <i class="fas fa-user me-1"></i>Personal
            </button>
          </div>
          <button class="btn btn-flexirol-tertiary ms-2" @click="openCreateModal">
            <i class="fas fa-plus me-1"></i>Nuevo Usuario
          </button>
        </div>
      </div>

      <!-- Filters -->
      <div class="row mb-3">
        <div class="col-md-4">
          <input
            v-model="filters.search"
            type="text"
            class="form-control"
            placeholder="Buscar usuarios..."
          />
        </div>
        <div class="col-md-3">
          <select v-model="filters.status" class="form-select">
            <option value="">Todos los estados</option>
            <option value="true">Habilitados</option>
            <option value="false">Bloqueados</option>
          </select>
        </div>
        <div class="col-md-3" v-if="authStore.isSuperadmin">
          <select v-model="filters.empresa" class="form-select">
            <option value="">Todas las empresas</option>
            <option v-for="empresa in empresas" :key="empresa.id" :value="empresa.id">
              {{ empresa.name }}
            </option>
          </select>
        </div>
        <div class="col-md-2">
          <button class="btn btn-outline-secondary" @click="clearFilters">
            <i class="fas fa-times me-1"></i>Limpiar
          </button>
        </div>
      </div>

      <!-- Users Table -->
      <div class="card card-flexirol">
        <div class="card-header">
          <i class="fas fa-table me-2"></i>
          {{ tipoUsuario === 'empresa' ? 'Empresas' : 'Usuarios' }}
          ({{ filteredUsers.length }})
        </div>
        <div class="card-body">
          <div v-if="filteredUsers.length" class="table-responsive">
            <table class="table table-flexirol table-hover">
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th v-if="tipoUsuario === 'empresa'">Sucursal</th>
                  <th v-else>Apellido</th>
                  <th>Email</th>
                  <th v-if="tipoUsuario !== 'empresa'">Cédula</th>
                  <th>Estado</th>
                  <th v-if="tipoUsuario !== 'empresa'">Disponible</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="user in filteredUsers" :key="user.id">
                  <td>{{ user.name }}</td>
                  <td>{{ user.last_name || '-' }}</td>
                  <td>{{ user.email }}</td>
                  <td v-if="tipoUsuario !== 'empresa'">{{ user.cedula || '-' }}</td>
                  <td>
                    <span :class="user.gearbox ? 'badge bg-success' : 'badge bg-danger'">
                      {{ user.gearbox ? 'Habilitado' : 'Bloqueado' }}
                    </span>
                  </td>
                  <td v-if="tipoUsuario !== 'empresa'">${{ user.disponible || 0 }}</td>
                  <td>
                    <div class="btn-group btn-group-sm">
                      <button
                        class="btn btn-outline-primary"
                        @click="openEditModal(user)"
                        title="Editar"
                      >
                        <i class="fas fa-edit"></i>
                      </button>
                      <button
                        class="btn btn-outline-danger"
                        @click="openDeleteModal(user)"
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
          <div v-else class="text-center py-4">
            <i class="fas fa-users fa-3x text-muted mb-3"></i>
            <p class="text-muted">{{ errMsg }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Create Modal -->
    <div class="modal fade" id="createModal" tabindex="-1" ref="createModal">
      <div class="modal-dialog modal-xl">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">
              <i class="fas fa-user-plus me-2"></i>
              Crear Nuevo {{ tipoUsuario === 'empresa' ? 'Empresa' : 'Usuario' }}
            </h5>
            <button type="button" class="btn-close" @click="closeCreateModal"></button>
          </div>
          <div class="modal-body">
            <form @submit.prevent="createUser">
              <div class="row">
                <div class="col-md-3">
                  <label class="form-label"> <i class="fas fa-user-tie me-1"></i>Nombre* </label>
                  <input
                    v-model="newItem.name"
                    type="text"
                    class="form-control"
                    :class="{ 'is-invalid': errors.name }"
                    placeholder="Ingrese nombre"
                    @input="generateUsername"
                    required
                  />
                  <div v-if="errors.name" class="invalid-feedback">{{ errors.name }}</div>
                </div>

                <div class="col-md-3">
                  <label class="form-label">
                    <i
                      :class="tipoUsuario === 'empresa' ? 'fas fa-street-view' : 'fas fa-user-tag'"
                      class="me-1"
                    ></i>
                    {{ tipoUsuario === 'empresa' ? 'Sucursal' : 'Apellido*' }}
                  </label>
                  <input
                    v-model="newItem.last_name"
                    type="text"
                    class="form-control"
                    :class="{ 'is-invalid': errors.last_name }"
                    :placeholder="
                      tipoUsuario === 'empresa' ? 'Ingrese sucursal' : 'Ingrese apellido'
                    "
                    @input="generateUsername"
                    :required="tipoUsuario !== 'empresa'"
                  />
                  <div v-if="errors.last_name" class="invalid-feedback">{{ errors.last_name }}</div>
                </div>

                <div class="col-md-3">
                  <label class="form-label"> <i class="far fa-envelope me-1"></i>Email* </label>
                  <input
                    v-model="newItem.email"
                    type="email"
                    class="form-control"
                    :class="{ 'is-invalid': errors.email }"
                    placeholder="usuario@email.com"
                    required
                  />
                  <div v-if="errors.email" class="invalid-feedback">{{ errors.email }}</div>
                </div>

                <div class="col-md-3">
                  <label class="form-label">Estado</label>
                  <div class="form-check-inline">
                    <input
                      v-model="newItem.gearbox"
                      type="radio"
                      :value="true"
                      class="form-check-input"
                      id="enabledNew"
                    />
                    <label for="enabledNew" class="form-check-label me-3">Habilitado</label>

                    <input
                      v-model="newItem.gearbox"
                      type="radio"
                      :value="false"
                      class="form-check-input"
                      id="blockedNew"
                    />
                    <label for="blockedNew" class="form-check-label">Bloqueado</label>
                  </div>
                </div>
              </div>

              <!-- Campos específicos para usuarios no-empresa -->
              <div v-if="tipoUsuario !== 'empresa'" class="row mt-3">
                <div class="col-md-3">
                  <label class="form-label"> <i class="far fa-id-card me-1"></i>Cédula* </label>
                  <input
                    v-model="newItem.cedula"
                    type="text"
                    class="form-control"
                    :class="{ 'is-invalid': errors.cedula }"
                    placeholder="1234567890"
                    required
                  />
                  <div v-if="errors.cedula" class="invalid-feedback">{{ errors.cedula }}</div>
                </div>

                <div class="col-md-3">
                  <label class="form-label">
                    <i class="fas fa-birthday-cake me-1"></i>Fecha Nacimiento
                  </label>
                  <input v-model="newItem.birth_date" type="date" class="form-control" />
                </div>

                <div class="col-md-3">
                  <label class="form-label">
                    <i class="fas fa-dollar-sign me-1"></i>Monto Disponible
                  </label>
                  <input
                    v-model.number="newItem.disponible"
                    type="number"
                    class="form-control"
                    placeholder="0"
                    min="0"
                  />
                </div>

                <div class="col-md-3">
                  <label class="form-label">Género</label>
                  <div>
                    <input
                      v-model="newItem.gender"
                      type="radio"
                      :value="true"
                      class="form-check-input"
                      id="masculinoNew"
                    />
                    <label for="masculinoNew" class="form-check-label me-3">Masculino</label>

                    <input
                      v-model="newItem.gender"
                      type="radio"
                      :value="false"
                      class="form-check-input"
                      id="femeninoNew"
                    />
                    <label for="femeninoNew" class="form-check-label">Femenino</label>
                  </div>
                </div>
              </div>

              <!-- Campos de ubicación -->
              <div class="row mt-3">
                <div class="col-md-4">
                  <label class="form-label"> <i class="fas fa-phone me-1"></i>Teléfono </label>
                  <input
                    v-model="newItem.phone_number"
                    type="text"
                    class="form-control"
                    placeholder="0999999999"
                  />
                </div>

                <div class="col-md-4">
                  <label class="form-label">
                    <i class="fas fa-map-marker-alt me-1"></i>Ciudad
                  </label>
                  <input
                    v-model="newItem.city"
                    type="text"
                    class="form-control"
                    placeholder="Guayaquil"
                  />
                </div>

                <div class="col-md-4">
                  <label class="form-label">
                    <i class="fas fa-location-arrow me-1"></i>Dirección
                  </label>
                  <input
                    v-model="newItem.address"
                    type="text"
                    class="form-control"
                    placeholder="Av. Principal 123"
                  />
                </div>
              </div>

              <!-- Empresa assignment for non-superadmin -->
              <div v-if="!authStore.isSuperadmin && tipoUsuario !== 'empresa'" class="row mt-3">
                <div class="col-md-6">
                  <label class="form-label">Empresa</label>
                  <input :value="currentCompanyName" type="text" class="form-control" readonly />
                </div>
              </div>

              <!-- Empresa selection for superadmin -->
              <div v-if="authStore.isSuperadmin && tipoUsuario !== 'empresa'" class="row mt-3">
                <div class="col-md-6">
                  <label class="form-label">Asignar a Empresa</label>
                  <select v-model="newItem.empresa_id" class="form-select" required>
                    <option value="">Seleccione empresa</option>
                    <option v-for="empresa in empresas" :key="empresa.id" :value="empresa.id">
                      {{ empresa.name }}
                    </option>
                  </select>
                </div>
              </div>
            </form>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" @click="closeCreateModal">
              Cancelar
            </button>
            <button
              type="button"
              class="btn btn-flexirol-primary"
              @click="createUser"
              :disabled="!canSave || loading"
            >
              <i class="fas fa-save me-1"></i>
              {{ loading ? 'Guardando...' : 'Crear Usuario' }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Edit Modal -->
    <div class="modal fade" id="editModal" tabindex="-1" ref="editModal">
      <div class="modal-dialog modal-xl">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">
              <i class="fas fa-user-edit me-2"></i>
              Editar Usuario
            </h5>
            <button type="button" class="btn-close" @click="closeEditModal"></button>
          </div>
          <div class="modal-body">
            <form @submit.prevent="updateUser" v-if="editedItem">
              <div class="row">
                <div class="col-md-4">
                  <label class="form-label"> <i class="fas fa-user-tie me-1"></i>Nombre* </label>
                  <input
                    v-model="editedItem.name"
                    type="text"
                    class="form-control"
                    placeholder="Nombre de empresa"
                    required
                  />
                </div>

                <div class="col-md-4">
                  <label class="form-label">
                    <i
                      :class="
                        editedItem.role === 'empresa' ? 'fas fa-street-view' : 'fas fa-user-tag'
                      "
                      class="me-1"
                    ></i>
                    {{ editedItem.role === 'empresa' ? 'Sucursal' : 'Apellido*' }}
                  </label>
                  <input
                    v-model="editedItem.last_name"
                    type="text"
                    class="form-control"
                    placeholder="Ingrese aquí"
                  />
                </div>

                <div class="col-md-4">
                  <label class="form-label">
                    <i class="fas fa-id-badge me-1"></i>Username: {{ editedItem.username }}
                  </label>
                  <div class="mt-2">
                    <input
                      v-model="editedItem.gearbox"
                      type="radio"
                      :value="true"
                      class="form-check-input"
                      id="enabledEdit"
                    />
                    <label for="enabledEdit" class="form-check-label me-3"
                      >Usuario Habilitado</label
                    >

                    <input
                      v-model="editedItem.gearbox"
                      type="radio"
                      :value="false"
                      class="form-check-input"
                      id="blockedEdit"
                    />
                    <label for="blockedEdit" class="form-check-label">Bloqueado</label>
                  </div>
                </div>
              </div>

              <div class="row mt-3">
                <div class="col-md-4">
                  <label class="form-label"> <i class="fas fa-envelope me-1"></i>Email* </label>
                  <input
                    v-model="editedItem.email"
                    type="email"
                    class="form-control"
                    placeholder="Ingrese email"
                    required
                  />
                </div>

                <div class="col-md-4">
                  <label class="form-label"> <i class="fas fa-phone me-1"></i>Teléfono </label>
                  <input
                    v-model="editedItem.phone_number"
                    type="text"
                    class="form-control"
                    placeholder="Ingrese teléfono"
                  />
                </div>

                <div class="col-md-4">
                  <label class="form-label">
                    <i class="fas fa-map-marker-alt me-1"></i>Ciudad
                  </label>
                  <input
                    v-model="editedItem.city"
                    type="text"
                    class="form-control"
                    placeholder="Ingrese ciudad"
                  />
                </div>
              </div>

              <div class="row mt-3">
                <div class="col-md-8">
                  <label class="form-label">
                    <i class="fas fa-location-arrow me-1"></i>Dirección
                  </label>
                  <input
                    v-model="editedItem.address"
                    type="text"
                    class="form-control"
                    placeholder="Ingrese dirección"
                  />
                </div>
              </div>

              <!-- Usuario specific fields -->
              <div v-if="editedItem.role === 'usuario'" class="row mt-3">
                <div class="col-md-4">
                  <label class="form-label"> <i class="far fa-id-card me-1"></i>Cédula* </label>
                  <input
                    v-model="editedItem.cedula"
                    type="text"
                    class="form-control"
                    placeholder="Ingrese cédula"
                  />
                </div>

                <div class="col-md-4">
                  <label class="form-label">
                    <i class="fas fa-birthday-cake me-1"></i>Fecha de nacimiento
                  </label>
                  <input v-model="editedItem.birth_date" type="date" class="form-control" />
                </div>

                <div class="col-md-4">
                  <label class="form-label">Género</label>
                  <div>
                    <input
                      v-model="editedItem.gender"
                      type="radio"
                      :value="true"
                      class="form-check-input"
                      id="masculinoEdit"
                    />
                    <label for="masculinoEdit" class="form-check-label me-3">Masculino</label>

                    <input
                      v-model="editedItem.gender"
                      type="radio"
                      :value="false"
                      class="form-check-input"
                      id="femeninoEdit"
                    />
                    <label for="femeninoEdit" class="form-check-label">Femenino</label>
                  </div>
                </div>

                <div class="col-md-12 mt-3">
                  <hr />
                  <div class="row">
                    <div class="col-md-4">
                      <label class="form-label">
                        <i class="fas fa-dollar-sign me-1"></i>Monto Disponible*
                      </label>
                      <input
                        v-model.number="editedItem.disponible"
                        type="number"
                        class="form-control"
                        placeholder="Ingrese monto disponible"
                        min="0"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </form>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" @click="closeEditModal">
              Cancelar
            </button>
            <button
              type="button"
              class="btn btn-flexirol-primary"
              @click="updateUser"
              :disabled="!canSaveEdit || loading"
            >
              <i class="fas fa-save me-1"></i>
              {{ loading ? 'Guardando...' : 'Guardar Cambios' }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Delete Modal -->
    <div class="modal fade" id="deleteModal" tabindex="-1" ref="deleteModal">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title text-danger">
              <i class="fas fa-exclamation-triangle me-2"></i>
              Confirmar Eliminación
            </h5>
            <button type="button" class="btn-close" @click="closeDeleteModal"></button>
          </div>
          <div class="modal-body" v-if="deleteItem">
            <p class="mb-3">
              <strong>¿Está seguro de eliminar este usuario?</strong>
            </p>
            <div class="alert alert-warning">
              <i class="fas fa-exclamation-triangle me-2"></i>
              <strong>{{ deleteItem.name }} {{ deleteItem.last_name }}</strong
              ><br />
              Email: {{ deleteItem.email }}
            </div>
            <p v-if="deleteItem.role === 'empresa'" class="text-danger">
              <strong>Esto eliminará la empresa y todos sus usuarios asociados.</strong>
            </p>
            <p class="text-muted mb-0">Esta acción no se puede deshacer.</p>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" @click="closeDeleteModal">
              Cancelar
            </button>
            <button type="button" class="btn btn-danger" @click="deleteUser" :disabled="loading">
              <i class="fas fa-trash me-1"></i>
              {{ loading ? 'Eliminando...' : 'ELIMINAR' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, nextTick } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { api } from '@/services/pocketbase'
import { Modal } from 'bootstrap'

const authStore = useAuthStore()

// Reactive data
const loading = ref(false)
const tipoUsuario = ref('empresa')
const users = ref([])
const empresas = ref([])

// Alert system
const alertMessage = ref('')
const alertClass = ref('')

// Filters
const filters = reactive({
  search: '',
  status: '',
  empresa: '',
})

// Form data
const newItem = reactive({
  name: '',
  last_name: '',
  email: '',
  username: '',
  password: '',
  role: 'usuario',
  gearbox: true,
  cedula: '',
  disponible: 0,
  empresa_id: '',
  city: '',
  address: '',
  birth_date: '',
  phone_number: '',
  gender: null,
})

const editedItem = ref(null)
const deleteItem = ref(null)

// Form errors
const errors = reactive({
  name: '',
  last_name: '',
  email: '',
  cedula: '',
})

// Error message
const errMsg = ref('No hay usuarios en los registros.')

// Modal refs
const createModal = ref(null)
const editModal = ref(null)
const deleteModal = ref(null)

// Computed
const filteredUsers = computed(() => {
  let filtered = users.value.filter((user) => {
    // Filter by type
    if (tipoUsuario.value === 'empresa' && user.role !== 'empresa') return false
    if (tipoUsuario.value === 'personal' && user.role === 'empresa') return false

    // Search filter
    if (filters.search) {
      const search = filters.search.toLowerCase()
      const matchName = user.name?.toLowerCase().includes(search)
      const matchEmail = user.email?.toLowerCase().includes(search)
      const matchCedula = user.cedula?.toLowerCase().includes(search)
      if (!matchName && !matchEmail && !matchCedula) return false
    }

    // Status filter
    if (filters.status !== '') {
      if (filters.status === 'true' && !user.gearbox) return false
      if (filters.status === 'false' && user.gearbox) return false
    }

    // Company filter (superadmin only)
    if (filters.empresa && user.empresa_id !== filters.empresa) return false

    return true
  })

  return filtered
})

const canSave = computed(() => {
  if (tipoUsuario.value === 'empresa') {
    return newItem.name && newItem.email
  } else {
    return newItem.name && newItem.last_name && newItem.cedula && newItem.email
  }
})

const canSaveEdit = computed(() => {
  if (!editedItem.value) return false

  if (editedItem.value.role === 'empresa') {
    return editedItem.value.name && editedItem.value.email
  } else {
    return editedItem.value.name && editedItem.value.last_name && editedItem.value.cedula
  }
})

const currentCompanyName = computed(() => {
  if (authStore.isEmpresa) {
    return authStore.user?.name || 'Mi Empresa'
  }
  return ''
})

// Methods
const loadUsers = async () => {
  loading.value = true
  try {
    const filters = {}

    // Apply role-based filters
    if (!authStore.isSuperadmin) {
      if (authStore.isEmpresa) {
        filters.empresa_id = authStore.user.id
      } else if (authStore.isOperador) {
        // Load users from assigned companies
        const companies = authStore.getUserCompanies()
        if (companies.length > 0) {
          filters.empresa_id = companies.join(',')
        }
      }
    }

    const result = await api.getUsers(filters)
    users.value = result.items.map((user) => ({
      ...user,
      name: user.name || `${user.first_name} ${user.last_name}`.trim(),
    }))
  } catch (error) {
    showAlert('Error al cargar usuarios: ' + error.message, 'error')
  } finally {
    loading.value = false
  }
}

const loadEmpresas = async () => {
  if (authStore.isSuperadmin) {
    try {
      const result = await api.getUsers({ role: 'empresa' })
      empresas.value = result.items.map((empresa) => ({
        id: empresa.id,
        name: empresa.name || `${empresa.first_name} ${empresa.last_name}`.trim(),
      }))
    } catch (error) {
      console.error('Error loading empresas:', error)
    }
  }
}

const generateUsername = () => {
  if (newItem.name && newItem.last_name) {
    newItem.username = `${newItem.name.toLowerCase()}.${newItem.last_name.toLowerCase()}`
      .replace(/\s+/g, '')
      .replace(/[^a-z0-9.]/g, '')
  }
}

const validateForm = () => {
  errors.name = newItem.name ? '' : 'El nombre es requerido'
  errors.email = newItem.email ? '' : 'El email es requerido'

  if (tipoUsuario.value !== 'empresa') {
    errors.last_name = newItem.last_name ? '' : 'El apellido es requerido'
    errors.cedula = newItem.cedula ? '' : 'La cédula es requerida'
  }

  return !Object.values(errors).some((error) => error)
}

const createUser = async () => {
  if (!validateForm()) return

  loading.value = true
  try {
    const userData = {
      email: newItem.email,
      password: newItem.cedula || 'temporal123',
      passwordConfirm: newItem.cedula || 'temporal123',
      name: newItem.name,
      last_name: newItem.last_name,
      role: tipoUsuario.value === 'empresa' ? 'empresa' : newItem.role,
      gearbox: newItem.gearbox,
      cedula: newItem.cedula,
      disponible: newItem.disponible,
      city: newItem.city,
      address: newItem.address,
      birth_date: newItem.birth_date,
      phone_number: newItem.phone_number,
      gender: newItem.gender,
      verified: true,
    }

    // Set empresa_id
    if (tipoUsuario.value !== 'empresa') {
      if (authStore.isSuperadmin) {
        userData.empresa_id = newItem.empresa_id
      } else {
        userData.empresa_id = authStore.user.id
      }
    }

    await api.createUser(userData)
    showAlert('Usuario creado exitosamente', 'success')
    closeCreateModal()
    loadUsers()
  } catch (error) {
    showAlert('Error al crear usuario: ' + error.message, 'error')
  } finally {
    loading.value = false
  }
}

const updateUser = async () => {
  if (!canSaveEdit.value) return

  loading.value = true
  try {
    const userData = {
      name: editedItem.value.name,
      last_name: editedItem.value.last_name,
      email: editedItem.value.email,
      gearbox: editedItem.value.gearbox,
      cedula: editedItem.value.cedula,
      disponible: editedItem.value.disponible,
      city: editedItem.value.city,
      address: editedItem.value.address,
      birth_date: editedItem.value.birth_date,
      phone_number: editedItem.value.phone_number,
      gender: editedItem.value.gender,
    }

    await api.updateUser(editedItem.value.id, userData)
    showAlert('Usuario actualizado exitosamente', 'success')
    closeEditModal()
    loadUsers()
  } catch (error) {
    showAlert('Error al actualizar usuario: ' + error.message, 'error')
  } finally {
    loading.value = false
  }
}

const deleteUser = async () => {
  if (!deleteItem.value) return

  loading.value = true
  try {
    await api.deleteUser(deleteItem.value.id)
    showAlert('Usuario eliminado exitosamente', 'success')
    closeDeleteModal()
    loadUsers()
  } catch (error) {
    showAlert('Error al eliminar usuario: ' + error.message, 'error')
  } finally {
    loading.value = false
  }
}

// Modal methods
const openCreateModal = () => {
  resetNewItem()
  nextTick(() => {
    const modal = new Modal(createModal.value)
    modal.show()
  })
}

const closeCreateModal = () => {
  const modal = Modal.getInstance(createModal.value)
  if (modal) modal.hide()
}

const openEditModal = (user) => {
  editedItem.value = { ...user }
  nextTick(() => {
    const modal = new Modal(editModal.value)
    modal.show()
  })
}

const closeEditModal = () => {
  const modal = Modal.getInstance(editModal.value)
  if (modal) modal.hide()
  editedItem.value = null
}

const openDeleteModal = (user) => {
  deleteItem.value = user
  nextTick(() => {
    const modal = new Modal(deleteModal.value)
    modal.show()
  })
}

const closeDeleteModal = () => {
  const modal = Modal.getInstance(deleteModal.value)
  if (modal) modal.hide()
  deleteItem.value = null
}

const resetNewItem = () => {
  Object.assign(newItem, {
    name: '',
    last_name: '',
    email: '',
    username: '',
    password: '',
    role: 'usuario',
    gearbox: true,
    cedula: '',
    disponible: 0,
    empresa_id: '',
    city: '',
    address: '',
    birth_date: '',
    phone_number: '',
    gender: null,
  })
  Object.assign(errors, {
    name: '',
    last_name: '',
    email: '',
    cedula: '',
  })
}

const clearFilters = () => {
  Object.assign(filters, {
    search: '',
    status: '',
    empresa: '',
  })
}

const showAlert = (message, type) => {
  alertMessage.value = message
  alertClass.value = type === 'success' ? 'alert-flexirol-success' : 'alert-flexirol-error'

  setTimeout(() => {
    clearAlert()
  }, 5000)
}

const clearAlert = () => {
  alertMessage.value = ''
  alertClass.value = ''
}

// Lifecycle
onMounted(() => {
  loadUsers()
  loadEmpresas()
})
</script>

<style scoped>
.create-users {
  padding: 20px;
}

.btn-group .btn.active {
  background-color: var(--flexirol-primary);
  border-color: var(--flexirol-primary);
  color: white;
}

.form-check-inline {
  display: flex;
  align-items: center;
  gap: 10px;
}

.modal-xl {
  max-width: 1200px;
}

@media (max-width: 768px) {
  .btn-group {
    width: 100%;
    margin-bottom: 10px;
  }

  .btn-group .btn {
    flex: 1;
  }
}
</style>
