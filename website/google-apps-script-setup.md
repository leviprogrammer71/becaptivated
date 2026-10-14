# Google Apps Script Setup — BeCaptivated Forms → Google Sheets

This guide connects the **Preorder Popup** and **Celebration RSVP** forms on becaptivatedbooks.com to a Google Sheet.

---

## Step 1: Create the Google Sheet

1. Go to [sheets.google.com](https://sheets.google.com) and create a new spreadsheet.
2. Rename it to **BeCaptivated Form Responses**.
3. Rename the first tab (bottom of screen) to **Preorders**.
4. Add a second tab and name it **Celebration RSVP**.
5. In the **Preorders** tab, add these headers in Row 1:

   | A | B | C | D | E | F |
   |---|---|---|---|---|---|
   | Timestamp | Full Name | Email | Phone | Preferred Format | Source |

6. In the **Celebration RSVP** tab, add these headers in Row 1:

   | A | B | C | D | E | F | G | H |
   |---|---|---|---|---|---|---|---|
   | Timestamp | Full Name | Email | Phone | Attending | Buying Book | Preferred Format | Source |

---

## Step 2: Create the Apps Script

1. In the spreadsheet, go to **Extensions → Apps Script**.
2. Delete any code in the editor and paste the code below:

```javascript
function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var source = data.source || 'unknown';

    if (source === 'celebration') {
      // Celebration RSVP form
      var sheet = ss.getSheetByName('Celebration RSVP');
      sheet.appendRow([
        data.timestamp || new Date().toISOString(),
        data.fullName || '',
        data.email || '',
        data.phone || '',
        data.attending || '',
        data.buyingBook || '',
        data.preferredFormat || '',
        source
      ]);
    } else {
      // Preorder popup form
      var sheet = ss.getSheetByName('Preorders');
      sheet.appendRow([
        data.timestamp || new Date().toISOString(),
        data.fullName || '',
        data.email || '',
        data.phone || '',
        data.preferredFormat || '',
        source
      ]);
    }

    return ContentService
      .createTextOutput(JSON.stringify({ result: 'success' }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ result: 'error', message: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
```

3. Click the **Save** icon (💾) or press Ctrl+S.
4. Name the project **BeCaptivated Forms**.

---

## Step 3: Deploy as Web App

1. Click **Deploy → New deployment**.
2. Click the gear icon ⚙️ next to "Select type" and choose **Web app**.
3. Set:
   - **Description:** BeCaptivated Forms Handler
   - **Execute as:** Me
   - **Who has access:** Anyone
4. Click **Deploy**.
5. You'll be asked to authorize — click **Authorize access**, choose your Google account, and if you see "Google hasn't verified this app", click **Advanced → Go to BeCaptivated Forms (unsafe)** → **Allow**.
6. **Copy the Web App URL** — it looks like:
   ```
   https://script.google.com/macros/s/AKfycbx.../exec
   ```

---

## Step 4: Add the URL to Your Website

Replace `YOUR_GOOGLE_APPS_SCRIPT_URL_HERE` with the URL you copied in these three files:

1. **website/index.html** — find `var SCRIPT_URL = 'YOUR_GOOGLE_APPS_SCRIPT_URL_HERE';` (around line 325)
2. **website/book.html** — find `var SCRIPT_URL = 'YOUR_GOOGLE_APPS_SCRIPT_URL_HERE';` (in the preorder script near the bottom)
3. **website/celebration.html** — find `var SCRIPT_URL = 'YOUR_GOOGLE_APPS_SCRIPT_URL_HERE';` (in the RSVP script near the bottom)

All three should use the **same URL**.

---

## Step 5: Test

1. Open the site and submit a test preorder from the popup on the Home or Book page.
2. Submit a test RSVP on the Celebration page.
3. Check your Google Sheet — responses should appear in the correct tabs.

> **Note:** Because the forms use `mode: 'no-cors'`, the browser can't read the response, but the data still reaches Google Sheets. The success message shows after submission regardless. If data isn't appearing, double-check the URL and that the deployment is set to "Anyone."

---

## Updating the Script

If you ever need to change the script:

1. Open the spreadsheet → Extensions → Apps Script.
2. Make changes and save.
3. Click **Deploy → Manage deployments → Edit (pencil icon)**.
4. Set **Version** to **New version**, then click **Deploy**.
5. The URL stays the same.
