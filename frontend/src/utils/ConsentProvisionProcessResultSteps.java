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

public class ConsentProvisionProcessResultSteps extends BaseStep {
    private ConsentProvisionProcessResult consentProvisionProcessResult = new ConsentProvisionProcessResult();
    CustomSoftAssert customSoftAssert = new CustomSoftAssert();
    private Response response;
    private ConsentProvisionProcessResult.SuccessResponseData successResponse; 
    private ConsentProvisionProcessResult.ErrorResponseData errorResponse;

    @Given("the user send post request to consentProvisionProcessResult service endpoint")
    public void sendRequestToServiceEndpoint(DataTable dt) throws JsonProcessingException, ParseException {
    List<Map<String, String>> userData= dt.asMaps(String.class, String.class);
    consentProvisionProcessResult.requestBody(userData.get(0));
    Optional.ofNullable(userData.get(0).get("action"))
    .filter(action -> action.equalsIgnoreCase("remove") || action.equalsIgnoreCase("null"))
    .ifPresent(action -> {
        try {
            consentProvisionProcessResult.buildRequestBodywithUSerData(userData.get(0));
        } catch (JsonProcessingException e) {
            throw new RuntimeException(e);
        }
    });
        response = consentProvisionProcessResult.post();
        Logger.info(response.prettyPrint());
    }

    @Then("the user should get status code for consentProvisionProcessResult endpoint as {int}")
    public void verifystatusCode(int expectedStatusCode) {
        Assert.assertEquals(response.getStatusCode(),expectedStatusCode);
    }

    @Then("the user verify the success schema of the response returned as expected for consentProvisionProcessResult service endpoint")
    public void verifySuccessSchema() {
        consentProvisionProcessResult.serializeSuccessResponse();
        consentProvisionProcessResult.validateSuccessResponseSchema();
    }

    @And("the user verify the success response body should contain valid data for consentProvisionProcessResult service endpoint")
    public void verifySuccessResponseBody() {
        // Add specific assertions for success response fields here
        // Example: customSoftAssert.assertEquals(successResponse.getFieldName());
    }

    @Then("the user verify the error schema of the response returned as expected for consentProvisionProcessResult service endpoint")
    public void verifyErrorSchema() {
        consentProvisionProcessResult.serializeErrorResponse();
        consentProvisionProcessResult.validateErrorResponseSchema();
    }

    @And("^the user verify the error response body should contain valid data for consentProvisionProcessResult service endpoint with (.+) and (.+)$")
    public void verifyErrorResponseBody(String errorCode, String errorMessage) {
        // Add specific assertions for error response fields here
        // Example: customSoftAssert.assertEquals(errorResponse.getErrorMessage(), errorCode);
    }
}