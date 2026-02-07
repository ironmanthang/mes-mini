import axios from 'axios';
import process from 'process';

async function run() {
    const API_URL = 'https://mes-mini-backend-433210406598.us-central1.run.app';
    const USERNAME = 'admin';
    const PASSWORD = process.env.SIMULATION_PASSWORD;
    const REQUEST_TIMEOUT = 10000; // 10 seconds

    if (!PASSWORD) {
        console.error('❌ Error: SIMULATION_PASSWORD environment variable is not set.');
        process.exit(1);
    }

    console.log('🚀 Starting Cost Simulation...');
    console.log(`TARGET: ${API_URL}`);

    try {
        // 1. Login
        console.log('🔐 Logging in...');
        const loginRes = await axios({
            method: "POST",
            url: `${API_URL}/api/auth/login`,
            headers: { "Content-Type": "application/json" },
            data: { username: USERNAME, password: PASSWORD },
            timeout: REQUEST_TIMEOUT
        });

        const token = loginRes.data.token;
        console.log('✅ Login Successful.');

        // 2. Loop Actions (2 times)
        for (let i = 1; i <= 2; i++) {
            const trackingNumber = Math.floor(Date.now() / 1000);
            console.log(`\n🔄 [Loop ${i}/2] Updating Profile to ${trackingNumber}...`);

            await axios({
                method: "PUT",
                url: `${API_URL}/api/auth/profile`,
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                data: { address: String(trackingNumber) },
                timeout: REQUEST_TIMEOUT
            });

            console.log(`   ✅ Update ${i} complete.`);

            // Wait 2 seconds
            if (i < 2) await new Promise(r => setTimeout(r, 2000));
        }

        console.log("\n✅ Cost simulation completed successfully.");

    } catch (error) {
        console.error('\n❌ Error running simulation:');
        if (error.response) {
            // Server responded with a status code that falls out of the range of 2xx
            console.error(`   Status: ${error.response.status}`);
            console.error(`   Data: ${JSON.stringify(error.response.data)}`);
        } else if (error.request) {
            // The request was made but no response was received
            console.error('   No response received (Possible timeout or network issue)');
        } else {
            // Something happened in setting up the request that triggered an Error
            console.error(`   Message: ${error.message}`);
        }
        process.exit(1);
    }
}

run();
