<!-- ARCHIVO: src/views/superadmin/EmpresasView.vue - REEMPLAZAR COMPLETO -->
<template>
  <div class="empresas-view container-fluid py-4">
    <!-- Header -->
    <div class="row mb-4">
      <div class="col-12">
        <h2 class="mb-1">
          <i class="fas fa-building text-primary me-2"></i>
          Gestión de Empresas
        </h2>
        <p class="text-muted">Administra las empresas y sus usuarios en el sistema</p>
      </div>
    </div>

    <!-- Stats Cards -->
    <div class="row mb-4">
      <div class="col-md-3">
        <div class="card card-flexirol text-center">
          <div class="card-body">
            <i class="fas fa-building fa-2x text-primary mb-2"></i>
            <h4 class="text-primary">{{ stats.totalCompanies }}</h4>
            <p class="mb-0">Empresas Activas</p>
          </div>
        </div>
      </div>
      <div class="col-md-3">
        <div class="card card-flexirol text-center">
          <div class="card-body">
            <i class="fas fa-user-tie fa-2x text-success mb-2"></i>
            <h4 class="text-success">{{ stats.totalOwners }}</h4>
            <p class="mb-0">Propietarios</p>
          </div>
        </div>
      </div>
      <div class="col-md-3">
        <div class="card card-flexirol text-center">
          <div class="card-body">
            <i class="fas fa-users fa-2x text-info mb-2"></i>
            <h4 class="text-info">{{ stats.totalAdmins }}</h4>
            <p class="mb-0">Administradores</p>
          </div>
        </div>
      </div>
      <div class="col-md-3">
        <div class="card card-flexirol text-center">
          <div class="card-body">
            <i class="fas fa-user-friends fa-2x text-warning mb-2"></i>
            <h4 class="text-warning">{{ stats.totalEmployees }}</h4>
            <p class="mb-0">Empleados</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Action Bar -->
    <div class="row mb-4">
      <div class="col-md-8">
        <div class="input-group">
          <span class="input-group-text">
            <i class="fas fa-search"></i>
          </span>
          <input
            v-model="searchTerm"
            type="text"
            class="form-control"
            placeholder="Buscar empresas por nombre, RUC o propietario..."
          />
        </div>
      </div>
      <div class="col-md-4 text-end">
        <button
          class="btn btn-primary"
          data-bs-toggle="modal"
          data-bs-target="#createCompanyModal"
          @click="openCreateModal"
        >
          <i class="fas fa-plus me-2"></i>Nueva Empresa
        </button>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="text-center py-5">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">Cargando empresas...</span>
      </div>
    </div>

    <!-- Companies Table -->
    <div v-else class="card">
      <div class="card-header">
        <h5 class="mb-0">
          <i class="fas fa-list me-2"></i>Empresas Registradas ({{ filteredCompanies.length }})
        </h5>
      </div>
      <div class="card-body p-0">
        <div v-if="filteredCompanies.length === 0" class="text-center py-5">
          <i class="fas fa-building fa-3x text-muted mb-3"></i>
          <h5 class="text-muted">No hay empresas registradas</h5>
          <p class="text-muted">Crea la primera empresa para comenzar</p>
        </div>

        <div v-else class="table-responsive">
          <table class="table table-hover mb-0">
            <thead class="table-dark">
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
                    <strong
                      >{{ company.expand.owner_id.first_name }}
                      {{ company.expand.owner_id.last_name }}</strong
                    >
                    <br />
                    <small class="text-muted">{{ company.expand.owner_id.email }}</small>
                  </div>
                  <span v-else class="text-muted">Sin propietario asignado</span>
                </td>
                <td>
                  <span class="badge bg-info">{{ company.user_count || 0 }} usuarios</span>
                </td>
                <td>
                  <span class="badge" :class="company.gearbox ? 'bg-success' : 'bg-danger'">
                    {{ company.gearbox ? 'Activa' : 'Bloqueada' }}
                  </span>
                </td>
                <td>
                  <small>{{ formatDate(company.created) }}</small>
                </td>
                <td class="text-center">
                  <div class="btn-group btn-group-sm">
                    <button
                      class="btn btn-outline-primary"
                      @click="viewCompanyUsers(company)"
                      title="Ver usuarios"
                    >
                      <i class="fas fa-users"></i>
                    </button>
                    <button
                      class="btn btn-outline-secondary"
                      @click="editCompany(company)"
                      title="Editar empresa"
                    >
                      <i class="fas fa-edit"></i>
                    </button>
                    <button
                      class="btn btn-outline-warning"
                      @click="toggleCompanyStatus(company)"
                      :title="company.gearbox ? 'Bloquear empresa' : 'Activar empresa'"
                    >
                      <i :class="company.gearbox ? 'fas fa-ban' : 'fas fa-check'"></i>
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Pagination -->
        <div v-if="totalPages > 1" class="card-footer">
          <nav aria-label="Paginación de empresas">
            <ul class="pagination pagination-sm justify-content-center mb-0">
              <li class="page-item" :class="{ disabled: currentPage === 1 }">
                <button
                  class="page-link"
                  @click="changePage(currentPage - 1)"
                  :disabled="currentPage === 1"
                >
                  Anterior
                </button>
              </li>
              <li
                v-for="page in visiblePages"
                :key="page"
                class="page-item"
                :class="{ active: page === currentPage }"
              >
                <button class="page-link" @click="changePage(page)">{{ page }}</button>
              </li>
              <li class="page-item" :class="{ disabled: currentPage === totalPages }">
                <button
                  class="page-link"
                  @click="changePage(currentPage + 1)"
                  :disabled="currentPage === totalPages"
                >
                  Siguiente
                </button>
              </li>
            </ul>
          </nav>
        </div>
      </div>
    </div>

    <!-- Modal: Create Company -->
    <div class="modal fade" id="createCompanyModal" tabindex="-1">
      <div class="modal-dialog modal-lg">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">
              <i class="fas fa-plus-circle me-2"></i>
              {{ isEditMode ? 'Editar Empresa' : 'Crear Nueva Empresa' }}
            </h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body">
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
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">
              Cancelar
            </button>
            <button
              type="button"
              class="btn btn-primary"
              @click="handleSubmit"
              :disabled="submitting"
            >
              <span v-if="submitting" class="spinner-border spinner-border-sm me-2"></span>
              {{ isEditMode ? 'Actualizar' : 'Crear Empresa' }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal: Company Users Hierarchy -->
    <div class="modal fade" id="usersModal" tabindex="-1">
      <div class="modal-dialog modal-xl">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">
              <i class="fas fa-users me-2"></i>
              Usuarios de {{ selectedCompany?.nombre }}
            </h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body">
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
          </div>
        </div>
      </div>
    </div>

    <!-- Modal Ver Usuarios de Empresa -->
    <div class="modal fade" id="viewUsersModal" tabindex="-1">
      <div class="modal-dialog modal-lg">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">
              <i class="fas fa-users me-2"></i>
              Usuarios de {{ selectedCompany?.nombre }}
            </h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body">
            <div v-if="companyUsers.length === 0" class="text-center py-3">
              <p class="text-muted">No hay usuarios en esta empresa</p>
            </div>
            <div v-else class="table-responsive">
              <table class="table table-sm">
                <thead>
                  <tr>
                    <th>Nombre</th>
                    <th>Email</th>
                    <th>Rol</th>
                    <th>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="user in companyUsers" :key="user.id">
                    <td>{{ user.first_name }} {{ user.last_name }}</td>
                    <td>{{ user.email }}</td>
                    <td>
                      <span class="badge bg-info">{{ user.role }}</span>
                    </td>
                    <td>
                      <span :class="user.gearbox ? 'badge bg-success' : 'badge bg-danger'">
                        {{ user.gearbox ? 'Activo' : 'Bloqueado' }}
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { Modal } from 'bootstrap'
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
}

const editCompany = (company) => {
  isEditMode.value = true
  companyForm.value = {
    id: company.id,
    nombre: company.nombre,
    ruc: company.ruc || '',
    gearbox: company.gearbox,
  }

  const modal = new Modal(document.getElementById('createCompanyModal'))
  modal.show()
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

    const modal = Modal.getInstance(document.getElementById('createCompanyModal'))
    modal.hide()
  } catch (error) {
    console.error('Error saving company:', error)
    showToast('Error al guardar la empresa', 'danger')
  } finally {
    submitting.value = false
  }
}

const viewCompanyUsers = async (company) => {
  try {
    selectedCompany.value = company
    loadingUsers.value = true
    companyUsers.value = await api.getCompanyUsersHierarchy(company.id)
  } catch (error) {
    console.error('Error loading company users:', error)
    showToast('Error al cargar usuarios', 'danger')
    companyUsers.value = { hierarchy: { owner: null, admins: [], employees: [] } }
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

<style scoped>
.empresas-view {
  min-height: 100vh;
}

.card-flexirol {
  transition: transform 0.2s ease;
}

.card-flexirol:hover {
  transform: translateY(-2px);
}

.badge {
  font-size: 0.75em;
}

.btn-group-sm > .btn {
  border-radius: 0.25rem;
}

.table th {
  border-top: none;
  font-weight: 600;
  background-color: var(--flexirol-primary);
  color: white;
}

.table-hover tbody tr:hover {
  background-color: var(--flexirol-bg-light);
}

.modal-xl {
  max-width: 1200px;
}
</style>
