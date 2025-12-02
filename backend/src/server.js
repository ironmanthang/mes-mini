const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const swaggerUi = require('swagger-ui-express');

dotenv.config();

const swaggerDocs = require('./config/swaggerConfig'); 
const authRoutes = require('./routes/authRoutes'); 
const employeeRoutes = require('./routes/employeeRoutes'); 
const roleRoutes = require('./routes/roleRoutes');
const app = express();
const PORT = process.env.CONTAINER_PORT || 1234;
const HOST_PORT = process.env.HOST_PORT || 4321;
const PGADMIN_PORT = process.env.PGADMIN_PORT || 6666;

// Middleware
app.use(cors());
app.use(express.json());

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/roles', roleRoutes);

const swaggerUiOptions = {
  customCss: '.swagger-ui .response .response-col_links { display: none !important; }'
};
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs, swaggerUiOptions));


// Start Server
app.listen(PORT, () => {
  console.log('-------------------------------------------------------');
  console.log(`Server is running and listening on container port: ${PORT}`);
  console.log(`Swagger API documentation available at: http://localhost:${HOST_PORT}/api-docs`);
  console.log(`Pgadmin available at: http://localhost:${PGADMIN_PORT}/`);
  console.log('------------------------------------------------------- :3');
});