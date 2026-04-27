// Native fetch is available in Node 18+

async function testBadges() {
    try {
        const response = await fetch('http://127.0.0.1:5000/api/companion/message', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                message: "Hello Badge Test Script",
                sessionId: "debug-session-script-" + Date.now(),
                mode: "chat"
            })
        });

        const data = await response.json();
        console.log("Response Status:", response.status);
        console.log("Full Response:", JSON.stringify(data, null, 2));

        if (data.newBadges && data.newBadges.length > 0) {
            console.log("✅ SUCCESS: New Badges Received:", data.newBadges);
        } else {
            console.log("❌ FAILURE: No new badges in response.");
        }
    } catch (error) {
        console.error("Error:", error);
    }
}

testBadges();
