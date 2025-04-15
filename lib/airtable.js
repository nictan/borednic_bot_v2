// lib/airtable.js
const BASE = `https://api.airtable.com/v0/${process.env.AIRTABLE_BASE}`;

export async function logActivity(chatId, input, inputObj) {
    const dataContent = { "chatId": `${chatId}`, "inputs": `${input}`, "input_object": `${inputObj}` };
    await addRecord(dataContent, 'activity_log');
}

export async function addUpdateUser(chatId, usernames) {
    // search if user in system
    if(await getRecordsFiltered('users',"chatId%3D"+chatId)) {
        console.log("this user is already recorded.");
    } else {
        // no then insert
        const dataContent = { "chatId": `${chatId}`, "username": `${usernames}` };
        await addRecord(dataContent, 'users');
    }
}

// lib/airtable.js  (add below existing code)
export async function saveChartKey(chatId, chartKey) {
    const record = await getRecordsFiltered(
      'users',
      encodeURIComponent(`chatId="${chatId}"`)
    );

    console.log(record);

    const fields = { 'chart-img-api': chartKey };
  
    if (record) {
      // PATCH existing
      await fetch(`${BASE}/users/${record.id}`, {
        method: 'PATCH',
        headers: {
            "Authorization": `Bearer ${process.env.AIRTABLE_KEY}`,
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ fields }),
      });
    } else {
      // INSERT new
      await addRecord(fields, 'users');
    }
  }

async function addRecord(dataContent, tableName) {
    const body = {
        records: [{ "fields" : dataContent }]
    };

    const res = await fetch(`${BASE}/${encodeURIComponent(tableName)}`, {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${process.env.AIRTABLE_KEY}`,
            "Content-Type": "application/json"
        },
        body: JSON.stringify(body)
    });
    
    if (!res.ok) {
        // read the error
        const errorText = await res.text();
        throw new Error(`Airtable POST error: ${res.status} ${res.statusText} - ${errorText}`);
    }
}

async function getRecordsFiltered(tableName, query) {
    const url = `${BASE}/${encodeURIComponent(tableName)}?filterByFormula=${query}`;
    console.log('Fetching URL:', url);

    console.log(url);
    const res = await fetch(url, {
        method: "GET",
        headers: {
            "Authorization": `Bearer ${process.env.AIRTABLE_KEY}`,
            "Content-Type": "application/json"
        }
    }); 
  
    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`Airtable GET error: ${res.status} ${res.statusText} - ${errorText}`);
    }
  
    const data = await res.json();
    return data.records?.[0]; // return first matching record (or null if not found)
}