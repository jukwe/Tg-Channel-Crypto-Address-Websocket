import axios from 'axios';
async function fetchJupiterPrices(tokenMints: string[], vsToken: string = "SOL"): Promise<Record<string, number> | null> {
    const ids = tokenMints.join(",");
    const url = `https://price.jup.ag/v4/price?ids=${ids}&vsToken=${vsToken}`;
    try {
        const response = await axios.get(url);
        if (response.status === 200) {
            const prices: Record<string, number> = {};
            for (const token of tokenMints) {
                prices[token] = response.data.data[token].price;
            }
            return prices;
        } else {
            console.error(`Error fetching prices: ${response.status}`);
            return null;
        }
    } catch (error) {
        console.error(`Error: ${error}`);
        return null;
    }
}

async function monitorTokens(tokenMints: string[], vsToken: string = "SOL", interval: number = 60000) {
    while (true) {
        const prices = await fetchJupiterPrices(tokenMints, vsToken);
        if (prices) {
            for (const [token, price] of Object.entries(prices)) {
                console.log(`Token: ${token}, Price: ${price} ${vsToken}`);
            }
        }
        await new Promise((resolve) => setTimeout(resolve, interval)); // Wait for the specified interval
    }
}

// Example usage
const tokenMints = [
    "TOKEN_MINT_1", // Replace with actual token mint addresses
    "TOKEN_MINT_2",
];
monitorTokens(tokenMints, "SOL", 60000); // Monitor every 60 seconds