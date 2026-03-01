import fetch from "node-fetch";

async function testHealth() {
    try {
        const res = await fetch("http://localhost:5001/api/health");
        const data = await res.json();
        console.log("Health Check:", data);
    } catch (err) {
        console.error("Health Check Failed:", err.message);
    }
}

testHealth();
