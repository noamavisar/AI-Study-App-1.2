import { Task, TaskStatus, Priority } from '../types';

/**
 * Extracts the Google Sheet ID from a URL.
 * @param url The full Google Sheet URL.
 * @returns The sheet ID or null if not found.
 */
function parseSheetIdFromUrl(url: string): string | null {
  const match = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  return match ? match[1] : null;
}

/**
 * A simple CSV parser that handles the quoted format from the Google Sheets gviz API.
 * @param csvText The raw CSV string.
 * @returns A 2D array of strings representing the sheet data.
 */
function parseCsv(csvText: string): string[][] {
  const rows = csvText.trim().split('\n');
  // This regex handles fields quoted with double quotes, including escaped double quotes ("") inside.
  const regex = /"([^"]*(?:""[^"]*)*)"/g;
  return rows.map(row => {
    const values = [];
    // Reset regex state for each row
    regex.lastIndex = 0;
    let match;
    while ((match = regex.exec(row)) !== null) {
      // Un-escape double quotes and push to values
      values.push(match[1].replace(/""/g, '"'));
    }
    return values;
  });
}

/**
 * Maps a string from the sheet to a Priority enum value.
 * @param priorityStr The string value from the 'Priority' column.
 * @returns A Priority enum value.
 */
function mapPriority(priorityStr: string | undefined): Priority {
  switch (priorityStr?.trim()) {
    case 'Urgent & Important':
      return Priority.UrgentImportant;
    case 'Important, Not Urgent':
      return Priority.ImportantNotUrgent;
    case 'Urgent, Not Important':
      return Priority.UrgentNotImportant;
    case 'Not Urgent, Not Important':
      return Priority.NotUrgentNotImportant;
    default:
      return Priority.ImportantNotUrgent;
  }
}

/**
 * Fetches and processes a Google Sheet to extract tasks.
 * @param sheetUrl The shareable URL of the Google Sheet.
 * @param sheetName The name of the specific sheet/tab to import.
 * @returns A promise that resolves to an array of tasks.
 */
export async function importFromGoogleSheet(sheetUrl: string, sheetName: string): Promise<Omit<Task, 'id'>[]> {
  const sheetId = parseSheetIdFromUrl(sheetUrl);
  if (!sheetId) {
    throw new Error('Invalid Google Sheet URL. Please provide a valid shareable link.');
  }

  // Use the gviz API to download the sheet as CSV
  const csvUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(sheetName)}`;

  const response = await fetch(csvUrl);
  if (!response.ok) {
    throw new Error(`Failed to fetch sheet data.
1. Check if the sheet name "${sheetName}" is correct (it's case-sensitive).
2. Ensure link sharing is enabled ("Anyone with the link").`);
  }

  const csvText = await response.text();
  const csvData = parseCsv(csvText);

  if (csvData.length < 2) {
    return []; // No data rows found
  }

  const headers = csvData[0];
  const taskTitleHeader = 'Task';
  const doneHeader = 'Done';
  const priorityHeader = 'Priority';
  const dateHeader = 'Do date';

  const titleIndex = headers.indexOf(taskTitleHeader);
  const doneIndex = headers.indexOf(doneHeader);
  const priorityIndex = headers.indexOf(priorityHeader);
  const dateIndex = headers.indexOf(dateHeader);

  if (titleIndex === -1) {
    throw new Error(`The sheet must contain a column named "${taskTitleHeader}".`);
  }

  const importedTasks: Omit<Task, 'id'>[] = [];
  for (let i = 1; i < csvData.length; i++) {
    const values = csvData[i];
    if (values.length === 0 || !values[titleIndex]) continue; // Skip empty rows

    const title = values[titleIndex]?.trim();
    if (!title) continue;

    const status = values[doneIndex]?.trim().toUpperCase() === 'TRUE' ? TaskStatus.Done : TaskStatus.ToDo;
    const priority = mapPriority(values[priorityIndex]);
    
    const dueDateRaw = dateIndex > -1 ? values[dateIndex]?.trim() : undefined;
    let dueDate: string | undefined = undefined;
    if (dueDateRaw) {
        const dateObj = new Date(dueDateRaw);
        if (!isNaN(dateObj.getTime())) {
            // Format to YYYY-MM-DD for consistency with <input type="date">
            dueDate = dateObj.toISOString().split('T')[0];
        }
    }

    importedTasks.push({
      title,
      description: `Imported from ${sheetName}`,
      priority,
      status,
      estimatedTime: 30, // Default estimated time
      dueDate,
    });
  }

  return importedTasks;
}