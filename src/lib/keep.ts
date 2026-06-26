import { getAccessToken } from './auth';

export interface KeepNote {
  name: string;
  title: string;
  body?: { text: { text: string } };
  list?: { listItems: { text: { text: string }, checked: boolean }[] };
  createTime: string;
  updateTime: string;
}

export const fetchNotes = async (): Promise<KeepNote[]> => {
  const token = await getAccessToken();
  if (!token) throw new Error('No access token available');

  // Since Google Keep API is Enterprise-only, it cannot be accessed with standard consumer accounts.
  throw new Error('The Google Keep API is restricted to Google Workspace Enterprise domains and cannot be accessed with personal email accounts (like @gmail.com or @hotmail.com).');
};

export const createNote = async (title: string, text: string): Promise<KeepNote> => {
  const token = await getAccessToken();
  if (!token) throw new Error('No access token available');

  throw new Error('The Google Keep API is restricted to Google Workspace Enterprise domains and cannot be accessed with personal email accounts.');
};
