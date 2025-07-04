<?php

// Creacion del shortcode que hara la pagina 

add_shortcode( 'crear_bancos_usuarios', function () {

	
$profile_id = um_profile_id();
$rol_actual = get_user_role($profile_id);
$mi_empresa_madre = get_user_meta( $profile_id, "empresa", true ) ; 

if (get_user_meta($profile_id, 'gearbox', true ) != 'false' && get_user_meta($mi_empresa_madre, 'gearbox', true ) != 'false') {

  wp_enqueue_script('crear_bancos_vue_usuarios');  //Add my Vue code for the page

 ?> 

	<div id="crear_bancos_usuarios"> <!-- DIV CON EL ID QUE CARGARA EL VUE -->

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

<!-- FIN SPINNERS Y ALERTAS -->


<!-- ELIMINAR CUENTA EN MODAL -->

<b-modal v-cloak id='modal-eliminarbanco' title="Detalles de la cuenta bancaria a ELIMINAR" hide-footer >
	<div class='row'>

		<div class="col-sm-12">
				<span><i class="fas fa-piggy-bank"></i> Banco {{delete_item.post_banco}}

				<span> - Cuenta </span>{{delete_item.gearbox}}

			<span><i class="fas fa-list-ol"></i> Numero: </span>
				{{delete_item.numero_cuenta}}
		</div>	

		<hr>

		<div class="col-sm-12">

				<p><i class="fa-solid fa-2x fa-circle-exclamation"></i> Esta seguro que desea eliminar la cuenta? (*esta operacion no es reversible)</p> 

		</div>	

	</div>

		<div class="col-sm-12"><hr></div>

		<div class="col-sm-6">
				<b-button size='sm' variant="danger" @click="$bvModal.hide('modal-eliminarbanco')">Eliminar Cuenta</b-button>
		</div>

		<div class="col-sm-6">
				<b-button size='sm' variant="outline-danger" @click="$bvModal.hide('modal-eliminarbanco')">Cancelar/Cerrar Modal</b-button>
		</div>

		</b-modal>


<!-- VER DATOS CUENTA EN MODAL -->

<b-modal v-cloak id='modal-editarbanco' title="Detalles de la cuenta bancaria" hide-footer >
	<div class='row'>

		<div class="col-sm-12">
				<span><i class="fas fa-piggy-bank"></i> Banco {{edited_item.post_banco}}

				<span> - Cuenta </span>{{edited_item.gearbox}}

			<span><i class="fas fa-list-ol"></i> Numero: </span>
				{{edited_item.numero_cuenta}}
		</div>		
		<div class="col-sm-12">
				<span><i class="fas fa-user-tag"></i> Nombre de propietario de la cuenta: </span>
				{{edited_item.post_excerpt}}
		</div>		
		<div class="col-sm-12">				
				<span><i class="far fa-id-card"></i> Cedula: </span>
				{{edited_item.post_content}}
		</div>		
		<div class="col-sm-12">
				<span><i class="far fa-envelope"></i> Email: </span>
				{{edited_item.user_email}}
		</div>


	</div>

		<div class="col-sm-12"><hr></div>
		<div class="col-sm-12">
				<b-button size='sm' variant="outline-danger" @click="$bvModal.hide('modal-editarbanco')">Cerrar Modal</b-button>
		</div>

		</b-modal>

<!-- VER DATOS CUENTA EN MODAL -->

<b-modal v-cloak id='modal-nuevobanco' title="Detalles de la Cuenta a Crearse" hide-footer >
	<div class='row'>

<div class="col-sm-5">
		<span  ><i class="fas fa-piggy-bank"></i> Banco*: </span><br>

<select name="post_banco" id="post_banco" v-model="new_item.post_banco">
  <option value="Pacifico">Pacifico</option>
  <option value="Guayaquil">Guayaquil</option>
  <option value="Austro">Austro</option>
  <option value="Produbanco">Produbanco</option>
    <option value="Pichincha">Pichincha</option>
  <option value="Internacional">Internacional</option>
    <option value="Bolivariano">Bolivariano</option>
  <option value="Solidario">Solidario</option>
</select>


 <!--      <b-form-input  placeholder="Ingrese nombre" v-model="new_item.post_banco"></b-form-input> -->

</div>
<div class="col-sm-5">
		<span  > Tipo de Cuenta*: </span><br>

<select name="gearbox" id="gearbox" v-model="new_item.gearbox">
  <option value="ahorros">Ahorros</option>
  <option value="corriente">Corriente</option>
</select>

<!--       <b-form-input  placeholder="Ingrese tipo" v-model="new_item.gearbox"></b-form-input> -->

</div>
<div class="col-sm-5">
		<span  ><i class="fas fa-list-ol"></i> Numero de Cuenta*: </span><br>
       <b-form-input  placeholder="Ingrese numero" v-model="new_item.numero_cuenta"></b-form-input>
</div>
<div class="col-sm-5">
		<span  ><i class="fas fa-user-tag"></i> Propietario de la cuenta*: </span><br>
       <b-form-input  placeholder="Ingrese nombre" v-model="new_item.post_excerpt"></b-form-input>
</div>
<div class="col-sm-5">
		<span  ><i class="fas fa-id-card"></i> Cedula*: </span><br>
       <b-form-input  placeholder="Ingrese numero" v-model="new_item.post_content"></b-form-input>
</div>
<div class="col-sm-5">
		<span  ><i class="fas fa-envelope"></i> Email: </span><br>
       <b-form-input  placeholder="Ingrese email valido" v-model="new_item.user_email"></b-form-input>
</div>



	</div>

		<div class="col-sm-12"><hr></div>
		<div class="row">
			<div class="col-sm-8  centrado">				
					<b-button  v-bind:disabled = '!btn_switch' size='lg' variant="success" @click='create_item(); $bvModal.hide("modal-nuevobanco")'><i class="fas fa-money-check-alt"></i> Crear nueva Cuenta</b-button>

					<button v-show='!btn_switch' class="btn btn-lg no-border btn-outline-danger" id='mensaje_2'><i class="fas fa-exclamation"></i></button>

					<b-tooltip target="mensaje_2"><i class="fas fa-exclamation-triangle"></i> {{mensaje_creacion}}</b-tooltip>

			</div>
			<div class="col-sm-4  ">				
					<b-button  size='lg' variant="outline-danger" @click="$bvModal.hide('modal-nuevobanco') ; ">Cancelar</b-button>
			</div>			
		</div>

		</b-modal>



<!-- INICIO PANELES DE INFORMACON INFERIORES -->

<div v-cloak class="row">

<!-- PANEL DE CUENTAS BANCARIAS -->

	<div class="col-sm-6 principal">
		<h4><i class="fas fa-2x fa-piggy-bank"></i> Cuentas bancarias registradas <br><small class="smaller" v-if='usuarios_info_set.length'> (total:{{usuarios_info_set.length}}) </small>

<!--			<a href="../usuario-configuracion" class="btn no-border btn-outline-primary btn-sm"><i class="fas fa-money-check-alt"></i> Agregar mas cuentas</a>
-->

		</h4>
	</div>


	<div class="col-sm-6 principal">
					<b-button  size='lg' variant="success" @click=' $bvModal.show("modal-nuevobanco")'><i class="fas fa-money-check-alt"></i> Declarar nueva Cuenta</b-button>
	</div>

<div v-cloak class="row" id='list' v-if='usuarios_info_set.length'>
	<div class="col-sm-12" v-for='(element_banco, index) in usuarios_info_set' :key="element_banco.ID">
		<b>Banco: {{element_banco.post_banco}}</b>
		<b-button  id='edit_item_banco' v-b-modal.modal-editarbanco @click='start_edit(element_banco)' variant="outline-secondary" size="sm" class="no-border"><i class="fas fa-user-edit"></i>Ver Detalles</b-button>

				<b-button  id='edit_item_banco' v-b-modal.modal-eliminarbanco @click='start_delete(element_banco)' variant="outline-danger" size="sm" class="no-border"><i class="fas fa-user-edit"></i>Eliminar</b-button>

		<br>
		Cuenta {{element_banco.gearbox}} - {{element_banco.numero_cuenta}} 

		<button v-show='bloqueo(element_banco.post_date)' class="btn btn-sm smaller btn-warning" :id="`element_banco-${index}`" ><i class="fas fa-exclamation-triangle"></i> Verificandose..</button>

		<b-tooltip :target="`element_banco-${index}`"><i class="fas fa-exclamation-triangle"></i> Esta cuenta no podra ser utilizada para transferencias hasta terminarse la verificacion..</b-tooltip>
		
		<br>
	</div>
</div>

<p v-cloak id='err_msg' v-else>{{err_msg}}</p> 


</div> <!-- FIN PANELES NOTIFICACIONES INFERIOR -->


</div> <!-- FIN DEL DIV CON EL ID QUE CARGARA EL VUE -->


<?php

} else {

echo '<div class="alert alert-danger" role="alert"><i class="fas fa-2x fa-user-lock"></i> Su usuario se encuentra bloqueado. Comuniquese con su Empresa por favor para desbloquear</div>';

}


	} //cierre de creacion de shortcode
);


?>