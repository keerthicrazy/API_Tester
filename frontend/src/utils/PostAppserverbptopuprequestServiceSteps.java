package com.ocbc.api.steps;
        

import io.cucumber.java.en.*;
import io.restassured.response.Response;
import org.testng.Assert;
import org.json.simple.parser.ParseException;
import org.ocbcqa.core.report.Logger;
import org.ocbcqa.core.base.test.BaseStep;
import org.ocbcqa.core.util.CustomSoftAssert;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import com.fasterxml.jackson.core.JsonProcessingException;
import io.cucumber.datatable.DataTable;

import io.cucumber.java.en.Given;
import io.cucumber.java.en.When;
import io.cucumber.java.en.Then;
import static org.hamcrest.Matchers.*;
import java.util.HashMap;

import com.ocbc.api.service.PostAppserverbptopuprequestServiceService;
import com.ocbc.api.service.PostAppserverbptopuprequestServiceService.PostAppserverbptopuprequestServiceRequest;
import com.ocbc.api.service.PostAppserverbptopuprequestServiceService.PostAppserverbptopuprequestServiceResponse;

public class PostAppserverbptopuprequestServiceSteps {

    private static final Logger logger = LoggerFactory.getLogger(PostAppserverbptopuprequestServiceSteps.class);
    private PostAppserverbptopuprequestServiceService postAppserverbptopuprequestServiceService = new PostAppserverbptopuprequestServiceService();
    private PostAppserverbptopuprequestServiceRequest request;
    private Response response;


    @Given("the user send post request to AppServerBPTopupRequest service endpoint")
    public void sendRequestToServiceEndpoint() throws JsonProcessingException, ParseException {
        response = appServerBPTopupRequest.function toLocaleLowerCase() {
    [native code]
}();
        Logger.info(response.prettyPrint());
    }

    @Then("the user should get status code for AppServerBPTopupRequest endpoint as {int}")
    public void verifystatusCode(int expectedStatus) {
        assertEquals(response.getStatusCode(), expectedStatus);
    }

    @Then("the user verify the success schema of the response returned as expected for AppServerBPTopupRequest service endpoint")
    public void verifySuccessSchema() {
        appServerBPTopupRequest.serializeSuccessResponse();
        appServerBPTopupRequest.validateSuccessResponseSchema();
    }

    @Then("the response should contain the correct AppServerBPTopupRequest details")
    public void validatePostAppserverbptopuprequestServiceDetails(String code, String error) {
        assertNotNull(response);
        // Get response data from POJO for validation
        PostAppserverbptopuprequestServiceResponseData responseData = postAppserverbptopuprequestServiceService.getResponseData();
        assertNotNull(responseData, "Response data should not be null");
                assertEquals(response.jsonPath().get("code"), code);
        assertEquals(response.jsonPath().get("error"), error);
    }

    
    @Then("the response should match the success response schema")
    public void validateResponseSchema() {
        // Validate response against generated POJO schema using service
        postAppserverbptopuprequestServiceService.validateSuccessSchema();
        logger.info("Response schema validation successful");
    }
    @Then("the response should match the error response schema")
    public void validateErrorResponseSchema() {
        // Validate error response against generated error POJO schema using service
        postAppserverbptopuprequestServiceService.validateErrorSchema();
        logger.info("Error response schema validation successful");
    }
    @Then("^the response status should be (.+)$")
    public void validateResponseStatus(String expectedStatus) {
        assertEquals(response.getStatusCode(), Integer.parseInt(expectedStatus));
    }
    @Then("^the response field (.+) should equals (.+)$")
    public void validateResponseField(String fieldName, String expectedValue) {
        // Get response data from POJO for validation
        PostAppserverbptopuprequestServiceResponseData responseData = postAppserverbptopuprequestServiceService.getResponseData();
        assertNotNull(responseData, "Response data should not be null");
        
        // Validate field value using POJO getter methods
        switch (fieldName) {
            case "name":
                assertEquals(responseData.getName(), expectedValue);
                break;
            case "job":
                assertEquals(responseData.getJob(), expectedValue);
                break;
            case "id":
                assertEquals(responseData.getId(), expectedValue);
                break;
            case "createdAt":
                assertEquals(responseData.getCreatedAt(), expectedValue);
                break;
            default:
                throw new IllegalArgumentException("Unknown field: " + fieldName);
        }
    }


}