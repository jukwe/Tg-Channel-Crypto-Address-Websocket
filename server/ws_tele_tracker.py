import asyncio
import re
import json
from telethon import TelegramClient, events
from websockets import serve
from config import TG_API_ID, TG_API_HASH, TARGET_CHANNEL_USERNAME

# Telegram API credentials
api_id = TG_API_ID
api_hash = TG_API_HASH

# List of target channels (lowercase for consistency)
TARGET_CHANNELS = [channel.lower() for channel in TARGET_CHANNEL_USERNAME]

# Initialize Telegram client
client = TelegramClient("tele_tracker", api_id, api_hash)

# WebSocket server state
connected_clients = set()

### WebSocket Server ###
async def notify_clients(channel: str, mint: str):
    """Send mint data to all connected WebSocket clients."""
    if connected_clients:
        data = json.dumps({"channel": channel, "mint": mint})
        tasks = []
        for client in connected_clients:
            try:
                tasks.append(client.send(data))
            except Exception as e:
                print(f"Error sending to client: {e}")
                connected_clients.remove(client)
        await asyncio.gather(*tasks)

async def websocket_handler(websocket, path=None):
    """Handle WebSocket connections."""
    connected_clients.add(websocket)
    print("WebSocket client connected.")
    try:
        async for message in websocket:
            # Handle client messages if needed (e.g., pong for keep-alive)
            print(f"Received from client: {message}")
    except Exception as e:
        print(f"WebSocket error: {e}")
    finally:
        connected_clients.remove(websocket)
        print("WebSocket client disconnected.")

### Telegram Event Handler ###
@client.on(events.NewMessage(chats=TARGET_CHANNELS))
async def handle_new_message(event):
    """Handle new messages from target channels, extract mints, and notify clients."""
    channel = event.chat.username
    if not channel:
        return  # Skip if no username (e.g., private chats)

    # Skip replies to avoid duplicates
    if event.message.is_reply:
        print(f"[{channel}] Skipped reply: {event.message.message}")
        return

    # Extract mint address
    mint = extract_address(event.message.message)
    if mint:
        print(f"[{channel}] Detected mint: {mint}")
        await notify_clients(channel, mint)

def extract_address(message: str) -> str | None:
    """Extract a Solana mint address (32-44 alphanumeric characters)."""
    match = re.search(r"\b[A-Za-z0-9]{32,44}\b", message)
    return match.group(0) if match else None

### Main ###
async def main():
    """Start Telegram client and WebSocket server concurrently."""
    # Start WebSocket server
    websocket_server = await serve(websocket_handler, "localhost", 6789)
    print("WebSocket server started at ws://localhost:6789")

    # Start Telegram client
    await client.start()
    print("Telegram client started.")

    # Join target channels if not already a member
    for channel in TARGET_CHANNELS:
        try:
            await client.get_entity(channel)  # Check if accessible
            print(f"Monitoring {channel}")
        except Exception as e:
            print(f"Failed to access {channel}: {e}")

    # Run until disconnected
    await client.run_until_disconnected()

if __name__ == "__main__":
    asyncio.run(main())