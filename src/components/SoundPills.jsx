const SOUNDS = [
  { id: 'off', label: 'o off' },
  { id: 'ambient', label: '⊙ ambient' },
  { id: 'lo-fi', label: '♪ lo-fi' },
  { id: 'noise', label: '≈ noise' },
  { id: 'rain', label: ': rain' },
];

function SoundPills({ selectedSound, onSelect }) {
  return (
    <div className="sound-pills">
      {SOUNDS.map((sound) => (
        <button
          key={sound.id}
          className={`sound-pill ${selectedSound === sound.id ? 'active' : ''}`}
          onClick={() => onSelect(sound.id)}
        >
          {sound.label}
        </button>
      ))}
    </div>
  );
}

export default SoundPills;
