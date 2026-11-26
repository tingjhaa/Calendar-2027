import { Platform, Share } from 'react-native';

const DOCUMENT_TITLE = 'Calendar 2027 — The Sweet Atelier';
const DOCUMENT_SUBTITLE = 'บันทึกส่วนตัว / Personal notes';

export interface NotesExportInput {
  entries: Array<[string, string]>;
  monthNames: string[];
}

const formatDateLabel = (dateKey: string, monthNames: string[]): string => {
  const [year, month, day] = dateKey.split('-').map(Number);
  return `${day} ${monthNames[month - 1]} ${year} (พ.ศ. ${year + 543})`;
};

export const buildNotesDocument = ({ entries, monthNames }: NotesExportInput): string => {
  const lines: string[] = [DOCUMENT_TITLE, DOCUMENT_SUBTITLE, ''];

  entries.forEach(([dateKey, text]) => {
    lines.push(formatDateLabel(dateKey, monthNames));
    lines.push(`  ${text.replace(/\n/g, '\n  ')}`);
    lines.push('');
  });

  lines.push(`Exported ${new Date().toISOString().slice(0, 10)}`);
  return lines.join('\n');
};

export const NOTES_FILENAME = 'calendar-2027-notes.txt';

/** Save text as a file on web, fall back to the native share sheet elsewhere. */
export const saveTextFile = async (content: string, filename: string): Promise<boolean> => {
  if (Platform.OS === 'web') {
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    return true;
  }

  const result = await Share.share({ message: content, title: filename });
  return result.action === Share.sharedAction;
};
