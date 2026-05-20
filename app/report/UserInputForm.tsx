"use client";

import styles from "./report.module.css";
import UserInputFormFields from "./UserInputFormFields";
import type { UserInputState } from "@/lib/user-input-state";

export type { UserInputState } from "@/lib/user-input-state";
export {
  createInitialUserState,
  createEmptyUserState,
} from "@/lib/user-input-state";

interface Props {
  state: UserInputState;
  onChange: (next: UserInputState) => void;
}

/** @deprecated Prefer SubjectFormModal + SubjectCards on /report */
export default function UserInputForm({ state, onChange }: Props) {
  return (
    <section className={styles.userFormSection}>
      <div className={styles.userFormHeader}>
        <h2 className={styles.userFormTitle}>命主資料（8 項）</h2>
      </div>
      <UserInputFormFields state={state} onChange={onChange} />
    </section>
  );
}
