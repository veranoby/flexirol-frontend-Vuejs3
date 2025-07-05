<template>
  <div class="container-fluid mt-4">
    <!-- Header and Actions -->
    <div class="row mb-4">
      <div class="col-md-6">
        <h1><i class="fas fa-building me-2"></i> Gestionar Empresas</h1>
      </div>
      <div class="col-md-6 text-end">
        <button class="btn btn-primary" @click="showCreateModal">
          <i class="fas fa-plus me-1"></i> Nueva Empresa
        </button>
      </div>
    </div>

    <!-- Filters -->
    <div class="card mb-4">
      <div class="card-body">
        <div class="row g-3">
          <div class="col-md-4">
            <label for="search" class="form-label">Buscar</label>
            <input
              type="text"
              class="form-control"
              id="search"
              v-model="filters.search"
              placeholder="Buscar por nombre o email..."
            />
          </div>
          <div class="col-md-3">
            <label for="status" class="form-label">Estado</label>
            <select class="form-select" id="status" v-model="filters.status">
              <option value="">Todos</option>
              <option value="active">Activas</option>
              <option value="inactive">Inactivas</option>
            </select>
          </div>
          <div class="col-md-3">
            <label for="plan" class="form-label">Plan</label>
            <select class="form-select" id="plan" v-model="filters.plan">
              <option value="">Todos</option>
              <option value="flexirol">Flexirol</option>
              <option value="flexirol2">Flexirol 2</option>
              <option value="flexirol3">Flexirol 3</option>
            </select>
          </div>
          <div class="col-md-2 d-flex align-items-end">
            <button class="btn btn-outline-secondary w-100" @click="resetFilters">
              <i class="fas fa-undo me-1"></i> Limpiar
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Companies Table -->
    <div class="card">
      <div class="card-body p-0">
        <div v-if="loading" class="text-center p-5">
          <div class="spinner-border text-primary" role="status">
            <span class="visually-hidden">Cargando...</span>
          </div>
          <p class="mt-2">Cargando empresas...</p>
        </div>

        <div v-else-if="filteredCompanies.length === 0" class="text-center p-5">
          <i class="fas fa-building fa-3x text-muted mb-3"></i>
          <p class="h5">No se encontraron empresas</p>
          <p class="text-muted">Intenta ajustar los filtros o crea una nueva empresa</p>
        </div>

        <div v-else class="table-responsive">
          <table class="table table-hover mb-0">
            <thead class="table-light">
              <tr>
                <th>Nombre</th>
                <th>Sucursal</th>
                <th>Email</th>
                <th class="text-center">Empleados</th>
                <th class="text-center">Plan</th>
                <th class="text-center">Estado</th>
                <th class="text-end">Acciones</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="company in paginatedCompanies" :key="company.id">
                <td class="align-middle">
                  <div class="d-flex align-items-center">
                    <div class="flex-shrink-0 me-2">
                      <i class="fas fa-building text-primary"></i>
                    </div>
                    <div class="flex-grow-1">
                      <strong>{{ company.first_name }}</strong>
                    </div>
                  </div>
                </td>
                <td class="align-middle">{{ company.last_name || '-' }}</td>
                <td class="align-middle">
                  <a :href="'mailto:' + company.email" class="text-decoration-none">
                    {{ company.email }}
                  </a>
                </td>
                <td class="text-center align-middle">
                  <span class="badge bg-primary rounded-pill">
                    {{ company.userCount || 0 }}
                  </span>
                </td>
                <td class="text-center align-middle">
                  <span class="badge" :class="getPlanBadgeClass(company.flexirol3)">
                    {{ getPlanName(company.flexirol3) }}
                  </span>
                </td>
                <td class="text-center align-middle">
                  <span class="badge" :class="company.gearbox ? 'bg-success' : 'bg-secondary'">
                    {{ company.gearbox ? 'Activa' : 'Inactiva' }}
                  </span>
                </td>
                <td class="text-end align-middle">
                  <div class="btn-group" role="group">
                    <button
                      class="btn btn-sm btn-outline-primary"
                      @click="viewUsers(company)"
                      title="Ver usuarios"
                    >
                      <i class="fas fa-users"></i>
                    </button>
                    <button
                      class="btn btn-sm btn-outline-secondary"
                      @click="editCompany(company)"
                      title="Editar empresa"
                    >
                      <i class="fas fa-edit"></i>
                    </button>
                    <button
                      class="btn btn-sm btn-outline-danger"
                      @click="showDeleteConfirmation(company)"
                      title="Eliminar empresa"
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
        <div v-if="filteredCompanies.length > 0" class="card-footer bg-white">
          <div class="row align-items-center">
            <div class="col-sm-12 col-md-5">
              <div class="dataTables_info">
                Mostrando {{ (currentPage - 1) * itemsPerPage + 1 }} a
                {{ Math.min(currentPage * itemsPerPage, filteredCompanies.length) }} de
                {{ filteredCompanies.length }} empresas
              </div>
            </div>
            <div class="col-sm-12 col-md-7">
              <nav class="d-flex justify-content-end">
                <ul class="pagination mb-0">
                  <li class="page-item" :class="{ disabled: currentPage === 1 }">
                    <button class="page-link" @click="currentPage--" :disabled="currentPage === 1">
                      Anterior
                    </button>
                  </li>

                  <li
                    v-for="page in totalPages"
                    :key="page"
                    class="page-item"
                    :class="{ active: currentPage === page }"
                  >
                    <button class="page-link" @click="currentPage = page">
                      {{ page }}
                    </button>
                  </li>

                  <li class="page-item" :class="{ disabled: currentPage >= totalPages }">
                    <button
                      class="page-link"
                      @click="currentPage++"
                      :disabled="currentPage >= totalPages"
                    >
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

    <!-- Create Company Modal -->
    <div class="modal fade" id="companyModal" tabindex="-1" aria-hidden="true">
      <div class="modal-dialog modal-lg">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">
              {{ isEditing ? 'Editar Empresa' : 'Nueva Empresa' }}
            </h5>
            <button
              type="button"
              class="btn-close"
              data-bs-dismiss="modal"
              aria-label="Close"
              @click="closeModal"
            ></button>
          </div>
          <form @submit.prevent="saveCompany">
            <div class="modal-body">
              <div class="row g-3">
                <div class="col-md-6">
                  <label for="companyName" class="form-label">Nombre de la Empresa *</label>
                  <input
                    type="text"
                    class="form-control"
                    id="companyName"
                    v-model="formData.first_name"
                    required
                  />
                </div>
                <div class="col-md-6">
                  <label for="branch" class="form-label">Sucursal</label>
                  <input
                    type="text"
                    class="form-control"
                    id="branch"
                    v-model="formData.last_name"
                  />
                </div>
                <div class="col-md-6">
                  <label for="email" class="form-label">Email *</label>
                  <input
                    type="email"
                    class="form-control"
                    id="email"
                    v-model="formData.email"
                    required
                  />
                </div>
                <div class="col-md-6">
                  <label for="plan" class="form-label">Plan *</label>
                  <select class="form-select" id="plan" v-model="formData.flexirol3" required>
                    <option value="1">Flexirol Básico</option>
                    <option value="2">Flexirol Premium</option>
                  </select>
                </div>
                <div class="col-12">
                  <div class="form-check form-switch">
                    <input
                      class="form-check-input"
                      type="checkbox"
                      id="activeSwitch"
                      v-model="formData.gearbox"
                    />
                    <label class="form-check-label" for="activeSwitch">
                      {{ formData.gearbox ? 'Activa' : 'Inactiva' }}
                    </label>
                  </div>
                </div>

                <!-- Advanced Settings (Collapsible) -->
                <div class="col-12">
                  <a
                    class="text-decoration-none"
                    data-bs-toggle="collapse"
                    href="#advancedSettings"
                    role="button"
                    @click="showAdvancedSettings = !showAdvancedSettings"
                  >
                    <i
                      class="fas"
                      :class="showAdvancedSettings ? 'fa-chevron-down' : 'fa-chevron-right'"
                    ></i>
                    Configuración avanzada
                  </a>

                  <div
                    class="collapse mt-2"
                    :class="{ show: showAdvancedSettings }"
                    id="advancedSettings"
                  >
                    <div class="card card-body bg-light">
                      <div class="row g-3">
                        <div class="col-md-4">
                          <label for="diaInicio" class="form-label">Día de inicio</label>
                          <input
                            type="number"
                            class="form-control"
                            id="diaInicio"
                            v-model.number="formData.dia_inicio"
                            min="1"
                            max="28"
                          />
                        </div>
                        <div class="col-md-4">
                          <label for="diaCierre" class="form-label">Día de cierre</label>
                          <input
                            type="number"
                            class="form-control"
                            id="diaCierre"
                            v-model.number="formData.dia_cierre"
                            min="1"
                            max="31"
                          />
                        </div>
                        <div class="col-md-4">
                          <label for="porcentaje" class="form-label">Porcentaje (%)</label>
                          <input
                            type="number"
                            class="form-control"
                            id="porcentaje"
                            v-model.number="formData.porcentaje"
                            min="0"
                            max="100"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div class="modal-footer">
              <button
                type="button"
                class="btn btn-outline-secondary"
                data-bs-dismiss="modal"
                @click="closeModal"
              >
                Cancelar
              </button>
              <button type="submit" class="btn btn-primary" :disabled="saving">
                <span
                  v-if="saving"
                  class="spinner-border spinner-border-sm me-1"
                  role="status"
                  aria-hidden="true"
                ></span>
                {{ isEditing ? 'Guardar cambios' : 'Crear empresa' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>

    <!-- Delete Confirmation Modal -->
    <div class="modal fade" id="deleteModal" tabindex="-1" aria-hidden="true">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header bg-danger text-white">
            <h5 class="modal-title">Confirmar eliminación</h5>
            <button
              type="button"
              class="btn-close"
              data-bs-dismiss="modal"
              aria-label="Close"
            ></button>
          </div>
          <div class="modal-body">
            <p>
              ¿Estás seguro de que deseas eliminar la empresa
              <strong>{{ companyToDelete?.first_name }}</strong
              >?
            </p>
            <p class="text-danger">
              <i class="fas fa-exclamation-triangle me-2"></i>
              Esta acción eliminará todos los usuarios asociados a esta empresa y no se puede
              deshacer.
            </p>
            <div class="form-check">
              <input
                class="form-check-input"
                type="checkbox"
                id="confirmDelete"
                v-model="deleteConfirmed"
              />
              <label class="form-check-label" for="confirmDelete">
                Entiendo que esta acción no se puede deshacer
              </label>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">
              Cancelar
            </button>
            <button
              type="button"
              class="btn btn-danger"
              @click="deleteCompany"
              :disabled="!deleteConfirmed || deleting"
            >
              <span
                v-if="deleting"
                class="spinner-border spinner-border-sm me-1"
                role="status"
                aria-hidden="true"
              ></span>
              Sí, eliminar empresa
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Toast Notifications -->
    <div class="position-fixed bottom-0 end-0 p-3" style="z-index: 11">
      <div
        id="toast"
        class="toast"
        role="alert"
        aria-live="assertive"
        aria-atomic="true"
        :class="toast.variant ? 'text-bg-' + toast.variant : ''"
      >
        <div class="d-flex">
          <div class="toast-body">
            <i :class="toast.icon + ' me-2'"></i>
            {{ toast.message }}
          </div>
          <button
            type="button"
            class="btn-close me-2 m-auto"
            data-bs-dismiss="toast"
            aria-label="Close"
          ></button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Modal, Toast, Tooltip } from 'bootstrap'
import 'bootstrap/dist/js/bootstrap.bundle.min.js'
import { useUsersStore } from '@/stores/users'

const router = useRouter()
const usersStore = useUsersStore()

// State
const companies = ref([])
const loading = ref(true)
const saving = ref(false)
const deleting = ref(false)
const deleteConfirmed = ref(false)
const showAdvancedSettings = ref(false)
const companyToDelete = ref(null)
const currentPage = ref(1)
const itemsPerPage = 10

// Filters
const filters = ref({
  search: '',
  status: '',
  plan: '',
})

// Form data
const formData = ref({
  id: null,
  first_name: '',
  last_name: '',
  email: '',
  gearbox: true,
  flexirol3: '1',
  role: 'empresa',
  dia_inicio: 1,
  dia_cierre: 28,
  porcentaje: 30,
  user_pass: '',
})

// Toast
const toast = ref({
  show: false,
  message: '',
  variant: 'success',
  icon: 'fas fa-check-circle',
})

// Computed
const filteredCompanies = computed(() => {
  return companies.value.filter((company) => {
    const matchesSearch =
      !filters.value.search ||
      company.first_name.toLowerCase().includes(filters.value.search.toLowerCase()) ||
      company.email.toLowerCase().includes(filters.value.search.toLowerCase())

    const matchesStatus =
      !filters.value.status ||
      (filters.value.status === 'active' && company.gearbox) ||
      (filters.value.status === 'inactive' && !company.gearbox)

    const matchesPlan =
      !filters.value.plan ||
      (filters.value.plan === 'flexirol' && company.flexirol3 === '1') ||
      (filters.value.plan === 'flexirol2' && company.flexirol3 === '2') ||
      (filters.value.plan === 'flexirol3' && company.flexirol3 === '3')

    return matchesSearch && matchesStatus && matchesPlan
  })
})

const paginatedCompanies = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage
  const end = start + itemsPerPage
  return filteredCompanies.value.slice(start, end)
})

const totalPages = computed(() => {
  return Math.ceil(filteredCompanies.value.length / itemsPerPage)
})

// Methods
const fetchCompanies = async () => {
  try {
    loading.value = true
    const response = await usersStore.fetchUsersByRole('empresa')
    companies.value = response.items || []

    // Add user count to each company
    for (const company of companies.value) {
      const users = await usersStore.fetchUsersByRole('usuario', company.id)
      company.userCount = users.items?.length || 0
    }
  } catch (error) {
    showToast('Error al cargar las empresas', 'danger', 'fa-exclamation-circle')
    console.error('Error fetching companies:', error)
  } finally {
    loading.value = false
  }
}

const showCreateModal = () => {
  formData.value = {
    id: null,
    first_name: '',
    last_name: '',
    email: '',
    gearbox: true,
    flexirol3: '1',
    role: 'empresa',
    dia_inicio: 1,
    dia_cierre: 28,
    porcentaje: 30,
    user_pass: '',
  }

  const modal = new Modal(document.getElementById('companyModal'))
  modal.show()
}

const editCompany = (company) => {
  formData.value = {
    id: company.id,
    first_name: company.first_name,
    last_name: company.last_name || '',
    email: company.email,
    gearbox: company.gearbox,
    flexirol3: company.flexirol3 || '1',
    role: 'empresa',
    dia_inicio: company.dia_inicio || 1,
    dia_cierre: company.dia_cierre || 28,
    porcentaje: company.porcentaje || 30,
    user_pass: '',
  }

  const modal = new Modal(document.getElementById('companyModal'))
  modal.show()
}

const saveCompany = async () => {
  try {
    saving.value = true

    // Set username and password for new companies
    if (!formData.value.id) {
      formData.value.user_login = formData.value.email.split('@')[0]
      formData.value.user_pass = formData.value.first_name.toLowerCase().replace(/\s+/g, '')
    }

    if (formData.value.id) {
      // Update existing company
      await usersStore.updateUser(formData.value.id, formData.value)
      showToast('Empresa actualizada correctamente', 'success')
    } else {
      // Create new company
      await usersStore.createUser(formData.value)
      showToast('Empresa creada correctamente', 'success')
    }

    // Refresh companies list
    await fetchCompanies()

    // Close modal
    const modal = Modal.getInstance(document.getElementById('companyModal'))
    modal.hide()
  } catch (error) {
    showToast(error.message || 'Error al guardar la empresa', 'danger', 'fa-exclamation-circle')
    console.error('Error saving company:', error)
  } finally {
    saving.value = false
  }
}

const showDeleteConfirmation = (company) => {
  companyToDelete.value = company
  const modal = new Modal(document.getElementById('deleteModal'))
  modal.show()
}

const deleteCompany = async () => {
  if (!companyToDelete.value) return

  try {
    deleting.value = true

    // Delete the company (and associated users via cascade in the backend)
    await usersStore.deleteUser(companyToDelete.value.id)

    // Refresh companies list
    await fetchCompanies()

    // Close modal
    const modal = Modal.getInstance(document.getElementById('deleteModal'))
    modal.hide()

    showToast('Empresa eliminada correctamente', 'success')
  } catch (error) {
    showToast('Error al eliminar la empresa', 'danger', 'fa-exclamation-circle')
    console.error('Error deleting company:', error)
  } finally {
    deleting.value = false
    companyToDelete.value = null
  }
}

const viewUsers = (company) => {
  router.push({
    name: 'usuarios',
    query: { empresa: company.id },
  })
}

const resetFilters = () => {
  filters.value = {
    search: '',
    status: '',
    plan: '',
  }
  currentPage.value = 1
}

const closeModal = () => {
  const modal = Modal.getInstance(document.getElementById('companyModal'))
  if (modal) modal.hide()
}

const showToast = (message, variant = 'success', icon = 'fa-check-circle') => {
  toast.value = { message, variant, icon }
  const toastEl = document.getElementById('toast')
  const toastInstance = new Toast(toastEl, { autohide: true, delay: 5000 })
  toastInstance.show()
}

const getPlanName = (plan) => {
  const plans = {
    1: 'Básico',
    2: 'Premium',
    3: 'Empresarial',
  }
  return plans[plan] || 'Desconocido'
}

const getPlanBadgeClass = (plan) => {
  const classes = {
    1: 'bg-secondary',
    2: 'bg-primary',
    3: 'bg-success',
  }
  return classes[plan] || 'bg-secondary'
}

// Lifecycle hooks
onMounted(async () => {
  await fetchCompanies()

  // Initialize tooltips
  const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'))
  tooltipTriggerList.forEach(function (tooltipTriggerEl) {
    return new Tooltip(tooltipTriggerEl)
  })
})
</script>

<style scoped>
.table th {
  font-weight: 600;
  text-transform: uppercase;
  font-size: 0.75rem;
  letter-spacing: 0.5px;
}

.badge {
  font-weight: 500;
  padding: 0.35em 0.65em;
}

.btn-group .btn {
  margin-right: 0.25rem;
}

.btn-group .btn:last-child {
  margin-right: 0;
}

.toast {
  opacity: 1;
  transition: opacity 0.3s ease-in-out;
}

.toast:not(.show) {
  display: none;
  opacity: 0;
}

.loading-spinner {
  width: 3rem;
  height: 3rem;
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .btn-group {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .btn-group .btn {
    margin-right: 0;
    width: 100%;
  }

  .table-responsive {
    font-size: 0.875rem;
  }
}
</style>
