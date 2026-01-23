# n8n Workflow Updates for AIASpeech

This document explains how to update your existing n8n workflow to work with the new MySQL-based AIASpeech instead of Excel.

## Overview of Changes

Your current n8n workflow reads from Excel, submits to Azure Speech, and updates Excel with results. The new workflow will:
1. Read songs with status "create" from MySQL database
2. Submit to Azure Speech API
3. Update MySQL with "submitted" status and task ID
4. Receive webhook callback from Azure Speech
5. Update MySQL with "completed" status and download URLs

## Required Changes

### 1. Replace "Get Excel File" Nodes

**OLD:** Microsoft OneDrive - Get Excel File
**NEW:** MySQL node to query songs

**MySQL Query for Pending Songs:**
```sql
SELECT
    id,
    specific_title,
    specific_lyrics,
    prompt_to_generate,
    style_id,
    vocal_gender,
    azure_task_id
FROM songs
WHERE status = 'create'
LIMIT 10;
```

**MySQL Connection Settings:**
- Host: localhost
- Port: 3306
- Database: aiaspeech_db
- User: aiaspeech_user
- Password: [from setup_database.sh output]

### 2. Update "Get Songs Table" Node

Replace Excel table read with MySQL query above.

### 3. Update "Code" Filter Node

Replace with:
```javascript
// Songs are already filtered by status='create' in the SQL query
// Just pass them through or add additional filters if needed
return items;
```

### 4. Update Azure Speech HTTP Request Node

**Current setup is good, but update to use MySQL data:**

Body Parameters:
- `customMode`: `={{ !$json.prompt_to_generate }}`
- `prompt`: `={{ $json.prompt_to_generate || $json.specific_lyrics }}`
- `style`: Get from style_id by joining with styles table OR use existing style name
- `vocalGender`: `={{ $json.vocal_gender === 'male' ? 'm' : 'f' }}`
- `callBackUrl`: `https://n8n.aiacopilot.com/webhook/338d7768-cecb-44b3-8552-c2171de9738e`

### 5. Replace "Excel - Update Status to Submitted"

**NEW:** HTTP Request to AIASpeech webhook

**HTTP Request Node:**
- Method: POST
- URL: `https://speech.aiacopilot.com/api/v1/webhooks/azure-submitted`
- Headers:
  - Content-Type: application/json
- Body:
```json
{
  "song_id": {{ $('Loop Over Items').item.json.id }},
  "task_id": {{ $json.data.taskId }}
}
```

### 6. Update Webhook Callback Handler

**Keep your existing webhook node** but update the downstream processing.

Replace "Excel - Update Status to Completed" with:

**HTTP Request Node:**
- Method: POST
- URL: `https://speech.aiacopilot.com/api/v1/webhooks/azure-callback`
- Headers:
  - Content-Type: application/json
- Body:
```json
{
  "task_id": {{ $json.body.data.task_id }},
  "status": "completed",
  "msg": {{ $json.body.msg }},
  "data": {{ $json.body.data.data }}
}
```

### 7. Remove OneDrive MP3 Upload Nodes (Optional)

The webhook will store the download URLs in the database. You can:
- **Option A:** Remove the MP3 download/upload nodes - users download directly from Azure Speech URLs
- **Option B:** Keep them but update to read song data from MySQL instead of Excel

If keeping Option B, replace Excel read with:
```sql
SELECT * FROM songs WHERE azure_task_id = '{{ $('Webhook').first().json.body.data.task_id }}';
```

## Complete New Workflow Structure

```
┌─────────────────────────────────────────────────────────────┐
│ WORKFLOW 1: Submit Songs to Azure Speech                            │
├─────────────────────────────────────────────────────────────┤
│ 1. Schedule Trigger (every 5 minutes)                       │
│ 2. MySQL: Get songs WHERE status='create' LIMIT 10          │
│ 3. Loop Over Items                                          │
│ 4. HTTP Request: POST to Azure Speech API                           │
│ 5. HTTP Request: POST to /webhooks/azure-submitted           │
│ 6. Loop back to step 3 until all items processed            │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ WORKFLOW 2: Handle Azure Speech Callback                            │
├─────────────────────────────────────────────────────────────┤
│ 1. Webhook: Receive Azure Speech completion callback                │
│ 2. If: Check if msg === "All generated successfully."       │
│ 3. HTTP Request: POST to /webhooks/azure-callback            │
│ 4. Email notification (optional)                            │
└─────────────────────────────────────────────────────────────┘
```

## MySQL Connection in n8n

To add MySQL credentials in n8n:

1. Go to **Credentials** in n8n
2. Create new credential → **MySQL**
3. Enter:
   - Host: localhost
   - Database: aiaspeech_db
   - User: aiaspeech_user
   - Password: [from your database setup]
   - Port: 3306

## Testing the Integration

1. Create a test song in AIASpeech with status "create"
2. Wait for the n8n scheduled trigger to run
3. Check n8n execution logs
4. Verify song status changes to "submitted" in database
5. Wait for Azure Speech callback
6. Verify song status changes to "completed" with download URLs

## Simplified Alternative: API-First Approach

Instead of n8n directly querying the database, you could:

1. Add an endpoint in Flask: `GET /api/v1/songs/pending-submission`
2. n8n calls this endpoint instead of MySQL query
3. Better abstraction and easier to maintain

Example:
```javascript
// In n8n HTTP Request node
GET https://speech.aiacopilot.com/api/v1/songs/pending-submission
Headers:
  Authorization: Bearer [JWT_TOKEN]
```

## Troubleshooting

**Issue:** n8n can't connect to MySQL
- **Fix:** Ensure MySQL allows connections from n8n (localhost if on same server)
- Check firewall settings
- Verify user permissions

**Issue:** Webhook not updating database
- **Fix:** Check Flask logs: `sudo journalctl -u aiaspeech -f`
- Verify webhook URL is correct
- Check if AIASpeech API is running

**Issue:** Songs stuck in "submitted" status
- **Fix:** Check if webhook callback is being received
- Verify callback URL in Azure Speech API request
- Check n8n webhook is active
