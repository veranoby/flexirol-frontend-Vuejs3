
var j = jQuery.noConflict();


var app = new Vue({
  el: '#check_usuarios',

	data:{

		filter:'', //valor inicial del filtrado
		filter_total:'', //valor inicial del filtrado
		dob_month:'',
		dob_year:'',
		dob_cedula:'',
	//	status_deshabilitacion:'', //valor inicial del filtrado
	//	status_habilitacion:'', //valor inicial del filtrado

		usuario_actual:usuario_actual,
		mi_empresa_madre:mi_empresa_madre,
		rol_actual:rol_actual ,

		status_plan_1: "",
		status_plan_2: "",

		empresa_info_set:null,
		edited_item:[],//valor inicial del modal de edicion
		editedbanco_item:{post_author:'',ID:'',post_name:'' ,post_date:'' , post_modified:'', post_excerpt:'' , post_title:'',post_content:'',gearbox:'',user_email:'',},//valor inicial del modal de edicion

		mi_info:{post_author:'',ID:'',post_name:'' ,post_date:'' , post_modified:'', post_excerpt:'' , post_title:'',post_content:'',gearbox:'',user_email:'',}, //valor inicial de crear nuevo usuario
		mi_empresa_info:{post_author:'',ID:'',post_name:'' ,post_date:'' , post_modified:'', post_excerpt:'' , post_title:'',post_content:'',gearbox:'',user_email:'',}, //valor inicial de crear nuevo usuario

		por_filtrarse:[],
		empresa_busqueda:[],
		solicitudes_info_set:[],
		usuarios_empresa_info_set:[],
		element_empresa:[], //variable que se usara en la tabla de usuarios

		err_msg:'Disculpe, no hay elementos en los records.',
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


		save_switch:function(){
			
			console.log(this.edited_item.role);		

	if(this.edited_item.length < 1 || this.edited_item == undefined){

				return false

	} else {						
			if(this.edited_item.role=='empresa'){
				if(this.edited_item.first_name.length>=1&&this.edited_item.user_email.length>=1){
					return false
				}else{
					return true
				}
			} else {
				if(this.edited_item.first_name.length>=1&&this.edited_item.last_name.length>=1&&this.edited_item.cedula.length>=1){
					return false
				}else{
					return true
				}						
			}
	}
		},


    filteredRows_usuarios() { //funcion que filtrara la tabla se usuarios


	if(this.usuarios_empresa_info_set.length < 1 || this.usuarios_empresa_info_set == undefined){

var por_filtrarse = [];

  	return por_filtrarse;

	} else {

var por_filtrarse = this.usuarios_empresa_info_set;



  if(this.status_plan_1 && !this.status_plan_2) {

  	por_filtrarse =  por_filtrarse.filter(function(empresita, i) 
  		{ 
  		return (
		  			(
			  			empresita["flexirol3"].includes('1')
					 )
	  			);
  		 }) ; 
  } //del checkbox de filtrado
    
  if(this.status_plan_2 && !this.status_plan_1) {

   por_filtrarse =  por_filtrarse.filter(function(empresita, i) 
  		{ 
		return (
		  			(
			  			empresita["flexirol3"].includes('2')
					 )
	  			);
  		 }) ; 
    } //del checkbox de filtrado




	searchTerm = this.filter_total.toLowerCase(); //del input de filtrado

		 por_filtrarse =  por_filtrarse.filter(function(empresita, i) 
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
	}

console.log(por_filtrarse);
  	
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

	    axiosParams_restapi_recuperarusuarios() { //listado de empresas para fiultrado por Axios al restApi
	        const params = new URLSearchParams();
	        params.append('role', 'empresa');
	        params.append('orderby', 'ID');
	        params.append('order', 'asc');
	        params.append('empresa', usuario_actual);

	        return params;
		},    			

	},

	created:function(){

		estado=''

		this.retrieve_all_empresas() //traer solicitudes
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
			this.dob_year = 	this.dob_month = this.dob_cedula = '';

			if (this.rol_actual =='superadmin')
				{this.empresa_busqueda = ''}
				else
				{this.empresa_busqueda = this.usuario_actual}

			this.solicitudes_info_set = [];   //empty
			  },

			resetOptions_filtro: function () {
			this.filter_total = '';
			  },

			start_resumen:function(element){ //el modal de edicion, habilita el boton de grabado y carga los valores
					this.filter = element;
//					console.log(element);
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


				retrieve_all_empresas:function(){ //carga listado de usuarios

					var self = this
			//		console.log(usuario_actual);

		          self.loading = true //carga del spinner

			        const parametros = new URLSearchParams();
			        parametros.append('role', 'empresa');
			        parametros.append('orderby', 'ID');
			        parametros.append('order', 'asc');
			        parametros.append('empresa', usuario_actual);

					axios.get(site_url + '/wp-json/flexirol/v1/listado/2', {
					params: parametros
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


			start_usuarios:function(empresa_actual){ //carga listado de usuarios

				var self = this

   //             self.new_item.role='usuario';
    //            self.new_item.empresa=empresa_actual;
      //          self.empresa_actual_global=	empresa_actual;

				console.log('Inicio de busqueda de usuarios');
				console.log(empresa_actual);
				console.log(self.dob_cedula);

		        var axiosParams_params_empresa = new URLSearchParams();
		        axiosParams_params_empresa.append('role', 'usuario');
		        axiosParams_params_empresa.append('orderby', 'ID');
		        axiosParams_params_empresa.append('order', 'asc');

		        axiosParams_params_empresa.append('cedula', self.dob_cedula);

		        axiosParams_params_empresa.append('empresa', empresa_actual);

	          self.loading = true //carga del spinner

				axios.get(site_url + '/wp-json/flexirol/v1/listado/2', {
				params: axiosParams_params_empresa	
				})
				
				.then(response => { //cuando resulta success


							if(response.data.length < 1 || response.data == undefined){
							 self.usuarios_empresa_info_set = [];   //empty
							} else {
							self.usuarios_empresa_info_set = response.data;
							}

					console.log(self.usuarios_empresa_info_set)

						})

				.catch(error => { //cuando es error
		//			console.log(error);
					})

				.finally(() => (
					self.loading = false) //apagar el spinner
					) // cuando termina el request

				} ,						

			}
		})




