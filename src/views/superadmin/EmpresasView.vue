<!-- ARCHIVO: src/views/superadmin/EmpresasView.vue - REEMPLAZAR COMPLETO -->
<template>
  <div class="empresas-view">
    <v-container fluid class="py-4">
      <!-- Header -->
      <v-row class="mb-4">
        <v-col cols="12">
          <h2 class="mb-1">
            <v-icon class="text-primary me-2">mdi-office-building</v-icon>
            Gestión de Empresas
          </h2>
          <p class="text-muted">Administra las empresas y sus usuarios en el sistema</p>
        </v-col>
      </v-row>

      <!-- Stats Cards -->
      <v-row class="mb-4">
        <v-col md="3">
          <v-card class="card-flexirol text-center">
            <v-card-text>
              <v-icon class="mb-2" size="32" color="primary">mdi-office-building</v-icon>
              <h4 class="text-primary">{{ stats.totalCompanies }}</h4>
              <p class="mb-0">Empresas Activas</p>
            </v-card-text>
          </v-card>
        </v-col>
        <v-col md="3">
          <v-card class="card-flexirol text-center">
            <v-card-text>
              <v-icon class="mb-2" size="32" color="success">mdi-account-tie</v-icon>
              <h4 class="text-success">{{ stats.totalOwners }}</h4>
              <p class="mb-0">Propietarios</p>
            </v-card-text>
          </v-card>
        </v-col>
        <v-col md="3">
          <v-card class="card-flexirol text-center">
            <v-card-text>
              <v-icon class="mb-2" size="32" color="info">mdi-account-multiple</v-icon>
              <h4 class="text-info">{{ stats.totalAdmins }}</h4>
              <p class="mb-0">Administradores</p>
            </v-card-text>
          </v-card>
        </v-col>
        <v-col md="3">
          <v-card class="card-flexirol text-center">
            <v-card-text>
              <v-icon class="mb-2" size="32" color="warning">mdi-account-group</v-icon>
              <h4 class="text-warning">{{ stats.totalEmployees }}</h4>
              <p class="mb-0">Empleados</p>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>

      <!-- Action Bar -->
      <v-row class="mb-4">
        <v-col md="8">
          <v-text-field
            v-model="searchTerm"
            label="Buscar empresas"
            placeholder="Buscar por nombre, RUC o propietario..."
            prepend-inner-icon="mdi-magnify"
            clearable
          ></v-text-field>
        </v-col>
        <v-col md="4" class="text-end">
          <v-btn color="primary" @click="openCreateModal">
            <v-icon left>mdi-plus</v-icon>
            Nueva Empresa
          </v-btn>
        </v-col>
      </v-row>

      <!-- Loading State -->
      <div v-if="loading" class="text-center py-5">
        <v-progress-circular indeterminate color="primary" size="40"></v-progress-circular>
        <p class="mt-3">Cargando empresas...</p>
      </div>

      <!-- Companies Table -->
      <v-card v-else>
        <v-card-title>
          <v-icon left class="me-2">mdi-format-list-bulleted</v-icon>
          Empresas Registradas ({{ filteredCompanies.length }})
        </v-card-title>
        <v-card-text class="pa-0">
          <div v-if="filteredCompanies.length === 0" class="text-center py-5">
            <v-icon size="48" class="text-muted mb-3">mdi-office-building</v-icon>
            <h5 class="text-muted">No hay empresas registradas</h5>
            <p class="text-muted">Crea la primera empresa para comenzar</p>
          </div>

          <div v-else>
            <v-table>
              <thead>
                <tr>
                  <th>Empresa</th>
                  <th>Propietario</th>
                  <th>Usuarios</th>
                  <th>Estado</th>
                  <th>Fecha Creación</th>
                  <th class="text-center">Acciones</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="company in paginatedCompanies" :key="company.id">
                  <td>
                    <div>
                      <strong>{{ company.nombre }}</strong>
                      <br />
                      <small class="text-muted">{{ company.ruc || 'Sin RUC' }}</small>
                    </div>
                  </td>
                  <td>
                    <div v-if="company.expand?.owner_id">
                      <strong>
                        {{ company.expand.owner_id.first_name }}
                        {{ company.expand.owner_id.last_name }}
                      </strong>
                      <br />
                      <small class="text-muted">{{ company.expand.owner_id.email }}</small>
                    </div>
                    <span v-else class="text-muted">Sin propietario asignado</span>
                  </td>
                  <td>
                    <v-chip color="info" size="small"
                      >{{ company.user_count || 0 }} usuarios</v-chip
                    >
                  </td>
                  <td>
                    <v-chip :color="company.gearbox ? 'success' : 'error'" size="small">
                      {{ company.gearbox ? 'Activa' : 'Bloqueada' }}
                    </v-chip>
                  </td>
                  <td>
                    <small>{{ formatDate(company.created) }}</small>
                  </td>
                  <td class="text-center">
                    <v-btn-group size="small">
                      <v-btn
                        variant="outlined"
                        color="primary"
                        @click="viewCompanyUsers(company)"
                        title="Ver usuarios"
                      >
                        <v-icon>mdi-account-multiple</v-icon>
                      </v-btn>
                      <v-btn
                        variant="outlined"
                        color="secondary"
                        @click="editCompany(company)"
                        title="Editar empresa"
                      >
                        <v-icon>mdi-pencil</v-icon>
                      </v-btn>
                      <v-btn
                        variant="outlined"
                        :color="company.gearbox ? 'warning' : 'success'"
                        @click="toggleCompanyStatus(company)"
                        :title="company.gearbox ? 'Bloquear empresa' : 'Activar empresa'"
                      >
                        <v-icon>{{ company.gearbox ? 'mdi-cancel' : 'mdi-check' }}</v-icon>
                      </v-btn>
                    </v-btn-group>
                  </td>
                </tr>
              </tbody>
            </v-table>
          </div>

          <!-- Pagination -->
          <div v-if="totalPages > 1" class="pa-3">
            <v-pagination
              v-model="currentPage"
              :length="totalPages"
              :total-visible="5"
              size="small"
            ></v-pagination>
          </div>
        </v-card-text>
      </v-card>
    </v-container>

    <!-- Modal: Create Company -->
    <v-dialog v-model="showCreateModal" max-width="600px" persistent>
      <v-card>
        <v-card-title>
          <i class="fas fa-plus-circle me-2"></i>
          {{ isEditMode ? 'Editar Empresa' : 'Crear Nueva Empresa' }}
        </v-card-title>
        <v-card-text>
          <form @submit.prevent="handleSubmit">
            <!-- Company Info -->
            <div class="row mb-3">
              <h6 class="text-primary">
                <i class="fas fa-building me-2"></i>Información de la Empresa
              </h6>
            </div>

            <div class="row mb-3">
              <div class="col-md-8">
                <label class="form-label">Nombre de la Empresa *</label>
                <input
                  v-model="companyForm.nombre"
                  type="text"
                  class="form-control"
                  required
                  placeholder="Ej: Acme Corporation"
                />
              </div>
              <div class="col-md-4">
                <label class="form-label">RUC (Opcional)</label>
                <input
                  v-model="companyForm.ruc"
                  type="text"
                  class="form-control"
                  placeholder="Ej: 1234567890001"
                />
              </div>
            </div>

            <!-- Owner Info (solo para crear) -->
            <div v-if="!isEditMode">
              <div class="row mb-3">
                <h6 class="text-success">
                  <i class="fas fa-user-tie me-2"></i>Propietario Principal
                </h6>
              </div>

              <div class="row mb-3">
                <div class="col-md-6">
                  <label class="form-label">Nombre *</label>
                  <input
                    v-model="ownerForm.first_name"
                    type="text"
                    class="form-control"
                    required
                    placeholder="Ej: Juan"
                  />
                </div>
                <div class="col-md-6">
                  <label class="form-label">Apellido *</label>
                  <input
                    v-model="ownerForm.last_name"
                    type="text"
                    class="form-control"
                    required
                    placeholder="Ej: Pérez"
                  />
                </div>
              </div>

              <div class="row mb-3">
                <div class="col-md-6">
                  <label class="form-label">Email *</label>
                  <input
                    v-model="ownerForm.email"
                    type="email"
                    class="form-control"
                    required
                    placeholder="juan.perez@empresa.com"
                  />
                </div>
                <div class="col-md-6">
                  <label class="form-label">Cédula *</label>
                  <input
                    v-model="ownerForm.cedula"
                    type="text"
                    class="form-control"
                    required
                    pattern="[0-9]{10}"
                    placeholder="1234567890"
                    maxlength="10"
                  />
                </div>
              </div>
            </div>
          </form>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="secondary" variant="text" @click="showCreateModal = false">
            Cancelar
          </v-btn>
          <v-btn color="primary" variant="text" @click="handleSubmit" :loading="submitting">
            <span v-if="submitting" class="spinner-border spinner-border-sm me-2"></span>
            {{ isEditMode ? 'Actualizar' : 'Crear Empresa' }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Modal: Company Users Hierarchy -->
    <v-dialog v-model="showUsersModal" max-width="1200px" persistent>
      <v-card>
        <v-card-title>
          <i class="fas fa-users me-2"></i>
          Usuarios de {{ selectedCompany?.nombre }}
        </v-card-title>
        <v-card-text>
          <div v-if="loadingUsers" class="text-center py-4">
            <div class="spinner-border text-primary"></div>
          </div>

          <div v-else-if="companyUsers">
            <!-- Owner Section -->
            <div class="mb-4">
              <h6 class="text-success"><i class="fas fa-crown me-2"></i>Propietario Principal</h6>
              <div v-if="companyUsers.hierarchy.owner" class="card bg-light">
                <div class="card-body py-2">
                  <div class="row align-items-center">
                    <div class="col">
                      <strong
                        >{{ companyUsers.hierarchy.owner.first_name }}
                        {{ companyUsers.hierarchy.owner.last_name }}</strong
                      >
                      <br />
                      <small class="text-muted">{{ companyUsers.hierarchy.owner.email }}</small>
                    </div>
                    <div class="col-auto">
                      <span class="badge bg-success">Propietario</span>
                    </div>
                  </div>
                </div>
              </div>
              <div v-else class="alert alert-warning">
                <i class="fas fa-exclamation-triangle me-2"></i>
                Sin propietario asignado
              </div>
            </div>

            <!-- Admins Section -->
            <div class="mb-4">
              <h6 class="text-primary">
                <i class="fas fa-user-tie me-2"></i>Administradores ({{
                  companyUsers.hierarchy.admins.length
                }})
              </h6>
              <div v-if="companyUsers.hierarchy.admins.length === 0" class="text-muted">
                No hay administradores adicionales
              </div>
              <div v-else class="row">
                <div
                  v-for="admin in companyUsers.hierarchy.admins"
                  :key="admin.id"
                  class="col-md-6 mb-2"
                >
                  <div class="card">
                    <div class="card-body py-2">
                      <div class="row align-items-center">
                        <div class="col">
                          <strong>{{ admin.first_name }} {{ admin.last_name }}</strong>
                          <br />
                          <small class="text-muted">{{ admin.email }}</small>
                        </div>
                        <div class="col-auto">
                          <span class="badge" :class="admin.gearbox ? 'bg-success' : 'bg-danger'">
                            {{ admin.gearbox ? 'Activo' : 'Bloqueado' }}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Employees Section -->
            <div class="mb-4">
              <h6 class="text-info">
                <i class="fas fa-users me-2"></i>Empleados ({{
                  companyUsers.hierarchy.employees.length
                }})
              </h6>
              <div v-if="companyUsers.hierarchy.employees.length === 0" class="text-muted">
                No hay empleados registrados
              </div>
              <div v-else class="row">
                <div
                  v-for="employee in companyUsers.hierarchy.employees"
                  :key="employee.id"
                  class="col-md-6 mb-2"
                >
                  <div class="card">
                    <div class="card-body py-2">
                      <div class="row align-items-center">
                        <div class="col">
                          <strong>{{ employee.first_name }} {{ employee.last_name }}</strong>
                          <br />
                          <small class="text-muted"
                            >{{ employee.email }} • {{ employee.cedula }}</small
                          >
                          <br />
                          <small class="text-primary"
                            >Disponible: ${{ employee.disponible || 0 }}</small
                          >
                        </div>
                        <div class="col-auto">
                          <span
                            class="badge"
                            :class="employee.gearbox ? 'bg-success' : 'bg-danger'"
                          >
                            {{ employee.gearbox ? 'Activo' : 'Bloqueado' }}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Actions -->
            <div class="text-center">
              <button class="btn btn-primary me-2">
                <i class="fas fa-user-plus me-2"></i>Agregar Usuario
              </button>
              <button class="btn btn-success">
                <i class="fas fa-file-excel me-2"></i>Cargar Excel
              </button>
            </div>
          </div>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="secondary" variant="text" @click="showUsersModal = false"> Cerrar </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { api } from '@/services/pocketbase'
import { useSystemStore } from '@/stores/system'

const systemStore = useSystemStore()
const { showToast } = systemStore

// State
const companies = ref([])
const loading = ref(false)
const submitting = ref(false)
const loadingUsers = ref(false)
const searchTerm = ref('')
const currentPage = ref(1)
const itemsPerPage = 20

// Modal states
const showCreateModal = ref(false)
const showUsersModal = ref(false)
const isEditMode = ref(false)
const selectedCompany = ref(null)
const companyUsers = ref({
  hierarchy: {
    owner: null,
    admins: [],
    employees: [],
  },
})

// Form data
const companyForm = ref({
  id: null,
  nombre: '',
  ruc: '',
  gearbox: true,
})

const ownerForm = ref({
  first_name: '',
  last_name: '',
  email: '',
  cedula: '',
})

// Stats
const stats = computed(() => {
  const totalCompanies = companies.value.length
  const totalOwners = companies.value.filter((c) => c.expand?.owner_id).length
  let totalAdmins = 0
  let totalEmployees = 0

  companies.value.forEach((company) => {
    if (company.user_stats) {
      totalAdmins += company.user_stats.admins || 0
      totalEmployees += company.user_stats.employees || 0
    }
  })

  return {
    totalCompanies,
    totalOwners,
    totalAdmins,
    totalEmployees,
  }
})

// Filtering and pagination
const filteredCompanies = computed(() => {
  if (!searchTerm.value) return companies.value

  const search = searchTerm.value.toLowerCase()
  return companies.value.filter(
    (company) =>
      company.nombre?.toLowerCase().includes(search) ||
      company.ruc?.toLowerCase().includes(search) ||
      company.expand?.owner_id?.first_name?.toLowerCase().includes(search) ||
      company.expand?.owner_id?.last_name?.toLowerCase().includes(search) ||
      company.expand?.owner_id?.email?.toLowerCase().includes(search),
  )
})

const totalPages = computed(() => Math.ceil(filteredCompanies.value.length / itemsPerPage))

const paginatedCompanies = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage
  return filteredCompanies.value.slice(start, start + itemsPerPage)
})

const visiblePages = computed(() => {
  const total = totalPages.value
  const current = currentPage.value
  const pages = []
  const start = Math.max(1, current - 2)
  const end = Math.min(total, current + 2)

  for (let i = start; i <= end; i++) {
    pages.push(i)
  }
  return pages
})

// Methods
const loadCompanies = async () => {
  loading.value = true
  try {
    const result = await api.getCompanies({}, 1, 1000)
    companies.value = (result?.items || []).map((company) => ({
      ...company,
      expand: company.expand || { owner_id: null },
    }))
  } catch (error) {
    console.error('Error loading companies:', error)
    showToast('Error al cargar empresas', 'danger')
  } finally {
    loading.value = false
  }
}

const openCreateModal = () => {
  isEditMode.value = false
  companyForm.value = { id: null, nombre: '', ruc: '', gearbox: true }
  ownerForm.value = { first_name: '', last_name: '', email: '', cedula: '' }
  showCreateModal.value = true // <-- Asegurar que se abra el modal
}

const editCompany = (company) => {
  isEditMode.value = true
  companyForm.value = {
    id: company.id,
    nombre: company.nombre,
    ruc: company.ruc || '',
    gearbox: company.gearbox,
  }

  openCreateModal()
}

const handleSubmit = async () => {
  if (submitting.value) return

  submitting.value = true
  try {
    if (isEditMode.value) {
      await api.updateCompany(companyForm.value.id, {
        nombre: companyForm.value.nombre,
        ruc: companyForm.value.ruc,
      })
      showToast('Empresa actualizada exitosamente', 'success')
    } else {
      await api.createCompanyWithOwner(companyForm.value, ownerForm.value)
      showToast('Empresa y propietario creados exitosamente', 'success')
    }

    await loadCompanies()

    openCreateModal()
  } catch (error) {
    console.error('Error saving company:', error)
    showToast('Error al guardar la empresa', 'danger')
  } finally {
    submitting.value = false
  }
}

const viewCompanyUsers = async (company) => {
  selectedCompany.value = company
  loadingUsers.value = true
  try {
    companyUsers.value = await api.getCompanyUsersHierarchy(company.id)
    showUsersModal.value = true // <-- Asegurar que se abra el modal
  } catch (error) {
    console.error('Error loading company users:', error)
    showToast('Error al cargar usuarios', 'danger')
  } finally {
    loadingUsers.value = false
  }
}

const toggleCompanyStatus = async (company) => {
  try {
    await api.updateCompany(company.id, {
      gearbox: !company.gearbox,
    })

    company.gearbox = !company.gearbox
    showToast(`Empresa ${company.gearbox ? 'activada' : 'bloqueada'} exitosamente`, 'success')
  } catch (error) {
    console.error('Error toggling company status:', error)
    showToast('Error al cambiar el estado de la empresa', 'danger')
  }
}

const changePage = (page) => {
  if (page >= 1 && page <= totalPages.value) {
    currentPage.value = page
  }
}

const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString('es-EC', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

// Lifecycle
onMounted(() => {
  loadCompanies()
})
</script>
