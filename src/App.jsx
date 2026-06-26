import React, { useState, useEffect, useRef, useCallback } from 'react';
import Clock from './components/Clock';
import MemoInput from './components/MemoInput';
import Stats from './components/Stats';
import {
  checkPinOrder, generateScrambleText, scrambleconvert,
  computeMemoForPairs, LETTER_MAPS, DEFAULT_PIN_ORDERS,
} from './logic/clockLogic';
import {
  loadStats, addStatRow, deleteLastStat, clearStats, computeInstantStats,
  exportStatsCsv, isPracticeMode, setPracticeMode, isTrainerMode, setTrainerMode,
  getInputLetterType, setInputLetterType, getTimerPref, setTimerPref,
  getHideHourIndicators, setHideHourIndicators,
} from './logic/storage';
import './App.css';

function getSimulTypeFromURL() {
  const params = new URLSearchParams(window.location.search);
  const type = (params.get('type') || 'bpaul').toLowerCase();
  return type === 'tommy' ? 'Tommy' : 'BPaul';
}

function getFlipTypeForSimul(simultype) {
  return simultype === 'BPaul' ? 'y2' : 'x2';
}

function getPinOrderStrForSimultype(simultype) {
  if (simultype === 'BPaul') return DEFAULT_PIN_ORDERS.BPaul;
  return DEFAULT_PIN_ORDERS.Tommy;
}

function getDefaultCheckedPairs(pinOrderStr, simultype) {
  const items = pinOrderStr.split(' ');
  if (simultype === 'Tommy') {
    return items.filter(item => ['dl', 'R', '\\', 'UL', 'L'].includes(item));
  }
  return items.filter(item => ['dl', 'R', 'ur', 'L'].includes(item));
}

const ZERO_RANDOM = [0,0,0,0,0,0,0,0,0,0,0,0,0,0];

export default function App() {
  const isMobile = /android|iphone|kindle|ipad/i.test(navigator.userAgent);

  const initSimultype = getSimulTypeFromURL();
  const initPinOrderStr = getPinOrderStrForSimultype(initSimultype);
  const initPinOutput = checkPinOrder(initPinOrderStr);
  const initOrder = initPinOutput
    ? [initPinOutput[0].split(' '), initPinOutput[1].split(' '), initPinOutput[2]]
    : null;

  // Persisted preferences
  const [simultype, setSimultype] = useState(initSimultype);
  const [inputType, setInputType] = useState(() => getInputLetterType());
  const [executionMode, setExecutionMode] = useState(() => isTrainerMode());
  const [timerEnabled, setTimerEnabled] = useState(() => getTimerPref());
  const [hideHourIndicatorsState, setHideHourIndicatorsState] = useState(() => getHideHourIndicators());
  const [practiceMode, setPracticeModeState] = useState(() => isPracticeMode());
  const [flipType, setFlipType] = useState(() => getFlipTypeForSimul(initSimultype));

  // Clock/game state
  const [side, setSide] = useState('white');
  const [random, setRandom] = useState(ZERO_RANDOM);
  const [scrambletext, setScrambletext] = useState('');
  const previousScrambleRef = useRef('');
  const [memo, setMemo] = useState('');
  const [checkResult, setCheckResult] = useState({ text: 'Enter Memo', color: 'white' });
  const [memoDisplay, setMemoDisplay] = useState('Memo: ');
  const [memoColor, setMemoColor] = useState('white');

  // Pin order / custom
  const [pinOrderStr, setPinOrderStr] = useState(initPinOrderStr);
  const [order, setOrder] = useState(initOrder);
  const [checkedPairs, setCheckedPairs] = useState(() => getDefaultCheckedPairs(initPinOrderStr, initSimultype));
  const [umoveLeft, setUmoveLeft] = useState(false);
  const [dmoveLeft, setDmoveLeft] = useState(false);
  const [showCustomPin, setShowCustomPin] = useState(false);

  // UI toggles
  const [showInputButtons, setShowInputButtons] = useState(isMobile);
  const [showMoreSettings, setShowMoreSettings] = useState(false);
  const [showStatSettings, setShowStatSettings] = useState(false);
  const [stats, setStats] = useState(() => computeInstantStats());

  // Timer
  const [timerDisplay, setTimerDisplay] = useState('0.00');
  const timerRef = useRef({ isRunning: false, startTime: 0, raf: null, seconds: 0 });

  function timerFrame() {
    if (!timerRef.current.isRunning) return;
    const elapsed = (performance.now() - timerRef.current.startTime) / 1000;
    timerRef.current.seconds = Math.min(elapsed, 999.99);
    setTimerDisplay(timerRef.current.seconds.toFixed(2));
    if (timerRef.current.seconds < 999.99) {
      timerRef.current.raf = requestAnimationFrame(timerFrame);
    }
  }

  function startTimer() {
    if (timerRef.current.isRunning) return;
    timerRef.current.isRunning = true;
    timerRef.current.startTime = performance.now() - timerRef.current.seconds * 1000;
    timerRef.current.raf = requestAnimationFrame(timerFrame);
  }

  function stopTimer() {
    if (!timerRef.current.isRunning) return;
    cancelAnimationFrame(timerRef.current.raf);
    timerRef.current.isRunning = false;
  }

  function resetTimer() {
    cancelAnimationFrame(timerRef.current.raf);
    timerRef.current.isRunning = false;
    timerRef.current.seconds = 0;
    setTimerDisplay('0.00');
  }

  function restartTimer() { resetTimer(); startTimer(); }

  const letterMap = LETTER_MAPS[inputType] || LETTER_MAPS.letters;

  function getMemo(rnd, ord, sim, lm, pairs, uL, dL) {
    if (!ord || pairs.length === 0) return '';
    return computeMemoForPairs(rnd, ord, sim, lm, pairs, uL, dL);
  }

  function flip() {
    setSide(prev => prev === 'white' ? 'black' : 'white');
  }

  // Use refs for stable callback access in keyboard handler
  const stateRef = useRef({});
  stateRef.current = {
    executionMode, memo, random, order, simultype, letterMap, checkedPairs,
    umoveLeft, dmoveLeft, scrambletext, timerEnabled, flipType, side,
  };

  function doScramble(rnd, sctext, execMode, ord, sim, lm, pairs, uL, dL, timerOn) {
    setCheckResult({ text: execMode ? 'Execution Trainer Mode' : 'Enter Memo', color: 'white' });
    setMemoColor('white');
    setMemo('');
    setScrambletext(sctext);
    setRandom(rnd);
    setSide('white');
    if (!execMode) {
      setMemoDisplay('Memo: ');
    } else {
      const m = getMemo(rnd, ord, sim, lm, pairs, uL, dL);
      setMemoDisplay('Memo: ' + m);
    }
    if (timerOn) restartTimer();
  }

  function scramble() {
    const s = stateRef.current;
    const sctext = generateScrambleText();
    const rnd = scrambleconvert(sctext);
    doScramble(rnd, sctext, s.executionMode, s.order, s.simultype, s.letterMap, s.checkedPairs, s.umoveLeft, s.dmoveLeft, s.timerEnabled);
  }

  function enterScramble() {
    const entered = prompt('Enter Scramble:');
    if (!entered) return;
    const rnd = scrambleconvert(entered);
    const s = stateRef.current;
    setRandom(rnd);
    setScrambletext(entered);
    setSide('white');
    if (!s.executionMode) {
      setMemoDisplay('Memo: ');
    } else {
      const m = getMemo(rnd, s.order, s.simultype, s.letterMap, s.checkedPairs, s.umoveLeft, s.dmoveLeft);
      setMemoDisplay('Memo: ' + m);
    }
    restartTimer();
  }

  function checkMemo() {
    const s = stateRef.current;
    if (!s.memo) return;
    const realMemo = getMemo(s.random, s.order, s.simultype, s.letterMap, s.checkedPairs, s.umoveLeft, s.dmoveLeft);
    const isCorrect = s.memo === realMemo;

    if (isCorrect) {
      setCheckResult({ text: 'Correct!', color: 'green' });
      setMemoColor('white');
    } else {
      setCheckResult({ text: `Correct memo: ${realMemo}`, color: 'white' });
      setMemoColor('red');
    }

    if (previousScrambleRef.current !== s.scrambletext && !isPracticeMode()) {
      addStatRow({
        timestamp: new Date().toLocaleString(),
        pinorder: s.simultype === 'Custom' ? pinOrderStr : s.simultype,
        time_seconds: s.timerEnabled ? Number(timerRef.current.seconds.toFixed(2)) : '',
        correct_memo: realMemo.trim(),
        input_memo: (s.memo || '').trim(),
        is_correct: isCorrect,
        scramble: s.scrambletext,
      });
      setStats(computeInstantStats());
      previousScrambleRef.current = s.scrambletext;
    }
    stopTimer();
  }

  function appendLetter(letter) {
    setMemo(prev => {
      let m = prev;
      if (m.length >= 20) return m;
      m += letter;
      if ([2, 5, 8, 11, 14, 17].includes(m.length)) m += ' ';
      setMemoDisplay('Memo: ' + m);
      return m;
    });
  }

  function deleteLetter() {
    setMemo(prev => {
      let m = [3, 6, 9, 12, 15, 18].includes(prev.length)
        ? prev.slice(0, -2)
        : prev.slice(0, -1);
      setMemoDisplay('Memo: ' + m);
      return m;
    });
  }

  function copyScramble() {
    navigator.clipboard.writeText(stateRef.current.scrambletext);
    alert('Copied scramble to clipboard!');
  }

  function applyPinOrder(pinStr, simType, isChange) {
    const out = checkPinOrder(pinStr);
    if (!out) {
      if (isChange) alert("That's not a pin order! Please try again.");
      return false;
    }
    const newOrder = [out[0].split(' '), out[1].split(' '), out[2]];
    const newPinStr = out[0];
    const defaultPairs = getDefaultCheckedPairs(newPinStr, simType);
    setPinOrderStr(newPinStr);
    setOrder(newOrder);
    setCheckedPairs(defaultPairs);
    return { newOrder, defaultPairs };
  }

  function changeSimultype(newType) {
    const newFlipType = getFlipTypeForSimul(newType);
    setSimultype(newType);
    setFlipType(newFlipType);
    setShowCustomPin(newType === 'Custom');

    const pinStr = getPinOrderStrForSimultype(newType === 'Custom' ? 'Tommy' : newType);
    applyPinOrder(pinStr, newType, false);

    if (newType === 'Tommy' || newType === 'BPaul') {
      const params = new URLSearchParams(window.location.search);
      params.set('type', newType.toLowerCase());
      window.history.replaceState({}, '', '?' + params.toString());
    } else {
      window.history.replaceState({}, '', window.location.pathname);
    }

    setSide('white');

    if (!stateRef.current.executionMode) {
      setMemoDisplay('Memo: ');
    }
  }

  function handleChangePinOrder() {
    const input = prompt('enter pin order, for example: dl R DR \\ UL L ur');
    if (!input) return;
    const result = applyPinOrder(input, simultype, true);
    if (result && executionMode) {
      const m = getMemo(random, result.newOrder, simultype, letterMap, result.defaultPairs, umoveLeft, dmoveLeft);
      setMemoDisplay('Memo: ' + m);
    }
  }

  function toggleExecutionMode(checked) {
    setTrainerMode(checked);
    setExecutionMode(checked);
    if (checked) {
      setCheckResult({ text: 'Execution Trainer Mode', color: 'white' });
      resetTimer();
    } else {
      setMemoDisplay('Memo: ');
      setCheckResult({ text: 'Enter Memo', color: 'white' });
    }
    // Scramble to start fresh
    const sctext = generateScrambleText();
    const rnd = scrambleconvert(sctext);
    setRandom(rnd);
    setScrambletext(sctext);
    setMemo('');
    setSide('white');
    if (checked) {
      const m = getMemo(rnd, order, simultype, letterMap, checkedPairs, umoveLeft, dmoveLeft);
      setMemoDisplay('Memo: ' + m);
    } else {
      setMemoDisplay('Memo: ');
      restartTimer();
    }
  }

  // Update memo display when execution mode is active and dependencies change
  useEffect(() => {
    if (executionMode && order) {
      const m = getMemo(random, order, simultype, letterMap, checkedPairs, umoveLeft, dmoveLeft);
      setMemoDisplay('Memo: ' + m);
    }
  }, [executionMode, random, order, simultype, letterMap, checkedPairs, umoveLeft, dmoveLeft]);

  // Keyboard shortcuts
  useEffect(() => {
    function onKeyDown(e) {
      const s = stateRef.current;
      if (e.key === ' ') {
        e.preventDefault();
        flip();
      } else if (e.key === 's' || e.key === 'S') {
        scramble();
      } else if (e.key === 'Backspace' && !s.executionMode) {
        deleteLetter();
      } else if (e.key === 'Enter' && !s.executionMode) {
        checkMemo();
      } else if (
        !s.executionMode &&
        e.key.length === 1 &&
        (
          (e.key >= 'a' && e.key <= 'l') ||
          (e.key >= 'A' && e.key <= 'L') ||
          (e.key >= '0' && e.key <= '9') ||
          e.key === 'o' || e.key === 'O'
        )
      ) {
        appendLetter(e.key.toUpperCase());
      }
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  // Stats handlers
  function handleExportStats() { exportStatsCsv(); }

  function handleDeleteLastStat() {
    const s = loadStats();
    if (!s || s.length === 0) { alert('No stat to delete.'); return; }
    const ok = confirm('Delete your most recent stat?');
    if (!ok) { alert('Deleting last stat aborted.'); return; }
    deleteLastStat();
    alert('Last stat deleted successfully.');
    setStats(computeInstantStats());
  }

  function handleClearStats() {
    const s = loadStats();
    if (!s || s.length === 0) { alert('No stats to clear.'); return; }
    const ok = prompt('Type "DELETE" to clear all stats.') === 'DELETE';
    if (!ok) { alert('Clearing stats aborted.'); return; }
    clearStats();
    setStats(computeInstantStats());
    alert('Stats cleared.');
  }

  function handlePracticeModeChange(checked) {
    setPracticeMode(checked);
    setPracticeModeState(checked);
  }

  function handleTimerChange(checked) {
    setTimerPref(checked);
    setTimerEnabled(checked);
    if (checked) { scramble(); }
    else { resetTimer(); }
  }

  function handleHourIndicatorsChange(checked) {
    setHideHourIndicators(checked);
    setHideHourIndicatorsState(checked);
  }

  function handleInputTypeChange(type) {
    setInputLetterType(type);
    setInputType(type);
  }

  function handleFlipTypeChange(newFlipType) {
    if (stateRef.current.side === 'black') flip();
    setFlipType(newFlipType);
    alert(`Flip type changed to ${newFlipType}!`);
  }

  function handleCheckedPairToggle(pairName, checked) {
    setCheckedPairs(prev => {
      const next = checked ? [...prev, pairName] : prev.filter(p => p !== pairName);
      if (executionMode && order) {
        const m = getMemo(random, order, simultype, letterMap, next, umoveLeft, dmoveLeft);
        setMemoDisplay('Memo: ' + m);
      }
      return next;
    });
  }

  const pinItems = pinOrderStr.split(' ');

  return (
    <>
      <h1 id="title"><u>7 Simul Memo Trainer</u></h1>

      <div id="underClock">
        <div>
          <h2 id="correctMemo" style={{ color: checkResult.color, marginBottom: 0 }}>
            {checkResult.text}
          </h2>
          <h2 id="memo" style={{ color: memoColor, marginTop: 0, marginBottom: 0 }}>
            {memoDisplay}
          </h2>

          {timerEnabled && !executionMode && !showInputButtons && (
            <h2 id="timer">{timerDisplay}</h2>
          )}

          <div id="timerholder">
            {timerEnabled && !executionMode && showInputButtons && (
              <h2 id="timer" style={{ display: 'block' }}>{timerDisplay}</h2>
            )}
          </div>

          <MemoInput
            letterMap={letterMap}
            memo={memo}
            onLetter={appendLetter}
            onCheck={checkMemo}
            onScramble={scramble}
            onDelete={deleteLetter}
            onCopyScramble={copyScramble}
            showButtons={showInputButtons}
            executionMode={executionMode}
            timer={timerDisplay}
            timerEnabled={timerEnabled}
          />

          <h2 id="scramble" style={{ cursor: 'pointer' }} onClick={copyScramble}>
            <span id="scramblebox">
              {scrambletext || 'Press S or click 🔀 to scramble'}
            </span>
          </h2>

          <label htmlFor="simultype">7 Simul Type: </label>
          <select
            id="simultype"
            value={simultype}
            onChange={e => changeSimultype(e.target.value)}
          >
            <option value="BPaul">BPaul</option>
            <option value="Tommy">Tommy</option>
            <option value="Custom">Custom</option>
          </select>
        </div>

        <div id="customPin" style={{ display: showCustomPin ? 'block' : 'none' }}>
          Pin order: <span id="pinOrder">{pinOrderStr}</span>{' '}
          <button onClick={handleChangePinOrder}>Change</button>
          <div id="udselect">
            {pinItems.includes('U') && (
              <span>
                execute the U move with your:{' '}
                <select value={umoveLeft ? 'left' : 'right'} onChange={e => setUmoveLeft(e.target.value === 'left')}>
                  <option value="left">left hand</option>
                  <option value="right">right hand</option>
                </select>{' '}
              </span>
            )}
            {pinItems.includes('D') && (
              <span>
                execute the D move with your:{' '}
                <select value={dmoveLeft ? 'left' : 'right'} onChange={e => setDmoveLeft(e.target.value === 'left')}>
                  <option value="left">left hand</option>
                  <option value="right">right hand</option>
                </select>
              </span>
            )}
          </div>
          <div id="pairs">
            Select which moves to memo:{' '}
            {pinItems.map(item => (
              <span key={item}>
                <input
                  type="checkbox"
                  id={`pair-${item}`}
                  checked={checkedPairs.includes(item)}
                  onChange={e => handleCheckedPairToggle(item, e.target.checked)}
                />
                <label htmlFor={`pair-${item}`}>{item}</label>{' '}
              </span>
            ))}
          </div>
        </div>

        <br />
        <button onClick={enterScramble}>Enter Scramble</button>
        <br /><br />

        <div>
          <label htmlFor="inputButtons">Enable/disable input buttons: </label>
          <input
            type="checkbox"
            id="inputButtons"
            checked={showInputButtons}
            onChange={e => setShowInputButtons(e.target.checked)}
          />
        </div>

        <br /><br />

        {!executionMode && (
          <Stats stats={stats} practiceMode={practiceMode} />
        )}

        <br />

        <p id="info">
          <b>Info:</b><br />
          <span id="bigText">
            To use, enter your memo as if you were to start execution with the white dials facing you.
            This means that if you are using the order shown in Tommy and Caleb's videos, you must do an x2
            and start memo on the black dials. You can enter your own scramble by pressing the button.
            Memo is default to 1-12 as A-L.
          </span><br />
          <b>Controls:</b><br />
          <b>Space</b> or click on clock: flip clock<br />
          <b>Enter</b> or click ✓: check memo<br />
          <b>S</b> or click 🔀: scramble<br />
          <b>Backspace</b> or click ⌫: delete memo<br />
          <b>Click on scramble</b> or click 📋: copy scramble to clipboard
        </p>

        <div className="settingsButtonContainer">
          <button onClick={() => setShowMoreSettings(v => !v)}>More Settings</button>
          {showMoreSettings && (
            <div id="hiddenSettings">
              <b>Memo Input Type:</b><br />
              <input type="radio" id="letters" name="memoType" value="letters"
                checked={inputType === 'letters'} onChange={() => handleInputTypeChange('letters')} />
              <label htmlFor="letters">Letters (A-L for 1-12)</label>
              <input type="radio" id="ryan" name="memoType" value="ryan"
                checked={inputType === 'ryan'} onChange={() => handleInputTypeChange('ryan')} />
              <label htmlFor="ryan">Ryan's method (0-6 and A-E for 12-7 (A is -1))</label>
              <input type="radio" id="tommy" name="memoType" value="tommy"
                checked={inputType === 'tommy'} onChange={() => handleInputTypeChange('tommy')} />
              <label htmlFor="tommy">Tommy (1-6 is A-F and -5 to -1 is G-K, 0 is O)</label>
              <br />
              <input type="checkbox" id="executionTrainer" checked={executionMode}
                onChange={e => toggleExecutionMode(e.target.checked)} />
              <label htmlFor="executionTrainer">
                <b>Execution trainer mode:</b> when checked, the memo will be automatically given so you can practice execution.
              </label>
              <br />
              {!executionMode && (
                <span className="timerButtonGroup">
                  <input type="checkbox" id="timerButton" checked={timerEnabled}
                    onChange={e => handleTimerChange(e.target.checked)} />
                  <label htmlFor="timerButton"><b>Timer:</b> when checked, your memo will be timed.</label>
                  <br />
                </span>
              )}
              <input type="checkbox" id="hourIndicators" checked={hideHourIndicatorsState}
                onChange={e => handleHourIndicatorsChange(e.target.checked)} />
              <label htmlFor="hourIndicators">
                <b>Hide Hour Indicators:</b> when checked, the hour indicators will be hidden.
              </label>
              <br />
              <label htmlFor="flipType"><b>Flip Type: </b></label>
              <select id="flipType" value={flipType} onChange={e => handleFlipTypeChange(e.target.value)}>
                <option value="x2">x2</option>
                <option value="y2">y2</option>
              </select>
            </div>
          )}

          <br /><br />

          <button onClick={() => setShowStatSettings(v => !v)}>Stats Settings</button>
          {showStatSettings && (
            <div id="statHiddenSettings" style={{ display: 'block', marginTop: '10px' }}>
              <input type="checkbox" id="practiceMode" checked={practiceMode}
                onChange={e => handlePracticeModeChange(e.target.checked)} />
              <label htmlFor="practiceMode">
                <b>Practice Mode:</b> when checked, memo entered will not count towards stats.
              </label>
              <br />
              <button onClick={handleExportStats}>Export stats (CSV)</button>
              <button onClick={handleDeleteLastStat}>Delete last entry</button>
              <button onClick={handleClearStats}>Clear stats</button>
            </div>
          )}
        </div>

        <br /><br />
      </div>

      <Clock
        random={random}
        side={side}
        flipType={flipType}
        hideHourIndicators={hideHourIndicatorsState}
        onFlip={flip}
      />
    </>
  );
}
