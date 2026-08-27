import React, { useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  Activity,
  BookOpenCheck,
  Brain,
  ChevronUp,
  CircleDollarSign,
  Clipboard,
  Download,
  Dumbbell,
  Moon,
  Plus,
  RotateCcw,
  Sparkles,
  Sun,
  Upload,
  WalletCards,
} from 'lucide-react';
import defaultProfile from './data/personal-command-center.json';
import './styles.css';

const STORAGE_KEY = 'personal-command-center:v1';

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function currency(value) {
  return new Intl.NumberFormat('it-IT', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(value);
}

function percent(value, total) {
  if (!total) return 0;
  return clamp(Math.round((value / total) * 100), 0, 100);
}

function useProfileState() {
  const [profile, setProfile] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : defaultProfile;
    } catch {
      return defaultProfile;
    }
  });

  const updateProfile = (recipe) => {
    setProfile((current) => {
      const next = typeof recipe === 'function' ? recipe(current) : recipe;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next, null, 2));
      return next;
    });
  };

  const resetProfile = () => updateProfile(defaultProfile);

  return [profile, updateProfile, resetProfile];
}

function App() {
  const [profile, setProfile, resetProfile] = useProfileState();
  const [theme, setTheme] = useState('light');
  const [newNote, setNewNote] = useState('');
  const [studyTopic, setStudyTopic] = useState('');
  const [questions, setQuestions] = useState(20);
  const [correct, setCorrect] = useState(15);

  const insights = useMemo(() => buildAssistantBrief(profile), [profile]);
  const quizAccuracy = useMemo(() => {
    const totals = profile.study.sessions.reduce(
      (acc, session) => ({
        questions: acc.questions + session.questions,
        correct: acc.correct + session.correct,
      }),
      { questions: 0, correct: 0 },
    );
    return percent(totals.correct, totals.questions);
  }, [profile.study.sessions]);

  // Manteniamo un export JSON semplice: e' il formato piu facile da leggere e aggiornare per un assistente AI.
  const exportData = () => {
    const blob = new Blob([JSON.stringify(profile, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'personal-command-center-export.json';
    link.click();
    URL.revokeObjectURL(url);
  };

  const importData = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    setProfile(JSON.parse(text));
    event.target.value = '';
  };

  const copyContext = async () => {
    await navigator.clipboard.writeText(JSON.stringify(insights, null, 2));
  };

  const addQuizSession = () => {
    const safeQuestions = Math.max(Number(questions), 1);
    const safeCorrect = clamp(Number(correct), 0, safeQuestions);
    setProfile((current) => ({
      ...current,
      study: {
        ...current.study,
        quizDoneThisWeek: current.study.quizDoneThisWeek + safeQuestions,
        sessions: [
          {
            date: new Date().toISOString().slice(0, 10),
            topic: studyTopic || 'Sessione rapida',
            questions: safeQuestions,
            correct: safeCorrect,
          },
          ...current.study.sessions,
        ],
      },
    }));
    setStudyTopic('');
  };

  const addKnowledgeNote = () => {
    const text = newNote.trim();
    if (!text) return;
    setProfile((current) => ({
      ...current,
      knowledge: {
        ...current.knowledge,
        pinnedNotes: [
          { title: 'Nota rapida', body: text },
          ...current.knowledge.pinnedNotes,
        ],
      },
    }));
    setNewNote('');
  };

  return (
    <main className={`app-shell ${theme}`}>
      <div className="ambient ambient-one" />
      <div className="ambient ambient-two" />
      <div className="topbar">
        <div>
          <p className="eyebrow">Personal Command Center</p>
          <h1>{profile.profile.name}, oggi governiamo il sistema.</h1>
          <p className="subtitle">{profile.profile.context}</p>
        </div>
        <div className="top-actions" aria-label="Azioni dashboard">
          <IconButton
            label={theme === 'light' ? 'Attiva dark mode' : 'Attiva light mode'}
            onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
            icon={theme === 'light' ? Moon : Sun}
          />
          <IconButton label="Copia context pack per Codex" onClick={copyContext} icon={Clipboard} />
          <IconButton label="Esporta dati JSON" onClick={exportData} icon={Download} />
          <label className="icon-button" title="Importa dati JSON">
            <Upload size={18} />
            <input type="file" accept="application/json" onChange={importData} />
          </label>
          <IconButton label="Ripristina dati demo" onClick={resetProfile} icon={RotateCcw} />
        </div>
      </div>

      <section className="metric-grid" aria-label="Metriche principali">
        <MetricCard icon={Dumbbell} label="Palestra" value={`${profile.health.workoutsDone}/${profile.health.weeklyWorkoutTarget}`} detail="allenamenti settimanali" />
        <MetricCard icon={Activity} label="Calorie" value={`${profile.health.todayCalories}/${profile.health.dailyCaloriesTarget}`} detail="kcal oggi" />
        <MetricCard icon={CircleDollarSign} label="Risparmio" value={currency(profile.finance.savedThisYear)} detail={`${percent(profile.finance.savedThisYear, profile.finance.annualSavingGoal)}% obiettivo annuo`} />
        <MetricCard icon={BookOpenCheck} label="Quiz" value={`${quizAccuracy}%`} detail={`${profile.study.quizDoneThisWeek}/${profile.study.weeklyQuizTarget} domande`} />
      </section>

      <section className="dashboard-grid">
        <Panel icon={Dumbbell} title="Energia e corpo" accent="blue">
          <Progress label="Deficit kcal" value={profile.health.todayCalories} total={profile.health.dailyCaloriesTarget} />
          <Progress label="Allenamenti" value={profile.health.workoutsDone} total={profile.health.weeklyWorkoutTarget} />
          <div className="control-row">
            <Stepper
              label="Kcal oggi"
              value={profile.health.todayCalories}
              step={100}
              onChange={(value) =>
                setProfile((current) => ({
                  ...current,
                  health: { ...current.health, todayCalories: Math.max(value, 0) },
                }))
              }
            />
            <Stepper
              label="Pausa sedia"
              value={profile.health.sedentaryBreaksToday}
              step={1}
              onChange={(value) =>
                setProfile((current) => ({
                  ...current,
                  health: { ...current.health, sedentaryBreaksToday: Math.max(value, 0) },
                }))
              }
            />
          </div>
          <ActionList items={profile.health.nextActions} />
        </Panel>

        <Panel icon={WalletCards} title="Finanze personali" accent="green">
          <Progress label="Obiettivo annuo" value={profile.finance.savedThisYear} total={profile.finance.annualSavingGoal} format={currency} />
          <Progress label="Target mese" value={profile.finance.monthlySaved} total={profile.finance.monthlySavingTarget} format={currency} />
          <Stepper
            label="Risparmi mese"
            value={profile.finance.monthlySaved}
            step={50}
            onChange={(value) =>
              setProfile((current) => ({
                ...current,
                finance: { ...current.finance, monthlySaved: Math.max(value, 0) },
              }))
            }
          />
          <div className="compact-list">
            {profile.finance.watchList.map((item) => (
              <div className="list-line" key={item.label}>
                <span>{item.label}</span>
                <strong>{currency(item.amount)}</strong>
              </div>
            ))}
          </div>
        </Panel>

        <Panel icon={BookOpenCheck} title="Studio concorsi" accent="violet">
          <Progress label="Quiz settimana" value={profile.study.quizDoneThisWeek} total={profile.study.weeklyQuizTarget} />
          <div className="form-grid">
            <input value={studyTopic} onChange={(event) => setStudyTopic(event.target.value)} placeholder="Materia" />
            <input type="number" min="1" value={questions} onChange={(event) => setQuestions(event.target.value)} aria-label="Domande" />
            <input type="number" min="0" value={correct} onChange={(event) => setCorrect(event.target.value)} aria-label="Corrette" />
            <button className="primary-button" onClick={addQuizSession}>
              <Plus size={16} />
              Aggiungi
            </button>
          </div>
          <div className="session-list">
            {profile.study.sessions.slice(0, 4).map((session) => (
              <div className="session" key={`${session.date}-${session.topic}`}>
                <span>{session.topic}</span>
                <strong>{percent(session.correct, session.questions)}%</strong>
              </div>
            ))}
          </div>
        </Panel>

        <Panel icon={Brain} title="Knowledge hub" accent="orange">
          <div className="tag-cloud">
            {profile.knowledge.notionAreas.map((area) => (
              <span key={area}>{area}</span>
            ))}
          </div>
          <textarea
            value={newNote}
            onChange={(event) => setNewNote(event.target.value)}
            placeholder="Aggiungi una nota che Codex dovrebbe ricordare in questa sessione..."
          />
          <button className="primary-button wide" onClick={addKnowledgeNote}>
            <Plus size={16} />
            Salva nota
          </button>
          <div className="note-stack">
            {profile.knowledge.pinnedNotes.slice(0, 3).map((note) => (
              <article className="note" key={`${note.title}-${note.body}`}>
                <strong>{note.title}</strong>
                <p>{note.body}</p>
              </article>
            ))}
          </div>
        </Panel>

        <section className="assistant-panel">
          <div className="assistant-copy">
            <Sparkles size={22} />
            <div>
              <p className="eyebrow">AI bridge</p>
              <h2>Context pack pronto per me</h2>
              <p>
                Questo blocco e' il ponte operativo: puoi esportarlo o farmelo leggere per avere risposte
                tarate su energia, soldi, studio e priorita reali.
              </p>
            </div>
          </div>
          <pre>{JSON.stringify(insights, null, 2)}</pre>
        </section>
      </section>
    </main>
  );
}

function buildAssistantBrief(profile) {
  // Questo pacchetto condensa lo stato personale in segnali pratici per risposte piu contestuali.
  return {
    generatedAt: new Date().toISOString(),
    user: profile.profile,
    currentSignals: {
      calorieBudgetRemaining: profile.health.dailyCaloriesTarget - profile.health.todayCalories,
      workoutsRemainingThisWeek: Math.max(profile.health.weeklyWorkoutTarget - profile.health.workoutsDone, 0),
      annualSavingsProgress: `${percent(profile.finance.savedThisYear, profile.finance.annualSavingGoal)}%`,
      weeklyQuizProgress: `${percent(profile.study.quizDoneThisWeek, profile.study.weeklyQuizTarget)}%`,
    },
    guidanceForCodex: [
      'Preferisci azioni piccole, concrete e sostenibili.',
      'Considera il tempo seduto e suggerisci pause o automazioni leggere quando serve.',
      'Quando proponi piani, bilancia energia fisica, deficit calorico, budget e studio.',
      profile.knowledge.assistantBrief,
    ],
    recentStudy: profile.study.sessions.slice(0, 3),
    pinnedKnowledge: profile.knowledge.pinnedNotes,
  };
}

function IconButton({ icon: Icon, label, onClick }) {
  return (
    <button className="icon-button" title={label} aria-label={label} onClick={onClick}>
      <Icon size={18} />
    </button>
  );
}

function MetricCard({ icon: Icon, label, value, detail }) {
  return (
    <article className="metric-card">
      <Icon size={20} />
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{detail}</small>
    </article>
  );
}

function Panel({ icon: Icon, title, accent, children }) {
  return (
    <section className={`panel ${accent}`}>
      <header className="panel-title">
        <Icon size={20} />
        <h2>{title}</h2>
      </header>
      {children}
    </section>
  );
}

function Progress({ label, value, total, format = (item) => item }) {
  const width = percent(value, total);
  return (
    <div className="progress-block">
      <div className="progress-copy">
        <span>{label}</span>
        <strong>{format(value)} / {format(total)}</strong>
      </div>
      <div className="progress-track">
        <div style={{ width: `${width}%` }} />
      </div>
    </div>
  );
}

function Stepper({ label, value, step, onChange }) {
  return (
    <div className="stepper">
      <span>{label}</span>
      <div>
        <button aria-label={`Diminuisci ${label}`} onClick={() => onChange(Number(value) - step)}>
          <ChevronUp size={16} className="down" />
        </button>
        <strong>{value}</strong>
        <button aria-label={`Aumenta ${label}`} onClick={() => onChange(Number(value) + step)}>
          <ChevronUp size={16} />
        </button>
      </div>
    </div>
  );
}

function ActionList({ items }) {
  return (
    <ul className="action-list">
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  );
}

createRoot(document.getElementById('root')).render(<App />);
