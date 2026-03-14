const SOUNDS = [
  { id: 'off', label: 'o off' },
  { id: 'ambient', label: '⊙ ambient' },
  { id: 'lo-fi', label: '♪ lo-fi' },
  { id: 'noise', label: '≈ noise' },
  { id: 'rain', label: ': rain' },
];

const AMBIENT_YOUTUBE_URL = 'https://www.youtube.com/watch?v=hhw90xpY7MI&list=RDhhw90xpY7MI&start_radio=1';

function SoundPills({ selectedSound, onSelect }) {
  return (
    <div className="sound-pills-wrap">
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
      {selectedSound === 'ambient' && (
        <a
          href={AMBIENT_YOUTUBE_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="sound-pills-ambient-link"
        >
          Listen on YouTube
        </a>
      )}
    </div>
  );
}

export default SoundPills;
