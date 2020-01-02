# enhanced-dynamic-logic-for-espocrm
Enhanced Dynamic Logic capabilities for EspoCRM. Allows changes to a field CSS based on Dynamic Logic conditions and allows to use a current User properties to trigger Dynamic Logic changes.

Installation Instructions:

1) Dowload the plug and install using the Administration module in your EspoCRM installation.
2) You will need to change the record view files for each entity where you wish to take advantage of the enhanced dynamic logic capabilities. To do this, go to the entity clientDefs metadata JSON 
 and create or modify the "recordView" section as follows:
     "recordViews": {
        "list": "enhanced-dynamic-logic:views/record/list",
        "detail": "enhanced-dynamic-logic:views/record/detail",
        "detailSmall": "enhanced-dynamic-logic:views/record/detail-small",
        "edit": "enhanced-dynamic-logic:views/record/edit",
        "editSmall": "enhanced-dynamic-logic:views/record/edit-small"
    },

 
