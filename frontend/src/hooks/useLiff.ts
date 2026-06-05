import { useState, useEffect } from 'react';
import liff from '@line/liff';
import { UserInfo } from '../types';
import { fetchMe } from '../api/client';
import { MOCK_USER } from '../mocks/data';

interface UseLiffResult {
  userInfo: UserInfo | null;
  loading: boolean;
  error: string | null;
}

export function useLiff(): UseLiffResult {
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // 開発用モック: VITE_MOCK_MODE=true のとき LIFF をスキップ
    if (import.meta.env.VITE_MOCK_MODE === 'true') {
      setUserInfo(MOCK_USER);
      setLoading(false);
      return;
    }

    (async () => {
      try {
        await liff.init({ liffId: import.meta.env.VITE_LIFF_ID as string });
        if (!liff.isLoggedIn()) {
          liff.login();
          return;
        }
        const profile = await liff.getProfile();
        const me = await fetchMe(profile.userId);
        setUserInfo({
          userId: profile.userId,
          displayName: profile.displayName,
          isAdmin: me.isAdmin,
        });
      } catch (e) {
        setError(e instanceof Error ? e.message : 'LIFF初期化に失敗しました');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return { userInfo, loading, error };
}
