"use client";

import { useId, useState } from "react";

/**
 * Checkbox + conditional password input for portfolios that gate case studies.
 *
 * Default state is unchecked (no password field visible) so the form stays
 * minimal for the 90% of users whose work is public. When checked, the
 * password input slides in and takes browser focus so the user can type
 * straight into it.
 *
 * Name stays `casePassword` either way — on submit the server receives an
 * empty string if the checkbox was never ticked, which Zod coerces to
 * undefined downstream.
 */
export function CasePasswordField() {
  const checkboxId = useId();
  const inputId = useId();
  const [enabled, setEnabled] = useState(false);

  return (
    <div className="flex w-full flex-col gap-3">
      <label
        htmlFor={checkboxId}
        className="inline-flex cursor-pointer items-center gap-2.5 self-start text-[13.5px]"
        style={{ color: "var(--ink-soft)" }}
      >
        <input
          id={checkboxId}
          type="checkbox"
          checked={enabled}
          onChange={(e) => setEnabled(e.target.checked)}
          className="h-[16px] w-[16px] cursor-pointer accent-[var(--ink)]"
          style={{ margin: 0 }}
        />
        My portfolio needs a password
      </label>

      {enabled && (
        <input
          id={inputId}
          name="casePassword"
          type="password"
          placeholder="Password"
          required
          autoFocus
          autoComplete="off"
          spellCheck={false}
          autoCapitalize="off"
          maxLength={100}
          className="min-w-0 flex-1 outline-none focus:border-[var(--ink)]"
          style={{
            fontFamily: "var(--f-body)",
            fontSize: 15,
            color: "var(--ink)",
            background: "var(--white)",
            border: "1.5px solid var(--rule)",
            borderRadius: 12,
            paddingInline: 20,
            paddingBlock: 14,
            textAlign: "left",
          }}
        />
      )}
    </div>
  );
}
