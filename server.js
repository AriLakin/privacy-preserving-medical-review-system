const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// Serve the main page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// API endpoint to get deployment info
app.get('/api/deployment-info', (req, res) => {
    try {
        const fs = require('fs');
        const deploymentPath = path.join(__dirname, 'deployment-info.json');

        if (fs.existsSync(deploymentPath)) {
            const deploymentInfo = JSON.parse(fs.readFileSync(deploymentPath, 'utf8'));
            res.json(deploymentInfo);
        } else {
            res.status(404).json({
                error: 'Deployment info not found. Please deploy the contract first.'
            });
        }
    } catch (error) {
        res.status(500).json({
            error: 'Failed to read deployment info: ' + error.message
        });
    }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        service: 'Anonymous Medical Review Platform'
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Server error:', err);
    res.status(500).json({
        error: 'Internal server error',
        message: err.message
    });
});

// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({
        error: 'Endpoint not found',
        path: req.originalUrl
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`🏥 Anonymous Medical Review Platform running on port ${PORT}`);
    console.log(`📱 Local: http://localhost:${PORT}`);
    console.log(`🌐 Access the application at the above URL`);

    if (process.env.NODE_ENV !== 'production') {
        console.log(`\n🔧 Development mode active`);
        console.log(`📝 Deploy contract: npm run deploy`);
        console.log(`🧪 Run tests: npm test`);
    }
});

module.exports = app;