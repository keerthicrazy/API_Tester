package com.ocbc.api.service;

import io.restassured.response.Response;
import io.restassured.specification.RequestSpecification;
import io.restassured.http.Headers;
import io.restassured.http.Header;
import io.restassured.mapper.ObjectMapperType;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.net.URL;
import java.net.MalformedURLException;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.Map;
import lombok.Data;
import lombok.Builder;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

public class PostAppserverbptopuprequestServiceService extends BaseRestService {

    private URL hostAddress;
    private Map<String, String> customHeaders = new HashMap<String, String>() {{
                put("token", "t7Wz$H@K&M)PqTxVzYrBuEw3r6!C^F*I-LnQoStVxZa3u6x9b/C?E(H+Md");
                put("Content-Type", "application/json");
            }};
    private Response response;

    public PostAppserverbptopuprequestServiceService() {
        try {
            String appUrl = appConfig.get("internetbanking", "msBaseUrl");
            hostAddress = new URL(appUrl);
        } catch (MalformedURLException e) {
            throw new RuntimeException(e.getMessage());
        }
    }

    private List<Header> setupHeaders(String accessToken) {
        List<Header> headers = new ArrayList<>();
        
        // Add default Content-Type if no custom headers provided
        if (customHeaders == null || customHeaders.isEmpty()) {
            headers.add(new Header("Content-Type", "application/json"));
            System.out.println("No custom headers provided, using default Content-Type");
        } else {
            // Add all custom headers from frontend
            System.out.println("Adding custom headers from frontend:");
            for (Map.Entry<String, String> entry : customHeaders.entrySet()) {
                Header header = new Header(entry.getKey(), entry.getValue());
                headers.add(header);
                System.out.println("  - " + entry.getKey() + ": " + entry.getValue());
            }
        }
        
        System.out.println("Total headers created: " + headers.size());
        return headers;
    }

    private String generateCorrelationId() {
        return UUID.randomUUID().toString();
    }

    // Method for requests that require a body (POST, PUT, PATCH)
    public Response post(String accessToken, PostAppserverbptopuprequestServiceRequest requestBody) {
        List<Header> headers = setupHeaders(accessToken);
        RequestSpecification requestSpecification = baseRequestSpec()
                .headers(new Headers(headers))
                .body(requestBody, ObjectMapperType.GSON);
        this.response = post(requestSpecification, hostAddress.toString());
        return this.response;
    }



    public Response post(String accessToken, PostAppserverbptopuprequestServiceRequest requestBody, String endPointURL) {
        List<Header> headers = setupHeaders(accessToken);
        RequestSpecification requestSpecification = baseRequestSpec()
                .headers(new Headers(headers))
                .body(requestBody, ObjectMapperType.GSON);
        this.response = post(requestSpecification, endPointURL);
        return this.response;
    }



    // Error schema validation methods


    // Method to set response (called from step definitions)
    public void setResponse(Response response) {
        this.response = response;
    }

    // Success schema validation method
    public void validateSuccessSchema() {
        // This method validates success responses against the success schema
        if (response == null) {
            throw new RuntimeException("Response is null");
        }
        if (response.getBody() == null) {
            throw new RuntimeException("Response body is null");
        }
        
        // Validate response against the generated POJO schema
        try {
            PostAppserverbptopuprequestServiceResponseData responseData = response.getBody().as(PostAppserverbptopuprequestServiceResponseData.class, ObjectMapperType.GSON);
            if (responseData == null) {
                throw new RuntimeException("Failed to deserialize response to PostAppserverbptopuprequestServiceResponseData");
            }
            
            // Basic validation passed - response successfully deserialized to POJO
            System.out.println("Response schema validation successful - response matches PostAppserverbptopuprequestServiceResponseData schema");
        } catch (Exception e) {
            throw new RuntimeException("Response schema validation failed: " + e.getMessage());
        }
    }

    // Helper method to get response data from POJO
    public PostAppserverbptopuprequestServiceResponseData getResponseData() {
        if (response == null) {
            throw new RuntimeException("Response is null");
        }
        return response.getBody().as(PostAppserverbptopuprequestServiceResponseData.class, ObjectMapperType.GSON);
    }

    // Embedded POJO Classes
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
    public static class PostAppserverbptopuprequestServiceRequest {
        private String topupType;
        private String operator;
        private String beneficiaryNumber;
        private String transactionAmount;
        private String okTransactionId;
        private String transactionTime;
        private String backendNumber;
        private String sourceNumber;
        private String comments;
        private String referenceNo;
        private Boolean isELOAD;
        private Integer kickBack;
        private String productId;
    }
@Data
@NoArgsConstructor
@AllArgsConstructor
    public static class PostAppserverbptopuprequestServiceResponse {
        private Integer code;
        private Boolean error;
        private String msg;
        private String data;
    }
    // Response POJO for schema validation
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public static class PostAppserverbptopuprequestServiceResponseData {
        @JsonProperty(required = true)
        private Integer code;
        @JsonProperty(required = true)
        private Boolean error;
        @JsonProperty(required = true)
        private String msg;
        @JsonProperty(required = true)
        private String data;
    }

}