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

1) To use User attributes as condition for a dynamic logic action, you must use the following enhanced condition types in your clientDefs:

  "enhancedVisible" instead of "visible"

  "enhancedReadOnly" instead of "readOnly"

  "enhancedRequired" instead of "required"

2) To specify css attributes for a field, which will affect list and detail displays, use the enhanced condition type "conditionalCss"

3) See the example clientDefs file extract for an entity which contains a field called tenantName and for which we want to specify the following dynamic logic directives:

  a) Make the field readonly if the entity "status" field value is either "Completed" or "Canceled".
  
  b) Change the text and backgorund colors of the field text depending on the value of the "isPriority" field.
  
  c) Make the field visible if the user is either a Portal User or the user is not a member of the "Management" team.

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
                "enhancedVisible": {
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

