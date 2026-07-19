import React from 'react';
import { useCallback, useState } from 'react';

function GenreWidget(props: {
  onToggleKeep: (value: boolean) => void; // handle keep status on main thread
  onToggleIgnore: (title: string, ignore: boolean) => void; // handle ignore status on main thread

  title: string; // name of genre
}) {
  const { onToggleIgnore, onToggleKeep, title } = props;

  const [keep, setKeep] = useState(true); //status of genre being kept for album
  const [ignore, setIgnore] = useState(false); //status of genre being permanently ignored in future scanns

  // toggle keep genre for corresponding album
  const handleClick = useCallback(
    (isActive: boolean) => {
      // if genre is ignored:
      if (ignore) {
        onToggleKeep(true); // execute parent callback
        setKeep(true); // add genre to album
        setIgnore(false); // remove ignore status
      } else {
        onToggleKeep(isActive); // execute parent callback with new keep status
        setKeep(isActive); // update state keep status
      }
    },
    [keep, ignore]
  );

  // toggle add genre to ignore list
  const handleRightClick = useCallback(
    (title: string, isIgnored: boolean) => {
      // if album is currently being kept:
      if (keep) {
        onToggleKeep(!isIgnored); // execute parent callback with reverse of ignore status
      }
      onToggleIgnore(title, isIgnored); // execute parent callback with new ignore status
      setIgnore(isIgnored); // update state ignore status
    },
    [keep, ignore]
  );

  return (
    <div key={title} className="genre">
      <button
        className={ignore ? 'selectableDisabled' : keep ? 'selectableActive' : 'selectableInactive'}
        type="button"
        //style={{ backgroundColor: ignore ? ' #ac0000' : keep ? ' #008612' : ' #222222' }}
        onClick={() => {
          handleClick(!keep);
        }}
        onContextMenu={() => {
          handleRightClick(title, !ignore);
        }}
      >
        <div className="selectableText">{title}</div>
      </button>
    </div>
  );
}

export default GenreWidget;
