import asyncio
import re
from database import init_db, save_address_to_db, delete_address_from_db
from telethon import TelegramClient, events
from websockets import serve
from config import TG_API_ID, TG_API_HASH, TARGET_CHANNEL_USERNAME

# Telegram API credentials
api_id = TG_API_ID
api_hash = TG_API_HASH

# List of target channels
TARGET_CHANNELS = [channel.lower() for channel in TARGET_CHANNEL_USERNAME]

# Initialize Telegram client
client = TelegramClient("multi_channel_tracker", api_id, api_hash)

# Initialize WebSocket server state
connected_clients = set()

### WebSocket Server ###
async def notify_clients(data):
    # Send data to all connected WebSocket clients.
    if connected_clients:
        tasks = []
        for client in connected_clients:
            try:
                tasks.append(asyncio.create_task(client.send(data)))
            except Exception as e:
                print(f"Error sending data to client: {e}")
                connected_clients.remove(client)  # Remove disconnected client
        await asyncio.wait(tasks)

async def websocket_handler(websocket, path=None):
    # Handle WebSocket connections and manage the set of connected clients.
    connected_clients.add(websocket)
    # print("WebSocket client connected.")
    try:
        async for message in websocket:
            # print(f"Received message from client: {message}")
            pass
    finally:
        connected_clients.remove(websocket)
        # print("WebSocket client disconnected.")

### Telegram Event Handler ###
@client.on(events.NewMessage(chats=TARGET_CHANNELS))
async def handle_new_message(event):
    # Handles new messages from the specified channels, extracts addresses, and notifies WebSocket clients.
    channel = event.chat.username
    message = event.message.message

    # Check if the message is a reply to avoid logging the same address
    if event.message.is_reply:
        # print(f"[{channel}] This is a reply.")
        return

    # Extract potential contract address
    address = extract_address(message)
    if address:
        save_address_to_db(channel, address)
        
        await notify_clients(f"[{channel}] {address}")
        

def extract_address(message):
    # Assumes addresses are alphanumeric strings 32-44 characters long.
    match = re.search(r'\b[A-Za-z0-9]{32,44}\b', message)
    return match.group(0) if match else None

### Main ###
async def main():
    """
    Main function to start the Telegram client and WebSocket server concurrently.
    """
    # Initialize the database
    init_db()

    # Start WebSocket server
    websocket_server = await serve(websocket_handler, "localhost", 6789)
    print("WebSocket server started at ws://localhost:6789")

    # Start Telegram client
    await client.start()
    # print("Telegram client started.")

    # Keep the script running
    await client.run_until_disconnected()

if __name__ == "__main__":
    asyncio.run(main())