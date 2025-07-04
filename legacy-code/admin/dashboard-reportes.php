<?php

// Creacion del shortcode que hara la pagina 

add_shortcode( 'reportes_admin', function () {

$profile_id = um_profile_id();
	
if ( (get_user_role($profile_id) == 'superadmin') || (get_user_meta($profile_id, 'gearbox', true ) == 'true')) {
	
  wp_enqueue_script('reportes_vue_admin');  //Add my Vue code for the page

 ?> 

	<div id="reportes_admin"> <!-- DIV CON EL ID QUE CARGARA EL VUE -->

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

<!-- MODAL DE FILTRADOS DE SOLICITUDES POR USUARIO -->

<b-modal v-cloak id='modal-resumenes' title="Detalles de las Solicitudes" hide-footer>

		<div class="col-sm-12" v-if='mi_info.flexirol3 == 2'>
			<b>Valor del Plan mensual:</b> ${{mi_info.flexirol2}}/mes <small>(mas IVA)</small><br>
		</div>
<hr>

<div class="row" id='list' v-if='filteredRows.length'>


	<div class="col-sm-12 row" v-for='(element_solicitud, index) in filteredRows' :key="element_solicitud.ID" >
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

<!-- PANEL DE SOLICITUDES MENSUALES -->

<div class="col-sm-12" v-if='habilitado_switch'>
<b-alert  variant="success" dismissible show>
      La Descarga del reporte mensual ya esta disponible!
    </b-alert>
</div>

	<div class="col-sm-12 terciario" v-if='habilitado_switch' >
		<h4>Reporte Mensual: {{mes_calculado}}
		<b-button  v-on:click="startexport" variant="success">Descargar reporte Mensual</b-button>		
		</h4>
		<hr class="terciario">
    </div>


<!-- INICIO TOTALES PEDIDOS -->

<div class="col-sm-6 principal">
	<h4 v-if='!habilitado_switch'>Estado actual de Solicitudes procesandose:{{mes_calculado}}</h4>
</div>

<div class="input-group col-sm-3">
    <input class="form-control py-2" type="search" placeholder="Filtrar las solicitudes.." v-model="filter_total">
    <span class="">
        <button class="btn btn-outline-secondary" type="button">
            <i class="fa fa-search"></i>
        </button>
    </span>
</div>

<div class="col-sm-1">
	<button v-on:click="resetOptions" class="btn btn-sm btn-outline-danger">Reset</button>
</div>


<div v-cloak class="col-sm-12 row" id='list' v-if='Object.keys(totales_sumados).length'>
	<div class="col-sm-4 row" v-for='(element_sumados, index) in Object.keys(totales_sumados)' :key="element_sumados.ID" >
		<p><b>Usuario: {{totales_sumados[element_sumados].nombre_completo}}</b> - <br></p>
		<p>{{(totales_sumados[element_sumados].cedula)}}<br></p>
		<p>Monto Consumido: ${{(totales_sumados[element_sumados].total).toFixed(2)}}
		<b-button  v-b-modal.modal-resumenes @click='start_resumen(element_sumados)' variant="outline-secondary" size="sm" class="no-border"><i class="fas fa-user-edit"></i>Ver Detalles</b-button>
		</p>		
	</div>
  </div>

	<p  id='err_msg' v-else>{{err_msg}}</p> 


  </div>


</div> <!-- FIN DEL DIV CON EL ID QUE CARGARA EL VUE -->


<?php

} else {

echo '<div class="alert alert-danger" role="alert"><i class="fas fa-2x fa-user-lock"></i> Su usuario ha sido bloqueado por Admin. Comuniquese por favor para desbloquear</div>';

}

	} //cierre de creacion de shortcode
);


?>