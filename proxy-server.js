const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();

// Proxy middleware for /api routes
app.use('/api', createProxyMiddleware({
  target: 'http://localhost:3004',
  changeOrigin: true,
  logLevel: 'debug',
  onError: (err, req, res) => {
    console.log('Proxy Error:', err.message);
    res.status(500).send('Proxy Error: ' + err.message);
  }
}));

// Serve static files or frontend if needed
app.use(express.static('public'));

const PORT = 80;
app.listen(PORT, () => {
  console.log(`Proxy server running on http://localhost:${PORT}`);
  console.log('API accessible at http://localhost/api');
});