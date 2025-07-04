<?php

// Creacion del shortcode que hara la pagina 

add_shortcode( 'solicitudes_admin', function () {

	
  wp_enqueue_script('solicitudes_vue_admin');  //Add my Vue code for the page

 ?> 

	<div id="solicitudes_admin"> <!-- DIV CON EL ID QUE CARGARA EL VUE -->

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
			Procesar a: Banco {{detalle_solicitud[2]}} 
		</div>

	</div>
<hr>
		<div class="col-sm-12">
				<b-button size='sm' variant="outline-danger" @click="$bvModal.hide('modal-editar')">Cerrar Modal</b-button>
		</div>

		</b-modal>

<!-- VER DATOS CUENTA EN MODAL -->

<b-modal v-cloak id='modal-editarbanco' title="Detalles de la cuenta bancaria" hide-footer >
	<div class='row'>

		<div class="col-sm-12">
				<span><i class="fas fa-piggy-bank"></i> Banco {{editedbanco_item.post_title}}

				<span> - Cuenta </span>{{editedbanco_item.gearbox}}

			<span><i class="fas fa-list-ol"></i> Numero: </span>
				{{editedbanco_item.post_name}}
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


<!-- INICIO DE LOS TABS DE LAS SECCIONES DE FILTRADO -->

<b-card no-body v-cloak>
	<b-tabs card>

<!-- INICIO PANEL DE SOLICITUDES PENDIENTES -->
<b-tab title="Nuevas Solicitudes del Mes Actual" active v-on:click="resetOptions_procesando" >
        <b-card-text>

<div class="row">

	<div class="col-sm-8 terciario">
		<h4><i class="fas fa-hand-holding-usd"></i> Ultimas Solicitudes de Anticipos pendientes
				<small class="smaller" v-if='soliticudes_nuevas'> (total:{{soliticudes_nuevas.length}})</small>
				<label style="color: green"> Total a Anticiparse:${{total_pagarse}}</label>
		</h4>
	</div>

        <div class="col-sm-4">
<b-button  v-on:click="startexport" variant="success"><i class="fas fa-2x fa-file-excel"></i> Generar Excel Bancario para el listado actual</b-button>
        </div>

        <div class="input-group col-sm-4">
            <b-form-input type="search" placeholder="Filtrar por palabra clave/cedula.." v-model="filter"></b-form-input>
            <span class="">
                <button class="btn btn-outline-secondary" type="button">
                    <i class="fa fa-search"></i>
                </button>
            </span>
        </div>
        <div class="input-group col-sm-3">
	    	<b-form-select  v-model="status_procesando">
		      <b-form-select-option value="">Filtro por empresa</b-form-select-option>
		      <b-form-select-option v-for='element in empresa_info_set' v-bind:key='element.ID' :value='element.first_name'>{{element.first_name}} - {{element.last_name}}</b-form-select-option>
			</b-form-select>
        </div>

        <div class="input-group col-sm-3">
    	<b-form-select  v-model="status_por_banco" :options="options_bancos">
		</b-form-select>
        </div>

        <div class="col-sm-1">
<button v-on:click="resetOptions_procesando" class="btn btn-sm btn-outline-danger">Reset</button>
        </div>

<div class="col-sm-12">
<br>
</div>
  </div>

<div v-cloak class="row" id='list' v-if='soliticudes_nuevas.length'>
	<div class="col-sm-4 " v-for='(element_solicitud, index) in soliticudes_nuevas' :key="element_solicitud.ID" >
		<hr class="secundario">
		<b>Fecha: {{element_solicitud.post_date}}</b><br> 
		<b>{{element_solicitud.empleado}}</b> - {{element_solicitud.empresa}} <br>
		Monto Solicitado: ${{element_solicitud.post_excerpt}} 
		<b-button  id='edit_item' v-b-modal.modal-editar @click='start_edit(element_solicitud)' variant="outline-secondary" size="sm" class="no-border"><i class="fas fa-user-edit"></i>Ver Detalles</b-button>		
	</div>
  </div>

	<p  id='err_msg' v-else>{{err_msg}}</p> 

</b-card-text>
      </b-tab>

<!-- FIN PANEL DE SOLICITUDES PENDIENTES -->


<!-- INICIO PANEL DE SOLICITUDES PROCESANDO -->
<b-tab title="Anticipos procesandose del Mes Actual" v-on:click="resetOptions_procesando" >
        <b-card-text>

<div class="row" >
	<div class="col-sm-12 principal">
		<h4><i class="fas fa-hand-holding-usd"></i> Solicitudes Procesandose por Confirmarse.. <small class="smaller" v-if='soliticudes_pendientes'> (total:{{soliticudes_pendientes.length}})</small>
		</h4>
	</div>


        <div class="input-group col-sm-4">
            <b-form-input type="search" placeholder="Filtrar por palabra clave/cedula.." v-model="filter"></b-form-input>
            <span class="">
                <button class="btn btn-outline-secondary" type="button">
                    <i class="fa fa-search"></i>
                </button>
            </span>
        </div>
        <div class="input-group col-sm-3">
	    	<b-form-select  v-model="status_procesando">
		      <b-form-select-option value="">Filtro por empresa</b-form-select-option>
		      <b-form-select-option v-for='element in empresa_info_set' v-bind:key='element.ID' :value='element.first_name'>{{element.first_name}} - {{element.last_name}}</b-form-select-option>
			</b-form-select>
        </div>

        <div class="input-group col-sm-3">
    	<b-form-select  v-model="status_por_banco" :options="options_bancos">
		</b-form-select>
        </div>

        <div class="col-sm-1">
<button v-on:click="resetOptions_procesando" class="btn btn-sm btn-outline-danger">Reset</button>
        </div>


<!-- BOTON DE PRUEBAS 

        <div class="col-sm-1">
<button v-on:click="mandar_prueba" class="btn btn-sm btn-outline-warning">pruebas</button>
        </div>

 boton de pruebas -->        

<div class="col-sm-12">
<br>
</div>
  </div>

<div v-cloak class="row" id='list' v-if='soliticudes_pendientes.length'>
	<div class="col-sm-12 row" v-for='(element_solicitud_procesando, index) in soliticudes_pendientes' :key="element_solicitud_procesando.ID" >

<div class="col-sm-12"><hr class="principal"></div>

		<div class="col-sm-1">
			<small>Fecha:<br>{{element_solicitud_procesando.post_date}}</small>
		</div>
		<div class="col-sm-2">
			{{element_solicitud_procesando.empleado.toUpperCase()}}<br>
			{{(corta_secciones(element_solicitud_procesando.post_content)[0]).split(" - ")[1]}}
		</div>
		<div class="col-sm-2">
			<small>{{element_solicitud_procesando.empresa}}</small>
		</div> 
		<div class="col-sm-2">
			Monto Solicitado: ${{element_solicitud_procesando.post_excerpt}}
		</div>
		<div class="col-sm-3">
			{{corta_secciones(element_solicitud_procesando.post_content)[2]}} 
		</div>
		<div class="col-sm-2">
		<button v-on:click="confirmar_anticipo(element_solicitud_procesando.ID , element_solicitud_procesando.empresa_id)" class="btn btn-sm btn-primary">Confirmar Anticipo</button>
	</div>
	<hr>
			
	</div>
</div>

	<p  id='err_msg' v-else>{{err_msg}}</p> 

</b-card-text>
      </b-tab>
<!-- FIN PANEL DE SOLICITUDES PROCESANDO -->

<!-- INICIO PANEL DE SOLICITUDES PROCESADAS YA -->
<b-tab title="Anticipos transferidos del Mes Actual" v-on:click="resetOptions_procesando" >
        <b-card-text>


<!-- AREA DE REPORTES DE FIN DE MES POR EMPRESA -->

<div v-cloak class="row " v-if='empresa_info_set.length'>
	<div class="col-sm-4 principal">
		<h4><i class="far fa-chart-bar"></i> Reportes para Empresas inscritas<label class="smaller" v-if='empresa_info_set.length'> (total:{{empresa_info_set.length}})</label>
		</h4>
	</div>
	
    <div class="input-group col-sm-4">
        <input class="form-control py-2" type="search" placeholder=" Filtrar mis Usuarios.." v-model="filter_empresas">
        <span class="">
            <button class="btn btn-outline-secondary" type="button">
                <i class="fa fa-search"></i>
            </button>
        </span>
    </div>

    <div class="input-group col-sm-1">
        <span><input type="checkbox"  v-model="status_habilitacion_empresa"><br><small>Habilitados</small></span>
    </div>

    <div class="input-group col-sm-1">
        <span><input type="checkbox"  v-model="status_deshabilitacion_empresa"><br><small>Bloqueados</small></span>
    </div>


<!-- Info usuarios EMPRESAS -->

	<div class="col-sm-4 row" v-for='(element_empresa, index) in filteredRows_empresas' :key="`employee-${index}`" >
			
<!-- botones de habilitado y bloqueado -->

		<div class="col-sm-4">
			<button class="btn btn-sm btn-outline-danger no-border " v-if='element_empresa.gearbox == "false"'><i class="fas fa-ban"></i> Bloqueado</button> 
			<button class="btn btn-sm btn-outline-success no-border " v-else><i class="far fa-stop-circle"></i> Activo</button>
		</div>

		<div class="col-sm-8">
			<b>{{element_empresa.first_name | capitalize }} </b>
			<small class="smaller no-border" size="sm"  v-if='element_empresa.last_name'>{{element_empresa.last_name | capitalize }}</small> 
		</div>

		<div class="col-sm-12">
			<small>

<b v-if='dia_de_hoy(element_empresa.dia_cierre) && element_empresa.gearbox != "false"' >Reporte Listo  
	<i class="btn-outline-danger no-border fas fa-times"></i> ( el {{element_empresa.dia_cierre}} de este mes)
</b>

<!-- boton descarga mensual -->

<b v-if='!dia_de_hoy(element_empresa.dia_cierre) && element_empresa.gearbox != "false"' >Reporte Listo  
	<i class="btn-outline-success no-border fas fa-2x fa-check"></i>  desde el {{element_empresa.dia_cierre}} de este mes 
	<b-button v-on:click="startexport_por_empresa(element_empresa.ID , element_empresa.first_name)" variant="success" size="sm"><i class="far fa-file-excel"></i> Descargar</b-button>

</b>

			</small>
		</div>

		<div class="col-sm-12">
			<small><i class="fas fa-envelope"></i> {{element_empresa.user_email}} </small>
<br>
			<small v-if='element_empresa.flexirol3 == 1'><i class="fas fa-hand-holding-usd"></i> Plan 1: Porcentaje sobre la transaccion ({{element_empresa.flexirol}}%) <small>(mas IVA)</small></small>
			<small v-else><i class="fas fa-hand-holding-usd"></i> Plan 2: Valor fijo/pago mensual recurrente ({{element_empresa.flexirol2}}$/mes) <small>(mas IVA)</small></small>

		</div>
			
	</div>

</div>


<!-- FILTRO PARA SOLICITUDES PROCESADAS -->

<div class="row" >

	<div class="col-sm-12">
		<hr class='principal'>
	</div>

	<div class="col-sm-9 secundario">
		<h4><i class="fas fa-hand-holding-usd"></i> Resumen Rapido Solicitudes Procesadas.. <small class="smaller" v-if='soliticudes_confirmadas'> (total:{{soliticudes_confirmadas.length}})</small>

		</h4>
	</div>
	<div class="col-sm-3"  >

		<b-button  v-on:click="startexport_reporte" variant="success"><i class="far fa-file-excel"></i> Descargar este Reporte</b-button>

    </div>


        <div class="input-group col-sm-4">
            <b-form-input type="search" placeholder="Filtrar por palabra clave/cedula.." v-model="filter"></b-form-input>
            <span class="">
                <button class="btn btn-outline-secondary" type="button">
                    <i class="fa fa-search"></i>
                </button>
            </span>
        </div>
        <div class="input-group col-sm-3">
	    	<b-form-select  v-model="status_procesando">
		      <b-form-select-option value="">Filtro por empresa</b-form-select-option>
		      <b-form-select-option v-for='element in empresa_info_set' v-bind:key='element.ID' :value='element.first_name'>{{element.first_name}} - {{element.last_name}}</b-form-select-option>
			</b-form-select>
        </div>

        <div class="input-group col-sm-3">
    	<b-form-select  v-model="status_por_banco" :options="options_bancos">
		</b-form-select>
        </div>

        <div class="col-sm-1">
<button v-on:click="resetOptions_procesando" class="btn btn-sm btn-outline-danger">Reset</button>
        </div>
<div class="col-sm-12">
<br>
</div>
  </div>

<!-- LISTADO DE SOLICITUDES DEL MES -->

<div v-cloak class="row" id='list' v-if='soliticudes_confirmadas.length'>
	<div class="col-sm-12 row" style=" padding: 2px 2px 2px 20px; " v-for='(element_solicitud_procesando, index) in soliticudes_confirmadas' :key="element_solicitud_procesando.ID" >

<div class="col-sm-12"><hr class="secundario"></div>

		<div class="col-sm-2" style=" padding: 2px 4px; ">
			<small>Solicitado:<b>{{element_solicitud_procesando.post_date}}</b></small>
		</div>
		<div class="col-sm-2" style=" padding: 2px 4px; ">
			{{element_solicitud_procesando.empleado.toUpperCase()}} - {{(corta_secciones(element_solicitud_procesando.post_content)[0]).split(" - ")[1]}}
		</div>
		<div class="col-sm-2" style=" padding: 2px 4px; ">
			<small>Procesado:<b>{{element_solicitud_procesando.post_modified}}</b></small>
		</div>		
		<div class="col-sm-2" style=" padding: 2px 4px; ">
			<small>{{element_solicitud_procesando.empresa}}</small>
		</div> 
		<div class="col-sm-1" style=" padding: 2px 4px; ">
			Monto:<b> ${{element_solicitud_procesando.post_excerpt}} </b>
		</div>
		<div class="col-sm-3" style=" padding: 2px 4px; ">
			{{corta_secciones(element_solicitud_procesando.post_content)[2]}} 
		</div>

	<hr>
			
	</div>
</div>

	<p  id='err_msg' v-else>{{err_msg}}</p> 

</b-card-text>
      </b-tab>
<!-- FIN PANEL DE SOLICITUDES procesadas ya -->



</b-tabs>
  </b-card>

</div> <!-- FIN DEL DIV CON EL ID QUE CARGARA EL VUE -->


<?php

	} //cierre de creacion de shortcode
);


?>