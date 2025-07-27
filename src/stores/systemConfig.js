import { defineStore } from 'pinia'
import { ref } from 'vue'
import { api } from '@/services/pocketbase'

export const useSystemConfigStore = defineStore(
  'systemConfig',
  () => {
    const config = ref(null)
    const loading = ref(false)
    const lastFetch = ref(null)
    const CACHE_DURATION = 10 * 60 * 1000 // 10 minutos

    async function fetchConfig(forceRefresh = false) {
      // Check cache
      if (!forceRefresh && config.value && lastFetch.value) {
        const elapsed = Date.now() - lastFetch.value
        if (elapsed < CACHE_DURATION) {
          console.log('🎯 Cache hit: system config')
          return config.value
        }
      }

      loading.value = true
      try {
        const result = await pb
          .collection('system_config')
          .getFirstListItem('name="default_config"')

        config.value = {
          porcentaje_servicio: result.porcentaje_servicio || 10,
          valor_fijo_mensual: result.valor_fijo_mensual || 50,
          plan_default: result.plan_default || '1',
          dia_inicio: result.dia_inicio || 1,
          dia_cierre: result.dia_cierre || 28,
          porcentaje_maximo: result.porcentaje_maximo || 50,
          frecuencia_maxima: result.frecuencia_maxima || 3,
          dias_bloqueo: result.dias_bloqueo || 2,
          dias_reinicio: result.dias_reinicio || 1,
        }

        lastFetch.value = Date.now()
        return config.value
      } catch (error) {
        console.error('Error fetching system config:', error)
        // Return defaults
        config.value = {
          porcentaje_servicio: 10,
          valor_fijo_mensual: 50,
          plan_default: '1',
          dia_inicio: 1,
          dia_cierre: 28,
          porcentaje_maximo: 50,
          frecuencia_maxima: 3,
          dias_bloqueo: 2,
          dias_reinicio: 1,
        }
        return config.value
      } finally {
        loading.value = false
      }
    }

    async function updateConfig(updates) {
      try {
        const current = await pb
          .collection('system_config')
          .getFirstListItem('name="default_config"')

        const updated = await pb.collection('system_config').update(current.id, updates)

        // Update local cache
        Object.assign(config.value, updates)

        return updated
      } catch (error) {
        console.error('Error updating config:', error)
        throw error
      }
    }

    return {
      config,
      loading,
      fetchConfig,
      updateConfig,
    }
  },
  {
    persist: {
      key: 'flexirol-system-config',
      storage: sessionStorage,
      paths: ['config', 'lastFetch'],
    },
  },
)
