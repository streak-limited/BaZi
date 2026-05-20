import {
  createSubject,
  deleteSubject,
  ensureDefaultSubject,
  getPersistInfo,
  listSubjects,
  loadSubject,
  saveSubject,
} from "@/lib/report-store";
import type {
  AiOutputsMap,
  PersistedReportState,
  SubjectSummary,
} from "@/lib/report-storage-types";
import type { UserFormInput } from "@/lib/user-input";
import { sanitizeCompareModels } from "@/lib/gemini-models";

export {
  createSubject,
  deleteSubject,
  ensureDefaultSubject,
  getPersistInfo,
  listSubjects,
  loadSubject,
};

export async function loadPersistedReportState(
  subjectId: string,
): Promise<PersistedReportState | null> {
  return loadSubject(subjectId);
}

export async function savePersistedReportState(
  subjectId: string,
  displayName: string,
  userInput: UserFormInput,
  aiOutputs: AiOutputsMap,
  compareModels: string[],
): Promise<PersistedReportState> {
  return saveSubject(
    subjectId,
    displayName,
    userInput,
    aiOutputs,
    sanitizeCompareModels(compareModels),
  );
}

export async function listSubjectSummaries(): Promise<SubjectSummary[]> {
  return listSubjects();
}
