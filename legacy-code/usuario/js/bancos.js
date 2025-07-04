
var j = jQuery.noConflict();


var app = new Vue({
  el: '#crear_bancos_usuarios',

	data:{

		usuario_actual:usuario_actual,

		new_item:{post_author:'',ID:'',numero_cuenta:'' ,post_date:'' , post_modified:'', post_excerpt:'' , post_title:'',post_content:'',gearbox:'',user_email:'',}, //valor inicial de crear nuevo usuario
		edited_item:{post_author:'',ID:'',numero_cuenta:'' ,post_date:'' , post_modified:'', post_excerpt:'' , post_title:'',post_content:'',gearbox:'',user_email:'',},//valor inicial del modal de edicion
		delete_item:{first_name:'',last_name:'',user_email:'' ,user_login:'', cedula:'',},//valor inicial del modal de borrado

		usuarios_info_set:[], //variable que se usara en la tabla de usuarios
		my_info:{first_name:'',last_name:'',user_email:'' ,user_login:'', cedula:'',}, //variable que se usara en la tabla de usuarios

		err_msg:'Disculpe, no hay elementos en los records.',

		loading: false, //controla spinner de cargado de pagina
        dismissSecs: 3, //tiempo del alert
        dismissCountDown: 0 ,
		alertvariant:"success", //clase - color del alert
		mensaje_alerta:"", //mensaje del alert  inicial

			},

	computed:{

			    axiosParams_restapi_recuperarusuarios() { //variable que controla que se envia en por Axios al restApi
			        const params = new URLSearchParams();
			        params.append('role', rol_actual);
			        params.append('ID', usuario_actual);

			        return params;
			    			},

			    axiosParams_restapi_recuperarbancos() { //variable que controla que se envia en por Axios al restApi
			        const params = new URLSearchParams();

			        params.append('tipo', 'cuenta');
			        params.append('post_author', usuario_actual);
			        params.append('tag', estado);

	//				console.log(usuario_actual);

			        return params;
    			},


				btn_switch:function(){

				searchTerm = this.my_info.last_name.toLowerCase();
				search_cedula = this.my_info.cedula.toLowerCase();


re = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

btn_switch_check = re.test(this.new_item.user_email);


if (!btn_switch_check) {
        this.mensaje_creacion='Se requiere email Valido';
      } else {
         this.mensaje_creacion='Llene los campos obligatorios para poder grabar por favor';     	
      }


				if((this.new_item.post_excerpt.toLowerCase().includes(searchTerm)&&this.new_item.post_content.toLowerCase().includes(search_cedula)) & this.new_item.post_excerpt.length>=1 & btn_switch_check & this.new_item.post_content.length>=1&&this.new_item.user_email.length>=1&&this.new_item.numero_cuenta.length>=1){
					retorno = true;
				}	else {
					retorno = false ;
					this.mensaje_creacion = 'La cuenta debe ser PERSONAL del usuario de la empresa..';
				}

				return retorno;

				},


				save_switch:function(){

				retorno = true ;


				searchTerm = this.my_info.last_name.toLowerCase();
				search_cedula = this.my_info.cedula.toLowerCase();


				this.mensaje_creacion = 'Llene los campos obligatorios para poder grabar por favor..';



				if(this.edited_item.post_excerpt.length>=1&&this.edited_item.post_content.length>=1&&this.edited_item.user_email.length>=1&&this.edited_item.numero_cuenta.length>=1){
					retorno = false;
				}


				if(this.edited_item.post_excerpt.toLowerCase().includes(searchTerm)&&this.edited_item.post_content.toLowerCase().includes(search_cedula)){
				//si tiene la cedula y apellido
				}	else {
					retorno = true ;
					this.mensaje_creacion = 'La cuenta debe ser PERSONAL del usuario de la empresa..';
				}


				return retorno;

				},
			},


	created:function(){

		estado=''
		this.retrieve_all()
		this.retrieve_my_info()

	},


	methods:{

		      bloqueo(fecha_obtenida) { //maneja el tiempo del autoapagado del alert de fecha demodicicacion de las cuentas

				chequeo = true;

				res = fecha_obtenida.split("/");
				fecha_corredida = res[1] + '/' + res[0] + '/' + res[2];
				fecha_actual = new Date();	
				fecha_corredida = new Date(fecha_corredida) ;

console.log('chequeo');
console.log(fecha_actual);
console.log(this.usuarios_info_set.length);


console.log(fecha_actual - fecha_corredida); 
					        
				if ((fecha_actual - fecha_corredida)>86400000 ) { //chequeo de si paso 1 dia - en milisegundos
					chequeo = false;
				} else {
					chequeo = true;
				}

console.log(chequeo);

				return chequeo;
		      },


		      countDownChanged(dismissCountDown) { //maneja el tiempo del autoapagado del alert
		        this.dismissCountDown = dismissCountDown
		      },

		      showAlert() { //llama al mensaje de alert
		        this.dismissCountDown = this.dismissSecs
		      },

			start_edit:function(element){ //el modal de edicion, habilita el boton de grabado y carga los valores
					this.edited_item = element
				},

			start_delete:function(element){ //el modal de edicion, habilita el boton de grabado y carga los valores
					this.delete_item = element
				},

			save_edit:function(){ //carga listado de bancos

					var self = this

		          self.loading = true //carga del spinner

			        const parametros = new URLSearchParams();

			        parametros.append('post_author', self.usuario_actual);

			        parametros.append('ID_post', self.edited_item.ID);

			        parametros.append('post_title', self.edited_item.post_banco+':'+self.edited_item.numero_cuenta); //titulo que se mostrara. banco y cuenta

			        parametros.append('post_banco', self.edited_item.post_banco); //nombre del banco

			        parametros.append('post_excerpt', self.edited_item.post_excerpt); //noimbre del dueno de la cuenta
			        parametros.append('gearbox', self.edited_item.gearbox); //tipo de cuenta - corriente o ahorros
			        parametros.append('post_content', self.edited_item.post_content); //cedula del dueno de cuenta
			        parametros.append('user_email', self.edited_item.user_email); //email dueno de cuenta
			        parametros.append('numero_cuenta', self.edited_item.numero_cuenta); //numero de cuenta del banco
			        parametros.append('post_type', 'cuenta'); 


	//				console.log(parametros);

					axios.get(site_url + '/wp-json/flexirol/v1/grabar/2', {
					params: parametros	
					})
					
					.then(response => { //cuando resulta success

			              	self.retrieve_all(); //recargar el listado de usuarios
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

			create_item:function(){ //carga listado de bancos

					var self = this

		          self.loading = true //carga del spinner

			        const parametros = new URLSearchParams();

			        parametros.append('post_author', self.usuario_actual); //usuario que creo la cuenta

			        parametros.append('post_title', self.new_item.post_banco+':'+self.new_item.numero_cuenta); //titulo que se mostrara. banco y cuenta

			        parametros.append('post_banco', self.new_item.post_banco); //nombre del banco

			        parametros.append('post_excerpt', self.new_item.post_excerpt); //noimbre del dueno de la cuenta
			        parametros.append('gearbox', self.new_item.gearbox); //tipo de cuenta - corriente o ahorros
			        parametros.append('post_content', self.new_item.post_content); //cedula del dueno de cuenta
			        parametros.append('user_email', self.new_item.user_email); //email dueno de cuenta
			        parametros.append('numero_cuenta', self.new_item.numero_cuenta); //numero de cuenta del banco
			        parametros.append('post_type', 'cuenta'); 


		//			console.log(parametros);

					axios.get(site_url + '/wp-json/flexirol/v1/grabar/2', {
					params: parametros	
					})
					
					.then(response => { //cuando resulta success

			              	self.retrieve_all(); //recargar el listado de usuarios
			                self.mensaje_alerta = 'Accion realizada con exito';

			                self.alertvariant = "success";//mensaje del alert
			                self.showAlert(); //llama al mensaje de alert
							})

					.catch(error => { //cuando es error
			              	self.alertvariant = "danger";
			                self.mensaje_alerta = "Ha Ocurrido un Problema..";
			                self.showAlert(); //llama al mensaje de alert

							self.loading = false ; //apagar el spinner
													})

					.finally(() => (
						self.loading = false) //apagar el spinner
						) // cuando termina el request

					},

			retrieve_all:function(){ //carga listado de bancos

					var self = this

//				console.log('usuario_actual');
//				console.log(this.usuario_actual);

		          self.loading = true //carga del spinner

					axios.get(site_url + '/wp-json/flexirol/v1/banco/2', {
					params: this.axiosParams_restapi_recuperarbancos	
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

			retrieve_my_info:function(){ //carga mi informacion personal

					var self = this
					//console.log('usuario_actual');
					//console.log(usuario_actual);

			          self.loading = true //carga del spinner

						axios.get(site_url + '/wp-json/flexirol/v1/info/2', {
						params: this.axiosParams_restapi_recuperarusuarios	
						})
					
						.then(response => { //cuando resulta success
						self.my_info = response.data ;

				console.log(self.my_info)

							})

						.catch(error => { //cuando es error
							//console.log(error);
							})

						.finally(() => (
							self.loading = false) //apagar el spinner
							) // cuando termina el request

					},					

			proceed_delete:function(banco){ //Borrar item cuenta de bancos

					var self = this

		          self.loading = true //carga del spinner

			        const parametros = new URLSearchParams();

			        parametros.append('ID_post', banco);



		//			console.log(parametros);

					axios.get(site_url + '/wp-json/flexirol/v1/borrar/2', {
					params: parametros	
					})
					
					.then(response => { //cuando resulta success

			              	self.retrieve_all(); //recargar el listado de usuarios
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
			}
		})