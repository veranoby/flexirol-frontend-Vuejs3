
var j = jQuery.noConflict();


var app = new Vue({
  el: '#crear_usuarios_superadmin',

	data:{
		filter:'', //valor inicial del filtrado
		status_deshabilitacion:'', //valor inicial del filtrado
		status_habilitacion:'', //valor inicial del filtrado

		filter_usuarios:'', //valor inicial del filtrado
		empresa_actual_global:'',
		
		status_deshabilitacion_usuarios:'', //valor inicial del filtrado usuarios
		status_habilitacion_usuarios:'', //valor inicial del filtrado usuarios		
		status_excel:'', //valor inicial del filtrado usuarios		

		mensaje_tiptool:'Llene los campos obligatorios para poder grabar por favor',
		mensaje_tiptool_2:'Llene los campos obligatorios para poder grabar por favor',

		new_item:{first_name:'',last_name:'',user_email:'' ,user_login:'' , user_pass:'', role:'usuario' , gearbox:'true',cedula:'',disponible:'',empresa:usuario_actual,ciudad:'',direccion:'',nacimiento:'',gender:'',fecha_excel:'No creado',}, //valor inicial de crear nuevo usuario
		edited_item:{first_name:'',last_name:'',user_email:'' ,user_login:'' , user_pass:'', role:'usuario' , gearbox:'true',cedula:'',disponible:'',empresa:usuario_actual,ciudad:'',direccion:'',nacimiento:'',gender:'',fecha_excel:'No creado',},//valor inicial del modal de edicion
		delete_item:{first_name:'',last_name:'',user_email:'' ,user_login:'',},//valor inicial del modal de borrado


		empresa_info_set:[], //variable que se usara en la tabla de usuarios empresas
		usuarios_empresa_info_set:[], //variable que se usara en la tabla de usuarios de cada empresa

		tipo_usuario:'empresa',
		err_msg:'Disculpe, no hay usuarios en los records.',


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

  filteredRows() { //funcion que filtrara la tabla se usuarios

var por_filtrarse = this.empresa_info_set;
//console.log(this.empresa_info_set);

  if(this.status_excel) {


console.log('filtrado vacio o atrasado:'+por_filtrarse);


let excel_final = [];
var hoy = new Date(); //DIA DE HOY
hoy_mes = hoy.getMonth() ;
hoy_anio = hoy.getFullYear();

cierre_mes_anterior = hoy_mes + '/28/' + hoy_anio;
cierre_mes_anterior = new Date(cierre_mes_anterior); //CIERRE MES ANTERIOR


for (let i = 0; i < por_filtrarse.length; i++) {

	if (por_filtrarse[i].fecha_excel == 'No creado' ) {

        excel_final.push(por_filtrarse[i]);

	} else {

		var res = por_filtrarse[i].fecha_excel.split("/");
		dia_excel = res[1] + '/' + res[0] + '/' + res[2];
		dia_excel = new Date(dia_excel); //FECHA SUBIDA DEL ULTIMO EXCEL

		if (dia_excel < cierre_mes_anterior) {
        excel_final.push(por_filtrarse[i]);
	    }

	}

  } 

  por_filtrarse = excel_final;

}//del checkbox de filtrado



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

  	console.log('entrando a filtrado por usuario');
 // 	console.log(this.empresita);  	
//  	console.log(this.empresa_info_set); //variable array/objeto a ser filtrado


  	var filtrado =  por_filtrarse.filter(function(empresita, i) 
  		{ 

  		return (
		  			(
			  			empresita["first_name"].toLowerCase().includes(searchTerm) || 
						empresita["last_name"].toLowerCase().includes(searchTerm) || 
						empresita["user_email"].toLowerCase().includes(searchTerm)
					 )
	  			);
  		 }) ; 

//  	console.log(filtrado);
  	return filtrado;

  },

    filteredRows_usuarios() { //funcion que filtrara la tabla se usuarios

var por_filtrarse = this.usuarios_empresa_info_set;

  if(this.status_habilitacion_usuarios && !this.status_deshabilitacion_usuarios) {

  	por_filtrarse =  por_filtrarse.filter(function(empresita, i) 
  		{ 
  		return (
		  			(
			  			empresita["gearbox"].toLowerCase().includes('true')
					 )
	  			);
  		 }) ; 
  } //del checkbox de filtrado
    
  if(this.status_deshabilitacion_usuarios && !this.status_habilitacion_usuarios) {

   por_filtrarse =  por_filtrarse.filter(function(empresita, i) 
  		{ 
		return (
		  			(
			  			empresita["gearbox"].toLowerCase().includes('false')
					 )
	  			);
  		 }) ; 
    } //del checkbox de filtrado

    searchTerm = this.filter_usuarios.toLowerCase(); //del input de filtrado

  	console.log('entrando a filtrado total');
 // 	console.log(this.empresita);  	
//  	console.log(this.empresa_info_set); //variable array/objeto a ser filtrado


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
        params.append('role', 'empresa');
        params.append('orderby', 'ID');
        params.append('order', 'asc');
        params.append('empresa', usuario_actual);

        return params;
    			},


				btn_switch:function(){

//console.log('estado actual btn_switch');
//console.log(this.new_item.role);

re = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

btn_switch_check = re.test(this.new_item.user_email);

//console.log('estado actual chequeo email');
//console.log(btn_switch_check);

if (!btn_switch_check) {
        this.mensaje_tiptool='Se requiere email Valido';
      } else {
         this.mensaje_tiptool='Llene los campos obligatorios para poder grabar por favor';     	
      }

//console.log('estado actual mensaje');
//console.log(this.mensaje_tiptool);

					if(this.new_item.role=='empresa'){
					if(this.new_item.first_name.length>=1 && btn_switch_check && this.new_item.user_login.length>=1 && this.new_item.user_pass.length>=1){
							return false
						}else{
							return true
						}
					} else {
					if(this.new_item.disponible>=1&&this.new_item.first_name.length>=1&&this.new_item.last_name.length>=1&&this.new_item.cedula.length>=1&& btn_switch_check &&this.new_item.user_login.length>=1&&this.new_item.user_pass.length>=1){
							return false
						}else{
							return true
						}						
					}

				},

				save_switch:function(){

//console.log('estado actual save_switch');
//console.log(this.edited_item.role);

re = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

btn_switch_check = re.test(this.edited_item.user_email);

if (!btn_switch_check) {
        this.mensaje_tiptool_2='Se requiere email Valido';
      } else {
         this.mensaje_tiptool_2='Llene los campos obligatorios para poder grabar por favor';     	
      }

//console.log('estado actual mensaje');
//console.log(this.mensaje_tiptool_2);		
//console.log(this.edited_item.role);		

					if(this.edited_item.role=='empresa'){
						if(this.edited_item.first_name.length>=1 && btn_switch_check ){
							return false
						}else{
							return true
						}
					} else {
						if(this.edited_item.first_name.length>=1 && btn_switch_check && this.edited_item.cedula.length>=1){
							return false
						}else{
							return true
						}						
					}

				},
			},

			created:function(){
				this.retrieve_all()
			},

			methods:{


			check_edit:function(){ //chequear la modificacion que no se pase de limites
				var self = this

console.log("entrando a verificacion")

/*check plan 1*/
if ((self.edited_item.flexirol) < 1) {
self.edited_item.flexirol = 1
}
if ((self.edited_item.flexirol) > 50) {
self.edited_item.flexirol =  50
}

/*check plan 2*/
if ((self.edited_item.flexirol2) < 1) {
self.edited_item.flexirol2 = 1
}

/*check dia inicio*/
if ((self.edited_item.dia_inicio) < 2) {
self.edited_item.dia_inicio = 2
}
if ((self.edited_item.dia_inicio) > 5) {
self.edited_item.dia_inicio =  5
}

/*check dia cierre ciclo*/
if ((self.edited_item.dia_cierre) < 15) {
self.edited_item.dia_cierre = 15
}
if ((self.edited_item.dia_cierre) > 28) {
self.edited_item.dia_cierre =  28
}

/*check Porcentaje del monto maximo */
if ((self.edited_item.porcentaje) < 15) {
self.edited_item.porcentaje = 15
}
if ((self.edited_item.porcentaje) > 100) {
self.edited_item.porcentaje =  100
}

/*check dias bloqueo */
if ((self.edited_item.dia_bloqueo) < 1) {
self.edited_item.dia_bloqueo = 1
}
if ((self.edited_item.dia_bloqueo) > 3) {
self.edited_item.dia_bloqueo =  3
}

/*check frecuencia de solicitudes al mes */
if ((self.edited_item.frecuencia) < 1) {
self.edited_item.frecuencia = 1
}

/*check dias rehabilita poder solicitar Anticipos */
if ((self.edited_item.dia_reinicio) < 1) {
self.edited_item.dia_reinicio = 1
}
if ((self.edited_item.dia_reinicio) > 3) {
self.edited_item.dia_reinicio =  3
}


		      },





				excel_switch(fecha_excel){

				if ((fecha_excel ==null || fecha_excel =='No creado')) {
					return true;					
				}

				var hoy = new Date(); //DIA DE HOY
				hoy_mes = hoy.getMonth() ;
				hoy_anio = hoy.getFullYear();

				cierre_mes_anterior = hoy_mes + '/28/' + hoy_anio;
				cierre_mes_anterior = new Date(cierre_mes_anterior); //CIERRE MES ANTERIOR

				var res = fecha_excel.split("/");
				dia_excel = res[1] + '/' + res[0] + '/' + res[2];
				dia_excel = new Date(dia_excel); //FECHA SUBIDA DEL ULTIMO EXCEL

				if (dia_excel < cierre_mes_anterior) {
					return true;					
					}

					return false;					

				},

			sendInfo(item,ID) {


this.new_item.first_name = this.new_item.user_login = this.new_item.user_pass = this.new_item.user_email = this.new_item.last_name = this.new_item.cedula = '';

			        this.tipo_usuario = item;
			        if(item=='empresa'){
			        this.new_item.role='empresa';
	                this.new_item.empresa='';

					console.log('entrando metodo sendInfo:empresa');

			        } else {

			        this.new_item.role='usuario';
	                this.new_item.empresa=ID;

					console.log('entrando metodo sendInfo:usuario');

			        }

					console.log(this.new_item);

			    } ,

	      countDownChanged(dismissCountDown) { //maneja el tiempo del autoapagado del alert
	        this.dismissCountDown = dismissCountDown
	      },

	      showAlert() { //llama al mensaje de alert
	        this.dismissCountDown = this.dismissSecs
	      },

			computed_username:function(){  //para crear recomendacion de user y password a partir de nombre y sucursal

			if(this.new_item.role == 'empresa') {

			user_login = (this.new_item.first_name)+'_'+(this.new_item.last_name)

			} else {
			user_login = ((this.new_item.first_name)+'_'+(this.new_item.last_name)+'_'+(this.new_item.cedula))

			}

			this.new_item.user_login = this.new_item.user_pass = (user_login.replace(/\s+/g, '_')).toUpperCase()

		},

			start_edit:function(element){ //el modal de edicion, habilita el boton de grabado y carga los valores
					this.edited_item = element
					this.edited_item.dia_inicio = Number(this.edited_item.dia_inicio);
					this.edited_item.dia_cierre = Number(this.edited_item.dia_cierre);
					this.edited_item.porcentaje = Number(this.edited_item.porcentaje);
					this.edited_item.dia_bloqueo = Number(this.edited_item.dia_bloqueo);
					this.edited_item.frecuencia = Number(this.edited_item.frecuencia);
					this.edited_item.dia_reinicio = Number(this.edited_item.dia_reinicio);

					this.edited_item.flexirol = Number(this.edited_item.flexirol);
					this.edited_item.flexirol2 = Number(this.edited_item.flexirol2);

					if(this.edited_item.birth_date !== null){

					this.edited_item.birth_date = new Date(this.edited_item.birth_date);

					    }

					    console.log(this.edited_item);

				},

			start_delete:function(element){ //el modal de edicion, habilita el boton de grabado y carga los valores
					this.delete_item = element
				},

			save_edit:function(){ //guardar la modificacion
				var self = this

		//		console.log(self.edited_item)

		          self.loading = true //carga del spinner

			          j.ajax({
			              type:"POST",
			              url: site_url+"/wp-admin/admin-ajax.php",
			              data: {
			                  action:'crear_usuarios',
								new_item:self.edited_item
			              },
	              success:function(response){

		//			console.log(response);

			                self.mensaje_alerta = 'Accion realizada con exito';

			                self.alertvariant = "success";//mensaje del alert
			                self.showAlert(); //llama al mensaje de alert
							self.loading = false ; //apagar el spinner

			              },
	              error: function(error){
			              	self.alertvariant = "danger";
			                self.mensaje_alerta = 'Ha ocurrido un error';
			                self.showAlert(); //llama al mensaje de alert

		//			console.log(response)

							self.loading = false ; //apagar el spinner

			              }
			          });

				},

			create_item:function(empresa_soy){ //crear usuarios
					var self = this

					console.log('creando usuario:')			
				console.log(self.new_item)

	//				console.log('empresa soy:')			
//				console.log(empresa_soy)

		          self.loading = true //carga del spinner

			          j.ajax({
			              type:"POST",
			              url: site_url+"/wp-admin/admin-ajax.php",
			              data: {
			                  action:'crear_usuarios',
								new_item:self.new_item
			              },
			              success:function(response){

				console.log('respuesta ajax success:');	
				casos = JSON.parse(response);
				console.log(casos.type);

if (casos.type =='error'){

				console.log('respuesta ajax error:');	
				console.log(casos.message);

			              	self.alertvariant = "danger";
			                self.mensaje_alerta = casos.message;
			                self.showAlert(); //llama al mensaje de alert

							self.loading = false ; //apagar el spinner

} else {

			              	console.log('recargando usuarios');
			              	self.retrieve_all(); //recargar el listado de usuarios
			              	self.start_usuarios(self.new_item.empresa);
			                self.mensaje_alerta = 'Accion realizada con exito';

			                self.alertvariant = "success";//mensaje del alert
			                self.showAlert(); //llama al mensaje de alert

		                  self.new_item = {first_name:'',last_name:'',user_email:'' ,user_login:'' , user_pass:'',gearbox:'true', role:'empresa',};
}
			              },
			              error: function(error){

				console.log('respuesta ajax error:');	
				console.log(response);

			              	self.alertvariant = "danger";
			                self.mensaje_alerta = "Ha Ocurrido un Problema..";
			                self.showAlert(); //llama al mensaje de alert

							self.loading = false ; //apagar el spinner

			              }
			          });

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
		//				console.log(response.data)
						//console.log(self.empresa_info_set.length)
							})

					.catch(error => { //cuando es error
		//				console.log(error);
						})

					.finally(() => (
						self.loading = false) //apagar el spinner
						) // cuando termina el request

					},

				proceed_delete:function(empresa_id){
					// send delete connand and car id to backend PHP file
					var self = this

						console.log(self.delete_item);
busqueda_posterior = self.delete_item.empresa;

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
			              	self.start_usuarios(busqueda_posterior);
			              	
			                self.mensaje_alerta = 'Accion realizada con exito';

			                self.alertvariant = "success";//mensaje del alert
			                self.showAlert(); //llama al mensaje de alert

			              },
			              error: function(error){
			              	self.alertvariant = "danger";
			                self.mensaje_alerta = 'Ha ocurrido un error';
			                self.showAlert(); //llama al mensaje de alert

							self.loading = false ; //apagar el spinner

		//		console.log(response)

			              }
			          });
				} ,


			startexport:function(acciones){ //exportar excel los listados de empresas filtrados

					var self = this

					var por_filtrarse = this.empresa_info_set;

					if (acciones =='actualizados') {

					console.log('filtrado vacio o atrasado en export:'+por_filtrarse);

					let excel_final = [];
					var hoy = new Date(); //DIA DE HOY
					hoy_mes = hoy.getMonth() ;
					hoy_anio = hoy.getFullYear();

					cierre_mes_anterior = hoy_mes + '/28/' + hoy_anio;
					cierre_mes_anterior = new Date(cierre_mes_anterior); //CIERRE MES ANTERIOR


					for (let i = 0; i < por_filtrarse.length; i++) {

						if (por_filtrarse[i].fecha_excel == 'No creado' ) {

					        excel_final.push(por_filtrarse[i]);

						} else {

							var res = por_filtrarse[i].fecha_excel.split("/");
							dia_excel = res[1] + '/' + res[0] + '/' + res[2];
							dia_excel = new Date(dia_excel); //FECHA SUBIDA DEL ULTIMO EXCEL

							if (dia_excel < cierre_mes_anterior) {
					        excel_final.push(por_filtrarse[i]);
						    }

						}

					  } 

					  usuarios_solicitantes = excel_final;

					}



					if (acciones =='bloqueados') {

					console.log('filtrado bloqueado en export:'+por_filtrarse);

					   por_filtrarse =  por_filtrarse.filter(function(empresita, i) 
					  		{ 
							return (
							  			(
								  			empresita["gearbox"].toLowerCase().includes('false')
										 )
						  			);
					  		 }) ; 

					  usuarios_solicitantes = por_filtrarse;

					}


			if (Array.isArray(usuarios_solicitantes) && usuarios_solicitantes.length) {

			      self.loading = true //carga del spinner

			        const parametros = new URLSearchParams();
			        parametros.append('usuario_actual', usuario_actual);
			        parametros.append('rol_actual', rol_actual);	
			        parametros.append('acciones', acciones);	
			        
			        parametros.append('informacion', JSON.stringify(usuarios_solicitantes));

					axios.get(site_url + '/wp-json/flexirol/v1/reporteusuarios/2', {
					params: parametros	
					})
					
					.then(response => { //cuando resulta success

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

			} else {

	              	self.alertvariant = "danger";
	                self.mensaje_alerta = 'No hay elementos para exportar..';
	                self.showAlert(); //llama al mensaje de alert

			}

		},	


			start_usuarios:function(empresa_actual){ //carga listado de usuarios

				var self = this

                self.new_item.role='usuario';
                self.new_item.empresa=empresa_actual;
                self.empresa_actual_global=	empresa_actual;

				console.log('Inicio de busqueda de usuarios');
				console.log('Rol Actual');
				console.log(self.new_item.role);
				console.log('ID empresa actual');
				console.log(self.new_item.empresa);


		        var axiosParams_params_empresa = new URLSearchParams();
		        axiosParams_params_empresa.append('role', 'usuario');
		        axiosParams_params_empresa.append('orderby', 'ID');
		        axiosParams_params_empresa.append('order', 'asc');
		        axiosParams_params_empresa.append('empresa', empresa_actual);

	          self.loading = true //carga del spinner

				axios.get(site_url + '/wp-json/flexirol/v1/listado/2', {
				params: axiosParams_params_empresa	
				})
				
				.then(response => { //cuando resulta success

					self.usuarios_empresa_info_set = response.data
		//			console.log(self.usuarios_empresa_info_set)
					//console.log(self.empresa_info_set.length)
						})

				.catch(error => { //cuando es error
		//			console.log(error);
					})

				.finally(() => (
					self.loading = false) //apagar el spinner
					) // cuando termina el request

				}


			}
		})