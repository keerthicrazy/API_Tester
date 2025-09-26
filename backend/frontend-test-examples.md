# Frontend Test Examples for CORS Proxy Server

## 🚀 Quick Setup

Make sure your proxy server is running:
```bash
# Switch to development (localhost)
node switch-env.js development

# Start server
node server.js
```

## 📍 Base URLs

- **Development**: `http://localhost:3001`
- **Production**: `http://10.106.246.81:3001`

## 🔍 Test API Endpoints

### Free Public APIs for Testing:
- **JSONPlaceholder**: `https://jsonplaceholder.typicode.com`
- **ReqRes**: `https://reqres.in/api`
- **HTTPBin**: `https://httpbin.org`
- **JSON Server**: `https://my-json-server.typicode.com`

---

## 1️⃣ GET Requests

### Basic GET Request
```javascript
// Test GET request
const response = await fetch('http://localhost:3001/proxy?url=https://jsonplaceholder.typicode.com/posts/1');
const data = await response.json();
console.log(data);
```

### GET with Query Parameters
```javascript
// GET with query params
const response = await fetch('http://localhost:3001/proxy?url=https://reqres.in/api/users?page=2');
const data = await response.json();
console.log(data);
```

### GET Single User
```javascript
// GET single user
const response = await fetch('http://localhost:3001/proxy?url=https://reqres.in/api/users/2');
const data = await response.json();
console.log(data);
```

---

## 2️⃣ POST Requests

### POST with JSON Body
```javascript
// POST with JSON
const postData = {
  title: "Test Post",
  body: "This is a test post",
  userId: 1
};

const response = await fetch('http://localhost:3001/proxy?url=https://jsonplaceholder.typicode.com/posts', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(postData)
});

const data = await response.json();
console.log(data);
```

### POST with Form Data
```javascript
// POST with form data
const formData = new FormData();
formData.append('name', 'John Doe');
formData.append('job', 'Developer');

const response = await fetch('http://localhost:3001/proxy?url=https://httpbin.org/post', {
  method: 'POST',
  body: formData
});

const data = await response.json();
console.log(data);
```

### POST with URL-encoded Data
```javascript
// POST with URL-encoded data
const urlEncodedData = new URLSearchParams();
urlEncodedData.append('name', 'John Doe');
urlEncodedData.append('job', 'Developer');

const response = await fetch('http://localhost:3001/proxy?url=https://httpbin.org/post', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded'
  },
  body: urlEncodedData
});

const data = await response.json();
console.log(data);
```

### POST with Plain Text
```javascript
// POST with plain text
const response = await fetch('http://localhost:3001/proxy?url=https://httpbin.org/post', {
  method: 'POST',
  headers: {
    'Content-Type': 'text/plain'
  },
  body: 'Hello World! This is plain text.'
});

const data = await response.json();
console.log(data);
```

---

## 3️⃣ PUT Requests

### PUT with JSON Body
```javascript
// PUT request
const putData = {
  title: "Updated Post",
  body: "This post has been updated",
  userId: 1
};

const response = await fetch('http://localhost:3001/proxy?url=https://jsonplaceholder.typicode.com/posts/1', {
  method: 'PUT',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(putData)
});

const data = await response.json();
console.log(data);
```

### PUT with Form Data
```javascript
// PUT with form data
const formData = new FormData();
formData.append('name', 'Jane Smith');
formData.append('job', 'Senior Developer');

const response = await fetch('http://localhost:3001/proxy?url=https://httpbin.org/put', {
  method: 'PUT',
  body: formData
});

const data = await response.json();
console.log(data);
```

---

## 4️⃣ DELETE Requests

### Basic DELETE Request
```javascript
// DELETE request
const response = await fetch('http://localhost:3001/proxy?url=https://jsonplaceholder.typicode.com/posts/1', {
  method: 'DELETE'
});

const data = await response.json();
console.log(data);
```

---

## 5️⃣ PATCH Requests

### PATCH with JSON Body
```javascript
// PATCH request
const patchData = {
  title: "Partially Updated Post"
};

const response = await fetch('http://localhost:3001/proxy?url=https://jsonplaceholder.typicode.com/posts/1', {
  method: 'PATCH',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(patchData)
});

const data = await response.json();
console.log(data);
```

---

## 6️⃣ Complete Frontend Test Suite

```javascript
// Complete test suite for frontend
class ProxyTester {
  constructor(baseUrl = 'http://localhost:3001') {
    this.baseUrl = baseUrl;
  }

  async testGet() {
    console.log('🧪 Testing GET request...');
    const response = await fetch(`${this.baseUrl}/proxy?url=${encodeURIComponent('https://jsonplaceholder.typicode.com/posts/1')}`);
    const data = await response.json();
    console.log('✅ GET successful:', data.success);
    return data;
  }

  async testPost() {
    console.log('🧪 Testing POST request...');
    const postData = {
      title: "Test Post",
      body: "This is a test post",
      userId: 1
    };

    const response = await fetch(`${this.baseUrl}/proxy?url=${encodeURIComponent('https://jsonplaceholder.typicode.com/posts')}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(postData)
    });

    const data = await response.json();
    console.log('✅ POST successful:', data.success);
    return data;
  }

  async testPut() {
    console.log('🧪 Testing PUT request...');
    const putData = {
      title: "Updated Post",
      body: "This post has been updated",
      userId: 1
    };

    const response = await fetch(`${this.baseUrl}/proxy?url=${encodeURIComponent('https://jsonplaceholder.typicode.com/posts/1')}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(putData)
    });

    const data = await response.json();
    console.log('✅ PUT successful:', data.success);
    return data;
  }

  async testDelete() {
    console.log('🧪 Testing DELETE request...');
    const response = await fetch(`${this.baseUrl}/proxy?url=${encodeURIComponent('https://jsonplaceholder.typicode.com/posts/1')}`, {
      method: 'DELETE'
    });

    const data = await response.json();
    console.log('✅ DELETE successful:', data.success);
    return data;
  }

  async testPatch() {
    console.log('🧪 Testing PATCH request...');
    const patchData = {
      title: "Partially Updated Post"
    };

    const response = await fetch(`${this.baseUrl}/proxy?url=${encodeURIComponent('https://jsonplaceholder.typicode.com/posts/1')}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(patchData)
    });

    const data = await response.json();
    console.log('✅ PATCH successful:', data.success);
    return data;
  }

  async runAllTests() {
    console.log('🚀 Starting comprehensive proxy tests...');
    
    try {
      await this.testGet();
      await this.testPost();
      await this.testPut();
      await this.testDelete();
      await this.testPatch();
      
      console.log('🎉 All tests completed successfully!');
    } catch (error) {
      console.error('❌ Test failed:', error);
    }
  }
}

// Usage in frontend
const tester = new ProxyTester();
tester.runAllTests();
```

---

## 7️⃣ Axios Examples

```javascript
// Using Axios for requests
import axios from 'axios';

const PROXY_BASE = 'http://localhost:3001/proxy';

// GET request
const getResponse = await axios.get(`${PROXY_BASE}?url=${encodeURIComponent('https://jsonplaceholder.typicode.com/posts/1')}`);

// POST request
const postResponse = await axios.post(`${PROXY_BASE}?url=${encodeURIComponent('https://jsonplaceholder.typicode.com/posts')}`, {
  title: "Test Post",
  body: "This is a test post",
  userId: 1
}, {
  headers: {
    'Content-Type': 'application/json'
  }
});

// PUT request
const putResponse = await axios.put(`${PROXY_BASE}?url=${encodeURIComponent('https://jsonplaceholder.typicode.com/posts/1')}`, {
  title: "Updated Post",
  body: "This post has been updated",
  userId: 1
}, {
  headers: {
    'Content-Type': 'application/json'
  }
});

// DELETE request
const deleteResponse = await axios.delete(`${PROXY_BASE}?url=${encodeURIComponent('https://jsonplaceholder.typicode.com/posts/1')}`);
```

---

## 8️⃣ Error Handling Examples

```javascript
// Error handling for proxy requests
async function makeProxyRequest(url, options = {}) {
  try {
    const proxyUrl = `http://localhost:3001/proxy?url=${encodeURIComponent(url)}`;
    
    const response = await fetch(proxyUrl, {
      method: options.method || 'GET',
      headers: options.headers || {},
      body: options.body
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.success) {
      throw new Error(`Proxy error: ${data.message}`);
    }

    return data;
  } catch (error) {
    console.error('Proxy request failed:', error);
    throw error;
  }
}

// Usage
try {
  const result = await makeProxyRequest('https://jsonplaceholder.typicode.com/posts/1');
  console.log('Success:', result.data);
} catch (error) {
  console.error('Request failed:', error.message);
}
```

---

## 9️⃣ Content-Type Examples

```javascript
// Different content types for POST requests

// 1. JSON
const jsonData = { name: "John", age: 30 };
const jsonResponse = await fetch('http://localhost:3001/proxy?url=https://httpbin.org/post', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(jsonData)
});

// 2. Form Data
const formData = new FormData();
formData.append('name', 'John');
formData.append('age', '30');
const formResponse = await fetch('http://localhost:3001/proxy?url=https://httpbin.org/post', {
  method: 'POST',
  body: formData
});

// 3. URL Encoded
const urlData = new URLSearchParams();
urlData.append('name', 'John');
urlData.append('age', '30');
const urlResponse = await fetch('http://localhost:3001/proxy?url=https://httpbin.org/post', {
  method: 'POST',
  headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  body: urlData
});

// 4. Plain Text
const textResponse = await fetch('http://localhost:3001/proxy?url=https://httpbin.org/post', {
  method: 'POST',
  headers: { 'Content-Type': 'text/plain' },
  body: 'Hello World!'
});
```

---

## 🔧 Environment Switching

```javascript
// Switch between development and production
const environments = {
  development: 'http://localhost:3001',
  production: 'http://10.106.246.81:3001'
};

const currentEnv = 'development'; // Change this to switch environments
const proxyBase = environments[currentEnv];

// Use in your requests
const response = await fetch(`${proxyBase}/proxy?url=${encodeURIComponent('https://jsonplaceholder.typicode.com/posts/1')}`);
```

---

## 📝 Response Format

All proxy responses follow this format:

```javascript
{
  "success": true,
  "status": 200,
  "statusText": "OK",
  "headers": {
    "content-type": "application/json",
    "cache-control": "no-cache"
  },
  "data": {
    // The actual response data from the target API
  },
  "proxyInfo": {
    "timestamp": "2025-08-04T14:30:00.000Z",
    "responseTime": 245,
    "targetUrl": "https://jsonplaceholder.typicode.com/posts/1"
  }
}
```

---

## 🚨 Common Issues & Solutions

### 1. CORS Issues
- The proxy handles CORS automatically
- Make sure the proxy server is running
- Check that the target URL is accessible

### 2. Content-Type Issues
- Always set the correct `Content-Type` header
- For JSON: `'Content-Type': 'application/json'`
- For form data: Let the browser set it automatically
- For URL-encoded: `'Content-Type': 'application/x-www-form-urlencoded'`

### 3. Request Body Issues
- Make sure to stringify JSON data: `JSON.stringify(data)`
- For form data, use `FormData` or `URLSearchParams`
- Don't stringify form data

### 4. URL Encoding
- Always encode the target URL: `encodeURIComponent(url)`
- The proxy URL should be: `proxy?url=${encodedTargetUrl}`

---

## 🎯 Quick Test Commands

```bash
# Test GET
curl "http://localhost:3001/proxy?url=https://jsonplaceholder.typicode.com/posts/1"

# Test POST
curl -X POST "http://localhost:3001/proxy?url=https://jsonplaceholder.typicode.com/posts" \
  -H "Content-Type: application/json" \
  -d '{"title":"Test","body":"Content","userId":1}'

# Test PUT
curl -X PUT "http://localhost:3001/proxy?url=https://jsonplaceholder.typicode.com/posts/1" \
  -H "Content-Type: application/json" \
  -d '{"title":"Updated","body":"Content","userId":1}'

# Test DELETE
curl -X DELETE "http://localhost:3001/proxy?url=https://jsonplaceholder.typicode.com/posts/1"
``` 