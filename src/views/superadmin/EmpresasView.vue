<template>
  <v-container fluid class="pa-6">
    <!-- Header con stats -->
    <v-row class="mb-6">
      <v-col cols="12">
        <h1 class="text-h4 font-weight-bold mb-2">
          <v-icon class="text-primary me-3" size="32">mdi-office-building</v-icon>
          Gestión de Empresas
        </h1>
        <p class="text-body-1 text-medium-emphasis">
          Administración completa de empresas y sus usuarios
        </p>
      </v-col>
    </v-row>

    <!-- Stats Cards (del legacy) -->
    <v-row class="mb-6">
      <v-col cols="12" md="3">
        <v-card class="pa-4 text-center" color="primary" variant="tonal">
          <v-icon size="40" class="mb-2">mdi-office-building</v-icon>
          <div class="text-h4 font-weight-bold text-primary">{{ empresa_info_set.length }}</div>
          <div class="text-body-2">Empresas Registradas</div>
        </v-card>
      </v-col>
      <v-col cols="12" md="3">
        <v-card class="pa-4 text-center" color="success" variant="tonal">
          <v-icon size="40" class="mb-2">mdi-check-circle</v-icon>
          <div class="text-h4 font-weight-bold text-success">{{ empresasActivas }}</div>
          <div class="text-body-2">Empresas Activas</div>
        </v-card>
      </v-col>
      <v-col cols="12" md="3">
        <v-card class="pa-4 text-center" color="info" variant="tonal">
          <v-icon size="40" class="mb-2">mdi-account-tie</v-icon>
          <div class="text-h4 font-weight-bold text-info">{{ totalPropietarios }}</div>
          <div class="text-body-2">Propietarios</div>
        </v-card>
      </v-col>
      <v-col cols="12" md="3">
        <v-card class="pa-4 text-center" color="warning" variant="tonal">
          <v-icon size="40" class="mb-2">mdi-account-multiple</v-icon>
          <div class="text-h4 font-weight-bold text-warning">{{ totalUsuarios }}</div>
          <div class="text-body-2">Total Usuarios</div>
        </v-card>
      </v-col>
    </v-row>

    <!-- Filtros y controles (del legacy) -->
    <v-card class="mb-6">
      <v-card-text>
        <v-row>
          <v-col cols="12" md="4">
            <v-text-field
              v-model="filter"
              label="Filtrar por empresa, RUC o propietario"
              prepend-inner-icon="mdi-magnify"
              density="compact"
              clearable
            />
          </v-col>
          <v-col cols="12" md="3">
            <v-select
              v-model="status_habilitacion"
              :items="[
                { title: 'Todas', value: '' },
                { title: 'Solo Activas', value: 'true' },
                { title: 'Solo Bloqueadas', value: 'false' },
              ]"
              label="Estado"
              density="compact"
            />
          </v-col>
          <v-col cols="12" md="3">
            <v-select
              v-model="status_excel"
              :items="[
                { title: 'Todas', value: '' },
                { title: 'Con Excel Actualizado', value: 'actualizado' },
                { title: 'Sin Excel', value: 'sin_excel' },
              ]"
              label="Estado Excel"
              density="compact"
            />
          </v-col>
          <v-col cols="12" md="2">
            <v-btn color="primary" size="large" block @click="openCreateModal" :loading="loading">
              <v-icon start>mdi-plus</v-icon>
              Crear Empresa
            </v-btn>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>

    <!-- Tabla de empresas (estructura del legacy) -->
    <v-card>
      <v-card-text>
        <div v-if="loading" class="text-center py-8">
          <v-progress-circular indeterminate color="primary" />
          <p class="text-body-2 mt-2">Cargando empresas...</p>
        </div>

        <div v-else-if="filteredRows.length === 0" class="text-center py-8">
          <v-icon size="64" class="text-medium-emphasis mb-4">mdi-office-building-outline</v-icon>
          <h3 class="text-h6 mb-2">No hay empresas registradas</h3>
          <p class="text-body-2 text-medium-emphasis mb-4">Crea la primera empresa para comenzar</p>
          <v-btn color="primary" @click="openCreateModal">
            <v-icon start>mdi-plus</v-icon>
            Crear Primera Empresa
          </v-btn>
        </div>

        <div v-else>
          <!-- Empresas Grid (del legacy con cards) -->
          <v-row>
            <v-col
              v-for="(element, index) in paginatedRows"
              :key="element.id"
              cols="12"
              md="6"
              lg="4"
            >
              <v-card
                class="h-100"
                :color="element.gearbox ? 'glass-morphism' : 'error'"
                :variant="element.gearbox ? 'outlined' : 'tonal'"
              >
                <v-card-text>
                  <!-- Header empresa -->
                  <div class="d-flex align-center mb-3">
                    <v-avatar :color="element.gearbox ? 'success' : 'error'" size="40" class="me-3">
                      <v-icon color="white">
                        {{
                          element.gearbox ? 'mdi-office-building' : 'mdi-office-building-outline'
                        }}
                      </v-icon>
                    </v-avatar>
                    <div class="flex-grow-1">
                      <div class="text-body-1 font-weight-bold">
                        {{ element.first_name }} {{ element.last_name }}
                      </div>
                      <div class="text-body-2 text-medium-emphasis">
                        RUC: {{ element.ruc || 'No registrado' }}
                      </div>
                    </div>
                  </div>

                  <!-- Info empresa -->
                  <v-divider class="my-3" />

                  <div class="text-body-2 mb-2">
                    <v-icon size="16" class="me-1">mdi-email</v-icon>
                    {{ element.user_email }}
                  </div>

                  <div class="text-body-2 mb-2">
                    <v-icon size="16" class="me-1">mdi-calendar</v-icon>
                    Creado: {{ formatDate(element.user_registered) }}
                  </div>

                  <div class="text-body-2 mb-3">
                    <v-icon size="16" class="me-1">mdi-file-excel</v-icon>
                    Excel: {{ element.fecha_excel || 'No creado' }}
                    <v-chip
                      v-if="isExcelVencido(element.fecha_excel)"
                      color="warning"
                      size="x-small"
                      class="ml-2"
                    >
                      Vencido
                    </v-chip>
                  </div>

                  <!-- Status -->
                  <div class="d-flex align-center mb-3">
                    <v-chip
                      :color="element.gearbox ? 'success' : 'error'"
                      size="small"
                      variant="tonal"
                    >
                      <v-icon start size="16">
                        {{ element.gearbox ? 'mdi-check-circle' : 'mdi-close-circle' }}
                      </v-icon>
                      {{ element.gearbox ? 'Activa' : 'Bloqueada' }}
                    </v-chip>
                  </div>

                  <!-- Acciones -->
                  <div class="d-flex gap-1">
                    <v-btn size="small" color="primary" @click="viewUsers(element)">
                      <v-icon start size="16">mdi-account-multiple</v-icon>
                      Usuarios
                    </v-btn>
                    <v-btn size="small" color="secondary" @click="startEdit(element)">
                      <v-icon start size="16">mdi-pencil</v-icon>
                      Editar
                    </v-btn>
                    <v-btn
                      size="small"
                      :color="element.gearbox ? 'warning' : 'success'"
                      @click="toggleStatus(element)"
                    >
                      <v-icon start size="16">
                        {{ element.gearbox ? 'mdi-lock' : 'mdi-lock-open' }}
                      </v-icon>
                      {{ element.gearbox ? 'Bloquear' : 'Activar' }}
                    </v-btn>
                    <v-btn size="small" color="error" @click="startDelete(element)">
                      <v-icon start size="16">mdi-delete</v-icon>
                      Eliminar
                    </v-btn>
                  </div>
                </v-card-text>
              </v-card>
            </v-col>
          </v-row>

          <!-- Paginación -->
          <div v-if="totalPages > 1" class="d-flex justify-center mt-6">
            <v-pagination v-model="currentPage" :length="totalPages" :total-visible="7" />
          </div>
        </div>
      </v-card-text>
    </v-card>

    <!-- Modal Crear/Editar Empresa (estructura del legacy) -->
    <v-dialog v-model="showCreateModal" max-width="700px" persistent>
      <v-card>
        <v-card-title class="d-flex align-center">
          <v-icon class="me-2">{{ isEditMode ? 'mdi-pencil' : 'mdi-plus' }}</v-icon>
          {{ isEditMode ? 'Editar Empresa' : 'Crear Nueva Empresa' }}
        </v-card-title>

        <v-card-text>
          <v-form ref="empresaForm" v-model="formValid">
            <!-- Tipo de usuario (del legacy) -->
            <v-alert v-if="!isEditMode" type="info" variant="tonal" class="mb-4">
              <strong>Tipo de usuario:</strong> Empresa (Propietario)
            </v-alert>

            <v-row>
              <!-- Información empresa -->
              <v-col cols="12">
                <h6 class="text-h6 mb-3">
                  <v-icon class="me-2">mdi-office-building</v-icon>
                  Información de la Empresa
                </h6>
              </v-col>

              <v-col cols="12" md="6">
                <v-text-field
                  v-model="newItem.first_name"
                  label="Nombre Empresa *"
                  :rules="[rules.required]"
                  @input="computedUsername"
                />
              </v-col>

              <v-col cols="12" md="6">
                <v-text-field
                  v-model="newItem.last_name"
                  label="Sucursal/Sede"
                  @input="computedUsername"
                />
              </v-col>

              <v-col cols="12" md="6">
                <v-text-field
                  v-model="newItem.user_email"
                  label="Email *"
                  :rules="[rules.required, rules.email]"
                />
              </v-col>

              <v-col cols="12" md="6">
                <v-text-field v-model="newItem.ruc" label="RUC (Opcional)" />
              </v-col>

              <!-- Datos de acceso -->
              <v-col cols="12">
                <h6 class="text-h6 mb-3">
                  <v-icon class="me-2">mdi-account-key</v-icon>
                  Datos de Acceso
                </h6>
              </v-col>

              <v-col cols="12" md="6">
                <v-text-field
                  v-model="newItem.user_login"
                  label="Usuario"
                  readonly
                  hint="Se genera automáticamente"
                  persistent-hint
                />
              </v-col>

              <v-col cols="12" md="6">
                <v-text-field
                  v-model="newItem.user_pass"
                  label="Contraseña"
                  readonly
                  hint="Se genera automáticamente"
                  persistent-hint
                />
              </v-col>

              <!-- Estado -->
              <v-col cols="12">
                <v-switch
                  v-model="newItem.gearbox"
                  label="Empresa habilitada"
                  color="success"
                  true-value="true"
                  false-value="false"
                />
              </v-col>
            </v-row>
          </v-form>
        </v-card-text>

        <v-card-actions>
          <v-spacer />
          <v-btn text="Cancelar" @click="closeCreateModal" :disabled="submitting" />
          <v-btn
            color="primary"
            text="Guardar"
            @click="saveEmpresa"
            :loading="submitting"
            :disabled="!formValid"
          />
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Modal Editar Usuario (del legacy) -->
    <v-dialog v-model="showEditUserModal" max-width="600px" persistent>
      <v-card>
        <v-card-title class="d-flex align-center">
          <v-icon class="me-2">mdi-account-edit</v-icon>
          Editar Usuario: {{ editedUsuario.first_name }} {{ editedUsuario.last_name }}
        </v-card-title>

        <v-card-text>
          <v-form ref="editUsuarioForm" v-model="editUserFormValid">
            <v-row>
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="editedUsuario.first_name"
                  label="Nombre *"
                  :rules="[rules.required]"
                />
              </v-col>

              <v-col cols="12" md="6">
                <v-text-field
                  v-model="editedUsuario.last_name"
                  label="Apellido *"
                  :rules="[rules.required]"
                />
              </v-col>

              <v-col cols="12">
                <v-text-field
                  v-model="editedUsuario.user_email"
                  label="Email *"
                  :rules="[rules.required, rules.email]"
                />
              </v-col>

              <v-col cols="12" md="6">
                <v-text-field
                  v-model="editedUsuario.cedula"
                  label="Cédula *"
                  :rules="[rules.required, rules.cedula]"
                />
              </v-col>

              <v-col cols="12" md="6">
                <v-text-field
                  v-model.number="editedUsuario.disponible"
                  label="Monto Disponible"
                  type="number"
                  min="0"
                />
              </v-col>

              <v-col cols="12" md="6">
                <v-text-field v-model="editedUsuario.ciudad" label="Ciudad" />
              </v-col>

              <v-col cols="12" md="6">
                <v-text-field v-model="editedUsuario.direccion" label="Dirección" />
              </v-col>

              <v-col cols="12" md="6">
                <v-text-field
                  v-model="editedUsuario.nacimiento"
                  label="Fecha de Nacimiento"
                  type="date"
                />
              </v-col>

              <v-col cols="12" md="6">
                <v-select
                  v-model="editedUsuario.gender"
                  :items="[
                    { title: 'Masculino', value: 'M' },
                    { title: 'Femenino', value: 'F' },
                    { title: 'Otro', value: 'O' },
                  ]"
                  label="Género"
                />
              </v-col>

              <v-col cols="12">
                <v-switch
                  v-model="editedUsuario.gearbox"
                  label="Usuario habilitado"
                  color="success"
                  true-value="true"
                  false-value="false"
                />
              </v-col>
            </v-row>
          </v-form>
        </v-card-text>

        <v-card-actions>
          <v-spacer />
          <v-btn text="Cancelar" @click="closeEditUserModal" :disabled="submittingUser" />
          <v-btn
            color="primary"
            text="Actualizar Usuario"
            @click="saveEditedUsuario"
            :loading="submittingUser"
            :disabled="!editUserFormValid"
          />
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Modal Usuarios Empresa (estructura del legacy) -->
    <v-dialog v-model="showUsersModal" max-width="1200px">
      <v-card v-if="selectedEmpresa">
        <v-card-title class="d-flex align-center">
          <v-icon class="me-2">mdi-account-multiple</v-icon>
          Usuarios de {{ selectedEmpresa.first_name }} {{ selectedEmpresa.last_name }}
        </v-card-title>

        <v-card-text>
          <!-- Filtros usuarios -->
          <v-row class="mb-4">
            <v-col cols="12" md="4">
              <v-text-field
                v-model="filter_usuarios"
                label="Filtrar usuarios"
                prepend-inner-icon="mdi-magnify"
                density="compact"
                clearable
              />
            </v-col>
            <v-col cols="12" md="3">
              <v-select
                v-model="status_habilitacion_usuarios"
                :items="[
                  { title: 'Todos', value: '' },
                  { title: 'Habilitados', value: 'true' },
                  { title: 'Bloqueados', value: 'false' },
                ]"
                label="Estado Usuario"
                density="compact"
              />
            </v-col>
            <v-col cols="12" md="3">
              <v-btn color="primary" @click="openCreateUserModal" :loading="loadingUsers" block>
                <v-icon start>mdi-plus</v-icon>
                Crear Usuario
              </v-btn>
            </v-col>
          </v-row>

          <!-- Lista usuarios -->
          <div v-if="loadingUsers" class="text-center py-8">
            <v-progress-circular indeterminate color="primary" />
            <p class="text-body-2 mt-2">Cargando usuarios...</p>
          </div>

          <div v-else-if="filteredRowsUsuarios.length > 0">
            <v-row>
              <v-col
                v-for="elementUsuario in filteredRowsUsuarios"
                :key="elementUsuario.id"
                cols="12"
                md="6"
                lg="4"
              >
                <v-card
                  class="pa-3"
                  :color="elementUsuario.gearbox ? 'glass-morphism' : 'error'"
                  :variant="elementUsuario.gearbox ? 'outlined' : 'tonal'"
                >
                  <!-- Header usuario -->
                  <div class="d-flex align-center mb-2">
                    <v-avatar
                      :color="elementUsuario.gearbox ? 'success' : 'error'"
                      size="40"
                      class="me-3"
                    >
                      <v-icon color="white">
                        {{ elementUsuario.gearbox ? 'mdi-account-check' : 'mdi-account-cancel' }}
                      </v-icon>
                    </v-avatar>
                    <div class="flex-grow-1">
                      <div class="text-body-1 font-weight-medium">
                        {{ elementUsuario.first_name }} {{ elementUsuario.last_name }}
                      </div>
                      <div class="text-body-2 text-medium-emphasis">
                        {{ elementUsuario.user_email }}
                      </div>
                    </div>
                  </div>

                  <v-divider class="my-2" />

                  <div class="text-body-2 mb-1">
                    <strong>Cédula:</strong> {{ elementUsuario.cedula || 'No registrada' }}
                  </div>
                  <div class="text-body-2 mb-1">
                    <strong>Disponible:</strong> ${{ elementUsuario.disponible || 0 }}
                  </div>
                  <div class="text-body-2 mb-3">
                    <strong>Usuario:</strong> {{ elementUsuario.user_login }}
                  </div>

                  <div class="d-flex gap-1">
                    <v-btn size="small" color="secondary" @click="startEditUsuario(elementUsuario)">
                      <v-icon start size="16">mdi-pencil</v-icon>
                      Editar
                    </v-btn>
                    <v-btn size="small" color="error" @click="startDeleteUsuario(elementUsuario)">
                      <v-icon start size="16">mdi-delete</v-icon>
                      Eliminar
                    </v-btn>
                  </div>
                </v-card>
              </v-col>
            </v-row>
          </div>

          <div v-else class="text-center py-8">
            <v-icon size="64" class="text-medium-emphasis mb-4">mdi-account-off</v-icon>
            <h3 class="text-h6 mb-2">No hay usuarios registrados</h3>
            <p class="text-body-2 text-medium-emphasis mb-4">
              Esta empresa aún no tiene usuarios registrados
            </p>
            <v-btn color="primary" @click="openCreateUserModal">
              <v-icon start>mdi-plus</v-icon>
              Crear Primer Usuario
            </v-btn>
          </div>
        </v-card-text>

        <v-card-actions>
          <v-spacer />
          <v-btn text="Cerrar" @click="closeUsersModal" />
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Modal Crear Usuario (estructura del legacy) -->
    <v-dialog v-model="showCreateUserModal" max-width="600px" persistent>
      <v-card>
        <v-card-title class="d-flex align-center">
          <v-icon class="me-2">mdi-account-plus</v-icon>
          Crear Usuario para {{ selectedEmpresa?.first_name }}
        </v-card-title>

        <v-card-text>
          <v-form ref="usuarioForm" v-model="userFormValid">
            <v-alert type="info" variant="tonal" class="mb-4">
              <strong>Tipo de usuario:</strong> Personal (Empleado)
            </v-alert>

            <v-row>
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="newUsuario.first_name"
                  label="Nombre *"
                  :rules="[rules.required]"
                  @input="computedUsernameUsuario"
                />
              </v-col>

              <v-col cols="12" md="6">
                <v-text-field
                  v-model="newUsuario.last_name"
                  label="Apellido *"
                  :rules="[rules.required]"
                  @input="computedUsernameUsuario"
                />
              </v-col>

              <v-col cols="12">
                <v-text-field
                  v-model="newUsuario.user_email"
                  label="Email *"
                  :rules="[rules.required, rules.email]"
                />
              </v-col>

              <v-col cols="12" md="6">
                <v-text-field
                  v-model="newUsuario.cedula"
                  label="Cédula *"
                  :rules="[rules.required, rules.cedula]"
                  @input="computedUsernameUsuario"
                />
              </v-col>

              <v-col cols="12" md="6">
                <v-text-field
                  v-model.number="newUsuario.disponible"
                  label="Monto Disponible"
                  type="number"
                  min="0"
                />
              </v-col>

              <v-col cols="12" md="6">
                <v-text-field v-model="newUsuario.ciudad" label="Ciudad" />
              </v-col>

              <v-col cols="12" md="6">
                <v-text-field v-model="newUsuario.direccion" label="Dirección" />
              </v-col>

              <v-col cols="12" md="6">
                <v-text-field
                  v-model="newUsuario.nacimiento"
                  label="Fecha de Nacimiento"
                  type="date"
                />
              </v-col>

              <v-col cols="12" md="6">
                <v-select
                  v-model="newUsuario.gender"
                  :items="[
                    { title: 'Masculino', value: 'M' },
                    { title: 'Femenino', value: 'F' },
                    { title: 'Otro', value: 'O' },
                  ]"
                  label="Género"
                />
              </v-col>

              <v-col cols="12" md="6">
                <v-text-field
                  v-model="newUsuario.user_login"
                  label="Usuario"
                  readonly
                  hint="Se genera automáticamente"
                  persistent-hint
                />
              </v-col>

              <v-col cols="12" md="6">
                <v-text-field
                  v-model="newUsuario.user_pass"
                  label="Contraseña"
                  readonly
                  hint="Se genera automáticamente"
                  persistent-hint
                />
              </v-col>

              <v-col cols="12">
                <v-switch
                  v-model="newUsuario.gearbox"
                  label="Usuario habilitado"
                  color="success"
                  true-value="true"
                  false-value="false"
                />
              </v-col>
            </v-row>
          </v-form>
        </v-card-text>

        <v-card-actions>
          <v-spacer />
          <v-btn text="Cancelar" @click="closeCreateUserModal" :disabled="submittingUser" />
          <v-btn
            color="primary"
            text="Crear Usuario"
            @click="saveUsuario"
            :loading="submittingUser"
            :disabled="!userFormValid"
          />
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Modal Confirmación Eliminar -->
    <v-dialog v-model="showDeleteModal" max-width="500px">
      <v-card>
        <v-card-title class="d-flex align-center text-error">
          <v-icon class="me-2">mdi-alert-circle</v-icon>
          Confirmar Eliminación
        </v-card-title>

        <v-card-text>
          <div v-if="deleteItem.tipo === 'empresa'">
            <p class="text-body-1 mb-3">
              ¿Está seguro que desea eliminar la empresa
              <strong>{{ deleteItem.first_name }} {{ deleteItem.last_name }}</strong
              >?
            </p>
            <v-alert type="warning" variant="tonal" class="mb-3">
              <strong>¡Atención!</strong> Esto eliminará la empresa y todos sus usuarios. Esta
              acción no se puede deshacer.
            </v-alert>
          </div>

          <div v-else>
            <p class="text-body-1">
              ¿Está seguro que desea eliminar al usuario
              <strong>{{ deleteItem.first_name }} {{ deleteItem.last_name }}</strong
              >?
            </p>
            <v-alert type="warning" variant="tonal" class="mt-3">
              Esta acción no se puede deshacer.
            </v-alert>
          </div>
        </v-card-text>

        <v-card-actions>
          <v-spacer />
          <v-btn text="Cancelar" @click="closeDeleteModal" :disabled="deleting" />
          <v-btn color="error" text="Eliminar" @click="proceedDelete" :loading="deleting" />
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Toast Notifications -->
    <v-snackbar v-model="alert.show" :color="alert.variant" :timeout="5000" location="top right">
      {{ alert.message }}
      <template #actions>
        <v-btn color="white" variant="text" @click="alert.show = false"> Cerrar </v-btn>
      </template>
    </v-snackbar>
  </v-container>
</template>

<script setup>
import { ref, computed, onMounted, reactive } from 'vue'
import { useCompaniesStore } from '@/stores/companies'
import { useUsersStore } from '@/stores/users'
import { useSystemStore } from '@/stores/system'

// Stores
const companiesStore = useCompaniesStore()
const usersStore = useUsersStore()
const systemStore = useSystemStore()

// ========== DATA (estructura del legacy) ==========
const filter = ref('')
const status_habilitacion = ref('')
const status_excel = ref('')
const filter_usuarios = ref('')
const status_habilitacion_usuarios = ref('')

const empresa_info_set = ref([])
const usuarios_empresa_info_set = ref([])

const loading = ref(false)
const loadingUsers = ref(false)
const submitting = ref(false)
const submittingUser = ref(false)
const deleting = ref(false)

// Modal states
const showCreateModal = ref(false)
const showUsersModal = ref(false)
const showCreateUserModal = ref(false)
const showEditUserModal = ref(false)
const showDeleteModal = ref(false)
const isEditMode = ref(false)
const isEditUserMode = ref(false)
const selectedEmpresa = ref(null)

// Form validation
const formValid = ref(false)
const userFormValid = ref(false)
const editUserFormValid = ref(false)

// Current page
const currentPage = ref(1)
const itemsPerPage = 20

// Forms (estructura del legacy)
const newItem = reactive({
  first_name: '',
  last_name: '',
  user_email: '',
  user_login: '',
  user_pass: '',
  role: 'empresa',
  gearbox: 'true',
  ruc: '',
  empresa: '',
})

const newUsuario = reactive({
  first_name: '',
  last_name: '',
  user_email: '',
  user_login: '',
  user_pass: '',
  role: 'usuario',
  gearbox: 'true',
  cedula: '',
  disponible: 0,
  empresa: '',
  ciudad: '',
  direccion: '',
  nacimiento: '',
  gender: '',
})

const editedUsuario = reactive({
  id: '',
  first_name: '',
  last_name: '',
  user_email: '',
  user_login: '',
  user_pass: '',
  role: 'usuario',
  gearbox: 'true',
  cedula: '',
  disponible: 0,
  empresa: '',
  ciudad: '',
  direccion: '',
  nacimiento: '',
  gender: '',
})

const deleteItem = ref({
  first_name: '',
  last_name: '',
  user_email: '',
  user_login: '',
  tipo: 'empresa',
})

// Alert system
const alert = reactive({
  show: false,
  message: '',
  variant: 'success',
})

// Validation rules (del legacy)
const rules = {
  required: (value) => !!value || 'Este campo es requerido',
  email: (value) => {
    const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return pattern.test(value) || 'Email inválido'
  },
  cedula: (value) => {
    const pattern = /^[0-9]{10}$/
    return pattern.test(value) || 'Cédula debe tener 10 dígitos'
  },
}

// ========== COMPUTED (del legacy) ==========
const empresasActivas = computed(
  () => empresa_info_set.value.filter((e) => e.gearbox === 'true' || e.gearbox === true).length,
)

const totalPropietarios = computed(() => empresa_info_set.value.length)

const totalUsuarios = computed(() => {
  return empresa_info_set.value.reduce((sum, empresa) => {
    return sum + (empresa.user_count || 0)
  }, 0)
})

// Filtros (del legacy)
const filteredRows = computed(() => {
  let filtered = empresa_info_set.value

  if (filter.value) {
    const search = filter.value.toLowerCase()
    filtered = filtered.filter(
      (element) =>
        element.first_name?.toLowerCase().includes(search) ||
        element.last_name?.toLowerCase().includes(search) ||
        element.user_email?.toLowerCase().includes(search) ||
        element.ruc?.toLowerCase().includes(search),
    )
  }

  if (status_habilitacion.value) {
    filtered = filtered.filter((element) => String(element.gearbox) === status_habilitacion.value)
  }

  if (status_excel.value === 'sin_excel') {
    filtered = filtered.filter(
      (element) => !element.fecha_excel || element.fecha_excel === 'No creado',
    )
  } else if (status_excel.value === 'actualizado') {
    filtered = filtered.filter(
      (element) =>
        element.fecha_excel &&
        element.fecha_excel !== 'No creado' &&
        !isExcelVencido(element.fecha_excel),
    )
  }

  return filtered
})

const filteredRowsUsuarios = computed(() => {
  let filtered = usuarios_empresa_info_set.value

  if (filter_usuarios.value) {
    const search = filter_usuarios.value.toLowerCase()
    filtered = filtered.filter(
      (element) =>
        element.first_name?.toLowerCase().includes(search) ||
        element.last_name?.toLowerCase().includes(search) ||
        element.user_email?.toLowerCase().includes(search) ||
        element.cedula?.toLowerCase().includes(search),
    )
  }

  if (status_habilitacion_usuarios.value) {
    filtered = filtered.filter(
      (element) => String(element.gearbox) === status_habilitacion_usuarios.value,
    )
  }

  return filtered
})

// Paginación
const totalPages = computed(() => Math.ceil(filteredRows.value.length / itemsPerPage))

const paginatedRows = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage
  return filteredRows.value.slice(start, start + itemsPerPage)
})

// ========== METHODS (del legacy) ==========

// Validación Excel vencido (del legacy)
const isExcelVencido = (fechaExcel) => {
  if (!fechaExcel || fechaExcel === 'No creado') {
    return true
  }

  const hoy = new Date()
  const hoyMes = hoy.getMonth()
  const hoyAnio = hoy.getFullYear()

  const cierreMesAnterior = new Date(hoyAnio, hoyMes, 28)

  const res = fechaExcel.split('/')
  const diaExcel = new Date(`${res[1]}/${res[0]}/${res[2]}`)

  return diaExcel < cierreMesAnterior
}

// Username computation (del legacy)
const computedUsername = () => {
  const userLogin = `${newItem.first_name}_${newItem.last_name}`.replace(/\s+/g, '_').toUpperCase()

  newItem.user_login = userLogin
  newItem.user_pass = userLogin
}

const computedUsernameUsuario = () => {
  const userLogin = `${newUsuario.first_name}_${newUsuario.last_name}_${newUsuario.cedula}`
    .replace(/\s+/g, '_')
    .toUpperCase()

  newUsuario.user_login = userLogin
  newUsuario.user_pass = userLogin
}

// Alert system
const showAlert = (message, variant = 'success') => {
  alert.message = message
  alert.variant = variant
  alert.show = true
}

// Format date
const formatDate = (dateString) => {
  if (!dateString) return 'No registrado'
  return new Date(dateString).toLocaleDateString('es-EC', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

// ========== CRUD OPERATIONS (del legacy) ==========

const loadEmpresas = async () => {
  loading.value = true
  try {
    await companiesStore.fetchCompanies()

    // Mapear a estructura legacy
    empresa_info_set.value = companiesStore.companies.map((company) => ({
      ...company,
      // Mapear campos del owner a nivel de empresa (legacy style)
      first_name: company.expand?.owner_id?.first_name || company.company_name || '',
      last_name: company.expand?.owner_id?.last_name || '',
      user_email: company.expand?.owner_id?.email || '',
      user_login: company.expand?.owner_id?.username || '',
      user_registered: company.expand?.owner_id?.created || company.created,
      gearbox: String(company.gearbox),
      user_count: company.users_count || 0,
    }))
  } catch (error) {
    console.error('Error loading empresas:', error)
    showAlert('Error al cargar empresas', 'error')
  } finally {
    loading.value = false
  }
}

const openCreateModal = () => {
  isEditMode.value = false
  Object.assign(newItem, {
    first_name: '',
    last_name: '',
    user_email: '',
    user_login: '',
    user_pass: '',
    role: 'empresa',
    gearbox: 'true',
    ruc: '',
    empresa: '',
  })
  showCreateModal.value = true
}

const startEdit = (element) => {
  isEditMode.value = true
  Object.assign(newItem, {
    id: element.id,
    first_name: element.first_name,
    last_name: element.last_name,
    user_email: element.user_email,
    user_login: element.user_login,
    user_pass: '',
    role: 'empresa',
    gearbox: String(element.gearbox),
    ruc: element.ruc || '',
  })
  showCreateModal.value = true
}

const closeCreateModal = () => {
  showCreateModal.value = false
  selectedEmpresa.value = null
}

const saveEmpresa = async () => {
  if (!formValid.value) return

  submitting.value = true
  try {
    let result
    if (isEditMode.value) {
      result = await companiesStore.updateCompany(newItem.id, {
        nombre: newItem.first_name,
        ruc: newItem.ruc,
        gearbox: newItem.gearbox === 'true',
      })
    } else {
      result = await companiesStore.createCompanyWithOwner(
        {
          nombre: newItem.first_name,
          ruc: newItem.ruc,
          gearbox: newItem.gearbox === 'true',
        },
        {
          first_name: newItem.first_name,
          last_name: newItem.last_name,
          email: newItem.user_email,
          user_login: newItem.user_login,
          user_pass: newItem.user_pass,
          gearbox: newItem.gearbox === 'true',
        },
      )
    }

    if (result.success) {
      showAlert(
        isEditMode.value ? 'Empresa actualizada exitosamente' : 'Empresa creada exitosamente',
      )
      closeCreateModal()
      await loadEmpresas()
    } else {
      showAlert(result.error || 'Error al guardar empresa', 'error')
    }
  } catch (error) {
    console.error('Error saving empresa:', error)
    showAlert('Error al guardar empresa', 'error')
  } finally {
    submitting.value = false
  }
}

const toggleStatus = async (element) => {
  try {
    const newStatus = !element.gearbox
    await companiesStore.updateCompany(element.id, {
      gearbox: newStatus,
    })

    element.gearbox = String(newStatus)
    showAlert(`Empresa ${newStatus ? 'activada' : 'bloqueada'} exitosamente`)
  } catch (error) {
    console.error('Error toggling status:', error)
    showAlert('Error al cambiar estado', 'error')
  }
}

const viewUsers = async (element) => {
  selectedEmpresa.value = element
  loadingUsers.value = true

  try {
    const hierarchy = await companiesStore.fetchCompanyUsersHierarchy(element.id)

    // Mapear a estructura legacy
    usuarios_empresa_info_set.value = hierarchy.employees.map((user) => ({
      ...user,
      gearbox: String(user.gearbox),
    }))

    showUsersModal.value = true
  } catch (error) {
    console.error('Error loading users:', error)
    showAlert('Error al cargar usuarios', 'error')
  } finally {
    loadingUsers.value = false
  }
}

const closeUsersModal = () => {
  showUsersModal.value = false
  selectedEmpresa.value = null
  filter_usuarios.value = ''
  status_habilitacion_usuarios.value = ''
}

const openCreateUserModal = () => {
  Object.assign(newUsuario, {
    first_name: '',
    last_name: '',
    user_email: '',
    user_login: '',
    user_pass: '',
    role: 'usuario',
    gearbox: 'true',
    cedula: '',
    disponible: 0,
    empresa: selectedEmpresa.value?.id || '',
  })
  showCreateUserModal.value = true
}

const closeCreateUserModal = () => {
  showCreateUserModal.value = false
}

const saveUsuario = async () => {
  if (!userFormValid.value || !selectedEmpresa.value) return

  submittingUser.value = true
  try {
    const result = await companiesStore.createUserForCompany(selectedEmpresa.value.id, {
      first_name: newUsuario.first_name,
      last_name: newUsuario.last_name,
      user_email: newUsuario.user_email,
      cedula: newUsuario.cedula,
      disponible: newUsuario.disponible,
      user_login: newUsuario.user_login,
      user_pass: newUsuario.user_pass,
      gearbox: newUsuario.gearbox === 'true',
    })

    if (result.success) {
      showAlert('Usuario creado exitosamente')
      closeCreateUserModal()
      await viewUsers(selectedEmpresa.value) // Refresh users
      await loadEmpresas() // Refresh companies
    } else {
      showAlert(result.error || 'Error al crear usuario', 'error')
    }
  } catch (error) {
    console.error('Error creating user:', error)
    showAlert('Error al crear usuario', 'error')
  } finally {
    submittingUser.value = false
  }
}

const startDelete = (element) => {
  Object.assign(deleteItem.value, {
    ...element,
    tipo: 'empresa',
  })
  showDeleteModal.value = true
}

const startDeleteUsuario = (element) => {
  Object.assign(deleteItem.value, {
    ...element,
    tipo: 'usuario',
  })
  showDeleteModal.value = true
}

const closeDeleteModal = () => {
  showDeleteModal.value = false
}

const proceedDelete = async () => {
  deleting.value = true
  try {
    if (deleteItem.value.tipo === 'empresa') {
      const result = await companiesStore.deleteCompanyWithUsers(deleteItem.value.id)
      if (result.success) {
        showAlert(`Empresa eliminada. Se eliminaron ${result.deletedUsers} usuarios.`)
        await loadEmpresas()
      } else {
        showAlert(result.error || 'Error al eliminar empresa', 'error')
      }
    } else {
      await usersStore.deleteUser(deleteItem.value.id)
      showAlert('Usuario eliminado exitosamente')
      if (selectedEmpresa.value) {
        await viewUsers(selectedEmpresa.value)
        await loadEmpresas()
      }
    }
  } catch (error) {
    console.error('Error deleting:', error)
    showAlert('Error al eliminar', 'error')
  } finally {
    deleting.value = false
    closeDeleteModal()
  }
}

const startEditUsuario = (element) => {
  isEditUserMode.value = true
  Object.assign(editedUsuario, {
    id: element.id,
    first_name: element.first_name,
    last_name: element.last_name,
    user_email: element.user_email || element.email,
    user_login: element.user_login || element.username,
    cedula: element.cedula,
    disponible: element.disponible,
    ciudad: element.ciudad || element.city || '',
    direccion: element.direccion || element.address || '',
    nacimiento: element.nacimiento || element.birth_date || '',
    gender: element.gender || '',
    gearbox: String(element.gearbox),
  })
  showEditUserModal.value = true
}

const closeEditUserModal = () => {
  showEditUserModal.value = false
  isEditUserMode.value = false
}

const saveEditedUsuario = async () => {
  if (!editUserFormValid.value) return

  submittingUser.value = true
  try {
    const updateData = {
      first_name: editedUsuario.first_name,
      last_name: editedUsuario.last_name,
      email: editedUsuario.user_email,
      cedula: editedUsuario.cedula,
      disponible: editedUsuario.disponible,
      city: editedUsuario.ciudad,
      address: editedUsuario.direccion,
      birth_date: editedUsuario.nacimiento,
      gender: editedUsuario.gender,
      gearbox: editedUsuario.gearbox === 'true',
    }

    await usersStore.updateUser(editedUsuario.id, updateData)
    showAlert('Usuario actualizado exitosamente')
    closeEditUserModal()

    if (selectedEmpresa.value) {
      await viewUsers(selectedEmpresa.value)
      await loadEmpresas()
    }
  } catch (error) {
    console.error('Error updating user:', error)
    showAlert('Error al actualizar usuario', 'error')
  } finally {
    submittingUser.value = false
  }
}

// ========== LIFECYCLE ==========
onMounted(() => {
  loadEmpresas()
})
</script>

<style scoped>
.v-card {
  transition: all 0.2s ease-in-out;
}

.v-card:hover {
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.12);
}
</style>
