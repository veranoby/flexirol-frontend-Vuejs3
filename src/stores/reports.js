import { defineStore } from 'pinia'
import { ref, reactive } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { api } from '@/services/pocketbase'
import * as XLSX from 'xlsx'

export const useReportsStore = defineStore('reports', () => {
  const authStore = useAuthStore()

  const filters = reactive({
    startDate: null,
    endDate: null,
    userId: null,
    status: null,
    banco: null,
    search: '',
  })

  const reportData = ref([])
  const loading = ref(false)
  const error = ref(null)

  // State for SuperAdmin views
  const solicitudesPendientes = ref([])
  const solicitudesProcesando = ref([])
  const solicitudesPagadas = ref([])
  const selectedSolicitudes = ref([])
  const excelLoading = ref(false)

  // ================= HISTÓRICO SUPERADMIN =================

  // Estado y filtros para histórico
  const historicoFilters = reactive({
    cedula: '',
    empresaId: '',
    estado: '',
    banco: '',
    montoMin: null,
    montoMax: null,
    fechaInicio: null, // Date
    fechaFin: null, // Date
    texto: '', // Filtro texto libre
  })

  const historicoData = ref([])
  const historicoLoading = ref(false)
  const historicoError = ref(null)

  // Function to format date to YYYY-MM-DD HH:MM:SS for PocketBase
  const formatDateForPB = (date) => {
    if (!date) return ''
    const d = new Date(date)
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} 00:00:00`
  }

  async function fetchReportData() {
    if (!authStore.user || !(authStore.isEmpresa || authStore.isOperador)) {
      error.value = "Acceso denegado. Solo roles 'empresa' y 'operador' pueden generar reportes."
      reportData.value = []
      return
    }

    if (!filters.startDate || !filters.endDate) {
      error.value = 'El filtro de fecha (inicio y fin) es obligatorio.'
      reportData.value = []
      return
    }

    // Validate date range (max 3 months)
    const startDate = new Date(filters.startDate)
    const endDate = new Date(filters.endDate)
    const diffTime = Math.abs(endDate - startDate)
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    if (diffDays > 93) {
      // Approximately 3 months
      error.value = 'El rango de fechas no puede exceder los 3 meses.'
      reportData.value = []
      return
    }
    if (endDate < startDate) {
      error.value = 'La fecha de fin no puede ser anterior a la fecha de inicio.'
      reportData.value = []
      return
    }

    loading.value = true
    error.value = null
    reportData.value = []

    try {
      let pbFilterParts = []
      pbFilterParts.push(`fecha_solicitud >= "${formatDateForPB(filters.startDate)}"`)
      pbFilterParts.push(
        `fecha_solicitud <= "${formatDateForPB(new Date(new Date(filters.endDate).setDate(new Date(filters.endDate).getDate() + 1)))}"`,
      ) // Include full end day

      let companyIdForFilter = null
      if (authStore.isEmpresa) {
        // An 'empresa' user reports on their own company.
        // Assuming authStore.user.company_id holds the ID of their record in the 'companies' collection,
        // or authStore.user.assigned_companies[0] if that's how it's structured.
        companyIdForFilter =
          authStore.user.company_id ||
          (authStore.user.assigned_companies && authStore.user.assigned_companies[0])
        if (!companyIdForFilter) {
          throw new Error('ID de compañía no encontrado para el usuario empresa.')
        }
      } else if (authStore.isOperador) {
        // An 'operador' might be assigned to multiple companies.
        // For now, let's assume an operator also has a primary company_id or assigned_companies[0]
        // A future enhancement could allow operators to select from their assigned_companies.
        companyIdForFilter =
          authStore.user.company_id ||
          (authStore.user.assigned_companies && authStore.user.assigned_companies[0])
        if (!companyIdForFilter) {
          // If an operator has multiple assigned_companies but no single primary one,
          // this logic needs to be adapted (e.g., require selection in UI).
          // For now, if no single company ID, they can't filter by company implicitly.
          // This part might need adjustment based on exact operator data structure.
          console.warn(
            'Operador sin ID de compañía principal definido, no se filtrará por compañía automáticamente.',
          )
          // Or, if an operator MUST filter by one of their companies, this should be an error.
          // For this iteration, let's assume if not found, they see no specific company data unless UI provides one.
          // However, the task implies reports are for *their* companies.
          // So, let's make it an error if an operator cannot determine a company.
          throw new Error(
            'Operador: No se pudo determinar la compañía para el reporte. Se requiere un ID de compañía asignada.',
          )
        }
      }

      if (companyIdForFilter) {
        pbFilterParts.push(`company_id = "${companyIdForFilter}"`)
      } else {
        // This case should ideally not be reached if an empresa/operador must have a company.
        console.warn('No se aplicará filtro de compañía ya que no se pudo determinar el ID.')
      }

      // Add other filters like specific user or status if they are implemented
      // if (filters.userId) pbFilterParts.push(`user_id = "${filters.userId}"`)
      // if (filters.status) pbFilterParts.push(`estado = "${filters.status}"`)

      const pbFilter = pbFilterParts.join(' && ')
      console.log('PocketBase Filter:', pbFilter)

      const records = await api.collection('advance_requests').getFullList({
        filter: pbFilter,
        expand: 'user_id,company_id',
        sort: '-created',
      })

      console.log('Fetched records from PB:', records)

      if (!records || records.length === 0) {
        reportData.value = []
        // error.value = "No se encontraron datos para los filtros seleccionados."; // Or just show empty table
        console.log('No data found for the selected filters.')
        loading.value = false
        return
      }

      // Transform data for the report
      reportData.value = records.map((req) => {
        const user = req.expand?.user_id
        const company = req.expand?.company_id

        let planDeServicio = 'No especificado'
        if (company) {
          if (company.flexirol3 === '1') {
            planDeServicio = `Plan 1: ${company.flexirol}%`
          } else if (company.flexirol3 === '2') {
            planDeServicio = `Plan 2: $${company.flexirol2}/mes`
          }
        }

        return {
          // Raw data for potential calculations or detailed views
          raw_request: req,
          raw_user: user,
          raw_company: company,

          // Mapped data for Excel - as per "MAPEO EXCEL ESPECÍFICO"
          // Columnas: Nombre, Sucursal, Fecha, Teléfono, Email, Plan
          nombre: user
            ? user.name || `${user.first_name || ''} ${user.last_name || ''}`.trim()
            : 'Usuario Desconocido',
          sucursal: user ? user.last_name || '' : '', // Using last_name as 'Sucursal' based on legacy analysis
          fecha: new Date(req.fecha_solicitud).toLocaleDateString(), // Or specific format
          telefono: user ? user.phone_number || '' : '',
          email: user ? user.email || '' : '',
          plan: planDeServicio,
          // Additional fields for potential display in UI table or other calculations
          monto_solicitado: req.monto_solicitado,
          estado: req.estado,
          user_id_for_sum: user ? user.id : null, // For "Cálculos totales por usuario (suma montos)"
        }
      })
      console.log('Processed reportData:', reportData.value)
    } catch (e) {
      error.value = `Error al obtener datos del reporte: ${e.message}`
      console.error(error.value, e)
      reportData.value = []
    } finally {
      loading.value = false
    }
  }

  function generateExcel() {
    if (!authStore.user || !(authStore.isEmpresa || authStore.isOperador)) {
      alert('Acceso denegado.') // Simple alert, or use a more sophisticated notification
      return
    }
    if (reportData.value.length === 0) {
      alert('No hay datos para exportar. Por favor, aplique filtros y obtenga datos primero.')
      return
    }

    // Data for Excel: Project only the required columns for the sheet
    // Columnas: Nombre, Sucursal, Fecha, Teléfono, Email, Plan
    const excelSheetData = reportData.value.map((item) => ({
      Nombre: item.nombre,
      Sucursal: item.sucursal,
      Fecha: item.fecha, // Ensure this is formatted as a string if XLSX needs it
      Teléfono: item.telefono,
      Email: item.email,
      'Plan de Servicio': item.plan, // Matching header from generar_reporte_usuarios
      // If "Cálculos totales por usuario (suma montos)" implies individual amounts in this report:
      'Monto Solicitado': item.monto_solicitado,
    }))

    console.log('Data for Excel sheet:', excelSheetData)

    const worksheet = XLSX.utils.json_to_sheet(excelSheetData)

    // TODO: Replicate styling and formatting as much as possible with XLSX.js
    // Basic column widths (example)
    // worksheet['!cols'] = [ {wch:20}, {wch:20}, {wch:10}, {wch:15}, {wch:25}, {wch:20}, {wch:15} ];

    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Reporte Anticipos') // Sheet name

    const today = new Date()
    const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
    const filename = `Reporte_Anticipos_${dateStr}.xlsx`

    XLSX.writeFile(workbook, filename)
    console.log(`Excel file "${filename}" generation initiated.`)
  }

  // Function to calculate totals per user
  function calculateUserTotals() {
    if (!reportData.value || reportData.value.length === 0) {
      return {}
    }
    const totals = reportData.value.reduce((acc, item) => {
      if (item.user_id_for_sum) {
        if (!acc[item.user_id_for_sum]) {
          acc[item.user_id_for_sum] = {
            userName: item.nombre,
            totalAmount: 0,
            requestCount: 0,
            // cedula: item.raw_user?.cedula // if cedula is needed for display
          }
        }
        acc[item.user_id_for_sum].totalAmount += Number(item.monto_solicitado || 0)
        acc[item.user_id_for_sum].requestCount += 1
      }
      return acc
    }, {})
    console.log('Calculated User Totals:', totals)
    return totals
  }

  // ========== SuperAdmin Methods ==========

  // Fetch pending loan requests
  async function fetchSolicitudesPendientes() {
    try {
      loading.value = true
      const today = new Date()
      const firstDay = new Date(today.getFullYear(), today.getMonth(), 1)
      const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0)

      const result = await api.collection('solicitudes').getList(1, 200, {
        filter: `estado = "pendiente" && created >= "${firstDay.toISOString()}" && created <= "${lastDay.toISOString()}"`,
        expand: 'usuario',
        sort: '-created',
      })

      solicitudesPendientes.value = result.items.map((item) => ({
        ...item,
        ...(item.expand?.usuario || {}),
      }))
      return solicitudesPendientes.value
    } catch (err) {
      console.error('Error fetching pending requests:', err)
      error.value = 'Error al cargar las solicitudes pendientes'
      return []
    } finally {
      loading.value = false
    }
  }

  // Fetch processing loan requests
  async function fetchSolicitudesProcesando() {
    try {
      loading.value = true
      const result = await api.collection('solicitudes').getList(1, 200, {
        filter: 'estado = "procesando"',
        expand: 'usuario',
        sort: '-updated',
      })

      solicitudesProcesando.value = result.items.map((item) => ({
        ...item,
        ...(item.expand?.usuario || {}),
      }))
      return solicitudesProcesando.value
    } catch (err) {
      console.error('Error fetching processing requests:', err)
      error.value = 'Error al cargar las solicitudes en proceso'
      return []
    } finally {
      loading.value = false
    }
  }

  // Fetch paid loan requests
  async function fetchSolicitudesPagadas() {
    try {
      loading.value = true
      const today = new Date()
      const firstDay = new Date(today.getFullYear(), today.getMonth(), 1)

      const result = await api.collection('solicitudes').getList(1, 200, {
        filter: `estado = "pagado" && updated >= "${firstDay.toISOString()}"`,
        expand: 'usuario,empresa',
        sort: '-updated',
      })

      solicitudesPagadas.value = result.items.map((item) => ({
        ...item,
        ...(item.expand?.usuario || {}),
        empresa_nombre: item.expand?.empresa?.nombre || 'Sin empresa',
      }))
      return solicitudesPagadas.value
    } catch (err) {
      console.error('Error fetching paid requests:', err)
      error.value = 'Error al cargar las solicitudes pagadas'
      return []
    } finally {
      loading.value = false
    }
  }

  // Estado reactivo para mensajes y habilitación
  const mensajeImportante = ref('')
  const claseImportante = ref('alert-primary')
  const habilitadoSwitch = ref(false)

  /**
   * Valida si el Excel de usuarios está actualizado y si el usuario puede descargar reportes.
   * Replica la lógica legacy de habilitado_switch y validación de fecha_excel.
   * @param {Object} miInfo - Info de la empresa/usuario (de PB)
   * @returns {boolean} true si habilitado, false si bloqueado
   */
  function validateExcelStatus(miInfo) {
    let retornar = false
    mensajeImportante.value = ''
    claseImportante.value = 'alert-primary'

    if (!miInfo || !miInfo.fecha_excel) {
      mensajeImportante.value =
        'No se ha cargado su Listado Excel Actualizado - Usuarios bloqueados'
      claseImportante.value = 'alert alert-danger'
      habilitadoSwitch.value = false
      return false
    }

    // Fecha de hoy y cierre mes anterior
    const hoy = new Date()
    const hoy_mes = hoy.getMonth()
    const hoy_anio = hoy.getFullYear()
    // Cierre mes anterior: siempre día 28 (como en legacy)
    let cierre_mes_anterior = new Date(hoy_anio, hoy_mes, 0) // día 0 = último día mes anterior
    cierre_mes_anterior.setDate(28) // forzar día 28

    // Parse fecha_excel (formato legacy: dd/mm/yyyy)
    const [dia, mes, anio] = miInfo.fecha_excel.split('/')
    const dia_excel = new Date(`${anio}-${mes.padStart(2, '0')}-${dia.padStart(2, '0')}`)

    if (dia_excel > cierre_mes_anterior) {
      mensajeImportante.value = 'Su listado de Excel de Usuarios está Actualizado y Activo!'
      claseImportante.value = 'alert alert-primary'
      retornar = true
    } else {
      mensajeImportante.value =
        'No se ha cargado su Listado Excel Actualizado - Usuarios bloqueados'
      claseImportante.value = 'alert alert-danger'
      retornar = false
    }
    habilitadoSwitch.value = retornar
    console.log(
      '[validateExcelStatus] fecha_excel:',
      miInfo.fecha_excel,
      'cierre_mes_anterior:',
      cierre_mes_anterior,
      'habilitado:',
      retornar,
    )
    return retornar
  }

  // Exportar Excel bancario con formato especial para Banco Guayaquil y estándar para otros bancos.
  // Replica la lógica de functions.php:generar_pagos
  async function generateBankingExcel(solicitudes = []) {
    if (solicitudes.length === 0) {
      error.value = 'No hay solicitudes seleccionadas para generar el Excel'
      return
    }

    excelLoading.value = true

    try {
      // Agrupar por banco
      const byBank = {}
      solicitudes.forEach((solicitud) => {
        const banco = solicitud.banco_nombre || 'OTROS'
        if (!byBank[banco]) byBank[banco] = []
        byBank[banco].push(solicitud)
      })

      // Crear workbook
      const wb = XLSX.utils.book_new()

      // Procesar cada banco
      for (const [banco, solicitudesBanco] of Object.entries(byBank)) {
        let worksheetData = []

        if (banco.toUpperCase().includes('GUAYAQUIL')) {
          // Formato especial Banco Guayaquil
          worksheetData = solicitudesBanco.map((sol) => ({
            PA: 'PA',
            'CUENTA ORIGINAL FLEXIROL': sol.numero_cuenta,
            1: '1',
            '': '',
            'NRO CTA': sol.numero_cuenta,
            USD: 'USD',
            MONTO: Number(sol.monto_aprobado).toFixed(2),
            CTA: sol.tipo_cuenta === 'ahorros' ? 'A' : 'C',
            IDENTIFICACION: sol.cedula,
            NOMBRE: sol.propietario,
          }))
        } else {
          // Formato estándar otros bancos
          worksheetData = solicitudesBanco.map((sol) => ({
            'TIPO CUENTA': sol.tipo_cuenta === 'ahorros' ? 'Ahorros' : 'Corriente',
            'NUMERO CUENTA': sol.numero_cuenta,
            IDENTIFICACION: sol.cedula,
            EMAIL: sol.email,
            NOMBRE: sol.propietario,
            MONTO: Number(sol.monto_aprobado).toFixed(2),
            IMPUESTO: (Number(sol.monto_aprobado) * 0.12).toFixed(2),
            TOTAL: (Number(sol.monto_aprobado) * 1.12).toFixed(2),
          }))
        }

        // Agregar worksheet
        const ws = XLSX.utils.json_to_sheet(worksheetData)
        XLSX.utils.book_append_sheet(wb, ws, banco.substring(0, 31))
      }

      // Guardar archivo
      const date = new Date().toISOString().split('T')[0]
      XLSX.writeFile(wb, `pagos_bancarios_${date}.xlsx`)

      // Actualizar estado a 'procesando'
      await Promise.all(
        solicitudes.map((sol) =>
          api.collection('solicitudes').update(sol.id, { estado: 'procesando' }),
        ),
      )

      // Refrescar listas
      await Promise.all([fetchSolicitudesPendientes(), fetchSolicitudesProcesando()])

      return true
    } catch (err) {
      console.error('Error generating Excel:', err)
      error.value = 'Error al generar el archivo Excel'
      return false
    } finally {
      excelLoading.value = false
    }
  }

  // Confirm payment for a request
  async function confirmarAnticipo(solicitudId) {
    try {
      loading.value = true
      await api.collection('solicitudes').update(solicitudId, {
        estado: 'pagado',
        fecha_pago: new Date().toISOString(),
      })

      // Refresh lists
      await Promise.all([fetchSolicitudesProcesando(), fetchSolicitudesPagadas()])

      return true
    } catch (err) {
      console.error('Error confirming payment:', err)
      error.value = 'Error al confirmar el pago'
      return false
    } finally {
      loading.value = false
    }
  }

  // Toggle selection of a request
  function toggleSolicitudSelection(solicitud, isSelected) {
    if (isSelected) {
      selectedSolicitudes.value.push(solicitud)
    } else {
      const index = selectedSolicitudes.value.findIndex((s) => s.id === solicitud.id)
      if (index > -1) {
        selectedSolicitudes.value.splice(index, 1)
      }
    }
  }

  // Check if a request is selected
  function isSolicitudSelected(solicitud) {
    return selectedSolicitudes.value.some((s) => s.id === solicitud.id)
  }

  // Acción principal: búsqueda histórica avanzada
  async function fetchHistorico() {
    historicoLoading.value = true
    historicoError.value = null
    historicoData.value = []
    try {
      // Construir filtro PocketBase (solo filtros activos)
      let pbFilterParts = []
      if (historicoFilters.cedula) pbFilterParts.push(`cedula ~ "${historicoFilters.cedula}"`)
      if (historicoFilters.empresaId)
        pbFilterParts.push(`company_id = "${historicoFilters.empresaId}"`)
      if (historicoFilters.estado) pbFilterParts.push(`estado = "${historicoFilters.estado}"`)
      if (historicoFilters.banco) pbFilterParts.push(`banco_nombre ~ "${historicoFilters.banco}"`)
      if (historicoFilters.montoMin !== null)
        pbFilterParts.push(`monto_solicitado >= ${Number(historicoFilters.montoMin)}`)
      if (historicoFilters.montoMax !== null)
        pbFilterParts.push(`monto_solicitado <= ${Number(historicoFilters.montoMax)}`)
      if (historicoFilters.fechaInicio)
        pbFilterParts.push(`fecha_solicitud >= "${formatDateForPB(historicoFilters.fechaInicio)}"`)
      if (historicoFilters.fechaFin)
        pbFilterParts.push(
          `fecha_solicitud <= "${formatDateForPB(new Date(new Date(historicoFilters.fechaFin).setDate(new Date(historicoFilters.fechaFin).getDate() + 1)))}"`,
        )
      // Filtro texto libre (nombre, empresa, email, etc)
      if (historicoFilters.texto) {
        const txt = historicoFilters.texto.toLowerCase()
        pbFilterParts.push(`(
          lower(nombre) ~ "${txt}" ||
          lower(empresa_nombre) ~ "${txt}" ||
          lower(email) ~ "${txt}" ||
          lower(banco_nombre) ~ "${txt}"
        )`)
      }
      const pbFilter = pbFilterParts.join(' && ')
      console.log('PB filter histórico:', pbFilter)
      // Llamada a PB: advance_requests con expand de usuario y empresa
      const records = await api.collection('advance_requests').getFullList({
        filter: pbFilter,
        expand: 'user_id,company_id',
        sort: '-fecha_solicitud',
      })
      historicoData.value = records.map((req) => {
        const user = req.expand?.user_id
        const company = req.expand?.company_id
        return {
          ...req,
          nombre: user
            ? user.name || `${user.first_name || ''} ${user.last_name || ''}`.trim()
            : '',
          empresa_nombre: company ? company.company_name || company.nombre || '' : '',
          email: user?.email || '',
          banco_nombre: req.banco_nombre || '',
          monto_solicitado: req.monto_solicitado,
          fee: req.gearbox || 0,
          estado: req.estado,
          fecha_solicitud: req.fecha_solicitud,
          fecha_procesado: req.fecha_procesado || req.updated,
          user_id: user?.id,
          company_id: company?.id,
        }
      })
      console.log('HistoricoData:', historicoData.value)
    } catch (e) {
      historicoError.value = e.message || 'Error al buscar histórico'
      historicoData.value = []
      console.error('fetchHistorico error:', e)
    } finally {
      historicoLoading.value = false
    }
  }

  // Filtros aditivos en frontend (nivel 2)
  function historicoFilteredRows() {
    let rows = historicoData.value
    if (historicoFilters.texto) {
      const txt = historicoFilters.texto.toLowerCase()
      rows = rows.filter(
        (item) =>
          (item.nombre && item.nombre.toLowerCase().includes(txt)) ||
          (item.empresa_nombre && item.empresa_nombre.toLowerCase().includes(txt)) ||
          (item.email && item.email.toLowerCase().includes(txt)) ||
          (item.banco_nombre && item.banco_nombre.toLowerCase().includes(txt)),
      )
    }
    if (historicoFilters.montoMin !== null)
      rows = rows.filter(
        (item) => Number(item.monto_solicitado) >= Number(historicoFilters.montoMin),
      )
    if (historicoFilters.montoMax !== null)
      rows = rows.filter(
        (item) => Number(item.monto_solicitado) <= Number(historicoFilters.montoMax),
      )
    // Otros filtros refinados pueden agregarse aquí
    return rows
  }

  // Agregaciones y totales
  function historicoTotalesPorUsuario() {
    const totals = {}
    historicoFilteredRows().forEach((item) => {
      if (!totals[item.user_id]) {
        totals[item.user_id] = {
          nombre: item.nombre,
          empresa: item.empresa_nombre,
          cedula: item.cedula,
          total: 0,
          count: 0,
        }
      }
      totals[item.user_id].total += Number(item.monto_solicitado) + Number(item.fee)
      totals[item.user_id].count++
    })
    return totals
  }
  function historicoTotalesPorEmpresa() {
    const totals = {}
    historicoFilteredRows().forEach((item) => {
      if (!totals[item.company_id]) {
        totals[item.company_id] = {
          empresa: item.empresa_nombre,
          total: 0,
          count: 0,
        }
      }
      totals[item.company_id].total += Number(item.monto_solicitado) + Number(item.fee)
      totals[item.company_id].count++
    })
    return totals
  }
  function historicoConteoPorEstado() {
    const counts = {}
    historicoFilteredRows().forEach((item) => {
      counts[item.estado] = (counts[item.estado] || 0) + 1
    })
    return counts
  }
  function historicoPromedioMontos() {
    const rows = historicoFilteredRows()
    if (!rows.length) return 0
    const sum = rows.reduce((acc, item) => acc + Number(item.monto_solicitado), 0)
    return sum / rows.length
  }

  // Exportar Excel histórico (multi-sheet por empresa)
  function exportHistoricoExcel() {
    const byEmpresa = {}
    historicoFilteredRows().forEach((item) => {
      const empresa = item.empresa_nombre || 'Sin Empresa'
      if (!byEmpresa[empresa]) byEmpresa[empresa] = []
      byEmpresa[empresa].push(item)
    })
    const wb = XLSX.utils.book_new()
    Object.entries(byEmpresa).forEach(([empresa, items]) => {
      const wsData = items.map((item) => ({
        Nombre: item.nombre,
        Empresa: item.empresa_nombre,
        Cédula: item.cedula,
        Estado: item.estado,
        Banco: item.banco_nombre,
        Fecha: item.fecha_solicitud,
        Monto: item.monto_solicitado,
        Fee: item.fee,
        Total: Number(item.monto_solicitado) + Number(item.fee),
      }))
      const ws = XLSX.utils.json_to_sheet(wsData)
      XLSX.utils.book_append_sheet(wb, ws, empresa.substring(0, 31))
    })
    const today = new Date().toISOString().split('T')[0]
    XLSX.writeFile(wb, `Historico_Solicitudes_${today}.xlsx`)
  }

  return {
    // State
    filters,
    reportData,
    loading,
    error,
    solicitudesPendientes,
    solicitudesProcesando,
    solicitudesPagadas,
    selectedSolicitudes,
    excelLoading,
    historicoFilters,
    historicoData,
    historicoLoading,
    historicoError,
    mensajeImportante,
    claseImportante,
    habilitadoSwitch,

    // Methods
    fetchReportData,
    generateExcel,
    calculateUserTotals,
    fetchSolicitudesPendientes,
    fetchSolicitudesProcesando,
    fetchSolicitudesPagadas,
    generateBankingExcel,
    confirmarAnticipo,
    toggleSolicitudSelection,
    isSolicitudSelected,
    fetchHistorico,
    historicoFilteredRows,
    historicoTotalesPorUsuario,
    historicoTotalesPorEmpresa,
    historicoConteoPorEstado,
    historicoPromedioMontos,
    exportHistoricoExcel,
    validateExcelStatus,
  }
})
