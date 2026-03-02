import * as fs from 'fs';
import * as path from 'path';

const DB_FILE = path.join(__dirname, '../../data/sync.json');

export interface SyncData {
  userId: string;
  encryptedBlob: string;
  updatedAt: string;
  deviceCount: number;
}

class DBService {
  private data: Record<string, SyncData> = {};

  constructor() {
    this.ensureDirectoryExists();
    this.loadData();
  }

  private ensureDirectoryExists() {
    const dir = path.dirname(DB_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  private loadData() {
    if (fs.existsSync(DB_FILE)) {
      try {
        const fileContent = fs.readFileSync(DB_FILE, 'utf-8');
        this.data = JSON.parse(fileContent);
      } catch (error) {
        console.error('Error loading DB file:', error);
        this.data = {};
      }
    }
  }

  private saveData() {
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch (error) {
      console.error('Error saving DB file:', error);
    }
  }

  public getSyncData(userId: string): SyncData | null {
    return this.data[userId] || null;
  }

  public saveSyncData(userId: string, encryptedBlob: string) {
    const existing = this.data[userId];
    this.data[userId] = {
      userId,
      encryptedBlob,
      updatedAt: new Date().toISOString(),
      deviceCount: (existing?.deviceCount || 0) + 1,
    };
    this.saveData();
    return this.data[userId];
  }

  public deleteSyncData(userId: string) {
    if (this.data[userId]) {
      delete this.data[userId];
      this.saveData();
      return true;
    }
    return false;
  }
}

export const dbService = new DBService();
