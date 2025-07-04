<?php 
	 add_action( 'wp_enqueue_scripts', 'flexirol_enqueue_styles' );
	 function flexirol_enqueue_styles() {
 			wp_enqueue_style( 'parent-style', get_template_directory_uri() . '/style.css' ); 
			wp_enqueue_style('bootstrap-vue', get_stylesheet_directory_uri() .'/libraries/bootstrap-vue.min.css');
 		  } 

/*REGIUSTRO DE VUE Y LOS ELEMENTOS CREADOS EN EL SISTEMA */

function func_load_vuescripts() {

wp_register_script( 'wpvue_vuejs', get_stylesheet_directory_uri() .'/libraries/vue.js');

wp_register_script( 'axios', get_stylesheet_directory_uri() .'/libraries/axios.min.js' );
//wp_register_script( 'qs', 'https://unpkg.com/qs/dist/qs.js' );
wp_register_script( 'bootstrap-vue', get_stylesheet_directory_uri() .'/libraries/bootstrap-vue.min.js' );

//FUNCIONES DE VUE DE SUPERADMIN

 wp_register_script('crear_usuarios_vue_superadmin', get_stylesheet_directory_uri() .'/superadmin/js/crear_usuarios.js', 'wpvue_vuejs', true );
 wp_register_script('config_usuarios_vue_admin', get_stylesheet_directory_uri() .'/superadmin/js/config.js', 'wpvue_vuejs', true );
 wp_register_script('excel_usuarios_vue_admin', get_stylesheet_directory_uri() .'/superadmin/js/upload_excel.js', 'wpvue_vuejs', true );
 wp_register_script('solicitudes_vue_admin', get_stylesheet_directory_uri() .'/superadmin/js/solicitudes.js', 'wpvue_vuejs', true );
 wp_register_script('historico_vue_admin', get_stylesheet_directory_uri() .'/superadmin/js/historico.js', 'wpvue_vuejs', true );
 wp_register_script('check_usuarios_vue_admin', get_stylesheet_directory_uri() .'/superadmin/js/check_usuarios.js', 'wpvue_vuejs', true );

//FUNCIONES DE VUE DE ADMIN

 wp_register_script('crear_usuarios_vue_admin', get_stylesheet_directory_uri() .'/admin/js/crear_usuarios.js', 'wpvue_vuejs', true );
 wp_register_script('reportes_vue_admin', get_stylesheet_directory_uri() .'/admin/js/reportes.js', 'wpvue_vuejs', true );

//FUNCIONES DE VUE DE USUARIOS

 wp_register_script('crear_bancos_vue_usuarios', get_stylesheet_directory_uri() .'/usuario/js/bancos.js', 'wpvue_vuejs', true );
 wp_register_script('solicitudes_vue_usuarios', get_stylesheet_directory_uri() .'/usuario/js/solicitudes.js', 'wpvue_vuejs', true );

}

add_action('wp_enqueue_scripts', 'func_load_vuescripts');


/* INCLUDES CON REGISTRO DE RESTAPIS */

include_once ('restapi/restapi.php') ;
include_once ('restapi/restapi_app.php') ;


 
 /*INICIO FUNCIONES DEL SISTEMA */

function get_user_role($user_id) {
	global $wp_roles;

	$roles = array();
	$user = new WP_User( $user_id );
	if ( !empty( $user->roles ) && is_array( $user->roles ) ) {
	foreach ( $user->roles as $role )
		$roles[] .= translate_user_role( $role );	
	}
	return implode(', ',$roles);
} 

function setting_the_footerCopyRight() {

	// copyright
	/*------------------*/
	$lightning_footerCopyRight = '<p>' . sprintf( __( 'Copyright &copy; %s All Rights Reserved.', 'lightning' ), get_bloginfo( 'name' ) ) . '</p>';
	$lightning_footerCopyRight .='<p>Desarrollado por 593Developers</p>';
	
	echo apply_filters( 'lightning_footerCopyRightCustom', $lightning_footerCopyRight );


}

//MENU PERSONALIZADO DE FLEXIROLL EN HEADER

function register_my_menu() {
  register_nav_menu('flexirol-menu',__( 'FlexiRol Menu' ));
}
add_action( 'init', 'register_my_menu' );


//AGREGAR COLUMNA DE EMPRESA A LISTADO DE USUARIOS EN WP-ADMIN

function mysite_columns($defaults) {
  $meta_number = 0;
  $custom_meta_fields = mysite_custom_define();
  foreach ($custom_meta_fields as $meta_field_name => $meta_disp_name) {
    $meta_number++;
    $defaults[('mysite-usercolumn-' . $meta_number . '')] = __($meta_disp_name, 'user-column');
  }
  return $defaults;
}

function mysite_custom_columns($value, $column_name, $id) {
  $meta_number = 0;
  $custom_meta_fields = mysite_custom_define();
  foreach ($custom_meta_fields as $meta_field_name => $meta_disp_name) {
    $meta_number++;
    if( $column_name == ('mysite-usercolumn-' . $meta_number . '') ) {
      return get_user_meta($id ,"empresa", true);
    }
  }
}

//AGREGARLOS AL AREA DE EDICION

function mysite_custom_define() {
  $custom_meta_fields = array();
  $custom_meta_fields['empresa'] = 'Mi Empresa (ID)';
//  $custom_meta_fields['linkedin'] = 'LinkedIn page';
//  $custom_meta_fields['facebook'] = 'Facebook profile';
  return $custom_meta_fields;
}

function mysite_show_extra_profile_fields($user) {
  print('<h3>Extra profile information</h3>');

  print('<table class="form-table">');

  $meta_number = 0;
  $custom_meta_fields = mysite_custom_define();
  foreach ($custom_meta_fields as $meta_field_name => $meta_disp_name) {
    $meta_number++;
    print('<tr>');
    print('<th><label for="' . $meta_field_name . '">' . $meta_disp_name . '</label></th>');
    print('<td>');
    print('<input type="text" name="' . $meta_field_name . '" id="' . $meta_field_name . '" value="' . esc_attr( get_user_meta( $user->ID, "empresa", true) ) . '" class="regular-text" /><br />');
    print('<span class="description"></span>');
    print('</td>');
    print('</tr>');
  }
  print('</table>');
}

function mysite_save_extra_profile_fields($user_id) {

  if (!current_user_can('edit_user', $user_id))
    return false;

  $meta_number = 0;
  $custom_meta_fields = mysite_custom_define();
  foreach ($custom_meta_fields as $meta_field_name => $meta_disp_name) {
    $meta_number++;
    update_user_meta( $user_id, $meta_field_name, $_POST[$meta_field_name] );
  }
}

add_action('show_user_profile', 'mysite_show_extra_profile_fields');
add_action('edit_user_profile', 'mysite_show_extra_profile_fields');
add_action('personal_options_update', 'mysite_save_extra_profile_fields');
add_action('edit_user_profile_update', 'mysite_save_extra_profile_fields');
add_action('manage_users_custom_column', 'mysite_custom_columns', 15, 3);
add_filter('manage_users_columns', 'mysite_columns', 15, 1);  

//FUNCION OBTENER ANIOS DE POSTS

function get_posts_years_array() {
    global $wpdb;
    $result = array();
    $years = $wpdb->get_results(
        $wpdb->prepare(
            "SELECT YEAR(post_date) FROM {$wpdb->posts} WHERE post_status = 'publish' GROUP BY YEAR(post_date) DESC"
        ),
        ARRAY_N
    );
    if ( is_array( $years ) && count( $years ) > 0 ) {
        foreach ( $years as $year ) {
            $result[] = $year[0];
        }
    }
    return $result;
}

//TAB ADICIONAL

add_action('um_after_account_general', 'showUMExtraFields', 100);

function showUMExtraFields() {
  $id = um_user('ID');
  $output = '';

if ( (get_user_role($id) == 'usuario')) {
  $names = array('phone_number', 'birth_date','city', 'address');
} else {
  $names = array('phone_number', 'city', 'address');
}


  $fields = array(); 
  foreach( $names as $name )
    $fields[ $name ] = UM()->builtin()->get_specific_field( $name );
  $fields = apply_filters('um_account_secure_fields', $fields, $id);
  foreach( $fields as $key => $data )
    $output .= UM()->fields()->edit_field( $key, $data );

  echo $output;
}

add_action('um_account_pre_update_profile', 'getUMFormData', 100);

function getUMFormData(){
  $id = um_user('ID');

if ( (get_user_role($id) == 'usuario')) {
  $names = array('phone_number', 'birth_date','city', 'address');
} else {
  $names = array('phone_number', 'city', 'address');
}


  foreach( $names as $name )
    update_user_meta( $id, $name, $_POST[$name] );
}


//agregar nuevo tipo de POST: PAGADO PLAN 2

function cw_post_type_pago() {
$supports = array(
'title', // post title
'editor', // post content
'author', // post author
'thumbnail', // featured images
'excerpt', // post excerpt
'custom-fields', // custom fields
//'comments', // post comments
'revisions', // post revisions
'post-formats', // post formats
);
$labels = array(
'name' => _x('Pagos Plan 2', 'plural'),
'singular_name' => _x('Pago Plan 2', 'singular'),
'menu_name' => _x('Pago Plan 2', 'admin menu'),
'name_admin_bar' => _x('Pago Plan 2', 'admin bar'),
'add_new' => _x('Add New', 'add new'),
'add_new_item' => __('Add New Pago'),
'new_item' => __('Nuevo Pago'),
'edit_item' => __('Editar Pago'),
'view_item' => __('Ver Pago'),
'all_items' => __('Todas los Pagos Plan 2'),
'search_items' => __('Buscar Pago Plan 2'),
'not_found' => __('No se encontraron pagos..'),
);
$args = array(
'supports' => $supports,
'labels' => $labels,
'public' => true,
'query_var' => true,
'rewrite' => array('slug' => 'pagos'),
'has_archive' => true,
'hierarchical' => false,
);
register_post_type('pagos', $args);
}

add_action('init', 'cw_post_type_pago');

function reg_tag_pago() {
     register_taxonomy_for_object_type('post_tag', 'pagos');
}

add_action('init', 'reg_tag_pago');


//agregar nuevo tipo de POST: CUENTA

function cw_post_type_cuenta() {
$supports = array(
'title', // post title
'editor', // post content
'author', // post author
'thumbnail', // featured images
'excerpt', // post excerpt
'custom-fields', // custom fields
//'comments', // post comments
'revisions', // post revisions
'post-formats', // post formats
);
$labels = array(
'name' => _x('cuenta', 'plural'),
'singular_name' => _x('cuenta', 'singular'),
'menu_name' => _x('cuentas', 'admin menu'),
'name_admin_bar' => _x('cuenta', 'admin bar'),
'add_new' => _x('Add New', 'add new'),
'add_new_item' => __('Add New cuenta'),
'new_item' => __('Nueva cuenta'),
'edit_item' => __('Editar cuenta'),
'view_item' => __('Ver cuenta'),
'all_items' => __('Todas las cuentas'),
'search_items' => __('Buscar cuenta'),
'not_found' => __('No se encontraron cuentas..'),
);
$args = array(
'supports' => $supports,
'labels' => $labels,
'public' => true,
'query_var' => true,
'rewrite' => array('slug' => 'cuenta'),
'has_archive' => true,
'hierarchical' => false,
);
register_post_type('cuenta', $args);
}

add_action('init', 'cw_post_type_cuenta');

function reg_tag_cuenta() {
     register_taxonomy_for_object_type('post_tag', 'cuenta');
}

add_action('init', 'reg_tag_cuenta');

//agregar nuevo tipo de POST: SOLICITUD

function cw_post_type_solicitud() {
$supports = array(
'title', // post title
'editor', // post content
'author', // post author
'thumbnail', // featured images
'excerpt', // post excerpt
'custom-fields', // custom fields
//'comments', // post comments
'revisions', // post revisions
'post-formats', // post formats
);
$labels = array(
'name' => _x('solicitud', 'plural'),
'singular_name' => _x('solicitud', 'singular'),
'menu_name' => _x('solicitudes', 'admin menu'),
'name_admin_bar' => _x('solicitud', 'admin bar'),
'add_new' => _x('Add New', 'add new'),
'add_new_item' => __('Add New solicitud'),
'new_item' => __('Nueva solicitud'),
'edit_item' => __('Editar solicitud'),
'view_item' => __('Ver solicitud'),
'all_items' => __('Todas las solicitudes'),
'search_items' => __('Buscar solicitud'),
'not_found' => __('No se encontraron solicitudes..'),
);
$args = array(
'supports' => $supports,
'labels' => $labels,
'public' => true,
'query_var' => true,
'rewrite' => array('slug' => 'solicitud'),
'has_archive' => true,
'hierarchical' => false,
);
register_post_type('solicitud', $args);
}

add_action('init', 'cw_post_type_solicitud');

function reg_tag() {
     register_taxonomy_for_object_type('post_tag', 'solicitud');
}

add_action('init', 'reg_tag');

// FUNCIONES ESPECIFICAS


function get_users_by_role($role, $orderby, $order, $empresa, $cedula) {

if($role=='empresa') {
    $args = array(
        'role'    => $role,
        'orderby' => $orderby,
        'order'   => $order,
    );
} else {


$empresa = strval( $empresa ) ;
$cedula = strval( $cedula ) ;

if ($empresa =="" && $cedula=="") {

    $args = array(
        'role'    => $role,
        'orderby' => $orderby,
        'order'   => $order
    );  

}

if ($empresa !="" && $cedula=="") {

    $args = array(
        'role'    => $role,
        'orderby' => $orderby,
        'order'   => $order,
        'meta_key'     => 'empresa',
        'meta_value'   => $empresa        
    );  

}

if ($cedula !="" && $empresa=="") {

    $args = array(
        'role'    => $role,
        'orderby' => $orderby,
        'order'   => $order,
        'meta_key'     => 'cedula',
        'meta_value'   => $cedula        
    );  
}

if ($cedula !="" && $empresa!="") {

$args = array(

        'role'    => $role,
        'orderby' => $orderby,
        'order'   => $order,

    'meta_query' => array(
        array(
            'key' => 'empresa',
            'value' => $empresa,
            'compare' => '='
        ),
        array(
            'key' => 'cedula',
            'value' => $cedula,
            'compare' => '='
        )
    )
);

}

}


$users = get_users( $args );

$i=0;

foreach ( $users as $user )
  {

  $DBRecord[$i]['role']       = $role;   
  $DBRecord[$i]['ID']         = $user->ID;  
  $DBRecord[$i]['first_name'] = $user->first_name;
  $DBRecord[$i]['last_name']  = $user->last_name;
  $DBRecord[$i]['user_login'] = $user->user_login;
  $DBRecord[$i]['user_email'] = $user->user_email;
  $DBRecord[$i]['display_name'] = $user->display_name;

  $UserData = get_user_meta( $user->ID );  

$DBRecord[$i]['gearbox'] = $UserData['gearbox'][0];
$DBRecord[$i]['empresa'] = $UserData['empresa'][0];
$DBRecord[$i]['disponible'] = $UserData['disponible'][0];
$DBRecord[$i]['cedula'] = $UserData['cedula'][0]; 


//$date = new DateTime($UserData['birth_date'][0]);    
//$DBRecord[$i]['birth_date'] = $date->format("d/m/Y"); 

$date = date("Y/m/d", strtotime($UserData['birth_date'][0]));


$DBRecord[$i]['birth_date'] = $date; 


$DBRecord[$i]['city'] = $UserData['city'][0]; 
$DBRecord[$i]['address'] = $UserData['address'][0]; 
$DBRecord[$i]['phone_number'] = $UserData['phone_number'][0]; 
$DBRecord[$i]['gender'] = $UserData['gender'][0]; 


if (!empty($UserData['fecha_excel'][0])) { $DBRecord[$i]['fecha_excel'] = $UserData['fecha_excel'][0]; } else {$DBRecord[$i]['fecha_excel'] = 'No creado';}

/* PLAN FLEXIROL DE FEE MENSUAL : BANDERA DE SI ESTA ACTIVO O NO EL PLAN */

if (!empty($UserData['flexirol4'][0])) { $DBRecord[$i]['flexirol4'] = $UserData['flexirol4'][0]; } else {$DBRecord[$i]['flexirol4'] = 'no';}


if ($role != "empresa") {

$id_empresa_temp = $UserData['empresa'][0];
$userempresa = get_userdata( $id_empresa_temp );  
$DBRecord[$i]['empresa_nombre'] = $userempresa->first_name;

if ($userempresa->last_name) {
  $DBRecord[$i]['empresa_nombre']  .= "-" . $userempresa->last_name;
}
 
$UserData = get_user_meta( $id_empresa_temp );  

}

if (!empty($UserData['flexirol'][0])) { $DBRecord[$i]['flexirol'] = $UserData['flexirol'][0]; } else {$DBRecord[$i]['flexirol'] = '10';}
if (!empty($UserData['flexirol2'][0])) { $DBRecord[$i]['flexirol2'] = $UserData['flexirol2'][0]; } else {$DBRecord[$i]['flexirol2'] = '10';}
if (!empty($UserData['flexirol3'][0])) { $DBRecord[$i]['flexirol3'] = $UserData['flexirol3'][0]; } else {$DBRecord[$i]['flexirol3'] = '1';}

if (!empty($UserData['dia_inicio'][0])) { $DBRecord[$i]['dia_inicio'] = $UserData['dia_inicio'][0]; } else {$DBRecord[$i]['dia_inicio'] = '2';}
if (!empty($UserData['dia_cierre'][0])) { $DBRecord[$i]['dia_cierre'] = $UserData['dia_cierre'][0]; } else {$DBRecord[$i]['dia_cierre'] = '28';}
if (!empty($UserData['porcentaje'][0])) { $DBRecord[$i]['porcentaje'] = $UserData['porcentaje'][0]; } else {$DBRecord[$i]['porcentaje'] = '50';}
if (!empty($UserData['dia_bloqueo'][0])) { $DBRecord[$i]['dia_bloqueo'] = $UserData['dia_bloqueo'][0]; } else {$DBRecord[$i]['dia_bloqueo'] = '2';}
if (!empty($UserData['frecuencia'][0])) { $DBRecord[$i]['frecuencia'] = $UserData['frecuencia'][0]; } else {$DBRecord[$i]['frecuencia'] = '3';}
if (!empty($UserData['dia_reinicio'][0])) { $DBRecord[$i]['dia_reinicio'] = $UserData['dia_reinicio'][0]; } else {$DBRecord[$i]['dia_reinicio'] = '4';}   
           
  $i++;

  }

return $DBRecord;

}

//Info de MANEJAR SUSCRIPCION

function  manejar_suscripcion( $data ) {
    
$id_temp = $data['id'];

$updated = 'ocurrio un error' ;

if (!is_null($data->get_param( 'ID' )) && !is_null($data->get_param( 'status' ))) { 

  if ($data->get_param( 'status' ) == 'on') {
    $updated = update_user_meta( $data->get_param( 'ID' ), 'flexirol4', 'si' ); 
  } else {
    $updated = update_user_meta( $data->get_param( 'ID' ), 'flexirol4', 'no' ); 
  }

}

return $updated;

}


//Funciones de manejar Bancos


function  grabar_bancos( $data ) {
    
$id_temp = $data['id'];

if (!is_null($data->get_param( 'ID_post' ))) { 

//actualiza post antiguos (porqu epone el id)

$post_id = wp_insert_post(array (
    'ID' => $data->get_param( 'ID_post' ),
    'post_title' => $data->get_param( 'post_title' ),
    'post_excerpt' => $data->get_param( 'post_excerpt' ),
    'post_content' => $data->get_param( 'post_content' ),
    'post_type' => $data->get_param( 'post_type' ),
    'post_status' => 'publish',

    'post_author' => $data->get_param( 'post_author' ),

    // some simple key / value array
  
    'meta_input' => array(
        'user_email' => $data->get_param( 'user_email' ),
        'gearbox' => $data->get_param( 'gearbox' ),
        'empresa' => $data->get_param( 'empresa' ),
        'post_banco' => $data->get_param( 'post_banco' ),    
        'numero_cuenta' => $data->get_param( 'numero_cuenta' ),    
        // and so on ;)
    )
));

} else {

//crear post nuevo

$post_id = wp_insert_post(array (
    'post_title' => $data->get_param( 'post_title' ),
    'post_excerpt' => $data->get_param( 'post_excerpt' ),
    'post_content' => $data->get_param( 'post_content' ),
    'post_type' => $data->get_param( 'post_type' ),
    'post_status' => 'publish',

    'post_author' => $data->get_param( 'post_author' ),

    // some simple key / value array
  
    'meta_input' => array(
        'user_email' => $data->get_param( 'user_email' ),
        'gearbox' => $data->get_param( 'gearbox' ),
        'empresa' => $data->get_param( 'empresa' ),
        'post_banco' => $data->get_param( 'post_banco' ),    
        'numero_cuenta' => $data->get_param( 'numero_cuenta' ),    
       // and so on ;)
    )
));

}

//manejo de los tags

if (!is_null($data->get_param( 'tag' )) || ($data->get_param( 'tag' ) !=='')) { 

wp_set_post_tags( $post_id, array( $data->get_param( 'tag' ) ) );

}

// chequeo de activacion de suscripcion


// post_type', 'solicitud'

if ($data->get_param( 'post_type' ) =='solicitud') {

  if (get_user_meta( $data->get_param('empresa'), "flexirol3", true ) == '2') {

//activar la suscripcion
    if (get_user_meta( $data->get_param('post_author'), "flexirol4", true ) != 'si') {
$updated = update_user_meta( $data->get_param('post_author'), 'flexirol4', 'si' );       
}

//CREAR REQUERIMIENTO DE PAGO PARA PLAN 2 - FIN DE MES - SI NO EXISTE

$today = getdate();

$year = $today['year'];
$month = $today['mon'];

$numeracion = obtener_ultima_contifico();

$updated = crear_pagos_contifico($data->get_param('post_author') , $year , $month , $data->get_param('empresa'), $numeracion);

  }



}

return $updated;

}



function crear_pagos_contifico($autor , $year , $month , $empresa , $numeracion){

$month = str_pad($month, 2, "0", STR_PAD_LEFT);

$post_excerpt = $autor . '/'.$year . '/'.$month;


global $wpdb;

    $updated = $wpdb->get_row( 
        $wpdb->prepare("SELECT ID FROM {$wpdb->prefix}posts WHERE post_excerpt LIKE %s", $post_excerpt) 
    );

if (!$updated){

$user_info = get_userdata($autor);
$nombre = strtoupper($user_info->first_name) . ' ' . strtoupper($user_info->last_name) . '-$' . get_user_meta( $empresa, "flexirol2", true );

$updated = wp_insert_post(array (
    'post_title' => $nombre,
    'post_excerpt' => $post_excerpt,
    'post_content' => $year . '/' . $month,
    'post_type' => 'pagos',
    'post_status' => 'publish',

    'post_author' => $autor,

    // some simple key / value array
  
    'meta_input' => array(
        'empresa' => $empresa,
       // and so on ;)
    )
));

wp_set_post_tags( $updated, array( $year . '/' . $month ) );


//llamar a facturacion electronica contifico

$numeracion_factura = formatear_factura( $numeracion ) ;

crear_factura_contifico($updated , $numeracion_factura) ;

$updated = 'si';

}

return $updated ;

}



function  borrar_bancos( $data ) {
    
$id_temp = $data['id'];

if (!is_null($data->get_param( 'ID_post' ))) { 

$post_id = wp_delete_post( $data->get_param( 'ID_post' ), true); // Set to False if you want to send them to Trash.

}

return $post_id;

}


function  quiero_bancos( $data ) {
    
$id_temp = $data['id'];

if (!is_null($data->get_param( 'post_author' ))) { 

  if (!is_null($data->get_param( 'superadmin' ))) { 
   $id_post_busqueda = '';
   
} else {
  $id_post_busqueda = $data->get_param( 'post_author' ) ;

}

if (!is_null($data->get_param( 'por_fecha' ))) { 

$today = getdate();

$args = array(
    'author'        =>  $id_post_busqueda,
    'post_type' => $data->get_param( 'tipo' ),

    'date_query' => array(
        array(
            'year'  => $today['year'],
            'month' => $today['mon'],
        ),
    ),
);

$posts = new WP_Query( $args );

$i=0;

$current_user_posts = $posts->posts;

} else {
$args = array(
    'author'        =>  $id_post_busqueda,
    'orderby'       =>  'ID',
    'order'         =>  'ASC',
    'post_type' => $data->get_param( 'tipo' ),
    );

$current_user_posts = get_posts( $args );

}

$i=0;

foreach ( $current_user_posts as $post )   {

    $DBRecord[$i]['post_author']       = $post->post_author;   
    $DBRecord[$i]['ID']         = $post->ID;  

    $date = new DateTime($post->post_date);

    $DBRecord[$i]['post_date']  = $date->format("d/m/Y"); 

    $date = new DateTime($post->post_modified);

    $DBRecord[$i]['post_modified'] = $date->format("d/m/Y"); 

    $DBRecord[$i]['post_excerpt'] = $post->post_excerpt;
    $DBRecord[$i]['post_title']  = $post->post_title;
    $DBRecord[$i]['post_content'] = $post->post_content;

//CAMPOS ESPECIALES

    $UserData = get_post_meta( $post->ID );  

    $DBRecord[$i]['gearbox'] = $UserData['gearbox'][0];
    $DBRecord[$i]['user_email'] = $UserData['user_email'][0];
    $DBRecord[$i]['numero_cuenta'] = $UserData['numero_cuenta'][0];
    $DBRecord[$i]['post_banco'] = $UserData['post_banco'][0];


//NOMBRE USUARIO Y EMPRESA
$DBRecord[$i]['empleado'] = get_user_meta( $post->post_author, "first_name", true ) . ' ' . get_user_meta( $post->post_author, "last_name", true );
$DBRecord[$i]['empresa'] = get_user_meta( (get_user_meta( $post->post_author, "empresa", true )), "first_name", true ) . ' ' . get_user_meta( (get_user_meta( $post->post_author, "empresa", true )), "last_name", true );
$DBRecord[$i]['empresa_id'] = get_user_meta( $post->post_author, "empresa", true );

//TAGS
$post_tags = get_the_tags($post->ID);

    if ( $post_tags ) {
        $DBRecord[$i]['tag'] = $post_tags[0]->name; 
      }
    $i++;

  }

  return $DBRecord;
           
  } 

}


//GENERAR LISTADO DE USUARIOS SELECCIONADOS EN FILTRO 


function  generar_reporte_usuarios( $data ) {
    
$id_temp = $data['id'];

$nombre_con_fecha_subida ='reporte_superadmin_' . date("j F Y") . '.xlsx' ;

//$arreglo = ($data->get_param( 'data' ));

$arreglos = json_decode($data->get_param( 'informacion' ));
$acciones = ($data->get_param( 'acciones' ));

$solicitudes_array = array();

//chequeo de directorio o crearlo

$upload_dir = wp_upload_dir();

    if ( ! empty( $upload_dir['basedir'] ) ) {

        $user_dirname = $upload_dir['basedir'].'/reportes';

        if ( ! file_exists( $user_dirname ) ) {

            $error = wp_mkdir_p( $user_dirname );

        }
}

//inicio de creacion excel

if ( defined('CBXPHPSPREADSHEET_PLUGIN_NAME') && file_exists( CBXPHPSPREADSHEET_ROOT_PATH . 'lib/vendor/autoload.php' ) ) {
  //Include PHPExcel
  require_once( CBXPHPSPREADSHEET_ROOT_PATH . 'lib/vendor/autoload.php' );

$objPHPExcel = new \PhpOffice\PhpSpreadsheet\Spreadsheet();

$s=0;  

  $objPHPExcel->createSheet();
  $objPHPExcel->setActiveSheetIndex($s);
  $objPHPExcel->getActiveSheet()->setTitle($acciones);

  $rowCount = 1;

    $objPHPExcel->getActiveSheet()->SetCellValue('A'.$rowCount, 'Nombre');
    $objPHPExcel->getActiveSheet()->SetCellValue('B'.$rowCount, 'Sucursal');
    $objPHPExcel->getActiveSheet()->SetCellValue('C'.$rowCount, 'Ultima actualizacion');
    $objPHPExcel->getActiveSheet()->SetCellValue('D'.$rowCount, 'telefono');
    $objPHPExcel->getActiveSheet()->SetCellValue('E'.$rowCount, 'Email');
    $objPHPExcel->getActiveSheet()->SetCellValue('F'.$rowCount, 'Plan de Servicio');

  $rowCount = 2;

  foreach( $arreglos as $arreglo) {

    $objPHPExcel->getActiveSheet()->SetCellValue('A'.$rowCount, $arreglo->first_name);
    $objPHPExcel->getActiveSheet()->SetCellValue('B'.$rowCount, $arreglo->last_name);
    $objPHPExcel->getActiveSheet()->SetCellValue('C'.$rowCount, $arreglo->fecha_excel);
    $objPHPExcel->getActiveSheet()->SetCellValue('D'.$rowCount, $arreglo->phone_number);
    $objPHPExcel->getActiveSheet()->SetCellValue('E'.$rowCount, $arreglo->user_email);

if ($arreglo->flexirol3 =='1') {
    $objPHPExcel->getActiveSheet()->SetCellValue('F'.$rowCount, 'Plan 1: Porcentaje sobre la transaccion ('.$arreglo->flexirol.'%)');
} else {
    $objPHPExcel->getActiveSheet()->SetCellValue('F'.$rowCount, 'Plan 2:  Valor fijo/pago mensual recurrente ($'.$arreglo->flexirol.'/mes)');  
}


    $rowCount++;

}

$s++;


$writer = new \PhpOffice\PhpSpreadsheet\Writer\Xlsx($objPHPExcel);
$writer->save($user_dirname . '/'. $nombre_con_fecha_subida);

return ($nombre_con_fecha_subida);

} else {

$msg = 'ha ocurrido un error con cargar excel';

}

return ($msg);

}



//GENERAR PAGOS MENSUALES de superadmin


function  generar_pagos( $data ) {
    
$id_temp = $data['id'];

$nombre_con_fecha_subida ='reporte_superadmin_' . date("j F Y") . '.xlsx' ;

//$arreglo = ($data->get_param( 'data' ));

$arreglos = json_decode($data->get_param( 'informacion' ));


$solicitudes_array = array();

foreach ( $arreglos as $arreglo ) 

{

//cambiar tag a pagado. aqui tambien deberia ir el llamado a restapi de facturacion

wp_set_post_tags( $arreglo->ID, 'procesado' );
$update = array( 'ID' => $arreglo->ID );
wp_update_post( $update );

//fin cambio de tag a pagado y de restapi de facturacion..  


$solicitud_row = array();

$secciones= (explode("<br>",$arreglo->post_content)); //separo en sus 4 secciones. banco es la 2 y 3


$banco = (explode(" - ",$secciones[2])); //separo nombre y numero de cuenta
$banco_nombre = $banco[0]; //separo nombre
$banco_cuenta = (explode(": ",$banco[1])); //numero de cuenta
$banco_cuenta = $banco_cuenta[1];

$persona = (explode(" - ",$secciones[3])); //separo nombre y numero de cuenta
$persona_nombre = (explode(": ",$persona[0])); // nombre persona
$persona_nombre = $persona_nombre[1]; // nombre persona
$persona_cedula = (explode(": ",$persona[1])); //cedula
$persona_cedula = $persona_cedula[1]; //cedula
$persona_email = $persona[2]; //email


$solicitud_row["banco_nombre"] = $banco_nombre;
$solicitud_row["banco_cuenta"] = $banco_cuenta;
$solicitud_row["persona_nombre"] = $persona_nombre;
$solicitud_row["persona_cedula"] = $persona_cedula;
$solicitud_row["persona_email"] = $persona_email;

$solicitud_row["monto_solititado"] = (float)($arreglo->post_excerpt);
$solicitud_row["tax"] = (float)($arreglo->gearbox);
$solicitud_row["total_descontar"] = (float)($arreglo->post_excerpt) + (float)($arreglo->gearbox);


if (!$solicitudes_array[$banco_nombre]) {
$solicitudes_array[$banco_nombre] = array();  
}

  array_push($solicitudes_array[$banco_nombre], $solicitud_row); //INFORMACION GUARDADA EN PHP ARRAY

}

//chequeo de directorio o crearlo

$upload_dir = wp_upload_dir();

    if ( ! empty( $upload_dir['basedir'] ) ) {

        $user_dirname = $upload_dir['basedir'].'/reportes';

        if ( ! file_exists( $user_dirname ) ) {

            $error = wp_mkdir_p( $user_dirname );

        }
}

//inicio de creacion excel

if ( defined('CBXPHPSPREADSHEET_PLUGIN_NAME') && file_exists( CBXPHPSPREADSHEET_ROOT_PATH . 'lib/vendor/autoload.php' ) ) {
  //Include PHPExcel
  require_once( CBXPHPSPREADSHEET_ROOT_PATH . 'lib/vendor/autoload.php' );

$objPHPExcel = new \PhpOffice\PhpSpreadsheet\Spreadsheet();

$s=0;  
foreach( $solicitudes_array as $key_bancos => $val_bancos) {

  $objPHPExcel->createSheet();
  $objPHPExcel->setActiveSheetIndex($s);
  $objPHPExcel->getActiveSheet()->setTitle($key_bancos);


  $rowCount = 1;
  foreach( $val_bancos as $valores) {

    $objPHPExcel->getActiveSheet()->SetCellValue('A'.$rowCount, $valores['banco_cuenta']);
    $objPHPExcel->getActiveSheet()->SetCellValue('B'.$rowCount, $valores['persona_cedula']);
    $objPHPExcel->getActiveSheet()->SetCellValue('C'.$rowCount, $valores['persona_email']);
    $objPHPExcel->getActiveSheet()->SetCellValue('D'.$rowCount, $valores['persona_nombre']);

    $objPHPExcel->getActiveSheet()->SetCellValue('E'.$rowCount, $valores['monto_solititado']);
    $objPHPExcel->getActiveSheet()->SetCellValue('F'.$rowCount, $valores['tax']);
    $objPHPExcel->getActiveSheet()->SetCellValue('G'.$rowCount, $valores['total_descontar']);

    $rowCount++;

}

$s++;

}

$writer = new \PhpOffice\PhpSpreadsheet\Writer\Xlsx($objPHPExcel);
$writer->save($user_dirname . '/'. $nombre_con_fecha_subida);

return ($nombre_con_fecha_subida);

} else {

$msg = 'ha ocurrido un error con cargar excel';

}

return ($msg);

}



//CONFIRMAR LOS PAGOS 

function  confirmar_pagos( $data ) {

$id_temp = $data['id'];

$solicitud = $data->get_param( 'solicitud' );
$flexirol3 = $data->get_param( 'flexirol3' );

//llamado a contifico si es que es plan de porcentaje de solicitud

if ( get_user_meta( $flexirol3, "flexirol3", true ) == '1'){

$numeracion = obtener_ultima_contifico() ;

$numeracion_factura = formatear_factura( $numeracion ) ;

$actualizado = crear_factura_contifico($solicitud , $numeracion_factura) ;

}

//cambio de estado de la solicitud



wp_set_post_tags( $solicitud, 'procesado' );
$update = array( 'ID' => $solicitud );
wp_update_post( $update );



return $actualizado;

}


// FUNCION CREAR LA FACTURA CONTIFICO

function crear_factura_contifico($solicitud , $numeracion_factura) {

$post_info = get_post($solicitud);

if (get_user_meta( $post_info->empresa, "flexirol3", true ) == '2' ) {
  
$valor = get_user_meta( $post_info->empresa, "flexirol2", true ) ;


} else {

$valor = (float)($post_info->gearbox) ;

}

$total = round(((float)$valor * 1.12),2);
$tax = round(((float)$valor * 0.12),2);

$user = get_userdata($post_info->post_author);
$first_name = $user->first_name;
$last_name  = $user->last_name;
$user_email = $user->user_email;

$UserData = get_user_meta($post_info->post_author);  
$address = $UserData['address'][0]; 
$phone_number = $UserData['phone_number'][0]; 
$cedula = $UserData['cedula'][0]; 

$date = date("d/m/Y") ;

$body = '{
    "pos" : "e6201f0b-2289-41f1-a611-92d707757685",
    "fecha_emision": "'.$date.'",
    "tipo_documento": "FAC",
    "documento": "'.$numeracion_factura.'",    
    "estado": "P",
    "electronico" : true,
    "autorizacion": "",
    "cliente": {
        "cedula": "'.$cedula.'",
        "razon_social": "'.$first_name.' '.$last_name.'",
        "telefonos": "'.$phone_number.'",
        "direccion": "'.$address.'",
        "tipo": "N",
        "email": "'.$user_email.'",
        "es_extranjero": false
    },
    "subtotal_0": 0.00,
    "subtotal_12": '.$valor.',
    "iva": '.$tax.',
    "servicio": 0.00,
    "total": '.$total.',
        "detalles": [{
        "producto_id": "ZxgepyA8Ki36a1pV",    
        "cantidad": 1.00,
        "precio": '.$valor.',
        "porcentaje_iva": 12,
        "porcentaje_descuento": 0.00,
        "base_cero": 0.00,
        "base_gravable": '.$valor.',
        "base_no_gravable": 0.00
    }]
}
';


$endpoint = 'https://api.contifico.com/sistema/api/v1/documento/';
 
 
$options = [
    'body'        => $body,
    'headers'     => [
        'Authorization' => 'FrguR1kDpFHaXHLQwplZ2CwTX3p8p9XHVTnukL98V5U',
    ],
    'timeout'     => 60,
    'redirection' => 5,
    'blocking'    => true,
    'httpversion' => '1.0',
    'sslverify'   => false,
//    'data_format' => 'body',
];
 
$response = wp_remote_post( $endpoint, $options );

return $response;

}


//LLAMAR A CONTIFICO PARA TENER ULTIMA FACTURA

function obtener_ultima_contifico() {

$endpoint = 'https://api.contifico.com/sistema/api/v1/registro/documento/?tipo_registro=CLI&tipo=FAC&result_size=1';
  
$options = [
    'headers'     => [
        'Authorization' => 'FrguR1kDpFHaXHLQwplZ2CwTX3p8p9XHVTnukL98V5U',
    ],
    'timeout'     => 60,
    'redirection' => 5,
    'blocking'    => true,
    'httpversion' => '1.0',
    'sslverify'   => false,
  ];
 

$response = wp_remote_get( $endpoint, $options );

 
if ( is_wp_error( $response ) ) {
    $error_message = $response->get_error_message();
    $mensaje = "Something went wrong:" . $error_message ;
} else {
    $mensaje = $response['body'] ;
    $mensaje2 = json_decode($response['body']);
    $mensaje = $mensaje2[0]->documento ;
    $mensaje = (int)(str_replace("-", "", $mensaje)) + 1;

//    $mensaje = formatear_factura( $mensaje );

}

return $mensaje;

}


//FORMATEO A NUEVA FACTURA

function  formatear_factura( $mensaje ) {

$mensaje = substr_replace($mensaje,"-",-9,0);
$mensaje = substr_replace($mensaje,"-",-13,0);
$mensaje = str_pad($mensaje, 17, "0", STR_PAD_LEFT);

return $mensaje;

}


//GENERAR listado rapido de usuarios de empresa a excel

function  listado_rapido( $data ) {
    
$id_temp = $data['id'];

$rol_actual = $data->get_param( 'rol_actual' );
$usuario_actual = $data->get_param( 'usuario_actual' );



$nombre_usuario = get_user_meta( $data->get_param( 'usuario_actual' ), "first_name", true ) . ' ' . get_user_meta( $data->get_param( 'usuario_actual' ), "last_name", true );


$nombre_con_fecha_subida ='reporte_'.$nombre_usuario.'_ creado_' . date("j F Y") ;

$nombre_con_fecha_subida = preg_replace('/\s+/', '_', $nombre_con_fecha_subida);
$nombre_con_fecha_subida = str_replace('.', '_', $nombre_con_fecha_subida) . '.xlsx';



$upload_dir = wp_upload_dir();

    if ( ! empty( $upload_dir['basedir'] ) ) {

        $user_dirname = $upload_dir['basedir'].'/reportes';

        if ( ! file_exists( $user_dirname ) ) {

            $error = wp_mkdir_p( $user_dirname );

        }
}


//inicio de creacion excel

if ( defined('CBXPHPSPREADSHEET_PLUGIN_NAME') && file_exists( CBXPHPSPREADSHEET_ROOT_PATH . 'lib/vendor/autoload.php' ) ) {
  //Include PHPExcel
  require_once( CBXPHPSPREADSHEET_ROOT_PATH . 'lib/vendor/autoload.php' );

    $args = array(
        'role'    => $role,
        'orderby' => $orderby,
        'order'   => $order,
        'meta_key'     => 'empresa',
        'meta_value'   => $usuario_actual        
    );  

$users = get_users( $args );


$objPHPExcel = new \PhpOffice\PhpSpreadsheet\Spreadsheet();
$s = 0;

  $objPHPExcel->createSheet();
  $objPHPExcel->setActiveSheetIndex($s);
  $objPHPExcel->getActiveSheet()->setTitle("listado");

//return "users";


  $rowCount = 1;

    $objPHPExcel->getActiveSheet()->SetCellValue('A'.$rowCount, "NOMBRE");
    $objPHPExcel->getActiveSheet()->SetCellValue('B'.$rowCount, "APELLIDO");
    $objPHPExcel->getActiveSheet()->SetCellValue('C'.$rowCount, "CEDULA");
    $objPHPExcel->getActiveSheet()->SetCellValue('D'.$rowCount, "MONTO DISPONIBLE");
    $objPHPExcel->getActiveSheet()->SetCellValue('E'.$rowCount, "EMAIL");
    $objPHPExcel->getActiveSheet()->SetCellValue('F'.$rowCount, "HABILITADO *opcional SI/NO");
    $objPHPExcel->getActiveSheet()->SetCellValue('G'.$rowCount, "CIUDAD *opcional");
    $objPHPExcel->getActiveSheet()->SetCellValue('H'.$rowCount, "FECHA NACIMIENTO (AÑO/MES/DIA) *opcional");



  $rowCount = 2;


foreach ( $users as $user )
  {

  $UserData = get_user_meta( $user->ID );  


    $objPHPExcel->getActiveSheet()->SetCellValue('A'.$rowCount, $user->first_name);
    $objPHPExcel->getActiveSheet()->SetCellValue('B'.$rowCount, $user->last_name);
    $objPHPExcel->getActiveSheet()->SetCellValue('C'.$rowCount, $UserData['cedula'][0]);
    $objPHPExcel->getActiveSheet()->SetCellValue('D'.$rowCount, $UserData['disponible'][0]);
    $objPHPExcel->getActiveSheet()->SetCellValue('E'.$rowCount, $user->user_email);

if ($UserData['gearbox'][0] == true) {
    $objPHPExcel->getActiveSheet()->SetCellValue('F'.$rowCount, "SI");} 
else {
    $objPHPExcel->getActiveSheet()->SetCellValue('F'.$rowCount, "NO");
} 
    $objPHPExcel->getActiveSheet()->SetCellValue('G'.$rowCount, $UserData['city'][0]);

if ($UserData['birth_date'][0] == "") {
$date = "";
} else {
$date = date("Y/m/d", strtotime($UserData['birth_date'][0]));
}

    $objPHPExcel->getActiveSheet()->SetCellValue('H'.$rowCount, $date);

//    $objPHPExcel->getActiveSheet()->SetCellValue('H'.$rowCount, ($UserData['birth_date'][0]));


    $rowCount++;

  }



$writer = new \PhpOffice\PhpSpreadsheet\Writer\Xlsx($objPHPExcel);
$writer->save($user_dirname . '/'. $nombre_con_fecha_subida);

return ($nombre_con_fecha_subida);

} else {

$msg = 'ha ocurrido un error con cargar excel';

} 

return ($msg);

}



//GENERAR REPORTE MENSUALES de cualquiera basado en id y fecha

function  generar_reportes( $data ) {
    
$id_temp = $data['id'];

$arreglos = json_decode($data->get_param( 'informacion' ));

$rol_actual = $data->get_param( 'rol_actual' );
$pagar = $data->get_param( 'pagar' );

$fecha_mes = explode("/",$arreglos[0]->post_date); 



$nombre_usuario = get_user_meta( $data->get_param( 'usuario_actual' ), "first_name", true ) . ' ' . get_user_meta( $data->get_param( 'usuario_actual' ), "last_name", true );


$nombre_con_fecha_subida ='reporte_'.$nombre_usuario.'_ creado_' . date("j F Y") . 'correspondiente_a_'.$fecha_mes[1].'_'.$fecha_mes[2] ;

$nombre_con_fecha_subida = preg_replace('/\s+/', '_', $nombre_con_fecha_subida);
$nombre_con_fecha_subida = str_replace('.', '_', $nombre_con_fecha_subida) . '.xlsx';

//OBTENER ULTIMA FACTURA CONTIFICO

$numeracion = obtener_ultima_contifico();


//INICIAR ANALISIS DE REPORTES

$solicitudes_array = array();

foreach ( $arreglos as $arreglo ) 

{


//SECCION PARA SUPERADMIN GENERANDO PARA BANCO - este escel es diferente

//cambiar tag a pagado. aqui tambien deberia ir el llamado a restapi de facturacion

if ($rol_actual=='superadmin' && $pagar=='si') {

wp_set_post_tags( $arreglo->ID, 'procesando' );
$update = array( 'ID' => $arreglo->ID );
wp_update_post( $update );

//fin cambio de tag a pagado y de restapi de facturacion..  

$solicitud_row = array();

$secciones= (explode("<br>",$arreglo->post_content)); //separo en sus 4 secciones. banco es la 2 y 3


$banco = (explode(" - ",$secciones[2])); //separo nombre y numero de cuenta
$banco_nombre = $banco[0]; //separo nombre
$banco_cuenta = (explode(": ",$banco[1])); //numero de cuenta
$banco_cuenta_tipo = $banco_cuenta[0];
$banco_cuenta = $banco_cuenta[1];

$persona = (explode(" - ",$secciones[3])); //separo nombre y numero de cuenta
$persona_nombre = (explode(": ",$persona[0])); // nombre persona
$persona_nombre = $persona_nombre[1]; // nombre persona
$persona_cedula = (explode(": ",$persona[1])); //cedula
$persona_cedula = $persona_cedula[1]; //cedula
$persona_email = $persona[2]; //email

$persona_alt = (explode(" - ",$secciones[0])); //separo nombre y numero de cuenta
$persona_nombre = $persona_alt[0]; // nombre persona


$solicitud_row["banco_nombre"] = $banco_nombre;
$solicitud_row["banco_cuenta_tipo"] = $banco_cuenta_tipo;
$solicitud_row["banco_cuenta"] = $banco_cuenta;
$solicitud_row["persona_nombre"] = $persona_nombre;
$solicitud_row["persona_cedula"] = $persona_cedula;
$solicitud_row["persona_email"] = $persona_email;

$solicitud_row["monto_solititado"] = (float)($arreglo->post_excerpt);
$solicitud_row["tax"] = (float)($arreglo->gearbox);
$solicitud_row["total_descontar"] = (float)($arreglo->post_excerpt) + (float)($arreglo->gearbox);


//CHEQUEO DE EXISTIR SOLICITUD PAGO A CONTIFICO

if (get_user_meta( $arreglo->empresa_id, "flexirol3", true ) == '2' ) {

            $year  = date("Y", strtotime($arreglo->post_date));
            $month = date("d", strtotime($arreglo->post_date)); //deberia ser m, pero no se porqu eno agarra sino el dia d

    $proximo = crear_pagos_contifico($arreglo->post_author , $year , $month , $arreglo->empresa_id, $numeracion);

if($proximo =='si') {
  $numeracion = $numeracion +1 ;
  }

}

//Generar arreglo de bancos y usuarios

if (!$solicitudes_array[$banco_nombre]) {
$solicitudes_array[$banco_nombre] = array();  
}

  array_push($solicitudes_array[$banco_nombre], $solicitud_row); //INFORMACION GUARDADA EN PHP ARRAY

  } //FIN SECCION PARA SUPERADMIN GENERANDO PARA BANCO


//SECCION PARA SUPERADMIN BUSQUEDA HISTORICA


if ($pagar=='no') {


$solicitud_row = array();

$empresa_actual = $arreglo->empresa;

$los_datos = explode(" - ",$arreglo->post_title);
$nombre = $los_datos[0];
$cedula = $los_datos[1];
$cedula = explode(":",$cedula);

$secciones= (explode("<br>",$arreglo->post_content)); //separo en sus 4 secciones. banco es la 2 y 3

$banco = (explode(" - ",$secciones[2])); //separo nombre y numero de cuenta
$banco_nombre = $banco[0]; //separo nombre
$banco_cuenta = (explode(": ",$banco[1])); //numero de cuenta
$banco_cuenta_tipo = $banco_cuenta[0];
$banco_cuenta = $banco_cuenta[1];

$persona = (explode(" - ",$secciones[3])); //separo nombre y numero de cuenta
$persona_nombre = (explode(": ",$persona[0])); // nombre persona
$persona_nombre = $persona_nombre[1]; // nombre persona
$persona_cedula = (explode(": ",$persona[1])); //cedula
$persona_cedula = $persona_cedula[1]; //cedula
$persona_email = $persona[2]; //email


$solicitud_row["nombre_usuario"] = $nombre;
$solicitud_row["cedula_usuario"] = $cedula[1];

$solicitud_row["fecha_solicitud"] = $arreglo->post_date;
$solicitud_row["fecha_procesado"] = $arreglo->post_modified;

$solicitud_row["banco_nombre"] = $banco_nombre;
$solicitud_row["banco_cuenta_tipo"] = $banco_cuenta_tipo;
$solicitud_row["banco_cuenta"] = $banco_cuenta;
$solicitud_row["persona_nombre"] = $persona_nombre;
$solicitud_row["persona_cedula"] = $persona_cedula;
$solicitud_row["persona_email"] = $persona_email;

$solicitud_row["monto_solititado"] = (float)($arreglo->post_excerpt);


if ((float)($arreglo->gearbox) == 0) {
$solicitud_row["tax"] = 0;
$solicitud_row["iva"] = 0;
$solicitud_row["total_descontar"] = $solicitud_row["monto_solititado"];
} else {
$solicitud_row["tax"] = (float)($arreglo->gearbox);
$solicitud_row["iva"] = round((((float)($arreglo->post_excerpt) + (float)($arreglo->gearbox)) * 12 / 100),2); 
$solicitud_row["total_descontar"] = $solicitud_row["monto_solititado"] + $solicitud_row["iva"] + $solicitud_row["tax"];
}


//agregar el nuevo arreglo al total de hacer reporte

if (!$solicitudes_array[$empresa_actual]) {
$solicitudes_array[$empresa_actual] = array();  
}

  array_push($solicitudes_array[$empresa_actual], $solicitud_row); //INFORMACION GUARDADA EN PHP ARRAY


  } //FIN SECCION PARA SUPERADMIN REPORTE HISTORICO


//INICIO SECCION PARA EMPRESA

if ($rol_actual!='superadmin' && $pagar=='si') {

$los_datos = explode(" - ",$arreglo->post_title);

$nombre = $los_datos[0];
$cedula = $los_datos[1];
$cedula = explode(":",$cedula);

$listado_usuarios[$nombre]['cedula'] = $cedula[1];

if ((float)$arreglo->gearbox ==0) {
$listado_usuarios[$nombre]['valor'] = round((((float)$listado_usuarios[$nombre]['valor']) + (float)$arreglo->post_excerpt) , 2);
}else {
$adicional = round((((float)$arreglo->gearbox + (float)$arreglo->post_excerpt) * 1.12 ),2);
$listado_usuarios[$nombre]['valor'] = round((((float)$listado_usuarios[$nombre]['valor']) + (float)$adicional) , 2);
}

  }

}

//chequeo de directorio o crearlo

$upload_dir = wp_upload_dir();

    if ( ! empty( $upload_dir['basedir'] ) ) {

        $user_dirname = $upload_dir['basedir'].'/reportes';

        if ( ! file_exists( $user_dirname ) ) {

            $error = wp_mkdir_p( $user_dirname );

        }
}

//inicio de creacion excel

if ( defined('CBXPHPSPREADSHEET_PLUGIN_NAME') && file_exists( CBXPHPSPREADSHEET_ROOT_PATH . 'lib/vendor/autoload.php' ) ) {
  //Include PHPExcel
  require_once( CBXPHPSPREADSHEET_ROOT_PATH . 'lib/vendor/autoload.php' );

$objPHPExcel = new \PhpOffice\PhpSpreadsheet\Spreadsheet();



//seccion para superadmin pagando

if ($rol_actual=='superadmin' && $pagar=='si') {

$s=0;  

foreach( $solicitudes_array as $key_bancos => $val_bancos) {

  $objPHPExcel->createSheet();
  $objPHPExcel->setActiveSheetIndex($s);
  $objPHPExcel->getActiveSheet()->setTitle($key_bancos);

  $rowCount = 1;

  foreach( $val_bancos as $valores) {

if ($key_bancos =="Guayaquil") {

$numero_x = substr((((number_format($valores['monto_solititado'],2,".",""))*100) + 10000000000000),1);

$cta = strtoupper("CTA " . $valores['banco_cuenta_tipo']);


    $objPHPExcel->getActiveSheet()->SetCellValue('A'.$rowCount, "PA");
    $objPHPExcel->getActiveSheet()->SetCellValue('B'.$rowCount, "CUENTA ORIGINAL FLEXIROL");
    $objPHPExcel->getActiveSheet()->SetCellValue('C'.$rowCount, "1");
    $objPHPExcel->getActiveSheet()->SetCellValue('D'.$rowCount, "");
    $objPHPExcel->getActiveSheet()->SetCellValue('E'.$rowCount, intval($valores['banco_cuenta']));
    $objPHPExcel->getActiveSheet()->SetCellValue('F'.$rowCount, "USD");
    $objPHPExcel->getActiveSheet()->SetCellValue('G'.$rowCount, $numero_x);
    $objPHPExcel->getActiveSheet()->SetCellValue('H'.$rowCount, "CTA");
    $objPHPExcel->getActiveSheet()->SetCellValue('I'.$rowCount, "por confirmar");
    $objPHPExcel->getActiveSheet()->SetCellValue('J'.$rowCount, $cta);
    $objPHPExcel->getActiveSheet()->SetCellValue('K'.$rowCount, intval($valores['banco_cuenta']));
    $objPHPExcel->getActiveSheet()->SetCellValue('L'.$rowCount, "C");
    $objPHPExcel->getActiveSheet()->SetCellValue('M'.$rowCount, strval($valores['persona_cedula']));
    $objPHPExcel->getActiveSheet()->SetCellValue('N'.$rowCount, strtoupper($valores['persona_nombre']));


} else {

    $objPHPExcel->getActiveSheet()->SetCellValue('A'.$rowCount, $valores['banco_cuenta_tipo']);
    $objPHPExcel->getActiveSheet()->SetCellValue('B'.$rowCount, $valores['banco_cuenta']);
    $objPHPExcel->getActiveSheet()->SetCellValue('C'.$rowCount, $valores['persona_cedula']);
    $objPHPExcel->getActiveSheet()->SetCellValue('D'.$rowCount, $valores['persona_email']);
    $objPHPExcel->getActiveSheet()->SetCellValue('E'.$rowCount, $valores['persona_nombre']);

    $objPHPExcel->getActiveSheet()->SetCellValue('F'.$rowCount, $valores['monto_solititado']);
    $objPHPExcel->getActiveSheet()->SetCellValue('G'.$rowCount, $valores['tax']);
    $objPHPExcel->getActiveSheet()->SetCellValue('H'.$rowCount, $valores['total_descontar']);

}

    $rowCount++;

    }

  $s++;

  }

} //FIN seccion para superadmin pagando

//seccion para EMPRESA historial

if ($rol_actual!='superadmin' && $pagar=='no') {

$s=0;  

foreach( $solicitudes_array as $key_empresa => $val_bancos) {

  $objPHPExcel->createSheet();
  $objPHPExcel->setActiveSheetIndex($s);
  $objPHPExcel->getActiveSheet()->setTitle($key_empresa);

  $objPHPExcel->getActiveSheet()->SetCellValue('A1', 'Nombre del usuario');
  $objPHPExcel->getActiveSheet()->SetCellValue('B1', 'Cedula');
  $objPHPExcel->getActiveSheet()->SetCellValue('C1', 'email');
  $objPHPExcel->getActiveSheet()->SetCellValue('D1', 'Valor($)');
  $objPHPExcel->getActiveSheet()->SetCellValue('E1', 'Fecha solicitud');
  $objPHPExcel->getActiveSheet()->SetCellValue('F1', 'Fecha procesado');



  $rowCount = 2;
  foreach( $val_bancos as $valores) {

    $objPHPExcel->getActiveSheet()->SetCellValue('A'.$rowCount, $valores['nombre_usuario']);
    $objPHPExcel->getActiveSheet()->SetCellValue('B'.$rowCount, $valores['cedula_usuario']);
    $objPHPExcel->getActiveSheet()->SetCellValue('C'.$rowCount, $valores['persona_email']);
    $objPHPExcel->getActiveSheet()->SetCellValue('D'.$rowCount, $valores['total_descontar']);
    $objPHPExcel->getActiveSheet()->SetCellValue('E'.$rowCount, $valores['fecha_solicitud']);
    $objPHPExcel->getActiveSheet()->SetCellValue('F'.$rowCount, $valores['fecha_procesado']);

    $rowCount++;

    }

  $s++;

  }

} //FIN seccion para superadmin historial

//seccion para superadmin historial

if ($rol_actual=='superadmin' && $pagar=='no') {

$s=0;  

foreach( $solicitudes_array as $key_empresa => $val_bancos) {

  $objPHPExcel->createSheet();
  $objPHPExcel->setActiveSheetIndex($s);
  $objPHPExcel->getActiveSheet()->setTitle($key_empresa);

  $objPHPExcel->getActiveSheet()->SetCellValue('A1', 'Nombre del usuario');
  $objPHPExcel->getActiveSheet()->SetCellValue('B1', 'Cedula');
  $objPHPExcel->getActiveSheet()->SetCellValue('C1', 'Banco del deposito');
  $objPHPExcel->getActiveSheet()->SetCellValue('D1', 'Tipo de cuenta');
  $objPHPExcel->getActiveSheet()->SetCellValue('E1', 'Numero de cuenta');
  $objPHPExcel->getActiveSheet()->SetCellValue('F1', 'Titular de la cuenta');
  $objPHPExcel->getActiveSheet()->SetCellValue('G1', 'Cedula del titular');
  $objPHPExcel->getActiveSheet()->SetCellValue('H1', 'email');
  $objPHPExcel->getActiveSheet()->SetCellValue('I1', 'Valor Anticipado($)');
  $objPHPExcel->getActiveSheet()->SetCellValue('J1', 'Valor del servicio($)');
  $objPHPExcel->getActiveSheet()->SetCellValue('K1', 'IVA($)');  
  $objPHPExcel->getActiveSheet()->SetCellValue('L1', 'Valor a descontarse del sueldo($)');
  $objPHPExcel->getActiveSheet()->SetCellValue('M1', 'Fecha solicitud');
  $objPHPExcel->getActiveSheet()->SetCellValue('N1', 'Fecha procesado');



  $rowCount = 2;
  foreach( $val_bancos as $valores) {

    $objPHPExcel->getActiveSheet()->SetCellValue('A'.$rowCount, $valores['nombre_usuario']);
    $objPHPExcel->getActiveSheet()->SetCellValue('B'.$rowCount, $valores['cedula_usuario']);

     $objPHPExcel->getActiveSheet()->SetCellValue('C'.$rowCount, $valores['banco_nombre']);
   $objPHPExcel->getActiveSheet()->SetCellValue('D'.$rowCount, $valores['banco_cuenta_tipo']);
   $objPHPExcel->getActiveSheet()->SetCellValue('E'.$rowCount, $valores['banco_cuenta']);
    $objPHPExcel->getActiveSheet()->SetCellValue('F'.$rowCount, $valores['persona_nombre']);
    $objPHPExcel->getActiveSheet()->SetCellValue('G'.$rowCount, $valores['persona_cedula']);
    $objPHPExcel->getActiveSheet()->SetCellValue('H'.$rowCount, $valores['persona_email']);

    $objPHPExcel->getActiveSheet()->SetCellValue('I'.$rowCount, $valores['monto_solititado']);
    $objPHPExcel->getActiveSheet()->SetCellValue('J'.$rowCount, $valores['tax']);
    $objPHPExcel->getActiveSheet()->SetCellValue('K'.$rowCount, $valores['iva']);
    $objPHPExcel->getActiveSheet()->SetCellValue('L'.$rowCount, $valores['total_descontar']);

    $objPHPExcel->getActiveSheet()->SetCellValue('M'.$rowCount, $valores['fecha_solicitud']);
    $objPHPExcel->getActiveSheet()->SetCellValue('N'.$rowCount, $valores['fecha_procesado']);

    $rowCount++;

    }

  $s++;

  }

} //FIN seccion para superadmin historial

//INICIO SECCION PARA EMPRESAS SU LISTADO HISTORICO

if ($rol_actual!='superadmin' && $pagar=='si') {

//CHEQUEO DE USUARIOS EN PLAN 2

if (get_user_meta( $data->get_param( 'usuario_actual' ), "flexirol3", true ) == '2') {

$args = array(

        'role'    => 'usuario',

    'meta_query' => array(
        array(
            'key' => 'empresa',
            'value' => $data->get_param( 'usuario_actual' ),
            'compare' => '='
        ),
        array(
            'key' => 'flexirol4',
            'value' => 'si',
            'compare' => '='
        )
    )
);

$users = get_users( $args );

$flexirol2 = get_user_meta( $data->get_param( 'usuario_actual' ), "flexirol2", true );

if (!$fecha_mes[2] || !$fecha_mes[1]){

$today = getdate();

            $fecha_mes[2] = $today['year'];
            $fecha_mes[1] = $today['mon'];

}


foreach ( $users as $user )

  {

$confirmar =  crear_pagos_contifico($user->ID , $fecha_mes[2] , $fecha_mes[1] , $data->get_param( 'usuario_actual' ), $numeracion);

if ($confirmar == 'si'){
  $numeracion = $numeracion + 1;
}

    if ($listado_usuarios[$user->display_name]['valor']) {

      $listado_usuarios[$user->display_name]['valor'] = round((((float)$listado_usuarios[$user->display_name]['valor']) + ((float)$flexirol2)*1.12) , 2);

    } else {

      $listado_usuarios[$user->display_name]['valor'] = round(((float)$flexirol2 * 1.12),2);

      $listado_usuarios[$user->display_name]['cedula'] = get_user_meta( $user->ID, "cedula", true );

    }

  }

}



//IMPRESION DEL EXCEL

$s=0;  

  $objPHPExcel->createSheet();
  $objPHPExcel->setActiveSheetIndex($s);
  $objPHPExcel->getActiveSheet()->setTitle($fecha_mes[1].'_'.$fecha_mes[2]);

    $objPHPExcel->getActiveSheet()->SetCellValue('A1', 'Nombre del usuario');
    $objPHPExcel->getActiveSheet()->SetCellValue('B1', 'Cedula');
    $objPHPExcel->getActiveSheet()->SetCellValue('C1', 'Valor a descontarse($)');

  $rowCount = 2;

  foreach( $listado_usuarios as $key_usuarios => $val_usuarios) {

    $objPHPExcel->getActiveSheet()->SetCellValue('A'.$rowCount, $key_usuarios);
    $objPHPExcel->getActiveSheet()->SetCellValue('B'.$rowCount, $val_usuarios['cedula']);
    $objPHPExcel->getActiveSheet()->SetCellValue('C'.$rowCount, $val_usuarios['valor']);

    $rowCount++;

  }

  } //FIN SECCION PARA EMPRESAS SU LISTADO HISTORICO




$writer = new \PhpOffice\PhpSpreadsheet\Writer\Xlsx($objPHPExcel);
$writer->save($user_dirname . '/'. $nombre_con_fecha_subida);

return ($nombre_con_fecha_subida);

} else {

$msg = 'ha ocurrido un error con cargar excel';

} 

return ($msg);

}



//LISTADO SOLICITUDES  MENSUALES

function  ver_pagos( $data ) {

global $wpdb;

    
$id_temp = $data['id'];

if (!is_null($data->get_param( 'por_cedula' ))) { 

$queries = $wpdb->get_results("SELECT user_id FROM wp_usermeta WHERE meta_key='cedula' AND meta_value = '" . $data->get_param( 'por_cedula' ) . "' group by wp_usermeta.user_id", OBJECT);

foreach ( $queries as $query ) {
    $author = $query->user_id; // the the user id
  }
} else {
  $author = '';
}

if (!is_null($data->get_param( 'por_fecha' ))) { 

            $today['year'] = $data->get_param( 'year' );
            $today['mon'] = $data->get_param( 'month' );

} else {

$today = getdate();

}

$args = array(
    'post_type' => $data->get_param( 'tipo' ),
    'author' => $author,    
        'meta_key'     => 'empresa',
        'meta_value'   => $data->get_param( 'empresa' ),
    'date_query' => array(
        array(
            'year'  => $today['year'],
            'month' => $today['mon'],
        ),
    ),
);

$posts = new WP_Query( $args );

$current_user_posts = $posts->posts;

$i=0;

foreach ( $current_user_posts as $post )   {

    $DBRecord[$i]['post_author']       = $post->post_author;   
    $DBRecord[$i]['ID']         = $post->ID;  
    $DBRecord[$i]['post_name'] = $post->post_name;

    $date = new DateTime($post->post_date);

    $DBRecord[$i]['post_date']  = $date->format("d/m/Y"); 

    $date = new DateTime($post->post_modified);

    $DBRecord[$i]['post_modified'] = $date->format("d/m/Y"); 

    $DBRecord[$i]['post_excerpt'] = $post->post_excerpt;
    $DBRecord[$i]['post_title']  = $post->post_title;
    $DBRecord[$i]['post_content'] = $post->post_content;

    $UserData = get_post_meta( $post->ID );  

    $DBRecord[$i]['gearbox'] = $UserData['gearbox'][0];
    $DBRecord[$i]['user_email'] = $UserData['user_email'][0];

//NOMBRE USUARIO Y EMPRESA
    $DBRecord[$i]['empleado'] = get_user_meta( $post->post_author, "first_name", true ) . ' ' . get_user_meta( $post->post_author, "last_name", true );

    $DBRecord[$i]['empresa'] = get_user_meta( (get_user_meta( $post->post_author, "empresa", true )), "first_name", true ) . ' ' . get_user_meta( (get_user_meta( $post->post_author, "empresa", true )), "last_name", true );

    $DBRecord[$i]['empresa_id'] = get_user_meta( $post->post_author, "empresa", true );

//TAGS
    $post_tags = get_the_tags($post->ID);

    if ( $post_tags ) {
      $DBRecord[$i]['tag'] = $post_tags[0]->name; 
    }

    $i++;

  }

  return $DBRecord;       

}




//Info de usuario llamado por al RESTAPI

function  quiero_info( $data ) {
    
$id_temp = $data['id'];

$rol_actual = get_user_role($data->get_param( 'ID' ));

if (!is_null($data->get_param( 'ID' ))) { 

$user = get_userdata( $data->get_param( 'ID' ) );


  $DBRecord['role']       = $rol_actual;   
  $DBRecord['ID']         = $user->ID;  
  $DBRecord['first_name'] = $user->first_name;
  $DBRecord['last_name']  = $user->last_name;
  $DBRecord['user_login'] = $user->user_login;
  $DBRecord['user_email'] = $user->user_email;
  $DBRecord['display_name'] = $user->display_name;

  $UserData = get_user_meta( $data->get_param( 'ID' ) );  

$DBRecord['gearbox'] = $UserData['gearbox'][0]; 
$DBRecord['empresa'] = $UserData['empresa'][0]; 
$DBRecord['disponible'] = $UserData['disponible'][0]; 
$DBRecord['cedula'] = $UserData['cedula'][0]; 
$DBRecord['gender'] = $UserData['gender'][0]; 


//$date = new DateTime($UserData['birth_date'][0]);    
//$DBRecord['birth_date'] = $date->format("d/m/Y"); 

$date = date("Y/m/d", strtotime($UserData['birth_date'][0]));

$DBRecord['birth_date'] = $date; 


$DBRecord['city'] = $UserData['city'][0]; 
$DBRecord['address'] = $UserData['address'][0]; 
$DBRecord['phone_number'] = $UserData['phone_number'][0]; 

/* PLAN FLEXIROL DE FEE MENSUAL : BANDERA DE SI ESTA ACTIVO O NO EL PLAN */

if (!empty($UserData['flexirol4'][0])) { $DBRecord['flexirol4'] = $UserData['flexirol4'][0]; } else {$DBRecord['flexirol4'] = 'no';}



if ($rol_actual == "usuario") {

$id_empresa_temp = $UserData['empresa'][0];
$userempresa = get_userdata( $id_empresa_temp );  
$DBRecord['empresa_nombre'] = $userempresa->first_name;

if ($userempresa->last_name) {
  $DBRecord['empresa_nombre']  .= "-" . $userempresa->last_name;
}
 
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
           
} 

return $DBRecord;

}

//listado de usuarios llamado por al RESTAPI

function  quiero_usuarios( $data ) {
    
$id_temp = $data['id'];

if (!is_null($data->get_param( 'role' ))) { $role = $data->get_param( 'role' ); } else { $role='usuario';}
if (!is_null($data->get_param( 'orderby' ))) { $orderby = $data->get_param( 'orderby' ); } else { $orderby='ID';}
if (!is_null($data->get_param( 'order' ))) { $order = $data->get_param( 'order' ); } else { $order='asc';}
if (!is_null($data->get_param( 'empresa' ))) { $empresa = $data->get_param( 'empresa' ); } else { $empresa='';}
if (!is_null($data->get_param( 'cedula' ))) { $cedula = $data->get_param( 'cedula' ); } else { $cedula='';}


    return  get_users_by_role($role, $orderby, $order, $empresa, $cedula);
}


//CREACION Y ACTUALIZACION DE USUARIOS

function  crear_usuarios() {

$json = array();

$_POST = ($_POST['new_item']);




//pruebas

/*
$user_query = new WP_User_Query( //VER SI YA EXISTE LA CEDULA EN LA BASE DE DATOS
        array(
            'meta_key'    =>    'cedula',
            'meta_value'    =>  esc_sql($_POST['cedula'])
        )
    );
    // Get the results from the query, returning the first user
    $chequeo_cedula = $user_query->get_results();

if($chequeo_cedula){

        $json['type'] = 'error';
        $json['message'] = 'Se ha producido un error en la creacion ' . json_encode($chequeo_cedula[0]);

    }else{

        $json['type'] = 'error';
        $json['message'] = 'Se ha producido un error en la creacion: falso ' ;
    }


        echo json_encode($json);
        die;

*/
//fin pruebas





//CHEQUEO DE ERRORES DE OBLIGATORIOS

	if (!empty($_POST['first_name'])) {
		$first_name = esc_sql($_POST['first_name']);
	} else {
		$json['type'] = 'error';
		$json['message'] = 'Se ha producido un error en la creacion first_name';

        echo json_encode($json);
		die;
	}

	if (!empty($_POST['user_email'])) {
		$user_email = esc_sql($_POST['user_email']);
	} else {
		$json['type'] = 'error';
		$json['message'] = 'Se ha producido un error en la creacion - problemas de email - mal escrito';
		echo json_encode($json);
		die;
	}

	if (!empty($_POST['user_login'])) {
		$user_login = esc_sql($_POST['user_login']);
	} else {
		$json['type'] = 'error';
		$json['message'] = 'Se ha producido un error en la creacion user_login';
        echo json_encode($json);
		die;
	}

if (!empty($_POST['ID'])) { //CHEQUEO SI ES CREACION DE USUARIO NUEVO O GRABAR USUAIRO ANTIGUO

$id = (int)($_POST['ID']); //ES USUARIO ANTIGUO

} else { //ES USUARIO NUEVO. 

if ($_POST['role']!= 'empresa'){ //solo si no es empresa

$user_query = new WP_User_Query( //VER SI YA EXISTE LA CEDULA EN LA BASE DE DATOS
        array(
            'meta_key'    =>    'cedula',
            'meta_value'    =>  esc_sql($_POST['cedula'])
        )
    );
    // Get the results from the query, returning the first user
    $chequeo_cedula = $user_query->get_results();

    if($chequeo_cedula){
        $json['type'] = 'error';
        $json['message'] = 'Se ha producido un error: CEDULA YA EXISTE EN EL SISTEMA. Comuniquese con FlexiRol para mas detalles por favor..';
        echo json_encode($json);
        die;
    }else{
 // nada
   }
}

$exists = email_exists( $user_email ); //CHEQUEO SI EMAIL YA EXISTE EN LA BASE DE DATOS

if ( $exists ) {
        $json['type'] = 'error';
        $json['message'] = 'Se ha producido un error: EL EMAIL YA EXISTE.  Comuniquese con FlexiRol para mas detalles por favor..';
        echo json_encode($json);
        die;
}

	if (!empty($_POST['user_pass'])) { //DEBO VER SI ESTA ENVIANDO PASSWORD
		$user_pass = esc_sql($_POST['user_pass']);
	} else {
		$json['type'] = 'error';
		$json['message'] = 'Se ha producido un error en la creacion user_pass';
        echo json_encode($json);
		die;
	}

}

//CHEQUEO VALORES DEFAULT

		if (!empty($_POST['last_name'])) {$last_name = esc_sql($_POST['last_name']);} else {$last_name = '';}
		if (!empty($_POST['role'])) {$role = esc_sql($_POST['role']);} else {$role = 'usuario';}
		if (!empty($_POST['gearbox'])) {$gearbox = esc_sql($_POST['gearbox']);} else {$gearbox = 1 ;}
		if (!empty($_POST['empresa'])) {$empresa = esc_sql($_POST['empresa']);} else {$empresa = 1 ;}	
		if (!empty($_POST['cedula'])) {$cedula = esc_sql($_POST['cedula']);} else {$cedula = 0 ;}
		if (!empty($_POST['disponible'])) {$disponible = esc_sql($_POST['disponible']);} else {$disponible = 0 ;}

    $phone_number = esc_sql($_POST['phone_number']);
    $city = esc_sql($_POST['city']);
    $address = esc_sql($_POST['address']);
    $birth_date = esc_sql($_POST['birth_date']);
    $gender = esc_sql($_POST['gender']);    

    if (!empty($_POST['flexirol'])) {$flexirol = esc_sql($_POST['flexirol']);} else {$flexirol = 10;}
    if (!empty($_POST['flexirol2'])) {$flexirol2 = esc_sql($_POST['flexirol2']);} else {$flexirol2 = 10;}
    if (!empty($_POST['flexirol3'])) {$flexirol3 = esc_sql($_POST['flexirol3']);} else {$flexirol3 = 1;}
    if (!empty($_POST['flexirol4'])) {$flexirol4 = esc_sql($_POST['flexirol4']);} else {$flexirol4 = 'no';}


		if (!empty($_POST['dia_inicio'])) {$dia_inicio = esc_sql($_POST['dia_inicio']);} else {$dia_inicio = 2;}
		if (!empty($_POST['dia_cierre'])) {$dia_cierre = esc_sql($_POST['dia_cierre']);} else {$dia_cierre = 28;}
		if (!empty($_POST['porcentaje'])) {$porcentaje = esc_sql($_POST['porcentaje']);} else {$porcentaje = 50 ;}
		if (!empty($_POST['dia_bloqueo'])) {$dia_bloqueo = esc_sql($_POST['dia_bloqueo']);} else {$dia_bloqueo = 1 ;}	
		if (!empty($_POST['frecuencia'])) {$frecuencia = esc_sql($_POST['frecuencia']);} else {$frecuencia = 0 ;}
		if (!empty($_POST['dia_reinicio'])) {$dia_reinicio = esc_sql($_POST['dia_reinicio']);} else {$dia_reinicio = 0 ;}


 $display_name = $first_name . ' ' . $last_name ;

//GENERACION DE FECHA ACTUALIZADA DEL EXCEL PARA USUARIO ACTUAL

$today = getdate();

$today = $today['mday'] . '/'.$today['mon'].'/'.$today['year'];

//GENERACION DE METADATA

 $meta = array(
    'empresa' => $empresa,
    'cedula' => $cedula,    
    'gearbox' => $gearbox,
    'disponible' => $disponible,

    'phone_number' => $phone_number,
    'city' => $city,    
    'address' => $address,
    'birth_date' => $birth_date,
    'gender' => $gender,

    'flexirol' => $flexirol,
    'flexirol2' => $flexirol2,
    'flexirol3' => $flexirol3,
    'flexirol4' => $flexirol4,


    'dia_inicio' => $dia_inicio,
    'dia_cierre' => $dia_cierre,    
    'porcentaje' => $porcentaje,
    'dia_bloqueo' => $dia_bloqueo,    
    'frecuencia' => $frecuencia,
    'dia_reinicio' => $dia_reinicio,
    'fecha_excel' => $today,

  );

  //Seleccionar si se actualiza o se crea desde cero


if (!empty($_POST['ID'])) {

$user_id = wp_update_user( array(
  'ID' => $id,

  'user_login' => $user_login,
  'user_nicename' => $user_login,

  'user_email' => $user_email,

  'first_name' => $first_name,
  'last_name' => $last_name,

  'display_name'=> $display_name ,

  'role' => $role,
));

  //check if there are no errors
  if ( ! is_wp_error( $user_id ) ) {
    foreach( $meta as $key => $val ) {
      update_user_meta( $id, $key, $val ); 
    }
  }

} else {

$user_id = wp_insert_user( array(
  'user_login' => $user_login,
  'user_nicename' => $user_login,

  'user_pass' => $user_pass,
  'user_email' => $user_email,

  'first_name' => $first_name,
  'last_name' => $last_name,

  'display_name'=> $display_name ,

  'role' => $role,
));

  //check if there are no errors
  if ( ! is_wp_error( $user_id ) ) {
    foreach( $meta as $key => $val ) {
      update_user_meta( $user_id, $key, $val ); 
    }
  }

}
  
//ACTUALIZACION FECHA EXCEL DE EMPRESA MADRE

$updated = update_user_meta( $empresa, 'fecha_excel', $today );

//terminar funcion con retorno de ID CREADO

  return $user_id; 

}
	add_action('wp_ajax_crear_usuarios', 'crear_usuarios');
	add_action('wp_ajax_nopriv_crear_usuarios', 'crear_usuarios');
    
// Borrar_usuarios

function  borrar_usuarios() {

$json = array();

$deleted_user = (int)($_POST['ID']);
$rol_user = get_user_role($deleted_user);

if ($rol_user =='empresa') {

$user_id = wp_delete_user($deleted_user);

if ( ! is_wp_error( $user_id ) ) {

    $args = array(
        'role'    => 'usuario',
        'meta_key'     => 'empresa',
        'meta_value'   => $deleted_user        
    );	

$users = get_users( $args );

foreach ( $users as $user )
	  {

//$updated = update_user_meta( $user->ID, 'gearbox', 'false' ); //pasandolo a bloqueado mas bien
//$updated = update_user_meta( $user->ID, 'empresa', '' ); //borrando su empresa

$user_id = wp_delete_user($user->ID);

	  }
  }
} else {

//$updated = update_user_meta( $deleted_user, 'gearbox', 'false' ); //pasandolo a bloqueado mas bien
//$updated = update_user_meta( $deleted_user, 'empresa', '' ); //borrando su empresa

$user_id = wp_delete_user($deleted_user);

}

return 'accion realizada con exito'; 

}
	add_action('wp_ajax_borrar_usuarios', 'borrar_usuarios');
	add_action('wp_ajax_nopriv_borrar_usuarios', 'borrar_usuarios');




/*REGISTRO DE SHORTCODES ESPECIALIZADOS */


add_shortcode( 'saludo_usuarios', function () {
	
//Add Vue.js a la presentacion de los usuarios. asi ya queda inicializado

  wp_enqueue_script('wpvue_vuejs');	
  wp_enqueue_script('axios');	
  wp_enqueue_script('vue-monthly-picker');	
  wp_enqueue_script('bootstrap-vue');	


$profile_id = um_profile_id();
//$tipo_usuario = get_user_role($profile_id);

?>
<script>

var site_url = '<?php echo get_site_url(); ?>' ;
var usuario_actual = '<?php echo $profile_id; ?>' ;
var rol_actual = '<?php echo get_user_role($profile_id); ?>' ;
var mi_empresa_madre = '<?php echo get_user_meta( $profile_id, "empresa", true ) ; ?>' ;


</script>

<?php

echo "<div class='row secundario'>
<h4>Bienvenido de nuevo " . um_user('first_name') . ' ' . um_user('last_name') . '</h4>
<div class="col-sm-12"><hr class="secundario"></div>
</div>' ;

	} 

);




/* INCLUDES CON NUEVAS PAGINAS DE SUPERUSUARIO */

include_once ('superadmin/dashboard-crear-usuarios.php') ;
include_once ('superadmin/dashboard-config.php') ;
include_once ('superadmin/dashboard-excel.php') ;
include_once ('superadmin/dashboard-solicitudes.php') ;
include_once ('superadmin/dashboard-historico.php') ;
include_once ('superadmin/dashboard-check-usuarios.php') ;


/* INCLUDES CON NUEVAS PAGINAS DE ADMIN */

include_once ('admin/dashboard-crear-usuarios.php') ;
include_once ('admin/dashboard-reportes.php') ;

/* INCLUDES CON NUEVAS PAGINAS DE USUARIO */

include_once ('usuario/dashboard-bancos.php') ;
include_once ('usuario/dashboard-solicitudes.php') ;

?>