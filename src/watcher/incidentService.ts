import { EventEmitter } from 'events';

export type Severity = 'low' | 'medium' | 'high' | 'critical';

export interface Incident {
  wallet: string;
  txSignature: string;
  threatType: string;
  severity: Severity;
  timestamp: number;
}

export class IncidentService extends EventEmitter {
  private incidents: Incident[] = [];

  public async recordIncident(incident: Incident): Promise<void> {
    this.incidents.push(incident);
    this.emit('incident', incident);
    
    // In a real production environment, this would save to a database.
    console.log(`[IncidentService] Recorded ${incident.severity} threat for ${incident.wallet}: ${incident.threatType}`);
  }

  public getIncidents(): Incident[] {
    return [...this.incidents];
  }

  public getIncidentsByWallet(wallet: string): Incident[] {
    return this.incidents.filter(i => i.wallet === wallet);
  }
}

export const incidentService = new IncidentService();
