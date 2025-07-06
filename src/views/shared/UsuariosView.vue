<template>
  <div class="usuarios-view">
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
          <!-- Company Selector (Solo Superadmin) -->
          <div v-if="canSelectCompany" class="row g-3">
            <div class="col-md-4">
              <label class="form-label">Empresa:</label>
              <select v-model="selectedCompanyId" class="form-select" @change="onCompanyChange">
                <option value="">-- Todas las Empresas --</option>
                <option v-for="company in availableCompanies" :key="company.id" :value="company.id">
                  {{ company.first_name }} {{ company.last_name }}
                </option>
              </select>
            </div>
            <div class="col-md-4">
              <label class="form-label">Tipo Usuario:</label>
              <select v-model="selectedUserType" class="form-select">
                <option value="">Todos</option>
                <option value="empresa">Empresas</option>
                <option value="operador">Operadores</option>
                <option value="usuario">Empleados</option>
              </select>
            </div>
          </div>

          <!-- Basic Filters -->
          <div v-else class="row g-3">
            <div class="col-md-6">
              <label class="form-label">Buscar empleados:</label>
              <div class="input-group">
                <input
                  v-model="searchTerm"
                  type="text"
                  class="form-control"
                  placeholder="Nombre, cédula o email..."
                  @input="onSearch"
                />
                <button class="btn btn-outline-secondary" type="button" @click="clearSearch">
                  <i class="fas fa-times"></i>
                </button>
              </div>
            </div>
            <div class="col-md-3">
              <label class="form-label">Estado:</label>
              <select v-model="statusFilter" class="form-select">
                <option value="">Todos</option>
                <option value="true">Habilitados</option>
                <option value="false">Bloqueados</option>
              </select>
            </div>
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="col-md-4 text-end">
          <button
            v-if="canCreateCompanies"
            class="btn btn-success me-2"
            @click="openCreateCompanyModal"
          >
            <i class="fas fa-building me-1"></i>Nueva Empresa
          </button>
          <button class="btn btn-primary" @click="openCreateUserModal">
            <i class="fas fa-user-plus me-1"></i>
            {{ canCreateCompanies ? 'Nuevo Usuario' : 'Nuevo Empleado' }}
          </button>
        </div>
      </div>

      <!-- Stats Cards (Solo Superadmin) -->
      <div v-if="authStore.isSuperadmin" class="row mb-4">
        <div class="col-md-3">
          <div class="card bg-primary text-white">
            <div class="card-body">
              <h6>Total Empresas</h6>
              <h3>{{ stats.totalCompanies }}</h3>
            </div>
          </div>
        </div>
        <div class="col-md-3">
          <div class="card bg-success text-white">
            <div class="card-body">
              <h6>Total Usuarios</h6>
              <h3>{{ stats.totalUsers }}</h3>
            </div>
          </div>
        </div>
        <div class="col-md-3">
          <div class="card bg-info text-white">
            <div class="card-body">
              <h6>Usuarios Activos</h6>
              <h3>{{ stats.activeUsers }}</h3>
            </div>
          </div>
        </div>
        <div class="col-md-3">
          <div class="card bg-warning text-white">
            <div class="card-body">
              <h6>Empresa Seleccionada</h6>
              <h3>{{ selectedCompanyUsersCount }}</h3>
            </div>
          </div>
        </div>
      </div>

      <!-- Users Table -->
      <div class="row">
        <div class="col-12">
          <div class="card">
            <div class="card-header d-flex justify-content-between align-items-center">
              <h5 class="mb-0">
                <i class="fas fa-users me-2"></i>
                {{ tableTitle }} ({{ filteredUsers.length }})
              </h5>
              <div class="d-flex gap-2">
                <button class="btn btn-sm btn-outline-secondary" @click="refreshUsers">
                  <i class="fas fa-sync-alt"></i>
                </button>
                <button
                  v-if="canExportData"
                  class="btn btn-sm btn-outline-primary"
                  @click="exportToExcel"
                >
                  <i class="fas fa-file-excel me-1"></i>Exportar
                </button>
              </div>
            </div>

            <div class="card-body p-0">
              <div v-if="filteredUsers.length === 0" class="text-center py-5">
                <i class="fas fa-users fa-3x text-muted mb-3"></i>
                <p class="text-muted">{{ emptyMessage }}</p>
              </div>

              <div v-else class="table-responsive">
                <table class="table table-hover mb-0">
                  <thead class="table-light">
                    <tr>
                      <th>Nombre</th>
                      <th>Email</th>
                      <th>Cédula</th>
                      <th v-if="showRoleColumn">Rol</th>
                      <th v-if="showCompanyColumn">Empresa</th>
                      <th>Estado</th>
                      <th v-if="showAmountColumn">Disponible</th>
                      <th>Fecha Creación</th>
                      <th width="120">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="user in paginatedUsers" :key="user.id">
                      <td>
                        <div class="d-flex align-items-center">
                          <div class="avatar-sm me-2">
                            <div class="avatar-initial bg-primary rounded-circle">
                              {{ user.first_name?.[0] }}{{ user.last_name?.[0] }}
                            </div>
                          </div>
                          <div>
                            <div class="fw-semibold">
                              {{ user.first_name }} {{ user.last_name }}
                            </div>
                            <small class="text-muted">@{{ user.username || user.cedula }}</small>
                          </div>
                        </div>
                      </td>
                      <td>{{ user.email }}</td>
                      <td>
                        <code class="text-dark">{{ user.cedula }}</code>
                      </td>
                      <td v-if="showRoleColumn">
                        <span :class="getRoleBadgeClass(user.role)">{{
                          getRoleLabel(user.role)
                        }}</span>
                      </td>
                      <td v-if="showCompanyColumn">
                        <span v-if="user.company"
                          >{{ user.company.first_name }} {{ user.company.last_name }}</span
                        >
                        <span v-else class="text-muted">Sin empresa</span>
                      </td>
                      <td>
                        <span :class="user.gearbox ? 'badge bg-success' : 'badge bg-danger'">
                          {{ user.gearbox ? 'Habilitado' : 'Bloqueado' }}
                        </span>
                      </td>
                      <td v-if="showAmountColumn">
                        <span class="fw-semibold">${{ user.disponible || 0 }}</span>
                      </td>
                      <td>
                        <small class="text-muted">{{ formatDate(user.created) }}</small>
                      </td>
                      <td>
                        <div class="btn-group btn-group-sm">
                          <button
                            class="btn btn-outline-primary"
                            @click="editUser(user)"
                            title="Editar"
                          >
                            <i class="fas fa-edit"></i>
                          </button>
                          <button
                            class="btn"
                            :class="user.gearbox ? 'btn-outline-warning' : 'btn-outline-success'"
                            @click="toggleUserStatus(user)"
                            :title="user.gearbox ? 'Bloquear' : 'Habilitar'"
                          >
                            <i :class="user.gearbox ? 'fas fa-ban' : 'fas fa-check'"></i>
                          </button>
                          <button
                            v-if="canDeleteUsers"
                            class="btn btn-outline-danger"
                            @click="confirmDeleteUser(user)"
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
                  {{ Math.min(currentPage * itemsPerPage, filteredUsers.length) }}
                  de {{ filteredUsers.length }} resultados
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

    <!-- Create/Edit User Modal -->
    <div class="modal fade" id="userModal" tabindex="-1" aria-hidden="true" ref="userModalRef">
      <div class="modal-dialog modal-lg">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">
              <i :class="isEditMode ? 'fas fa-edit' : 'fas fa-user-plus'" class="me-2"></i>
              {{ isEditMode ? 'Editar Usuario' : 'Crear Usuario' }}
            </h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
          </div>

          <form @submit.prevent="handleSubmitUser">
            <div class="modal-body">
              <div class="row g-3">
                <!-- Basic Info -->
                <div class="col-md-6">
                  <label class="form-label">Nombre *</label>
                  <input
                    v-model="userForm.first_name"
                    type="text"
                    class="form-control"
                    :class="{ 'is-invalid': validationErrors.first_name }"
                    required
                  />
                  <div v-if="validationErrors.first_name" class="invalid-feedback">
                    {{ validationErrors.first_name }}
                  </div>
                </div>

                <div class="col-md-6">
                  <label class="form-label">
                    {{ userForm.role === 'empresa' ? 'Sucursal/Área' : 'Apellido' }} *
                  </label>
                  <input
                    v-model="userForm.last_name"
                    type="text"
                    class="form-control"
                    :class="{ 'is-invalid': validationErrors.last_name }"
                    required
                  />
                  <div v-if="validationErrors.last_name" class="invalid-feedback">
                    {{ validationErrors.last_name }}
                  </div>
                </div>

                <div class="col-md-6">
                  <label class="form-label">Email *</label>
                  <input
                    v-model="userForm.email"
                    type="email"
                    class="form-control"
                    :class="{ 'is-invalid': validationErrors.email }"
                    required
                  />
                  <div v-if="validationErrors.email" class="invalid-feedback">
                    {{ validationErrors.email }}
                  </div>
                </div>

                <div class="col-md-6">
                  <label class="form-label">Cédula *</label>
                  <input
                    v-model="userForm.cedula"
                    type="text"
                    class="form-control"
                    :class="{ 'is-invalid': validationErrors.cedula }"
                    maxlength="10"
                    pattern="[0-9]{10}"
                    required
                  />
                  <div v-if="validationErrors.cedula" class="invalid-feedback">
                    {{ validationErrors.cedula }}
                  </div>
                </div>

                <!-- Role Selection (Solo Superadmin) -->
                <div v-if="canSelectRole" class="col-md-6">
                  <label class="form-label">Rol *</label>
                  <select v-model="userForm.role" class="form-select" required>
                    <option value="empresa">Empresa</option>
                    <option value="operador">Operador</option>
                    <option value="usuario">Usuario/Empleado</option>
                  </select>
                </div>

                <!-- Company Selection (Para Usuarios/Operadores) -->
                <div v-if="needsCompanySelection" class="col-md-6">
                  <label class="form-label">Empresa *</label>
                  <select v-model="userForm.company_id" class="form-select" required>
                    <option value="">Seleccionar empresa...</option>
                    <option
                      v-for="company in availableCompanies"
                      :key="company.id"
                      :value="company.id"
                    >
                      {{ company.first_name }} {{ company.last_name }}
                    </option>
                  </select>
                </div>

                <!-- Amount Available (Para Usuarios) -->
                <div v-if="userForm.role === 'usuario'" class="col-md-6">
                  <label class="form-label">Monto Disponible</label>
                  <div class="input-group">
                    <span class="input-group-text">$</span>
                    <input
                      v-model.number="userForm.disponible"
                      type="number"
                      class="form-control"
                      min="0"
                      step="0.01"
                    />
                  </div>
                </div>

                <!-- Status -->
                <div class="col-md-6">
                  <label class="form-label">Estado</label>
                  <div class="form-check form-switch">
                    <input
                      v-model="userForm.gearbox"
                      class="form-check-input"
                      type="checkbox"
                      id="userStatus"
                    />
                    <label class="form-check-label" for="userStatus">
                      {{ userForm.gearbox ? 'Habilitado' : 'Bloqueado' }}
                    </label>
                  </div>
                </div>

                <!-- Password (Solo para nuevos usuarios) -->
                <div v-if="!isEditMode" class="col-12">
                  <div class="alert alert-info">
                    <i class="fas fa-info-circle me-2"></i>
                    La contraseña inicial será la cédula del usuario. El usuario puede cambiarla
                    desde su perfil.
                  </div>
                </div>
              </div>
            </div>

            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">
                Cancelar
              </button>
              <button type="submit" class="btn btn-primary" :disabled="!isFormValid || submitting">
                <span v-if="submitting" class="spinner-border spinner-border-sm me-2"></span>
                {{ isEditMode ? 'Actualizar' : 'Crear' }} Usuario
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>

    <!-- Delete Confirmation Modal -->
    <div class="modal fade" id="deleteModal" tabindex="-1" aria-hidden="true" ref="deleteModalRef">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">
              <i class="fas fa-exclamation-triangle text-danger me-2"></i>
              Confirmar Eliminación
            </h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body">
            <p>¿Está seguro de que desea eliminar a este usuario?</p>
            <div v-if="userToDelete" class="alert alert-warning">
              <strong>{{ userToDelete.first_name }} {{ userToDelete.last_name }}</strong
              ><br />
              <small>{{ userToDelete.email }} | {{ userToDelete.cedula }}</small>
            </div>
            <p class="text-danger small">
              <i class="fas fa-exclamation-triangle me-1"></i>
              Esta acción no se puede deshacer.
            </p>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">
              Cancelar
            </button>
            <button
              type="button"
              class="btn btn-danger"
              @click="handleDeleteUser"
              :disabled="submitting"
            >
              <span v-if="submitting" class="spinner-border spinner-border-sm me-2"></span>
              Eliminar Usuario
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useUsersStore } from '@/stores/users'
import { useCompaniesStore } from '@/stores/companies'
import { useSystemStore } from '@/stores/system'
import { useToastSystem } from '@/stores/system'
import { Modal } from 'bootstrap'
import * as XLSX from 'xlsx'
import { validateUserBaseData } from '@/stores/system'

// Stores
const authStore = useAuthStore()
const usersStore = useUsersStore()
const companiesStore = useCompaniesStore()
const systemStore = useSystemStore()
const { showToast } = useToastSystem()

// State
const loading = ref(false)
const submitting = ref(false)
const validationErrors = ref({})

// Modal refs
const userModalRef = ref(null)
const deleteModalRef = ref(null)
let userModal = null
let deleteModal = null

// Filters & Search
const selectedCompanyId = ref('')
const selectedUserType = ref('')
const searchTerm = ref('')
const statusFilter = ref('')

// User Form
const isEditMode = ref(false)
const userForm = ref({
  id: null,
  first_name: '',
  last_name: '',
  email: '',
  cedula: '',
  role: 'usuario',
  company_id: '',
  disponible: 0,
  gearbox: true,
})

// Users Data
const allUsers = ref([])
const availableCompanies = ref([])
const userToDelete = ref(null)

// Pagination
const currentPage = ref(1)
const itemsPerPage = 20

// Stats (for superadmin)
const stats = ref({
  totalCompanies: 0,
  totalUsers: 0,
  activeUsers: 0,
})

// Computed Properties

// Role-based UI
const roleIcon = computed(() => {
  if (authStore.isSuperadmin) return 'fas fa-crown text-warning'
  if (authStore.isEmpresa) return 'fas fa-building text-primary'
  return 'fas fa-users text-info'
})

const pageTitle = computed(() => {
  if (authStore.isSuperadmin) return 'Gestión Global de Usuarios'
  return 'Gestión de Empleados'
})

const pageDescription = computed(() => {
  if (authStore.isSuperadmin) return 'Administra usuarios de todas las empresas del sistema'
  return 'Administra los empleados de tu empresa'
})

const tableTitle = computed(() => {
  if (authStore.isSuperadmin) {
    if (selectedCompanyId.value) {
      const company = availableCompanies.value.find((c) => c.id === selectedCompanyId.value)
      return `Usuarios de ${company?.first_name} ${company?.last_name}`
    }
    return 'Todos los Usuarios del Sistema'
  }
  return 'Empleados de Mi Empresa'
})

// Permissions
const canSelectCompany = computed(() => authStore.isSuperadmin)
const canCreateCompanies = computed(() => authStore.isSuperadmin)
const canSelectRole = computed(() => authStore.isSuperadmin)
const canDeleteUsers = computed(() => authStore.isSuperadmin)
const canExportData = computed(() => authStore.isSuperadmin || authStore.isEmpresa)

// Table columns visibility
const showRoleColumn = computed(() => authStore.isSuperadmin)
const showCompanyColumn = computed(() => authStore.isSuperadmin && !selectedCompanyId.value)
const showAmountColumn = computed(() => true)

// Form validation
const needsCompanySelection = computed(() => {
  return authStore.isSuperadmin && ['usuario', 'operador'].includes(userForm.value.role)
})

const isFormValid = computed(() => {
  return (
    userForm.value.first_name &&
    userForm.value.last_name &&
    userForm.value.email &&
    userForm.value.cedula &&
    systemStore.validateCedula(userForm.value.cedula) &&
    systemStore.validateEmail(userForm.value.email) &&
    (!needsCompanySelection.value || userForm.value.company_id)
  )
})

// Users filtering
const filteredUsers = computed(() => {
  let users = [...allUsers.value]

  // Role-based filtering
  if (!authStore.isSuperadmin) {
    // Non-superadmin only see their company's employees
    users = users.filter((user) => user.company_id === authStore.user.id && user.role === 'usuario')
  } else {
    // Superadmin filters
    if (selectedCompanyId.value) {
      users = users.filter((user) => user.company_id === selectedCompanyId.value)
    }
    if (selectedUserType.value) {
      users = users.filter((user) => user.role === selectedUserType.value)
    }
  }

  // Search filter
  if (searchTerm.value) {
    const search = searchTerm.value.toLowerCase()
    users = users.filter(
      (user) =>
        user.first_name?.toLowerCase().includes(search) ||
        user.last_name?.toLowerCase().includes(search) ||
        user.email?.toLowerCase().includes(search) ||
        user.cedula?.includes(search),
    )
  }

  // Status filter
  if (statusFilter.value !== '') {
    const isActive = statusFilter.value === 'true'
    users = users.filter((user) => user.gearbox === isActive)
  }

  return users
})

// Pagination
const totalPages = computed(() => Math.ceil(filteredUsers.value.length / itemsPerPage))

const paginatedUsers = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage
  const end = start + itemsPerPage
  return filteredUsers.value.slice(start, end)
})

const visiblePages = computed(() => {
  const total = totalPages.value
  const current = currentPage.value
  const pages = []

  // Show 5 pages around current
  const start = Math.max(1, current - 2)
  const end = Math.min(total, current + 2)

  for (let i = start; i <= end; i++) {
    pages.push(i)
  }

  return pages
})

const selectedCompanyUsersCount = computed(() => {
  if (!selectedCompanyId.value) return 0
  return allUsers.value.filter((user) => user.company_id === selectedCompanyId.value).length
})

const emptyMessage = computed(() => {
  if (searchTerm.value) return 'No se encontraron usuarios con esos criterios'
  if (authStore.isSuperadmin) return 'No hay usuarios en el sistema'
  return 'No tienes empleados registrados aún'
})

// Methods

// Data loading
const loadUsers = async () => {
  loading.value = true
  try {
    const result = await usersStore.fetchUsersByRole(
      authStore.isSuperadmin ? '' : 'usuario',
      authStore.isSuperadmin ? null : authStore.user.id,
    )

    allUsers.value = result || []
    updateStats()
  } catch (error) {
    console.error('Error loading users:', error)
    showToast('Error al cargar usuarios', 'danger')
  } finally {
    loading.value = false
  }
}

const loadCompanies = async () => {
  if (!authStore.isSuperadmin) return

  try {
    const result = await companiesStore.fetchCompanies()
    availableCompanies.value = result.items || []
    stats.value.totalCompanies = result.totalItems || 0
  } catch (error) {
    console.error('Error loading companies:', error)
  }
}

const updateStats = () => {
  if (authStore.isSuperadmin) {
    stats.value.totalUsers = allUsers.value.length
    stats.value.activeUsers = allUsers.value.filter((u) => u.gearbox).length
  }
}

// Form handling
const resetForm = () => {
  userForm.value = {
    id: null,
    first_name: '',
    last_name: '',
    email: '',
    cedula: '',
    role: authStore.isSuperadmin ? 'usuario' : 'usuario',
    company_id: authStore.isSuperadmin ? '' : authStore.user.id,
    disponible: 0,
    gearbox: true,
  }
  validationErrors.value = {}
}

const openCreateUserModal = () => {
  isEditMode.value = false
  resetForm()
  userModal.show()
}

const openCreateCompanyModal = () => {
  isEditMode.value = false
  resetForm()
  userForm.value.role = 'empresa'
  userModal.show()
}

const editUser = (user) => {
  isEditMode.value = true
  userForm.value = {
    id: user.id,
    first_name: user.first_name,
    last_name: user.last_name,
    email: user.email,
    cedula: user.cedula,
    role: user.role,
    company_id: user.company_id || '',
    disponible: user.disponible || 0,
    gearbox: user.gearbox,
  }
  validationErrors.value = {}
  userModal.show()
}

const handleSubmitUser = async () => {
  submitting.value = true
  validationErrors.value = {}

  try {
    // **BUSINESS LOGIC PRESERVADA**: Validación exacta del legacy
    const validation = await validateUserBaseData(userForm.value, isEditMode.value)
    if (!validation.isValid) {
      validationErrors.value = validation.errors
      throw new Error('Validación fallida')
    }

    // **BUSINESS LOGIC PRESERVADA**: Generate username exactly like legacy
    if (!userForm.value.username) {
      userForm.value.username = systemStore.generateUsername(
        userForm.value.first_name,
        userForm.value.last_name,
        userForm.value.cedula,
        userForm.value.role,
      )
    }

    const userData = {
      ...userForm.value,
      // **BUSINESS LOGIC PRESERVADA**: Password = cédula para nuevos usuarios (functions.php línea 1800+)
      password: !isEditMode.value ? userForm.value.cedula || userForm.value.username : undefined,
    }

    // **BUSINESS LOGIC PRESERVADA**: Empresa assignment logic del legacy
    if (!authStore.isSuperadmin) {
      userData.company_id = authStore.user.id
    }

    // **BUSINESS LOGIC PRESERVADA**: Para empresas, company_id = null (functions.php línea 1785)
    if (userData.role === 'empresa') {
      userData.company_id = null
    }

    if (isEditMode.value) {
      await usersStore.updateUser(userData.id, userData)
      showToast('Usuario actualizado exitosamente', 'success')
    } else {
      await usersStore.createUser(userData)
      showToast('Usuario creado exitosamente', 'success')
    }

    userModal.hide()
    await loadUsers()
  } catch (error) {
    console.error('Error saving user:', error)
    showToast(error.message || 'Error al guardar usuario', 'danger')
  } finally {
    submitting.value = false
  }
}

// User actions
const toggleUserStatus = async (user) => {
  try {
    await usersStore.updateUser(user.id, { gearbox: !user.gearbox })
    showToast(`Usuario ${user.gearbox ? 'bloqueado' : 'habilitado'} exitosamente`, 'success')
    await loadUsers()
  } catch (error) {
    console.error('Error toggling user status:', error)
    showToast('Error al cambiar estado del usuario', 'danger')
  }
}

const confirmDeleteUser = (user) => {
  userToDelete.value = user
  deleteModal.show()
}

const handleDeleteUser = async () => {
  if (!userToDelete.value) return

  submitting.value = true
  try {
    await usersStore.deleteUser(userToDelete.value.id)
    showToast('Usuario eliminado exitosamente', 'success')
    deleteModal.hide()
    await loadUsers()
  } catch (error) {
    console.error('Error deleting user:', error)
    showToast('Error al eliminar usuario', 'danger')
  } finally {
    submitting.value = false
    userToDelete.value = null
  }
}

// Utility methods
const refreshUsers = async () => {
  await loadUsers()
  showToast('Lista actualizada', 'info')
}

const clearSearch = () => {
  searchTerm.value = ''
}

const onSearch = () => {
  currentPage.value = 1
}

const onCompanyChange = () => {
  currentPage.value = 1
}

const goToPage = (page) => {
  if (page >= 1 && page <= totalPages.value) {
    currentPage.value = page
  }
}

const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString('es-EC')
}

const getRoleLabel = (role) => {
  const labels = {
    superadmin: 'Super Admin',
    empresa: 'Empresa',
    operador: 'Operador',
    usuario: 'Empleado',
  }
  return labels[role] || role
}

const getRoleBadgeClass = (role) => {
  const classes = {
    superadmin: 'badge bg-danger',
    empresa: 'badge bg-primary',
    operador: 'badge bg-info',
    usuario: 'badge bg-success',
  }
  return classes[role] || 'badge bg-secondary'
}

// Export functionality
const exportToExcel = () => {
  const exportData = filteredUsers.value.map((user) => ({
    Nombre: user.first_name,
    Apellido: user.last_name,
    Email: user.email,
    Cédula: user.cedula,
    Rol: getRoleLabel(user.role),
    Empresa: user.company?.first_name + ' ' + user.company?.last_name || 'N/A',
    Estado: user.gearbox ? 'Habilitado' : 'Bloqueado',
    Disponible: user.disponible || 0,
    'Fecha Creación': formatDate(user.created),
  }))

  const wb = XLSX.utils.book_new()
  const ws = XLSX.utils.json_to_sheet(exportData)
  XLSX.utils.book_append_sheet(wb, ws, 'Usuarios')

  const filename = `usuarios_${new Date().toISOString().split('T')[0]}.xlsx`
  XLSX.writeFile(wb, filename)

  showToast('Archivo Excel descargado', 'success')
}

// Lifecycle
onMounted(async () => {
  // Initialize Bootstrap modals
  userModal = new Modal(userModalRef.value)
  deleteModal = new Modal(deleteModalRef.value)

  // Load initial data
  await Promise.all([loadUsers(), loadCompanies()])
})

onUnmounted(() => {
  // Clean up modals
  if (userModal) userModal.dispose()
  if (deleteModal) deleteModal.dispose()
})

// Watch for company selection changes
watch(selectedCompanyId, () => {
  currentPage.value = 1
})
</script>

<style scoped>
.usuarios-view {
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

.btn-group-sm > .btn {
  border-radius: 0.2rem;
}

.form-check-input:checked {
  background-color: #198754;
  border-color: #198754;
}

.pagination .page-link {
  border-color: #dee2e6;
  color: #6c757d;
}

.pagination .page-item.active .page-link {
  background-color: #0d6efd;
  border-color: #0d6efd;
}

.badge {
  font-size: 0.75em;
}

code {
  font-size: 0.875em;
}

.alert {
  border: none;
  border-radius: 0.5rem;
}
</style>
