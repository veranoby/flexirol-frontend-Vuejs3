
var j = jQuery.noConflict();


var app = new Vue({
  el: '#solicitudes_admin',

	data:{

		filter:'', //valor inicial del filtrado
		filter_empresas:'', //valor inicial del filtrado de empresas
		filter_procesando:'', //valor inicial del filtrado
		tabIndex:0,

		status_procesando:'', //valor inicial del filtrado
		status_habilitacion:'', //valor inicial del filtrado
		status_por_banco:'', //valor inicial del filtrado
		status_deshabilitacion_empresa:'', //valor inicial del filtrado
		status_habilitacion_empresa:'', //valor inicial del filtrado


options_bancos: [
          { value: '', text: 'Filtro por Banco' },
          { value: 'Pacifico', text: 'Pacifico' },
          { value: 'Guayaquil', text: 'Guayaquil' },
          { value: 'Pichincha', text: 'Pichincha' },
          { value: 'Produbanco', text: 'Produbanco' },
          { value: 'Internacional', text: 'Internacional' },
          { value: 'Bolivariano', text: 'Bolivariano' },
          { value: 'Solidario', text: 'Solidario' },
          { value: 'Austro', text: 'Austro' },
        ],

		usuario_actual:usuario_actual,
		mi_empresa_madre:mi_empresa_madre,
		rol_actual:rol_actual ,
		monto: {value:0,selected:0},

		empresa_info_set:[], //variable que se usara en la tabla de usuarios empresas
		por_filtrarse:[],

		edited_item:{post_author:'',ID:'',post_name:'' ,post_date:'' , post_modified:'', post_excerpt:'' , post_title:'',post_content:'',gearbox:'',user_email:'',},//valor inicial del modal de edicion
		editedbanco_item:{post_author:'',ID:'',post_name:'' ,post_date:'' , post_modified:'', post_excerpt:'' , post_title:'',post_content:'',gearbox:'',user_email:'',},//valor inicial del modal de edicion

		mi_info:{post_author:'',ID:'',post_name:'' ,post_date:'' , post_modified:'', post_excerpt:'' , post_title:'',post_content:'',gearbox:'',user_email:'',}, //valor inicial de crear nuevo usuario
		mi_empresa_info:{post_author:'',ID:'',post_name:'' ,post_date:'' , post_modified:'', post_excerpt:'' , post_title:'',post_content:'',gearbox:'',user_email:'',}, //valor inicial de crear nuevo usuario


		solicitudes_info_set:[], //variable que se usara en la tabla de usuarios

		err_msg:'No hay elementos pendientes..',
		mensaje_bloqueo : 'El Usuario esta Bloqueado',		

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


  filteredRows_empresas() { //funcion que filtrara la tabla se usuarios

var por_filtrarse = this.empresa_info_set;

console.log(this.empresa_info_set);


  if(this.status_habilitacion_empresa && !this.status_deshabilitacion_empresa) {

  	por_filtrarse =  por_filtrarse.filter(function(empresita, i) 
  		{ 
  		return (
		  			(
			  			empresita["gearbox"].toLowerCase().includes('true')
					 )
	  			);
  		 }) ; 
  } //del checkbox de filtrado
    
  if(this.status_deshabilitacion_empresa && !this.status_habilitacion_empresa) {

   por_filtrarse =  por_filtrarse.filter(function(empresita, i) 
  		{ 
		return (
		  			(
			  			empresita["gearbox"].toLowerCase().includes('false')
					 )
	  			);
  		 }) ; 
    } //del checkbox de filtrado

    searchTerm = this.filter_empresas.toLowerCase(); //del input de filtrado

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

			soliticudes_nuevas: function() { //funcion que filtrara la tabla se usuarios
				 return this.filteredRows_procesando("pendiente") ;
			  },


			soliticudes_pendientes: function() { //funcion que filtrara la tabla se usuarios
				 return this.filteredRows_procesando("procesando") ;
			  },

			soliticudes_confirmadas: function() { //funcion que filtrara la tabla se usuarios
				 return this.filteredRows_procesando("procesado") ;
			  },


			filteredRows: function() { //funcion que filtrara la tabla se usuarios

			var temporal = [];

			if (this.solicitudes_info_set && this.solicitudes_info_set.constructor === Array && this.solicitudes_info_set.length === 0) {
				    return temporal; 

            } else {

				por_filtrarse = this.solicitudes_info_set;
			    searchTerm = this.status_habilitacion.toLowerCase(); //del select de filtrado
			  	por_filtrarse =  por_filtrarse.filter(function(empresita, i) 
			  		{ 
			  		return (
					  			(
									empresita["empresa"].toLowerCase().includes(searchTerm)
								 )
				  			);
			  		 }) ; 

			    searchTerm = 'pendiente'; //del input de filtrado
			  	var por_filtrarse =  por_filtrarse.filter(function(empresita, i) 
			  		{ 
			  		return (
					  			(
						  			empresita["tag"].toLowerCase().includes(searchTerm) 
								 )
				  			);
			  		 }) ; 

			    searchTerm = this.filter.toLowerCase(); //del input de filtrado
			  	var por_filtrarse =  por_filtrarse.filter(function(empresita, i) 
			  		{ 
			  		return (
					  			(
						  			empresita["empleado"].toLowerCase().includes(searchTerm) || 
									empresita["empresa"].toLowerCase().includes(searchTerm) || 
									empresita["post_content"].toLowerCase().includes(searchTerm)
								 )
				  			);
			  		 }) ; 

			  	return por_filtrarse;
				}			  	
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

			    axiosParams_restapi_recuperarusuarios() { //listado de empresas para fiultrado por Axios al restApi
			        const params = new URLSearchParams();
			        params.append('role', 'empresa');
			        params.append('orderby', 'ID');
			        params.append('order', 'asc');
			        params.append('empresa', usuario_actual);

			        return params;
    			},    			

				total_pagarse:function(){
					var solicitudes_previas = 0;
					for (i = 0; i < this.filteredRows.length; i++) {
					solicitudes_previas = Number(this.filteredRows[i].post_excerpt) + Number(solicitudes_previas);
					} 
			        return solicitudes_previas;
				},

			},

	created:function(){

//		this.mi_info=[]; //variable que se usara en la tabla de usuarios
//		this.mi_empresa_info=[]; //variable que se usara en la tabla de usuarios

		estado=''

		this.retrieve_all() //traer solicitudes
		this.retrieve_all_enterprise()
		this.retrieve_all_solicitudes()
	},


	methods:{

			filteredRows_procesando(tag_filtrado) { //funcion que filtrara la tabla se usuarios

var temporal = [];


			if (this.solicitudes_info_set && this.solicitudes_info_set.constructor === Array && this.solicitudes_info_set.length === 0) {

				console.log('filtrado por array cero - procesando:'+por_filtrarse);
				    return temporal; 

            } else {

				por_filtrarse = this.solicitudes_info_set;


			    searchTerm = this.status_procesando.toLowerCase(); //filtro por empresa
			  	por_filtrarse =  por_filtrarse.filter(function(empresita, i) 
			  		{ 
			  		return (
					  			(
									empresita["empresa"].toLowerCase().includes(searchTerm)
								 )
				  			);
			  		 }) ; 


			    searchTerm = tag_filtrado; //del tipo de tag actual procesando-procesado-pendiente
			  	var por_filtrarse =  por_filtrarse.filter(function(empresita, i) 
			  		{ 
			  		return (
					  			(
						  			empresita["tag"].toLowerCase().includes(searchTerm) 
								 )
				  			);
			  		 }) ; 


			    searchTerm = this.filter.toLowerCase(); //del input de filtrado
			  	var por_filtrarse =  por_filtrarse.filter(function(empresita, i) 
			  		{ 
			  		return (
					  			(
						  			empresita["empleado"].toLowerCase().includes(searchTerm) || 
									empresita["empresa"].toLowerCase().includes(searchTerm) || 
									empresita["post_content"].toLowerCase().includes(searchTerm)
								 )
				  			);
			  		 }) ; 


			    searchTerm = this.status_por_banco.toLowerCase(); //del selector de bancos
			    if (searchTerm ==null) { searchTerm = '';}
			  	var por_filtrarse =  por_filtrarse.filter(function(empresita, i) 
			  		{ 
			  		return (
					  			(
									empresita["post_content"].toLowerCase().includes(searchTerm)
								 )
				  			);
			  		 }) ; 

console.log('por_filtrarse:');

console.log(por_filtrarse);

			  	return por_filtrarse;

				}			  	
			  },


dia_de_hoy(fecha){

var d = new Date();

//console.log(Number(d.getDate()));

	if (Number(fecha) < Number(d.getDate())){
		return false;
	} else {
		return true;
	}


} ,


			corta_secciones(today){
				var res = today.split("<br>");
					return res;
			},

			formatea_fecha(today){

					var dd = String(today.getDate()).padStart(2, '0');
					var mm = String(today.getMonth() + 1).padStart(2, '0'); //January is 0!
					var yyyy = today.getFullYear();

					today = mm + '/' + dd + '/' + yyyy;

					return today;
			},

		      countDownChanged(dismissCountDown) { //maneja el tiempo del autoapagado del alert
		        this.dismissCountDown = dismissCountDown
		      },

		      showAlert() { //llama al mensaje de alert
		        this.dismissCountDown = this.dismissSecs
		      },

			resetOptions_procesando: function () {
			    this.filter='';
			    this.status_procesando='';
			    this.status_por_banco='';

			  },

			start_edit:function(element){ //el modal de edicion, habilita el boton de grabado y carga los valores
					this.edited_item = element
				},

			confirmar_anticipo:function(element , empresa_ID){ //el modal de edicion, habilita el boton de grabado y carga los valores

					console.log(element);	
					console.log(empresa_ID);	

					var self = this

		            self.loading = true //carga del spinner

			        const parametros = new URLSearchParams();
			        parametros.append('flexirol3', empresa_ID);
			        parametros.append('solicitud', element);	        

					axios.get(site_url + '/wp-json/flexirol/v1/confirmar/2', {
					params: parametros	
					})
					
					.then(response => { //cuando resulta success

			//			self.solicitudes_info_set = response.data;

						console.log(response.data);
						self.retrieve_all_solicitudes(); 

							})

					.catch(error => { //cuando es error
			//			console.log(error);
						})

					.finally(() => (
						self.loading = false) //apagar el spinner
						) // cuando termina el request 

					},	


//BOTON DE PRUEBAS

			mandar_prueba:function(){ //el modal de edicion, habilita el boton de grabado y carga los valores


					var self = this

		            self.loading = true //carga del spinner

			        const parametros = new URLSearchParams();
			        parametros.append('flexirol3', 'HOLA');
			        parametros.append('solicitud', 'element');	        

					axios.get(site_url + '/wp-json/flexirol/v1/pruebas/2', {
					params: parametros	
					})
					
					.then(response => { //cuando resulta success

			//			self.solicitudes_info_set = response.data;

						console.log(response.data);
			//			self.retrieve_all_solicitudes(); 

							})

					.catch(error => { //cuando es error
			//			console.log(error);
						})

					.finally(() => (
						self.loading = false) //apagar el spinner
						) // cuando termina el request 

					},	


//BOTON D EPRUEBAS



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

							})

					.catch(error => { //cuando es error

						})

					.finally(() => (
						self.loading = false) //apagar el spinner
						) // cuando termina el request

					},

			retrieve_all_enterprise:function(){ //carga listado de usuarios

					var self = this
		//			console.log(usuario_actual);

		          self.loading = true //carga del spinner

					axios.get(site_url + '/wp-json/flexirol/v1/listado/2', {
					params: this.axiosParams_restapi_recuperarusuarios	
					})
					
					.then(response => { //cuando resulta success

						self.empresa_info_set = response.data
						console.log(self.empresa_info_set)
						//console.log(self.empresa_info_set.length)
							})

					.catch(error => { //cuando es error
		//				console.log(error);
						})

					.finally(() => (
						self.loading = false) //apagar el spinner
						) // cuando termina el request

					},	
								

			retrieve_all_solicitudes:function(){ //carga listado de solicitudes realizadas

					var self = this

		            self.loading = true //carga del spinner

					axios.get(site_url + '/wp-json/flexirol/v1/solicitudes/2', {
					params: this.axiosParams_restapi_recuperarsolicitudes	
					})
					
					.then(response => { //cuando resulta success

						if(response.data.length < 1 || response.data == undefined){
						    						self.solicitudes_info_set = []; //empty
						} else {
												self.solicitudes_info_set = response.data;
												console.log(response.data);
						}

						})

					.catch(error => { //cuando es error
			//			console.log(error);
						})

					.finally(() => (
						self.loading = false) //apagar el spinner
						) // cuando termina el request

					},	

			startexport_reporte:function(){ //carga listado de solicitudes realizadas

					var self = this

		           self.loading = true //carga del spinner

	usuarios_solicitantes = self.soliticudes_confirmadas;

			 						console.log(usuarios_solicitantes);

			        const parametros = new URLSearchParams();
			        parametros.append('usuario_actual', usuario_actual);
			        parametros.append('rol_actual', rol_actual);	
			        parametros.append('pagar', 'no');			        

			        parametros.append('informacion', JSON.stringify(usuarios_solicitantes));

					axios.get(site_url + '/wp-json/flexirol/v1/pagos/2', {
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

					},

			startexport_por_empresa:function(empresa_ID , empresa_firstname){ //carga listado de solicitudes realizadas

					var self = this

		           self.loading = true //carga del spinner

self.status_procesando = empresa_firstname ;
self.filter = '' ;
self.status_por_banco = '';


usuarios_solicitantes = self.soliticudes_confirmadas;

//						console.log(self.solicitudes_info_set);

				        const parametros = new URLSearchParams();
				        parametros.append('usuario_actual', empresa_ID);
				        parametros.append('rol_actual', 'empresa');	
				        parametros.append('pagar', 'si');			        

				        parametros.append('informacion', JSON.stringify(usuarios_solicitantes));

						axios.get(site_url + '/wp-json/flexirol/v1/pagos/2', {
						params: parametros	
						})
					
					.then(response => { //cuando resulta success

							self.status_procesando = '' ;

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


			startexport:function(){ //carga listado de solicitudes realizadas

					var self = this

		            self.loading = true //carga del spinner


						console.log(self.filteredRows);

			        const parametros = new URLSearchParams();
			        parametros.append('usuario_actual', usuario_actual);
			        parametros.append('rol_actual', rol_actual);	
			        parametros.append('pagar', 'si');			        

			        parametros.append('informacion', JSON.stringify(self.filteredRows));

					axios.get(site_url + '/wp-json/flexirol/v1/pagos/2', {
					params: parametros	
					})
					
					.then(response => { //cuando resulta success

			//			self.solicitudes_info_set = response.data;

console.log(response.data);


var link = document.createElement('a');
link.target = '_blank';
link.href = response.data;

                link.href = '../wp-content/uploads/reportes/' + response.data;

                link.download = response.data;

link.dispatchEvent(new MouseEvent('click'));

self.retrieve_all_solicitudes(); 

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




