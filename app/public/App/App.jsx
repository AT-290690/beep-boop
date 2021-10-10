const { useState, useEffect, useContext, createContext } = React;
const API_URL = 'http://localhost:9000';
import decode from '../decode.js';
const elementsMap = new Map();
const sounds = [];
for (let i = 0; i < 7; i++) sounds.push(document.getElementById(`switch${i}`));

const playSound = index => {
  const sound = sounds[index];
  if (sound) {
    sound.volume = 0.5;
    sound.currentTime = 0;
    sound.play();
  }
};
const loginMessage = 'You are logged!';
const AllNotes = [
  'A0',
  'B0',
  'C1',
  'D1',
  'E1',
  'F1',
  'G1',
  'A1',
  'B1',
  'C2',
  'D2',
  'E2',
  'F2',
  'G2',
  'A2',
  'B2',
  'C3',
  'D3',
  'E3',
  'F3',
  'G3',
  'A3',
  'B3',
  'C4',
  'D4',
  'E4',
  'F4',
  'G4',
  'A4',
  'B4',
  'C5',
  'D5',
  'E5',
  'F5',
  'G5',
  'A5',
  'B5',
  'C6',
  'A6',
  'B6',
  'C7',
  'D7',
  'E7',
  'F7',
  'G7',
  'A7',
  'B7',
  'B8'
];
const getNoteId = note => `${note.x}:${note.y}`;
const AuthContext = createContext();
const LoginScreen = () => {
  const { sessionAuth, setSessionAuth } = useContext(AuthContext);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState(null);
  const [loading, setLoading] = useState(null);
  const logUser = reg => {
    if (!username || !password) return;
    setLoading(true);
    setMessage(null);
    fetch(`${API_URL}/account/login`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        username,
        password,
        reg
      })
    })
      .then(res => res.json())
      .then(res => {
        if (res.error) {
          setMessage(res.error);
        } else {
          setSessionAuth(res);
          setMessage('You are logged!');
        }
      })
      .finally(() => setLoading(false));
  };
  return (
    <>
      <div className="login">
        <input
          onChange={e => setUsername(e.currentTarget.value)}
          className="ui"
          placeholder="Username"
          style={{
            border: 'solid 2px springgreen',
            color: 'white',
            maxWidth: 300
          }}
        />
        <input
          onChange={e => setPassword(e.currentTarget.value)}
          className="ui"
          placeholder="Password"
          type="password"
          style={{
            border: 'solid 2px springgreen',
            color: 'white',
            maxWidth: 300
          }}
          onKeyPress={e => e.key === 'Enter' && logUser()}
        />
        <button
          className="ui"
          onClick={() => logUser(true)}
          style={{ color: 'mediumaquamarine' }}
        >
          ᐉ
        </button>

        {!loading
          ? message && (
              <span
                className="ui"
                style={{
                  position: 'absolute',
                  fontSize: 25,
                  top: -30,
                  color: message !== loginMessage ? 'red' : 'limegreen'
                }}
              >
                {message}
              </span>
            )
          : null}
      </div>
    </>
  );
};

const hashCode = str => {
  let hash = 0;
  for (let i = 0; i < str.length; i++)
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  return hash;
};

const intToRGB = i => {
  const c = (i & 0x00ffffff).toString(16).toUpperCase();
  return '000000'.substring(0, 6 - c.length) + c;
};

const Note = ({ i, j, note, sound, sheet, mod }) => {
  const id = `${i}:${j}`;
  const imported = sheet[id] || null;
  const [delay, setDelay] = useState(imported ? imported.delay : 0.1);
  const [size, setSize] = useState(
    imported && imported.delay > 0.1 ? imported.delay * 2 + 1 : 1
  );
  const [opacity, setOpacity] = useState(imported ? '1' : '0.1');
  const [color] = useState('#' + intToRGB(hashCode(note + '1230')));

  // const [focus, setFocus] = useState(!!imported);
  if (imported) {
    sheet[id] = { value: note, delay: delay, x: i, y: j };
  }
  return (
    <div className="note">
      <button
        style={{ opacity }}
        ref={element => {
          if (i < mod) {
            elementsMap.set(id, element);
          }
        }}
        className="note-button"
        id={id}
        onKeyPress={e => {
          if (e.key === '=') {
            setDelay(Math.max(0.1, delay + 0.05));
            setSize(delay * 2 + 1);
          } else if (e.key === '-') {
            setDelay(Math.max(0.1, delay - 0.05));
            setSize(delay * 2 + 1);
          }
        }}
        onClick={() => {
          const id = `${i}:${j}`;
          if (sheet[id]) {
            setOpacity('0.1');
            delete sheet[id];
          } else {
            setOpacity('1');
            sound.triggerAttackRelease(note, delay);
            sheet[id] = { value: note, delay: delay, x: i, y: j };
          }
        }}
      >
        <div
          style={{
            transform: `scale(${size})`,
            backgroundColor: color
          }}
          className="shape"
        ></div>
      </button>
    </div>
  );
};

const matrix = (x, y, v) =>
  Array(x)
    .fill(v)
    .map(_ => Array(y).fill(v));

const sound = new Tone.PolySynth(Tone.Synth, {
  envelope: {
    releaseCurve: 'sine'
  }
}).toDestination();

Tone.context.lookAhead = 0.2;
const clearAllTimeouts = () => {
  let id = window.setTimeout(() => {}, 0);

  while (id--) {
    window.clearTimeout(id);
  }
};

const Matrix = () => {
  const [mod] = useState(15);
  const [width] = useState(15);
  const [offset, setOffset] = useState(12);
  const [Notes, setNotes] = useState(AllNotes.slice(offset, offset + width));
  const [speed, setSpeed] = useState(0.25);
  const [pagination, setPagination] = useState(0);
  const [size, setSize] = useState(15);
  const [sheet, setSheet] = useState({});
  const [reload, setReload] = useState(true);
  const [load, setLoad] = useState(false);
  const [title, setTitle] = useState('');
  const [isMusicListOpen, setIsMusicListOpen] = useState(false);
  const [musicList, setMusicList] = useState([]);
  const { sessionAuth } = useContext(AuthContext);
  useEffect(() => {
    setLoad(true);
  }, [reload]);

  const populateMusicList = ({ username, page, perPage }) => {
    setIsMusicListOpen(true);
    fetch(
      `${API_URL}/music/byAuthor?author=${username}&page=${page}&perPage=${perPage}`,
      {
        method: 'GET',
        headers: {
          Authorization: 'Bearer ' + sessionAuth.token,
          'Content-Type': 'application/json'
        }
      }
    )
      .then(res => res.json())
      .then(res => (!res.error ? setMusicList(res) : alert(res.error)));
  };

  const addMusicFromList = current => {
    setLoad(false);
    setSpeed(current.speed);
    if (current.offset !== offset) {
      setOffset(current.offset);
      const newNotes = AllNotes.slice(current.offset, current.offset + width);
      setNotes(newNotes);
    }
    setSheet(current.sheet);
    setIsMusicListOpen(false);
    setPagination(0);
    setReload(!reload);
    playSound(6);
  };

  const calibrateNotes = () => {
    Object.values(sheet).forEach(
      note => (sheet[getNoteId(note)].value = Notes[note.y])
    );
  };

  const offsetNotes = e => {
    setLoad(false);
    playSound(3);
    const newNotes = AllNotes.slice(
      +e.currentTarget.value,
      +e.currentTarget.value + width
    );
    setNotes(newNotes);
    calibrateNotes();
    setReload(!reload);
  };

  const deleteNotes = () => {
    clearAllTimeouts();
    setSheet({});
    playSound(0);
    setPagination(0);
    setLoad(false);
    setReload(!reload);
    if (title.trim()) {
      fetch(`${API_URL}/music/remove`, {
        method: 'DELETE',
        headers: {
          Authorization: 'Bearer ' + sessionAuth.token,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title
        })
      });
    }
  };

  const playInterval = () => {
    let localMax = -Infinity;
    setTimeout(() => {
      if (size !== mod) setSize(mod);
      clearAllTimeouts();
      elementsMap.forEach(elem => {
        if (elem) {
          elem.style.opacity = '0.1';
        }
      });
      const sheetArr = Object.values(sheet)
        // .sort((prev, next) =>
        //   prev[2] * 10 + prev[3] >= next[2] * 10 + next[3] ? -1 : 1
        // )
        .map(note => {
          const { x, y } = note;
          const element = elementsMap.get(`${(x + pagination) % mod}:${y}`);

          if (element) {
            element.style.opacity = '0.1';
            element.firstChild.style.transform = `scale(1)`;
          }
          localMax = Math.max(localMax, x);
          return { note, element, index: x };
        });

      for (let i = 0; i < localMax; i++) {
        if (!sheetArr[i]) {
          sheetArr[i] = { note: null, element: null, index: i };
        }
      }

      sheetArr.map(({ note, element, index }) =>
        setTimeout(() => {
          if (note) {
            const { value, delay } = note;
            sound.triggerAttackRelease(value, delay);
            element.style.opacity = '1';
            element.firstChild.style.transform = `scale(${
              delay > 0.1 ? delay * 2 + 1.5 : 1.5
            })`;
            setTimeout(() => {
              element.style.opacity = '0.1';
              element.firstChild.style.transform = `scale(1)`;
              index === localMax &&
                setTimeout(() => {
                  playInterval();
                }, 1000);
            }, 600);
          }
        }, speed * index * 1000 + 500)
      );
    }, 250);
  };

  const play = () => {
    if (pagination !== 0) {
      setPagination(0);
      setLoad(false);
      setReload(!reload);
    }
    playInterval();
  };

  const editMode = () => {
    setLoad(false);
    clearAllTimeouts();
    setReload(!reload);
  };

  return (
    <div>
      <div>
        <div className="menu">
          <input
            className="ui"
            onChange={e => {
              setOffset(+e.currentTarget.value);
              offsetNotes(e);
            }}
            value={offset}
            type="number"
            min="0"
            max={AllNotes.length}
            style={{
              width: '50px',
              textAlign: 'center',
              fontSize: '20px',
              border: 'solid 2px springgreen',
              color: 'springgreen'
            }}
          />
          <span
            className="ui icon"
            style={{
              color: 'cornflowerblue',
              fontSize: '55px',
              margin: '0 15px'
            }}
            onClick={() => {
              if (isMusicListOpen) return setIsMusicListOpen(false);
              populateMusicList({
                username: title || sessionAuth.data.username,
                page: Math.floor(speed),
                perPage: 10
              });
            }}
          >
            ◆
          </span>
          <input
            className="ui"
            onChange={e => setSpeed(+e.currentTarget.value)}
            step="0.1"
            type="number"
            style={{
              width: 80,
              fontSize: 20,
              textAlign: 'center',
              border: 'solid 2px',
              color: 'yellow'
            }}
            value={speed}
          />
        </div>
      </div>
      <div className="tools">
        <button
          onClick={play}
          className="ui"
          style={{
            color: 'springgreen'
          }}
        >
          ▷
        </button>
        <button
          onClick={() => {
            editMode();
            playSound(1);
          }}
          className="ui"
          style={{
            fontSize: 35,
            color: 'yellow'
          }}
        >
          &#9633;
        </button>

        <button
          onClick={() => {
            if (pagination <= 0) return;
            setLoad(false);
            setPagination(pagination - size);
            setReload(!reload);
            playSound(4);
          }}
          className="ui"
          style={{
            color: 'cornflowerblue'
          }}
        >
          &#9650;
        </button>
        <button
          className="ui"
          // onClick={() => {
          //   if (pagination === 0) {
          //     setExport(bkpExp);
          //   } else {
          //     const index = pagination / size;
          //     const sliceIndex = index * size;

          //     const newMusic = Object.values(sheet)
          //       .sort((prev, next) =>
          //         prev[2] * 10 + prev[3] >= next[2] * 10 + next[3] ? -1 : 1
          //       )
          //       .slice(sliceIndex, sliceIndex + size)
          //       .reduce((acc, note) => {
          //         const id = `${note[2]}:${note[3]}`;
          //         acc[id] = note;
          //         return acc;
          //       }, {});
          //     //    setLoad(false);
          //     setBkpExport(sheet);
          //     setSheet(newMusic);
          //     setPagination(0);
          //     editMode();
          //     playSound(3);
          //   }
          // }}
          style={{
            color: 'lime'
          }}
        >
          {pagination / size}
        </button>
        <button
          onClick={e => {
            setLoad(false);
            setPagination(size + pagination);
            setReload(!reload);
            playSound(4);
          }}
          className="ui"
          style={{
            color: 'orange'
          }}
        >
          &#9660;
        </button>
        <button
          className="ui"
          style={{ color: 'cyan' }}
          onClick={() => {
            fetch(`${API_URL}/music/insert`, {
              method: 'POST',
              headers: {
                Authorization: 'Bearer ' + sessionAuth.token,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                title,
                sheet,
                speed,
                offset
              })
            })
              .then(() => playSound(2))
              .catch(() => playSound(0));
          }}
        >
          save
        </button>
        <input
          onChange={e => setTitle(e.currentTarget.value)}
          className="ui"
          placeholder="Title"
          style={{
            border: 'none',
            color: 'white',
            maxWidth: 180
          }}
        />
        <button
          onClick={deleteNotes}
          className="ui"
          style={{
            color: 'crimson'
          }}
        >
          X
        </button>
      </div>
      {load && (
        <div
          className="matrix"
          style={{ gridTemplateColumns: 'auto '.repeat(Notes.length) }}
        >
          {matrix(mod, Notes.length, null).map((row, i) =>
            row.map((col, j) => (
              <Note
                i={i + pagination}
                j={j}
                key={i + '-' + Notes[j]}
                note={Notes[j]}
                sound={sound}
                sheet={sheet}
                mod={mod}
              />
            ))
          )}
        </div>
      )}
      {isMusicListOpen && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            bottom: 0,
            right: 0,
            margin: 'auto',
            width: 'fit-content',
            height: 'fit-content',
            backgroundColor: 'black',
            zIndex: 1000
          }}
        >
          <div className="music-list">
            {musicList.map((music, index) => (
              <button
                className="ui"
                onClick={() => addMusicFromList(musicList[index])}
                key={music.title + '_' + index}
              >
                {music.title.split(sessionAuth.data.username + "'s")[1] ||
                  music.title}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const App = () => {
  const existingSessionAuth = JSON.parse(localStorage.getItem('sessionTL'));
  const [sessionAuth, setSessionAuth] = useState(existingSessionAuth);

  const setSession = data => {
    if (data) localStorage.setItem('sessionTL', JSON.stringify(data));
    else localStorage.removeItem('sessionTL');

    setSessionAuth(data);
  };

  const manageTokenExpiration = () => {
    if (sessionAuth) {
      const token = sessionAuth.token;
      const currentTime = new Date().valueOf();
      const decoded = decode(token);
      const tokenExp = new Date(0).setUTCSeconds(decoded.exp).valueOf();

      if (tokenExp < currentTime) {
        setSession(null);
      } else {
        setTimeout(() => setSession(null), tokenExp - currentTime);
      }
    }

    return true;
  };

  manageTokenExpiration();

  return (
    <AuthContext.Provider value={{ sessionAuth, setSessionAuth: setSession }}>
      <div className="App">
        <LoginScreen />
        <Matrix />
      </div>
    </AuthContext.Provider>
  );
};

ReactDOM.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
  document.getElementById('root')
);
