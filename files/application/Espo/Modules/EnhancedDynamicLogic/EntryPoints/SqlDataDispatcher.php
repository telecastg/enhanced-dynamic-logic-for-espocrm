<?php

namespace Espo\Modules\EnhancedDynamicLogic\EntryPoints;

use \Espo\Core\Exceptions\NotFound;
use \Espo\Core\Exceptions\Forbidden;
use \Espo\Core\Exceptions\BadRequest;

class SqlDataDispatcher extends \Espo\Core\EntryPoints\Base
{

    public static $authRequired = true;

    // default action
    public function run()
    {
        //convert the JSON string into a PHP associative array
        $payload = json_decode($_REQUEST['data'], true);
        $sqlString = $payload["sqlString"];
        $queryType = $payload["queryType"];
        // replace query placeholders
        $startNeedle = '@@{{';
        $endNeedle = '}}/@@';
        $queryPlaceholders = $this->findCustomPlaceholderNames($sqlString,$startNeedle,$endNeedle);
        foreach($queryPlaceholders as $field) {
            $fieldValue = $payload["placeholders"][$field];
            $sqlString = str_replace($startNeedle.$field.$endNeedle,$fieldValue,$sqlString);                
        }               
        // execute the sql command
        $pdo = $this->getEntityManager()->getPDO();
        if($queryType === "SELECT") {
            $data = $pdo->query($sqlString)->fetchAll();
            // return data set
            echo(json_encode($data));                    
        } else {
            $pdo->query($sqlString); 
            echo($queryType." query executed");
        }
    }
    
    public function findCustomPlaceholderNames($haystack,$startNeddle,$endNeedle) {
        $lastPos = 0;
        $placeholderNames = array();
        while (($lastPos = strpos($haystack, $startNeddle, $lastPos))!== false) {
            $placeholderNameStart = $lastPos+strlen($startNeddle);
            $placeholderNameLength = strpos($haystack,$endNeedle,$lastPos)-$placeholderNameStart;
            $placeholderName = substr($haystack,$placeholderNameStart,$placeholderNameLength);
            // avoid repeating field names
            if(!array_search($placeholderName, $placeholderNames)) {
                $placeholderNames[] = $placeholderName;                            
            }
            $lastPos = $lastPos + strlen($startNeddle);            
        }
        // print("<pre>".print_r($placeholderNames,true)."</pre>");
        return $placeholderNames;
    }
    
    
}