import app from './app.js';

const PORT = process.env.PORT || process.env.CONTAINER_PORT || 3000;
const HOST_PORT = process.env.HOST_PORT || 5000;

// Start Server
app.listen(PORT, () => {
    console.log('-------------------------------------------------------');
    console.log(`Server running internally on port: ${PORT}`);
    console.log(`Access from browser: http://localhost:${HOST_PORT}/api-docs`);
    console.log('------------------------------------------------------- :3');
});
