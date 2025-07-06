<template>
  <div class="empresas-view">
    <div class="container-fluid">
      <!-- Header -->
      <div class="row mb-4">
        <div class="col-12">
          <h2 class="mb-1">
            <i class="fas fa-building text-primary me-2"></i>
            Gestión de Empresas
          </h2>
          <p class="text-muted">Administra todas las empresas del sistema</p>
        </div>
      </div>

      <!-- Action Bar -->
      <div class="row mb-4">
        <div class="col-md-8">
          <div class="row g-3">
            <div class="col-md-4">
              <label class="form-label">Buscar empresa:</label>
              <input
                v-model="searchTerm"
                type="text"
                class="form-control"
                placeholder="Nombre o email..."
              />
            </div>
            <div class="col-md-3">
              <label class="form-label">Estado:</label>
              <select v-model="statusFilter" class="form-select">
                <option value="">Todas</option>
                <option value="true">Activas</option>
                <option value="false">Bloqueadas</option>
              </select>
            </div>
          </div>
        </div>
        <div class="col-md-4 text-end">
          <button class="btn btn-success" @click="openCreateModal">
            <i class="fas fa-plus me-1"></i>Nueva Empresa
          </button>
        </div>
      </div>

      <!-- Stats Cards -->
      <div class="row mb-4">
        <div class="col-md-3">
          <div class="card bg-primary text-white">
            <div class="card-body">
              <h6>Total Empresas</h6>
              <h3>{{ stats.total }}</h3>
            </div>
          </div>
        </div>
        <div class="col-md-3">
          <div class="card bg-success text-white">
            <div class="card-body">
              <h6>Empresas Activas</h6>
              <h3>{{ stats.active }}</h3>
            </div>
          </div>
        </div>
        <div class="col-md-3">
          <div class="card bg-info text-white">
            <div class="card-body">
              <h6>Total Empleados</h6>
              <h3>{{ stats.totalEmployees }}</h3>
            </div>
          </div>
        </div>
        <div class="col-md-3">
          <div class="card bg-warning text-white">
            <div class="card-body">
              <h6>Sin Excel Actualizado</h6>
              <h3>{{ stats.withoutExcel }}</h3>
            </div>
          </div>
        </div>
      </div>

      <!-- Companies Table -->
      <div class="row">
        <div class="col-12">
          <div class="card">
            <div class="card-header d-flex justify-content-between align-items-center">
              <h5 class="mb-0">
                <i class="fas fa-building me-2"></i>
                Empresas ({{ filteredCompanies.length }})
              </h5>
              <button class="btn btn-sm btn-outline-primary" @click="refreshCompanies">
                <i class="fas fa-sync-alt"></i>
              </button>
            </div>

            <div class="card-body p-0">
              <div v-if="loading" class="text-center py-5">
                <div class="spinner-border text-primary" role="status">
                  <span class="visually-hidden">Cargando...</span>
                </div>
              </div>

              <div v-else-if="filteredCompanies.length === 0" class="text-center py-5">
                <i class="fas fa-building fa-3x text-muted mb-3"></i>
                <p class="text-muted">No hay empresas registradas</p>
              </div>

              <div v-else class="table-responsive">
                <table class="table table-hover mb-0">
                  <thead class="table-light">
                    <tr>
                      <th>Empresa</th>
                      <th>Email</th>
                      <th>Empleados</th>
                      <th>Estado</th>
                      <th>Última Act. Excel</th>
                      <th>Plan</th>
                      <th>Configuración</th>
                      <th width="150">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="company in paginatedCompanies" :key="company.id">
                      <td>
                        <div class="d-flex align-items-center">
                          <div class="avatar-sm me-2">
                            <div class="avatar-initial bg-primary rounded-circle">
                              {{ company.first_name?.charAt(0) }}{{ company.last_name?.charAt(0) }}
                            </div>
                          </div>
                          <div>
                            <div class="fw-semibold">
                              {{ company.first_name }} {{ company.last_name }}
                            </div>
                            <small class="text-muted">ID: {{ company.id }}</small>
                          </div>
                        </div>
                      </td>
                      <td>{{ company.email }}</td>
                      <td>
                        <span class="badge bg-info"
                          >{{ company.employeeCount || 0 }} empleados</span
                        >
                      </td>
                      <td>
                        <span :class="company.gearbox ? 'badge bg-success' : 'badge bg-danger'">
                          {{ company.gearbox ? 'Activa' : 'Bloqueada' }}
                        </span>
                      </td>
                      <td>
                        <span
                          v-if="company.fecha_excel && company.fecha_excel !== 'No creado'"
                          class="text-success"
                        >
                          {{ formatDate(company.fecha_excel) }}
                        </span>
                        <span v-else class="text-danger">
                          <i class="fas fa-exclamation-triangle me-1"></i>
                          Sin actualizar
                        </span>
                      </td>
                      <td>
                        <span v-if="company.flexirol3 === '1'" class="badge bg-warning">
                          Plan 1: {{ company.flexirol }}%
                        </span>
                        <span v-else class="badge bg-info"> Plan 2: ${{ company.flexirol }} </span>
                      </td>
                      <td>
                        <div class="small">
                          <div>Ciclo: {{ company.dia_inicio }}-{{ company.dia_cierre }}</div>
                          <div>Freq: {{ company.frecuencia }} sol/mes</div>
                        </div>
                      </td>
                      <td>
                        <div class="btn-group btn-group-sm">
                          <button
                            class="btn btn-outline-primary"
                            @click="viewEmployees(company)"
                            title="Ver empleados"
                          >
                            <i class="fas fa-users"></i>
                          </button>
                          <button
                            class="btn btn-outline-secondary"
                            @click="editCompany(company)"
                            title="Editar"
                          >
                            <i class="fas fa-edit"></i>
                          </button>
                          <button
                            class="btn"
                            :class="company.gearbox ? 'btn-outline-warning' : 'btn-outline-success'"
                            @click="toggleCompanyStatus(company)"
                            :title="company.gearbox ? 'Bloquear' : 'Activar'"
                          >
                            <i :class="company.gearbox ? 'fas fa-ban' : 'fas fa-check'"></i>
                          </button>
                          <button
                            class="btn btn-outline-danger"
                            @click="confirmDelete(company)"
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
                  {{ Math.min(currentPage * itemsPerPage, filteredCompanies.length) }}
                  de {{ filteredCompanies.length }} empresas
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

    <!-- Company Form Modal -->
    <div
      class="modal fade"
      id="companyModal"
      tabindex="-1"
      aria-hidden="true"
      ref="companyModalRef"
    >
      <div class="modal-dialog modal-lg">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">
              <i :class="isEditMode ? 'fas fa-edit' : 'fas fa-plus'" class="me-2"></i>
              {{ isEditMode ? 'Editar Empresa' : 'Nueva Empresa' }}
            </h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
          </div>

          <form @submit.prevent="handleSubmit">
            <div class="modal-body">
              <div class="row g-3">
                <div class="col-md-6">
                  <label class="form-label">Nombre de la Empresa *</label>
                  <input v-model="form.first_name" type="text" class="form-control" required />
                </div>
                <div class="col-md-6">
                  <label class="form-label">Sucursal/Área</label>
                  <input v-model="form.last_name" type="text" class="form-control" />
                </div>
                <div class="col-md-6">
                  <label class="form-label">Email *</label>
                  <input v-model="form.email" type="email" class="form-control" required />
                </div>
                <div class="col-md-6">
                  <label class="form-label">Estado</label>
                  <div class="form-check form-switch">
                    <input
                      v-model="form.gearbox"
                      class="form-check-input"
                      type="checkbox"
                      id="companyStatus"
                    />
                    <label class="form-check-label" for="companyStatus">
                      {{ form.gearbox ? 'Activa' : 'Bloqueada' }}
                    </label>
                  </div>
                </div>

                <!-- Configuración del Plan -->
                <div class="col-12">
                  <h6 class="border-bottom pb-2 mb-3">Configuración del Plan</h6>
                </div>

                <div class="col-md-4">
                  <label class="form-label">Tipo de Plan</label>
                  <select v-model="form.flexirol3" class="form-select">
                    <option value="1">Plan 1: Porcentaje por transacción</option>
                    <option value="2">Plan 2: Valor fijo mensual</option>
                  </select>
                </div>

                <div class="col-md-4">
                  <label class="form-label">
                    {{ form.flexirol3 === '1' ? 'Porcentaje (%)' : 'Valor Mensual ($)' }}
                  </label>
                  <input
                    v-model.number="form.flexirol"
                    type="number"
                    class="form-control"
                    :step="form.flexirol3 === '1' ? '0.1' : '0.01'"
                    min="0"
                  />
                </div>

                <!-- Configuración del Ciclo -->
                <div class="col-12">
                  <h6 class="border-bottom pb-2 mb-3">Configuración del Ciclo de Anticipos</h6>
                </div>

                <div class="col-md-3">
                  <label class="form-label">Día Inicio</label>
                  <input
                    v-model.number="form.dia_inicio"
                    type="number"
                    class="form-control"
                    min="1"
                    max="31"
                  />
                </div>

                <div class="col-md-3">
                  <label class="form-label">Día Cierre</label>
                  <input
                    v-model.number="form.dia_cierre"
                    type="number"
                    class="form-control"
                    min="1"
                    max="31"
                  />
                </div>

                <div class="col-md-3">
                  <label class="form-label">Porcentaje Máximo (%)</label>
                  <input
                    v-model.number="form.porcentaje"
                    type="number"
                    class="form-control"
                    min="1"
                    max="100"
                  />
                </div>

                <div class="col-md-3">
                  <label class="form-label">Frecuencia (sol/mes)</label>
                  <input
                    v-model.number="form.frecuencia"
                    type="number"
                    class="form-control"
                    min="1"
                    max="10"
                  />
                </div>
              </div>
            </div>

            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">
                Cancelar
              </button>
              <button type="submit" class="btn btn-primary" :disabled="!isFormValid || submitting">
                <span v-if="submitting" class="spinner-border spinner-border-sm me-2"></span>
                {{ isEditMode ? 'Actualizar' : 'Crear' }} Empresa
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useUsersStore } from '@/stores/users'
import { Modal } from 'bootstrap'

const router = useRouter()
const authStore = useAuthStore()
const usersStore = useUsersStore()

// State
const loading = ref(false)
const submitting = ref(false)
const searchTerm = ref('')
const statusFilter = ref('')

// Modal
const companyModalRef = ref(null)
let companyModal = null

// Form
const isEditMode = ref(false)
const form = ref({
  id: null,
  first_name: '',
  last_name: '',
  email: '',
  gearbox: true,
  flexirol: 10,
  flexirol2: 10,
  flexirol3: '1',
  dia_inicio: 2,
  dia_cierre: 28,
  porcentaje: 50,
  dia_bloqueo: 2,
  frecuencia: 3,
  dia_reinicio: 4,
})

// Data
const companies = ref([])
const currentPage = ref(1)
const itemsPerPage = 20

// Computed
const filteredCompanies = computed(() => {
  let filtered = [...companies.value]

  if (searchTerm.value) {
    const search = searchTerm.value.toLowerCase()
    filtered = filtered.filter(
      (company) =>
        company.first_name?.toLowerCase().includes(search) ||
        company.last_name?.toLowerCase().includes(search) ||
        company.email?.toLowerCase().includes(search),
    )
  }

  if (statusFilter.value !== '') {
    const isActive = statusFilter.value === 'true'
    filtered = filtered.filter((company) => company.gearbox === isActive)
  }

  return filtered
})

const totalPages = computed(() => Math.ceil(filteredCompanies.value.length / itemsPerPage))

const paginatedCompanies = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage
  const end = start + itemsPerPage
  return filteredCompanies.value.slice(start, end)
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

const stats = computed(() => {
  const total = companies.value.length
  const active = companies.value.filter((c) => c.gearbox).length
  const totalEmployees = companies.value.reduce((sum, c) => sum + (c.employeeCount || 0), 0)
  const withoutExcel = companies.value.filter(
    (c) => !c.fecha_excel || c.fecha_excel === 'No creado',
  ).length

  return { total, active, totalEmployees, withoutExcel }
})

const isFormValid = computed(() => {
  return form.value.first_name && form.value.email
})

// Methods
const loadCompanies = async () => {
  loading.value = true
  try {
    const result = await usersStore.fetchUsersByRole('empresa')
    companies.value = result.map((company) => ({
      ...company,
      employeeCount: 0, // TODO: Load employee count
    }))
  } catch (error) {
    console.error('Error loading companies:', error)
  } finally {
    loading.value = false
  }
}

const openCreateModal = () => {
  isEditMode.value = false
  resetForm()
  companyModal.show()
}

const editCompany = (company) => {
  isEditMode.value = true
  form.value = { ...company }
  companyModal.show()
}

const handleSubmit = async () => {
  submitting.value = true
  try {
    const companyData = {
      ...form.value,
      role: 'empresa',
    }

    if (isEditMode.value) {
      await usersStore.updateUser(form.value.id, companyData)
    } else {
      await usersStore.createUser(companyData)
    }

    companyModal.hide()
    await loadCompanies()
  } catch (error) {
    console.error('Error saving company:', error)
  } finally {
    submitting.value = false
  }
}

const toggleCompanyStatus = async (company) => {
  try {
    await usersStore.toggleUserStatus(company.id)
    await loadCompanies()
  } catch (error) {
    console.error('Error toggling company status:', error)
  }
}

const confirmDelete = (company) => {
  if (
    confirm(`¿Eliminar empresa ${company.first_name}? Esto eliminará también todos sus empleados.`)
  ) {
    deleteCompany(company)
  }
}

const deleteCompany = async (company) => {
  try {
    await usersStore.deleteUser(company.id)
    await loadCompanies()
  } catch (error) {
    console.error('Error deleting company:', error)
  }
}

const viewEmployees = (company) => {
  router.push({
    name: 'usuarios',
    query: { empresa: company.id },
  })
}

const refreshCompanies = () => {
  loadCompanies()
}

const goToPage = (page) => {
  if (page >= 1 && page <= totalPages.value) {
    currentPage.value = page
  }
}

const resetForm = () => {
  form.value = {
    id: null,
    first_name: '',
    last_name: '',
    email: '',
    gearbox: true,
    flexirol: 10,
    flexirol2: 10,
    flexirol3: '1',
    dia_inicio: 2,
    dia_cierre: 28,
    porcentaje: 50,
    dia_bloqueo: 2,
    frecuencia: 3,
    dia_reinicio: 4,
  }
}

const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString('es-EC')
}

// Lifecycle
onMounted(async () => {
  companyModal = new Modal(companyModalRef.value)
  await loadCompanies()
})

onUnmounted(() => {
  if (companyModal) companyModal.dispose()
})
</script>

<style scoped>
.empresas-view {
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

.badge {
  font-size: 0.75em;
}
</style>
