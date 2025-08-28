#!/bin/sh

# Replace placeholders in config.js with actual environment variables
sed -i "s|__VITE_SUPABASE_URL__|${VITE_SUPABASE_URL}|g" /app/dist/config.js
sed -i "s|__VITE_SUPABASE_ANON_KEY__|${VITE_SUPABASE_ANON_KEY}|g" /app/dist/config.js
sed -i "s|__VITE_API_URL__|${VITE_API_URL}|g" /app/dist/config.js
sed -i "s|__VITE_OPENBB_API_KEY__|${VITE_OPENBB_API_KEY}|g" /app/dist/config.js

echo "Environment variables injected into config.js"
cat /app/dist/config.js

# Start the serve command
exec serve -s dist -l 3000