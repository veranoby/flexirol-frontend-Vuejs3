
var j = jQuery.noConflict();


var app = new Vue({
  el: '#reportes_admin',

	data:{

		filter:'', //valor inicial del filtrado
		filter_total:'', //valor inicial del filtrado

	//	status_deshabilitacion:'', //valor inicial del filtrado
	//	status_habilitacion:'', //valor inicial del filtrado

		usuario_actual:usuario_actual,
		mi_empresa_madre:mi_empresa_madre,
		rol_actual:rol_actual ,

		monto: {value:0,selected:0},

		mensaje_importante: '',

		clase_importante: 'alert alert-primary',

		mes_calculado:null,

		empresa_info_set:null,
		edited_item:{post_author:'',ID:'',post_name:'' ,post_date:'' , post_modified:'', post_excerpt:'' , post_title:'',post_content:'',gearbox:'',user_email:'',},//valor inicial del modal de edicion
		editedbanco_item:{post_author:'',ID:'',post_name:'' ,post_date:'' , post_modified:'', post_excerpt:'' , post_title:'',post_content:'',gearbox:'',user_email:'',},//valor inicial del modal de edicion

		mi_info:{post_author:'',ID:'',post_name:'' ,post_date:'' , post_modified:'', post_excerpt:'' , post_title:'',post_content:'',gearbox:'',user_email:'',}, //valor inicial de crear nuevo usuario
		mi_empresa_info:{post_author:'',ID:'',post_name:'' ,post_date:'' , post_modified:'', post_excerpt:'' , post_title:'',post_content:'',gearbox:'',user_email:'',}, //valor inicial de crear nuevo usuario

		final:[],
		por_filtrarse:[],
		solicitudes_info_set:[], //variable que se usara en la tabla de usuarios
		usuarios_info_set:[], //variable que se usara en la tabla de usuarios


		err_msg:'No hay Solicitudes ejecutadas..',
		mensaje_bloqueo : 'El Usuario esta Bloqueado',		

		loading: false, //controla spinner de cargado de pagina
        dismissSecs: 3, //tiempo del alert
        dismissCountDown: 0 ,
		alertvariant:"success", //clase - color del alert
		mensaje_alerta:"", //mensaje del alert  inicial

			},

	computed:{



totales_sumados:function(){

var final = {};
usuarios_solicitantes = this.solicitudes_info_set;


//filtrado en el search
searchTerm = this.filter_total.toLowerCase(); //del input de filtrado
	var usuarios_solicitantes =  usuarios_solicitantes.filter(function(empresita, i) 
		{ 
		return (
	  			(
		  			empresita["empleado"].toLowerCase().includes(searchTerm) || 
					empresita["post_title"].toLowerCase().includes(searchTerm)
				 )
  			);
		 }) ; 


//sacar totales de las solicitudes

  usuarios_solicitantes.reduce((acc, item) => {
    final[item.post_author] = { ID: item.post_author , nombre_completo: item.empleado , cedula: ((item.post_title).split(" - "))[1] , total: 0 };
  }, {});

console.log(final); 
//console.log(Object.keys(final));


//pasarlos a un nuevo array por usuario

usuarios_solicitantes.forEach(function (arrayItem) {

    var x = arrayItem.post_author;
	final[x].total = Number(final[x].total) + Number(arrayItem.gearbox) + Number(arrayItem.post_excerpt);

}); 


//agregar los que tienen plan 2


if (this.mi_info.flexirol3 =='2' 
                        && this.usuarios_info_set != null  
                        && this.usuarios_info_set.length != null  
                        && this.usuarios_info_set.length > 0 ) {

console.log(this.usuarios_info_set);
valor = Number(this.mi_info.flexirol2);
console.log(valor);

this.usuarios_info_set.forEach(function (arrayItem) {

	if (arrayItem.flexirol4 =="si") {

x = arrayItem.ID;

console.log('prueba plan 2');
console.log(final[x]);


if(typeof final[x] === 'undefined') {

	    final[x] = { ID: x , nombre_completo: arrayItem.display_name , cedula: "Cedula:" + arrayItem.cedula , total: valor};

	} else {

		final[x].total = Number(final[x].total) + valor;

	}

  }

}); 

}

return final;


} ,




			habilitado_switch_excel:function(){

				if (this.rol_actual =='superadmin') {
					this.mensaje_importante = 'Carga para todos los Usuarios Empresa: Habilitado' ;
					this.clase_importante = 'alert alert-success';
//					console.log('Atencion 1');
					return true;					
				}	
					
				var retornar = true;
				this.mensaje_importante = '';
				this.clase_importante = 'alert alert-primary';

				var hoy = new Date(); //DIA DE HOY
				var manana = new Date();
				manana.setDate(hoy.getDate() + 1) ; //MANANA
				var ayer = new Date();
				ayer.setDate(hoy.getDate() - 1) ; //MANANA

				hoy_dia = hoy.getDate()	;
				hoy_mes = hoy.getMonth() ;
				hoy_anio = hoy.getFullYear();

				var dd_final = Number(this.mi_info.dia_cierre) - Number(this.mi_info.dia_bloqueo) + 1;
				var dd_inicio = Number(this.mi_info.dia_inicio) + Number(this.mi_info.dia_bloqueo) -1;


if (hoy_mes ==0) {
				cierre_mes_anterior = '12/' + dd_final + '/' + Number(hoy_anio-1);
} else {
				cierre_mes_anterior = hoy_mes + '/' + dd_final + '/' + hoy_anio;
}

				cierre_mes_anterior = new Date(cierre_mes_anterior); //CIERRE MES ANTERIOR

				inicio_mes_actual = Number(hoy_mes+1) + '/' + dd_inicio + '/' + hoy_anio;
				inicio_mes_actual = new Date(inicio_mes_actual); //INICIO MES ACTUAL

				cierre_mes_actual = Number(hoy_mes+1) + '/' + dd_final + '/' + hoy_anio;
				cierre_mes_actual = new Date(cierre_mes_actual); //CIERRE MES ACTUAL


//console.log('hoy:'+hoy);
//console.log('manana:'+manana);
//console.log('ayer:'+ayer);

//console.log('inicio_mes_actual:'+inicio_mes_actual);
//console.log('cierre_mes_anterior:'+cierre_mes_anterior);
//console.log('cierre_mes_actual:'+cierre_mes_actual);


// DIA MAYOR A CIERRE DE MES ACTUAL - AUN NO TERMINA MES

				if ( manana > cierre_mes_actual) {

				if ((this.mi_info.fecha_excel ==null || this.mi_info.fecha_excel =='No creado')) {
					this.mensaje_importante = 'No se ha cargado su Listado Excel de Usuarios Iniciales! - Por favor siga las indicaciones y realicelo aqui inmediatamente..' ;
					this.clase_importante = 'alert alert-danger';
//					console.log('Atencion 3');
					return true;					
				}

				var res = (this.mi_info.fecha_excel).split("/");
				dia_excel = res[1] + '/' + res[0] + '/' + res[2];
				dia_excel = new Date(dia_excel); //FECHA SUBIDA DEL ULTIMO EXCEL

//console.log('Atencion 3 - dia_excel:'+dia_excel);

				if ( dia_excel.setDate(dia_excel.getDate() + 1) > cierre_mes_actual ) {
					this.mensaje_importante = 'Su listado de Excel de Usuarios esta Actualizado! (fecha:'+this.mi_info.fecha_excel+')' ;
					this.clase_importante = 'alert alert-success';	
//					console.log('Atencion 4');					
					return true;					
					} else {
					this.mensaje_importante = 'Ultima actualizacion de Listado de excel:'+this.mi_info.fecha_excel+' - Por favor actualice su listado de Excel de Usuarios antes del dia '+(Number(this.mi_info.dia_inicio))+' para evitar el bloqueo de su servicio' ;
					this.clase_importante = 'alert alert-warning';
					console.log('Atencion 5');					
					return true;					
					} 

			} 

//DIA YA PASO INICIO DE MES. ENTONCES MAYOR QUE CIERRE ANTERIOR PERO MENOS AL INICIO ACTUAL

				if (manana > cierre_mes_anterior && ayer < inicio_mes_actual) {

				if ((this.mi_info.fecha_excel ==null || this.mi_info.fecha_excel =='No creado')) {
					this.mensaje_importante = 'No se ha cargado su Listado Excel de Usuarios Iniciales! - Por favor siga las indicaciones y realicelo aqui inmediatamente..' ;
					this.clase_importante = 'alert alert-danger';
//					console.log('Atencion 6');
					return true;					
				}

				var res = (this.mi_info.fecha_excel).split("/");
				dia_excel = res[1] + '/' + res[0] + '/' + res[2];
				dia_excel = new Date(dia_excel); //FECHA SUBIDA DEL ULTIMO EXCEL

//console.log('Atencion 7 - dia_excel:'+dia_excel);

				if ((dia_excel > cierre_mes_anterior)) {
					this.mensaje_importante = 'Su listado de Excel de Usuarios esta Actualizado! (fecha:'+this.mi_info.fecha_excel+')' ;
					this.clase_importante = 'alert alert-success';	
//					console.log('Atencion 7');					
					return true;					
					} else {
					this.mensaje_importante = 'Ultima actualizacion de Listado de excel:'+this.mi_info.fecha_excel+' - Por favor actualice su listado de Excel de Usuarios antes del dia '+(Number(this.mi_info.dia_inicio))+' para evitar el bloqueo de su servicio' ;
					this.clase_importante = 'alert alert-warning';
//					console.log('Atencion 8');					
					return true;					
					} 

			} 


//CUANDO YA ESTOY EN EL MES ACTIVO

				if (hoy > inicio_mes_actual) {

				if ((this.mi_info.fecha_excel ==null || this.mi_info.fecha_excel =='No creado')) {
					this.mensaje_importante = 'No se ha cargado su Listado Excel de Usuarios Iniciales! - Por favor comuniquese con el proveedor de Servicios FLEXIROLL para su carga inicial, o espere a Fin de mes para realizar la carga aqui..' ;
					this.clase_importante = 'alert alert-danger';
//					console.log('Atencion 9');
					retornar = false;					
				}	

				var res = (this.mi_info.fecha_excel).split("/");
				dia_excel = res[1] + '/' + res[0] + '/' + res[2];
				dia_excel = new Date(dia_excel); //FECHA SUBIDA DEL ULTIMO EXCEL

//console.log('Atencion 10 - dia_excel:'+dia_excel);

				if (dia_excel > cierre_mes_anterior) {
					this.mensaje_importante = 'Su listado de Excel de Usuarios esta Actualizado y Activo! (ultima actualizacion:'+this.mi_info.fecha_excel+') - Espere al fin del ciclo mensual para descargar su reporte y Actualizar su Excel de Usuarios' ;
					this.clase_importante = 'alert alert-primary';
//					console.log('Atencion 11');					
					retornar = true;					
					} 
					else {
					this.mensaje_importante = 'No se ha cargado su Listado Excel Actualizado de Usuarios! (ultima actualizacion:'+this.mi_info.fecha_excel+') - Sus Usuarios han sido bloqueados. Por favor comuniquese con el proveedor de Servicios FLEXIROLL, o espere a Fin de mes para realizar la carga aqui..' ;
					this.clase_importante = 'alert alert-danger';
//					console.log('Atencion 12');					
					retornar = false;					
	
					}

			}

			return retornar	;	
			},



				habilitado_switch:function(){

				var retornar = false;

				var dia = new Date();
				var dd = Number(String(dia.getDate()).padStart(2, '0'));

				var dd_final = Number(this.mi_info.dia_cierre) - Number(this.mi_info.dia_bloqueo) ;
				var dd_inicio = Number(this.mi_info.dia_inicio) + Number(this.mi_info.dia_bloqueo) ;

				if (dd > dd_final || dd < dd_inicio){
						retornar = true;
						}
								
				return retornar	;	
				},


			filteredRows() { //funcion que filtrara la tabla se usuarios

			var por_filtrarse = this.solicitudes_info_set;

			    searchTerm = this.filter.toLowerCase(); //del input de filtrado

			  	var por_filtrarse =  por_filtrarse.filter(function(empresita, i) 
			  		{ 
			  		return (
					  			(
						  		//	empresita["post_content"].toLowerCase().includes(searchTerm) || 
									empresita["post_author"]==searchTerm
								 )
				  			);
			  		 }) ; 

			  	return por_filtrarse;
				  },

				detalle_solicitud(){
				  var str = this.edited_item.post_content;
				  var res = str.split("<br>");
				return res;
				},

			    axiosParams_restapi_recuperarsolicitudes() { //solicitar requerimientos de pago por Axios al restApi
			        const params = new URLSearchParams();

			        params.append('tipo', 'solicitud');
			        params.append('post_author', usuario_actual);
			        params.append('tag', 'pendiente');
			        params.append('por_fecha', 'si');
			        params.append('superadmin', 'si');

			        return params;
    			},

    axiosParams_restapi_recuperarusuarios() { //variable que controla que se envia en por Axios al restApi
        const params = new URLSearchParams();

        params.append('role', 'usuario');
        params.append('orderby', 'ID');
        params.append('order', 'asc');
        params.append('empresa', usuario_actual);

        return params;
    			}, 			

			},

	created:function(){

//		this.mi_info=[]; //variable que se usara en la tabla de usuarios
//		this.mi_empresa_info=[]; //variable que se usara en la tabla de usuarios

		estado=''

		this.retrieve_all() //traer mi info
		this.retrieve_all_solicitudes() //traer solicitudes


	},


	methods:{

			formatea_fecha_de_date(today){

					var dd = String(today.getDate()).padStart(2, '0');
					var mm = String(today.getMonth() + 1).padStart(2, '0'); //January is 0!
					var yyyy = today.getFullYear();

					today = mm + '/' + dd + '/' + yyyy;

					return today;
			},

			formatea_fecha_de_string(today){

				var arr = today.split("/");
				var months = [ "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
				    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre" ];
				var month_index =  parseInt(arr[1],10) - 1;

				return months[month_index]+' '+arr[2];

			},

		      countDownChanged(dismissCountDown) { //maneja el tiempo del autoapagado del alert
		        this.dismissCountDown = dismissCountDown
		      },

		      showAlert() { //llama al mensaje de alert
		        this.dismissCountDown = this.dismissSecs
		      },

			resetOptions: function () {
			    this.filter_total='';
	//		    this.status_habilitacion='';
			  },


			start_resumen:function(element){ //el modal de edicion, habilita el boton de grabado y carga los valores
					this.filter = element;
//					console.log(element);
				},


			retrieve_mis_usuarios:function(){ //carga listado de usuarios

					var self = this

				//console.log(this.axiosParams_restapi_recuperarusuarios);

		          self.loading = true //carga del spinner

					axios.get(site_url + '/wp-json/flexirol/v1/listado/2', {
					params: this.axiosParams_restapi_recuperarusuarios	
					})
					
					.then(response => { //cuando resulta success

						self.usuarios_info_set = response.data
						console.log(self.usuarios_info_set)
						//console.log(self.usuarios_info_set.length)
							})

					.catch(error => { //cuando es error
			//			console.log(error);
						})

					.finally(() => (
						self.loading = false) //apagar el spinner
						) // cuando termina el request

					},

			retrieve_all:function(){ //carga info personal

					var self = this

			        self.loading = true //carga del spinner

			        const parametros = new URLSearchParams();
			        parametros.append('ID', usuario_actual);

					axios.get(site_url + '/wp-json/flexirol/v1/info/2', { //buscar info del usuario
					params: parametros	
					})
					
					.then(response => { //cuando resulta success

						self.mi_info = response.data;
						console.log(response.data);

		if (this.mi_info.flexirol3 =='2') {

			this.retrieve_mis_usuarios(); //traer solicitudes
		}


							})

					.catch(error => { //cuando es error

						})

					.finally(() => (
						self.loading = false) //apagar el spinner
						) // cuando termina el request

					},
								

			retrieve_all_solicitudes:function(){ //carga listado de solicitudes realizadas

					var self = this

		//            self.loading = true //carga del spinner

			        const parametros = new URLSearchParams();
			        parametros.append('orderby', 'date');
			        parametros.append('order', 'desc');
			        parametros.append('empresa', usuario_actual);
			        parametros.append('tipo', 'solicitud');

					axios.get(site_url + '/wp-json/flexirol/v1/mensual/2', {
					params: parametros

					})
					
					.then(response => { //cuando resulta success

						if(response.data.length < 1 || response.data == undefined){
						    //empty
						} else {
						self.solicitudes_info_set = response.data;
						console.log(self.solicitudes_info_set);
						}

							})

					.catch(error => { //cuando es error
						console.log(error);
						})

					.finally(function() { // cuando termina el request

						self.loading = false; 

						if(self.solicitudes_info_set.length < 1 || self.solicitudes_info_set == undefined){
						    //empty
						} else {
						self.mes_calculado = self.formatea_fecha_de_string(self.solicitudes_info_set[0].post_date);
						}

						})

					},	

			startexport:function(){ //carga listado de solicitudes realizadas

					var self = this

		  //          self.loading = true //carga del spinner


//						console.log(self.solicitudes_info_set);

				        const parametros = new URLSearchParams();
				        parametros.append('usuario_actual', usuario_actual);
				        parametros.append('rol_actual', rol_actual);	
				        parametros.append('pagar', 'si');			        

				        parametros.append('informacion', JSON.stringify(self.solicitudes_info_set));

						axios.get(site_url + '/wp-json/flexirol/v1/pagos/2', {
						params: parametros	
						})
					
					.then(response => { //cuando resulta success

			//			self.solicitudes_info_set = response.data;

//console.log(response.data);


var link = document.createElement('a');
link.target = '_blank';
link.href = response.data;

                link.href = '../wp-content/uploads/reportes/' + response.data;

                link.download = response.data;

link.dispatchEvent(new MouseEvent('click'));


							})

					.catch(error => { //cuando es error
			//			console.log(error);
						})

					.finally(() => (
						self.loading = false) //apagar el spinner
						) // cuando termina el request

					},						

			}
		})




