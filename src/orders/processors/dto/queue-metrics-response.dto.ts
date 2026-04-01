import Bull from 'bull';

export class QueueMetricsResponseDto {
  id: string | number;
  name: string;
  orderId: string;
  attempsMade: number;
  failedReason: string | undefined;
  timestamp: Date;
  stacktrace: string[] | null;
  finishedOn: Date | null;
  processedOn: Date | null;

  constructor(job: Bull.Job) {
    this.id = job.id;
    this.name = job.name;
    this.attempsMade = job.attemptsMade;
    this.failedReason = job.failedReason;
    this.timestamp = new Date(job.timestamp);
    this.stacktrace = job.stacktrace;
    this.finishedOn = job.finishedOn ? new Date(job.finishedOn) : null;
    this.processedOn = job.processedOn ? new Date(job.processedOn) : null;
  }
}
