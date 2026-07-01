import React, { useMemo, useRef, useState, useEffect } from 'react';

const POSITIONS = ['ul', 'u', 'ur', 'l', 'c', 'r', 'dl', 'd', 'dr'];
const HOUR_NAMES = ['one','two','three','four','five','six','seven','eight','nine','ten','eleven','twelve'];



function getDialRotation(arr, index, flipType, clockRotation, side) {
  const centerIndices = [1, 3, 4, 5, 7];
  const centerOrder    = [13, 12, 11, 10, 9];
  const centerOrderX2  = [9,  10, 11, 12, 13];

  // x2 applies +6 when upright (steps 0,2); y2 applies +6 when sideways (steps 1,3)
  const sideways = getFlipSteps(clockRotation) % 2 === 1;
  const apply6 = flipType === 'x2' ? !sideways : sideways;
  const offset = apply6 ? 6 : 0;

  // sideways on black side: swap display of indices 9↔13, 10↔12, 0↔8, 1↔5
  const sidewaysBlack = sideways && side === 'black';
  const idxSwap = sidewaysBlack ? { 9: 13, 13: 9, 10: 12, 12: 10, 0: 8, 8: 0, 1: 5, 5: 1, 2: 6, 6: 2 } : null;
  const read = (i) => arr[idxSwap?.[i] ?? i];

  const centerPos = centerIndices.indexOf(index);
  if (centerPos !== -1) {
    if (flipType === 'y2') return ((read(centerOrder[centerPos]) + offset) * 30) + 'deg';
    else return ((read(centerOrderX2[centerPos]) + offset) * 30) + 'deg';
  }

  if (flipType === 'y2') {
    const cornerMap   = { 0: 2, 2: 0, 6: 8, 8: 6 };
    return ((read(cornerMap[index]) + offset) * -30) + 'deg';
  } else {
    const cornerMapX2 = { 0: 6, 2: 8, 6: 0, 8: 2 };
    return ((read(cornerMapX2[index]) + offset) * -30) + 'deg';
  }
}

function getFlipSteps(clockRotation) {
  return (((Math.round(clockRotation / 90) % 4) + 4) % 4);
}

function getX2Indices(clockRotation) {
  const steps = getFlipSteps(clockRotation);
  const doubleIdx = [5, 11, 5, 11][steps];
  const singleIdx = [11, 5, 11, 5][steps];
  return { singleIdx, doubleIdx };
}

function getY2Indices(clockRotation) {
  const steps = getFlipSteps(clockRotation);
  const doubleIdx = [11, 5, 11, 5][steps];
  const singleIdx = [5, 11, 5, 11][steps];
  return { doubleIdx, singleIdx };
}

function getHourColor(hourIdx, side, flipType) {
  if (side === 'white') {
    return hourIdx === 11 ? 'red' : 'white';
  } else {
    return 'black';
  }
}

function shouldShowHour(hourIdx, side, flipType, hideHourIndicators, clockRotation) {
  if (hideHourIndicators) {
    if (side === 'white' && hourIdx === 11) return true;
    if (side === 'black') {
      if (flipType === 'x2') {
        const { singleIdx, doubleIdx } = getX2Indices(clockRotation);
        if (hourIdx === singleIdx || hourIdx === doubleIdx) return true;
      }
      if (flipType === 'y2') {
        const { singleIdx, doubleIdx } = getY2Indices(clockRotation);
        if (hourIdx === singleIdx || hourIdx === doubleIdx) return true;
      }
    }
    return false;
  }
  return true;
}

export default function Clock({ random, side, flipType, hideHourIndicators, onFlip, clockRotation = 0, flipRotation = 0, rotatedRandom }) {
  const displayRandom = random;
  const isFirstRenderRef = useRef(true);
  const prevRandomRef = useRef(random);
  const [whiteDials, setWhiteDials] = useState(() => random.slice(0, 9).map(v => v * 30));
  const [shouldAnimate, setShouldAnimate] = useState(false);

  // Single effect watching both random and side — animate only when random changes
  useEffect(() => {
    if (isFirstRenderRef.current) {
      isFirstRenderRef.current = false;
      prevRandomRef.current = random;
      return;
    }

    const randomChanged = random !== prevRandomRef.current;
    prevRandomRef.current = random;

    if (randomChanged) {
      setShouldAnimate(true);
      setWhiteDials(prev =>
        prev.map((current, i) => {
          const target = random[i] * 30;
          const currentMod = ((current % 360) + 360) % 360;
          const delta = ((target - currentMod) + 540) % 360 - 180;
          return current + delta;
        })
      );
    } else {
      setShouldAnimate(false);
    }
  }, [random, side]);

  const dialTransition = shouldAnimate && side === 'white'
    ? 'transform 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94)'
    : 'none';

  const dialRotations = useMemo(() => {
    const rots = POSITIONS.map((_, i) => {
      if (side === 'white') return whiteDials[i] + 'deg';
      return getDialRotation(displayRandom, i, flipType, flipRotation, side);
    });
    // if (side === 'black' && getFlipSteps(flipRotation) % 2 === 1) {
    //   [rots[0], rots[8]] = [rots[8], rots[0]];
    // }
    return rots;
  }, [whiteDials, displayRandom, side, flipType, flipRotation]);

  const circleColor = side === 'white' ? 'white' : 'black';
  const dialColor = side === 'white' ? 'black' : 'white';

  return (
    <div className="clock-body" onClick={onFlip} style={{ background: side === 'black' ? 'white' : '#2a2a2a' }}>
      <div id="clock">
        {POSITIONS.map((pos, i) => (
          <div key={`circle-${pos}`} className={`circle ${pos}`} style={{ backgroundColor: side === 'black' ? 'white' : '#1a1a1a', outline: side === 'black' ? '1px solid #bbb' : 'none' }}>
            <div className="circle-face" style={{ backgroundColor: circleColor }} />
          </div>
        ))}
        {POSITIONS.map((pos, i) => {
          const isCenterDial = [1, 3, 4, 5, 7].includes(i);
          return (
            <React.Fragment key={`dial-${pos}`}>
              <div
                className={`dial ${pos}${isCenterDial ? ' center' : ''}`}
                style={{ '--rot': dialRotations[i], backgroundColor: dialColor, transition: dialTransition }}
              />
              <div
                className={`dial-base ${pos}`}
                style={{ backgroundColor: dialColor }}
              />
            </React.Fragment>
          );
        })}
        {POSITIONS.map((pos) =>
          HOUR_NAMES.map((hour, hi) => {
            const isX2Black = side === 'black' && flipType === 'x2';
            const isY2Black = side === 'black' && flipType === 'y2';
            const hourRotation = side === 'black' ? flipRotation : clockRotation;
            const x2 = getX2Indices(hourRotation);
            const y2 = getY2Indices(hourRotation);
            const extraClass = (isX2Black && hi === x2.singleIdx) || (isY2Black && hi === y2.singleIdx) ? ' single-marker'
                             : (isX2Black && hi === x2.doubleIdx) || (isY2Black && hi === y2.doubleIdx) ? ' double-marker'
                             : '';
            return (
              <div
                key={`${hour}-${pos}`}
                className={`${hour} ${pos}${extraClass}`}
                style={{
                  backgroundColor: getHourColor(hi, side, flipType),
                  display: shouldShowHour(hi, side, flipType, hideHourIndicators, hourRotation) ? 'block' : 'none',
                }}
              />
            );
          })
        )}
        <div className="pin-dot pin-ul" style={{ backgroundColor: side === 'black' ? 'black' : 'white' }} />
        <div className="pin-dot pin-ur" style={{ backgroundColor: side === 'black' ? 'black' : 'white' }} />
        <div className="pin-dot pin-dl" style={{ backgroundColor: side === 'black' ? 'black' : 'white' }} />
        <div className="pin-dot pin-dr" style={{ backgroundColor: side === 'black' ? 'black' : 'white' }} />
      </div>
    </div>
  );
}
