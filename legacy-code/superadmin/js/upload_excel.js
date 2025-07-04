
var j = jQuery.noConflict();


var app = new Vue({
  el: '#excel_usuarios_admin',

	data:{

		usuario_actual:usuario_actual,
		mi_empresa_madre:mi_empresa_madre,
		rol_actual:rol_actual ,
		envio_usuario:"",

		empresa_info_set:null,
		selected:null,

		mi_info:[],

		loading: false, //controla spinner de cargado de pagina
		mensaje_importante: '',
		clase_importante: 'alert alert-primary',

        dismissSecs: 3, //tiempo del alert
        dismissCountDown: 0 ,
		alertvariant:"success", //clase - color del alert
		mensaje_alerta:"", //mensaje del alert  inicial

			},	

	computed:{


			habilitado_switch:function(){

				if (this.rol_actual =='superadmin') {
					this.mensaje_importante = 'Carga para todos los Usuarios Empresa: Habilitado' ;
					this.clase_importante = 'alert alert-success';
					console.log('Atencion 1');
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


console.log('hoy:'+hoy);
console.log('manana:'+manana);
console.log('ayer:'+ayer);

console.log('inicio_mes_actual:'+inicio_mes_actual);
console.log('cierre_mes_anterior:'+cierre_mes_anterior);
console.log('cierre_mes_actual:'+cierre_mes_actual);


// DIA MAYOR A CIERRE DE MES ACTUAL - AUN NO TERMINA MES

				if ( manana > cierre_mes_actual) {

				if ((this.mi_info.fecha_excel ==null || this.mi_info.fecha_excel =='No creado')) {
					this.mensaje_importante = 'No se ha cargado su Listado Excel de Usuarios Iniciales! - Por favor siga las indicaciones y realicelo aqui inmediatamente..' ;
					this.clase_importante = 'alert alert-danger';
					console.log('Atencion 3');
					return true;					
				}

				var res = (this.mi_info.fecha_excel).split("/");
				dia_excel = res[1] + '/' + res[0] + '/' + res[2];
				dia_excel = new Date(dia_excel); //FECHA SUBIDA DEL ULTIMO EXCEL

console.log('Atencion 3 - dia_excel:'+dia_excel);

				if ( dia_excel.setDate(dia_excel.getDate() + 1) > cierre_mes_actual ) {
					this.mensaje_importante = 'Su listado de Excel de Usuarios esta Actualizado! (fecha:'+this.mi_info.fecha_excel+')' ;
					this.clase_importante = 'alert alert-success';	
					console.log('Atencion 4');					
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
					console.log('Atencion 6');
					return true;					
				}

				var res = (this.mi_info.fecha_excel).split("/");
				dia_excel = res[1] + '/' + res[0] + '/' + res[2];
				dia_excel = new Date(dia_excel); //FECHA SUBIDA DEL ULTIMO EXCEL

console.log('Atencion 7 - dia_excel:'+dia_excel);

				if ((dia_excel > cierre_mes_anterior)) {
					this.mensaje_importante = 'Su listado de Excel de Usuarios esta Actualizado! (fecha:'+this.mi_info.fecha_excel+')' ;
					this.clase_importante = 'alert alert-success';	
					console.log('Atencion 7');					
					return true;					
					} else {
					this.mensaje_importante = 'Ultima actualizacion de Listado de excel:'+this.mi_info.fecha_excel+' - Por favor actualice su listado de Excel de Usuarios antes del dia '+(Number(this.mi_info.dia_inicio))+' para evitar el bloqueo de su servicio' ;
					this.clase_importante = 'alert alert-warning';
					console.log('Atencion 8');					
					return true;					
					} 

			} 


//CUANDO YA ESTOY EN EL MES ACTIVO

				if (hoy > inicio_mes_actual) {

				if ((this.mi_info.fecha_excel ==null || this.mi_info.fecha_excel =='No creado')) {
					this.mensaje_importante = 'No se ha cargado su Listado Excel de Usuarios Iniciales! - Por favor comuniquese con el proveedor de Servicios FLEXIROLL para su carga inicial, o espere a Fin de mes para realizar la carga aqui..' ;
					this.clase_importante = 'alert alert-danger';
					console.log('Atencion 9');
					retornar = false;					
				}	

				var res = (this.mi_info.fecha_excel).split("/");
				dia_excel = res[1] + '/' + res[0] + '/' + res[2];
				dia_excel = new Date(dia_excel); //FECHA SUBIDA DEL ULTIMO EXCEL

console.log('Atencion 10 - dia_excel:'+dia_excel);

				if (dia_excel > cierre_mes_anterior) {
					this.mensaje_importante = 'Su listado de Excel de Usuarios esta Actualizado y Activo! (ultima actualizacion:'+this.mi_info.fecha_excel+') - Espere al fin del ciclo mensual para descargar su reporte y Actualizar su Excel de Usuarios' ;
					this.clase_importante = 'alert alert-primary';
					console.log('Atencion 11');					
					retornar = false;					
					} 
					else {
					this.mensaje_importante = 'No se ha cargado su Listado Excel Actualizado de Usuarios! (ultima actualizacion:'+this.mi_info.fecha_excel+') - Sus Usuarios han sido bloqueados. Por favor comuniquese con el proveedor de Servicios FLEXIROLL, o espere a Fin de mes para realizar la carga aqui..' ;
					this.clase_importante = 'alert alert-danger';
					console.log('Atencion 12');					
					retornar = false;					
	
					}

			}

			return retornar	;	
			},


    axiosParams_restapi_recuperarusuarios() { //variable que controla que se envia en por Axios al restApi
        const params = new URLSearchParams();
        params.append('role', 'empresa');
        params.append('orderby', 'ID');
        params.append('order', 'asc');
        params.append('empresa', usuario_actual);

        return params;
    			},    			

			},			

	created:function(){

		this.retrieve_all()
		this.retrieve_all_mi_info()
	},

	methods:{

		      countDownChanged(dismissCountDown) { //maneja el tiempo del autoapagado del alert
		        this.dismissCountDown = dismissCountDown
		      },

		      showAlert() { //llama al mensaje de alert
		        this.dismissCountDown = this.dismissSecs
		      },


			startexport:function(usuario_actual_excel,rol_actual_excel){ //carga listado de solicitudes realizadas

					var self = this

console.log(usuario_actual_excel)
console.log(rol_actual_excel)

		//           self.loading = true //carga del spinner

				        const parametros = new URLSearchParams();
				        parametros.append('usuario_actual', usuario_actual_excel);
				        parametros.append('rol_actual', rol_actual_excel);	

						axios.get(site_url + '/wp-json/flexirol/v1/listadorapido/2', {
						params: parametros	
						})
					
					.then(response => { //cuando resulta success

					console.log(response.data);


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


				retrieve_all:function(){ //carga listado de usuarios

					var self = this
		//			console.log(usuario_actual);

		          self.loading = true //carga del spinner

					axios.get(site_url + '/wp-json/flexirol/v1/listado/2', {
					params: this.axiosParams_restapi_recuperarusuarios	
					})
					
					.then(response => { //cuando resulta success

						self.empresa_info_set = response.data
		//				console.log(self.empresa_info_set)
						//console.log(self.empresa_info_set.length)
							})

					.catch(error => { //cuando es error
		//				console.log(error);
						})

					.finally(() => (
						self.loading = false) //apagar el spinner
						) // cuando termina el request

					},


			retrieve_all_mi_info:function(){ //carga info personal

					var self = this

			        self.loading = true //carga del spinner

			        const parametros = new URLSearchParams();
			        parametros.append('ID', usuario_actual);

					axios.get(site_url + '/wp-json/flexirol/v1/info/2', { //buscar info del usuario
					params: parametros	
					})
					
					.then(response => { //cuando resulta success

						self.mi_info = response.data;
console.log(self.mi_info);
							})

					.catch(error => { //cuando es error

						})

					.finally(() => (
						self.loading = false) //apagar el spinner
						) // cuando termina el request

					},


			}
		})