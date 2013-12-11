(function() {
   
    var customers = {
        //form 
        form : '#customers',
        $form : $('#customers'),
        //span or div
        for_server_error : '#for_server_error',
        //jquery templates
        onecustomer_tmpl : '#onecustomer-tmpl',
        //table
        customerTableClass : 'tab-customers',
        // tag "a" (delete and update)        
        editCustomerClass : 'edit_customer',
        deleteCustomerClass : 'delete_customer',
        //button update 
        alexUpdateButtonClass : 'alex_update',
        // we have 2 buttons one of them has attribute name is "add" and the other "update" 
        submitAttrNameAdd : 'customers[add]',
        submitAttrNameUpdate : 'customers[update]',
        
       
        
        initialize : function () { 
            this.extend();
            this.modules();            
            this.initializeOtherPlugins();
            this.setUpListeners();
        },
        extend : function () {
            $.extend(this, APP);
        },
 
        modules: function () {
          
        },
        initializeOtherPlugins : function()
        {
            this.initializeJqueryTmpl();
            this.initializeJqueryValidate();
        }, 
        setUpListeners: function () {
            // i donot need to create this because i use jquery validate plugin which if validation is true calss formsubmit function automatically
            //  this.$form.on('submit', '', this,  $.proxy(this.submitForm, this))
            //edit customer
             $('.'+this.customerTableClass).on('click', 'a.'+this.editCustomerClass, this,  $.proxy(this.editCustomer, this));
            //delete customer
            $('.'+this.customerTableClass).on('click', 'a.'+this.deleteCustomerClass, this,  $.proxy(this.deleteCustomer, this));
            
            
        },
        initializeJqueryTmpl : function () {
            this.insertAllCustomerToTable();
        },
        initializeJqueryValidate : function () {
            var self = this;
            $.validator.addMethod("isphone", function(value, element) {
                    return /[0-9_-]{1,10}$/.test(value);
            });
            $.validator.addMethod("status", function(value, element) {
                    return /[0-9]{1,2}$/.test(value);
            });
            
            this.$form.validate({
               rules: {
                        calls: {required: true },
                        firstName: {required: true },
                        lastName: {required: true },
                        phone: {required: true, isphone:true , maxlength: 10    },
                        address: {required: true},
                        status: {required: true, status:true, maxlength: 2,minlength: 1 }
                        
                      },
                messages: {
                        calls: {required: "needs to be not empty"},
                        firstName: {required: "needs to be not empty"},
                        lastName: {required: "needs to be not empty"},
                        phone: {required: "needs to be not empty",isphone:'needs to be 0-9 or _ or -', maxlength:'max length is 10 symbols'},
                        address: {required: "needs to be not empty"},
                        status: {required: "needs to be not empty",status:'not valid status, only 0-99', maxlength: 'maxlength=2',minlength: 'minlength=1' }
                },
                 submitHandler : function (form) {
                     var $clickedButton = $(this.submitButton);      
                     var isNew = false;
                     if ( self.submitAttrNameUpdate === $clickedButton.attr('name') ) {
                         //here clicked update
                         self.$form.attr('action','/customers/edit/'+$clickedButton.data('id'));
                     } else {
                         isNew = true;
                         //here clicked add new customer
                         self.$form.attr('action','/customers/add');
                     }

                     var emptyStr = '';
                     self.showOrHideMessageFromServer(emptyStr);
                     //show ajax sign
                     $("body").mask("Loading...");
                     self.submitForm(isNew);
                     
                 }
              });
        },
        //isNew - true it means we try to add new customer   false - update existing customer
        submitForm : function (isNew) {   
            var params = {};
            params.url = this.$form.attr('action');
            params.data = this.$form.serialize();
            
            var response_obj = this.ajax(params);
           //hide update button
            this.hideUpdateButton();   
            
           if(response_obj.error instanceof Object || response_obj.error !== '') {
               var errorMsg = response_obj.error;
               if (response_obj.error instanceof Object) {
                   errorMsg =  this.addErrorMessageToDom(response_obj.error);
               }               
               this.showOrHideMessageFromServer(errorMsg);
               $("body").unmask();
               //clear all inputs
               this.$form.find('input[type=text]').val('');
               return false;
           } else {
                //clear all inputs
                this.$form.find('input[type=text]').val('');
                //delete mask from all window
                $("body").unmask();
                 //add new customer to the end of list
                 if ( isNew ) {
                     // new customer
                     this.addNewCustomer(response_obj.response);                  
                 } else {
                     //update customer
                     this.updateExistingCustomer(response_obj.response);   
                 }
                      
           }
      
        },
        hideUpdateButton : function () {
            var button = $('.'+this.alexUpdateButtonClass);
            if ( ! button.hasClass(this.displayNone) ) {
                $('.'+this.alexUpdateButtonClass).addClass(this.displayNone); 
            }
            
        },
        addNewCustomer : function (response_obj) {

                $('.'+this.customerTableClass).append($(this.onecustomer_tmpl).tmpl(response_obj));  
        },
        updateExistingCustomer : function (response_obj){

            var $tr = $('.'+this.customerTableClass).find('.tr_'+response_obj.id);
            $tr.replaceWith($(this.onecustomer_tmpl).tmpl(response_obj));  
           
        },
        addErrorMessageToDom : function (objError) {            
            var text = '';
            $.each(objError, function( index, valueObj ) {
                text +=  'server error field - '+index+' , message - ' ;
                $.each(valueObj, function (errName, errMessage) {
                    text +=  errMessage + ' ' ;
                });
           });
           return text;
           
        },
        showOrHideMessageFromServer : function (msg){
            $(this.for_server_error).text(msg);
        },
        insertAllCustomerToTable : function () {
           var self = this;
           var whereAppend = $('.'+this.customerTableClass);
           $.each(customersList, function (index, value){
               whereAppend.append($(self.onecustomer_tmpl).tmpl(value));  
           });

        },
        deleteCustomer : function (event) {
            $("body").mask("Loading...");
            event.preventDefault();
            var $target = $(event.target);
       
            //create ajax for delete
            var params = {};
            params.url = $target.attr('href');
            
            var response_obj = this.ajax(params);
            if (response_obj.error.length) {
                //here i have error from server 
                this.showOrHideMessageFromServer(response_obj.error);
                $("body").unmask();
                return false;
            }
            $target.parents('tr').remove();
            $("body").unmask();
        },
        editCustomer : function (event) {
            event.preventDefault();
            var $target =$ (event.target);
            var tr = $target.parents('tr');
            //get all data fro inserting into form
            var trDataForForm = tr.data('tmplItem').data;
            var allInputs =  this.$form.find('input[type=text]');
    
            $.each(allInputs , function(index, input) {
                var $input = $(input);
                var name = $input.attr('name');
                $input.val(trDataForForm[name]);
            });
            var buttonInputs =  $('.'+this.alexUpdateButtonClass).removeClass(this.displayNone);
            buttonInputs.data('id', trDataForForm.id);
            
        }
      
    }
  
    customers.initialize();
 
}());


