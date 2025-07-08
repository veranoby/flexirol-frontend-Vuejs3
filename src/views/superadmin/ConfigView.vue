<template>
  <v-container class="max-w-5xl mx-auto mt-6">
    <div
      v-if="authStore.loading || companiesStore.loading"
      class="flex flex-col items-center justify-center min-h-[200px]"
    >
      <v-progress-circular indeterminate color="warning" size="40"></v-progress-circular>
      <p class="mt-3">Loading...</p>
    </div>

    <v-alert v-if="!authStore.loading && viewError" type="error" class="mb-6">
      {{ viewError }}
    </v-alert>

    <div v-if="!authStore.loading && !viewError && companyData">
      <!-- Global Alert -->
      <v-alert
        v-if="alertMessage"
        :type="alertVariant"
        class="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 min-w-[300px]"
        closable
        @input="alertMessage = ''"
      >
        <strong>{{ alertMessage }}</strong>
      </v-alert>

      <!-- Company Read-only View -->
      <v-card v-if="authStore.isEmpresa && !authStore.isSuperadmin" class="shadow-md">
        <v-card-title class="bg-primary text-white">
          <h4>Configuración de la Empresa</h4>
        </v-card-title>
        <v-card-text>
          <p class="text-h6">
            Su configuración de Ciclo de Anticipos mensual ha sido configurada por FlexiRol. Si
            requiere hacer cambios a estos parámetros, comuníquese por favor con
            soporte@flexirol.com
          </p>

          <div class="mb-4">
            <h5 class="flex items-center">
              <v-icon class="mr-2">mdi-office-building</v-icon> Nombre de la Empresa
            </h5>
            <p>{{ companyData.company_name || 'No especificado' }}</p>
          </div>
          <v-divider></v-divider>
          <div class="mb-4">
            <h5 class="flex items-center">
              <v-icon class="mr-2">mdi-cash</v-icon> Plan Seleccionado Actual
            </h5>
            <p v-if="companyData.flexirol3 === '2'">
              PLAN 2: Valor fijo/pago mensual recurrente (${{ companyData.flexirol2 }} / mensual)
              <small>(más IVA)</small>
            </p>
            <p v-else>
              PLAN 1: Porcentaje sobre la transacción ({{ companyData.flexirol }}% del Anticipo)
              <small>(más IVA)</small>
            </p>
          </div>
          <v-divider></v-divider>
          <h5 class="flex items-center">
            <v-icon class="mr-2">mdi-calendar-month</v-icon> Ciclo de Anticipos Mensual
          </h5>
          <v-row>
            <v-col md="6" class="mb-2"
              ><strong>Día de inicio de ciclo:</strong> {{ companyData.dia_inicio }} de cada
              mes</v-col
            >
            <v-col md="6" class="mb-2"
              ><strong>Día de cierre de ciclo:</strong> {{ companyData.dia_cierre }} de cada
              mes</v-col
            >
            <v-col md="6" class="mb-2"
              ><strong>Porcentaje del monto máximo:</strong> {{ companyData.porcentaje }}%</v-col
            >
            <v-col md="6" class="mb-2">
              <strong>Bloqueo de petición:</strong> {{ companyData.dia_bloqueo }} días
              <v-tooltip top>
                <template v-slot:activator="{ props }">
                  <v-icon v-bind="props" class="ml-1">mdi-help-circle</v-icon>
                </template>
                <span
                  >Las solicitudes de peticiones iniciarán y se bloquearán este número de días
                  dentro de su ciclo de Anticipos mensual</span
                >
              </v-tooltip>
            </v-col>
            <v-col md="6" class="mb-2">
              <strong>Frecuencia máxima de Anticipos por ciclo:</strong>
              {{ companyData.frecuencia }} solicitudes mensuales
              <v-tooltip top>
                <template v-slot:activator="{ props }">
                  <v-icon v-bind="props" class="ml-1">mdi-help-circle</v-icon>
                </template>
                <span>Cuántas solicitudes pueden realizarse al mes</span>
              </v-tooltip>
            </v-col>
            <v-col md="6" class="mb-2">
              <strong>Reinicio de solicitud:</strong> después de {{ companyData.dia_reinicio }} días
              <v-tooltip top>
                <template v-slot:activator="{ props }">
                  <v-icon v-bind="props" class="ml-1">mdi-help-circle</v-icon>
                </template>
                <span
                  >Al realizarse un depósito, cuántos días después se rehabilita poder solicitar
                  Anticipos</span
                >
              </v-tooltip>
            </v-col>
          </v-row>
        </v-card-text>
      </v-card>

      <!-- Superadmin Edit View -->
      <v-card v-if="authStore.isSuperadmin" class="shadow-md">
        <v-card-title class="bg-success text-white">
          <h4 class="flex items-center">
            <v-icon class="mr-2">mdi-pencil-box</v-icon> Editar Configuración Empresarial
          </h4>
        </v-card-title>
        <v-card-text>
          <v-form @submit.prevent="handleSaveConfiguration">
            <v-row>
              <!-- Company Name (Read-only for this form) -->
              <v-col cols="12" class="mb-4">
                <h5 class="flex items-center">
                  <v-icon class="mr-2">mdi-office-building</v-icon> Empresa:
                  {{ companyData.company_name || 'Cargando...' }}
                </h5>
                <small class="text-gray-600">ID: {{ companyData.id }}</small>
              </v-col>

              <!-- Plan Configuration -->
              <v-col cols="12">
                <h5 class="flex items-center">
                  <v-icon class="mr-2">mdi-percent</v-icon> Configuración General de Costo del
                  Servicio
                </h5>
              </v-col>

              <v-col md="6" class="mb-6">
                <v-card variant="outlined" class="p-4">
                  <h6 class="mb-3">Plan 1: Porcentaje sobre la transacción</h6>
                  <div class="flex items-center space-x-2 mb-2">
                    <v-btn
                      variant="outlined"
                      color="error"
                      size="small"
                      icon="mdi-minus"
                      @click="decrementField('flexirol', 0, 100)"
                      :disabled="formState.flexirol <= 0"
                    ></v-btn>
                    <v-text-field
                      v-model.number="formState.flexirol"
                      type="number"
                      class="text-center flex-1"
                      hide-details
                      density="compact"
                      @blur="validateField('flexirol', 0, 100)"
                    ></v-text-field>
                    <v-btn
                      variant="outlined"
                      color="primary"
                      size="small"
                      icon="mdi-plus"
                      @click="incrementField('flexirol', 0, 100)"
                      :disabled="formState.flexirol >= 100"
                    ></v-btn>
                    <span class="text-sm bg-gray-100 px-2 py-1 rounded">% del Anticipo</span>
                  </div>
                  <small v-if="validationErrors.flexirol" class="text-red-600">{{
                    validationErrors.flexirol
                  }}</small>
                </v-card>
              </v-col>

              <v-col md="6" class="mb-6">
                <v-card variant="outlined" class="p-4">
                  <h6 class="mb-3">Plan 2: Valor fijo/pago mensual recurrente</h6>
                  <div class="flex items-center space-x-2 mb-2">
                    <v-btn
                      variant="outlined"
                      color="error"
                      size="small"
                      icon="mdi-minus"
                      @click="decrementField('flexirol2', 0, 9999)"
                      :disabled="formState.flexirol2 <= 0"
                    ></v-btn>
                    <v-text-field
                      v-model.number="formState.flexirol2"
                      type="number"
                      class="text-center flex-1"
                      hide-details
                      density="compact"
                      @blur="validateField('flexirol2', 0, 9999)"
                    ></v-text-field>
                    <v-btn
                      variant="outlined"
                      color="primary"
                      size="small"
                      icon="mdi-plus"
                      @click="incrementField('flexirol2', 0, 9999)"
                      :disabled="formState.flexirol2 >= 9999"
                    ></v-btn>
                    <span class="text-sm bg-gray-100 px-2 py-1 rounded">/ mensual</span>
                  </div>
                  <small v-if="validationErrors.flexirol2" class="text-red-600">{{
                    validationErrors.flexirol2
                  }}</small>
                </v-card>
              </v-col>

              <v-col cols="12" class="mb-6">
                <v-card variant="outlined" class="p-4">
                  <h6 class="mb-3">Plan predeterminado para nuevos Usuarios</h6>
                  <v-radio-group v-model="formState.flexirol3" inline>
                    <v-radio label="Plan 1" value="1"></v-radio>
                    <v-radio label="Plan 2" value="2"></v-radio>
                  </v-radio-group>
                </v-card>
              </v-col>

              <v-col cols="12">
                <v-divider class="my-6"></v-divider>
              </v-col>

              <!-- Monthly Cycle Configuration -->
              <v-col cols="12">
                <h5 class="flex items-center">
                  <v-icon class="mr-2">mdi-calendar-month</v-icon> Configuración del Ciclo de
                  Anticipos Mensual
                </h5>
              </v-col>

              <!-- dia_inicio -->
              <v-col md="6" class="mb-4">
                <v-label class="text-sm font-medium mb-2">Día de inicio de ciclo:</v-label>
                <div class="flex items-center space-x-2">
                  <v-btn
                    variant="outlined"
                    color="error"
                    size="small"
                    icon="mdi-minus"
                    @click="decrementField('dia_inicio', 1, 31)"
                    :disabled="formState.dia_inicio <= 1"
                  ></v-btn>
                  <v-text-field
                    v-model.number="formState.dia_inicio"
                    type="number"
                    class="text-center flex-1"
                    hide-details
                    density="compact"
                    @blur="validateField('dia_inicio', 1, 31)"
                  ></v-text-field>
                  <v-btn
                    variant="outlined"
                    color="primary"
                    size="small"
                    icon="mdi-plus"
                    @click="incrementField('dia_inicio', 1, 31)"
                    :disabled="formState.dia_inicio >= 31"
                  ></v-btn>
                  <span class="text-sm bg-gray-100 px-2 py-1 rounded">de cada mes</span>
                </div>
                <small v-if="validationErrors.dia_inicio" class="text-red-600">{{
                  validationErrors.dia_inicio
                }}</small>
              </v-col>

              <!-- dia_cierre -->
              <v-col md="6" class="mb-4">
                <v-label class="text-sm font-medium mb-2">Día de cierre de ciclo:</v-label>
                <div class="flex items-center space-x-2">
                  <v-btn
                    variant="outlined"
                    color="error"
                    size="small"
                    icon="mdi-minus"
                    @click="decrementField('dia_cierre', 1, 31)"
                    :disabled="formState.dia_cierre <= 1"
                  ></v-btn>
                  <v-text-field
                    v-model.number="formState.dia_cierre"
                    type="number"
                    class="text-center flex-1"
                    hide-details
                    density="compact"
                    @blur="validateField('dia_cierre', 1, 31)"
                  ></v-text-field>
                  <v-btn
                    variant="outlined"
                    color="primary"
                    size="small"
                    icon="mdi-plus"
                    @click="incrementField('dia_cierre', 1, 31)"
                    :disabled="formState.dia_cierre >= 31"
                  ></v-btn>
                  <span class="text-sm bg-gray-100 px-2 py-1 rounded">de cada mes</span>
                </div>
                <small v-if="validationErrors.dia_cierre" class="text-red-600">{{
                  validationErrors.dia_cierre
                }}</small>
              </v-col>

              <!-- porcentaje -->
              <v-col md="6" class="mb-4">
                <v-label class="text-sm font-medium mb-2">Porcentaje del monto máximo:</v-label>
                <div class="flex items-center space-x-2">
                  <v-btn
                    variant="outlined"
                    color="error"
                    size="small"
                    icon="mdi-minus"
                    @click="decrementField('porcentaje', 0, 100)"
                    :disabled="formState.porcentaje <= 0"
                  ></v-btn>
                  <v-text-field
                    v-model.number="formState.porcentaje"
                    type="number"
                    class="text-center flex-1"
                    hide-details
                    density="compact"
                    @blur="validateField('porcentaje', 0, 100)"
                  ></v-text-field>
                  <v-btn
                    variant="outlined"
                    color="primary"
                    size="small"
                    icon="mdi-plus"
                    @click="incrementField('porcentaje', 0, 100)"
                    :disabled="formState.porcentaje >= 100"
                  ></v-btn>
                  <span class="text-sm bg-gray-100 px-2 py-1 rounded">%</span>
                </div>
                <small v-if="validationErrors.porcentaje" class="text-red-600">{{
                  validationErrors.porcentaje
                }}</small>
              </v-col>

              <!-- dia_bloqueo -->
              <v-col md="6" class="mb-4">
                <v-label class="text-sm font-medium mb-2 flex items-center">
                  Bloqueo de petición (días):
                  <v-tooltip top>
                    <template v-slot:activator="{ props }">
                      <v-icon v-bind="props" class="ml-1" size="small">mdi-help-circle</v-icon>
                    </template>
                    <span
                      >Las solicitudes de peticiones iniciarán y se bloquearán este número de días
                      dentro de su ciclo de Anticipos mensual</span
                    >
                  </v-tooltip>
                </v-label>
                <div class="flex items-center space-x-2">
                  <v-btn
                    variant="outlined"
                    color="error"
                    size="small"
                    icon="mdi-minus"
                    @click="decrementField('dia_bloqueo', 0, 31)"
                    :disabled="formState.dia_bloqueo <= 0"
                  ></v-btn>
                  <v-text-field
                    v-model.number="formState.dia_bloqueo"
                    type="number"
                    class="text-center flex-1"
                    hide-details
                    density="compact"
                    @blur="validateField('dia_bloqueo', 0, 31)"
                  ></v-text-field>
                  <v-btn
                    variant="outlined"
                    color="primary"
                    size="small"
                    icon="mdi-plus"
                    @click="incrementField('dia_bloqueo', 0, 31)"
                    :disabled="formState.dia_bloqueo >= 31"
                  ></v-btn>
                </div>
                <small v-if="validationErrors.dia_bloqueo" class="text-red-600">{{
                  validationErrors.dia_bloqueo
                }}</small>
              </v-col>

              <!-- frecuencia -->
              <v-col md="6" class="mb-4">
                <v-label class="text-sm font-medium mb-2 flex items-center">
                  Frecuencia máxima de Anticipos por ciclo:
                  <v-tooltip top>
                    <template v-slot:activator="{ props }">
                      <v-icon v-bind="props" class="ml-1" size="small">mdi-help-circle</v-icon>
                    </template>
                    <span>Cuántas solicitudes pueden realizarse al mes</span>
                  </v-tooltip>
                </v-label>
                <div class="flex items-center space-x-2">
                  <v-btn
                    variant="outlined"
                    color="error"
                    size="small"
                    icon="mdi-minus"
                    @click="decrementField('frecuencia', 1, 10)"
                    :disabled="formState.frecuencia <= 1"
                  ></v-btn>
                  <v-text-field
                    v-model.number="formState.frecuencia"
                    type="number"
                    class="text-center flex-1"
                    hide-details
                    density="compact"
                    @blur="validateField('frecuencia', 1, 10)"
                  ></v-text-field>
                  <v-btn
                    variant="outlined"
                    color="primary"
                    size="small"
                    icon="mdi-plus"
                    @click="incrementField('frecuencia', 1, 10)"
                    :disabled="formState.frecuencia >= 10"
                  ></v-btn>
                  <span class="text-sm bg-gray-100 px-2 py-1 rounded">solicitudes</span>
                </div>
                <small v-if="validationErrors.frecuencia" class="text-red-600">{{
                  validationErrors.frecuencia
                }}</small>
              </v-col>

              <!-- dia_reinicio -->
              <v-col md="6" class="mb-4">
                <v-label class="text-sm font-medium mb-2 flex items-center">
                  Reinicio de solicitud (después de días):
                  <v-tooltip top>
                    <template v-slot:activator="{ props }">
                      <v-icon v-bind="props" class="ml-1" size="small">mdi-help-circle</v-icon>
                    </template>
                    <span
                      >Al realizarse un depósito, cuántos días después se rehabilita poder solicitar
                      Anticipos</span
                    >
                  </v-tooltip>
                </v-label>
                <div class="flex items-center space-x-2">
                  <v-btn
                    variant="outlined"
                    color="error"
                    size="small"
                    icon="mdi-minus"
                    @click="decrementField('dia_reinicio', 1, 31)"
                    :disabled="formState.dia_reinicio <= 1"
                  ></v-btn>
                  <v-text-field
                    v-model.number="formState.dia_reinicio"
                    type="number"
                    class="text-center flex-1"
                    hide-details
                    density="compact"
                    @blur="validateField('dia_reinicio', 1, 31)"
                  ></v-text-field>
                  <v-btn
                    variant="outlined"
                    color="primary"
                    size="small"
                    icon="mdi-plus"
                    @click="incrementField('dia_reinicio', 1, 31)"
                    :disabled="formState.dia_reinicio >= 31"
                  ></v-btn>
                </div>
                <small v-if="validationErrors.dia_reinicio" class="text-red-600">{{
                  validationErrors.dia_reinicio
                }}</small>
              </v-col>
            </v-row>

            <v-divider class="my-6"></v-divider>
            <div class="w-full">
              <v-btn
                type="submit"
                color="success"
                size="large"
                block
                :disabled="companiesStore.loading || Object.keys(validationErrors).length > 0"
              >
                <v-progress-circular
                  v-if="companiesStore.loading"
                  indeterminate
                  size="20"
                  class="mr-2"
                ></v-progress-circular>
                <v-icon v-else class="mr-2">mdi-content-save</v-icon>
                Guardar Todos los Cambios
              </v-btn>
            </div>
            <small v-if="Object.keys(validationErrors).length > 0" class="text-red-600 block mt-2"
              >Corrija los errores antes de guardar.</small
            >
          </v-form>
        </v-card-text>
      </v-card>
    </div>

    <v-alert v-if="!authStore.loading && !authStore.isAuthenticated" type="warning">
      Debe iniciar sesión para ver esta página.
    </v-alert>
  </v-container>
</template>

<script setup>
import { ref, onMounted, watch, reactive, computed } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useCompaniesStore } from '@/stores/companies'
//import { Modal, Tooltip } from 'bootstrap' // Import Modal for potential future use, Tooltip for initialization

const authStore = useAuthStore()
const companiesStore = useCompaniesStore()

const companyData = computed(() => companiesStore.companyConfig) // Use computed for read-only display
const formState = reactive({}) // For superadmin form binding
const validationErrors = reactive({})

const viewError = ref(null) // For errors specific to this view's logic (e.g., no company ID)
const alertMessage = ref('')
const alertVariant = ref('success') // 'success' or 'danger'

onMounted(async () => {
  // Initialize Bootstrap Tooltips
  const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'))
  tooltipTriggerList.map(function (tooltipTriggerEl) {
    return new Tooltip(tooltipTriggerEl)
  })

  if (authStore.user && authStore.isAuthenticated) {
    await companiesStore.fetchCompanyToConfigure()
    if (companiesStore.error) {
      // If the store itself has an error (e.g., "No company ID associated"), display it.
      viewError.value = companiesStore.error
    } else if (!companiesStore.companyConfig || !companiesStore.companyConfig.id) {
      // This case might occur if fetchCompanyToConfigure completes without error but also without setting a company
      // e.g. Superadmin and no companies exist. The store should ideally set an error for this.
      viewError.value =
        'No se pudo cargar la configuración de la compañía. Verifique que exista una compañía o que esté asignado a una.'
    }
  } else if (!authStore.isAuthenticated) {
    viewError.value = 'Usuario no autenticado. Por favor, inicie sesión.'
  } else {
    // Should not happen if authStore.user is null and not authenticated
    viewError.value = 'Error de autenticación desconocido.'
  }
})

// Watch for changes in companyConfig from store and update local formState for editing
watch(
  () => companiesStore.companyConfig,
  (newConfig) => {
    if (newConfig && newConfig.id) {
      // Ensure newConfig is not null and has an id
      // Deep copy to avoid direct mutation of store state if formState is modified
      // and then cancelled.
      Object.assign(formState, JSON.parse(JSON.stringify(newConfig)))
      // Clear previous validation errors when data reloads
      for (const key in validationErrors) {
        delete validationErrors[key]
      }
    }
  },
  { immediate: true, deep: true },
)

const fieldDefinitions = {
  flexirol: { min: 0, max: 100, label: 'Plan 1: Porcentaje' },
  flexirol2: { min: 0, max: 9999, label: 'Plan 2: Valor fijo' },
  dia_inicio: { min: 1, max: 31, label: 'Día de inicio' },
  dia_cierre: { min: 1, max: 31, label: 'Día de cierre' },
  porcentaje: { min: 0, max: 100, label: 'Porcentaje monto máximo' },
  dia_bloqueo: { min: 0, max: 31, label: 'Día bloqueo' },
  frecuencia: { min: 1, max: 10, label: 'Frecuencia' },
  dia_reinicio: { min: 1, max: 31, label: 'Día reinicio' },
}

const validateField = (field, min, max) => {
  const value = formState[field]
  if (value === null || value === undefined || value === '') {
    validationErrors[field] = `${fieldDefinitions[field]?.label || field} es requerido.`
    return
  }
  const numValue = Number(value)
  if (isNaN(numValue) || numValue < min || numValue > max) {
    validationErrors[field] =
      `${fieldDefinitions[field]?.label || field} debe estar entre ${min} y ${max}.`
  } else {
    delete validationErrors[field]
  }
}

const incrementField = (field, min, max) => {
  let value = Number(formState[field])
  if (isNaN(value)) value = min // default to min if not a number
  if (value < max) {
    formState[field] = value + 1
  }
  validateField(field, min, max)
}

const decrementField = (field, min, max) => {
  let value = Number(formState[field])
  if (isNaN(value)) value = min // default to min if not a number
  if (value > min) {
    formState[field] = value - 1
  }
  validateField(field, min, max)
}

const showGlobalAlert = (message, type = 'success', duration = 3000) => {
  alertMessage.value = message
  alertVariant.value = type
  setTimeout(() => {
    alertMessage.value = ''
  }, duration)
}

const handleSaveConfiguration = async () => {
  // Perform validation for all fields before attempting to save
  Object.keys(fieldDefinitions).forEach((field) => {
    const def = fieldDefinitions[field]
    validateField(field, def.min, def.max)
  })

  if (Object.keys(validationErrors).length > 0) {
    showGlobalAlert('Por favor, corrija los errores en el formulario.', 'danger')
    return
  }

  if (confirm('¿Está seguro de que desea guardar estos cambios?')) {
    // Prepare the data object from formState to be sent to the store
    // Ensure all relevant fields are included and correctly typed.
    const dataToSaveFromForm = {
      id: formState.id, // Crucial for the update operation
      flexirol: Number(formState.flexirol),
      flexirol2: Number(formState.flexirol2),
      flexirol3: String(formState.flexirol3),
      dia_inicio: Number(formState.dia_inicio),
      dia_cierre: Number(formState.dia_cierre),
      porcentaje: Number(formState.porcentaje),
      dia_bloqueo: Number(formState.dia_bloqueo),
      frecuencia: Number(formState.frecuencia),
      dia_reinicio: Number(formState.dia_reinicio),
      // Include other fields from formState if they are part of the 'companies' collection
      // and are meant to be editable through this form.
      // For example, if company_name were editable here:
      // company_name: formState.company_name,
    }

    const success = await companiesStore.saveCompanyConfig(dataToSaveFromForm)
    if (success) {
      showGlobalAlert('Configuración guardada con éxito.', 'success')
      // No explicit re-fetch needed here if saveCompanyConfig updates the store's state
      // from the server response, which it now does via _setCompanyConfig.
      // The watch on companiesStore.companyConfig will update formState.
    } else {
      showGlobalAlert(`Error al guardar: ${companiesStore.error || 'Error desconocido'}`, 'danger')
    }
  }
}

// Ensure formState is populated initially if companyData is already available
// (e.g. if store was populated by a previous view or kept state)
if (companiesStore.companyConfig && companiesStore.companyConfig.id) {
  Object.assign(formState, JSON.parse(JSON.stringify(companiesStore.companyConfig)))
}
</script>

<style scoped>
.loading-spinner {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 200px;
}

.config-view {
  max-width: 900px; /* Adjust as needed */
  margin: auto;
}

.card-flexirol .input-group {
  display: flex; /* Ensure items are in a row */
}
.card-flexirol .form-control {
  text-align: center;
  min-width: 60px; /* Adjust as needed */
  flex-grow: 0; /* Prevent input from growing too much */
}
.card-flexirol .btn {
  min-width: 40px;
}

/* Using existing CSS classes from the problem description if they make sense here */
.btn-flexirol-primary {
  /* Example: Define if not globally available, or rely on Bootstrap's btn-primary/btn-outline-primary */
  /* border-color: #007bff; */
  /* color: #007bff; */
}
.btn-flexirol-primary:hover {
  /* background-color: #007bff; */
  /* color: white; */
}
.form-label i.bi-question-circle-fill,
span > i.bi-question-circle-fill {
  cursor: help;
  color: #6c757d; /* Bootstrap's secondary color */
}

.position-fixed.top-0.start-50.translate-middle-x {
  z-index: 2050 !important; /* Ensure it's above other elements like navbars */
}
</style>
