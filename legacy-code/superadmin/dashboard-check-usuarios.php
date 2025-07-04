<?php

// Creacion del shortcode que hara la pagina 

add_shortcode( 'check-usuarios', function () {

$profile_id = um_profile_id();
	
if ( (get_user_role($profile_id) == 'superadmin') || (get_user_role($profile_id) == 'operador') || (get_user_meta($profile_id, 'gearbox', true ) == 'true')) {
	
  wp_enqueue_script('check_usuarios_vue_admin');  //Add my Vue code for the page

 ?> 

	<div id="check_usuarios"> <!-- DIV CON EL ID QUE CARGARA EL VUE -->

<!-- SPINNERS Y ALERTAS -->

<div v-if="loading" >
		<div class="loading">
				<div class="spinner-border text-warning "></div>
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
      <h4><strong> {{mensaje_alerta}}... </strong></h4> <hr>
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


<!--	<div class=" col-sm-12">
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
	</div> -->


<!-- Barra de grabar -->

		<div class="col-sm-12">
				<b-button v-bind:disabled='save_switch' size='sm' variant="outline-success" @click='save_edit() ; $bvModal.hide("modal-editar");'><i class="fas fa-user-edit"></i>Guardar Todos los Cambios</b-button>

				<button v-if='save_switch' class="btn btn-sm no-border btn-outline-danger" id='mensaje'><i class="fas fa-exclamation"></i></button>

				<b-tooltip target="mensaje"><i class="fas fa-exclamation-triangle"></i> Llene los campos obligatorios para poder grabar por favor</b-tooltip>			

				<b-button size='sm' variant="outline-danger" @click="$bvModal.hide('modal-editar')">Cancelar/Cerrar Modal</b-button>
		</div>

</div>

		</b-modal>



<!-- INICIO PANELES DE INFORMACON INFERIORES -->

<div v-cloak class="row" >

<!-- MODAL DE FILTRADOS DE SOLICITUDES POR USUARIO -->

<b-modal v-cloak id='modal-resumenes' title="Detalles de las Solicitudes" hide-footer>

<div class="row" id='list' v-if='filteredRows_usuarios.length'>
	<div class="col-sm-12 row" v-for='(element_solicitud, index) in filteredRows_usuarios' :key="element_solicitud.ID" >
		<div class="col-sm-8">
			<b>Fecha: {{element_solicitud.post_date}}</b> - Monto Solicitado: ${{Number(element_solicitud.post_excerpt) + Number(element_solicitud.gearbox)}} 
		</div>
		<div class="col-sm-4">
			<button v-bind:class='element_solicitud.tag' class="btn btn-sm">{{element_solicitud.tag}}</button> 
			<small v-if='element_solicitud.tag=="procesado"' style="color: green">el {{element_solicitud.post_modified}}</small> 
		</div>
		<hr>		
	</div>
		<div class="col-sm-12">
				<b-button size='sm' variant="outline-danger" @click="$bvModal.hide('modal-resumenes')">Cerrar Modal</b-button>
		</div>

  </div>

	<p  id='err_msg' v-else>{{err_msg}}</p> 

</b-modal>

<!-- INICIO RESULTADOS DE BUSQUEDA -->

<div class="col-sm-12 principal">
	<h4><i class="far fa-file-archive"></i> Busqueda de Usuarios en el Sistema</h4>
</div>

	<div class="col-sm-3"><!-- POR CEDULA -->
	 Por Cedula..
<b-form-input v-model="dob_cedula"></b-form-input>
	</div>



<div class="col-sm-3"> 	 <!-- POR EMPRESA -->
<?php
if ( (get_user_role($profile_id) == 'empresa') || (get_user_meta($profile_id, 'gearbox', true ) == 'true')) { 
	//nada por ahora
 } else { ?>
	Por empresa: 
	<b-form-select  v-model='empresa_busqueda' class="mb-3">
	    <b-form-select-option value="">Todas las Empresas</b-form-select-option>
	    <b-form-select-option v-for='element_empresa in empresa_info_set' v-bind:key='element_empresa.ID' :value='element_empresa.ID'>{{element_empresa.first_name}} - {{element_empresa.last_name}}</b-form-select-option>
	</b-form-select>
<?php } ?>
</div>

<div class="col-sm-3"><br>
	<button v-on:click="start_usuarios(empresa_busqueda)" class="btn btn-primary"><i class="fab fa-searchengin"></i> Buscar Usuarios</button>
	<b-button size='sm' variant="outline-danger no-border" v-on:click="resetOptions" >Borrar/Reiniciar</b-button>
</div>

<div v-cloak class="row" id='list' v-if='usuarios_empresa_info_set.length'>
	<div class="col-sm-12"><hr class=""></div>
	<div class="col-sm-4 terciario">
	<h4><i class="fab fa-searchengin"></i> Filtrar resultados de la Busqueda</h4>		
	</div>
	<div class="input-group col-sm-3">
	    <input class="form-control py-2" type="search" placeholder="Filtrar los Usuarios.." v-model="filter_total">
	    <span class="">
	        <button class="btn btn-outline-secondary" type="button">
	            <i class="fa fa-search"></i>
	        </button>
	    </span>
	</div>

    <div class="input-group col-sm-1">
        <span><input type="checkbox"  v-model="status_plan_1"><br><small>Usuarios con Plan1</small></span>
    </div>

    <div class="input-group col-sm-1">
        <span><input type="checkbox"  v-model="status_plan_2"><br><small>Usuarios con Plan2</small></span>
    </div>


	<div class="col-sm-12"><br></div>

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
			<small v-if='element_usuario.flexirol3 == 1'><i class="fas fa-hand-holding-usd"></i> Plan 1: Porcentaje sobre la transaccion ({{element_usuario.flexirol}}%) <small>(mas IVA)</small></b></small>
			<small v-else><i class="fas fa-hand-holding-usd"></i> Plan 2: Valor fijo/pago mensual recurrente ({{element_usuario.flexirol2}}$/mes) <small>(mas IVA)</small></b></small>


		</div>
			
<!-- barra de edicion -->			
		<div class="col-sm-12">
				<b-button  id='delete_item' v-b-modal.modal-borrar @click = "start_delete(element_usuario)" variant="outline-danger" size="sm" class="no-border"><i class="fas fa-trash-alt"></i> Borrar Usuario</b-button>

				<b-button  id='edit_item' v-b-modal.modal-editar @click='start_edit(element_usuario)' variant="outline-secondary" size="sm" class="no-border"><i class="fas fa-user-edit"></i>Ver/Editar Info</b-button>

				<hr>
		</div>

	</div>


  </div>

<div v-cloak class="col-sm-12 row" v-else>

	<div class="col-sm-12"><hr class=""></div>

	<div class="col-sm-6">	
		<h4  class="terciario"><i class="fab fa-searchengin"></i> {{err_msg}} 
		</h4>
	</div>
	<div class="input-group col-sm-3" v-if='solicitudes_info_set.length'>
	    <input class="form-control py-2" type="search" placeholder="Filtrar Usuarios.." v-model="filter_total">
	    <span class="">
	        <button class="btn btn-outline-secondary" type="button">
	            <i class="fa fa-search"></i>
	        </button>
	    </span>
	</div>	<div class="col-sm-3">
		<b-button size='sm' variant="outline-danger no-border" v-if='solicitudes_info_set.length'  v-on:click="resetOptions_filtro" >Limpiar Filtro</b-button>
	</div>
  </div>


		

  </div>


</div> <!-- FIN DEL DIV CON EL ID QUE CARGARA EL VUE -->


<?php

} else {

echo '<div class="alert alert-danger" role="alert"><i class="fas fa-2x fa-user-lock"></i> Su usuario ha sido bloqueado por Admin. Comuniquese por favor para desbloquear</div>';

}

	} //cierre de creacion de shortcode
);


?>