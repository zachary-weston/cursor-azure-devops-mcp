#!/bin/bash

# Cursor-Azure DevOps MCP Server Setup Script

echo "Setting up Cursor-Azure DevOps MCP Server..."

# Install dependencies
echo "Installing dependencies..."
npm install

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
  echo "Creating .env file from template..."
  cp .env.example .env
  echo "Please update the .env file with your Azure DevOps configuration."
else
  echo ".env file already exists."
fi

# Remind user to configure Azure DevOps credentials
echo ""
echo "----------------------------------------"
echo "Setup complete!"
echo ""
echo "Next steps:"
echo "1. Update your .env file with Azure DevOps credentials"
echo "2. Test your connection with: npm run test-connection"
echo "3. Start the server with: npm start"
echo "4. For development mode, use: npm run dev"
echo "----------------------------------------" 