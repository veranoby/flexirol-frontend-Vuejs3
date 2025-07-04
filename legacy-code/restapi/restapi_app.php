<?php

//LOGIN VIA REST API FLUTTER


function remoteLogin()
{
    register_rest_route('flexirol/v1', '/remote-login/(?P<id>\d+)', array(
		'methods'  => WP_REST_Server::ALLMETHODS,
        'callback' => 'restUserLogin',
		'permission_callback' => '__return_true',        
    ));
}

add_action('rest_api_init', 'remoteLogin'); //wp-json/flexirol/v1/remote-login/2?username=0914082193&password=linda


function restUserLogin($parameters)
{
 
	$response['success'] = false;
    $response['message'] = 'Password Incorrecto';    
    $status_code = 403;

	$id_temp = $parameters['id'];

	$username = sanitize_text_field($parameters->get_param( 'username' ));
	$password = sanitize_text_field($parameters->get_param( 'password' ));

    $user = null;

    if (!empty($username) && !empty($password)) {
        $user = wp_authenticate($username, $password);
    }

    if ($user instanceof WP_User) {

    	if (get_user_role($user->ID) == 'usuario'){

	        $response['success'] = true;
	        $response['message'] = 'Login successful';
	        $response['ID'] = $user->ID;

	        $status_code = 200;

		    } else {

		$response['success'] = false;
	    $response['message'] = 'Usuario no Permitido';    
	    	
		    }

    } 
   
    return new WP_REST_Response($response, $status_code);
}


//CAMBIAR PASSWORD VIA REST API FLUTTER


function remotePassword()
{
    register_rest_route('flexirol/v1', '/remote-password/(?P<id>\d+)', array(
		'methods'  => WP_REST_Server::ALLMETHODS,
        'callback' => 'restUserPassword',
		'permission_callback' => '__return_true',        
    ));
}

add_action('rest_api_init', 'remotePassword'); //wp-json/flexirol/v1/remote-login/2?username=0914082193&password=linda


function restUserPassword($parameters)
{
 
	$response['success'] = false;
    $response['message'] = 'No se pudo realizar accion';    
    $status_code = 403;

$id_temp = $parameters['id'];

$ID = sanitize_text_field($parameters->get_param( 'ID' ));
$password = sanitize_text_field($parameters->get_param( 'password' ));

    $user = wp_set_password( $password, $ID );

  if ( ! is_wp_error( $user ) ) {

        $response['success'] = true;
        $response['message'] = 'Cambio de contrasena exitoso';
        $status_code = 200;

	}   

    return new WP_REST_Response($response, $status_code);
}


//ACTUALIZACION CHIQUITA USUARIO APP

function remoteUpdate()
{
    register_rest_route('flexirol/v1', '/remoteUpdate/(?P<id>\d+)', array(
		'methods'  => WP_REST_Server::ALLMETHODS,
        'callback' => 'restUserUpdate',
		'permission_callback' => '__return_true',        
    ));
}

add_action('rest_api_init', 'remoteUpdate'); //wp-json/flexirol/v1/remote-login/2?username=0914082193&password=linda


function restUserUpdate($parameters)
{
 
	$response['success'] = false;
    $response['message'] = 'No se pudo realizar accion';    
    $status_code = 403;

	$ID = ($parameters->get_param( 'ID' ));
	$user_email = ($parameters->get_param( 'user_email' ));
	$first_name = sanitize_text_field($parameters->get_param( 'first_name' ));
	$last_name = sanitize_text_field($parameters->get_param( 'last_name' ));

    $phone_number = ($parameters->get_param( 'phone_number' ));
    $city = sanitize_text_field($parameters->get_param( 'city' ));
    $address = sanitize_text_field($parameters->get_param( 'address' ));
    $birth_date = ($parameters->get_param( 'birth_date' ));

	 $meta = array(
	    'phone_number' => $phone_number,
	    'city' => $city,    
	    'address' => $address,
	    'birth_date' => $birth_date,
	  );

	$user_id = wp_update_user( array(

	  'ID' => $ID,
	  'user_email' => $user_email,
	  'first_name' => $first_name,
	  'last_name' => $last_name,

	)); 

  if ( ! is_wp_error( $user_id ) ) {

    foreach( $meta as $key => $val ) {
      update_user_meta( $ID, $key, $val ); 
    } 
        $response['success'] = true;
        $response['message'] = 'Cambio de contrasena exitoso';
        $status_code = 200;

$rol_actual = get_user_role($ID);

$user = get_userdata($ID);

  $DBRecord['role']       = $rol_actual;   
  $DBRecord['ID']         = $ID;  
  $DBRecord['first_name'] = $user->first_name;
  $DBRecord['last_name']  = $user->last_name;
  $DBRecord['user_login'] = $user->user_login;
  $DBRecord['user_email'] = $user->user_email;
  $DBRecord['display_name'] = $user->display_name;

  $UserData = get_user_meta( $ID );  

$DBRecord['gearbox'] = $UserData['gearbox'][0]; 
$DBRecord['empresa'] = $UserData['empresa'][0]; 
$DBRecord['disponible'] = $UserData['disponible'][0]; 
$DBRecord['cedula'] = $UserData['cedula'][0]; 
$DBRecord['gender'] = $UserData['gender'][0]; 

$DBRecord['city'] = $UserData['city'][0]; 
$DBRecord['birth_date'] = $UserData['birth_date'][0]; 
$DBRecord['address'] = $UserData['address'][0]; 
$DBRecord['phone_number'] = $UserData['phone_number'][0]; 

/* PLAN FLEXIROL DE FEE MENSUAL : BANDERA DE SI ESTA ACTIVO O NO EL PLAN */

if (!empty($UserData['flexirol4'][0])) { $DBRecord['flexirol4'] = $UserData['flexirol4'][0]; } else {$DBRecord['flexirol4'] = 'no';}


if ($rol_actual == "usuario") {
$id_empresa_temp = $UserData['empresa'][0];
$UserData = get_user_meta( $id_empresa_temp );  
}

if (!empty($UserData['fecha_excel'][0])) { $DBRecord['fecha_excel'] = $UserData['fecha_excel'][0]; } else {$DBRecord['fecha_excel'] = 'No creado';}

if (!empty($UserData['flexirol'][0])) { $DBRecord['flexirol'] = $UserData['flexirol'][0]; } else {$DBRecord['flexirol'] = '10';}
if (!empty($UserData['flexirol2'][0])) { $DBRecord['flexirol2'] = $UserData['flexirol2'][0]; } else {$DBRecord['flexirol2'] = '10';}
if (!empty($UserData['flexirol3'][0])) { $DBRecord['flexirol3'] = $UserData['flexirol3'][0]; } else {$DBRecord['flexirol3'] = '1';}

if (!empty($UserData['dia_inicio'][0])) { $DBRecord['dia_inicio'] = $UserData['dia_inicio'][0]; } else {$DBRecord['dia_inicio'] = '2';}
if (!empty($UserData['dia_cierre'][0])) { $DBRecord['dia_cierre'] = $UserData['dia_cierre'][0]; } else {$DBRecord['dia_cierre'] = '28';}
if (!empty($UserData['porcentaje'][0])) { $DBRecord['porcentaje'] = $UserData['porcentaje'][0]; } else {$DBRecord['porcentaje'] = '50';}
if (!empty($UserData['dia_bloqueo'][0])) { $DBRecord['dia_bloqueo'] = $UserData['dia_bloqueo'][0]; } else {$DBRecord['dia_bloqueo'] = '2';}
if (!empty($UserData['frecuencia'][0])) { $DBRecord['frecuencia'] = $UserData['frecuencia'][0]; } else {$DBRecord['frecuencia'] = '3';}
if (!empty($UserData['dia_reinicio'][0])) { $DBRecord['dia_reinicio'] = $UserData['dia_reinicio'][0]; } else {$DBRecord['dia_reinicio'] = '4';

	}
           
    $response['data'] =  $DBRecord;
    
      } 

    return new WP_REST_Response($response, $status_code);
}

?>