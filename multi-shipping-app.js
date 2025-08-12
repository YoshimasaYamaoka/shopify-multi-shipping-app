import express from 'express';
import crypto from 'crypto';

const app = express();
const PORT = process.env.PORT || 3000;

// Shopify App Configuration
const SHOPIFY_API_KEY = 'e518a7b3f814fc1da04e6952d4fee9d2';
const SHOPIFY_API_SECRET = 'b4026b91f0ca358f6ead9cd68777b123';
const APP_URL = 'https://shopify-multi-shipping-app.onrender.com';

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

// CORS and Security Headers
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('X-Frame-Options', 'ALLOWALL');
  res.header('Content-Security-Policy', "frame-ancestors *;");
  next();
});

// Root route with OAuth handling
app.get('/', (req, res) => {
  if (req.query.shop) {
    const shop = req.query.shop;
    const scopes = 'read_products,write_products,read_orders,write_orders';
    const installUrl = `https://${shop}/admin/oauth/authorize?client_id=${SHOPIFY_API_KEY}&scope=${scopes}&redirect_uri=${APP_URL}/auth/callback&state=12345`;
    return res.redirect(installUrl);
  }
  
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Multi-Shipping App</title>
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; margin: 0; padding: 20px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); min-height: 100vh; }
        .container { max-width: 1200px; margin: 0 auto; background: white; padding: 40px; border-radius: 15px; box-shadow: 0 20px 40px rgba(0,0,0,0.1); }
        h1 { color: #2c3e50; text-align: center; font-size: 2.5em; margin-bottom: 30px; }
        .status { background: #28a745; color: white; padding: 15px; border-radius: 8px; text-align: center; font-weight: bold; margin: 20px 0; }
        .features { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; margin: 30px 0; }
        .feature { background: #f8f9fa; padding: 20px; border-radius: 8px; border-left: 4px solid #007bff; }
        .feature h3 { color: #007bff; margin-top: 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>🚛 Multi-Shipping App for Shopify</h1>
        <div class="status">✅ アプリは正常に動作しています</div>
        
        <div class="features">
          <div class="feature">
            <h3>📦 複数配送先への分割</h3>
            <p>カート内の商品を異なる配送先に簡単に分割できます。贈り物や複数拠点への配送に最適です。</p>
          </div>
          
          <div class="feature">
            <h3>📅 配送日時の個別指定</h3>
            <p>各配送先ごとに異なる配送日時を指定可能。受取人の都合に合わせた柔軟な配送が実現します。</p>
          </div>
          
          <div class="feature">
            <h3>📝 住所管理システム</h3>
            <p>よく使う配送先を保存・管理。次回以降の注文で簡単に選択できます。</p>
          </div>
          
          <div class="feature">
            <h3>💾 Line Item Properties</h3>
            <p>配送情報は各商品のLine Item Propertiesに保存され、管理画面で確認可能です。</p>
          </div>
        </div>
        
        <div style="background: #e3f2fd; padding: 20px; border-radius: 8px; margin-top: 30px;">
          <h3>🔧 インストール方法</h3>
          <ol>
            <li>Shopify管理画面でアプリをインストール</li>
            <li>カートページにボタンが自動的に追加されます</li>
            <li>「複数の住所に送る」ボタンをクリックして使用開始</li>
          </ol>
        </div>
      </div>
    </body>
    </html>
  `);
});

// OAuth Callback
app.get('/auth/callback', async (req, res) => {
  const { shop, hmac, code } = req.query;
  
  // Verify HMAC
  const query = Object.keys(req.query)
    .filter(key => key !== 'hmac')
    .sort()
    .map(key => `${key}=${req.query[key]}`)
    .join('&');
  
  const hash = crypto
    .createHmac('sha256', SHOPIFY_API_SECRET)
    .update(query)
    .digest('hex');
  
  if (hash !== hmac) {
    return res.status(400).send('HMAC validation failed');
  }
  
  // Here you would exchange the code for an access token
  // For now, we'll redirect to success page
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>インストール完了</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: linear-gradient(135deg, #28a745 0%, #20c997 100%); min-height: 100vh; display: flex; align-items: center; justify-content: center; color: white; margin: 0; }
        .container { text-align: center; background: rgba(255,255,255,0.1); padding: 40px; border-radius: 15px; backdrop-filter: blur(10px); }
        .success-icon { font-size: 80px; margin-bottom: 20px; }
        h1 { margin: 20px 0; }
        .button { background: white; color: #28a745; padding: 15px 30px; border-radius: 8px; text-decoration: none; display: inline-block; margin-top: 20px; font-weight: bold; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="success-icon">🎉</div>
        <h1>インストール完了！</h1>
        <p>Multi-Shipping Appが正常にインストールされました</p>
        <p>ショップ: ${shop}</p>
        <a href="https://${shop}/admin/apps" class="button">管理画面に戻る</a>
      </div>
    </body>
    </html>
  `);
});

// API Endpoints for Multi-Shipping

// Get saved addresses
app.get('/api/addresses', (req, res) => {
  // In production, this would fetch from database
  res.json({
    addresses: [
      {
        id: 1,
        name: '山田太郎',
        address1: '東京都渋谷区',
        address2: '1-1-1',
        city: '渋谷',
        province: '東京都',
        zip: '150-0001',
        country: 'JP',
        phone: '03-1234-5678'
      }
    ]
  });
});

// Save shipping configuration
app.post('/api/shipping-config', (req, res) => {
  const { cartItems, shippingGroups } = req.body;
  
  console.log('Received shipping configuration:', {
    cartItems,
    shippingGroups
  });
  
  // Process and save the configuration
  // In production, this would create draft orders or update cart
  
  res.json({
    success: true,
    message: '配送設定が保存されました',
    redirectUrl: '/cart'
  });
});

// Serve static assets (JavaScript for cart page)
app.get('/multi-shipping.js', (req, res) => {
  res.type('application/javascript');
  res.send(`
    (function() {
      // Multi-Shipping Cart Button Script
      console.log('Multi-Shipping App loaded');
      
      // Wait for DOM to be ready
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
      } else {
        init();
      }
      
      function init() {
        // Find cart form or checkout button
        const cartForm = document.querySelector('form[action="/cart"]') || 
                        document.querySelector('.cart-drawer') ||
                        document.querySelector('#cart');
        
        if (!cartForm) {
          console.log('Cart form not found, retrying...');
          setTimeout(init, 1000);
          return;
        }
        
        // Create multi-shipping button
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'btn multi-shipping-btn';
        button.innerHTML = '📦 複数の住所に送る';
        button.style.cssText = 'background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 12px 24px; border: none; border-radius: 8px; font-size: 16px; font-weight: bold; cursor: pointer; margin: 10px 0; width: 100%;';
        
        // Find checkout button and insert our button before it
        const checkoutBtn = cartForm.querySelector('[name="checkout"], [type="submit"], .checkout-button');
        if (checkoutBtn) {
          checkoutBtn.parentNode.insertBefore(button, checkoutBtn);
        } else {
          cartForm.appendChild(button);
        }
        
        // Add click handler
        button.addEventListener('click', function() {
          openMultiShippingModal();
        });
      }
      
      function openMultiShippingModal() {
        // Create modal overlay
        const overlay = document.createElement('div');
        overlay.className = 'multi-shipping-overlay';
        overlay.style.cssText = 'position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); z-index: 9999; display: flex; align-items: center; justify-content: center;';
        
        // Create modal content
        const modal = document.createElement('div');
        modal.className = 'multi-shipping-modal';
        modal.style.cssText = 'background: white; border-radius: 15px; padding: 30px; width: 90%; max-width: 800px; max-height: 80vh; overflow-y: auto;';
        
        modal.innerHTML = \`
          <h2 style="color: #2c3e50; margin-top: 0;">🚛 複数配送先の設定</h2>
          <p style="color: #666;">カート内の商品を複数の住所に分けて配送できます。</p>
          
          <div id="shipping-groups" style="margin: 20px 0;">
            <div class="shipping-group" style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin-bottom: 15px;">
              <h3 style="color: #007bff; margin-top: 0;">配送先 1</h3>
              <input type="text" placeholder="お名前" style="width: 100%; padding: 8px; margin: 5px 0; border: 1px solid #ddd; border-radius: 4px;">
              <input type="text" placeholder="郵便番号" style="width: 100%; padding: 8px; margin: 5px 0; border: 1px solid #ddd; border-radius: 4px;">
              <input type="text" placeholder="住所" style="width: 100%; padding: 8px; margin: 5px 0; border: 1px solid #ddd; border-radius: 4px;">
              <input type="date" placeholder="配送希望日" style="width: 100%; padding: 8px; margin: 5px 0; border: 1px solid #ddd; border-radius: 4px;">
            </div>
          </div>
          
          <button onclick="addShippingGroup()" style="background: #28a745; color: white; padding: 10px 20px; border: none; border-radius: 6px; cursor: pointer; margin-right: 10px;">➕ 配送先を追加</button>
          <button onclick="saveMultiShipping()" style="background: #007bff; color: white; padding: 10px 20px; border: none; border-radius: 6px; cursor: pointer; margin-right: 10px;">💾 保存して進む</button>
          <button onclick="closeModal()" style="background: #6c757d; color: white; padding: 10px 20px; border: none; border-radius: 6px; cursor: pointer;">✖ キャンセル</button>
        \`;
        
        overlay.appendChild(modal);
        document.body.appendChild(overlay);
        
        // Add global functions for buttons
        window.addShippingGroup = function() {
          const groups = document.getElementById('shipping-groups');
          const count = groups.children.length + 1;
          const newGroup = document.createElement('div');
          newGroup.className = 'shipping-group';
          newGroup.style.cssText = 'background: #f8f9fa; padding: 15px; border-radius: 8px; margin-bottom: 15px;';
          newGroup.innerHTML = \`
            <h3 style="color: #007bff; margin-top: 0;">配送先 \${count}</h3>
            <input type="text" placeholder="お名前" style="width: 100%; padding: 8px; margin: 5px 0; border: 1px solid #ddd; border-radius: 4px;">
            <input type="text" placeholder="郵便番号" style="width: 100%; padding: 8px; margin: 5px 0; border: 1px solid #ddd; border-radius: 4px;">
            <input type="text" placeholder="住所" style="width: 100%; padding: 8px; margin: 5px 0; border: 1px solid #ddd; border-radius: 4px;">
            <input type="date" placeholder="配送希望日" style="width: 100%; padding: 8px; margin: 5px 0; border: 1px solid #ddd; border-radius: 4px;">
          \`;
          groups.appendChild(newGroup);
        };
        
        window.saveMultiShipping = function() {
          alert('配送設定を保存しています...');
          // Here we would send data to server
          closeModal();
        };
        
        window.closeModal = function() {
          overlay.remove();
        };
      }
    })();
  `);
});

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok',
    app: 'multi-shipping',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Multi-Shipping App running on port ${PORT}`);
  console.log(`📦 Ready to handle multiple shipping addresses`);
  console.log(`🔗 App URL: ${APP_URL}`);
});