import { BackendApi, JobResponse } from "@/lib/backendApi.client";

export class UnknownWordApi extends BackendApi {
  async markAsLearned(wordId: number) {
    return this.post<JobResponse>(`/api/unknown-words/mark-as-learned/${wordId}`);
  }
  async markAsLearning(wordId: number) {
    return this.post<JobResponse>(`/api/unknown-words/mark-as-learning/${wordId}`);
  }
  async checkJobStatus(queueName: string, jobId: string) {
    return this.jobStatus(queueName, jobId);
  }
}
