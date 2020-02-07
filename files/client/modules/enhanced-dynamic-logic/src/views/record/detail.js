/************************************************************************
 * This file is part of EspoCRM.
 *
 * EspoCRM - Open Source CRM application.
 * Copyright (C) 2014-2019 Yuri Kuznetsov, Taras Machyshyn, Oleksiy Avramenko
 * Website: https://www.espocrm.com
 *
 * EspoCRM is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * EspoCRM is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with EspoCRM. If not, see http://www.gnu.org/licenses/.
 *
 * The interactive user interfaces in modified source and object code versions
 * of this program must display Appropriate Legal Notices, as required under
 * Section 5 of the GNU General Public License version 3.
 *
 * In accordance with Section 7(b) of the GNU General Public License version 3,
 * these Appropriate Legal Notices must retain the display of the "EspoCRM" word.
 * 
 * Enhanced Dynamic Logic - Open source plug in module for EspoCRM
 * Copyright (C) 2020 Omar A Gonsenheim
************************************************************************/

Espo.define('enhanced-dynamic-logic:views/record/detail', ['views/record/detail','enhanced-dynamic-logic:dynamic-logic'], function (Dep,EnhancedDynamicLogic) {

    return Dep.extend({
        
        dynamicCss:[],
        
        userRoles:[],
        
        // override 'views/record/base method
        initDynamicLogic: function () {
            this.dynamicLogicDefs = Espo.Utils.clone(this.dynamicLogicDefs || {});
            this.dynamicLogicDefs.fields = Espo.Utils.clone(this.dynamicLogicDefs.fields);
            this.dynamicLogicDefs.panels = Espo.Utils.clone(this.dynamicLogicDefs.panels);
            // get the user roles and continue to function contInitDynamicLogic when done        
            this.getUserRoles();
        },
        
        // continue initializing Dynamic Logic definitions
        contInitDynamicLogic: function (roles) {
            this.dynamicLogicDefs.userRoles = roles;
            // create a listener to trigger function processDynamicLogic when the model changes
            this.listenTo(this.model, 'change', this.processDynamicLogic("change"), this);            
        },
        
        processDynamicLogic: function (event) {
            // create a new Dynamic Logic object if it doesn't exist yet and load it with the Dynamic Logic definitions
            if (!this.dynamicLogic) {
                this.dynamicLogic = new EnhancedDynamicLogic(this.dynamicLogicDefs, this);                
            }
            // set this model as target to which Dynamic Logic actions will apply
            this.dynamicLogic.modelsArr.push(this.model);
            // execute the dynamic logic process
            this.dynamicLogic.process();
        },

        afterRender: function () {
            this.initStickableButtonsContainer();
            this.initFieldsControlBehaviour();
            if(this.dynamicCss.length > 0) {
                this.processCss(this.dynamicCss);
            }
        },
        
        
        setFieldCss: function (cssData) {
            if(cssData) {
                this.dynamicCss = cssData;
            }
        },
        
        processCss: function(cssData) {
            cssData.forEach(function(fieldData){
                var fieldName = fieldData.field;
                var $fieldCell = $('div.field[data-name="' + fieldName + '"]');
                if($fieldCell.length > 0) {
                    var cssObj = {};
                    var cssArray = [];
                    var cssAttr = '';
                    var cssVal = '';
                    var cssStatements = fieldData.css.split(";");  
                    cssStatements.forEach(function(statement){
                        if(statement.length > 0) {
                            var cssArray = statement.split(":");
                            var cssAttr = cssArray[0];
                            var cssVal = cssArray[1];
                            if(cssAttr) {
                                cssObj[cssAttr] = cssVal
                            }
                            $fieldCell.css(cssObj);
                        }
                    });                        
                }
            });
        },

        getUserRoles: function() {
            var userId = this.getUser().id;
            var options = {};
            var sqlString = "SELECT role.name FROM role_user INNER JOIN user ON role_user.user_id = user.id INNER JOIN role ON role_user.role_id = role.id WHERE user.id = '"+userId+"'";
            options.sqlString = sqlString;     
            options.queryType = "SELECT";
            var url = '?entryPoint=sqlDataDispatcher';
            var payload = JSON.stringify(options); 
            var xmlhttp = new XMLHttpRequest();
            var self = this;
            xmlhttp.onreadystatechange = function() {                
                if (xmlhttp.readyState === XMLHttpRequest.DONE) {   // XMLHttpRequest.DONE == 4
                    // if the ajax call is successful load the userRoles array
                    if (xmlhttp.status === 200) {
                        var responseObj = JSON.parse(xmlhttp.responseText);
                        var roles = [];
                        options.responseObj = responseObj;
                        responseObj.forEach(function (role) {
                            roles.push(role.name);                            
                        }); 
                        self.contInitDynamicLogic(roles);                        
                    }
                    else if (xmlhttp.status === 400) {
                        alert('There was an error 400');
                    }
                    else {
                        alert('something else other than 200 was returned');
                    }                    
                }                
            };
            xmlhttp.open("POST",url , true);
            xmlhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");                
            xmlhttp.send("data="+payload);              
        }
                
    });
});
