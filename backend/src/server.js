const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const swaggerUi = require('swagger-ui-express');

// Load environment variables before other imports
dotenv.config();

// Now import modules that may depend on environment variables
const swaggerDocs = require('./config/swaggerConfig'); // <--- CORRECTED
const authRoutes = require('./routes/authRoutes');     // <--- CORRECTED
const employeeRoutes = require('./routes/employeeRoutes'); // <--- CORRECTED
const app = express();
const PORT = process.env.CONTAINER_PORT || 1234;
const HOST_PORT = process.env.HOST_PORT || 4321;

// Middleware
app.use(cors());
app.use(express.json());

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/employees', employeeRoutes);

// Swagger API Documentation Route
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

// Root Endpoint
app.get('/', (req, res) => res.send('Mini-MES API is running...'));

// Start Server
app.listen(PORT, () => {
  console.log('-------------------------------------------------------');
  console.log(`✅ Server is running and listening on container port: ${PORT}`);
  console.log(`🚀 Access the application from your browser at: http://localhost:${HOST_PORT}`);
  console.log(`📚 Swagger API documentation available at: http://localhost:${HOST_PORT}/api-docs`);
  console.log('-------------------------------------------------------');
});