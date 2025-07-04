<?php

// Creacion del shortcode que hara la pagina 

add_shortcode( 'solicitudes_usuarios', function () {

$profile_id = um_profile_id();
$rol_actual = get_user_role($profile_id);
$mi_empresa_madre = get_user_meta( $profile_id, "empresa", true ) ; 

if (get_user_meta($profile_id, 'gearbox', true ) != 'false' && get_user_meta($mi_empresa_madre, 'gearbox', true ) != 'false') {

  wp_enqueue_script('solicitudes_vue_usuarios');  //Add my Vue code for the page

 ?> 

	<div id="solicitudes_usuarios"> <!-- DIV CON EL ID QUE CARGARA EL VUE -->

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

<!-- VER INFO SOLICITUD EN MODAL -->

<b-modal v-cloak id='modal-editar' size='lg' title="Detalles de la Solicitud" hide-footer>
	<div class='row'>

		<div class="col-sm-2 ">
			<i class="fas fa-comments-dollar secundario fa-7x"></i>
		</div>

		<div class="col-sm-10 centrado">
			<b>Fecha de la solicitud: {{edited_item.post_date}}</b><br>
			Transferido a: Banco {{detalle_solicitud[2]}} 
			<hr class="secundario">			
			<h4 class='secundario'> Solicitante: {{detalle_solicitud[0]}} </h4>
		<b>
			<b v-if='mi_info.flexirol3 == "1"'><i class="fas fa-exclamation"></i> Importante: {{detalle_solicitud[1]}} <small>(mas IVA)</small></b>
			<b v-else><i class="fas fa-exclamation"></i> Importante: Plan Activo Actual: {{mi_info.flexirol2}}$/mes <small>(mas IVA)</small> a descontarse de su Sueldo</b>
		</b>
		</div>

		<div class="col-sm-12">
				<b-button size='sm' variant="outline-danger" @click="$bvModal.hide('modal-editar')">Cerrar Modal</b-button>
		</div>
	</div>
</b-modal>

<!-- VER DATOS CUENTA EN MODAL -->

<b-modal v-cloak id='modal-editarbanco' title="Detalles de la cuenta bancaria" hide-footer >
	<div class='row'>

		<div class="col-sm-12">
				<span><i class="fas fa-piggy-bank"></i> Banco {{editedbanco_item.post_banco}}

				<span> - Cuenta </span>{{editedbanco_item.gearbox}}

			<span><i class="fas fa-list-ol"></i> Numero: </span>
				{{editedbanco_item.numero_cuenta}}
		</div>		
		<div class="col-sm-12">
				<span><i class="fas fa-user-tag"></i> Nombre de propietario de la cuenta: </span>
				{{editedbanco_item.post_excerpt}}
		</div>		
		<div class="col-sm-12">				
				<span><i class="far fa-id-card"></i> Cedula: </span>
				{{editedbanco_item.post_content}}
		</div>		
		<div class="col-sm-12">
				<span><i class="far fa-envelope"></i> Email: </span>
				{{editedbanco_item.user_email}}
		</div>


	</div>

		<div class="col-sm-12"><hr></div>
		<div class="col-sm-12">
				<b-button size='sm' variant="outline-danger" @click="$bvModal.hide('modal-editarbanco')">Cerrar Modal</b-button>
		</div>

		</b-modal>


<!-- MODAL MANEJAR SUSCRIPCION -->

<b-modal v-cloak id='modal-cancelar-cuenta' title="Plan de Suscripcion Actual" hide-footer >


Plan Disponible Actual: Valor fijo/pago mensual recurrente ({{mi_empresa_info.flexirol2}}$/mes) <small>(mas IVA)</small>

<p v-if='mi_info.flexirol4 == "si"' style=" text-align: center; ">

<button class="btn btn-outline-warning btn-lg no-border" ><i class="fas fa-2x fa-exclamation-triangle"></i> Esta seguro que desea proceder y Cancelar su Suscripcion? </button>

<b-button  variant="danger" size="lg" @click=' mi_info.flexirol4 = "no" ; cancelar_suscripcion(); $bvModal.hide("modal-cancelar-cuenta") ;'>
Confirmar Cancelacion</b-button>
</p>

<p  v-else style=" text-align: center; ">

<button class="btn btn-outline-info btn-lg no-border" ><i class="fas fa-2x fa-exclamation-triangle"></i> Confirmar la activacion de su plan?  </button> <br><br>

<label style=" text-align: left; color: gray">
<i class="fas fa-check-double"></i> Se cobrara el valor al final del ciclo de pago <br>
<i class="fas fa-check-double"></i> No podra cancelar la suscripcion hasta el inicio del siguiente ciclo de pago <br><br>
</label>

<b-button  variant="success" size="lg" @click="$bvModal.hide('modal-cancelar-cuenta'); mi_info.flexirol4 = 'si' ; activar_suscripcion(); "><i class="far fa-check-square"></i> Activar mi subscripcion</b-button>

</p>

<b-button  variant="outline-danger" size="sm" @click="$bvModal.hide('modal-cancelar-cuenta');">Cerrar pantalla</b-button>

</b-modal>


<!-- CREAR SOLICITUD -->

<b-modal v-cloak id='modal-crear' title="Solicitar un Anticipo" hide-footer size='lg'>

	<h4 class='terciario'>Monto disponible actual: <b>${{disponible_aun}}</b></h4>
	<div class='row'>

		<div class="col-sm-5">
				<span class='terciario'><i class="fas fa-2x fa-comments-dollar"></i>  Monto requerido*: </span><br>

           <b-form-input  placeholder="Ingrese cantidad" v-model="monto.value"></b-form-input>

		</div>

		<div class="col-sm-7">
				<span class='terciario'><i class="fas fa-2x fa-piggy-bank"></i> Cuenta bancaria*: </span><br>

	        <b-form-select  v-model="monto.selected" required>

		      <b-form-select-option v-for='(element, index) in bancos_info_set ' v-if='!bloqueo(element.post_date)'  v-bind:key='index'
		   
		       :value="element.ID"> 
		      
<!--

	    	<b-form-select  v-model="monto.selected" @change="select_cuenta_bancaria($event)" required>

		      <b-form-select-option v-for='(element, index) in bancos_info_set ' v-if='!bloqueo(element.post_date)'  v-bind:key='index'
		   
		       :value="element.post_banco + ' - Cuenta ' + element.gearbox + ': ' + element.numero_cuenta  + '<br>Nombre: ' + element.post_excerpt + ' - Cedula: ' + element.post_content + ' - ' + element.user_email"> 
-->


		   {{element.post_banco}} - Cuenta {{element.gearbox}}: {{element.numero_cuenta}}</b-form-select-option>

			</b-form-select>

<!--		<b-form-input  v-model='monto.user_email' ></b-form-input> -->


	</div>

			<div class="col-sm-12 centrado">
				<hr class=" ">				
			</div>

	</div>
		<div v-if='! btn_switch' class="row secundario">

			<div class="col-sm-3 centrado" >
					<h4><small>Costo de la transaccion: </small><br>
					${{monto.tax}} </h4>
			</div>
			<div class="col-sm-3 centrado" >
					<h4><small>Monto del Anticipo: </small><br>
					${{monto.value}} </h4>
			</div>		
			<div class="col-sm-6 terciario centrado" >
					<h4>Total a Descontarse del Sueldo: <br>
					${{monto.total}} <small v-if='mi_info.flexirol3 == "1"'>(mas IVA)</small></h4>
			</div>
			<div class="col-sm-12 centrado">
				<hr class="secundario ">				
			</div>	


<div class="col-sm-12 centrado" v-if='mi_empresa_info.flexirol3 == "2" && mi_info.flexirol4 == "no"'>
	<button class="btn btn-outline-info btn-lg no-border" ><i class="fas fa-2x fa-exclamation-triangle"></i> Su plan no esta Activo!</button> <br><br>

<label style=" text-align: left; color: gray">
<i class="fas fa-check-double"></i> Si confirma el anticipo, su suscripcion se activara automaticamente <br>
<i class="fas fa-check-double"></i> Se cobrara el valor de su suscripcion al final del ciclo de pago <br>
<i class="fas fa-check-double"></i> No podra cancelar la suscripcion hasta el inicio del siguiente ciclo de pago <br><br>
</label>
</div>

	</div>
		<div class="row">
			<div class="col-sm-12  centrado">				
					<b-button  v-bind:disabled = 'btn_switch' size='lg' variant="success" @click='create_item(); $bvModal.hide("modal-crear")'><i class="fas fa-money-check-alt"></i> Solicitar nuevo Anticipo</b-button>
					<button v-if='btn_switch' class="btn btn-sm no-border btn-outline-danger" id='mensaje_2'><i class="fas fa-exclamation"></i></button>
					<b-tooltip target="mensaje_2"><i class="fas fa-exclamation-triangle"></i> Llene los campos para poder solicitar por favor</b-tooltip>
			</div>
			<div class="col-sm-12  ">				
					<b-button  size='sm' variant="outline-danger" @click="$bvModal.hide('modal-crear') ; reset_monto();">Cancelar/Cerrar Modal</b-button>
			</div>			
		</div>
</b-modal>


<!-- MENSAJE ADVERTENCIA ACTUALIZACION EXCEL -->
<div class="row">
		<div class="col-sm-6">
	<div v-bind:class="clase_importante" role="alert">
		{{mensaje_bloqueo}}
	</div>
</div>
		<div class="col-sm-6">
		<div v-bind:class="clase_importante" role="alert">
		<i class="far fa-calendar-alt"></i>  Fecha: {{fecha_hoy}}  
	</div>
		</div>
</div>


<!-- PANEL INICIAL DE INFO PERSONAL DEL USUARIO -->

<div v-if='habilitado_switch' class="row alert alert-warning clase_importante" v-cloak style="background: #ffe488;border-radius: 8px;">

<!--
<div  class="col-sm-1 secundario">
<i class="fas fa-7x fa-hand-holding-usd"></i>
</div>
-->

<div  class="col-sm-8 centrado secundario">

<br>

<!-- seccion sobre el plan actual -->

<p class="" v-if='mi_empresa_info.flexirol3 == "1"'
style=" font-weight: bolder;background: #ffbc00;color: white;padding: 10px;text-shadow: 0px 0px 4px black;border-radius: 5px;">PLAN ACTUAL:PORCENTAJE SOBRE TRANSACCION (&nbsp;{{mi_empresa_info.flexirol}} &nbsp; % &nbsp; ) <small>(mas IVA)</small></p>

<p class="" v-else
style=" font-weight: bolder;background: #ffbc00;color: white;padding: 10px;text-shadow: 0px 0px 4px black;border-radius: 5px; "> PLAN ACTUAL: PAGO MENSUAL RECURRENTE ( &nbsp; $ &nbsp; {{mi_empresa_info.flexirol2}} &nbsp; / &nbsp; mes &nbsp; ) <small>(mas IVA)</small></p>

<!-- checar si se puede cancelar o no la mensualidad , estando en el plan flexirol3=2 -->

<p style=" font-weight: bolder;background: #ffbc00;color: white;padding: 10px;text-shadow: 0px 0px 4px black;border-radius: 5px;" v-if='mi_empresa_info.flexirol3 == "2" && mi_info.flexirol4 == "si"'>
	ESTADO SUSCRIPCION: ACTIVADA  

	<b-button  v-if='solicitudes_info_set.length' variant="outline-warning no-border" size="sm"><i class="fas fa-exclamation-triangle"></i> puede Cancelarla al final del ciclo de pagos.. 
	</b-button>
	<b-button  v-else size="sm"  @click="$bvModal.show('modal-cancelar-cuenta') ; "><i class="fas fa-exclamation-triangle"></i> Cancelar mi subscripcion
	</b-button>
</p>

<p style="font-weight: bolder;background: #ffbc00;color: white;padding: 10px;text-shadow: 0px 0px 4px black;border-radius: 5px;" v-if='mi_empresa_info.flexirol3 == "2" && mi_info.flexirol4 == "no"'>
	SU SUSCRIPCION NO ESTA ACTIVADA!
	<b-button   size="sm"  @click="$bvModal.show('modal-cancelar-cuenta') ; "><i class="fas fa-exclamation-triangle"></i> Activar mi subscripcion</b-button>
</p>

		<h4 style="font-weight: bolder;background: #ffbc00;color: white;padding: 10px;text-shadow: 0px 0px 4px black;border-radius: 5px; ">
			MONTO DISPONIBLE ACTUAL: 
			<b>${{disponible_aun}}</b>

		</h4>

	</div>	

<!-- seccion realizar solicitud -->

	<div class="col-sm-4 centrado ">
		<h4 >
			<br><br>
			<b-button v-b-modal.modal-crear variant="success circular" ><i class="fas fa-3x fa-money-check-alt"></i><br> SOLICITAR ANTICIPO</b-button>

		</h4>
	</div>

</div>

<div v-else class="row error" v-cloak>
<div class="col-sm-12">comuniquese por favor con su empresa si requiere informacion adicional..
</div>	
<div class="col-sm-12"><hr class="error"></div>
</div>						


<!-- INICIO PANELES DE INFORMACON INFERIORES -->

<div v-cloak class="row">

<!-- PANEL DE CUENTAS BANCARIAS -->

<div class="col-sm-6">

	<div class="col-sm-12 principal">
		<h4><i class="fas fa-2x fa-piggy-bank"></i> Cuentas bancarias registradas <br><small class="smaller" v-if='bancos_info_set.length'> (total:{{bancos_info_set.length}}) </small><a href="../usuario-configuracion" class="btn no-border btn-outline-primary btn-sm"><i class="fas fa-money-check-alt"></i> Agregar mas cuentas</a>
		</h4>
	</div>

<div v-cloak class="row" id='list' v-if='bancos_info_set.length'>
	<div class="col-sm-12" v-for='(element_banco, index) in bancos_info_set' :key="element_banco.ID">
		<b>Banco: {{element_banco.post_banco}}</b>
		<b-button  id='edit_item_banco' v-b-modal.modal-editarbanco @click='start_edit_banco(element_banco)' variant="outline-secondary" size="sm" class="no-border"><i class="fas fa-user-edit"></i>Ver Detalles</b-button>
		<br>
		Cuenta {{element_banco.gearbox}} - {{element_banco.numero_cuenta}} 

		<button v-show='bloqueo(element_banco.post_date)' class="btn btn-sm smaller btn-warning" :id="`element_banco-${index}`" ><i class="fas fa-exclamation-triangle"></i> Verificandose..</button>

		<b-tooltip :target="`element_banco-${index}`"><i class="fas fa-exclamation-triangle"></i> Esta cuenta no podra ser utilizada para transferencias hasta terminarse la verificacion..</b-tooltip>
		
		<br>
	</div>
</div>

<p v-cloak id='err_msg' v-else>{{err_msg}}</p> 

</div>


<!-- PANEL DE SOLICITUDES MENSUALES -->

<div class=" col-sm-6" v-cloak style="
    background: #337ab714;
    border-radius: 10px;
">
	<div class="col-sm-12 secundario">
		<h4><i class="fas fa-2x fa-comments-dollar"></i> Solicitudes de Anticipos registrados este mes <br><small class="smaller" v-if='solicitudes_info_set.length'> (total:{{solicitudes_info_set.length}})</small>
		</h4>

<p style=" font-weight: bolder; background: #337ab714; color: black; padding: 10px; border-radius: 5px; ">
	<i class="fas fa-user-tie"></i>  Empresa: {{mi_empresa_info.first_name}} - {{mi_empresa_info.last_name}} 
</p>



	</div>

<div v-cloak class="row" id='list' v-if='solicitudes_info_set.length'>
	<div class="col-sm-12" v-for='(element_solicitud, index) in solicitudes_info_set' :key="element_solicitud.ID" >

		<b>Fecha: {{element_solicitud.post_date}}</b> - Monto Solicitado: <span>${{element_solicitud.post_excerpt}} </span>
		<button v-bind:class='element_solicitud.tag' class="btn btn-sm">{{element_solicitud.tag}}</button> 

		<small v-if='element_solicitud.tag=="procesado"' style="color: green">el {{element_solicitud.post_modified}}</small> 

		<b-button  id='edit_item' v-b-modal.modal-editar @click='start_edit(element_solicitud)' variant="outline-secondary" size="sm" class="no-border"><i class="fas fa-user-edit"></i>Ver Detalles</b-button>

		<hr>
			
	</div>
  </div>

	<p v-cloak id='err_msg' v-else>{{err_msg}}</p> 

</div>

</div> <!-- FIN PANELES NOTIFICACIONES INFERIOR -->


</div> <!-- FIN DEL DIV CON EL ID QUE CARGARA EL VUE -->


<?php

} else {

echo '<div class="alert alert-danger" role="alert"><i class="fas fa-2x fa-user-lock"></i> Su usuario se encuentra bloqueado. Comuniquese con su Empresa por favor para desbloquear</div>';

}


	} //cierre de creacion de shortcode
);


?>