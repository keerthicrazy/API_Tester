
import io.restassured.response.Response;
import io.restassured.specification.RequestSpecification;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.restassured.mapper.ObjectMapperType;
import com.fasterxml.jackson.databind.MapperFeature;
import lombok.SneakyThrows;
import lombok.Data;
import com.fasterxml.jackson.annotation.JsonProperty;
import org.json.simple.JSONObject;
import org.json.simple.JSONArray;
import org.ocbcqa.core.base.service.BaseRestService;
import java.lang.reflect.Type;
import java.net.URL;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import com.fasterxml.jackson.core.JsonProcessingException;
import org.json.simple.parser.ParseException;
import org.json.simple.parser.JSONParser;
import java.net.MalformedURLException;
import org.ocbcqa.core.report.Logger;


public class ConsentProvisionProcessResult extends BaseRestService {
    String endPointUrl = " /v1/ospl/consent/provide/status";
    SuccessResponseData successResponseBody;
    ErrorResponseData errorResponseData;
    RequestBody finalRequestBody;


    private HashMap<String, String> setupHeaders() {
        HashMap<String, String> headers = new HashMap<>();
        
        return headers;
    }

    @SneakyThrows
    public RequestBody requestBody() throws JsonProcessingException {
        ObjectMapper objectMapper = new ObjectMapper();
        objectMapper.configure(MapperFeature.ACCEPT_CASE_INSENSITIVE_PROPERTIES, true);
        return finalRequestBody = objectMapper.readValue(requestBody, RequestBody.class);
    }

    @SneakyThrows
    public RequestBody requestBody(Map<String, String> payLoad) throws JsonProcessingException, ParseException {
        JSONObject reqBody = (JSONObject) new JSONParser().parse(requestBody);
        reqBody.put("consentId", payLoad.get("consentId"));
        reqBody.put("peopleId", payLoad.get("peopleId"));

        ObjectMapper objectMapper = new ObjectMapper();
        objectMapper.configure(MapperFeature.ACCEPT_CASE_INSENSITIVE_PROPERTIES, true);
        return objectMapper.readValue(reqBody.toString(), RequestBody.class);
    }

    public ConsentProvisionProcessResult() {
        try {
            String appUrl = "";            //TODO: please fill in your host url here
            hostAddress = new URL(appUrl);
        } catch (MalformedURLException muException) {
            throw new RuntimeException(muException.getMessage());
        }
    }

    
public Response post() throws JsonProcessingException {
    RequestSpecification requestSpecification = baseRequestSpec()
        .headers(setupHeaders())
        .body(requestBody(), ObjectMapperType.GSON);
    setResponse(post(requestSpecification, endPointUrl));
    return getResponse();
}

    public void serializeSuccessResponse() {
        setSuccessResponseBody(response.getBody().as(SuccessResponseData.class, ObjectMapperType.GSON));
    }

    public void setSuccessResponseBody(SuccessResponseData successResponseBody) {
        this.successResponseBody = successResponseBody;
    }

    public void serializeErrorResponse() {
        setErrorResponseBody(response.getBody().as(ErrorResponseData.class, ObjectMapperType.GSON));
    }

    public void setErrorResponseBody(ErrorResponseData errorResponseData) {
        this.errorResponseData = errorResponseData;
    }

    public SuccessResponseData getSuccessResponseData() {
        return response.as(SuccessResponseData.class);
    }

    public ErrorResponseData getErrorResponseData() {
        return response.as(ErrorResponseData.class);
    }

    public void validateSuccessResponseSchema() {
        validateAgainstSchema(SuccessResponseData.class);
    }

    public void validateErrorResponseSchema() {
        validateAgainstSchema(ErrorResponseData.class);
    }

public JSONObject updateRequestBodyAsPerDataInput(JSONObject reqBody, String fieldName, String action) {
String[] actionField = fieldName.split("\\.");
String key = actionField[0];
String subKey = actionField.length > 1 ? actionField[1] : null;

switch (action.toLowerCase()) {
    case "remove":
      if (subKey != null && reqBody.get(key) instanceof JSONObject) {
        ((JSONObject) reqBody.get(key)).remove(subKey);
      } else {
        reqBody.remove(key);
      }
      break;

    case "null":
      if (subKey != null && reqBody.get(key) instanceof JSONObject) {
        ((JSONObject) reqBody.get(key)).put(subKey, "");
      } else {
        reqBody.put(key, "");
      }
      break;

      default:
        // Optionally handle unknown actions
        throw new IllegalArgumentException("Unsupported action: " + action);
}

return reqBody;
}

public void buildRequestBodywithUserData(Map<String, String> payLoad) throws JsonProcessingException {
ObjectMapper mapper = new ObjectMapper();
Map<String, Object> map = mapper.convertValue(finalRequestBody, Map.class);
mapper.configure(MapperFeature.ACCEPT_CASE_INSENSITIVE_PROPERTIES, true);
finalRequestBody = mapper.readValue(updateRequestBodyAsPerDataInput(new JSONobject(map),payLoad.get("fieldName"),payLoad.get("action")).toString(), RequestBody.class);
}

    @Data
    public static class RequestBody {
    private String consentId;
    private String peopleId;
    }


    @Data
    public static class SuccessResponseData {

        @JsonProperty(value="statusCode")
        private String statusCode;

        @JsonProperty(value="description")
        private String description;

        @JsonProperty(value="sample")
        private Sample sample;

    
            @Data
            public static class Sample {
    
            @JsonProperty(value="status")
            private String status;
    
            @JsonProperty(value="data")
            private Data data;
    
            
                        @Data
                        public static class Data {
            
                    @JsonProperty(value="consentId")
                    private String consentId;
            
                    @JsonProperty(value="peopleld")
                    private String peopleld;
            
                    @JsonProperty(value="cifNo")
                    private String cifNo;
            
                    @JsonProperty(value="referenceNo")
                    private String referenceNo;
            
                    @JsonProperty(value="accounts")
                    private List<Accounts> accounts;
            
                    @JsonProperty(value="tagAllAccounts")
                    private String tagAllAccounts;
            
                        
                                        @Data
                                        public static class Accounts {
                        
                                @JsonProperty(value="productName")
                                private String productName;
                        
                                @JsonProperty(value="maskedAccountNo")
                                private String maskedAccountNo;
                                        }
                        
                        }
            
            }
    
    }


    @Data
    public static class ErrorResponseData {

        @JsonProperty(value="statusCode")
        private String statusCode;

        @JsonProperty(value="description")
        private String description;

        @JsonProperty(value="sample")
        private Object sample;
    }
String requestBody = """
{
  "consentId": "sample-string",
  "peopleId": "sample-string"
}
""";
}