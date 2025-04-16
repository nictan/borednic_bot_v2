const urlHyperInfo = "https://api.hyperliquid.xyz/info";

/* getAssetContextForSymbol Method
 *
 * Calls the "metaAndAssetCtxs" endpoint to retrieve deeper info about each perp
 * (including real-time pricing data from data[1]). Then:
 *  1) Validates the response shape: an array with two elements.
 *  2) Locates the requested symbol in data[0].universe.
 *  3) Matches it to the corresponding index in data[1] for price/funding info.
 *  4) Returns { success, data: { name, leverage, price }, error } if found.
 *
 * @param {string} symbol - e.g. "BTC", "SOL", "ETH"
 * @returns {Promise<{
 *   success: boolean,
  *   data: { name: string, leverage: number, price: string|null } | null,
  *   error: string
  * }>}
  *   - success: True if the symbol was found and data was parsed.
  *   - data: An object with basic fields { name, leverage, price } from both arrays.
  *   - error: If success = false, this provides an error message.
  *
  * @example
  *   const resp = await getAssetContextForSymbol("BTC");
  *   if (resp.success) {
  *     console.log(resp.data); 
  *     // => { name: "BTC", leverage: 50, price: "14.3161" }
  *   }
  */
export async function getAssetContextForSymbol(symbol) {
  const url = "https://api.hyperliquid.xyz/info";
  const body = { type: "metaAndAssetCtxs" };
  
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    
    if (!response.ok) {
      return {
        success: false,
        universe: null,
        error: `HTTP Error: ${response.status}`,
      };
    }

    const data = await response.json();
 
    // We expect data to be an array of length 2:
    // data[0].universe => metadata array
    // data[1]          => pricing/funding info array
    if (!Array.isArray(data) || data.length < 2) {
      throw new Error("Unexpected response format (not 2 elements).");
    }
 
    if (!data[0].universe || !Array.isArray(data[0].universe)) {
      throw new Error("Missing or invalid universe array in the response.");
    }
 
    // The first element is the 'universe' array
    const universeObj = data[0].universe;
    // The second element is the pricing array
    const priceDataArray = data[1];
 
    // Find the token index by symbol (case-insensitive)
    const i = universeObj.findIndex(
      (item) => item.name.toUpperCase() === symbol.toUpperCase()
    );
 
    if (i >= 0) {
      // Merge the two data sets into a simpler object
      const data1 = universeObj[i];
      const data2 = priceDataArray[i];
 
      return {
        success: true,
        data: createDataPacket(data1, data2),
        error: "",
      };
    }
 
    // If not found
    console.log("Request got no data found");
    return {
      success: false,
      data: null,
      error: "No data found",
    };
   } catch (err) {
     console.log(err.message);
     return {
      success: false,
      data: null,
      error: `Failed to fetch: ${err.message}`,
    };
  }
}

export async function getUserPerpMargin(accountId) {
  const body = { type: "clearinghouseState", user:`${accountId}` };

  try {
    const response = await fetch(urlHyperInfo, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      return {
        success: false,
        universe: null,
        error: `HTTP Error: ${response.status}`,
      };
    }

    const data = await response.json();
    console.log("Running API to retrieve user's Perps Account Summary from HyperLiquid");
    console.log(data);

    if (data.marginSummary) {
      return {
        success: true,
        universe: data.marginSummary,
      };
    }
    
    return {
      success: false,
      universe: null,
      error: `Unable to find Mergin Summary object.`,
    };
  } catch (error) {
    console.log(err.message);
    return {
      success: false,
      data: null,
      error: `Failed to fetch: ${err.message}`,
    };
  }
}

/* getPerpsByName
 *
 * Optionally filters the full "universe" of perps from the Hyperliquid meta endpoint
 * by a list of token names. If no names are provided, returns all known perps.
 *
 * 1) Calls fetchHyperliquidMeta() to get { success, universe, error }.
 * 2) If success = true, filters 'universe' based on the provided array `names`.
 * 3) Returns an object with { success, universe, error }.
 *
 * @param {string[]} names - An array of token symbols (e.g. ["BTC", "ETH"]).
 * @returns {Promise<{
*   success: boolean,
*   universe: object[]|null,
*   error: string|null
* }>}
*   - success: If false, something went wrong fetching or parsing meta data.
*   - universe: The filtered array of tokens. If no names were provided, all tokens are returned.
*   - error: Any error message if success = false.
*
* @example
*   const { success, universe } = await getPerpsByName(["BTC"]);
*   if (success) {
*     console.log(universe); // e.g. [ { name: "BTC", maxLeverage: 50 }, ... ]
*   }
*/
export async function getPerpsByName(names = []) {
  const metaResult = await fetchHyperliquidMeta();
 
  if (!metaResult.success || !metaResult.universe) {
    // bubble up the error
    return {
      success: false,
      universe: null,
      error: metaResult.error,
    };
  }
 
  // If no specific symbols requested, return all
  if (names.length === 0) {
    return {
      success: true,
      universe: metaResult.universe,
      error: null,
    };
  }
 
  // Convert user input to uppercase for case-insensitive matching
  const upperNames = new Set(names.map((n) => n.toUpperCase()));
 
  // Filter out only matching items
  const filtered = metaResult.universe.filter((item) =>
    upperNames.has(item.name.toUpperCase())
  );
 
  return {
    success: true,
    universe: filtered,
    error: null,
  };
}

/* createDataPacket
 *
 * A small helper to unify data from the "universe" array (dat1) and
 * the "price/funding" array (dat2) into a single object for easier consumption.
 *
 * @param {object} dat1 - e.g. { name: "BTC", maxLeverage: 50, ... }
 * @param {object} dat2 - e.g. { markPx: "14.3161", ... }
 * @returns {{ name: string, leverage: number, price: string }}
 *   - Merged structure with a standardized shape: { name, leverage, price }
 */
function createDataPacket(dat1, dat2) {
  const val = {
    name: dat1.name,
    leverage: dat1.maxLeverage,
    price: dat2.markPx,
  };
  return val;
}

/* fetchHyperliquidMeta
*
* Calls the Hyperliquid "meta" endpoint via POST to https://api.hyperliquid.xyz/info with { type: "meta" }
* to retrieve a list of all available perps in "data.universe".
*
* @returns {Promise<{
*   success: boolean,
*   universe: object[]|null,
*   error: string|null
* }>}
*   - success: true if request and parsing succeed.
*   - universe: array of perp metadata objects if successful.
*   - error: any error message if unsuccessful.
*
* @example
*   const { success, universe } = await fetchHyperliquidMeta();
*   if (success) {
*     console.log(universe); // array of tokens, e.g. [{ name: "BTC", ... }, ...]
*   }
*/
async function fetchHyperliquidMeta() {
 const url = "https://api.hyperliquid.xyz/info";
 const body = { type: "meta" };

 try {
   const response = await fetch(url, {
     method: "POST",
     headers: { "Content-Type": "application/json" },
     body: JSON.stringify(body),
   });

   if (!response.ok) {
     return {
       success: false,
       universe: null,
       error: `HTTP Error: ${response.status}`,
     };
   }

   const data = await response.json();
   if (!data.universe || !Array.isArray(data.universe)) {
     return {
       success: false,
       universe: null,
       error: "No 'universe' array found in response.",
     };
   }

   // On success, return the array of perps
   return {
     success: true,
     universe: data.universe,
     error: null,
   };
 } catch (err) {
   return {
     success: false,
     universe: null,
     error: `Failed to fetch: ${err.message}`,
   };
 }
}