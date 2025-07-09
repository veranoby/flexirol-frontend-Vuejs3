<template>
  <v-container fluid class="pa-6">
    <!-- Header -->
    <v-row class="mb-6">
      <v-col cols="12">
        <div class="d-flex align-center mb-2">
          <v-icon class="text-primary me-3" size="32">mdi-office-building</v-icon>
          <h1 class="text-h4 font-weight-bold">Gestión de Empresas</h1>
        </div>
        <p class="text-body-1 text-medium-emphasis">
          Administra las empresas registradas y sus usuarios en el sistema
        </p>
      </v-col>
    </v-row>

    <!-- Stats Cards -->
    <v-row class="mb-6">
      <v-col cols="12" md="2">
        <v-card class="pa-4 text-center" color="primary" variant="tonal">
          <v-icon size="40" class="mb-2">mdi-office-building</v-icon>
          <div class="text-h4 font-weight-bold text-primary">{{ stats.totalCompanies }}</div>
          <div class="text-body-2">Empresas Registradas</div>
        </v-card>
      </v-col>
      <v-col cols="12" md="2">
        <v-card class="pa-4 text-center" color="success" variant="tonal">
          <v-icon size="40" class="mb-2">mdi-check-circle</v-icon>
          <div class="text-h4 font-weight-bold text-success">{{ stats.activeCompanies }}</div>
          <div class="text-body-2">Empresas Activas</div>
        </v-card>
      </v-col>

      <v-col cols="12" md="2">
        <v-card class="pa-4 text-center" color="warning" variant="tonal">
          <v-icon size="40" class="mb-2">mdi-account-multiple</v-icon>
          <div class="text-h4 font-weight-bold text-warning">{{ stats.totalUsers }}</div>
          <div class="text-body-2">Total Usuarios</div>
        </v-card>
      </v-col>
    </v-row>

    <!-- Controls -->
    <v-row class="mb-4">
      <v-col cols="12" md="6">
        <v-text-field
          v-model="searchTerm"
          prepend-inner-icon="mdi-magnify"
          label="Buscar empresas..."
          variant="outlined"
          density="compact"
          clearable
        />
      </v-col>
      <v-col cols="12" md="6" class="d-flex justify-end align-center">
        <v-btn color="primary" size="large" @click="openCreateModal" :loading="loading">
          <v-icon start>mdi-plus</v-icon>
          Crear Empresa
        </v-btn>
      </v-col>
    </v-row>

    <!-- Companies Table -->
    <v-card>
      <v-data-table
        :headers="tableHeaders"
        :items="filteredCompanies"
        :loading="loading"
        class="elevation-1"
        loading-text="Cargando empresas..."
        no-data-text="No hay empresas registradas"
        :items-per-page="15"
        items-per-page-text="Empresas por página"
      >
        <!-- Company Info -->
        <template #item.company_info="{ item }">
          <div class="py-2">
            <div class="text-body-1 font-weight-medium">{{ item.company_name }}</div>
            <div class="text-body-2 text-medium-emphasis">
              RUC: {{ item.ruc || 'No registrado' }}
            </div>
          </div>
        </template>

        <!-- Owner Info -->
        <template #item.owner_info="{ item }">
          <div class="py-2" v-if="item.expand?.owner_id">
            <div class="text-body-1 font-weight-medium">
              {{ item.expand.owner_id.first_name }} {{ item.expand.owner_id.last_name }}
            </div>
            <div class="text-body-2 text-medium-emphasis">
              {{ item.expand.owner_id.email }}
            </div>
          </div>
          <div v-else class="text-body-2 text-medium-emphasis">Sin propietario asignado</div>
        </template>

        <!-- User Stats -->
        <template #item.user_stats="{ item }">
          <div class="d-flex flex-column gap-1">
            <v-chip color="primary" size="small" variant="tonal">
              <v-icon start size="16">mdi-account-multiple</v-icon>
              {{ item.users_count || 0 }} total
            </v-chip>
            <v-chip color="success" size="small" variant="tonal">
              <v-icon start size="16">mdi-check</v-icon>
              {{ item.active_users_count || 0 }} activos
            </v-chip>
          </div>
        </template>

        <!-- Status -->
        <template #item.status="{ item }">
          <v-chip :color="item.gearbox ? 'success' : 'error'" size="small" variant="tonal">
            <v-icon start size="16">
              {{ item.gearbox ? 'mdi-check-circle' : 'mdi-close-circle' }}
            </v-icon>
            {{ item.gearbox ? 'Activa' : 'Bloqueada' }}
          </v-chip>
        </template>

        <!-- Actions -->
        <template #item.actions="{ item }">
          <div class="d-flex gap-1">
            <v-tooltip text="Ver usuarios">
              <template #activator="{ props }">
                <v-btn
                  v-bind="props"
                  icon="mdi-account-multiple"
                  size="small"
                  variant="text"
                  color="primary"
                  @click="viewCompanyUsers(item)"
                />
              </template>
            </v-tooltip>

            <v-tooltip text="Editar empresa">
              <template #activator="{ props }">
                <v-btn
                  v-bind="props"
                  icon="mdi-pencil"
                  size="small"
                  variant="text"
                  color="secondary"
                  @click="editCompany(item)"
                />
              </template>
            </v-tooltip>

            <v-tooltip :text="item.gearbox ? 'Bloquear empresa' : 'Activar empresa'">
              <template #activator="{ props }">
                <v-btn
                  v-bind="props"
                  :icon="item.gearbox ? 'mdi-lock' : 'mdi-lock-open'"
                  size="small"
                  variant="text"
                  :color="item.gearbox ? 'warning' : 'success'"
                  @click="toggleCompanyStatus(item)"
                />
              </template>
            </v-tooltip>

            <v-tooltip text="Eliminar empresa">
              <template #activator="{ props }">
                <v-btn
                  v-bind="props"
                  icon="mdi-delete"
                  size="small"
                  variant="text"
                  color="error"
                  @click="deleteCompany(item)"
                />
              </template>
            </v-tooltip>
          </div>
        </template>
      </v-data-table>
    </v-card>

    <!-- Create/Edit Company Modal -->
    <v-dialog v-model="companyModal" max-width="800px" persistent>
      <v-card>
        <v-card-title class="d-flex align-center">
          <v-icon class="me-2">{{ isEditing ? 'mdi-pencil' : 'mdi-plus' }}</v-icon>
          {{ isEditing ? 'Editar Empresa' : 'Crear Nueva Empresa' }}
        </v-card-title>

        <v-card-text>
          <v-form ref="companyForm" v-model="companyFormValid">
            <v-row>
              <!-- Company Info -->
              <v-col cols="12">
                <v-divider class="mb-4" />
                <h3 class="text-h6 mb-4">Información de la Empresa</h3>
              </v-col>

              <v-col cols="12" md="6">
                <v-text-field
                  v-model="companyFormData.company_name"
                  label="Nombre de la Empresa *"
                  variant="outlined"
                  :rules="[rules.required]"
                  prepend-inner-icon="mdi-office-building"
                />
              </v-col>

              <v-col cols="12" md="6">
                <v-text-field
                  v-model="companyFormData.ruc"
                  label="RUC"
                  variant="outlined"
                  prepend-inner-icon="mdi-card-account-details"
                />
              </v-col>

              <!-- Owner Info -->
              <v-col cols="12">
                <v-divider class="mb-4" />
                <h3 class="text-h6 mb-4">Propietario de la Empresa</h3>
              </v-col>

              <v-col cols="12" md="6">
                <v-text-field
                  v-model="ownerFormData.first_name"
                  label="Nombre *"
                  variant="outlined"
                  :rules="[rules.required]"
                  prepend-inner-icon="mdi-account"
                />
              </v-col>

              <v-col cols="12" md="6">
                <v-text-field
                  v-model="ownerFormData.last_name"
                  label="Apellido/Sucursal *"
                  variant="outlined"
                  :rules="[rules.required]"
                  prepend-inner-icon="mdi-account"
                />
              </v-col>

              <v-col cols="12" md="6">
                <v-text-field
                  v-model="ownerFormData.email"
                  label="Email *"
                  variant="outlined"
                  :rules="[rules.required, rules.email]"
                  prepend-inner-icon="mdi-email"
                />
              </v-col>

              <v-col cols="12" md="6">
                <v-text-field
                  v-model="ownerFormData.username"
                  label="Usuario"
                  variant="outlined"
                  hint="Se genera automáticamente si se deja vacío"
                  prepend-inner-icon="mdi-account-circle"
                  persistent-hint
                />
              </v-col>

              <v-col cols="12" md="6">
                <v-text-field
                  v-model="ownerFormData.password"
                  label="Contraseña"
                  variant="outlined"
                  type="password"
                  hint="Se genera automáticamente si se deja vacía"
                  prepend-inner-icon="mdi-lock"
                  persistent-hint
                />
              </v-col>

              <v-col cols="12" md="6">
                <v-switch
                  v-model="ownerFormData.gearbox"
                  label="Usuario habilitado"
                  color="success"
                  hide-details
                />
              </v-col>
            </v-row>
          </v-form>
        </v-card-text>

        <v-card-actions>
          <v-spacer />
          <v-btn text="Cancelar" @click="closeCompanyModal" :disabled="companiesStore.loading" />
          <v-btn
            color="primary"
            text="Guardar"
            @click="saveCompany"
            :loading="companiesStore.loading"
            :disabled="!companyFormValid"
          />
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Company Users Modal -->
    <v-dialog v-model="usersModal" max-width="1200px">
      <v-card v-if="selectedCompany">
        <v-card-title class="d-flex align-center">
          <v-icon class="me-2">mdi-account-multiple</v-icon>
          Usuarios de {{ selectedCompany.company_name }}
        </v-card-title>

        <v-card-text>
          <!-- Users Controls -->
          <v-row class="mb-4">
            <v-col cols="12" md="6">
              <v-text-field
                v-model="userSearchTerm"
                prepend-inner-icon="mdi-magnify"
                label="Buscar usuarios..."
                variant="outlined"
                density="compact"
                clearable
              />
            </v-col>
            <v-col cols="12" md="6" class="d-flex justify-end">
              <v-btn
                color="primary"
                @click="openCreateUserModal"
                :loading="companiesStore.loadingUsers"
              >
                <v-icon start>mdi-plus</v-icon>
                Crear Usuario
              </v-btn>
            </v-col>
          </v-row>

          <!-- Users List -->
          <div v-if="filteredUsers.length > 0">
            <v-row>
              <v-col v-for="user in filteredUsers" :key="user.id" cols="12" md="6" lg="4">
                <v-card class="pa-3" variant="outlined">
                  <div class="d-flex align-center mb-2">
                    <v-avatar :color="user.gearbox ? 'success' : 'error'" size="40" class="me-3">
                      <v-icon color="white">
                        {{ user.gearbox ? 'mdi-account-check' : 'mdi-account-cancel' }}
                      </v-icon>
                    </v-avatar>
                    <div class="flex-grow-1">
                      <div class="text-body-1 font-weight-medium">
                        {{ user.first_name }} {{ user.last_name }}
                      </div>
                      <div class="text-body-2 text-medium-emphasis">
                        {{ user.email }}
                      </div>
                    </div>
                  </div>

                  <v-divider class="my-2" />

                  <div class="text-body-2 mb-2">
                    <strong>Cédula:</strong> {{ user.cedula || 'No registrada' }}
                  </div>
                  <div class="text-body-2 mb-3">
                    <strong>Disponible:</strong> ${{ user.disponible || 0 }}
                  </div>

                  <div class="d-flex gap-1">
                    <v-btn
                      size="small"
                      variant="outlined"
                      color="secondary"
                      @click="editUser(user)"
                    >
                      <v-icon start size="16">mdi-pencil</v-icon>
                      Editar
                    </v-btn>
                    <v-btn size="small" variant="outlined" color="error" @click="deleteUser(user)">
                      <v-icon start size="16">mdi-delete</v-icon>
                      Eliminar
                    </v-btn>
                  </div>
                </v-card>
              </v-col>
            </v-row>
          </div>

          <div v-else-if="!companiesStore.loadingUsers" class="text-center py-8">
            <v-icon size="64" class="text-medium-emphasis mb-4">mdi-account-off</v-icon>
            <h3 class="text-h6 mb-2">No hay usuarios registrados</h3>
            <p class="text-body-2 text-medium-emphasis mb-4">
              Esta empresa aún no tiene usuarios registrados
            </p>
            <v-btn color="primary" @click="openCreateUserModal">
              <v-icon start>mdi-plus</v-icon>
              Crear Primer Usuario
            </v-btn>
          </div>

          <div v-if="companiesStore.loadingUsers" class="text-center py-8">
            <v-progress-circular indeterminate color="primary" />
            <p class="text-body-2 mt-2">Cargando usuarios...</p>
          </div>
        </v-card-text>

        <v-card-actions>
          <v-spacer />
          <v-btn text="Cerrar" @click="closeUsersModal" />
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Create User Modal -->
    <v-dialog v-model="createUserModal" max-width="600px" persistent>
      <v-card>
        <v-card-title class="d-flex align-center">
          <v-icon class="me-2">mdi-account-plus</v-icon>
          Crear Usuario para {{ selectedCompany?.company_name }}
        </v-card-title>

        <v-card-text>
          <v-form ref="userForm" v-model="userFormValid">
            <v-row>
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="userFormData.first_name"
                  label="Nombre *"
                  variant="outlined"
                  :rules="[rules.required]"
                  prepend-inner-icon="mdi-account"
                />
              </v-col>

              <v-col cols="12" md="6">
                <v-text-field
                  v-model="userFormData.last_name"
                  label="Apellido *"
                  variant="outlined"
                  :rules="[rules.required]"
                  prepend-inner-icon="mdi-account"
                />
              </v-col>

              <v-col cols="12">
                <v-text-field
                  v-model="userFormData.email"
                  label="Email *"
                  variant="outlined"
                  :rules="[rules.required, rules.email]"
                  prepend-inner-icon="mdi-email"
                />
              </v-col>

              <v-col cols="12" md="6">
                <v-text-field
                  v-model="userFormData.cedula"
                  label="Cédula *"
                  variant="outlined"
                  :rules="[rules.required, rules.cedula]"
                  prepend-inner-icon="mdi-card-account-details"
                />
              </v-col>

              <v-col cols="12" md="6">
                <v-text-field
                  v-model.number="userFormData.disponible"
                  label="Monto Disponible"
                  variant="outlined"
                  type="number"
                  min="0"
                  prepend-inner-icon="mdi-currency-usd"
                />
              </v-col>

              <v-col cols="12">
                <v-switch
                  v-model="userFormData.gearbox"
                  label="Usuario habilitado"
                  color="success"
                  hide-details
                />
              </v-col>
            </v-row>
          </v-form>
        </v-card-text>

        <v-card-actions>
          <v-spacer />
          <v-btn
            text="Cancelar"
            @click="closeCreateUserModal"
            :disabled="companiesStore.loadingUsers"
          />
          <v-btn
            color="primary"
            text="Crear Usuario"
            @click="saveUser"
            :loading="companiesStore.loadingUsers"
            :disabled="!userFormValid"
          />
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Delete Confirmation Modal -->
    <v-dialog v-model="deleteModal" max-width="500px">
      <v-card>
        <v-card-title class="d-flex align-center text-error">
          <v-icon class="me-2">mdi-alert-circle</v-icon>
          Confirmar Eliminación
        </v-card-title>

        <v-card-text>
          <div v-if="itemToDelete?.type === 'company'">
            <p class="text-body-1 mb-3">
              ¿Está seguro que desea eliminar la empresa
              <strong>{{ itemToDelete.item?.company_name }}</strong
              >?
            </p>
            <v-alert type="warning" variant="tonal" class="mb-3">
              <strong>¡Atención!</strong> Esta acción eliminará también todos los usuarios asociados
              a esta empresa. Esta acción no se puede deshacer.
            </v-alert>
            <p class="text-body-2">
              Usuarios que serán eliminados:
              <strong>{{ itemToDelete.item?.users_count || 0 }}</strong>
            </p>
          </div>

          <div v-else-if="itemToDelete?.type === 'user'">
            <p class="text-body-1">
              ¿Está seguro que desea eliminar al usuario
              <strong>{{ itemToDelete.item?.first_name }} {{ itemToDelete.item?.last_name }}</strong
              >?
            </p>
            <v-alert type="warning" variant="tonal" class="mt-3">
              Esta acción no se puede deshacer.
            </v-alert>
          </div>
        </v-card-text>

        <v-card-actions>
          <v-spacer />
          <v-btn text="Cancelar" @click="closeDeleteModal" :disabled="deleting" />
          <v-btn color="error" text="Eliminar" @click="confirmDelete" :loading="deleting" />
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Toast Notifications -->
    <v-snackbar v-model="toast.show" :color="toast.color" :timeout="5000" location="top right">
      {{ toast.message }}
      <template #actions>
        <v-btn color="white" variant="text" @click="toast.show = false"> Cerrar </v-btn>
      </template>
    </v-snackbar>
  </v-container>
</template>

<script setup>
import { ref, computed, onMounted, nextTick, onUnmounted } from 'vue'
import { useCompaniesStore } from '@/stores/companies'
import { useUsersStore } from '@/stores/users'

// Stores
const companiesStore = useCompaniesStore()
const usersStore = useUsersStore()

// Data
const searchTerm = ref('')
const userSearchTerm = ref('')
const loading = ref(false)
const deleting = ref(false)

// Modals
const companyModal = ref(false)
const usersModal = ref(false)
const createUserModal = ref(false)
const deleteModal = ref(false)

// Forms
const companyForm = ref()
const userForm = ref()
const companyFormValid = ref(false)
const userFormValid = ref(false)
const isEditing = ref(false)
const selectedCompany = ref(null)
const itemToDelete = ref(null)

// Form Data
const companyFormData = ref({
  company_name: '',
  ruc: '',
})

const ownerFormData = ref({
  first_name: '',
  last_name: '',
  email: '',
  username: '',
  password: '',
  gearbox: true,
})

const userFormData = ref({
  first_name: '',
  last_name: '',
  email: '',
  cedula: '',
  disponible: 0,
  gearbox: true,
})

// Toast
const toast = ref({
  show: false,
  message: '',
  color: 'success',
})

// Validation Rules
const rules = {
  required: (value) => !!value || 'Este campo es requerido',
  email: (value) => {
    const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return pattern.test(value) || 'Email inválido'
  },
  cedula: (value) => {
    const pattern = /^[0-9]{10}$/
    return pattern.test(value) || 'Cédula debe tener 10 dígitos'
  },
}

// Table Headers
const tableHeaders = [
  { title: 'Empresa', key: 'company_info', sortable: false },
  { title: 'Propietario', key: 'owner_info', sortable: false },
  { title: 'Usuarios', key: 'user_stats', sortable: false },
  { title: 'Estado', key: 'status', sortable: false },
  { title: 'Acciones', key: 'actions', sortable: false },
]

// Computed
const stats = computed(() => companiesStore.stats)

const filteredCompanies = computed(() => {
  if (!searchTerm.value) return companiesStore.companies

  const search = searchTerm.value.toLowerCase()
  return companiesStore.companies.filter(
    (company) =>
      company.company_name?.toLowerCase().includes(search) ||
      company.ruc?.toLowerCase().includes(search) ||
      company.expand?.owner_id?.first_name?.toLowerCase().includes(search) ||
      company.expand?.owner_id?.last_name?.toLowerCase().includes(search) ||
      company.expand?.owner_id?.email?.toLowerCase().includes(search),
  )
})

const filteredUsers = computed(() => {
  if (!userSearchTerm.value) return companiesStore.companyUsers

  const search = userSearchTerm.value.toLowerCase()
  return companiesStore.companyUsers.filter(
    (user) =>
      user.first_name?.toLowerCase().includes(search) ||
      user.last_name?.toLowerCase().includes(search) ||
      user.email?.toLowerCase().includes(search) ||
      user.cedula?.toLowerCase().includes(search),
  )
})

// Methods
const showToast = (message, color = 'success') => {
  toast.value = { show: true, message, color }
}

// 1. Variable para controlar solicitudes
let isMounted = true
const abortController = new AbortController()

onUnmounted(() => {
  isMounted = false
  abortController.abort()
})

onMounted(() => {
  // Espera a que la ruta esté lista
  nextTick(() => {
    loadData()
  })
})

const loadData = async () => {
  if (!isMounted) return

  try {
    await companiesStore.fetchCompanies({
      signal: abortController.signal,
    })
  } catch (err) {
    if (err.name !== 'AbortError') {
      showToast('Error al cargar datos', 'error')
    }
  }
}

const openCreateModal = () => {
  isEditing.value = false
  companyFormData.value = { company_name: '', ruc: '' }
  ownerFormData.value = {
    first_name: '',
    last_name: '',
    email: '',
    username: '',
    password: '',
    gearbox: true,
  }
  companyModal.value = true
}

const editCompany = async (company) => {
  isEditing.value = true
  companyFormData.value = {
    company_name: company.company_name,
    ruc: company.ruc || '',
  }

  if (company.expand?.owner_id) {
    ownerFormData.value = {
      first_name: company.expand.owner_id.first_name,
      last_name: company.expand.owner_id.last_name,
      email: company.expand.owner_id.email,
      username: company.expand.owner_id.username,
      password: '',
      gearbox: company.expand.owner_id.gearbox,
    }
  }

  selectedCompany.value = company
  companyModal.value = true
}

const closeCompanyModal = () => {
  companyModal.value = false
  selectedCompany.value = null
  if (companyForm.value) {
    companyForm.value.reset()
  }
}

const saveCompany = async () => {
  if (!companyFormValid.value) return

  try {
    let result
    if (isEditing.value) {
      result = await companiesStore.updateCompany(
        selectedCompany.value.id,
        companyFormData.value,
        ownerFormData.value,
      )
    } else {
      result = await companiesStore.createCompany(companyFormData.value, ownerFormData.value)
    }

    if (result.success) {
      showToast(
        isEditing.value ? 'Empresa actualizada correctamente' : 'Empresa creada correctamente',
      )
      closeCompanyModal()
    } else {
      showToast(result.error || 'Error al guardar empresa', 'error')
    }
  } catch (error) {
    showToast('Error al guardar empresa', 'error')
  }
}

const toggleCompanyStatus = async (company) => {
  try {
    const result = await companiesStore.toggleCompanyStatus(company.id)
    if (result.success) {
      showToast(`Empresa ${result.newStatus ? 'activada' : 'bloqueada'} correctamente`)
    } else {
      showToast(result.error || 'Error al cambiar estado', 'error')
    }
  } catch (error) {
    showToast('Error al cambiar estado de la empresa', 'error')
  }
}

const viewCompanyUsers = async (company) => {
  selectedCompany.value = company
  usersModal.value = true
  await companiesStore.fetchCompanyUsers(company.id)
}

const closeUsersModal = () => {
  usersModal.value = false
  selectedCompany.value = null
  userSearchTerm.value = ''
}

const openCreateUserModal = () => {
  userFormData.value = {
    first_name: '',
    last_name: '',
    email: '',
    cedula: '',
    disponible: 0,
    gearbox: true,
  }
  createUserModal.value = true
}

const closeCreateUserModal = () => {
  createUserModal.value = false
  if (userForm.value) {
    userForm.value.reset()
  }
}

const saveUser = async () => {
  if (!userFormValid.value || !selectedCompany.value) return

  try {
    const result = await companiesStore.createCompanyUser(
      selectedCompany.value.id,
      userFormData.value,
    )

    if (result.success) {
      showToast('Usuario creado correctamente')
      closeCreateUserModal()
    } else {
      showToast(result.error || 'Error al crear usuario', 'error')
    }
  } catch (error) {
    showToast('Error al crear usuario', 'error')
  }
}

const deleteCompany = (company) => {
  itemToDelete.value = { type: 'company', item: company }
  deleteModal.value = true
}

const deleteUser = (user) => {
  itemToDelete.value = { type: 'user', item: user }
  deleteModal.value = true
}

const closeDeleteModal = () => {
  deleteModal.value = false
  itemToDelete.value = null
}

const confirmDelete = async () => {
  if (!itemToDelete.value) return

  deleting.value = true
  try {
    if (itemToDelete.value.type === 'company') {
      const result = await companiesStore.deleteCompany(itemToDelete.value.item.id)
      if (result.success) {
        showToast(`Empresa eliminada. Se eliminaron ${result.deletedUsers} usuarios.`)
      } else {
        showToast(result.error || 'Error al eliminar empresa', 'error')
      }
    } else if (itemToDelete.value.type === 'user') {
      await usersStore.deleteUser(itemToDelete.value.item.id)
      showToast('Usuario eliminado correctamente')
      if (selectedCompany.value) {
        await companiesStore.fetchCompanyUsers(selectedCompany.value.id)
        await companiesStore.fetchCompanies() // Refresh counts
      }
    }
  } catch (error) {
    showToast('Error al eliminar', 'error')
  } finally {
    deleting.value = false
    closeDeleteModal()
  }
}

const editUser = (user) => {
  // TODO: Implement user editing modal
  showToast('Funcionalidad de edición en desarrollo', 'info')
}

// Lifecycle
onMounted(() => {
  loadData()
})
</script>

<style scoped>
.v-card {
  transition: all 0.2s ease-in-out;
}

.v-card:hover {
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.12);
}
</style>
