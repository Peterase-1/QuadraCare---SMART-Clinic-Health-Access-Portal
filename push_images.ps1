# Build and Push Docker Images
$username = "petros1234"

# Build Server
Write-Host "Building Server Image..."
docker build -t "$username/quadracare-server" ./server

# Build Client
Write-Host "Building Client Image..."
docker build -t "$username/quadracare-client" ./client

# Push Server
Write-Host "Pushing Server Image..."
docker push "$username/quadracare-server"

# Push Client
Write-Host "Pushing Client Image..."
docker push "$username/quadracare-client"

Write-Host "Build and Push Complete!"
