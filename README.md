# enhanced-dynamic-logic-for-espocrm
Enhanced Dynamic Logic capabilities for EspoCRM. Allows changes to a field CSS based on Dynamic Logic conditions and allows to use a current User properties to trigger Dynamic Logic changes.

Installation Instructions:

1) Dowload the plug and install using the Administration module in your EspoCRM installation.

2) Change the record view files for each entity where you wish to take advantage of the enhanced dynamic logic capabilities. 

To do this, go to the entity clientDefs metadata JSON and create or modify the "recordView" section as follows:
 
     "recordViews": {
        "list": "enhanced-dynamic-logic:views/record/list",
        "detail": "enhanced-dynamic-logic:views/record/detail",
        "detailSmall": "enhanced-dynamic-logic:views/record/detail-small",
        "edit": "enhanced-dynamic-logic:views/record/edit",
        "editSmall": "enhanced-dynamic-logic:views/record/edit-small"
    },

If you already have a custom recordView script for the target entity, you can just extend your custom view from the enhanced dynamic logic script usign the example below:

Espo.define('custom:views/record/detail', 'enhanced-dynamic-logic:views/record/detail', function (Dep) { 

      return Dep.extend({
     ... rest of your custom code goes in here
     });  

 });
     
Usage Instructions:

1) To specify css instructions for a field in a list or detail view based on a dynamic logic condition, see the example clientDefs file extract for an entity which contains a field called tenantName and which we want to make readonly if the entity "status" field value is either "Completed" or "Canceled", change the text and backgorund colors of the tenantName text depending on the "isPriority" field value, and make it visible if the user is either a Portal User or a user not member of the "Management" team:

    "dynamicLogic": {
    
        "fields": {
            "tenantName": {
                "readOnly": {
                    "conditionGroup": [
                        {
                            "type": "or",
                            "value": [
                                {
                                    "type": "equals",
                                    "attribute": "status",
                                    "value": "Completed"
                                },
                                {
                                    "type": "equals",
                                    "attribute": "status",
                                    "value": "Canceled"
                                }
                            ]
                        }
                    ]
                },
                "conditionalCss": {
                    "conditionGroup": [
                        {
                            "type": "case",
                            "value": [
                                {
                                    "type": "equals",
                                    "attribute": "isPriority",
                                    "value": true,
                                    "paramValue": "background-color:green;color:white"
                                },
                                {
                                    "type": "notEquals",
                                    "attribute": "isPriority",
                                    "value": true,
                                    "paramValue": "background-color:red;color:white"
                                }
                            ]
                        }
                    ]
                },
                "visible": {
                    "conditionGroup": [
                        {
                            "type": "or",
                            "value": [
                                {
                                    "type": "isTrue",
                                    "userAttribute": "isPortal"
                                },
                                {
                                    "type": "isFalse",
                                    "userAttribute": "isMember",
                                    "userValue": "Management"
                                }
                            ]    
                        }
                    ]
                },
                "required": null
            },
        }
        
    }

WARNING: If you are using the enhanced dynamic logic module DO NOT modify any conditions using the Administration panel becasue this will reset the enhanced dynamic logic directives in the entity's clientDefs metadada.

