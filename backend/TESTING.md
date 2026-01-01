# מדריך בדיקה - Gmail Delete Today

## שלב 1: התחברות והשגת JWT Token

1. **הרץ את השרת:**
   ```bash
   cd backend
   npm run dev
   ```

2. **פתח בדפדפן ונווט ל:**
   ```
   http://localhost:4000/auth/google/start
   ```

3. **התחבר עם חשבון Google שלך** והרשא גישה ל-Gmail

4. **לאחר ההתחברות**, תועבר לדף `/auth/success?token=YOUR_JWT_TOKEN`
   - **העתק את ה-token מהכתובת** (החלק אחרי `token=`)

## שלב 2: בדיקת Dry-Run (ללא מחיקה)

### אפשרות 1: שימוש ב-curl

```bash
# החלף YOUR_JWT_TOKEN ב-token שקיבלת
curl -X POST "http://localhost:4000/gmail/delete-today?dryRun=true" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json"
```

### אפשרות 2: שימוש ב-Postman

1. פתח Postman
2. צור בקשה חדשה: **POST**
3. URL: `http://localhost:4000/gmail/delete-today?dryRun=true`
4. בטאב **Headers**, הוסף:
   - Key: `Authorization`
   - Value: `Bearer YOUR_JWT_TOKEN`
5. לחץ **Send**

### אפשרות 3: שימוש ב-Node.js Script

הרץ את הסקריפט `test-gmail.js` (ראה למטה)

## שלב 3: בדיקת מחיקה אמיתית

**⚠️ אזהרה: זה ימחק (יעביר לפח) את המיילים מהיום!**

### עם curl:
```bash
curl -X POST "http://localhost:4000/gmail/delete-today" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json"
```

### עם Postman:
- אותו דבר כמו Dry-Run, אבל **הסר את `?dryRun=true`** מה-URL

## תגובה צפויה

```json
{
  "trashedCount": 5,
  "queryUsed": "newer_than:1d",
  "dryRun": false,
  "sample": [
    {
      "id": "18c1234567890abc",
      "subject": "Test Email",
      "from": "sender@example.com",
      "date": "Mon, 1 Jan 2024 10:00:00 +0000"
    },
    ...
  ]
}
```

## איך לוודא שהמחיקה עבדה?

1. **פתח את Gmail שלך בדפדפן**
2. **נווט לתיקיית "פח" (Trash)**
3. **חפש את המיילים שהועברו** - הם אמורים להיות שם

## פתרון בעיות

### שגיאה: "No Google token found for user"
- **פתרון:** התחבר שוב דרך `/auth/google/start`

### שגיאה: "Invalid or expired token"
- **פתרון:** קבל token חדש דרך OAuth flow

### שגיאה: "Failed to get access token"
- **פתרון:** בדוק שה-`.env` מכיל את כל המשתנים הנדרשים

