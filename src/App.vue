<template>
  <div id="app">
    <nav v-if="authStore.isAuthenticated" class="navbar navbar-expand-lg navbar-dark bg-primary">
      <div class="container">
        <router-link to="/dashboard" class="navbar-brand"> FlexiRol </router-link>

        <div class="navbar-nav me-auto">
          <!-- Superadmin Menu -->
          <template v-if="authStore.isSuperadmin">
            <router-link to="/superadmin/usuarios" class="nav-link">Usuarios</router-link>
            <router-link to="/superadmin/empresas" class="nav-link">Empresas</router-link>
            <router-link to="/superadmin/config" class="nav-link">Configuración</router-link>
          </template>

          <!-- Admin Menu (empresa/operador) -->
          <template v-if="authStore.isEmpresa || authStore.isOperador">
            <router-link to="/admin/usuarios" class="nav-link">Usuarios</router-link>
            <router-link to="/admin/reportes" class="nav-link">Reportes</router-link>
          </template>

          <!-- Usuario Menu -->
          <template v-if="authStore.isUsuario">
            <router-link to="/usuario/solicitudes" class="nav-link">Solicitudes</router-link>
            <router-link to="/usuario/bancos" class="nav-link">Bancos</router-link>
          </template>
        </div>

        <div class="navbar-nav">
          <div class="nav-item dropdown">
            <a class="nav-link dropdown-toggle" href="#" data-bs-toggle="dropdown">
              {{ authStore.user?.name || authStore.user?.email }}
            </a>
            <ul class="dropdown-menu">
              <li><a class="dropdown-item" href="#" @click="logout">Cerrar Sesión</a></li>
            </ul>
          </div>
        </div>
      </div>
    </nav>

    <main class="container-fluid mt-4">
      <router-view />
    </main>
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()

onMounted(() => {
  authStore.initAuth()
})

const logout = async () => {
  await authStore.logout()
  router.push('/login')
}
</script>

<style>
#app {
  min-height: 100vh;
}

.router-link-active {
  font-weight: bold;
}
</style>
