import { useEffect, useMemo, useRef, useState } from 'react';
import type { Catalogue, OrchestraId, Session } from '../game/types';
import { ORCHESTRAS } from '../game/catalogue/orchestras';
import { loadCatalogue } from '../game/catalogue/catalogue';
import { createSession, reduceSession } from '../game/engine/session';
import { StartScreen } from '../ui/screens/StartScreen';
import { ServiceUnavailable } from '../ui/screens/ServiceUnavailable';
import { RoundScreen } from '../ui/screens/RoundScreen';
import { RoundSummary } from '../ui/screens/RoundSummary';
import { SessionSummary } from '../ui/screens/SessionSummary';
import { PrivacyNotice } from '../ui/screens/PrivacyNotice';
import { initialiseErrorReporting } from '../telemetry/errors';
import { track } from '../telemetry/analytics';
import { createAudioPlayer, type AudioPlayer } from '../game/audio/player';
import {
  createFeedbackSoundPlayer,
  type FeedbackSoundPlayer
} from '../game/audio/feedback-sound-player';
import {
  createCountdownSoundPlayer,
  type CountdownSoundPlayer
} from '../game/audio/countdown-sound-player';
import { CountdownScreen } from '../ui/screens/CountdownScreen';
import '../styles/index.css';

type CountdownValue = 5 | 4 | 3 | 2 | 1;

export function App({
  countdownStepMs = 1000,
  countdownEndPauseMs = 1000
}: {
  countdownStepMs?: number;
  countdownEndPauseMs?: number;
} = {}) {
  const [catalogue, setCatalogue] = useState<Catalogue>();
  const [session, setSession] = useState<Session>();
  const [error, setError] = useState(false);
  const [privacy, setPrivacy] = useState(false);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [awaitingContinue, setAwaitingContinue] = useState(false);
  const [showSessionSummary, setShowSessionSummary] = useState(false);
  const [countdown, setCountdown] = useState<{ id: number; value: CountdownValue }>();
  const audio = useRef<AudioPlayer | undefined>(undefined);
  const feedbackAudio = useRef<FeedbackSoundPlayer | undefined>(undefined);
  const countdownAudio = useRef<CountdownSoundPlayer | undefined>(undefined);
  const preparationId = useRef(0);
  const preparedTrack = useRef<{ id: number; result: Promise<boolean> }>();

  useEffect(() => {
    initialiseErrorReporting();
    const started = performance.now();
    loadCatalogue().then((value) => {
      setCatalogue(value);
      track({ name: 'app_loaded', properties: { msToInteractive: Math.round(performance.now() - started) } });
    }).catch(() => setError(true));
  }, []);

  useEffect(() => {
    audio.current ??= createAudioPlayer();
    const cleanupEnded = audio.current.onEnded(() => {
      if (session) setSession(reduceSession(session, { type: 'TRACK_ENDED' }));
    });
    return cleanupEnded;
  }, [session]);

  useEffect(() => {
    const currentRoundStatus = session?.rounds[session.currentRoundIndex]?.status;
    if (currentRoundStatus !== 'active' || countdown) {
      setElapsedMs(0);
      return;
    }
    const interval = window.setInterval(() => {
      setElapsedMs(audio.current?.getElapsedMs() ?? 0);
    }, 100);
    return () => window.clearInterval(interval);
  }, [session, countdown]);

  useEffect(() => {
    if (!countdown) return;
    countdownAudio.current ??= createCountdownSoundPlayer();
    void countdownAudio.current.playPip().catch(() => undefined);

    let transitionTimeout: number | undefined;
    const timeout = window.setTimeout(() => {
      if (preparationId.current !== countdown.id) return;
      if (countdown.value > 1) {
        setCountdown({ id: countdown.id, value: (countdown.value - 1) as CountdownValue });
        return;
      }

      void countdownAudio.current?.playFinalPip().catch(() => undefined);
      transitionTimeout = window.setTimeout(() => {
        if (preparationId.current !== countdown.id) return;
        setCountdown(undefined);
        const preparation = preparedTrack.current;
        if (!preparation || preparation.id !== countdown.id) return;
        void preparation.result.then((ready) => {
          if (preparationId.current !== countdown.id) return;
          if (!ready) {
            setError(true);
            return;
          }
          return audio.current?.playPrepared().catch(() => {
            if (preparationId.current === countdown.id) setError(true);
          });
        });
      }, countdownEndPauseMs);
    }, countdownStepMs);

    return () => {
      window.clearTimeout(timeout);
      if (transitionTimeout !== undefined) window.clearTimeout(transitionTimeout);
    };
  }, [countdown, countdownEndPauseMs, countdownStepMs]);

  useEffect(() => () => {
    preparationId.current += 1;
  }, []);

  const currentRound = session?.rounds[session.currentRoundIndex];
  const tracks = useMemo(() => catalogue?.tracks ?? [], [catalogue]);
  if (privacy) return <PrivacyNotice onBack={() => setPrivacy(false)} />;
  if (error) return <ServiceUnavailable onRetry={() => window.location.reload()} />;
  if (!catalogue) return <main aria-busy="true"><p>Loading music…</p></main>;
  const beginRoundPreparation = (nextSession: Session) => {
    const round = nextSession.rounds[nextSession.currentRoundIndex];
    const firstTrack = catalogue.tracks.find((item) => item.id === round.trackIds[0]);
    if (!firstTrack) {
      setError(true);
      return;
    }
    audio.current ??= createAudioPlayer();
    const id = preparationId.current + 1;
    preparationId.current = id;
    preparedTrack.current = {
      id,
      result: audio.current.prepare(firstTrack.previewUrl).then(() => true, () => false)
    };
    setSession(nextSession);
    setCountdown({ id, value: 5 });
  };
  const startSession = () => {
    const next = createSession(catalogue);
    setAwaitingContinue(false);
    setShowSessionSummary(false);
    beginRoundPreparation(next);
  };
  if (!session) return <StartScreen onStart={startSession} onPrivacy={() => setPrivacy(true)} />;
  if (session.status === 'complete' && showSessionSummary) {
    return <SessionSummary session={session} onReplay={startSession} />;
  }
  if (countdown) {
    return <CountdownScreen
      roundNumber={(session.currentRoundIndex + 1) as 1 | 2 | 3}
      value={countdown.value}
    />;
  }
  if (currentRound?.status !== 'active') {
    const orchestra = ORCHESTRAS.find((item) => item.id === currentRound?.correctOrchestraId) ?? ORCHESTRAS[0];
    return <RoundSummary round={currentRound!} orchestra={orchestra} isLastRound={session.currentRoundIndex === 2} onContinue={() => {
      setAwaitingContinue(false);
      if (session.currentRoundIndex === 2) {
        setShowSessionSummary(true);
        return;
      }
      const next = { ...session, currentRoundIndex: (session.currentRoundIndex + 1) as 0 | 1 | 2 };
      beginRoundPreparation(next);
    }} />;
  }
  const dispatchGuess = (orchestraId: OrchestraId) => {
    const isCorrect = orchestraId === currentRound?.correctOrchestraId;
    audio.current?.stop();
    feedbackAudio.current ??= createFeedbackSoundPlayer();
    const playFeedback = () => isCorrect
      ? feedbackAudio.current!.playCorrect()
      : feedbackAudio.current!.playIncorrect();
    void Promise.resolve().then(playFeedback).catch(() => undefined);
    const next = reduceSession(session, isCorrect
      ? { type: 'GUESS_CORRECT', orchestraId, elapsedMs }
      : { type: 'GUESS_WRONG', orchestraId });
    setSession(next);
    if (isCorrect) {
      playPendingTrack(next);
    } else {
      // Pause here: wait for the player to acknowledge the wrong guess and
      // explicitly choose to continue, rather than auto-advancing the audio.
      setAwaitingContinue(true);
    }
  };
  const dispatchSkip = () => {
    audio.current?.stop();
    const next = reduceSession(session, { type: 'SKIP' });
    setSession(next);
    playPendingTrack(next);
  };
  const continueAfterWrongGuess = () => {
    setAwaitingContinue(false);
    const hasPending = currentRound?.attempts.some((attempt) => attempt.outcome === 'pending');
    if (hasPending) {
      playPendingTrack(session);
    } else {
      dispatchSkip();
    }
  };
  function playPendingTrack(next: Session) {
    const pending = next.rounds[next.currentRoundIndex]?.attempts.find((attempt) => attempt.outcome === 'pending');
    const nextTrack = catalogue!.tracks.find((track) => track.id === pending?.trackId);
    if (nextTrack && next.rounds[next.currentRoundIndex].status === 'active') void audio.current?.play(nextTrack.previewUrl).catch(() => setError(true));
  }
  return <RoundScreen
    round={currentRound!}
    tracks={tracks}
    orchestras={ORCHESTRAS}
    elapsedMs={elapsedMs}
    awaitingContinue={awaitingContinue}
    onGuess={dispatchGuess}
    onSkip={dispatchSkip}
    onContinue={continueAfterWrongGuess}
  />;
}
