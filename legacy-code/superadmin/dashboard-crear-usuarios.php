<?php


add_shortcode( 'crear_usuarios_superadmin', function () {

 //Add my Vue code for the page
	
  wp_enqueue_script('crear_usuarios_vue_superadmin');

 ?> 

	<div id="crear_usuarios_superadmin"> <!-- DIV CON EL ID QUE CARGARA EL VUE -->

<!-- SPINNERS Y ALERTAS -->

<div v-if="loading" >
		<div class="loading">
<b-spinner variant="success" label="Spinning"></b-spinner>
		</div>
</div>

<div v-else>
<!-- request finished -->
</div>


<div v-cloak>
    <b-alert
      :show="dismissCountDown"
      dismissible
      class="position-fixed fixed-top rounded-0"
      style="z-index: 2000;"      
      fade
	:variant="alertvariant"
      @dismissed="dismissCountDown=0"
      @dismiss-count-down="countDownChanged"
    >
    <br>
    <br>  <h1><strong> {{mensaje_alerta}}... </strong></h1> 
    <hr>
    </b-alert>
</div>	

<!-- EDITAR USUARIO EN MODAL -->

<b-modal v-cloak id='modal-editar' title="Editar usuario" hide-footer size="xl">
	<div class="row">

		<div class="col-sm-4">
				<span><i class="fas fa-user-tie"></i> Nombre*: </span><br>
				<b-form-input placeholder='Nombre de Empresa' :value='edited_item.first_name | capitalize' @input="value => edited_item.first_name = value"></b-form-input>
		</div>
		<div class="col-sm-4">
				<span v-if='edited_item.role == "empresa"'><i class="fas fa-street-view"></i> Sucursal: <br></span>
				<span v-else><i class="fas fa-user-tag"></i> Apellido*: <br></span>		
				<b-form-input placeholder='Ingrese aqui' :value='edited_item.last_name | capitalize' @input="value => edited_item.last_name = value"></b-form-input>
		</div>

		<div class="col-sm-4">
				<span><i class="fas fa-id-badge"></i> Username: {{edited_item.user_login}}</span><br>

				<span>Usuario Habilitado: </span>
				<input type='radio' value=true v-model='edited_item.gearbox'/>
				<span>Bloqueado: </span>
				<input type='radio' value=false v-model='edited_item.gearbox'/>

		</div>	

		<div class="col-sm-4">
				<span><i class="fas fa-envelope"></i> Email*:</span><br>
				<b-form-input placeholder='Ingrese email' v-model.trim='edited_item.user_email'></b-form-input>
		</div>
		<div class="col-sm-4">
			<span><i class="fas fa-phone"></i> Telefono: </span><br>
				<b-form-input placeholder='Ingrese telefono' v-model.trim='edited_item.phone_number'></b-form-input>
		</div>
		<div class="col-sm-4">
			<span><i class="fas fa-map-marker-alt"></i> Ciudad: </span><br>
				<b-form-input placeholder='Ingrese ciudad' :value='edited_item.city | capitalize' @input="value => edited_item.city = value"></b-form-input>
		</div>
		<div class="col-sm-8">
			<span><i class="fas fa-location-arrow"></i> Direccion: </span><br>
				<b-form-input placeholder='Ingrese direccion' :value='edited_item.address | capitalize' @input="value => edited_item.address = value"></b-form-input>
		</div>

<!-- exclusivo usuario empleado -->

		<div v-if='edited_item.role == "usuario"' class="col-sm-12 row">

					<div class="col-sm-4">
						<span><i class="far fa-id-card"></i> Cedula*: <br></span>
							<b-form-input placeholder='Ingrese cedula' v-model.trim='edited_item.cedula'></b-form-input>
					</div>
					<div class="col-sm-4">
						<span><i class="fas fa-birthday-cake"></i> Fecha de nacimiento: </span>
							<b-form-datepicker :date-format-options="{ year: 'numeric', month: 'numeric', day: 'numeric' }" size="sm" v-model='edited_item.birth_date'></b-form-datepicker>
					</div>
		<div class="col-sm-4">
				<span>Masculino: </span>
				<input type='radio' value=true v-model='edited_item.gender'/><br>
				<span>Femenino: </span>
				<input type='radio' value=false v-model='edited_item.gender'/>

		</div>

				<div class="col-sm-12"><hr></div>

				<div class="col-sm-4">
					<span>Monto habilitado: <b>$</b>

					<button class="btn btn-outline-secondary no-border" id='peticiones'><i class="fas fa-question-circle"></i></button>
					
					</span>

<b-tooltip target="peticiones"><i class="fas fa-exclamation-triangle"></i> Importante: este valor no representa el total disponible para el usuario.<br>(el valor final sera calculado segun porcentaje de disponibilidad, dia del mes, demanda actual..)</b-tooltip>	<br>		

					<b-form-input placeholder='ingrese monto' v-model.trim='edited_item.disponible'></b-form-input>
				</div>					

		</div>		


	<div v-if='edited_item.role == "empresa"' class=" col-sm-12">
	<div class=" col-sm-6">
			<h5 class="col-sm-12 principal">Plan Seleccionado Actualmente para este Usuario:</h5>
		<div class="col-sm-12">
		      <b-form-radio v-model="edited_item.flexirol3"  value="1">Plan 1</b-form-radio>
		      <b-form-radio v-model="edited_item.flexirol3"  value="2">Plan 2</b-form-radio>
		</div>

	</div>
	<div class="row col-sm-6" v-if='edited_item.role == "usuario" && edited_item.flexirol3 =="2"'>
			<h5 class="col-sm-12 principal">Estado del Plan actual:</h5>
		<div class="col-sm-6">
		      <b-form-radio v-model="edited_item.flexirol4"  value="si">Activo</b-form-radio>
		</div>		
		<div class="col-sm-6">
		      <b-form-radio v-model="edited_item.flexirol4"  value="no">Cancelado</b-form-radio>
		</div>

	</div>
				<div class="col-sm-12"><hr></div>	
	</div>


<!-- exclusivo usuario empresa -->

	<div v-if='edited_item.role == "empresa"' class="col-sm-12 row">

		<div class="col-sm-12 principal">
			<h4><i class="fas fa-percentage"></i> Configuracion General de costo del Servicio</h4>
		</div>

		<div class="col-sm-6 row">
			<h5 class="col-sm-12">Plan 1: Porcentaje sobre la transaccion 

<i v-if='edited_item.flexirol3 == "1"' class="fa-solid fa-square-check fa-2xl" style="color: green;"></i>
<i v-else class="fa-solid fa-xmark fa-2xl" style="color: red;"></i>

			</h5>


		<div class="col-sm-5">
				Valor del servicio FlexiRol
		</div>
		<div class="col-sm-3">
				{{edited_item.flexirol}}% del Anticipo
		</div>		
		<div class="col-sm-3" >
				<b-button variant="outline-primary" class='no-border' v-on:click="edited_item.flexirol += 1 , check_edit()"><i class="fas fa-plus-square"></i></b-button>
				<b-button variant="outline-danger" class='no-border' v-on:click="edited_item.flexirol -= 1 , check_edit()"><i class="fas fa-minus-square"></i></b-button>
		</div>
		</div>

		<div class="col-sm-6 row">
			<h5 class="col-sm-12">Plan 2: Valor fijo/pago mensual recurrente

<i v-if='edited_item.flexirol3 == "2"' class="fa-solid fa-square-check fa-2xl" style="color: green;"></i>
<i v-else class="fa-solid fa-xmark fa-2xl" style="color: red;"></i>


			</h5>


		<div class="col-sm-5">
				Valor del servicio FlexiRol
		</div>
		<div class="col-sm-3">
			${{edited_item.flexirol2}} / mensual
		</div>		
		<div class="col-sm-3" >
				<b-button variant="outline-primary" class='no-border' v-on:click="edited_item.flexirol2 += 1 , check_edit()"><i class="fas fa-plus-square"></i></b-button>
				<b-button variant="outline-danger" class='no-border' v-on:click="edited_item.flexirol2 -= 1 , check_edit()"><i class="fas fa-minus-square"></i></b-button>
		</div>
		</div>



				<div class="col-sm-12"><hr></div>

		<div class="col-sm-12 principal">
			<h4><i class="fas fa-hand-holding-usd"></i> Configuracion del ciclo de Anticipos mensual</h4>
		</div>

		<div class="col-sm-3">
				Dia de inicio de ciclo
		</div>
		<div class="col-sm-2">
				{{edited_item.dia_inicio}} de cada mes
		</div>		
		<div class="col-sm-2">
				<b-button variant="outline-primary" class='no-border' v-on:click="edited_item.dia_inicio += 1 , check_edit()"><i class="fas fa-plus-square"></i></b-button>
				<b-button variant="outline-danger" class='no-border' v-on:click="edited_item.dia_inicio -= 1 , check_edit()"><i class="fas fa-minus-square"></i></b-button>
		</div>
		<div class="col-sm-5">
		</div>


		<div class="col-sm-3">
				Dia de cierre de ciclo
		</div>
		<div class="col-sm-2">
				{{edited_item.dia_cierre}} de cada mes
		</div>
		<div class="col-sm-2">
				<b-button variant="outline-primary" class='no-border' v-on:click="edited_item.dia_cierre += 1 , check_edit()"><i class="fas fa-plus-square"></i></b-button>
				<b-button variant="outline-danger" class='no-border' v-on:click="edited_item.dia_cierre -= 1 , check_edit()"><i class="fas fa-minus-square"></i></b-button>
		</div>
		<div class="col-sm-5">
		</div>
		
		<div class="col-sm-3">
				Porcentaje del monto maximo 
		</div>
		<div class="col-sm-2">
				{{edited_item.porcentaje}} %
		</div>
		<div class="col-sm-2">
				<b-button variant="outline-primary" class='no-border' v-on:click="edited_item.porcentaje += 1 , check_edit()"><i class="fas fa-plus-square"></i></b-button>
				<b-button variant="outline-danger" class='no-border' v-on:click="edited_item.porcentaje -= 1 , check_edit()"><i class="fas fa-minus-square"></i></b-button>
		</div>
		<div class="col-sm-5">
		</div>
		
		<div class="col-sm-3">
				Bloqueo de peticion
		</div>		
		<div class="col-sm-2">
				{{edited_item.dia_bloqueo}} (dias)
		</div>		
		<div class="col-sm-2">
				<b-button variant="outline-primary" class='no-border' v-on:click="edited_item.dia_bloqueo += 1 , check_edit()"><i class="fas fa-plus-square"></i></b-button>
				<b-button variant="outline-danger" class='no-border' v-on:click="edited_item.dia_bloqueo -= 1 , check_edit()"><i class="fas fa-minus-square"></i></b-button>
				<button class="btn btn-outline-secondary no-border" id='peticiones'><i class="fas fa-question-circle"></i></button>
		</div>
		<div class="col-sm-5">

				<b-tooltip target="peticiones">las solicitudes de peticiones iniciaran y se bloquearan este numero de dias dentro de su ciclo de Anticipos mensual</b-tooltip>
		</div>		
		
		<div class="col-sm-3">
				Frecuencia maxima de Anticipos por ciclo 
		</div>
		<div class="col-sm-2">
				{{edited_item.frecuencia}} solicitudes mensuales
		</div>		<div class="col-sm-2">
				<b-button variant="outline-primary" class='no-border' v-on:click="edited_item.frecuencia += 1 , check_edit()"><i class="fas fa-plus-square"></i></b-button>
				<b-button variant="outline-danger" class='no-border' v-on:click="edited_item.frecuencia -= 1 , check_edit()"><i class="fas fa-minus-square"></i></b-button>
<button class="btn btn-outline-secondary no-border" id='solicitudes'><i class="fas  fa-question-circle"></i></button>
		</div>
		<div class="col-sm-5">

<b-tooltip target="solicitudes">Cuantas solicitudes pueden realizarse al mes</b-tooltip>			
		</div>
		
		<div class="col-sm-3">
				Reinicio de solicitud
		</div>		
		<div class="col-sm-2">
				despues de {{edited_item.dia_reinicio}} dias
		</div>		
		<div class="col-sm-2">
				<b-button variant="outline-primary" class='no-border' v-on:click="edited_item.dia_reinicio += 1 , check_edit()"><i class="fas fa-plus-square"></i></b-button>
				<b-button variant="outline-danger" class='no-border' v-on:click="edited_item.dia_reinicio -= 1 , check_edit()"><i class="fas fa-minus-square"></i></b-button>
<button class="btn btn-outline-secondary no-border" id='pagos'><i class="fas  fa-question-circle"></i></button>
		</div>
		<div class="col-sm-5">

<b-tooltip target="pagos">Al realizarse un deposito, cuandos dias despues se rehabilita poder solicitar Anticipos</b-tooltip>			
		</div>		
		
</div>

<!-- Barra de grabar -->

		<div class="col-sm-12">

							<div class="col-sm-12"><hr></div>	

				<b-button v-bind:disabled='save_switch' size='lg' variant="outline-success" @click='save_edit() ; $bvModal.hide("modal-editar");'><i class="fas fa-user-edit"></i>Guardar Todos los Cambios</b-button>

				<button v-show='save_switch' class="btn btn-sm no-border btn-outline-danger" id='mensaje'><i class="fas fa-exclamation"></i></button>

				<b-tooltip target="mensaje"><i class="fas fa-exclamation-triangle"></i> {{mensaje_tiptool_2}}</b-tooltip>			

				<b-button  variant="outline-danger" @click="$bvModal.hide('modal-editar')">Cancelar/Cerrar Modal</b-button>
		</div>

</div>

		</b-modal>

<!-- ADVERTENCIA DE BORRAR USUARIO EN MODAL -->

<b-modal v-cloak id='modal-borrar' title="Eliminar usuario" hide-footer>

<div class="row centrado">

	<div class="col-sm-12">
			<h4 class="error"><small><i class="fas fa-user-tie"></i> Nombre: {{delete_item.first_name | capitalize }} <span v-if='delete_item.last_name'> {{delete_item.last_name | capitalize }}</span> </small></h4>

			<p><i class="fas fa-id-badge"></i> Username: {{delete_item.user_login}}<input hidden placeholder='please enter model' v-model.trim='delete_item.user_login'/>

			<br>
				 <i class="fas fa-envelope"></i> {{delete_item.user_email}}<input hidden placeholder='please enter model' v-model.trim='delete_item.user_email'/></p>			
	</div>

	<div class="col-sm-12 cuaternario">
		<hr class="error">
		<p>
			<b>
				<i class="fas fa-2x fa-exclamation-triangle"></i>Esta seguro que desea eliminar el usuario?
			</b>
		</p>
		<p v-if='delete_item.empresa =="1"'>Esto eliminara a la empresa y todos sus usuarios..</p>
		<b-button size='sm' variant="danger" @click='proceed_delete(delete_item.ID) ; $bvModal.hide("modal-borrar")'>PROCEDER Y BORRAR</b-button>

		<b-button size='sm' variant="outline-danger" @click="$bvModal.hide('modal-borrar')">Cancelar/Cerrar ventana</b-button>
	</div>

</div>

</b-modal>


<!-- CREAR USUARIO -->

<b-modal v-cloak id='modal-crear' title="Crear un nuevo usuario" hide-footer size="xl">

<p v-if='tipo_usuario == "empresa"'>Tipo de usuario: {{tipo_usuario}} </p>
<p v-else>Tipo de usuario: personal</p>

	<div class='row' id='create_item'>

		<div class="col-sm-3">
				<span><i class="fas fa-user-tie"></i> Nombre*: </span><br>
				<b-form-input placeholder='Ingrese nombre' :value='new_item.first_name | capitalize' @input="value => new_item.first_name = value" v-on:input='computed_username' ></b-form-input>
				<input hidden placeholder='empresa madre' v-model.trim='new_item.empresa'/>				
		</div>

		<div v-if='tipo_usuario == "empresa"' class="col-sm-3">
				<span><i class="fas fa-street-view"></i> Sucursal: </span><br>
				<b-form-input placeholder='Ingrese Sucursal' :value='new_item.last_name | capitalize' @input="value => new_item.last_name = value" v-on:input='computed_username' ></b-form-input>
		</div>
		<div  v-else class="col-sm-3">
				<span><i class="fas fa-user-tag"></i> Apellido*: </span><br>		
				<b-form-input placeholder='Ingrese apellido' :value='new_item.last_name | capitalize' @input="value => new_item.last_name = value" v-on:input='computed_username'></b-form-input>
		</div>	
			<div class="col-sm-3">
				<span><i class="far fa-envelope"></i> email*: </span><br>
				<b-form-input placeholder='please enter model' v-model.trim='new_item.user_email'></b-form-input>
		</div>
		<div class="col-sm-3">
			<p class="centrado">
				<span>Habilitado: </span>
				<input type='radio' value=true v-model='new_item.gearbox'/>
				<span>Bloqueado: </span>
				<input type='radio' value=false v-model='new_item.gearbox'/>
			</p>
		</div>

	<div v-if='tipo_usuario !== "empresa"' class="row col-sm-12">

		<div class="col-sm-3">
				<span><i class="far fa-id-card"></i> Cedula*: </span><br>
				<b-form-input placeholder='Ingrese cedula' v-on:input='computed_username' v-model.trim='new_item.cedula'></b-form-input>
		</div>

		<div class="col-sm-3">
			<span><i class="fas fa-phone"></i> Telefono: </span><br>
				<b-form-input placeholder='Ingrese telefono' v-model.trim='new_item.phone_number'></b-form-input>
		</div>

		<div class="col-sm-3">
			<span><i class="fas fa-birthday-cake"></i> Fecha de nacimiento: </span>
				<b-form-datepicker :date-format-options="{ year: 'numeric', month: 'numeric', day: 'numeric' }" size="sm" v-model='new_item.birth_date'></b-form-datepicker>
		</div>
					
		<div class="col-sm-3">
				<span>Masculino: </span>
				<input type='radio' value=true v-model='new_item.gender'/>
				<span>Femenino: </span>
				<input type='radio' value=false v-model='new_item.gender'/>
		</div>

		<div class="col-sm-3">
			<span><i class="fas fa-map-marker-alt"></i> Ciudad: </span><br>
				<b-form-input placeholder='Ingrese ciudad'  :value='new_item.city | capitalize' @input="value => new_item.city = value"></b-form-input>
		</div>
		<div class="col-sm-3">
			<span><i class="fas fa-location-arrow"></i> Direccion: </span><br>
				<b-form-input placeholder='Ingrese direccion'  :value='new_item.address | capitalize' @input="value => new_item.address = value"></b-form-input>
		</div>

		<div class="col-sm-3">
				<span>Monto disponible* <b>(Numero entero en $)</b> </span><br>
				<b-form-input placeholder='Ingrese monto' v-model.trim='new_item.disponible'></b-form-input>
		</div>

	</div>

			<div class="col-sm-3">
				<span><i class="fas fa-id-badge"></i> username*: </span><br>
				<b-form-input placeholder='please enter model' v-model.trim='new_item.user_login'></b-form-input>
		</div>		
			<div class="col-sm-3">
				<span><i class="fas fa-key"></i> password*: </span><br>
				<b-form-input placeholder='please enter model' v-model.trim='new_item.user_pass'></b-form-input>
		</div>	

	</div>
<hr>
			<p class="centrado">

				<b-button size='sm' v-bind:disabled = 'btn_switch' variant="success" @click='create_item(); $bvModal.hide("modal-crear")'>Crear nuevo</b-button> 
<!--				<b-button size='sm' v-bind:disabled = 'btn_switch' variant="success" @click='create_item()'>Crear nuevo</b-button> -->

				<button v-if='btn_switch' class="btn btn-sm no-border btn-outline-danger" id='mensaje_2'><i class="fas fa-exclamation"></i></button>

				<b-tooltip target="mensaje_2"><i class="fas fa-exclamation-triangle"></i> {{mensaje_tiptool}}</b-tooltip>

				<b-button size='sm' variant="outline-danger" @click="$bvModal.hide('modal-crear')">Cerrar Modal</b-button>

			</p>
</b-modal>


<!-- PANEL DE USUARIOS -->

<div v-cloak class="row principal">
	<div class="col-sm-4">
		<h4><i class="far fa-chart-bar"></i> Listado de Empresas inscritas<label class="smaller" v-if='empresa_info_set.length'> (total:{{empresa_info_set.length}})</label>
		</h4>
	</div>
	
	<div class="col-sm-2">
		<b-button  id='create_item' v-b-modal.modal-crear variant="primary" @click="sendInfo('empresa','')"><i class="fas fa-user-edit"></i>Crear nueva Empresa</b-button>
	</div>


	<div class="col-sm-12">
		<hr>
	</div>	

    <div class="input-group col-sm-4">
        <input class="form-control py-2" type="search" placeholder=" Filtrar mis Usuarios.." v-model="filter">
        <span class="">
            <button class="btn btn-outline-secondary" type="button">
                <i class="fa fa-search"></i>
            </button>
        </span>
    </div>

    <div class="input-group col-sm-1">
        <span><input type="checkbox"  v-model="status_habilitacion"><br><small>Habilitados</small></span>
    </div>

    <div class="input-group col-sm-1">
        <span><input type="checkbox"  v-model="status_deshabilitacion"><br><small>Bloqueados</small></span>
    </div>

    <div class="input-group col-sm-2">
        <span><input type="checkbox"  v-model="status_excel"><br><small>Sin Actualizacion de Excel</small></span>
    </div>

	<div class="col-sm-2">
		<b-button   variant="warning" size="sm" @click="startexport('actualizados')"><i class="fas fa-exclamation-triangle"></i> Descargar Reporte<br>No Actualizados</b-button>
	</div>	
	<div class="col-sm-2">
		<b-button   variant="danger" size="sm" @click="startexport('bloqueados')"><i class="fas fa-exclamation-triangle"></i> Descargar Reporte<br>Bloqueados</b-button>
	</div>


	<div class="col-sm-12">
		<hr class='principal'>
	</div>

</div>

<!--listado de usuarios EMPRESA -->

<div v-cloak class="row" id='list' v-if='empresa_info_set.length'>
	<div class="col-sm-4 row" v-for='(element, index) in filteredRows' :key="`employee-${index}`" >
			
<!-- botones de habilitado y bloqueado -->
		<div class="col-sm-6">
			<button class="btn btn-sm btn-outline-danger no-border " v-if='element.gearbox == "false"'><i class="fas fa-ban"></i> Bloqueado</button> 
			<button class="btn btn-sm btn-outline-success no-border " v-else><i class="far fa-stop-circle"></i> Activo</button>
		</div>

<!-- Info usuario -->
		<div class="col-sm-12">
			<b>{{element.first_name | capitalize }} </b>
			<small class="smaller no-border" size="sm"  v-if='element.last_name'>{{element.last_name | capitalize }}</small> 
			<button class="btn btn-sm btn-warning smaller" v-if='excel_switch(element.fecha_excel)' data-toggle="tooltip" data-placement="top" title="La Empresa no ha Actualizado su Excel de usuarios..">No Actualizado!</button> 

			<br>
			<small><i class="fas fa-envelope"></i> {{element.user_email}}</b></small>
<br>
			<small v-if='element.flexirol3 == 1'><i class="fas fa-hand-holding-usd"></i> Plan 1: Porcentaje sobre la transaccion ({{element.flexirol}}%) <small>(mas IVA)</small></b></small>
			<small v-else><i class="fas fa-hand-holding-usd"></i> Plan 2: Valor fijo/pago mensual recurrente ({{element.flexirol2}}$/mes) <small>(mas IVA)</small></b></small>

		</div>
			
<!-- barra de edicion -->			
		<div class="col-sm-12">

				<b-button  id='edit_item' v-b-modal.modal-editar @click='start_edit(element)' variant="secondary"  class="no-border"><i class="fas fa-user-edit"></i> Ver/Editar </b-button> <br><hr>

				<b-button  id='delete_item' v-b-modal.modal-borrar @click = "start_delete(element)" variant="outline-danger" size="sm" class="no-border"><i class="fas fa-trash-alt"></i> Borrar Usuario</b-button>

				<b-button  id='usuarios_item' v-b-modal.modal-usuarios @click='start_usuarios(element.ID)' variant="outline-primary"  class="no-border"><i class="fas fa-users"></i>Listado de usuarios</b-button>				

				<hr>
		</div>

	</div>


<!--listadoi usuarios de empresa seleccionada dentro del modal -->

<b-modal id='modal-usuarios' title="Listado de usuarios de esta Empresa" hide-footer size="huge" v-b-modal.modal-scrollable><!--listado de usuarios de EMPRESA SELECCIONADA -->

<div  v-if='usuarios_empresa_info_set.length'>


<div class="row">

      <div class="col-sm-4">
        <p class="">
            	<input class="form-control col-sm-12" type="search" placeholder=" Filtrar mis Usuarios.." v-model="filter_usuarios">
         </p>
      </div>   
      <div class="col-sm-3">
      	<p>         
            <span><input type="checkbox"  v-model="status_habilitacion_usuarios"> Habilitados</span>
            <span><input type="checkbox"  v-model="status_deshabilitacion_usuarios"> Bloqueados</span>
        </p>
      </div> 

      <div class="col-sm-2">
		<b-button  id='create_item' v-b-modal.modal-crear variant="primary" @click="sendInfo('usuario',filteredRows_usuarios[0].empresa)"><i class="fas fa-user-edit"></i>Crear nuevo Usuario</b-button>
	  </div>

        <div class="col-sm-2">
				<b-button  variant="outline-danger" @click="$bvModal.hide('modal-usuarios')">Cancelar/Cerrar Ventana</b-button>
	  </div>


            <div class="col-sm-12">
<hr>
</div>
	<div class="col-sm-4 row" v-for='(element_usuario, index_usuario) in filteredRows_usuarios' :key="`employee-${index_usuario}`" >
			
<!-- botones de habilitado y bloqueado -->
		<div class="col-sm-1">
			<button class="btn btn-sm btn-outline-danger  no-border" v-if='element_usuario.gearbox == "false"'><i class="fas fa-ban"></i></button> 
			<button class="btn btn-sm btn-outline-success  no-border" v-else><i class="far fa-stop-circle"></i></button>
		</div>

<!-- Info usuario -->
		<div class="col-sm-11">
			<b>{{element_usuario.first_name | capitalize }} {{element_usuario.last_name | capitalize }}</b> - Cedula {{element_usuario.cedula}}
			<br>
			<i class="fas fa-envelope"></i> {{element_usuario.user_email}}</b>
		</div>
			
<!-- barra de edicion -->			
		<div class="col-sm-12">
				<b-button  id='delete_item' v-b-modal.modal-borrar @click = "start_delete(element_usuario)" variant="outline-danger" size="sm" class="no-border"><i class="fas fa-trash-alt"></i> Borrar Usuario</b-button>

				<b-button  id='edit_item' v-b-modal.modal-editar @click='start_edit(element_usuario)' variant="outline-secondary"  class="no-border"><i class="fas fa-user-edit"></i>Ver/Editar Info</b-button>

				<hr>
		</div>

	</div>
</div>
</div>

	<div class="row" v-else>

      <div class="col-sm-3">
No hay usuarios registrados..
	  </div>

      <div class="col-sm-2">
		<b-button  id='create_item' v-b-modal.modal-crear variant="primary" size="sm" @click="sendInfo('usuario',empresa_actual_global)"><i class="fas fa-user-edit"></i>Crear nuevo Usuario</b-button>
	  </div>

        <div class="col-sm-2">
				<b-button  variant="outline-danger" @click="$bvModal.hide('modal-usuarios')">Cerrar Modal</b-button>
	  </div>

	</div> 


</b-modal>


</div> <!-- else de listado de empresas -->

	<p v-cloak id='err_msg' v-else>{{err_msg}}</p> 

</div> <!-- FIN DEL DIV CON EL ID QUE CARGARA EL VUE -->


<?php

	} 
);


?>