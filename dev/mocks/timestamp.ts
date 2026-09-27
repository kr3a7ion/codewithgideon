// Shared by the mocks (kept separate to avoid a circular import).
export class Timestamp {
  constructor(private ms: number) {}
  static fromMillis(ms: number) { return new Timestamp(ms); }
  static fromDate(d: Date) { return new Timestamp(d.getTime()); }
  static now() { return new Timestamp(Date.now()); }
  toMillis() { return this.ms; }
  toDate() { return new Date(this.ms); }
  get seconds() { return Math.floor(this.ms / 1000); }
}

