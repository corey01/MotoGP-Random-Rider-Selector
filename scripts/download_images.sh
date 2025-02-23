#!/bin/bash

# List of URLs to download
urls=(
  "https://photos.motogp.com/riders/5/b/5b9af34e-da94-4ca2-9c4c-6be0fc8b1bbc/2025/profile/main-963022.png"
  "https://photos.motogp.com/riders/4/a/4a439bde-305a-4995-b3e7-783fa99f784a/2025/profile/main-429361.png"
  "https://photos.motogp.com/riders/5/d/5dfc20db-c3c4-4ecd-9c7c-f6cfd042031a/2025/profile/main-709929.png"
  "https://photos.motogp.com/riders/7/1/71df6f0d-51c3-4cdb-9f5c-51939e6f33f2/2025/profile/main-77436.png"
  "https://photos.motogp.com/riders/b/f/bf95d959-6a60-44f1-84b5-ded861e62578/2025/profile/main-278555.png"
  "https://photos.motogp.com/riders/4/1/4113c5f7-33c5-4246-b05b-3f81f4ddbd8f/2025/profile/main-360510.png"
  "https://photos.motogp.com/riders/0/0/00db2312-15f2-4333-be5c-4bbff9d17aec/2025/profile/main-590777.png"
  "https://photos.motogp.com/riders/e/e/eec1f7dc-b115-44f6-82aa-73130e5c92cf/2025/profile/main-671816.png"
  "https://photos.motogp.com/riders/a/1/a1311c17-1099-4893-bba0-347bf43226a4/profile/main/32-Lorenzo-Savadori-MotoGP_DS_8509.png"
  "https://photos.motogp.com/riders/a/d/ade5ef32-01ea-487c-95ca-491544a668ed/2025/profile/main-930504.png"
  "https://photos.motogp.com/riders/f/a/fa8ac04c-8fa2-4c43-9aa5-cc79b1f35fb9/2025/profile/main-988657.png"
  "https://photos.motogp.com/riders/f/5/f55f9c34-8621-437b-ae04-ae2418720204/2025/profile/main-82596.png"
  "https://photos.motogp.com/riders/e/a/ea39a0af-95d3-4a37-81a7-f332efdb9216/2025/profile/main-824336.png"
  "https://photos.motogp.com/riders/a/2/a2f51450-cb43-4d32-8eef-bda9ebb435ed/profile/main/41_Aleix_Espargaro_Official_Rider_DSC9418.png"
  "https://photos.motogp.com/riders/0/4/04bf0ce4-5062-44fc-9745-ec85a8d8f8d3/2025/profile/main-727568.png"
  "https://photos.motogp.com/riders/b/0/b0c1fea6-2dd5-4e26-8a18-0ac9fe6870e4/2025/profile/main-976738.png"
  "https://photos.motogp.com/riders/5/2/525b1551-f10b-4cfd-9b43-59af6fca654b/2025/profile/main-63572.png"
  "https://photos.motogp.com/riders/7/c/7c653b2a-b493-436b-a77e-06a43b37b799/profile/main/_0003_51-Michele-Pirro-MotoGP_DS_1752.png"
  "https://photos.motogp.com/riders/7/1/71052114-5bce-4307-908c-4cc2bd387aac/2025/profile/main-155779.png"
  "https://photos.motogp.com/riders/6/6/66b78301-5826-4986-b11e-fa68a7bd77a7/2025/profile/main-188273.png"
  "https://photos.motogp.com/riders/e/6/e622ec5b-5ccf-457c-a67f-ec028f0ddf6e/2025/profile/main-212826.png"
  "https://photos.motogp.com/riders/4/1/41195f0f-9817-4a4d-913e-c1fbbb351d9b/2025/profile/main-327428.png"
  "https://photos.motogp.com/riders/2/4/244b6f51-ac33-40ee-876d-9401dc9d1346/2025/profile/main-613285.png"
  "https://photos.motogp.com/riders/5/0/50b4fb1f-1785-4a9a-a65c-97d0de9daa22/2025/profile/main-380004.png"
  "https://photos.motogp.com/riders/2/3/23e50438-a657-4fb0-a190-3262b5472f29/2025/profile/main-549335.png"
)

# Directory to save the images
output_dir="25"
mkdir -p "$output_dir"

# Download each URL
for url in "${urls[@]}"; do
  filename=$(basename "$url")
  curl -o "$output_dir/$filename" "$url"
done