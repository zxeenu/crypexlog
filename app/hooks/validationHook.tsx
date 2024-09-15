import { useState } from "react";

type IssueObject = {
  _errors: string[];
};

function hasGivenProperty<T>(obj: any, key: string): obj is T {
  return obj && typeof obj === "object" && key in obj;
}

/**
 * Can only be used for top level issues
 * @returns
 */
export function useValidationHook<T extends IssueObject>() {
  const [validation, setValidation] = useState<T | undefined>(undefined);

  const getIssue = (key: keyof NonNullable<T>) => {
    const issue = validation?.[key] ?? null;

    if (!issue) {
      return null;
    }

    if (hasGivenProperty<IssueObject>(issue, "_errors")) {
      return issue._errors.join(", ");
    }

    return null;
  };

  const clearIssue = (key: keyof NonNullable<T>) => {
    if (!validation) {
      return;
    }

    if (!key) {
      return;
    }

    if (typeof key !== "string") {
      return;
    }

    const clonedValidation = structuredClone(validation ?? []);
    if (hasGivenProperty<keyof NonNullable<T>>(clonedValidation, key)) {
      delete clonedValidation[key];
      setValidation(clonedValidation);
    }

    return;
  };

  const setIssues = (issues: T | undefined) => {
    setValidation(issues);
  };

  return {
    getIssue,
    clearIssue,
    setIssues,
  };
}
