<template>
  <v-container>
    <!-- Header -->
    <v-row class="mb-4">
      <v-col cols="12">
        <h2 class="text-h4 text-flexirol-primary">
          <v-icon class="me-2">mdi-cog</v-icon>
          Configuración Global del Sistema
        </h2>
        <p class="text-subtitle-1 text-medium-emphasis">
          Valores por defecto que se aplicarán a todas las empresas nuevas
        </p>
      </v-col>
    </v-row>

    <!-- Loading State -->
    <v-skeleton-loader v-if="globalConfigLoading" type="card" class="mb-4"></v-skeleton-loader>

    <!-- Error State -->
    <v-alert v-else-if="globalConfigError" type="error" variant="tonal" class="mb-4">
      <v-icon class="me-2">mdi-alert-circle</v-icon>
      {{ globalConfigError }}
    </v-alert>

    <!-- Success/Error Messages -->
    <v-alert
      v-if="alertMessage"
      :type="alertVariant"
      variant="tonal"
      dismissible
      class="mb-4"
      @click:close="clearAlert"
    >
      {{ alertMessage }}
    </v-alert>

    <!-- EDIT VIEW (Solo Superadmin) -->
    <v-card v-else-if="authStore.isSuperadmin && globalConfig" class="glass-morphism mb-4">
      <v-card-title class="d-flex align-center">
        <v-icon class="me-2">mdi-pencil-box</v-icon>
        Editar Configuración Global del Sistema
      </v-card-title>

      <v-card-text>
        <v-form @submit.prevent="saveConfiguration">
          <!-- Plan 1: Porcentaje -->
          <v-row class="mb-4">
            <v-col cols="12" md="6" sm="12">
              <h6 class="text-h6 text-primary mb-2">Plan 1: Porcentaje sobre transacción</h6>

              <v-text-field
                v-model.number="formState.porcentaje_servicio"
                label="Porcentaje del servicio FlexiRol"
                type="number"
                suffix="%"
                :rules="[(v) => (v >= 0 && v <= 100) || 'Debe ser entre 0-100%']"
                variant="outlined"
                density="comfortable"
              >
                <template #append>
                  <v-tooltip text="Porcentaje que se cobrará sobre cada anticipo procesado">
                    <template #activator="{ props }">
                      <v-icon v-bind="props" color="grey">mdi-help-circle</v-icon>
                    </template>
                  </v-tooltip>
                </template>
              </v-text-field>
            </v-col>

            <!-- Plan 2: Valor Fijo -->
            <v-col cols="12" md="6" sm="12">
              <h6 class="text-h6 text-primary mb-2">Plan 2: Valor fijo mensual</h6>
              <v-text-field
                v-model.number="formState.valor_fijo_mensual"
                label="Valor mensual fijo"
                type="number"
                prefix="$"
                variant="outlined"
                density="comfortable"
              >
                <template #append>
                  <v-tooltip text="Valor fijo que se cobrará mensualmente">
                    <template #activator="{ props }">
                      <v-icon v-bind="props" color="grey">mdi-help-circle</v-icon>
                    </template>
                  </v-tooltip>
                </template>
              </v-text-field>
            </v-col>
          </v-row>

          <v-divider class="my-4"></v-divider>

          <!-- Configuración de Ciclo Mensual -->
          <v-row class="mb-4">
            <v-col cols="12">
              <h6 class="text-h6 text-secondary">Configuración de Ciclo de Anticipos</h6>
            </v-col>

            <!-- Día inicio ciclo -->
            <v-col cols="12" md="3" sm="6">
              <v-text-field
                v-model.number="formState.dia_inicio"
                label="Día inicio ciclo"
                type="number"
                :rules="[(v) => (v >= 1 && v <= 31) || 'Día inválido']"
                variant="outlined"
                density="comfortable"
              ></v-text-field>
            </v-col>

            <!-- Día cierre ciclo -->
            <v-col cols="12" md="3" sm="6">
              <v-text-field
                v-model.number="formState.dia_cierre"
                label="Día cierre ciclo"
                type="number"
                :rules="[(v) => (v >= 1 && v <= 31) || 'Día inválido']"
                variant="outlined"
                density="comfortable"
              ></v-text-field>
            </v-col>

            <!-- Porcentaje máximo -->
            <v-col cols="12" md="3" sm="6">
              <v-text-field
                v-model.number="formState.porcentaje_maximo"
                label="% máximo del sueldo"
                type="number"
                suffix="%"
                :rules="[(v) => (v >= 0 && v <= 100) || 'Debe ser 0-100%']"
                variant="outlined"
                density="comfortable"
              ></v-text-field>
            </v-col>

            <!-- Frecuencia máxima -->
            <v-col cols="12" md="3" sm="6">
              <v-text-field
                v-model.number="formState.frecuencia_maxima"
                label="Solicitudes por mes"
                type="number"
                :rules="[(v) => v >= 1 || 'Mínimo 1 solicitud']"
                variant="outlined"
                density="comfortable"
              >
                <template #append>
                  <v-tooltip text="Cuantas solicitudes pueden realizarse al mes">
                    <template #activator="{ props }">
                      <v-icon v-bind="props" color="grey">mdi-help-circle</v-icon>
                    </template>
                  </v-tooltip>
                </template></v-text-field
              >
            </v-col>

            <!-- Días bloqueo -->
            <v-col cols="12" md="3" sm="6">
              <v-text-field
                v-model.number="formState.dias_bloqueo"
                label="Días bloqueo antes de cierre"
                type="number"
                :rules="[(v) => (v >= 0 && v <= 31) || 'Debe ser 0-31']"
                variant="outlined"
                density="comfortable"
              >
                <template #append>
                  <v-tooltip
                    text="las solicitudes de peticiones iniciaran y se bloquearan este numero de dias dentro de su ciclo de Anticipos mensual"
                  >
                    <template #activator="{ props }">
                      <v-icon v-bind="props" color="grey">mdi-help-circle</v-icon>
                    </template>
                  </v-tooltip>
                </template></v-text-field
              >
            </v-col>

            <!-- Días reinicio -->
            <v-col cols="12" md="3" sm="6">
              <v-text-field
                v-model.number="formState.dias_reinicio"
                label="Días para reiniciar después de pago"
                type="number"
                :rules="[(v) => (v >= 1 && v <= 31) || 'Debe ser 1-31']"
                variant="outlined"
                density="comfortable"
              >
                <template #append>
                  <v-tooltip
                    text="despues de realizar un deposito, cuandos dias despues se rehabilita poder solicitar Anticipos"
                  >
                    <template #activator="{ props }">
                      <v-icon v-bind="props" color="grey">mdi-help-circle</v-icon>
                    </template>
                  </v-tooltip>
                </template></v-text-field
              >
            </v-col>

            <!-- Actions -->
            <v-col cols="12" md="3" sm="6">
              <v-btn
                type="submit"
                color="primary"
                :loading="globalConfigLoading"
                :disabled="!isFormValid"
              >
                <v-icon class="me-2">mdi-content-save</v-icon>
                Guardar Configuración
              </v-btn>
            </v-col>
            <v-col cols="12" md="3" sm="6">
              <v-btn color="error" @click="resetForm">
                <v-icon class="me-2">mdi-refresh</v-icon>
                Restablecer
              </v-btn>
            </v-col>
          </v-row>
        </v-form>
      </v-card-text>
    </v-card>

    <!-- Warning when no global config -->
    <v-alert v-else type="warning" variant="tonal">
      <v-icon class="me-2">mdi-alert</v-icon>
      No se pudo cargar la configuración global del sistema.
    </v-alert>
  </v-container>
</template>

<script setup>
// ✅ CAMBIAR línea 1:
import { ref, reactive, computed, onMounted, watch, nextTick } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useSystemConfigStore } from '@/stores/systemConfig'
import { useToastSystem } from '@/stores/system'

const authStore = useAuthStore()
const systemConfigStore = useSystemConfigStore()
const { showToast } = useToastSystem()

// ✅ CORRECCIÓN: Computed properties correctos
const globalConfig = computed(() => systemConfigStore.config)
const globalConfigLoading = computed(() => systemConfigStore.loading)
const globalConfigError = computed(() => systemConfigStore.error) // ✅ AGREGADO: Faltaba esta línea

// Referencias a funciones del store
const saveGlobalConfig = systemConfigStore.updateConfig

// ✅ CORRECTO: Estado del formulario con nombres exactos del schema system_config
const formState = reactive({
  porcentaje_servicio: 10,
  valor_fijo_mensual: 50,
  dia_inicio: 2,
  dia_cierre: 28,
  porcentaje_maximo: 70,
  frecuencia_maxima: 3,
  dias_bloqueo: 2,
  dias_reinicio: 3,
})

const alertMessage = ref('')
const alertVariant = ref('success')

// Computed para validación del formulario
const isFormValid = computed(() => {
  return (
    formState.porcentaje_servicio >= 0 &&
    formState.porcentaje_servicio <= 100 &&
    formState.valor_fijo_mensual > 0 &&
    formState.dia_inicio >= 1 &&
    formState.dia_inicio <= 31 &&
    formState.dia_cierre >= 1 &&
    formState.dia_cierre <= 31 &&
    formState.porcentaje_maximo >= 0 &&
    formState.porcentaje_maximo <= 100 &&
    formState.frecuencia_maxima >= 1 &&
    formState.dias_bloqueo >= 0 &&
    formState.dias_bloqueo <= 31 &&
    formState.dias_reinicio >= 1 &&
    formState.dias_reinicio <= 31
  )
})

// Methods
const saveConfiguration = async () => {
  if (!authStore.isSuperadmin) {
    showAlert('Solo superadministradores pueden guardar configuración', 'error')
    return
  }

  try {
    await saveGlobalConfig(formState)
    showToast('Configuración global guardada exitosamente', 'success')
    showAlert('Configuración actualizada correctamente', 'success')
  } catch (error) {
    console.error('Error saving global config:', error)
    showToast('Error al guardar la configuración', 'error')
    showAlert('Error al guardar la configuración', 'error')
  }
}

const resetForm = () => {
  if (globalConfig.value) {
    Object.assign(formState, {
      porcentaje_servicio: globalConfig.value.porcentaje_servicio,
      valor_fijo_mensual: globalConfig.value.valor_fijo_mensual,
      dia_inicio: globalConfig.value.dia_inicio,
      dia_cierre: globalConfig.value.dia_cierre,
      porcentaje_maximo: globalConfig.value.porcentaje_maximo,
      frecuencia_maxima: globalConfig.value.frecuencia_maxima,
      dias_bloqueo: globalConfig.value.dias_bloqueo,
      dias_reinicio: globalConfig.value.dias_reinicio,
    })
  }
}

const showAlert = (message, type) => {
  alertMessage.value = message
  alertVariant.value = type
  setTimeout(() => clearAlert(), 5000)
}

const clearAlert = () => {
  alertMessage.value = ''
  alertVariant.value = 'success'
}

// Watch para actualizar formulario cuando se carga la configuración
watch(
  () => globalConfig.value,
  (newConfig) => {
    if (newConfig) resetForm()
  },
  { immediate: true },
)

// Lifecycle
onMounted(async () => {
  try {
    // Forzar carga desde PocketBase
    await systemConfigStore.fetchConfig(true) // force refresh

    // Esperar a que se cargue y actualizar form
    await nextTick()
    if (systemConfigStore.config) {
      Object.assign(formState, systemConfigStore.config)
    }
  } catch (error) {
    console.error('Error loading global config:', error)
    showAlert('Error al cargar la configuración global', 'error')
  }
})
</script>
