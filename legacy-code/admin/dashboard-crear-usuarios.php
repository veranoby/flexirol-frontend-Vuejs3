<?php

// Creacion del shortcode que hara la pagina 

add_shortcode( 'crear_usuarios_admin', function () {

	
if (get_user_meta( um_profile_id(), 'gearbox', true ) == 'true' ) {

  wp_enqueue_script('crear_usuarios_vue_admin');  //Add my Vue code for the page

 ?> 

	<div id="crear_usuarios_admin"> <!-- DIV CON EL ID QUE CARGARA EL VUE -->

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
    <br>
    <br>  <h1><strong> {{mensaje_alerta}}... </strong></h1> 
    <hr>
    </b-alert>
</div>	

<!-- EDITAR USUARIO EN MODAL -->

<b-modal v-cloak id='modal-editar' title="Editar usuario" hide-footer size="lg">
	<div class="row">

		<div class="col-sm-4">
				<span><i class="fas fa-user-tie"></i> Nombre*: </span>

<b-form-input placeholder='Ingrese Nombre' :value='edited_item.first_name | capitalize' @input="value => edited_item.first_name = value"></b-form-input>


		</div>
		<div class="col-sm-4">
				<span><i class="fas fa-user-tag"></i> Apellido*: </span>

<b-form-input placeholder='Ingrese Apellido' :value='edited_item.last_name | capitalize' @input="value => edited_item.last_name = value"></b-form-input>


		</div>
		<div class="col-sm-4">
				<span><i class="fas fa-id-badge"></i> Username: {{edited_item.user_login}} </span><br>
				<span>Usuario Habilitado: </span>
				<input type='radio' value=true v-model='edited_item.gearbox'/>
				<span>Bloqueado: </span>
				<input type='radio' value=false v-model='edited_item.gearbox'/>
		</div>
		<div class="col-sm-4">
				<span><i class="far fa-id-card"></i> Cedula*: </span><br>
				<b-form-input placeholder='Ingrese cedula' v-model.trim='edited_item.cedula'/>
		</div>		
		<div class="col-sm-4">
				<span><i class="far fa-envelope"></i> Email*: </span><br>
				<b-form-input placeholder='Ingrese su email' v-model.trim='edited_item.user_email'/>
		</div>

		<div class="col-sm-4">
			<span><i class="fas fa-phone"></i> Telefono: </span>
				<b-form-input placeholder='Ingrese telefono' v-model.trim='edited_item.phone_number'/>
		</div>
		<div class="col-sm-4">
			<span><i class="fas fa-map-marker-alt"></i> Ciudad:<br></span>

<b-form-input placeholder='Ingrese Ciudad' :value='edited_item.city | capitalize' @input="value => edited_item.city = value"></b-form-input>


		</div>
		<div class="col-sm-4">
			<span><i class="fas fa-location-arrow"></i> Direccion: </span><br>

<b-form-input placeholder='Ingrese Direccion' :value='edited_item.address | capitalize' @input="value => edited_item.address = value"></b-form-input>


		</div>		
		<div class="col-sm-4">
			<span><i class="fas fa-birthday-cake"></i> Fecha de nacimiento: </span>
				<b-form-datepicker size="sm" v-model='edited_item.birth_date'></b-form-datepicker>
		</div>

		<div class="col-sm-4">
			<span>Monto habilitado: <b>$</b>

			<button class="btn btn-outline-secondary no-border" id='peticiones'><i class="fas fa-question-circle"></i></button>
			
			</span>

			<b-tooltip target="peticiones"><i class="fas fa-exclamation-triangle"></i> Importante: este valor no representa el total disponible para el usuario.<br>(el valor final sera calculado segun porcentaje de disponibilidad, dia del mes, demanda actual..)</b-tooltip>			

			<b-form-input placeholder='Ingrese el monto disponible' v-model.trim='edited_item.disponible'/>
		</div>	

		<div class="col-sm-12"><hr></div>
		<div class="col-sm-12">
				<b-button v-bind:disabled='save_switch' size='sm' variant="outline-success" @click='save_edit() ; $bvModal.hide("modal-editar");'><i class="fas fa-user-edit"></i>Guardar cambios</b-button>
				<button v-if='save_switch' class="btn btn-sm no-border btn-outline-danger" id='mensaje'><i class="fas fa-exclamation"></i></button>
				<b-tooltip target="mensaje"><i class="fas fa-exclamation-triangle"></i> {{mensaje_tiptool_2}}</b-tooltip>			

				<b-button size='sm' variant="outline-danger" @click="$bvModal.hide('modal-editar')">Cerrar Modal</b-button>
		</div>

</div>

		</b-modal>

<!-- ADVERTENCIA DE BORRAR USUARIO EN MODAL -->

<b-modal v-cloak id='modal-borrar' title="Eliminar usuario" hide-footer>

<div class="row centrado">

	<div class="col-sm-12">
			<h4 class="error"><small><i class="fas fa-user-tie"></i> Nombre: {{delete_item.first_name  | capitalize }} <span v-if='delete_item.last_name'> {{delete_item.last_name  | capitalize }}</span> </small></h4>

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
		<p>Esto eliminara a la empresa y todos sus usuarios..</p>
		<b-button size='sm' variant="danger" @click='proceed_delete(delete_item.ID) ; $bvModal.hide("modal-borrar")'>PROCEDER Y BORRAR</b-button>

		<b-button size='sm' variant="outline-danger" @click="$bvModal.hide('modal-borrar')">Cancelar/Cerrar ventana</b-button>
	</div>

</div>

</b-modal>


<!-- CREAR USUARIO -->

<b-modal v-cloak id='modal-crear' title="Crear un nuevo usuario en su Empresa" hide-footer size="xl">

	<div class='row'>
		
		<div class="col-sm-3">
				<span><i class="fas fa-user-tie"></i> Nombre*: </span><br>

<b-form-input placeholder='Ingrese nombre' :value='new_item.first_name | capitalize' @input="value => new_item.first_name = value" v-on:input='computed_username'></b-form-input>



		</div>
			<div class="col-sm-3">
				<span><i class="fas fa-user-tag"></i> Apellido: </span><br>

<b-form-input placeholder='Ingrese apellido' :value='new_item.last_name | capitalize' @input="value => new_item.last_name = value" v-on:input='computed_username'></b-form-input>


		</div>
			<div class="col-sm-3">
				<span><i class="fas fa-envelope"></i> email*: </span><br>
				<b-form-input placeholder='Ingrese email' v-model.trim='new_item.user_email'/>
		</div>
			<div class="col-sm-3">
				<span><i class="far fa-id-card"></i> Cedula*: </span><br>
				<b-form-input placeholder='Ingrese cedula' v-on:input='computed_username' v-model.trim='new_item.cedula'/>
		</div>				
		<div class="col-sm-3">
				<span><i class="fas fa-id-badge"></i> username*: </span><br>
				<b-form-input placeholder='Ingrese nombre de usuario' v-model.trim='new_item.user_login'/>
		</div>		
			<div class="col-sm-3">
				<span><i class="fas fa-key"></i> password*: </span><br>
				<b-form-input placeholder='Ingrese password' v-model.trim='new_item.user_pass'/>
		</div>	

		<div class="col-sm-3">
			<span><i class="fas fa-phone"></i> Telefono: </span><br>
				<b-form-input placeholder='Ingrese telefono' v-model.trim='new_item.phone_number'/>
		</div>

		<div class="col-sm-3">
				<span>Masculino: </span>
				<input type='radio' value=true v-model='new_item.gender'/>
				<span>Femenino: </span>
				<input type='radio' value=false v-model='new_item.gender'/>
		</div>

		<div class="col-sm-3">
			<span><i class="fas fa-map-marker-alt"></i> Ciudad: </span><br>

<b-form-input placeholder='Ingrese Ciudad' :value='new_item.city | capitalize' @input="value => new_item.city = value"></b-form-input>


		</div>

		<div class="col-sm-3">
			<span><i class="fas fa-location-arrow"></i> Direccion: </span><br>

<b-form-input placeholder='Ingrese Direccion' :value='new_item.address | capitalize' @input="value => new_item.address = value"></b-form-input>


		</div>

		<div class="col-sm-3">
			<span><i class="fas fa-birthday-cake"></i> Fecha de nacimiento: </span><br>
				<b-form-datepicker size="sm" v-model='new_item.birth_date'></b-form-datepicker>
		</div>

		<div class="col-sm-3">
			<p class="centrado">			
				<span>Habilitado: </span>
				<input type='radio' value=true v-model='new_item.gearbox'/>
				<span>Bloqueado: </span> 
				<input type='radio' value=false v-model='new_item.gearbox'/>
			</p>
		</div>
		
		<div class="col-sm-3">
				<span>Monto disponible* <b>(Numero entero en $)</b> </span><br>
				<b-form-input placeholder='Ingrese monto' v-model.trim='new_item.disponible'/>
		</div>

	</div>

			<p class="centrado">

				<b-button size='sm' v-bind:disabled = 'btn_switch' variant="success" @click='create_item(); $bvModal.hide("modal-crear")'>Crear nuevo usuario</b-button>
				<button v-if='btn_switch' class="btn btn-sm no-border btn-outline-danger" id='mensaje_2'><i class="fas fa-exclamation"></i></button>

				<b-tooltip target="mensaje_2"><i class="fas fa-exclamation-triangle"></i> {{mensaje_tiptool}}</b-tooltip>

				<b-button size='sm' variant="outline-danger" @click="$bvModal.hide('modal-crear')">Cerrar Modal</b-button>

			</p>

</b-modal>


<!-- MENSAJE ADVERTENCIA ACTUALIZACION EXCEL -->
<div class="row">
		<div class="col-sm-12">
	<div v-bind:class="clase_importante" role="alert">
{{mensaje_importante}} 
	</div>
		</div>
</div>

<!-- INICIO PANELES DE INFORMACON INFERIORES -->

<div v-cloak v-if='habilitado_switch_excel' class="row" >

<!-- PANEL DE USUARIOS -->

<div class="row" v-cloak>
	<div class="col-sm-4">
		<h4>Listado de Usuarios de su Empresa <label class="smaller" v-if='usuarios_info_set.length'> (total:{{usuarios_info_set.length}})</label>
		</h4>
	</div>
	<div class="col-sm-2">
		<b-button v-b-modal.modal-crear variant="primary" ><i class="fas fa-user-edit"></i>Crear nuevo Usuario</b-button>
	</div>

        <div class="input-group col-sm-4">
            <input class="form-control py-2" type="search" placeholder=" Filtrar mis Usuarios.." v-model="filter">
            <span class="">
                <button class="btn btn-outline-secondary" type="button">
                    <i class="fa fa-search"></i>
                </button>
            </span>
        </div>
        <div class="input-group col-sm-2">
            <span><input type="checkbox"  v-model="status_habilitacion"> Habilitados</span>
            <span><input type="checkbox"  v-model="status_deshabilitacion"> Bloqueados</span>
        </div>


</div>

</div>



<!--listado de usuarios EMPRESA -->

<div v-cloak class="row" id='list' v-if='usuarios_info_set.length && habilitado_switch_excel'>
	<div class="col-sm-6 row" v-for='(element, index) in filteredRows' :key="`employee-${index}`" >
			
<!-- botones de habilitado y bloqueado -->
		<div class="col-sm-1">
			<button class="btn btn-sm btn-outline-danger no-border" v-if='element.gearbox == "false"'><i class="fas fa-ban"></i></button> 
			<button class="btn btn-sm btn-outline-success no-border" v-else><i class="far fa-stop-circle"></i></button>
		</div>

<!-- Info usuario -->
		<div class="col-sm-11">
			<b>{{element.first_name  | capitalize }} {{element.last_name | capitalize }}</b> - Cedula: {{element.cedula}}
			<br>
			Email: {{element.user_email}} - Monto disponible: <b>${{element.disponible}}</b>
		</div>
			
<!-- barra de edicion -->			
		<div class="col-sm-12">
				<b-button  id='delete_item' v-b-modal.modal-borrar @click = "start_delete(element)" variant="outline-danger" size="sm" class="no-border"><i class="fas fa-trash-alt"></i> Borrar</b-button>

				<b-button  id='edit_item' v-b-modal.modal-editar @click='start_edit(element)' variant="outline-secondary" size="sm" class="no-border"><i class="fas fa-user-edit"></i>Ver/Editar</b-button>

				<hr>
		</div>

	</div>

</div>

	<p v-cloak id='err_msg' v-else>{{err_msg}}</p> 


</div> <!-- FIN DEL DIV CON EL ID QUE CARGARA EL VUE -->


<?php

} else {

echo '<div class="alert alert-danger" role="alert"><i class="fas fa-2x fa-user-lock"></i> Su usuario ha sido bloqueado por Admin. Comuniquese por favor para desbloquear</div>';

}


	} //cierre de creacion de shortcode
);


?>