const axios = require('axios');

async function testInsights(courseTitle) {
    console.log(`\n--- Testing Insights for: ${courseTitle} ---`);
    try {
        const response = await axios.post('http://localhost:5000/api/ai/get-course-insights', {
            courseTitle: courseTitle
        });
        console.log('Response:', JSON.stringify(response.data, null, 2));
    } catch (error) {
        console.error('Error:', error.message);
        if (error.response) {
            console.error('Data:', error.response.data);
        }
    }
}

async function runTests() {
    // These tests assume the server is running on localhost:5000
    // If not, we'll see connection errors which is expected if I can't start the server
    await testInsights('React.js Masterclass');
    await testInsights('Introduction to Python');
    await testInsights('Advanced Cybersecurity');
}

runTests();
