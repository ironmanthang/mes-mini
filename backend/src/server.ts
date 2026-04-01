import app from './app.js';

const PORT = Number(process.env.PORT || process.env.CONTAINER_PORT || 3000);
const HOST_PORT = process.env.HOST_PORT || 5000;

// Start Server
app.listen(PORT, '0.0.0.0', () => {
    console.log('-------------------------------------------------------');
    console.log(`Server running internally on port: ${PORT} (Bound to 0.0.0.0)`);
    console.log(`Access from browser: http://localhost:${HOST_PORT}/api-docs`);
    console.log('------------------------------------------------------- :3');
});
