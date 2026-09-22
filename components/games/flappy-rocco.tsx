"use client";

import { MinionGame } from "./minion-game";

export function FlappyRocco({ onFinished }: { onFinished?: () => void }) {
  return <MinionGame onScoreSubmitted={() => {}} onClose={() => onFinished?.()} />;
}
