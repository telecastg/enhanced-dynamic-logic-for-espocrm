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
 * these Appropriate Legal Notices must retain the display of the "EspoCRM" word
 * 
 * Enhanced Dynamic Logic - Open source plug in module for EspoCRM
 * Copyright (C) 2020 Omar A Gonsenheim
 ************************************************************************/

Espo.define('enhanced-dynamic-logic:dynamic-logic', [], function () {

    var EnhancedDynamicLogic = function (defs, recordView) {
        // dynamic logic definitions provided by the entity's clientDefs metadata
        this.defs = defs || {};
        // view file for the target entity, field or panel
        this.recordView = recordView;
        
        // set of dynamic logic actions that can apply to fields
        this.fieldActionTypeList = ['visible','enhancedVisible','required','enhancedRequired', 'readOnly','enhancedReadOnly', 'conditionalCss'];
        // set of dynamic logic actions that can apply to panels
        this.panelActionTypeList = ['visible','enhancedVisible'];

        this.optionsDirtyMap = {};
        this.originalOptions = {};
    }

    _.extend(EnhancedDynamicLogic.prototype, {
        
        targetField: null,
        conditionalCss: null,
        viewMode: "detail",
        modelsArr: [],
        activeModel: null,
        userRoles: [],

        process: function () {
            if(this.defs.userRoles) {
                this.userRoles = this.defs.userRoles;
                //console.log(this.userRoles);
            }
            // when a view mode is a list, the only possible actions on fields are custom css specifications
            if(this.viewMode === "list") {
                this.fieldActionTypeList = ['conditionalCss'];
            }
            // object defined in the entity's clientDefs containing the fields affected by dynamic logic
            // the conditions to evaluate and the desired actions to take on each field
            var dynamicLogicFields = this.defs.fields || {};            
            // evaluate all models passed by a calling script
            this.modelsArr.forEach(function (model) {
                this.activeModel = model;
                // initialize the conditionalCss specifications 
                this.conditionalCss = [];
                
                // evaluate each field name (provided as keys of the "dynamicLogicFields" object 
                // contained in the "dynamicLogic" object in the entity clientDefs                
                Object.keys(dynamicLogicFields).forEach(function (field) {
                    var fieldItem = (dynamicLogicFields[field] || {});
                    // for each field, evaluate all possible dynamic logic actions that can be taken
                    this.fieldActionTypeList.forEach(function (actionType) {
                        if (!(actionType in fieldItem)) return;
                        if (!fieldItem[actionType]) return;
                        var fieldAction = (fieldItem[actionType] || {}); // field-action set eg: "tenantName["readOnly"]
                        var conditionGroup = fieldAction.conditionGroup;
                        var conditionGroup = (fieldItem[actionType] || {}).conditionGroup;
                        if (!fieldAction.conditionGroup) return;   
                        this.targetField = field;
                        // evaluate the conditions specified for each field-action set
                        var result = this.checkConditionGroup(fieldAction.conditionGroup);
                        var methodName;
                        if(result) {
                                methodName = 'makeField' + Espo.Utils.upperCaseFirst(actionType) + 'True';
                            } else {
                                methodName = 'makeField' + Espo.Utils.upperCaseFirst(actionType) + 'False';                        
                        }
                        if(actionType !== "conditionalCss") {
                            this[methodName](field);                                            
                        }
                    }, this);
                }, this);
            
                // if in view mode "detail" evaluate the dynamic logic specifications for each panel specified in the clientDefs 
                if(this.viewMode === "detail") {
                    var panels = this.defs.panels || {};
                    Object.keys(panels).forEach(function (panel) {
                        this.panelActionTypeList.forEach(function (actionType) {
                            this.processPanel(panel, actionType);
                        }, this);
                    }, this);
                }
                
                // if in view mode "detail" evaluate the dynamic logic specifications for each option specified in the clientDefs
                if(this.viewMode === "detail") {
                    var options = this.defs.options || {};
                    Object.keys(options).forEach(function (field) {
                        var itemList = options[field] || [];
                        var isMet = false;
                        for (var i in itemList) {
                            var item = itemList[i];
                            if (this.checkConditionGroup(item.conditionGroup)) {
                                this.setOptionList(field, item.optionList || []);
                                isMet = true;
                                break;
                            }
                        }
                        if (!isMet) {
                            this.resetOptionList(field);
                        }
                    }, this);
                }    

                // if a conditionalCss condition is met, apply the provided css to the target field
                if(this.conditionalCss.length > 0) {
                    this.recordView.setFieldCss(this.conditionalCss);                
                }            
                                
            }, this);
            
        },
        
        processPanel: function (panel, actionType) {
            var panels = this.defs.panels || {};
            var panelItem = (panels[panel] || {});

            if (!(actionType in panelItem)) return;
            var panelAction = (panelItem[actionType] || {});
            var conditionGroup = panelAction.conditionGroup;
            var conditionGroup = (panelItem[actionType] || {}).conditionGroup;
            if (!panelAction.conditionGroup) return;
            var result = this.checkConditionGroup(panelAction.conditionGroup);
            var methodName;
            if (result) {
                methodName = 'makePanel' + Espo.Utils.upperCaseFirst(actionType) + 'True';
            } else {
                methodName = 'makePanel' + Espo.Utils.upperCaseFirst(actionType) + 'False';
            }
            this[methodName](panel);
        },

        // evaluate the set of conditions and logical operators provided 
        // in the fieldAction or the panelAction object
        checkConditionGroup: function (data,type) {
            type = type || 'and';            
            var list;            
            var result = false;
            if (type === 'and') {
                list =  data || [];
                result = true;
                for (var i in list) {
                    if (!this.checkCondition(list[i])) {
                        result = false;
                        break;
                    }
                }
            } else if (type === 'or') {
                list =  data || [];
                for (var i in list) {
                    if (this.checkCondition(list[i])) {
                        result = true;
                        break;
                    }
                }
            } else if (type === 'not') {
                if (data) {
                    result = !this.checkCondition(data);
                }
            } else if (type==='case') {
                list =  data || [];
                for (var i in list) {
                    if (this.checkCondition(list[i])) {
                        result = true;
                        var cssObjArray = {modelId:this.activeModel.id,field:this.targetField,css:list[i].paramValue};
                        this.conditionalCss.push(cssObjArray) ;                        
                        break;
                    }                       
                }            
            }    
            return result;
        },

        // test a specific condition
        checkCondition: function (defs) {
            defs = defs || {};
            var type = defs.type || 'equals';
            if (~['or', 'and', 'not', 'case'].indexOf(type)) {
                return this.checkConditionGroup(defs.value, type);
            }     
            // define the comparison parameters for field values
            var modelAttribute = defs.attribute;
            var modelValue = defs.value;
            // define the comparison parameters for User attributes
            var userAttribute = defs.userAttribute;
            var userValue = defs.userValue;            
            // make sure that the user attribute specified is within the allowed parameters
            if (userAttribute && !~['isAdmin','isPortal','isMember','isRole'].indexOf(userAttribute)) {
                console.log("illegal type of user attribute specified in clientDefs");
                return;
            }
            // make sure that the type of comparisons for user attribute specified is within the allowed parameters
            if (userAttribute && !~['isTrue','isFalse'].indexOf(type)) {
                console.log("illegal type of comparison for user attributes specified in clientDefs");
                return;
            }
            // if neither a model attribute or a user attribute are specified, abort
            if (!modelAttribute && !userAttribute) return;
            // initialize the comparison elements
            var setValue = '';
            var value = '';
            // set the comparison values for model attributes
            if (modelAttribute){
                setValue = this.activeModel.get(modelAttribute);
                value = modelValue;
            }
            // set the comparison values for user attributes
            if (userAttribute) {
                if (userAttribute === 'isAdmin'){
                    setValue = this.recordView.getUser().isAdmin();
                } else if (userAttribute === 'isPortal') {
                    setValue = this.recordView.getUser().isPortal();
                } else if (userAttribute === 'isMember') {
                    var userTeams = Object.values(this.recordView.getUser().get('teamsNames'));
                    if(userTeams.indexOf(userValue) > -1) {
                        setValue = true;
                    } else {
                        setValue = false;
                    }
                } else if (userAttribute === 'isRole') {
                    if(this.userRoles.indexOf(userValue) > -1) {
                        setValue = true;
                    } else {
                        setValue = false;                        
                    }
                }
            }        
            // perform the comparison
            if (type === 'equals') {
                if (!value) return;
                return setValue === value;                    
            } else if (type === 'notEquals') {
                if (!value) return;                              
                return setValue !== value;                
            } else if (type === 'isEmpty') {
                if (Array.isArray(setValue)) {
                    return !setValue.length;
                }
                return setValue === null || (setValue === '') || typeof setValue === 'undefined';
            } else if (type === 'isNotEmpty') {
                if (Array.isArray(setValue)) {
                    return !!setValue.length;
                }
                return setValue !== null && (setValue !== '') && typeof setValue !== 'undefined';
            } else if (type === 'isTrue') {
                return !!setValue;
            } else if (type === 'isFalse') {
                return !setValue;
            } else if (type === 'contains' || type === 'has') {
                if (!setValue) return false;
                return !!~setValue.indexOf(value);
            } else if (type === 'notContains' || type === 'notHas') {
                if (!setValue) return true;
                return !~setValue.indexOf(value);
            } else if (type === 'greaterThan') {
                return setValue > value;
            } else if (type === 'lessThan') {
                return setValue < value;
            } else if (type === 'greaterThanOrEquals') {
                return setValue >= value;
            } else if (type === 'lessThanOrEquals') {
                return setValue <= value;
            } else if (type === 'in') {
                return ~value.indexOf(setValue);
            } else if (type === 'notIn') {
                return !~value.indexOf(setValue);
            } else if (type === 'isToday') {
                var dateTime = this.recordView.getDateTime();
                if (!setValue) return;
                if (setValue) {
                    if (setValue.length > 10) {
                        return dateTime.toMoment(setValue).isSame(dateTime.getNowMoment(), 'day');
                    } else {
                        return dateTime.toMomentDate(setValue).isSame(dateTime.getNowMoment(), 'day');
                    }
                }
            } else if (type === 'inFuture') {
                var dateTime = this.recordView.getDateTime();
                if (!setValue) return;
                if (setValue) {
                    if (setValue.length > 10) {
                        return dateTime.toMoment(setValue).isAfter(dateTime.getNowMoment(), 'day');
                    } else {
                        return dateTime.toMomentDate(setValue).isAfter(dateTime.getNowMoment(), 'day');
                    }
                }
            } else if (type === 'inPast') {
                var dateTime = this.recordView.getDateTime();
                if (!setValue) return;
                if (setValue) {
                    if (setValue.length > 10) {
                        return dateTime.toMoment(setValue).isBefore(dateTime.getNowMoment(), 'day');
                    } else {
                        return dateTime.toMomentDate(setValue).isBefore(dateTime.getNowMoment(), 'day');
                    }
                }
            }
            return false;
        },
        
        setOptionList: function (field, optionList) {
            this.recordView.setFieldOptionList(field, optionList);
        },

        resetOptionList: function (field) {
            this.recordView.resetFieldOptionList(field);
        },

        makeFieldVisibleTrue: function (field) {
            this.recordView.showField(field);
        },

        makeFieldEnhancedVisibleTrue: function (field) {
            this.recordView.showField(field);
        },

        makeFieldVisibleFalse: function (field) {
            this.recordView.hideField(field);
        },

        makeFieldEnhancedVisibleFalse: function (field) {
            this.recordView.hideField(field);
        },

        makeFieldRequiredTrue: function (field) {
            this.recordView.setFieldRequired(field);
        },

        makeFieldEnhancedRequiredTrue: function (field) {
            this.recordView.setFieldRequired(field);
        },

        makeFieldRequiredFalse: function (field) {
            this.recordView.setFieldNotRequired(field);
        },

        makeFieldEnhancedRequiredFalse: function (field) {
            this.recordView.setFieldNotRequired(field);
        },

        makeFieldReadOnlyTrue: function (field) {
            this.recordView.setFieldReadOnly(field);
        },

        makeFieldEnhancedReadOnlyTrue: function (field) {
            this.recordView.setFieldReadOnly(field);
        },

        makeFieldReadOnlyFalse: function (field) {
            this.recordView.setFieldNotReadOnly(field);
        },

        makeFieldEnhancedReadOnlyFalse: function (field) {
            this.recordView.setFieldNotReadOnly(field);
        },

        makePanelVisibleTrue: function (field) {
            this.recordView.showPanel(field);
        },

        makePanelEnhancedVisibleTrue: function (field) {
            this.recordView.showPanel(field);
        },

        makePanelVisibleFalse: function (field) {
            this.recordView.hidePanel(field);
        },

        makePanelEnhancedVisibleFalse: function (field) {
            this.recordView.hidePanel(field);
        },

        addPanelVisibleCondition: function (name, item) {
            this.defs.panels = this.defs.panels || {};
            this.defs.panels[name] = {
                visible: item
            };
            this.processPanel(name, 'visible');
        },

        makeFieldConditionalCssTrue: function(field, response) { 
            var cssObj = {field:field,css:response.resultParam};
            this.conditionalCss.push(cssObj) ;
        }
        
        
    });
    
    return EnhancedDynamicLogic;

});