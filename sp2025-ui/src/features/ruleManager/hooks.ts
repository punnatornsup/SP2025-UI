// src/features/ruleManager/hooks.ts
import { useEffect, useState } from "react";
import { fetchActiveKeywordRules, fetchSensitivity } from "./service";
import type { ActiveKeywordRuleDTO, SensitivityDTO } from "./types";

export function useActiveKeywordRules() {
  const [data, setData] = useState<ActiveKeywordRuleDTO[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError(null);

    fetchActiveKeywordRules()
      .then((d) => alive && setData(d))
      .catch((e: unknown) => alive && setError(e instanceof Error ? e.message : String(e)))
      .finally(() => alive && setLoading(false));

    return () => {
      alive = false;
    };
  }, []);

  return { data, loading, error, setData };
}

export function useSensitivity() {
  const [data, setData] = useState<SensitivityDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError(null);

    fetchSensitivity()
      .then((d) => alive && setData(d))
      .catch((e: unknown) => alive && setError(e instanceof Error ? e.message : String(e)))
      .finally(() => alive && setLoading(false));

    return () => {
      alive = false;
    };
  }, []);

  return { data, loading, error, setData };
}
