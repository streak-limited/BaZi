"use client";

import styles from "./report.module.css";
import {
  JOB_OPTIONS,
  RELATIONSHIP_OPTIONS,
  type UserFormInput,
} from "@/lib/user-input";
import {
  type UserInputState,
  userStateFromInput,
} from "@/lib/user-input-state";

function toggleBtn(active: boolean): string {
  return active
    ? `${styles.userToggleBtn} ${styles.userToggleActive}`
    : styles.userToggleBtn;
}

interface Props {
  state: UserInputState;
  onChange: (next: UserInputState) => void;
}

export default function UserInputFormFields({ state, onChange }: Props) {
  const setInput = (patch: Partial<UserFormInput>) => {
    const input = { ...state.input, ...patch };
    onChange(userStateFromInput(input));
  };

  return (
    <>
      {state.error && <p className={styles.userFormError}>{state.error}</p>}

      <div className={styles.userFormGrid}>
        <label className={`${styles.userField} ${styles.userFieldWide}`}>
          <span className={styles.userLabel}>姓名</span>
          <input
            type="text"
            className={styles.userInput}
            placeholder="請輸入姓名"
            value={state.input.name}
            onChange={(e) => setInput({ name: e.target.value })}
          />
        </label>

        <label className={`${styles.userField} ${styles.userFieldWide}`}>
          <span className={styles.userLabel}>出生年月日</span>
          <div className={styles.userInline}>
            <input
              type="text"
              className={styles.userInput}
              placeholder="2000.01.01"
              value={state.input.birthDate}
              onChange={(e) => setInput({ birthDate: e.target.value })}
            />
            <div className={styles.userToggle}>
              <button
                type="button"
                className={toggleBtn(state.input.calendarType === "solar")}
                onClick={() => setInput({ calendarType: "solar" })}
              >
                國曆
              </button>
              <button
                type="button"
                className={toggleBtn(state.input.calendarType === "lunar")}
                onClick={() => setInput({ calendarType: "lunar" })}
              >
                農曆
              </button>
            </div>
          </div>
        </label>

        <label className={`${styles.userField} ${styles.userFieldWide}`}>
          <span className={styles.userLabel}>出生時間</span>
          <div className={styles.userInline}>
            <input
              type="text"
              className={styles.userInput}
              placeholder="13:30"
              value={state.input.birthTime}
              disabled={state.input.birthTimeUnknown}
              onChange={(e) => setInput({ birthTime: e.target.value })}
            />
            <button
              type="button"
              className={
                state.input.birthTimeUnknown
                  ? `${styles.userChip} ${styles.userChipActive}`
                  : styles.userChip
              }
              onClick={() =>
                setInput({
                  birthTimeUnknown: !state.input.birthTimeUnknown,
                })
              }
            >
              不知道時間
            </button>
          </div>
        </label>

        <label className={styles.userField}>
          <span className={styles.userLabel}>性別</span>
          <div className={styles.userToggle}>
            <button
              type="button"
              className={toggleBtn(state.input.gender === "男生")}
              onClick={() => setInput({ gender: "男生" })}
            >
              男生
            </button>
            <button
              type="button"
              className={toggleBtn(state.input.gender === "女生")}
              onClick={() => setInput({ gender: "女生" })}
            >
              女生
            </button>
          </div>
        </label>

        <label className={styles.userField}>
          <span className={styles.userLabel}>取向</span>
          <div className={styles.userToggle}>
            <button
              type="button"
              className={toggleBtn(state.input.sexuality === "異性戀")}
              onClick={() => setInput({ sexuality: "異性戀" })}
            >
              異性戀
            </button>
            <button
              type="button"
              className={toggleBtn(state.input.sexuality === "同性戀")}
              onClick={() => setInput({ sexuality: "同性戀" })}
            >
              同性戀
            </button>
          </div>
        </label>

        <label className={`${styles.userField} ${styles.userFieldWide}`}>
          <span className={styles.userLabel}>感情狀態</span>
          <select
            className={styles.userSelect}
            value={state.input.relationship}
            onChange={(e) =>
              setInput({
                relationship: e.target.value as UserFormInput["relationship"],
              })
            }
          >
            {RELATIONSHIP_OPTIONS.map((o) => (
              <option key={o} value={o}>
                {o}
              </option>
            ))}
          </select>
        </label>

        <label className={`${styles.userField} ${styles.userFieldWide}`}>
          <span className={styles.userLabel}>工作狀態</span>
          <select
            className={styles.userSelect}
            value={state.input.job}
            onChange={(e) =>
              setInput({ job: e.target.value as UserFormInput["job"] })
            }
          >
            {JOB_OPTIONS.map((o) => (
              <option key={o} value={o}>
                {o}
              </option>
            ))}
          </select>
        </label>

        <label className={`${styles.userField} ${styles.userFieldWide}`}>
          <span className={styles.userLabel}>電子信箱</span>
          <input
            type="email"
            className={styles.userInput}
            placeholder="example@gmail.com"
            value={state.input.email}
            onChange={(e) => setInput({ email: e.target.value })}
          />
        </label>
      </div>

      {state.chart && (
        <div className={styles.chartPanel}>
          <h3 className={styles.chartPanelTitle}>【命盤（系統計算）】</h3>
          <pre className={styles.chartPanelPre}>{state.chart.displayBlock}</pre>
        </div>
      )}
    </>
  );
}
