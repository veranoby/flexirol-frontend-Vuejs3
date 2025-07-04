
var j = jQuery.noConflict();


var app = new Vue({
  el: '#reportes_historico',

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

		monto: {value:0,selected:0},

		mes_calculado:null,

		empresa_info_set:null,
		edited_item:{post_author:'',ID:'',post_name:'' ,post_date:'' , post_modified:'', post_excerpt:'' , post_title:'',post_content:'',gearbox:'',user_email:'',},//valor inicial del modal de edicion
		editedbanco_item:{post_author:'',ID:'',post_name:'' ,post_date:'' , post_modified:'', post_excerpt:'' , post_title:'',post_content:'',gearbox:'',user_email:'',},//valor inicial del modal de edicion

		mi_info:{post_author:'',ID:'',post_name:'' ,post_date:'' , post_modified:'', post_excerpt:'' , post_title:'',post_content:'',gearbox:'',user_email:'',}, //valor inicial de crear nuevo usuario
		mi_empresa_info:{post_author:'',ID:'',post_name:'' ,post_date:'' , post_modified:'', post_excerpt:'' , post_title:'',post_content:'',gearbox:'',user_email:'',}, //valor inicial de crear nuevo usuario

		por_filtrarse:[],
		empresa_busqueda:[],
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


	totales_sumados:function(){

	var final = {};
	usuarios_solicitantes = this.solicitudes_info_set;

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

	  usuarios_solicitantes.reduce((acc, item) => {
	    final[item.post_author] = { ID: item.post_author , ID_empresa: item.empresa , nombre_empresa: '' , nombre_completo: item.empleado , cedula: ((item.post_title).split(" - "))[1] , total: 0 };
	  }, {});

	console.log(final); 
	console.log(Object.keys(final));

	usuarios_solicitantes.forEach(function (arrayItem) {
	    var x = arrayItem.post_author;

	final[x].total = Number(final[x].total) + Number(arrayItem.gearbox) + Number(arrayItem.post_excerpt);
	//    console.log(final[x].total);

	});

	return final;
	//return Object.keys(final);

	} ,


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

//		this.mi_info=[]; //variable que se usara en la tabla de usuarios
//		this.mi_empresa_info=[]; //variable que se usara en la tabla de usuarios

		estado=''

		this.retrieve_all() //traer solicitudes
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
								

			retrieve_all_solicitudes:function(){ //carga listado de solicitudes realizadas

					var self = this

		            self.loading = true //carga del spinner

			if (self.rol_actual =='empresa')

				{self.empresa_busqueda = self.usuario_actual}

			        const parametros = new URLSearchParams();
			        parametros.append('orderby', 'date');

			        parametros.append('por_cedula', self.dob_cedula);
			        parametros.append('month', self.dob_month);
			        parametros.append('year', self.dob_year);
			        parametros.append('por_fecha', 'si');

			        parametros.append('order', 'desc');
			        parametros.append('empresa', self.empresa_busqueda);
			        parametros.append('tipo', 'solicitud');

					axios.get(site_url + '/wp-json/flexirol/v1/mensual/2', {
					params: parametros

					})
					
					.then(response => { //cuando resulta success

							if(response.data.length < 1 || response.data == undefined){
							 self.solicitudes_info_set = [];   //empty
							} else {
							self.solicitudes_info_set = response.data;
							}
							
							//console.log(self.solicitudes_info_set);

						})

					.catch(error => { //cuando es error
						console.log(error);
						})

					.finally(function() { // cuando termina el request

						self.loading = false; //apagar spinner

						if(self.solicitudes_info_set.length < 1 || self.solicitudes_info_set == undefined){
						    //empty
						} else {
						self.mes_calculado = self.formatea_fecha_de_string(self.solicitudes_info_set[0].post_date);
						}

					})

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


			startexport:function(){ //carga listado de solicitudes realizadas

					var self = this

		           self.loading = true //carga del spinner

	usuarios_solicitantes = self.solicitudes_info_set;
	
	searchTerm = self.filter_total.toLowerCase(); //del input de filtrado

		var usuarios_solicitantes =  usuarios_solicitantes.filter(function(empresita, i) 
			{ 
			return (
		  			(
			  			empresita["empleado"].toLowerCase().includes(searchTerm) || 
						empresita["post_title"].toLowerCase().includes(searchTerm)
					 )
	  			);
			 }) ; 

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

			}
		})




