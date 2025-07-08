<template>
  <div class="glass-morphism-container min-h-screen">
    <v-container fluid class="px-0">
      <v-row no-gutters>
        <v-col cols="12" lg="6" class="mx-auto">
          <div class="login-card">
            <!-- User Icon -->
            <div class="login-icon">
              <v-icon size="32" color="white">mdi-account</v-icon>
            </div>

            <!-- Title -->
            <p class="text-center p-0 m-0 indigo-darken-4">FlexiRol</p>
            <h2 class="text-center p-0 m-0 indigo-darken-4">Sign In</h2>

            <!-- Form -->
            <v-form @submit.prevent="handleLogin" class="login-form">
              <!-- Email -->
              <v-text-field
                v-model="form.email"
                label="Username"
                type="email"
                :error-messages="errors.email"
                prepend-inner-icon="mdi-account"
                required
                autocomplete="email"
                class="mb-3"
                outlined
              />

              <!-- Password -->
              <v-text-field
                v-model="form.password"
                :type="showPassword ? 'text' : 'password'"
                label="Password"
                :error-messages="errors.password"
                prepend-inner-icon="mdi-lock"
                :append-inner-icon="showPassword ? 'mdi-eye-off' : 'mdi-eye'"
                @click:append-inner="showPassword = !showPassword"
                required
                autocomplete="current-password"
                class="mb-3"
                outlined
              />

              <!-- Remember Me -->
              <v-checkbox v-model="form.remember" label="Remember me" class="mb-3" />

              <!-- Error Message -->
              <v-alert
                v-if="authStore.error"
                type="error"
                class="mb-3"
                prepend-icon="mdi-alert-circle"
              >
                {{ authStore.error }}
              </v-alert>

              <!-- Submit Button -->
              <v-btn
                type="submit"
                color="primary"
                size="x-large"
                class="mx-auto my-4"
                :loading="authStore.isLoading"
                :disabled="!isFormValid || authStore.isLoading"
                block
              >
                <v-icon left>mdi-login</v-icon>
                Iniciar Sesión
              </v-btn>
            </v-form>

            <!-- Test Users -->
            <v-card class="glass-morphism mt-4">
              <v-card-title class="text-h6">
                <v-icon left>mdi-account-group</v-icon>
                Usuarios de Prueba
              </v-card-title>
              <v-card-text>
                <v-list>
                  <v-list-item
                    v-for="user in testUsers"
                    :key="user.email"
                    @click="fillTestUser(user)"
                  >
                    <v-list-item-title>
                      <v-icon left>{{ user.icon }}</v-icon>
                      {{ user.label }} ({{ user.email }})
                    </v-list-item-title>
                  </v-list-item>
                </v-list>
              </v-card-text>
            </v-card>
          </div>
        </v-col>
      </v-row>
    </v-container>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()

// Form state
const form = ref({
  email: '',
  password: '',
  remember: false,
})

const showPassword = ref(false)
const errors = ref({})

// Test users
const testUsers = ref([
  {
    email: 'superadmin@powersersa.com',
    password: 'admin123',
    label: 'Superadmin Powersersa',
    icon: 'mdi-crown',
  },
  {
    email: 'operador1@powersersa.com',
    password: 'operador123',
    label: 'Powersersa Operador 1',
    icon: 'mdi-office-building',
  },
  {
    email: 'empresa1@test.com',
    password: 'empresa123',
    label: 'Empresa1',
    icon: 'mdi-office-building',
  },
  {
    email: 'usuario1@empresa1.com',
    password: 'usuario123',
    label: 'Usuario1-Empresa1',
    icon: 'mdi-account',
  },
])

// Computed
const isFormValid = computed(() => {
  return form.value.email && form.value.password && form.value.email.includes('@')
})

// Methods
const validateForm = () => {
  errors.value = {}

  if (!form.value.email) {
    errors.value.email = 'El email es requerido'
  } else if (!form.value.email.includes('@')) {
    errors.value.email = 'Email inválido'
  }

  if (!form.value.password) {
    errors.value.password = 'La contraseña es requerida'
  } else if (form.value.password.length < 6) {
    errors.value.password = 'La contraseña debe tener al menos 6 caracteres'
  }

  return Object.keys(errors.value).length === 0
}

const handleLogin = async () => {
  if (!validateForm()) return

  authStore.clearError()

  const result = await authStore.login(form.value.email, form.value.password)

  if (result.success) {
    router.push('/dashboard')
  }
}

const fillTestUser = (user) => {
  form.value.email = user.email
  form.value.password = user.password
  errors.value = {}
}

// Lifecycle
onMounted(() => {
  authStore.clearError()
})
</script>

<style scoped>
.login-card {
  width: 100%;
  max-width: 400px;
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(20px);
  border-radius: 1rem;
  padding: 3rem 2rem;
  box-shadow: 0 1rem 3rem rgba(0, 0, 0, 0.175);
  border: 1px solid rgba(255, 255, 255, 0.2);
  position: relative;
  z-index: 1;
  animation: slideInUp 0.6s ease-out;
  margin: 0 auto;
}

@keyframes slideInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.login-icon {
  width: 80px;
  height: 80px;
  background: linear-gradient(135deg, #3a6a77, #1d9190);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 2rem;
  box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.15);
}

.login-icon i {
  font-size: 2rem;
  color: white;
}
</style>
