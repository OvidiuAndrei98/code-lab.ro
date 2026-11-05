// Original condensed letterforms with dense stems, narrow counters and
// optically varied widths. Angular corners have a 2-unit radius; D and B keep
// their larger outer curves. Scroll compression acts on the parent wordmark.
const letters = [
  {
    letter: "C",
    width: 116,
    path: "M2 0H114Q116 0 116 2V104Q116 106 114 106H74Q72 106 72 104V46Q72 44 70 44H46Q44 44 44 46V274Q44 276 46 276H70Q72 276 72 274V216Q72 214 74 214H114Q116 214 116 216V318Q116 320 114 320H2Q0 320 0 318V2Q0 0 2 0Z",
  },
  {
    letter: "O",
    width: 116,
    path: "M2 0H114Q116 0 116 2V318Q116 320 114 320H2Q0 320 0 318V2Q0 0 2 0ZM46 44H70Q72 44 72 46V274Q72 276 70 276H46Q44 276 44 274V46Q44 44 46 44Z",
  },
  {
    letter: "D",
    width: 124,
    path: "M2 0H104C118 0 124 8 124 24V296C124 312 118 320 104 320H2Q0 320 0 318V2Q0 0 2 0ZM46 44H80Q82 44 82 46V274Q82 276 80 276H46Q44 276 44 274V46Q44 44 46 44Z",
  },
  {
    letter: "E",
    width: 104,
    path: "M2 0H102Q104 0 104 2V42Q104 44 102 44H46Q44 44 44 46V136Q44 138 46 138H86Q88 138 88 140V180Q88 182 86 182H46Q44 182 44 184V274Q44 276 46 276H102Q104 276 104 278V318Q104 320 102 320H2Q0 320 0 318V2Q0 0 2 0Z",
  },
  {
    letter: "L",
    width: 90,
    path: "M2 0H42Q44 0 44 2V274Q44 276 46 276H88Q90 276 90 278V318Q90 320 88 320H2Q0 320 0 318V2Q0 0 2 0Z",
  },
  {
    letter: "A",
    width: 124,
    path: "M2 0H122Q124 0 124 2V318Q124 320 122 320H82Q80 320 80 318V236Q80 234 78 234H46Q44 234 44 236V318Q44 320 42 320H2Q0 320 0 318V2Q0 0 2 0ZM46 44H78Q80 44 80 46V188Q80 190 78 190H46Q44 190 44 188V46Q44 44 46 44Z",
  },
  {
    letter: "B",
    width: 128,
    path: "M2 0H106Q124 0 124 18V122Q124 148 106 158Q128 168 128 196V302Q128 320 110 320H2Q0 320 0 318V2Q0 0 2 0ZM46 44H78Q80 44 80 46V132Q80 134 78 134H46Q44 134 44 132V46Q44 44 46 44ZM46 180H82Q84 180 84 182V274Q84 276 82 276H46Q44 276 44 274V182Q44 180 46 180Z",
  },
];

export function WordmarkLetters() {
  return letters.map(({ letter, width, path }) => (
    <span
      className="identity-letter"
      aria-hidden="true"
      key={letter}
      data-letter={letter}
      style={{ flex: width }}
    >
      <span className="identity-inertia">
        <span className="identity-stretch">
          <span className="identity-fill">
            <svg
              viewBox={`0 0 ${width} 320`}
              preserveAspectRatio="none"
              focusable="false"
              aria-hidden="true"
            >
              <path d={path} fill="currentColor" fillRule="evenodd" />
            </svg>
          </span>
        </span>
      </span>
    </span>
  ));
}

// A proportional signature using the same original paths, independent of the
// hero's per-letter animation and responsive stretch layers.
export function CodelabWordmark({ className }: { className?: string }) {
  let offset = 0;
  return (
    <svg
      className={className}
      viewBox="0 0 832 320"
      preserveAspectRatio="xMinYMax meet"
      focusable="false"
      aria-hidden="true"
      data-footer-mark
    >
      {letters.map(({ letter, width, path }) => {
        const x = offset;
        offset += width + 5;
        return (
          <path
            key={letter}
            transform={`translate(${x} 0)`}
            d={path}
            fill="currentColor"
            fillRule="evenodd"
          />
        );
      })}
    </svg>
  );
}
