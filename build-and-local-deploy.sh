cd server
npm run build

cd ../client/v3/
cargo build --release

cd ../../
mkdir /mnt/c/Users/sknit/AppData/Roaming/TouchPortal/plugins/tp-tradfri/
cp -t /mnt/c/Users/sknit/AppData/Roaming/TouchPortal/plugins/tp-tradfri/ entry.tp server/dist/tp-tradfri-server.exe client/v3/target/x86_64-pc-windows-gnu/release/tp-tradfri-client.exe
