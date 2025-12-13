
export interface FieldChange {
  field: string;
  initialValue: any;
  updatedValue: any;
  timestamp: string;
  changedBy?: string;
}

export class FieldChangeTracker {
  private changes: Map<string, FieldChange> = new Map();
  private initialData: any = {};

  setInitialData(data: any) {
    this.initialData = { ...data };
  }

  trackChange(field: string, newValue: any, changedBy?: string) {
    const initialValue = this.getNestedValue(this.initialData, field);
    
    if (JSON.stringify(initialValue) !== JSON.stringify(newValue)) {
      this.changes.set(field, {
        field,
        initialValue,
        updatedValue: newValue,
        timestamp: new Date().toISOString(),
        changedBy
      });
    } else {
      // If value reverted to initial, remove the change
      this.changes.delete(field);
    }
  }

  getChanges(): FieldChange[] {
    return Array.from(this.changes.values());
  }

  hasChanges(): boolean {
    return this.changes.size > 0;
  }

  private getNestedValue(obj: any, path: string) {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

  formatChangeForPrint(change: FieldChange): string {
    const formatValue = (value: any) => {
      if (Array.isArray(value)) {
        return value.join(', ');
      }
      if (typeof value === 'object' && value !== null) {
        return JSON.stringify(value);
      }
      return String(value || 'N/A');
    };

    return `
      <div class="change-item">
        <strong>${change.field}:</strong><br>
        <span class="initial-value">Initial: ${formatValue(change.initialValue)}</span><br>
        <span class="updated-value">Updated: ${formatValue(change.updatedValue)}</span><br>
        <small class="change-meta">Changed on ${new Date(change.timestamp).toLocaleString()}${change.changedBy ? ` by ${change.changedBy}` : ''}</small>
      </div>
    `;
  }
}

export const fieldChangeTracker = new FieldChangeTracker();
