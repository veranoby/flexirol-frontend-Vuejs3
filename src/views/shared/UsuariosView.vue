<template>
  <div class="usuarios-view">
    <!-- Loading Spinner -->
<div v-if="loading" class="flex justify-center my-5">
      <v-progress-circular
        indeterminate
        color="primary"
        size="40"
      ></v-progress-circular>
      <span class="ml-3">Cargando...</span>
    </div>

    <!-- Main Content -->
    <v-container v-else fluid>
      <!-- Dynamic Header -->
      <v-row class="mb-4">
        <v-col cols="12">
          <h2 class="mb-1">
<v-icon :class="roleIcon" class="mr-2"></v-icon>
            {{ pageTitle }}
          </h2>
<p class="text-gray-500">{{ pageDescription }}</p>
        </v-col>
      </v-row>

      <!-- Action Bar -->
      <v-row class="mb-4">
        <v-col md="8">
          <!-- Company Selector (Solo Superadmin) -->
          <v-row v-if="canSelectCompany" class="g-3">
            <v-col md="4">
              <v-select
                v-model="selectedCompanyId"
                :items="availableCompanies"
                item-title="first_name"
                item-value="id"
                label="Empresa"
                clearable
                @update:model-value="onCompanyChange"
              >
                <template #prepend-item>
                  <v-list-item
                    title="-- Todas las Empresas --"
                    value=""
                  ></v-list-item>
                </template>
              </v-select>
            </v-col>
            <v-col md="4">
              <v-select
                v-model="selectedUserType"
                :items="[
                  { title: 'Todos', value: '' },
                  { title: 'Empresas', value: 'empresa' },
                  { title: 'Operadores', value: 'operador' },
                  { title: 'Empleados', value: 'usuario' }
                ]"
                label="Tipo Usuario"
                clearable
              ></v-select>
            </v-col>
          </v-row>

          <!-- Basic Filters -->
          <v-row v-else class="g-3">
            <v-col md="6">
              <v-text-field
                v-model="searchTerm"
                label="Buscar empleados"
                placeholder="Nombre, cédula o email..."
                prepend-inner-icon="mdi-magnify"
                clearable
                @input="onSearch"
                @click:clear="clearSearch"
              ></v-text-field>
            </v-col>
            <v-col md="3">
              <v-select
                v-model="statusFilter"
                :items="[
                  { title: 'Todos', value: '' },
                  { title: 'Habilitados', value: 'true' },
                  { title: 'Bloqueados', value: 'false' }
                ]"
                label="Estado"
                clearable
              ></v-select>
            </v-col>
          </v-row>
        </v-col>

        <!-- Action Buttons -->
        <v-col md="4" class="text-end">
          <v-btn
            v-if="canCreateCompanies"
            color="success"
            class="me-2"
            @click="openCreateCompanyModal"
          >
            <v-icon left>mdi-office-building</v-icon>
            Nueva Empresa
          </v-btn>
          <v-btn color="primary" @click="openCreateUserModal">
            <v-icon left>mdi-account-plus</v-icon>
            {{ canCreateCompanies ? 'Nuevo Usuario' : 'Nuevo Empleado' }}
          </v-btn>
        </v-col>
      </v-row>

      <!-- Stats Cards (Solo Superadmin) -->
      <v-row v-if="authStore.isSuperadmin" class="mb-4">
        <v-col md="3">
          <v-card color="primary" dark>
            <v-card-text>
              <h6>Total Empresas</h6>
              <h3>{{ stats.totalCompanies }}</h3>
            </v-card-text>
          </v-card>
        </v-col>
        <v-col md="3">
          <v-card color="success" dark>
            <v-card-text>
              <h6>Total Usuarios</h6>
              <h3>{{ stats.totalUsers }}</h3>
            </v-card-text>
          </v-card>
        </v-col>
        <v-col md="3">
          <v-card color="info" dark>
            <v-card-text>
              <h6>Usuarios Activos</h6>
              <h3>{{ stats.activeUsers }}</h3>
            </v-card-text>
          </v-card>
        </v-col>
        <v-col md="3">
          <v-card color="warning" dark>
            <v-card-text>
              <h6>Empresa Seleccionada</h6>
              <h3>{{ selectedCompanyUsersCount }}</h3>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>

      <!-- Users Table -->
      <v-row>
        <v-col cols="12">
          <v-card>
<v-card-title class="flex justify-between items-center">
              <div>
                <v-icon class="me-2">mdi-account-multiple</v-icon>
                {{ tableTitle }} ({{ filteredUsers.length }})
              </div>
<div class="flex gap-2">
                <v-btn
                  size="small"
                  variant="outlined"
                  color="secondary"
                  @click="refreshUsers"
                >
                  <v-icon>mdi-refresh</v-icon>
                </v-btn>
                <v-btn
                  v-if="canExportData"
                  size="small"
                  variant="outlined"
                  color="primary"
                  @click="exportToExcel"
                >
                  <v-icon left>mdi-file-excel</v-icon>
                  Exportar
                </v-btn>
              </div>
            </v-card-title>

            <v-card-text class="pa-0">
              <div v-if="filteredUsers.length === 0" class="text-center py-5">
<v-icon size="48" class="text-gray-500 mb-3">mdi-account-multiple</v-icon>
<p class="text-gray-500">{{ emptyMessage }}</p>
              </div>

              <div v-else>
                <v-table>
                  <thead>
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
<div class="flex items-center">
<v-avatar size="32" color="primary" class="mr-2">
                            <span class="text-white">{{ user.first_name?.[0] }}{{ user.last_name?.[0] }}</span>
                          </v-avatar>
                          <div>
                            <div class="font-weight-medium">
                              {{ user.first_name }} {{ user.last_name }}
                            </div>
<small class="text-gray-500">@{{ user.username || user.cedula }}</small>
                          </div>
                        </div>
                      </td>
                      <td>{{ user.email }}</td>
                      <td>
<code class="text-gray-900">{{ user.cedula }}</code>
                      </td>
                      <td v-if="showRoleColumn">
                        <v-chip :color="getRoleBadgeColor(user.role)" size="small">
                          {{ getRoleLabel(user.role) }}
                        </v-chip>
                      </td>
                      <td v-if="showCompanyColumn">
                        <span v-if="user.company">
                          {{ user.company.first_name }} {{ user.company.last_name }}
                        </span>
<span v-else class="text-gray-500">Sin empresa</span>
                      </td>
                      <td>
                        <v-chip :color="user.gearbox ? 'success' : 'error'" size="small">
                          {{ user.gearbox ? 'Habilitado' : 'Bloqueado' }}
                        </v-chip>
                      </td>
                      <td v-if="showAmountColumn">
                        <span class="font-weight-medium">${{ user.disponible || 0 }}</span>
                      </td>
                      <td>
                        <small class="text-muted">{{ formatDate(user.created) }}</small>
                      </td>
                      <td>
                        <v-btn-group size="small">
                          <v-btn
                            variant="outlined"
                            color="primary"
                            @click="editUser(user)"
                            title="Editar"
                          >
                            <v-icon>mdi-pencil</v-icon>
                          </v-btn>
                          <v-btn
                            variant="outlined"
                            :color="user.gearbox ? 'warning' : 'success'"
                            @click="toggleUserStatus(user)"
                            :title="user.gearbox ? 'Bloquear' : 'Habilitar'"
                          >
                            <v-icon>{{ user.gearbox ? 'mdi-cancel' : 'mdi-check' }}</v-icon>
                          </v-btn>
                          <v-btn
                            v-if="canDeleteUsers"
                            variant="outlined"
                            color="error"
                            @click="confirmDeleteUser(user)"
                            title="Eliminar"
                          >
                            <v-icon>mdi-delete</v-icon>
                          </v-btn>
                        </v-btn-group>
                      </td>
                    </tr>
                  </tbody>
                </v-table>
              </div>

              <!-- Pagination -->
              <div
                v-if="totalPages > 1"
                class="d-flex justify-space-between align-center pa-3"
              >
<div class="text-gray-500">
                  Mostrando {{ (currentPage - 1) * itemsPerPage + 1 }} a
                  {{ Math.min(currentPage * itemsPerPage, filteredUsers.length) }}
                  de {{ filteredUsers.length }} resultados
                </div>
                <v-pagination
                  v-model="currentPage"
                  :length="totalPages"
                  :total-visible="5"
                  size="small"
                ></v-pagination>
              </div>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
    </v-container>
      </div>
    </div>

    <!-- Create/Edit User Modal -->
    <v-dialog v-model="showUserModal" max-width="800px" persistent>
      <v-card>
        <v-card-title>
          <v-icon :class="isEditMode ? 'mdi-pencil' : 'mdi-account-plus'" class="me-2"></v-icon>
          {{ isEditMode ? 'Editar Usuario' : 'Crear Usuario' }}
          <v-spacer></v-spacer>
          <v-btn icon @click="showUserModal = false">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-card-title>

        <v-form @submit.prevent="handleSubmitUser">
          <v-card-text>
            <v-row>
              <!-- Basic Info -->
              <v-col md="6">
                <v-text-field
                  v-model="userForm.first_name"
                  label="Nombre *"
                  :error-messages="validationErrors.first_name"
                  required
                ></v-text-field>
              </v-col>

              <v-col md="6">
                <v-text-field
                  v-model="userForm.last_name"
                  :label="userForm.role === 'empresa' ? 'Sucursal/Área *' : 'Apellido *'"
                  :error-messages="validationErrors.last_name"
                  required
                ></v-text-field>
              </v-col>

              <v-col md="6">
                <v-text-field
                  v-model="userForm.email"
                  label="Email *"
                  type="email"
                  :error-messages="validationErrors.email"
                  required
                ></v-text-field>
              </v-col>

              <v-col md="6">
                <v-text-field
                  v-model="userForm.cedula"
                  label="Cédula *"
                  :error-messages="validationErrors.cedula"
                  maxlength="10"
                  required
                ></v-text-field>
              </v-col>

              <!-- Role Selection (Solo Superadmin) -->
              <v-col v-if="canSelectRole" md="6">
                <v-select
                  v-model="userForm.role"
                  label="Rol *"
                  :items="[
                    { title: 'Empresa', value: 'empresa' },
                    { title: 'Operador', value: 'operador' },
                    { title: 'Usuario/Empleado', value: 'usuario' }
                  ]"
                  required
                ></v-select>
              </v-col>

              <!-- Company Selection (Para Usuarios/Operadores) -->
              <v-col v-if="needsCompanySelection" md="6">
                <v-select
                  v-model="userForm.company_id"
                  label="Empresa *"
                  :items="availableCompanies"
                  item-title="first_name"
                  item-value="id"
                  required
                ></v-select>
              </v-col>

              <!-- Amount Available (Para Usuarios) -->
              <v-col v-if="userForm.role === 'usuario'" md="6">
                <v-text-field
                  v-model.number="userForm.disponible"
                  label="Monto Disponible"
                  type="number"
                  min="0"
                  step="0.01"
                  prefix="$"
                ></v-text-field>
              </v-col>

              <!-- Status -->
              <v-col md="6">
                <v-switch
                  v-model="userForm.gearbox"
                  :label="userForm.gearbox ? 'Habilitado' : 'Bloqueado'"
                  color="success"
                ></v-switch>
              </v-col>

              <!-- Password (Solo para nuevos usuarios) -->
              <v-col v-if="!isEditMode" cols="12">
                <v-alert type="info" variant="tonal">
                  <v-icon>mdi-information</v-icon>
                  La contraseña inicial será la cédula del usuario. El usuario puede cambiarla
                  desde su perfil.
                </v-alert>
              </v-col>
            </v-row>
          </v-card-text>

          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn variant="outlined" @click="showUserModal = false">
              Cancelar
            </v-btn>
            <v-btn
              type="submit"
              color="primary"
              :loading="submitting"
              :disabled="!isFormValid || submitting"
            >
              {{ isEditMode ? 'Actualizar' : 'Crear' }} Usuario
            </v-btn>
          </v-card-actions>
        </v-form>
      </v-card>
    </v-dialog>

    <!-- Delete Confirmation Modal -->
    <v-dialog v-model="showDeleteModal" max-width="400px" persistent>
      <v-card>
        <v-card-title>
          <v-icon color="error" class="me-2">mdi-alert-circle</v-icon>
          Confirmar Eliminación
        </v-card-title>
        <v-card-text>
          <p>¿Está seguro de que desea eliminar a este usuario?</p>
          <v-alert v-if="userToDelete" type="warning" variant="tonal">
            <strong>{{ userToDelete.first_name }} {{ userToDelete.last_name }}</strong><br />
            <small>{{ userToDelete.email }} | {{ userToDelete.cedula }}</small>
          </v-alert>
          <p class="text-error text-caption">
            <v-icon size="small" class="me-1">mdi-alert-circle</v-icon>
            Esta acción no se puede deshacer.
          </p>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn variant="outlined" @click="showDeleteModal = false">
            Cancelar
          </v-btn>
          <v-btn
            color="error"
            :loading="submitting"
            @click="handleDeleteUser"
            :disabled="submitting"
          >
            Eliminar Usuario
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useUsersStore } from '@/stores/users'
import { useCompaniesStore } from '@/stores/companies'
import { useSystemStore } from '@/stores/system'
import { useToastSystem } from '@/stores/system'
import * as XLSX from 'xlsx'
//import { validateUserBaseData } from '@/stores/system'

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

// Modal state
const showUserModal = ref(false)
const showDeleteModal = ref(false)

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
  showUserModal.value = true
}

const openCreateCompanyModal = () => {
  isEditMode.value = false
  resetForm()
  userForm.value.role = 'empresa'
  showUserModal.value = true
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
  showUserModal.value = true
}

const handleSubmitUser = async () => {
  submitting.value = true
  validationErrors.value = {}

  try {
    // **BUSINESS LOGIC PRESERVADA**: Validación exacta del legacy
    const validation = systemStore.validateUserBaseData(userForm.value, isEditMode.value)
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

    showUserModal.value = false
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
  showDeleteModal.value = true
}

const handleDeleteUser = async () => {
  if (!userToDelete.value) return

  submitting.value = true
  try {
    await usersStore.deleteUser(userToDelete.value.id)
    showToast('Usuario eliminado exitosamente', 'success')
    showDeleteModal.value = false
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

const getRoleBadgeColor = (role) => {
  const colors = {
    superadmin: 'error',
    empresa: 'primary',
    operador: 'info',
    usuario: 'success',
  }
  return colors[role] || 'secondary'
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
  // Load initial data
  await Promise.all([loadUsers(), loadCompanies()])
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
