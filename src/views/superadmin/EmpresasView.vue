<template>
  <v-container fluid class="pa-6 tw-scope">
    <!-- Header con stats -->
    <v-row class="mb-6">
      <v-col cols="12">
        <h2 class="text-h4 text-flexirol-primary">
          <v-icon class="me-2" size="32">mdi-office-building</v-icon>
          Gestión de Empresas

          <!-- Stats Chips (reemplazo de cards) -->

          <v-chip
            color="primary"
            class="ma-1"
            variant="tonal"
            size="large"
            :prepend-icon="'mdi-office-building'"
          >
            {{ companies.length }}
            <template #append>
              <span class="ml-1 text-lg">Empresas Registradas</span>
            </template>
          </v-chip>

          <v-chip
            color="success"
            class="ma-1"
            variant="tonal"
            size="large"
            :prepend-icon="'mdi-check-circle'"
          >
            {{ empresasActivas }}
            <template #append>
              <span class="ml-1 text-lg">Empresas Activas</span>
            </template>
          </v-chip>

          <v-chip
            class="ma-1"
            color="warning"
            variant="tonal"
            size="large"
            :prepend-icon="'mdi-file-excel-outline'"
          >
            {{ empresasSinExcel }}
            <template #append>
              <span class="ml-1 text-lg">Sin Excel Actualizado</span>
            </template>
          </v-chip>

          <v-chip
            variant="tonal"
            class="ma-1"
            size="large"
            color="info"
            :prepend-icon="'mdi-account-multiple'"
          >
            {{ globalStats.totalUsers }}
            <template #append>
              <span class="ml-1 text-lg">Total Usuarios Sistema</span>
            </template>
          </v-chip>
        </h2>
        <p class="text-subtitle-1 text-medium-emphasis">
          Administración completa de empresas y sus usuarios
        </p>
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
              variant="outlined"
              density="compact"
              clearable
            />
          </v-col>
          <v-col cols="12" md="2">
            <v-select
              v-model="status_habilitacion"
              :items="[
                { title: 'Todas', value: '' },
                { title: 'Solo Activas', value: 'true' },
                { title: 'Solo Bloqueadas', value: 'false' },
              ]"
              label="Estado"
              variant="outlined"
              density="compact"
            />
          </v-col>
          <v-col cols="12" md="2">
            <v-select
              v-model="status_excel"
              :items="[
                { title: 'Todas', value: '' },
                { title: 'Con Excel Actualizado', value: 'actualizado' },
                { title: 'Sin Excel', value: 'sin_excel' },
              ]"
              label="Estado Excel"
              variant="outlined"
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

        <div v-else-if="filteredCompanies.length === 0" class="text-center py-8">
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
            <v-pagination
              v-if="filteredCompanies.length > itemsPerPage"
              v-model="currentPage"
              :length="totalPages"
              rounded="circle"
              class="mt-4"
            />
            <v-col v-for="element in paginatedRows" :key="element.id" cols="12" md="4" lg="3">
              <v-card
                class="h-100 glass-morphism"
                :color="element.gearbox ? 'blue-grey-darken-3' : 'error'"
                :variant="element.gearbox ? 'text' : 'outlined'"
              >
                <v-card-text>
                  <!-- Header empresa -->
                  <div class="d-flex align-center mb-3">
                    <!-- Status -->

                    <v-avatar
                      :color="element.gearbox === 'true' ? 'success' : 'error'"
                      size="40"
                      class="me-3"
                    >
                      <v-icon color="white">
                        {{
                          element.gearbox === 'true'
                            ? 'mdi-office-building'
                            : 'mdi-office-building-outline'
                        }}
                      </v-icon>
                    </v-avatar>

                    <div class="flex-grow-1">
                      <div>
                        <span class="text-body-1 font-weight-bold">{{ element.first_name }} - </span
                        ><span class="text-body-2">{{ element.last_name }}</span>

                        <v-chip
                          v-if="isExcelVencido(element.fecha_excel)"
                          color="warning"
                          size="x-small"
                          class="ml-2"
                        >
                          <v-icon size="16" class="me-1">mdi-file-excel</v-icon>

                          Excel Vencido
                        </v-chip>

                        <v-chip v-else color="success" size="x-small" class="ml-2">
                          <v-icon size="16" class="me-1">mdi-file-excel</v-icon>

                          Ultima Actualizacion: {{ element.fecha_excel || 'No creado' }}
                        </v-chip>
                      </div>
                      <div class="text-body-2 text-medium-emphasis">
                        RUC: {{ element.cedula || 'No registrado' }}
                      </div>
                    </div>
                  </div>

                  <!-- Info empresa -->
                  <v-divider class="my-3" />

                  <div class="text-body-2 mb-2">
                    <v-icon size="16" class="me-1">mdi-email</v-icon>
                    {{ element.email }}

                    <v-icon size="16" class="me-1">mdi-calendar</v-icon>
                    Creado: {{ formatDate(element.user_registered) }}
                  </div>

                  <div class="text-body-2 mb-3"></div>

                  <!-- Acciones -->
                  <div class="d-flex gap-1">
                    <v-btn
                      size="x-small"
                      class="ma-1"
                      variant="tonal"
                      color="blue-grey-darken-2"
                      @click="viewUsers(element)"
                    >
                      <v-icon start size="16">mdi-account-multiple</v-icon>
                      Usuarios
                    </v-btn>
                    <v-btn
                      size="x-small"
                      class="ma-1"
                      variant="tonal"
                      color="secondary"
                      @click="startEdit(element)"
                    >
                      <v-icon start size="16">mdi-pencil</v-icon>
                      Editar
                    </v-btn>
                    <v-btn
                      size="x-small"
                      class="ma-1"
                      variant="tonal"
                      :color="element.gearbox ? 'warning' : 'success'"
                      @click="toggleStatus(element)"
                    >
                      <v-icon start size="16">
                        {{ element.gearbox ? 'mdi-lock' : 'mdi-lock-open' }}
                      </v-icon>
                      {{ element.gearbox ? 'Bloquear' : 'Activar' }}
                    </v-btn>
                    <v-btn
                      size="x-small"
                      class="ma-1"
                      variant="tonal"
                      color="error"
                      @click="startDelete(element)"
                    >
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
      <v-toolbar color="primary">
        <v-icon class="me-2">{{ isEditMode ? 'mdi-pencil' : 'mdi-plus' }}</v-icon>
        {{ isEditMode ? 'Editar Empresa' : 'Crear Nueva Empresa' }}
        <v-spacer></v-spacer>
      </v-toolbar>
      <v-card>
        <v-card-title color="primary" class="d-flex align-center"> </v-card-title>

        <v-card-subtitle>
          <v-alert v-if="!isEditMode" type="info" variant="tonal" class="mb-4">
            <strong>Tipo de usuario:</strong> Empresa (admin)
          </v-alert></v-card-subtitle
        >

        <v-card-text>
          <v-form ref="empresaForm" v-model="formValid">
            <v-row>
              <!-- Información empresa -->

              <v-col cols="12" md="6">
                <v-text-field
                  v-model="newItem.first_name"
                  label="Nombre Empresa *"
                  variant="outlined"
                  density="compact"
                  :rules="[rules.required]"
                  @input="computedUsername"
                />
              </v-col>

              <v-col cols="12" md="6">
                <v-text-field
                  v-model="newItem.last_name"
                  label="Sucursal/Sede"
                  variant="outlined"
                  density="compact"
                  @input="computedUsername"
                />
              </v-col>

              <v-col cols="12" md="6">
                <v-text-field
                  v-model="newItem.cedula"
                  label="Cedula/RUC (Opcional)"
                  variant="outlined"
                  density="compact"
                />
              </v-col>

              <!-- Phone Number -->
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="newItem.phone_number"
                  label="Teléfono"
                  placeholder="0999999999"
                  variant="outlined"
                  density="compact"
                />
              </v-col>

              <!-- Additional Company Fields -->
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="newItem.address"
                  label="Dirección"
                  variant="outlined"
                  density="compact"
                />
              </v-col>
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="newItem.city"
                  label="Ciudad"
                  variant="outlined"
                  density="compact"
                />
              </v-col>
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="newItem.state"
                  label="Provincia"
                  variant="outlined"
                  density="compact"
                />
              </v-col>
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="newItem.zip_code"
                  label="Código postal"
                  variant="outlined"
                  density="compact"
                />
              </v-col>

              <!-- Estado -->
              <v-col cols="12" md="6">
                <v-switch
                  v-model="newItem.gearbox"
                  label="Empresa habilitada"
                  density="compact"
                  color="success"
                  true-value="true"
                  false-value="false"
                />
              </v-col>

              <!-- DATOS DE PLANES FLEXIROL-->

              <v-col cols="12">
                <v-card variant="outlined" class="mb-4">
                  <v-card-title class="text-subtitle-1 font-weight-bold">
                    <v-icon class="me-2">mdi-account-cog</v-icon>
                    Plan Seleccionado Actualmente
                  </v-card-title>

                  <v-card-text>
                    <v-radio-group v-model="newItem.flexirol3" inline>
                      <v-radio
                        label="Plan 1 - Porcentaje sobre transacción"
                        value="1"
                        color="success"
                      ></v-radio>
                      <v-radio
                        label="Plan 2 - Valor fijo mensual"
                        value="2"
                        color="success"
                      ></v-radio>
                    </v-radio-group>

                    <v-row>
                      <!-- Plan 1 -->
                      <v-col cols="12" md="6">
                        <v-card
                          variant="outlined"
                          :color="newItem.flexirol3 === '1' ? 'primary' : undefined"
                        >
                          <v-card-text>
                            <div class="d-flex align-center mb-2">
                              <v-icon
                                :color="newItem.flexirol3 === '1' ? 'success' : 'error'"
                                class="me-2"
                              >
                                {{
                                  newItem.flexirol3 === '1'
                                    ? 'mdi-check-circle'
                                    : 'mdi-close-circle'
                                }}
                              </v-icon>
                              <span class="font-weight-bold">Plan 1</span>
                            </div>

                            <v-list density="compact">
                              <v-list-item>
                                <v-list-item-title
                                  >Valor del servicio: {{ newItem.flexirol }}%</v-list-item-title
                                >
                                <template v-slot:append>
                                  <v-btn
                                    variant="text"
                                    icon="mdi-plus"
                                    size="small"
                                    @click="newItem.flexirol += 1"
                                  ></v-btn>
                                  <v-btn
                                    variant="text"
                                    icon="mdi-minus"
                                    size="small"
                                    @click="newItem.flexirol -= 1"
                                  ></v-btn>
                                </template>
                              </v-list-item>
                            </v-list>
                          </v-card-text>
                        </v-card>
                      </v-col>

                      <!-- Plan 2 -->
                      <v-col cols="12" md="6">
                        <v-card
                          variant="outlined"
                          :color="newItem.flexirol3 === '2' ? 'primary' : undefined"
                        >
                          <v-card-text>
                            <div class="d-flex align-center mb-2">
                              <v-icon
                                :color="newItem.flexirol3 === '2' ? 'success' : 'error'"
                                class="me-2"
                              >
                                {{
                                  newItem.flexirol3 === '2'
                                    ? 'mdi-check-circle'
                                    : 'mdi-close-circle'
                                }}
                              </v-icon>
                              <span class="font-weight-bold">Plan 2</span>
                            </div>

                            <v-list density="compact" compact>
                              <v-list-item>
                                <v-list-item-title
                                  >Valor mensual: ${{ newItem.flexirol2 }}</v-list-item-title
                                >
                                <template v-slot:append>
                                  <v-btn
                                    variant="text"
                                    icon="mdi-plus"
                                    size="small"
                                    @click="newItem.flexirol2 += 1"
                                  ></v-btn>
                                  <v-btn
                                    variant="text"
                                    icon="mdi-minus"
                                    size="small"
                                    @click="newItem.flexirol2 -= 1"
                                  ></v-btn>
                                </template>
                              </v-list-item>
                            </v-list>
                          </v-card-text>
                        </v-card>
                      </v-col>
                    </v-row>
                  </v-card-text>
                </v-card>
              </v-col>

              <!-- Datos de acceso -->
              <v-col cols="12">
                <h6 class="text-h6 mb-3">
                  <v-icon class="me-2">mdi-account-key</v-icon>
                  Datos de Acceso
                </h6>
              </v-col>

              <v-col v-if="!isEditMode" cols="12">
                <v-text-field
                  v-model="newItem.email"
                  label="Email *"
                  variant="outlined"
                  density="compact"
                  :rules="[rules.required, rules.email]"
                />

                <v-text-field
                  v-model="newItem.username"
                  label="Usuario"
                  variant="outlined"
                  hint="Se genera automáticamente"
                  persistent-hint
                  density="compact"
                />

                <v-text-field
                  v-model="newItem.password"
                  label="Contraseña"
                  variant="outlined"
                  hint="Se genera automáticamente"
                  persistent-hint
                  density="compact"
                />
              </v-col>

              <v-col v-else cols="12">
                <v-row>
                  <v-col cols="12" md="4">
                    <v-text-field
                      v-model="newItem.email"
                      label="Email *"
                      variant="solo-filled"
                      readonly
                      density="compact"
                    />
                  </v-col>
                  <v-col cols="12" md="4">
                    <v-text-field
                      v-model="newItem.username"
                      label="Usuario"
                      readonly
                      density="compact"
                      variant="solo-filled"
                    />
                  </v-col>

                  <!-- Password reset button -->
                  <v-col cols="12" md="4">
                    <v-btn color="error" @click="showPasswordModal = true" variant="flat">
                      <v-icon start>mdi-lock-reset</v-icon>
                      Cambiar Contraseña
                    </v-btn>
                  </v-col>
                </v-row>
              </v-col>

              <!-- Configuración de Anticipos -->
              <v-col cols="12">
                <v-divider class="mb-4" />
                <h6 class="text-h6 mb-4">
                  <v-icon class="me-2">mdi-cog</v-icon>
                  Configuración de Anticipos
                </h6>
              </v-col>

              <v-row>
                <v-col cols="12" md="4">
                  <v-text-field
                    v-model.number="newItem.porcentaje"
                    label="Porcentaje máximo (%)"
                    variant="outlined"
                    type="number"
                    min="0"
                    max="100"
                    density="compact"
                    hint="Porcentaje máximo del sueldo disponible"
                    persistent-hint
                  />
                </v-col>

                <v-col cols="12" md="4">
                  <v-text-field
                    v-model.number="newItem.dia_inicio"
                    label="Día inicio de ciclo"
                    variant="outlined"
                    type="number"
                    density="compact"
                    min="1"
                    max="31"
                    hint="Día del mes que inicia el ciclo"
                    persistent-hint
                  />
                </v-col>

                <v-col cols="12" md="4">
                  <v-text-field
                    v-model.number="newItem.dia_cierre"
                    label="Día cierre de ciclo"
                    variant="outlined"
                    type="number"
                    density="compact"
                    min="1"
                    max="31"
                    hint="Día del mes que cierra el ciclo"
                    persistent-hint
                  />
                </v-col>

                <v-col cols="12" md="4">
                  <v-text-field
                    v-model.number="newItem.frecuencia"
                    label="Frecuencia máxima mensual"
                    variant="outlined"
                    type="number"
                    density="compact"
                    min="1"
                    max="10"
                    hint="Máximo anticipos por mes"
                    persistent-hint
                  />
                </v-col>

                <v-col cols="12" md="4">
                  <v-text-field
                    v-model.number="newItem.dia_bloqueo"
                    label="Días bloqueo antes cierre"
                    variant="outlined"
                    type="number"
                    density="compact"
                    min="0"
                    max="31"
                    hint="Días antes del cierre para bloquear solicitudes"
                    persistent-hint
                  />
                </v-col>

                <v-col cols="12" md="4">
                  <v-text-field
                    v-model.number="newItem.dia_reinicio"
                    label="Días para reiniciar"
                    variant="outlined"
                    type="number"
                    density="compact"
                    min="1"
                    max="31"
                    hint="Días después del pago para reiniciar"
                    persistent-hint
                  />
                </v-col>
              </v-row>
            </v-row>
          </v-form>
        </v-card-text>

        <v-card-actions>
          <v-spacer />
          <v-btn
            class="ma-1"
            variant="tonal"
            color="error"
            text="Cancelar"
            @click="closeCreateModal"
            :disabled="submitting"
          />
          <v-btn
            class="ma-1"
            variant="tonal"
            color="primary"
            text="Guardar"
            @click="save"
            :loading="submitting"
            :disabled="!formValid"
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
                variant="outlined"
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
                variant="outlined"
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
                  :color="elementUsuario.gearbox ? 'transparent' : 'error'"
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
                        {{ elementUsuario.email }}
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
                    <strong>Usuario:</strong> {{ elementUsuario.username }}
                  </div>

                  <div class="d-flex gap-1">
                    <v-btn
                      size="small"
                      variant="outlined"
                      color="secondary"
                      @click="startEditUsuario(elementUsuario)"
                    >
                      <v-icon start size="16">mdi-pencil</v-icon>
                      Editar
                    </v-btn>
                    <v-btn
                      size="small"
                      variant="outlined"
                      color="error"
                      @click="startDeleteUsuario(elementUsuario)"
                    >
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
      <v-toolbar color="success">
        <v-icon class="me-2">mdi-account-plus</v-icon>
        {{ isEditUserMode ? 'Editar Usuario' : 'Crear Nuevo Usuario' }}
        <v-spacer></v-spacer>
      </v-toolbar>
      <v-card>
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
                  variant="outlined"
                  :rules="[rules.required]"
                  @input="computedUsernameUsuario"
                />
              </v-col>

              <v-col cols="12" md="6">
                <v-text-field
                  v-model="newUsuario.last_name"
                  label="Apellido *"
                  variant="outlined"
                  :rules="[rules.required]"
                  @input="computedUsernameUsuario"
                />
              </v-col>

              <v-col cols="12">
                <v-text-field
                  v-model="newUsuario.email"
                  label="Email *"
                  variant="outlined"
                  :rules="[rules.required, rules.email]"
                />
              </v-col>

              <v-col cols="12" md="6">
                <v-text-field
                  v-model="newUsuario.cedula"
                  label="Cédula *"
                  variant="outlined"
                  :rules="[rules.required, rules.cedula]"
                  @input="computedUsernameUsuario"
                />
              </v-col>

              <v-col cols="12" md="6">
                <v-text-field
                  v-model.number="newUsuario.disponible"
                  label="Monto Disponible"
                  variant="outlined"
                  type="number"
                  min="0"
                />
              </v-col>

              <v-col cols="12" md="6">
                <v-text-field v-model="newUsuario.city" label="Ciudad" variant="outlined" />
              </v-col>

              <v-col cols="12" md="6">
                <v-text-field v-model="newUsuario.address" label="Dirección" variant="outlined" />
              </v-col>

              <v-col cols="12" md="6">
                <v-text-field
                  v-model="newUsuario.username"
                  label="Usuario"
                  variant="outlined"
                  readonly
                  hint="Se genera automáticamente"
                  persistent-hint
                />
              </v-col>

              <v-col cols="12" md="6">
                <v-text-field
                  v-model="newUsuario.password"
                  label="Contraseña"
                  variant="outlined"
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
            color="blue-darken-1"
            text
            @click="saveUsuario"
            :loading="submittingUser"
            :disabled="!userFormValid"
          >
            {{ isEditUserMode ? 'Guardar Cambios' : 'Crear Usuario' }}
          </v-btn>
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

    <!-- Modal Cambiar Contraseña -->
    <v-dialog v-model="showPasswordModal" max-width="500px">
      <v-toolbar color="error">
        <v-icon class="me-2">mdi-key</v-icon>
        Cambiar contraseña
        <v-spacer></v-spacer>
      </v-toolbar>

      <v-card>
        <v-card-text>
          <v-text-field
            v-model="newPassword"
            label="Nueva contraseña"
            type="password"
            :rules="passwordRules"
            variant="outlined"
          />
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn @click="showPasswordModal = false">Cancelar</v-btn>
          <v-btn color="primary" @click="changePassword" :disabled="!newPassword"> Guardar </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useUsersStore } from '@/stores/users'
import { useSystemConfigStore } from '@/stores/systemConfig'

// Stores
const usersStore = useUsersStore()
const systemConfigStore = useSystemConfigStore()

// ========== STATE ========== (Refactored for Pinia Store)(estructura del legacy) ==========
const filter = ref('')
const status_habilitacion = ref('')
const status_excel = ref('')
const filter_usuarios = ref('')
const status_habilitacion_usuarios = ref('')
const loading = ref(false)
const empresa_info_set = ref([])
const loadingUsers = ref(false)
const submitting = ref(false)
const submittingUser = ref(false)
const deleting = ref(false)

// Modal states
const showCreateModal = ref(false)
const showUsersModal = ref(false)
const showCreateUserModal = ref(false)

const showDeleteModal = ref(false)
const isEditMode = ref(false)
const isEditUserMode = ref(false)
const selectedEmpresa = ref(null)

// 1. Añadir estado reactivo para el modal y nueva contraseña
const showPasswordModal = ref(false)
const newPassword = ref('')
const passwordRules = [
  (v) => !!v || 'Contraseña requerida',
  (v) => (v && v.length >= 8) || 'Mínimo 8 caracteres',
]

// Form validation
const formValid = ref(false)
const userFormValid = ref(false)

// Current page
const currentPage = ref(1)
const itemsPerPage = ref(20)
const globalStats = computed(() => ({
  totalUsers: usersStore.users.length,
}))

// Forms (actualizado según esquema PocketBase)
const newItem = ref({
  first_name: '',
  last_name: '',
  email: '',
  username: '',
  password: '',
  role: 'empresa',
  gearbox: true,
  cedula: '',
  company_id: '',
  phone_number: '',
  // Campos de configuración empresa (valores default del sistema):
  flexirol: 10, // Plan 1: porcentaje
  flexirol2: 50, // Plan 2: valor fijo
  flexirol3: '1', // Plan activo
})

const newUsuario = ref({
  first_name: '',
  last_name: '',
  email: '', // Cambiado de user_email
  username: '', // Cambiado de user_login
  password: '', // Cambiado de user_pass
  role: 'usuario',
  gearbox: true, // Booleano, no string
  cedula: '',
  disponible: 0,
  company_id: '', // Cambiado de empresa
  city: '', // Cambiado de ciudad
  address: '', // Cambiado de direccion
  // Eliminados: nacimiento, gender (no existen en el esquema)
})

const deleteItem = ref({
  first_name: '',
  last_name: '',
  email: '',
  username: '',
  tipo: 'empresa',
})

// Alert system
const alert = ref({
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
const empresasActivas = computed(() => {
  return usersStore.empresas.filter((e) => e.gearbox === 'true' || e.gearbox === true).length
})

const empresasSinExcel = computed(() => {
  return usersStore.empresas.filter((e) => !e.last_excel_upload).length
})

const totalEmpresas = computed(() => {
  return empresa_info_set.value?.length || 0 // ✅ Operador opcional
})
// Filtros
const companies = computed(() => usersStore.empresas)

const showAlert = (message, variant = 'success') => {
  alert.value.message = message
  alert.value.variant = variant
  alert.value.show = true
}

const formatDate = (dateString) => {
  if (!dateString) return 'No registrado'
  return new Date(dateString).toLocaleDateString('es-EC', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

const computedUsername = () => {
  const userLogin = `${newItem.value.first_name}_${newItem.value.last_name}`
    .replace(/\s+/g, '_')
    .toUpperCase()
  newItem.value.username = userLogin
  newItem.value.password = userLogin
}

const computedUsernameUsuario = () => {
  const userLogin =
    `${newUsuario.value.first_name}_${newUsuario.value.last_name}_${newUsuario.value.cedula}`
      .replace(/\s+/g, '_')
      .toUpperCase()
  newUsuario.value.username = userLogin
  newUsuario.value.password = userLogin
}

const filteredCompanies = computed(() => {
  let filtered = companies.value

  if (filter.value) {
    const lowerFilter = filter.value.toLowerCase()
    filtered = filtered.filter(
      (row) =>
        row.first_name.toLowerCase().includes(lowerFilter) ||
        row.last_name.toLowerCase().includes(lowerFilter) ||
        (row.cedula && row.cedula.includes(lowerFilter)) ||
        (row.company_name && row.company_name.toLowerCase().includes(lowerFilter)),
    )
  }

  if (status_habilitacion.value) {
    filtered = filtered.filter((row) => String(row.gearbox) === status_habilitacion.value)
  }

  if (status_excel.value) {
    if (status_excel.value === 'actualizado') {
      filtered = filtered.filter((row) => row.last_excel_upload)
    } else if (status_excel.value === 'sin_excel') {
      filtered = filtered.filter((row) => !row.last_excel_upload)
    }
  }

  return filtered
})

const usuarios_empresa_info_set = ref([])

const filteredRowsUsuarios = computed(() => {
  let filtered = usuarios_empresa_info_set.value

  if (filter_usuarios.value) {
    const search = filter_usuarios.value.toLowerCase()
    filtered = filtered.filter(
      (element) =>
        element.first_name?.toLowerCase().includes(search) ||
        element.last_name?.toLowerCase().includes(search) ||
        element.email?.toLowerCase().includes(search) ||
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
const totalPages = computed(() => {
  return Math.ceil(filteredCompanies.value.length / itemsPerPage.value)
})

const paginatedRows = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value
  const end = start + itemsPerPage.value
  return filteredCompanies.value.slice(start, end)
})

// ========== METHODS ==========

// REEMPLAZAR computed property
const isExcelVencido = (fechaExcel) => {
  if (!fechaExcel || fechaExcel === 'No creado') return true

  try {
    // Parsear fecha en formato DD/MM/YYYY
    const [day, month, year] = fechaExcel.split('/')
    const excelDate = new Date(`${year}-${month}-${day}`)

    // Obtener fecha de cierre del mes anterior (día 28)
    const hoy = new Date()
    const prevMonthClose = new Date(hoy.getFullYear(), hoy.getMonth() - 1, 28)

    return excelDate < prevMonthClose
  } catch {
    // Si hay error en el parsing, considerar como vencido
    return true
  }
}

const openCreateModal = async () => {
  const defaultConfig = await systemConfigStore.fetchConfig()

  isEditMode.value = false
  newItem.value = {
    first_name: '',
    last_name: '',
    email: '',
    cedula: '',
    phone_number: '',
    gearbox: 'true',
    ...defaultConfig,
  }

  showCreateModal.value = true
}

const startEdit = (company) => {
  isEditMode.value = true
  newItem.value = { ...company, gearbox: String(company.gearbox) }
  showCreateModal.value = true
}

const closeCreateModal = () => {
  showCreateModal.value = false
}

const save = async () => {
  if (!formValid.value) return

  submitting.value = true
  try {
    const data = { ...newItem.value }
    data.gearbox = data.gearbox === 'true'

    if (isEditMode.value) {
      await usersStore.updateUser(data.id, data)
      showAlert('Empresa actualizada exitosamente')
    } else {
      data.role = 'empresa'
      // Ensure company_name is set if not provided
      if (!data.company_name) {
        data.company_name = `${data.first_name} ${data.last_name}`.trim()
      }
      await usersStore.createUser(data)
      showAlert('Empresa creada exitosamente')
    }
    closeCreateModal()
  } catch (error) {
    console.error('Error saving empresa:', error)
    showAlert(`Error al guardar empresa: ${error.message}`, 'error')
  } finally {
    submitting.value = false
  }
}

const toggleStatus = async (element) => {
  try {
    const newStatus = !(element.gearbox === 'true')
    await usersStore.updateUser(element.id, { gearbox: newStatus })
    showAlert(`Empresa ${newStatus ? 'activada' : 'bloqueada'} exitosamente`)
  } catch (error) {
    console.error('Error toggling status:', error)
    showAlert('Error al cambiar estado', 'error')
  }
}

const viewUsers = async (empresa) => {
  if (!empresa?.id) {
    showAlert('Empresa no válida', 'error')
    return
  }

  loadingUsers.value = true
  selectedEmpresa.value = empresa

  console.log('Empresa seleccionada:', empresa)

  try {
    usuarios_empresa_info_set.value = usersStore.getEmpresaUsers(empresa.id)

    console.log('Usuarios de la empresa:', usuarios_empresa_info_set.value)
    console.log('usuarios de la empresa filtrada:', usersStore.getEmpresaUsers(empresa.id))
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
  status_habilitacion_usuarios.value = ''
}

const openCreateUserModal = () => {
  isEditUserMode.value = false
  newUsuario.value = {
    first_name: '',
    last_name: '',
    email: '',
    cedula: '',
    disponible: 1000,
    gearbox: 'true',
    password: '',
    username: '',
  }
  showCreateUserModal.value = true
}

const closeCreateUserModal = () => {
  showCreateUserModal.value = false
}

const saveUsuario = async () => {
  if (!userFormValid.value) return

  submittingUser.value = true
  try {
    if (isEditUserMode.value) {
      const { id, ...updateData } = newUsuario.value
      updateData.gearbox = updateData.gearbox === 'true'
      await usersStore.updateUser(id, updateData)
      showAlert('Usuario actualizado exitosamente')
    } else {
      await usersStore.createUser({
        ...newUsuario.value,
        company_id: selectedEmpresa.value.id,
        role: 'empleado',
        emailVisibility: true,
        gearbox: newUsuario.value.gearbox === 'true',
      })
      showAlert('Usuario creado exitosamente')
    }
    closeCreateUserModal()
    await viewUsers(selectedEmpresa.value)
  } catch (error) {
    console.error('Error saving user:', error)
    showAlert('Error al guardar usuario', 'error')
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
      await usersStore.deleteCompanyAndItsUsers(deleteItem.value.id)
      showAlert('Empresa y sus usuarios han sido eliminados.')
    } else {
      await usersStore.deleteUser(deleteItem.value.id)
      showAlert('Usuario eliminado exitosamente')
      if (selectedEmpresa.value) {
        await viewUsers(selectedEmpresa.value) // Refresh user list for the company
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
  // Use newUsuario form for editing as well
  newUsuario.value = { ...element, gearbox: String(element.gearbox) }
  showCreateUserModal.value = true // Open the unified modal
}

// 2. Método para cambiar contraseña

const changePassword = async () => {
  try {
    if (!newPassword.value) return

    await usersStore.updateUserPassword(newItem.value.id, newPassword.value)
    showAlert('Contraseña actualizada correctamente')
    showPasswordModal.value = false
    newPassword.value = ''
  } catch (error) {
    showAlert('Error al cambiar contraseña', 'error')
    console.error('Error changing password:', error)
  }
}

// ========== LIFECYCLE ==========
const loadEmpresas = async (forceRefresh = false) => {
  loading.value = true
  try {
    // Cargar cache completo si no existe
    await usersStore.fetchUsers({}, forceRefresh)

    // Filtrar empresas localmente y agregar info extra
    empresa_info_set.value = usersStore.empresas.map((empresa) => ({
      ...empresa,
      user_count: usersStore.getEmpresaUsers(empresa.id).length,
      user_registered: empresa.created,
    }))
  } catch (error) {
    console.error('Error:', error)
    showAlert('Error al cargar empresas', 'error')
  } finally {
    loading.value = false
  }
}

// ✅ AGREGAR al final del script:
onMounted(async () => {
  await loadEmpresas(false) // Carga inicial
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
