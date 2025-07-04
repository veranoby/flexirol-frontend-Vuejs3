
var j = jQuery.noConflict();


var app = new Vue({
  el: '#crear_usuarios_admin',

	data:{
		filter:'', //valor inicial del filtrado
		status_deshabilitacion:'', //valor inicial del filtrado
		status_habilitacion:'', //valor inicial del filtrado

		usuario_actual:usuario_actual,
		mi_empresa_madre:mi_empresa_madre,
		rol_actual:rol_actual ,

		mensaje_tiptool:'Llene los campos obligatorios para poder grabar por favor',
		mensaje_tiptool_2:'Llene los campos obligatorios para poder grabar por favor',

		new_item:{first_name:'',last_name:'',user_email:'' ,user_login:'' , user_pass:'', role:'usuario' , gearbox:'true',cedula:'',disponible:'',empresa:usuario_actual,ciudad:'',direccion:'',nacimiento:'',gender:'',}, //valor inicial de crear nuevo usuario
		edited_item:{first_name:'',last_name:'',user_email:'' ,user_login:'' , user_pass:'', role:'usuario' , gearbox:'true',cedula:'',disponible:'',empresa:usuario_actual,ciudad:'',direccion:'',nacimiento:'',gender:'',},//valor inicial del modal de edicion
		delete_item:{first_name:'',last_name:'',user_email:'' ,user_login:'', cedula:'',},//valor inicial del modal de borrado

		usuarios_info_set:[], //variable que se usara en la tabla de usuarios
		err_msg:'Disculpe, no hay usuarios en los records.',

		mensaje_importante: '',
		clase_importante: 'alert alert-primary',
		mi_info:{post_author:'',ID:'',post_name:'' ,post_date:'' , post_modified:'', post_excerpt:'' , post_title:'',post_content:'',gearbox:'',user_email:'',}, //valor inicial de crear nuevo usuario

		loading: false, //controla spinner de cargado de pagina
        dismissSecs: 3, //tiempo del alert
        dismissCountDown: 0 ,
		alertvariant:"success", //clase - color del alert
		mensaje_alerta:"", //mensaje del alert  inicial

			},


filters: {
  capitalize: function (value) {
    if (!value) return ''
    value = value.toString()
	value=value.trim()
    return value.toUpperCase()
  }
} ,

	computed:{

			habilitado_switch_excel:function(){

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
					this.mensaje_importante = 'Su listado de Excel de Usuarios esta Actualizado y Activo! (ultima actualizacion:'+this.mi_info.fecha_excel+')' ;
					this.clase_importante = 'alert alert-primary';
					console.log('Atencion 11');					
					retornar = true;					
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


  filteredRows() { //funcion que filtrara la tabla se usuarios

var por_filtrarse = this.usuarios_info_set;

  if(this.status_habilitacion && !this.status_deshabilitacion) {

  	por_filtrarse =  por_filtrarse.filter(function(empresita, i) 
  		{ 
  		return (
		  			(
			  			empresita["gearbox"].toLowerCase().includes('true')
					 )
	  			);
  		 }) ; 
  } //del checkbox de filtrado
    
  if(this.status_deshabilitacion && !this.status_habilitacion) {

   por_filtrarse =  por_filtrarse.filter(function(empresita, i) 
  		{ 
		return (
		  			(
			  			empresita["gearbox"].toLowerCase().includes('false')
					 )
	  			);
  		 }) ; 
    } //del checkbox de filtrado

    searchTerm = this.filter.toLowerCase(); //del input de filtrado

  	console.log('entrando a filtrado');
//  	console.log(searchTerm);  	
//  	console.log(this.usuarios_info_set); //variable array/objeto a ser filtrado


  	var filtrado =  por_filtrarse.filter(function(empresita, i) 
  		{ 

  		return (
		  			(
			  			empresita["first_name"].toLowerCase().includes(searchTerm) || 
						empresita["last_name"].toLowerCase().includes(searchTerm) || 
						empresita["cedula"].toLowerCase().includes(searchTerm) || 						
						empresita["user_email"].toLowerCase().includes(searchTerm)
					 )
	  			);
  		 }) ; 

//  	console.log(filtrado);
  	return filtrado;

  },

    axiosParams_restapi_recuperarusuarios() { //variable que controla que se envia en por Axios al restApi
        const params = new URLSearchParams();

        params.append('role', 'usuario');
        params.append('orderby', 'ID');
        params.append('order', 'asc');
        params.append('empresa', usuario_actual);

        return params;
    			},

				btn_switch:function(){

re = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

btn_switch_check = re.test(this.new_item.user_email);

if (!btn_switch_check) {
        this.mensaje_tiptool='Se requiere email Valido';
      } else {
         this.mensaje_tiptool='Llene los campos obligatorios para poder grabar por favor';     	
      }

					if(this.new_item.disponible>=1&&this.new_item.first_name.length>=1&&this.new_item.last_name.length>=1&&this.new_item.cedula.length>=1&& btn_switch_check &&this.new_item.user_login.length>=1&&this.new_item.user_pass.length>=1){
							return false
						}else{
							return true
						}	

				},


				save_switch:function(){

re = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

btn_switch_check = re.test(this.edited_item.user_email);

if (!btn_switch_check) {
        this.mensaje_tiptool_2='Se requiere email Valido';
      } else {
         this.mensaje_tiptool_2='Llene los campos obligatorios para poder grabar por favor';     	
      }

						if(this.edited_item.first_name.length>=1 && btn_switch_check && this.edited_item.cedula.length>=1){
						return false
					}else{
						return true
					}
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

  			computed_username:function(){  //para crear recomendacion de user y password a partir de nombre y sucursal
			user_login = ((this.new_item.first_name)+'_'+(this.new_item.last_name)+'_'+(this.new_item.cedula))
			this.new_item.user_login = this.new_item.user_pass = (user_login.replace(/\s+/g, '_')).toUpperCase()
			},

			start_edit:function(element){ //el modal de edicion, habilita el boton de grabado y carga los valores
					this.edited_item = element
					if(this.edited_item.birth_date !== null){
						this.edited_item.birth_date = new Date(this.edited_item.birth_date);
				    }

				console.log('entrando a edicion:')
				console.log(this.edited_item)

				},

			start_delete:function(element){ //el modal de edicion, habilita el boton de grabado y carga los valores
					this.delete_item = element
				},

			save_edit:function(){ //guardar la modificacion
				var self = this

			//	console.log(self.edited_item)

		          self.loading = true //carga del spinner

			          j.ajax({
			              type:"POST",
			              url: site_url+"/wp-admin/admin-ajax.php",
			              data: {
			                  action:'crear_usuarios',
								new_item:self.edited_item
			              },
	              success:function(response){

				//	console.log(response);

			                self.mensaje_alerta = 'Accion realizada con exito';

			                self.alertvariant = "success";//mensaje del alert
			                self.showAlert(); //llama al mensaje de alert
							self.loading = false ; //apagar el spinner

			              },
	              error: function(error){
			              	self.alertvariant = "danger";
			                self.mensaje_alerta = 'Ha ocurrido un error';

				//	console.log(response)

							self.loading = false ; //apagar el spinner

			              }
			          });

				},

			create_item:function(){ //crear usuarios
					var self = this
				console.log('entrando a creacion de usuarios')
			//	console.log(self.new_item)

		          self.loading = true //carga del spinner

			          j.ajax({
			              type:"POST",
			              url: site_url+"/wp-admin/admin-ajax.php",
			              data: {
			                  action:'crear_usuarios',
								new_item:self.new_item
			              },
			              success:function(response){

				casos = JSON.parse(response);

if (casos.type =='error'){

				console.log('respuesta ajax error:');	
				console.log(casos.message);

			              	self.alertvariant = "danger";
			                self.mensaje_alerta = casos.message;
			                self.showAlert(); //llama al mensaje de alert

							self.loading = false ; //apagar el spinner

} else {

			              	self.retrieve_all(); //recargar el listado de usuarios
			                self.mensaje_alerta = 'Accion realizada con exito';

			//	console.log(response.message)

			                self.alertvariant = "success";//mensaje del alert
			                self.showAlert(); //llama al mensaje de alert

			                self.new_item = {first_name:'',last_name:'',user_email:'' ,user_login:'' , user_pass:'', role:'usuario' , gearbox:'true',cedula:'',disponible:'',empresa:usuario_actual,};
				}
			              },
			              error: function(error){
			              	self.alertvariant = "danger";
			                self.mensaje_alerta = 'Ha ocurrido un error';

							self.loading = false ; //apagar el spinner

			//	console.log(response)

			              }
			          });

					},

			retrieve_all:function(){ //carga listado de usuarios

					var self = this

				//console.log(this.axiosParams_restapi_recuperarusuarios);

		          self.loading = true //carga del spinner

					axios.get(site_url + '/wp-json/flexirol/v1/listado/2', {
					params: this.axiosParams_restapi_recuperarusuarios	
					})
					
					.then(response => { //cuando resulta success

						self.usuarios_info_set = response.data
						//console.log(self.usuarios_info_set)
						//console.log(self.usuarios_info_set.length)
							})

					.catch(error => { //cuando es error
			//			console.log(error);
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

				proceed_delete:function(empresa_id){
					// send delete connand and car id to backend PHP file
					var self = this

				//		console.log(empresa_id);

		          self.loading = true //carga del spinner

			          j.ajax({
			              type:"POST",
			              url: site_url+"/wp-admin/admin-ajax.php",
			              data: {
			                  action:'borrar_usuarios',
								ID:empresa_id
			              },
			              success:function(response){
			              	self.retrieve_all(); //recargar el listado de usuarios
			                self.mensaje_alerta = 'Accion realizada con exito';

			//	console.log(response)

			                self.alertvariant = "success";//mensaje del alert
			                self.showAlert(); //llama al mensaje de alert

			              },
			              error: function(error){
			              	self.alertvariant = "danger";
			                self.mensaje_alerta = 'Ha ocurrido un error';

							self.loading = false ; //apagar el spinner

			//	console.log(response)

			              }
			          });
				}
			}
		})