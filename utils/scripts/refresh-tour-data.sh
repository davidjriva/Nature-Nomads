#!/bin/bash

# Navigate to top-level directory
cd ../../

# Delete all data in Tours collection
echo 'Deleting all dev data for Tours, Reviews, and Users...'
node ./dev-data/data/import-dev-data.js --delete

# Import all data into Tours collection
echo 'Importing all dev data for Tours, Reviews, and Users...'
node ./dev-data/data/import-dev-data.js --import
