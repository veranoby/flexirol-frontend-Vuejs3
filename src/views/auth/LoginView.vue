<template>
  <div class="login-container">
    <div class="row justify-content-center">
      <div class="col-md-6 col-lg-4">
        <div class="card shadow">
          <div class="card-body p-4">
            <div class="text-center mb-4">
              <h2 class="text-primary">FlexiRol</h2>
              <p class="text-muted">Inicia sesión en tu cuenta</p>
            </div>

            <form @submit.prevent="handleLogin">
              <!-- Email -->
              <div class="mb-3">
                <label for="email" class="form-label">Email</label>
                <input
                  id="email"
                  v-model="form.email"
                  type="email"
                  class="form-control"
                  :class="{ 'is-invalid': errors.email }"
                  placeholder="tu@email.com"
                  required
                  autocomplete="email"
                />
                <div v-if="errors.email" class="invalid-feedback">
                  {{ errors.email }}
                </div>
              </div>

              <!-- Password -->
              <div class="mb-3">
                <label for="password" class="form-label">Contraseña</label>
                <div class="input-group">
                  <input
                    id="password"
                    v-model="form.password"
                    :type="showPassword ? 'text' : 'password'"
                    class="form-control"
                    :class="{ 'is-invalid': errors.password }"
                    placeholder="Tu contraseña"
                    required
                    autocomplete="current-password"
                  />
                  <button
                    type="button"
                    class="btn btn-outline-secondary"
                    @click="showPassword = !showPassword"
                  >
                    <i :class="showPassword ? 'fas fa-eye-slash' : 'fas fa-eye'"></i>
                  </button>
                </div>
                <div v-if="errors.password" class="invalid-feedback">
                  {{ errors.password }}
                </div>
              </div>

              <!-- Remember me -->
              <div class="mb-3 form-check">
                <input
                  id="remember"
                  v-model="form.remember"
                  type="checkbox"
                  class="form-check-input"
                />
                <label for="remember" class="form-check-label"> Recordarme </label>
              </div>

              <!-- Error message -->
              <div v-if="authStore.error" class="alert alert-danger" role="alert">
                <i class="fas fa-exclamation-triangle me-2"></i>
                {{ authStore.error }}
              </div>

              <!-- Submit button -->
              <button
                type="submit"
                class="btn btn-primary w-100"
                :disabled="authStore.isLoading || !isFormValid"
              >
                <span
                  v-if="authStore.isLoading"
                  class="spinner-border spinner-border-sm me-2"
                ></span>
                <i v-else class="fas fa-sign-in-alt me-2"></i>
                {{ authStore.isLoading ? 'Iniciando sesión...' : 'Iniciar Sesión' }}
              </button>
            </form>

            <!-- Test users -->
            <div class="mt-4 p-3 bg-light rounded">
              <h6 class="text-muted mb-2">Usuarios de prueba:</h6>
              <div class="d-grid gap-2">
                <button
                  v-for="testUser in testUsers"
                  :key="testUser.email"
                  type="button"
                  class="btn btn-outline-secondary btn-sm"
                  @click="fillTestUser(testUser)"
                >
                  <i :class="testUser.icon" class="me-2"></i>
                  {{ testUser.label }}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
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
    email: 'admin@flexirol.com',
    password: 'admin123',
    label: 'Superadmin',
    icon: 'fas fa-crown',
  },
  {
    email: 'empresa@test.com',
    password: 'empresa123',
    label: 'Empresa',
    icon: 'fas fa-building',
  },
  {
    email: 'usuario@test.com',
    password: 'usuario123',
    label: 'Usuario',
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
    // Redirect based on role
    const role = authStore.userRole
    switch (role) {
      case 'superadmin':
        router.push('/superadmin/usuarios')
        break
      case 'empresa':
      case 'operador':
        router.push('/admin/usuarios')
        break
      case 'usuario':
        router.push('/usuario/solicitudes')
        break
      default:
        router.push('/dashboard')
    }
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
.login-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  background: linear-gradient(135deg, #3a6a77 0%, #1d9190 50%, #a8d1cb 100%);
  padding: 20px;
}

.card {
  border: none;
  border-radius: 10px;
}

.btn-outline-secondary {
  border-color: #dee2e6;
}

.bg-light {
  background-color: #f8f9fa !important;
}

.text-primary {
  color: #0d6efd !important;
}

.form-control:focus {
  border-color: #86b7fe;
  box-shadow: 0 0 0 0.25rem rgba(13, 110, 253, 0.25);
}

.btn-primary {
  background-color: #0d6efd;
  border-color: #0d6efd;
}

.btn-primary:hover {
  background-color: #0b5ed7;
  border-color: #0a58ca;
}
</style>
