<?php

/*CREACION DEL RESTAPI */

function quiero_usuarios_api() {

register_rest_route( 'flexirol/v1', '/listado/(?P<id>\d+)', array(
'methods'  => WP_REST_Server::ALLMETHODS,
'callback' => 'quiero_usuarios',
'permission_callback' => '__return_true',
    ) );
}
add_action( 'rest_api_init', 'quiero_usuarios_api' ); //wp-json/flexirol/v1/listado/2?role=empresa&orderby=display_name&order=asc


function quiero_info_api() {

register_rest_route( 'flexirol/v1', '/info/(?P<id>\d+)', array(
'methods'  => WP_REST_Server::ALLMETHODS,
'callback' => 'quiero_info',
'permission_callback' => '__return_true',
    ) );
}
add_action( 'rest_api_init', 'quiero_info_api' ); //wp-json/flexirol/v1/info/2?role=empresa&orderby=display_name&order=asc


function quiero_bancos_api() {

register_rest_route( 'flexirol/v1', '/banco/(?P<id>\d+)', array(
'methods'  => WP_REST_Server::ALLMETHODS,
'callback' => 'quiero_bancos',
'permission_callback' => '__return_true',
    ) );
}
add_action( 'rest_api_init', 'quiero_bancos_api' ); //wp-json/flexirol/v1/banco/2?role=empresa&orderby=display_name&order=asc


function grabar_bancos_api() {

register_rest_route( 'flexirol/v1', '/grabar/(?P<id>\d+)', array(
'methods'  => WP_REST_Server::ALLMETHODS,
'callback' => 'grabar_bancos',
'permission_callback' => '__return_true',
    ) );
}
add_action( 'rest_api_init', 'grabar_bancos_api' ); //wp-json/flexirol/v1/grabar/2?role=empresa&orderby=display_name&order=asc


function borrar_bancos_api() {

register_rest_route( 'flexirol/v1', '/borrar/(?P<id>\d+)', array(
'methods'  => WP_REST_Server::ALLMETHODS,
'callback' => 'borrar_bancos',
'permission_callback' => '__return_true',
    ) );
}
add_action( 'rest_api_init', 'borrar_bancos_api' ); //wp-json/flexirol/v1/borrar/2?role=empresa&orderby=display_name&order=asc


function solicitudes_api() {

register_rest_route( 'flexirol/v1', '/solicitudes/(?P<id>\d+)', array(
'methods'  => WP_REST_Server::ALLMETHODS,
'callback' => 'quiero_bancos',
'permission_callback' => '__return_true',
    ) );
}
add_action( 'rest_api_init', 'solicitudes_api' ); //wp-json/flexirol/v1/solicitudes/2?role=empresa&orderby=display_name&order=asc


function pagos_api() {

register_rest_route( 'flexirol/v1', '/pagos/(?P<id>\d+)', array(
'methods'  => WP_REST_Server::ALLMETHODS,
'callback' => 'generar_reportes',
'permission_callback' => '__return_true',
    ) );
}
add_action( 'rest_api_init', 'pagos_api' ); 

function listado_rapido_api() {

register_rest_route( 'flexirol/v1', '/listadorapido/(?P<id>\d+)', array(
'methods'  => WP_REST_Server::ALLMETHODS,
'callback' => 'listado_rapido',
'permission_callback' => '__return_true',
    ) );
}
add_action( 'rest_api_init', 'listado_rapido_api' ); 


function ver_pagos_api() {

register_rest_route( 'flexirol/v1', '/mensual/(?P<id>\d+)', array(
'methods'  => WP_REST_Server::ALLMETHODS,
'callback' => 'ver_pagos',
'permission_callback' => '__return_true',
    ) );
}
add_action( 'rest_api_init', 'ver_pagos_api' ); //wp-json/flexirol/v1/pagos/2?role=empresa&orderby=display_name&order=asc


function confirmar_pagos_api() {

register_rest_route( 'flexirol/v1', '/confirmar/(?P<id>\d+)', array(
'methods'  => WP_REST_Server::ALLMETHODS,
'callback' => 'confirmar_pagos',
'permission_callback' => '__return_true',
    ) );
}
add_action( 'rest_api_init', 'confirmar_pagos_api' ); //wp-json/flexirol/v1/pagos/2?role=empresa&orderby=display_name&order=asc


function generar_reporte_usuarios_api() {

register_rest_route( 'flexirol/v1', '/reporteusuarios/(?P<id>\d+)', array(
'methods'  => WP_REST_Server::ALLMETHODS,
'callback' => 'generar_reporte_usuarios',
'permission_callback' => '__return_true',
    ) );
}
add_action( 'rest_api_init', 'generar_reporte_usuarios_api' ); //wp-json/flexirol/v1/pagos/2?role=empresa&orderby=display_name&order=asc


function manejar_suscripcion_api() {

register_rest_route( 'flexirol/v1', '/suscripcion/(?P<id>\d+)', array(
'methods'  => WP_REST_Server::ALLMETHODS,
'callback' => 'manejar_suscripcion',
'permission_callback' => '__return_true',
    ) );
}
add_action( 'rest_api_init', 'manejar_suscripcion_api' ); //wp-json/flexirol/v1/pagos/2?role=empresa&orderby=display_name&order=asc


//API DE PRUEBAS

function pruebas_api() {

register_rest_route( 'flexirol/v1', '/pruebas/(?P<id>\d+)', array(
'methods'  => WP_REST_Server::ALLMETHODS,
'callback' => 'obtener_ultima_contifico',
'permission_callback' => '__return_true',
    ) );
}
add_action( 'rest_api_init', 'pruebas_api' ); //wp-json/flexirol/v1/pagos/2?role=empresa&orderby=display_name&order=asc




?>