#!/bin/sh

# Debug: Show environment variables (without exposing sensitive values)
echo "Environment variables check:"
echo "VITE_SUPABASE_URL: ${VITE_SUPABASE_URL:+Set}"
echo "VITE_SUPABASE_ANON_KEY: ${VITE_SUPABASE_ANON_KEY:+Set}"
echo "VITE_API_URL: ${VITE_API_URL:+Set}"

# Check if config.js exists
if [ ! -f /app/dist/config.js ]; then
    echo "ERROR: config.js not found in /app/dist/"
    echo "Creating config.js with environment variables..."
    cat > /app/dist/config.js <<EOF
window.ENV = {
  VITE_SUPABASE_URL: '${VITE_SUPABASE_URL}',
  VITE_SUPABASE_ANON_KEY: '${VITE_SUPABASE_ANON_KEY}',
  VITE_API_URL: '${VITE_API_URL}',
  VITE_OPENBB_API_KEY: '${VITE_OPENBB_API_KEY}',
  VITE_VAPID_PUBLIC_KEY: '${VITE_VAPID_PUBLIC_KEY:-BDY9PUZxO1S3O9bJ7-nekjUIFcmQj2ViMYy6Gk30Kytfr4p3l5ii4g55YNqvyqqvvDS938raycn57HzhVinmcJc}',
  VITE_APP_URL: '${VITE_APP_URL:-https://test.signalstrading.app}'
};
EOF
else
    # Replace placeholders in config.js with actual environment variables
    sed -i "s|__VITE_SUPABASE_URL__|${VITE_SUPABASE_URL}|g" /app/dist/config.js
    sed -i "s|__VITE_SUPABASE_ANON_KEY__|${VITE_SUPABASE_ANON_KEY}|g" /app/dist/config.js
    sed -i "s|__VITE_API_URL__|${VITE_API_URL}|g" /app/dist/config.js
    sed -i "s|__VITE_OPENBB_API_KEY__|${VITE_OPENBB_API_KEY}|g" /app/dist/config.js
    sed -i "s|__VITE_VAPID_PUBLIC_KEY__|${VITE_VAPID_PUBLIC_KEY:-BDY9PUZxO1S3O9bJ7-nekjUIFcmQj2ViMYy6Gk30Kytfr4p3l5ii4g55YNqvyqqvvDS938raycn57HzhVinmcJc}|g" /app/dist/config.js
    sed -i "s|__VITE_APP_URL__|${VITE_APP_URL:-https://test.signalstrading.app}|g" /app/dist/config.js
fi

echo "Environment variables injected into config.js"
echo "First 5 lines of config.js:"
head -5 /app/dist/config.js

# Start the serve command
exec serve -s dist -l 3000