Feature: ConsentProvisionProcessResult API Tests

Scenario Outline: Verify successful POST request to consentProvisionProcessResult 
    Given the user send post request to consentProvisionProcessResult service endpoint
|consentId|peopleId|
|<consentId>|<peopleId>|
    Then the user should get status code for consentProvisionProcessResult endpoint as 200
    And the user verify the success schema of the response returned as expected for consentProvisionProcessResult service endpoint
    And the user verify the success response body should contain valid data for consentProvisionProcessResult service endpoint
Examples:
|consentId|peopleId|
|sample-string|sample-string|

Scenario Outline: Verify error response for POST request to consentProvisionProcessResult
    Given the user send post request to consentProvisionProcessResult service endpoint
|action|fieldName|consentId|peopleId|
|<action>|<fieldName>|<consentId>|<peopleId>|
   Then the user should get status code for consentProvisionProcessResult endpoint as <errorCode> 200
    And the user verify the error schema of the response returned as expected for consentProvisionProcessResult service endpoint
    And the user verify the error response body should contain valid data for consentProvisionProcessResult service endpoint with <errorCode> and <errorMessage>
Examples:
|action|fieldName|consentId|peopleId|errorCode|errorMessage|
|remove or null or invalid|field to be modified|sample-string|sample-string|yourErrorCode|yourErrorMessage|
