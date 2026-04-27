import axios from 'axios';
const API_BASE = 'http://127.0.0.1:5000/api';

async function test() {
    try {
        console.log('Testing Momentum API...');
        const res = await axios.get(`${API_BASE}/momentum`);
        console.log('Response:', res.data);
    } catch (err) {
        console.log('Error (Expected if no token):', err.response?.status || err.message);
    }
}

test();
