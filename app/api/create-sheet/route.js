import { google } from 'googleapis'
import { NextResponse } from 'next/server'

export async function POST(req) {
  try {
    const { matchId, matchTitle, teams } = await req.json()

    // Initialize Google Auth
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      },
      scopes: ['https://www.googleapis.com/auth/spreadsheets', 'https://www.googleapis.com/auth/drive'],
    })

    const sheets = google.sheets({ version: 'v4', auth })
    const drive = google.drive({ version: 'v3', auth })

    // Create new spreadsheet
    const spreadsheet = await sheets.spreadsheets.create({
      requestBody: {
        properties: { title: `${matchTitle} — Live Sheet` },
        sheets: [
          { properties: { title: 'INPUT', sheetId: 0 } }
        ]
      }
    })

    const spreadsheetId = spreadsheet.data.spreadsheetId

    // Make it accessible to anyone with link
    await drive.permissions.create({
      fileId: spreadsheetId,
      requestBody: {
        role: 'writer',
        type: 'anyone',
      }
    })

    // Build headers row
    const headers = ['#', 'TEAM', 'P1', 'P2', 'P3', 'P4', 'KILLS', 'P1K', 'P2K', 'P3K', 'P4K']

    // Build team rows
    const teamRows = teams.map((team, i) => {
      const row = i + 2 // row 2 onwards
      return [
        i + 1,           // slot number
        team.name,       // team name
        true,            // P1 alive (checkbox)
        true,            // P2 alive
        true,            // P3 alive
        true,            // P4 alive
        { formula: `=H${row}+I${row}+J${row}+K${row}` }, // KILLS formula
        0,               // P1K
        0,               // P2K
        0,               // P3K
        0,               // P4K
      ]
    })

    // Write headers
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: 'INPUT!A1:K1',
      valueInputOption: 'USER_ENTERED',
      requestBody: { values: [headers] }
    })

    // Write team data
    if (teamRows.length > 0) {
      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `INPUT!A2:K${teamRows.length + 1}`,
        valueInputOption: 'USER_ENTERED',
        requestBody: { values: teamRows.map(row => row.map(cell =>
          typeof cell === 'object' && cell.formula ? cell.formula : cell
        ))}
      })
    }

    // Format the sheet
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: {
        requests: [
          // Freeze header row
          {
            updateSheetProperties: {
              properties: { sheetId: 0, gridProperties: { frozenRowCount: 1 } },
              fields: 'gridProperties.frozenRowCount'
            }
          },
          // Bold headers
          {
            repeatCell: {
              range: { sheetId: 0, startRowIndex: 0, endRowIndex: 1 },
              cell: { userEnteredFormat: { textFormat: { bold: true } } },
              fields: 'userEnteredFormat.textFormat.bold'
            }
          },
          // Add checkboxes for P1-P4 columns (C to F = index 2 to 5)
          {
            repeatCell: {
              range: { sheetId: 0, startRowIndex: 1, endRowIndex: teams.length + 1, startColumnIndex: 2, endColumnIndex: 6 },
              cell: {
                dataValidation: {
                  condition: { type: 'BOOLEAN' },
                  strict: true
                }
              },
              fields: 'dataValidation'
            }
          },
          // Gold background for header
          {
            repeatCell: {
              range: { sheetId: 0, startRowIndex: 0, endRowIndex: 1 },
              cell: {
                userEnteredFormat: {
                  backgroundColor: { red: 0.9, green: 0.75, blue: 0.2 }
                }
              },
              fields: 'userEnteredFormat.backgroundColor'
            }
          },
          // Auto resize columns
          {
            autoResizeDimensions: {
              dimensions: { sheetId: 0, dimension: 'COLUMNS', startIndex: 0, endIndex: 11 }
            }
          }
        ]
      }
    })

    const sheetUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`

    return NextResponse.json({ success: true, sheetUrl, sheetId: spreadsheetId })

  } catch (error) {
    console.error('Sheet creation error:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}