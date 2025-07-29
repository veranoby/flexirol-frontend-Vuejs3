<template>
  <v-container class="mt-4">
    <h3 class="mb-3"><v-icon class="me-2">mdi-archive</v-icon>Histórico de Solicitudes</h3>

    <!-- Filtros Nivel 1 -->
    <v-row class="mb-3">
      <v-col md="2">
        <v-text-field v-model="filters.cedula" label="Cédula" maxlength="10"></v-text-field>
      </v-col>
      <v-col md="2">
        <v-select
          v-model="filters.empresaId"
          :items="empresas"
          item-title="company_name"
          item-value="id"
          label="Empresa"
          clearable
        >
          <template #prepend-item>
            <v-list-item title="Todas" value=""></v-list-item>
          </template>
        </v-select>
      </v-col>
      <v-col md="2">
        <v-select
          v-model="filters.estado"
          :items="[
            { title: 'Todos', value: '' },
            { title: 'Pendiente', value: 'pendiente' },
            { title: 'Procesando', value: 'procesando' },
            { title: 'Pagado', value: 'pagado' },
            { title: 'Rechazado', value: 'rechazado' },
          ]"
          label="Estado"
          clearable
        ></v-select>
      </v-col>
      <v-col md="2">
        <v-text-field v-model="filters.banco" label="Banco"></v-text-field>
      </v-col>
      <v-col md="2">
        <v-text-field
          v-model.number="filters.montoMin"
          label="Monto (mín)"
          type="number"
          min="0"
        ></v-text-field>
      </v-col>
      <v-col md="2">
        <v-text-field
          v-model.number="filters.montoMax"
          label="Monto (máx)"
          type="number"
          min="0"
        ></v-text-field>
      </v-col>
      <v-col md="3">
        <v-text-field v-model="filters.fechaInicio" label="Fecha inicio" type="date"></v-text-field>
      </v-col>
      <v-col md="3">
        <v-text-field v-model="filters.fechaFin" label="Fecha fin" type="date"></v-text-field>
      </v-col>
      <v-col md="3">
        <v-text-field
          v-model="filters.texto"
          label="Texto libre"
          placeholder="Nombre, empresa, email..."
        ></v-text-field>
      </v-col>
      <v-col md="3" class="d-flex align-end">
        <v-btn
          color="primary"
          block
          @click="buscar"
          :loading="historicoLoading"
          :disabled="historicoLoading"
        >
          Buscar
        </v-btn>
      </v-col>
    </v-row>

    <!-- Panel de totales y agregados -->
    <v-row class="mb-3">
      <v-col md="3">
        <v-card class="pa-4" color="grey-lighten-5">
          <v-card-text class="pa-0">
            <div class="text-subtitle-2 mb-1">Total solicitudes:</div>
            <div class="text-h6">{{ historicoFilteredRows.length }}</div>
            <div class="text-subtitle-2 mb-1 mt-3">Promedio monto:</div>
            <div class="text-h6">${{ promedioMontos.toFixed(2) }}</div>
          </v-card-text>
        </v-card>
      </v-col>
      <v-col md="3">
        <v-card class="pa-4" color="grey-lighten-5">
          <v-card-text class="pa-0">
            <div class="text-subtitle-2 mb-2">Por estado:</div>
            <div v-for="(count, estado) in conteoPorEstado" :key="estado" class="mb-1">
              <v-chip :color="getStatusColor(estado)" size="small" class="me-2">
                {{ estado }}
              </v-chip>
              {{ count }}
            </div>
          </v-card-text>
        </v-card>
      </v-col>
      <v-col md="3">
        <v-card class="pa-4" color="grey-lighten-5">
          <v-card-text class="pa-0">
            <div class="text-subtitle-2 mb-2">Totales por empresa:</div>
            <div v-for="(empresa, id) in totalesPorEmpresa" :key="id" class="mb-1 text-body-2">
              {{ empresa.empresa }}: ${{ empresa.total.toFixed(2) }} ({{ empresa.count }})
            </div>
          </v-card-text>
        </v-card>
      </v-col>
      <v-col md="3">
        <v-card class="pa-4" color="grey-lighten-5">
          <v-card-text class="pa-0">
            <div class="text-subtitle-2 mb-2">Totales por usuario:</div>
            <div v-for="(usuario, id) in totalesPorUsuario" :key="id" class="mb-1 text-body-2">
              {{ usuario.nombre }}: ${{ usuario.total.toFixed(2) }} ({{ usuario.count }})
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Exportar -->
    <div class="mb-3 text-end">
      <v-btn
        color="success"
        @click="exportHistoricoExcel"
        :disabled="historicoFilteredRows.length === 0"
        prepend-icon="mdi-microsoft-excel"
      >
        Exportar Excel
      </v-btn>
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
  </v-container>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useReportsStore } from '@/stores/reports'
import { useUsersStore } from '@/stores/users'

const reports = useReportsStore()
const users = useUsersStore()

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
    await users.fetchUsers({ role: 'empresa' })
    empresas.value = users.empresas
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
