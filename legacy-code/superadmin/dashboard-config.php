<?php

// Creacion del shortcode que hara la pagina 

add_shortcode( 'config_usuarios_admin', function () {


$profile_id = um_profile_id();
	
if ( (get_user_role($profile_id) == 'superadmin') || (get_user_meta($profile_id, 'gearbox', true ) == 'true')) {

  wp_enqueue_script('config_usuarios_vue_admin');  //Add my Vue code for the page

 ?> 

<div id="config_usuarios_admin"> <!-- DIV CON EL ID QUE CARGARA EL VUE -->

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

<!-- EDITAR USUARIO INFO PAGOS -->



<div class="row" v-if='rol_actual=="empresa"'>
	<div class="col-sm-12">
		<div role="alert" class="alert alert-primary">
			Su configuracion de Ciclo de Anticipos mensual ha sido configurado por FlexiRol. Si requiere hacer cambios a estos parametros, comuniquese por favor con soporte@flexirol.com  

		<div class="col-sm-12 principal">
			<h4>
				<!--<i class="fas fa-percentage"></i> -->
			<br>Su Plan seleccionado actual:
		</h4>
		</div>

<p v-if='edited_item.flexirol3==2'> PLAN 2: Valor fijo/pago mensual recurrente (${{edited_item.flexirol2}} / mensual) <small>(mas IVA)</small></p>
<p v-else> PLAN 1: Porcentaje sobre la transaccion ({{edited_item.flexirol}}% del Anticipo) <small>(mas IVA)</small></p>

		</div>

	</div>

</div>

	<div v-else class="row">

		<div class="col-sm-12 principal">
			<h4><i class="fas fa-percentage"></i> Configuracion General de costo del Servicio</h4>
		</div>


		<div class="col-sm-6 row">
			<h5 class="col-sm-12">Plan 1: Porcentaje sobre la transaccion</h5>


		<div class="col-sm-5">
				Valor del servicio FlexiRol
		</div>
		<div class="col-sm-3">
				{{edited_item.flexirol}}% del Anticipo
		</div>		
		<div class="col-sm-2" v-if='rol_actual=="superadmin"'>
				<b-button variant="outline-primary" class='no-border' v-on:click=" edited_item.flexirol += 1 , check_edit()" ><i class="fas fa-plus-square"></i></b-button>
				<b-button variant="outline-danger" class='no-border' v-on:click=" edited_item.flexirol -= 1 , check_edit()"><i class="fas fa-minus-square"></i></b-button>
		</div>
		<div class="col-sm-12">
			<hr>
		</div>
		</div>


		<div class="col-sm-6 row">
			<h5 class="col-sm-12">Plan 2: Valor fijo/pago mensual recurrente</h5>


		<div class="col-sm-5">
				Valor del servicio FlexiRol
		</div>
		<div class="col-sm-3">
			${{edited_item.flexirol2}} / mensual
		</div>		
		<div class="col-sm-2" v-if='rol_actual=="superadmin"'>
				<b-button variant="outline-primary" class='no-border' v-on:click="edited_item.flexirol2 += 1 , check_edit()"><i class="fas fa-plus-square"></i></b-button>
				<b-button variant="outline-danger" class='no-border' v-on:click="edited_item.flexirol2 -= 1 , check_edit()"><i class="fas fa-minus-square"></i></b-button>
		</div>
		<div class="col-sm-12">
			<hr>
		</div>
		</div>


		<div class="col-sm-12 row">
			<h5 class="col-sm-12 principal">Plan predeterinado para nuevos Usuarios</h5>
		<div class="col-sm-3">
      <b-form-radio v-model="edited_item.flexirol3"  name="some-radios" value="1">Plan 1</b-form-radio>
</div>		<div class="col-sm-3">
      <b-form-radio v-model="edited_item.flexirol3"  name="some-radios" value="2">Plan 2</b-form-radio>
</div>
		<div class="col-sm-12">
			<hr>
		</div>
		</div>






	</div>

	<div class="row" v-cloak>

		<div class="col-sm-12 principal">
			<h4><i class="fas fa-hand-holding-usd"></i> Configuracion del ciclo de Anticipos mensual</h4>
		</div>

		<div class="col-sm-3">
				Dia de inicio de ciclo
		</div>
		<div class="col-sm-2">
				{{edited_item.dia_inicio}} de cada mes
		</div>		
		<div class="col-sm-2" v-if='rol_actual=="superadmin"'>
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
		<div class="col-sm-2" v-if='rol_actual=="superadmin"'>
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
		<div class="col-sm-2" v-if='rol_actual=="superadmin"'>
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
		<div class="col-sm-2" >
				<b-button v-if='rol_actual=="superadmin"' variant="outline-primary" class='no-border' v-on:click="edited_item.dia_bloqueo += 1 , check_edit()"><i class="fas fa-plus-square"></i></b-button>
				<b-button v-if='rol_actual=="superadmin"' variant="outline-danger" class='no-border' v-on:click="edited_item.dia_bloqueo -= 1 , check_edit()"><i class="fas fa-minus-square"></i></b-button>

<button class="btn btn-outline-secondary no-border" id='peticiones'><i class="fas fa-question-circle"></i></button>

		</div>
		<div class="col-sm-5">
<b-tooltip target="peticiones">las solicitudes de peticiones iniciaran y se bloquearan este numero de dias dentro de su ciclo de Anticipos mensual</b-tooltip>			
		</div>		
		
		<div class="col-sm-3">
				Frecuencia maxima de Anticipos por ciclo
		</div>
		<div class="col-sm-2" >
				{{edited_item.frecuencia}} solicitudes mensuales
		</div>		<div class="col-sm-2" >
				<b-button v-if='rol_actual=="superadmin"' variant="outline-primary" class='no-border' v-on:click="edited_item.frecuencia += 1 , check_edit()"><i class="fas fa-plus-square"></i></b-button>
				<b-button v-if='rol_actual=="superadmin"' variant="outline-danger" class='no-border' v-on:click="edited_item.frecuencia -= 1 , check_edit()"><i class="fas fa-minus-square"></i></b-button>

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
		<div class="col-sm-2" >
				<b-button v-if='rol_actual=="superadmin"' variant="outline-primary" class='no-border' v-on:click="edited_item.dia_reinicio += 1 , check_edit()"><i class="fas fa-plus-square"></i></b-button>
				<b-button v-if='rol_actual=="superadmin"' variant="outline-danger" class='no-border' v-on:click="edited_item.dia_reinicio -= 1 , check_edit()"><i class="fas fa-minus-square"></i></b-button>

<button class="btn btn-outline-secondary no-border" id='pagos'><i class="fas  fa-question-circle"></i></button>

		</div>
		<div class="col-sm-5">
<b-tooltip target="pagos">Al realizarse un deposito, cuandos dias despues se rehabilita poder solicitar Anticipos</b-tooltip>			

		</div>		
		
		<div class="col-sm-12" v-if='rol_actual=="superadmin"'>
			<hr>
				<b-button  size='lg' variant="outline-success" @click='save_edit()'><i class="fas fa-user-edit"></i>Guardar Todos los Cambios</b-button>

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