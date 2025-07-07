<template>
  <div class="login-view">
    <div class="container-fluid px-0">
      <div class="row g-0">
        <div class="col-12 col-lg-6 mx-auto">
          <div class="login-card">
            <!-- User Icon -->
            <div class="login-icon">
              <i class="fas fa-user"></i>
            </div>

            <!-- Title -->
            <p class="text-center p-0 m-0 text-black-50 text-opacity-50">FlexiRol</p>
            <h2 class="login-title">Sign In</h2>

            <!-- Form -->
            <form @submit.prevent="handleLogin" class="login-form">
              <!-- Email -->
              <div class="form-group">
                <div class="input-group">
                  <span class="input-icon">
                    <i class="fas fa-user"></i>
                  </span>
                  <input
                    id="email"
                    v-model="form.email"
                    type="email"
                    class="form-control"
                    :class="{ 'is-invalid': errors.email }"
                    placeholder="Username"
                    required
                    autocomplete="email"
                  />
                </div>
                <div v-if="errors.email" class="invalid-feedback">{{ errors.email }}</div>
              </div>

              <!-- Password -->
              <div class="form-group">
                <div class="input-group">
                  <span class="input-icon">
                    <i class="fas fa-lock"></i>
                  </span>
                  <input
                    id="password"
                    v-model="form.password"
                    :type="showPassword ? 'text' : 'password'"
                    class="form-control"
                    :class="{ 'is-invalid': errors.password }"
                    placeholder="Password"
                    required
                    autocomplete="current-password"
                  />
                  <button
                    type="button"
                    class="password-toggle"
                    @click="showPassword = !showPassword"
                  >
                    <i :class="showPassword ? 'fas fa-eye-slash' : 'fas fa-eye'"></i>
                  </button>
                </div>
                <div v-if="errors.password" class="invalid-feedback">{{ errors.password }}</div>
              </div>

              <!-- Remember Me -->
              <div class="form-check">
                <input
                  id="remember"
                  v-model="form.remember"
                  type="checkbox"
                  class="form-check-input"
                />
                <label class="form-check-label" for="remember"> Remember me </label>
              </div>

              <!-- Error Message -->
              <div v-if="authStore.error" class="alert alert-danger">
                <i class="fas fa-exclamation-triangle me-2"></i>
                {{ authStore.error }}
              </div>

              <!-- Submit Button -->
              <button
                type="submit"
                class="btn btn-login"
                :disabled="!isFormValid || authStore.isLoading"
              >
                <span
                  v-if="authStore.isLoading"
                  class="spinner-border spinner-border-sm me-2"
                ></span>
                <i v-else class="fas fa-sign-in-alt me-2"></i>
                {{ authStore.isLoading ? 'Iniciando sesión...' : 'Login' }}
              </button>
            </form>

            <!-- Test Users -->
            <div class="test-users">
              <div class="test-divider">
                <span>Test Users</span>
              </div>
              <div class="test-buttons">
                <button
                  v-for="testUser in testUsers"
                  :key="testUser.email"
                  type="button"
                  class="btn btn-test"
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
