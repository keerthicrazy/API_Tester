Feature: POST /api/AppServerBPTopupRequest

Scenario Outline: Verify successful POST create request to AppServerBPTopupRequest
Given the user send for POST request to AppServerBPTopupRequest service endpoint 
|TopupType|Operator|BeneficiaryNumber|TransactionAmount|
|<TopupType>|<Operator>|<BeneficiaryNumber>|<TransactionAmount>|
    Then the user should get status code for AppServerBPTopupRequest endpoint as 200
    Then the response status code should be <expected_status>
    And the response should match the success response schema
    And the response field "code" should equals <code>
    And the response field "error" should equals <error>
    Examples:
      |expected_status|TopupType|Operator|BeneficiaryNumber|TransactionAmount|code|error|
      |200|"TOPUP"|"Telenor"|"09752781355"|"1"|"200"|"false"|

Scenario Outline: Verify error response for POST create request to AppServerBPTopupRequest
    Given the user send POST request to AppServerBPTopupRequest service end point
 |action|fieldName|TopupType|Operator|BeneficiaryNumber|TransactionAmount|
|<action>|<fieldName>|<invalid_TopupType>|<invalid_Operator>|<invalid_BeneficiaryNumber>|<invalid_TransactionAmount>|
    When I send a POST request to body
    Then the user should get status code for AppServerBPTopupRequest endpoint as <errorCode>
    And the user verify the error schema of the response returned as expected for AppServerBPTopupRequest service endpoint
    And the user verify the error response body should contain valid data for AppServerBPTopupRequest service endpoint with <errorCode> and <errorMessage>
    Examples:
      |action|fieldName|TopupType|Operator|BeneficiaryNumber|TransactionAmount|errorCode|errorMessage|
      |remove or null or invalid|field to be modified|"TOPUP"|"Telenor"|"09752781355"|"1"|200|yourErrorMessage|
