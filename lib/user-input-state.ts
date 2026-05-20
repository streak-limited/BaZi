import { calculateBazi } from "@/lib/bazi/calculate";
import type { BaziChart, PromptVariableMap } from "@/lib/bazi/calculate";
import { DEFAULT_USER_INPUT, type UserFormInput } from "@/lib/user-input";

export interface UserInputState {
  input: UserFormInput;
  chart: BaziChart | null;
  variables: PromptVariableMap | null;
  error: string | null;
}

export function userStateFromInput(input: UserFormInput): UserInputState {
  const { chart, variables, error } = calculateBazi(input);
  return { input, chart, variables, error };
}

export function createInitialUserState(): UserInputState {
  return userStateFromInput(DEFAULT_USER_INPUT);
}

/** Blank form for「新增命主」modal */
export function createEmptyUserState(): UserInputState {
  return userStateFromInput({
    ...DEFAULT_USER_INPUT,
    name: "",
    email: "",
    birthDate: "",
    birthTime: "",
    birthTimeUnknown: false,
  });
}

export function userStateFromPersistedInput(
  input: Partial<UserFormInput> | undefined,
): UserInputState {
  if (!input) return createInitialUserState();
  return userStateFromInput({ ...DEFAULT_USER_INPUT, ...input });
}
