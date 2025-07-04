<template>
  <div class="container mt-4 config-view">
    <div v-if="authStore.loading || companiesStore.loading" class="loading-spinner">
      <div class="spinner-border text-warning" role="status">
        <span class="visually-hidden">Loading...</span>
      </div>
    </div>

    <div v-if="!authStore.loading && viewError" class="alert alert-danger">
      {{ viewError }}
    </div>

    <div v-if="!authStore.loading && !viewError && companyData">
      <!-- Global Alert -->
      <div v-if="alertMessage" :class="['alert', alertVariant === 'success' ? 'alert-success' : 'alert-danger', 'position-fixed', 'top-0', 'start-50', 'translate-middle-x', 'mt-3']" style="z-index: 2000; min-width: 300px;" role="alert">
        <h4><strong>{{ alertMessage }}</strong></h4>
      </div>

      <!-- Company Read-only View -->
      <div v-if="authStore.isEmpresa && !authStore.isSuperadmin" class="card shadow-sm">
        <div class="card-header bg-primary text-white">
          <h4>Configuración de la Empresa</h4>
        </div>
        <div class="card-body">
          <p class="lead">Su configuración de Ciclo de Anticipos mensual ha sido configurada por FlexiRol. Si requiere hacer cambios a estos parámetros, comuníquese por favor con soporte@flexirol.com</p>

          <div class="mb-3">
            <h5><i class="bi bi-building"></i> Nombre de la Empresa</h5>
            <p>{{ companyData.company_name || 'No especificado' }}</p>
          </div>
          <hr>
          <div class="mb-3">
            <h5><i class="bi bi-cash-coin"></i> Plan Seleccionado Actual</h5>
            <p v-if="companyData.flexirol3 === '2'">
              PLAN 2: Valor fijo/pago mensual recurrente (${{ companyData.flexirol2 }} / mensual) <small>(más IVA)</small>
            </p>
            <p v-else>
              PLAN 1: Porcentaje sobre la transacción ({{ companyData.flexirol }}% del Anticipo) <small>(más IVA)</small>
            </p>
          </div>
          <hr>
          <h5><i class="bi bi-calendar-event"></i> Ciclo de Anticipos Mensual</h5>
          <div class="row">
            <div class="col-md-6 mb-2"><strong>Día de inicio de ciclo:</strong> {{ companyData.dia_inicio }} de cada mes</div>
            <div class="col-md-6 mb-2"><strong>Día de cierre de ciclo:</strong> {{ companyData.dia_cierre }} de cada mes</div>
            <div class="col-md-6 mb-2"><strong>Porcentaje del monto máximo:</strong> {{ companyData.porcentaje }}%</div>
            <div class="col-md-6 mb-2"><strong>Bloqueo de petición:</strong> {{ companyData.dia_bloqueo }} días
              <span class="ms-1" title="Las solicitudes de peticiones iniciarán y se bloquearán este número de días dentro de su ciclo de Anticipos mensual" data-bs-toggle="tooltip" data-bs-placement="top">
                <i class="bi bi-question-circle-fill"></i>
              </span>
            </div>
            <div class="col-md-6 mb-2"><strong>Frecuencia máxima de Anticipos por ciclo:</strong> {{ companyData.frecuencia }} solicitudes mensuales
              <span class="ms-1" title="Cuántas solicitudes pueden realizarse al mes" data-bs-toggle="tooltip" data-bs-placement="top">
                <i class="bi bi-question-circle-fill"></i>
              </span>
            </div>
            <div class="col-md-6 mb-2"><strong>Reinicio de solicitud:</strong> después de {{ companyData.dia_reinicio }} días
              <span class="ms-1" title="Al realizarse un depósito, cuántos días después se rehabilita poder solicitar Anticipos" data-bs-toggle="tooltip" data-bs-placement="top">
                <i class="bi bi-question-circle-fill"></i>
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Superadmin Edit View -->
      <div v-if="authStore.isSuperadmin" class="card shadow-sm">
        <div class="card-header bg-success text-white">
          <h4><i class="bi bi-pencil-square"></i> Editar Configuración Empresarial</h4>
        </div>
        <div class="card-body">
          <form @submit.prevent="handleSaveConfiguration">
            <div class="row">
              <!-- Company Name (Read-only for this form) -->
              <div class="col-md-12 mb-3">
                <h5><i class="bi bi-building"></i> Empresa: {{ companyData.company_name || 'Cargando...' }}</h5>
                <small class="text-muted">ID: {{ companyData.id }}</small>
              </div>

              <!-- Plan Configuration -->
              <div class="col-md-12">
                <h5><i class="bi bi-percent"></i> Configuración General de Costo del Servicio</h5>
              </div>

              <div class="col-md-6 mb-4 card-flexirol p-3 border rounded">
                <h6>Plan 1: Porcentaje sobre la transacción</h6>
                <div class="input-group mb-2">
                  <button class="btn btn-outline-danger btn-flexirol-primary" type="button" @click="decrementField('flexirol', 0, 100)" :disabled="formState.flexirol <= 0">-</button>
                  <input type="number" class="form-control text-center" v-model.number="formState.flexirol" @blur="validateField('flexirol', 0, 100)">
                  <button class="btn btn-outline-primary btn-flexirol-primary" type="button" @click="incrementField('flexirol', 0, 100)" :disabled="formState.flexirol >= 100">+</button>
                  <span class="input-group-text">% del Anticipo</span>
                </div>
                <small v-if="validationErrors.flexirol" class="text-danger">{{ validationErrors.flexirol }}</small>
              </div>

              <div class="col-md-6 mb-4 card-flexirol p-3 border rounded">
                <h6>Plan 2: Valor fijo/pago mensual recurrente</h6>
                <div class="input-group mb-2">
                  <button class="btn btn-outline-danger btn-flexirol-primary" type="button" @click="decrementField('flexirol2', 0, 9999)" :disabled="formState.flexirol2 <= 0">-</button>
                  <input type="number" class="form-control text-center" v-model.number="formState.flexirol2" @blur="validateField('flexirol2', 0, 9999)">
                  <button class="btn btn-outline-primary btn-flexirol-primary" type="button" @click="incrementField('flexirol2', 0, 9999)" :disabled="formState.flexirol2 >= 9999">+</button>
                  <span class="input-group-text">/ mensual</span>
                </div>
                <small v-if="validationErrors.flexirol2" class="text-danger">{{ validationErrors.flexirol2 }}</small>
              </div>

              <div class="col-md-12 mb-4 p-3 border rounded">
                <h6>Plan predeterminado para nuevos Usuarios</h6>
                <div class="form-check form-check-inline">
                  <input class="form-check-input" type="radio" name="flexirol3Options" id="flexirol3Plan1" value="1" v-model="formState.flexirol3">
                  <label class="form-check-label" for="flexirol3Plan1">Plan 1</label>
                </div>
                <div class="form-check form-check-inline">
                  <input class="form-check-input" type="radio" name="flexirol3Options" id="flexirol3Plan2" value="2" v-model="formState.flexirol3">
                  <label class="form-check-label" for="flexirol3Plan2">Plan 2</label>
                </div>
              </div>

              <hr class="my-4">

              <!-- Monthly Cycle Configuration -->
              <div class="col-md-12">
                <h5><i class="bi bi-calendar-week"></i> Configuración del Ciclo de Anticipos Mensual</h5>
              </div>

              <!-- dia_inicio -->
              <div class="col-md-6 mb-3">
                <label for="dia_inicio" class="form-label">Día de inicio de ciclo:</label>
                <div class="input-group">
                  <button class="btn btn-outline-danger" type="button" @click="decrementField('dia_inicio', 1, 31)" :disabled="formState.dia_inicio <= 1">-</button>
                  <input type="number" class="form-control text-center" id="dia_inicio" v-model.number="formState.dia_inicio" @blur="validateField('dia_inicio', 1, 31)">
                  <button class="btn btn-outline-primary" type="button" @click="incrementField('dia_inicio', 1, 31)" :disabled="formState.dia_inicio >= 31">+</button>
                  <span class="input-group-text">de cada mes</span>
                </div>
                <small v-if="validationErrors.dia_inicio" class="text-danger">{{ validationErrors.dia_inicio }}</small>
              </div>

              <!-- dia_cierre -->
              <div class="col-md-6 mb-3">
                <label for="dia_cierre" class="form-label">Día de cierre de ciclo:</label>
                <div class="input-group">
                  <button class="btn btn-outline-danger" type="button" @click="decrementField('dia_cierre', 1, 31)" :disabled="formState.dia_cierre <= 1">-</button>
                  <input type="number" class="form-control text-center" id="dia_cierre" v-model.number="formState.dia_cierre" @blur="validateField('dia_cierre', 1, 31)">
                  <button class="btn btn-outline-primary" type="button" @click="incrementField('dia_cierre', 1, 31)" :disabled="formState.dia_cierre >= 31">+</button>
                  <span class="input-group-text">de cada mes</span>
                </div>
                <small v-if="validationErrors.dia_cierre" class="text-danger">{{ validationErrors.dia_cierre }}</small>
              </div>

              <!-- porcentaje -->
              <div class="col-md-6 mb-3">
                <label for="porcentaje" class="form-label">Porcentaje del monto máximo:</label>
                <div class="input-group">
                  <button class="btn btn-outline-danger" type="button" @click="decrementField('porcentaje', 0, 100)" :disabled="formState.porcentaje <= 0">-</button>
                  <input type="number" class="form-control text-center" id="porcentaje" v-model.number="formState.porcentaje" @blur="validateField('porcentaje', 0, 100)">
                  <button class="btn btn-outline-primary" type="button" @click="incrementField('porcentaje', 0, 100)" :disabled="formState.porcentaje >= 100">+</button>
                  <span class="input-group-text">%</span>
                </div>
                <small v-if="validationErrors.porcentaje" class="text-danger">{{ validationErrors.porcentaje }}</small>
              </div>

              <!-- dia_bloqueo -->
              <div class="col-md-6 mb-3">
                <label for="dia_bloqueo" class="form-label">
                  Bloqueo de petición (días):
                  <span class="ms-1" title="Las solicitudes de peticiones iniciarán y se bloquearán este número de días dentro de su ciclo de Anticipos mensual" data-bs-toggle="tooltip" data-bs-placement="top">
                    <i class="bi bi-question-circle-fill"></i>
                  </span>
                </label>
                <div class="input-group">
                  <button class="btn btn-outline-danger" type="button" @click="decrementField('dia_bloqueo', 0, 31)" :disabled="formState.dia_bloqueo <= 0">-</button>
                  <input type="number" class="form-control text-center" id="dia_bloqueo" v-model.number="formState.dia_bloqueo" @blur="validateField('dia_bloqueo', 0, 31)">
                  <button class="btn btn-outline-primary" type="button" @click="incrementField('dia_bloqueo', 0, 31)" :disabled="formState.dia_bloqueo >= 31">+</button>
                </div>
                <small v-if="validationErrors.dia_bloqueo" class="text-danger">{{ validationErrors.dia_bloqueo }}</small>
              </div>

              <!-- frecuencia -->
              <div class="col-md-6 mb-3">
                <label for="frecuencia" class="form-label">
                  Frecuencia máxima de Anticipos por ciclo:
                  <span class="ms-1" title="Cuántas solicitudes pueden realizarse al mes" data-bs-toggle="tooltip" data-bs-placement="top">
                    <i class="bi bi-question-circle-fill"></i>
                  </span>
                </label>
                <div class="input-group">
                  <button class="btn btn-outline-danger" type="button" @click="decrementField('frecuencia', 1, 10)" :disabled="formState.frecuencia <= 1">-</button>
                  <input type="number" class="form-control text-center" id="frecuencia" v-model.number="formState.frecuencia" @blur="validateField('frecuencia', 1, 10)">
                  <button class="btn btn-outline-primary" type="button" @click="incrementField('frecuencia', 1, 10)" :disabled="formState.frecuencia >= 10">+</button>
                  <span class="input-group-text">solicitudes</span>
                </div>
                <small v-if="validationErrors.frecuencia" class="text-danger">{{ validationErrors.frecuencia }}</small>
              </div>

              <!-- dia_reinicio -->
              <div class="col-md-6 mb-3">
                <label for="dia_reinicio" class="form-label">
                  Reinicio de solicitud (después de días):
                  <span class="ms-1" title="Al realizarse un depósito, cuántos días después se rehabilita poder solicitar Anticipos" data-bs-toggle="tooltip" data-bs-placement="top">
                    <i class="bi bi-question-circle-fill"></i>
                  </span>
                </label>
                <div class="input-group">
                  <button class="btn btn-outline-danger" type="button" @click="decrementField('dia_reinicio', 1, 31)" :disabled="formState.dia_reinicio <= 1">-</button>
                  <input type="number" class="form-control text-center" id="dia_reinicio" v-model.number="formState.dia_reinicio" @blur="validateField('dia_reinicio', 1, 31)">
                  <button class="btn btn-outline-primary" type="button" @click="incrementField('dia_reinicio', 1, 31)" :disabled="formState.dia_reinicio >= 31">+</button>
                </div>
                <small v-if="validationErrors.dia_reinicio" class="text-danger">{{ validationErrors.dia_reinicio }}</small>
              </div>
            </div>

            <hr class="my-4">
            <div class="d-grid gap-2">
              <button type="submit" class="btn btn-success btn-lg" :disabled="companiesStore.loading || Object.keys(validationErrors).length > 0">
                <span v-if="companiesStore.loading" class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                <i v-else class="bi bi-save-fill"></i>
                Guardar Todos los Cambios
              </button>
            </div>
             <small v-if="Object.keys(validationErrors).length > 0" class="text-danger d-block mt-2">Corrija los errores antes de guardar.</small>
          </form>
        </div>
      </div>
    </div>

    <div v-if="!authStore.loading && !authStore.isAuthenticated" class="alert alert-warning">
      Debe iniciar sesión para ver esta página.
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, reactive, computed } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useCompaniesStore } from '@/stores/companies'
import { Modal, Tooltip } from 'bootstrap' // Import Modal for potential future use, Tooltip for initialization

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
    await companiesStore.fetchCompanyToConfigure();
    if (companiesStore.error) {
      // If the store itself has an error (e.g., "No company ID associated"), display it.
      viewError.value = companiesStore.error;
    } else if (!companiesStore.companyConfig || !companiesStore.companyConfig.id) {
      // This case might occur if fetchCompanyToConfigure completes without error but also without setting a company
      // e.g. Superadmin and no companies exist. The store should ideally set an error for this.
      viewError.value = "No se pudo cargar la configuración de la compañía. Verifique que exista una compañía o que esté asignado a una.";
    }
  } else if (!authStore.isAuthenticated) {
    viewError.value = "Usuario no autenticado. Por favor, inicie sesión.";
  } else {
     // Should not happen if authStore.user is null and not authenticated
    viewError.value = "Error de autenticación desconocido."
  }
})

// Watch for changes in companyConfig from store and update local formState for editing
watch(() => companiesStore.companyConfig, (newConfig) => {
  if (newConfig && newConfig.id) { // Ensure newConfig is not null and has an id
    // Deep copy to avoid direct mutation of store state if formState is modified
    // and then cancelled.
    Object.assign(formState, JSON.parse(JSON.stringify(newConfig)))
    // Clear previous validation errors when data reloads
    for (const key in validationErrors) {
      delete validationErrors[key];
    }
  }
}, { immediate: true, deep: true })


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
    validationErrors[field] = `${fieldDefinitions[field]?.label || field} debe estar entre ${min} y ${max}.`
  } else {
    delete validationErrors[field]
  }
}

const incrementField = (field, min, max) => {
  let value = Number(formState[field])
  if (isNaN(value)) value = min; // default to min if not a number
  if (value < max) {
    formState[field] = value + 1
  }
  validateField(field, min, max)
}

const decrementField = (field, min, max) => {
  let value = Number(formState[field])
   if (isNaN(value)) value = min; // default to min if not a number
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
  Object.keys(fieldDefinitions).forEach(field => {
    const def = fieldDefinitions[field];
    validateField(field, def.min, def.max);
  });

  if (Object.keys(validationErrors).length > 0) {
    showGlobalAlert('Por favor, corrija los errores en el formulario.', 'danger');
    return;
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
    };

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
