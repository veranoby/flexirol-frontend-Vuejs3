<?php

// Creacion del shortcode que hara la pagina 

add_shortcode( 'excel_usuarios_admin', function () {


$profile_id = um_profile_id();
	
if ( (get_user_role($profile_id) == 'superadmin') || (get_user_meta($profile_id, 'gearbox', true ) == 'true')) {

  wp_enqueue_script('excel_usuarios_vue_admin');  //Add my Vue code for the page


//FUNCION DE SUBIR ARCHIVOS A DISCO


if ( isset($_POST['upload_file']) ) {

	$id = $_POST['selected'];
	$user = get_user_by( 'ID', $id);


  $UserData = get_user_meta( $id );  

	if (!empty($UserData['dia_inicio'][0])) { $dia_inicio = $UserData['dia_inicio'][0]; } else {$dia_inicio = '2';}
	if (!empty($UserData['dia_cierre'][0])) { $dia_cierre = $UserData['dia_cierre'][0]; } else {$dia_cierre = '28';}
	if (!empty($UserData['porcentaje'][0])) { $porcentaje = $UserData['porcentaje'][0]; } else {$porcentaje = '50';}
	if (!empty($UserData['dia_bloqueo'][0])) { $dia_bloqueo = $UserData['dia_bloqueo'][0]; } else {$dia_bloqueo = '2';}
	if (!empty($UserData['frecuencia'][0])) { $frecuencia = $UserData['frecuencia'][0]; } else {$frecuencia = '3';}
	if (!empty($UserData['dia_reinicio'][0])) { $dia_reinicio = $UserData['dia_reinicio'][0]; } else {$dia_reinicio = '4';}

	if (!empty($UserData['flexirol'][0])) { $flexirol = $UserData['flexirol'][0]; } else {$flexirol = '10';}	
	if (!empty($UserData['flexirol2'][0])) { $flexirol2 = $UserData['flexirol2'][0]; } else {$flexirol2 = '10';}	
	if (!empty($UserData['flexirol3'][0])) { $flexirol3 = $UserData['flexirol3'][0]; } else {$flexirol3 = '1';}	


	$user_login = $user->user_login;
    $upload_dir = wp_upload_dir();
 	$error = $error_grabado = '';

 //	echo '<i class="btn btn-sm no-border btn-outline-success fas fa-check-circle"></i>confirmando directorio base..<br>';

        if ( ! empty( $upload_dir['basedir'] ) ) {
            $user_dirname = $upload_dir['basedir'].'/'. $user_login;
            echo '<i class="btn no-border btn-sm btn-outline-success fas fa-check-circle"></i>confirmando que existe directorio de la empresa..<br>';

            if ( ! file_exists( $user_dirname ) ) {
                $error = wp_mkdir_p( $user_dirname );
                echo '<i class="btn no-border btn-sm btn-outline-success fas fa-check-circle"></i>creandolo por primera vez..<br>';
            }

		  if ( ! is_wp_error( $error ) ) {

		  	echo '<i class="btn no-border btn-sm btn-outline-success fas fa-check-circle"></i>generando fecha de subida (' . date("j F Y") . ')..<br>';
		  	$nombre_con_fecha_subida = date("j F Y") . ' ' . $_FILES['file']['name'];

            $filename = wp_unique_filename( $user_dirname, $nombre_con_fecha_subida );
            $error_grabado = move_uploaded_file($_FILES['file']['tmp_name'], $user_dirname .'/'. $filename);
            // save into database $upload_dir['baseurl'].'/product-images/'.$filename;

			  if ( ! is_wp_error( $error_grabado ) ) {
			  	echo '<i class="btn no-border btn-sm btn-outline-success fas fa-check-circle"></i>Leyendo el documento excel..<br>';



//LECTURA DE EXCEL PARA CREACION DE USUARIOS

if ( defined('CBXPHPSPREADSHEET_PLUGIN_NAME') && file_exists( CBXPHPSPREADSHEET_ROOT_PATH . 'lib/vendor/autoload.php' ) ) {
	//Include PHPExcel
	require_once( CBXPHPSPREADSHEET_ROOT_PATH . 'lib/vendor/autoload.php' );

	//now take instance

$Reader = new \PhpOffice\PhpSpreadsheet\Reader\Xlsx();

//		  	echo '<i class="btn no-border btn-sm btn-outline-success fas fa-check-circle"></i>carga de librerias excel exitosa..<br>';

//do whatever you need to do

$spreadSheet = $Reader->load($user_dirname .'/'. $filename);
        $excelSheet = $spreadSheet->getActiveSheet();
        $spreadSheetAry = $excelSheet->toArray();
        $sheetCount = count($spreadSheetAry);

        for ($i = 1; $i <= $sheetCount; $i ++) {
            $first_name = "";
            if (isset($spreadSheetAry[$i][0])) {
                $first_name = $spreadSheetAry[$i][0];
            }
            $last_name = "";
            if (isset($spreadSheetAry[$i][1])) {
                $last_name = $spreadSheetAry[$i][1];
            }
            $cedula = "";
            if (isset($spreadSheetAry[$i][2])) {
                $cedula = strval($spreadSheetAry[$i][2]);
            }
            $monto = "";
            if (isset($spreadSheetAry[$i][3])) {
                $monto = $spreadSheetAry[$i][3];
            }
            $email = $cedula . '@flexirol.com' ;
            if (isset($spreadSheetAry[$i][4])) {
                $email = strval($spreadSheetAry[$i][4]);
            }
            $habilitado = 'true';
            if (isset($spreadSheetAry[$i][5])) {
                $habilitado = strval($spreadSheetAry[$i][5]);
            }
            $city = '';
            if (isset($spreadSheetAry[$i][6])) {
                $city = ($spreadSheetAry[$i][6]);
            }
            $birth_date = '';
            if (isset($spreadSheetAry[$i][7])) {
               $birth_date = ($spreadSheetAry[$i][7]);

//$birth_date = date("Y-m-d", strtotime($spreadSheetAry[$i][7]));


            }


            if (! empty($first_name) || ! empty($last_name) || ! empty($cedula) || ! empty($monto)) {

				$usuarios_nuevos[$cedula]['first_name']= $first_name ;
				$usuarios_nuevos[$cedula]['last_name']= $last_name ;
				$usuarios_nuevos[$cedula]['monto']= $monto ;
				$usuarios_nuevos[$cedula]['email']= $email ;
				$usuarios_nuevos[$cedula]['cedula']= $cedula ;
				$usuarios_nuevos[$cedula]['city']= $city ;
				$usuarios_nuevos[$cedula]['birth_date']= $birth_date ;


if (strtoupper($habilitado)=='NO') {$usuarios_nuevos[$cedula]['habilitado'] = 'false';} else {$usuarios_nuevos[$cedula]['habilitado'] = 'true';}

				$usuarios_nuevos_por_filtrar[$cedula]['first_name']= $first_name ;
				$usuarios_nuevos_por_filtrar[$cedula]['last_name']= $last_name ;
				$usuarios_nuevos_por_filtrar[$cedula]['monto']= $monto ;
				$usuarios_nuevos_por_filtrar[$cedula]['email']= $email ;
				$usuarios_nuevos_por_filtrar[$cedula]['cedula']= $cedula ;
				$usuarios_nuevos_por_filtrar[$cedula]['city']= $city ;
				$usuarios_nuevos_por_filtrar[$cedula]['birth_date']= $birth_date ;


if (strtoupper($habilitado)=='NO') {$usuarios_nuevos_por_filtrar[$cedula]['habilitado'] = 'false';} else {$usuarios_nuevos_por_filtrar[$cedula]['habilitado'] = 'true';}

            }
        }


echo '<br>';
echo '<br>';

//generacion de listado de usuarios actuales de la empresa para comparacion

$role='usuario';
$orderby='ID';
$order='asc';
$empresa=$id;

$mis_usuarios_base =  get_users_by_role($role, $orderby, $order, $empresa,""); 

    foreach( $mis_usuarios_base as $key => $val ) {
      $mis_usuarios_total[$val['cedula']] = $val['ID']; //aqui
      $mis_usuarios_por_filtrar[$val['cedula']] = $val['ID']; 
    }

//ACTUALIZAR USUARIOS

$por_actualizarse = 0;

foreach( $mis_usuarios_total as $key => $val) {

    if (isset($usuarios_nuevos[$key])) {

		$por_actualizarse ++;

		unset($usuarios_nuevos_por_filtrar[$key]);
		unset($mis_usuarios_por_filtrar[$key]); 

		 $meta = array(
		    'gearbox' => $usuarios_nuevos[$key]['habilitado'],
		    'disponible' => $usuarios_nuevos[$key]['monto'],

		    'flexirol' => $flexirol,
		    'flexirol2' => $flexirol2,
		    'flexirol3' => $flexirol3,

		    'dia_inicio' => $dia_inicio,
		    'dia_cierre' => $dia_cierre,    
		    'porcentaje' => $porcentaje,
		    'dia_bloqueo' => $dia_bloqueo,    
		    'frecuencia' => $frecuencia,
		    'dia_reinicio' => $dia_reinicio,

			'city'=> $usuarios_nuevos[$key]['city'], 
			'birth_date'=> $usuarios_nuevos[$key]['birth_date'],  

		  );

	    foreach( $meta as $key_meta => $val_meta ) {
		      update_user_meta( $val, $key_meta, $val_meta ); 
		    }


		}

    }

  	echo '<i class="btn no-border btn-outline-warning btn-sm fas fa-exclamation-triangle"></i>' . $por_actualizarse . ' usuario(s) actualizados..<br>';

//BORRAR USUARIOS

$suma_final = $por_actualizarse;

	$por_actualizarse = 0;


foreach( $mis_usuarios_por_filtrar as $key => $val) {

	wp_delete_user($val); //para borrar usuarios

/*

$updated = update_user_meta( $val, 'gearbox', 'false' ); //pasandolo a bloqueado mas bien
$updated = update_user_meta( $val, 'empresa', '' ); //pasandolo a bloqueado mas bien

*/
	$por_actualizarse ++;

    }

  	echo '<i class="btn no-border btn-outline-warning btn-sm fas fa-exclamation-triangle"></i>' . $por_actualizarse . ' usuario(s) eliminados..<br>';


//CREACION USUARIOS

$suma_final = $suma_final - $por_actualizarse;

$por_actualizarse = 0;

$usuarios_nuevos_por_filtrar_final = $usuarios_nuevos_por_filtrar;

//para los que las cedulas ya existen en la base

foreach( $usuarios_nuevos_por_filtrar as $key => $val) {

	 $meta = array(
	    'empresa' => $empresa,
	    'cedula' => $val['cedula'],    
    'gearbox' => $val['habilitado'],
    'disponible' => $val['monto'],

    'city' => $val['city'],
    'birth_date' => $val['birth_date'],

	    'flexirol' => $flexirol,
	    'flexirol2' => $flexirol2,
	    'flexirol3' => $flexirol3,

	    'dia_inicio' => $dia_inicio,
	    'dia_cierre' => $dia_cierre,    
	    'porcentaje' => $porcentaje,
	    'dia_bloqueo' => $dia_bloqueo,    
	    'frecuencia' => $frecuencia,
	    'dia_reinicio' => $dia_reinicio,

	  );

    $args = array(
        'meta_key'     => 'cedula',
        'meta_value'   => $val['cedula']       
    );	

$users_ya_existentes = get_users( $args );


foreach ( $users_ya_existentes as $user_ya_existente )

  {

		unset($usuarios_nuevos_por_filtrar_final[$key]); 

		 $display_name = $val['first_name'] . ' ' . $val['last_name'] ;

	$por_actualizarse ++;

			$user_id = wp_insert_user( array(
			  'ID' => $user_ya_existente->ID,
			  'user_login' => $key,
			  'user_nicename' => preg_replace('/\s+/', '_', ($val['first_name'] . ' ' . $val['last_name'])),

			  'first_name' => $val['first_name'],
			  'last_name' => $val['last_name'],

			  'display_name'=> $display_name ,
			  'role' => 'usuario',

			));

			    foreach( $meta as $key_meta => $val_meta ) {
			      update_user_meta( $user_ya_existente->ID, $key_meta, $val_meta ); 
			    }

  }

}

echo '<i class="btn no-border btn-outline-warning btn-sm fas fa-exclamation-triangle"></i>' . $por_actualizarse . ' usuario(s) encontrados en el sistema, redirigidos a su empresa..<br>';

$suma_final = $suma_final + $por_actualizarse;

$por_actualizarse = 0;

//para los que no estan en la base

foreach( $usuarios_nuevos_por_filtrar_final as $key => $val) {

	 $meta = array(
	    'empresa' => $empresa,
	    'cedula' => $val['cedula'],    
    'gearbox' => $val['habilitado'],
    'disponible' => $val['monto'],

    'city' => $val['city'],
    'birth_date' => $val['birth_date'],

	    'flexirol' => $flexirol,
	    'flexirol2' => $flexirol2,
	    'flexirol3' => $flexirol3,
	    
	    'dia_inicio' => $dia_inicio,
	    'dia_cierre' => $dia_cierre,    
	    'porcentaje' => $porcentaje,
	    'dia_bloqueo' => $dia_bloqueo,    
	    'frecuencia' => $frecuencia,
	    'dia_reinicio' => $dia_reinicio,

	  );

	$por_actualizarse ++;

			$user_id = wp_insert_user( array(
			  'user_login' => $key,
			  'user_nicename' => preg_replace('/\s+/', '_', ($val['first_name'] . ' ' . $val['last_name'])),

			  'user_pass' => $key,
			  'user_email' => $val['email'],

			  'first_name' => $val['first_name'],
			  'last_name' => $val['last_name'],

			  'display_name'=> $display_name ,

			  'role' => 'usuario',
			));

			  //check if there are no errors
			  if ( ! is_wp_error( $user_id ) ) {
			    foreach( $meta as $key => $val ) {
			      update_user_meta( $user_id, $key, $val ); 
			    }
			  }

		}


 echo '<i class="btn no-border btn-outline-warning btn-sm fas fa-exclamation-triangle"></i>' . $por_actualizarse . ' usuario(s) nuevos creados..<br>';

$suma_final = $suma_final + $por_actualizarse;

echo '<h4> Creacion de Usuarios terminada <i class="btn no-border btn-outline-success fas fa-2x fa-check-circle"></i></h4>';

if ( (get_user_role($profile_id) == 'superadmin')) {
echo '(numero de usuarios actual: ' .  $suma_final . ' . Proceda a  <a class="btn  btn-outline-secondary" href="../superadmin-usuarios/"><i class="far fa-2x fa-user"></i> Usuarios</a> para revisar las empresa y su listado actual..';	
} else {
echo '(numero de usuarios actual: ' .  $suma_final . ' . Proceda a su <a class="btn  btn-outline-secondary" href="../dashboard-admin/"><i class="fas fa-2x fa-chart-line"></i>Dashboard</a> para revisar su listado actual..';	
}
echo '<div class="col-sm-12">		<hr>	</div>';


//GENERACION DE FECHA ACTUALIZADA DEL EXCEL PARA USUARIO ACTUAL

$today = getdate();

$today = $today['mday'] . '/'.$today['mon'].'/'.$today['year'];

$updated = update_user_meta( $_POST['selected'], 'fecha_excel', $today );


//fin procesamiento

} else {
			  	echo '<i class="btn no-border btn-outline-danger btn-sm fas fa-times"></i>error cargando librerias excel..<br>';
}
			  } else {
			  	echo '<i class="btn no-border btn-outline-danger btn-sm fas fa-times"></i>error grabando del archivo..<br>';
			  }
			  } else {
			  	echo '<i class="btn btn-outline-danger btn-sm fas fa-times"></i>error en la creacion del directorio..<br>';
			  }
        }
    }




 ?> 

<div id="excel_usuarios_admin"> <!-- DIV CON EL ID QUE CARGARA EL VUE -->


<!-- SPINNERS Y ALERTAS -->

<div v-if="loading" >
		<div class="loading">
				<div class="spinner-border text-warning "></div>
		</div>
</div>

<div v-else>
<!-- request finished -->
</div>


<div>
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



<!-- INICIO SECCION EXCEL -->
<div class="row " v-if='habilitado_switch'> <!-- inicio div de v-if='habilitado_switch' -->

<!-- MENSAJE ADVERTENCIA ACTUALIZACION EXCEL -->
<div class="col-sm-12">
	<div v-bind:class="clase_importante" role="alert">
{{mensaje_importante}} 

	<div class="col-sm-12 terciario" v-if='rol_actual=="empresa"' >
		<h4 style="    color: gray;"><br>
Cual es mi listado actual? 
		<b-button size="sm" v-on:click="startexport(usuario_actual,rol_actual)" >Descarguelo Aqui!</b-button>		
		</h4>
    </div>

	</div>
</div>

<h4 class="terciario"><i class="fas fa-users-cog"></i> Creacion de listado de usuarios de la empresa</h4>

<form class="fileUpload" method="post" enctype="multipart/form-data">
<div class="row">

    <div class="form-group col-sm-1">
		<span class="btn btn-sm btn-success"> 1 </span>	
	</div>
    <div class="form-group col-sm-11">
        <span><?php _e('Seleccione su documento Excel...'); ?></span>
        <input type="file" name="file" id="file" ref="file" required />
	</div>
    <div class="form-group col-sm-1">
		<span class="btn btn-sm btn-success"> 2 </span>	
	</div>	
    <div class="form-group col-sm-6">
    	<select  id="selected" ref="selected" name="selected" required 
    	v-model='envio_usuario'>
<?php

if ( (get_user_role($profile_id) != 'superadmin') || (get_user_meta($profile_id, 'gearbox', true ) == 'true')) {

echo '<option value="' . $profile_id . '">Crear usuarios para mi empresa..</option>';

} else {

?>
		      <option value="">Seleccione la empresa</option>
		      <option v-for='element in empresa_info_set' v-bind:key='element.ID' :value='element.ID'>{{element.first_name}} - {{element.last_name}}</option>

<?php } ?>



		</select>

<!-- descarga superadmin de excel de empresas -->

	<div class="col-sm-12 terciario" v-if='rol_actual!="empresa" && envio_usuario!=""' >
		<br>
<i class="fas fa-exclamation-triangle"></i>  Cual es el listado Existente/Actual de esta Empresa? 
		<b-button  size="sm" v-on:click="startexport(envio_usuario,'empresa')" >Descarguelo Aqui!</b-button>		
		
    </div>


	</div>
	<div class="col-sm-3">
		<input type="submit" class='btn btn-success btn-lg' name="upload_file" value="Subir Archivo de la empresa" />
	</div>
</div>
</form>



<!-- ADVERTENCIAS -->

<div class="col-sm-12"><br><br><hr ><br></div>

<div class="col-sm-12">
	<div class="alert alert-danger" role="alert">
<i class="fas fa-exclamation-triangle"></i>  Importante: usted se dispone a cargar usuarios de forma masiva desde un archivo de excel. Esto reemplazara los usuarios de la empresa seleccionada, y no se puede deshacer para volver al listado anterior
	</div>
</div>

<ul>
	<li>El archivo debe seguir un formato especifico descrito. Descargue el archivo de ejemplo <a class='btn btn-sm btn-warning'href="../wp-content/uploads/base.xlsx">AQUI</a> de ser necesario ingrese sus usuarios. NO BORRE LA CABECERA DE INFORMACION</li>
	<li>Los campos <span style="color: orange; font-weight: bolder;">[Nombre] [Apellido] [Cedula] [Monto Disponible]</span> son obligatorios</li>
	<li>El campo <span style="color: orange; font-weight: bolder;">[Email]</span> NO es obligatorio, pero ALTAMENTE recomendado</li>
</ul>

</div> <!-- fin del chequeo de v-if='habilitado_switch' -->
<div v-else class="row">
<div class="col-sm-12">
	<div v-bind:class="clase_importante" role="alert">
{{mensaje_importante}} 
	</div>
</div>
<div class="col-sm-12">
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