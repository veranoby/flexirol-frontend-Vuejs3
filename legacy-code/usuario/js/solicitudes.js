
var j = jQuery.noConflict();


var app = new Vue({
  el: '#solicitudes_usuarios',

	data:{

		usuario_actual:usuario_actual,
		mi_empresa_madre:mi_empresa_madre,
		monto: [],

		rol_actual:rol_actual ,
		mensaje_importante: '',
		clase_importante: 'alert alert-primary',


		new_item:{post_author:'',ID:'',post_name:'' ,post_date:'' , post_modified:'', post_excerpt:'' , post_title:'',post_content:'',gearbox:'',user_email:'',}, //valor inicial de crear nuevo usuario
		edited_item:{post_author:'',ID:'',post_name:'' ,post_date:'' , post_modified:'', post_excerpt:'' , post_title:'',post_content:'',gearbox:'',user_email:'',},//valor inicial del modal de edicion
		editedbanco_item:{post_author:'',ID:'',post_name:'' ,post_date:'' , post_modified:'', post_excerpt:'' , post_title:'',post_content:'',gearbox:'',user_email:'',},//valor inicial del modal de edicion
		delete_item:{first_name:'',last_name:'',user_email:'' ,user_login:'', cedula:'',},//valor inicial del modal de borrado


		mi_info:{post_author:'',ID:'',post_name:'' ,post_date:'' , post_modified:'', post_excerpt:'' , post_title:'',post_content:'',gearbox:'',user_email:'',}, //valor inicial de crear nuevo usuario
		mi_empresa_info:{post_author:'',ID:'',post_name:'' ,post_date:'' , post_modified:'', post_excerpt:'' , post_title:'',post_content:'',gearbox:'',user_email:'',}, //valor inicial de crear nuevo usuario


		//element_banco:null, //variable que se usara en la tabla de usuarios
		bancos_info_set:[], //variable que se usara en la tabla de usuarios
		solicitudes_info_set:[], //variable que se usara en la tabla de usuarios

		err_msg:'Disculpe, no hay elementos en los records.',
		mensaje_bloqueo : 'El Usuario esta Bloqueado',		

		loading: false, //controla spinner de cargado de pagina
        dismissSecs: 3, //tiempo del alert
        dismissCountDown: 0 ,
		alertvariant:"success", //clase - color del alert
		mensaje_alerta:"", //mensaje del alert  inicial

			},

	computed:{

			    axiosParams_restapi_recuperarbancos() { //variable que controla que se envia en por Axios al restApi
			        const params = new URLSearchParams();

			        params.append('tipo', 'cuenta');
			        params.append('post_author', usuario_actual);
			        params.append('tag', estado);

			        return params;
    			},

				detalle_solicitud(){

				  var str = this.edited_item.post_content;
				  var res = str.split("<br>");
				return res;
				},

			    axiosParams_restapi_recuperarsolicitudes() { //variable que controla que se envia en por Axios al restApi
			        const params = new URLSearchParams();

			        params.append('tipo', 'solicitud');
			        params.append('post_author', usuario_actual);
			        params.append('tag', estado);
			        params.append('por_fecha', 'si');

			        return params;
    			},

				habilitado_switch:function(){

					var retornar = true; 

				if ((this.mi_empresa_info.fecha_excel ==null || this.mi_empresa_info.fecha_excel =='No creado')) {
					this.mensaje_bloqueo = 'Usuario Bloqueado! Su Empresa no ha cargado sus Datos actualizados de Anticipos - Por favor comuniquese su empresa para normalizar su estado..' ;
					this.clase_importante = 'alert alert-danger';
					// console.log('Atencion 9');
					return false;					
				}	

					if(this.mi_empresa_info.gearbox=='true' && this.mi_info.gearbox=='true'){
						this.mensaje_bloqueo = 'Usuario Activo y Habilitado para Anticipos..' ; 
						this.clase_importante = 'alert alert-success';						
					retornar = true;				
					} else {
						this.mensaje_bloqueo = 'Usuario Bloqueado por Admin! Por favor comuniquese su empresa para normalizar su estado..' ; 
						this.clase_importante = 'alert alert-danger';	
					retornar = false;																					
					}


				if (this.solicitudes_info_set.length >= Number(this.mi_empresa_info.frecuencia)){
						this.mensaje_bloqueo = 'El Usuario ha alcanzado el limite de solicitudes (solicitudes permitidas:' + this.mi_empresa_info.frecuencia + ')' ; 
					return false;					
									}

					var dia = new Date();
					var dd = Number(String(dia.getDate()).padStart(2, '0'));

					var dd_final = Number(this.mi_empresa_info.dia_cierre) - Number(this.mi_empresa_info.dia_bloqueo) ;
					var dd_inicio = Number(this.mi_empresa_info.dia_inicio) + Number(this.mi_empresa_info.dia_bloqueo) ;

					var dia_reinicio = 0;

					for (i = 0; i < this.solicitudes_info_set.length; i++) {
						var str = this.solicitudes_info_set[i].post_date;
						var res = str.split("/");

						if ( (Number(res[0]) + Number(this.mi_empresa_info.dia_reinicio)) > dd ){
							dia_reinicio = (Number(res[0]) + Number(this.mi_empresa_info.dia_reinicio));
							this.mensaje_bloqueo = 'Solicitud en proceso. Pronto podra volver a solicitar un nuevo Anticipo..(dias pendientes: ' + ( dia_reinicio - dd ) + ')' ; 
						this.clase_importante = 'alert alert-danger';	
							retornar = false;
							}	
					} 

					if (dd > dd_final){
						this.mensaje_bloqueo = 'Ha superado el ultimo dia disponible para solicitar Anticipos (fecha limite de solicitud: ' + dd_final + ' de este mes)' ; 
						this.clase_importante = 'alert alert-danger';	
						retornar = false;
									}

					if (dd < dd_inicio){
						this.mensaje_bloqueo = 'Aun no esta disponible el servicio de solicitudes de Anticipos (fecha de inicio: ' + dd_inicio + ' de este mes)' ; 
						this.clase_importante = 'alert alert-danger';	
						retornar = false;
									}



				var hoy = new Date(); //DIA DE HOY
				var manana = new Date();
				manana.setDate(hoy.getDate() + 1) ; //MANANA
				var ayer = new Date();
				ayer.setDate(hoy.getDate() - 1) ; //MANANA

				hoy_dia = hoy.getDate()	;
				hoy_mes = hoy.getMonth() ;
				hoy_anio = hoy.getFullYear();

				cierre_mes_anterior = hoy_mes + '/' + dd_final + '/' + hoy_anio;
				cierre_mes_anterior = new Date(cierre_mes_anterior); //CIERRE MES ANTERIOR

// console.log('hoy:'+hoy);
// console.log('manana:'+manana);
// console.log('ayer:'+ayer);

// console.log('cierre_mes_anterior:'+cierre_mes_anterior);

				var res = (this.mi_empresa_info.fecha_excel).split("/");
				dia_excel = res[1] + '/' + res[0] + '/' + res[2];
				dia_excel = new Date(dia_excel); //FECHA SUBIDA DEL ULTIMO EXCEL

// console.log('dia_excel:'+dia_excel);

				if (dia_excel < cierre_mes_anterior) {

					this.mensaje_bloqueo = 'Su Empresa no ha cargado sus Datos actualizados de Anticipos! (ultima actualizacion:'+this.mi_empresa_info.fecha_excel+') - Ha sido bloqueado. Por favor comuniquese su empresa para normalizar su estado..' ;

					this.clase_importante = 'alert alert-danger';

					// console.log('Atencion 12');					

					retornar = false;					

					}


					return retornar	;	
								},


				disponible_aun:function(){
					var solicitudes_previas = 0;
					var dia = new Date();
					var dd = Number(String(dia.getDate()).padStart(2, '0'));
					var dd_final = Number(this.mi_empresa_info.dia_cierre) - Number(this.mi_empresa_info.dia_bloqueo) ;

					var valor_diario = ((Number(this.mi_info.disponible)*Number(this.mi_empresa_info.porcentaje)/100)/dd_final).toFixed(2) ;

					for (i = 0; i < this.solicitudes_info_set.length; i++) {
					solicitudes_previas = Number(this.solicitudes_info_set[i].post_excerpt) + Number(this.solicitudes_info_set[i].gearbox) + Number(solicitudes_previas);
					} 

					const params = (valor_diario * dd) - solicitudes_previas ;
					
					return params.toFixed(2);
				}, 


				fecha_hoy:function(){
					return this.formatea_fecha(new Date());
				},


				btn_switch:function(){


//seleccion de plan para calculos del servicio

					if (this.mi_info.flexirol3 == "2") {

					el_tax = 0 ;
					el_iva = 0 ;

					} else {

					el_tax = Number(this.mi_empresa_info.flexirol)/100 ;
					el_iva = 12/100 ;

					}

//ahora si, calculos del servicio

					if (Number(this.monto.value)*(1 + el_tax) > Number(this.disponible_aun)) {

						this.monto.value = (Number(this.disponible_aun) / (1 + el_tax)).toFixed(2) ;
					} 


					if(this.monto.value>0 && this.monto.selected){
						this.monto.tax = (Number(this.monto.value) * el_tax).toFixed(2)  ;
						this.monto.total = (Number(this.monto.value) + Number(this.monto.tax)).toFixed(2)  ;
						return false
					}else{
						return true
					}


				},

				save_switch:function(){
					if(this.edited_item.post_content.length>=1&&this.edited_item.post_excerpt.length>=1&&this.edited_item.post_content.length>=1&&this.edited_item.user_email.length>=1&&this.edited_item.post_name.length>=1){
						return false
					}else{
						return true
					}
				},


	prueba_email:function(){


searchTerm = this.monto.selected; //del input de filtrado

por_filtrarse = this.bancos_info_set;

			  	 por_filtrarse =  por_filtrarse.filter(function(listado, i) 
			  		{ 
			  		return (
					  			(
						  			listado["ID"].toString().includes(searchTerm) 
								 )
				  			);
			  		 }) ; 


if (typeof por_filtrarse[0] === 'undefined') {

return "";

} else {

//this.monto.user_email = por_filtrarse[0].post_banco + ' - Cuenta ' + por_filtrarse[0].gearbox + ': ' + por_filtrarse[0].numero_cuenta  + '<br>Nombre: ' + por_filtrarse[0].post_excerpt + ' - Cedula: ' + por_filtrarse[0].post_content + ' - ' + por_filtrarse[0].user_email;

// console.log(por_filtrarse[0]);
// console.log(this.monto.selected);
//// console.log(this.monto.user_email);

return por_filtrarse[0];

}


	},


			},


	created:function(){

//		this.mi_info=[]; //variable que se usara en la tabla de usuarios
//		this.mi_empresa_info=[]; //variable que se usara en la tabla de usuarios

		estado=''

		this.retrieve_all()
		this.retrieve_all_enterprise()
		this.retrieve_all_bank()
		this.retrieve_all_solicitudes()
	},


	methods:{


		      bloqueo(fecha_obtenida) { //maneja el tiempo del autoapagado del alert de fecha de modificacion de las cuentas

				chequeo = true;

console.log('prueba fechas');
console.log(this.bancos_info_set.length) ;

				res = fecha_obtenida.split("/");
				fecha_corredida = res[1] + '/' + res[0] + '/' + res[2];
				fecha_actual = new Date();	
				fecha_corredida = new Date(fecha_corredida) ;
					        
				if ((fecha_actual - fecha_corredida)>86400000) { //chequeo de si paso 1 dia - en milisegundos
					chequeo = false;
				}

console.log(chequeo) ;

				return chequeo;
		      },


			formatea_fecha(today){

					var dd = String(today.getDate()).padStart(2, '0');
					var mm = String(today.getMonth() + 1).padStart(2, '0'); //January is 0!
					var yyyy = today.getFullYear();

					today = mm + '/' + dd + '/' + yyyy;

					return today;
			},

	      select_cuenta_bancaria(event) { //maneja el copiar datos de la cuenta

/*			const parametros = event.target.selectedIndex

	        this.monto.user_email = this.bancos_info_set[parametros].post_banco + ' - Cuenta ' + this.bancos_info_set[parametros].gearbox + ': ' + this.bancos_info_set[parametros].numero_cuenta  + '<br>Nombre: ' + this.bancos_info_set[parametros].post_excerpt + ' - Cedula: ' + this.bancos_info_set[parametros].post_content + ' - ' + this.bancos_info_set[parametros].user_email
	*/

	 	        this.monto.user_email = this.prueba_email
    			// console.log(this.monto.user_email)

	      },

	      countDownChanged(dismissCountDown) { //maneja el tiempo del autoapagado del alert
	        this.dismissCountDown = dismissCountDown
	      },

	      showAlert() { //llama al mensaje de alert
	        this.dismissCountDown = this.dismissSecs
	      },

			reset_monto:function(element){ //el modal de edicion, habilita el boton de grabado y carga los valores
				this.monto.value=0; 
				this.monto.selected=0;
			}, 

			start_edit:function(element){ //el modal de edicion, habilita el boton de grabado y carga los valores
					this.edited_item = element
				},

			start_edit_banco:function(element){ //el modal de edicion, habilita el boton de grabado y carga los valores
					this.editedbanco_item = element
				},

			create_item:function(){ //carga listado de bancos

					var self = this

		          self.loading = true //carga del spinner

//carga de precalculados

	 	        var pcb = self.prueba_email ;

				self.monto.user_email = pcb.post_banco + ' - Cuenta ' + pcb.gearbox + ': ' + pcb.numero_cuenta  + '<br>Nombre: ' + pcb.post_excerpt + ' - Cedula: ' + pcb.post_content + ' - ' + pcb.user_email;
				self.monto.numero_cuenta = pcb.numero_cuenta ;
				self.monto.post_banco = pcb.post_banco + ' - Cuenta ' + pcb.gearbox ;


					const valor_total = Number(self.monto.tax) + Number(self.monto.value) ;

					const nombre = self.mi_info.first_name + ' ' + self.mi_info.last_name + ' - Cedula:' + self.mi_info.cedula + ' - Monto:$' + self.monto.value;

					const mensaje_completo = nombre + '<br>Costo del Servicio:$' + self.monto.tax + ' - Total a Descontarse de su sueldo:$' + valor_total + '<br>' + self.monto.user_email;

			        const parametros = new URLSearchParams();

			        parametros.append('post_author', self.usuario_actual); //id del usuario solicitando
			        parametros.append('post_title', nombre); //titulo para busqueda rapida en filtros admin
			        parametros.append('post_excerpt', self.monto.value); //monto solicitado
			        parametros.append('gearbox', self.monto.tax); //tax agregado				        	        
			        parametros.append('post_content', mensaje_completo); //TODOS los datos de la solicxitud transferencia cuenta bancaria seleccionada

			        parametros.append('user_email', self.monto.selected); //ID cuenta bancaria seleccionada *
			        parametros.append('numero_cuenta', self.monto.numero_cuenta); //ID cuenta bancaria seleccionada *
			        parametros.append('post_banco', self.monto.post_banco); //ID cuenta bancaria seleccionada *

			        parametros.append('post_type', 'solicitud'); //tipo de post
			        parametros.append('tag', 'pendiente');			        
			        parametros.append('empresa', self.mi_empresa_madre);	//ID mi empresa		        

					axios.get(site_url + '/wp-json/flexirol/v1/grabar/2', {
					params: parametros	
					})
					
					.then(response => { //cuando resulta success

						// console.log("id resultado");
						// console.log(response.data);

			              	self.retrieve_all();
			              	self.retrieve_all_solicitudes();
			              	self.monto = [];

							})

					.catch(error => { //cuando es error
			//			// console.log(error);
						})

					.finally(() => (
						self.loading = false) //apagar el spinner
						) // cuando termina el request

					},

			activar_suscripcion:function(){ //llamado a activar mi susbripcion mensual fija

					var self = this

			        self.loading = true //carga del spinner

			        const parametros = new URLSearchParams();
			        parametros.append('ID', usuario_actual);
			        parametros.append('status', 'on');			        

					axios.get(site_url + '/wp-json/flexirol/v1/suscripcion/2', { //buscar info del usuario
					params: parametros	
					})
					
					.then(response => { //cuando resulta success

			           //   	self.retrieve_all(); //recargar mi inbfo personal

   						// console.log(self.mi_info);

							})

					.catch(error => { //cuando es error

						})

					.finally(() => {
						self.loading = false ;

			                self.mensaje_alerta = 'Accion realizada con exito';

			                self.showAlert() ;//llama al mensaje de alert

						} //apagar el spinner
						) // cuando termina el request

					},


			cancelar_suscripcion:function(){ //llamado a activar mi susbripcion mensual fija

					var self = this

			        self.loading = true //carga del spinner

			        const parametros = new URLSearchParams();
			        parametros.append('ID', usuario_actual);
			        parametros.append('status', 'off');			        

					axios.get(site_url + '/wp-json/flexirol/v1/suscripcion/2', { //buscar info del usuario
					params: parametros	
					})
					
					.then(response => { //cuando resulta success

			             // 	self.retrieve_all(); //recargar mi inbfo personal

   						// console.log(self.mi_info);

							})

					.catch(error => { //cuando es error

						})

					.finally(() => {
						self.loading = false;

			                self.mensaje_alerta = 'Accion realizada con exito';

			                self.showAlert(); //llama al mensaje de alert
							} //apagar el spinner
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

						self.mi_info = response.data
						 console.log(self.mi_info);

							})

					.catch(error => { //cuando es error

						})

					.finally(() => (
						self.loading = false) //apagar el spinner
						) // cuando termina el request

					},

			retrieve_all_enterprise:function(){ //carga listado de empresa/jefes

					var self = this

		            self.loading = true //carga del spinner

			        const parametros = new URLSearchParams();

			        parametros.append('ID', mi_empresa_madre);

					axios.get(site_url + '/wp-json/flexirol/v1/info/2', { //buscar info del usuario
					params: parametros	
					})
					
					.then(response => { //cuando resulta success

						self.mi_empresa_info = response.data

							})

					.catch(error => { //cuando es error

						})

					.finally(() => (
						self.loading = false) //apagar el spinner
						) // cuando termina el request

					},	

			retrieve_all_bank:function(){ //carga listado de bancos

					var self = this

		            self.loading = true //carga del spinner

					axios.get(site_url + '/wp-json/flexirol/v1/banco/2', {
					params: this.axiosParams_restapi_recuperarbancos	
					})
					
					.then(response => { //cuando resulta success

						self.bancos_info_set = response.data

							})

					.catch(error => { //cuando es error
			//			// console.log(error);
						})

					.finally(() => (
						self.loading = false) //apagar el spinner
						) // cuando termina el request

					},									

			retrieve_all_solicitudes:function(){ //carga listado de solicitudes realizadas

					var self = this

		            self.loading = true //carga del spinner

					axios.get(site_url + '/wp-json/flexirol/v1/banco/2', {
					params: this.axiosParams_restapi_recuperarsolicitudes	
					})
					
					.then(response => { //cuando resulta success

						self.solicitudes_info_set = response.data;

							})

					.catch(error => { //cuando es error
			//			// console.log(error);
						})

					.finally(() => (
						self.loading = false) //apagar el spinner
						) // cuando termina el request

					},	

			proceed_delete:function(empresa_id){ //carga listado de bancos

					var self = this

		          self.loading = true //carga del spinner

			        const parametros = new URLSearchParams();

			        parametros.append('ID_post', empresa_id);


					axios.get(site_url + '/wp-json/flexirol/v1/borrar/2', {
					params: parametros	
					})
					
					.then(response => { //cuando resulta success

			              	self.retrieve_all(); //recargar mi inbfo personal

							})

					.catch(error => { //cuando es error
			//			// console.log(error);
						})

					.finally(() => (
						self.loading = false) //apagar el spinner
						) // cuando termina el request

					},
			}
		})