<template>
  <div class="login-view">
    <v-container fluid class="px-0">
      <v-row no-gutters>
        <v-col cols="12" lg="6" class="mx-auto">
          <div class="login-card">
            <!-- User Icon -->
            <div class="login-icon">
              <v-icon size="32" color="white">mdi-account</v-icon>
            </div>

            <!-- Title -->
            <p class="text-center p-0 m-0 text-black-50 text-opacity-50">FlexiRol</p>
            <h2 class="login-title">Sign In</h2>

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
              />

              <!-- Remember Me -->
              <v-checkbox
                v-model="form.remember"
                label="Remember me"
                class="mb-3"
              />

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
                size="large"
                :loading="authStore.isLoading"
                :disabled="!isFormValid || authStore.isLoading"
                class="btn-login mb-3"
              >
                <v-icon left>mdi-login</v-icon>
                {{ authStore.isLoading ? 'Iniciando sesión...' : 'Login' }}
              </v-btn>
            </v-form>

            <!-- Test Users -->
            <div class="test-users">
              <div class="test-divider">
                <span>Test Users</span>
              </div>
              <div class="test-buttons">
                <v-btn
                  v-for="testUser in testUsers"
                  :key="testUser.email"
                  variant="outlined"
                  size="small"
                  color="secondary"
                  @click="fillTestUser(testUser)"
                  class="mb-2"
                >
                  <v-icon left>{{ testUser.icon }}</v-icon>
                  {{ testUser.label }}
                </v-btn>
              </div>
            </div>
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

// Test users (mantener los usuarios actuales)
const testUsers = ref([
  {
    email: 'superadmin@powersersa.com',
    password: 'admin123',
    label: 'Superadmin Powersersa',
    icon: 'fas fa-crown',
  },
  {
    email: 'operador1@powersersa.com',
    password: 'operador123',
    label: 'Powersersa Operador 1',
    icon: 'fas fa-building',
  },
  {
    email: 'empresa1@test.com',
    password: 'empresa123',
    label: 'Empresa1',
    icon: 'fas fa-building',
  },
  {
    email: 'usuario1@empresa1.com',
    password: 'usuario123',
    label: 'Usuario1-Empresa1',
    icon: 'fas fa-user',
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
/* Glass morphism login manteniendo colores Flexirol */
.login-view {
  min-height: 100vh;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #3a6a77 0%, #1d9190 50%, #fffeb8 100%);
  padding: 2rem 1rem;
  position: relative;
  overflow: hidden;
}

.login-view::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background:
    radial-gradient(circle at 20% 50%, rgba(255, 255, 255, 0.1) 0%, transparent 50%),
    radial-gradient(circle at 80% 20%, rgba(255, 255, 255, 0.1) 0%, transparent 50%),
    radial-gradient(circle at 40% 80%, rgba(255, 255, 255, 0.1) 0%, transparent 50%);
  pointer-events: none;
}

.login-card {
  width: 100%;
  max-width: 400px;
  background: rgba(255, 255, 255, 0.95);
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

.login-title {
  text-align: center;
  margin-bottom: 2rem;
  font-size: 1.75rem;
  font-weight: 300;
  color: #6c757d;
  letter-spacing: 0.5px;
}

.form-group {
  margin-bottom: 1.5rem;
  position: relative;
}

.input-group {
  position: relative;
  display: flex;
  align-items: center;
}

.input-icon {
  position: absolute;
  left: 1rem;
  z-index: 3;
  color: #adb5bd;
  font-size: 0.9rem;
}

.form-control {
  width: 100%;
  padding: 1rem 1rem 1rem 3rem;
  border: 2px solid #e9ecef;
  border-radius: 0.5rem;
  background: white;
  font-size: 1rem;
  transition: all 0.3s ease;
  outline: none;
}

.form-control::placeholder {
  color: #adb5bd;
  font-weight: 300;
}

.form-control:focus {
  border-color: #1d9190;
  box-shadow: 0 0 0 0.2rem rgba(29, 145, 144, 0.25);
}

.password-toggle {
  position: absolute;
  right: 1rem;
  background: none;
  border: none;
  color: #adb5bd;
  cursor: pointer;
  padding: 0.5rem;
  z-index: 3;
  transition: all 0.3s ease;
}

.password-toggle:hover {
  color: #1d9190;
}

.form-check {
  display: flex;
  align-items: center;
  margin-bottom: 2rem;
}

.form-check-input {
  width: 1.2rem;
  height: 1.2rem;
  margin-right: 0.75rem;
  border: 2px solid #dee2e6;
  border-radius: 0.25rem;
  background: white;
  cursor: pointer;
  transition: all 0.3s ease;
}

.form-check-input:checked {
  background-color: #1d9190;
  border-color: #1d9190;
}

.form-check-label {
  color: #6c757d;
  font-size: 0.9rem;
  cursor: pointer;
  user-select: none;
}

.btn-login {
  width: 100%;
  background: linear-gradient(135deg, #3a6a77, #1d9190);
  color: white;
  border: none;
  padding: 1rem;
  font-size: 1.1rem;
  font-weight: 500;
  letter-spacing: 0.5px;
  margin-bottom: 1rem;
  border-radius: 0.5rem;
  box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.15);
  transition: all 0.3s ease;
  cursor: pointer;
}

.btn-login:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 1rem 3rem rgba(0, 0, 0, 0.175);
}

.btn-login:disabled {
  opacity: 0.7;
  cursor: not-allowed;
  transform: none;
}

.test-users {
  margin-top: 2rem;
  padding-top: 2rem;
  border-top: 1px solid #e9ecef;
}

.test-divider {
  text-align: center;
  margin-bottom: 1rem;
  position: relative;
}

.test-divider span {
  background: white;
  color: #adb5bd;
  padding: 0 1rem;
  font-size: 0.85rem;
  position: relative;
  z-index: 1;
}

.test-buttons {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.btn-test {
  background: #f8f9fa;
  border: 1px solid #dee2e6;
  color: #495057;
  padding: 0.5rem 1rem;
  font-size: 0.85rem;
  text-align: left;
  border-radius: 0.5rem;
  transition: all 0.3s ease;
  cursor: pointer;
}

.btn-test:hover {
  background: #e9ecef;
  border-color: #1d9190;
  color: #1d9190;
}

@media (max-width: 768px) {
  .login-card {
    margin: 1rem;
    padding: 2rem 1.5rem;
  }

  .login-title {
    font-size: 1.5rem;
  }
}

@media (max-width: 576px) {
  .login-view {
    padding: 1rem 0.5rem;
  }

  .login-card {
    padding: 2rem 1rem;
  }

  .login-icon {
    width: 60px;
    height: 60px;
  }

  .login-icon i {
    font-size: 1.5rem;
  }
}
</style>
