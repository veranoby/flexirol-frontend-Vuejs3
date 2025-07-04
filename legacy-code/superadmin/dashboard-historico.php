<?php

// Creacion del shortcode que hara la pagina 

add_shortcode( 'reporte-historico', function () {

$profile_id = um_profile_id();
	
if ( (get_user_role($profile_id) == 'superadmin') || (get_user_role($profile_id) == 'operador') || (get_user_meta($profile_id, 'gearbox', true ) == 'true')) {
	
  wp_enqueue_script('historico_vue_admin');  //Add my Vue code for the page

 ?> 

	<div id="reportes_historico"> <!-- DIV CON EL ID QUE CARGARA EL VUE -->

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

<b-modal v-cloak id='modal-editar' title="Detalles de la Solicitud" hide-footer>
	<div class='row'>
		<div class="col-sm-12">
			<b>Fecha de la solicitud: {{edited_item.post_date}}</b><br>
		</div>
		<div class="col-sm-12">
			Solicitante: {{detalle_solicitud[0]}} <br>
		</div>
		<div class="col-sm-12">
			Transferido a: Banco {{detalle_solicitud[2]}} 
		</div>

	</div>
<hr>
		<div class="col-sm-12">
				<b-button size='sm' variant="outline-danger" @click="$bvModal.hide('modal-editar')">Cerrar Modal</b-button>
		</div>

		</b-modal>



<!-- INICIO PANELES DE INFORMACON INFERIORES -->

<div v-cloak class="row" >

<!-- MODAL DE FILTRADOS DE SOLICITUDES POR USUARIO -->

<b-modal v-cloak id='modal-resumenes' title="Detalles de las Solicitudes" hide-footer>

<div class="row" id='list' v-if='filteredRows.length'>
	<div class="col-sm-12 row" v-for='(element_solicitud, index) in filteredRows' :key="element_solicitud.ID" >
		<div class="col-sm-8">
			<b>Solicitado el: {{element_solicitud.post_date}}</b> - Monto: ${{Number(element_solicitud.post_excerpt) + Number(element_solicitud.gearbox)}} 
		</div>
		<div class="col-sm-4">
			<button v-bind:class='element_solicitud.tag' class="btn btn-sm">{{element_solicitud.tag}}</button> <br>
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
	<h4><i class="far fa-file-archive"></i> Historial de Solicitudes de Anticipo</h4>
</div>

	<div class="col-sm-3"><!-- POR CEDULA -->
	 Por Cedula..
<b-form-input v-model="dob_cedula"></b-form-input>
	</div>

<div class="col-sm-1"> <!-- POR FECHA -->
<?php
$terms_year = array(
    'post_type' => 'solicitud',
    'group by' 
);

$years = array();
$query_year = new WP_Query($terms_year);

if ($query_year->have_posts()):
    while ($query_year->have_posts()): $query_year->the_post();
        $year = get_the_date('Y');
        if (!in_array($year, $years)) {
            $years[$year] = $year;
        }
    endwhile;
    wp_reset_postdata();
endif;

echo 'Por Año: <b-form-select v-model="dob_year">
    <b-form-select-option :value="null">Seleccione Año</b-form-select-option>' ;

foreach ($years as $key => $value) {
echo '<b-form-select-option value="'.$value.'">'.$value.'</b-form-select-option>';
}

echo '</b-form-select>';
?>

</div>

<div class="col-sm-2"> <!-- POR MES -->
Por mes: <b-form-select v-model="dob_month" >
    <b-form-select-option :value="null">Seleccione Mes</b-form-select-option>
    <b-form-select-option value="01">Enero</b-form-select-option>
    <b-form-select-option value="02">Febrero</b-form-select-option>
    <b-form-select-option value="03">Marzo</b-form-select-option>
    <b-form-select-option value="04">Abril</b-form-select-option>
    <b-form-select-option value="05">Mayo</b-form-select-option>
    <b-form-select-option value="06">Junio</b-form-select-option>
    <b-form-select-option value="07">Julio</b-form-select-option>
    <b-form-select-option value="08">Agosto</b-form-select-option>
    <b-form-select-option value="09">Septiembre</b-form-select-option>
    <b-form-select-option value="10">Octubre</b-form-select-option>
    <b-form-select-option value="11">Noviembre</b-form-select-option>
    <b-form-select-option value="12">Deciembre</b-form-select-option>
</b-form-select>

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
	<button v-on:click="retrieve_all_solicitudes" class="btn btn-primary"><i class="fab fa-searchengin"></i> Buscar Solicitudes</button>
	<b-button size='sm' variant="outline-danger no-border" v-on:click="resetOptions" >Borrar/Reiniciar</b-button>
</div>

<div v-cloak class="row" id='list' v-if='Object.keys(totales_sumados).length'>
	<div class="col-sm-12"><hr class=""></div>
	<div class="col-sm-6 terciario">
	<h4><i class="fab fa-searchengin"></i> Filtrar resultados de la Busqueda</h4>		
	</div>
	<div class="input-group col-sm-3">
	    <input class="form-control py-2" type="search" placeholder="Filtrar las solicitudes.." v-model="filter_total">
	    <span class="">
	        <button class="btn btn-outline-secondary" type="button">
	            <i class="fa fa-search"></i>
	        </button>
	    </span>
	</div>
	<div class="col-sm-3"  >
		<b-button  v-on:click="startexport" variant="success"><i class="far fa-file-excel"></i> Descargar este Reporte</b-button>
	<b-button size='sm' variant="outline-danger no-border" v-on:click="resetOptions_filtro" >Limpiar Filtro</b-button>
    </div>
	<div class="col-sm-12"><br></div>

	<div class="col-sm-4" v-for='(element_sumados, index) in Object.keys(totales_sumados)' :key="element_sumados.ID" >
		<b>Usuario: {{totales_sumados[element_sumados].nombre_completo}}</b> <br>
		<small>{{(totales_sumados[element_sumados].ID_empresa)}}</small><br>
		{{(totales_sumados[element_sumados].cedula)}}<br>
		Monto Consumido: ${{(totales_sumados[element_sumados].total).toFixed(2)}}
		<b-button  v-b-modal.modal-resumenes @click='start_resumen(element_sumados)' variant="outline-secondary" size="sm" class="no-border"><i class="fas fa-user-edit"></i>Ver Detalles</b-button>
	</div>
  </div>

<div v-cloak class="col-sm-12 row" v-else>

	<div class="col-sm-12"><hr class=""></div>

	<div class="col-sm-6">	
		<h4  class="terciario"><i class="fab fa-searchengin"></i> {{err_msg}} 
		</h4>
	</div>
	<div class="input-group col-sm-3" v-if='solicitudes_info_set.length'>
	    <input class="form-control py-2" type="search" placeholder="Filtrar las solicitudes.." v-model="filter_total">
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