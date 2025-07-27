import { defineStore } from 'pinia';
import { ref, computed } from 'vue';

import { useSystemConfigStore } from '@/stores/systemConfig';
import { api } from '@/services/pocketbase';

export const useUsersStore = defineStore(
  'users',
  () => {
    const systemConfigStore = useSystemConfigStore();

    // State
    const users = ref([])
const companyUsers = ref([]);
    const loading = ref(false);
    const error = ref(null);
    const currentPage = ref(1);
    const totalPages = ref(1);
    const itemsPerPage = 50;
    const usersFetchTime = ref({});
    const USERS_CACHE_DURATION = 5 * 60 * 1000; // 5 minutos

    // Getters
    const empresas = computed(() => users.value.filter((u) => u.role === 'empresa'));
    const usersByCompany = computed(() => (empresaId) => users.value.filter((u) => u.company_id === empresaId));
    const stats = computed(() => ({
      total: users.value.length,
      active: users.value.filter((user) => user.gearbox).length,
      blocked: users.value.filter((user) => !user.gearbox).length,
      companies: empresas.value.length,
      employees: users.value.filter((u) => u.role === 'usuario').length,
      operators: users.value.filter((u) => u.role === 'operador').length,
    }));

    // Actions
    async function fetchCompanyUsers(companyId) {
      // This is a simplified fetch, assuming we get all users for a company
      // In a real-world scenario, you might want pagination here as well.
      loading.value = true
      try {
        const result = await api.getUsers({ filter: `company_id = "${companyId}"` }, 1, 500) // Fetch up to 500 users
        companyUsers.value = result.items
      } catch (err) {
        error.value = err.message
      } finally {
        loading.value = false
      }
    }

    async function fetchUsers(filters = {}, forceRefresh = false) {
      const cacheKey = JSON.stringify(filters);
      if (!forceRefresh && usersFetchTime.value[cacheKey]) {
        const elapsed = Date.now() - usersFetchTime.value[cacheKey];
        if (elapsed < USERS_CACHE_DURATION) {
          console.log(' Cache hit: users');
          return;
        }
      }

      loading.value = true;
      try {
        const result = await api.getUsers(filters, filters.page || 1, itemsPerPage);
        users.value = result.items;
        currentPage.value = result.page;
        totalPages.value = result.totalPages;
        usersFetchTime.value[cacheKey] = Date.now();
      } catch (err) {
        error.value = err.message;
      } finally {
        loading.value = false;
      }
    }

    async function createUser(userData) {
      loading.value = true;
      try {
        if (userData.role === 'empresa') {
          const defaults = await systemConfigStore.fetchConfig();
          userData = {
            ...userData,
            company_name: userData.company_name || `${userData.first_name} ${userData.last_name}`,
            flexirol: userData.flexirol ?? defaults.porcentaje_servicio,
            flexirol2: userData.flexirol2 ?? defaults.valor_fijo_mensual,
            flexirol3: userData.flexirol3 ?? defaults.plan_default,
            dia_inicio: userData.dia_inicio ?? defaults.dia_inicio,
            dia_cierre: userData.dia_cierre ?? defaults.dia_cierre,
            porcentaje: userData.porcentaje ?? defaults.porcentaje_maximo,
            dia_bloqueo: userData.dia_bloqueo ?? defaults.dias_bloqueo,
            frecuencia: userData.frecuencia ?? defaults.frecuencia_maxima,
            dia_reinicio: userData.dia_reinicio ?? defaults.dias_reinicio,
          };
        }

        const created = await api.createUser(userData);
        users.value.unshift(created);
        console.log(' User created:', created.id);
        return created;
      } catch (err) {
        console.error('Error creating user:', err);
        throw err;
      } finally {
        loading.value = false;
      }
    }

    async function deleteUser(userId) {
      try {
        await api.deleteUser(userId);
        users.value = users.value.filter((u) => u.id !== userId);
        console.log(' User deleted:', userId);
      } catch (err) {
        console.error('Error deleting user:', err);
        throw err;
      }
    }

    async function deleteCompanyAndItsUsers(companyId) {
      loading.value = true;
      try {
        // 1. Find all users associated with the company
        const usersToDeleteResult = await api.getUsers({ filter: `company_id = "${companyId}"` }, 1, 500);
        const usersToDelete = usersToDeleteResult.items;

        // 2. Delete each associated user
        const deletePromises = usersToDelete.map(user => api.deleteUser(user.id));
        await Promise.all(deletePromises);

        // 3. Delete the company user itself
        await api.deleteUser(companyId);

        // 4. Update local state by removing all deleted users
        const idsToDelete = [companyId, ...usersToDelete.map(u => u.id)];
        users.value = users.value.filter(u => !idsToDelete.includes(u.id));

        return { success: true, deletedUsers: usersToDelete.length };
      } catch (err) {
        console.error('Error deleting company and users:', err);
        throw err;
      } finally {
        loading.value = false;
      }
    }

    async function updateUser(userId, updates) {
      const index = users.value.findIndex((u) => u.id === userId);
      if (index === -1) return;

      const original = { ...users.value[index] };
      users.value[index] = { ...original, ...updates }; // Optimistic update

      try {
        const updated = await api.updateUser(userId, updates);
        users.value[index] = updated; // Update with server response
        console.log(' User updated:', userId);
        return updated;
      } catch (err) {
        users.value[index] = original; // Rollback on error
        console.error('Error updating user:', err);
        throw err;
      }
    }

    return {
      // State
      users,
      companyUsers,
      loading,
      error,
      currentPage,
      totalPages,

      // Getters
      empresas,
      usersByCompany,
      stats,

      // Actions
      fetchUsers,
      fetchCompanyUsers,
      createUser,
      updateUser,
      deleteUser,
      deleteCompanyAndItsUsers,
    };
  },
  {
    persist: {
      key: 'flexirol-users',
      storage: sessionStorage,
      paths: ['users', 'currentPage', 'totalPages', 'usersFetchTime'],
    },
  },
);
