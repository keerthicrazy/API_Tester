import {Endpoint} from './bddCodeGenerator';

export const sampleEndpoints: Endpoint[] = [
    {
        method: 'POST',
        path: '/api/users',
        name: 'create_user',
        description: 'Create a new user',
        requestBody: {
            name: 'John Doe',
            email: 'john@example.com',
            age: 30
        },
        responseBody: {
            id: 1,
            name: 'John Doe',
            email: 'john@example.com',
            age: 30,
            createdAt: '2024-01-01T00:00:00Z'
        }
    },
    {
        method: 'GET',
        path: '/api/users/{id}',
        name: 'get_user_by_id',
        description: 'Get user by ID',
        parameters: [
            {
                name: 'id',
                type: 'integer',
                required: true,
                description: 'User ID'
            }
        ],
        responseBody: {
            id: 1,
            name: 'John Doe',
            email: 'john@example.com',
            age: 30,
            createdAt: '2024-01-01T00:00:00Z'
        }
    },
    {
        method: 'PUT',
        path: '/api/users/{id}',
        name: 'update_user',
        description: 'Update user by ID',
        parameters: [
            {
                name: 'id',
                type: 'integer',
                required: true,
                description: 'User ID'
            }
        ],
        requestBody: {
            name: 'Jane Doe',
            email: 'jane@example.com',
            age: 25
        },
        responseBody: {
            id: 1,
            name: 'Jane Doe',
            email: 'jane@example.com',
            age: 25,
            updatedAt: '2024-01-02T00:00:00Z'
        }
    },
    {
        method: 'DELETE',
        path: '/api/users/{id}',
        name: 'delete_user',
        description: 'Delete user by ID',
        parameters: [
            {
                name: 'id',
                type: 'integer',
                required: true,
                description: 'User ID'
            }
        ],
        responseBody: {
            success: true,
            message: 'User deleted successfully'
        }
    }
];

// Sample Base64 response for testing
export const sampleBase64Response = {
    "status": "success",
    "file_name": "user_report.txt",
    "content_type": "text/plain",
    "base64_data": "VGhpcyBpcyBhIHNhbXBsZSB1c2VyIHJlcG9ydCBjb250ZW50LCB3aGljaCBpcyBlbmNvZGVkIGFzIGEgQmFzZTY0IHN0cmluZy4KClRoZSBwdXJwb3NlIG9mIHRoaXMgZmlsZSBpcyB0byBkZW1vbnN0cmF0ZSBob3cgYSBsYXJnZSBzdHJpbmcgY2FuIGJlIGVuY29kZWQgdXNpbmcgQmFzZTY0IGZvciB0cmFuc3BvcnQgb3Igc3RvcmFnZSBvdmVyIG5ldHdvcmsuCgpFeGFtcGxlIGxpbmVzOgoKMS4gVXNlciBOYW1lOiBKb2huIERvZQoyLiBFbWFpbDogam9obkBleGFtcGxlLmNvbQozLiBSZXBvcnQgRGF0ZTogMjAyNS0wOC0wNQo0LiBUb3RhbCBMb2dpbnM6IDM4MgoKVGhpcyBpbmZvcm1hdGlvbiBpcyBzZW5zaXRpdmUgYW5kIHNob3VsZCBvbmx5IGJlIGFjY2Vzc2VkIGJ5IGF1dGhvcml6ZWQgdXNlcnMuClBsZWFzZSBkbyBub3Qgc2hhcmUgdGhpcyBkYXRhIHdpdGhvdXQgcHJvcGVyIGF1dGhvcml6YXRpb24uCgpUaGFuayB5b3UgZm9yIHVzaW5nIHRoaXMgYXBpLgo="
};

// Large JSON response for testing
export const sampleLargeJsonResponse = {
    "status": "success",
    "data": {
        "users": Array.from({length: 100}, (_, i) => ({
            id: i + 1,
            name: `User ${i + 1}`,
            email: `user${i + 1}@example.com`,
            profile: {
                bio: `This is a very long bio for user ${i + 1}. It contains a lot of information about the user's background, interests, and activities. This text is intentionally long to test the large content handling functionality in the response panel.`,
                avatar: `https://example.com/avatars/user${i + 1}.jpg`,
                preferences: {
                    theme: "dark",
                    notifications: true,
                    language: "en",
                    timezone: "UTC"
                }
            },
            posts: Array.from({length: 10}, (_, j) => ({
                id: j + 1,
                title: `Post ${j + 1} by User ${i + 1}`,
                content: `This is post number ${j + 1} by user ${i + 1}. It contains a lot of content to make the response large enough to test the "Show Full" functionality. The content includes various details about the post, including timestamps, tags, and other metadata.`,
                timestamp: new Date().toISOString(),
                tags: ["sample", "test", "large-content"]
            }))
        }))
    }
};

// Base64 image response
export const sampleBase64ImageResponse = {
    "status": "success",
    "file_name": "sample_image.png",
    "content_type": "image/png",
    "base64_data": "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=="
}; 