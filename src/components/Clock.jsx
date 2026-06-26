import React, { useMemo } from 'react';

const POSITIONS = ['ul', 'u', 'ur', 'l', 'c', 'r', 'dl', 'd', 'dr'];
// Mapping from dial index to position class
// white side: dials 0-8 → ul,u,ur,l,c,r,dl,d,dr
// center dials (u,l,c,r,d) have "center" class: indices 1,3,4,5,7

// Hour indicator names (classes used in CSS)
const HOUR_NAMES = ['one','two','three','four','five','six','seven','eight','nine','ten','eleven','twelve'];

function getDialRotation(random, index, side, flipType) {
  if (side === 'white') {
    return (random[index] * 30) + 'deg';
  }
  // black side
  const centerIndices = [1, 3, 4, 5, 7]; // u,l,c,r,d → center dials
  const centerOrder = [13, 12, 11, 10, 9]; // y2 reverse mapping for centers
  const centerOrderX2 = [9, 10, 11, 12, 13]; // x2 mapping (+6)

  // For center dials
  const centerPos = centerIndices.indexOf(index);
  if (centerPos !== -1) {
    if (flipType === 'y2') {
      return (random[centerOrder[centerPos]] * 30) + 'deg';
    } else {
      return ((random[centerOrderX2[centerPos]] + 6) * 30) + 'deg';
    }
  }

  // Corner dials: ul=0, ur=2, dl=6, dr=8
  if (flipType === 'y2') {
    const cornerMap = { 0: 2, 2: 0, 6: 8, 8: 6 };
    return (random[cornerMap[index]] * -30) + 'deg';
  } else {
    // x2: ul↔ur swap with +6 offset, dl↔dr swap with +6 offset
    const cornerMapX2 = { 0: 6, 2: 8, 6: 0, 8: 2 };
    return ((random[cornerMapX2[index]] + 6) * -30) + 'deg';
  }
}

function getHourColor(hourIdx, side, flipType) {
  // hourIdx: 0=one .. 11=twelve
  if (side === 'white') {
    return hourIdx === 11 ? 'red' : 'white'; // twelve=red, rest=white
  } else {
    if (flipType === 'x2') {
      // six (index 5) is red, rest black
      return hourIdx === 5 ? 'red' : 'black';
    } else {
      // y2: twelve (index 11) is red, rest black
      return hourIdx === 11 ? 'red' : 'black';
    }
  }
}

function shouldShowHour(hourIdx, side, flipType, hideHourIndicators) {
  if (hideHourIndicators) {
    // Always show the reference marker (twelve on white, relevant on black)
    if (side === 'white' && hourIdx === 11) return true;
    if (side === 'black') {
      if (flipType === 'x2' && hourIdx === 5) return true;
      if (flipType === 'y2' && hourIdx === 11) return true;
    }
    return false;
  }
  return true;
}

export default function Clock({ random, side, flipType, hideHourIndicators, onFlip }) {
  const dialRotations = useMemo(() => {
    return POSITIONS.map((_, i) => getDialRotation(random, i, side, flipType));
  }, [random, side, flipType]);

  const circleColor = side === 'white' ? 'white' : 'black';
  const dialColor = side === 'white' ? 'black' : 'white';

  return (
    <div id="clock" onClick={onFlip} style={{ cursor: 'pointer' }}>
      {POSITIONS.map((pos, i) => (
        <div key={`circle-${pos}`} className={`circle ${pos}`} style={{ backgroundColor: circleColor }} />
      ))}
      {POSITIONS.map((pos, i) => {
        const isCenterDial = [1, 3, 4, 5, 7].includes(i);
        return (
          <div
            key={`dial-${pos}`}
            className={`dial ${pos}${isCenterDial ? ' center' : ''}`}
            style={{ '--rot': dialRotations[i], backgroundColor: dialColor }}
          />
        );
      })}
      {POSITIONS.map((pos) =>
        HOUR_NAMES.map((hour, hi) => (
          <div
            key={`${hour}-${pos}`}
            className={`${hour} ${pos}`}
            style={{
              backgroundColor: getHourColor(hi, side, flipType),
              display: shouldShowHour(hi, side, flipType, hideHourIndicators) ? 'block' : 'none',
            }}
          />
        ))
      )}
    </div>
  );
}
