import React from 'react';
import { useCallback, useState } from 'react';

function GenreWidget(props: {
  onPress: (value: boolean) => void;
  title: string;
  onIgnore: (title: string, ignore: boolean) => void;
}) {
  const { onIgnore, onPress, title } = props;

  const [active, setActive] = useState(true);
  const [ignored, setIgnored] = useState(false);

  const handleClick = useCallback(
    (isActive: boolean) => {
      if (ignored) {
        setActive(true);
        setIgnored(false);
        onPress(true);
      } else {
        setActive(isActive);
        onPress(isActive);
      }
    },
    [active, ignored]
  );

  const handleRightClick = useCallback(
    (title: string, isIgnored: boolean) => {
      if (active) {
        onPress(!isIgnored);
      }
      onIgnore(title, isIgnored);
      setIgnored(isIgnored);
    },
    [active, ignored]
  );

  return (
    <div key={title} className="genre">
      <button
        className="selectable"
        type="button"
        style={{ backgroundColor: ignored ? ' #ac0000' : active ? ' #008612' : ' #222222' }}
        onClick={() => {
          handleClick(!active);
        }}
        onContextMenu={() => {
          console.log('rightclick');
          handleRightClick(title, !ignored);
        }}
      >
        <div className="textTwo">{title}</div>
      </button>
    </div>
  );
}

export default GenreWidget;
