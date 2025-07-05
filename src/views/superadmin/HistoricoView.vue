<template>
  <div class="container mt-4">
    <h3 class="mb-3"><i class="far fa-file-archive me-2"></i>Histórico de Solicitudes</h3>

    <!-- Filtros Nivel 1 -->
    <div class="row g-3 mb-3">
      <div class="col-md-2">
        <label class="form-label">Cédula</label>
        <input
          v-model="filters.cedula"
          type="text"
          class="form-control"
          placeholder="Cédula"
          maxlength="10"
        />
      </div>
      <div class="col-md-2">
        <label class="form-label">Empresa</label>
        <select v-model="filters.empresaId" class="form-select">
          <option value="">Todas</option>
          <option v-for="empresa in empresas" :key="empresa.id" :value="empresa.id">
            {{ empresa.company_name || empresa.nombre }}
          </option>
        </select>
      </div>
      <div class="col-md-2">
        <label class="form-label">Estado</label>
        <select v-model="filters.estado" class="form-select">
          <option value="">Todos</option>
          <option value="pendiente">Pendiente</option>
          <option value="procesando">Procesando</option>
          <option value="pagado">Pagado</option>
          <option value="rechazado">Rechazado</option>
        </select>
      </div>
      <div class="col-md-2">
        <label class="form-label">Banco</label>
        <input v-model="filters.banco" type="text" class="form-control" placeholder="Banco" />
      </div>
      <div class="col-md-2">
        <label class="form-label">Monto (mín)</label>
        <input v-model.number="filters.montoMin" type="number" class="form-control" min="0" />
      </div>
      <div class="col-md-2">
        <label class="form-label">Monto (máx)</label>
        <input v-model.number="filters.montoMax" type="number" class="form-control" min="0" />
      </div>
      <div class="col-md-3">
        <label class="form-label">Fecha inicio</label>
        <input v-model="filters.fechaInicio" type="date" class="form-control" />
      </div>
      <div class="col-md-3">
        <label class="form-label">Fecha fin</label>
        <input v-model="filters.fechaFin" type="date" class="form-control" />
      </div>
      <div class="col-md-3">
        <label class="form-label">Texto libre</label>
        <input
          v-model="filters.texto"
          type="text"
          class="form-control"
          placeholder="Nombre, empresa, email..."
        />
      </div>
      <div class="col-md-3 d-flex align-items-end">
        <button class="btn btn-primary w-100" @click="buscar" :disabled="historicoLoading">
          <span v-if="historicoLoading" class="spinner-border spinner-border-sm me-1"></span>
          Buscar
        </button>
      </div>
    </div>

    <!-- Panel de totales y agregados -->
    <div class="row mb-3">
      <div class="col-md-3">
        <div class="card card-body bg-light">
          <strong>Total solicitudes:</strong> {{ historicoFilteredRows.length }}<br />
          <strong>Promedio monto:</strong> ${{ promedioMontos.toFixed(2) }}
        </div>
      </div>
      <div class="col-md-3">
        <div class="card card-body bg-light">
          <strong>Por estado:</strong>
          <ul class="mb-0 ps-3">
            <li v-for="(count, estado) in conteoPorEstado" :key="estado">
              <span :class="getStatusClass(estado)">{{ estado }}</span
              >: {{ count }}
            </li>
          </ul>
        </div>
      </div>
      <div class="col-md-3">
        <div class="card card-body bg-light">
          <strong>Totales por empresa:</strong>
          <ul class="mb-0 ps-3">
            <li v-for="(empresa, id) in totalesPorEmpresa" :key="id">
              {{ empresa.empresa }}: ${{ empresa.total.toFixed(2) }} ({{ empresa.count }})
            </li>
          </ul>
        </div>
      </div>
      <div class="col-md-3">
        <div class="card card-body bg-light">
          <strong>Totales por usuario:</strong>
          <ul class="mb-0 ps-3">
            <li v-for="(usuario, id) in totalesPorUsuario" :key="id">
              {{ usuario.nombre }}: ${{ usuario.total.toFixed(2) }} ({{ usuario.count }})
            </li>
          </ul>
        </div>
      </div>
    </div>

    <!-- Exportar -->
    <div class="mb-3 text-end">
      <button
        class="btn btn-success"
        @click="exportHistoricoExcel"
        :disabled="historicoFilteredRows.length === 0"
      >
        <i class="far fa-file-excel me-1"></i> Exportar Excel
      </button>
    </div>

    <!-- Tabla de resultados -->
    <div class="table-responsive">
      <table class="table table-hover align-middle">
        <thead class="table-light">
          <tr>
            <th>Nombre</th>
            <th>Empresa</th>
            <th>Cédula</th>
            <th>Estado</th>
            <th>Banco</th>
            <th>Fecha</th>
            <th>Monto</th>
            <th>Fee</th>
            <th>Total</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in historicoFilteredRows" :key="item.id">
            <td>{{ item.nombre }}</td>
            <td>{{ item.empresa_nombre }}</td>
            <td>{{ item.cedula }}</td>
            <td>
              <span :class="getStatusClass(item.estado)">{{ item.estado }}</span>
            </td>
            <td>{{ item.banco_nombre }}</td>
            <td>{{ formatDate(item.fecha_solicitud) }}</td>
            <td>${{ Number(item.monto_solicitado).toFixed(2) }}</td>
            <td>${{ Number(item.fee).toFixed(2) }}</td>
            <td>${{ (Number(item.monto_solicitado) + Number(item.fee)).toFixed(2) }}</td>
          </tr>
          <tr v-if="!historicoLoading && historicoFilteredRows.length === 0">
            <td colspan="9" class="text-center text-muted">
              No hay resultados para los filtros seleccionados.
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Loading y error -->
    <div v-if="historicoLoading" class="text-center my-4">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">Cargando...</span>
      </div>
    </div>
    <div v-if="historicoError" class="alert alert-danger mt-3">{{ historicoError }}</div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useReportsStore } from '@/stores/reports'
import { useCompaniesStore } from '@/stores/companies'

const reports = useReportsStore()
const companies = useCompaniesStore()

const filters = reports.historicoFilters
const historicoLoading = computed(() => reports.historicoLoading)
const historicoError = computed(() => reports.historicoError)
const historicoFilteredRows = computed(() => reports.historicoFilteredRows())
const promedioMontos = computed(() => reports.historicoPromedioMontos())
const conteoPorEstado = computed(() => reports.historicoConteoPorEstado())
const totalesPorEmpresa = computed(() => reports.historicoTotalesPorEmpresa())
const totalesPorUsuario = computed(() => reports.historicoTotalesPorUsuario())
const exportHistoricoExcel = reports.exportHistoricoExcel

const empresas = ref([])

onMounted(async () => {
  try {
    // Cargar empresas para el filtro (ahora usando fetchCompanies)
    const { items } = await companies.fetchCompanies({
      expand: 'assigned_companies', // Opcional: cargar relaciones si se necesitan
    })
    empresas.value = items
  } catch {
    empresas.value = []
  }
})

function buscar() {
  reports.fetchHistorico()
}

function formatDate(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return d.toLocaleDateString()
}

function getStatusClass(estado) {
  switch (estado) {
    case 'pendiente':
      return 'badge bg-warning'
    case 'procesando':
      return 'badge bg-primary'
    case 'pagado':
      return 'badge bg-success'
    case 'rechazado':
      return 'badge bg-danger'
    default:
      return 'badge bg-secondary'
  }
}
</script>
