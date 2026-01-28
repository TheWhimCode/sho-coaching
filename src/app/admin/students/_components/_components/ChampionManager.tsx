'use client';

import { useState, useRef } from 'react';
import Image from 'next/image';
import { X } from 'lucide-react';
import { championAvatarByName } from '@/lib/league/datadragon';

type Props = {
  sessionId: string;
  champions: string[];
  onUpdate: (champions: string[]) => void;
};

export default function ChampionManager({ sessionId, champions, onUpdate }: Props) {
  const [input, setInput] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const addChampion = async () => {
    const name = input.trim();
    if (!name || champions.includes(name)) {
      setInput('');
      return;
    }

    setIsAdding(true);
    try {
      const updatedChampions = [...champions, name];

      const res = await fetch(`/api/admin/sessions/${sessionId}/champions`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ champions: updatedChampions }),
      });

      const data = await res.json();

      if (res.ok) {
        onUpdate(updatedChampions);
        setInput('');
      } else {
        console.error('Failed to add champion:', data);
        alert(`Failed to add champion: ${data.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Failed to add champion:', error);
      alert(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsAdding(false);
    }
  };

  const removeChampion = async (championToRemove: string) => {
    try {
      const updatedChampions = champions.filter((c) => c !== championToRemove);

      const res = await fetch(`/api/admin/sessions/${sessionId}/champions`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ champions: updatedChampions }),
      });

      const data = await res.json();

      if (res.ok) {
        onUpdate(updatedChampions);
      } else {
        console.error('Failed to remove champion:', data);
        alert(`Failed to remove champion: ${data.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Failed to remove champion:', error);
      alert(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addChampion();
    }
  };

  return (
    <div className="ml-7 space-y-1.5">
      {/* Input */}
      <input
        ref={inputRef}
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Add champion..."
        disabled={isAdding}
        className="w-full px-2 py-0.5 text-xs bg-zinc-900/50 border border-zinc-700 rounded text-zinc-200 placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 disabled:opacity-50 h-6"
      />

      {/* Champions row */}
      {champions.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {champions.map((champion) => {
            const avatarSrc = championAvatarByName(champion);
            return (
              <div
                key={champion}
                className="relative group"
                title={champion}
              >
                <div className="h-6 w-6 rounded-full overflow-hidden ring-1 ring-white/20 bg-zinc-900">
                  <Image
                    src={avatarSrc}
                    alt={champion}
                    width={24}
                    height={24}
                    className="h-full w-full object-cover scale-[1.12]"
                    unoptimized
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src =
                        '/images/coaching/reviews/placeholder-avatar.png';
                    }}
                  />
                </div>
                <button
                  onClick={() => removeChampion(champion)}
                  className="absolute -top-1 -right-1 h-3.5 w-3.5 rounded-full bg-red-500 text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                  aria-label={`Remove ${champion}`}
                >
                  <X className="h-2.5 w-2.5" />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
