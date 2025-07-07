<template>
  <div class="container mt-4">
    <h2 class="mb-4">Carga Masiva de Usuarios</h2>

    <!-- Selección de Empresa -->
    <div class="card mb-4">
      <div class="card-header">
        <h5>1. Seleccionar Empresa</h5>
      </div>
      <div class="card-body">
        <div class="mb-3">
          <label for="companySelect" class="form-label">Empresa Destino</label>
          <select
            id="companySelect"
            class="form-select"
            v-model="selectedCompany"
            :disabled="companyStore.loading || isProcessing || isUploading"
          >
            <option value="" disabled>Seleccione una empresa</option>
            <option v-if="companyStore.loading" disabled>Cargando empresas...</option>
            <template v-else>
              <option
                v-for="company in companies"
                :key="company.id"
                :value="company"
                :disabled="!company.is_active"
              >
                {{ company.name }}
                {{ !company.is_active ? ' (Inactiva)' : '' }}
              </option>
            </template>
          </select>
        </div>
      </div>
    </div>

    <!-- Área de Carga -->
    <div class="card mb-4">
      <div class="card-header">
        <h5>2. Cargar Archivo Excel</h5>
      </div>
      <div class="card-body">
        <div
          class="drop-zone"
          @dragover.prevent="dragOver = true"
          @dragleave="dragOver = false"
          @drop="onDrop"
          :class="{ 'drag-over': dragOver }"
        >
          <div v-if="!file" class="text-center p-5">
            <i class="bi bi-cloud-arrow-up fs-1"></i>
            <p class="mt-3">Arrastra tu archivo Excel aquí o haz clic para seleccionar</p>
            <input
              type="file"
              ref="fileInput"
              class="d-none"
              accept=".xlsx,.xls"
              @change="onFileSelected"
            />
            <button
              class="btn btn-primary"
              @click="$refs.fileInput.click()"
              :disabled="!selectedCompany || isProcessing || isUploading"
            >
              Seleccionar Archivo
            </button>
          </div>
          <div v-else class="p-3">
            <div class="d-flex justify-content-between align-items-center">
              <div>
                <i class="bi bi-file-earmark-excel text-success me-2"></i>
                <span>{{ file.name }}</span>
                <small class="text-muted ms-2">({{ formatFileSize(file.size) }})</small>
              </div>
              <button
                class="btn btn-sm btn-outline-danger"
                @click="removeFile"
                :disabled="isProcessing || isUploading"
              >
                <i class="bi bi-x-lg"></i>
              </button>
            </div>
          </div>
        </div>

        <div v-if="file && previewData.length" class="mt-4">
          <h6>Vista Previa ({{ previewData.length }} registros)</h6>
          <div class="table-responsive">
            <table class="table table-sm table-bordered table-hover">
              <thead>
                <tr>
                  <th v-for="(header, index) in headers" :key="index">
                    {{ header }}
                  </th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="row in firstFivePreviewRows"
                  :key="row._rowIndex"
                  :class="{ 'table-warning': row._status && row._status.type === 'error' }"
                >
                  <td v-for="(value, key) in filteredRowData(row)" :key="key">
                    {{ value }}
                  </td>
                  <td>
                    <span v-if="row._status && row._status.type === 'error'" class="text-danger">
                      <i class="bi bi-exclamation-triangle-fill me-1"></i>
                      {{ row._status.message }}
                    </span>
                    <span v-else class="text-success">
                      <i class="bi bi-check-circle-fill"></i>
                    </span>
                  </td>
                </tr>
                <tr v-if="previewData.length > 5">
                  <td :colspan="headers.length + 1" class="text-center text-muted">
                    ... y {{ previewData.length - 5 }} registros más
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div class="d-flex justify-content-between align-items-center mt-3">
            <div>
              <span class="badge bg-success me-2">Válidos: {{ validRows.length }}</span>
              <span class="badge bg-danger">Con errores: {{ errorRows.length }}</span>
            </div>
            <div>
              <button
                class="btn btn-outline-secondary me-2"
                @click="resetForm"
                :disabled="isProcessing || isUploading"
              >
                Cancelar
              </button>
              <button
                class="btn btn-primary"
                @click="processFile"
                :disabled="isProcessing || isUploading || errorRows.length > 0"
                v-if="!isProcessing && !isUploading"
              >
                <i class="bi bi-upload me-2"></i>Procesar Carga
              </button>
              <button class="btn btn-primary" type="button" disabled v-else>
                <span
                  class="spinner-border spinner-border-sm me-2"
                  role="status"
                  aria-hidden="true"
                ></span>
                {{ isUploading ? 'Subiendo...' : 'Procesando...' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Resultados -->
    <div v-if="uploadResult" class="card">
      <div
        class="card-header"
        :class="{ 'bg-success': uploadResult.success, 'bg-danger': !uploadResult.success }"
      >
        <h5 class="text-white mb-0">
          {{ uploadResult.success ? '¡Carga Exitosa!' : 'Error en la Carga' }}
        </h5>
      </div>
      <div class="card-body">
        <div v-if="uploadResult.success">
          <div class="alert alert-success">
            <i class="bi bi-check-circle-fill me-2"></i>
            {{ uploadResult.message }}
          </div>
          <div class="row">
            <div class="col-md-4">
              <div class="card bg-light">
                <div class="card-body text-center">
                  <h3 class="text-success">{{ uploadResult.stats.processed }}</h3>
                  <p class="mb-0">Registros Procesados</p>
                </div>
              </div>
            </div>
            <div class="col-md-4">
              <div class="card bg-light">
                <div class="card-body text-center">
                  <h3 class="text-success">{{ uploadResult.stats.created }}</h3>
                  <p class="mb-0">Usuarios Creados</p>
                </div>
              </div>
            </div>
            <div class="col-md-4">
              <div class="card bg-light">
                <div class="card-body text-center">
                  <h3 class="text-success">{{ uploadResult.stats.updated }}</h3>
                  <p class="mb-0">Usuarios Actualizados</p>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div v-else>
          <div class="alert alert-danger">
            <i class="bi bi-exclamation-triangle-fill me-2"></i>
            {{ uploadResult.message }}
          </div>
          <div v-if="uploadResult.errors && uploadResult.errors.length" class="mt-3">
            <h6>Errores encontrados ({{ uploadResult.errors.length }}):</h6>
            <ul class="text-danger mb-0">
              <li v-for="(error, index) in uploadResult.errors" :key="index">
                <strong v-if="error.cedula">Cédula {{ error.cedula }}:</strong>
                {{ error.error || error }}
              </li>
            </ul>
          </div>
        </div>
        <div class="text-center mt-4">
          <button class="btn btn-primary" @click="resetForm">
            <i class="bi bi-arrow-repeat me-2"></i>Realizar otra carga
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue'
import * as XLSX from 'xlsx'
import { useCompaniesStore } from '@/stores/companies'
import { useUsersStore } from '@/stores/users'
import { useSystemStore } from '@/stores/system'

export default {
  name: 'ExcelUploadView',

  setup() {
    const companyStore = useCompaniesStore()
    const userStore = useUsersStore()
    const systemStore = useSystemStore()

    // Estados reactivos
    const selectedCompany = ref(null)
    const file = ref(null)
    const dragOver = ref(false)
    const isProcessing = ref(false)
    const isUploading = ref(false)
    const previewData = ref([])
    const uploadResult = ref(null)

    // Columnas esperadas en el Excel
    const requiredColumns = ['nombre', 'apellido', 'cedula', 'email', 'disponible']

    // Obtener empresas al montar el componente
    onMounted(async () => {
      try {
        await companyStore.fetchCompanies()
      } catch (error) {
        console.error('Error al cargar las empresas:', error)
        systemStore.showToast('Error al cargar la lista de empresas', 'danger')
      }
    })

    // Computed properties
    const firstFivePreviewRows = computed(() => {
      return previewData.value.slice(0, 5).map((row, index) => ({
        ...row,
        _rowIndex: index,
      }))
    })

    // Filter out internal fields starting with _
    const filteredRowData = (row) => {
      return Object.entries(row).reduce((acc, [key, value]) => {
        if (!key.startsWith('_')) {
          acc[key] = value
        }
        return acc
      }, {})
    }

    const headers = computed(() => {
      if (previewData.value.length === 0) return []
      return Object.keys(previewData.value[0]).filter((key) => !key.startsWith('_'))
    })

    const validRows = computed(() => {
      return previewData.value.filter((row) => !row._status || row._status.type !== 'error')
    })

    const errorRows = computed(() => {
      return previewData.value.filter((row) => row._status && row._status.type === 'error')
    })

    // Métodos
    function onDrop(e) {
      dragOver.value = false
      const files = e.dataTransfer.files
      if (files.length) {
        handleFile(files[0])
      }
    }

    function onFileSelected(e) {
      const files = e.target.files
      if (files.length) {
        handleFile(files[0])
      }
    }

    function removeFile() {
      file.value = null
      previewData.value = []
      uploadResult.value = null
    }

    function resetForm() {
      selectedCompany.value = null
      removeFile()
      isProcessing.value = false
      isUploading.value = false
    }

    function formatFileSize(bytes) {
      if (bytes === 0) return '0 Bytes'
      const k = 1024
      const sizes = ['Bytes', 'KB', 'MB', 'GB']
      const i = Math.floor(Math.log(bytes) / Math.log(k))
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
    }

    async function handleFile(fileObj) {
      if (!fileObj) return

      // Validar tipo de archivo
      const validTypes = [
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-excel',
      ]
      if (!validTypes.includes(fileObj.type) && !fileObj.name.match(/\.(xlsx|xls)$/)) {
        alert('Por favor, sube un archivo Excel válido (.xlsx o .xls)')
        return
      }

      file.value = fileObj
      isProcessing.value = true

      try {
        // Leer el archivo Excel
        const data = await readExcelFile(fileObj)

        // Validar estructura del archivo
        if (!validateExcelStructure(data)) {
          throw new Error(
            'El archivo no tiene el formato correcto. Asegúrate de que contenga las columnas requeridas.',
          )
        }

        // Procesar datos
        previewData.value = processExcelData(data)
      } catch (error) {
        console.error('Error al procesar el archivo:', error)
        alert(`Error al procesar el archivo: ${error.message}`)
        removeFile()
      } finally {
        isProcessing.value = false
      }
    }

    function readExcelFile(file) {
      return new Promise((resolve, reject) => {
        const reader = new FileReader()

        reader.onload = (e) => {
          try {
            const data = new Uint8Array(e.target.result)
            const workbook = XLSX.read(data, { type: 'array' })
            const firstSheetName = workbook.SheetNames[0]
            const worksheet = workbook.Sheets[firstSheetName]
            const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 })

            // Obtener encabezados (primera fila)
            const headers = jsonData[0].map(
              (header) =>
                String(header)
                  .toLowerCase()
                  .trim()
                  .normalize('NFD')
                  .replace(/[\u0300-\u036f]/g, '') // Eliminar acentos
                  .replace(/\s+/g, '_'), // Reemplazar espacios por guiones bajos
            )

            // Convertir a array de objetos con los encabezados como claves
            const result = []
            for (let i = 1; i < jsonData.length; i++) {
              if (jsonData[i].length === 0) continue // Saltar filas vacías

              const obj = {}
              for (let j = 0; j < headers.length; j++) {
                if (headers[j]) {
                  // Solo agregar si el encabezado no está vacío
                  obj[headers[j]] = jsonData[i][j] !== undefined ? jsonData[i][j] : ''
                }
              }

              // Solo agregar si el objeto no está vacío
              if (Object.keys(obj).length > 0) {
                result.push(obj)
              }
            }

            resolve(result)
          } catch (error) {
            reject(error)
          }
        }

        reader.onerror = (error) => reject(error)
        reader.readAsArrayBuffer(file)
      })
    }

    function validateExcelStructure(data) {
      if (!data || data.length === 0) return false

      // Verificar que todas las columnas requeridas estén presentes
      const firstRow = data[0]
      const missingColumns = requiredColumns.filter(
        (col) => !Object.keys(firstRow).some((key) => key.toLowerCase() === col.toLowerCase()),
      )

      return missingColumns.length === 0
    }

    function processExcelData(data) {
      return data.map((row) => {
        const processedRow = { ...row }
        const errors = []

        // Validar cédula (10 dígitos)
        const cedula = String(row.cedula || '').trim()
        if (!/^\d{10}$/.test(cedula)) {
          errors.push('La cédula debe tener 10 dígitos')
        }

        // Validar email
        const email = String(row.email || '').trim()
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
          errors.push('El formato del correo electrónico no es válido')
        }

        // Validar campos requeridos
        requiredColumns.forEach((col) => {
          if (!row[col] && row[col] !== 0) {
            errors.push(`El campo ${col} es requerido`)
          }
        })

        // Si hay errores, agregar estado de error
        if (errors.length > 0) {
          processedRow._status = {
            type: 'error',
            message: errors[0],
            details: errors,
          }
        } else {
          processedRow._status = {
            type: 'success',
            message: 'Válido',
          }
        }

        return processedRow
      })
    }

    async function processFile() {
      if (!selectedCompany.value || !file.value || previewData.value.length === 0) {
        systemStore.showToast('Por favor, selecciona un archivo válido', 'danger')
        return
      }

      if (errorRows.value.length > 0) {
        systemStore.showToast(
          'Por favor, corrige los errores en el archivo antes de continuar',
          'danger',
        )
        return
      }

      try {
        isUploading.value = true

        // Filtrar solo filas válidas y mapear al formato esperado
        const validData = validRows.value.map(
          ({ /* _status is intentionally destructured but not used */ ...rest }) => ({
            nombre: rest.nombre,
            apellido: rest.apellido,
            cedula: String(rest.cedula).padStart(10, '0'),
            email: rest.email,
            disponible: rest.disponible !== false, // Asegurar valor booleano
            telefono: rest.telefono || '',
            ciudad: rest.ciudad || '',
            direccion: rest.direccion || '',
            nacimiento: rest.nacimiento || null,
            genero: rest.genero || '',
          }),
        )

        // Llamar a la API para procesar los datos
        const result = await userStore.bulkCreateUsers({
          companyId: selectedCompany.value.id,
          users: validData,
        })

        // Mostrar notificación de éxito
        systemStore.showToast(
          `Se procesaron ${result.processed} usuarios (${result.created} nuevos, ${result.updated} actualizados)`,
          'success',
        )

        // Actualizar el estado con los resultados
        uploadResult.value = {
          success: true,
          message: `Se procesaron ${result.processed} usuarios exitosamente`,
          stats: {
            processed: result.processed || 0,
            created: result.created || 0,
            updated: result.updated || 0,
          },
          errors: result.errors || [],
        }
      } catch (error) {
        console.error('Error en la carga masiva:', error)

        // Mostrar notificación de error
        const errorMessage =
          error.response?.data?.message ||
          error.message ||
          'Ocurrió un error al procesar la carga masiva'
        systemStore.showToast(errorMessage, 'danger')

        // Actualizar el estado con el error
        uploadResult.value = {
          success: false,
          message: errorMessage,
          errors: Array.isArray(error.response?.data?.errors)
            ? error.response.data.errors
            : [{ error: errorMessage }],
        }
      } finally {
        isUploading.value = false
      }
    }

    return {
      // Refs
      selectedCompany,
      file,
      dragOver,
      isProcessing,
      isUploading,
      previewData,
      uploadResult,

      // Stores
      companyStore,
      userStore,
      systemStore,

      // Computed
      companies: computed(() => companyStore.companies || []),
      headers,
      validRows,
      errorRows,
      firstFivePreviewRows,

      // Methods
      onFileSelected,
      onDrop,
      removeFile,
      processFile,
      resetForm,
      formatFileSize,
      filteredRowData,
    }
  },
}
</script>

<style scoped>
.drop-zone {
  border: 2px dashed #ccc;
  border-radius: 8px;
  padding: 20px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;
  background-color: #f8f9fa;
}

.drop-zone:hover,
.drop-zone.drag-over {
  border-color: #0d6efd;
  background-color: #e7f1ff;
}

.drop-zone i {
  font-size: 48px;
  color: #6c757d;
  margin-bottom: 10px;
}

table th {
  white-space: nowrap;
  font-size: 0.85rem;
}

table td {
  font-size: 0.85rem;
  vertical-align: middle;
}

.badge {
  font-size: 0.75rem;
  font-weight: 500;
  padding: 0.35em 0.65em;
}
</style>
