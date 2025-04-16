// lib/airtable.js
const BASE = `https://api.airtable.com/v0/${process.env.AIRTABLE_BASE}`;

export async function activityLogging(messageObject) {
    
    try {
        if (process.env.ACTIVITY_LOG == "TRUE") {
            console.log("activity logging is required.");
            //console.log(messageObject);

            const chatId = messageObject.message.chat.id;
            const textMessage = messageObject.message.text;

            if (messageObject.message.chat.type == "private") {
                const dataContent = { "chat_type":"private chat", "chatId": `${chatId}`, "message": `${textMessage}`, "input_object": `${JSON.stringify(messageObject, null, 2)}` };
                await addRecord(dataContent, 'activity_log');
            } else if (messageObject.message.chat.type == "supergroup") {
                const dataContent = { "chat_type":"group chat", "chatId": `${chatId}`, "message": `${textMessage}`, "input_object": `${JSON.stringify(messageObject, null, 2)}` };
                await addRecord(dataContent, 'activity_log');
            } else {
                const dataContent = { "chat_type":"others", "chatId": `${chatId}`, "message": `${textMessage}`, "input_object": `${JSON.stringify(messageObject, null, 2)}` };
                await addRecord(dataContent, 'activity_log');
            }
        } else {
            //console.log("No activity logging is required.");
        }
    } catch (error) {
        console.log("Error: " + error);
    }
}

export async function startRegisterUser(chatObj, fromObj) {
    // search if user in system
    const chatId = fromObj.id;
    const username = fromObj.username;
    const chatType = chatObj.type;

    if(await getRecordsFiltered('users',"chatId%3D"+chatId)) {
        console.log("this user is already recorded.");
    } else {
        // no then insert
        const dataContent = { "chatId": `${chatId}`, "username": `${username}`, "chat_type": `${chatType}` };
        await addRecord(dataContent, 'users');
    }
}

export async function saveChartKey(chatObj, fromObj, chartKey) {
    const chatId = fromObj.id;
    const username = fromObj.username;
    const chatType = chatObj.type;

    const record = await getRecordsFiltered('users', encodeURIComponent(`chatId="${chatId}"`));
  
    if (record) {
        const dataContent = { 'chart-img-api': `${chartKey}` };
        await updateRecord(record.id, dataContent, 'users');
    } else {
        const dataContent = { "chatId": `${chatId}`, "username": `${username}`, "chat_type": `${chatType}`, 'chart-img-api': `${chartKey}` };
        await addRecord(dataContent, 'users');
    }
}

export async function getMyChartKey(fromObj){
    const chatId = fromObj.id;

    const record = await getRecordsFiltered('users', encodeURIComponent(`chatId="${chatId}"`));
  
    if (record) {
        console.log(record);
        if (record.fields['chart-img-api']) {
            return {status:true, data:record.fields['chart-img-api']};
        } else {
            return {status:false, error:"No Chart-Img API found, try saving one API Key"};
        }
    } else {
        return {status:false, error:"No found any records, try saving one API Key"};
    }
}

export async function getHypeAcc(fromObj) {
    const chatId = fromObj.id;

    const record = await getRecordsFiltered('users', encodeURIComponent(`chatId="${chatId}"`));
  console.log(record);
    if (record) {
        if (record.fields.hl_account) {
            console.log("found HL Account");
            return {status:true, data:record.fields.hl_account};
        } else {
            console.log("Not found HL Account");
            return {status:false, error:"You've not saved any Hyperliquid account number, try saving it."};
        }
    } else {
        return {status:false, error:"No records found on your Hyperliquid account number, try saving it."};
    }
}

export async function saveHypeAcc(chatObj, fromObj, accNum) {
    const chatId = fromObj.id;
    const username = fromObj.username;
    const chatType = chatObj.type;

    const record = await getRecordsFiltered('users',encodeURIComponent(`chatId="${chatId}"`));
  
    if (record) {
        const dataContent = { 'hl_account': `${accNum}` };
        await updateRecord(record.id, dataContent, 'users');
    } else {
        const dataContent = { "chatId": `${chatId}`, "username": `${username}`, "chat_type": `${chatType}`, 'hl_account': `${accNum}` };
        await addRecord(dataContent, 'users');
    }
}

async function addRecord(dataContent, tableName) {
    const body = {
        records: [{ "fields" : dataContent }]
    };
    //console.log(JSON.stringify(body));

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

async function updateRecord(recordId, dataContent, tableName) {
    console.log(`recordid: ${recordId}, table name:${tableName}`);
    console.log(`${dataContent}`);
    const body = {
        records: [{ "id":`${recordId}` , "fields" : dataContent }]
    };

    console.log(JSON.stringify(body));

    const res = await fetch(`${BASE}/${tableName}`, {
        method: 'PATCH',
        headers: {
            "Authorization": `Bearer ${process.env.AIRTABLE_KEY}`,
            "Content-Type": "application/json"
        },
        body: JSON.stringify(body),
    });
    console.log(res);
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