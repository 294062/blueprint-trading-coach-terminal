import { MarkovRegimeData, MarkovState, TimeframeAnalysis } from '../types/trading';

const STATES: MarkovState[] = [
  'Bullish Regime',
  'Neutral Tight',
  'Bearish Regime',
  'Volatile Wide',
];

/**
 * Calculates current market regime and Markov transition matrix probabilities (Lesson 11)
 */
export function calculateMarkovRegime(
  analyses: Record<string, TimeframeAnalysis>,
  volatilityRatio: number
): MarkovRegimeData {
  const d1 = analyses['D1'];
  const h4 = analyses['H4'];
  const h1 = analyses['H1'];

  // Determine current regime state based on multi-timeframe conditions
  let currentState: MarkovState = 'Neutral Tight';
  let stateIndex = 1;

  if (volatilityRatio > 1.8) {
    currentState = 'Volatile Wide';
    stateIndex = 3;
  } else if (d1?.bias === 'BULLISH' && h4?.bias === 'BULLISH' && h1?.bias === 'BULLISH') {
    currentState = 'Bullish Regime';
    stateIndex = 0;
  } else if (d1?.bias === 'BEARISH' && h4?.bias === 'BEARISH' && h1?.bias === 'BEARISH') {
    currentState = 'Bearish Regime';
    stateIndex = 2;
  } else {
    currentState = 'Neutral Tight';
    stateIndex = 1;
  }

  // Pre-calibrated empirical transition matrices (Lesson 11.3)
  // Reflecting probabilities of transitioning between states
  const transitionMatrix: MarkovRegimeData['transitionMatrix'] = [
    {
      from: 'Bullish Regime',
      to: {
        'Bullish Regime': 0.68,
        'Neutral Tight': 0.18,
        'Bearish Regime': 0.05,
        'Volatile Wide': 0.09,
      },
    },
    {
      from: 'Neutral Tight',
      to: {
        'Bullish Regime': 0.42,
        'Neutral Tight': 0.15,
        'Bearish Regime': 0.38,
        'Volatile Wide': 0.05,
      },
    },
    {
      from: 'Bearish Regime',
      to: {
        'Bullish Regime': 0.06,
        'Neutral Tight': 0.20,
        'Bearish Regime': 0.65,
        'Volatile Wide': 0.09,
      },
    },
    {
      from: 'Volatile Wide',
      to: {
        'Bullish Regime': 0.25,
        'Neutral Tight': 0.40,
        'Bearish Regime': 0.25,
        'Volatile Wide': 0.10,
      },
    },
  ];

  // Dynamic Position Sizing Multiplier (Lesson 11.3: "sizing up right before a major expansion wave begins")
  let positionSizingMultiplier = 1.0;
  let recommendedAction = '';

  switch (currentState) {
    case 'Bullish Regime':
      positionSizingMultiplier = 1.15;
      recommendedAction = 'Institutional Trend Expansion: Standard to +15% position size on EMA 2/5 pullback entries.';
      break;
    case 'Bearish Regime':
      positionSizingMultiplier = 1.15;
      recommendedAction = 'Institutional Liquidation Wave: Standard to +15% position size on EMA 2/5 pullback shorts.';
      break;
    case 'Neutral Tight':
      positionSizingMultiplier = 0.5;
      recommendedAction = 'High Breakout Probability (80%): Stand aside or scale down to 0.5x size until breakout candle closes.';
      break;
    case 'Volatile Wide':
      positionSizingMultiplier = 0.25;
      recommendedAction = 'Whipsaw Risk Elevated: Capital preservation protocol active. Maximum 0.25x size or wait for volatility contraction.';
      break;
  }

  return {
    currentState,
    stateIndex,
    confidence: currentState === 'Bullish Regime' || currentState === 'Bearish Regime' ? 0.84 : 0.62,
    transitionMatrix,
    positionSizingMultiplier,
    recommendedAction,
  };
}
