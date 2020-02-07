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

Espo.define('enhanced-dynamic-logic:views/fields/base', ['views/fields/base', 'enhanced-dynamic-logic:dynamic-logic'], function (Dep,EnhancedDynamicLogic) {

    return Dep.extend({

        dynamicLogic: {},

        dynamicLogicDefs: {},
        
        dynamicCss: [],
        
        immediateRefresh: null,

        init: function(){
            Dep.prototype.init.call(this); // call the parent "init" function
            // load dynamic logic definitions
            this.dynamicLogicDefs = this.getMetadata().get('clientDefs.' + this.model.urlRoot + '.dynamicLogic');  
            // initialize the appropriate custom dynamic logic object depending on the current view mode
            if(this.mode === "list") {
                this.dynamicLogic = new EnhancedDynamicLogic(this.dynamicLogicDefs, this);                       
                this.dynamicLogic.viewMode = "list";
                var modelsArr = [];
                modelsArr.push(this.model);
                this.dynamicLogic.modelsArr = modelsArr;
            } else {
                // see if the record detail display should be refreshed immediately after a change in the field
                this.immediateRefresh = this.getMetadata().get('entityDefs.' + this.model.urlRoot + '.fields.'+this.name+'.immediateRefresh');
                if(this.immediateRefresh) {
                    this.dynamicLogic = new EnhancedDynamicLogic(this.dynamicLogicDefs, this);    
                    this.listenTo(this,'change',function(){
                        this.dynamicLogic.process();
                        if(this.dynamicCss.length > 0) {
                            this.processCss(this.dynamicCss);
                        }                                    
                    },this);                        
                }
            }                
        },    

        // function invoked by enhanced-dynamic-logic:dynamic-logic.js
        setFieldCss: function (cssData) {
            if(cssData) {
                this.dynamicCss.push(cssData);
            }
        },
        
        processCss: function(cssListData) {
            cssListData.forEach(function(rowData){
                rowData.forEach(function (fieldData) {
                    var modelId = fieldData.modelId;
                    var fieldName = fieldData.field;                    
                    var $fieldCell = $('tr.list-row[data-id="' +modelId+ '"]>td.cell[data-name="' + fieldName + '"]');
                    if($fieldCell.length > 0) {
                        var cssObj = {};
                        var cssStatements = fieldData.css.split(";");
                        cssStatements.forEach(function(statement){
                            if(statement.length > 0) {
                                var cssArray = statement.split(":");
                                var cssAttr = cssArray[0];
                                var cssVal = cssArray[1];
                                if(cssAttr) {
                                    cssObj[cssAttr] = cssVal;
                                }                                    
                                $fieldCell.css(cssObj);
                            }
                        });                                                           
                    }
                }); 
            });
        },
        
        hideField: function (name) {
            var $el = $('.field[data-name="' + name + '"]');
            var $cell = $('.cell[data-name="' + name + '"]');
            $el.addClass('hidden');
            $cell.addClass('hidden-cell');
            $cell.children('label').addClass('hidden');
        },
        
        showField: function (name) {
            var $el = $('.field[data-name="' + name + '"]');
            var $cell = $('.cell[data-name="' + name + '"]');
            $el.removeClass('hidden');
            $cell.removeClass('hidden-cell');
            $cell.children('label').removeClass('hidden');
        },
        
        setFieldReadOnly: function (name) {
            this.setReadOnly();
        },

        setFieldNotReadOnly: function (name) {
            if (this.readOnly) {
                this.setNotReadOnly();
            }
        },

        setFieldRequired: function (name) {
            this.setRequired();
        },

        setFieldNotRequired: function (name) {
            this.setNotRequired();
        },
        
        /*
        showPanel: function (name) {
            $('.panel[data-name="'+name+'"]').removeClass('hidden');
        },

        hidePanel: function (name) {
            $('.panel[data-name="'+name+'"]').addClass('hidden');
        }
        */
        
    });
});

