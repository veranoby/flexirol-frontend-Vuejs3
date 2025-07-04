
var j = jQuery.noConflict();


var app = new Vue({
  el: '#config_usuarios_admin',

	data:{

		usuario_actual:usuario_actual,
		mi_empresa_madre:mi_empresa_madre,
		rol_actual:rol_actual ,

		new_item:{first_name:'',last_name:'',user_email:'' ,user_login:'' , user_pass:'', role:'usuario' , gearbox:'true',cedula:'',disponible:'',empresa:usuario_actual,flexirol:10,flexirol2:10,flexirol3:1}, //valor inicial de crear nuevo usuario

		edited_item:{first_name:'',last_name:'',user_email:'' ,user_login:'' , user_pass:'', role:'usuario' , gearbox:'true',cedula:'',disponible:'',empresa:usuario_actual,flexirol:10,flexirol2:10,flexirol3:1},//valor inicial del modal de edicion

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

			},			

	created:function(){

		this.retrieve_all()

console.log('usuario actual:');
//console.log(usuario_actual);
console.log('rol_actual:');
console.log(rol_actual);

	},

	methods:{

		      countDownChanged(dismissCountDown) { //maneja el tiempo del autoapagado del alert
		        this.dismissCountDown = dismissCountDown
		      },

		      showAlert() { //llama al mensaje de alert
		        this.dismissCountDown = this.dismissSecs
		      },

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

			save_edit:function(){ //guardar la modificacion
				var self = this

				//console.log(self.edited_item)

		          self.loading = true //carga del spinner

			          j.ajax({
			              type:"POST",
			              url: site_url+"/wp-admin/admin-ajax.php",
			              data: {
			                  action:'crear_usuarios',
								new_item:self.edited_item
			              },
	              success:function(response){

					//console.log(response);

			                self.mensaje_alerta = 'Accion realizada con exito';

			                self.alertvariant = "success";//mensaje del alert
			                self.showAlert(); //llama al mensaje de alert
							self.loading = false ; //apagar el spinner

			              },
	              error: function(error){
			              	self.alertvariant = "danger";
			                self.mensaje_alerta = 'Ha ocurrido un error';

					//console.log(response)

							self.loading = false ; //apagar el spinner

			              }
			          });

				},


			retrieve_all:function(){ //carga mi informacion personal

					var self = this
					//console.log('usuario_actual');
					//console.log(usuario_actual);

			          self.loading = true //carga del spinner

						axios.get(site_url + '/wp-json/flexirol/v1/info/2', {
						params: this.axiosParams_restapi_recuperarusuarios	
						})
					
						.then(response => { //cuando resulta success
						self.edited_item = response.data ;

				console.log(self.edited_item)

						self.edited_item.dia_inicio = Number(self.edited_item.dia_inicio);
						self.edited_item.dia_cierre = Number(self.edited_item.dia_cierre);
						self.edited_item.porcentaje = Number(self.edited_item.porcentaje);
						self.edited_item.dia_bloqueo = Number(self.edited_item.dia_bloqueo);
						self.edited_item.frecuencia = Number(self.edited_item.frecuencia);
						self.edited_item.dia_reinicio = Number(self.edited_item.dia_reinicio);
						self.edited_item.flexirol = Number(self.edited_item.flexirol);
						self.edited_item.flexirol2 = Number(self.edited_item.flexirol2);
						self.edited_item.flexirol3 = Number(self.edited_item.flexirol3);


							})

						.catch(error => { //cuando es error
							//console.log(error);
							})

						.finally(() => (
							self.loading = false) //apagar el spinner
							) // cuando termina el request

					},

			}
		})